using Microsoft.EntityFrameworkCore;
using ReliefNexus.API.Models;

namespace ReliefNexus.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
}