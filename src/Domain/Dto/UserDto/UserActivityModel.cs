using System.ComponentModel.DataAnnotations;

namespace Template.Domain.Dto.UserDto;

public class UserActivityModel
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string? Username { get; set; }

    [Required(ErrorMessage = "Action is required.")]
    public string Action { get; set; } = null!;

    public DateTime Date { get; set; }

    [Required(ErrorMessage = "Browser is required.")]
    public string Browser { get; set; } = null!;

    [Required(ErrorMessage = "Device is required")]
    public string Device { get; set; } = null!;

    public int CompanyId { get; set; }
    public int ActivityTypeId { get; set; }
}