using Template.Application.Interfaces.Setup.TaxRepository;
using Template.Domain.Entities;

namespace Template.Infrastructure.Persistence.Repositories.Setup.TaxRepository
{
    public class EwtTypeRepository : IEwtTypeRepository
    {
        private readonly MNLTemplateDBContext _context;
        private readonly EfCoreHelper<EwtType> _contextHelper;

        public EwtTypeRepository(MNLTemplateDBContext context)
        {
            _context = context;
            _contextHelper = new EfCoreHelper<EwtType>(context);
        }

        public async Task<EwtType?> GetById(int id)
        {
            var result = await _contextHelper.GetByIdAsync(id);
            return result;
        }

        public async Task<List<EwtType>> GetAll()
        {
            var result = await _contextHelper.GetAllAsync();
            return result;
        }

        public async Task<EwtType> SaveAsync(EwtType ewtType, int userId)
        {
            if (ewtType.Id == 0)
                ewtType = await CreateAsync(ewtType, userId);
            else
                ewtType = await UpdateAsync(ewtType, userId);

            return ewtType;
        }

        public async Task<EwtType> CreateAsync(EwtType ewtType, int userId)
        {
            ewtType.CreatedById = userId;
            ewtType.DateCreated = DateTime.UtcNow;
            var result = await _contextHelper.CreateAsync(ewtType, "ModifiedById", "DateModified");

            return result;
        }

        public async Task<EwtType> UpdateAsync(EwtType ewtType, int userId)
        {
            ewtType.ModifiedById = userId;
            ewtType.DateModified = DateTime.UtcNow;
            var result = await _contextHelper.CreateAsync(ewtType, "CreatedById", "DateCreated");

            return result;
        }

        public async Task BatchDeleteAsync(int[] ids)
        {
            var entities = _context.EwtTypes.Where(e => ids.Contains(e.Id));

            await _contextHelper.BatchDeleteAsync(entities);
        }
    }
}