using Template.Application.Interfaces.Setup.UserRepository;
using Template.Application.Services;
using Template.Domain.Dto.UserDto;
using Template.Domain.Entities;

namespace Template.Infrastructure.Persistence.Repositories.Setup.UserRepository;

public class UserActivityRepository : IUserActivityRepository
{
    private readonly MNLTemplateDBContext _context;
    private readonly EfCoreHelper<UserActivity> _contextHelper;
    private readonly ISQLDatabaseService _db;

    public UserActivityRepository(
        MNLTemplateDBContext context,
        ISQLDatabaseService db)
    {
        _context = context;
        _contextHelper = new EfCoreHelper<UserActivity>(context);
        _db = db;
    }

    public async Task<List<UserActivityModel>> GetUserActivities(DateTime? dateFrom, DateTime? dateTo) =>
        (await _db.LoadDataAsync<UserActivityModel, dynamic>("spUserActivity_Inq", new { dateFrom, dateTo })).ToList();

    public async Task<UserActivityModel?> GetUserActivityById(int id) =>
        await _db.LoadSingleAsync<UserActivityModel, dynamic>("spUserActivity_GetId", new { id });

    public async Task<List<UserActivityModel>> GetUserActivitiesByUserId(int userId) =>
        (await _db.LoadDataAsync<UserActivityModel, dynamic>("spUserActivity_GetByUserId", new { userId })).ToList();

    public async Task<UserActivity> CreateAsync(UserActivity userActivity)
    {
        //Save Activity
        userActivity = await _contextHelper.CreateAsync(userActivity);
        return userActivity;
    }
}