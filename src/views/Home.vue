<template>
  <div class="home-page">
    <header class="home-header">
      <div>
        <p>{{ greeting }}</p>
        <h1>我们的恋爱空间</h1>
      </div>
      <button class="install-app-button" aria-label="安装恋爱日记" @click="installApp">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3v11m0 0 4-4m-4 4-4-4M5 17.5v1.2A2.3 2.3 0 0 0 7.3 21h9.4a2.3 2.3 0 0 0 2.3-2.3v-1.2" />
        </svg>
        <span>安装</span>
      </button>
    </header>

    <main class="home-main">
      <section class="love-hero" :style="heroCardStyle">
        <button class="hero-customize-button" type="button" aria-label="自定义情侣卡片" @click="showHeroCustomizer = true">✦ 装扮</button>
        <template v-if="heroSettings.showDecorations">
          <div class="hero-glow hero-glow-one"></div>
          <div class="hero-glow hero-glow-two"></div>
          <span class="hero-doodle doodle-one">♡</span>
          <span class="hero-doodle doodle-two">✦</span>
        </template>

        <div class="couple-row">
          <button class="avatar-button" @click="changeAvatar('user')">
            <img v-if="userAvatar" :src="userAvatar" alt="我的头像" />
            <span v-else>{{ userName.slice(0, 1) }}</span>
          </button>

          <div class="love-days">
            <span>{{ heroAnniversary.label }}</span>
            <strong>{{ heroAnniversary.days }}</strong>
            <em>天</em>
          </div>

          <button class="avatar-button" @click="changeAvatar('partner')">
            <img v-if="partnerAvatar" :src="partnerAvatar" alt="伴侣头像" />
            <span v-else>{{ partnerName.slice(0, 1) }}</span>
          </button>
        </div>

        <div class="couple-names">
          <span>{{ userName }}</span>
          <i>♥</i>
          <span>{{ partnerName }}</span>
        </div>

        <div v-if="heroSettings.showStats" class="hero-countdown" @click="go('/anniversary')">
          <div class="countdown-header">
            <small>下一段值得期待的日子</small>
            <strong>{{ pinnedCountdown.name || '置顶纪念日' }}</strong>
          </div>
          <div class="countdown-grid-home">
            <div><strong>{{ pinnedCountdown.days }}</strong><span>天</span></div>
            <div><strong>{{ pinnedCountdown.hours }}</strong><span>时</span></div>
            <div><strong>{{ pinnedCountdown.minutes }}</strong><span>分</span></div>
            <div><strong>{{ pinnedCountdown.seconds }}</strong><span>秒</span></div>
          </div>
        </div>
      </section>

      <div class="status-grid">
        <button class="status-card anniversary-status" @click="go('/anniversary')">
          <span class="status-kicker">下一纪念日</span>
          <strong>{{ nextAnniversary?.title || '添加一个重要日子' }}</strong>
          <span v-if="nextAnniversary" class="status-detail">
            还有 <b>{{ nextAnniversary.days }}</b> 天
          </span>
          <span v-else class="status-detail">把值得期待的日子记下来</span>
          <span class="status-art">♡</span>
        </button>

        <button class="status-card fund-status" @click="go('/fund')">
          <span class="status-kicker">共同记账</span>
          <strong>¥ {{ formatMoney(fundBalance) }}</strong>
          <span class="status-detail">{{ fundCount ? `已记录 ${fundCount} 笔` : '从第一笔共同开销开始' }}</span>
          <span class="status-art">¥</span>
        </button>
      </div>

      <section class="section-block">
        <div class="section-heading">
          <div>
            <span>QUICK ACCESS</span>
            <h2>快捷入口</h2>
          </div>
          <button @click="go('/me')">全部功能</button>
        </div>

        <div class="quick-grid">
          <button
            v-for="item in shortcuts"
            :key="item.path"
            class="quick-item"
            @click="go(item.path)"
          >
            <span class="quick-icon" :style="{ background: item.bg, color: item.color }" v-html="lineIcon(item.icon)"></span>
            <strong>{{ item.label }}</strong>
            <small>{{ item.desc }}</small>
          </button>
        </div>
      </section>

      <section class="section-block memory-section">
        <div class="section-heading">
          <div>
            <span>OUR MOMENTS</span>
            <h2>最近的浪漫</h2>
          </div>
          <button @click="go('/photo')">查看相册</button>
        </div>

        <button class="memory-carousel" @click="go('/photo')">
          <img :src="activeHomePhoto?.url || memoryCafe" alt="最近添加的照片" />
          <div class="memory-carousel-overlay">
            <span>{{ activeHomePhoto?.note || '把普通日子过成喜欢的样子' }}</span>
            <small v-if="recentHomePhotos.length > 1">{{ activeHomePhotoIndex + 1 }} / {{ recentHomePhotos.length }}</small>
          </div>
          <div v-if="recentHomePhotos.length > 1" class="memory-dots">
            <i v-for="(_, index) in recentHomePhotos" :key="index" :class="{ active: index === activeHomePhotoIndex }"></i>
          </div>
        </button>
      </section>

      <section class="section-block today-section">
        <div class="section-heading">
          <div>
            <span>JUST FOR US</span>
            <h2>今天的我们</h2>
          </div>
          <span class="today-date">{{ todayText }}</span>
        </div>

        <div class="today-feature" @click="go('/diary')">
          <div class="feature-icon">✎</div>
          <div class="feature-copy">
            <span>{{ recentDiary ? '最近一篇日记' : '今天还没有写日记' }}</span>
            <strong>{{ recentDiary?.title || '记下今天最想留住的一刻' }}</strong>
            <p>{{ recentDiary?.content || '哪怕只写一句话，也会成为以后的珍贵回忆。' }}</p>
          </div>
          <span class="feature-arrow">›</span>
        </div>

        <div class="today-list">
          <button @click="go('/plan')">
            <span class="list-icon plan-icon">✓</span>
            <span class="list-copy">
              <small>最近计划</small>
              <strong>{{ upcomingPlan?.title || '一起定个小目标' }}</strong>
            </span>
            <em>{{ upcomingPlan ? planDateText(upcomingPlan) : '去添加' }}</em>
          </button>

          <button @click="go('/bucketlist')">
            <span class="list-icon wish-icon">☆</span>
            <span class="list-copy">
              <small>心愿清单</small>
              <strong>{{ pendingWish?.title || '收藏下次想一起做的事' }}</strong>
            </span>
            <em>{{ pendingWish ? '待实现' : '去许愿' }}</em>
          </button>

        </div>
      </section>

      <section class="love-message">
        <span>"</span>
        <p>爱不是盛大的宣言，是每个普通日子里都有彼此。</p>
        <small>OUR LITTLE LOVE STORY</small>
      </section>
    </main>

    <nav class="bottom-nav">
      <button
        v-for="tab in tabs"
        :key="tab.path"
        :class="{ active: isTabActive(tab.path) }"
        @click="go(tab.path)"
      >
        <span v-html="lineIcon(tab.icon)"></span>
        <em>{{ tab.label }}</em>
      </button>
    </nav>

    <div v-if="showHeroCustomizer" class="hero-customizer" @click.self="closeHeroCustomizer">
      <section class="hero-customizer-sheet">
        <div class="sheet-handle"></div>
        <div class="sheet-heading">
          <div><small>COUPLE CARD</small><h2>自定义情侣卡片</h2></div>
          <button type="button" @click="closeHeroCustomizer">完成</button>
        </div>

        <div class="hero-preset-list">
          <button
            v-for="preset in heroPresets"
            :key="preset.name"
            type="button"
            :style="{ background: `linear-gradient(135deg,${preset.from},${preset.to})` }"
            @click="applyHeroPreset(preset)"
          ><span>✓</span><small>{{ preset.name }}</small></button>
        </div>

        <div class="hero-setting-card">
          <div class="color-row">
            <label><span>左侧颜色</span><input v-model="heroSettings.colorFrom" type="color" @input="saveHeroSettings"></label>
            <label><span>右侧颜色</span><input v-model="heroSettings.colorTo" type="color" @input="saveHeroSettings"></label>
            <label><span>文字颜色</span><input v-model="heroSettings.textColor" type="color" @input="saveHeroSettings"></label>
          </div>

          <button class="hero-image-upload" type="button" @click="heroImageInput?.click()">
            <img v-if="heroSettings.backgroundImage" :src="heroSettings.backgroundImage" alt="">
            <span v-else>▧<small>上传背景照片</small></span>
            <em>{{ heroSettings.backgroundImage ? '更换图片' : '支持相册图片' }}</em>
          </button>
          <input ref="heroImageInput" type="file" accept="image/*" hidden @change="selectHeroImage">
          <button v-if="heroSettings.backgroundImage" class="remove-hero-image" type="button" @click="removeHeroImage">移除背景图片</button>

          <label class="range-setting">
            <span><b>图片遮罩</b><small>{{ Math.round(heroSettings.overlay * 100) }}%</small></span>
            <input v-model.number="heroSettings.overlay" type="range" min="0" max=".7" step=".05" @input="saveHeroSettings">
          </label>
          <label class="range-setting">
            <span><b>卡片圆角</b><small>{{ heroSettings.radius }}px</small></span>
            <input v-model.number="heroSettings.radius" type="range" min="12" max="48" step="2" @input="saveHeroSettings">
          </label>
          <label class="range-setting">
            <span><b>图片位置</b><small>{{ heroSettings.position }}%</small></span>
            <input v-model.number="heroSettings.position" type="range" min="0" max="100" step="5" @input="saveHeroSettings">
          </label>
        </div>

        <div class="hero-toggle-card">
          <label><span><b>显示爱心装饰</b><small>隐藏或显示卡片上的图形</small></span><input v-model="heroSettings.showDecorations" type="checkbox" @change="saveHeroSettings"><i></i></label>
          <label><span><b>显示底部统计</b><small>恋爱值、日记和回忆统计</small></span><input v-model="heroSettings.showStats" type="checkbox" @change="saveHeroSettings"><i></i></label>
        </div>

        <button class="reset-hero-card" type="button" @click="resetHeroSettings">恢复默认卡片</button>
      </section>
    </div>

    <div v-if="toast" class="home-toast">{{ toast }}</div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useDiaryStore } from '../stores/diary'
