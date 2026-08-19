import { DataStore } from '../../data/store';

class WishesModule {
  constructor() {}

  init(config) {
    this.config = config;
    this.render();
    this.bindEvents();
  }

  render() {
    const page = document.getElementById('page-wishes');
    if (!page) return;

    const wishes = DataStore.wish.get();
    const undone = wishes.filter(w => !w.done);
    const done = wishes.filter(w => w.done);

    page.innerHTML = `
      <div class="page-header">
        <button class="btn-back" onclick="App.switchTab('home')">←</button>
        <h1>✨ 心愿单</h1>
        <button class="btn btn-primary btn-sm" id="btnAddWish">添加心愿</button>
      </div>
      <div class="page-content">
        ${undone.length === 0 ? '' : `
          <div class="section-card">
            <h3>待完成 (${undone.length})</h3>
            <div class="wish-list">
              ${undone.map(w => this.renderWishItem(w)).join('')}
            </div>
          </div>
        `}
        ${done.length === 0 ? '' : `
          <div class="section-card">
            <h3>已完成 (${done.length})</h3>
            <div class="wish-list done-list">
              ${done.map(w => this.renderWishItem(w)).join('')}
            </div>
          </div>
        `}
        ${wishes.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">🌟</div>
            <div class="empty-text">还没有心愿</div>
            <div class="empty-hint">添加你们想一起实现的愿望吧</div>
          </div>
        ` : ''}
      </div>
    `;
  }

  renderWishItem(wish) {
    return `
      <div class="wish-item ${wish.done ? 'done' : ''}" data-id="${wish.id}">
        <button class="wish-checkbox" data-action="toggle">
          ${wish.done ? '✓' : ''}
        </button>
        <div class="wish-content">
          <h4>${wish.title}</h4>
          ${wish.note ? `<p>${wish.note}</p>` : ''}
        </div>
        <button class="wish-delete" data-action="delete">×</button>
      </div>
    `;
  }

  openAddForm() {
    const html = `
      <div class="wish-editor">
        <div class="editor-header">
          <h3>添加心愿</h3>
          <button class="btn-close" id="closeWishEditor">×</button>
        </div>
        <div class="editor-body">
          <input type="text" class="form-input" id="wishTitle" placeholder="心愿标题">
          <textarea class="form-textarea" id="wishNote" placeholder="备注（可选）"></textarea>
        </div>
        <div class="editor-footer">
          <button class="btn btn-primary" id="saveWish">添加</button>
        </div>
      </div>
    `;

    this.openOverlay(html);

    setTimeout(() => {
      document.getElementById('saveWish')?.addEventListener('click', () => {
        const title = document.getElementById('wishTitle').value;
        if (!title.trim()) {
          alert('请输入心愿标题');
          return;
        }

        DataStore.wish.add({
          title,
          note: document.getElementById('wishNote').value
        });

        this.closeOverlay();
        this.render();
        this.bindEvents();
      });

      document.getElementById('closeWishEditor')?.addEventListener('click', () => {
        this.closeOverlay();
      });
    }, 100);
  }

  bindEvents() {
    const self = this;

    document.getElementById('btnAddWish')?.addEventListener('click', () => {
      self.openAddForm();
    });

    document.querySelectorAll('.wish-checkbox').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = parseInt(this.closest('.wish-item').getAttribute('data-id'));
        DataStore.wish.toggle(id);
        self.render();
        self.bindEvents();
      });
    });

    document.querySelectorAll('.wish-delete').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = parseInt(this.closest('.wish-item').getAttribute('data-id'));
        if (confirm('确定删除这个心愿吗？')) {
          const wishes = DataStore.wish.get();
          const filtered = wishes.filter(w => w.id !== id);
          DataStore.wish.set(filtered);
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

export default WishesModule;