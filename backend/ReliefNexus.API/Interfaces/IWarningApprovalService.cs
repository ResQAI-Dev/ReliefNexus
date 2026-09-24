namespace ReliefNexus.API.Interfaces;

public interface IWarningApprovalService
{
    Task<bool> SubmitAsync(Guid warningId);

    Task<bool> ApproveAsync(
        Guid warningId,
        Guid reviewerId,
        string? comments);

    Task<bool> RejectAsync(
        Guid warningId,
        Guid reviewerId,
        string? comments);

    Task<bool> RequestRevisionAsync(
        Guid warningId,
        Guid reviewerId,
        string? comments);
    Task<bool> PublishAsync(
        Guid warningId);

    Task<bool> CancelAsync(
    Guid warningId, 
    string reason);

    Task<bool> EscalateAsync(
    Guid warningId,
    string newSeverity,
    string reason);

    Task<bool> ExpireAsync(
        Guid warningId);

}



