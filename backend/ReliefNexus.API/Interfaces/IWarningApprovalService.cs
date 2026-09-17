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
}