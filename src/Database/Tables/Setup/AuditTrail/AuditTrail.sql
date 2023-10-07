CREATE TABLE [dbo].[AuditTrail]
(
	[Id] INT NOT NULL PRIMARY KEY IDENTITY, 
    [Action] NVARCHAR(255) NOT NULL, 
    [TableName] NVARCHAR(255) NOT NULL, 
    [RecordPk] NVARCHAR(4000) NOT NULL, 
    [ColumnName] NVARCHAR(4000) NOT NULL, 
    [OldValue] NVARCHAR(4000) NOT NULL, 
    [NewValue] NVARCHAR(4000) NOT NULL, 
    [ChangeDate] DATETIME2 NOT NULL DEFAULT getdate(), 
    [UserId] INT NOT NULL
)
