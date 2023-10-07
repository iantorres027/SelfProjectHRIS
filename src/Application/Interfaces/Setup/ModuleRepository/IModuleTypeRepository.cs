using Template.Domain.Entities;
using Template.Domain.Dto.ModuleDto;

namespace Template.Application.Interfaces.Setup.ModuleRepository;

public interface IModuleTypeRepository
{
    Task<List<ModuleType>> GetAllAsync();

    Task<ModuleType?> GetByIdAsync(int id);

    Task BachDeleteAsync(int[] ids);

    Task<ModuleType> CreateAsync(ModuleTypeModel moduleType, int userId);

    Task<ModuleType> UpdateAsync(ModuleTypeModel moduleType, int userId);
}