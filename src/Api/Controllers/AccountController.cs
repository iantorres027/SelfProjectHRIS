using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using Template.Application.Interfaces.Setup.UserRepository;
using Template.Application.Services;
using Template.Domain.Dto.Authentication;
using Template.Domain.Entities;

namespace Template.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AccountController : ControllerBase
    {
        private readonly IJwtService _jwtService;
        private readonly IUserTokenRepository _userTokenRepo;

        public AccountController(IJwtService jwtService, IUserTokenRepository userTokenRepo)
        {
            _jwtService = jwtService;
            _userTokenRepo = userTokenRepo;
        }

        [HttpPost("[action]")]
        public async Task<IActionResult> AuthToken([FromBody] AuthRequest authRequest)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new AuthResponse { IsSuccess = false, Reason = "UserName and Password must be provided." });
            }

            var authResponse = await _jwtService.GetTokenAsync(authRequest);
            if (authResponse == null)
            {
                return Unauthorized();
            }

            return Ok(authResponse);
        }

        [HttpPost("[action]")]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new AuthResponse { IsSuccess = false, Reason = "Tokens must be provided" });
            }

            //string ipAddress = HttpContext.Connection.RemoteIpAddress.ToString();
            var token = GetJwtToken(request.ExpiredToken);
            var userRefreshToken = await _userTokenRepo.GetTokenAsync(request.ExpiredToken, request.RefreshToken);

            if (userRefreshToken == null)
            {
                return NotFound(new AuthResponse { IsSuccess = false, Reason = "Token not found!" });
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

        [Authorize]
        [HttpGet("[action]")]
        public async Task<IActionResult> GetUserTokens()
        {
            int userId = int.Parse(User?.Identity?.Name ?? "0");
            var data = await _userTokenRepo.GetByUserIdAsync(userId);

            return Ok(data);
        }

        private static AuthResponse ValidateDetails(JwtSecurityToken token, UserToken userRefreshToken)
        {
            if (userRefreshToken == null)
            {
                return new AuthResponse { IsSuccess = false, Reason = "Invalid Token Details." };
            }

            if (token.ValidTo > DateTime.UtcNow)
            {
                return new AuthResponse { IsSuccess = false, Reason = "Token not expired." };
            }

            if (userRefreshToken.ExpirationDate > DateTime.UtcNow)
            {
                return new AuthResponse { IsSuccess = false, Reason = "Refresh Token Expired" };
            }
            return new AuthResponse { IsSuccess = true };
        }

        private static JwtSecurityToken GetJwtToken(string expiredToken)
        {
            JwtSecurityTokenHandler tokenHandler = new();
            return tokenHandler.ReadJwtToken(expiredToken);
        }
    }
}