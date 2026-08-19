<template>
  <div class="page-container">
    <div class="page-header" v-if="currentGame === null && !showAdmin">
      <button @click="goBack" class="btn-back">←</button>
      <h1 class="text-xl font-bold">情侣游戏</h1>
      <button @click="showAdmin = true" class="btn btn-outline btn-sm">管理</button>
    </div>
    <div class="page-header" v-else-if="showAdmin">
      <button @click="showAdmin = false" class="btn-back">←</button>
      <h1 class="text-xl font-bold">游戏管理</h1>
    </div>
    <div class="page-header" v-else>
      <button @click="backToGames" class="btn-back">←</button>
      <h1 class="text-xl font-bold">{{ currentGameName }}</h1>
    </div>

    <div class="page-content" v-if="currentGame === null && !showAdmin">
      <div class="grid grid-cols-2 gap-4">
        <div 
          v-for="game in games" 
          :key="game.id"
          @click="startGame(game)"
          class="card cursor-pointer hover:shadow-card-hover transition-all"
        >
          <div class="text-center py-6">
            <div class="text-5xl mb-3">{{ game.icon }}</div>
            <h3 class="font-bold">{{ game.name }}</h3>
            <p class="text-xs text-gray-500 mt-1">{{ game.description }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="page-content" v-else-if="showAdmin">
      <div class="card mb-4">
        <h3 class="font-bold mb-4">选择要管理的游戏</h3>
        <div class="grid grid-cols-2 gap-3">
          <button 
            v-for="game in games" 
            :key="game.id"
            @click="selectAdminGame(game)"
            :class="['p-3 rounded-xl text-center transition-all', selectedAdminGame?.type === game.type ? 'bg-primary text-white' : 'bg-gray-50']"
          >
            <div class="text-2xl mb-1">{{ game.icon }}</div>
            <div class="text-sm">{{ game.name }}</div>
          </button>
        </div>
      </div>

      <div v-if="selectedAdminGame" class="card mb-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="font-bold">{{ selectedAdminGame.name }} - 内容管理</h3>
          <button @click="addNewItem" class="btn btn-primary btn-sm">+ 添加</button>
        </div>
        
        <div v-if="adminItems.length === 0" class="text-center py-8 text-gray-500">
          <div class="text-4xl mb-2">📝</div>
          <p>暂无内容，点击上方按钮添加</p>
        </div>
        
        <div v-else class="space-y-3">
          <div 
            v-for="(item, index) in adminItems" 
            :key="index"
            class="bg-gray-50 rounded-xl p-4 flex items-center justify-between"
          >
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <span class="text-xl">{{ getIcon(item) }}</span>
                <span class="font-medium">{{ getItemTitle(item) }}</span>
              </div>
              <p v-if="getItemDesc(item)" class="text-xs text-gray-500 mt-1">{{ getItemDesc(item) }}</p>
            </div>
            <div class="flex gap-2">
              <button @click="editItem(index)" class="text-primary hover:bg-gray-200 p-2 rounded-lg">✏️</button>
              <button @click="deleteItem(index)" class="text-red-500 hover:bg-gray-200 p-2 rounded-lg">🗑️</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="page-content" v-else-if="currentGame === 'quiz'">
      <div class="card mb-4">
        <div class="flex justify-between items-center mb-4">
          <span class="text-sm text-gray-500">第 {{ quizCurrentIndex + 1 }} / {{ quizQuestions.length }} 题</span>
          <span class="text-sm text-primary">{{ quizScore }} 分</span>
        </div>
        <div class="text-center mb-6">
          <div class="text-4xl mb-4">{{ quizQuestions[quizCurrentIndex]?.icon }}</div>
          <h3 class="text-lg font-bold mb-2">{{ quizQuestions[quizCurrentIndex]?.question }}</h3>
          <p class="text-sm text-gray-500">{{ quizQuestions[quizCurrentIndex]?.hint }}</p>
        </div>
        <div class="space-y-3">
          <input v-model.trim="quizAnswerText" class="form-input" placeholder="输入你的回答" :disabled="quizAnswered" @keyup.enter="answerQuiz">
          <button class="btn btn-primary btn-block" :disabled="quizAnswered || !quizAnswerText" @click="answerQuiz">提交回答</button>
        </div>
        <div v-if="quizAnswered" class="mt-4">
          <div :class="['p-3 rounded-lg text-center', quizIsCorrect ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600']">
            {{ quizIsCorrect ? '🎉 回答正确！' : '😢 回答不一致，再多了解一下 TA 吧' }}
          </div>
          <button @click="nextQuiz" class="btn btn-primary btn-block mt-4">
            {{ quizCurrentIndex < quizQuestions.length - 1 ? '下一题' : '查看结果' }}
          </button>
        </div>
      </div>

      <div v-if="showQuizResult" class="card">
        <div class="text-center py-8">
          <div class="text-6xl mb-4">{{ quizResultEmoji }}</div>
          <h3 class="text-xl font-bold mb-2">{{ quizResultTitle }}</h3>
          <p class="text-gray-500">{{ quizResultDesc }}</p>
          <div class="mt-6">
            <div class="text-4xl font-bold text-primary">{{ quizScore }}</div>
            <div class="text-sm text-gray-500">总分</div>
          </div>
          <button @click="resetQuiz" class="btn btn-primary mt-6">再玩一次</button>
        </div>
      </div>
    </div>

    <div class="page-content" v-else-if="currentGame === 'truth'">
      <div class="card mb-4">
        <div class="text-center py-6">
          <div class="text-5xl mb-4">{{ truthCurrentCard?.icon }}</div>
          <h3 class="text-lg font-bold mb-2">{{ truthCurrentCard?.type === 'truth' ? '真心话' : '大冒险' }}</h3>
          <p class="text-gray-500">{{ truthCurrentCard?.content }}</p>
        </div>
        <div class="flex gap-3">
          <button @click="pickTruthCard" class="btn btn-outline flex-1">🎤 真心话</button>
          <button @click="pickDareCard" class="btn btn-primary flex-1">🎭 大冒险</button>
        </div>
      </div>
      <div class="card">
        <h3 class="font-bold mb-4">游戏规则</h3>
        <ul class="text-sm text-gray-500 space-y-2">
          <li>• 轮流抽卡，抽到真心话需如实回答</li>
          <li>• 抽到大冒险需完成挑战任务</li>
          <li>• 可以选择换卡一次</li>
        </ul>
      </div>
    </div>

    <div class="page-content" v-else-if="currentGame === 'draw'">
      <div class="card mb-4">
        <div class="flex justify-between items-center mb-4">
          <span class="text-sm text-gray-500">第 {{ drawRound }} 轮</span>
          <span class="text-sm text-primary">{{ drawScore }}</span>
        </div>
        <div class="bg-gray-100 rounded-xl h-64 mb-4 flex items-center justify-center">
          <canvas ref="drawCanvas" class="bg-white rounded-lg shadow" @touchstart="startDraw" @touchmove="drawing" @touchend="stopDraw"></canvas>
        </div>
        <div class="text-center mb-4">
          <div class="text-lg font-bold">{{ drawWord }}</div>
          <div class="text-sm text-gray-500">请画出这个词</div>
        </div>
        <div class="flex gap-3 mb-4">
          <div class="flex gap-2">
            <button 
              v-for="color in drawColors" 
              :key="color"
              @click="drawColor = color"
              :class="['w-10 h-10 rounded-full border-2', drawColor === color ? 'border-primary scale-110' : 'border-gray-300']"
              :style="{ backgroundColor: color }"
            ></button>
          </div>
          <button @click="clearCanvas" class="btn btn-secondary ml-auto">清除</button>
        </div>
        <button @click="nextDrawRound" class="btn btn-primary btn-block">下一题</button>
      </div>
    </div>

    <div class="page-content" v-else-if="currentGame === 'test'">
      <div class="card mb-4">
        <div class="text-center py-6">
          <div class="text-5xl mb-4">❤️</div>
          <h3 class="text-lg font-bold mb-2">爱情匹配度测试</h3>
          <p class="text-gray-500">回答以下问题，测试你们的缘分</p>
        </div>
        <div class="space-y-4">
          <div v-for="(question, index) in loveTestQuestions" :key="index" class="space-y-2">
            <p class="font-medium">{{ index + 1 }}. {{ question.text }}</p>
            <div class="grid grid-cols-2 gap-2">
              <button 
                v-for="(option, optIndex) in question.options" 
                :key="optIndex"
                @click="selectLoveAnswer(index, optIndex)"
                :class="['p-3 rounded-lg text-center transition-all', loveAnswers[index] === optIndex ? 'bg-primary text-white' : 'bg-gray-50']"
              >
                {{ option }}
              </button>
            </div>
          </div>
        </div>
        <button @click="calculateLoveResult" :disabled="!loveAnswersComplete" class="btn btn-primary btn-block mt-6">
          查看结果
        </button>
      </div>

      <div v-if="showLoveResult" class="card">
        <div class="text-center py-8">
          <div class="text-6xl mb-4">{{ loveResultEmoji }}</div>
          <div class="text-4xl font-bold text-primary mb-2">{{ loveScore }}%</div>
          <h3 class="text-xl font-bold mb-2">{{ loveResultTitle }}</h3>
          <p class="text-gray-500">{{ loveResultDesc }}</p>
          <button @click="resetLoveTest" class="btn btn-primary mt-6">再测一次</button>
        </div>
      </div>
    </div>

    <div class="page-content" v-else-if="currentGame === 'challenge'">
      <div class="card mb-4">
        <h3 class="font-bold mb-4">今日挑战</h3>
        <div class="text-center py-6">
          <div class="text-5xl mb-4">{{ challengeToday?.icon }}</div>
          <h4 class="text-lg font-bold mb-2">{{ challengeToday?.title }}</h4>
          <p class="text-gray-500 mb-4">{{ challengeToday?.description }}</p>
          <button @click="completeChallenge" :disabled="challengeCompleted" class="btn btn-primary">
            {{ challengeCompleted ? '✓ 已完成' : '完成挑战' }}
          </button>
        </div>
      </div>
      <div class="card">
        <h3 class="font-bold mb-4">挑战记录</h3>
        <div class="space-y-3">
          <div v-for="(challenge, index) in challengeHistory" :key="index" class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span>{{ challenge.icon }}</span>
              <span>{{ challenge.title }}</span>
            </div>
            <span :class="challenge.completed ? 'text-green-500' : 'text-gray-400'">
              {{ challenge.completed ? '✓' : '-' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="page-content" v-else-if="currentGame === 'gift'">
      <div class="card mb-4">
        <h3 class="font-bold mb-4">TA的喜好</h3>
        <div class="grid grid-cols-3 gap-3">
          <button 
            v-for="category in giftCategories" 
            :key="category.id"
            @click="selectGiftCategory(category)"
            :class="['p-4 rounded-xl text-center transition-all', selectedGiftCategory?.id === category.id ? 'bg-primary text-white' : 'bg-gray-50']"
          >
            <div class="text-2xl mb-1">{{ category.icon }}</div>
            <div class="text-xs">{{ category.name }}</div>
          </button>
        </div>
      </div>
      <div class="card">
        <h3 class="font-bold mb-4">{{ selectedGiftCategory?.name || '推荐礼物' }}</h3>
        <div class="grid grid-cols-2 gap-4">
          <div 
            v-for="gift in selectedGifts" 
            :key="gift.id"
            class="bg-gray-50 rounded-xl p-4"
          >
            <div class="text-3xl mb-2">{{ gift.icon }}</div>
            <div class="font-medium">{{ gift.name }}</div>
            <div class="text-xs text-gray-500 mt-1">{{ gift.desc }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="tab-bar">
      <div 
        v-for="tab in tabs" 
        :key="tab.path"
        @click="navigate(tab.path)"
        :class="['tab-item', currentPath === tab.path ? 'active' : '']"
      >
        <span class="icon">{{ tab.icon }}</span>
        <span>{{ tab.label }}</span>
      </div>
    </div>

    <div :class="['toast', toast.show ? 'show' : '']">{{ toast.message }}</div>

    <div v-if="showModal" class="overlay show" @click.self="closeModal">
      <div class="overlay-box p-6 max-w-sm">
        <h3 class="text-lg font-bold mb-4">{{ editingIndex >= 0 ? '编辑内容' : '添加内容' }}</h3>
        
        <div v-if="selectedAdminGame?.type === 'quiz'" class="space-y-3">
          <div>
            <label class="text-sm text-gray-600 mb-1 block">图标</label>
            <input v-model="formData.icon" type="text" class="form-input" placeholder="输入emoji图标">
          </div>
          <div>
            <label class="text-sm text-gray-600 mb-1 block">问题</label>
            <input v-model="formData.question" type="text" class="form-input" placeholder="输入问题">
          </div>
          <div>
            <label class="text-sm text-gray-600 mb-1 block">提示</label>
            <input v-model="formData.hint" type="text" class="form-input" placeholder="输入提示">
          </div>
          <div>
            <label class="text-sm text-gray-600 mb-1 block">参考答案</label>
            <input v-model="formData.answerText" type="text" class="form-input" placeholder="输入期望回答">
          </div>
        </div>

        <div v-else-if="selectedAdminGame?.type === 'truth'" class="space-y-3">
          <div>
            <label class="text-sm text-gray-600 mb-1 block">类型</label>
            <select v-model="formData.type" class="form-input">
              <option value="truth">真心话</option>
              <option value="dare">大冒险</option>
            </select>
          </div>
          <div>
            <label class="text-sm text-gray-600 mb-1 block">内容</label>
            <textarea v-model="formData.content" class="form-textarea" placeholder="输入问题或任务"></textarea>
          </div>
        </div>

        <div v-else-if="selectedAdminGame?.type === 'draw'" class="space-y-3">
          <div>
            <label class="text-sm text-gray-600 mb-1 block">词语</label>
            <input v-model="formData.word" type="text" class="form-input" placeholder="输入要画的词">
          </div>
        </div>

        <div v-else-if="selectedAdminGame?.type === 'test'" class="space-y-3">
          <div>
            <label class="text-sm text-gray-600 mb-1 block">问题</label>
            <input v-model="formData.text" type="text" class="form-input" placeholder="输入问题">
          </div>
          <div>
            <label class="text-sm text-gray-600 mb-1 block">选项1</label>
            <input v-model="formData.options[0]" type="text" class="form-input" placeholder="积极选项">
          </div>
          <div>
            <label class="text-sm text-gray-600 mb-1 block">选项2</label>
            <input v-model="formData.options[1]" type="text" class="form-input" placeholder="消极选项">
          </div>
        </div>

        <div v-else-if="selectedAdminGame?.type === 'challenge'" class="space-y-3">
          <div>
            <label class="text-sm text-gray-600 mb-1 block">图标</label>
            <input v-model="formData.icon" type="text" class="form-input" placeholder="输入emoji图标">
          </div>
          <div>
            <label class="text-sm text-gray-600 mb-1 block">标题</label>
            <input v-model="formData.title" type="text" class="form-input" placeholder="挑战标题">
          </div>
          <div>
            <label class="text-sm text-gray-600 mb-1 block">描述</label>
            <input v-model="formData.description" type="text" class="form-input" placeholder="挑战描述">
          </div>
        </div>

        <div v-else-if="selectedAdminGame?.type === 'gift'" class="space-y-3">
          <div>
            <label class="text-sm text-gray-600 mb-1 block">分类ID</label>
            <select v-model="formData.categoryId" class="form-input">
              <option value="1">💍 饰品</option>
              <option value="2">🌹 鲜花</option>
              <option value="3">🎁 创意</option>
              <option value="4">👗 服饰</option>
              <option value="5">🍫 美食</option>
              <option value="6">📱 数码</option>
            </select>
          </div>
          <div>
            <label class="text-sm text-gray-600 mb-1 block">图标</label>
            <input v-model="formData.icon" type="text" class="form-input" placeholder="输入emoji图标">
          </div>
          <div>
            <label class="text-sm text-gray-600 mb-1 block">名称</label>
            <input v-model="formData.name" type="text" class="form-input" placeholder="礼物名称">
          </div>
          <div>
            <label class="text-sm text-gray-600 mb-1 block">描述</label>
            <input v-model="formData.desc" type="text" class="form-input" placeholder="礼物描述">
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button @click="closeModal" class="btn btn-secondary flex-1">取消</button>
          <button @click="saveItem" class="btn btn-primary flex-1">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>import { ref, computed, onMounted, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
const router = useRouter();
const route = useRoute();
const currentPath = computed(() => route.path);
const tabs = [
 { path: '/home', icon: '🏠', label: '首页' },
 { path: '/anniversary', icon: '♡', label: '纪念日' },
 { path: '/chat', icon: '💬', label: '聊天' },
 { path: '/location', icon: '📍', label: '位置' },
 { path: '/me', icon: '👤', label: '我的' }
];
const games = ref([
 { id: '1', icon: '🎮', name: '情侣问答', description: '测试你们的默契度', type: 'quiz' },
 { id: '2', icon: '🎲', name: '真心话大冒险', description: '增进彼此了解', type: 'truth' },
 { id: '3', icon: '✏️', name: '你画我猜', description: '考验绘画功底', type: 'draw' },
 { id: '4', icon: '❤️', name: '爱情测试', description: '测测你们的缘分', type: 'test' },
 { id: '5', icon: '🎯', name: '情侣挑战', description: '一起完成小目标', type: 'challenge' },
 { id: '6', icon: '🎁', name: '惊喜礼物', description: '为TA挑选礼物', type: 'gift' }
]);
const currentGame = ref(null);
const currentGameName = ref('');
const showAdmin = ref(false);
const selectedAdminGame = ref(null);
const showModal = ref(false);
const editingIndex = ref(-1);
const formData = ref({});
const toast = ref({
 show: false,
 message: ''
});
const showToast = (message) => {
 toast.value = { show: true, message };
 setTimeout(() => {
 toast.value.show = false;
 }, 2000);
};
const goBack = () => {
 router.back();
};
const backToGames = () => {
 currentGame.value = null;
 currentGameName.value = '';
};
const navigate = (path) => {
 if (path !== currentPath.value) {
 router.push(path);
 }
};
const startGame = (game) => {
 currentGame.value = game.type;
 currentGameName.value = game.name;
};
const getStorageKey = (type) => {
 return `loveDiary_game_${type}`;
};
const loadItems = (type) => {
 const key = getStorageKey(type);
 const stored = localStorage.getItem(key);
 if (stored) {
 return JSON.parse(stored);
 }
 return getDefaultItems(type);
};
const saveItems = (type, items) => {
 const key = getStorageKey(type);
 localStorage.setItem(key, JSON.stringify(items));
};
const getDefaultItems = (type) => {
 const defaults = {
 quiz: [
 { icon: '🎂', question: 'TA的生日是哪一天？', hint: '记得是哪月哪日吗？', options: ['1月1日', '5月20日', '10月10日', '12月25日'], answer: 1 },
 { icon: '🍕', question: 'TA最喜欢的食物是什么？', hint: '想想你们常去的餐厅', options: ['火锅', '烧烤', '寿司', '披萨'], answer: 0 },
 { icon: '🎬', question: 'TA最喜欢的电影类型？', hint: '周末一起看的电影', options: ['喜剧', '爱情', '动作', '科幻'], answer: 1 },
 { icon: '🎵', question: 'TA最近在听什么歌？', hint: 'TA的音乐播放列表', options: ['流行', '摇滚', '民谣', '古典'], answer: 2 },
 { icon: '🌍', question: 'TA最想去的地方？', hint: '梦想中的旅行地', options: ['巴黎', '东京', '马尔代夫', '瑞士'], answer: 2 }
 ],
 truth: [
 { type: 'truth', content: '你最想和TA一起做的事是什么？' },
 { type: 'truth', content: 'TA做过最让你感动的事？' },
 { type: 'truth', content: '你觉得TA哪里最可爱？' },
 { type: 'truth', content: '你最喜欢TA的哪个优点？' },
 { type: 'truth', content: '你们第一次约会的场景还记得吗？' },
 { type: 'dare', content: '给TA一个大大的拥抱' },
 { type: 'dare', content: '用三种语言说我爱你' },
 { type: 'dare', content: '模仿TA的一个习惯动作' },
 { type: 'dare', content: '唱一首情歌给TA听' },
 { type: 'dare', content: '给TA发一条甜蜜短信' }
 ],
 draw: ['爱心', '玫瑰花', '月亮', '星星', '冰淇淋', '蛋糕', '雨伞', '气球', '彩虹', '音符'],
 test: [
 { text: '你们每天都会聊天吗？', options: ['是的，每天都聊', '偶尔聊一下'] },
 { text: 'TA的生日你会精心准备礼物吗？', options: ['一定会', '看情况'] },
 { text: '你们会一起规划未来吗？', options: ['经常讨论', '很少讨论'] },
 { text: 'TA难过时你会第一时间安慰吗？', options: ['当然会', '不一定'] },
 { text: '你们会一起做喜欢的事情吗？', options: ['经常一起', '各自做自己的'] }
 ],
 challenge: [
 { icon: '💑', title: '一起看一场电影', description: '选一部TA喜欢的电影' },
 { icon: '🍳', title: '一起做早餐', description: '为TA准备爱心早餐' },
 { icon: '💌', title: '写一封情书', description: '手写一封甜蜜情书' },
 { icon: '🌳', title: '一起散步', description: '手牵手散步聊天' },
 { icon: '🎵', title: '一起唱歌', description: '合唱一首情歌' },
 { icon: '📸', title: '拍合照', description: '拍一张甜蜜合照' },
 { icon: '👩🍳', title: '一起做饭', description: '共同完成一顿大餐' }
 ],
 gift: {
 '1': [
 { id: '1', icon: '💍', name: '情侣戒指', desc: '见证永恒的爱情' },
 { id: '2', icon: '📿', name: '手链', desc: '精致优雅' },
 { id: '3', icon: '🎀', name: '项链', desc: '闪闪发光' },
 { id: '4', icon: '⌚', name: '手表', desc: '时刻想起你' }
 ],
 '2': [
 { id: '5', icon: '🌹', name: '红玫瑰', desc: '热情的爱' },
 { id: '6', icon: '🌸', name: '樱花', desc: '浪漫唯美' },
 { id: '7', icon: '🌺', name: '向日葵', desc: '阳光开朗' },
 { id: '8', icon: '💐', name: '花束', desc: '精心搭配' }
 ],
 '3': [
 { id: '9', icon: '📝', name: '定制相册', desc: '记录美好时光' },
 { id: '10', icon: '🎨', name: '手绘画像', desc: '独一无二' },
 { id: '11', icon: '🕯️', name: '香薰蜡烛', desc: '营造氛围' },
 { id: '12', icon: '📚', name: '定制书籍', desc: '专属故事' }
 ],
 '4': [
 { id: '13', icon: '👔', name: '领带', desc: '绅士风度' },
 { id: '14', icon: '👗', name: '连衣裙', desc: '优雅美丽' },
 { id: '15', icon: '🧣', name: '围巾', desc: '温暖贴心' },
 { id: '16', icon: '👟', name: '运动鞋', desc: '舒适时尚' }
 ],
 '5': [
 { id: '17', icon: '🍫', name: '巧克力', desc: '甜蜜滋味' },
 { id: '18', icon: '🎂', name: '生日蛋糕', desc: '甜蜜惊喜' },
 { id: '19', icon: '🍷', name: '红酒', desc: '浪漫时刻' },
 { id: '20', icon: '🍪', name: '手工饼干', desc: '心意满满' }
 ],
 '6': [
 { id: '21', icon: '📱', name: '手机壳', desc: '个性定制' },
 { id: '22', icon: '🎧', name: '耳机', desc: '享受音乐' },
 { id: '23', icon: '📷', name: '拍立得', desc: '即时回忆' },
 { id: '24', icon: '⌚', name: '智能手表', desc: '科技时尚' }
 ]
 }
 };
 return defaults[type] || [];
};
const quizQuestions = ref([]);
const quizCurrentIndex = ref(0);
const quizScore = ref(0);
const quizAnswerText = ref('');
const quizAnswered = ref(false);
const quizIsCorrect = ref(false);
const showQuizResult = ref(false);
const answerQuiz = () => {
 if (quizAnswered.value)
 return;
 quizAnswered.value = true;
 const question = quizQuestions.value[quizCurrentIndex.value];
 const expected = question.answerText || question.options?.[question.answer] || '';
 quizIsCorrect.value = quizAnswerText.value.trim().toLocaleLowerCase() === expected.trim().toLocaleLowerCase();
 if (quizIsCorrect.value) {
 quizScore.value += 20;
 }
};
const nextQuiz = () => {
 if (quizCurrentIndex.value < quizQuestions.value.length - 1) {
 quizCurrentIndex.value++;
 quizAnswerText.value = '';
 quizAnswered.value = false;
 }
 else {
 showQuizResult.value = true;
 }
};
const quizResultEmoji = computed(() => {
 if (quizScore.value === 100)
 return '🏆';
 if (quizScore.value >= 80)
 return '😍';
 if (quizScore.value >= 60)
 return '😊';
 if (quizScore.value >= 40)
 return '😐';
 return '😢';
});
const quizResultTitle = computed(() => {
 if (quizScore.value === 100)
 return '灵魂伴侣！';
 if (quizScore.value >= 80)
 return '非常默契！';
 if (quizScore.value >= 60)
 return '还不错哦！';
 if (quizScore.value >= 40)
 return '需要加油！';
 return '继续努力！';
});
const quizResultDesc = computed(() => {
 if (quizScore.value === 100)
 return '你们简直是天生一对，对彼此了如指掌！';
 if (quizScore.value >= 80)
 return '你们非常了解对方，默契十足！';
 if (quizScore.value >= 60)
 return '还有一些小细节需要了解哦！';
 if (quizScore.value >= 40)
 return '多花点时间了解TA吧！';
 return '加油！多和TA沟通交流！';
});
const resetQuiz = () => {
 quizCurrentIndex.value = 0;
 quizScore.value = 0;
 quizAnswerText.value = '';
 quizAnswered.value = false;
 quizIsCorrect.value = false;
 showQuizResult.value = false;
};
const truthCards = ref([]);
const truthCurrentCard = ref(null);
const pickTruthCard = () => {
 const filtered = truthCards.value.filter(c => c.type === 'truth');
 truthCurrentCard.value = filtered[Math.floor(Math.random() * filtered.length)];
};
const pickDareCard = () => {
 const filtered = truthCards.value.filter(c => c.type === 'dare');
 truthCurrentCard.value = filtered[Math.floor(Math.random() * filtered.length)];
};
const drawWords = ref([]);
const drawColors = ['#000000', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'];
const drawCanvas = ref(null);
const drawColor = ref('#000000');
const drawWord = ref('');
const drawRound = ref(1);
const drawScore = ref(0);
const isDrawing = ref(false);
const ctx = ref(null);
const initCanvas = () => {
 if (drawCanvas.value) {
 drawCanvas.value.width = 280;
 drawCanvas.value.height = 200;
 ctx.value = drawCanvas.value.getContext('2d');
 ctx.value.strokeStyle = drawColor.value;
 ctx.value.lineWidth = 3;
 ctx.value.lineCap = 'round';
 ctx.value.lineJoin = 'round';
 }
};
const startDraw = (e) => {
 isDrawing.value = true;
 const touch = e.touches[0];
 const rect = drawCanvas.value.getBoundingClientRect();
 ctx.value.beginPath();
 ctx.value.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
};
const drawing = (e) => {
 if (!isDrawing.value)
 return;
 const touch = e.touches[0];
 const rect = drawCanvas.value.getBoundingClientRect();
 ctx.value.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
 ctx.value.stroke();
};
const stopDraw = () => {
 isDrawing.value = false;
};
const clearCanvas = () => {
 ctx.value.clearRect(0, 0, drawCanvas.value.width, drawCanvas.value.height);
};
const nextDrawRound = () => {
 if (drawRound.value <= drawWords.value.length) {
 drawWord.value = drawWords.value[Math.floor(Math.random() * drawWords.value.length)];
 clearCanvas();
 drawRound.value++;
 drawScore.value += 10;
 }
 else {
 showToast('游戏结束！');
 backToGames();
 }
};
const loveTestQuestions = ref([]);
const loveAnswers = ref([]);
const showLoveResult = ref(false);
const loveScore = ref(0);
const loveAnswersComplete = computed(() => {
 return loveAnswers.value.length === loveTestQuestions.value.length;
});
const selectLoveAnswer = (questionIndex, answerIndex) => {
 loveAnswers.value[questionIndex] = answerIndex;
};
const calculateLoveResult = () => {
 loveScore.value = loveAnswers.value.filter(a => a === 0).length * (100 / loveTestQuestions.value.length);
 showLoveResult.value = true;
};
const loveResultEmoji = computed(() => {
 if (loveScore.value >= 100)
 return '💯';
 if (loveScore.value >= 80)
 return '🔥';
 if (loveScore.value >= 60)
 return '💗';
 if (loveScore.value >= 40)
 return '💕';
 return '💔';
});
const loveResultTitle = computed(() => {
 if (loveScore.value >= 100)
 return '完美爱情！';
 if (loveScore.value >= 80)
 return '热恋中！';
 if (loveScore.value >= 60)
 return '感情稳定';
 if (loveScore.value >= 40)
 return '需要升温';
 return '加油努力';
});
const loveResultDesc = computed(() => {
 if (loveScore.value >= 100)
 return '你们的爱情堪称完美，好好珍惜彼此！';
 if (loveScore.value >= 80)
 return '你们正处于热恋期，甜蜜满满！';
 if (loveScore.value >= 60)
 return '感情稳定，继续保持！';
 if (loveScore.value >= 40)
 return '多花点时间陪伴对方吧！';
 return '需要更多的沟通和理解！';
});
const resetLoveTest = () => {
 loveAnswers.value = [];
 showLoveResult.value = false;
 loveScore.value = 0;
};
const challenges = ref([]);
const challengeToday = ref(null);
const challengeCompleted = ref(false);
const challengeHistory = ref([]);
const completeChallenge = () => {
 challengeCompleted.value = true;
 if (challengeToday.value) {
 challengeHistory.value.unshift({ ...challengeToday.value, completed: true });
 }
 showToast('挑战完成！');
};
const giftCategories = [
 { id: '1', icon: '💍', name: '饰品' },
 { id: '2', icon: '🌹', name: '鲜花' },
 { id: '3', icon: '🎁', name: '创意' },
 { id: '4', icon: '👗', name: '服饰' },
 { id: '5', icon: '🍫', name: '美食' },
 { id: '6', icon: '📱', name: '数码' }
];
const giftItems = ref({});
const selectedGiftCategory = ref(null);
const selectedGifts = computed(() => {
 if (!selectedGiftCategory.value) {
 const allGifts = [];
 Object.values(giftItems.value).forEach(category => {
 allGifts.push(...category.slice(0, 2));
 });
 return allGifts;
 }
 return giftItems.value[selectedGiftCategory.value.id] || [];
});
const selectGiftCategory = (category) => {
 selectedGiftCategory.value = selectedGiftCategory.value?.id === category.id ? null : category;
};
const selectAdminGame = (game) => {
 selectedAdminGame.value = game;
};
const adminItems = computed(() => {
 if (!selectedAdminGame.value)
 return [];
 const type = selectedAdminGame.value.type;
 if (type === 'quiz')
 return quizQuestions.value;
 if (type === 'truth')
 return truthCards.value;
 if (type === 'draw')
 return drawWords.value.map(w => ({ word: w }));
 if (type === 'test')
 return loveTestQuestions.value;
 if (type === 'challenge')
 return challenges.value;
 if (type === 'gift') {
 const allGifts = [];
 Object.values(giftItems.value).forEach(category => {
 allGifts.push(...category.map(g => ({ ...g, categoryId: Object.keys(giftItems.value).find(k => giftItems.value[k].includes(g)) })));
 });
 return allGifts;
 }
 return [];
});
const getIcon = (item) => {
 if (item.icon)
 return item.icon;
 if (item.type === 'truth')
 return '🎤';
 if (item.type === 'dare')
 return '🎭';
 return '📝';
};
const getItemTitle = (item) => {
 if (item.question)
 return item.question;
 if (item.content)
 return item.content;
 if (item.word)
 return item.word;
 if (item.text)
 return item.text;
 if (item.title)
 return item.title;
 if (item.name)
 return item.name;
 return '未命名';
};
const getItemDesc = (item) => {
 if (item.hint)
 return item.hint;
 if (item.description)
 return item.description;
 if (item.desc)
 return item.desc;
 return null;
};
const addNewItem = () => {
 editingIndex.value = -1;
 formData.value = {
 answerText: ''
 };
 showModal.value = true;
};
const editItem = (index) => {
 editingIndex.value = index;
 const item = adminItems.value[index];
 formData.value = { ...item };
 if (!formData.value.answerText) formData.value.answerText = formData.value.options?.[formData.value.answer] || '';
 showModal.value = true;
};
const deleteItem = (index) => {
 if (confirm('确定删除吗？')) {
 const type = selectedAdminGame.value.type;
 if (type === 'quiz') {
 quizQuestions.value.splice(index, 1);
 saveItems('quiz', quizQuestions.value);
 }
 else if (type === 'truth') {
 truthCards.value.splice(index, 1);
 saveItems('truth', truthCards.value);
 }
 else if (type === 'draw') {
 drawWords.value.splice(index, 1);
 saveItems('draw', drawWords.value);
 }
 else if (type === 'test') {
 loveTestQuestions.value.splice(index, 1);
 saveItems('test', loveTestQuestions.value);
 }
 else if (type === 'challenge') {
 challenges.value.splice(index, 1);
 saveItems('challenge', challenges.value);
 }
 else if (type === 'gift') {
 const allGifts = [];
 let found = false;
 Object.keys(giftItems.value).forEach(categoryId => {
 giftItems.value[categoryId] = giftItems.value[categoryId].filter((_, i) => {
 if (!found && allGifts.length === index) {
 found = true;
 return false;
 }
 allGifts.push(_);
 return true;
 });
 });
 saveItems('gift', giftItems.value);
 }
 showToast('删除成功');
 }
};
const saveItem = () => {
 const type = selectedAdminGame.value.type;
 if (editingIndex.value >= 0) {
 if (type === 'quiz') {
 quizQuestions.value[editingIndex.value] = { ...formData.value };
 saveItems('quiz', quizQuestions.value);
 }
 else if (type === 'truth') {
 truthCards.value[editingIndex.value] = { ...formData.value };
 saveItems('truth', truthCards.value);
 }
 else if (type === 'draw') {
 drawWords.value[editingIndex.value] = formData.value.word;
 saveItems('draw', drawWords.value);
 }
 else if (type === 'test') {
 loveTestQuestions.value[editingIndex.value] = { ...formData.value };
 saveItems('test', loveTestQuestions.value);
 }
 else if (type === 'challenge') {
 challenges.value[editingIndex.value] = { ...formData.value };
 saveItems('challenge', challenges.value);
 }
 else if (type === 'gift') {
 const categoryId = formData.value.categoryId;
 if (!giftItems.value[categoryId]) {
 giftItems.value[categoryId] = [];
 }
 const newId = Date.now().toString();
 giftItems.value[categoryId].push({ id: newId, ...formData.value });
 saveItems('gift', giftItems.value);
 }
 showToast('修改成功');
 }
 else {
 if (type === 'quiz') {
 quizQuestions.value.push({ ...formData.value });
 saveItems('quiz', quizQuestions.value);
 }
 else if (type === 'truth') {
 truthCards.value.push({ ...formData.value });
 saveItems('truth', truthCards.value);
 }
 else if (type === 'draw') {
 drawWords.value.push(formData.value.word);
 saveItems('draw', drawWords.value);
 }
 else if (type === 'test') {
 loveTestQuestions.value.push({ ...formData.value });
 saveItems('test', loveTestQuestions.value);
 }
 else if (type === 'challenge') {
 challenges.value.push({ ...formData.value });
 saveItems('challenge', challenges.value);
 }
 else if (type === 'gift') {
 const categoryId = formData.value.categoryId;
 if (!giftItems.value[categoryId]) {
 giftItems.value[categoryId] = [];
 }
 const newId = Date.now().toString();
 giftItems.value[categoryId].push({ id: newId, ...formData.value });
 saveItems('gift', giftItems.value);
 }
 showToast('添加成功');
 }
 closeModal();
};
const closeModal = () => {
 showModal.value = false;
 editingIndex.value = -1;
 formData.value = {};
};
const loadAllData = () => {
 quizQuestions.value = loadItems('quiz');
 truthCards.value = loadItems('truth');
 drawWords.value = loadItems('draw');
 loveTestQuestions.value = loadItems('test');
 challenges.value = loadItems('challenge');
 giftItems.value = loadItems('gift');
};
onMounted(() => {
 loadAllData();
 nextTick(() => {
 initCanvas();
 });
 if (challenges.value.length > 0) {
 challengeToday.value = challenges.value[Math.floor(Math.random() * challenges.value.length)];
 }
 if (drawWords.value.length > 0) {
 drawWord.value = drawWords.value[Math.floor(Math.random() * drawWords.value.length)];
 }
});
</script>
