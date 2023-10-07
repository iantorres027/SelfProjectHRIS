CREATE TABLE [dbo].[CurrencyRate]
(
    [Id] INT IDENTITY (1, 1) NOT NULL,
    [CurrencyId] INT NOT NULL,
    [Rate] DECIMAL (18, 5) NOT NULL,
    [Date] DATETIME2 (7) NOT NULL,
    [CreatedById] INT NOT NULL,
    [DateCreated]  DATETIME2 (7) DEFAULT getutcdate() NOT NULL,
    [ModifiedById] INT NULL,
    [DateModified] DATETIME2 (7) NULL
)
