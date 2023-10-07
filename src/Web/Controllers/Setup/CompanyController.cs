using Microsoft.AspNetCore.Mvc;
using System.Threading;
using System.Threading.Tasks;
using Template.Application.Interfaces.Setup;

namespace Template.Web.Controllers.Setup;

public class CompanyController : Controller
{
    private readonly ICompanyRepository _companyRepo;

    public CompanyController(ICompanyRepository companyRepo)
    {
        _companyRepo = companyRepo;
    }

    public IActionResult Index()
    {
        return View();
    }

    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var companies = await _companyRepo.GetAll(cancellationToken);

        return Ok(companies);
    }
}