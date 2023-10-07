namespace Template.Domain.Dto.ModuleDto
{
    public class ModuleAccessModel
    {
        public int Id { get; set; }
        public int ModuleId { get; set; }
        public string? ModuleName { get; set; }
        public string? ModuleCode { get; set; }
        public int ModuleTypeId { get; set; }
        public string? ModuleType { get; set; }
        public string? ModuleTypeIcon { get; set; }
        public string? ModuleTypeOrder { get; set; }
        public string? ModuleTypeController { get; set; }
        public string? ModuleTypeAction { get; set; }
        public bool ModuleTypeIsVisible { get; set; }
        public bool ModuleTypeIsDisabled { get; set; }
        public bool ModuleTypeInMaintenance { get; set; }
        public bool InMaintenance { get; set; }
        public bool IsVisible { get; set; }
        public bool IsDisabled { get; set; }
        public int ParentModuleId { get; set; }
        public bool HasSubModule { get; set; }
        public string? ModuleController { get; set; }
        public string? ModuleAction { get; set; }
        public string? ModuleIcon { get; set; }
        public int ModuleOrdinal { get; set; }

        public int UserId { get; set; }
        public int RoleId { get; set; }
        public bool CanCreate { get; set; }
        public bool CanModify { get; set; }
        public bool CanDelete { get; set; }
        public bool CanRead { get; set; }
        public bool FullAccess { get; set; }
    }
}