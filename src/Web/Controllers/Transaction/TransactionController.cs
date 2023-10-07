using Microsoft.AspNetCore.Mvc;

namespace Template.Web.Controllers.Transaction;

public class TransactionController : Controller
{
    public IActionResult Index()
    {
        return View();
    }

    public IActionResult Create()
    {
        return View();
    }

    public IActionResult Detail()
    {
        return View();
    }
}