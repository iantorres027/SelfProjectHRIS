namespace Template.Domain.Dto.ModuleDto;

public class ModuleStageModel
{
    public int Id { get; set; }
    public int ModuleId { get; set; }
    public string? Code { get; set; }
    public string? Name { get; set; }
    public string? Title { get; set; }
    public int Level { get; set; }
    public string? ApproveDesc { get; set; }
    public string? RejectDesc { get; set; }
    public int ReturnStage { get; set; }
    public int RequiredCount { get; set; }
    public int ApproverId { get; set; }
    public bool IsDisabled { get; set; }
    public int CreatedById { get; set; }
    public DateTime DateCreated { get; set; }
    public int ModifiedById { get; set; }
    public DateTime DateModified { get; set; }
}