IF NOT EXISTS(SELECT 1 FROM [dbo].[PurchaseOrder])
BEGIN
    -- Insert sample data into PurchaseOrder table
    INSERT INTO PurchaseOrder (TransactionNo, TransactionDate, ReferenceID, ReferenceNo, VendorCode, GrossAmount, CurrencyID, CurrencyAmount, VatTypeID, VatableAmount, NonVatableAmount, VatAmount, EwtTypeID, EwtAmount, NetAmount, Remarks, ApprovalStatus, Status, CreatedByID)
    VALUES
        ('PO123', '2023-08-01', 1, 'REF001', 'VENDOR001', 1000.00, 1, 1000.00, 1, 800.00, 200.00, 40.00, 1, 10.00, 950.00, 'Sample remarks 1', 1, 1, 1),
        ('PO124', '2023-08-02', 2, 'REF002', 'VENDOR002', 1500.00, 1, 1500.00, 1, 1200.00, 300.00, 60.00, 2, 15.00, 1425.00, 'Sample remarks 2', 0, 1, 2),
        ('PO125', '2023-08-03', 3, 'REF003', 'VENDOR001', 800.00, 2, 800.00, 2, 640.00, 160.00, 32.00, 1, 10.00, 760.00, 'Sample remarks 3', 1, 1, 3),
        ('PO126', '2023-08-04', 4, 'REF004', 'VENDOR003', 2000.00, 1, 2000.00, 1, 1600.00, 400.00, 80.00, 2, 20.00, 1900.00, 'Sample remarks 4', 1, 1, 1),
        ('PO127', '2023-08-05', 5, 'REF005', 'VENDOR002', 1200.00, 1, 1200.00, 2, 960.00, 240.00, 48.00, 1, 10.00, 1150.00, 'Sample remarks 5', 0, 1, 2);
END
GO
IF NOT EXISTS(SELECT 1 FROM [dbo].[PurchaseOrderDetail])
BEGIN
    -- Insert sample data into PurchaseOrderDetail table
    INSERT INTO PurchaseOrderDetail (PurchaseOrderID, ItemID, ItemCost, Qty, DiscountPercent, DiscountAmount, VatTypeID, VatableAmount, NonVatableAmount, EwtTypeId, EwtAmount, VendorCode, Remarks, CreatedByID)
    VALUES
        (1, 101, 200.00, 5.00, 10.00, 50.00, 1, 40.00, 10.00, 1, 5.00, 'VENDOR001', 'Detail remarks 1', 1),
        (1, 102, 150.00, 3.00, 5.00, 22.50, 1, 18.00, 4.50, 2, 4.50, 'VENDOR001', 'Detail remarks 2', 1),
        (2, 201, 300.00, 4.00, 15.00, 60.00, 1, 48.00, 12.00, 1, 6.00, 'VENDOR002', 'Detail remarks 3', 2),
        (2, 202, 250.00, 2.50, 10.00, 25.00, 1, 20.00, 5.00, 2, 2.50, 'VENDOR002', 'Detail remarks 4', 2),
        (3, 301, 100.00, 8.00, 5.00, 40.00, 2, 32.00, 8.00, 1, 4.00, 'VENDOR001', 'Detail remarks 5', 3),
        (3, 302, 120.00, 5.00, 8.00, 48.00, 2, 40.00, 8.00, 1, 4.00, 'VENDOR001', 'Detail remarks 6', 3),
        (4, 401, 400.00, 6.00, 20.00, 120.00, 1, 96.00, 24.00, 2, 8.00, 'VENDOR003', 'Detail remarks 7', 4),
        (5, 501, 180.00, 7.00, 12.00, 84.00, 2, 56.00, 28.00, 1, 5.00, 'VENDOR002', 'Detail remarks 8', 5);
END
GO