<template>
  <div class="page-container">
    <div class="page-header">
      <button @click="goBack" class="btn-back">←</button>
      <h1 class="text-xl font-bold">心情树洞</h1>
    </div>

    <div class="page-content">
      <div class="card mb-4">
        <textarea 
          v-model="content" 
          class="form-textarea" 
          placeholder="写下你的心情，这里是你的专属树洞..."
          rows="6"
        ></textarea>
        <div class="flex justify-between items-center mt-4">
          <div class="flex gap-2">
            <button 
              v-for="emoji in quickEmojis" 
              :key="emoji"
              @click="addEmoji(emoji)"
              class="text-2xl hover:scale-110 transition-transform"
            >
              {{ emoji }}
            </button>
          </div>
          <button @click="submitVent" class="btn btn-primary">发布</button>
        </div>
      </div>

      <div class="card">
        <h3 class="font-bold mb-4">我的树洞</h3>
        <div v-if="vents.length > 0">
          <div 
            v-for="vent in vents" 
            :key="vent.id"
            class="py-3 border-b border-gray-100 last:border-0"
          >
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <p>{{ vent.content }}</p>
                <div class="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span>{{ vent.emoji }}</span>
                  <span>{{ vent.time }}</span>
                </div>
              </div>
              <button @click="deleteVent(vent.id)" class="text-danger text-sm">删除</button>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-8 text-gray-400">
          <div class="text-4xl mb-2">🌳</div>
          <div>还没有发布心情</div>
          <div class="text-sm">在这里倾诉你的心声吧</div>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

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

const quickEmojis = ['😊', '🥰', '😢', '😤', '😴', '🤔', '🎉', '💪']
const content = ref('')
const vents = ref([])

const goBack = () => {
  router.back()
}

const navigate = (path) => {
  if (path !== currentPath.value) {
    router.push(path)
  }
}

const addEmoji = (emoji) => {
  content.value += emoji
}

const submitVent = () => {
  if (!content.value.trim()) {
    alert('请输入内容')
    return
  }

  const now = new Date()
  const vent = {
    id: Date.now().toString(),
    content: content.value,
    emoji: '💭',
    time: `${now.getMonth() + 1}月${now.getDate()}日 ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  }

  vents.value.unshift(vent)
  localStorage.setItem('loveDiary_vents', JSON.stringify(vents.value))
  content.value = ''
}

const deleteVent = (id) => {
  if (confirm('确定要删除这条心情吗？')) {
    vents.value = vents.value.filter(v => v.id !== id)
    localStorage.setItem('loveDiary_vents', JSON.stringify(vents.value))
  }
}

const loadVents = () => {
  const stored = localStorage.getItem('loveDiary_vents')
  if (stored) {
    vents.value = JSON.parse(stored)
    return
  }
  vents.value = [
    { id: '1', content: '今天工作好累啊，幸好有TA陪着我', emoji: '😢', time: '7月20日 22:30' },
    { id: '2', content: '收到了TA送的礼物，好开心！', emoji: '🥰', time: '7月19日 18:45' },
    { id: '3', content: '周末一起去看电影吧', emoji: '🎬', time: '7月18日 10:20' }
  ]
  localStorage.setItem('loveDiary_vents', JSON.stringify(vents.value))
}

onMounted(() => {
  loadVents()
})
</script>
