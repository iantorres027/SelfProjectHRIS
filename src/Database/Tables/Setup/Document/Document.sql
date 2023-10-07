CREATE TABLE [dbo].[Document]
(
	[Id] INT NOT NULL PRIMARY KEY IDENTITY, 
    [Guid] UNIQUEIDENTIFIER default newid() NOT NULL, 
    [ReferenceId] INT NOT NULL, 
    [ReferenceTypeId] INT NOT NULL,
    [ReferenceNo] NVARCHAR(255) NOT NULL,
    [Code] NVARCHAR(255) NOT NULL,
    [Name] NVARCHAR(255) NOT NULL, 
    [Location] NVARCHAR(500) NOT NULL, 
    [DocumentTypeId] INT NOT NULL, 
    [Size] INT NOT NULL, 
    [FileType] NVARCHAR(50) NOT NULL, 
    [IsFolder] BIT NOT NULL DEFAULT 0,
    [CompanyId] INT NOT NULL, 
    [IsDisabled] BIT NOT NULL DEFAULT 0, 
    [CreatedById] INT NOT NULL, 
    [DateCreated] DATETIME2 NOT NULL DEFAULT getutcdate(), 
    [ModifiedById] INT NOT NULL, 
    [DateModified] DATETIME2 NOT NULL DEFAULT getutcdate()
);