<template>
  <div class="guardian-page">
    <header class="guardian-header">
      <button class="back-button" type="button" @click="router.back()">‹</button>
      <div class="partner-title">
        <span class="mini-avatar">
          <img v-if="partner?.avatar" :src="partner.avatar" alt="">
          <b v-else>{{ partnerInitial }}</b>
        </span>
        <div><h1>{{ partner?.nickname || '守护动态' }}</h1><p>{{ statusText }}</p></div>
      </div>
      <button class="refresh-button" type="button" :disabled="loading" @click="refreshAll">↻</button>
    </header>

    <main>
      <section v-if="!partner" class="empty-partner">
        <span>♡</span>
        <h2>先绑定另一半</h2>
        <p>绑定后，两个人分别开启守护动态并完成手机系统授权，才会开始同步。</p>
        <button type="button" @click="router.push('/me')">去绑定</button>
      </section>

      <template v-else>
        <section class="consent-card">
          <div class="consent-heading">
            <span>🛡</span>
            <div><h2>双方可见的守护授权</h2><p>只分享使用概况，不读取聊天内容、密码和屏幕画面</p></div>
          </div>
          <div class="consent-steps">
            <div :class="{ done: mySharing }"><i>{{ mySharing ? '✓' : '1' }}</i><span>我同意共享<small>{{ mySharing ? '已开启' : '等待开启' }}</small></span></div>
            <div :class="{ done: partnerSharing }"><i>{{ partnerSharing ? '✓' : '2' }}</i><span>TA 同意共享<small>{{ partnerSharing ? '已开启' : '等待对方' }}</small></span></div>
            <div :class="{ done: usageGranted }"><i>{{ usageGranted ? '✓' : '3' }}</i><span>系统使用权限<small>{{ usageGranted ? '已授权' : '需要在手机开启' }}</small></span></div>
          </div>
          <div class="consent-actions">
            <button
              :class="mySharing ? 'secondary' : 'primary'"
              type="button"
              :disabled="permissionSaving"
              @click="toggleMySharing"
            >{{ mySharing ? '关闭我的共享' : '我同意并开启' }}</button>
            <button v-if="mySharing && !usageGranted" class="primary" type="button" @click="openSystemPermission">去系统授权</button>
            <button v-else-if="canSync" class="primary" type="button" :disabled="syncing" @click="syncMyActivity">{{ syncing ? '同步中…' : '立即同步我的动态' }}</button>
          </div>
        </section>

        <section class="summary-card">
          <div><small>TA 今日使用</small><strong>{{ formatDuration(displayActivity.totalDurationMs || 0) }}</strong></div>
          <div><small>使用过 App</small><strong>{{ displayActivity.apps?.length || 0 }}<em> 个</em></strong></div>
          <div><small>最近同步</small><strong class="time-value">{{ relativeTime(displayActivity.collectedAt) }}</strong></div>
        </section>

        <section class="timeline-card">
          <div class="timeline-heading">
            <div><h2>今天的手机动态</h2><p>{{ isPreview ? '网页端界面预览，数据并非真实记录' : '按时间展示对方主动共享的使用概况' }}</p></div>
            <span>{{ displayEvents.length }} 条</span>
          </div>

          <div v-if="!effectiveSharing" class="locked-state">
            <i>🔒</i>
            <strong>等待双方开启</strong>
            <p>只有你和 TA 都打开“守护动态”后，任何数据才会同步。</p>
          </div>
          <div v-else-if="!displayEvents.length" class="locked-state">
            <i>☁</i>
            <strong>还没有守护动态</strong>
            <p>请让对方在 Android App 中授予使用情况权限，并点击同步。</p>
          </div>
          <div v-else class="timeline">
            <article v-for="(event, index) in displayEvents" :key="`${event.type}-${event.timestamp}-${index}`">
              <time>{{ formatClock(event.timestamp) }}</time>
              <span :class="['event-icon', event.type]">
                <img v-if="event.type === 'app' && event.icon" :src="event.icon" alt="">
                <template v-else>{{ eventIcon(event) }}</template>
              </span>
              <div>
                <p v-if="event.type === 'app'">TA 使用了 <strong>{{ event.appName }}</strong></p>
                <p v-else-if="event.type === 'screen_on'">TA 打开了手机</p>
                <p v-else>TA 关闭了手机</p>
                <small v-if="event.type === 'app'">今日累计 {{ formatDuration(event.durationMs) }}</small>
                <small v-else>{{ event.type === 'screen_on' ? '屏幕开始使用' : '本次使用结束' }}</small>
              </div>
              <b v-if="event.type === 'app'">›</b>
            </article>
          </div>
        </section>

        <section class="privacy-card">
          <h3>你们始终拥有控制权</h3>
          <p>任意一方关闭共享后，另一方会立即无法读取守护动态。Android 只提供 App 使用时长和屏幕开关概况；这里不会读取微信聊天、相册内容、输入内容或通话录音。</p>
          <button type="button" @click="router.push('/settings')">管理双方共享范围</button>
        </section>
      </template>
    </main>

    <div :class="['toast', { show: toast }]">{{ toast }}</div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { SharingAPI } from '@/api'
