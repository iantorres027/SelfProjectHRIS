using Template.Application.Services;
using Template.Domain.Dto.ModuleDto;
using Template.Domain.Dto.RoleDto;
using Template.Domain.Entities;

namespace Template.Infrastructure.Persistence.Repositories.Setup.RoleRepository;

public class RoleAccessRepository
{
    private readonly EfCoreHelper<RoleAccess> _contextHelper;
    private readonly ISQLDatabaseService _db;

    public RoleAccessRepository(MNLTemplateDBContext context, ISQLDatabaseService db)
    {
        _contextHelper = new EfCoreHelper<RoleAccess>(context);
        _db = db;
    }

    public async Task<List<ModuleAccessModel>> GetById(int id) =>
        (await _db.LoadDataAsync<ModuleAccessModel, dynamic>("dbo.GetRoleAccess_GetById", new { id })).ToList();

    public async Task<List<RoleAccessModel>> GetByRoleId(int roleId) =>
        (await _db.LoadDataAsync<RoleAccessModel, dynamic>("spRoleAccess_GetByRoleId", new { roleId })).ToList();

    public async Task<RoleAccessModel?> GetByModuleCode(int userId, string moduleCode) =>
        await _db.LoadSingleAsync<RoleAccessModel, dynamic>("spRoleAccess_GetByModuleCode", new { userId, moduleCode });
}