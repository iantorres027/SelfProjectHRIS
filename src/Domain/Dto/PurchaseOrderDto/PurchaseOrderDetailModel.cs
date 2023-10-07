namespace Template.Domain.Dto.PurchaseOrderDto;

public class PurchaseOrderDetailModel
{
    public int Id { get; set; }

    public int PurchaseOrderId { get; set; }

    public int ItemId { get; set; }

    public decimal ItemCost { get; set; }

    public decimal Qty { get; set; }

    public decimal DiscountPercent { get; set; }

    public decimal DiscountAmount { get; set; }

    public decimal VatTypeId { get; set; }

    public decimal VatableAmount { get; set; }

    public decimal NonVatableAmount { get; set; }

    public int EwtTypeId { get; set; }

    public decimal EwtAmount { get; set; }

    public string VendorCode { get; set; }

    public string Remarks { get; set; }

    public int CreatedById { get; set; }
    public string CreatedByName { get; set; }

    public DateTime DateCreated { get; set; }

    public int? ModifiedById { get; set; }
    public string? ModifiedByName { get; set; }

    public DateTime? DateModified { get; set; }
}