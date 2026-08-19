<template>
  <div class="page-container">
    <header class="page-header">
      <button @click="router.back()" class="btn-back">‹</button>
      <div><small>OUR MEMORIES</small><h1>情侣相册</h1></div>
      <button @click="showAlbumModal = true" class="header-add">新建</button>
    </header>

    <main class="page-content">
      <section class="album-strip">
        <button v-for="album in albums" :key="album.id" :class="{ active: album.id === selectedAlbumId }" @click="selectedAlbumId = album.id">
          <span>{{ album.photos[0] ? '▧' : '♡' }}</span>
          <strong>{{ album.name }}</strong>
          <small>{{ album.photos.length }} 张</small>
        </button>
      </section>

      <section v-if="currentAlbum" class="album-panel">
        <div class="album-heading">
          <div><small>{{ currentAlbum.homeVisible ? '首页展示中' : 'PRIVATE ALBUM' }}</small><h2>{{ currentAlbum.name }}</h2></div>
          <div class="album-actions">
            <button @click="setHomeAlbum">{{ currentAlbum.homeVisible ? '已设为首页' : '显示到首页' }}</button>
            <button @click="renameAlbum">改名</button>
            <button v-if="albums.length > 1" class="danger" @click="deleteAlbum">删除</button>
          </div>
        </div>

        <div class="capture-actions">
          <button class="capture-card camera" @click="cameraInput?.click()">
            <span>⌁</span><div><strong>现在拍一张</strong><small>用镜头留住这一刻</small></div>
          </button>
          <button class="capture-card gallery" @click="fileInput?.click()">
            <span>＋</span><div><strong>从相册选择</strong><small>一次最多选择 8 张</small></div>
          </button>
        </div>

        <div v-if="!currentAlbum.photos.length" class="empty-state">
          <div class="empty-icon">🖼️</div><p>这个相册还没有照片</p><small>把值得珍藏的瞬间放进来吧</small>
        </div>
        <div v-else class="photo-grid">
          <article v-for="photo in sortedPhotos" :key="photo.id" class="photo-card">
            <img :src="photo.url" alt="情侣照片" @click="previewPhoto = photo">
            <div class="photo-meta">
              <span v-if="photo.mood" class="mood-chip">{{ photo.mood }}</span>
              <time>{{ formatDate(photo.capturedAt) }}</time>
            </div>
            <p v-if="photo.note">{{ photo.note }}</p>
            <div class="photo-actions"><button @click="editPhoto(photo)">编辑</button><button @click="deletePhoto(photo.id)">删除</button></div>
          </article>
        </div>
      </section>
    </main>

    <nav class="tab-bar">
      <button v-for="tab in tabs" :key="tab.path" :class="{ active: currentPath === tab.path }" @click="navigate(tab.path)">
        <span>{{ tab.icon }}</span><small>{{ tab.label }}</small>
      </button>
    </nav>

    <input ref="fileInput" class="hidden" type="file" multiple accept="image/*" @change="handleFiles">
    <input ref="cameraInput" class="hidden" type="file" accept="image/*" capture="environment" @change="handleFiles">

    <div v-if="showAlbumModal" class="overlay show" @click.self="showAlbumModal = false">
      <div class="overlay-box p-6">
        <h3 class="text-lg font-bold mb-4">新建相册集</h3>
        <label class="field-label">相册名字</label>
        <input v-model="newAlbumName" class="form-input mb-5" maxlength="20" placeholder="例如：第一次旅行">
        <div class="flex gap-3"><button class="btn btn-secondary flex-1" @click="showAlbumModal = false">取消</button><button class="btn btn-primary flex-1" @click="createAlbum">创建</button></div>
      </div>
    </div>

    <div v-if="showRecordModal" class="overlay show" @click.self="closeRecordModal">
      <div class="overlay-box record-sheet p-6">
        <div class="record-head">
          <div><small>{{ editingPhoto ? 'EDIT MEMORY' : 'NEW MEMORY' }}</small><h3>{{ editingPhoto ? '编辑照片记录' : `记录这 ${pendingPhotos.length} 个瞬间` }}</h3></div>
          <button @click="closeRecordModal">×</button>
        </div>
        <div v-if="pendingPhotos.length" class="pending-preview">
          <img v-for="item in pendingPhotos.slice(0, 4)" :key="item.id" :src="item.url" alt="待添加照片">
        </div>
        <label class="field-label">当时的心情</label>
        <div class="mood-picker">
          <button v-for="mood in moodOptions" :key="mood" :class="{ active: recordForm.mood === mood }" @click="recordForm.mood = mood">{{ mood }}</button>
        </div>
        <label class="field-label">想留下的话</label>
        <textarea v-model="recordForm.note" class="form-textarea mb-4" maxlength="120" placeholder="例如：下雨天一起躲进这家小店，意外地很开心。"></textarea>
        <label class="field-label">发生时间</label>
        <input v-model="recordForm.capturedAt" type="datetime-local" class="form-input mb-5">
        <div class="flex gap-3"><button class="btn btn-secondary flex-1" @click="closeRecordModal">取消</button><button class="btn btn-primary flex-1" @click="savePhotoRecord">{{ editingPhoto ? '保存修改' : '收藏这一刻' }}</button></div>
      </div>
    </div>

    <div v-if="previewPhoto" class="preview" @click="previewPhoto = null">
      <button>×</button><img :src="previewPhoto.url" alt="照片预览">
      <div class="preview-copy"><strong v-if="previewPhoto.mood">{{ previewPhoto.mood }}</strong><p v-if="previewPhoto.note">{{ previewPhoto.note }}</p><time>{{ formatDate(previewPhoto.capturedAt, true) }}</time></div>
    </div>
    <div :class="['toast', toast.show ? 'show' : '']">{{ toast.message }}</div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { hydrateSharedState, pushSharedState } from '@/api/sharedState'

