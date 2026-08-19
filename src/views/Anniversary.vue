<template>
  <div class="page-container">
    <div class="page-header">
      <button @click="goBack" class="btn-back">←</button>
      <h1 class="text-xl font-bold">纪念日</h1>
      <button @click="openCreateModal" class="btn btn-primary btn-sm">+ 添加</button>
    </div>

    <div class="page-content">
      <section v-if="nextAnniversary" class="countdown-hero">
        <div class="countdown-top">
          <div>
            <small>下一段值得期待的日子</small>
            <h2>{{ nextAnniversary.name }}</h2>
            <p>{{ formatFullDate(nextAnniversary.nextDate) }}</p>
          </div>
          <span>{{ getEmoji(nextAnniversary.type) }}</span>
        </div>
        <div class="countdown-grid">
          <div><strong>{{ countdown.days }}</strong><small>天</small></div>
          <i>:</i>
          <div><strong>{{ pad(countdown.hours) }}</strong><small>时</small></div>
          <i>:</i>
          <div><strong>{{ pad(countdown.minutes) }}</strong><small>分</small></div>
          <i>:</i>
          <div><strong>{{ pad(countdown.seconds) }}</strong><small>秒</small></div>
        </div>
      </section>

      <div v-if="sortedAnniversaries.length" class="anniversary-list">
        <article v-for="anniversary in sortedAnniversaries" :key="anniversary.id" class="card anniversary-card">
          <div class="anniversary-main">
            <div class="anniversary-icon">{{ getEmoji(anniversary.type) }}</div>
            <div class="anniversary-copy">
              <small>{{ getTypeLabel(anniversary) }}</small>
              <h3>{{ anniversary.name }}</h3>
              <p>{{ formatFullDate(anniversary.date) }} · {{ anniversary.repeatYearly === false ? '仅一次' : '每年重复' }}</p>
              <div class="count-mode-tags">
                <span v-if="anniversary.countMode !== 'countdown'">已经 {{ anniversary.daysElapsed }} 天</span>
                <span v-if="anniversary.countMode !== 'elapsed'">还有 {{ anniversary.daysLeft }} 天</span>
              </div>
            </div>
            <div class="days-left" :class="{ today: displayDays(anniversary) === 0 }">
              <strong>{{ displayDays(anniversary) === 0 ? '今天' : displayDays(anniversary) }}</strong>
              <small v-if="displayDays(anniversary) !== 0">{{ anniversary.countMode === 'elapsed' ? '天了' : '天后' }}</small>
            </div>
          </div>
          <div class="card-actions">
            <button @click="editAnniversary(anniversary)">编辑</button>
            <button @click="togglePin(anniversary)">
              {{ anniversary.pinToHome ? '取消首页显示' : '在首页显示' }}
            </button>
            <button class="danger" @click="deleteAnniversary(anniversary.id)">删除</button>
          </div>
        </article>
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon">🎂</div>
        <div class="empty-text">还没有纪念日</div>
        <div class="empty-hint">记录你们相遇、恋爱和每一个重要日子</div>
        <button @click="openCreateModal" class="btn btn-primary mt-4">添加第一个纪念日</button>
      </div>
    </div>

    <div class="tab-bar">
      <div v-for="tab in tabs" :key="tab.path" @click="navigate(tab.path)" :class="['tab-item', currentPath === tab.path ? 'active' : '']">
        <span class="icon">{{ tab.icon }}</span><span>{{ tab.label }}</span>
      </div>
    </div>

    <div v-if="showCreateModal" class="overlay show" @click.self="closeCreateModal">
      <div class="overlay-box p-6">
        <div class="modal-heading">
          <div><small>{{ editingAnniversary ? 'UPDATE DAY' : 'NEW DAY' }}</small><h3>{{ editingAnniversary ? '编辑纪念日' : '添加纪念日' }}</h3></div>
          <button @click="closeCreateModal">×</button>
        </div>
        <label class="field-label">纪念日名称</label>
        <input v-model="form.name" class="form-input mb-4" placeholder="例如：我们在一起的日子">
        <label class="field-label">日期</label>
        <input v-model="form.date" type="date" class="form-input mb-4">
        <label class="field-label">类型</label>
        <select v-model="form.type" class="form-input mb-4">
          <option value="birthday">生日</option>
          <option value="meeting">相识纪念日</option>
          <option value="dating">恋爱纪念日</option>
          <option value="wedding">结婚纪念日</option>
          <option value="travel">旅行</option>
          <option value="promise">约定</option>
          <option value="custom">自定义</option>
        </select>
        <input v-if="form.type === 'custom'" v-model="form.customType" class="form-input mb-4" maxlength="12" placeholder="输入自定义类型，例如：第一次旅行">
        <label class="field-label">显示方式</label>
        <div class="mode-picker mb-4">
          <button v-for="option in countModes" :key="option.value" :class="{ active: form.countMode === option.value }" @click="form.countMode = option.value">
            <strong>{{ option.label }}</strong><small>{{ option.hint }}</small>
          </button>
        </div>
        <label class="repeat-row">
          <span><strong>每年重复</strong><small>自动计算下一次纪念日</small></span>
          <span class="switch"><input v-model="form.repeatYearly" type="checkbox"><span class="slider"></span></span>
        </label>
        <div class="flex gap-3 mt-5">
          <button @click="closeCreateModal" class="btn btn-secondary flex-1">取消</button>
          <button @click="saveAnniversary" class="btn btn-primary flex-1">{{ saving ? '保存中…' : '保存' }}</button>
        </div>
      </div>
    </div>
    <div :class="['toast', toast.show ? 'show' : '']">{{ toast.message }}</div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AnniversaryAPI } from '@/api'
