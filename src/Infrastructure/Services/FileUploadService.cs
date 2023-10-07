using Microsoft.AspNetCore.Http;
using Template.Application.Interfaces.Setup.DocumentRepository;
using Template.Application.Services;
using Template.Domain.Entities;

namespace Template.Infrastructure.Services
{
    public class FileUploadService : IFileUploadService
    {
        private readonly IDocumentRepository _documentRepository;

        public FileUploadService(IDocumentRepository documentRepository)
        {
            _documentRepository = documentRepository;
        }

        public async Task UploadFiles(
            List<IFormFile> files,
            string saveLocation,
            string rootPath,
            int referenceId,
            string referenceNo,
            int userId,
            int companyId)
        {
            foreach (var formFile in files)
            {
                if (formFile.Length <= 0)
                {
                    continue;
                }

                // Generate a unique filename for the uploaded file
                string uniqueFileName = Guid.NewGuid().ToString() + "_" + formFile.FileName;

                // Combine the save location with the unique filename
                string rawFilePath = Path.Combine(saveLocation, uniqueFileName);
                string filePath = Path.Combine(rootPath, rawFilePath);

                using (FileStream stream = new(filePath, FileMode.Create))
                {
                    await formFile.CopyToAsync(stream);
                }

                // Create a new Document entity to save in the database
                Document document = new()
                {
                    ReferenceId = referenceId,
                    ReferenceNo = referenceNo,
                    Code = uniqueFileName,
                    Name = formFile.FileName,
                    Location = rawFilePath,
                    Size = (int)formFile.Length,
                    FileType = formFile.ContentType,
                    IsFolder = false,
                    CompanyId = companyId,
                    CreatedById = userId
                };

                await _documentRepository.CreateAsync(document, userId);
            }
        }

        public async Task DeleteFile(int documentId, string rootFolder)
        {
            var document = await _documentRepository.GetById(documentId);

            if (document != null)
            {
                var filePath = Path.Combine(rootFolder, document.Location);
                // Delete the file from the file system
                if (File.Exists(filePath))
                {
                    File.Delete(filePath);
                }

                // Delete the corresponding Document entity from the database
                await _documentRepository.DeleteAsync(documentId);
            }
        }

        public async Task BatchDeleteFile(int[] documentIds, string rootFolder)
        {
            var documents = await _documentRepository.GetByIds(documentIds);

            foreach (var document in documents)
            {
                if (document is null)
                {
                    continue;
                }
                var filePath = Path.Combine(rootFolder, document.Location);
                // Delete the file from the file system
                if (File.Exists(filePath))
                {
                    File.Delete(filePath);
                }

                // Delete the corresponding Document entity from the database
                await _documentRepository.DeleteAsync(document);
            }
        }
    }
}