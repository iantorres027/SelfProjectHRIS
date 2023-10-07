using Template.Domain.Entities;

namespace Template.Application.Interfaces.Transaction.PurchaseOrderRepository;

public interface IPurchaseOrderDetailRepository
{
    Task<List<PurchaseOrderDetail>> BatchSaveAsync(List<PurchaseOrderDetail> purchaseOrderDetails, int headerId, int userId);
    Task BatchDeleteAsync(List<PurchaseOrderDetail> entities);
    Task BatchDeleteAsync(int[] ids);
    Task<PurchaseOrderDetail> CreateAsync(PurchaseOrderDetail purchaseOrderDetail, int createdById);
    Task<List<PurchaseOrderDetail>> GetAll();
    Task<PurchaseOrderDetail?> GetById(int id);
    Task<PurchaseOrderDetail> SaveAsync(PurchaseOrderDetail purchaseOrderDetail, int modifiedById);
    Task<PurchaseOrderDetail> UpdateAsync(PurchaseOrderDetail purchaseOrderDetail, int modifiedById);
}