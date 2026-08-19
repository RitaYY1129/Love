<template>
  <div class="page-container">
    <div class="page-header">
      <button @click="goBack" class="btn-back">←</button>
      <h1 class="text-xl font-bold">愿望清单</h1>
      <div class="w-10" aria-hidden="true"></div>
    </div>

    <div class="page-content">
      <button class="quick-add" @click="openAddModal">
        <span>＋</span>
        <div>
          <strong>添加一个新愿望</strong>
          <small>想到什么，就先记下来</small>
        </div>
        <i>›</i>
      </button>

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

      <div class="grid grid-cols-2 gap-4">
        <div 
          v-for="item in filteredItems" 
          :key="item.id"
          :class="['card relative overflow-hidden', item.completed ? 'opacity-70' : '']"
        >
          <div v-if="item.completed" class="absolute top-2 right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm">
            ✓
          </div>
          <div class="text-3xl mb-2">{{ item.icon }}</div>
          <h3 class="font-medium" :class="item.completed ? 'line-through' : ''">{{ item.title }}</h3>
          <p class="text-xs text-gray-500 mt-1">{{ item.description }}</p>
          <button 
            v-if="!item.completed"
            @click="completeItem(item)" 
            class="btn btn-primary btn-sm mt-3 w-full"
          >
            完成
          </button>
          <div class="flex gap-2 mt-2">
            <button @click="editItem(item)" class="text-primary text-xs">编辑</button>
            <button @click="deleteItem(item.id)" class="text-danger text-xs">删除</button>
          </div>
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

    <div v-if="showModal" class="overlay show" @click.self="closeModal">
      <div class="overlay-box wish-sheet p-6">
        <div class="wish-modal-head">
          <div><small>{{ editingItem ? 'EDIT WISH' : 'NEW WISH' }}</small><h3>{{ editingItem ? '编辑愿望' : '想和 TA 一起做什么？' }}</h3></div>
          <button @click="closeModal">×</button>
        </div>
        <div class="icon-picker">
          <button v-for="option in iconOptions" :key="option.icon" :class="{ active: form.icon === option.icon }" @click="form.icon = option.icon">
            <span>{{ option.icon }}</span><small>{{ option.label }}</small>
          </button>
        </div>
        <label class="field-label">愿望名称 <b>必填</b></label>
        <input ref="titleInput" v-model="form.title" class="form-input mb-4" maxlength="30" placeholder="例如：一起去看海" @keyup.enter="saveItem">
        <label class="field-label">补充描述 <span>选填</span></label>
        <textarea v-model="form.description" class="form-textarea mb-4" maxlength="100" placeholder="可以写时间、地点或者想法"></textarea>
        <div class="flex gap-3">
          <button @click="closeModal" class="btn btn-secondary flex-1">取消</button>
          <button @click="saveItem" class="btn btn-primary flex-1" :disabled="!form.title.trim()">保存愿望</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { hydrateSharedState, pushSharedState } from '@/api/sharedState'

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

const items = ref([])
const filter = ref('all')
const showModal = ref(false)
const editingItem = ref(null)
const form = ref({ icon: '✨', title: '', description: '' })
const titleInput = ref(null)
const iconOptions = [
  { icon: '✈️', label: '旅行' },
  { icon: '🍽️', label: '约会' },
  { icon: '🏠', label: '生活' },
  { icon: '🎬', label: '娱乐' },
  { icon: '🎁', label: '惊喜' },
  { icon: '✨', label: '其他' }
]

const filteredItems = computed(() => {
  if (filter.value === 'completed') return items.value.filter(i => i.completed)
  if (filter.value === 'pending') return items.value.filter(i => !i.completed)
  return items.value
})

const goBack = () => {
  router.back()
}

const navigate = (path) => {
  if (path !== currentPath.value) {
    router.push(path)
  }
}

