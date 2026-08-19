<template>
  <div class="page-container">
    <div class="page-header">
      <button @click="goBack" class="btn-back">←</button>
      <h1 class="text-xl font-bold">位置</h1>
      <div class="w-10"></div>
    </div>

    <div class="page-content">
      <div v-if="!isPartnerBound" class="card mb-4">
        <div class="text-center py-8">
          <div class="text-4xl mb-4">💑</div>
          <div class="font-bold mb-2">还未绑定另一半</div>
          <div class="text-sm text-gray-500 mb-4">绑定后可以查看对方位置</div>
          <button @click="goToBindPartner" class="btn btn-primary">去绑定</button>
        </div>
      </div>

      <div v-else>
        <div class="card mb-4 map-section">
          <div class="map-container">
            <div class="map-grid"></div>
            <!-- 对方位置：默认居中显示，使用真实经纬度映射到地图 -->
            <div class="partner-marker" :style="partnerMarkerStyle">
              <div class="avatar-marker partner">💕</div>
              <div class="marker-pulse"></div>
              <span class="marker-label">{{ partnerNickname }}·{{ partnerStatus }}</span>
            </div>
            <!-- 我的位置：辅助显示，真实经纬度映射 -->
            <div class="my-marker" :style="myMarkerStyle">
              <div class="avatar-marker me">📍</div>
              <span class="marker-label">{{ myNickname }}·我在这里</span>
            </div>
            <div class="map-hint" v-if="!partnerLocation">等待 {{ partnerNickname }} 开启定位...</div>
          </div>

          <!-- 对方位置作为重点放在最上面 -->
          <div class="partner-info highlight" v-if="partnerLocation">
            <div class="avatar-wrapper">
              <div class="partner-avatar">{{ partnerNickname.charAt(0) }}</div>
              <span class="online-dot"></span>
            </div>
            <div class="partner-detail">
              <div class="partner-name">{{ partnerNickname }}的当前位置</div>
              <div class="partner-status">
                <span class="status-dot"></span>
                {{ partnerLocation.address || partnerLocation.name || '未知地点' }}
              </div>
            </div>
            <div class="update-time">{{ partnerStatus }}</div>
          </div>
          <div class="partner-info" v-else>
            <div class="avatar-wrapper">
              <div class="partner-avatar">{{ partnerNickname.charAt(0) }}</div>
            </div>
            <div class="partner-detail">
              <div class="partner-name">{{ partnerNickname }}还没有位置</div>
              <div class="partner-status">提醒 TA 打开本页开启定位吧</div>
            </div>
          </div>

          <div class="location-info">
            <div class="location-icon">📍</div>
            <div class="location-detail">
              <div class="location-name">{{ currentLocation.address || '正在获取...' }}</div>
              <div class="location-meta">{{ myNickname }} · 当前位置</div>
            </div>
            <button class="nav-btn" @click="openNavi" v-if="partnerLocation">导航去TA</button>
          </div>

          <div class="location-meta-info">
            <span class="meta-item">📍 进入页面自动定位</span>
            <span class="meta-divider">|</span>
            <span class="meta-item">⏱️ {{ partnerStatus }}</span>
          </div>
        </div>

        <!-- 持续共享：开启后后台持续上报（关闭App也同步，需原生插件支持） -->
        <div class="sharing-toggle">
          <div class="toggle-icon">🗺️</div>
          <div class="toggle-content">
            <div class="toggle-title">持续共享位置</div>
            <div class="toggle-desc">开启后无论是否停留页面都会持续上报，关闭App也同步（需安装App）</div>
          </div>
          <label class="switch">
            <input type="checkbox" v-model="continuousShare" @change="onContinuousShareChange" />
            <span class="slider"></span>
          </label>
        </div>

        <div class="section">
          <div class="section-header">
            <span class="section-icon">📖</span>
            <h2 class="section-title">历史记录</h2>
          </div>
          
          <div class="history-list">
            <div v-if="historyRecords.length === 0" class="empty-text">暂无足迹记录</div>
            <div v-for="(item, index) in historyRecords" :key="index" class="history-item">
              <div class="history-icon">{{ item.icon }}</div>
              <div class="history-info">
                <div class="history-name">
                  <span v-if="item.isPartner" class="owner-badge partner">TA</span>
                  <span v-else class="owner-badge me">我</span>
                  {{ item.name }}
                </div>
                <div class="history-time">{{ item.time }}</div>
              </div>
              <span v-if="item.current" class="current-badge">当前</span>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-header">
            <span class="section-icon">🏆</span>
            <h2 class="section-title">我的打卡</h2>
          </div>
          
          <div class="checkin-list">
            <div v-if="checkinRecords.length === 0" class="empty-text">暂无打卡记录</div>
            <div v-for="(item, index) in checkinRecords" :key="index" class="checkin-item">
              <div class="checkin-icon">📍</div>
              <div class="checkin-info">
                <div class="checkin-name">{{ item.name }}</div>
                <div class="checkin-time">{{ item.time }}</div>
              </div>
              <span class="checkin-points">+10</span>
            </div>
          </div>
        </div>

        <button 
          @click="getCurrentLocation" 
          :disabled="isGettingLocation"
          class="refresh-location-btn"
        >
          <span v-if="isGettingLocation" class="loading-spinner"></span>
          <span v-else>🔄</span>
          {{ isGettingLocation ? '定位中...' : '刷新定位' }}
        </button>

        <div class="safety-note">
            <span class="note-icon">🔒</span>
            <span class="note-text">位置信息仅双方可见，可随时关闭共享</span>
          </div>
      </div>
    </div>

    <div v-if="showMapSelector" class="overlay show" @click.self="showMapSelector = false">
      <div class="overlay-box p-6">
        <h3 class="text-lg font-bold mb-4">选择导航应用</h3>
        <div class="map-apps-grid">
          <div 
            v-for="app in mapApps" 
            :key="app.name"
            @click="openMapApp(app)"
            class="map-app-item"
          >
            <div class="app-icon">{{ app.icon }}</div>
            <div class="app-name">{{ app.name }}</div>
          </div>
        </div>
        <button @click="showMapSelector = false" class="btn btn-secondary btn-block mt-4">取消</button>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { LocationAPI } from '@/api'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const currentPath = computed(() => route.path)

