﻿CREATE TABLE [dbo].[PurchaseOrder]
(
	[Id] INT NOT NULL PRIMARY KEY IDENTITY, 
    [TransactionNo] NVARCHAR(50) NOT NULL, 
    [TransactionDate] DATE NOT NULL, 
    [ReferenceId] INT NOT NULL, 
    [ReferenceNo] NVARCHAR(500) NOT NULL, 
    [VendorCode] VARCHAR(50) NOT NULL, 
    [GrossAmount] DECIMAL(18, 5) NOT NULL,
    [CurrencyId] INT NOT NULL, 
    [CurrencyAmount] DECIMAL(18, 5) NOT NULL, 
    [VatTypeId] INT NOT NULL, 
    [VatableAmount] DECIMAL(18, 5) NOT NULL, 
    [NonVatableAmount] DECIMAL(18, 5) NOT NULL, 
    [VatAmount] DECIMAL(18, 5) NOT NULL, 
    [EwtTypeId] INT NOT NULL, 
    [EwtAmount] DECIMAL(18, 5) NOT NULL, 
    [NetAmount] DECIMAL(18, 5) NOT NULL,
    [Remarks] NVARCHAR(500) NOT NULL,
    [ApprovalStatus] INT NOT NULL DEFAULT 0, 
    [Status] INT NOT NULL DEFAULT 0, 
    [CompanyId] INT NOT NULL, 
    [CreatedById] INT NOT NULL, 
    [DateCreated] DATETIME2 NOT NULL DEFAULT getutcdate(), 
    [ModifiedById] INT NULL, 
    [DateModified] DATETIME2 NULL
)
