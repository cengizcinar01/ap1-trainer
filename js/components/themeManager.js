export default class ThemeManager {
  constructor() {
    this.themeLink = document.documentElement;
    this.storageKey = 'theme-preference';
    this.buttons = [];

    // Icons
    this.ICONS = {
      light: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`,
      dark: `<svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`,
    };
  }

  init() {
    const savedTheme = this.getSavedTheme();
    this.applyTheme(savedTheme);
    return savedTheme;
  }

  getSavedTheme() {
    return localStorage.getItem(this.storageKey) || 'light';
  }

  setTheme(theme) {
    localStorage.setItem(this.storageKey, theme);
    this.applyTheme(theme);
    this.updateButtons(theme);
  }

  applyTheme(theme) {
    if (theme === 'dark') {
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
      const next = current === 'light' ? 'dark' : 'light';
      this.setTheme(next);
    });
  }

  updateButtons(theme) {
    this.buttons.forEach((btn) => {
      const icon = btn.querySelector('.icon');
      if (icon) {
        icon.innerHTML = theme === 'light' ? this.ICONS.light : this.ICONS.dark;
      }
      const label = btn.querySelector('.label');
      if (label) {
        label.textContent = theme === 'light' ? 'Hell' : 'Dunkel';
      }
    });
  }
}
