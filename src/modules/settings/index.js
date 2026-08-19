import { APP_CONFIG } from '../../config/app';
import { DataStore } from '../../data/store';

class SettingsModule {
  constructor() {}

  init(config) {
    this.config = config;
    this.render();
    this.bindEvents();
  }

  render() {
    const page = document.getElementById('page-settings');
    if (!page) return;

    page.innerHTML = `
      <div class="page-header">
        <button class="btn-back" onclick="App.switchTab('home')">←</button>
        <h1>⚙️ 设置</h1>
      </div>
      <div class="page-content">
        <div class="section-card">
          <h3>主题设置</h3>
          <div class="theme-grid">
            ${APP_CONFIG.themes.map(theme => `
              <button class="theme-card ${this.config.theme === theme.id ? 'active' : ''}" 
                      data-theme="${theme.id}" 
                      style="--theme-color: ${theme.primaryColor}">
                <div class="theme-preview"></div>
                <span>${theme.name}</span>
              </button>
            `).join('')}
          </div>
        </div>
        <div class="section-card">
          <h3>模块管理</h3>
          <div class="modules-list">
            ${Object.entries(APP_CONFIG.modules).map(([key, mod]) => `
              <div class="module-item">
                <div class="module-info">
                  <span class="module-icon">${mod.icon}</span>
                  <span>${mod.label}</span>
                </div>
                <label class="switch">
                  <input type="checkbox" ${mod.enabled ? 'checked' : ''} data-module="${key}">
                  <span class="slider"></span>
                </label>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="section-card">
          <h3>关于</h3>
          <div class="about-list">
            <div class="about-item">
              <span>版本</span>
              <span>${APP_CONFIG.version}</span>
            </div>
            <div class="about-item">
              <span>名称</span>
              <span>${APP_CONFIG.name}</span>
            </div>
          </div>
        </div>
        <button class="btn btn-danger btn-block" id="btnClearData">清除所有数据</button>
      </div>
    `;
  }

  bindEvents() {
    const self = this;

    document.querySelectorAll('.theme-card').forEach(card => {
      card.addEventListener('click', function() {
        const themeId = this.getAttribute('data-theme');
        self.config.theme = themeId;
        DataStore.config.set(self.config);
        AppConfig.applyTheme(themeId);
        self.render();
        self.bindEvents();
      });
    });

    document.querySelectorAll('.modules-list input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', function() {
        const moduleKey = this.getAttribute('data-module');
        if (self.config.modules[moduleKey]) {
          self.config.modules[moduleKey].enabled = this.checked;
          DataStore.config.set(self.config);
        }
      });
    });

    document.getElementById('btnClearData')?.addEventListener('click', function() {
      if (confirm('确定要清除所有数据吗？此操作不可恢复！')) {
        DataStore.session.clear();
        localStorage.clear();
        window.location.reload();
      }
    });
  }
}

export default SettingsModule;