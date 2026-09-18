namespace ReliefNexus.API.Helpers;

public static class RoleConstants
{
    public const string AffectedUser = "AffectedUser";
    public const string FieldVolunteer = "FieldVolunteer";
    public const string ReliefCoordinator = "ReliefCoordinator";
    public const string SystemAdministrator = "SystemAdministrator";

    public const string ViewRiskInformation = "View Risk Information";
    public const string ReportDisaster = "Report Disaster";
    public const string ShareLocation = "Share Location";
    public const string ViewEmergencyAlerts = "View Emergency Alerts";
    public const string ManageReliefRequests = "Manage Relief Requests";
    public const string ManageReliefResources = "Manage Relief Resources";
    public const string ManageUsers = "Manage Users";
    public const string ManageRoleRequests = "Manage Role Requests";
    public const string AIAgentMonitoring = "AI Agent Monitoring";
    public const string ConfigurePermissions = "Configure Permissions";
    public const string ViewAuditLogs = "View Audit Logs";
    public const string ViewReports = "View Reports";

    public static readonly string[] AllRoles =
    {
        AffectedUser,
        FieldVolunteer,
        ReliefCoordinator,
        SystemAdministrator
    };

    public static readonly string[] AllPermissions =
    {
        ViewRiskInformation,
        ReportDisaster,
        ShareLocation,
        ViewEmergencyAlerts,
        ManageReliefRequests,
        ManageReliefResources,
        ManageUsers,
        ManageRoleRequests,
        AIAgentMonitoring,
        ConfigurePermissions,
        ViewAuditLogs,
        ViewReports
    };
}
