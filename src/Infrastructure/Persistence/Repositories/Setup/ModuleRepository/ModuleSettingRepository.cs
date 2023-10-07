using Microsoft.EntityFrameworkCore;
using Template.Application.Interfaces.Setup.ModuleRepository;
using Template.Domain.Entities;

namespace Template.Infrastructure.Persistence.Repositories.Setup.ModuleRepository;

public class ModuleSettingRepository : IModuleSettingRepository
{
    private readonly MNLTemplateDBContext _context;
    private readonly EfCoreHelper<ModuleSetting> _contextHelper;

    public ModuleSettingRepository(MNLTemplateDBContext context)
    {
        _context = context;
        _contextHelper = new EfCoreHelper<ModuleSetting>(context);
    }

    public async Task<List<ModuleSetting>> GetAllAsync() =>
        await _contextHelper.GetAllAsync();

    public async Task<ModuleSetting?> GetByNameAsync(string name) =>
        await _context.ModuleSettings.FirstOrDefaultAsync(m => m.Name == name);

    public async Task DeleteAsync(int id)
    {
        var entity = await _contextHelper.GetByIdAsync(id);
        if (entity is null) return;

        await _contextHelper.DeleteAsync(entity);
    }

    public async Task<ModuleSetting> CreateAsync(ModuleSetting moduleSetting)
    {
        var result = await _contextHelper.CreateAsync(moduleSetting, "CreatedById", "DateCreated");
        return result;
    }

    public async Task<ModuleSetting> UpdateAsync(ModuleSetting moduleSetting)
    {
        var result = await _contextHelper.UpdateAsync(moduleSetting, "ModifiedById", "DateModified");
        return result;
    }
}