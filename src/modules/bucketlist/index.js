import { DataStore } from '../../data/store';

class BucketlistModule {
  constructor() {}

  init(config) {
    this.config = config;
    this.render();
    this.bindEvents();
  }

  render() {
    const page = document.getElementById('page-bucketlist');
    if (!page) return;

    const items = this.getItems();
    const completed = items.filter(i => i.done).length;

    page.innerHTML = `
      <div class="page-header">
        <button class="btn-back" onclick="App.switchTab('home')">←</button>
        <h1>📋 愿望清单</h1>
        <button class="btn btn-primary btn-sm" id="btnAddItem">添加愿望</button>
      </div>
      <div class="page-content">
        <div class="progress-section">
          <div class="progress-circle">
            <span class="progress-value">${completed}/${items.length}</span>
          </div>
          <div class="progress-label">已完成 ${Math.round((completed / items.length) * 100) || 0}%</div>
        </div>
        ${items.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">🌟</div>
            <div class="empty-text">还没有愿望</div>
            <div class="empty-hint">添加你们想一起完成的事情吧</div>
          </div>
        ` : `
          <div class="bucketlist-list">
            ${items.map(item => this.renderItem(item)).join('')}
          </div>
        `}
      </div>
    `;
  }

  getItems() {
    return DataStore.get('BUCKETLIST') || [];
  }

  renderItem(item) {
    return `
      <div class="bucketlist-item ${item.done ? 'done' : ''}" data-id="${item.id}">
        <button class="item-checkbox" data-action="toggle">
          ${item.done ? '✓' : ''}
        </button>
        <div class="item-content">
          <h4>${item.title}</h4>
          ${item.description ? `<p>${item.description}</p>` : ''}
          ${item.date ? `<small>目标日期：${item.date}</small>` : ''}
        </div>
        <button class="item-delete" data-action="delete">×</button>
      </div>
    `;
  }

  openAddForm() {
    const html = `
      <div class="bucketlist-editor">
        <div class="editor-header">
          <h3>添加愿望</h3>
          <button class="btn-close" id="closeBucketEditor">×</button>
        </div>
        <div class="editor-body">
          <input type="text" class="form-input" id="bucketTitle" placeholder="愿望标题">
          <textarea class="form-textarea" id="bucketDesc" placeholder="描述（可选）"></textarea>
          <input type="date" class="form-input" id="bucketDate" placeholder="目标日期（可选）">
        </div>
        <div class="editor-footer">
          <button class="btn btn-primary" id="saveBucket">添加</button>
        </div>
      </div>
    `;

    this.openOverlay(html);

    setTimeout(() => {
      document.getElementById('saveBucket')?.addEventListener('click', () => {
        const title = document.getElementById('bucketTitle').value;
        if (!title.trim()) {
          alert('请输入愿望标题');
          return;
        }

        const items = this.getItems();
        items.push({
          id: Date.now(),
          title,
          description: document.getElementById('bucketDesc').value,
          date: document.getElementById('bucketDate').value,
          done: false,
          createdAt: Date.now()
        });
        DataStore.set('BUCKETLIST', items);

        this.closeOverlay();
        this.render();
        this.bindEvents();
      });

      document.getElementById('closeBucketEditor')?.addEventListener('click', () => {
        this.closeOverlay();
      });
    }, 100);
  }

  bindEvents() {
    const self = this;

    document.getElementById('btnAddItem')?.addEventListener('click', () => {
      self.openAddForm();
    });

    document.querySelectorAll('.item-checkbox').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = parseInt(this.closest('.bucketlist-item').getAttribute('data-id'));
        const items = self.getItems();
        const index = items.findIndex(i => i.id === id);
        if (index !== -1) {
          items[index].done = !items[index].done;
          DataStore.set('BUCKETLIST', items);
          self.render();
          self.bindEvents();
        }
      });
    });

    document.querySelectorAll('.item-delete').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = parseInt(this.closest('.bucketlist-item').getAttribute('data-id'));
        if (confirm('确定删除这个愿望吗？')) {
          const items = self.getItems();
          const filtered = items.filter(i => i.id !== id);
          DataStore.set('BUCKETLIST', filtered);
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

export default BucketlistModule;