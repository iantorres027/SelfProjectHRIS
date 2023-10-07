using Template.Application.Interfaces.Setup.DocumentRepository;
using Template.Domain.Entities;

namespace Template.Infrastructure.Persistence.Repositories.Setup.DocumentRepository
{
    public class DocumentTypeRepository : IDocumentTypeRepository
    {
        private readonly MNLTemplateDBContext _context;
        private readonly EfCoreHelper<DocumentType> _contextHelper;

        public DocumentTypeRepository(MNLTemplateDBContext context)
        {
            _context = context;
            _contextHelper = new EfCoreHelper<DocumentType>(context);
        }

        public async Task<DocumentType?> GetById(int id)
        {
            var result = await _contextHelper.GetByIdAsync(id);
            return result;
        }

        public async Task<List<DocumentType>> GetAll()
        {
            var result = await _contextHelper.GetAllAsync();
            return result;
        }

        public async Task<DocumentType> SaveAsync(DocumentType documentType, int modifiedById)
        {
            if (documentType.Id == 0)
                documentType = await CreateAsync(documentType, modifiedById);
            else
                documentType = await UpdateAsync(documentType, modifiedById);

            return documentType;
        }

        public async Task<DocumentType> CreateAsync(DocumentType documentType, int createdById)
        {
            documentType.CreatedById = createdById;
            documentType.DateCreated = DateTime.UtcNow;
            var result = await _contextHelper.CreateAsync(documentType, "ModifiedById", "DateModified");

            return result;
        }

        public async Task<DocumentType> UpdateAsync(DocumentType documentType, int modifiedById)
        {
            documentType.ModifiedById = modifiedById;
            documentType.DateModified = DateTime.UtcNow;
            var result = await _contextHelper.CreateAsync(documentType, "CreatedById", "DateCreated");

            return result;
        }

        public async Task BatchDeleteAsync(int[] ids)
        {
            var entities = _context.DocumentTypes.Where(dt => ids.Contains(dt.Id));

            await _contextHelper.BatchDeleteAsync(entities);
        }
    }
}