CREATE TABLE [dbo].[UserToken]
(
	[Id] INT NOT NULL PRIMARY KEY IDENTITY, 
    [UserId] INT NOT NULL,
    [Token] NVARCHAR(4000) NOT NULL, 
    [RefreshToken] NVARCHAR(1000) NOT NULL, 
    [CreatedDate] DATETIME2 NOT NULL DEFAULT getdate(), 
    [ExpirationDate] DATETIME2 NOT NULL, 
    [IsInvalidated] BIT NOT NULL DEFAULT 0
)