const tabs = [
  { path: '/home', icon: '🏠', label: '首页' },
  { path: '/anniversary', icon: '♡', label: '纪念日' },
  { path: '/chat', icon: '💬', label: '聊天' },
  { path: '/location', icon: '📍', label: '位置' },
  { path: '/me', icon: '👤', label: '我的' }
]

const isPartnerBound = computed(() => authStore.user?.partner !== null)
const continuousShare = ref(false)        // 持续共享（后台/关闭App也上报）
const isGettingLocation = ref(false)
const currentLocation = ref({
  lat: 39.9902,
  lng: 116.4735,
  address: '正在定位...'
})
const showMapSelector = ref(false)
const partnerLocation = ref(null)
const historyRecords = ref([])
const checkinRecords = ref([])

// 把真实经纬度映射到地图百分比位置（以对方为基准居中）
function toMarkerStyle(targetLat, targetLng) {
  // 以对方当前位置为地图中心(50%,50%)；我的位置按相对经纬度偏移
  const refLat = partnerLocation.value?.latitude ?? partnerLocation.value?.lat ?? currentLocation.value.lat
  const refLng = partnerLocation.value?.longitude ?? partnerLocation.value?.lng ?? currentLocation.value.lng
  const dLat = (targetLat - refLat) * 120  // 每度约 120% 偏移
  const dLng = (targetLng - refLng) * 120
  const top = Math.max(8, Math.min(92, 50 - dLat))
  const left = Math.max(8, Math.min(92, 50 + dLng))
  return { top: top + '%', left: left + '%' }
}
const partnerMarkerStyle = computed(() => {
  if (partnerLocation.value?.latitude != null) return toMarkerStyle(partnerLocation.value.latitude, partnerLocation.value.longitude)
  if (partnerLocation.value?.lat != null) return toMarkerStyle(partnerLocation.value.lat, partnerLocation.value.lng)
  return { top: '50%', left: '50%' }
})
const myMarkerStyle = computed(() => {
  if (currentLocation.value?.lat != null) return toMarkerStyle(currentLocation.value.lat, currentLocation.value.lng)
  return { top: '45%', left: '45%' }
})

const mapApps = ref([
  { name: '高德地图', icon: '🗺️', scheme: 'amap', package: 'com.autonavi.minimap' },
  { name: '百度地图', icon: '📍', scheme: 'bdapp', package: 'com.baidu.BaiduMap' },
  { name: '腾讯地图', icon: '🌍', scheme: 'qqmap', package: 'com.tencent.map' },
  { name: 'Apple地图', icon: '🍎', scheme: 'maps', package: 'apple-maps' }
])

