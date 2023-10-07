using System.Data;

namespace Template.Application.Services;

public interface ISQLDatabaseService
{
    Task ExecuteAsync<T>(string storedProcedure, T parameters, string connectionId = "Default");

    Task<IEnumerable<T>> LoadDataAsync<T, U>(string storedProcedure, U parameters, string connectionId = "Default");

    Task<T?> LoadSingleAsync<T, U>(string storedProcedure, U parameters, CommandType commandType = CommandType.StoredProcedure, string connectionId = "Default");
}