using Template.Domain.Dto.UserDto;
using Template.Domain.Entities;

namespace Template.Application.Interfaces.Setup.UserRepository;

public interface IUserRepository
{
    Task BatchDeleteAsync(int[] ids);

    Task<User> CreateAsync(User user, int userId);

    Task<List<User>> GetAllAsync();

    Task<User?> GetByIdAsync(int id);

    Task<User?> GetByUserNameAsync(string userName);

    Task<UserModel?> GetUserByIdAsync(int id);

    Task<List<UserModel>> GetUserByUserRoleIdAsync(int userRoleId);

    Task<List<UserModel>> GetUsersAsync();

    Task SaveUserAsync(UserModel user, List<UserApproverModel> userApprovers, int userId);

    Task<User> UpdateAsync(User user, int userId);
}