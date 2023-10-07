CREATE PROCEDURE [dbo].[GetRoleAccess_GetById]
	@Id INT
AS
BEGIN
	SELECT 
		roleAccess.*,
		module.Id ModuleId,
		module.[Description] ModuleName,
		module.[Code] ModuleCode,
		module.ModuleTypeId,
		moduleType.[Description] ModuleType,
		moduleType.Icon ModuleTypeIcon,
		moduleType.[Ordinal] ModuleTypeOrder,
		module.Icon ModuleIcon,
		module.Controller ModuleController,
		module.[Action] ModuleAction,
		module.[Ordinal] ModuleOrder,
		module.[IsDisabled],
		module.[InMaintenance],
		module.[IsVisible],
		module.ParentModuleId,
		CASE 
			WHEN withParentModule.ParentModuleId IS NOT NULL THEN 1 
			ELSE 0 
		END HasSubModule
	FROM Module module
	LEFT JOIN RoleAccess roleAccess ON module.Id = roleAccess.ModuleId
		AND roleAccess.RoleId = @Id 
		OR roleAccess.Id IS NULL
	LEFT JOIN ModuleType moduleType ON module.ModuleTypeId = moduleType.Id
	LEFT JOIN (
		SELECT
			DISTINCT ParentModuleId 
		FROM Module 
		WHERE ParentModuleId <> NULL OR ParentModuleId <> 0
	) withParentModule ON withParentModule.ParentModuleId = module.Id
	ORDER BY module.Id;
END