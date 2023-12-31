﻿// <auto-generated> This file has been auto generated by EF Core Power Tools. </auto-generated>
#nullable disable
using System;
using System.Collections.Generic;

namespace Template.Domain.Entities;

public partial class PurchaseOrder
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

    public int Status { get; set; }

    public int CompanyId { get; set; }

    public int CreatedById { get; set; }

    public DateTime DateCreated { get; set; }

    public int? ModifiedById { get; set; }

    public DateTime? DateModified { get; set; }
}