const toast = ref({
  show: false,
  message: ''
})

const showToast = (message) => {
  toast.value = { show: true, message }
  setTimeout(() => {
    toast.value.show = false
  }, 2000)
}

const goBack = () => router.back()

const navigate = (path) => {
  if (path !== currentPath.value) router.push(path)
}

const goToBindPartner = () => router.push('/me')

const partnerNickname = computed(() => authStore.user?.partner?.nickname || 'TA')
const myNickname = computed(() => authStore.user?.nickname || '我')

const partnerStatus = computed(() => {
  if (!partnerLocation.value) return '暂无位置'
  const updated = new Date(partnerLocation.value.created_at)
  const diff = Math.floor((Date.now() - updated.getTime()) / 60000)
  if (diff < 1) return '刚刚更新'
  if (diff < 60) return `${diff}分钟前`
  return `${Math.floor(diff / 60)}小时前`
})

const formatTime = (iso) => {
  const d = new Date(iso)
  return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const loadData = async () => {
  try {
    const history = await LocationAPI.getHistory()
    const allRecords = (history.data || []).slice(0, 50).map(r => ({
      icon: r.icon || '📍',
      name: r.name || r.address || '未知位置',
      time: `${formatTime(r.created_at)}${r.duration ? ' · 停留' + LocationAPI.formatDuration(r.duration) : ''}`,
      current: false,
      ownerId: r.owner_id,
      isPartner: r.owner_id !== (authStore.user?.id)
    }))
    // 历史记录只看对方的足迹，这个页面定位是给“看对方”用的
    historyRecords.value = allRecords.filter(r => r.isPartner)
    // 我的打卡只保留自己的记录
    checkinRecords.value = allRecords.filter(r => !r.isPartner).slice(0, 10)
    if (historyRecords.value[0]) {
      historyRecords.value[0].current = true
    }
    const partner = await LocationAPI.getPartner()
    if (partner) partnerLocation.value = partner
  } catch (e) {
    console.error('loadData error:', e)
  }
}

const reverseGeocode = (lat, lng) => {
  // 优先使用苹果自带的地理编码（iOS/ macOS 原生定位，无需网络密钥）
  if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.reverseGeocode) {
    window.webkit.messageHandlers.reverseGeocode.postMessage({ lat, lng })
    return
  }
  // Web 降级：使用高德/OpenStreetMap 逆地理解析
  fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=zh-CN`)
    .then(response => response.json())
    .then(data => {
      if (data && data.display_name) {
        const p = data.address || {}
        const parts = [p.city || p.town || p.county || p.state, p.road || p.suburb || p.neighbourhood, p.name]
          .filter(Boolean)
        currentLocation.value.address = parts.length ? parts.join(' · ') : data.display_name
      } else {
        currentLocation.value.address = '地址解析失败'
      }
    })
    .catch(() => {
      currentLocation.value.address = '地址解析失败'
    })
}

// 等待逆地理解析完成后再上报，避免数据库写入'定位中...'或'未知位置'
async function resolveAndReport(lat, lng) {
  return new Promise((resolve) => {
    let resolved = false
    const finish = (address) => {
      if (resolved) return
      resolved = true
      currentLocation.value.address = address || '地址解析失败'
      resolve(currentLocation.value.address)
    }
    // 优先使用苹果原生地理编码
    if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.reverseGeocode) {
      window.webkit.messageHandlers.reverseGeocode.postMessage({ lat, lng })
      const timer = setInterval(() => {
        if (currentLocation.value.address && currentLocation.value.address !== '正在定位...' && currentLocation.value.address !== '定位中...') {
          clearInterval(timer)
          finish(currentLocation.value.address)
        }
      }, 200)
      setTimeout(() => { clearInterval(timer); finish(currentLocation.value.address) }, 3000)
      return
    }
    // Web 降级
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=zh-CN`)
      .then(r => r.json())
      .then(data => {
        if (data && data.display_name) {
          const p = data.address || {}
          const parts = [p.city || p.town || p.county || p.state, p.road || p.suburb || p.neighbourhood, p.name].filter(Boolean)
          finish(parts.length ? parts.join(' · ') : data.display_name)
        } else {
          finish('地址解析失败')
        }
      })
      .catch(() => finish('地址解析失败'))
  }).then(address => {
    return LocationAPI.update({ latitude: lat, longitude: lng, address }).then(loadData)
  })
}

