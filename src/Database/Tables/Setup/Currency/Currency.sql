CREATE TABLE [dbo].[Currency]
(
    [Id] INT NOT NULL PRIMARY KEY IDENTITY, 
    [Code] NVARCHAR(50) NOT NULL, 
    [Name] NVARCHAR(50) NOT NULL, 
    [CountryId] INT NOT NULL, 
    [Symbol] NVARCHAR(50) NOT NULL, 
    [IsDefault] BIT NOT NULL DEFAULT 0,
    [CompanyId] INT NOT NULL, 
    [IsDisabled] BIT NOT NULL DEFAULT 0,
    [Rate] DECIMAL(18, 5) NOT NULL DEFAULT 0, 
    [Inactive] BIT NOT NULL DEFAULT 0, 
    [EffectiveDate] DATETIME2 NULL,
    [CreatedById] INT NOT NULL, 
    [DateCreated] DATETIME2 NOT NULL DEFAULT getutcdate(), 
    [ModifiedById] INT NULL, 
    [DateModified] DATETIME2 NULL,
)
