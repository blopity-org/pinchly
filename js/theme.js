(function () {
    const THEME_KEY = 'pinchly-theme';
    const THEMES = {
        light: 'Light',
        dark: 'Dark',
        classic: 'Old-school',
    };

    function applyTheme(theme) {
        const selectedTheme = Object.hasOwn(THEMES, theme) ? theme : 'light';
        document.documentElement.dataset.theme = selectedTheme;
        localStorage.setItem(THEME_KEY, selectedTheme);
        return selectedTheme;
    }

    const currentTheme = applyTheme(localStorage.getItem(THEME_KEY));

    function addThemeControl() {
        const navbar = document.querySelector('#navbar');
        if (!navbar || navbar.querySelector('#siteTheme')) return;

        const control = document.createElement('div');
        control.className = 'theme-control';
        control.innerHTML = `
            <label for="siteTheme">Theme</label>
            <select id="siteTheme" aria-label="Choose color theme">
                ${Object.entries(THEMES)
                    .map(
                        ([value, label]) =>
                            `<option value="${value}">${label}</option>`
                    )
                    .join('')}
            </select>
        `;
        navbar.append(control);

        const selector = control.querySelector('#siteTheme');
        selector.value = currentTheme;
        selector.addEventListener('change', () => applyTheme(selector.value));
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addThemeControl, {
            once: true,
        });
    } else {
        addThemeControl();
    }
})();
