<template>
  <div class="themes-page">
    <header class="theme-header">
      <button class="back" type="button" @click="saveAndExit">‹</button>
      <div><small>把爱装进喜欢的颜色里</small><h1>主题装扮</h1></div>
      <button class="done" type="button" @click="saveAndExit">完成</button>
    </header>

    <main>
      <section class="live-preview" :style="previewStyle">
        <div class="preview-cloud one"></div><div class="preview-cloud two"></div>
        <div class="preview-top"><span>9:41</span><span>♡ 恋爱日记</span><span>•••</span></div>
        <div class="preview-couple">
          <span>{{ myInitial }}</span><i>♥</i><span>{{ partnerInitial }}</span>
        </div>
        <strong>我们相爱的第 520 天</strong>
        <p>今天也有好好喜欢你</p>
        <div class="preview-cards"><i></i><i></i><i></i></div>
      </section>

      <section class="theme-section">
        <div class="section-title"><div><h2>精选主题</h2><p>点击即可实时预览</p></div><span>{{ selectedName }}</span></div>
        <div class="theme-grid">
          <button
            v-for="theme in themeOptions"
            :key="theme.id"
            type="button"
            :class="['theme-card', { active: config.id === theme.id }]"
            @click="chooseTheme(theme.id)"
          >
            <span class="palette" :style="{ background: `linear-gradient(145deg,${theme.colors[1]},${theme.colors[2]})` }">
              <i :style="{ background: theme.colors[0] }">♡</i>
              <b></b><em></em>
            </span>
            <strong>{{ theme.name }}</strong>
            <small>{{ theme.description }}</small>
            <mark v-if="config.id === theme.id">✓</mark>
          </button>
        </div>
      </section>

      <section class="custom-card">
        <div class="section-title"><div><h2>我的专属主题</h2><p>可上传你有权使用的壁纸或照片</p></div></div>
        <button class="wallpaper-upload" type="button" @click="fileInput?.click()">
          <img v-if="config.customBackground" :src="config.customBackground" alt="自定义主题背景">
          <span v-else>＋<small>选择背景图片</small></span>
          <em v-if="config.customBackground">更换图片</em>
        </button>
        <input ref="fileInput" type="file" accept="image/*" hidden @change="selectBackground">

        <label class="setting-row">
          <span><strong>主题色</strong><small>按钮、图标与强调色</small></span>
          <input v-model="config.customColor" type="color" @input="activateCustom">
        </label>
        <label class="setting-row range-row">
          <span><strong>壁纸显示程度</strong><small>文字区域会自动保留可读性</small></span>
          <input v-model.number="config.backgroundOpacity" type="range" min="0.08" max="0.5" step="0.02" @input="activateCustom">
        </label>
        <button v-if="config.customBackground" class="clear-wallpaper" type="button" @click="clearBackground">移除自定义壁纸</button>
      </section>

      <section class="detail-card">
        <div class="section-title"><div><h2>装扮细节</h2><p>每项选择都会立即应用并保存</p></div></div>
        <div class="detail-row">
          <span><strong>卡片形状</strong><small>控制首页和功能卡片的圆润程度</small></span>
          <div>
            <button :class="{ active: config.cardStyle === 'soft' }" @click="setDetail('cardStyle', 'soft')">轻圆</button>
            <button :class="{ active: config.cardStyle === 'round' }" @click="setDetail('cardStyle', 'round')">圆润</button>
          </div>
        </div>
        <div class="detail-row">
          <span><strong>聊天气泡</strong><small>消息气泡也会跟随主题颜色</small></span>
          <div>
            <button :class="{ active: config.chatStyle === 'minimal' }" @click="setDetail('chatStyle', 'minimal')">简约</button>
            <button :class="{ active: config.chatStyle === 'round' }" @click="setDetail('chatStyle', 'round')">可爱</button>
          </div>
        </div>
        <div class="detail-row">
          <span><strong>底部导航</strong><small>透明玻璃或纯色卡片</small></span>
          <div>
            <button :class="{ active: config.navStyle === 'solid' }" @click="setDetail('navStyle', 'solid')">纯色</button>
            <button :class="{ active: config.navStyle === 'glass' }" @click="setDetail('navStyle', 'glass')">玻璃</button>
          </div>
        </div>
        <label class="decoration-switch">
          <span><strong>主题小装饰</strong><small>显示云朵、圆点等氛围装饰</small></span>
          <input v-model="config.decorations" type="checkbox" @change="persistConfig('装饰效果已更新')">
          <i></i>
        </label>
        <button class="reset-theme" type="button" @click="resetTheme">恢复默认装扮</button>
      </section>

      <p class="copyright-note">角色联名图片可能受版权保护。你可以上传自己购买或获授权的玉桂狗、三丽鸥壁纸作为私人主题；应用不会默认打包未经授权的角色素材。</p>
    </main>

    <div :class="['toast', { show: toast }]">{{ toast }}</div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { applyTheme, getStoredTheme, saveTheme, themeOptions } from '@/theme'

