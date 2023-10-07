CREATE TABLE [dbo].[Country]
(
	[ID] INT NOT NULL PRIMARY KEY IDENTITY, 
    [CountryCode] NVARCHAR(50) NOT NULL, 
    [CountryName] NVARCHAR(100) NOT NULL, 
    [CurrencyCode] NVARCHAR(50) NULL, 
    [FipsCode] NVARCHAR(50) NULL, 
    [IsoNumeric] NVARCHAR(50) NULL,
    [North] NVARCHAR(50) NULL,
    [South] NVARCHAR(50) NULL,
    [East] NVARCHAR(50) NULL,
    [West] NVARCHAR(50) NULL,
    [Capital] NVARCHAR(50) NULL,
    [ContinentName] NVARCHAR(100) NULL,
    [Continent] NVARCHAR(50) NULL,
    [Languages] NVARCHAR(100) NULL,
    [IsoAlpha3] NVARCHAR(50) NULL,
    [GeonameId] INT NULL,
    [CreatedById] INT NOT NULL, 
    [DateCreated] DATETIME2 NOT NULL DEFAULT getutcdate(), 
    [ModifiedById] INT NULL, 
    [DateModified] DATETIME2 NULL 
)

GO
EXEC sp_addextendedproperty @name = N'MS_Description',
    @value = N'ISO Code',
    @level0type = N'SCHEMA',
    @level0name = N'dbo',
    @level1type = N'TABLE',
    @level1name = N'Country',
    @level2type = N'COLUMN',
    @level2name = 'CountryCode'
GO
EXEC sp_addextendedproperty @name = N'MS_Description',
    @value = N'ISO3 Code',
    @level0type = N'SCHEMA',
    @level0name = N'dbo',
    @level1type = N'TABLE',
    @level1name = N'Country',
    @level2type = N'COLUMN',
    @level2name = 'CountryName'
;

GO