import { AnniversaryAPI, PlanAPI } from '@/api'
import memoryCafe from '../../assets/img/memory-cafe-web.jpg'
import memoryMorning from '../../assets/img/memory-morning-web.jpg'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const diaryStore = useDiaryStore()

const anniversaries = ref([])
const pinnedAnniversary = ref(null)
const wishes = ref([])
const plans = ref([])
const fundData = ref({ totalAmount: 0, transactions: [] })
const photoRecords = ref([])
const photoAlbums = ref([])
const activeHomePhotoIndex = ref(0)
let homeCarouselTimer = null
const toast = ref('')
const installPrompt = ref(null)
const showHeroCustomizer = ref(false)
const heroImageInput = ref(null)
const now = ref(Date.now())
let countdownTimer = null

const defaultHeroSettings = () => ({
  colorFrom: '#f38aa9',
  colorTo: '#d65379',
  textColor: '#ffffff',
  backgroundImage: '',
  overlay: .22,
  radius: 34,
  position: 50,
  showDecorations: true,
  showStats: true
})
const heroStorageKey = () => `loveDiary_heroStyle_${authStore.user?.id || 'local'}`
const loadHeroSettings = () => {
  try {
    return { ...defaultHeroSettings(), ...JSON.parse(localStorage.getItem(heroStorageKey()) || '{}') }
  } catch {
    return defaultHeroSettings()
  }
}
const heroSettings = ref(loadHeroSettings())
const heroPresets = [
  { name: '樱花粉', from: '#f5a2b7', to: '#d55579' },
  { name: '云朵蓝', from: '#8ed4f2', to: '#58a9de' },
  { name: '奶油杏', from: '#eac9a9', to: '#c98e73' },
  { name: '暮莓紫', from: '#c596bd', to: '#8f638f' },
  { name: '蜜桃橘', from: '#f6b392', to: '#df7d76' }
]
const heroCardStyle = computed(() => ({
  background: heroSettings.value.backgroundImage
    ? `linear-gradient(rgba(27,16,21,${heroSettings.value.overlay}),rgba(27,16,21,${heroSettings.value.overlay})),url("${heroSettings.value.backgroundImage}") center ${heroSettings.value.position}% / cover no-repeat`
    : `linear-gradient(135deg,${heroSettings.value.colorFrom},${heroSettings.value.colorTo})`,
  color: heroSettings.value.textColor,
  borderRadius: `${heroSettings.value.radius}px`,
  '--hero-text-color': heroSettings.value.textColor
}))

