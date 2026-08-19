<template>
  <div class="page-container">
    <div class="page-header">
      <button @click="goBack" class="btn-back">←</button>
      <h1 class="text-xl font-bold">提醒设置</h1>
      <button @click="openAddModal" class="btn btn-primary btn-sm">+ 添加</button>
    </div>

    <div class="page-content">
      <div v-if="alarms.length > 0">
        <div 
          v-for="alarm in alarms" 
          :key="alarm.id"
          class="card"
        >
          <div class="flex items-center justify-between">
            <div>
              <div class="flex items-center gap-2">
                <h3 class="font-medium">{{ alarm.title }}</h3>
                <span v-if="alarm.repeat" class="text-xs text-gray-400">{{ formatRepeat(alarm.repeat) }}</span>
              </div>
              <div class="text-lg font-bold mt-1">{{ alarm.time }}</div>
              <div class="text-xs text-gray-400 mt-1">{{ soundLabel(alarm.sound) }}</div>
            </div>
            <label class="switch">
              <input type="checkbox" v-model="alarm.enabled" @change="toggleAlarm(alarm)" />
              <span class="slider"></span>
            </label>
          </div>
          <div class="flex gap-2 mt-3">
            <button @click="editAlarm(alarm)" class="btn btn-sm btn-outline">编辑</button>
            <button @click="deleteAlarm(alarm.id)" class="btn btn-sm btn-danger">删除</button>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <div class="empty-icon">⏰</div>
        <div class="empty-text">还没有设置提醒</div>
        <div class="empty-hint">添加甜蜜的提醒吧</div>
        <button @click="openAddModal" class="btn btn-primary mt-4">添加提醒</button>
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

    <div v-if="showModal" class="overlay show" @click.self="closeModal">
      <div class="overlay-box p-6">
        <h3 class="text-lg font-bold mb-4">{{ editingAlarm ? '编辑提醒' : '添加提醒' }}</h3>
        <input v-model="form.title" class="form-input mb-4" placeholder="提醒名称">
        <input v-model="form.time" type="time" class="form-input mb-4">
        <div class="text-sm text-gray-500 mb-2">重复日期</div>
        <div class="repeat-days mb-5">
          <button v-for="(label,index) in dayLabels" :key="index" :class="{ active: form.repeat.includes(index) }" @click="toggleRepeatDay(index)">{{ label }}</button>
        </div>
        <div class="text-sm text-gray-500 mb-2">提醒声音</div>
        <div class="flex gap-2 mb-5">
          <select v-model="form.sound" class="form-input flex-1"><option value="default">系统铃声</option><option value="gentle">温柔提醒</option><option value="bell">清脆铃声</option></select>
          <button class="btn btn-outline" @click="previewAlarmSound(form.sound)">试听</button>
        </div>
        <div class="flex gap-3">
          <button @click="closeModal" class="btn btn-secondary flex-1">取消</button>
          <button @click="saveAlarm" class="btn btn-primary flex-1">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { cancelAlarm, previewAlarmSound, scheduleAlarm } from '@/native/alarms'

const router = useRouter()
const route = useRoute()

const currentPath = computed(() => route.path)

const tabs = [
  { path: '/home', icon: '🏠', label: '首页' },
  { path: '/anniversary', icon: '♡', label: '纪念日' },
  { path: '/chat', icon: '💬', label: '聊天' },
  { path: '/location', icon: '📍', label: '位置' },
  { path: '/me', icon: '👤', label: '我的' }
]

const alarms = ref([])
const showModal = ref(false)
const editingAlarm = ref(null)
const form = ref({ title: '', time: '08:00', repeat: [], sound: 'default', enabled: true })
const dayLabels = ['日', '一', '二', '三', '四', '五', '六']

const formatRepeat = (repeat) => {
  const days = ['日', '一', '二', '三', '四', '五', '六']
  return repeat.map(d => days[d]).join('、')
}

const goBack = () => {
  router.back()
}

const navigate = (path) => {
  if (path !== currentPath.value) {
    router.push(path)
  }
}

const openAddModal = () => {
  editingAlarm.value = null
  form.value = { title: '', time: '08:00', repeat: [], sound: 'default', enabled: true }
  showModal.value = true
}
const soundLabel = sound => ({ default: '系统铃声', gentle: '温柔提醒', bell: '清脆铃声' }[sound] || '系统铃声')

const editAlarm = (alarm) => {
  editingAlarm.value = alarm
  form.value = { title: alarm.title, time: alarm.time, repeat: [...alarm.repeat], sound: alarm.sound || 'default', enabled: alarm.enabled }
  showModal.value = true
}

const closeModal = () => { showModal.value = false; editingAlarm.value = null }
const toggleRepeatDay = day => {
  form.value.repeat = form.value.repeat.includes(day)
    ? form.value.repeat.filter(item => item !== day)
    : [...form.value.repeat, day].sort((a, b) => a - b)
}
const persistAlarms = () => localStorage.setItem('loveDiary_alarms', JSON.stringify(alarms.value))
const saveAlarm = async () => {
  if (!form.value.title.trim()) return alert('请输入提醒名称')
  if (!form.value.time) return alert('请选择提醒时间')
  try {
    if (editingAlarm.value) {
      const index = alarms.value.findIndex(item => item.id === editingAlarm.value.id)
      if (index >= 0) {
        await cancelAlarm(alarms.value[index])
        alarms.value[index] = { ...alarms.value[index], ...form.value, title: form.value.title.trim() }
        alarms.value[index].notificationIds = await scheduleAlarm(alarms.value[index])
      }
    } else {
      const alarm = { id: Date.now().toString(), ...form.value, title: form.value.title.trim() }
      alarm.notificationIds = await scheduleAlarm(alarm)
      alarms.value.unshift(alarm)
    }
  } catch (error) {
    return alert(error.message || '闹钟设置失败')
  }
  persistAlarms()
  closeModal()
}

const deleteAlarm = async (id) => {
  if (confirm('确定要删除这个提醒吗？')) {
    await cancelAlarm(alarms.value.find(a => a.id === id))
    alarms.value = alarms.value.filter(a => a.id !== id)
    persistAlarms()
  }
}

const toggleAlarm = async alarm => {
  try {
    alarm.notificationIds = alarm.enabled ? await scheduleAlarm(alarm) : (await cancelAlarm(alarm), [])
  } catch (error) {
    alarm.enabled = false
    alert(error.message || '闹钟设置失败')
  }
  persistAlarms()
}

const loadAlarms = () => {
  const stored = localStorage.getItem('loveDiary_alarms')
  if (stored) {
    alarms.value = JSON.parse(stored)
    return
  }
  alarms.value = [
    { id: '1', title: '早安问候', time: '07:00', sound: 'gentle', enabled: false, repeat: [1, 2, 3, 4, 5] },
    { id: '2', title: '晚安提醒', time: '22:00', sound: 'bell', enabled: false, repeat: [0, 1, 2, 3, 4, 5, 6] }
  ]
  persistAlarms()
}

onMounted(() => {
  loadAlarms()
})
</script>

<style scoped>
.repeat-days{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}.repeat-days button{aspect-ratio:1;border:1px solid #f0dfe2;border-radius:50%;background:#fff8f8;color:#9c7a82;font-size:11px}.repeat-days button.active{border-color:#df637a;background:#df637a;color:#fff}
</style>
