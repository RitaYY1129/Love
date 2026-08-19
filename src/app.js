import { APP_CONFIG } from './config/app';
import { DataStore } from './data/store';
import HomeModule from './modules/home';
import DiaryModule from './modules/diary';
import SettingsModule from './modules/settings';
import PhotoModule from './modules/photo';
import WishesModule from './modules/wishes';
import AnniversaryModule from './modules/anniversary';
import PlanModule from './modules/plan';
import MeModule from './modules/me';
import LocationModule from './modules/location';
import AlarmModule from './modules/alarm';
import VentModule from './modules/vent';
import QuizModule from './modules/quiz';
import BucketlistModule from './modules/bucketlist';
import GamesModule from './modules/games';

class App {
  constructor() {
    this.config = null;
    this.modules = {};
    this.registerModules();
  }

  registerModules() {
    this.modules['home'] = new HomeModule();
    this.modules['diary'] = new DiaryModule();
    this.modules['settings'] = new SettingsModule();
    this.modules['photo'] = new PhotoModule();
    this.modules['wishes'] = new WishesModule();
    this.modules['anniversary'] = new AnniversaryModule();
    this.modules['plan'] = new PlanModule();
    this.modules['me'] = new MeModule();
    this.modules['location'] = new LocationModule();
    this.modules['alarm'] = new AlarmModule();
    this.modules['vent'] = new VentModule();
    this.modules['quiz'] = new QuizModule();
    this.modules['bucketlist'] = new BucketlistModule();
    this.modules['games'] = new GamesModule();
  }

  init() {
    this.config = this.loadConfig();
    this.applyTheme(this.config.theme);
    this.initTabBar();

    for (const [name, mod] of Object.entries(this.modules)) {
      if (name === 'settings') {
        mod.init(this.config);
        continue;
      }
      if (!mod.init) continue;
      const modCfg = this.config.modules[name];
      if (!modCfg) {
        this.config.modules[name] = { enabled: true, order: 99 };
        mod.init(this.config);
      } else if (modCfg.enabled) {
        mod.init(this.config);
      }
    }

    this.switchTab('home');

    setInterval(() => {
      if (this.modules.alarm && this.modules.alarm.tick) {
        this.modules.alarm.tick();
      }
    }, 60000);
  }

  loadConfig() {
    const saved = DataStore.config.get();
    if (saved) return saved;
    
    const defaults = JSON.parse(JSON.stringify({
      theme: APP_CONFIG.defaultTheme,
      couple: {
        startDate: new Date().toISOString().split('T')[0],
        him: { name: '他', avatar: '👨' },
        her: { name: '她', avatar: '👩' }
      },
      modules: { ...APP_CONFIG.modules }
    }));
    
    DataStore.config.set(defaults);
    return defaults;
  }

  applyTheme(themeId) {
    const theme = APP_CONFIG.themes.find(t => t.id === themeId);
    document.body.className = theme ? theme.class : '';
  }

  switchTab(name) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const page = document.getElementById('page-' + name);
    if (page) {
      page.classList.add('active');
      page.scrollTop = 0;
    }
    
    document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
    const tab = document.querySelector(`.tab-item[data-tab="${name}"]`);
    if (tab) tab.classList.add('active');
  }

  initTabBar() {
    const bar = document.querySelector('.tab-bar');
    if (!bar) return;
    bar.innerHTML = '';

    const moduleNames = Object.keys(this.config.modules)
      .filter(n => this.config.modules[n].enabled && n !== 'settings')
      .sort((a, b) => this.config.modules[a].order - this.config.modules[b].order);

    moduleNames.forEach(name => {
      const mod = this.config.modules[name];
      const tab = document.createElement('div');
      tab.className = 'tab-item' + (name === 'home' ? ' active' : '');
      tab.setAttribute('data-tab', name);
      tab.innerHTML = `<span class="icon">${mod.icon || '📋'}</span><span>${mod.label || name}</span>`;
      tab.addEventListener('click', () => this.switchTab(name));
      bar.appendChild(tab);
    });
  }

  refreshTabs() {
    this.initTabBar();
    this.switchTab('home');
  }

  saveConfig() {
    DataStore.config.set(this.config);
  }
}

const AppInstance = new App();

document.addEventListener('DOMContentLoaded', () => {
  if (window.__authComplete) return;
  
  const session = DataStore.session.get();
  if (session && Date.now() - session.loginTime < 30 * 24 * 3600 * 1000) {
    AppInstance.init();
  }
});

export { AppInstance as App };
export default AppInstance;