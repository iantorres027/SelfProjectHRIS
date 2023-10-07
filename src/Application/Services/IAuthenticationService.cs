using Template.Domain.Dto.Authentication;
using Template.Domain.Dto.UserDto;
using Template.Domain.Entities;

namespace Template.Application.Services;

public interface IAuthenticationService
{
    string HashPassword(string password);

    Task<User> Authenticate(AuthRequest authRequest);

    Task InsertUserActivity(int userId, int companyId, string action);

    Task<User> RegisterUser(UserModel user);

    Task UnlockUser(int id);

    Task<UserModel> UpdateFailedAttempts(string userName);

    Task UpdateOnlineStatus(int id, bool status);

    Task UpdateUserRefreshToken(int userId, string refreshToken, DateTime refreshTokenExpiry);

    Task UserLockedStatus(string userName);
}