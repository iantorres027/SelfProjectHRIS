CREATE TABLE [dbo].[CompanySetting]
(
	[Id] INT NOT NULL PRIMARY KEY IDENTITY, 
    [CompanyId] INT NOT NULL, 
    [Bir2307Basis] INT NULL,
    [PostingPeriod] INT NULL, 
    [AccountingPeriod] NVARCHAR(25) NULL,
    [AcctgPeriodFrom] NVARCHAR(50) NULL,
    [AcctgPeriodTo] NVARCHAR(50) NULL,
    [InvEvalMethodId] INT NOT NULL,
    [CreatedById] INT NOT NULL, 
    [DateCreated] DATETIME2 NOT NULL, 
    [ModifiedById] INT NULL, 
    [DateModified] DATETIME2 NULL, 
    [TransactionSeriesCount] INT NULL, 
    [IsBypassApApproval] BIT NULL,
    [CwtId] INT NULL, 
    CONSTRAINT [FK_CompanySetting_ToCompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Company]([Id])
)