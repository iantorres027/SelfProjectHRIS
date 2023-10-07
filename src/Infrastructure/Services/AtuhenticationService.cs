using AutoMapper;
using Microsoft.AspNetCore.Cryptography.KeyDerivation;
using Microsoft.Extensions.Options;
using Shyjus.BrowserDetection;
using System.Text;
using Template.Application.Interfaces.Setup.UserRepository;
using Template.Application.Services;
using Template.Domain.Dto.Authentication;
using Template.Domain.Dto.UserDto;
using Template.Domain.Entities;
using Template.Infrastructure.Persistence.Configuration;

namespace Template.Infrastructure.Services;

public class AuthenticationService : IAuthenticationService
{
    private readonly IBrowserDetector _browserDetector;
    private readonly IMapper _mapper;
    private readonly IOptions<AuthenticationConfig> _authenticationConfig;
    private readonly IUserActivityRepository _userActivityRepository;
    private readonly IUserRepository _userRepository;

    public AuthenticationService(
        IUserRepository userRepository,
        IOptions<AuthenticationConfig> authenticationConfig,
        IMapper mapper,
        IUserActivityRepository userActivityRepository,
        IBrowserDetector browserDetector)
    {
        _userRepository = userRepository;
        _authenticationConfig = authenticationConfig;
        _mapper = mapper;
        _userActivityRepository = userActivityRepository;
        _browserDetector = browserDetector;
    }

    public async Task<User> RegisterUser(UserModel user)
    {
        // Check if the user already exists
        var existingUser = await _userRepository.GetByUserNameAsync(user.UserName);
        if (existingUser != null)
        {
            throw new Exception("User with the same username already exists");
        }

        var userRepo = _mapper.Map<User>(user);

        // Create a new user entity
        userRepo.PasswordSalt = _authenticationConfig.Value.PasswordSalt;
        userRepo.Password = HashPassword(userRepo.Password);// Hash the password before storing it

        // Save the user in the repository
        await _userRepository.CreateAsync(userRepo, 0);

        return userRepo;
    }

    public async Task<User> Authenticate(AuthRequest authRequest)
    {
        // Find the user by the provided username
        var user = await _userRepository.GetByUserNameAsync(authRequest.UserName)
            ?? throw new Exception("Username not found.");

        await UserLockedStatus(user.UserName);

        // Verify the password by comparing the hashed password
        if (!VerifyPassword(authRequest.Password, user.Password))
        {
            await UpdateFailedAttempts(user.UserName);
            await InsertUserActivity(user.Id, authRequest.CompanyId, "Failed Login");
            throw new Exception("Invalid Username/Password");
        }

        await InsertUserActivity(user.Id, authRequest.CompanyId, "Successful Login");
        return user;
    }

    public string HashPassword(string password)
    {
        byte[] salt = Encoding.ASCII.GetBytes(_authenticationConfig.Value.PasswordSalt);
        string hashedPassword = GenerateHashedPassword(password, salt);
        return hashedPassword;
    }

    private bool VerifyPassword(string password, string hashedPassword)
    {
        byte[] salt = Encoding.ASCII.GetBytes(_authenticationConfig.Value.PasswordSalt);
        string hashedInput = GenerateHashedPassword(password, salt);
        return hashedInput == hashedPassword;
    }

    private static string GenerateHashedPassword(string password, byte[] salt)
    {
        string hashedPassword = Convert.ToBase64String(KeyDerivation.Pbkdf2(
            password: password,
            salt: salt,
            prf: KeyDerivationPrf.HMACSHA512,
            iterationCount: 10000,
            numBytesRequested: 256 / 8));

        return hashedPassword;
    }

    public async Task UpdateUserRefreshToken(int userId, string refreshToken, DateTime refreshTokenExpiry)
    {
        var user = await _userRepository.GetByIdAsync(userId)
            ?? throw new Exception("User not found!");

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = refreshTokenExpiry;

        await _userRepository.UpdateAsync(user, userId);
    }

    public async Task UpdateOnlineStatus(int id, bool status)
    {
        var user = await _userRepository.GetByIdAsync(id);

        if (user is null)
        {
            return;
        }

        user.IsOnline = status;
        user.LastOnlineTime = DateTime.Now;

        await _userRepository.UpdateAsync(user, id);
    }

    public async Task<UserModel> UpdateFailedAttempts(string userName)
    {
        var userModel = new UserModel
        {
            Id = 0,
            Message = "User not found"
        };

        var user = await _userRepository.GetByUserNameAsync(userName);

        if (user is null)
        {
            return userModel;
        }

        user.FailedAttempts++;

        if (user.LastFailedAttempt is not null)
        {
            var totalMinutes = Convert.ToInt32((DateTime.UtcNow - user.LastFailedAttempt.GetValueOrDefault()).TotalMinutes);
            if (totalMinutes > 5)
            {
                user.FailedAttempts = 1;
            }
        }

        user.LastFailedAttempt = DateTime.UtcNow;

        if (user.FailedAttempts == 3)
        {
            user.LockedTime = DateTime.UtcNow;
        }

        user = await _userRepository.UpdateAsync(user, user.Id);

        userModel.Id = user.Id;
        userModel.UserName = user.UserName;

        userModel.Message = user.FailedAttempts < 3
           ? $"LOG IN FAILED: attempt {user.FailedAttempts}/3"
           : "Account is LOCKED due to 3 consecutive failed Log In attempts. Your account will automatically unlock after 30 minutes or contact your System Administrator.";

        return userModel;
    }

    public async Task UnlockUser(int id)
    {
        var user = await _userRepository.GetByIdAsync(id);

        if (user is null)
        {
            return;
        }

        user.LockedTime = null;
        user.FailedAttempts = 0;

        await _userRepository.UpdateAsync(user, id);
    }

    public async Task UserLockedStatus(string userName)
    {
        try
        {
            var user = await _userRepository.GetByUserNameAsync(userName);

            if (user is null)
            {
                return;
            }
            if (user.LockedTime is null)
            {
                return;
            }

            var totalMinutes = Convert.ToInt32((DateTime.Now - user.LockedTime.GetValueOrDefault()).TotalMinutes);

            if (totalMinutes < 30)
            {
                throw new Exception("Account is locked due to 3 consecutive failed login attempts, your account will automatically unlock after " + (30 - totalMinutes) + " minutes");
            }
            else
            {
                await UnlockUser(user.Id);
            }
        }
        catch (Exception)
        {
            throw;
        }
    }

    public async Task InsertUserActivity(int userId, int companyId, string action)
    {
        //Save Activity
        UserActivity userActivity = new()
        {
            Date = DateTime.Now,
            UserId = userId,
            CompanyId = companyId,
            Browser = _browserDetector.Browser?.Name + " " + _browserDetector.Browser?.Version,
            Action = action,
            Device = _browserDetector.Browser?.DeviceType + " (" + _browserDetector.Browser?.OS + ")",
            ActivityTypeId = 1
        };

        await _userActivityRepository.CreateAsync(userActivity);
    }
}