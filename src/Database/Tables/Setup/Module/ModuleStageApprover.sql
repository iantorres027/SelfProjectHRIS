CREATE TABLE [dbo].[ModuleStageApprover]
(
	[Id] INT NOT NULL PRIMARY KEY IDENTITY, 
    [ModuleStageId] INT NOT NULL, 
    [ApproverId] INT NOT NULL, 
    [Level] INT NOT NULL,
    [IsDisabled] BIT NOT NULL DEFAULT 0, 
    [CreatedById] INT NOT NULL, 
    [DateCreated] DATETIME2 NOT NULL DEFAULT GETDATE(), 
    [ModifiedById] INT NULL, 
    [DateModified] DATETIME2 NULL 
)