const userName = computed(() => authStore.user?.nickname || authStore.user?.username || '我')
const partnerName = computed(() => authStore.user?.partner?.nickname || 'TA')
const userAvatar = computed(() => authStore.user?.avatar || '')
const partnerAvatar = computed(() => authStore.user?.partner?.avatar || '')
const loveStartDate = computed(() => authStore.user?.loveStartDate || '2023-05-20')

const loveDays = computed(() => {
  const start = parseDate(loveStartDate.value)
  return Math.max(1, Math.floor((startOfToday() - start) / 86400000) + 1)
})

const heroAnniversary = computed(() => {
  if (pinnedAnniversary.value?.date) {
    const original = parseDate(pinnedAnniversary.value.date)
    const today = startOfToday()
    const days = Math.max(0, Math.floor((today - original) / 86400000))
    return {
      label: pinnedAnniversary.value.name || '我们的纪念日',
      days
    }
  }
  return { label: '我们在一起', days: loveDays.value }
})

const diaryCount = computed(() => diaryStore.entries?.length || 0)
const allAlbumPhotos = computed(() => photoAlbums.value.flatMap(album => album.photos || []))
const memoryCount = computed(() => allAlbumPhotos.value.length || photoRecords.value.reduce((total, record) => total + (record.photos?.length || 0), 0))
const recentHomePhotos = computed(() => [...allAlbumPhotos.value]
  .sort((a, b) => new Date(b.capturedAt || 0) - new Date(a.capturedAt || 0))
  .slice(0, 10))
const activeHomePhoto = computed(() => recentHomePhotos.value[activeHomePhotoIndex.value] || null)
const startHomeCarousel = () => {
  clearInterval(homeCarouselTimer)
  if (recentHomePhotos.value.length < 2) return
  homeCarouselTimer = window.setInterval(() => {
    activeHomePhotoIndex.value = (activeHomePhotoIndex.value + 1) % recentHomePhotos.value.length
  }, 3600)
}
const loveValue = computed(() => {
  return 5200 + loveDays.value * 3 + diaryCount.value * 18
})

const pinnedCountdown = computed(() => {
  const pinned = pinnedAnniversary.value
  if (!pinned || !pinned.date) {
    return { name: '暂无置顶纪念日', days: '0', hours: '00', minutes: '00', seconds: '00' }
  }
  const original = parseDate(pinned.date)
  const today = new Date(now.value)
  today.setHours(0, 0, 0, 0)
  let target = new Date(original)
  target.setHours(0, 0, 0, 0)
  if (pinned.repeatYearly) {
    target.setFullYear(today.getFullYear())
    if (target < today) target.setFullYear(today.getFullYear() + 1)
  }
  let diff = target.getTime() - now.value
  if (diff < 0) diff = 0
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  diff -= days * 1000 * 60 * 60 * 24
  const hours = Math.floor(diff / (1000 * 60 * 60))
  diff -= hours * 1000 * 60 * 60
  const minutes = Math.floor(diff / (1000 * 60))
  diff -= minutes * 1000 * 60
  const seconds = Math.floor(diff / 1000)
  const pad = n => String(n).padStart(2, '0')
  return {
    name: pinned.name || pinned.title || '置顶纪念日',
    days: String(days),
    hours: pad(hours),
    minutes: pad(minutes),
    seconds: pad(seconds)
  }
})

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 11) return '早上好，今天也要甜甜的'
  if (hour < 18) return '下午好，想念也有回音'
  return '晚上好，来看看我们的今天'
})

const todayText = computed(() => {
  return new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' }).format(new Date())
})

const recentDiary = computed(() => diaryStore.entries?.[0] || null)
const fundBalance = computed(() => Number(fundData.value.totalAmount) || 0)
const fundCount = computed(() => fundData.value.transactions?.length || 0)

const nextAnniversary = computed(() => {
  // 优先使用置顶纪念日，保证主页统计与倒计时一致
  if (pinnedAnniversary.value?.date) {
    const name = pinnedAnniversary.value.name || pinnedAnniversary.value.title || '纪念日'
    return {
      ...pinnedAnniversary.value,
      name,
      title: name,
      ...getNextOccurrence(pinnedAnniversary.value.date)
    }
  }
  const items = anniversaries.value
    .map(item => ({ ...item, title: item.title || item.name, ...getNextOccurrence(item.date) }))
    .filter(item => Number.isFinite(item.days))
    .sort((a, b) => a.days - b.days)
  return items[0] || null
})

const upcomingPlan = computed(() => {
  return plans.value
    .filter(item => !item.completed && item.status !== 'completed')
    .sort((a, b) => String(a.target_date || a.date || '').localeCompare(String(b.target_date || b.date || '')))[0] || null
})

const pendingWish = computed(() => wishes.value.find(item => !item.completed && item.status !== 'completed') || null)

const shortcuts = [
  { label: '写日记', desc: '记录此刻', path: '/diary', icon: 'edit', bg: '#fff0f5', color: '#ee5f8b' },
  { label: '纪念日', desc: '重要日子', path: '/anniversary', icon: 'calendar', bg: '#fff1ee', color: '#f07869' },
  { label: '共同记账', desc: '每笔生活', path: '/fund', icon: 'wallet', bg: '#fff8e7', color: '#c9912e' },
  { label: '情侣相册', desc: '珍藏回忆', path: '/photo', icon: 'image', bg: '#eef8ff', color: '#438dbe' },
  { label: '愿望清单', desc: '一起实现', path: '/bucketlist', icon: 'star', bg: '#f3f0ff', color: '#8268cf' },
  { label: '未来计划', desc: '奔赴未来', path: '/plan', icon: 'flag', bg: '#edfaf4', color: '#4d9c78' },
  { label: '情侣互动', desc: '默契升温', path: '/games', icon: 'game', bg: '#fff1f7', color: '#dd6391' },
  { label: '悄悄话', desc: '说给你听', path: '/vent', icon: 'message', bg: '#eef5ff', color: '#5d82bd' }
]

const tabs = [
  { label: '我们', path: '/home', icon: 'home' },
  { label: '纪念日', path: '/anniversary', icon: 'calendar' },
  { label: '聊天', path: '/chat', icon: 'message' },
  { label: '位置', path: '/location', icon: 'pin' },
  { label: '我的', path: '/me', icon: 'user' }
]