import { pushSharedState } from '@/api/sharedState'

const router = useRouter()
const route = useRoute()
const currentPath = computed(() => route.path)
const tabs = [
  { path: '/home', icon: '⌂', label: '我们' }, { path: '/anniversary', icon: '♡', label: '纪念日' },
  { path: '/chat', icon: '✉', label: '聊天' }, { path: '/location', icon: '⌖', label: '位置' },
  { path: '/me', icon: '○', label: '我的' }
]

const anniversaries = ref([])
const showCreateModal = ref(false)
const editingAnniversary = ref(null)
const saving = ref(false)
const clock = ref(Date.now())
const form = ref({ name: '', date: '', type: 'dating', customType: '', countMode: 'both', repeatYearly: true })
const countModes = [
  { value: 'countdown', label: '倒计时', hint: '距离下一次' },
  { value: 'elapsed', label: '正计时', hint: '已经多少天' },
  { value: 'both', label: '同时显示', hint: '过去与未来' }
]
const toast = ref({ show: false, message: '' })
let timer

const parseLocalDate = value => {
  const [year, month, day] = `${value}`.slice(0, 10).split('-').map(Number)
  return new Date(year, month - 1, day)
}
const getNextDate = item => {
  const original = parseLocalDate(item.date)
  if (item.repeatYearly === false) return original
  const now = new Date(clock.value)
  const next = new Date(now.getFullYear(), original.getMonth(), original.getDate())
  next.setHours(0, 0, 0, 0)
  if (next.getTime() < new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) next.setFullYear(next.getFullYear() + 1)
  return next
}
const withCountdown = item => {
  const nextDate = getNextDate(item)
  const today = new Date(clock.value); today.setHours(0, 0, 0, 0)
  const original = parseLocalDate(item.date); original.setHours(0, 0, 0, 0)
  return {
    ...item,
    countMode: item.countMode || 'both',
    nextDate,
    daysLeft: Math.max(0, Math.ceil((nextDate - today) / 86400000)),
    daysElapsed: Math.max(0, Math.floor((today - original) / 86400000))
  }
}
const sortedAnniversaries = computed(() => anniversaries.value.map(withCountdown).sort((a, b) => a.daysLeft - b.daysLeft))
const nextAnniversary = computed(() => sortedAnniversaries.value[0] || null)
const countdown = computed(() => {
  if (!nextAnniversary.value) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  const target = new Date(nextAnniversary.value.nextDate); target.setHours(23, 59, 59, 999)
  const difference = Math.max(0, target.getTime() - clock.value)
  return {
    days: Math.floor(difference / 86400000),
    hours: Math.floor(difference / 3600000) % 24,
    minutes: Math.floor(difference / 60000) % 60,
    seconds: Math.floor(difference / 1000) % 60
  }
})

