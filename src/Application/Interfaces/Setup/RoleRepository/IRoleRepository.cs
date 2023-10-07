using Template.Domain.Entities;

namespace Template.Application.Interfaces.Setup.RoleRepository;

public interface IRoleRepository
{
    Task BatchDeleteAsync(int[] ids);

    Task<Role> CreateAsync(Role role);

    Task DeleteAsync(int id);

    Task<List<Role>> GetAllAsync();

    Task<Role?> GetByIdAsync(int id);

    Task<Role> SaveAsync(Role role);

    Task<Role> UpdateAsync(Role role);
}