using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Template.Application.Interfaces.Setup;
using Template.Application.Interfaces.Setup.DocumentRepository;
using Template.Application.Interfaces.Setup.ModuleRepository;
using Template.Application.Interfaces.Setup.RoleRepository;
using Template.Application.Interfaces.Setup.TaxRepository;
using Template.Application.Interfaces.Setup.UserRepository;
using Template.Application.Interfaces.Transaction.PurchaseOrderRepository;
using Template.Application.Services;
using Template.Infrastructure.Persistence;
using Template.Infrastructure.Persistence.Configuration;
using Template.Infrastructure.Persistence.Repositories.Setup;
using Template.Infrastructure.Persistence.Repositories.Setup.DocumentRepository;
using Template.Infrastructure.Persistence.Repositories.Setup.ModuleRepository;
using Template.Infrastructure.Persistence.Repositories.Setup.RoleRepository;
using Template.Infrastructure.Persistence.Repositories.Setup.TaxRepository;
using Template.Infrastructure.Persistence.Repositories.Setup.UserRepository;
using Template.Infrastructure.Persistence.Repositories.Transaction.PurchaseOrderRepository;
using Template.Infrastructure.Services;

namespace Template.Infrastructure;

public static class DependencyInjectionConfig
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var defaultConstr = configuration.GetConnectionString("Default");
        var reportConstr = configuration.GetConnectionString("ReportsDataConnectionString");

        var mapperConfig = new MapperConfiguration(mc =>
        {
            mc.AddProfile(new MappingProfile());
        });

        IMapper mapper = mapperConfig.CreateMapper();
        services.AddSingleton(mapper);

        services.AddDbContext<ReportDbContext>(options =>
        {
            options.UseSqlServer(reportConstr);
        });

        services.AddDbContext<MNLTemplateDBContext>(options =>
        {
            options.EnableSensitiveDataLogging();
            options.UseSqlServer(defaultConstr);
        });

        services.AddScoped<IReportDbContext>(provider => provider.GetRequiredService<ReportDbContext>());
        //services.AddScoped<IMNLTemplateDBContext>(provider => provider.GetRequiredService<MNLTemplateDBContext>());

        services.AddBrowserDetection();

        services.AddSingleton<ISQLDatabaseService, SQLDatabaseService>();
        services.AddScoped<IJwtService, JwtService>();
        services.AddScoped<IAuthenticationService, AuthenticationService>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<IFileUploadService, FileUploadService>();
        services.AddScoped<ILocalizationService, LocalizationService>();

        services.AddScoped<ICountryRepository, CountryRepository>();
        services.AddScoped<ICurrencyRepository, CurrencyRepository>();
        services.AddScoped<IEwtTypeRepository, EwtTypeRepository>();
        services.AddScoped<IVatTypeRepository, VatTypeRepository>();
        services.AddScoped<ICompanyRepository, CompanyRepository>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IUserApproverRepository, UserApproverRepository>();
        services.AddScoped<IUserActivityRepository, UserActivityRepository>();
        services.AddScoped<IUserTokenRepository, UserTokenRepository>();
        services.AddScoped<IModuleRepository, ModuleRepository>();
        services.AddScoped<IModuleSettingRepository, ModuleSettingRepository>();
        services.AddScoped<IModuleStageApproverRepository, ModuleStageApproverRepository>();
        services.AddScoped<IModuleStageRepository, ModuleStageRepository>();
        services.AddScoped<IModuleTypeRepository, ModuleTypeRepository>();
        services.AddScoped<IDocumentRepository, DocumentRepository>();
        services.AddScoped<IRoleRepository, RoleRepository>();

        services.AddScoped<IPurchaseOrderRepository, PurchaseOrderRepository>();
        services.AddScoped<IPurchaseOrderDetailRepository, PurchaseOrderDetailRepository>();

        services.AddScoped<ILongOperationSignalRService, LongOperationSignalRService>();

        return services;
    }
}