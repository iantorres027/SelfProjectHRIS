CREATE TABLE [dbo].[PurchaseOrderDetail]
(
	[Id] INT NOT NULL PRIMARY KEY IDENTITY, 
    [PurchaseOrderId] INT NOT NULL, 
    [ItemId] INT NOT NULL, 
    [ItemCost] DECIMAL(18, 5) NOT NULL, 
    [Qty] DECIMAL(18, 5) NOT NULL, 
    [DiscountPercent] DECIMAL(18, 5) NOT NULL, 
    [DiscountAmount] DECIMAL(18, 5) NOT NULL, 
    [VatTypeId] DECIMAL(18, 5) NOT NULL, 
    [VatableAmount] DECIMAL(18, 5) NOT NULL, 
    [NonVatableAmount] DECIMAL(18, 5) NOT NULL, 
    [EwtTypeId] INT NOT NULL, 
    [EwtAmount] DECIMAL(18, 5) NOT NULL,
    [VendorCode] NVARCHAR(50) NOT NULL,
    [Remarks] NVARCHAR(500) NULL,
    [CreatedById] INT NOT NULL, 
    [DateCreated] DATETIME2 NOT NULL DEFAULT getutcdate(), 
    [ModifiedById] INT NULL, 
    [DateModified] DATETIME2 NULL

)
