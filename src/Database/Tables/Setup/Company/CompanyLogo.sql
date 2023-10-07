CREATE TABLE [dbo].[CompanyLogo] (
    [Id] INT PRIMARY KEY IDENTITY (1, 1) NOT NULL,
    [Description] NVARCHAR (255) NOT NULL,
    [Location] NVARCHAR (255) NOT NULL,
    [IsDisabled] BIT DEFAULT 0 NOT NULL,
    [CreatedBy] INT NOT NULL,
    [DateCreated] DATETIME2 (7) DEFAULT getdate() NOT NULL,
    [ModifiedBy] INT NULL,
    [DateModified] DATETIME2 (7) DEFAULT getdate() NULL,
    [CompanyId] INT NOT NULL,
    CONSTRAINT [FK_CompanyLogo_ToCompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [dbo].[Company] ([Id])
);


