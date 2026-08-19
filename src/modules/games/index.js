class GamesModule {
  constructor() {
    this.games = [
      { id: 'guess', name: '你画我猜', icon: '🎨', description: '考验默契的时候到了' },
      { id: 'truth', name: '真心话', icon: '💬', description: '说出你的心里话' },
      { id: 'dare', name: '大冒险', icon: '🎲', description: '勇敢挑战一下' },
      { id: 'memory', name: '记忆翻牌', icon: '🃏', description: '看看谁的记性好' }
    ];
  }

  init(config) {
    this.config = config;
    this.render();
    this.bindEvents();
  }

  render() {
    const page = document.getElementById('page-games');
    if (!page) return;

    page.innerHTML = `
      <div class="page-header">
        <button class="btn-back" onclick="App.switchTab('home')">←</button>
        <h1>🎮 小游戏</h1>
      </div>
      <div class="page-content">
        <div class="games-grid">
          ${this.games.map(game => `
            <button class="game-card" data-game="${game.id}">
              <div class="game-icon">${game.icon}</div>
              <h3>${game.name}</h3>
              <p>${game.description}</p>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  bindEvents() {
    const self = this;

    document.querySelectorAll('.game-card').forEach(card => {
      card.addEventListener('click', function() {
        const gameId = this.getAttribute('data-game');
        self.openGame(gameId);
      });
    });
  }

  openGame(gameId) {
    const game = this.games.find(g => g.id === gameId);
    
    let content = '';
    if (gameId === 'truth') {
      content = this.renderTruthGame();
    } else if (gameId === 'dare') {
      content = this.renderDareGame();
    } else {
      content = `
        <div class="game-modal-content">
          <div class="game-icon" style="font-size:64px">${game.icon}</div>
          <h2>${game.name}</h2>
          <p>${game.description}</p>
          <p style="color:var(--text-secondary);font-size:14px">开发中，敬请期待～</p>
        </div>
      `;
    }

    this.openOverlay(content);
  }

  renderTruthGame() {
    const questions = [
      '你最喜欢TA哪一点？',
      '第一次见面对TA的印象是什么？',
      'TA做过最让你感动的事是什么？',
      '你觉得你们能在一起多久？',
      '如果有机会重新开始，你会改变什么？',
      'TA的哪个习惯你最想改变？',
      '你最想和TA一起做什么事？',
      '你觉得自己是个好伴侣吗？'
    ];

    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];

    return `
      <div class="truth-game">
        <div class="game-header">
          <h3>💬 真心话</h3>
          <button class="btn-close" id="closeGame">×</button>
        </div>
        <div class="game-body">
          <div class="question-card">
            <p>${randomQuestion}</p>
          </div>
          <button class="btn btn-primary btn-block" id="btnNextQuestion">下一题</button>
        </div>
      </div>
    `;
  }

  renderDareGame() {
    const dares = [
      '给TA发一句土味情话',
      '模仿TA的一个习惯动作',
      '用三种不同的语气说"我爱你"',
      '唱一首情歌给TA听',
      '夸TA三分钟，不能重复',
      '跳一段搞笑的舞蹈',
      '用TA的手机发一条朋友圈',
      '做十个俯卧撑'
    ];

    const randomDare = dares[Math.floor(Math.random() * dares.length)];

    return `
      <div class="dare-game">
        <div class="game-header">
          <h3>🎲 大冒险</h3>
          <button class="btn-close" id="closeGame">×</button>
        </div>
        <div class="game-body">
          <div class="dare-card">
            <p>${randomDare}</p>
          </div>
          <button class="btn btn-primary btn-block" id="btnNextDare">换一个</button>
        </div>
      </div>
    `;
  }

  openOverlay(content) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay overlay-full';
    overlay.innerHTML = content;
    document.body.appendChild(overlay);
    setTimeout(() => overlay.classList.add('show'), 10);
    this.currentOverlay = overlay;

    setTimeout(() => {
      document.getElementById('closeGame')?.addEventListener('click', () => {
        this.closeOverlay();
      });

      document.getElementById('btnNextQuestion')?.addEventListener('click', () => {
        this.closeOverlay();
        this.openGame('truth');
      });

      document.getElementById('btnNextDare')?.addEventListener('click', () => {
        this.closeOverlay();
        this.openGame('dare');
      });
    }, 100);
  }

  closeOverlay() {
    if (this.currentOverlay) {
      this.currentOverlay.classList.remove('show');
      setTimeout(() => this.currentOverlay.remove(), 300);
      this.currentOverlay = null;
    }
  }
}

export default GamesModule;