﻿// <auto-generated> This file has been auto generated by EF Core Power Tools. </auto-generated>
#nullable disable
using System;
using System.Collections.Generic;

namespace Template.Domain.Entities;

public partial class PurchaseOrderDetail
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

    public DateTime DateCreated { get; set; }

    public int? ModifiedById { get; set; }

    public DateTime? DateModified { get; set; }
}