import {
  getTodayUsage,
  hasUsageAccess,
  isDeviceActivityAvailable,
  openUsageAccessSettings
} from '@/native/deviceActivity'

const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)
const syncing = ref(false)
const permissionSaving = ref(false)
const mySharing = ref(false)
const partnerSharing = ref(false)
const effectiveSharing = ref(false)
const usageGranted = ref(false)
const partnerActivity = reactive({ apps: [], screenEvents: [], collectedAt: 0, totalDurationMs: 0 })
const toast = ref('')
let toastTimer
let refreshTimer

const partner = computed(() => authStore.user?.partner || null)
const partnerInitial = computed(() => (partner.value?.nickname || 'TA').slice(0, 1))
const canSync = computed(() => effectiveSharing.value && usageGranted.value && isDeviceActivityAvailable())
const statusText = computed(() => {
  if (!effectiveSharing.value) return '等待双方开启守护授权'
  if (!partnerActivity.collectedAt) return '已授权 · 等待第一次同步'
  return `最近同步于 ${formatClock(partnerActivity.collectedAt)}`
})

const previewActivity = {
  totalDurationMs: 2 * 60 * 60 * 1000 + 37 * 60 * 1000,
  collectedAt: Date.now() - 4 * 60 * 1000,
  apps: [
    { type: 'app', appName: '微信', durationMs: 24 * 60 * 1000, timestamp: Date.now() - 12 * 60 * 1000 },
    { type: 'app', appName: '音乐', durationMs: 65 * 60 * 1000, timestamp: Date.now() - 48 * 60 * 1000 },
    { type: 'app', appName: '短视频', durationMs: 32 * 60 * 1000, timestamp: Date.now() - 75 * 60 * 1000 }
  ],
  screenEvents: [
    { type: 'screen_on', timestamp: Date.now() - 8 * 60 * 1000 },
    { type: 'screen_off', timestamp: Date.now() - 82 * 60 * 1000 }
  ]
}
const isPreview = computed(() => !isDeviceActivityAvailable() && effectiveSharing.value && !partnerActivity.collectedAt)
const displayActivity = computed(() => isPreview.value ? previewActivity : partnerActivity)
const displayEvents = computed(() => [
  ...(displayActivity.value.apps || []),
  ...(displayActivity.value.screenEvents || [])
].sort((a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0)).slice(0, 40))

