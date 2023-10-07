using DevExpress.AspNetCore.Reporting.QueryBuilder;
using DevExpress.AspNetCore.Reporting.ReportDesigner;
using DevExpress.AspNetCore.Reporting.WebDocumentViewer;
using DevExpress.XtraReports.UI;
using DevExpress.XtraReports.Web.ReportDesigner;
using DevExpress.XtraReports.Web.WebDocumentViewer;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Template.Infrastructure.Persistence;
using Template.Infrastructure.PredefinedReports;
using Template.Web.Models;

namespace Template.Web.Controllers;

public class ReportController : Controller
{
    private readonly ReportDbContext _context;

    public ReportController(ReportDbContext context)
    {
        _context = context;
    }

    public List<ReportListViewModel> GetReportList()
    {
        List<ReportListViewModel> reportsList = new();
        List<ReportListViewModel> predefinedReports = ReportsFactory.Reports.Select(m => new ReportListViewModel { Name = m.Key, DisplayName = m.Key, IsCustomReport = false }).ToList();
        List<ReportListViewModel> savedReports = _context.Reports.Select(m => new ReportListViewModel { Name = m.Name, DisplayName = m.DisplayName, IsCustomReport = true }).ToList();

        reportsList.AddRange(predefinedReports);
        reportsList.AddRange(savedReports);

        return reportsList;
    }

    [HttpDelete]
    public async Task<IActionResult> DeleteReportAsync(string reportName, CancellationToken cancellationToken)
    {
        var toDelete = _context.Reports.FirstOrDefault(m => m.Name == reportName);
        if (toDelete is null)
            return Conflict("Report not found!");

        _context.Remove(toDelete);
        await _context.SaveChangesAsync(cancellationToken).ConfigureAwait(true);

        return Ok();
    }

    public async Task<IActionResult> Designer(
            [FromServices] IReportDesignerClientSideModelGenerator clientSideModelGenerator,
            [FromQuery] string reportName)
    {
        ReportDesignerCustomModel model = new ReportDesignerCustomModel();
        model.ReportDesignerModel = await CreateDefaultReportDesignerModel(clientSideModelGenerator, reportName, null);
        return View(model);
    }

    public static Dictionary<string, object> GetAvailableDataSources()
    {
        var dataSources = new Dictionary<string, object>();
        return dataSources;
    }

    public static async Task<ReportDesignerModel> CreateDefaultReportDesignerModel(IReportDesignerClientSideModelGenerator clientSideModelGenerator, string reportName, XtraReport report)
    {
        reportName = string.IsNullOrEmpty(reportName) ? "TestReport" : reportName;
        var dataSources = GetAvailableDataSources();
        if (report != null)
        {
            return await clientSideModelGenerator.GetModelAsync(report, dataSources, ReportDesignerController.DefaultUri, WebDocumentViewerController.DefaultUri, QueryBuilderController.DefaultUri);
        }
        return await clientSideModelGenerator.GetModelAsync(reportName, dataSources, ReportDesignerController.DefaultUri, WebDocumentViewerController.DefaultUri, QueryBuilderController.DefaultUri);
    }

    public async Task<IActionResult> Viewer(
        [FromServices] IWebDocumentViewerClientSideModelGenerator clientSideModelGenerator,
        [FromQuery] string reportName)
    {
        var reportToOpen = string.IsNullOrEmpty(reportName) ? "TestReport" : reportName;
        var model = new ViewerModel
        {
            ViewerModelToBind = await clientSideModelGenerator.GetModelAsync(reportToOpen, WebDocumentViewerController.DefaultUri)
        };
        return View(model);
    }
}