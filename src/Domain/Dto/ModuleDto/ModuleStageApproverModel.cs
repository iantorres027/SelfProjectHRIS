namespace Template.Domain.Dto.ModuleDto
{
    public class ModuleStageApproverModel
    {
        public int Id { get; set; }
        public int ModuleId { get; set; }
        public string? ModuleName { get; set; }
        public int ModuleStageId { get; set; }
        public string? ModuleStageName { get; set; }
        public string? ModuleStageLevel { get; set; }
        public int ApproverId { get; set; }
        public string? ApproverUserName { get; set; }
        public string? ApproverPrefix { get; set; }
        public string? ApproverFirstName { get; set; }
        public string? ApproverLastName { get; set; }
        public string? ApproverMiddleName { get; set; }
        public string? ApproverSuffix { get; set; }
        public int Level { get; set; }
        public bool IsDisabled { get; set; }
        public int CreatedById { get; set; }
        public DateTime DateCreated { get; set; }
        public int ModifiedById { get; set; }
        public DateTime DateModified { get; set; }
    }
}