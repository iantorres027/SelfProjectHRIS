using System.Linq;

namespace Template.Domain.Entities.Report;

public abstract class DataConnection
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string DisplayName { get; set; }
    public string ConnectionString { get; set; }
}