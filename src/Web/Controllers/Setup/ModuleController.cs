using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Template.Application.Interfaces.Setup.ModuleRepository;
using Template.Domain.Common;
using Template.Domain.Dto.ModuleDto;
using Template.Web.Models;

namespace Template.Web.Controllers.Setup;

[Authorize]
public class ModuleController : Controller
{
    private readonly IModuleRepository _moduleRepository;
    private readonly IModuleTypeRepository _moduleTypeRepository;
    private readonly IModuleStageRepository _moduleStageRepository;
    private readonly IModuleSettingRepository _moduleSettingRepository;
    private readonly IModuleStageApproverRepository _stageApproverRepository;

    public ModuleController(
        IModuleRepository moduleRepository,
        IModuleTypeRepository moduleTypeRepository,
        IModuleStageRepository moduleStageRepository,
        IModuleSettingRepository moduleSettingRepository,
        IModuleStageApproverRepository stageApproverRepository)
    {
        _moduleRepository = moduleRepository;
        _moduleTypeRepository = moduleTypeRepository;
        _moduleStageRepository = moduleStageRepository;
        _moduleSettingRepository = moduleSettingRepository;
        _stageApproverRepository = stageApproverRepository;
    }

    public async Task<IActionResult> Index()
    {
        try
        {
            var moduleTypes = await _moduleTypeRepository.GetAllAsync();
            var approvalRouteTypes = new List<DropDownModel>()
                {
                    new DropDownModel { Id = 1, Description = "Straight" },
                    new DropDownModel { Id = 2, Description = "Total Count" }
                };

            var module = new ModuleModel
            {
                ApprovalRouteTypes = approvalRouteTypes.ToList()
            };

            var moduleStages = new List<ModuleStageModel> {
                    new ModuleStageModel { Name = "Review" },
                    new ModuleStageModel { Name = "Approve" }
                };

            var viewModel = new ModuleViewModel
            {
                Module = module,
                ModuleStages = moduleStages
            };

            return View(viewModel);
        }
        catch (Exception ex) { return View("error", new ErrorViewModel { Message = ex.Message, Exception = ex }); }
    }

    public async Task<IActionResult> ModuleSettings()
    {
        try
        {
            var data = await _moduleSettingRepository.GetAllAsync();
            return View(data);
        }
        catch (Exception ex) { return View("Error", new ErrorViewModel { Message = ex.Message, Exception = ex }); }
    }

    #region Modules API

    public async Task<IActionResult> GetModules() =>
        Ok(await _moduleRepository.GetAllAsync());

    public async Task<IActionResult> GetParentModules(int moduleTypeId)
    {
        try
        {
            var modules = await _moduleRepository.GetAllAsync();
            var parentModulesDropDown = modules.Where(m => m.ModuleTypeId == moduleTypeId && (m.ParentModuleId == 0 || m.ParentModuleId == null)).Select(m => new DropDownModel { Id = m.Id, Description = m.Description }).ToList();
            return Ok(parentModulesDropDown);
        }
        catch (Exception ex) { return BadRequest(ex.Message); }
    }

    public async Task<IActionResult> GetModule(int id) =>
        Ok(await _moduleRepository.GetByIdAsync(id));

    //public async Task<IActionResult> GetModuleStages(int id) =>
    //    Ok(await _moduleStageRepository.(id));

    public async Task<IActionResult> GetModuleTypes() =>
        Ok(await _moduleTypeRepository.GetAllAsync());

    public async Task<IActionResult> GetModuleType(int id) =>
        Ok(await _moduleTypeRepository.GetByIdAsync(id));

    public async Task<IActionResult> GetModuleByType(int typeId)
    {
        try
        {
            var data = await _moduleRepository.GetAllAsync();

            return Ok(data.Where(m => m.ModuleTypeId == typeId));
        }
        catch (Exception ex) { return BadRequest(ex.Message); }
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> SaveModuleType(ModuleTypeModel model)
    {
        try
        {
            if (!ModelState.IsValid)
                return Conflict(ModelState.Where(x => x.Value.Errors.Any()).Select(x => new { x.Key, x.Value.Errors }));

            int userId = int.Parse(User.Identity.Name);

            await _moduleTypeRepository.CreateAsync(model, userId);

            return Ok();
        }
        catch (Exception ex) { return BadRequest(ex.Message); }
    }

    [HttpDelete]
    [Route("Module/DeleteModuleTypes/")]
    public async Task<IActionResult> DeleteModuleTypes(string moduleTypeIds)
    {
        try
        {
            int[] Ids = Array.ConvertAll(moduleTypeIds.Split(','), int.Parse);
            await _moduleTypeRepository.BachDeleteAsync(Ids);

            return Ok();
        }
        catch (Exception ex) { return BadRequest(ex.Message); }
    }

    public async Task<IActionResult> GetStageApprovers(int id)
    {
        try
        {
            var data = await _stageApproverRepository.GetByModuleStageId(id);

            return Ok(data);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    public async Task<IActionResult> GetStageApprover(int id)
    {
        try
        {
            var data = await _stageApproverRepository.GetById(id);

            return Ok(data);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> SaveModule(ModuleViewModel model)
    {
        try
        {
            if (ModelState.IsValid)
            {
                var userId = int.Parse(User.Identity.Name);

                await _moduleRepository.SaveAsync(model.Module, model.ModuleStages, userId);

                return Ok();
            }
            else
            {
                var errors = ModelState.Where(x => x.Value.Errors.Any()).Select(x => new { x.Key, x.Value.Errors });
                return Conflict(errors);
            }
        }
        catch (Exception ex) { return BadRequest(ex.Message); }
    }

    [HttpDelete]
    [Route("Module/DeleteModules/")]
    public async Task<IActionResult> DeleteModules(string moduleIds)
    {
        try
        {
            int[] Ids = Array.ConvertAll(moduleIds.Split(','), int.Parse);

            if (Ids.Length > 0)
                foreach (var moduleId in Ids)
                    await _moduleRepository.DeleteAsync(moduleId);

            return Ok();
        }
        catch (Exception ex) { return BadRequest(ex.Message); }
    }

    #endregion Modules API
}