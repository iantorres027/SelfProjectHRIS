CREATE TABLE [dbo].[VatType]
(
    [Id] INT IDENTITY (1, 1) NOT NULL,
    [Code] NVARCHAR (50) NOT NULL,
    [Name] NVARCHAR (50) NOT NULL,
    [Rate] DECIMAL (18, 5) NOT NULL,
    [CompanyId] INT NOT NULL,
    [CreatedById] INT NOT NULL,
    [DateCreated] DATETIME2 (7) DEFAULT getutcdate() NOT NULL,
    [ModifiedById] INT NULL,
    [DateModified] DATETIME2 (7)  NULL
)
