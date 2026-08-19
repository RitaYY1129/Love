import { DataStore } from '../../data/store';

class QuizModule {
  constructor() {
    this.questions = [
      { q: '对方最喜欢吃什么？A.火锅 B.日料 C.烧烤 D.西餐', answer: 0 },
      { q: '你们相遇是在什么季节？A.春 B.夏 C.秋 D.冬', answer: 0 },
      { q: '对方睡前的习惯是？A.刷手机 B.看书 C.听音乐 D.直接睡', answer: 0 },
      { q: 'TA最害怕什么？A.打雷 B.高处 C.虫子 D.孤独', answer: 2 },
      { q: '你们在一起多久了？A.100天内 B.100-300天 C.300-500天 D.500天以上', answer: 2 },
      { q: '对方最喜欢的颜色？A.粉色 B.蓝色 C.白色 D.黑色', answer: 0 },
      { q: '第一次约会去了哪里？A.电影院 B.餐厅 C.公园 D.咖啡馆', answer: 3 },
      { q: '对方的生日是哪月？A.1-3月 B.4-6月 C.7-9月 D.10-12月', answer: 1 }
    ];
  }

  init(config) {
    this.config = config;
    this.currentQuestion = 0;
    this.score = 0;
    this.render();
    this.bindEvents();
  }

  render() {
    const page = document.getElementById('page-quiz');
    if (!page) return;

    const question = this.questions[this.currentQuestion];
    const options = ['A', 'B', 'C', 'D'];

    page.innerHTML = `
      <div class="page-header">
        <button class="btn-back" onclick="App.switchTab('home')">←</button>
        <h1>🧠 每日答题</h1>
      </div>
      <div class="page-content">
        <div class="quiz-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${((this.currentQuestion + 1) / this.questions.length) * 100}%"></div>
          </div>
          <span>${this.currentQuestion + 1}/${this.questions.length}</span>
        </div>
        <div class="quiz-card">
          <div class="quiz-question">
            <span class="question-number">第 ${this.currentQuestion + 1} 题</span>
            <p>${question.q}</p>
          </div>
          <div class="quiz-options">
            ${options.map((opt, idx) => `
              <button class="option-btn" data-option="${idx}">${opt}</button>
            `).join('')}
          </div>
        </div>
        <div class="quiz-score">
          当前得分：${this.score}分
        </div>
      </div>
    `;
  }

  bindEvents() {
    const self = this;

    document.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const selected = parseInt(this.getAttribute('data-option'));
        const correct = self.questions[self.currentQuestion].answer;

        if (selected === correct) {
          self.score += 10;
          this.classList.add('correct');
        } else {
          this.classList.add('wrong');
          document.querySelector(`.option-btn[data-option="${correct}"]`)?.classList.add('correct');
        }

        setTimeout(() => {
          if (self.currentQuestion < self.questions.length - 1) {
            self.currentQuestion++;
            self.render();
            self.bindEvents();
          } else {
            self.showResult();
          }
        }, 1000);
      });
    });
  }

  showResult() {
    const page = document.getElementById('page-quiz');
    if (!page) return;

    const percentage = Math.round((this.score / (this.questions.length * 10)) * 100);
    let message = '';
    let emoji = '';

    if (percentage === 100) {
      message = '满分！你太了解TA了！💕';
      emoji = '🎉';
    } else if (percentage >= 80) {
      message = '很棒！继续加油！💪';
      emoji = '👍';
    } else if (percentage >= 60) {
      message = '还不错，多了解TA一些吧～';
      emoji = '😊';
    } else {
      message = '要多关心TA哦！❤️';
      emoji = '💝';
    }

    page.innerHTML = `
      <div class="page-header">
        <button class="btn-back" onclick="App.switchTab('home')">←</button>
        <h1>🧠 答题结果</h1>
      </div>
      <div class="page-content">
        <div class="result-card">
          <div class="result-emoji">${emoji}</div>
          <div class="result-score">${this.score}分</div>
          <div class="result-message">${message}</div>
          <div class="result-stats">
            <div>答对 ${this.score / 10} 题</div>
            <div>正确率 ${percentage}%</div>
          </div>
          <button class="btn btn-primary btn-block" id="btnRetry">再来一次</button>
        </div>
      </div>
    `;

    document.getElementById('btnRetry')?.addEventListener('click', () => {
      this.currentQuestion = 0;
      this.score = 0;
      this.render();
      this.bindEvents();
    });
  }
}

export default QuizModule;