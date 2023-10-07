IF NOT EXISTS(SELECT 1 FROM [dbo].[Company])
BEGIN
	SET IDENTITY_INSERT [dbo].[Company] ON 

	INSERT [dbo].[Company] ([Id], [Code], [Name], [BusinessStyle], [TelNo], [MobileNo], [FaxNo], [Email], [Website], [Tin], [RepresentativeName], [RepresentativeTin], [RepresentativeDesignation], [IsDisabled], [CreatedById], [DateCreated], [ModifiedById], [DateModified]) VALUES (1, N'MNL', N'MNLeistung', N'IT Solutions', N'5451584815', N'639980844152', N'8415812121', N'info@mnleistung.de', N'https://mnleistung.de', N'88454548787', N'Mylene Dayrit', N'548424544164', N'CEO', 0, 1, CAST(N'2023-05-31T00:00:00.0000000' AS DateTime2), NULL, NULL)
	SET IDENTITY_INSERT [dbo].[Company] OFF
END
GO
