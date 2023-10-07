# MNLeistung C# Template

- Creator: John Kenneth Larbo
- Postion: C# Lead
- Date: 31-07-2023
- Company: MNLeistung Inc.

## Description

MNLeistung C# Template is a starting point for C# projects, designed to provide a clean and organized structure to kickstart your development process. The template utilizes the popular Visual Studio IDE and is pre-configured with some essential components and settings.

## Usage

### Step 1: Creating a New Repository

1. Click on the "Use this template" button located at the top of the repository page.
2. Select "Create a new repository" and follow the steps to set up your repository with the template.

![Step 1](https://github.com/KratosKen023/MNLTemplate/assets/43458045/f01f5340-e291-4fcf-a241-03da71b09d64)

### Step 2: Setting Up the Repository

Follow the on-screen instructions to complete the repository setup. You can customize the repository name, description, and other settings as per your project requirements.

![Step 2](https://github.com/KratosKen023/MNLTemplate/assets/43458045/c235339f-8d5f-4352-842b-c22d29687b33)

### Step 3: Cloning the Project

After successfully creating your new repository, you have two options:

- Clone the project using Git to your local machine.
- Use the "Open with Visual Studio" option to directly open the project in Visual Studio.

![Step 3](https://github.com/KratosKen023/MNLTemplate/assets/43458045/9f3a1830-9885-4cce-9ea1-3fe34170859c)

### Step 4: Project Structure

Once you have cloned or opened the project in Visual Studio, you will see the following project structure:

![Step 4](https://github.com/KratosKen023/MNLTemplate/assets/43458045/f9b4f7a9-a6ca-4ab6-aef4-564800afcaff)

### Step 5: Renaming Solution Items

To personalize the project for your specific use case, you need to rename certain solution items. The following items should be renamed:

- MNLTemplate
- Template.Api
- Template.Application
- Template.Domain
- Template.Infrastructure
- Template.Web

After renaming a solution item, ensure to use "Sync Namespaces" to apply the new name consistently across the entire project.

![Step 5](https://github.com/KratosKen023/MNLTemplate/assets/43458045/b6eaf6a5-4dcd-44f2-b3e2-be2f709bce8a)

### Step 6: Manually Editing Usings in .cshtml Files

As the automatic "Sync Namespaces" might not fully optimize .cshtml files, you need to manually edit the following pages:

- \_ViewImports.cshtml
- \_Topbar.cshtml (edit if errors still occur after editing \_ViewImports.cshtml)

In each file, update the namespaces as follows:

```csharp
// Before
@using DevExpress.AspNetCore
@using Template.Web
@using Template.Web.Models
@using Template.Web.Controllers
@using Microsoft.Extensions.Localization
@addTagHelper *, Microsoft.AspNetCore.Mvc.TagHelpers

// After
@using DevExpress.AspNetCore
@using Launcher.Web
@using Launcher.Web.Models
@using Launcher.Web.Controllers
@using Microsoft.Extensions.Localization
@addTagHelper *, Microsoft.AspNetCore.Mvc.TagHelpers
```

Remember to rebuild the project again after editing the files.

### Step 7: Verify Project Structure

After following all the steps, your project structure should now reflect the changes you made:

![Step 7](https://github.com/KratosKen023/MNLTemplate/assets/43458045/190cda2a-3823-431c-ae43-5b0a21347cf6)

## Further Improvements

The current template provides a solid foundation for C# projects. However, you may consider adding the following improvements:

- Adding unit tests projects for testing the application.
- Integrating logging and error handling mechanisms.
- Including configuration settings for various environments (Development, Staging, Production).
- Implementing security measures like authentication and authorization.
- Setting up continuous integration and deployment pipelines.

Feel free to adapt the template to suit your specific needs and enhance it with additional features as your project demands. Happy coding!
