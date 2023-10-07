using Microsoft.EntityFrameworkCore;
using Template.Application.Interfaces.Transaction.PurchaseOrderRepository;
using Template.Domain.Entities;

namespace Template.Infrastructure.Persistence.Repositories.Transaction.PurchaseOrderRepository
{
    public class PurchaseOrderDetailRepository : IPurchaseOrderDetailRepository
    {
        private readonly MNLTemplateDBContext _context;
        private readonly EfCoreHelper<PurchaseOrderDetail> _contextHelper;

        public PurchaseOrderDetailRepository(MNLTemplateDBContext context)
        {
            _context = context;
            _contextHelper = new EfCoreHelper<PurchaseOrderDetail>(context);
        }

        public async Task<PurchaseOrderDetail?> GetById(int id)
        {
            var result = await _contextHelper.GetByIdAsync(id);
            return result;
        }

        public async Task<List<PurchaseOrderDetail>> GetAll()
        {
            var result = await _contextHelper.GetAllAsync();
            return result;
        }

        public async Task<PurchaseOrderDetail> SaveAsync(PurchaseOrderDetail purchaseOrderDetail, int userId)
        {
            if (purchaseOrderDetail.Id == 0)
                purchaseOrderDetail = await CreateAsync(purchaseOrderDetail, userId);
            else
                purchaseOrderDetail = await UpdateAsync(purchaseOrderDetail, userId);

            return purchaseOrderDetail;
        }

        public async Task<List<PurchaseOrderDetail>> BatchSaveAsync(List<PurchaseOrderDetail> purchaseOrderDetails, int headerId, int userId)
        {
            List<PurchaseOrderDetail> _purchaseOrderDetails = new();

            foreach (var purchaseOrderDetail in purchaseOrderDetails)
            {
                PurchaseOrderDetail _purchaseOrderDetail = new();

                if (purchaseOrderDetail.Id == 0)
                {
                    _purchaseOrderDetail = await CreateAsync(purchaseOrderDetail, userId);
                }
                else
                {
                    _purchaseOrderDetail = await UpdateAsync(purchaseOrderDetail, userId);
                }
                _purchaseOrderDetails.Add(purchaseOrderDetail);
            }

            // clean up for unused stages
            var poDetailIds = purchaseOrderDetails.Where(m => m.Id != 0).Select(m => m.Id).ToList();
            var toDelete = await _context.PurchaseOrderDetails
                .Where(m => m.PurchaseOrderId == headerId && !poDetailIds.Contains(m.Id))
                .ToListAsync();

            if (toDelete is not null && toDelete.Any())
            {
                await BatchDeleteAsync(toDelete);
            }

            return _purchaseOrderDetails;
        }

        public async Task<PurchaseOrderDetail> CreateAsync(PurchaseOrderDetail purchaseOrderDetail, int userId)
        {
            purchaseOrderDetail.CreatedById = userId;
            purchaseOrderDetail.DateCreated = DateTime.UtcNow;
            var result = await _contextHelper.CreateAsync(purchaseOrderDetail, "ModifiedById", "DateModified");

            return result;
        }

        public async Task<PurchaseOrderDetail> UpdateAsync(PurchaseOrderDetail purchaseOrderDetail, int userId)
        {
            purchaseOrderDetail.ModifiedById = userId;
            purchaseOrderDetail.DateModified = DateTime.UtcNow;
            var result = await _contextHelper.CreateAsync(purchaseOrderDetail, "CreatedById", "DateCreated");

            return result;
        }

        public async Task BatchDeleteAsync(int[] ids)
        {
            var entities = _context.PurchaseOrderDetails.Where(pod => ids.Contains(pod.Id));

            await _contextHelper.BatchDeleteAsync(entities);
        }

        public async Task BatchDeleteAsync(List<PurchaseOrderDetail> entities)
        {
            await _contextHelper.BatchDeleteAsync(entities);
        }
    }
}