using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace Template.Domain.Dto.CompanyDto;

public class CompanySettingModel
{
    public int Id { get; set; }
    public int CompanyId { get; set; }
    public int CreatedById { get; set; }
    public DateTime DateCreated { get; set; }
    public int ModifiedById { get; set; }
    public DateTime DateModified { get; set; }

    [DisplayName("BIR 2307 Basis")]
    [Required(ErrorMessage = "BIR 2307 Basis is required.")]
    public int Bir2307Basis { get; set; }

    [DisplayName("Accounting Period")]
    [Required(ErrorMessage = "Accounting Period is required.")]
    public string? AccountingPeriod { get; set; }

    [DisplayName("Posting Period")]
    [Required(ErrorMessage = "Posting Period is required."), Range(1, 28)]
    public int? PostingPeriod { get; set; }

    [DisplayName("Inventory Evaluation Method")]
    [Required(ErrorMessage = "Inventory Evaluation Method is required.")]
    public int? InvEvalMethodId { get; set; }

    [DisplayName("Period From")]
    [Required(ErrorMessage = "Period From is required.")]
    public string? AcctgPeriodFrom { get; set; }

    [DisplayName("Period To")]
    [Required(ErrorMessage = "Period To")]
    public string? AcctgPeriodTo { get; set; }

    [DisplayName("Transaction Series Count")]
    [Required(ErrorMessage = "Transaction Series Count")]
    public int TransactionSeriesCount { get; set; }

    [DisplayName("Bypass AP Approval")]
    public bool IsBypassApApproval { get; set; }

    [DisplayName("CWT")]
    public int? CwtId { get; set; }

    public string? CwtDesc { get; set; }
}