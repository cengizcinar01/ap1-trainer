export default class ThemeManager {
  constructor() {
    this.themeLink = document.documentElement;
    this.storageKey = 'theme-preference';
    this.buttons = [];

    this.init();
  }

  init() {
    const savedTheme = this.getSavedTheme();
    this.applyTheme(savedTheme);
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
    if (!this.buttons.includes(btnElement)) {
      this.buttons.push(btnElement);

      this._updateButtonState(btnElement, this.getSavedTheme());

      btnElement.addEventListener('click', () => {
        const current = this.getSavedTheme();
        const next = current === 'light' ? 'dark' : 'light';
        this.setTheme(next);
      });
    }
  }

  updateButtons(theme) {
    this.buttons.forEach((btn) => {
      this._updateButtonState(btn, theme);
    });
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  _updateButtonState(btn, theme) {
    const icon = btn.querySelector('.icon');
    if (icon) {
      // If light theme, show moon (action: switch to dark)
      // If dark theme, show sun (action: switch to light)
      const iconName = theme === 'light' ? 'moon' : 'sun';
      icon.innerHTML = `<i data-lucide="${iconName}" style="width: 16px; height: 16px;"></i>`;
    }
    const label = btn.querySelector('.label');
    if (label) {
      label.textContent = theme === 'light' ? 'Dunkel' : 'Hell';
    }
  }
}

export const themeManager = new ThemeManager();
