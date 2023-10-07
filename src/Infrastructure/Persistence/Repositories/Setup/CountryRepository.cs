using Template.Application.Interfaces.Setup;
using Template.Domain.Entities;

namespace Template.Infrastructure.Persistence.Repositories.Setup
{
    public class CountryRepository : ICountryRepository
    {
        private readonly MNLTemplateDBContext _context;
        private readonly EfCoreHelper<Country> _contextHelper;

        public CountryRepository(MNLTemplateDBContext context)
        {
            _context = context;
            _contextHelper = new EfCoreHelper<Country>(context);
        }

        public async Task<Country?> GetById(int id)
        {
            var result = await _contextHelper.GetByIdAsync(id);
            return result;
        }

        public async Task<List<Country>> GetAll()
        {
            var result = await _contextHelper.GetAllAsync();
            return result;
        }

        public async Task<Country> SaveAsync(Country country, int modifiedById)
        {
            if (country.ID == 0)
                country = await CreateAsync(country, modifiedById);
            else
                country = await UpdateAsync(country, modifiedById);

            return country;
        }

        public async Task<Country> CreateAsync(Country country, int createdById)
        {
            country.CreatedById = createdById;
            country.DateCreated = DateTime.UtcNow;
            var result = await _contextHelper.CreateAsync(country, "ModifiedById", "DateModified");

            return result;
        }

        public async Task<Country> UpdateAsync(Country country, int modifiedById)
        {
            country.ModifiedById = modifiedById;
            country.DateModified = DateTime.UtcNow;
            var result = await _contextHelper.CreateAsync(country, "CreatedById", "DateCreated");

            return result;
        }

        public async Task BatchDeleteAsync(int[] ids)
        {
            var entities = _context.Countries.Where(c => ids.Contains(c.ID));

            await _contextHelper.BatchDeleteAsync(entities);
        }
    }
}