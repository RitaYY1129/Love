import { DataStore } from '../../data/store';
import { calcDaysBetween, today, daysUntil } from '../../utils/date';

class HomeModule {
  constructor(config) {
    this.config = config;
    this.bindEvents();
  }

  init(config) {
    this.config = config;
    this.render();
    this.bindEvents();
  }

  render() {
    const page = document.getElementById('page-home');
    if (!page) return;

    const couple = this.config.couple;
    const days = calcDaysBetween(couple.startDate);
    this.days = days;

    page.innerHTML = `
      ${this.renderBanner(couple, days)}
      ${this.renderCheckinBar()}
      ${this.renderQuickBar()}
      ${this.renderAnniversaries()}
      ${this.renderDiaryPreview()}
      ${this.renderMoodStats()}
      ${this.renderPhotoPreview()}
      ${this.renderWishPreview()}
    `;
  }

  renderBanner(couple, days) {
    const loveValue = this.getLoveValue();
    return `
      <div class="home-banner">
        <div class="banner-avatars">
          <div class="avatar-large she">${couple.her.avatar}</div>
          <div class="banner-center">
            <div class="banner-days"><b>${days}</b>天</div>
            <div class="banner-sub">我们在一起</div>
          </div>
          <div class="avatar-large him">${couple.him.avatar}</div>
        </div>
        <div class="banner-names">${couple.her.name} & ${couple.him.name}</div>
        <div class="banner-info">
          <span>Lv.7 · 恩爱值 ${loveValue}</span>
          <span>距离300天还有 ${daysUntil('2025-07-23')} 天</span>
        </div>
        <div class="banner-hearts">💕💕</div>
      </div>
    `;
  }

  getLoveValue() {
    const checkin = DataStore.checkin.get();
    return checkin.history.length * 10 + 12000;
  }

  renderCheckinBar() {
    const checkinData = DataStore.checkin.get();
    const checkedToday = checkinData.history.includes(today());
    const streak = DataStore.checkin.getStreak();

    return `
      <div class="checkin-bar">
        <div class="checkin-info">
          <b>${checkedToday ? '今天已签到' : '连续签到 ' + streak + ' 天'}</b>
          <small>${checkedToday ? '好样的！' : '坚持就是胜利 💪'}</small>
        </div>
        <button class="btn btn-primary btn-sm ${checkedToday ? 'disabled' : ''}" 
                data-action="checkin">
          ${checkedToday ? '已签到' : '签到'}
        </button>
      </div>
    `;
  }

  renderQuickBar() {
    return `
      <div class="home-grid">
        <div class="grid-item" data-action="diary">
          <div class="grid-icon">📝</div>
          <small>写日记</small>
        </div>
        <div class="grid-item" data-action="anniversary">
          <div class="grid-icon">🎂</div>
          <small>纪念日</small>
        </div>
        <div class="grid-item" data-action="photo">
          <div class="grid-icon">📸</div>
          <small>传照片</small>
        </div>
        <div class="grid-item" data-action="quiz">
          <div class="grid-icon">🧠</div>
          <small>每日答题</small>
        </div>
      </div>
    `;
  }

  renderAnniversaries() {
    const anns = DataStore.anniversary.get();
    if (anns.length === 0) return '';

    return `
      <div class="section-title">🎂 纪念日 
        <span class="section-more" data-action="anniversary">查看全部 ›</span>
      </div>
      <div class="card">
        ${anns.slice(0, 2).map(a => `
          <div class="list-item">
            <span class="list-icon">${a.icon}</span>
            <div class="list-body">
              <b>${a.title}</b>
              <small>${a.date}</small>
            </div>
            <div class="list-badge"><b>${daysUntil(a.date)}</b>天</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderDiaryPreview() {
    const entries = DataStore.diary.get();
    if (entries.length === 0) return '';

    return `
      <div class="section-title">📝 最新日记 
        <span class="section-more" data-action="diary">查看全部 ›</span>
      </div>
      <div class="diary-preview-list">
        ${entries.slice(0, 2).map(d => `
          <div class="diary-preview-item" data-action="diary">
            <div class="diary-pv-header">
              <span class="diary-pv-date">${d.date || ''}</span>
              ${d.mood ? `<span class="diary-pv-mood">${d.mood}</span>` : ''}
              <span class="diary-pv-title">${d.title || '无标题'}</span>
            </div>
            <div class="diary-pv-text">${(d.text || '').length > 40 ? (d.text || '').substr(0, 40) + '...' : (d.text || '')}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderMoodStats() {
    try {
      const moods = DataStore.mood.get();
      if (moods.length === 0) return '';

      const icons = { happy: '😊', love: '😍', sad: '😢', angry: '😠', warm: '🥰', surprise: '😲' };
      const recentMoods = moods.slice(-5).reverse();

      return `
        <div class="section-title">😊 最近心情 
          <span class="section-more" data-action="mood">查看全部 ›</span>
        </div>
        <div class="mood-timeline">
          ${recentMoods.map(m => `
            <div class="mood-item">
              <span class="mood-emoji">${icons[m.mood] || '😊'}</span>
              <small>${m.date}</small>
            </div>
          `).join('')}
        </div>
      `;
    } catch (e) {
      return '';
    }
  }

  renderPhotoPreview() {
    try {
      const photos = DataStore.get('PHOTO') || [];
      if (photos.length === 0) return '';

      return `
        <div class="section-title">📸 合照 
          <span class="section-more" data-action="photo">查看全部 ›</span>
        </div>
        <div class="photos-grid">
          ${photos.slice(-4).map((p, i) => `
            <div class="photo-thumb" style="background:linear-gradient(135deg,#FF6FA8,#FF82BB);display:flex;align-items:center;justify-content:center;color:white;font-size:28px;height:100px;border-radius:12px;cursor:pointer" data-action="photo" data-index="${i}">📸</div>
          `).join('')}
        </div>
      `;
    } catch (e) {
      return '';
    }
  }

  renderWishPreview() {
    const wishes = DataStore.wish.get();
    if (wishes.length === 0) return '';

    return `
      <div class="section-title">✨ 心愿单 
        <span class="section-more" data-action="wishes">查看全部 ›</span>
      </div>
      <div class="card">
        ${wishes.slice(0, 2).map(w => `
          <div class="list-item ${w.done ? 'done' : ''}">
            <span class="list-icon">${w.done ? '✓' : '✨'}</span>
            <div class="list-body">
              <b>${w.title}</b>
              ${w.note ? `<small>${w.note}</small>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  bindEvents() {
    const self = this;

    document.querySelectorAll('#page-home .grid-item').forEach(el => {
      el.addEventListener('click', function () {
        const action = this.getAttribute('data-action');
        self.openPage(action);
      });
    });

    document.querySelectorAll('#page-home .section-more').forEach(el => {
      el.addEventListener('click', function () {
        const action = this.getAttribute('data-action');
        self.openPage(action);
      });
    });

    document.querySelectorAll('#page-home [data-action="checkin"]').forEach(el => {
      if (el.classList.contains('btn')) {
        el.addEventListener('click', function (e) {
          e.stopPropagation();
          if (!this.classList.contains('disabled')) {
            DataStore.checkin.addToday();
            self.render();
            self.bindEvents();
          }
        });
      }
    });
  }

  openPage(name) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const page = document.getElementById('page-' + name);
    if (page) {
      page.classList.add('active');
      page.scrollTop = 0;
    }
    if (window.App && window.App.modules[name] && window.App.modules[name].render) {
      window.App.modules[name].render();
    }
  }
}

export default HomeModule;