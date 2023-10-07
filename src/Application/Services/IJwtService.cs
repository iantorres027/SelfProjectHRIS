using Template.Domain.Dto.Authentication;
using Template.Domain.Entities;

namespace Template.Application.Services;

public interface IJwtService
{
    Task<User> Authenticate(string token);
    Task<AuthResponse> GetRefreshTokenAsync(int userId);

    Task<AuthResponse?> GetTokenAsync(AuthRequest authRequest);

    Task<bool> IsTokenValid(string accessToken);
}