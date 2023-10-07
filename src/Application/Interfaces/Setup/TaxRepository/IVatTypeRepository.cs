using Template.Domain.Entities;

namespace Template.Application.Interfaces.Setup.TaxRepository;

public interface IVatTypeRepository
{
    Task BatchDeleteAsync(int[] ids);
    Task<VatType> CreateAsync(VatType vatType, int userId);
    Task<List<VatType>> GetAll();
    Task<VatType?> GetById(int id);
    Task<VatType> SaveAsync(VatType vatType, int userId);
    Task<VatType> UpdateAsync(VatType vatType, int userId);
}