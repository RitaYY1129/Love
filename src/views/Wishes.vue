<template>
  <div class="page-container">
    <div class="page-header">
      <button @click="goBack" class="btn-back">←</button>
      <h1 class="text-xl font-bold">心愿清单</h1>
      <button @click="openCreateModal" class="btn btn-primary btn-sm">+ 添加</button>
    </div>

    <div class="page-content">
      <div class="flex gap-2 mb-4">
        <button 
          @click="filter = 'all'" 
          :class="['px-4 py-2 rounded-lg text-sm', filter === 'all' ? 'bg-primary text-white' : 'bg-gray-100']"
        >
          全部
        </button>
        <button 
          @click="filter = 'pending'" 
          :class="['px-4 py-2 rounded-lg text-sm', filter === 'pending' ? 'bg-primary text-white' : 'bg-gray-100']"
        >
          未完成
        </button>
        <button 
          @click="filter = 'completed'" 
          :class="['px-4 py-2 rounded-lg text-sm', filter === 'completed' ? 'bg-primary text-white' : 'bg-gray-100']"
        >
          已完成
        </button>
      </div>

      <div v-if="filteredWishes.length > 0">
        <div 
          v-for="wish in filteredWishes" 
          :key="wish.id"
          class="card"
        >
          <div class="flex items-start gap-3">
            <button 
              @click="toggleComplete(wish)"
              :class="['w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', wish.completed ? 'bg-primary' : 'bg-gray-200']"
            >
              <span v-if="wish.completed" class="text-white text-sm">✓</span>
            </button>
            <div class="flex-1">
              <h3 :class="['font-medium', wish.completed ? 'line-through text-gray-400' : '']">
                {{ wish.title }}
              </h3>
              <p v-if="wish.description" class="text-sm text-gray-500 mt-1">{{ wish.description }}</p>
              <div class="flex items-center gap-4 mt-2 text-xs text-gray-400">
                <span v-if="wish.targetDate">目标日期: {{ formatDate(wish.targetDate) }}</span>
                <span v-if="wish.completed">完成于: {{ formatDate(wish.completedAt) }}</span>
              </div>
            </div>
            <div class="flex gap-2">
              <button @click="editWish(wish)" class="text-primary text-sm">编辑</button>
              <button @click="deleteWish(wish.id)" class="text-danger text-sm">删除</button>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <div class="empty-icon">⭐</div>
        <div class="empty-text">还没有心愿</div>
        <div class="empty-hint">添加你们的心愿清单吧</div>
        <button @click="openCreateModal" class="btn btn-primary mt-4">添加心愿</button>
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

    <div v-if="showCreateModal" class="overlay show" @click.self="closeCreateModal">
      <div class="overlay-box p-6">
        <h3 class="text-lg font-bold mb-4">{{ editingWish ? '编辑心愿' : '添加心愿' }}</h3>
        <input 
          v-model="form.title" 
          type="text" 
          class="form-input mb-4" 
          placeholder="心愿内容"
        />
        <textarea 
          v-model="form.description" 
          class="form-textarea mb-4" 
          placeholder="描述（可选）"
        ></textarea>
        <input 
          v-model="form.targetDate" 
          type="date" 
          class="form-input mb-4" 
        />
        <div class="flex gap-3">
          <button @click="closeCreateModal" class="btn btn-secondary flex-1">取消</button>
          <button @click="saveWish" class="btn btn-primary flex-1">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { WishAPI } from '@/api'

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

const wishes = ref([])
const filter = ref('all')
const showCreateModal = ref(false)
const editingWish = ref(null)

const form = ref({
  title: '',
  description: '',
  targetDate: ''
})

const filteredWishes = computed(() => {
  if (filter.value === 'completed') {
    return wishes.value.filter(w => w.completed)
  }
  if (filter.value === 'pending') {
    return wishes.value.filter(w => !w.completed)
  }
  return wishes.value
})

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

const goBack = () => {
  router.back()
}

const navigate = (path) => {
  if (path !== currentPath.value) {
    router.push(path)
  }
}

const openCreateModal = () => {
  editingWish.value = null
  form.value = { title: '', description: '', targetDate: '' }
  showCreateModal.value = true
}

const closeCreateModal = () => {
  showCreateModal.value = false
  editingWish.value = null
}

const editWish = (wish) => {
  editingWish.value = wish
  form.value = {
    title: wish.title,
    description: wish.description || '',
    targetDate: wish.targetDate || ''
  }
  showCreateModal.value = true
}

const saveWish = async () => {
  if (!form.value.title.trim()) {
    alert('请输入心愿内容')
    return
  }
  
  const data = {
    title: form.value.title,
    description: form.value.description || null,
    target_date: form.value.targetDate || null
  }

  try {
    if (editingWish.value) await WishAPI.update(editingWish.value.id, data)
    else await WishAPI.create(data)

    closeCreateModal()
    await loadWishes()
  } catch (error) {
    console.error('Save wish failed:', error)
  }
}

const toggleComplete = async (wish) => {
  try {
    await WishAPI.update(wish.id, { completed: !wish.completed })
    await loadWishes()
  } catch (error) {
    console.error('Toggle complete failed:', error)
  }
}

const deleteWish = async (id) => {
  if (confirm('确定要删除这个心愿吗？')) {
    try {
      await WishAPI.delete(id)
      await loadWishes()
    } catch (error) {
      console.error('Delete wish failed:', error)
    }
  }
}

const loadWishes = async () => {
  try {
    const response = await WishAPI.list()
    wishes.value = response.data.map(item => ({
      ...item,
      targetDate: item.targetDate || item.target_date || '',
      completedAt: item.completedAt || item.completed_at || ''
    }))
  } catch (error) {
    console.error('Load wishes failed:', error)
  }
}

onMounted(() => {
  loadWishes()
})
</script>
