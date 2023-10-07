using DevExpress.AspNetCore;
using DevExpress.AspNetCore.Reporting;
using DevExpress.Security.Resources;
using DevExpress.XtraReports.Web.Extensions;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Localization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Net.Http.Headers;
using Serilog;
using System;
using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.IO;
using System.Text;
using Template.Application;
using Template.Application.Services;
using Template.Infrastructure;
using Template.Infrastructure.Hubs;
using Template.Infrastructure.Persistence;
using Template.Infrastructure.Persistence.Configuration;
using Template.Infrastructure.Services;

Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(new ConfigurationBuilder()
        .AddJsonFile("serilog.json")
        .Build())
    .CreateLogger();

try
{
    Log.Information("Starting web application");

    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog();
    builder.Services.AddControllers();
    // Add services to the container.
    builder.Services.AddControllersWithViews();
    builder.Services.AddRazorPages();
    builder.Services.AddSignalR();

    builder.Services.AddHttpContextAccessor();

    // Application, Infrastructure Dependency Injection
    builder.Services.Configure<AuthenticationConfig>(builder.Configuration.GetSection("AuthenticationConfig"));
    builder.Services.Configure<JWTConfiguration>(builder.Configuration.GetSection("JWTConfiguration"));

    builder.Services.AddApplication();
    builder.Services.AddInfrastructure(builder.Configuration);

    #region Localization

    //builder.Services.AddLocalization(options => options.ResourcesPath = "Resources");
    builder.Services.AddMvc()
        .AddViewLocalization()
        .AddDataAnnotationsLocalization();

    builder.Services.AddHttpContextAccessor();

    builder.Services.Configure<RequestLocalizationOptions>(options =>
    {
        var supportedCultures = new[]
        {
        new CultureInfo("en-US"),
        new CultureInfo("de-DE")
            // Add other supported cultures here
        };

        options.DefaultRequestCulture = new RequestCulture("en-US");
        options.SupportedCultures = supportedCultures;
        options.SupportedUICultures = supportedCultures;

        options.RequestCultureProviders.Insert(0, new CookieRequestCultureProvider());
    });

    #endregion Localization

    #region DevExpress

    // Register reporting services in the application's dependency injection container.
    builder.Services.AddDevExpressControls();

    //builder.Services.AddScoped<ReportStorageWebExtension, CustomReportStorageWebExtension>();
    // Specify the path to the report storage directory
    string reportStoragePath = Path.Combine(Directory.GetCurrentDirectory(), "PredefinedReports");

    // Register the custom report storage
    builder.Services.AddSingleton<ReportStorageWebExtension>(
        new CustomReportStorageWebExtension(reportStoragePath)
    );

    builder.Services.ConfigureReportingServices(configurator =>
    {
        configurator.ConfigureReportDesigner(designerConfigurator =>
        {
        });
        configurator.ConfigureWebDocumentViewer(viewerConfigurator =>
        {
            viewerConfigurator.UseCachedReportSourceBuilder();
            viewerConfigurator.RegisterConnectionProviderFactory<CustomSqlDataConnectionProviderFactory>();
        });
        configurator.UseAsyncEngine();
    });

    #endregion DevExpress

    #region Authentication

    string jwtKey = builder.Configuration["JWTConfiguration:SecretKey"];
    byte[] keyBytes = Encoding.ASCII.GetBytes(jwtKey ?? "");

    TokenValidationParameters tokenValidation = new()
    {
        IssuerSigningKey = new SymmetricSecurityKey(keyBytes),
        ValidateLifetime = true,
        ValidateAudience = false,
        ValidateIssuer = false,
        ClockSkew = TimeSpan.Zero
    };

    builder.Services.AddSingleton(tokenValidation);

    builder.Services.AddAuthentication(options =>
    {
        // custom scheme defined in .AddPolicyScheme() below
        options.DefaultScheme = "JWT_OR_COOKIE";
        options.DefaultChallengeScheme = "JWT_OR_COOKIE";
    })
         .AddCookie(options =>
         {
             options.Cookie.Name = "MNL_Template";
             //options.Events.OnRedirectToLogin = (context) =>
             //{
             //    context.Response.StatusCode = 401;
             //    return Task.CompletedTask;
             //};
         })
         .AddJwtBearer("Bearer", jwtOptions =>
          {
              jwtOptions.TokenValidationParameters = tokenValidation;
              jwtOptions.Events = new JwtBearerEvents
              {
                  OnTokenValidated = async (context) =>
                  {
                      IJwtService jwtService = builder.Services.BuildServiceProvider()
                                                               .CreateScope().ServiceProvider
                                                               .GetRequiredService<IJwtService>();
                      JwtSecurityToken jwtToken = context.SecurityToken as JwtSecurityToken;
                      bool isValid = await jwtService.IsTokenValid(jwtToken?.RawData ?? "");

                      if (!isValid)
                      {
                          context.Fail("Invalid Token Details");
                      }
                  }
              };
          })
        // this is the key piece!
        .AddPolicyScheme("JWT_OR_COOKIE", "JWT_OR_COOKIE", options =>
        {
            // runs on each request
            options.ForwardDefaultSelector = context =>
            {
                // filter by auth type
                string authorization = (string)context.Request.Headers[HeaderNames.Authorization];
                if (!string.IsNullOrEmpty(authorization) && authorization.StartsWith("Bearer "))
                {
                    return "Bearer";
                }

                // otherwise always check for cookie auth
                return "Cookies";
            };
        });

    #endregion Authentication

    var app = builder.Build();

    var localizationOptions = app.Services.GetRequiredService<IOptions<RequestLocalizationOptions>>();
    app.UseRequestLocalization(localizationOptions.Value);

    #region DevExpress

    using (var scope = app.Services.CreateScope())
    {
        var services = scope.ServiceProvider;
        try
        {
            var db = services.GetRequiredService<ReportDbContext>();
            db.InitializeDatabase();
        }
        catch (Exception ex)
        {
            var logger = services.GetRequiredService<ILogger<Program>>();
            logger.LogError(ex, "An error occurred while initializing the database.");
        }
    }
    var contentDirectoryAllowRule = DirectoryAccessRule.Allow(new DirectoryInfo(Path.Combine(app.Environment.ContentRootPath, "..", "Content")).FullName);
    AccessSettings.ReportingSpecificResources.TrySetRules(contentDirectoryAllowRule, UrlAccessRule.Allow());
    DevExpress.XtraReports.Configuration.Settings.Default.UserDesignerOptions.DataBindingMode = DevExpress.XtraReports.UI.DataBindingMode.Expressions;
    app.UseDevExpressControls();
    System.Net.ServicePointManager.SecurityProtocol |= System.Net.SecurityProtocolType.Tls12;

    #endregion DevExpress

    if (app.Environment.IsDevelopment() || app.Environment.IsStaging())
    {
        app.UseDeveloperExceptionPage();
        //app.UseExceptionHandler("/Home/Error");
    }
    else
    {
        app.UseExceptionHandler("/Home/Error");
    }

    app.Use(async (context, next) =>
    {
        await next();
        if (context.Response.StatusCode == 404)
        {
            context.Request.Path = "/Home/NotFoundPage";
            await next();
        }

        context.Request.Path = "/Home/BadRequestPage";
        //await next();
    });

    app.UseHttpsRedirection();
    app.UseStaticFiles();

    app.UseRouting();

    app.UseAuthentication();
    app.UseAuthorization();

    app.MapControllerRoute(
        name: "default",
        pattern: "{controller=Home}/{action=Index}/{id?}");

    app.MapHub<ChatHub>("/chatHub");
    app.MapHub<ProgressHub>("/progressHub");
    app.MapHub<AuthenticationHub>("/authenticationHub");

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}