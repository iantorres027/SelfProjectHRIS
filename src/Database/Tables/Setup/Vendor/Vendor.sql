﻿CREATE TABLE [dbo].[Vendor] (
    [Id] INT PRIMARY KEY IDENTITY NOT NULL,
    [VendorCode] NVARCHAR (50) NOT NULL,
    [VendorName] NVARCHAR (150) NOT NULL,
    [EwtTypeId] INT NOT NULL,
    [VatTypeId] INT NOT NULL,
    [CompanyId] INT NOT NULL,
    [ProfilePicture] NVARCHAR (4000) NULL,
    [TinNo] NVARCHAR (50) NULL,
    [TaxPayerType] INT NULL,
    [PaymentTermId] INT NULL,
    [EmailAddress] NVARCHAR(100) NULL, 
    [MobileNo] NVARCHAR(100) NULL, 
    [TelNo] NVARCHAR(100) NULL,
    [FaxNo] NVARCHAR(100) NULL,
    [Website] NVARCHAR(150) NULL,
    [IsDisabled] BIT DEFAULT 0 NOT NULL,
    [Inactive] BIT DEFAULT 0 NOT NULL,
    [CreatedById] INT NOT NULL,
    [DateCreated] DATETIME2 (7) DEFAULT getutcdate() NOT NULL,
    [ModifiedById] INT NULL,
    [DateModified] DATETIME2 (7) NULL,
);