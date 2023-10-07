using Microsoft.EntityFrameworkCore;
using Template.Application.Interfaces.Setup.UserRepository;
using Template.Domain.Entities;

namespace Template.Infrastructure.Persistence.Repositories.Setup.UserRepository;

public class UserTokenRepository : IUserTokenRepository
{
    private readonly MNLTemplateDBContext _context;
    private readonly EfCoreHelper<UserToken> _contextHelper;

    public UserTokenRepository(
        MNLTemplateDBContext context)
    {
        _context = context;
        _contextHelper = new EfCoreHelper<UserToken>(_context);
    }

    public async Task<UserToken?> GetByIdAsync(int id) =>
        await _contextHelper.GetByIdAsync(id);

    public async Task<List<UserToken>?> GetByUserIdAsync(int userId) =>
        await _context.UserTokens.Where(m => m.UserId == userId).ToListAsync();

    public async Task<UserToken?> GetTokenAsync(string expiredToken, string refreshToken) =>
        await _context.UserTokens.FirstOrDefaultAsync(x => x.IsInvalidated == false && x.Token == expiredToken
                && x.RefreshToken == refreshToken);

    public async Task<UserToken?> GetTokenAsync(string token) =>
        await _context.UserTokens.FirstOrDefaultAsync(x => x.IsInvalidated == false && x.Token == token);

    public async Task<UserToken> CreateAsync(UserToken userToken)
    {
        userToken = await _contextHelper.CreateAsync(userToken);

        return userToken;
    }

    public async Task<UserToken> UpdateAsync(UserToken userToken)
    {
        userToken = await _contextHelper.UpdateAsync(userToken);

        return userToken;
    }

    public async Task BatchDeleteAsync(int[] ids)
    {
        var entities = await _context.UserTokens.Where(m => ids.Contains(m.Id)).ToListAsync();

        if (entities is not null)
        {
            await _contextHelper.BatchDeleteAsync(entities);
        }
    }
}