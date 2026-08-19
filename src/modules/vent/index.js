import { DataStore } from '../../data/store';

class VentModule {
  constructor() {
    this.moods = ['无奈', '委屈', '生气', '难过', '焦虑'];
  }

  init(config) {
    this.config = config;
    this.render();
    this.bindEvents();
  }

  render() {
    const page = document.getElementById('page-vent');
    if (!page) return;

    const vents = this.getVents();

    page.innerHTML = `
      <div class="page-header">
        <button class="btn-back" onclick="App.switchTab('home')">←</button>
        <h1>🗣️ 吐槽墙</h1>
      </div>
      <div class="page-content">
        <div class="vent-form">
          <textarea class="form-textarea" id="ventContent" placeholder="有什么想说的？吐槽一下吧..."></textarea>
          <div class="mood-row">
            <span>心情：</span>
            ${this.moods.map(mood => `
              <button class="mood-tag" data-mood="${mood}">${mood}</button>
            `).join('')}
          </div>
          <button class="btn btn-primary btn-block" id="btnPostVent">发布吐槽</button>
        </div>
        ${vents.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">🗣️</div>
            <div class="empty-text">还没有吐槽</div>
            <div class="empty-hint">说出你的心里话吧</div>
          </div>
        ` : `
          <div class="vent-list">
            ${vents.map(vent => this.renderVentItem(vent)).join('')}
          </div>
        `}
      </div>
    `;
  }

  getVents() {
    return DataStore.get('VENT') || [];
  }

  renderVentItem(vent) {
    return `
      <div class="vent-item">
        <div class="vent-header">
          <span class="vent-avatar">${vent.avatar || '👤'}</span>
          <div class="vent-meta">
            <span class="vent-name">${vent.nickname || '匿名用户'}</span>
            <span class="vent-time">${this.formatTime(vent.createdAt)}</span>
          </div>
          <span class="vent-mood">${vent.mood}</span>
        </div>
        <p class="vent-content">${vent.content}</p>
        ${vent.translation ? `
          <div class="vent-translation">
            <span class="translation-label">💝 TA想说：</span>
            <span>${vent.translation}</span>
          </div>
        ` : ''}
        <div class="vent-actions">
          <button class="action-btn">❤️ ${vent.likes || 0}</button>
          <button class="action-btn">💬 ${vent.comments || 0}</button>
        </div>
      </div>
    `;
  }

  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }

  bindEvents() {
    const self = this;

    document.querySelectorAll('.mood-tag').forEach(tag => {
      tag.addEventListener('click', function() {
        document.querySelectorAll('.mood-tag').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
      });
    });

    document.getElementById('btnPostVent')?.addEventListener('click', () => {
      const content = document.getElementById('ventContent').value;
      const mood = document.querySelector('.mood-tag.active')?.getAttribute('data-mood') || '无奈';

      if (!content.trim()) {
        alert('请输入吐槽内容');
        return;
      }

      const vents = this.getVents();
      vents.unshift({
        id: Date.now(),
        content,
        mood,
        nickname: '匿名用户',
        avatar: '👤',
        translation: this.generateTranslation(content),
        likes: 0,
        comments: 0,
        createdAt: Date.now()
      });
      DataStore.set('VENT', vents);

      document.getElementById('ventContent').value = '';
      this.render();
      this.bindEvents();
    });

    document.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        this.textContent = `❤️ ${parseInt(this.textContent.split(' ')[1]) + 1}`;
      });
    });
  }

  generateTranslation(content) {
    const translations = [
      '我理解你的感受，让我们一起面对吧～',
      '谢谢你愿意告诉我这些，我一直在～',
      '别生气啦，我来抱抱你～',
      '我懂你的委屈，我们一起解决～',
      '有什么不开心的，说出来会好受些～'
    ];
    return translations[Math.floor(Math.random() * translations.length)];
  }
}

export default VentModule;