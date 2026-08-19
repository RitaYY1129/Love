<template>
  <div class="page-container">
    <div class="page-header">
      <button @click="goBack" class="btn-back">←</button>
      <h1 class="text-xl font-bold">设置</h1>
    </div>

    <div class="page-content">
      <button class="card profile-entry mb-4" type="button" @click="router.push('/profile')">
        <span class="profile-entry-avatar">
          <img v-if="user?.avatar" :src="user.avatar" alt="我的头像">
          <b v-else>{{ (user?.nickname || '我').slice(0, 1) }}</b>
        </span>
        <span class="profile-entry-copy">
          <strong>{{ user?.nickname || '完善个人资料' }}</strong>
          <small>{{ user?.profile_data?.signature || '设置头像、性别、生日和相处习惯' }}</small>
          <em>个人资料完整度 {{ profileCompletion }}%</em>
        </span>
        <span class="profile-entry-arrow">›</span>
      </button>

      <div class="card mb-4">
        <h3 class="font-bold mb-3">账号设置</h3>
        <div class="flex items-center justify-between py-3 border-b border-gray-100">
          <span>修改昵称</span>
          <button @click="openNicknameModal" class="text-primary text-sm">修改</button>
        </div>
        <button class="w-full flex items-center justify-between py-3 border-b border-gray-100" type="button" @click="router.push('/themes')">
          <span>主题装扮</span>
          <span class="text-primary text-sm">选择主题 ›</span>
        </button>
        <div class="flex items-center justify-between py-3 border-b border-gray-100">
          <span>修改密码</span>
          <button @click="openPasswordModal" class="text-primary text-sm">修改</button>
        </div>
        <div class="flex items-center justify-between py-3">
          <span>绑定手机号</span>
          <span class="text-gray-400">{{ user?.phone || '未绑定' }}</span>
        </div>
      </div>

      <div class="card mb-4">
        <h3 class="font-bold">情侣共享范围</h3>
        <p class="text-xs text-gray-500 mt-1 mb-3">每项都需要双方开启才会同步；关闭后内容继续保留在自己这里。</p>
        <div v-for="option in sharingOptions" :key="option.key" class="sharing-row">
          <div><strong>{{ option.label }}</strong><small>{{ option.description }}</small><em>{{ sharingStatus(option.key) }}</em></div>
          <label class="switch">
            <input type="checkbox" v-model="privacySettings[option.key]" :disabled="sharingSaving === option.key" @change="saveSharingPreference(option.key)" />
            <span class="slider"></span>
          </label>
        </div>
      </div>

      <div class="card mb-4">
        <h3 class="font-bold mb-3">通知设置</h3>
        <div class="flex items-center justify-between py-3">
          <span>纪念日提醒</span>
          <label class="switch">
            <input type="checkbox" v-model="notificationSettings.anniversary" />
            <span class="slider"></span>
          </label>
        </div>
        <div class="flex items-center justify-between py-3">
          <span>计划提醒</span>
          <label class="switch">
            <input type="checkbox" v-model="notificationSettings.plan" />
            <span class="slider"></span>
          </label>
        </div>
      </div>

      <div class="card mb-4">
        <div 
          v-for="item in aboutItems" 
          :key="item.label"
          @click="handleAboutClick(item)"
          class="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
        >
          <span>{{ item.label }}</span>
          <span class="text-gray-400">→</span>
        </div>
      </div>

      <button @click="handleClearCache" class="btn btn-secondary btn-block mb-4">清除缓存</button>
      <button @click="handleExportData" class="btn btn-primary btn-block mb-4">导出数据</button>
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

    <div v-if="showNicknameModal" class="overlay show" @click.self="closeNicknameModal">
      <div class="overlay-box p-6">
        <h3 class="text-lg font-bold mb-4">修改昵称</h3>
        <input 
          v-model="newNickname" 
          type="text" 
          class="form-input mb-4" 
          placeholder="请输入新昵称"
        />
        <div class="flex gap-3">
          <button @click="closeNicknameModal" class="btn btn-secondary flex-1">取消</button>
          <button @click="saveNickname" class="btn btn-primary flex-1">保存</button>
        </div>
      </div>
    </div>

    <div v-if="showPasswordModal" class="overlay show" @click.self="closePasswordModal">
      <div class="overlay-box p-6">
        <h3 class="text-lg font-bold mb-4">修改密码</h3>
        <input 
          v-model="passwordForm.oldPassword" 
          type="password" 
          class="form-input mb-4" 
          placeholder="原密码"
        />
        <input 
          v-model="passwordForm.newPassword" 
          type="password" 
          class="form-input mb-4" 
          placeholder="新密码"
        />
        <input 
          v-model="passwordForm.confirmPassword" 
          type="password" 
          class="form-input mb-4" 
          placeholder="确认新密码"
        />
        <div class="flex gap-3">
          <button @click="closePasswordModal" class="btn btn-secondary flex-1">取消</button>
          <button @click="savePassword" class="btn btn-primary flex-1">保存</button>
        </div>
      </div>
    </div>

    <div :class="['toast', toast.show ? 'show' : '']">{{ toast.message }}</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { SharingAPI } from '@/api'

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

