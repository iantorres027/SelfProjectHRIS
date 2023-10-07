using DevExpress.Xpo;
using Template.Application.Interfaces.Setup.DocumentRepository;
using Template.Domain.Entities;

namespace Template.Infrastructure.Persistence.Repositories.Setup.DocumentRepository
{
    public class DocumentRepository : IDocumentRepository
    {
        private readonly MNLTemplateDBContext _context;
        private readonly EfCoreHelper<Document> _contextHelper;

        public DocumentRepository(MNLTemplateDBContext context)
        {
            _context = context;
            _contextHelper = new EfCoreHelper<Document>(context);
        }

        public async Task<Document?> GetById(int id)
        {
            var result = await _contextHelper.GetByIdAsync(id);
            return result;
        }

        public async Task<List<Document>> GetByIds(int[] ids)
        {
            var result = await _context.Documents.Where(d => ids.Contains(d.Id)).ToListAsync();
            return result;
        }

        public async Task<List<Document>> GetAll()
        {
            var result = await _contextHelper.GetAllAsync();
            return result;
        }

        public async Task<Document> SaveAsync(Document document, int modifiedById)
        {
            if (document.Id == 0)
            {
                document = await CreateAsync(document, modifiedById);
            }
            else
            {
                document = await UpdateAsync(document, modifiedById);
            }

            return document;
        }

        public async Task<Document> CreateAsync(Document document, int createdById)
        {
            document.CreatedById = createdById;
            document.DateCreated = DateTime.UtcNow;
            var result = await _contextHelper.CreateAsync(document, "ModifiedById", "DateModified");

            return result;
        }

        public async Task<Document> UpdateAsync(Document document, int modifiedById)
        {
            document.ModifiedById = modifiedById;
            document.DateModified = DateTime.UtcNow;
            var result = await _contextHelper.CreateAsync(document, "CreatedById", "DateCreated");

            return result;
        }

        public async Task DeleteAsync(Document document)
        {
            await _contextHelper.DeleteAsync(document);
        }

        public async Task DeleteAsync(int id)
        {
            var entities = _context.Documents.FirstOrDefault(d => d.Id == id);
            if (entities is not null)
            {
                await _contextHelper.DeleteAsync(entities);
            }
        }

        public async Task BatchDeleteAsync(int[] ids)
        {
            var entities = _context.Documents.Where(d => ids.Contains(d.Id));
            if (entities is not null)
            {
                await _contextHelper.BatchDeleteAsync(entities);
            }
        }
    }
}