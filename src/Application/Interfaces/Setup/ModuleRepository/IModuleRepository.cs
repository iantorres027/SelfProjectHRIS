using Template.Domain.Dto.ModuleDto;
using Template.Domain.Entities;

namespace Template.Application.Interfaces.Setup.ModuleRepository;

public interface IModuleRepository
{
    Task<Module> UpdateAsync(Module module, int userId);

    Task<Module> CreateAsync(Module module, int userId);

    Task DeleteAsync(int id);

    Task<List<ModuleModel>?> GetAllAsync();

    Task<ModuleModel?> GetByCodeAsync(string code);

    Task<ModuleModel?> GetByDescAync(string description);

    Task<ModuleModel?> GetByIdAsync(int id);

    Task<Module> SaveAsync(ModuleModel module, List<ModuleStageModel> moduleStages, int userId);
}