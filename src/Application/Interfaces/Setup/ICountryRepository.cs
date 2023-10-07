using Template.Domain.Entities;

namespace Template.Application.Interfaces.Setup;

public interface ICountryRepository
{
    Task BatchDeleteAsync(int[] ids);
    Task<Country> CreateAsync(Country country, int createdById);
    Task<List<Country>> GetAll();
    Task<Country?> GetById(int id);
    Task<Country> SaveAsync(Country country, int modifiedById);
    Task<Country> UpdateAsync(Country country, int modifiedById);
}