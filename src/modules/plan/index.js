import { DataStore } from '../../data/store';
import { today } from '../../utils/date';

class PlanModule {
  constructor() {}

  init(config) {
    this.config = config;
    this.render();
    this.bindEvents();
  }

  render() {
    const page = document.getElementById('page-plan');
    if (!page) return;

    const plans = this.getPlans();
    const todayPlans = plans.filter(p => p.date === today());
    const upcomingPlans = plans.filter(p => p.date > today()).sort((a, b) => a.date.localeCompare(b.date));
    const pastPlans = plans.filter(p => p.date < today()).sort((a, b) => b.date.localeCompare(a.date));

    page.innerHTML = `
      <div class="page-header">
        <button class="btn-back" onclick="App.switchTab('home')">←</button>
        <h1>🎯 规划</h1>
        <button class="btn btn-primary btn-sm" id="btnAddPlan">添加计划</button>
      </div>
      <div class="page-content">
        ${todayPlans.length > 0 ? `
          <div class="section-card">
            <h3>今天的计划</h3>
            <div class="plan-list">
              ${todayPlans.map(p => this.renderPlanItem(p)).join('')}
            </div>
          </div>
        ` : ''}
        ${upcomingPlans.length > 0 ? `
          <div class="section-card">
            <h3>即将到来</h3>
            <div class="plan-list">
              ${upcomingPlans.map(p => this.renderPlanItem(p)).join('')}
            </div>
          </div>
        ` : ''}
        ${pastPlans.length > 0 ? `
          <div class="section-card">
            <h3>历史计划</h3>
            <div class="plan-list past">
              ${pastPlans.map(p => this.renderPlanItem(p)).join('')}
            </div>
          </div>
        ` : ''}
        ${plans.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">📝</div>
            <div class="empty-text">还没有计划</div>
            <div class="empty-hint">规划你们的美好未来吧</div>
          </div>
        ` : ''}
      </div>
    `;
  }

  getPlans() {
    return DataStore.get('PLAN') || [];
  }

  renderPlanItem(plan) {
    return `
      <div class="plan-item ${plan.done ? 'done' : ''}" data-id="${plan.id}">
        <button class="plan-checkbox" data-action="toggle">
          ${plan.done ? '✓' : ''}
        </button>
        <div class="plan-content">
          <h4>${plan.title}</h4>
          <p>${plan.date} ${plan.time || ''}</p>
          ${plan.note ? `<small>${plan.note}</small>` : ''}
        </div>
        <button class="plan-delete" data-action="delete">×</button>
      </div>
    `;
  }

  openAddForm() {
    const html = `
      <div class="plan-editor">
        <div class="editor-header">
          <h3>添加计划</h3>
          <button class="btn-close" id="closePlanEditor">×</button>
        </div>
        <div class="editor-body">
          <input type="text" class="form-input" id="planTitle" placeholder="计划标题">
          <input type="date" class="form-input" id="planDate" value="${today()}">
          <input type="time" class="form-input" id="planTime" placeholder="时间（可选）">
          <textarea class="form-textarea" id="planNote" placeholder="备注（可选）"></textarea>
        </div>
        <div class="editor-footer">
          <button class="btn btn-primary" id="savePlan">添加</button>
        </div>
      </div>
    `;

    this.openOverlay(html);

    setTimeout(() => {
      document.getElementById('savePlan')?.addEventListener('click', () => {
        const title = document.getElementById('planTitle').value;
        const date = document.getElementById('planDate').value;

        if (!title.trim()) {
          alert('请输入计划标题');
          return;
        }
        if (!date) {
          alert('请选择日期');
          return;
        }

        const plans = this.getPlans();
        plans.push({
          id: Date.now(),
          title,
          date,
          time: document.getElementById('planTime').value,
          note: document.getElementById('planNote').value,
          done: false,
          createdAt: Date.now()
        });
        DataStore.set('PLAN', plans);

        this.closeOverlay();
        this.render();
        this.bindEvents();
      });

      document.getElementById('closePlanEditor')?.addEventListener('click', () => {
        this.closeOverlay();
      });
    }, 100);
  }

  bindEvents() {
    const self = this;

    document.getElementById('btnAddPlan')?.addEventListener('click', () => {
      self.openAddForm();
    });

    document.querySelectorAll('.plan-checkbox').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = parseInt(this.closest('.plan-item').getAttribute('data-id'));
        const plans = self.getPlans();
        const index = plans.findIndex(p => p.id === id);
        if (index !== -1) {
          plans[index].done = !plans[index].done;
          DataStore.set('PLAN', plans);
          self.render();
          self.bindEvents();
        }
      });
    });

    document.querySelectorAll('.plan-delete').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = parseInt(this.closest('.plan-item').getAttribute('data-id'));
        if (confirm('确定删除这个计划吗？')) {
          const plans = self.getPlans();
          const filtered = plans.filter(p => p.id !== id);
          DataStore.set('PLAN', filtered);
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

export default PlanModule;