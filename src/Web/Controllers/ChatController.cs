using Microsoft.AspNetCore.Mvc;

namespace Template.Web.Controllers;

public class ChatController : Controller
{
    public IActionResult Index()
    {
        return View();
    }
}