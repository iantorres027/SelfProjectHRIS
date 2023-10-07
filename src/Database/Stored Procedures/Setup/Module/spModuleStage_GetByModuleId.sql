CREATE PROCEDURE [dbo].[spModuleStage_GetByModuleId]
	@Id INT
AS
	SELECT
		ms.*,
		m.[Description] ModuleName,
		m.[Code] ModuleCode
	FROM ModuleStage ms
	INNER JOIN Module m ON m.Id = ms.ModuleId
	WHERE m.Id = @Id
	ORDER BY ms.[Level]
RETURN 0;