// iOS 原生回调：由 Capacitor 插件注入，将逆地理结果写回当前位置
window.onReverseGeocodeResult = (address) => {
  if (currentLocation.value) {
    currentLocation.value.address = address || '未知地址'
  }
}

// 原生位置事件回调：持续共享开启后，原生层会不断推送坐标，由前端上报
function onNativeLocationEvent(payload) {
  if (!payload || payload.latitude == null) return
  currentLocation.value = { lat: payload.latitude, lng: payload.longitude, address: '定位中...' }
  resolveAndReport(payload.latitude, payload.longitude)
    .then(() => showToast('位置已同步'))
    .catch(() => {})
}

// 定时拉取对方最新位置（网页版能做到的最大努力，替代“关App也上报”）
let partnerPollingTimer = null
const startPartnerPolling = () => {
  stopPartnerPolling()
  partnerPollingTimer = window.setInterval(() => {
    loadData().catch(() => {})
  }, 15000)
}
const stopPartnerPolling = () => {
  if (partnerPollingTimer) { clearInterval(partnerPollingTimer); partnerPollingTimer = null }
}

// 持续共享：开启后台持续上报
let nativeLocWatcher = null
let webLocTimer = null
const onContinuousShareChange = async () => {
  localStorage.setItem('loveDiary_continuousShare', continuousShare.value ? '1' : '0')
  if (continuousShare.value) {
    const native = getNativeLocation()
    if (native !== null && window.Capacitor?.Plugins?.Location?.start) {
      try {
        // 原生后台持续定位：关闭 App 也会继续上报
        await window.Capacitor.Plugins.Location.start({
          enableHighAccuracy: true,
          interval: 30000,
          distanceFilter: 50
        })
        nativeLocWatcher = true
        showToast('已开启持续位置共享')
      } catch (e) {
        showToast('后台定位开启失败，改为网页轮询')
        startWebShareLoop()
      }
    } else {
      showToast('网页版无法后台定位，已改为每60秒同步')
      startWebShareLoop()
    }
  } else {
    stopContinuousShare()
  }
}
function startWebShareLoop() {
  stopContinuousShare()
  reportLocation()
  webLocTimer = window.setInterval(reportLocation, 60000)
}
function stopContinuousShare() {
  if (webLocTimer) { clearInterval(webLocTimer); webLocTimer = null }
  if (nativeLocWatcher && window.Capacitor?.Plugins?.Location?.stop) {
    window.Capacitor.Plugins.Location.stop().catch(() => {})
    nativeLocWatcher = null
  }
}

// 进入页面即自动定位并显示当前地址名称，不再需要手动登录或点击
onMounted(async () => {
  await authStore.loadUser()
  loadData()
  reportLocation()
  // 无论是否开启持续共享，都定时刷新对方位置，保证能看到对方实时位置
  startPartnerPolling()
  // 恢复之前的持续共享偏好
  continuousShare.value = localStorage.getItem('loveDiary_continuousShare') === '1'
  // 监听原生持续定位事件
  if (window.Capacitor?.Plugins?.Location?.addListener) {
    window.Capacitor.Plugins.Location.addListener('location', onNativeLocationEvent)
  }
  if (continuousShare.value) onContinuousShareChange()
})

onBeforeUnmount(() => {
  stopPartnerPolling()
  stopContinuousShare()
})

// 封装原生定位插件（Capacitor）。不存在则降级为 Web geolocation
function getNativeLocation() {
  const cap = window.Capacitor
  if (cap && cap.isNativePlatform && cap.isNativePlatform() && cap.Plugins && cap.Plugins.Location) {
    return cap.Plugins.Location.getLocation().then(r => ({ latitude: r.latitude, longitude: r.longitude }))
  }
  return null
}

// 上报一次当前位置到后端（供对方查看）。优先使用原生定位，否则降级 Web
const reportLocation = async () => {
  const native = getNativeLocation()
  if (native !== null) {
    try {
      const pos = await native
      currentLocation.value = { lat: pos.latitude, lng: pos.longitude, address: '定位中...' }
      await resolveAndReport(pos.latitude, pos.longitude)
      showToast('定位成功并已同步')
    } catch (e) {
      showToast(e?.message || '位置同步失败')
    }
    return
  }
  if (!navigator.geolocation) {
    showToast('当前环境不支持GPS定位')
    return
  }
  isGettingLocation.value = true
  const finish = () => { isGettingLocation.value = false }
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords
      currentLocation.value = { lat: latitude, lng: longitude, address: '定位中...' }
      try {
        await resolveAndReport(latitude, longitude)
        showToast('定位成功并已同步')
      } catch (e) {
        showToast(e?.message || '位置同步失败')
      }
      finish()
    },
    (error) => {
      finish()
      switch (error.code) {
        case error.PERMISSION_DENIED: showToast('请在系统设置中开启位置权限'); break
        case error.POSITION_UNAVAILABLE: showToast('无法获取当前位置'); break
        case error.TIMEOUT: showToast('定位超时'); break
        default: showToast('定位失败')
      }
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  )
}