function parseDate(value) {
  const parts = String(value || '').slice(0, 10).split('-').map(Number)
  return new Date(parts[0] || 2023, (parts[1] || 1) - 1, parts[2] || 1)
}

function startOfToday() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

function getNextOccurrence(value) {
  if (!value) return { nextDate: null, days: Infinity }
  const original = parseDate(value)
  const today = startOfToday()
  let next = new Date(today.getFullYear(), original.getMonth(), original.getDate())
  if (next < today) next = new Date(today.getFullYear() + 1, original.getMonth(), original.getDate())
  return { nextDate: next, days: Math.ceil((next - today) / 86400000) }
}

function planDateText(plan) {
  const value = plan.target_date || plan.date
  if (!value) return '进行中'
  const date = parseDate(value)
  return `${date.getMonth() + 1}.${date.getDate()}`
}

function formatMoney(value) {
  return Math.abs(Number(value) || 0).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

function go(path) {
  router.push(path)
}

function isTabActive(path) {
  return route.path === path || route.path.startsWith(`${path}/`)
}

function changeAvatar(target) {
  if (target === 'user') router.push('/profile')
  else router.push('/me')
}

function showToast(message, duration = 2600) {
  toast.value = message
  window.setTimeout(() => {
    if (toast.value === message) toast.value = ''
  }, duration)
}

function saveHeroSettings() {
  try {
    localStorage.setItem(heroStorageKey(), JSON.stringify(heroSettings.value))
  } catch {
    showToast('背景图片过大，请换一张图片')
  }
}

function closeHeroCustomizer() {
  saveHeroSettings()
  showHeroCustomizer.value = false
}

function applyHeroPreset(preset) {
  heroSettings.value.colorFrom = preset.from
  heroSettings.value.colorTo = preset.to
  heroSettings.value.backgroundImage = ''
  saveHeroSettings()
  showToast(`${preset.name}已应用`)
}

const resizeHeroImage = file => new Promise((resolve, reject) => {
  const image = new Image()
  const url = URL.createObjectURL(file)
  image.onload = () => {
    const maxWidth = 1500
    const scale = Math.min(1, maxWidth / image.naturalWidth)
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
    URL.revokeObjectURL(url)
    resolve(canvas.toDataURL('image/jpeg', .78))
  }
  image.onerror = () => {
    URL.revokeObjectURL(url)
    reject(new Error('图片读取失败'))
  }
  image.src = url
})

async function selectHeroImage(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  if (!file.type.startsWith('image/')) return showToast('请选择图片文件')
  if (file.size > 18 * 1024 * 1024) return showToast('原图不能超过 18MB')
  try {
    heroSettings.value.backgroundImage = await resizeHeroImage(file)
    saveHeroSettings()
    showToast('情侣卡片背景已更换')
  } catch (error) {
    showToast(error.message || '图片处理失败')
  }
}

function removeHeroImage() {
  heroSettings.value.backgroundImage = ''
  saveHeroSettings()
}

function resetHeroSettings() {
  heroSettings.value = defaultHeroSettings()
  saveHeroSettings()
  showToast('已恢复默认卡片')
}

function captureInstallPrompt(event) {
  event.preventDefault()
  installPrompt.value = event
}

async function installApp() {
  if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
    showToast('恋爱日记已经安装在手机上啦')
    return
  }

  if (installPrompt.value) {
    installPrompt.value.prompt()
    await installPrompt.value.userChoice
    installPrompt.value = null
    return
  }

  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
  showToast(
    isIos
      ? '请点击 Safari 的分享按钮，再选择"添加到主屏幕"'
      : '请打开浏览器菜单，选择"安装应用"或"添加到主屏幕"',
    4200
  )
}

function lineIcon(name) {
  const icons = {
    home: '<svg viewBox="0 0 24 24"><path d="M3.8 10.7 12 4l8.2 6.7v8a1.5 1.5 0 0 1-1.5 1.5H5.3a1.5 1.5 0 0 1-1.5-1.5z"/><path d="M9.2 20.2v-6.3h5.6v6.3"/></svg>',
    calendar: '<svg viewBox="0 0 24 24"><rect x="3.5" y="5.2" width="17" height="15.3" rx="2.2"/><path d="M7.8 3.5v3.4M16.2 3.5v3.4M3.5 9.3h17"/><path d="M8 13h.1M12 13h.1M16 13h.1M8 17h.1M12 17h.1"/></svg>',
    image: '<svg viewBox="0 0 24 24"><rect x="3.3" y="4.2" width="17.4" height="15.6" rx="2.3"/><circle cx="8.3" cy="9" r="1.7"/><path d="m4.4 17.7 4.8-4.6 3.2 2.8 2.6-2.5 4.6 4.3"/></svg>',
    pin: '<svg viewBox="0 0 24 24"><path d="M19.2 10c0 5.2-7.2 10.3-7.2 10.3S4.8 15.2 4.8 10a7.2 7.2 0 1 1 14.4 0Z"/><circle cx="12" cy="10" r="2.4"/></svg>',
    user: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8.1" r="3.6"/><path d="M5.4 20c.5-4 2.8-6 6.6-6s6.1 2 6.6 6"/></svg>',
    edit: '<svg viewBox="0 0 24 24"><path d="M4.2 19.8h4.1L19.2 8.9 15.1 4.8 4.2 15.7z"/><path d="m13.7 6.2 4.1 4.1M4 20h16"/></svg>',
    wallet: '<svg viewBox="0 0 24 24"><path d="M4 6.5h14.8a1.5 1.5 0 0 1 1.5 1.5v10.3a1.7 1.7 0 0 1-1.7 1.7H5.4a1.7 1.7 0 0 1-1.7-1.7V5.7A1.7 1.7 0 0 1 5.4 4h11"/><path d="M20.3 11.1h-5a2.1 2.1 0 0 0 0 4.2h5M15.4 13.2h.1"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="m12 3.5 2.7 5.4 6 .9-4.4 4.2 1 6-5.3-2.8L6.7 20l1-6-4.4-4.2 6-.9z"/></svg>',
    flag: '<svg viewBox="0 0 24 24"><path d="M5.2 21V4.2M5.5 5h12.8l-2.6 3.6 2.6 3.6H5.5"/></svg>',
    game: '<svg viewBox="0 0 24 24"><path d="M8 8.2h8a5.5 5.5 0 0 1 5.2 7.3l-.7 2a2.6 2.6 0 0 1-4.3 1l-1.7-1.7h-5l-1.7 1.7a2.6 2.6 0 0 1-4.3-1l-.7-2A5.5 5.5 0 0 1 8 8.2Z"/><path d="M7.5 11.5v4M5.5 13.5h4M16.3 12.5h.1M18.3 14.5h.1"/></svg>',
    message: '<svg viewBox="0 0 24 24"><path d="M20.2 11.2a8 8 0 0 1-8.4 8 9.5 9.5 0 0 1-3.5-.7L4 20l1.3-4a8 8 0 1 1 14.9-4.8Z"/><path d="M8 11.5h.1M12 11.5h.1M16 11.5h.1"/></svg>'
  }
  return icons[name] || icons.home
}

