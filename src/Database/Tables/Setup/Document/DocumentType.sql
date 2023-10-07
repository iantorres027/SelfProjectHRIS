CREATE TABLE [dbo].[DocumentType]
(
	[Id] INT NOT NULL PRIMARY KEY IDENTITY, 
    [Code] NVARCHAR(10) NOT NULL, 
    [Name] NVARCHAR(10) NOT NULL,
    [IsDisabled] BIT NOT NULL DEFAULT 0,
    [CreatedById] INT NOT NULL, 
    [DateCreated] DATETIME2 NOT NULL DEFAULT getutcdate(), 
    [ModifiedById] INT NULL, 
    [DateModified] DATETIME2 NULL DEFAULT getutcdate()
)
