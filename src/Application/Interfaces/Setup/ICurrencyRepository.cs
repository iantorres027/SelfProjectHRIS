using Template.Domain.Entities;

namespace Template.Application.Interfaces.Setup;

public interface ICurrencyRepository
{
    Task BatchDeleteAsync(int[] ids);
    Task<Currency> CreateAsync(Currency currency, int createdById);
    Task<List<Currency>> GetAll();
    Task<Currency?> GetById(int id);
    Task<Currency> SaveAsync(Currency currency, int modifiedById);
    Task<Currency> UpdateAsync(Currency currency, int modifiedById);
}