const openMapApp = (app) => {
  const target = partnerLocation.value || currentLocation.value
  const lat = target?.latitude ?? target?.lat
  const lng = target?.longitude ?? target?.lng
  const address = target?.address || target?.name || '目标位置'
  if (lat == null || lng == null) return showToast('暂无可用位置')
  let url = ''
  switch (app.scheme) {
    case 'amap':
      url = `amapuri://route/plan/?dlat=${lat}&dlng=${lng}&dname=${encodeURIComponent(address)}&dev=0`
      break
    case 'bdapp':
      url = `baidumap://map/direction?destination=latlng:${lat},${lng}|name:${encodeURIComponent(address)}&mode=driving`
      break
    case 'qqmap':
      url = `qqmap://map/routeplan?type=drive&to=${encodeURIComponent(address)}&tocoord=${lat},${lng}&referer=love-diary`
      break
    case 'maps':
      url = `maps://maps.google.com/maps?daddr=${lat},${lng}&dirflg=d`
      break
  }
  window.location.href = url
  showMapSelector.value = false
  setTimeout(() => {
    if (navigator.userAgent.match(/iPhone|iPad|iPod/i)) {
      window.location.href = 'https://apps.apple.com/cn/app/%E9%AB%98%E5%BE%B7%E5%9C%B0%E5%9B%BE/id461703208'
    } else {
      window.location.href = `https://a.app.qq.com/o/simple.jsp?pkgname=${app.package}`
    }
  }, 500)
}

const openNavi = () => {
  if (!partnerLocation.value) return showToast('暂无对方位置')
  showMapSelector.value = true
}
</script>

<style scoped>
.map-section {
  padding: 0;
  overflow: hidden;
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(255, 107, 157, 0.15);
}

.map-container {
  position: relative;
  height: 220px;
  background: linear-gradient(180deg, #ff6b9d 0%, #ff8fc4 50%, #ffaec0 100%);
  border-radius: 24px 24px 0 0;
}

.map-grid {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px);
  background-size: 40px 40px;
}

.heart-decoration {
  position: absolute;
  top: 20px;
  right: 20px;
  font-size: 24px;
  animation: float-heart 3s ease-in-out infinite;
}

@keyframes float-heart {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-10px) scale(1.1); }
}

.avatar-marker {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  position: relative;
  z-index: 2;
  border: 4px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.avatar-marker.partner {
  background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%);
}

.avatar-marker.me {
  background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
}

.avatar-marker.shared {
  background: rgba(255, 255, 255, 0.9);
  font-size: 24px;
}

.partner-marker, .my-marker, .shared-marker {
  position: absolute;
  transform: translate(-50%, -50%);
}

.marker-pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.4; }
  50% { transform: translate(-50%, -50%) scale(1.4); opacity: 0; }
}

.partner-stats {
  display: flex;
  justify-content: center;
  gap: 40px;
  padding: 16px;
  background: white;
  border-bottom: 1px solid #f5f5f5;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #333;
}

.stat-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #52c41a;
  box-shadow: 0 0 8px rgba(82, 196, 26, 0.4);
}

.stat-dot.distance {
  background: #1890ff;
  box-shadow: 0 0 8px rgba(24, 144, 255, 0.4);
}

.stat-dot.checkin {
  background: #faad14;
  box-shadow: 0 0 8px rgba(250, 173, 20, 0.4);
}

.partner-info {
  display: flex;
  align-items: center;
  padding: 20px;
  background: white;
}

.avatar-wrapper {
  position: relative;
  margin-right: 16px;
}

.partner-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  box-shadow: 0 4px 12px rgba(253, 203, 110, 0.4);
}

.online-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #52c41a;
  border: 3px solid white;
  box-shadow: 0 0 8px rgba(82, 196, 26, 0.5);
}

.partner-detail {
  flex: 1;
}

.partner-name {
  font-weight: 600;
  font-size: 17px;
  margin-bottom: 4px;
  color: #2d2d2d;
}

