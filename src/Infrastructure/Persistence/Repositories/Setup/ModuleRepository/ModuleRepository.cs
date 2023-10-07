using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Template.Application.Interfaces.Setup.ModuleRepository;
using Template.Application.Services;
using Template.Domain.Dto.ModuleDto;
using Template.Domain.Entities;

namespace Template.Infrastructure.Persistence.Repositories.Setup.ModuleRepository;

public class ModuleRepository : IModuleRepository
{
    private readonly MNLTemplateDBContext _context;
    private readonly EfCoreHelper<Module> _contextHelper;
    private readonly ISQLDatabaseService _db;
    private readonly IModuleStageRepository _stageRepository;
    private readonly IModuleStageApproverRepository _stageApproverRepository;
    private readonly IMapper _mapper;

    public ModuleRepository(
        MNLTemplateDBContext context,
        ISQLDatabaseService db,
        IModuleStageRepository stageRepository,
        IModuleStageApproverRepository stageApproverRepository,
        IMapper mapper)
    {
        _context = context;
        _db = db;
        _contextHelper = new EfCoreHelper<Module>(context);
        _stageRepository = stageRepository;
        _stageApproverRepository = stageApproverRepository;
        _mapper = mapper;
    }

    public async Task<ModuleModel?> GetByIdAsync(int id) =>
        await _db.LoadSingleAsync<ModuleModel, dynamic>("spModule_Get", new { id });

    public async Task<ModuleModel?> GetByCodeAsync(string code) =>
        await _db.LoadSingleAsync<ModuleModel, dynamic>("spModule_GetByCode", new { code });

    public async Task<ModuleModel?> GetByDescAync(string description) =>
        await _db.LoadSingleAsync<ModuleModel, dynamic>("spModule_GetByDesc", new { description });

    public async Task<List<ModuleModel>?> GetAllAsync() =>
        (await _db.LoadDataAsync<ModuleModel, dynamic>("spModule_GetAll", new { })).ToList();

    public async Task<Module> SaveAsync(ModuleModel module, List<ModuleStageModel> moduleStages, int userId)
    {
        var _module = _mapper.Map<Module>(module);

        if (module.Id == 0)
            _module = await CreateAsync(_module, userId);
        else
            _module = await UpdateAsync(_module, userId);

        var count = 1;
        foreach (var moduleStage in moduleStages)
        {
            moduleStage.Level = count;
            var _moduleStage = _mapper.Map<ModuleStage>(moduleStage);

            if (moduleStage.Id == 0)
                await _stageRepository.CreateAsync(_moduleStage, userId);
            else
                await _stageRepository.UpdateAsync(_moduleStage, userId);

            count++;
        }

        // clean up for unused stages
        var moduleStagesIds = moduleStages.Where(m => m.Id != 0).Select(m => m.Id).ToList();
        var toDelete = await _context.ModuleStages
            .Where(m => m.ModuleId == module.Id && !moduleStagesIds.Contains(m.Id))
            .Select(m => m.Id)
            .ToArrayAsync();

        if (toDelete is not null && toDelete.Any())
            await _stageRepository.BatchDeleteAsync(toDelete);

        return _module;
    }

    public async Task<Module> CreateAsync(Module module, int userId)
    {
        module.CreatedById = userId;
        module.DateCreated = DateTime.Now;

        module = await _contextHelper.CreateAsync(module);

        return module;
    }

    public async Task<Module> UpdateAsync(Module module, int userId)
    {
        module.CreatedById = userId;
        module.DateCreated = DateTime.Now;

        await _contextHelper.CreateAsync(module);

        return module;
    }

    public async Task DeleteAsync(int id)
    {
        var module = await _context.Modules.FirstOrDefaultAsync(m => m.Id == id);

        if (module is null)
        {
            return;
        }

        await _contextHelper.DeleteAsync(module);

        var moduleStagesToDelete = await _context.ModuleStages
            .Where(m => m.ModuleId == module.Id)
            .Select(m => m.Id)
            .ToArrayAsync();

        await _stageRepository.BatchDeleteAsync(moduleStagesToDelete);

        var stageApproversToDelete = await _context.ModuleStageApprovers
            .Where(m => moduleStagesToDelete.Contains(m.ModuleStageId))
            .Select(m => m.Id)
            .ToArrayAsync();

        if (stageApproversToDelete is not null)
        {
            await _stageApproverRepository.BatchDeleteAsync(stageApproversToDelete);
        }
    }
}