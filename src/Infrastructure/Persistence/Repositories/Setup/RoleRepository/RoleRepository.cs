using Microsoft.EntityFrameworkCore;
using Template.Application.Interfaces.Setup.RoleRepository;
using Template.Domain.Entities;

namespace Template.Infrastructure.Persistence.Repositories.Setup.RoleRepository;

public class RoleRepository : IRoleRepository
{
    private readonly MNLTemplateDBContext _context;
    private readonly EfCoreHelper<Role> _contextHelper;

    public RoleRepository(MNLTemplateDBContext context)
    {
        _context = context;
        _contextHelper = new EfCoreHelper<Role>(context);
    }

    public async Task<Role?> GetByIdAsync(int id) =>
        await _contextHelper.GetByIdAsync(id);

    public async Task<List<Role>> GetAllAsync() =>
        await _contextHelper.GetAllAsync();

    public async Task<Role> SaveAsync(Role role)
    {
        if (role.Id == 0)
            role = await CreateAsync(role);
        else
            role = await UpdateAsync(role);

        return role;
    }

    public async Task<Role> CreateAsync(Role role)
    {
        role.DateCreated = DateTime.UtcNow;
        role = await _contextHelper.CreateAsync(role, "DateModified");
        return role;
    }

    public async Task<Role> UpdateAsync(Role role)
    {
        role.DateModified = DateTime.UtcNow;
        role = await _contextHelper.UpdateAsync(role, "DateCreated");
        return role;
    }

    public async Task DeleteAsync(int id)
    {
        var entity = await _contextHelper.GetByIdAsync(id);

        if (entity is not null)
            await _contextHelper.DeleteAsync(entity);
    }

    public async Task BatchDeleteAsync(int[] ids)
    {
        var entities = await _context.Roles.Where(m => ids.Contains(m.Id)).ToListAsync();

        if (entities is not null)
            await _contextHelper.BatchDeleteAsync(entities);
    }
}