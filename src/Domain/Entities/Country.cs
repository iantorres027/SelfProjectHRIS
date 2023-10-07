﻿// <auto-generated> This file has been auto generated by EF Core Power Tools. </auto-generated>
#nullable disable
using System;
using System.Collections.Generic;

namespace Template.Domain.Entities;

public partial class Country
{
    public int ID { get; set; }

    /// <summary>
    /// ISO Code
    /// </summary>
    public string CountryCode { get; set; }

    /// <summary>
    /// ISO3 Code
    /// </summary>
    public string CountryName { get; set; }

    public string CurrencyCode { get; set; }

    public string FipsCode { get; set; }

    public string IsoNumeric { get; set; }

    public string North { get; set; }

    public string South { get; set; }

    public string East { get; set; }

    public string West { get; set; }

    public string Capital { get; set; }

    public string ContinentName { get; set; }

    public string Continent { get; set; }

    public string Languages { get; set; }

    public string IsoAlpha3 { get; set; }

    public int? GeonameId { get; set; }

    public int CreatedById { get; set; }

    public DateTime DateCreated { get; set; }

    public int? ModifiedById { get; set; }

    public DateTime? DateModified { get; set; }
}