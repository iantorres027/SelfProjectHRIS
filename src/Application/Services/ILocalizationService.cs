namespace Template.Application.Services;

public interface ILocalizationService
{
    string GetLocalizedString(string key);

    Dictionary<string, string> GetLocalizedStrings();
}