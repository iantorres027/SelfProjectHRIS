CREATE PROCEDURE [dbo].[spRoleAccess_GetByModuleCode]
	@UserId int,
	@ModuleCode nvarchar(50)
AS
	SELECT
		m.Code, 
		u.Id UserId, 
		ra.*,
		CASE
			WHEN ra.CanRead = 1 OR ra.CanModify = 1 OR ra.CanDelete = 1 OR ra.CanCreate = 1 THEN 1
			ELSE 0
		END HasAccess
	FROM [User] u
		INNER JOIN [UserRole] ur ON ur.UserId = u.Id
		INNER JOIN [Role] r ON ur.RoleId = r.Id
		INNER JOIN RoleAccess ra ON r.Id = ra.RoleId
		INNER JOIN Module m ON ra.ModuleId = m.Id
	WHERE
		u.Id = COALESCE(@UserId, u.Id)
		AND m.Code = @ModuleCode
RETURN 0
