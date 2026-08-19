import { DataStore } from '../../data/store';

class MeModule {
  constructor() {}

  init(config) {
    this.config = config;
    this.render();
    this.bindEvents();
  }

  render() {
    const page = document.getElementById('page-me');
    if (!page) return;

    const session = DataStore.session.get();
    const couple = this.config.couple;

    page.innerHTML = `
      <div class="page-header">
        <button class="btn-back" onclick="App.switchTab('home')">←</button>
        <h1>👤 我的</h1>
      </div>
      <div class="page-content">
        <div class="profile-card">
          <div class="profile-avatar">${session?.avatar || '👤'}</div>
          <div class="profile-info">
            <h2>${session?.nickname || '用户'}</h2>
            <p>${session?.phone || '未绑定手机号'}</p>
          </div>
        </div>
        <div class="couple-card">
          <div class="couple-avatars">
            <div class="avatar-small">${couple.her.avatar}</div>
            <span class="couple-heart">💕</span>
            <div class="avatar-small">${couple.him.avatar}</div>
          </div>
          <div class="couple-info">
            <b>${couple.her.name} & ${couple.him.name}</b>
            <small>在一起 ${this.getDaysTogether()} 天</small>
          </div>
        </div>
        <div class="menu-list">
          <button class="menu-item" data-action="partner">
            <span class="menu-icon">💑</span>
            <span>绑定爱人</span>
            <span class="menu-arrow">›</span>
          </button>
          <button class="menu-item" data-action="settings">
            <span class="menu-icon">⚙️</span>
            <span>设置</span>
            <span class="menu-arrow">›</span>
          </button>
          <button class="menu-item" data-action="about">
            <span class="menu-icon">ℹ️</span>
            <span>关于我们</span>
            <span class="menu-arrow">›</span>
          </button>
        </div>
        <button class="btn btn-danger btn-block" id="btnLogout">退出登录</button>
      </div>
    `;
  }

  getDaysTogether() {
    const couple = this.config.couple;
    const start = new Date(couple.startDate);
    const now = new Date();
    return Math.floor((now - start) / (1000 * 60 * 60 * 24));
  }

  bindEvents() {
    const self = this;

    document.querySelectorAll('.menu-item').forEach(btn => {
      btn.addEventListener('click', function() {
        const action = this.getAttribute('data-action');
        if (action === 'settings') {
          App.switchTab('settings');
        } else if (action === 'partner') {
          self.openBindModal();
        } else if (action === 'about') {
          self.openAboutModal();
        }
      });
    });

    document.getElementById('btnLogout')?.addEventListener('click', function() {
      if (confirm('确定要退出登录吗？')) {
        DataStore.session.clear();
        window.location.reload();
      }
    });
  }

  openBindModal() {
    const session = DataStore.session.get();
    if (!session) return;

    const html = `
      <div class="bind-modal">
        <div class="modal-header">
          <h3>💑 绑定爱人</h3>
          <button class="btn-close" id="closeBindModal">×</button>
        </div>
        <div class="modal-body">
          <div style="text-align:center;padding:16px 0">
            <div style="font-size:48px;margin-bottom:12px">💑</div>
            <div style="font-size:16px;font-weight:600;margin-bottom:8px">绑定你的爱人</div>
            <div style="font-size:13px;color:var(--text-secondary);margin-bottom:16px">输入对方分享的配对码</div>
            <div class="form-group">
              <input class="form-input" id="bindCode" type="text" placeholder="输入6位配对码" maxlength="6" style="text-align:center;font-size:18px;letter-spacing:4px">
            </div>
            <button class="btn btn-primary btn-block" id="btnBind">绑定</button>
            <div style="margin-top:20px;border-top:1px solid var(--color-gray-100);padding-top:16px">
              <div style="font-size:13px;color:var(--text-secondary);margin-bottom:8px">你的配对码（发给TA）</div>
              <div style="font-size:24px;font-weight:700;color:var(--color-primary);letter-spacing:4px;padding:12px;background:var(--color-primary-bg);border-radius:12px;display:inline-block;min-width:160px">${this.generateBindCode()}</div>
              <br><button class="btn btn-ghost" id="btnCopyCode" style="margin-top:12px;font-size:13px;padding:8px 16px">📋 复制配对码</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.openOverlay(html);

    setTimeout(() => {
      document.getElementById('btnBind')?.addEventListener('click', () => {
        const code = document.getElementById('bindCode').value.trim().toUpperCase();
        if (code.length !== 6) {
          alert('请输入6位配对码');
          return;
        }
        alert('绑定成功！💕');
        this.closeOverlay();
      });

      document.getElementById('btnCopyCode')?.addEventListener('click', () => {
        const code = this.generateBindCode();
        navigator.clipboard.writeText(code).then(() => {
          alert('已复制配对码！');
        });
      });

      document.getElementById('closeBindModal')?.addEventListener('click', () => {
        this.closeOverlay();
      });
    }, 100);
  }

  generateBindCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  openAboutModal() {
    const html = `
      <div class="about-modal">
        <div class="modal-header">
          <h3>ℹ️ 关于我们</h3>
          <button class="btn-close" id="closeAboutModal">×</button>
        </div>
        <div class="modal-body">
          <div class="about-content">
            <div class="about-logo">💕</div>
            <h2>恋爱日记</h2>
            <p>专属你们的私密空间</p>
            <div class="about-info">
              <div>版本：2.0.0</div>
              <div>日期：2026</div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.openOverlay(html);

    setTimeout(() => {
      document.getElementById('closeAboutModal')?.addEventListener('click', () => {
        this.closeOverlay();
      });
    }, 100);
  }

  openOverlay(content) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
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

export default MeModule;