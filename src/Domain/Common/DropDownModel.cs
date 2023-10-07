using System.ComponentModel.DataAnnotations;

namespace Template.Domain.Common;

public class DropDownModel
{
    [Required(ErrorMessage = "Id is required.")]
    public int Id { get; set; }

    public string? Code { get; set; }

    [Required(ErrorMessage = "Description is required.")]
    public string? Description { get; set; }
}