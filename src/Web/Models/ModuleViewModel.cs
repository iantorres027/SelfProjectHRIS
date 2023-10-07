using System.Collections.Generic;
using Template.Domain.Dto.ModuleDto;

namespace Template.Web.Models
{
    public class ModuleViewModel
    {
        public ModuleModel Module { get; set; } = new();
        public List<ModuleStageModel> ModuleStages { get; set; } = new();
        public ModuleStageApproverModel ModuleStageApprover { get; set; } = new();
        public ModuleTypeModel ModuleType { get; set; } = new();
    }
}