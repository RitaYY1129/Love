import { DataStore } from '../../data/store';
import { daysUntil } from '../../utils/date';

class AnniversaryModule {
  constructor() {
    this.types = [
      { id: 'birthday', name: '生日', icon: '🎂' },
      { id: 'anniversary', name: '纪念日', icon: '💍' },
      { id: 'milestone', name: '里程碑', icon: '🎉' },
      { id: 'other', name: '其他', icon: '📅' }
    ];
  }

  init(config) {
    this.config = config;
    this.render();
    this.bindEvents();
  }

  render() {
    const page = document.getElementById('page-anniversary');
    if (!page) return;

    const anniversaries = DataStore.anniversary.get();
    const sorted = [...anniversaries].sort((a, b) => {
      const daysA = daysUntil(a.date);
      const daysB = daysUntil(b.date);
      return daysA - daysB;
    });

    page.innerHTML = `
      <div class="page-header">
        <button class="btn-back" onclick="App.switchTab('home')">←</button>
        <h1>🎂 纪念日</h1>
        <button class="btn btn-primary btn-sm" id="btnAddAnn">添加纪念日</button>
      </div>
      <div class="page-content">
        ${sorted.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">🎁</div>
            <div class="empty-text">还没有纪念日</div>
            <div class="empty-hint">记录你们的特殊日子吧</div>
          </div>
        ` : `
          <div class="anniversary-list">
            ${sorted.map(ann => this.renderAnnItem(ann)).join('')}
          </div>
        `}
      </div>
    `;
  }

  renderAnnItem(ann) {
    const days = daysUntil(ann.date);
    const isToday = days === 0;
    const isOverdue = days < 0;

    return `
      <div class="anniversary-item" data-id="${ann.id}">
        <div class="ann-icon">${ann.icon || '📅'}</div>
        <div class="ann-content">
          <h3>${ann.title}</h3>
          <p>${ann.date}</p>
        </div>
        <div class="ann-days ${isToday ? 'today' : isOverdue ? 'overdue' : ''}">
          ${isToday ? '今天' : isOverdue ? `${Math.abs(days)}天前` : `${days}天后`}
        </div>
        <button class="ann-delete" data-action="delete">×</button>
      </div>
    `;
  }

  openAddForm() {
    const html = `
      <div class="ann-editor">
        <div class="editor-header">
          <h3>添加纪念日</h3>
          <button class="btn-close" id="closeAnnEditor">×</button>
        </div>
        <div class="editor-body">
          <input type="text" class="form-input" id="annTitle" placeholder="纪念日名称">
          <input type="date" class="form-input" id="annDate">
          <div class="type-selector">
            <span>类型：</span>
            ${this.types.map(t => `
              <button class="type-btn" data-type="${t.id}" data-icon="${t.icon}">
                ${t.icon} ${t.name}
              </button>
            `).join('')}
          </div>
        </div>
        <div class="editor-footer">
          <button class="btn btn-primary" id="saveAnn">添加</button>
        </div>
      </div>
    `;

    this.openOverlay(html);

    setTimeout(() => {
      let selectedType = this.types[0];
      document.querySelectorAll('.type-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
          this.classList.add('active');
          selectedType = {
            id: this.getAttribute('data-type'),
            icon: this.getAttribute('data-icon')
          };
        });
      });

      document.getElementById('saveAnn')?.addEventListener('click', () => {
        const title = document.getElementById('annTitle').value;
        const date = document.getElementById('annDate').value;

        if (!title.trim()) {
          alert('请输入纪念日名称');
          return;
        }
        if (!date) {
          alert('请选择日期');
          return;
        }

        DataStore.anniversary.add({
          title,
          date,
          icon: selectedType.icon,
          type: selectedType.id
        });

        this.closeOverlay();
        this.render();
        this.bindEvents();
      });

      document.getElementById('closeAnnEditor')?.addEventListener('click', () => {
        this.closeOverlay();
      });
    }, 100);
  }

  bindEvents() {
    const self = this;

    document.getElementById('btnAddAnn')?.addEventListener('click', () => {
      self.openAddForm();
    });

    document.querySelectorAll('.ann-delete').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = parseInt(this.closest('.anniversary-item').getAttribute('data-id'));
        if (confirm('确定删除这个纪念日吗？')) {
          const anns = DataStore.anniversary.get();
          const filtered = anns.filter(a => a.id !== id);
          DataStore.anniversary.set(filtered);
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

export default AnniversaryModule;