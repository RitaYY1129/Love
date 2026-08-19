import { DataStore } from '../../data/store';
import { today } from '../../utils/date';

class DiaryModule {
  constructor() {
    this.bindEvents();
  }

  init(config) {
    this.config = config;
    this.render();
    this.bindEvents();
  }

  render() {
    const page = document.getElementById('page-diary');
    if (!page) return;

    const entries = DataStore.diary.get();
    const sortedEntries = [...entries].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

    page.innerHTML = `
      <div class="page-header">
        <button class="btn-back" onclick="App.switchTab('home')">←</button>
        <h1>📝 日记本</h1>
        <button class="btn btn-primary btn-sm" id="btnAddDiary">写日记</button>
      </div>
      <div class="page-content">
        ${sortedEntries.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">📔</div>
            <div class="empty-text">还没有日记</div>
            <div class="empty-hint">记录下你们的甜蜜瞬间吧</div>
          </div>
        ` : `
          <div class="diary-list">
            ${sortedEntries.map(entry => this.renderDiaryItem(entry)).join('')}
          </div>
        `}
      </div>
    `;
  }

  renderDiaryItem(entry) {
    return `
      <div class="diary-item" data-id="${entry.id}">
        <div class="diary-item-header">
          <span class="diary-date">${entry.date || '未知日期'}</span>
          ${entry.mood ? `<span class="diary-mood">${entry.mood}</span>` : ''}
        </div>
        <h3 class="diary-title">${entry.title || '无标题'}</h3>
        <p class="diary-content">${entry.text || ''}</p>
        <div class="diary-item-footer">
          <button class="btn btn-outline btn-xs" data-action="edit">编辑</button>
          <button class="btn btn-outline btn-xs" data-action="delete">删除</button>
        </div>
      </div>
    `;
  }

  openEditor(entry = null) {
    const isEdit = !!entry;
    const html = `
      <div class="diary-editor">
        <div class="editor-header">
          <h3>${isEdit ? '编辑日记' : '写日记'}</h3>
          <button class="btn-close" id="closeEditor">×</button>
        </div>
        <div class="editor-body">
          <input type="text" class="form-input" id="diaryTitle" placeholder="标题" value="${entry?.title || ''}">
          <input type="date" class="form-input" id="diaryDate" value="${entry?.date || today()}">
          <textarea class="form-textarea" id="diaryText" placeholder="写下今天的故事...">${entry?.text || ''}</textarea>
          <div class="mood-selector">
            <span>今天的心情：</span>
            ${['😊', '😍', '😢', '😠', '🥰', '😲'].map(mood => `
              <button class="mood-btn ${entry?.mood === mood ? 'active' : ''}" data-mood="${mood}">${mood}</button>
            `).join('')}
          </div>
        </div>
        <div class="editor-footer">
          <button class="btn btn-primary" id="saveDiary">${isEdit ? '保存' : '发表'}</button>
        </div>
      </div>
    `;

    this.openOverlay(html);
    
    setTimeout(() => {
      const moodBtns = document.querySelectorAll('.mood-btn');
      moodBtns.forEach(btn => {
        btn.addEventListener('click', function() {
          moodBtns.forEach(b => b.classList.remove('active'));
          this.classList.add('active');
        });
      });

      document.getElementById('saveDiary').addEventListener('click', () => {
        const title = document.getElementById('diaryTitle').value;
        const date = document.getElementById('diaryDate').value;
        const text = document.getElementById('diaryText').value;
        const mood = document.querySelector('.mood-btn.active')?.getAttribute('data-mood');

        if (!text.trim()) {
          alert('请写点什么吧');
          return;
        }

        if (isEdit) {
          DataStore.diary.update(entry.id, { title, date, text, mood });
        } else {
          DataStore.diary.add({ title, date, text, mood });
        }

        this.closeOverlay();
        this.render();
        this.bindEvents();
      });

      document.getElementById('closeEditor').addEventListener('click', () => {
        this.closeOverlay();
      });
    }, 100);
  }

  bindEvents() {
    const self = this;

    document.getElementById('btnAddDiary')?.addEventListener('click', () => {
      self.openEditor();
    });

    document.querySelectorAll('.diary-item [data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = parseInt(this.closest('.diary-item').getAttribute('data-id'));
        const entry = DataStore.diary.get().find(e => e.id === id);
        if (entry) {
          self.openEditor(entry);
        }
      });
    });

    document.querySelectorAll('.diary-item [data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = parseInt(this.closest('.diary-item').getAttribute('data-id'));
        if (confirm('确定删除这篇日记吗？')) {
          DataStore.diary.delete(id);
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

export default DiaryModule;