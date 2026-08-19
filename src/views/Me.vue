<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="text-xl font-bold">我的</h1>
    </div>

    <div class="page-content">
      <button class="card profile-summary text-center mb-6" type="button" @click="router.push('/profile')">
        <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
          <img v-if="user?.avatar" :src="user.avatar" alt="我的头像" class="profile-photo">
          <span v-else class="text-3xl">{{ (user?.nickname || '我').slice(0, 1) }}</span>
        </div>
        <h2 class="text-xl font-bold">{{ user?.nickname || '用户' }}</h2>
        <p class="text-gray-500 text-sm mt-1">{{ user?.profile_data?.signature || user?.phone || '点击完善你的个人资料' }}</p>
        <div class="profile-hints">
          <span v-if="genderLabel">{{ genderLabel }}</span>
          <span v-if="user?.profile_data?.city">{{ user.profile_data.city }}</span>
          <span>编辑资料 →</span>
        </div>
        <div class="flex justify-center gap-8 mt-4">
          <div>
            <div class="text-xl font-bold text-primary">{{ diaryCount }}</div>
            <div class="text-xs text-gray-500">日记</div>
          </div>
          <div>
            <div class="text-xl font-bold text-primary">{{ photoCount }}</div>
            <div class="text-xs text-gray-500">照片</div>
          </div>
        </div>
      </button>

      <button class="card mb-4 guardian-card" type="button" @click="router.push('/guardian')">
        <span class="guardian-icon">🛡</span>
        <span class="guardian-copy">
          <strong>守护动态</strong>
          <small>双方授权后查看手机开启、关闭和 App 使用时长</small>
        </span>
        <span class="guardian-status">{{ user?.partner ? '查看动态 ›' : '绑定后开启 ›' }}</span>
      </button>

      <div class="card mb-4">
        <button class="w-full flex items-center justify-between py-3 border-b border-gray-100" @click="openBindModal">
          <div class="flex items-center gap-3">
            <span class="text-xl">💝</span>
            <span>绑定另一半</span>
          </div>
          <span class="text-gray-400">{{ user?.partner ? user.partner.nickname : '去绑定 →' }}</span>
        </button>
        <div class="flex items-center justify-between py-3">
          <div class="flex items-center gap-3">
            <span class="text-xl">🎁</span>
            <span>邀请码</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-primary font-mono">{{ inviteCode }}</span>
            <button @click="copyInviteCode" class="text-sm text-primary">复制</button>
          </div>
        </div>
      </div>

      <div class="card mb-4">
        <div 
          v-for="item in menuItems" 
          :key="item.label"
          @click="handleMenuClick(item)"
          class="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
        >
          <div class="flex items-center gap-3">
            <span class="text-xl">{{ item.icon }}</span>
            <span>{{ item.label }}</span>
          </div>
          <span class="text-gray-400">→</span>
        </div>
      </div>

      <button @click="handleLogout" class="btn btn-secondary btn-block">退出登录</button>
    </div>

    <div v-if="showBindModal" class="overlay show" @click.self="showBindModal = false">
      <div class="overlay-box p-6">
        <h3 class="text-lg font-bold mb-2">绑定另一半</h3>
        <p class="text-xs text-gray-500 mb-4">输入对方的 LOVE 邀请码，双方账号会建立情侣关系。</p>
        <input v-model="partnerCode" class="form-input mb-4" maxlength="20" placeholder="例如 LOVE1234ABCD">
        <div class="flex gap-3"><button class="btn btn-secondary flex-1" @click="showBindModal = false">取消</button><button class="btn btn-primary flex-1" :disabled="binding" @click="bindPartner">{{ binding ? '绑定中…' : '确认绑定' }}</button></div>
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

const menuItems = [
  { icon: '📝', label: '恋爱日记', path: '/diary' },
  { icon: '⭐', label: '愿望清单', path: '/bucketlist' },
  { icon: '📋', label: '计划安排', path: '/plan' },
  { icon: '⏰', label: '提醒设置', path: '/alarm' },
  { icon: '🎮', label: '情侣游戏', path: '/games' },
  { icon: '🌳', label: '心情树洞', path: '/vent' },
  { icon: '🎨', label: '主题装扮', path: '/themes' },
  { icon: '⚙️', label: '设置', path: '/settings' }
]

const user = computed(() => authStore.user)
const genderLabel = computed(() => ({
  female: '女生',
  male: '男生',
  other: '其他',
  private: '性别保密'
}[user.value?.profile_data?.gender] || ''))
const diaryCount = ref(0)
const photoCount = ref(0)
const fallbackCode = localStorage.getItem('loveDiary_inviteCode') || ('LOVE' + Math.random().toString(36).slice(2, 10).toUpperCase())
localStorage.setItem('loveDiary_inviteCode', fallbackCode)
const inviteCode = computed(() => user.value?.invite_code || fallbackCode)
const showBindModal = ref(false)
const partnerCode = ref('')
const binding = ref(false)
let profileSyncTimer = null

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

