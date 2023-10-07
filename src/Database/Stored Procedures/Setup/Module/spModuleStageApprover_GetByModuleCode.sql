CREATE PROCEDURE [dbo].[spModuleStageApprover_GetByModuleCode]
	@moduleCode NVARCHAR(50)
AS
	SELECT	
		m.Id ModuleId,
		m.Code ModuelCode,
		ms.[Level] ModuleStageLevel,
		ms.[Name] ModuleStageName,
		ms.[Title] ModuleStageTitle,
		u.Id UserId,
		u.UserName,
		u.LastName,
		u.FirstName,
		u.MiddleName
	FROM Module m
	left join ModuleStage ms ON ms.ModuleId = m.Id
	LEFT JOIN [User] u ON u.Id = ms.ApproverId
	WHERE m.Code = @moduleCode
	ORDER BY m.Id, ms.[Level]
RETURN 0