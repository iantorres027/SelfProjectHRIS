﻿// <auto-generated> This file has been auto generated by EF Core Power Tools. </auto-generated>
#nullable disable
using System;
using System.Collections.Generic;

namespace Template.Domain.Entities;

public partial class CurrencyRate
{
    public int Id { get; set; }

    public int CurrencyId { get; set; }

    public decimal Rate { get; set; }

    public DateTime Date { get; set; }

    public int CreatedById { get; set; }

    public DateTime DateCreated { get; set; }

    public int? ModifiedById { get; set; }

    public DateTime? DateModified { get; set; }
}