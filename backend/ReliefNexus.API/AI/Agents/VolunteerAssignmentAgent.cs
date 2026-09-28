using Microsoft.EntityFrameworkCore;
using ReliefNexus.API.Data;
using ReliefNexus.API.DTOs;
using ReliefNexus.API.Models;

namespace ReliefNexus.API.AI.Agents;

public sealed class VolunteerAssignmentAgent
{
    private readonly AppDbContext _context;

    public VolunteerAssignmentAgent(
        AppDbContext context)
    {
        _context = context;
    }

    public async Task<VolunteerAssignmentRecommendationResponse?>
        RecommendAsync(
            DisasterReport report)
    {
        // =====================================================
        // GET ELIGIBLE VOLUNTEERS
        // =====================================================

        var volunteers =
            await _context.Users
                .Where(x =>
                    x.Role == "FieldVolunteer" &&
                    x.IsActive &&
                    x.RoleRequestStatus == "Approved")
                .OrderBy(x => x.FullName)
                .ToListAsync();

        // No eligible volunteers
        if (volunteers.Count == 0)
        {
            return new VolunteerAssignmentRecommendationResponse
            {
                DisasterReportId =
                    report.Id,

                DisasterType =
                    report.DisasterType,

                Location =
                    report.Location,

                Severity =
                    report.Severity,

                RecommendedVolunteer =
                    null
            };
        }


        // =====================================================
        // ACTIVE ASSIGNMENT STATUSES
        // =====================================================

        var activeStatuses = new[]
        {
            "Assigned",
            "InProgress",
            "FieldUpdateSubmitted"
        };


        // =====================================================
        // CALCULATE CURRENT WORKLOAD
        // =====================================================

        var workloadRows =
            await _context.DisasterReports
                .Where(x =>
                    x.AssignedVolunteerUserId.HasValue &&
                    activeStatuses.Contains(x.Status))
                .GroupBy(
                    x => x.AssignedVolunteerUserId!.Value)
                .Select(x => new
                {
                    VolunteerId = x.Key,
                    Count = x.Count()
                })
                .ToListAsync();


        var workload =
            workloadRows.ToDictionary(
                x => x.VolunteerId,
                x => x.Count);


        // =====================================================
        // NORMALIZE REPORT DATA
        // =====================================================

        var reportLocation =
            Normalize(report.Location);

        var reportSeverity =
            Normalize(report.Severity);

        var reportType =
            Normalize(report.DisasterType);


        // =====================================================
        // RANK VOLUNTEERS
        // =====================================================

        var ranked =
            volunteers
                .Select(volunteer =>
                {
                    var currentWorkload =
                        workload.TryGetValue(
                            volunteer.Id,
                            out var count)
                            ? count
                            : 0;


                    // -----------------------------------------
                    // DISTRICT MATCH
                    // -----------------------------------------

                    var districtMatch =
                        !string.IsNullOrWhiteSpace(
                            volunteer.District)
                        &&
                        LocationMatches(
                            reportLocation,
                            volunteer.District);


                    // -----------------------------------------
                    // DISTRICT BONUS
                    // -----------------------------------------

                    var districtBonus =
                        districtMatch
                            ? 35
                            : 0;


                    // -----------------------------------------
                    // SEVERITY BONUS
                    // -----------------------------------------

                    var severityBonus =
                        reportSeverity == "critical"
                            ? currentWorkload == 0
                                ? 18
                                : 8

                            : reportSeverity == "high"
                                ? currentWorkload == 0
                                    ? 14
                                    : 6

                                : currentWorkload == 0
                                    ? 10
                                    : 4;


                    // -----------------------------------------
                    // WORKLOAD PENALTY
                    // -----------------------------------------

                    var workloadPenalty =
                        Math.Min(
                            30,
                            currentWorkload * 10);


                    // -----------------------------------------
                    // DISASTER TYPE RELEVANCE
                    // -----------------------------------------

                    var typeBonus =
                        DisasterTypeRelevant(
                            reportType,
                            volunteer.Address,
                            volunteer.District)
                            ? 5
                            : 0;


                    // -----------------------------------------
                    // FINAL MATCH SCORE
                    // -----------------------------------------

                    var score =
                        45
                        + districtBonus
                        + severityBonus
                        + typeBonus
                        - workloadPenalty;


                    score =
                        Math.Clamp(
                            score,
                            0,
                            100);


                    // -----------------------------------------
                    // MATCH REASONS
                    // -----------------------------------------

                    var reasons =
                        new List<string>
                        {
                            "Approved active volunteer"
                        };


                    if (districtMatch)
                    {
                        reasons.Add(
                            $"District match: {volunteer.District}");
                    }


                    if (currentWorkload == 0)
                    {
                        reasons.Add(
                            "No active assignments");
                    }
                    else
                    {
                        reasons.Add(
                            $"{currentWorkload} active assignment(s)");
                    }


                    if (
                        reportSeverity == "critical" ||
                        reportSeverity == "high")
                    {
                        reasons.Add(
                            $"{report.Severity} incident priority considered");
                    }


                    // -----------------------------------------
                    // DTO
                    // -----------------------------------------

                    return new VolunteerRecommendationDto
                    {
                        VolunteerUserId =
                            volunteer.Id,

                        VolunteerName =
                            volunteer.FullName,

                        Email =
                            volunteer.Email,

                        District =
                            volunteer.District,

                        IsActive =
                            volunteer.IsActive,

                        MatchScore =
                            score,

                        CurrentWorkload =
                            currentWorkload,

                        Availability =
                            currentWorkload == 0
                                ? "Available"
                                : "Busy",

                        MatchReason =
                            string.Join(
                                " • ",
                                reasons)
                    };
                })
                .OrderByDescending(
                    x => x.MatchScore)
                .ThenBy(
                    x => x.CurrentWorkload)
                .ThenBy(
                    x => x.VolunteerName)
                .ToList();


        // =====================================================
        // RETURN RECOMMENDATION
        // =====================================================

        return new VolunteerAssignmentRecommendationResponse
        {
            DisasterReportId =
                report.Id,

            DisasterType =
                report.DisasterType,

            Location =
                report.Location,

            Severity =
                report.Severity,

            RecommendedVolunteer =
                ranked.FirstOrDefault(),

            Alternatives =
                ranked
                    .Skip(1)
                    .Take(4)
                    .ToList()
        };
    }