const router = useRouter()
const authStore = useAuthStore()
const fileInput = ref(null)
const toast = ref('')
const config = reactive(getStoredTheme())
const myInitial = computed(() => (authStore.user?.nickname || '我').slice(0, 1))
const partnerInitial = computed(() => (authStore.user?.partner?.nickname || 'TA').slice(0, 1))
const selectedTheme = computed(() => themeOptions.find(item => item.id === config.id))
const selectedName = computed(() => selectedTheme.value?.name || '自定义')
const previewStyle = computed(() => {
  const theme = selectedTheme.value || {
    colors: [config.customColor, '#fff4f7', config.customColor]
  }
  return {
    '--preview-primary': theme.colors[0],
    '--preview-soft': theme.colors[1],
    '--preview-accent': theme.colors[2],
    backgroundImage: config.id === 'custom' && config.customBackground
      ? `linear-gradient(rgba(255,255,255,.55),rgba(255,255,255,.65)),url("${config.customBackground}")`
      : ''
  }
})

let toastTimer
const showToast = message => {
  toast.value = message
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = '' }, 2000)
}

const chooseTheme = id => {
  config.id = id
  persistConfig(`${themeOptions.find(item => item.id === id)?.name || '主题'}已应用`)
}
const activateCustom = () => {
  config.id = 'custom'
  persistConfig('自定义主题已应用')
}

