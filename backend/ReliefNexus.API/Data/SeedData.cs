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

        var adminEmail =
            configuration["InitialAdmin:Email"];

        var adminPassword =
            configuration["InitialAdmin:Password"];

        if (!string.IsNullOrWhiteSpace(adminEmail) &&
    !string.IsNullOrWhiteSpace(adminPassword))
{
    adminEmail =
        adminEmail.Trim().ToLower();

        /* =====================================================
           SYSTEM ADMINISTRATOR
        ===================================================== */

        var admin =
            await context.Users
                .FirstOrDefaultAsync(
                    u => u.Email.ToLower() == adminEmail);

        if (admin == null)
        {
            admin = new User
            {
                Id = Guid.NewGuid(),
                FullName = "System Administrator",
                Email = adminEmail,
                PasswordHash =
                    BCrypt.Net.BCrypt.HashPassword(
                        adminPassword),
                Role =
                    RoleConstants.SystemAdministrator,
                RoleRequestStatus = "Approved",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            context.Users.Add(admin);
        }
        else
        {
            admin.FullName =
                "System Administrator";

            admin.PasswordHash =
                BCrypt.Net.BCrypt.HashPassword(
                    adminPassword);

            admin.Role =
                RoleConstants.SystemAdministrator;

            admin.RoleRequestStatus =
                "Approved";

            admin.IsActive = true;
        }

        await context.SaveChangesAsync();
        }

        /* =====================================================
           RESOURCE INVENTORY
           
           Only create the sample resources if the table
           is currently empty.
        ===================================================== */

        var resourceCount =
            await context.ReliefResources.CountAsync();

        Console.WriteLine($"[SeedData] ReliefResources BEFORE seed = {resourceCount}");

        if (resourceCount == 0)
        {
            var resources =
                new List<ReliefResource>
                {
                    new ReliefResource
                    {
                        Id = Guid.NewGuid(),
                        ResourceType = "Water",
                        ResourceName =
                            "Emergency Drinking Water",
                        AvailableQuantity = 50,
                        AllocatedQuantity = 0,
                        Location = "Trincomalee",
                        Status = "Available",
                        CreatedAt =
                            DateTime.UtcNow
                    },

                    new ReliefResource
                    {
                        Id = Guid.NewGuid(),
                        ResourceType = "Food",
                        ResourceName =
                            "Emergency Food Packages",
                        AvailableQuantity = 80,
                        AllocatedQuantity = 0,
                        Location = "Kinniya",
                        Status = "Available",
                        CreatedAt =
                            DateTime.UtcNow
                    },

                    new ReliefResource
                    {
                        Id = Guid.NewGuid(),
                        ResourceType = "Medical",
                        ResourceName =
                            "Emergency Medical Kits",
                        AvailableQuantity = 40,
                        AllocatedQuantity = 0,
                        Location = "Mutur",
                        Status = "Available",
                        CreatedAt =
                            DateTime.UtcNow
                    },

                    new ReliefResource
                    {
                        Id = Guid.NewGuid(),
                        ResourceType = "Shelter",
                        ResourceName =
                            "Emergency Shelter Tents",
                        AvailableQuantity = 30,
                        AllocatedQuantity = 0,
                        Location = "Kantale",
                        Status = "Available",
                        CreatedAt =
                            DateTime.UtcNow
                    },

                    new ReliefResource
                    {
                        Id = Guid.NewGuid(),
                        ResourceType = "Fuel",
                        ResourceName =
                            "Emergency Fuel Supplies",
                        AvailableQuantity = 25,
                        AllocatedQuantity = 0,
                        Location = "Trincomalee",
                        Status = "Available",
                        CreatedAt =
                            DateTime.UtcNow
                    },

                    new ReliefResource
                    {
                        Id = Guid.NewGuid(),
                        ResourceType = "Water",
                        ResourceName =
                            "Community Water Supplies",
                        AvailableQuantity = 60,
                        AllocatedQuantity = 0,
                        Location = "Batticaloa",
                        Status = "Available",
                        CreatedAt =
                            DateTime.UtcNow
                    },

                    new ReliefResource
                    {
                        Id = Guid.NewGuid(),
                        ResourceType = "Food",
                        ResourceName =
                            "Community Food Packs",
                        AvailableQuantity = 70,
                        AllocatedQuantity = 0,
                        Location = "Polonnaruwa",
                        Status = "Available",
                        CreatedAt =
                            DateTime.UtcNow
                    },

                    new ReliefResource
                    {
                        Id = Guid.NewGuid(),
                        ResourceType = "Medical",
                        ResourceName =
                            "First Aid Kits",
                        AvailableQuantity = 35,
                        AllocatedQuantity = 0,
                        Location = "Anuradhapura",
                        Status = "Available",
                        CreatedAt =
                            DateTime.UtcNow
                    }
                };

            await context.ReliefResources
                .AddRangeAsync(resources);

            await context.SaveChangesAsync();
        }
    }
}