const navigate = (path) => {
  if (path !== currentPath.value) {
    router.push(path)
  }
}

const handleMenuClick = (item) => {
  if (item.path) {
    router.push(item.path)
  }
}

const copyInviteCode = () => {
  navigator.clipboard.writeText(inviteCode.value)
  showToast('邀请码已复制')
}

const openBindModal = () => {
  if (user.value?.partner) return showToast(`已绑定 ${user.value.partner.nickname}`)
  showBindModal.value = true
}
const bindPartner = async () => {
  if (!partnerCode.value.trim()) return showToast('请输入对方邀请码')
  binding.value = true
  const result = await authStore.bindPartner(partnerCode.value.trim().toUpperCase())
  binding.value = false
  if (!result.ok) return showToast(result.message)
  showBindModal.value = false
  partnerCode.value = ''
  showToast('绑定成功')
}
const handleLogout = () => {
  if (confirm('确定要退出登录吗？')) {
    authStore.logout()
    router.push('/')
  }
}

const loadStats = async () => {
  try {
    const diaries = JSON.parse(localStorage.getItem('loveDiary_diaries') || '[]')
    const photoRecords = JSON.parse(localStorage.getItem('loveDiary_photoRecords') || '[]')
    const photoAlbums = JSON.parse(localStorage.getItem('loveDiary_albums') || '[]')
    diaryCount.value = diaries.length
    photoCount.value = photoAlbums.length
      ? photoAlbums.reduce((total, album) => total + (album.photos?.length || 0), 0)
      : photoRecords.reduce((total, record) => total + (record.photos?.length || 0), 0)
  } catch (error) {
    console.error('Load stats failed:', error)
  }
}

onMounted(async () => {
  await authStore.refreshProfile()
  loadStats()
  profileSyncTimer = window.setInterval(() => authStore.refreshProfile(), 3000)
})
onBeforeUnmount(() => clearInterval(profileSyncTimer))
</script>

<style scoped>
.profile-summary {
  width: 100%;
  display: block;
  font-family: inherit;
  cursor: pointer;
}
.profile-photo {
  width: 100%;
  height: 100%;
  border-radius: inherit;
  object-fit: cover;
}
.profile-hints {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}
.profile-hints span {
  padding: 4px 8px;
  border: 1px solid rgba(255,255,255,.28);
  border-radius: 999px;
  background: rgba(255,255,255,.12);
  color: rgba(255,255,255,.86);
  font-size: 9px;
}
.page-content > .card:first-child {
  padding: 30px 20px 24px;
  border: 0;
  background:
    radial-gradient(circle at 85% 15%, rgba(255,255,255,.5), transparent 22%),
    linear-gradient(145deg,#f4a0af,#db617a 58%,#b65d83);
  color: white;
  box-shadow: 0 15px 35px rgba(181,73,99,.22);
}
.page-content > .card:first-child :deep(.text-gray-500),
.page-content > .card:first-child :deep(.text-primary) { color: white !important; }
.page-content > .card:first-child :deep(.text-gray-500) { opacity: .72; }
.page-content > .card:first-child :deep(.rounded-full) {
  background: rgba(255,255,255,.2);
  border: 1px solid rgba(255,255,255,.35);
  box-shadow: 0 8px 22px rgba(88,32,48,.14);
}
.page-content > .card:nth-child(2) { background: linear-gradient(135deg,#fff,#fff6ed); }
.page-content > .card:nth-child(3) :deep(.py-3) { min-height: 50px; }
.page-content > .card:nth-child(3) :deep(.text-xl) {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 11px;
  background: #fff0f2;
  font-size: 16px;
}
.guardian-card{width:100%;display:flex;align-items:center;gap:12px;padding:15px;text-align:left;background:linear-gradient(135deg,color-mix(in srgb,var(--theme-soft) 72%,#fff),#fff);border-color:color-mix(in srgb,var(--theme-primary) 17%,#eee)}.guardian-icon{flex:0 0 42px;width:42px;height:42px;display:grid;place-items:center;border-radius:14px;background:var(--theme-soft);font-size:19px}.guardian-copy{min-width:0;flex:1}.guardian-copy strong,.guardian-copy small{display:block}.guardian-copy strong{color:#573f46;font-size:12px}.guardian-copy small{margin-top:4px;color:#9e8188;font-size:8px;line-height:1.45}.guardian-status{flex:none;color:var(--theme-primary);font-size:8px}
</style>