const showToast = message => {
  toast.value = message
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = '' }, 2200)
}
const applyPreferences = response => {
  const uid = String(authStore.user?.id || '')
  const partnerId = String(partner.value?.id || '')
  const payload = response?.preferences || response || {}
  // 新结构按用户 ID 分区，也兼容旧平铺结构
  const myPrefs = (uid && payload[uid] && typeof payload[uid] === 'object') ? payload[uid] : payload
  const partnerPrefs = (partnerId && payload[partnerId] && typeof payload[partnerId] === 'object') ? payload[partnerId] : {}
  const myVal = Boolean(myPrefs.device_activity || myPrefs.deviceActivity)
  const partnerVal = Boolean(partnerPrefs.device_activity || partnerPrefs.deviceActivity)
  mySharing.value = myVal
  partnerSharing.value = partnerVal
  effectiveSharing.value = myVal && partnerVal
}
const assignPartnerActivity = payload => {
  const data = payload?.[String(partner.value?.id)] || {}
  partnerActivity.apps = Array.isArray(data.apps) ? data.apps : []
  partnerActivity.screenEvents = Array.isArray(data.screenEvents) ? data.screenEvents : []
  partnerActivity.collectedAt = Number(data.collectedAt || 0)
  partnerActivity.totalDurationMs = Number(data.totalDurationMs || 0)
}
const loadSharedActivity = async () => {
  if (!effectiveSharing.value) {
    assignPartnerActivity(null)
    return
  }
  const response = await SharingAPI.getState('device_activity')
  assignPartnerActivity(response.payload)
}
const checkNativePermission = async () => {
  usageGranted.value = await hasUsageAccess().catch(() => false)
}
const refreshAll = async () => {
  if (loading.value) return
  loading.value = true
  try {
    await authStore.refreshProfile()
    applyPreferences(await SharingAPI.getPreferences())
    await checkNativePermission()
    await loadSharedActivity()
    if (canSync.value) await syncMyActivity()
  } catch (error) {
    showToast(error.message || '守护动态加载失败')
  } finally {
    loading.value = false
  }
}
const toggleMySharing = async () => {
  permissionSaving.value = true
  const previous = mySharing.value
  const enabled = !previous
  try {
    await SharingAPI.updatePreferences({ device_activity: enabled, deviceActivity: enabled })
    mySharing.value = enabled
    await refreshAll()
    showToast(enabled ? '已开启，等待对方确认' : '已关闭守护动态共享')
  } catch (error) {
    mySharing.value = previous
    showToast(error?.message || '设置保存失败')
  } finally {
    permissionSaving.value = false
  }
}
const openSystemPermission = async () => {
  try {
    await openUsageAccessSettings()
    showToast('请找到“恋爱日记”并允许使用情况访问')
  } catch (error) {
    showToast(error.message)
  }
}
const syncMyActivity = async () => {
  if (!canSync.value || syncing.value) return
  syncing.value = true
  try {
    const usage = await getTodayUsage()
    const current = await SharingAPI.getState('device_activity')
    const payload = current.payload && typeof current.payload === 'object' ? current.payload : {}
    payload[String(authStore.user.id)] = {
      ...usage,
      nickname: authStore.user.nickname,
      avatar: authStore.user.avatar || ''
    }
    const saved = await SharingAPI.putState('device_activity', payload)
    assignPartnerActivity(saved.payload)
    showToast('我的动态已安全同步')
  } catch (error) {
    if (String(error.message).includes('USAGE_ACCESS_REQUIRED')) usageGranted.value = false
    showToast(error.message || '同步失败')
  } finally {
    syncing.value = false
  }
}
const formatDuration = milliseconds => {
  const minutes = Math.max(0, Math.round(Number(milliseconds || 0) / 60000))
  if (minutes < 1) return '少于 1 分钟'
  if (minutes < 60) return `${minutes} 分钟`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours} 小时 ${rest} 分` : `${hours} 小时`
}
const formatClock = timestamp => timestamp
  ? new Date(Number(timestamp)).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
  : '--:--'
const relativeTime = timestamp => {
  if (!timestamp) return '暂无'
  const minutes = Math.max(0, Math.floor((Date.now() - Number(timestamp)) / 60000))
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分前`
  return formatClock(timestamp)
}
const eventIcon = event => {
  if (event.type === 'screen_on') return '▣'
  if (event.type === 'screen_off') return '▱'
  return (event.appName || 'A').slice(0, 1)
}
const onVisibility = () => {
  if (document.visibilityState === 'visible') refreshAll()
}

onMounted(async () => {
  await refreshAll()
  window.addEventListener('focus', refreshAll)
  document.addEventListener('visibilitychange', onVisibility)
  refreshTimer = window.setInterval(refreshAll, 60000)
})
onBeforeUnmount(() => {
  clearInterval(refreshTimer)
  window.removeEventListener('focus', refreshAll)
  document.removeEventListener('visibilitychange', onVisibility)
})
</script>

