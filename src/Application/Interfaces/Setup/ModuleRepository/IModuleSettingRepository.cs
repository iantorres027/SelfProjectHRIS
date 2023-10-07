using Template.Domain.Entities;

namespace Template.Application.Interfaces.Setup.ModuleRepository;

public interface IModuleSettingRepository
{
    Task<List<ModuleSetting>> GetAllAsync();

    Task<ModuleSetting?> GetByNameAsync(string name);

    Task<ModuleSetting> CreateAsync(ModuleSetting moduleSetting);

    Task<ModuleSetting> UpdateAsync(ModuleSetting moduleSetting);

    Task DeleteAsync(int id);
}