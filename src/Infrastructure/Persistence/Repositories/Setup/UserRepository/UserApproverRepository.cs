using Microsoft.EntityFrameworkCore;
using Template.Application.Interfaces.Setup.UserRepository;
using Template.Domain.Entities;

namespace Template.Infrastructure.Persistence.Repositories.Setup.UserRepository;

public class UserApproverRepository : IUserApproverRepository
{
    private readonly MNLTemplateDBContext _context;
    private readonly EfCoreHelper<UserApprover> _contextHelper;

    public UserApproverRepository(MNLTemplateDBContext context)
    {
        _context = context;
        _contextHelper = new EfCoreHelper<UserApprover>(context);
    }

    public async Task<UserApprover> CreateAsync(UserApprover userApprover, int userId)
    {
        string[] toIgnore = new[] { "ModifiedById", "DateModified" };
        userApprover.CreatedById = userId;
        userApprover.DateCreated = DateTime.UtcNow;

        userApprover = await _contextHelper.CreateAsync(userApprover, toIgnore);
        return userApprover;
    }

    public async Task<UserApprover> UpdateAsync(UserApprover userApprover, int userId)
    {
        userApprover.ModifiedById = userId;
        userApprover.DateModified = DateTime.UtcNow;

        userApprover = await _contextHelper.UpdateAsync(userApprover, "CreatedById", "DateCreated");
        return userApprover;
    }

    public async Task BatchDeleteAsync(int[] ids)
    {
        var entities = await _context.UserApprovers.Where(m => ids.Contains(m.Id)).ToListAsync();

        if (entities is not null)
            await _contextHelper.BatchDeleteAsync(entities);
    }
}