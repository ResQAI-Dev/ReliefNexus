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

    // ======================================================
    // CREATE USER
    // ======================================================

    public async Task<User> CreateUserAsync(User user)
    {
        // Check whether email already exists
        var emailExists = await EmailExistsAsync(user.Email);

        if (emailExists)
        {
            throw new InvalidOperationException(
                "Email already exists"
            );
        }

        // Hash password before saving
        user.PasswordHash =
            BCrypt.Net.BCrypt.HashPassword(user.PasswordHash);

        _context.Users.Add(user);

        await _context.SaveChangesAsync();

        return user;
    }

    // ======================================================
    // GET ALL USERS
    // ======================================================

    public async Task<List<User>> GetUsersAsync()
    {
        return await _context.Users
            .ToListAsync();
    }

    // ======================================================
    // CHECK EMAIL EXISTS
    // ======================================================

    public async Task<bool> EmailExistsAsync(
        string email,
        Guid? excludeUserId = null)
    {
        var normalizedEmail = email.Trim().ToLower();

        return await _context.Users.AnyAsync(u =>
            u.Email.ToLower() == normalizedEmail &&
            (!excludeUserId.HasValue ||
             u.Id != excludeUserId.Value));
    }

    // ======================================================
    // UPDATE USER
    // ======================================================

    public async Task<User?> UpdateUserAsync(
        Guid id,
        User user)
    {
        // Find existing user
        var existingUser =
            await _context.Users.FindAsync(id);

        if (existingUser == null)
        {
            return null;
        }

        // Check whether another user already has this email
        var emailExists =
            await EmailExistsAsync(user.Email, id);

        if (emailExists)
        {
            throw new InvalidOperationException(
                "Email already exists"
            );
        }

        // Update user information
        existingUser.FullName =
            user.FullName;

        existingUser.Email =
            user.Email;

        // Hash new password
        existingUser.PasswordHash =
            BCrypt.Net.BCrypt.HashPassword(
                user.PasswordHash
            );

        existingUser.Role =
            user.Role;

        existingUser.IsActive =
            user.IsActive;

        await _context.SaveChangesAsync();

        return existingUser;
    }

    // ======================================================
    // DELETE USER
    // ======================================================

    public async Task<bool> DeleteUserAsync(Guid id)
    {
        // Find user
        var user =
            await _context.Users.FindAsync(id);

        if (user == null)
        {
            return false;
        }

        // Delete user
        _context.Users.Remove(user);

        await _context.SaveChangesAsync();

        return true;
    }

    // ======================================================
    // LOGIN
    // ======================================================

    public async Task<User?> LoginAsync(
        string email,
        string password)
    {
        // Case-insensitive email search
        var normalizedEmail =
            email.Trim().ToLower();

        var user = await _context.Users
            .FirstOrDefaultAsync(u =>
                u.Email.ToLower() == normalizedEmail);

        // User does not exist
        if (user == null)
        {
            return null;
        }

        // Check whether account is active
        if (!user.IsActive)
        {
            return null;
        }

        // Verify password
        var isPasswordValid =
            BCrypt.Net.BCrypt.Verify(
                password,
                user.PasswordHash
            );

        if (!isPasswordValid)
        {
            return null;
        }

        return user;
    }
}