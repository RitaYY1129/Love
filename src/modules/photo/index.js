import { DataStore } from '../../data/store';

class PhotoModule {
  constructor() {
    this.categories = ['全部', '旅行', '约会', '搞笑', '纪念日', '美食', '日常'];
  }

  init(config) {
    this.config = config;
    this.currentCategory = '全部';
    this.render();
    this.bindEvents();
  }

  render() {
    const page = document.getElementById('page-photo');
    if (!page) return;

    const photos = this.getFilteredPhotos();

    page.innerHTML = `
      <div class="page-header">
        <button class="btn-back" onclick="App.switchTab('home')">←</button>
        <h1>📸 相册</h1>
        <button class="btn btn-primary btn-sm" id="btnUploadPhoto">上传照片</button>
      </div>
      <div class="page-content">
        <div class="categories-bar">
          ${this.categories.map(cat => `
            <button class="category-btn ${this.currentCategory === cat ? 'active' : ''}" 
                    data-category="${cat}">
              ${cat}
            </button>
          `).join('')}
        </div>
        ${photos.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">🖼️</div>
            <div class="empty-text">还没有照片</div>
            <div class="empty-hint">上传你们的甜蜜合照吧</div>
          </div>
        ` : `
          <div class="photos-grid">
            ${photos.map((photo, index) => `
              <div class="photo-item" data-index="${index}">
                <img src="${photo.src}" alt="照片" onerror="this.style.background='linear-gradient(135deg,#FF6FA8,#FF82BB)';this.src='';">
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  }

  getFilteredPhotos() {
    const photos = DataStore.get('PHOTO') || [];
    if (this.currentCategory === '全部') {
      return photos;
    }
    return photos.filter(p => p.category === this.currentCategory);
  }

  bindEvents() {
    const self = this;

    document.querySelectorAll('.category-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        self.currentCategory = this.getAttribute('data-category');
        self.render();
        self.bindEvents();
      });
    });

    document.getElementById('btnUploadPhoto')?.addEventListener('click', function() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = true;
      input.addEventListener('change', function(e) {
        const files = Array.from(e.target.files);
        files.forEach(file => {
          const reader = new FileReader();
          reader.onload = function(event) {
            const photos = DataStore.get('PHOTO') || [];
            photos.push({
              src: event.target.result,
              category: '全部',
              createdAt: Date.now()
            });
            DataStore.set('PHOTO', photos);
            self.render();
            self.bindEvents();
          };
          reader.readAsDataURL(file);
        });
      });
      input.click();
    });

    document.querySelectorAll('.photo-item').forEach(item => {
      item.addEventListener('click', function() {
        const index = parseInt(this.getAttribute('data-index'));
        self.openPreview(index);
      });
    });
  }

  openPreview(index) {
    const photos = this.getFilteredPhotos();
    if (photos.length === 0) return;

    const current = photos[index];
    const html = `
      <div class="photo-preview-overlay">
        <button class="btn-close" id="closePreview">×</button>
        <button class="nav-btn nav-prev" id="prevPhoto">←</button>
        <img src="${current.src}" alt="照片预览">
        <button class="nav-btn nav-next" id="nextPhoto">→</button>
        <div class="preview-info">${index + 1}/${photos.length}</div>
      </div>
    `;

    this.openOverlay(html);

    setTimeout(() => {
      let currentIndex = index;

      document.getElementById('prevPhoto')?.addEventListener('click', () => {
        currentIndex = currentIndex > 0 ? currentIndex - 1 : photos.length - 1;
        this.updatePreview(currentIndex);
      });

      document.getElementById('nextPhoto')?.addEventListener('click', () => {
        currentIndex = currentIndex < photos.length - 1 ? currentIndex + 1 : 0;
        this.updatePreview(currentIndex);
      });

      document.getElementById('closePreview')?.addEventListener('click', () => {
        this.closeOverlay();
      });
    }, 100);
  }

  updatePreview(index) {
    const photos = this.getFilteredPhotos();
    const img = document.querySelector('.photo-preview-overlay img');
    const info = document.querySelector('.photo-preview-overlay .preview-info');
    if (img && info && photos[index]) {
      img.src = photos[index].src;
      info.textContent = `${index + 1}/${photos.length}`;
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

export default PhotoModule;