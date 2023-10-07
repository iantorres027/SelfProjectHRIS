using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Template.Application.Interfaces.Setup.UserRepository;
using Template.Application.Services;
using Template.Domain.Dto.UserDto;
using Template.Domain.Entities;

namespace Template.Infrastructure.Persistence.Repositories.Setup.UserRepository;

public class UserRepository : IUserRepository
{
    private readonly MNLTemplateDBContext _context;
    private readonly EfCoreHelper<User> _contextHelper;
    private readonly IUserApproverRepository _userApproverRepo;
    private readonly ISQLDatabaseService _db;
    private readonly IMapper _mapper;

    public UserRepository(
        MNLTemplateDBContext context,
        ISQLDatabaseService db,
        IMapper mapper,
        IUserApproverRepository userApproverRepo)
    {
        _context = context;
        _contextHelper = new EfCoreHelper<User>(context);
        _db = db;
        _mapper = mapper;
        _userApproverRepo = userApproverRepo;
    }

    public async Task<User?> GetByIdAsync(int id) =>
        await _contextHelper.GetByIdAsync(id);

    public async Task<User?> GetByUserNameAsync(string userName) =>
        await _context.Users.FirstOrDefaultAsync(u => u.UserName == userName);

    public async Task<List<User>> GetAllAsync() =>
        await _contextHelper.GetAllAsync();

    public async Task<UserModel?> GetUserByIdAsync(int id) =>
        await _db.LoadSingleAsync<UserModel, dynamic>("spUser_Get", new { id });

    public async Task<List<UserModel>> GetUsersAsync() =>
        (await _db.LoadDataAsync<UserModel, dynamic>("spUser_GetAll", new { })).ToList();

    public async Task<List<UserModel>> GetUserByUserRoleIdAsync(int userRoleId) =>
        (await _db.LoadDataAsync<UserModel, dynamic>("spUser_GetByUserRoleId", new { userRoleId })).ToList();

    public async Task SaveUserAsync(UserModel user, List<UserApproverModel> userApprovers, int userId)
    {
        if (user == null) return;

        var _user = _mapper.Map<User>(user);

        await ValidateUserAsync(_user);

        if (_user.Id == 0) _user = await CreateAsync(_user, userId);
        else _user = await UpdateAsync(_user, userId);

        var count = 1;
        foreach (var userApprover in userApprovers)
        {
            userApprover.Level = count;
            userApprover.UserId = _user.Id;
            var _userApprover = _mapper.Map<UserApprover>(userApprover);

            if (userApprover.Id == 0) await _userApproverRepo.CreateAsync(_userApprover, userId);
            else await _userApproverRepo.UpdateAsync(_userApprover, userId);

            count++;
        }

        var userApproverIds = userApprovers.Where(m => m.Id != 0).Select(m => m.Id).ToList();
        var toDelete = await _context.UserApprovers
            .Where(m => m.UserId == user.Id && !userApproverIds.Contains(m.Id))
            .Select(m => m.Id)
            .ToArrayAsync();

        await _userApproverRepo.BatchDeleteAsync(toDelete);
    }

    public async Task<User> CreateAsync(User user, int userId)
    {
        user.CreatedById = userId;
        user.DateCreated = DateTime.Now;

        user = await _contextHelper.CreateAsync(user, "ModifiedById", "DateModified");

        return user;
    }

    public async Task<User> UpdateAsync(User user, int userId)
    {
        string[] excludedProperties = new string[]
        {
            "LastFailedAttempt", "LockedTime" , "FailedAttempts" ,
            "LastOnlineTime", "IsOnline" , "CreatedById" ,
            "DateCreated"
        };

        if (!string.IsNullOrWhiteSpace(user.ProfilePicture))
            excludedProperties.Append("ProfilePicture");

        if (!string.IsNullOrWhiteSpace(user.Signature))
            excludedProperties.Append("Signature");

        user.ModifiedById = userId;
        user.DateModified = DateTime.UtcNow;

        user = await _contextHelper.UpdateAsync(user, excludedProperties);

        return user;
    }

    public async Task BatchDeleteAsync(int[] ids)
    {
        var entities = await _context.Users.Where(m => ids.Contains(m.Id)).ToListAsync();

        if (entities is not null)
            await _contextHelper.BatchDeleteAsync(entities);
    }

    private async Task ValidateUserAsync(User user)
    {
        if (user.Id == 0)
        {
            var userNameExists = await _context.Users.FindAsync(user.UserName);
            if (userNameExists is not null)
                throw new Exception("Username already exists!");
        }
        else
        {
            var userNameExists = await _context.Users.FirstOrDefaultAsync(m => m.Id != user.Id && m.UserName == user.UserName);

            if (userNameExists is not null)
                throw new Exception("Username already exists!");
        }
    }
}