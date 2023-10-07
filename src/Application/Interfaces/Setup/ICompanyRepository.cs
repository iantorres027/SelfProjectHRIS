using Template.Domain.Entities;

namespace Template.Application.Interfaces.Setup;

public interface ICompanyRepository
{
    Task<List<Company>> GetAll(CancellationToken cancellationToken = default);
}