using Template.Domain.Entities;

namespace Template.Application.Interfaces.Setup.TaxRepository;

public interface IEwtTypeRepository
{
    Task BatchDeleteAsync(int[] ids);
    Task<EwtType> CreateAsync(EwtType ewtType, int userId);
    Task<List<EwtType>> GetAll();
    Task<EwtType?> GetById(int id);
    Task<EwtType> SaveAsync(EwtType ewtType, int userId);
    Task<EwtType> UpdateAsync(EwtType ewtType, int userId);
}
