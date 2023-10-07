using System;

namespace Template.Web.Models;

public class ReportFilterModel
{
    public DateTime DateFrom { get; set; }
    public DateTime DateTo { get; set; }

    public int PreparedBy { get; set; }
}
