import { DataStore } from '../../data/store';

class LocationModule {
  constructor() {}

  init(config) {
    this.config = config;
    this.render();
    this.bindEvents();
  }

  render() {
    const page = document.getElementById('page-location');
    if (!page) return;

    const locations = this.getLocations();

    page.innerHTML = `
      <div class="page-header">
        <button class="btn-back" onclick="App.switchTab('home')">←</button>
        <h1>📍 足迹</h1>
        <button class="btn btn-primary btn-sm" id="btnAddLocation">添加足迹</button>
      </div>
      <div class="page-content">
        <div class="map-placeholder">
          <div class="map-icon">🗺️</div>
          <div class="map-text">地图视图</div>
        </div>
        ${locations.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">📍</div>
            <div class="empty-text">还没有足迹</div>
            <div class="empty-hint">记录你们去过的地方吧</div>
          </div>
        ` : `
          <div class="location-list">
            ${locations.map(loc => this.renderLocationItem(loc)).join('')}
          </div>
        `}
      </div>
    `;
  }

  getLocations() {
    return DataStore.get('LOCATION') || [];
  }

  renderLocationItem(loc) {
    return `
      <div class="location-item" data-id="${loc.id}">
        <div class="loc-icon">${loc.icon || '📍'}</div>
        <div class="loc-content">
          <h3>${loc.name}</h3>
          <p>${loc.time || ''}</p>
          ${loc.duration ? `<small>停留 ${loc.duration}</small>` : ''}
        </div>
        <button class="loc-delete" data-action="delete">×</button>
      </div>
    `;
  }

  openAddForm() {
    const html = `
      <div class="location-editor">
        <div class="editor-header">
          <h3>添加足迹</h3>
          <button class="btn-close" id="closeLocEditor">×</button>
        </div>
        <div class="editor-body">
          <input type="text" class="form-input" id="locName" placeholder="地点名称">
          <input type="datetime-local" class="form-input" id="locTime">
          <input type="text" class="form-input" id="locDuration" placeholder="停留时长（如：2小时）">
          <div class="icon-selector">
            <span>选择图标：</span>
            ${['📍', '🏪', '🍜', '🎬', '🏠', '🏞️', '🛍️', '🎡'].map(icon => `
              <button class="icon-btn" data-icon="${icon}">${icon}</button>
            `).join('')}
          </div>
        </div>
        <div class="editor-footer">
          <button class="btn btn-primary" id="saveLocation">添加</button>
        </div>
      </div>
    `;

    this.openOverlay(html);

    setTimeout(() => {
      let selectedIcon = '📍';
      document.querySelectorAll('.icon-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          document.querySelectorAll('.icon-btn').forEach(b => b.classList.remove('active'));
          this.classList.add('active');
          selectedIcon = this.getAttribute('data-icon');
        });
      });

      document.getElementById('saveLocation')?.addEventListener('click', () => {
        const name = document.getElementById('locName').value;
        if (!name.trim()) {
          alert('请输入地点名称');
          return;
        }

        const locations = this.getLocations();
        locations.push({
          id: Date.now(),
          name,
          time: document.getElementById('locTime').value,
          duration: document.getElementById('locDuration').value,
          icon: selectedIcon,
          createdAt: Date.now()
        });
        DataStore.set('LOCATION', locations);

        this.closeOverlay();
        this.render();
        this.bindEvents();
      });

      document.getElementById('closeLocEditor')?.addEventListener('click', () => {
        this.closeOverlay();
      });
    }, 100);
  }

  bindEvents() {
    const self = this;

    document.getElementById('btnAddLocation')?.addEventListener('click', () => {
      self.openAddForm();
    });

    document.querySelectorAll('.loc-delete').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = parseInt(this.closest('.location-item').getAttribute('data-id'));
        if (confirm('确定删除这个足迹吗？')) {
          const locations = self.getLocations();
          const filtered = locations.filter(l => l.id !== id);
          DataStore.set('LOCATION', filtered);
          self.render();
          self.bindEvents();
        }
      });
    });
  }

  openOverlay(content) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay overlay-full';
    overlay.innerHTML = content;
    document.body.appendChild(overlay);
    setTimeout(() => overlay.classList.add('show'), 10);
    this.currentOverlay = overlay;
  }

  closeOverlay() {
    if (this.currentOverlay) {
      this.currentOverlay.classList.remove('show');
      setTimeout(() => this.currentOverlay.remove(), 300);
      this.currentOverlay = null;
    }
  }
}

export default LocationModule;