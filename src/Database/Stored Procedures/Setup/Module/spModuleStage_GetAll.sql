CREATE PROCEDURE [dbo].[spModuleStage_GetAll]
AS
	SELECT
		ms.*,
		m.[Description] ModuleName,
		m.[Code] ModuleCode
	FROM ModuleStage ms
	INNER JOIN Module m ON m.Id = ms.ModuleId
	ORDER BY m.Id, ms.Id, ms.[Level]
RETURN 0;