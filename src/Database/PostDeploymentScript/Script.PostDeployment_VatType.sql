IF NOT EXISTS (SELECT 1 FROM [dbo].[VatType])
BEGIN
    SET IDENTITY_INSERT [dbo].[VatType] ON;
    INSERT INTO VatType([ID], [Code], [Name], [Rate], [CompanyID], [CreatedByID]) 
    VALUES (1,'VAT', 'Vatable', 12.00, 1, 1),
	       (2,'NON-VAT', 'Non-Vatable', 0.00, 1, 1),
	       (3,'VAT-Exempt','VAT-Exempt', 0.00, 1, 1),
	       (4,'Zero-Rated', 'Zero-Rated', 0.00, 1, 1)
    SET IDENTITY_INSERT [dbo].[VatType] OFF;
END
GO