onMounted(async () => {
  window.addEventListener('beforeinstallprompt', captureInstallPrompt)
  window.addEventListener('appinstalled', () => showToast('安装成功，去手机桌面看看吧'))

  const readLocal = key => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '[]')
      return Array.isArray(value) ? value : []
    } catch {
      return []
    }
  }

  try {
    const savedFund = JSON.parse(localStorage.getItem('loveDiary_fund') || '{}')
    fundData.value = {
      totalAmount: Number(savedFund.totalAmount) || 0,
      transactions: Array.isArray(savedFund.transactions) ? savedFund.transactions : []
    }
  } catch {
    fundData.value = { totalAmount: 0, transactions: [] }
  }
  photoRecords.value = readLocal('loveDiary_photoRecords')
  photoAlbums.value = readLocal('loveDiary_albums')
  if (photoAlbums.value.length) {
    photoRecords.value = [{ photos: photoAlbums.value.flatMap(album => album.photos || []) }]
  }
  activeHomePhotoIndex.value = 0
  startHomeCarousel()
  countdownTimer = window.setInterval(() => { now.value = Date.now() }, 1000)
  wishes.value = readLocal('loveDiary_bucketList')
  if (!wishes.value.length) wishes.value = readLocal('loveDiary_wishes')

  const tasks = [
    diaryStore.list?.(),
    AnniversaryAPI.list(),
    PlanAPI.list(),
    AnniversaryAPI.getPinned()
  ]

  const results = await Promise.allSettled(tasks)
  if (results[0]?.status === 'fulfilled') { /* diaryStore 结果无需赋值 */ }
  if (results[1]?.status === 'fulfilled') anniversaries.value = results[1].value?.data || []
  if (results[2]?.status === 'fulfilled') plans.value = results[2].value?.data || []
  if (results[3]?.status === 'fulfilled') pinnedAnniversary.value = results[3].value || null
})

onBeforeUnmount(() => {
  clearInterval(homeCarouselTimer)
  clearInterval(countdownTimer)
  window.removeEventListener('beforeinstallprompt', captureInstallPrompt)
})
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  padding-bottom: 92px;
  color: #49373e;
  background:
    radial-gradient(circle at 8% 8%, rgba(255, 226, 235, .66), transparent 24%),
    linear-gradient(180deg, #fff9fb 0, #fffdfc 420px, #fffaf8 100%);
}

button {
  font: inherit;
}

.home-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 620px;
  margin: 0 auto;
  padding: 24px 20px 14px;
}

.home-header p {
  margin: 0 0 3px;
  color: #a98f98;
  font-size: 12px;
}

.home-header h1 {
  margin: 0;
  color: #39272e;
  font-family: "Noto Serif SC", "Songti SC", serif;
  font-size: 21px;
  letter-spacing: .02em;
}

.install-app-button {
  display: flex;
  align-items: center;
  height: 40px;
  padding: 0 13px;
  border: 1px solid rgba(230, 112, 148, .16);
  border-radius: 16px;
  color: #e56b92;
  background: rgba(255, 255, 255, .88);
  box-shadow: 0 8px 22px rgba(169, 96, 118, .09);
  gap: 5px;
  font-size: 11px;
  font-weight: 650;
}

.install-app-button svg {
  width: 17px;
  height: 17px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.7;
}

.home-main {
  display: grid;
  max-width: 620px;
  margin: 0 auto;
  padding: 0 16px 34px;
  gap: 14px;
}

.love-hero {
  position: relative;
  overflow: hidden;
  min-height: 260px;
  padding: 27px 22px 18px;
  border-radius: 30px;
  color: #fff;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, .15), transparent 38%),
    linear-gradient(135deg, #f38aa9 0%, #ef6f99 48%, #e95d8d 100%);
  box-shadow: 0 20px 48px rgba(213, 79, 123, .23);
}

.hero-glow {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, .14);
}

.hero-glow-one {
  top: -75px;
  right: -48px;
  width: 210px;
  height: 210px;
}

.hero-glow-two {
  bottom: -85px;
  left: -45px;
  width: 180px;
  height: 180px;
}

.hero-doodle {
  position: absolute;
  z-index: 1;
  color: rgba(255, 255, 255, .65);
  font-size: 24px;
}

.doodle-one {
  top: 25px;
  left: 34px;
  transform: rotate(-18deg);
}

.doodle-two {
  top: 40px;
  right: 35px;
}

