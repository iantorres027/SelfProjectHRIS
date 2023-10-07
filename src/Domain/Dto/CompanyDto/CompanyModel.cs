using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace Template.Domain.Dto.CompanyDto;

public class CompanyModel
{
    public int Id { get; set; }

    [Required(ErrorMessage = "Code is required.")]
    public string Code { get; set; } = string.Empty;

    [Required(ErrorMessage = "Name is required.")]
    public string Name { get; set; } = string.Empty;

    [DisplayName("Business Style")]
    public string BusinessStyle { get; set; } = string.Empty;

    [DisplayName("Tel No.")]
    public string TelNo { get; set; } = string.Empty;

    [DisplayName("Mobile No.")]
    public string MobileNo { get; set; } = string.Empty;

    [DisplayName("Fax No.")]
    public string FaxNo { get; set; } = string.Empty;

    [EmailAddress(ErrorMessage = "Please enter a valid email address")]
    public string Email { get; set; } = string.Empty;

    [Url]
    public string? Website { get; set; }

    [DisplayName("TIN")]
    public string Tin { get; set; } = string.Empty;

    [DisplayName("Representative Name")]
    public string RepresentativeName { get; set; } = string.Empty;

    [DisplayName("Representative TIN")]
    public string RepresentativeTin { get; set; } = string.Empty;

    [DisplayName("Representative Title/Designation")]
    public string RepresentativeDesignation { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Address { get; set; }

    [DisplayName("Accounting Period")]
    public string AccountingPeriod { get; set; } = string.Empty;

    public string? AcctngPeriodFrom { get; set; }

    public string? AcctngPeriodTo { get; set; }

    public int InvEvalMethodDesc { get; set; }

    [DisplayName("Disable")]
    public bool IsDisabled { get; set; }

    public int CreatedById { get; set; }

    public DateTime DateCreated { get; set; }

    public int ModifiedById { get; set; }

    public DateTime DateModified { get; set; }

    public List<CompanyLogoModel>? CompanyLogos { get; set; }

    public DateTime MinDate { get; set; }

    public DateTime MaxDate { get; set; }

    public DateTime? MinTransactionDate { get; set; }

    public DateTime? MaxTransactionDate { get; set; }

    [DisplayName("Set Currency Daily")]
    public bool IsRequiredDailySetCurrency { get; set; }
}