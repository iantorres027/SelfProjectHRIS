using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System.Data;
using Template.Application.Services;

namespace Template.Infrastructure.Services;

public class SQLDatabaseService : ISQLDatabaseService
{
    private readonly IConfiguration _config;

    public SQLDatabaseService(IConfiguration config)
    {
        _config = config;
    }

    public async Task<IEnumerable<T>> LoadDataAsync<T, U>(
        string storedProcedure,
        U parameters,
        string connectionId = "Default")
    {
        using IDbConnection connection = new SqlConnection(_config.GetConnectionString(connectionId));
        return await connection.QueryAsync<T>(storedProcedure, parameters, commandType: CommandType.StoredProcedure);
    }

    public async Task<T?> LoadSingleAsync<T, U>(
        string storedProcedure,
        U parameters,
        CommandType commandType = CommandType.StoredProcedure,
        string connectionId = "Default")
    {
        using IDbConnection connection = new SqlConnection(_config.GetConnectionString(connectionId));
        var result = await connection.QueryAsync<T>(storedProcedure, parameters, commandType: commandType);

        return result.FirstOrDefault();
    }

    public async Task ExecuteAsync<T>(string storedProcedure, T parameters, string connectionId = "Default")
    {
        using IDbConnection connection = new SqlConnection(_config.GetConnectionString(connectionId));
        connection.Open();
        using var transaction = connection.BeginTransaction();
        try
        {
            await connection.ExecuteAsync(storedProcedure, parameters, transaction, commandType: CommandType.StoredProcedure);
            transaction.Commit();
        }
        catch (Exception) { transaction.Rollback(); throw; }
    }
}