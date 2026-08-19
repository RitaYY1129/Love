import { DataStore } from '../../data/store';

class AlarmModule {
  constructor() {
    this.alarms = [];
  }

  init(config) {
    this.config = config;
    this.loadAlarms();
    this.render();
    this.bindEvents();
  }

  loadAlarms() {
    this.alarms = DataStore.get('ALARM') || [];
  }

  render() {
    const page = document.getElementById('page-alarm');
    if (!page) return;

    page.innerHTML = `
      <div class="page-header">
        <button class="btn-back" onclick="App.switchTab('home')">←</button>
        <h1>⏰ 闹钟</h1>
        <button class="btn btn-primary btn-sm" id="btnAddAlarm">添加闹钟</button>
      </div>
      <div class="page-content">
        ${this.alarms.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">⏰</div>
            <div class="empty-text">还没有闹钟</div>
            <div class="empty-hint">设置甜蜜的提醒吧</div>
          </div>
        ` : `
          <div class="alarm-list">
            ${this.alarms.map(alarm => this.renderAlarmItem(alarm)).join('')}
          </div>
        `}
      </div>
    `;
  }

  renderAlarmItem(alarm) {
    const days = alarm.days || ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    return `
      <div class="alarm-item" data-id="${alarm.id}">
        <div class="alarm-time">${alarm.time}</div>
        <div class="alarm-info">
          <h4>${alarm.title || '闹钟'}</h4>
          <p>${days.join(' ')}</p>
        </div>
        <label class="switch">
          <input type="checkbox" ${alarm.enabled ? 'checked' : ''} data-action="toggle">
          <span class="slider"></span>
        </label>
        <button class="alarm-delete" data-action="delete">×</button>
      </div>
    `;
  }

  openAddForm() {
    const html = `
      <div class="alarm-editor">
        <div class="editor-header">
          <h3>添加闹钟</h3>
          <button class="btn-close" id="closeAlarmEditor">×</button>
        </div>
        <div class="editor-body">
          <input type="time" class="form-input" id="alarmTime">
          <input type="text" class="form-input" id="alarmTitle" placeholder="闹钟名称（可选）">
          <div class="days-selector">
            <span>重复：</span>
            ${['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map(day => `
              <button class="day-btn active" data-day="${day}">${day}</button>
            `).join('')}
          </div>
        </div>
        <div class="editor-footer">
          <button class="btn btn-primary" id="saveAlarm">添加</button>
        </div>
      </div>
    `;

    this.openOverlay(html);

    setTimeout(() => {
      const selectedDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
      
      document.querySelectorAll('.day-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          this.classList.toggle('active');
          const day = this.getAttribute('data-day');
          const index = selectedDays.indexOf(day);
          if (index > -1) {
            selectedDays.splice(index, 1);
          } else {
            selectedDays.push(day);
          }
        });
      });

      document.getElementById('saveAlarm')?.addEventListener('click', () => {
        const time = document.getElementById('alarmTime').value;
        if (!time) {
          alert('请选择时间');
          return;
        }

        const alarm = {
          id: Date.now(),
          time,
          title: document.getElementById('alarmTitle').value || '闹钟',
          days: selectedDays.sort(this.compareDays),
          enabled: true,
          createdAt: Date.now()
        };

        this.alarms.push(alarm);
        DataStore.set('ALARM', this.alarms);

        this.closeOverlay();
        this.render();
        this.bindEvents();
      });

      document.getElementById('closeAlarmEditor')?.addEventListener('click', () => {
        this.closeOverlay();
      });
    }, 100);
  }

  compareDays(a, b) {
    const order = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    return order.indexOf(a) - order.indexOf(b);
  }

  bindEvents() {
    const self = this;

    document.getElementById('btnAddAlarm')?.addEventListener('click', () => {
      self.openAddForm();
    });

    document.querySelectorAll('.alarm-item input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', function() {
        const id = parseInt(this.closest('.alarm-item').getAttribute('data-id'));
        const alarm = self.alarms.find(a => a.id === id);
        if (alarm) {
          alarm.enabled = this.checked;
          DataStore.set('ALARM', self.alarms);
        }
      });
    });

    document.querySelectorAll('.alarm-delete').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = parseInt(this.closest('.alarm-item').getAttribute('data-id'));
        if (confirm('确定删除这个闹钟吗？')) {
          self.alarms = self.alarms.filter(a => a.id !== id);
          DataStore.set('ALARM', self.alarms);
          self.render();
          self.bindEvents();
        }
      });
    });
  }

  tick() {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    this.alarms.forEach(alarm => {
      if (alarm.enabled && alarm.time === currentTime) {
        this.triggerAlarm(alarm);
      }
    });
  }

  triggerAlarm(alarm) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(alarm.title, {
        body: '甜蜜提醒时间到！',
        icon: 'assets/img/icon-192.png'
      });
    }
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

export default AlarmModule;