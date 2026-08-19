<template>
  <div class="page-container">
    <div class="page-header">
      <button @click="goBack" class="btn-back">←</button>
      <h1 class="text-xl font-bold">计划安排</h1>
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

      <div v-if="filteredPlans.length > 0">
        <div 
          v-for="plan in filteredPlans" 
          :key="plan.id"
          class="card"
        >
          <div class="flex items-start gap-3">
            <button 
              @click="toggleComplete(plan)"
              :class="['w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', plan.completed ? 'bg-primary' : 'bg-gray-200']"
            >
              <span v-if="plan.completed" class="text-white text-sm">✓</span>
            </button>
            <div class="flex-1">
              <h3 :class="['font-medium', plan.completed ? 'line-through text-gray-400' : '']">
                {{ plan.title }}
              </h3>
              <p v-if="plan.description" class="text-sm text-gray-500 mt-1">{{ plan.description }}</p>
              <div class="flex items-center gap-4 mt-2 text-xs text-gray-400">
                <span>📅 {{ formatDate(plan.date) }}</span>
                <span v-if="plan.time">⏰ {{ plan.time }}</span>
                <span v-if="plan.location">📍 {{ plan.location }}</span>
              </div>
            </div>
            <div class="flex gap-2">
              <button @click="editPlan(plan)" class="text-primary text-sm">编辑</button>
              <button @click="deletePlan(plan.id)" class="text-danger text-sm">删除</button>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <div class="empty-icon">📋</div>
        <div class="empty-text">还没有计划</div>
        <div class="empty-hint">安排你们的甜蜜约会吧</div>
        <button @click="openCreateModal" class="btn btn-primary mt-4">添加计划</button>
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
        <h3 class="text-lg font-bold mb-4">{{ editingPlan ? '编辑计划' : '添加计划' }}</h3>
        <input 
          v-model="form.title" 
          type="text" 
          class="form-input mb-4" 
          placeholder="计划内容"
        />
        <textarea 
          v-model="form.description" 
          class="form-textarea mb-4" 
          placeholder="描述（可选）"
        ></textarea>
        <input 
          v-model="form.date" 
          type="date" 
          class="form-input mb-4" 
        />
        <input 
          v-model="form.time" 
          type="time" 
          class="form-input mb-4" 
        />
        <input 
          v-model="form.location" 
          type="text" 
          class="form-input mb-4" 
          placeholder="地点（可选）"
        />
        <div class="flex gap-3">
          <button @click="closeCreateModal" class="btn btn-secondary flex-1">取消</button>
          <button @click="savePlan" class="btn btn-primary flex-1">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { PlanAPI } from '@/api'

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

const plans = ref([])
const filter = ref('all')
const showCreateModal = ref(false)
const editingPlan = ref(null)

const form = ref({
  title: '',
  description: '',
  date: '',
  time: '',
  location: ''
})

const filteredPlans = computed(() => {
  let result = [...plans.value]
  
  if (filter.value === 'completed') {
    result = result.filter(p => p.completed)
  } else if (filter.value === 'pending') {
    result = result.filter(p => !p.completed)
  }
  
  return result.sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time || '00:00'}`)
    const dateB = new Date(`${b.date}T${b.time || '00:00'}`)
    return dateA - dateB
  })
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
  editingPlan.value = null
  form.value = { title: '', description: '', date: '', time: '', location: '' }
  showCreateModal.value = true
}

const closeCreateModal = () => {
  showCreateModal.value = false
  editingPlan.value = null
}

const editPlan = (plan) => {
  editingPlan.value = plan
  form.value = {
    title: plan.title,
    description: plan.description || '',
    date: plan.date || '',
    time: plan.time || '',
    location: plan.location || ''
  }
  showCreateModal.value = true
}

const savePlan = async () => {
  if (!form.value.title.trim()) {
    alert('请输入计划内容')
    return
  }
  if (!form.value.date) {
    alert('请选择日期')
    return
  }
  
  const data = {
    title: form.value.title,
    description: form.value.description || null,
    date: form.value.date,
    time: form.value.time || null,
    location: form.value.location || null
  }
  
  try {
    if (editingPlan.value) await PlanAPI.update(editingPlan.value.id, data)
    else await PlanAPI.create(data)
    
    closeCreateModal()
    await loadPlans(false)
    pushSharedState('plans', plans.value)
  } catch (error) {
    console.error('Save plan failed:', error)
  }
}

const toggleComplete = async (plan) => {
  try {
    await PlanAPI.update(plan.id, { completed: !plan.completed })
    await loadPlans(false)
    pushSharedState('plans', plans.value)
  } catch (error) {
    console.error('Toggle complete failed:', error)
  }
}

const deletePlan = async (id) => {
  if (confirm('确定要删除这个计划吗？')) {
    try {
      await PlanAPI.delete(id)
      await loadPlans(false)
      pushSharedState('plans', plans.value)
    } catch (error) {
      console.error('Delete plan failed:', error)
    }
  }
}

const loadPlans = async () => {
  try {
    const response = await PlanAPI.list()
    plans.value = (response.data || []).map(item => ({
      ...item,
      date: item.date || item.target_date || '',
      completedAt: item.completedAt || item.completed_at || ''
    }))
  } catch (error) {
    console.error('Load plans failed:', error)
  }
}

onMounted(() => {
  loadPlans()
})
</script>