const getEmoji = type => ({ birthday: '🎂', meeting: '💘', dating: '💕', love: '💕', wedding: '💍', travel: '✈️', promise: '🤝', custom: '✨', other: '✨' }[type] || '✨')
const getTypeLabel = item => item.customType || ({ birthday: '生日', meeting: '相识', dating: '恋爱', love: '恋爱', wedding: '结婚', travel: '旅行', promise: '约定', custom: '自定义', other: '重要日子' }[item.type] || '重要日子')
const displayDays = item => item.countMode === 'elapsed' ? item.daysElapsed : item.daysLeft
const formatFullDate = value => new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }).format(value instanceof Date ? value : parseLocalDate(value))
const pad = value => `${value}`.padStart(2, '0')
const showToast = message => { toast.value = { show: true, message }; setTimeout(() => { toast.value.show = false }, 1800) }
const goBack = () => router.back()
const navigate = path => path !== currentPath.value && router.push(path)
const openCreateModal = () => {
  editingAnniversary.value = null
  form.value = { name: '', date: '', type: 'dating', customType: '', countMode: 'both', repeatYearly: true }
  showCreateModal.value = true
}
const closeCreateModal = () => { showCreateModal.value = false; editingAnniversary.value = null }
const editAnniversary = item => {
  editingAnniversary.value = item
  form.value = { name: item.name, date: `${item.date}`.slice(0, 10), type: item.type || 'custom', customType: item.customType || '', countMode: item.countMode || 'both', repeatYearly: item.repeatYearly !== false }
  showCreateModal.value = true
}
const saveAnniversary = async () => {
  if (!form.value.name.trim()) return showToast('请输入纪念日名称')
  if (!form.value.date) return showToast('请选择日期')
  if (form.value.type === 'custom' && !form.value.customType.trim()) return showToast('请输入自定义类型')
  saving.value = true
  try {
    const isEditing = !!editingAnniversary.value
    const payload = { ...form.value, name: form.value.name.trim() }
    const saved = isEditing
      ? await AnniversaryAPI.update(editingAnniversary.value.id, payload)
      : await AnniversaryAPI.create(payload)
    if (!saved) throw new Error('保存失败')
    const index = anniversaries.value.findIndex(item => item.id === saved.id)
    if (index >= 0) anniversaries.value[index] = saved
    else anniversaries.value.push(saved)
    localStorage.setItem('loveDiary_anniversaries', JSON.stringify(anniversaries.value))
    await pushSharedState('anniversary', anniversaries.value)
    closeCreateModal()
    showToast(isEditing ? '纪念日已更新' : '纪念日已添加')
  } catch (e) {
    console.error('saveAnniversary error:', e)
    showToast(e.message || '保存失败，请重试')
  } finally {
    saving.value = false
  }
}
const deleteAnniversary = async id => {
  if (!confirm('确定删除这个纪念日吗？')) return
  try {
    await AnniversaryAPI.delete(id)
    anniversaries.value = anniversaries.value.filter(item => item.id !== id)
    await pushSharedState('anniversary', anniversaries.value)
    showToast('纪念日已删除')
  } catch (e) {
    console.error('deleteAnniversary error:', e)
    showToast(e.message || '删除失败')
  }
}
const togglePin = async item => {
  const willPin = !item.pinToHome
  try {
    const updated = willPin
      ? await AnniversaryAPI.setPinned(item.id)
      : await AnniversaryAPI.unpin(item.id)
    if (!updated) throw new Error('操作失败')
    item.pinToHome = willPin
    if (willPin) {
      for (const a of anniversaries.value) {
        if (a.id !== item.id) a.pinToHome = false
      }
    }
    await pushSharedState('anniversary', anniversaries.value)
    showToast(willPin ? '已置顶到首页' : '已取消首页显示')
  } catch (e) {
    console.error('togglePin error:', e)
    showToast(e.message || '置顶失败，请重试')
  }
}
const loadAnniversaries = async () => {
  try {
    anniversaries.value = (await AnniversaryAPI.list()).data || []
  } catch (e) {
    console.error('loadAnniversaries error:', e)
  }
}

