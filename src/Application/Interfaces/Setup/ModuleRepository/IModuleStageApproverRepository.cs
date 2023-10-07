using Template.Domain.Entities;
using Template.Domain.Dto.ModuleDto;

namespace Template.Application.Interfaces.Setup.ModuleRepository;

public interface IModuleStageApproverRepository
{
    Task BatchDeleteAsync(int[] ids);

    Task<ModuleStageApprover> CreateAsync(ModuleStageApproverModel moduleStageApprover, int userId);

    Task<List<ModuleStageApprover>> GetAll();

    Task<ModuleStageApprover?> GetById(int id);

    Task<List<ModuleStageApprover>> GetByModuleStageId(int moduleStageId);

    Task<ModuleStageApprover> SaveAsync(ModuleStageApproverModel moduleStageApprover, int userId);

    Task<ModuleStageApprover> UpdateAsync(ModuleStageApproverModel moduleStageApprover, int userId);
}