.partner-status {
  font-size: 14px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #52c41a;
  box-shadow: 0 0 6px rgba(82, 196, 26, 0.5);
}

.update-time {
  font-size: 13px;
  color: #999;
}

.location-info {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #fff9f0 0%, #fff5e6 100%);
  border-top: 1px solid #ffe8cc;
}

.location-icon {
  font-size: 22px;
  margin-right: 14px;
}

.location-detail {
  flex: 1;
}

.location-name {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 3px;
  color: #2d2d2d;
}

.location-meta {
  font-size: 13px;
  color: #888;
}

.nav-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #ff6b9d 0%, #c44569 100%);
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 14px rgba(255, 107, 157, 0.4);
  transition: all 0.3s ease;
}

.nav-btn:active {
  transform: scale(0.96);
}

.location-meta-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 14px;
  background: white;
  border-top: 1px solid #f5f5f5;
  font-size: 13px;
  color: #888;
}

.meta-divider {
  color: #e0e0e0;
}

.sharing-toggle {
  display: flex;
  align-items: center;
  padding: 18px;
  background: white;
  border-radius: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.toggle-icon {
  font-size: 28px;
  margin-right: 14px;
}

.toggle-content {
  flex: 1;
}

.toggle-title {
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 2px;
  color: #2d2d2d;
}

.toggle-desc {
  font-size: 13px;
  color: #888;
}

.section {
  background: white;
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
}

.section-icon {
  font-size: 22px;
}

.section-title {
  font-size: 17px;
  font-weight: 600;
  color: #2d2d2d;
}

.history-list, .checkin-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.history-item, .checkin-item {
  display: flex;
  align-items: center;
  padding: 14px;
  background: linear-gradient(135deg, #fffaf5 0%, #fff8f0 100%);
  border-radius: 16px;
  transition: all 0.3s ease;
}

.history-item:hover, .checkin-item:hover {
  background: linear-gradient(135deg, #fff5ee 0%, #fff0e6 100%);
}

.history-icon, .checkin-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  margin-right: 14px;
}

.history-icon {
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
  box-shadow: 0 2px 8px rgba(253, 203, 110, 0.3);
}

.checkin-icon {
  background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);
  box-shadow: 0 2px 8px rgba(186, 156, 212, 0.3);
}

.history-info, .checkin-info {
  flex: 1;
}

.history-name, .checkin-name {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 4px;
  color: #2d2d2d;
}

.history-time, .checkin-time {
  font-size: 13px;
  color: #888;
}

.current-badge {
  padding: 6px 14px;
  background: linear-gradient(135deg, #ff6b9d 0%, #c44569 100%);
  color: white;
  border-radius: 14px;
  font-size: 12px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(255, 107, 157, 0.3);
}

.owner-badge {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 8px;
  font-size: 10px;
  margin-right: 6px;
  color: #fff;
}

.owner-badge.me {
  background: linear-gradient(135deg, #ff6b9d 0%, #ff8fab 100%);
}

.owner-badge.partner {
  background: linear-gradient(135deg, #74b9ff 0%, #a29bfe 100%);
}

.empty-text {
  text-align: center;
  padding: 28px 0;
  color: #999;
  font-size: 14px;
}

.checkin-points {
  color: #ff6b9d;
  font-weight: 600;
  font-size: 15px;
}

.safety-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 18px;
  background: linear-gradient(135deg, #fff0f6 0%, #ffe4ec 100%);
  border-radius: 16px;
  margin-bottom: 80px;
  border: 1px solid #ffcce6;
}

.note-icon {
  font-size: 18px;
}

.note-text {
  font-size: 14px;
  color: #d32f2f;
  font-weight: 500;
}

.refresh-location-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 16px;
  background: white;
  border: 1px solid #ffd6e6;
  border-radius: 18px;
  font-size: 15px;
  color: #ff6b9d;
  font-weight: 500;
  margin-bottom: 16px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(255, 107, 157, 0.1);
}

.refresh-location-btn:hover:not(:disabled) {
  background: #fff5f8;
  border-color: #ff99bb;
  transform: translateY(-1px);
}

.refresh-location-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid #ffe4ec;
  border-top: 2px solid #ff6b9d;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.map-apps-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.map-app-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 8px;
  background: #fafafa;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.map-app-item:hover {
  background: #f0f0f0;
  transform: translateY(-2px);
}

.app-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.app-name {
  font-size: 12px;
  color: #666;
}
</style>
