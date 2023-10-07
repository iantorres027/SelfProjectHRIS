using Microsoft.AspNetCore.Http;
using Template.Domain.Dto.PurchaseOrderDto;
using Template.Domain.Entities;

namespace Template.Application.Interfaces.Transaction.PurchaseOrderRepository;

public interface IPurchaseOrderRepository
{
    Task<PurchaseOrder> SaveAsync(PurchaseOrderModel purchaseOrder, List<PurchaseOrderDetailModel> purchaseOrderDetails, List<IFormFile> attachments, string rootPath, int userId);
    Task BatchDeleteAsync(int[] ids);

    Task<PurchaseOrder> CreateAsync(PurchaseOrder purchaseOrder, int userId);

    Task<List<PurchaseOrder>> GetAll();

    Task<PurchaseOrder?> GetById(int id);

    Task<PurchaseOrder> UpdateAsync(PurchaseOrder purchaseOrder, int userId);
}