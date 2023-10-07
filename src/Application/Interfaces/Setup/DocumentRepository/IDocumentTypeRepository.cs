using Template.Domain.Entities;

namespace Template.Application.Interfaces.Setup.DocumentRepository;

public interface IDocumentTypeRepository
{
    Task BatchDeleteAsync(int[] ids);

    Task<DocumentType> CreateAsync(DocumentType documentType, int createdById);

    Task<List<DocumentType>> GetAll();

    Task<DocumentType?> GetById(int id);

    Task<DocumentType> SaveAsync(DocumentType documentType, int modifiedById);

    Task<DocumentType> UpdateAsync(DocumentType documentType, int modifiedById);
}