CREATE TABLE [dbo].[UserActivity] (
    [Id] INT IDENTITY (1, 1) NOT NULL,
    [UserId] INT NOT NULL,
    [Action] NVARCHAR (255) NOT NULL,
    [Date] DATETIME2 NOT NULL,
    [Browser] NVARCHAR (50) NOT NULL,
    [Device] NVARCHAR (50) NOT NULL,
    [CompanyId] INT NOT NULL,
    [ActivityTypeId] INT NOT NULL,
    PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_UserActivity_User] FOREIGN KEY ([UserId]) REFERENCES [dbo].[User] ([Id])
);


