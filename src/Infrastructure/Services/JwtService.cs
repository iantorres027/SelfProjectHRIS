using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Template.Application.Interfaces.Setup.UserRepository;
using Template.Application.Services;
using Template.Domain.Dto.Authentication;
using Template.Domain.Entities;
using Template.Infrastructure.Persistence.Configuration;

namespace Template.Infrastructure.Services;

public class JwtService : IJwtService
{
    private readonly IOptions<JWTConfiguration> _jwtConfig;
    private readonly Application.Services.IAuthenticationService _authenticationService;
    private readonly IUserRepository _userRepo;
    private readonly IUserTokenRepository _userTokenRepo;

    public JwtService(
        IOptions<JWTConfiguration> jwtConfig,
        Application.Services.IAuthenticationService authenticationService,
        IUserRepository userRepo,
        IUserTokenRepository userTokenRepo)
    {
        _jwtConfig = jwtConfig;
        _authenticationService = authenticationService;
        _userRepo = userRepo;
        _userTokenRepo = userTokenRepo;
    }

    public async Task<AuthResponse> GetRefreshTokenAsync(int userId)
    {
        var refreshToken = GenerateRefreshToken();
        var accessToken = GenerateToken(userId);
        return await SaveTokenDetails(userId, accessToken, refreshToken);
    }

    public async Task<AuthResponse?> GetTokenAsync(AuthRequest authRequest)
    {
        var user = await _authenticationService.Authenticate(authRequest);
        if (user == null)
        {
            return default;
        }
        string tokenString = GenerateToken(user.Id);
        string refreshToken = GenerateRefreshToken();
        return await SaveTokenDetails(user.Id, tokenString, refreshToken);
    }

    public async Task<User> Authenticate(string token)
    {
        // Find the user by the provided token
        var userToken = await _userTokenRepo.GetTokenAsync(token)
            ?? throw new Exception("Token not found.");

        var user = await _userRepo.GetByIdAsync(userToken.UserId)
          ?? throw new Exception("User not found!");

        await _authenticationService.UserLockedStatus(user.UserName);

        var isValidToken = await IsTokenValid(userToken.Token);

        if (!isValidToken)
        {
            await _authenticationService.UpdateFailedAttempts(user.UserName);
            await _authenticationService.InsertUserActivity(user.Id, 1, "Failed token Login");
            throw new Exception("Invalid token");
        }

        await _authenticationService.InsertUserActivity(user.Id, 1, "Successful token Login");
        return user;
    }

    private async Task<AuthResponse> SaveTokenDetails(int userId, string tokenString, string refreshToken)
    {
        var userRefreshToken = new UserToken
        {
            CreatedDate = DateTime.UtcNow,
            ExpirationDate = DateTime.UtcNow.AddDays(1),
            IsInvalidated = false,
            RefreshToken = refreshToken,
            Token = tokenString,
            UserId = userId
        };
        await _userTokenRepo.CreateAsync(userRefreshToken);
        return new AuthResponse { Token = tokenString, RefreshToken = refreshToken, IsSuccess = true };
    }

    private static string GenerateRefreshToken()
    {
        var byteArray = new byte[64];
        using var randomNumberGenerator = RandomNumberGenerator.Create();
        randomNumberGenerator.GetBytes(byteArray);

        return Convert.ToBase64String(byteArray);
    }

    private string GenerateToken(int userId)
    {
        var jwtKey = _jwtConfig.Value.SecretKey;
        var keyBytes = Encoding.ASCII.GetBytes(jwtKey);

        var tokenHandler = new JwtSecurityTokenHandler();

        var descriptor = new SecurityTokenDescriptor()
        {
            Subject = new ClaimsIdentity(new Claim[]
            {
                new Claim(ClaimTypes.Name, userId.ToString()),
                new Claim(ClaimTypes.NameIdentifier, userId.ToString())
            }),
            Expires = DateTime.UtcNow.AddDays(1),

            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(keyBytes), SecurityAlgorithms.HmacSha256)
        };

        var token = tokenHandler.CreateToken(descriptor);
        string tokenString = tokenHandler.WriteToken(token);
        return tokenString;
    }

    public async Task<bool> IsTokenValid(string accessToken)
    {
        var data = await _userTokenRepo.GetTokenAsync(accessToken);
        var isValid = data != null;
        return isValid;
    }
}