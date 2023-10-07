using Microsoft.AspNetCore.Http;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using Template.Domain.Common;

namespace Template.Domain.Dto.UserDto;

public class UserModel
{
    public int Id { get; set; }

    [Required(ErrorMessage = "Username is required.")]
    [DisplayName("Username")]
    public string UserName { get; set; } = string.Empty;

    [RegularExpression(@"^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$", ErrorMessage = "Use at least 8 characters in combination of uppercase, letters, numbers & symbols.")]
    [DataType(DataType.Password)]
    [Required(ErrorMessage = "Password is required.")]
    public string Password { get; set; } = string.Empty;

    public string PasswordSalt { get; set; } = string.Empty;

    public string Prefix { get; set; } = string.Empty;

    [Required(ErrorMessage = "Last Name is required.")]
    [DisplayName("Last Name")]
    public string LastName { get; set; } = string.Empty;

    [Required(ErrorMessage = "First Name is required.")]
    [DisplayName("First Name")]
    public string FirstName { get; set; } = string.Empty;

    [DisplayName("Middle Name")]
    public string MiddleName { get; set; } = string.Empty;

    public string Suffix { get; set; } = string.Empty;

    public string Name
    {
        get
        {
            return LastName + ", " + FirstName;
        }
    }

    public string Gender { get; set; } = string.Empty;

    public List<DropDownModel>? Genders { get; set; }

    [Required(ErrorMessage = "Email is required.")]
    [DataType(DataType.EmailAddress)]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Position is required.")]
    public string Position { get; set; } = string.Empty;

    public string ProfilePicture { get; set; } = string.Empty;
    public IFormFile? ProfilePictureFile { get; set; }
    public string Signature { get; set; } = string.Empty;
    public IFormFile? SignatureFile { get; set; }

    [DisplayName("Account Disabled")]
    public bool IsDisabled { get; set; }

    public bool IsOnline { get; set; }
    public bool AdminAccess { get; set; }
    public DateTime LastOnlineTime { get; set; }
    public int CreatedById { get; set; }
    public DateTime DateCreated { get; set; }
    public int ModifiedById { get; set; }
    public string ModifiedByName { get; set; } = string.Empty;
    public DateTime DateModified { get; set; }
    public string Message { get; set; } = string.Empty;
    public DateTime? LockedTime { get; set; }
    public DateTime? LastFailedAttempt { get; set; }
    public int FailedAttempts { get; set; } = 0;
    public string LockStatus { get; set; } = string.Empty;
    public int LockedDuration { get; set; }
    public string RefreshToken { get; set; } = string.Empty;
    public DateTime? RefreshTokenExpiryTime { get; set; }

    [DisplayName("User Role")]
    [Required(ErrorMessage = "Role is required.")]
    public int? UserRoleId { get; set; }

    public string UserRoleName { get; set; } = string.Empty;
}