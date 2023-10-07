using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Template.Application.Interfaces.Transaction.PurchaseOrderRepository;
using Template.Application.Services;
using Template.Domain.Dto.PurchaseOrderDto;
using Template.Domain.Entities;

namespace Template.Infrastructure.Persistence.Repositories.Transaction.PurchaseOrderRepository
{
    public class PurchaseOrderRepository : IPurchaseOrderRepository
    {
        private readonly MNLTemplateDBContext _context;
        private readonly EfCoreHelper<PurchaseOrder> _contextHelper;
        private readonly IPurchaseOrderDetailRepository _purchaseOrderDetailRepository;
        private readonly ISQLDatabaseService _sqlDatabaseService;
        private readonly IFileUploadService _uploadService;
        private readonly IMapper _mapper;

        public PurchaseOrderRepository(
            MNLTemplateDBContext context,
            IPurchaseOrderDetailRepository purchaseOrderDetailRepository,
            ISQLDatabaseService sqlDatabaseService,
            IMapper mapper,
            IFileUploadService uploadService)
        {
            _context = context;
            _contextHelper = new EfCoreHelper<PurchaseOrder>(context);
            _purchaseOrderDetailRepository = purchaseOrderDetailRepository;
            _sqlDatabaseService = sqlDatabaseService;
            _mapper = mapper;
            _uploadService = uploadService;
        }

        public async Task<PurchaseOrder?> GetById(int id)
        {
            var result = await _contextHelper.GetByIdAsync(id);
            return result;
        }

        public async Task<List<PurchaseOrder>> GetAll()
        {
            var result = await _contextHelper.GetAllAsync();
            return result;
        }

        public async Task<PurchaseOrder> SaveAsync(
            PurchaseOrderModel purchaseOrder,
            List<PurchaseOrderDetailModel> purchaseOrderDetails,
            List<IFormFile> attachments,
            string rootPath,
            int userId)
        {
            var _purchaseOrder = _mapper.Map<PurchaseOrder>(purchaseOrder);

            if (purchaseOrder.Id == 0)
            {
                _purchaseOrder = await CreateAsync(_purchaseOrder, userId);
            }
            else
            {
                _purchaseOrder = await UpdateAsync(_purchaseOrder, userId);
            }

            // upload attachment
            var saveLocation = Path.Combine("Files", "Attachments", "PurchaseOrder", purchaseOrder.TransactionNo);

            await _uploadService.UploadFiles(
                files: attachments,
                saveLocation: saveLocation,
                rootPath: rootPath,
                referenceId: purchaseOrder.Id,
                referenceNo: purchaseOrder.TransactionNo,
                userId: userId,
                companyId: purchaseOrder.CompanyId);

            var _purchaseOrderDetails = _mapper.Map<List<PurchaseOrderDetail>>(purchaseOrderDetails);

            // save detail
            await _purchaseOrderDetailRepository.BatchSaveAsync(_purchaseOrderDetails, purchaseOrder.Id, userId);

            return _purchaseOrder;
        }

        public async Task<PurchaseOrder> CreateAsync(PurchaseOrder purchaseOrder, int userId)
        {
            purchaseOrder.CreatedById = userId;
            purchaseOrder.DateCreated = DateTime.UtcNow;
            var result = await _contextHelper.CreateAsync(purchaseOrder, "ModifiedById", "DateModified");

            return result;
        }

        public async Task<PurchaseOrder> UpdateAsync(PurchaseOrder purchaseOrder, int userId)
        {
            purchaseOrder.ModifiedById = userId;
            purchaseOrder.DateModified = DateTime.UtcNow;
            var result = await _contextHelper.CreateAsync(purchaseOrder, "CreatedById", "DateCreated");

            return result;
        }

        public async Task BatchDeleteAsync(int[] ids)
        {
            var entities = _context.PurchaseOrders.Where(po => ids.Contains(po.Id));

            await _contextHelper.BatchDeleteAsync(entities);
        }
    }
}