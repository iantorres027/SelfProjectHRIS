using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Template.Application.Interfaces.Setup;
using Template.Domain.Entities.Report;

namespace Template.Infrastructure.Persistence
{
    public class ReportDbContext : DbContext, IReportDbContext
    {
        private readonly IConfiguration _configuration;
        public DbSet<JsonDataConnectionDescription> JsonDataConnections { get; set; }
        public DbSet<SqlDataConnectionDescription> SqlDataConnections { get; set; }
        public DbSet<ReportItem> Reports { get; set; }

        public ReportDbContext(DbContextOptions<ReportDbContext> options, IConfiguration configuration)
            : base(options)
        {
            _configuration = configuration;
        }

        public void InitializeDatabase()
        {
            Database.EnsureCreated();

            var nwindJsonDataConnectionName = "NWindProductsJson";
            if (!JsonDataConnections.Any(x => x.Name == nwindJsonDataConnectionName))
            {
                var newData = new JsonDataConnectionDescription
                {
                    Name = nwindJsonDataConnectionName,
                    DisplayName = "Northwind Products (JSON)",
                    ConnectionString = "Uri=Data/nwind.json"
                };
                JsonDataConnections.Add(newData);
            }

            var nwindSqlDataConnectionName = "NWindConnectionString";
            if (!SqlDataConnections.Any(x => x.Name == nwindSqlDataConnectionName))
            {
                var newData = new SqlDataConnectionDescription
                {
                    Name = nwindSqlDataConnectionName,
                    DisplayName = "Northwind Data Connection",
                    ConnectionString = "XpoProvider=SQLite;Data Source=|DataDirectory|/Data/nwind.db"
                };
                SqlDataConnections.Add(newData);
            }

            var reportsDataConnectionName = "ReportsDataSql";
            if (!SqlDataConnections.Any(x => x.Name == reportsDataConnectionName))
            {
                var newData = new SqlDataConnectionDescription
                {
                    Name = reportsDataConnectionName,
                    DisplayName = "Reports Data (Demo)",
                    ConnectionString = _configuration.GetConnectionString("ReportsDataConnectionString") ?? ""
                };
                SqlDataConnections.Add(newData);
            }
            SaveChanges();
        }
    }
}