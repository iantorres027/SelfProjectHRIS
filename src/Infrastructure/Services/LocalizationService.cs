using Microsoft.Extensions.Localization;
using Template.Application.Services;
using Template.Infrastructure.Resources;

namespace Template.Infrastructure.Services;

public class LocalizationService : ILocalizationService
{
    private readonly IStringLocalizer<SharedResources> _localizer;

    public LocalizationService(IStringLocalizer<SharedResources> localizer)
    {
        _localizer = localizer;
    }

    public string GetLocalizedString(string key)
    {
        return _localizer[key] ?? string.Empty;
    }

    public Dictionary<string, string> GetLocalizedStrings()
    {
        var localizedStrings = _localizer.GetAllStrings()
            .ToDictionary(s => s.Name, s => s.Value);

        return localizedStrings;
    }
}