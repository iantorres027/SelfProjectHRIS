$(function () {
    let theme = $("html").attr('data-bs-theme');

    devExpressThemeSwitch(theme);
});

function devExpressThemeSwitch(color) {
    let themeElement = document.getElementById("devExpressThemeBundle");

    if (!themeElement)
        return;

    let currentTheme = document.getElementById("devExpressThemeBundle").getAttribute('href');
    let url = currentTheme.replace("dark", "light");
    if (color == "dark")
        url = currentTheme.replace("light", "dark");

    themeElement.setAttribute('href', url);
}