const resizeBackground = file => new Promise((resolve, reject) => {
  const image = new Image()
  const url = URL.createObjectURL(file)
  image.onload = () => {
    const max = 1440
    const ratio = Math.min(1, max / Math.max(image.naturalWidth, image.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(image.naturalWidth * ratio)
    canvas.height = Math.round(image.naturalHeight * ratio)
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

const selectBackground = async event => {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  if (!file.type.startsWith('image/')) return showToast('请选择图片文件')
  if (file.size > 18 * 1024 * 1024) return showToast('图片不能超过 18MB')
  try {
    config.customBackground = await resizeBackground(file)
    activateCustom()
    showToast('壁纸已应用')
  } catch (error) {
    showToast(error.message || '壁纸处理失败')
  }
}

const clearBackground = () => {
  config.customBackground = ''
  persistConfig('自定义壁纸已移除')
}
const persistConfig = message => {
  try {
    saveTheme(config)
    if (message) showToast(message)
  } catch {
    showToast('壁纸数据过大，请更换一张图片')
  }
}
const setDetail = (key, value) => {
  config[key] = value
  persistConfig('装扮细节已保存')
}
const resetTheme = () => {
  Object.assign(config, {
    id: 'rose',
    customColor: '#d95f78',
    customBackground: '',
    backgroundOpacity: .16,
    cardStyle: 'round',
    chatStyle: 'round',
    navStyle: 'glass',
    decorations: true
  })
  persistConfig('已恢复默认装扮')
}
const saveAndExit = () => {
  try {
    saveTheme(config)
    router.back()
  } catch {
    showToast('图片过大，请更换一张图片')
  }
}
</script>

<style scoped>
.themes-page{min-height:100dvh;padding-bottom:40px;background:color-mix(in srgb,var(--theme-soft) 68%,#fff);color:#513d43}.theme-header{position:sticky;z-index:20;top:0;display:grid;grid-template-columns:44px 1fr 54px;align-items:center;gap:10px;padding:calc(9px + env(safe-area-inset-top)) 15px 9px;border-bottom:1px solid color-mix(in srgb,var(--theme-primary) 16%,white);background:color-mix(in srgb,var(--theme-soft) 48%,rgba(255,255,255,.94));backdrop-filter:blur(18px)}.theme-header .back{width:40px;height:40px;border:1px solid rgba(150,110,120,.17);border-radius:14px;background:#fff;color:#745862;font:30px/1 Georgia}.theme-header small{display:block;color:var(--theme-primary);font-size:8px;letter-spacing:.08em}.theme-header h1{margin-top:2px;font-size:17px}.theme-header .done{border:0;background:transparent;color:var(--theme-primary);font-size:12px;font-weight:700}main{width:min(100%,680px);margin:auto;padding:15px}
.live-preview{position:relative;overflow:hidden;min-height:247px;padding:15px 17px;border-radius:27px;background-color:var(--preview-soft);background-size:cover;background-position:center;box-shadow:0 18px 42px color-mix(in srgb,var(--preview-primary) 24%,transparent);text-align:center}.live-preview::after{content:"";position:absolute;inset:0;background:linear-gradient(145deg,rgba(255,255,255,.16),transparent 55%);pointer-events:none}.preview-top{position:relative;z-index:1;display:flex;justify-content:space-between;color:color-mix(in srgb,var(--preview-primary) 68%,#4d3940);font-size:9px}.preview-couple{position:relative;z-index:1;display:flex;align-items:center;justify-content:center;margin-top:34px}.preview-couple span{width:58px;height:58px;display:grid;place-items:center;border:3px solid #fff;border-radius:50%;background:linear-gradient(145deg,var(--preview-primary),var(--preview-accent));box-shadow:0 8px 18px rgba(78,48,57,.13);color:#fff;font:600 20px Georgia}.preview-couple i{margin:0 -4px;z-index:2;color:var(--preview-primary);font-size:20px;font-style:normal;text-shadow:0 2px 0 #fff}.live-preview>strong{position:relative;z-index:1;display:block;margin-top:13px;font-size:15px}.live-preview>p{position:relative;z-index:1;margin-top:4px;color:#967a81;font-size:9px}.preview-cards{position:relative;z-index:1;display:grid;grid-template-columns:1.2fr .8fr .8fr;gap:7px;margin-top:15px}.preview-cards i{height:28px;border:1px solid rgba(255,255,255,.8);border-radius:10px;background:rgba(255,255,255,.62);box-shadow:0 4px 10px rgba(72,44,51,.04)}.preview-cloud{position:absolute;border-radius:50%;background:rgba(255,255,255,.48)}.preview-cloud.one{width:120px;height:120px;right:-30px;top:-35px}.preview-cloud.two{width:75px;height:75px;left:-20px;bottom:-25px}
.theme-section,.custom-card,.detail-card{margin-top:15px;padding:18px 15px;border:1px solid color-mix(in srgb,var(--theme-primary) 14%,#eee);border-radius:23px;background:rgba(255,255,255,.88);box-shadow:0 9px 28px rgba(87,52,61,.05)}.section-title{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px}.section-title h2{font-size:14px}.section-title p{margin-top:3px;color:#a68b91;font-size:8px}.section-title>span{padding:5px 8px;border-radius:99px;background:var(--theme-soft);color:var(--theme-primary);font-size:8px}.theme-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.theme-card{position:relative;padding:7px 7px 11px;border:1px solid #eee1e3;border-radius:17px;background:#fff;text-align:left}.theme-card.active{border-color:var(--theme-primary);box-shadow:0 0 0 2px color-mix(in srgb,var(--theme-primary) 12%,transparent)}.palette{position:relative;height:78px;display:block;overflow:hidden;border-radius:12px}.palette i{position:absolute;left:50%;top:20px;width:37px;height:37px;display:grid;place-items:center;border:2px solid #fff;border-radius:50%;transform:translateX(-50%);color:#fff;font-style:normal}.palette b,.palette em{position:absolute;width:28px;height:16px;border-radius:50%;background:rgba(255,255,255,.7)}.palette b{left:10px;bottom:9px}.palette em{right:10px;top:11px}.theme-card>strong,.theme-card>small{display:block}.theme-card>strong{margin:8px 3px 0;font-size:11px}.theme-card>small{margin:3px;color:#ab9297;font-size:7px}.theme-card mark{position:absolute;right:12px;bottom:12px;width:18px;height:18px;display:grid;place-items:center;border-radius:50%;background:var(--theme-primary);color:#fff;font-size:8px}
.wallpaper-upload{position:relative;width:100%;height:128px;overflow:hidden;border:1px dashed color-mix(in srgb,var(--theme-primary) 46%,#ddd);border-radius:17px;background:var(--theme-soft);color:var(--theme-primary)}.wallpaper-upload img{width:100%;height:100%;object-fit:cover}.wallpaper-upload>span{font-size:28px}.wallpaper-upload>span small{display:block;margin-top:6px;font-size:9px}.wallpaper-upload>em{position:absolute;right:9px;bottom:9px;padding:5px 8px;border-radius:9px;background:rgba(50,35,40,.7);color:#fff;font-size:8px;font-style:normal}.setting-row{display:flex;align-items:center;justify-content:space-between;gap:15px;padding:14px 2px 2px}.setting-row span strong,.setting-row span small{display:block}.setting-row strong{font-size:11px}.setting-row small{margin-top:3px;color:#a88e94;font-size:8px}.setting-row input[type=color]{width:42px;height:33px;padding:2px;border:1px solid #eee;border-radius:10px;background:#fff}.range-row{display:block}.range-row input{width:100%;margin-top:10px;accent-color:var(--theme-primary)}.clear-wallpaper{width:100%;margin-top:12px;padding:9px;border:0;border-radius:11px;background:#f7f1f2;color:#9a6974;font-size:9px}.detail-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 0;border-bottom:1px solid #f1e7e9}.detail-row>span strong,.detail-row>span small,.decoration-switch span strong,.decoration-switch span small{display:block}.detail-row strong,.decoration-switch strong{font-size:10px}.detail-row small,.decoration-switch small{margin-top:3px;color:#aa9096;font-size:7px}.detail-row>div{flex:none;display:flex;padding:3px;border-radius:10px;background:#f7f1f2}.detail-row button{padding:6px 9px;border:0;border-radius:8px;background:transparent;color:#9b7d84;font-size:8px}.detail-row button.active{background:#fff;color:var(--theme-primary);box-shadow:0 2px 8px rgba(78,49,57,.08)}.decoration-switch{display:flex;align-items:center;justify-content:space-between;position:relative;padding:13px 1px}.decoration-switch input{position:absolute;opacity:0}.decoration-switch i{width:40px;height:23px;padding:3px;border-radius:99px;background:#dacdd0;transition:.2s}.decoration-switch i::before{content:"";display:block;width:17px;height:17px;border-radius:50%;background:#fff;transition:.2s}.decoration-switch input:checked+i{background:var(--theme-primary)}.decoration-switch input:checked+i::before{transform:translateX(17px)}.reset-theme{width:100%;margin-top:5px;padding:9px;border:0;border-radius:11px;background:var(--theme-soft);color:var(--theme-primary);font-size:9px}.copyright-note{margin:14px 6px;color:#aa9398;font-size:8px;line-height:1.6}.toast{position:fixed;left:50%;bottom:28px;z-index:50;padding:9px 15px;border-radius:12px;background:rgba(66,47,53,.92);color:#fff;font-size:10px;opacity:0;transform:translate(-50%,12px);transition:.22s;pointer-events:none}.toast.show{opacity:1;transform:translate(-50%,0)}
</style>
