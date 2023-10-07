
/*
Post-Deployment Script Template							
--------------------------------------------------------------------------------------
 This file contains SQL statements that will be appended to the build script.		
 Use SQLCMD syntax to include a file in the post-deployment script.			
 Example:      :r .\myfile.sql								
 Use SQLCMD syntax to reference a variable in the post-deployment script.		
 Example:      :setvar TableName MyTable							
               SELECT * FROM [$(TableName)]					
--------------------------------------------------------------------------------------
*/
:r .\PostDeploymentScript\Script.PostDeployment_Company.sql
:r .\PostDeploymentScript\Script.PostDeployment_Country.sql
:r .\PostDeploymentScript\Script.PostDeployment_Currency.sql
:r .\PostDeploymentScript\Script.PostDeployment_EwtType.sql
:r .\PostDeploymentScript\Script.PostDeployment_PurchaseOrder.sql
:r .\PostDeploymentScript\Script.PostDeployment_User.sql
:r .\PostDeploymentScript\Script.PostDeployment_VatType.sql