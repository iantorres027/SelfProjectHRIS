using Microsoft.AspNetCore.SignalR;
using Template.Application.Services;
using Template.Infrastructure.Hubs;

namespace Template.Infrastructure.Services;

public class LongOperationSignalRService : ILongOperationSignalRService
{
    private readonly IHubContext<ProgressHub> _hubContext;

    public LongOperationSignalRService(IHubContext<ProgressHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task RunLongOperation()
    {
        // Long operation logic
        int totalSteps = 100;

        for (int i = 1; i <= totalSteps; i++)
        {
            // Update progress
            int progressPercentage = i * 100 / totalSteps;
            await _hubContext.Clients.All.SendAsync("UpdateProgress", progressPercentage);

            // Perform the operation
            await PerformStep(i);
        }
    }

    private async Task PerformStep(int step)
    {
        // Perform the actual step of the long operation
        await Task.Delay(1000); // Simulated delay
    }
}