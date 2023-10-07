namespace Template.Domain.Dto.ModuleDto;

public class StageApproverModel
{
    public int ModuleId { get; set; }
    public string? ModuleCode { get; set; }
    public string? ModuleStageLevel { get; set; }
    public string? ModuleStageName { get; set; }
    public string? ModuleStageTitle { get; set; }
    public int UserId { get; set; }
    public string? Prefix { get; set; }
    public string? LastName { get; set; }
    public string? FirstName { get; set; }
    public string? MiddleName { get; set; }
    public string? Suffix { get; set; }

    public string FullName
    {
        get
        {
            return this.LastName + ", " + this.FirstName;
        }
    }

    public string? Position { get; set; }
}