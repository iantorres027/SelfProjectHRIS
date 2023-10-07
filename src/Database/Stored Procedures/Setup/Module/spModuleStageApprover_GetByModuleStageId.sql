CREATE PROCEDURE [dbo].[spModuleStageApprover_GetByModuleStageId]
	@id INT
AS
	SELECT
		msa.*,
		u.UserName ApproverUserName,
		u.FirstName ApproverFirstName,
		u.LastName ApproverLastName,
		u.MiddleName ApproverMiddleName
	FROM ModuleStageApprover msa
	INNER JOIN ModuleStage ms ON ms.Id = msa.ModuleStageId
	INNER JOIN [User] u ON u.Id = msa.ApproverId
	WHERE ms.Id	= @id
RETURN 0;