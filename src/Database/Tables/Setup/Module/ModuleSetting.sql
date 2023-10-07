CREATE TABLE [dbo].[ModuleSetting]
(
	[Id] INT NOT NULL PRIMARY KEY IDENTITY, 
	[ModuleId] INT NOT NULL, 
    [Name] NVARCHAR(255) NOT NULL, 
    [Description] NVARCHAR(255) NOT NULL, 
    [DefaultValue] NVARCHAR(255) NOT NULL, 
    [Value] NVARCHAR(255) NOT NULL, 
    [DateType] NVARCHAR(50) NOT NULL, 
    [Selection] NVARCHAR(MAX) NOT NULL, 
    [CompanyId] INT NOT NULL, 
    [CreatedById] INT NOT NULL, 
    [DateCreated] DATETIME2 NOT NULL DEFAULT getdate(), 
    [ModifiedById] INT NULL, 
    [DateModified] DATETIME2 NULL
)