const aboutItems = [
  { label: '关于我们', action: 'about' },
  { label: '用户协议', action: 'terms' },
  { label: '隐私政策', action: 'privacy' },
  { label: '版本号', action: 'version' }
]

const user = computed(() => authStore.user)
const profileCompletion = computed(() => {
  const profile = user.value?.profile_data || {}
  const values = [
    user.value?.avatar,
    user.value?.nickname,
    profile.gender,
    profile.birthday,
    profile.signature,
    profile.city,
    profile.sleepTime,
    profile.communicationStyle,
    profile.conflictStyle,
    profile.loveLanguages?.length,
    profile.hobbies?.length
  ]
  return Math.round(values.filter(Boolean).length / values.length * 100)
})

const privacySettings = ref({
  anniversary: true,
  wishes: true,
  plans: true,
  fund: true,
  photos: true,
  diary: false,
  location: false,
  device_activity: false
})
const partnerPrivacySettings = ref({})
const effectiveSharing = ref({})
const sharingSaving = ref('')
const sharingOptions = [
  { key: 'anniversary', label: '纪念日', description: '共同维护重要日期' },
  { key: 'wishes', label: '愿望清单', description: '一起添加和完成愿望' },
  { key: 'plans', label: '未来计划', description: '同步两个人的安排' },
  { key: 'fund', label: '共同记账', description: '共享账户和交易记录' },
  { key: 'photos', label: '情侣相册', description: '共享相册集和照片记录' },
  { key: 'diary', label: '恋爱日记', description: '默认私密，可主动共享' },
  { key: 'location', label: '实时位置', description: '默认关闭，双方同意后共享' },
  { key: 'device_activity', label: '守护动态', description: '默认关闭，双方开启且系统授权后共享手机使用概况' }
]

const notificationSettings = ref({
  anniversary: true,
  plan: true
})

watch([privacySettings, notificationSettings], () => {
  localStorage.setItem('loveDiary_preferences', JSON.stringify({
    privacy: privacySettings.value,
    notifications: notificationSettings.value
  }))
}, { deep: true })

const showNicknameModal = ref(false)
const showPasswordModal = ref(false)
const newNickname = ref('')

const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

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

const goBack = () => {
  router.back()
}

const navigate = (path) => {
  if (path !== currentPath.value) {
    router.push(path)
  }
}

const openNicknameModal = () => {
  newNickname.value = user.value?.nickname || ''
  showNicknameModal.value = true
}

const closeNicknameModal = () => {
  showNicknameModal.value = false
}

const saveNickname = async () => {
  if (!newNickname.value.trim()) {
    showToast('请输入昵称')
    return
  }
  
  const result = await authStore.updateProfile({ nickname: newNickname.value.trim() })
  if (!result.ok) return showToast(result.message)
  showToast('昵称已同步，另一半会自动更新')
  closeNicknameModal()
}

const sharingStatus = key => {
  if (!user.value?.partner) return '绑定另一半后生效'
  if (effectiveSharing.value[key]) return '双方已开启 · 正在共享'
  if (privacySettings.value[key] && !partnerPrivacySettings.value[key]) return '已开启 · 等待对方开启'
  return '仅自己可见'
}

const applySharingResponse = response => {
  privacySettings.value = { ...privacySettings.value, ...(response.preferences || {}) }
  partnerPrivacySettings.value = response.partnerPreferences || {}
  effectiveSharing.value = response.effective || {}
}

