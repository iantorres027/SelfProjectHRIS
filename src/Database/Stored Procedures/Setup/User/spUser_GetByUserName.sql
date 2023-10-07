CREATE PROCEDURE [dbo].[spUser_GetByUserName]
	@Username NVARCHAR(255)
AS
BEGIN
	SELECT 
		u.*,
		CASE 
			WHEN 30 - datediff(minute, LockedTime, GETDATE()) > 0 THEN 'Locked'
			ELSE 'Unlocked'
		END LockStatus,
		30 - datediff(minute, LockedTime, GETDATE()) LockedDuration,
		r.[Name] UserRoleName
	FROM [User] u
	LEFT JOIN [UserRole] ur on ur.UserId = u.Id
	LEFT JOIN [Role] r ON ur.RoleId = r.Id
	WHERE [UserName] = @Username COLLATE SQL_Latin1_General_CP1_CS_AS
END