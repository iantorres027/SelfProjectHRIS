using Microsoft.AspNetCore.Http;
using Template.Application.Interfaces.Setup.UserRepository;
using Template.Application.Services;
using Template.Domain.Dto.UserDto;

namespace Template.Infrastructure.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IUserRepository _userRepository;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor, IUserRepository userRepository)
    {
        _httpContextAccessor = httpContextAccessor;
        _userRepository = userRepository;
    }

    public int GetCurrentUserId()
    {
        int userId = int.Parse(_httpContextAccessor.HttpContext?.User?.Identity?.Name ?? "");
        return userId;
    }

    public async Task<UserModel?> GetUserInfo()
    {
        var userId = GetCurrentUserId();
        return await _userRepository.GetUserByIdAsync(userId);
    }
}