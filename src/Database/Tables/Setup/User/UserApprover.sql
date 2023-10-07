CREATE TABLE [dbo].[UserApprover]
(
	[Id] INT NOT NULL PRIMARY KEY IDENTITY, 
    [UserId] INT NOT NULL, 
    [ApproverId] INT NOT NULL,
    [Level] INT NOT NULL,
    [IsDisabled] BIT NOT NULL DEFAULT 0,
    [CreatedById] INT NOT NULL, 
    [DateCreated] DATETIME2 NOT NULL DEFAULT getdate(), 
    [ModifiedById] INT NULL, 
    [DateModified] DATETIME2 NULL
)