<style scoped>
.guardian-page{min-height:100dvh;padding-bottom:35px;background:color-mix(in srgb,var(--theme-soft) 62%,#fff);color:#4f3b42}.guardian-header{position:sticky;z-index:20;top:0;display:grid;grid-template-columns:42px 1fr 42px;align-items:center;gap:9px;padding:calc(9px + env(safe-area-inset-top)) 14px 9px;border-bottom:1px solid color-mix(in srgb,var(--theme-primary) 15%,white);background:rgba(255,255,255,.9);backdrop-filter:blur(18px)}.back-button,.refresh-button{width:38px;height:38px;border:1px solid #eadde0;border-radius:13px;background:#fff;color:#7e6068}.back-button{font:29px/1 Georgia}.refresh-button{font-size:18px}.partner-title{min-width:0;display:flex;align-items:center;justify-content:center;gap:8px}.mini-avatar{width:36px;height:36px;display:grid;place-items:center;overflow:hidden;border-radius:50%;background:linear-gradient(145deg,var(--theme-primary),var(--theme-accent));color:#fff}.mini-avatar img{width:100%;height:100%;object-fit:cover}.mini-avatar b{font:600 12px Georgia}.partner-title h1{font-size:13px}.partner-title p{margin-top:2px;color:#a2868d;font-size:7px}main{width:min(100%,680px);margin:auto;padding:14px}
.empty-partner{margin-top:18vh;padding:38px 24px;text-align:center}.empty-partner>span{width:70px;height:70px;display:grid;place-items:center;margin:auto;border-radius:24px;background:var(--theme-soft);color:var(--theme-primary);font-size:34px}.empty-partner h2{margin-top:17px;font-size:17px}.empty-partner p{max-width:320px;margin:8px auto;color:#9f858b;font-size:10px;line-height:1.7}.empty-partner button,.privacy-card button{margin-top:17px;padding:9px 17px;border:0;border-radius:12px;background:var(--theme-primary);color:#fff;font-size:10px}
.consent-card,.timeline-card,.privacy-card{padding:17px;border:1px solid color-mix(in srgb,var(--theme-primary) 14%,#eee);border-radius:22px;background:rgba(255,255,255,.92);box-shadow:0 9px 27px rgba(86,51,61,.055)}.consent-heading{display:flex;gap:10px}.consent-heading>span{width:38px;height:38px;display:grid;place-items:center;border-radius:13px;background:var(--theme-soft);font-size:17px}.consent-heading h2{font-size:13px}.consent-heading p{margin-top:3px;color:#a38990;font-size:8px;line-height:1.5}.consent-steps{position:relative;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:17px}.consent-steps::before{content:"";position:absolute;top:14px;left:16%;right:16%;height:1px;background:#eadfe1}.consent-steps>div{position:relative;text-align:center}.consent-steps i{position:relative;width:29px;height:29px;display:grid;place-items:center;margin:auto;border:1px solid #e7dadd;border-radius:50%;background:#fff;color:#aa8d94;font-size:9px;font-style:normal}.consent-steps .done i{border-color:var(--theme-primary);background:var(--theme-primary);color:#fff}.consent-steps span,.consent-steps small{display:block}.consent-steps span{margin-top:6px;font-size:8px}.consent-steps small{margin-top:2px;color:#aa9197;font-size:7px}.consent-actions{display:flex;gap:8px;margin-top:16px}.consent-actions button{flex:1;min-height:39px;padding:8px;border-radius:12px;font-size:9px}.consent-actions .primary{border:0;background:var(--theme-primary);color:#fff}.consent-actions .secondary{border:1px solid #eadcdf;background:#fff;color:#96727b}
.summary-card{display:grid;grid-template-columns:1.2fr .85fr 1fr;gap:1px;overflow:hidden;margin-top:12px;border:1px solid color-mix(in srgb,var(--theme-primary) 14%,#eee);border-radius:19px;background:#efe5e7}.summary-card>div{min-width:0;padding:14px 10px;background:rgba(255,255,255,.94);text-align:center}.summary-card small,.summary-card strong{display:block}.summary-card small{color:#aa9096;font-size:7px}.summary-card strong{margin-top:6px;color:var(--theme-primary);font-size:13px}.summary-card strong em{font-size:8px;font-style:normal}.summary-card .time-value{overflow:hidden;font-size:11px;text-overflow:ellipsis;white-space:nowrap}
.timeline-card{margin-top:12px}.timeline-heading{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:12px;border-bottom:1px solid #f0e5e7}.timeline-heading h2{font-size:13px}.timeline-heading p{margin-top:3px;color:#a88e94;font-size:8px}.timeline-heading>span{padding:4px 7px;border-radius:99px;background:var(--theme-soft);color:var(--theme-primary);font-size:7px}.locked-state{padding:42px 20px;text-align:center}.locked-state i{font-size:26px;font-style:normal}.locked-state strong{display:block;margin-top:10px;font-size:12px}.locked-state p{max-width:280px;margin:5px auto;color:#a68d93;font-size:8px;line-height:1.6}.timeline article{display:grid;grid-template-columns:38px 34px 1fr 10px;align-items:center;gap:8px;padding:12px 0;border-bottom:1px solid #f2e8e9}.timeline article:last-child{border:0}.timeline time{color:#aa9197;font-size:8px}.event-icon{width:31px;height:31px;display:grid;place-items:center;overflow:hidden;border-radius:10px;background:linear-gradient(145deg,var(--theme-primary),color-mix(in srgb,var(--theme-primary) 66%,#765a8c));color:#fff;font-size:10px}.event-icon img{width:100%;height:100%;object-fit:cover}.event-icon.screen_on,.event-icon.screen_off{background:#fff0f1;color:#e16c79;font-size:16px}.timeline p{font-size:10px}.timeline p strong{color:#149edd}.timeline small{display:block;margin-top:3px;color:#a99096;font-size:7px}.timeline article>b{color:#bd9da4;font:17px Georgia}.privacy-card{margin-top:12px;background:linear-gradient(145deg,#fff,color-mix(in srgb,var(--theme-soft) 70%,white))}.privacy-card h3{font-size:12px}.privacy-card p{margin-top:6px;color:#937980;font-size:8px;line-height:1.7}.privacy-card button{margin-top:11px;background:transparent;border:1px solid color-mix(in srgb,var(--theme-primary) 30%,#ddd);color:var(--theme-primary)}
.toast{position:fixed;z-index:60;left:50%;bottom:27px;padding:9px 15px;border-radius:12px;background:rgba(65,47,52,.92);color:#fff;font-size:10px;opacity:0;transform:translate(-50%,12px);transition:.22s;pointer-events:none}.toast.show{opacity:1;transform:translate(-50%,0)}
</style>
