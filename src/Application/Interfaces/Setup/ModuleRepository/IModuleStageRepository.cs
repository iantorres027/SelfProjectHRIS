using Template.Domain.Entities;

namespace Template.Application.Interfaces.Setup.ModuleRepository;

public interface IModuleStageRepository
{
    Task BatchDeleteAsync(int[] ids);

    Task<ModuleStage> CreateAsync(ModuleStage moduleStage, int userId);

    Task<List<ModuleStage>> GetAll();

    Task<ModuleStage?> GetById(int id);

    Task<ModuleStage> UpdateAsync(ModuleStage moduleStage, int userId);
}