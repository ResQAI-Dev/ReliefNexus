using ReliefNexus.API.Models;

namespace ReliefNexus.API.Interfaces;

public interface IUserService
{
    Task<User> CreateUserAsync(User user);

    Task<List<User>> GetUsersAsync();
    Task<User?> UpdateUserAsync(Guid id, User user);
    Task<bool> DeleteUserAsync(Guid id);
}