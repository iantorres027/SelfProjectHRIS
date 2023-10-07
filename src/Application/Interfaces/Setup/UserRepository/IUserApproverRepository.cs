using Template.Domain.Entities;

namespace Template.Application.Interfaces.Setup.UserRepository;

public interface IUserApproverRepository
{
    Task BatchDeleteAsync(int[] ids);

    Task<UserApprover> CreateAsync(UserApprover userApprover, int userId);

    Task<UserApprover> UpdateAsync(UserApprover userApprover, int userId);
}