const router = useRouter()
const route = useRoute()
const currentPath = computed(() => route.path)
const tabs = [
  { path: '/home', icon: '⌂', label: '我们' },
  { path: '/anniversary', icon: '♡', label: '纪念日' },
  { path: '/chat', icon: '✉', label: '聊天' },
  { path: '/location', icon: '⌖', label: '位置' },
  { path: '/me', icon: '○', label: '我的' }
]
const albums = ref([])
const selectedAlbumId = ref('')
const fileInput = ref(null)
const cameraInput = ref(null)
const showAlbumModal = ref(false)
const showRecordModal = ref(false)
const newAlbumName = ref('')
const previewPhoto = ref(null)
const pendingPhotos = ref([])
const editingPhoto = ref(null)
const moodOptions = ['🥰 心动', '😊 开心', '😌 安心', '🤭 惊喜', '🥺 感动', '🌙 平静']
const recordForm = ref({ mood: '🥰 心动', note: '', capturedAt: '' })
const toast = ref({ show: false, message: '' })
const MAX_PHOTOS_PER_ALBUM = 255
const currentAlbum = computed(() => albums.value.find(item => item.id === selectedAlbumId.value) || albums.value[0])
const sortedPhotos = computed(() => [...(currentAlbum.value?.photos || [])].sort((a, b) => new Date(b.capturedAt) - new Date(a.capturedAt)))
const showToast = message => { toast.value = { show: true, message }; setTimeout(() => { toast.value.show = false }, 1800) }
const persist = (sync = true) => {
  try {
    localStorage.setItem('loveDiary_albums', JSON.stringify(albums.value))
    if (sync) pushSharedState('photos', albums.value)
    return true
  } catch {
    showToast('照片存储空间不足，请删除部分旧照片')
    return false
  }
}
const navigate = path => path !== currentPath.value && router.push(path)
const formatDate = (value, withTime = false) => new Intl.DateTimeFormat('zh-CN', withTime
  ? { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
  : { month: 'short', day: 'numeric' }).format(new Date(value))

const createAlbum = () => {
  const name = newAlbumName.value.trim()
  if (!name) return showToast('请输入相册名字')
  const album = { id: `album_${Date.now()}`, name, homeVisible: albums.value.length === 0, photos: [], createdAt: new Date().toISOString() }
  albums.value.unshift(album); selectedAlbumId.value = album.id; persist()
  newAlbumName.value = ''; showAlbumModal.value = false; showToast('相册已创建')
}
const renameAlbum = () => {
  const name = prompt('新的相册名字', currentAlbum.value.name)?.trim()
  if (!name) return
  currentAlbum.value.name = name; persist()
}
const deleteAlbum = () => {
  if (!confirm(`删除“${currentAlbum.value.name}”及其中全部照片吗？`)) return
  const deletedId = currentAlbum.value.id
  albums.value = albums.value.filter(item => item.id !== deletedId)
  if (!albums.value.some(item => item.homeVisible)) albums.value[0].homeVisible = true
  selectedAlbumId.value = albums.value[0].id; persist()
}
const setHomeAlbum = () => {
  albums.value.forEach(album => { album.homeVisible = album.id === currentAlbum.value.id })
  persist(); showToast('首页展示相册已更新')
}
const toLocalDateTime = value => {
  const date = new Date(value || Date.now())
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}
const compressPhoto = file => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onerror = reject
  reader.onload = event => {
    const image = new Image()
    image.onerror = reject
    image.onload = () => {
      const maxSide = 1600
      const scale = Math.min(1, maxSide / Math.max(image.width, image.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(image.width * scale))
      canvas.height = Math.max(1, Math.round(image.height * scale))
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', .82))
    }
    image.src = event.target.result
  }
  reader.readAsDataURL(file)
})
const handleFiles = async event => {
  const selectedFiles = [...(event.target.files || [])].filter(file => file.type.startsWith('image/'))
  const remaining = MAX_PHOTOS_PER_ALBUM - (currentAlbum.value?.photos?.length || 0)
  event.target.value = ''
  if (remaining <= 0) return showToast('这个图集已达到 255 张照片上限')
  const files = selectedFiles.slice(0, Math.min(8, remaining))
  if (!files.length) return
  if (selectedFiles.length > files.length) showToast(`本次仅添加 ${files.length} 张，图集最多 255 张`)
  showToast('正在整理照片…')
  try {
    pendingPhotos.value = await Promise.all(files.map(async file => ({
      id: `pending_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      url: await compressPhoto(file),
      capturedAt: new Date(file.lastModified || Date.now()).toISOString()
    })))
  } catch {
    return showToast('照片读取失败，请换一张重试')
  }
  editingPhoto.value = null
  recordForm.value = { mood: '🥰 心动', note: '', capturedAt: toLocalDateTime(pendingPhotos.value[0]?.capturedAt) }
  showRecordModal.value = true
}
const closeRecordModal = () => {
  showRecordModal.value = false
  pendingPhotos.value = []
  editingPhoto.value = null
}
const savePhotoRecord = () => {
  const wasEditing = Boolean(editingPhoto.value)
  const capturedAt = new Date(recordForm.value.capturedAt || Date.now()).toISOString()
  if (editingPhoto.value) {
    Object.assign(editingPhoto.value, { ...recordForm.value, capturedAt })
  } else {
    const additions = pendingPhotos.value.map((photo, index) => ({
      id: `photo_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 6)}`,
      url: photo.url,
      mood: recordForm.value.mood,
      note: recordForm.value.note.trim(),
      capturedAt: index === 0 ? capturedAt : photo.capturedAt
    }))
    if (additions.length > MAX_PHOTOS_PER_ALBUM - currentAlbum.value.photos.length) {
      return showToast('这个图集最多只能保存 255 张照片')
    }
    currentAlbum.value.photos.unshift(...additions)
  }
  if (!persist()) {
    if (!wasEditing) currentAlbum.value.photos.splice(0, pendingPhotos.value.length)
    return
  }
  closeRecordModal()
  showToast(wasEditing ? '照片记录已更新' : '这一刻已经收藏')
}
const editPhoto = photo => {
  editingPhoto.value = photo
  pendingPhotos.value = []
  recordForm.value = { mood: photo.mood || '🥰 心动', note: photo.note || '', capturedAt: toLocalDateTime(photo.capturedAt) }
  showRecordModal.value = true
}
const deletePhoto = id => {
  if (!confirm('删除这张照片吗？')) return
  currentAlbum.value.photos = currentAlbum.value.photos.filter(photo => photo.id !== id); persist()
}
const loadAlbums = async () => {
  try { albums.value = JSON.parse(localStorage.getItem('loveDiary_albums') || '[]') } catch { albums.value = [] }
  if (!albums.value.length) {
    const legacy = JSON.parse(localStorage.getItem('loveDiary_photoRecords') || '[]')
    const photos = legacy.flatMap(record => (record.photos || []).map((url, index) => ({ id: `legacy_${Date.now()}_${index}`, url, capturedAt: new Date(record.date || Date.now()).toISOString() })))
    albums.value = [{ id: 'album_memories', name: '我们的回忆', homeVisible: true, photos, createdAt: new Date().toISOString() }]
    persist(false)
  }
  const shared = await hydrateSharedState('photos', albums.value)
  if (shared.enabled && Array.isArray(shared.payload) && shared.payload.length) {
    albums.value = shared.payload
    localStorage.setItem('loveDiary_albums', JSON.stringify(albums.value))
  }
  selectedAlbumId.value = albums.value[0].id
}
onMounted(loadAlbums)
</script>

<style scoped>
.page-container{min-height:100vh;padding-bottom:92px;background:linear-gradient(180deg,#fff8f8,#fffaf6)}.page-header{position:sticky;top:0;z-index:20;display:grid;grid-template-columns:52px 1fr 52px;align-items:center;padding:13px 18px;background:rgba(255,250,249,.94);border-bottom:1px solid #f1dfe2;backdrop-filter:blur(18px)}.page-header>div{text-align:center}.page-header small{font:8px Georgia;letter-spacing:1.5px;color:#ce6076}.page-header h1{font-size:19px;margin-top:2px}.btn-back,.header-add{border:0;background:#fff;border-radius:12px;height:38px;color:#bf5369;box-shadow:0 5px 16px rgba(112,60,72,.08)}.btn-back{font-size:27px}.header-add{font-size:11px}.album-strip{display:flex;gap:10px;overflow:auto;padding:18px 18px 10px}.album-strip button{flex:0 0 116px;padding:13px;border:1px solid #f0dfe2;border-radius:17px;background:#fff;text-align:left;color:#6f5058}.album-strip button.active{background:linear-gradient(145deg,#df667c,#c65370);color:#fff;border-color:transparent;box-shadow:0 10px 24px rgba(183,70,94,.2)}.album-strip span,.album-strip strong,.album-strip small{display:block}.album-strip span{font-size:19px}.album-strip strong{font-size:12px;margin:7px 0 3px}.album-strip small{font-size:9px;opacity:.7}.album-panel{margin:8px 16px;padding:18px;border:1px solid #f0dfe2;border-radius:22px;background:rgba(255,255,255,.94);box-shadow:0 10px 30px rgba(126,70,82,.07)}.album-heading{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.album-heading small{font:8px Georgia;letter-spacing:1px;color:#cf6077}.album-heading h2{font-size:18px;margin-top:4px}.album-actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:5px}.album-actions button{border:0;border-radius:9px;padding:6px 8px;background:#fff0f2;color:#bd5368;font-size:8px}.album-actions .danger{color:#9e858b;background:#f6f1f2}.upload-card{width:100%;display:flex;align-items:center;gap:12px;margin:17px 0;padding:14px;border:1px dashed #e6aab6;border-radius:16px;background:#fff7f8;text-align:left;color:#6e4c54}.upload-card>span{width:40px;height:40px;display:grid;place-items:center;border-radius:13px;background:#da6077;color:#fff;font-size:22px}.upload-card strong,.upload-card small{display:block}.upload-card strong{font-size:12px}.upload-card small{font-size:9px;color:#a3838a;margin-top:3px}.photo-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.photo-card{overflow:hidden;border-radius:15px;background:#fff7f8}.photo-card img{width:100%;aspect-ratio:1;object-fit:cover}.photo-card div{display:flex;justify-content:space-between;align-items:center;padding:8px}.photo-card time{font-size:9px;color:#997980}.photo-card button{border:0;background:none;color:#bd6677;font-size:9px}.empty-state{text-align:center;padding:42px 10px;color:#95777e}.empty-icon{font-size:43px}.empty-state p{font-size:13px;margin:8px}.empty-state small{font-size:9px}.preview{position:fixed;inset:0;z-index:80;background:rgba(30,16,20,.92);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px}.preview img{max-width:100%;max-height:78vh;border-radius:16px}.preview button{position:absolute;right:22px;top:20px;border:0;background:none;color:#fff;font-size:32px}.preview time{color:#fff;font-size:10px;margin-top:12px;opacity:.75}.tab-bar{position:fixed;bottom:0;left:50%;z-index:30;width:min(100%,720px);transform:translateX(-50%);display:flex;justify-content:space-around;padding:10px 0;background:rgba(255,252,251,.97);border:1px solid #f0dce0;border-bottom:0;border-radius:20px 20px 0 0}.tab-bar button{border:0;background:none;color:#b9a1a6;padding:4px 15px}.tab-bar span,.tab-bar small{display:block}.tab-bar span{font-size:19px}.tab-bar small{font-size:9px;margin-top:3px}.tab-bar button.active{color:#c95168}.field-label{display:block;font-size:10px;color:#8d6b73;margin-bottom:6px}
</style>
<style scoped>
.capture-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin:17px 0}.capture-card{min-width:0;display:flex;align-items:center;gap:9px;padding:13px 10px;border:1px solid #efdce0;border-radius:16px;text-align:left;color:#654850}.capture-card.camera{background:linear-gradient(135deg,#ffe9ed,#fff5f2)}.capture-card.gallery{background:linear-gradient(135deg,#f5f0ff,#fff8fa)}.capture-card>span{flex:0 0 36px;width:36px;height:36px;display:grid;place-items:center;border-radius:12px;background:#d85f77;color:#fff;font-size:20px}.capture-card.gallery>span{background:#8d6fa0}.capture-card strong,.capture-card small{display:block}.capture-card strong{font-size:11px}.capture-card small{margin-top:3px;color:#a28188;font-size:8px}.photo-card{border:1px solid #f1e2e4;box-shadow:0 6px 18px rgba(104,61,70,.05)}.photo-meta{padding:8px 8px 2px!important;gap:5px}.mood-chip{overflow:hidden;padding:3px 6px;border-radius:9px;background:#fff0f2;color:#b34f65;font-size:8px;white-space:nowrap;text-overflow:ellipsis}.photo-card>p{min-height:27px;padding:4px 8px;color:#72565d;font-size:9px;line-height:1.45;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}.photo-actions{justify-content:flex-end!important;padding:4px 8px 9px!important;gap:10px}.record-sheet{max-height:88vh;overflow-y:auto}.record-head{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px}.record-head small{font:8px Georgia;letter-spacing:1.4px;color:#c75970}.record-head h3{margin-top:4px;font-size:18px}.record-head>button{border:0;background:none;color:#9e7a82;font-size:25px}.pending-preview{display:flex;gap:7px;overflow:hidden;margin-bottom:17px}.pending-preview img{width:64px;height:64px;border-radius:13px;object-fit:cover}.mood-picker{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-bottom:17px}.mood-picker button{padding:9px 4px;border:1px solid #f0dfe2;border-radius:11px;background:#fff8f8;color:#82636b;font-size:9px}.mood-picker button.active{border-color:#d76279;background:#ffe9ed;color:#b34960}.preview-copy{width:min(100%,560px);padding:13px 4px 0;color:#fff;text-align:center}.preview-copy strong{display:inline-block;padding:4px 9px;border-radius:10px;background:rgba(255,255,255,.15);font-size:10px}.preview-copy p{margin:8px auto 2px;max-width:460px;font-size:12px;line-height:1.55}.preview-copy time{display:block}@media(max-width:370px){.capture-actions{grid-template-columns:1fr}.mood-picker{grid-template-columns:repeat(2,1fr)}}
</style>
