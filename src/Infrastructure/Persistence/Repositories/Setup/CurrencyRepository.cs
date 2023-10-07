using Template.Application.Interfaces.Setup;
using Template.Domain.Entities;

namespace Template.Infrastructure.Persistence.Repositories.Setup
{
    public class CurrencyRepository : ICurrencyRepository
    {
        private readonly MNLTemplateDBContext _context;
        private readonly EfCoreHelper<Currency> _contextHelper;

        public CurrencyRepository(MNLTemplateDBContext context)
        {
            _context = context;
            _contextHelper = new EfCoreHelper<Currency>(context);
        }

        public async Task<Currency?> GetById(int id)
        {
            var result = await _contextHelper.GetByIdAsync(id);
            return result;
        }

        public async Task<List<Currency>> GetAll()
        {
            var result = await _contextHelper.GetAllAsync();
            return result;
        }

        public async Task<Currency> SaveAsync(Currency currency, int modifiedById)
        {
            if (currency.Id == 0)
                currency = await CreateAsync(currency, modifiedById);
            else
                currency = await UpdateAsync(currency, modifiedById);

            return currency;
        }

        public async Task<Currency> CreateAsync(Currency currency, int createdById)
        {
            currency.ModifiedById = createdById;
            currency.DateCreated = DateTime.UtcNow;
            var result = await _contextHelper.CreateAsync(currency, "ModifiedById", "DateModified");

            return result;
        }

        public async Task<Currency> UpdateAsync(Currency currency, int modifiedById)
        {
            currency.ModifiedById = modifiedById;
            currency.DateModified = DateTime.UtcNow;
            var result = await _contextHelper.CreateAsync(currency, "CreatedById", "DateCreated");

            return result;
        }

        public async Task BatchDeleteAsync(int[] ids)
        {
            var entities = _context.Currencies.Where(c => ids.Contains(c.Id));

            await _contextHelper.BatchDeleteAsync(entities);
        }
    }
}