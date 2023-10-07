using Template.Application.Interfaces.Setup.TaxRepository;
using Template.Domain.Entities;

namespace Template.Infrastructure.Persistence.Repositories.Setup.TaxRepository
{
    public class VatTypeRepository : IVatTypeRepository
    {
        private readonly MNLTemplateDBContext _context;
        private readonly EfCoreHelper<VatType> _contextHelper;

        public VatTypeRepository(MNLTemplateDBContext context)
        {
            _context = context;
            _contextHelper = new EfCoreHelper<VatType>(context);
        }

        public async Task<VatType?> GetById(int id)
        {
            var result = await _contextHelper.GetByIdAsync(id);
            return result;
        }

        public async Task<List<VatType>> GetAll()
        {
            var result = await _contextHelper.GetAllAsync();
            return result;
        }

        public async Task<VatType> SaveAsync(VatType vatType, int userId)
        {
            if (vatType.Id == 0)
                vatType = await CreateAsync(vatType, userId);
            else
                vatType = await UpdateAsync(vatType, userId);

            return vatType;
        }

        public async Task<VatType> CreateAsync(VatType vatType, int userId)
        {
            vatType.CreatedById = userId;
            vatType.DateCreated = DateTime.UtcNow;
            var result = await _contextHelper.CreateAsync(vatType, "ModifiedByID", "DateModified");

            return result;
        }

        public async Task<VatType> UpdateAsync(VatType vatType, int userId)
        {
            vatType.ModifiedById = userId;
            vatType.DateModified = DateTime.UtcNow;
            var result = await _contextHelper.CreateAsync(vatType, "CreatedByID", "DateCreated");

            return result;
        }

        public async Task BatchDeleteAsync(int[] ids)
        {
            var entities = _context.VatTypes.Where(v => ids.Contains(v.Id));

            await _contextHelper.BatchDeleteAsync(entities);
        }
    }
}