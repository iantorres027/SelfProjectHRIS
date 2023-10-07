using Template.Domain.Dto.UserDto;

namespace Template.Application.Services;

public interface ICurrentUserService
{
    int GetCurrentUserId();

    Task<UserModel?> GetUserInfo();
}