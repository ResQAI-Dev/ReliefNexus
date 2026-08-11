using Microsoft.AspNetCore.Mvc;
using ReliefNexus.API.Interfaces;
using ReliefNexus.API.Models;

namespace ReliefNexus.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpPost]
    public async Task<IActionResult> CreateUser(User user)
    {
        var createdUser = await _userService.CreateUserAsync(user);

        return Ok(createdUser);
    }

    [HttpGet]
public async Task<IActionResult> GetUsers()
{
    var users = await _userService.GetUsersAsync();

    return Ok(users);
}
[HttpPut("{id}")]
public async Task<IActionResult> UpdateUser(Guid id, User user)
{
    var updatedUser = await _userService.UpdateUserAsync(id, user);

    if (updatedUser == null)
    {
        return NotFound();
    }

    return Ok(updatedUser);
}
[HttpDelete("{id}")]
public async Task<IActionResult> DeleteUser(Guid id)
{
    var deleted = await _userService.DeleteUserAsync(id);

    if (!deleted)
    {
        return NotFound();
    }

    return NoContent();
}
}