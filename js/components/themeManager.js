export default class ThemeManager {
    constructor() {
        this.themeLink = document.documentElement;
        this.storageKey = 'theme-preference';
        this.buttons = [];
    }

    init() {
        const savedTheme = this.getSavedTheme();
        this.applyTheme(savedTheme);

        // Listen for system changes if mode is 'system'
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (this.getSavedTheme() === 'system') {
                this.applyTheme('system');
            }
        });

        return savedTheme;
    }

    getSavedTheme() {
        return localStorage.getItem(this.storageKey) || 'system';
    }

    setTheme(theme) {
        localStorage.setItem(this.storageKey, theme);
        this.applyTheme(theme);
        this.updateButtons(theme);
    }

    applyTheme(theme) {
        let effectiveTheme = theme;

        if (theme === 'system') {
            const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            effectiveTheme = systemDark ? 'dark' : 'light';
        }

        if (effectiveTheme === 'dark') {
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
        }
    }

    registerButton(btnElement) {
        this.buttons.push(btnElement);
        this.updateButtons(this.getSavedTheme());

        btnElement.addEventListener('click', () => {
            const current = this.getSavedTheme();
            let next = 'system';
            if (current === 'system') next = 'light';
            else if (current === 'light') next = 'dark';

            this.setTheme(next);
        });
    }

    updateButtons(theme) {
        this.buttons.forEach(btn => {
            // Update icon/text based on theme
            const icon = btn.querySelector('.icon');
            if (icon) {
                if (theme === 'system') icon.textContent = '🌓';
                else if (theme === 'light') icon.textContent = '☀️';
                else icon.textContent = '🌙';
            }
            const label = btn.querySelector('.label');
            if (label) {
                if (theme === 'system') label.textContent = 'System';
                else if (theme === 'light') label.textContent = 'Light';
                else label.textContent = 'Dark';
            }
        });
    }
}
