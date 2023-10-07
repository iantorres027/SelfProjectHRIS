using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Template.Application.Interfaces.Setup.UserRepository;
using Template.Application.Services;
using Template.Domain.Dto.Authentication;
using Template.Domain.Dto.UserDto;
using Template.Domain.Entities;
using Template.Infrastructure.Hubs;
using Template.Web.Models;

namespace Template.Web.Controllers.Authentication;

[Authorize]
public class AccountController : Controller
{
    private readonly Application.Services.IAuthenticationService _authService;
    private readonly IHubContext<AuthenticationHub> _hubContext;
    private readonly IJwtService _jwtService;
    private readonly IUserTokenRepository _userTokenRepo;

    public AccountController(
        Application.Services.IAuthenticationService authService,
        IHubContext<AuthenticationHub> hubContext,
        IJwtService jwtService,
        IUserTokenRepository userTokenRepo)
    {
        _authService = authService;
        _hubContext = hubContext;
        _jwtService = jwtService;
        _userTokenRepo = userTokenRepo;
    }

    [AllowAnonymous]
    public IActionResult Login(string returnUrl)
    {
        try
        {
            if (User.Identity != null && User.Identity.IsAuthenticated)
            {
                return RedirectToLocal(returnUrl);
            }

            var model = new LoginViewModel { ReturnUrl = returnUrl };

            return View(model);
        }
        catch (Exception ex)
        {
            return View("error", new ErrorViewModel
            {
                Message = ex.Message,
                Exception = ex
            });
        }
    }

    [AllowAnonymous]
    public async Task<IActionResult> Register(UserModel user)
    {
        try
        {
            // Verification
            if (!ModelState.IsValid)
            {
                var validationError = ModelState
                    .Where(x => x.Value.Errors.Any())
                    .Select(x => new { x.Key, x.Value.Errors });

                return Conflict(validationError);
            }

            var userData = await _authService.RegisterUser(user);

            return View(userData);
        }
        catch (Exception ex) { return View("error", new ErrorViewModel { Message = ex.Message, Exception = ex }); }
    }

    [AllowAnonymous]
    public async Task<IActionResult> LogOffAsync()
    {
        try
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            await _hubContext.Clients.All.SendAsync("CheckIfAuthenticated");
        }
        catch (Exception)
        {
            throw;
        }
        return RedirectToAction("Login", "Account");
    }

    public IActionResult MyProfile()
    {
        return View();
    }

    #region API

    [AllowAnonymous]
    [HttpPost]
    public async Task<IActionResult> LoginAsync(LoginViewModel model, CancellationToken cancellationToken = default)
    {
        try
        {
            // Verification.
            if (!ModelState.IsValid)
            {
                return BadRequest("Invalid Request!");
            }

            AuthRequest authRequest = new()
            {
                UserName = model.UserName,
                Password = model.Password,
                CompanyId = model.CompanyId
            };
            var result = await _authService.Authenticate(authRequest);

            model.Id = result.Id;

            await SignInAsync(model);

            return Ok();
        }
        catch (Exception ex) { return BadRequest(ex.Message); }
    }

    [HttpGet("{action}/{token}")]
    public async Task<IActionResult> LoginTokenAsync(string token)
    {
        try
        {
            if (string.IsNullOrEmpty(token))
            {
                return BadRequest(new AuthResponse { IsSuccess = false, Reason = "Token must be provided." });
            }

            var result = await _jwtService.Authenticate(token);
            if (result == null)
            {
                return BadRequest(new AuthResponse { IsSuccess = false, Reason = "User not found." });
            }

            LoginViewModel loginViewModel = new()
            {
                UserName = result.UserName,
                CompanyId = 1
            };

            await SignInAsync(loginViewModel);
            return RedirectToAction("Index", "Home");
        }
        catch (Exception) { throw; }
    }

    [AllowAnonymous]
    [HttpPost]
    public async Task<IActionResult> AuthToken([FromBody] AuthRequest authRequest)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new AuthResponse
            {
                IsSuccess = false,
                Reason = "UserName and Password must be provided."
            });
        }

        var authResponse = await _jwtService.GetTokenAsync(authRequest);
        if (authResponse == null)
        {
            return Unauthorized();
        }

        return Ok(authResponse);
    }

    [HttpPost]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new AuthResponse
            {
                IsSuccess = false,
                Reason = "Tokens must be provided"
            });
        }

        //string ipAddress = HttpContext.Connection.RemoteIpAddress.ToString();
        var token = GetJwtToken(request.ExpiredToken);
        var userRefreshToken = await _userTokenRepo.GetTokenAsync(request.ExpiredToken, request.RefreshToken);

        if (userRefreshToken == null)
        {
            return NotFound(new AuthResponse
            {
                IsSuccess = false,
                Reason = "Token not found!"
            });
        }

        AuthResponse response = ValidateDetails(token, userRefreshToken);

        if (!response.IsSuccess)
        {
            return BadRequest(response);
        }

        userRefreshToken.IsInvalidated = true;
        await _userTokenRepo.UpdateAsync(userRefreshToken);

        var userName = token.Claims.FirstOrDefault(x => x.Type == JwtRegisteredClaimNames.NameId)?.Value;
        var authResponse = await _jwtService.GetRefreshTokenAsync(userRefreshToken.UserId);

        return Ok(authResponse);
    }

    #endregion API

    #region Private Helpers

    private static AuthResponse ValidateDetails(JwtSecurityToken token, UserToken userRefreshToken)
    {
        if (userRefreshToken == null)
        {
            return new AuthResponse
            {
                IsSuccess = false,
                Reason = "Invalid Token Details."
            };
        }

        if (token.ValidTo > DateTime.UtcNow)
        {
            return new AuthResponse
            {
                IsSuccess = false,
                Reason = "Token not expired."
            };
        }

        if (userRefreshToken.ExpirationDate > DateTime.UtcNow)
        {
            return new AuthResponse
            {
                IsSuccess = false,
                Reason = "Refresh Token Expired"
            };
        }
        return new AuthResponse
        {
            IsSuccess = true
        };
    }

    private static JwtSecurityToken GetJwtToken(string expiredToken)
    {
        JwtSecurityTokenHandler tokenHandler = new();
        return tokenHandler.ReadJwtToken(expiredToken);
    }

    private async Task SignInAsync(LoginViewModel model)
    {
        try
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, model.Id.ToString()),
                new Claim(ClaimTypes.Role, model.Id.ToString()),
                new Claim("Company", model.CompanyId.ToString())
            };

            var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);

            //await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            var authProperties = new AuthenticationProperties
            {
                ExpiresUtc = DateTimeOffset.UtcNow.AddMinutes(30),
                IsPersistent = model.RememberMe
            };

            await HttpContext.SignInAsync(
                CookieAuthenticationDefaults.AuthenticationScheme,
                new ClaimsPrincipal(claimsIdentity),
                authProperties);
        }
        catch (Exception)
        {
            throw;
        }
    }

    private IActionResult RedirectToLocal(string returnUrl)
    {
        try
        {
            if (Url.IsLocalUrl(returnUrl))
            {
                return Redirect(returnUrl);
            }
        }
        catch (Exception)
        {
            throw;
        }
        return RedirectToAction("Index", "Home");
    }

    #endregion Private Helpers
}