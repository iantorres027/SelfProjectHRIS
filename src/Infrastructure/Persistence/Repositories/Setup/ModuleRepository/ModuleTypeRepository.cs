using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Template.Application.Interfaces.Setup.ModuleRepository;
using Template.Domain.Dto.ModuleDto;
using Template.Domain.Entities;

namespace Template.Infrastructure.Persistence.Repositories.Setup.ModuleRepository;

public class ModuleTypeRepository : IModuleTypeRepository
{
    private readonly MNLTemplateDBContext _context;
    private readonly EfCoreHelper<ModuleType> _contextHelper;
    private readonly IMapper _mapper;

    public ModuleTypeRepository(MNLTemplateDBContext context, IMapper mapper)
    {
        _context = context;
        _contextHelper = new EfCoreHelper<ModuleType>(context);
        _mapper = mapper;
    }

    public async Task<ModuleType?> GetByIdAsync(int id) =>
        await _contextHelper.GetByIdAsync(id);

    public async Task<List<ModuleType>> GetAllAsync() =>
        await _contextHelper.GetAllAsync();

    public async Task<ModuleType> CreateAsync(ModuleTypeModel moduleType, int userId)
    {
        moduleType.CreatedById = userId;
        moduleType.DateCreated = DateTime.UtcNow;

        var _moduleType = _mapper.Map<ModuleType>(moduleType);
        var result = await _contextHelper.CreateAsync(_moduleType, "ModifiedById", "DateModified");

        return result;
    }

    public async Task<ModuleType> UpdateAsync(ModuleTypeModel moduleType, int userId)
    {
        moduleType.ModifiedById = userId;
        moduleType.DateModified = DateTime.UtcNow;

        var _moduleType = _mapper.Map<ModuleType>(moduleType);
        var result = await _contextHelper.UpdateAsync(_moduleType, "ModifiedById", "DateModified");

        return result;
    }

    public async Task BachDeleteAsync(int[] ids)
    {
        var moduleTypes = await _context.ModuleTypes
            .Where(m => ids.Contains(m.Id))
            .ToListAsync();

        if (moduleTypes is not null)
            await _contextHelper.BatchDeleteAsync(moduleTypes);
    }
}