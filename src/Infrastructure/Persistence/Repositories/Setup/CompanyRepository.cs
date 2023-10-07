using Template.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Template.Application.Interfaces.Setup;

namespace Template.Infrastructure.Persistence.Repositories.Setup;

public class CompanyRepository : ICompanyRepository
{
    private readonly MNLTemplateDBContext _context;

    public CompanyRepository(MNLTemplateDBContext context)
    {
        _context = context;
    }

    public async Task<List<Company>> GetAll(CancellationToken cancellationToken = default)
    {
        var result = await _context.Companies.ToListAsync(cancellationToken: cancellationToken);

        return result;
    }
}