    // =========================================================
    // LOCATION MATCHING
    // =========================================================

    private static bool LocationMatches(
        string? reportLocation,
        string? volunteerDistrict)
    {
        var location =
            Normalize(reportLocation);

        var district =
            Normalize(volunteerDistrict);


        if (string.IsNullOrWhiteSpace(location) ||
            string.IsNullOrWhiteSpace(district))
        {
            return false;
        }


        return
            location.Contains(district) ||
            district.Contains(location);
    }


    // =========================================================
    // DISASTER TYPE RELEVANCE
    // =========================================================

    private static bool DisasterTypeRelevant(
        string disasterType,
        string? address,
        string? district)
    {
        var type =
            Normalize(disasterType);

        var combined =
            $"{Normalize(address)} {Normalize(district)}";


        if (string.IsNullOrWhiteSpace(type))
            return false;


        if (type.Contains("flood"))
        {
            return
                combined.Contains("river") ||
                combined.Contains("water") ||
                combined.Contains("flood");
        }


        if (type.Contains("drought"))
        {
            return
                combined.Contains("dry") ||
                combined.Contains("water") ||
                combined.Contains("drought");
        }


        if (type.Contains("landslide"))
        {
            return
                combined.Contains("hill") ||
                combined.Contains("mountain") ||
                combined.Contains("landslide");
        }


        if (type.Contains("storm") ||
            type.Contains("cyclone"))
        {
            return
                combined.Contains("coastal") ||
                combined.Contains("storm") ||
                combined.Contains("wind");
        }


        return false;
    }


    // =========================================================
    // NORMALIZE
    // =========================================================

    private static string Normalize(
        string? value)
    {
        return
            (value ?? string.Empty)
                .Trim()
                .ToLowerInvariant();
    }
}