.couple-row {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.avatar-button {
  display: grid;
  overflow: hidden;
  width: 68px;
  height: 68px;
  padding: 0;
  border: 3px solid rgba(255, 255, 255, .8);
  border-radius: 50%;
  color: #e76590;
  background: #fff4f7;
  box-shadow: 0 8px 22px rgba(135, 36, 69, .16);
  place-items: center;
  font-size: 22px;
  font-weight: 700;
}

.avatar-button img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.love-days {
  min-width: 108px;
  text-align: center;
}

.love-days span {
  display: block;
  margin-bottom: 2px;
  font-size: 11px;
  opacity: .83;
}

.love-days strong {
  font-family: Georgia, serif;
  font-size: 43px;
  font-weight: 500;
  line-height: 1;
  letter-spacing: -.04em;
}

.love-days em {
  margin-left: 4px;
  font-size: 12px;
  font-style: normal;
}

.couple-names {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 10px;
  gap: 9px;
  font-family: "Noto Serif SC", "Songti SC", serif;
  font-size: 15px;
}

.couple-names i {
  font-size: 11px;
  font-style: normal;
  opacity: .72;
}

.hero-countdown {
  position: absolute;
  right: 17px;
  bottom: 16px;
  left: 17px;
  z-index: 2;
  display: grid;
  padding: 13px 16px;
  border: 1px solid rgba(255, 255, 255, .2);
  border-radius: 18px;
  background: rgba(122, 31, 65, .13);
  backdrop-filter: blur(12px);
  cursor: pointer;
}

.countdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.countdown-header small {
  font-size: 10px;
  opacity: .78;
}

.countdown-header strong {
  font-size: 13px;
}

.countdown-grid-home {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  text-align: center;
}

.countdown-grid-home div {
  display: grid;
  gap: 2px;
}

.countdown-grid-home div + div {
  border-left: 1px solid rgba(255, 255, 255, .2);
}

.countdown-grid-home strong {
  font-size: 20px;
  font-weight: 600;
  line-height: 1;
}

.countdown-grid-home span {
  font-size: 10px;
  opacity: .78;
}

.checkin-card {
  display: flex;
  align-items: center;
  min-height: 76px;
  padding: 12px 13px;
  border: 1px solid #f8e8df;
  border-radius: 22px;
  background: linear-gradient(100deg, #fffaf2, #fff5f7);
  box-shadow: 0 10px 30px rgba(125, 80, 71, .07);
}

.checkin-icon {
  display: grid;
  width: 42px;
  height: 42px;
  flex: 0 0 auto;
  border-radius: 15px;
  color: #e76f94;
  background: #ffe6ef;
  place-items: center;
}

.checkin-copy {
  display: grid;
  min-width: 0;
  margin: 0 auto 0 11px;
  gap: 3px;
}

.checkin-copy strong {
  color: #51383f;
  font-size: 14px;
}

.checkin-copy span {
  color: #a0888f;
  font-size: 11px;
}

.checkin-card button {
  padding: 10px 14px;
  border: 0;
  border-radius: 15px;
  color: #fff;
  background: linear-gradient(135deg, #ef7b9e, #e45d8b);
  box-shadow: 0 7px 16px rgba(219, 77, 122, .2);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.checkin-card button.checked {
  color: #ad8793;
  background: #f3e6ea;
  box-shadow: none;
}

.status-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.status-card {
  position: relative;
  overflow: hidden;
  min-height: 124px;
  padding: 17px;
  border: 0;
  border-radius: 23px;
  text-align: left;
}

.anniversary-status {
  color: #67526f;
  background: linear-gradient(145deg, #f4efff, #eee8ff);
}

.fund-status {
  color: #705a3e;
  background: linear-gradient(145deg, #fff5dc, #fff0ca);
}

.status-kicker {
  display: block;
  margin-bottom: 8px;
  font-size: 10px;
  letter-spacing: .08em;
  opacity: .68;
}

.status-card strong {
  display: block;
  overflow: hidden;
  max-width: 84%;
  font-family: "Noto Serif SC", "Songti SC", serif;
  font-size: 15px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-detail {
  display: block;
  margin-top: 14px;
  font-size: 10px;
  opacity: .72;
}

.status-detail b {
  margin: 0 2px;
  color: #e3628c;
  font-size: 18px;
}

.status-art {
  position: absolute;
  right: 13px;
  bottom: 6px;
  color: rgba(255, 255, 255, .66);
  font-family: Georgia, serif;
  font-size: 48px;
  transform: rotate(-10deg);
}

.section-block {
  padding: 20px 17px;
  border: 1px solid rgba(225, 189, 199, .25);
  border-radius: 27px;
  background: rgba(255, 255, 255, .9);
  box-shadow: 0 13px 36px rgba(108, 69, 80, .075);
}

.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-heading span {
  display: block;
  margin-bottom: 3px;
  color: #d69aab;
  font-size: 8px;
  letter-spacing: .17em;
}

.section-heading h2 {
  margin: 0;
  color: #49343b;
  font-family: "Noto Serif SC", "Songti SC", serif;
  font-size: 18px;
  font-weight: 700;
}

.section-heading button {
  padding: 5px;
  border: 0;
  color: #b79ba3;
  background: transparent;
  font-size: 11px;
}

.section-heading .today-date {
  margin: 0 2px 2px 0;
  color: #ac969d;
  font-size: 10px;
  letter-spacing: 0;
}

.quick-grid {
  display: grid;
  row-gap: 20px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.quick-item {
  display: flex;
  align-items: center;
  min-width: 0;
  padding: 0;
  border: 0;
  color: #59464c;
  background: transparent;
  flex-direction: column;
}

.quick-icon {
  display: grid;
  width: 47px;
  height: 47px;
  margin-bottom: 8px;
  border-radius: 16px;
  place-items: center;
}

.quick-icon :deep(svg) {
  width: 21px;
  height: 21px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.65;
}

.quick-item strong {
  font-size: 11px;
  font-weight: 650;
  white-space: nowrap;
}

.quick-item small {
  margin-top: 2px;
  color: #b7a4aa;
  font-size: 8px;
  white-space: nowrap;
}

.memory-carousel {
  position: relative;
  display: block;
  overflow: hidden;
  width: 100%;
  height: 238px;
  padding: 0;
  border: 0;
  border-radius: 21px;
  background: #f5e9ec;
}

.memory-carousel > img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity .35s ease;
}

.memory-carousel::after {
  position: absolute;
  inset: 38% 0 0;
  content: "";
  background: linear-gradient(transparent, rgba(49, 27, 35, .58));
}

.memory-carousel-overlay {
  position: absolute;
  bottom: 18px;
  left: 17px;
  right: 17px;
  z-index: 2;
  color: #fff;
  text-align: left;
  text-shadow: 0 2px 12px rgba(0, 0, 0, .25);
}
.memory-carousel-overlay span { display:block; font-family:"Noto Serif SC", "Songti SC", serif; font-size:15px; line-height:1.55; }
.memory-carousel-overlay small { display:block; margin-top:5px; font-size:9px; opacity:.82; }
.memory-dots {
  position:absolute;
  right:15px;
  top:15px;
  z-index:2;
  display: flex;
  gap:4px;
}
.memory-dots i { width:5px; height:5px; border-radius:99px; background:rgba(255,255,255,.55); transition:.25s; }
.memory-dots i.active { width:15px; background:#fff; }

.today-feature {
  display: flex;
  align-items: center;
  padding: 14px;
  border: 1px solid #f2e8e7;
  border-radius: 19px;
  background: #fffaf8;
  cursor: pointer;
}

.feature-icon {
  display: grid;
  width: 42px;
  height: 42px;
  flex: 0 0 auto;
  border-radius: 14px;
  color: #c67582;
  background: #fceced;
  place-items: center;
  font-family: Georgia, serif;
  font-size: 22px;
}

.feature-copy {
  min-width: 0;
  margin-left: 11px;
}

.feature-copy > span {
  color: #b49da4;
  font-size: 9px;
}

.feature-copy strong {
  display: block;
  overflow: hidden;
  margin-top: 2px;
  color: #5c454c;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.feature-copy p {
  display: -webkit-box;
  overflow: hidden;
  margin: 4px 0 0;
  color: #a38f95;
  font-size: 9px;
  line-height: 1.5;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
}

.feature-arrow {
  margin-left: auto;
  padding-left: 9px;
  color: #c9b4ba;
  font-size: 24px;
}

.today-list {
  display: grid;
  margin-top: 8px;
}

.today-list button {
  display: flex;
  align-items: center;
  min-width: 0;
  padding: 13px 4px;
  border: 0;
  border-bottom: 1px solid #f5edef;
  text-align: left;
  background: transparent;
}

.today-list button:last-child {
  border-bottom: 0;
  padding-bottom: 3px;
}

.list-icon {
  display: grid;
  width: 32px;
  height: 32px;
  flex: 0 0 auto;
  border-radius: 11px;
  place-items: center;
  font-size: 14px;
}

.plan-icon {
  color: #5c9d7d;
  background: #ecf8f2;
}

.wish-icon {
  color: #8a6fca;
  background: #f2effb;
}

.mood-icon {
  color: #d3894b;
  background: #fff3e6;
}

.list-copy {
  display: grid;
  overflow: hidden;
  margin-left: 10px;
  gap: 2px;
}

.list-copy small {
  color: #b5a0a6;
  font-size: 8px;
}

.list-copy strong {
  overflow: hidden;
  color: #604a51;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.today-list em {
  margin-left: auto;
  padding-left: 10px;
  color: #c5b2b8;
  font-size: 9px;
  font-style: normal;
  white-space: nowrap;
}

.love-message {
  padding: 22px 24px;
  border-radius: 25px;
  text-align: center;
  background: linear-gradient(135deg, #fcedf1, #fff6ef);
}

.love-message > span {
  display: block;
  height: 21px;
  color: #d8899e;
  font-family: Georgia, serif;
  font-size: 34px;
  line-height: 1;
}

.love-message p {
  margin: 5px 0 9px;
  color: #795d65;
  font-family: "Noto Serif SC", "Songti SC", serif;
  font-size: 12px;
  line-height: 1.75;
}

.love-message small {
  color: #c49fa9;
  font-size: 7px;
  letter-spacing: .17em;
}

.bottom-nav {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 20;
  display: grid;
  max-width: 620px;
  height: 72px;
  margin: 0 auto;
  padding: 8px 12px 6px;
  border: 1px solid rgba(223, 190, 199, .44);
  border-bottom: 0;
  border-radius: 25px 25px 0 0;
  grid-template-columns: repeat(5, 1fr);
  background: rgba(255, 253, 253, .94);
  box-shadow: 0 -8px 30px rgba(91, 55, 65, .09);
  backdrop-filter: blur(16px);
}

.bottom-nav button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  color: #b5a4aa;
  background: transparent;
  flex-direction: column;
  gap: 4px;
}

.bottom-nav button > span {
  display: grid;
  width: 29px;
  height: 29px;
  border-radius: 11px;
  place-items: center;
}

.bottom-nav :deep(svg) {
  width: 19px;
  height: 19px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.6;
}

.bottom-nav em {
  font-size: 9px;
  font-style: normal;
}

.bottom-nav button.active {
  color: #e25f8a;
}

.bottom-nav button.active > span {
  background: #ffe9f0;
}

.home-toast {
  position: fixed;
  bottom: 91px;
  left: 50%;
  z-index: 40;
  max-width: 84vw;
  padding: 11px 18px;
  border-radius: 18px;
  color: #fff;
  background: rgba(68, 43, 51, .9);
  box-shadow: 0 8px 24px rgba(61, 35, 44, .2);
  font-size: 12px;
  transform: translateX(-50%);
}

@media (min-width: 700px) {
  .home-page {
    padding-top: 8px;
  }

  .love-hero {
    min-height: 280px;
  }

  .quick-icon {
    width: 52px;
    height: 52px;
  }
}

@media (max-width: 370px) {
  .home-main {
    padding-right: 12px;
    padding-left: 12px;
  }

  .love-hero {
    padding-right: 14px;
    padding-left: 14px;
  }

  .couple-row {
    gap: 12px;
  }

  .avatar-button {
    width: 60px;
    height: 60px;
  }

  .quick-item small {
    display: none;
  }

  .status-card {
    padding: 14px;
  }
}

/* 首页与主题中心联动 */
.home-page {
  background:
    linear-gradient(rgba(255,255,255,calc(1 - var(--theme-background-opacity))),rgba(255,255,255,calc(1 - var(--theme-background-opacity)))),
    var(--theme-background-image) center top/cover fixed no-repeat,
    linear-gradient(180deg,color-mix(in srgb,var(--theme-soft) 76%,white) 0,var(--theme-soft) 420px,#fffaf8 100%);
}
.love-hero {
  background:
    linear-gradient(135deg,rgba(255,255,255,.16),transparent 38%),
    linear-gradient(135deg,color-mix(in srgb,var(--theme-primary) 72%,white),var(--theme-primary) 50%,color-mix(in srgb,var(--theme-primary) 78%,#63384a));
  box-shadow: 0 18px 42px color-mix(in srgb,var(--theme-primary) 25%,transparent);
}
.checkin-card button:not(.checked),
.install-app-button {
  background: linear-gradient(135deg,var(--theme-primary),color-mix(in srgb,var(--theme-primary) 76%,#63384a)) !important;
}
.checkin-icon,.section-heading>div>span,.section-heading>button,.today-date,.couple-names i {
  color: var(--theme-primary) !important;
}
.bottom-nav button.active {
  color: var(--theme-primary) !important;
}
.bottom-nav button.active::before {
  background: var(--theme-soft) !important;
}
:global(html[data-card-style="soft"]) .status-card,
:global(html[data-card-style="soft"]) .section-block,
:global(html[data-card-style="soft"]) .checkin-card {
  border-radius: 14px !important;
}
:global(html[data-card-style="round"]) .status-card,
:global(html[data-card-style="round"]) .section-block,
:global(html[data-card-style="round"]) .checkin-card {
  border-radius: 24px !important;
}
:global(html[data-decorations="off"]) .hero-glow,
:global(html[data-decorations="off"]) .hero-doodle {
  display: none !important;
}

.love-hero .love-days,
.love-hero .love-days span,
.love-hero .love-days strong,
.love-hero .love-days em,
.love-hero .couple-names,
.love-hero .couple-names i,
.love-hero .hero-countdown,
.love-hero .hero-countdown strong,
.love-hero .hero-countdown span,
.love-hero .hero-countdown small {
  color: var(--hero-text-color, #fff) !important;
}
.hero-customize-button {
  position: absolute;
  z-index: 6;
  top: 12px;
  right: 13px;
  padding: 6px 9px;
  border: 1px solid rgba(255,255,255,.36);
  border-radius: 999px;
  background: rgba(65,34,45,.2);
  color: #fff;
  font-size: 8px;
  backdrop-filter: blur(9px);
}
.hero-customizer {
  position: fixed;
  z-index: 300;
  inset: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(48,31,37,.42);
  backdrop-filter: blur(5px);
}
.hero-customizer-sheet {
  width: min(100%, 680px);
  max-height: 88dvh;
  overflow-y: auto;
  padding: 8px 16px calc(20px + env(safe-area-inset-bottom));
  border-radius: 26px 26px 0 0;
  background: #fffafa;
  box-shadow: 0 -15px 50px rgba(67,38,47,.18);
}
.sheet-handle {
  width: 38px;
  height: 4px;
  margin: 1px auto 11px;
  border-radius: 99px;
  background: #ddcdd1;
}
.sheet-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.sheet-heading small {
  color: var(--theme-primary);
  font-size: 7px;
  letter-spacing: .12em;
}
.sheet-heading h2 {
  margin-top: 2px;
  color: #4e3940;
  font-size: 16px;
}
.sheet-heading>button {
  padding: 8px 12px;
  border: 0;
  border-radius: 11px;
  background: var(--theme-primary);
  color: #fff;
  font-size: 10px;
}
.hero-preset-list {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-top: 15px;
}
.hero-preset-list button {
  position: relative;
  height: 66px;
  overflow: hidden;
  border: 2px solid #fff;
  border-radius: 15px;
  box-shadow: 0 3px 12px rgba(73,44,53,.09);
  color: #fff;
}
.hero-preset-list button>span {
  display: block;
  font-size: 13px;
}
.hero-preset-list button small {
  display: block;
  margin-top: 4px;
  font-size: 7px;
}
.hero-setting-card,.hero-toggle-card {
  margin-top: 12px;
  padding: 14px;
  border: 1px solid #eee1e4;
  border-radius: 18px;
  background: #fff;
}
.color-row {
  display: grid;
  grid-template-columns: repeat(3,1fr);
  gap: 8px;
}
.color-row label {
  padding: 8px;
  border-radius: 12px;
  background: #faf5f5;
  color: #846970;
  font-size: 8px;
  text-align: center;
}
.color-row input {
  width: 100%;
  height: 28px;
  display: block;
  margin-top: 6px;
  padding: 1px;
  border: 0;
  border-radius: 8px;
  background: transparent;
}
.hero-image-upload {
  position: relative;
  width: 100%;
  height: 108px;
  display: grid;
  place-items: center;
  overflow: hidden;
  margin-top: 12px;
  border: 1px dashed color-mix(in srgb,var(--theme-primary) 38%,#ddd);
  border-radius: 15px;
  background: var(--theme-soft);
  color: var(--theme-primary);
}
.hero-image-upload img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.hero-image-upload>span {
  font-size: 22px;
}
.hero-image-upload>span small {
  display: block;
  margin-top: 4px;
  font-size: 8px;
}
.hero-image-upload>em {
  position: absolute;
  right: 8px;
  bottom: 8px;
  padding: 5px 7px;
  border-radius: 8px;
  background: rgba(47,31,36,.64);
  color: #fff;
  font-size: 7px;
  font-style: normal;
}
.remove-hero-image {
  width: 100%;
  margin-top: 6px;
  padding: 7px;
  border: 0;
  border-radius: 9px;
  background: #f8f0f2;
  color: #a26976;
  font-size: 8px;
}
.range-setting {
  display: block;
  margin-top: 12px;
}
.range-setting>span {
  display: flex;
  justify-content: space-between;
  color: #72565e;
  font-size: 9px;
}
.range-setting small {
  color: var(--theme-primary);
}
.range-setting input {
  width: 100%;
  margin-top: 7px;
  accent-color: var(--theme-primary);
}
.hero-toggle-card label {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
}
.hero-toggle-card label+label {
  border-top: 1px solid #f1e6e8;
}
.hero-toggle-card span b,.hero-toggle-card span small {
  display: block;
}
.hero-toggle-card b { color: #654a52; font-size: 10px; }
.hero-toggle-card small { margin-top: 3px; color: #aa9096; font-size: 7px; }
.hero-toggle-card input { position: absolute; opacity: 0; }
.hero-toggle-card i {
  width: 40px;
  height: 23px;
  padding: 3px;
  border-radius: 99px;
  background: #d9cdd0;
  transition: .2s;
}
.hero-toggle-card i::before {
  content: "";
  display: block;
  width: 17px;
  height: 17px;
  border-radius: 50%;
  background: #fff;
  transition: .2s;
}
.hero-toggle-card input:checked+i { background: var(--theme-primary); }
.hero-toggle-card input:checked+i::before { transform: translateX(17px); }
.reset-hero-card {
  width: 100%;
  margin-top: 11px;
  padding: 10px;
  border: 0;
  border-radius: 12px;
  background: #f4ecee;
  color: #936d77;
  font-size: 9px;
}
@media(max-width:390px) {
  .hero-preset-list { grid-template-columns: repeat(3,1fr); }
}
</style>
