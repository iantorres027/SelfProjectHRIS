using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using Template.Domain.Common;

namespace Template.Domain.Dto.ModuleDto;

public class ModuleModel
{
    public int Id { get; set; }

    [Required(ErrorMessage = "Module Code is required!")]
    public string? Code { get; set; }

    [Required(ErrorMessage = "Module Description is required!")]
    public string? Description { get; set; }

    [DisplayName("Module Type")]
    [Required(ErrorMessage = "Module Type is required!")]
    public int ModuleTypeId { get; set; }

    public string? ModuleType { get; set; }
    public List<ModuleTypeModel>? ModuleTypes { get; set; }

    [DisplayName("Approval Type")]
    public int? ApprovalRouteTypeId { get; set; }

    public string? ApprovalRouteType { get; set; }
    public List<DropDownModel>? ApprovalRouteTypes { get; set; }

    [Required(ErrorMessage = "Module Ordinal is required!")]
    public int Ordinal { get; set; }

    public string? Icon { get; set; }
    public string? Controller { get; set; }
    public string? Action { get; set; }

    [DisplayName("Parent Module")]
    public int? ParentModuleId { get; set; }

    public string? ParentModule { get; set; }
    public List<DropDownModel>? ParentModules { get; set; }

    [DisplayName("Disabled")]
    public bool IsDisabled { get; set; }

    [DisplayName("In Maintenance")]
    public bool InMaintenance { get; set; }

    [DisplayName("Visible")]
    public bool IsVisible { get; set; }

    public int CreatedById { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime? DateCreated { get; set; }

    public int? ModifiedById { get; set; }
    public string? ModifiedBy { get; set; }
    public DateTime? DateModified { get; set; }

    public int? ModuleTypeOrder { get; set; }
}