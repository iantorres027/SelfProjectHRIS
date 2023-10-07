namespace Template.Domain.Dto.PurchaseOrderDto;

public class PurchaseOrderModel
{
    public int Id { get; set; }

    public string TransactionNo { get; set; }

    public DateTime TransactionDate { get; set; }

    public int ReferenceId { get; set; }

    public string ReferenceNo { get; set; }

    public string VendorCode { get; set; }

    public decimal GrossAmount { get; set; }

    public int CurrencyId { get; set; }

    public decimal CurrencyAmount { get; set; }

    public int VatTypeId { get; set; }

    public decimal VatableAmount { get; set; }

    public decimal NonVatableAmount { get; set; }

    public decimal VatAmount { get; set; }

    public int EwtTypeId { get; set; }

    public decimal EwtAmount { get; set; }

    public decimal NetAmount { get; set; }

    public string Remarks { get; set; }

    public int ApprovalStatus { get; set; }
    public string ApprovalStatusDesc { get; set; }

    public int Status { get; set; }
    public string StatusDesc { get; set; }
    public int CompanyId { get; set; }
    public int CreatedById { get; set; }
    public string CreatedByName { get; set; }

    public DateTime DateCreated { get; set; }

    public int? ModifiedById { get; set; }
    public string? ModifiedByName { get; set; }

    public DateTime? DateModified { get; set; }
}