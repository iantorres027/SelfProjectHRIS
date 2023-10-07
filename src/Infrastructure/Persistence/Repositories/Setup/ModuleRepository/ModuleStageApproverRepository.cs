using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Template.Application.Interfaces.Setup.ModuleRepository;
using Template.Domain.Dto.ModuleDto;
using Template.Domain.Entities;

namespace Template.Infrastructure.Persistence.Repositories.Setup.ModuleRepository;

public class ModuleStageApproverRepository : IModuleStageApproverRepository
{
    private readonly MNLTemplateDBContext _context;
    private readonly EfCoreHelper<ModuleStageApprover> _contextHelper;
    private readonly IMapper _mapper;

    public ModuleStageApproverRepository(MNLTemplateDBContext context, IMapper mapper)
    {
        _context = context;
        _contextHelper = new EfCoreHelper<ModuleStageApprover>(context);
        _mapper = mapper;
    }

    public async Task<ModuleStageApprover?> GetById(int id) =>
        await _contextHelper.GetByIdAsync(id);

    public async Task<List<ModuleStageApprover>> GetAll() =>
        await _contextHelper.GetAllAsync();

    public async Task<List<ModuleStageApprover>> GetByModuleStageId(int moduleStageId) =>
        await _context.ModuleStageApprovers.Where(m => m.ModuleStageId == moduleStageId).ToListAsync();

    public async Task<ModuleStageApprover> SaveAsync(ModuleStageApproverModel moduleStageApprover, int userId)
    {
        var _moduleStageApprover = new ModuleStageApprover();

        if (moduleStageApprover.Id == 0)
            _moduleStageApprover = await CreateAsync(moduleStageApprover, userId);
        else
            _moduleStageApprover = await UpdateAsync(moduleStageApprover, userId);

        return _moduleStageApprover;
    }

    public async Task<ModuleStageApprover> CreateAsync(ModuleStageApproverModel moduleStageApprover, int userId)
    {
        moduleStageApprover.CreatedById = userId;
        moduleStageApprover.DateCreated = DateTime.UtcNow;

        var _moduleStageApprover = _mapper.Map<ModuleStageApprover>(moduleStageApprover);
        _moduleStageApprover = await _contextHelper.CreateAsync(_moduleStageApprover);

        return _moduleStageApprover;
    }

    public async Task<ModuleStageApprover> UpdateAsync(ModuleStageApproverModel moduleStageApprover, int userId)
    {
        moduleStageApprover.ModifiedById = userId;
        moduleStageApprover.DateModified = DateTime.UtcNow;

        var _moduleStageApprover = _mapper.Map<ModuleStageApprover>(moduleStageApprover);
        _moduleStageApprover = await _contextHelper.CreateAsync(_moduleStageApprover);

        return _moduleStageApprover;
    }

    public async Task BatchDeleteAsync(int[] ids)
    {
        var entities = await _context.ModuleStageApprovers.Where(m => ids.Contains(m.Id)).ToListAsync();
        if (entities is null)
            return;

        await _contextHelper.BatchDeleteAsync(entities);
    }
}