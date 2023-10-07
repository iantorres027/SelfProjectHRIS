CREATE PROCEDURE [dbo].[spRoleAccess_GetByRoleId]
	@RoleId int
AS
	SELECT
		ra.*, m.Id ModuleId, m.[Description] ModuleName, m.Code ModuleCode,
		mt.[Description] ModuleType,
		CASE
			WHEN m.ParentModuleId IS NOT NULL THEN 1
			ELSE 0
		END HasSubModule,
		CASE
			WHEN ra.CanCreate = 1 AND ra.CanModify = 1 AND ra.CanDelete = 1 THEN 'View and Edit ' + m.[Description]
			WHEN (ra.CanCreate = 1 OR ra.CanModify = 1) AND ra.CanDelete = 0 THEN 'Create/Edit ' + m.[Description]
			WHEN ra.CanCreate = 0 AND ra.CanRead = 1 THEN 'View ' + m.[Description]
			ELSE ''
		END AccessString
	FROM RoleAccess ra
		INNER JOIN [Role] r ON ra.RoleId = r.Id
		LEFT JOIN Module m ON ra.ModuleId = m.Id
		LEFT JOIN ModuleType mt ON m.ModuleTypeId = mt.Id
	WHERE r.Id = @RoleId
RETURN 0