const loadSharingPreferences = async () => {
  try { applySharingResponse(await SharingAPI.getPreferences()) } catch (error) { console.warn(error.message) }
}

const saveSharingPreference = async key => {
  const previous = !privacySettings.value[key]
  sharingSaving.value = key
  try {
    applySharingResponse(await SharingAPI.updatePreferences({ [key]: privacySettings.value[key] }))
    showToast(privacySettings.value[key] ? '已开启，等待双方确认' : '已关闭共享')
  } catch (error) {
    privacySettings.value[key] = previous
    showToast(error.message || '共享设置保存失败')
  } finally {
    sharingSaving.value = ''
  }
}

const openPasswordModal = () => {
  passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
  showPasswordModal.value = true
}

const closePasswordModal = () => {
  showPasswordModal.value = false
}

const savePassword = async () => {
  if (!passwordForm.value.oldPassword) {
    showToast('请输入原密码')
    return
  }
  if (!passwordForm.value.newPassword) {
    showToast('请输入新密码')
    return
  }
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    showToast('两次输入的密码不一致')
    return
  }
  
  const storedPassword = localStorage.getItem('loveDiary_localPassword')
  if (storedPassword && storedPassword !== passwordForm.value.oldPassword) {
    showToast('原密码不正确')
    return
  }
  localStorage.setItem('loveDiary_localPassword', passwordForm.value.newPassword)
  showToast('修改成功')
  closePasswordModal()
}

const handleAboutClick = (item) => {
  if (item.action === 'version') {
    showToast('版本号: 2.0.0')
  } else {
    alert(`${item.label}功能开发中`)
  }
}

const handleClearCache = () => {
  if (confirm('确定要清除缓存吗？')) {
    localStorage.clear()
    showToast('缓存已清除')
  }
}

const handleExportData = () => {
  const data = {}
  Object.keys(localStorage).filter(key => key.startsWith('loveDiary_')).forEach(key => {
    try { data[key] = JSON.parse(localStorage.getItem(key)) } catch { data[key] = localStorage.getItem(key) }
  })
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `love-diary-backup-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(link.href)
  showToast('数据已导出')
}

onMounted(async () => {
  await authStore.refreshProfile()
  const stored = localStorage.getItem('loveDiary_preferences')
  if (stored) {
    try {
      const preferences = JSON.parse(stored)
      if (preferences.privacy) privacySettings.value = { ...privacySettings.value, ...preferences.privacy }
      if (preferences.notifications) notificationSettings.value = preferences.notifications
    } catch {}
  }
  await loadSharingPreferences()
})
</script>

<style scoped>
.profile-entry{width:100%;display:flex;align-items:center;gap:13px;padding:15px;text-align:left;background:linear-gradient(135deg,#fff7f7,#fff 60%,#f8f0fa);border-color:#eedde0}.profile-entry-avatar{flex:0 0 54px;width:54px;height:54px;display:grid;place-items:center;overflow:hidden;border:2px solid #fff;border-radius:18px;background:linear-gradient(145deg,#df7185,#b85877);box-shadow:0 7px 18px rgba(174,75,98,.16);color:#fff}.profile-entry-avatar img{width:100%;height:100%;object-fit:cover}.profile-entry-avatar b{font:600 21px Georgia}.profile-entry-copy{min-width:0;flex:1}.profile-entry-copy strong,.profile-entry-copy small,.profile-entry-copy em{display:block}.profile-entry-copy strong{color:#573f46;font-size:13px}.profile-entry-copy small{overflow:hidden;margin-top:4px;color:#9f8188;font-size:9px;text-overflow:ellipsis;white-space:nowrap}.profile-entry-copy em{margin-top:6px;color:#c45a70;font-size:8px;font-style:normal}.profile-entry-arrow{color:#c2969f;font:26px Georgia}
.sharing-row{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 0;border-bottom:1px solid #f3e6e8}.sharing-row:last-child{border-bottom:0}.sharing-row>div{min-width:0}.sharing-row strong,.sharing-row small,.sharing-row em{display:block}.sharing-row strong{font-size:12px}.sharing-row small{margin-top:3px;color:#a1848b;font-size:9px}.sharing-row em{margin-top:4px;color:#c05a70;font-size:8px;font-style:normal}.sharing-row .switch{flex:0 0 auto}
</style>
