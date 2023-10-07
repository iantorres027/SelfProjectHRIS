using Template.Domain.Entities;
using Template.Domain.Dto.UserDto;

namespace Template.Application.Interfaces.Setup.UserRepository;

public interface IUserActivityRepository
{
    Task<UserActivity> CreateAsync(UserActivity userActivity);

    Task<List<UserActivityModel>> GetUserActivities(DateTime? dateFrom, DateTime? dateTo);

    Task<List<UserActivityModel>> GetUserActivitiesByUserId(int userId);

    Task<UserActivityModel?> GetUserActivityById(int id);
}