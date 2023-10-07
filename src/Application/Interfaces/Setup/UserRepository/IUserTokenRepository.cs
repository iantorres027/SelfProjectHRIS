using Template.Domain.Entities;

namespace Template.Application.Interfaces.Setup.UserRepository;

public interface IUserTokenRepository
{
    Task<UserToken?> GetTokenAsync(string expiredToken, string refreshToken);

    Task<UserToken?> GetTokenAsync(string token);

    Task<UserToken?> GetByIdAsync(int id);

    Task BatchDeleteAsync(int[] ids);

    Task<UserToken> CreateAsync(UserToken userToken);

    Task<List<UserToken>?> GetByUserIdAsync(int userId);

    Task<UserToken> UpdateAsync(UserToken userToken);
}