using Template.Application.Interfaces.Setup;
using Template.Domain.Entities;

namespace Template.Infrastructure.Persistence.Repositories.Setup
{
    public class VendorRepository : IVendorRepository
    {
        private readonly MNLTemplateDBContext _context;
        private readonly EfCoreHelper<Vendor> _contextHelper;

        public VendorRepository(MNLTemplateDBContext context)
        {
            _context = context;
            _contextHelper = new EfCoreHelper<Vendor>(context);
        }

        public async Task<Vendor?> GetById(int id)
        {
            var result = await _contextHelper.GetByIdAsync(id);
            return result;
        }

        public async Task<List<Vendor>> GetAll()
        {
            var result = await _contextHelper.GetAllAsync();
            return result;
        }

        public async Task<Vendor> SaveAsync(Vendor vendor, int modifiedById)
        {
            if (vendor.Id == 0)
                vendor = await CreateAsync(vendor, modifiedById);
            else
                vendor = await UpdateAsync(vendor, modifiedById);

            return vendor;
        }

        public async Task<Vendor> CreateAsync(Vendor vendor, int createdById)
        {
            vendor.CreatedById = createdById;
            vendor.DateCreated = DateTime.UtcNow;
            var result = await _contextHelper.CreateAsync(vendor, "ModifiedById", "DateModified");

            return result;
        }

        public async Task<Vendor> UpdateAsync(Vendor vendor, int modifiedById)
        {
            vendor.ModifiedById = modifiedById;
            vendor.DateModified = DateTime.UtcNow;
            var result = await _contextHelper.CreateAsync(vendor, "CreatedById", "DateCreated");

            return result;
        }

        public async Task BatchDeleteAsync(int[] ids)
        {
            var entities = _context.Vendors.Where(v => ids.Contains(v.Id));

            await _contextHelper.BatchDeleteAsync(entities);
        }
    }
}