using Microsoft.EntityFrameworkCore;

namespace Template.Infrastructure.Persistence;

public class EfCoreHelper<T> where T : class
{
    private readonly DbContext _context;

    public EfCoreHelper(DbContext context)
    {
        _context = context;
    }

    public async Task<List<T>> GetAllAsync()
    {
        return await _context.Set<T>().ToListAsync();
    }

    public async Task<T?> GetByIdAsync(int id)
    {
        return await _context.Set<T>().FindAsync(id);
    }


    // CreateAsync(T entity)
    // CreateAsync(T entity, )
    // string[] excluded = ["CreatedById", "DateCreated"];
    //  CreateAsync(T entity, excluded);

    public async Task<T> CreateAsync(T entity, params string[] excludedProperties)
    {
        using var transaction = _context.Database.BeginTransaction();

        try
        {
            _context.Set<T>().Add(entity);

            foreach (var excludedProperty in excludedProperties)
            {
                _context.Entry(entity).Property(excludedProperty).IsModified = false;
            }

            await _context.SaveChangesAsync();

            await transaction.CommitAsync();
            return entity;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<T> UpdateAsync(T entity, params string[] excludedProperties)
    {
        using var transaction = _context.Database.BeginTransaction();

        try
        {
            _context.Entry(entity).State = EntityState.Modified;

            foreach (var excludedProperty in excludedProperties)
            {
                _context.Entry(entity).Property(excludedProperty).IsModified = false;
            }

            await _context.SaveChangesAsync();

            await transaction.CommitAsync();
            return entity;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task DeleteAsync(T entity)
    {
        using var transaction = _context.Database.BeginTransaction();

        try
        {
            _context.Set<T>().Remove(entity);
            await _context.SaveChangesAsync();

            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task BatchDeleteAsync(IEnumerable<T> entities)
    {
        using var transaction = _context.Database.BeginTransaction();

        try
        {
            _context.Set<T>().RemoveRange(entities);
            await _context.SaveChangesAsync();

            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

}