using Microsoft.EntityFrameworkCore;
using ReliefNexus.API.Helpers;
using ReliefNexus.API.Models;

namespace ReliefNexus.API.Data;

public static class SeedData
{
    public static async Task InitializeAsync(
        IServiceProvider services,
        IConfiguration configuration)
    {
        using var scope = services.CreateScope();

        var context = scope.ServiceProvider
            .GetRequiredService<AppDbContext>();

        var adminEmail = configuration["InitialAdmin:Email"];
        var adminPassword = configuration["InitialAdmin:Password"];

        if (string.IsNullOrWhiteSpace(adminEmail) ||
            string.IsNullOrWhiteSpace(adminPassword))
        {
            return;
        }

        adminEmail = adminEmail.Trim().ToLower();

        var admin = await context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == adminEmail);

        if (admin == null)
        {
            admin = new User
            {
                Id = Guid.NewGuid(),
                FullName = "System Administrator",
                Email = adminEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword),
                Role = RoleConstants.SystemAdministrator,
                RoleRequestStatus = "Approved",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            context.Users.Add(admin);
        }
        else
        {
            admin.FullName = "System Administrator";
            admin.PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword);
            admin.Role = RoleConstants.SystemAdministrator;
            admin.RoleRequestStatus = "Approved";
            admin.IsActive = true;
        }

        await context.SaveChangesAsync();
    }
}
