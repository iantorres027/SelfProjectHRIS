using Template.Application.Interfaces.Setup.ModuleRepository;
using Template.Domain.Entities;

namespace Template.Infrastructure.Persistence.Repositories.Setup.ModuleRepository;

public class ModuleStageRepository : IModuleStageRepository
{
    private readonly MNLTemplateDBContext _context;
    private readonly EfCoreHelper<ModuleStage> _contextHelper;

    public ModuleStageRepository(MNLTemplateDBContext context)
    {
        _context = context;
        _contextHelper = new EfCoreHelper<ModuleStage>(context);
    }

    public async Task<ModuleStage?> GetById(int id)
    {
        var result = await _contextHelper.GetByIdAsync(id);
        return result;
    }

    public async Task<List<ModuleStage>> GetAll()
    {
        var result = await _contextHelper.GetAllAsync();
        return result;
    }

    public async Task<ModuleStage> SaveAsync(ModuleStage moduleStage, int userId)
    {
        if (moduleStage.Id == 0)
            moduleStage = await CreateAsync(moduleStage, userId);
        else
            moduleStage = await UpdateAsync(moduleStage, userId);

        return moduleStage;
    }

    public async Task<ModuleStage> CreateAsync(ModuleStage moduleStage, int userId)
    {
        moduleStage.CreatedById = userId;
        moduleStage.DateCreated = DateTime.UtcNow;
        var result = await _contextHelper.CreateAsync(moduleStage, "ModifiedById", "DateModified");

        return result;
    }

    public async Task<ModuleStage> UpdateAsync(ModuleStage moduleStage, int userId)
    {
        moduleStage.ModifiedById = userId;
        moduleStage.DateModified = DateTime.UtcNow;
        var result = await _contextHelper.CreateAsync(moduleStage, "CreatedById", "DateCreated");

        return result;
    }

    public async Task BatchDeleteAsync(int[] ids)
    {
        var entities = _context.ModuleStages.Where(m => ids.Contains(m.Id));

        await _contextHelper.BatchDeleteAsync(entities);
    }
}