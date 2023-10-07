using Template.Domain.Entities;

namespace Template.Application.Interfaces.Setup;

public interface IVendorRepository
{
    Task BatchDeleteAsync(int[] ids);
    Task<Vendor> CreateAsync(Vendor vendor, int createdById);
    Task<List<Vendor>> GetAll();
    Task<Vendor?> GetById(int id);
    Task<Vendor> SaveAsync(Vendor vendor, int modifiedById);
    Task<Vendor> UpdateAsync(Vendor vendor, int modifiedById);
}