onMounted(() => { loadAnniversaries(); timer = setInterval(() => { clock.value = Date.now() }, 1000) })
onBeforeUnmount(() => clearInterval(timer))
</script>

<style scoped>
.countdown-hero{margin-bottom:18px;padding:25px;border-radius:23px;color:#fff;background:linear-gradient(135deg,#df6179,#c65070 58%,#966592);box-shadow:0 16px 35px rgba(172,67,94,.22)}.countdown-top{display:flex;justify-content:space-between}.countdown-top small{font-size:9px;letter-spacing:1px;opacity:.75}.countdown-top h2{font-size:19px;margin:5px 0}.countdown-top p{font-size:10px;opacity:.78}.countdown-top>span{font-size:33px}.countdown-grid{display:grid;grid-template-columns:1fr auto 1fr auto 1fr auto 1fr;align-items:center;margin-top:24px;padding-top:18px;border-top:1px solid rgba(255,255,255,.2)}.countdown-grid div{text-align:center}.countdown-grid strong,.countdown-grid small{display:block}.countdown-grid strong{font:28px Georgia,serif}.countdown-grid small{font-size:9px;opacity:.7;margin-top:3px}.countdown-grid i{font-style:normal;opacity:.45}.anniversary-card{padding:0;overflow:hidden}.anniversary-main{display:flex;align-items:center;gap:13px;padding:18px}.anniversary-icon{width:46px;height:46px;border-radius:15px;background:linear-gradient(145deg,#fff0f2,#f5eaf9);display:grid;place-items:center;font-size:23px}.anniversary-copy{flex:1;min-width:0}.anniversary-copy small{font-size:9px;color:#d06a7e}.anniversary-copy h3{font-size:14px;margin:3px 0}.anniversary-copy p{font-size:9px;color:#9d7c84}.days-left{text-align:center;color:#cc5970}.days-left strong,.days-left small{display:block}.days-left strong{font:24px Georgia,serif}.days-left small{font-size:8px}.days-left.today strong{font:14px "PingFang SC"}.card-actions{display:flex;justify-content:flex-end;gap:8px;padding:10px 16px;background:#fff9f8;border-top:1px solid #f5e6e8}.card-actions button{border:0;background:#fff;color:#b3596a;border-radius:9px;padding:6px 13px;font-size:10px}.card-actions .danger{color:#a68d92}.modal-heading{display:flex;justify-content:space-between;margin-bottom:20px}.modal-heading small{font:8px Georgia;letter-spacing:1.5px;color:#d05b72}.modal-heading h3{font-size:18px;margin-top:4px}.modal-heading button{border:0;background:none;font-size:24px;color:#a5838b}.field-label{display:block;font-size:10px;color:#916e76;margin:0 0 6px 2px}.repeat-row{display:flex;align-items:center;justify-content:space-between;padding:11px 2px}.repeat-row strong,.repeat-row small{display:block}.repeat-row strong{font-size:12px}.repeat-row small{font-size:9px;color:#a98b92;margin-top:3px}
</style>
<style scoped>
.count-mode-tags{display:flex;gap:5px;margin-top:7px}.count-mode-tags span{padding:3px 7px;border-radius:999px;background:#fff1f3;color:#bc5368;font-size:8px}.mode-picker{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.mode-picker button{padding:10px 4px;border:1px solid #efdee1;border-radius:12px;background:#fff;color:#87656d}.mode-picker button.active{border-color:#d95b73;background:#fff0f3;color:#c24f67;box-shadow:0 4px 12px rgba(194,79,103,.1)}.mode-picker strong,.mode-picker small{display:block}.mode-picker strong{font-size:11px}.mode-picker small{font-size:8px;margin-top:3px;opacity:.7}
</style>