const openAddModal = () => {
  editingItem.value = null
  form.value = { icon: '✨', title: '', description: '' }
  showModal.value = true
  nextTick(() => titleInput.value?.focus())
}

const editItem = item => {
  editingItem.value = item
  form.value = { icon: item.icon, title: item.title, description: item.description || '' }
  showModal.value = true
  nextTick(() => titleInput.value?.focus())
}
const closeModal = () => { showModal.value = false; editingItem.value = null }
const persistItems = () => {
  localStorage.setItem('loveDiary_bucketList', JSON.stringify(items.value))
  pushSharedState('wishes', items.value)
}
const saveItem = () => {
  if (!form.value.title.trim()) return alert('请输入愿望名称')
  if (editingItem.value) {
    const index = items.value.findIndex(item => item.id === editingItem.value.id)
    if (index >= 0) items.value[index] = { ...items.value[index], ...form.value, title: form.value.title.trim() }
  } else {
    items.value.unshift({ id: Date.now().toString(), ...form.value, title: form.value.title.trim(), completed: false })
  }
  persistItems()
  closeModal()
}
const deleteItem = id => {
  if (!confirm('确定删除这个愿望吗？')) return
  items.value = items.value.filter(item => item.id !== id)
  persistItems()
}

const completeItem = (item) => {
  item.completed = true
  persistItems()
}

const loadItems = async () => {
  const stored = localStorage.getItem('loveDiary_bucketList')
  if (stored) {
    items.value = JSON.parse(stored)
  } else {
    let legacy = []
    try { legacy = JSON.parse(localStorage.getItem('loveDiary_wishes') || '[]') } catch {}
    items.value = legacy.map(item => ({
      id: String(item.id),
      icon: item.icon || '✨',
      title: item.title,
      description: item.description || '',
      completed: Boolean(item.completed),
      targetDate: item.targetDate || item.target_date || ''
    }))
  }
  const shared = await hydrateSharedState('wishes', items.value)
  if (shared.enabled && Array.isArray(shared.payload)) items.value = shared.payload
  localStorage.setItem('loveDiary_bucketList', JSON.stringify(items.value))
}

onMounted(() => {
  loadItems()
})
</script>

<style scoped>
.quick-add{width:100%;margin-bottom:14px;padding:15px 16px;border:1px solid #f1dce0;border-radius:17px;background:linear-gradient(120deg,#fff0f2,#fff8f4);display:flex;align-items:center;gap:12px;text-align:left;color:#573b42;box-shadow:0 7px 22px rgba(128,70,82,.06)}.quick-add>span{width:38px;height:38px;border-radius:13px;background:#dc6077;color:#fff;display:grid;place-items:center;font-size:21px}.quick-add div{flex:1}.quick-add strong,.quick-add small{display:block}.quick-add strong{font-size:13px}.quick-add small{font-size:9px;color:#a17b83;margin-top:3px}.quick-add i{font-style:normal;font-size:21px;color:#d0aeb5}.wish-modal-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px}.wish-modal-head small{font:8px Georgia;letter-spacing:1.5px;color:#d15e75}.wish-modal-head h3{font-size:18px;margin-top:5px}.wish-modal-head>button{border:0;background:none;color:#a7838b;font-size:25px}.icon-picker{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin-bottom:20px}.icon-picker button{border:1px solid transparent;border-radius:12px;background:#fff6f7;padding:9px 2px;color:#806069}.icon-picker button.active{border-color:#df637a;background:#ffe8ec;box-shadow:0 4px 12px rgba(200,78,101,.1)}.icon-picker span,.icon-picker small{display:block}.icon-picker span{font-size:21px}.icon-picker small{font-size:8px;margin-top:4px}.field-label{display:flex;justify-content:space-between;font-size:10px;color:#85656d;margin:0 2px 6px}.field-label b{color:#d45d74;font-weight:500}.field-label span{color:#b69ca2}.btn:disabled{opacity:.42;box-shadow:none}
</style>
