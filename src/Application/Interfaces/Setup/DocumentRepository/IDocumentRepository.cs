using Template.Domain.Entities;

namespace Template.Application.Interfaces.Setup.DocumentRepository;

public interface IDocumentRepository
{
    Task DeleteAsync(Document document);

    Task<List<Document>> GetByIds(int[] ids);

    Task BatchDeleteAsync(int[] ids);

    Task<Document> CreateAsync(Document document, int createdById);

    Task DeleteAsync(int id);

    Task<List<Document>> GetAll();

    Task<Document?> GetById(int id);

    Task<Document> SaveAsync(Document document, int modifiedById);

    Task<Document> UpdateAsync(Document document, int modifiedById);
}