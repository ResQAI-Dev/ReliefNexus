namespace ReliefNexus.API.Helpers;

public static class RoleConstants
{
    public const string AffectedUser = "AffectedUser";
    public const string FieldVolunteer = "FieldVolunteer";
    public const string ReliefCoordinator = "ReliefCoordinator";
    public const string SystemAdministrator = "SystemAdministrator";

    public static readonly string[] AllRoles =
    {
        AffectedUser,
        FieldVolunteer,
        ReliefCoordinator,
        SystemAdministrator
    };
}
