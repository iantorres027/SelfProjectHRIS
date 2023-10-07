using Microsoft.AspNetCore.Http;

namespace Template.Application.Services;

public interface IFileUploadService
{
    Task BatchDeleteFile(int[] documentIds, string rootFolder);

    Task DeleteFile(int documentId, string rootFolder);

    Task UploadFiles(List<IFormFile> files, string saveLocation, string rootPath, int referenceId, string referenceNo, int userId, int companyId);
}