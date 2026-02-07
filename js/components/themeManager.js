export default class ThemeManager {
  constructor() {
    this.themeLink = document.documentElement;
    this.storageKey = 'theme-preference';
    this.buttons = [];

    // Icons
    this.ICONS = {
      system: `<svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`,
      light: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
      dark: `<svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`,
    };
  }

  init() {
    const savedTheme = this.getSavedTheme();
    this.applyTheme(savedTheme);

    // Listen for system changes if mode is 'system'
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (_e) => {
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
      const systemDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches;
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
    this.buttons.forEach((btn) => {
      // Update icon/text based on theme
      const icon = btn.querySelector('.icon');
      if (icon) {
        if (theme === 'system') icon.innerHTML = this.ICONS.system;
        else if (theme === 'light') icon.innerHTML = this.ICONS.light;
        else icon.innerHTML = this.ICONS.dark;
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
