<template>
  <div class="page-container">
    <div class="page-header">
      <button @click="goBack" class="btn-back">←</button>
      <h1 class="text-xl font-bold">日记</h1>
      <button @click="openCreateModal" class="btn btn-primary btn-sm">+ 写日记</button>
    </div>

    <div class="page-content">
      <div v-if="diaries.length > 0">
        <div 
          v-for="diary in diaries" 
          :key="diary.id"
          class="card"
          @click="viewDiary(diary)"
        >
          <div class="flex justify-between items-start mb-2">
            <h3 class="font-medium">{{ diary.title || '无题' }}</h3>
            <span class="text-xs text-gray-400">{{ formatDate(diary.createdAt) }}</span>
          </div>
          <p class="text-sm text-gray-500 line-clamp-3">{{ diary.content }}</p>
          <div v-if="diary.images?.length" class="flex gap-2 mt-3">
            <img 
              v-for="(img, index) in diary.images.slice(0, 3)" 
              :key="index"
              :src="img" 
              class="w-20 h-20 object-cover rounded-lg"
            />
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <div class="empty-icon">📖</div>
        <div class="empty-text">还没有日记</div>
        <div class="empty-hint">记录下你们的美好时光吧</div>
        <button @click="openCreateModal" class="btn btn-primary mt-4">写第一篇日记</button>
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
        <h3 class="text-lg font-bold mb-4">{{ editingDiary ? '编辑日记' : '写日记' }}</h3>
        <input 
          v-model="form.title" 
          type="text" 
          class="form-input mb-4" 
          placeholder="标题（可选）"
        />
        <textarea 
          v-model="form.content" 
          class="form-textarea mb-4" 
          placeholder="写下今天的故事..."
        ></textarea>
        <div class="flex gap-3">
          <button @click="closeCreateModal" class="btn btn-secondary flex-1">取消</button>
          <button @click="saveDiary" class="btn btn-primary flex-1">保存</button>
        </div>
      </div>
    </div>

    <div v-if="showDetailModal" class="overlay show" @click.self="closeDetailModal">
      <div class="overlay-box p-6 max-h-[80vh] overflow-y-auto">
        <div class="flex justify-between items-start mb-4">
          <h3 class="text-lg font-bold">{{ currentDiary?.title || '无题' }}</h3>
          <div class="flex gap-2">
            <button @click="editDiary" class="text-primary text-sm">编辑</button>
            <button @click="deleteDiary" class="text-danger text-sm">删除</button>
          </div>
        </div>
        <p class="text-gray-500 text-sm mb-4">{{ formatDate(currentDiary?.createdAt) }}</p>
        <p class="whitespace-pre-wrap">{{ currentDiary?.content }}</p>
        <div v-if="currentDiary?.images?.length" class="flex flex-wrap gap-2 mt-4">
          <img 
            v-for="(img, index) in currentDiary.images" 
            :key="index"
            :src="img" 
            class="w-32 h-32 object-cover rounded-lg"
          />
        </div>
        <button @click="closeDetailModal" class="btn btn-primary btn-block mt-6">关闭</button>
      </div>
    </div>

    <div :class="['toast', toast.show ? 'show' : '']">{{ toast.message }}</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDiaryStore } from '@/stores/diary'

const router = useRouter()
const route = useRoute()
const diaryStore = useDiaryStore()

const currentPath = computed(() => route.path)

const tabs = [
  { path: '/home', icon: '🏠', label: '首页' },
  { path: '/anniversary', icon: '♡', label: '纪念日' },
  { path: '/chat', icon: '💬', label: '聊天' },
  { path: '/location', icon: '📍', label: '位置' },
  { path: '/me', icon: '👤', label: '我的' }
]

const diaries = ref([])
const showCreateModal = ref(false)
const showDetailModal = ref(false)
const editingDiary = ref(null)
const currentDiary = ref(null)

const form = ref({
  title: '',
  content: ''
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

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
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
  editingDiary.value = null
  form.value = { title: '', content: '' }
  showCreateModal.value = true
}

const closeCreateModal = () => {
  showCreateModal.value = false
  editingDiary.value = null
}

const viewDiary = (diary) => {
  currentDiary.value = diary
  showDetailModal.value = true
}

const closeDetailModal = () => {
  showDetailModal.value = false
  currentDiary.value = null
}

const editDiary = () => {
  editingDiary.value = currentDiary.value
  form.value = {
    title: currentDiary.value.title || '',
    content: currentDiary.value.content || ''
  }
  closeDetailModal()
  showCreateModal.value = true
}

const saveDiary = async () => {
  if (!form.value.content.trim()) {
    showToast('请输入日记内容')
    return
  }
  
  if (editingDiary.value) {
    await diaryStore.update(editingDiary.value.id, {
      title: form.value.title,
      content: form.value.content
    })
    showToast('修改成功')
  } else {
    await diaryStore.create({
      title: form.value.title || null,
      content: form.value.content
    })
    showToast('保存成功')
  }
  
  closeCreateModal()
  await loadDiaries()
}

const deleteDiary = async () => {
  if (!currentDiary.value) return
  
  if (confirm('确定要删除这篇日记吗？')) {
    await diaryStore.delete(currentDiary.value.id)
    showToast('删除成功')
    closeDetailModal()
    await loadDiaries()
  }
}

const loadDiaries = async () => {
  await diaryStore.list()
  diaries.value = diaryStore.entries
}

onMounted(() => {
  loadDiaries()
})
</script>

<style scoped>
.page-content > div > .card {
  padding: 21px;
  border-left: 3px solid #e88799;
  cursor: pointer;
  background:
    linear-gradient(90deg,rgba(255,241,243,.6),transparent 22%),
    rgba(255,255,255,.95);
}
.page-content > div > .card:nth-child(3n+2) { border-left-color:#a886ba; }
.page-content > div > .card:nth-child(3n) { border-left-color:#dfa172; }
.page-content > div > .card h3 { font-size:15px; letter-spacing:.01em; }
.page-content > div > .card p { line-height:1.7; color:#8c7077 !important; }
.page-content > div > .card img {
  width:82px;
  height:82px;
  border-radius:13px;
  box-shadow:0 5px 15px rgba(77,45,54,.12);
}
</style>
