using ReliefNexus.API.Data;
using ReliefNexus.API.Interfaces;
using ReliefNexus.API.Models;
using Microsoft.EntityFrameworkCore;

namespace ReliefNexus.API.Services;

public class UserService : IUserService
{
    private readonly AppDbContext _context;

    public UserService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<User> CreateUserAsync(User user)
    {
        _context.Users.Add(user);

        await _context.SaveChangesAsync();

        return user;
    }
    public async Task<List<User>> GetUsersAsync()
{
    return await _context.Users.ToListAsync();
}
public async Task<User?> UpdateUserAsync(Guid id, User user)
{
    var existingUser = await _context.Users.FindAsync(id);

    if (existingUser == null)
    {
        return null;
    }

    existingUser.FullName = user.FullName;
    existingUser.Email = user.Email;
    existingUser.PasswordHash = user.PasswordHash;
    existingUser.Role = user.Role;
    existingUser.IsActive = user.IsActive;

    await _context.SaveChangesAsync();

    return existingUser;
}
public async Task<bool> DeleteUserAsync(Guid id)
{
    var user = await _context.Users.FindAsync(id);

    if (user == null)
    {
        return false;
    }

    _context.Users.Remove(user);

    await _context.SaveChangesAsync();

    return true;
}
}