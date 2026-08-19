<template>
  <div class="profile-page">
    <header class="profile-header">
      <button class="back-button" type="button" aria-label="返回" @click="router.back()">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <div>
        <p>只属于你的恋爱名片</p>
        <h1>编辑个人资料</h1>
      </div>
      <button class="header-save" type="button" :disabled="saving" @click="saveProfile">
        {{ saving ? '保存中' : '保存' }}
      </button>
    </header>

    <main class="profile-content">
      <section class="identity-card">
        <div class="soft-orb orb-one"></div>
        <div class="soft-orb orb-two"></div>
        <button class="avatar-editor" type="button" @click="galleryInput?.click()">
          <img v-if="form.avatar" :src="form.avatar" alt="我的头像">
          <span v-else>{{ avatarFallback }}</span>
          <em>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5.5 18.5 9.5M4 20l4.7-1 10-10a1.4 1.4 0 0 0 0-2l-1.7-1.7a1.4 1.4 0 0 0-2 0l-10 10L4 20Z"/></svg>
          </em>
        </button>
        <h2>{{ form.nickname || '给自己一个昵称' }}</h2>
        <p>{{ form.signature || '写一句让另一半一眼就认出你的话' }}</p>
        <div class="completion">
          <span><i :style="{ width: `${completion}%` }"></i></span>
          <small>资料完整度 {{ completion }}%</small>
        </div>
        <div class="avatar-actions">
          <button type="button" @click="cameraInput?.click()">拍一张</button>
          <button type="button" @click="galleryInput?.click()">从相册选</button>
          <button v-if="form.avatar" type="button" class="muted" @click="removeAvatar">移除</button>
        </div>
        <input ref="cameraInput" class="hidden-input" type="file" accept="image/*" capture="user" @change="selectAvatar">
        <input ref="galleryInput" class="hidden-input" type="file" accept="image/*" @change="selectAvatar">
      </section>

      <section class="form-card">
        <div class="section-heading">
          <span>01</span>
          <div><h3>关于我</h3><p>让另一半更懂你一点</p></div>
        </div>

        <label class="field">
          <span>昵称</span>
          <input v-model.trim="form.nickname" maxlength="50" placeholder="怎么称呼你">
        </label>

        <div class="field">
          <span>性别</span>
          <div class="choice-grid gender-grid">
            <button
              v-for="item in genders"
              :key="item.value"
              type="button"
              :class="{ active: form.profile.gender === item.value }"
              @click="form.profile.gender = item.value"
            >
              <b>{{ item.icon }}</b>{{ item.label }}
            </button>
          </div>
        </div>

        <div class="two-columns">
          <label class="field">
            <span>生日</span>
            <input v-model="form.profile.birthday" type="date" :max="today">
          </label>
          <label class="field">
            <span>所在城市</span>
            <input v-model.trim="form.profile.city" maxlength="50" placeholder="例如：杭州">
          </label>
        </div>

        <label class="field">
          <span>个性签名 <small>{{ form.profile.signature.length }}/120</small></span>
          <textarea v-model="form.profile.signature" maxlength="120" rows="3" placeholder="今天也想和你分享生活。"></textarea>
        </label>
      </section>

      <section class="form-card">
        <div class="section-heading">
          <span>02</span>
          <div><h3>生活节奏</h3><p>把日常习惯告诉彼此</p></div>
        </div>

        <div class="two-columns">
          <label class="field time-field">
            <span>通常几点睡</span>
            <input v-model="form.profile.sleepTime" type="time">
          </label>
          <label class="field time-field">
            <span>通常几点起</span>
            <input v-model="form.profile.wakeTime" type="time">
          </label>
        </div>

        <label class="field">
          <span>喜欢的食物</span>
          <input v-model.trim="form.profile.favoriteFood" maxlength="100" placeholder="火锅、甜品、家常菜……">
        </label>
        <label class="field">
          <span>不喜欢 / 需要注意</span>
          <input v-model.trim="form.profile.dislikes" maxlength="100" placeholder="忌口、雷区或需要被照顾的习惯">
        </label>
      </section>

      <section class="form-card">
        <div class="section-heading">
          <span>03</span>
          <div><h3>我的相处方式</h3><p>没有标准答案，舒服最重要</p></div>
        </div>

        <div class="field">
          <span>日常沟通</span>
          <div class="choice-grid">
            <button
              v-for="item in communicationOptions"
              :key="item"
              type="button"
              :class="{ active: form.profile.communicationStyle === item }"
              @click="form.profile.communicationStyle = item"
            >{{ item }}</button>
          </div>
        </div>

        <div class="field">
          <span>有分歧时，我更希望</span>
          <div class="choice-grid">
            <button
              v-for="item in conflictOptions"
              :key="item"
              type="button"
              :class="{ active: form.profile.conflictStyle === item }"
              @click="form.profile.conflictStyle = item"
            >{{ item }}</button>
          </div>
        </div>

        <div class="field">
          <span>理想约会</span>
          <div class="choice-grid">
            <button
              v-for="item in dateOptions"
              :key="item"
              type="button"
              :class="{ active: form.profile.datePreference === item }"
              @click="form.profile.datePreference = item"
            >{{ item }}</button>
          </div>
        </div>
      </section>

      <section class="form-card">
        <div class="section-heading">
          <span>04</span>
          <div><h3>心动偏好</h3><p>TA 怎样表达爱，你最容易感受到</p></div>
        </div>

        <div class="field">
          <span>爱的表达 <small>可多选</small></span>
          <div class="love-grid">
            <button
              v-for="item in loveLanguageOptions"
              :key="item.label"
              type="button"
              :class="{ active: form.profile.loveLanguages.includes(item.label) }"
              @click="toggleLoveLanguage(item.label)"
            >
              <b>{{ item.icon }}</b>
              <span>{{ item.label }}</span>
            </button>
          </div>
        </div>

        <div class="field">
          <span>兴趣爱好 <small>最多 12 个</small></span>
          <div class="tag-list">
            <button
              v-for="item in hobbySuggestions"
              :key="item"
              type="button"
              :class="{ active: form.profile.hobbies.includes(item) }"
              @click="toggleHobby(item)"
            >{{ item }}</button>
          </div>
          <div class="custom-tag">
            <input
              v-model.trim="customHobby"
              maxlength="20"
              placeholder="添加自己的爱好"
              @keyup.enter="addCustomHobby"
            >
            <button type="button" @click="addCustomHobby">添加</button>
          </div>
          <div v-if="customHobbies.length" class="selected-tags">
            <button v-for="item in customHobbies" :key="item" type="button" @click="toggleHobby(item)">
              {{ item }} <span>×</span>
            </button>
          </div>
        </div>
      </section>

      <p class="privacy-note">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V7a5 5 0 0 1 10 0v3m-11 0h12v10H6V10Z"/></svg>
        个人资料保存在你的账号中；绑定后，昵称、头像和相处偏好会向另一半展示。
      </p>
      <button class="primary-save" type="button" :disabled="saving" @click="saveProfile">
        {{ saving ? '正在保存…' : '保存我的资料' }}
      </button>
    </main>

    <div :class="['toast', { show: toast.show }]">{{ toast.message }}</div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const cameraInput = ref(null)
const galleryInput = ref(null)
const customHobby = ref('')
const saving = ref(false)
const avatarDirty = ref(false)
const today = new Date().toISOString().slice(0, 10)

const emptyProfile = () => ({
  gender: '',
  birthday: '',
  signature: '',
  city: '',
  sleepTime: '',
  wakeTime: '',
  communicationStyle: '',
  conflictStyle: '',
  datePreference: '',
  loveLanguages: [],
  hobbies: [],
  favoriteFood: '',
  dislikes: ''
})

const form = reactive({
  nickname: '',
  avatar: '',
  profile: emptyProfile()
})

const genders = [
  { value: 'female', label: '女生', icon: '♀' },
  { value: 'male', label: '男生', icon: '♂' },
  { value: 'other', label: '其他', icon: '◇' },
  { value: 'private', label: '保密', icon: '♡' }
]
const communicationOptions = ['随时分享', '文字优先', '语音更亲切', '见面慢慢聊']
const conflictOptions = ['及时说开', '先冷静一下', '先抱抱再聊', '写下来表达']
const dateOptions = ['宅家陪伴', '吃喝探店', '户外旅行', '仪式感约会']
const loveLanguageOptions = [
  { icon: '💬', label: '肯定的话' },
  { icon: '🫶', label: '专注陪伴' },
  { icon: '🎁', label: '用心礼物' },
  { icon: '☕', label: '实际行动' },
  { icon: '🤍', label: '拥抱贴贴' }
]
const hobbySuggestions = ['电影', '音乐', '旅行', '摄影', '美食', '运动', '游戏', '阅读', '宠物', '手作']

const avatarFallback = computed(() => (form.nickname || '我').slice(0, 1))
const customHobbies = computed(() => form.profile.hobbies.filter(item => !hobbySuggestions.includes(item)))
const completion = computed(() => {
  const values = [
    form.avatar,
    form.nickname,
    form.profile.gender,
    form.profile.birthday,
    form.profile.signature,
    form.profile.city,
    form.profile.sleepTime,
    form.profile.communicationStyle,
    form.profile.conflictStyle,
    form.profile.loveLanguages.length,
    form.profile.hobbies.length
  ]
  return Math.round(values.filter(Boolean).length / values.length * 100)
})

const toast = reactive({ show: false, message: '' })
let toastTimer
const showToast = message => {
  toast.message = message
  toast.show = true
  clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => { toast.show = false }, 2200)
}

const hydrate = user => {
  if (!user) return
  form.nickname = user.nickname || ''
  form.avatar = user.avatar || ''
  Object.assign(form.profile, emptyProfile(), user.profile_data || {})
  form.profile.loveLanguages = Array.isArray(form.profile.loveLanguages) ? [...form.profile.loveLanguages] : []
  form.profile.hobbies = Array.isArray(form.profile.hobbies) ? [...form.profile.hobbies] : []
}

const toggleLoveLanguage = item => {
  const list = form.profile.loveLanguages
  const index = list.indexOf(item)
  if (index >= 0) list.splice(index, 1)
  else if (list.length < 5) list.push(item)
}

const toggleHobby = item => {
  const list = form.profile.hobbies
  const index = list.indexOf(item)
  if (index >= 0) list.splice(index, 1)
  else if (list.length < 12) list.push(item)
  else showToast('最多添加 12 个兴趣爱好')
}

const addCustomHobby = () => {
  const value = customHobby.value.trim()
  if (!value) return
  if (!form.profile.hobbies.includes(value)) toggleHobby(value)
  customHobby.value = ''
}

const compressAvatar = file => new Promise((resolve, reject) => {
  const image = new Image()
  const objectUrl = URL.createObjectURL(file)
  image.onload = () => {
    const size = Math.min(image.naturalWidth, image.naturalHeight)
    const sx = (image.naturalWidth - size) / 2
    const sy = (image.naturalHeight - size) / 2
    const canvas = document.createElement('canvas')
    canvas.width = 360
    canvas.height = 360
    const context = canvas.getContext('2d')
    context.fillStyle = '#fff8f7'
    context.fillRect(0, 0, 360, 360)
    context.drawImage(image, sx, sy, size, size, 0, 0, 360, 360)
    URL.revokeObjectURL(objectUrl)
    resolve(canvas.toDataURL('image/jpeg', 0.82))
  }
  image.onerror = () => {
    URL.revokeObjectURL(objectUrl)
    reject(new Error('图片读取失败'))
  }
  image.src = objectUrl
})

const selectAvatar = async event => {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  if (!file.type.startsWith('image/')) return showToast('请选择图片文件')
  if (file.size > 15 * 1024 * 1024) return showToast('原图不能超过 15MB')
  try {
    form.avatar = await compressAvatar(file)
    avatarDirty.value = true
  } catch (error) {
    showToast(error.message || '头像处理失败')
  }
}

const removeAvatar = () => {
  form.avatar = ''
  avatarDirty.value = true
}

const saveProfile = async () => {
  if (!form.nickname.trim()) return showToast('请填写昵称')
  saving.value = true
  const payload = {
    nickname: form.nickname.trim(),
    profile_data: JSON.parse(JSON.stringify(form.profile))
  }
  if (avatarDirty.value) payload.avatar = form.avatar
  const result = await authStore.updateProfile(payload)
  saving.value = false
  if (!result.ok) return showToast(result.message)
  avatarDirty.value = false
  showToast('个人资料已保存')
}

onMounted(async () => {
  hydrate(authStore.user)
  const freshUser = await authStore.refreshProfile()
  if (freshUser) hydrate(freshUser)
})
</script>

<style scoped>
.profile-page{min-height:100dvh;background:#fbf7f6;color:#553f45;padding-bottom:36px}
.profile-header{position:sticky;z-index:20;top:0;display:grid;grid-template-columns:44px 1fr 58px;align-items:center;gap:10px;padding:calc(10px + env(safe-area-inset-top)) 16px 10px;background:rgba(251,247,246,.9);border-bottom:1px solid rgba(224,199,203,.55);backdrop-filter:blur(18px)}
.profile-header h1{font-size:17px;line-height:1.2;color:#4f3940}.profile-header p{margin-bottom:2px;color:#b0808a;font-size:9px;letter-spacing:.08em}.back-button{width:40px;height:40px;display:grid;place-items:center;border:1px solid #eadbdd;border-radius:14px;background:#fff;color:#815e67;box-shadow:0 5px 15px rgba(91,52,61,.05)}.back-button svg{width:20px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.header-save{padding:8px 0;border:0;background:transparent;color:#cc5870;font-size:13px;font-weight:700}.header-save:disabled{opacity:.55}
.profile-content{width:min(100%,680px);margin:0 auto;padding:16px}
.identity-card{position:relative;overflow:hidden;padding:27px 20px 22px;border-radius:27px;background:linear-gradient(145deg,#d9657c,#be5675 58%,#9c628b);box-shadow:0 18px 40px rgba(162,73,97,.2);color:#fff;text-align:center}.soft-orb{position:absolute;border-radius:50%;background:rgba(255,255,255,.14);filter:blur(1px)}.orb-one{width:130px;height:130px;right:-35px;top:-50px}.orb-two{width:90px;height:90px;left:-30px;bottom:-40px}
.avatar-editor{position:relative;width:92px;height:92px;margin:0 auto 13px;padding:0;border:3px solid rgba(255,255,255,.8);border-radius:50%;background:rgba(255,255,255,.2);box-shadow:0 10px 25px rgba(84,29,48,.2);color:#fff;font:600 34px Georgia}.avatar-editor img{width:100%;height:100%;border-radius:inherit;object-fit:cover}.avatar-editor em{position:absolute;right:-2px;bottom:0;width:29px;height:29px;display:grid;place-items:center;border:2px solid #c65974;border-radius:50%;background:#fff;color:#c65974}.avatar-editor svg{width:14px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.identity-card h2{position:relative;font-size:20px}.identity-card>p{position:relative;max-width:330px;margin:5px auto 0;color:rgba(255,255,255,.78);font-size:11px;line-height:1.6}
.completion{position:relative;display:flex;align-items:center;justify-content:center;gap:8px;margin-top:14px}.completion>span{width:104px;height:4px;overflow:hidden;border-radius:999px;background:rgba(255,255,255,.25)}.completion i{display:block;height:100%;border-radius:inherit;background:#fff;transition:width .3s}.completion small{font-size:8px;color:rgba(255,255,255,.76)}.avatar-actions{position:relative;display:flex;justify-content:center;gap:7px;margin-top:15px}.avatar-actions button{padding:7px 11px;border:1px solid rgba(255,255,255,.28);border-radius:10px;background:rgba(255,255,255,.14);color:#fff;font-size:9px}.avatar-actions .muted{opacity:.72}.hidden-input{position:absolute;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none}
.form-card{margin-top:14px;padding:19px 17px;border:1px solid #efe1e2;border-radius:23px;background:rgba(255,255,255,.9);box-shadow:0 9px 28px rgba(91,54,63,.055)}.section-heading{display:flex;align-items:center;gap:10px;margin-bottom:17px}.section-heading>span{width:37px;height:37px;display:grid;place-items:center;border-radius:13px;background:#fff0f2;color:#c7566d;font:600 10px Georgia}.section-heading h3{font-size:14px;color:#573f46}.section-heading p{margin-top:2px;color:#ad9096;font-size:9px}
.field{display:block;margin-top:15px}.field>span{display:flex;justify-content:space-between;margin-bottom:7px;color:#80636a;font-size:10px;font-weight:600}.field>span small{color:#bea6aa;font-weight:400}.field input,.field textarea,.custom-tag input{width:100%;border:1px solid #ede0e1;border-radius:13px;outline:0;background:#fbf8f7;color:#593f46;font-size:12px;transition:.2s}.field input{height:43px;padding:0 12px}.field textarea{padding:11px 12px;line-height:1.55;resize:none}.field input:focus,.field textarea:focus,.custom-tag input:focus{border-color:#dc91a0;background:#fff;box-shadow:0 0 0 3px rgba(217,101,124,.08)}.field input::placeholder,.field textarea::placeholder,.custom-tag input::placeholder{color:#c8b5b8}.two-columns{display:grid;grid-template-columns:1fr 1fr;gap:10px}.time-field input{font-family:inherit}
.choice-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.choice-grid button,.tag-list button{min-height:38px;padding:8px;border:1px solid #eee0e2;border-radius:12px;background:#fcf9f8;color:#886a71;font-size:10px;transition:.18s}.choice-grid button.active,.tag-list button.active{border-color:#e08b9b;background:#fff0f2;color:#bd4e66;box-shadow:inset 0 0 0 1px rgba(215,96,119,.08)}.gender-grid{grid-template-columns:repeat(4,1fr)}.gender-grid button{display:flex;flex-direction:column;align-items:center;gap:3px;padding:9px 3px}.gender-grid b{font:600 16px Georgia}
.love-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}.love-grid button{padding:10px 2px 8px;border:1px solid #eee1e2;border-radius:14px;background:#fcf9f8;color:#86676f}.love-grid button b,.love-grid button span{display:block}.love-grid button b{margin-bottom:5px;font-size:17px}.love-grid button span{font-size:8px}.love-grid button.active{border-color:#e08a9b;background:#fff0f2;color:#bd4e66;transform:translateY(-1px)}
.tag-list{display:flex;flex-wrap:wrap;gap:7px}.tag-list button{min-height:32px;padding:6px 12px;border-radius:999px}.custom-tag{display:flex;gap:8px;margin-top:10px}.custom-tag input{height:40px;padding:0 12px}.custom-tag button{flex:0 0 55px;border:0;border-radius:12px;background:#76535e;color:#fff;font-size:10px}.selected-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}.selected-tags button{padding:5px 9px;border:0;border-radius:999px;background:#f5e9eb;color:#9a6672;font-size:9px}.selected-tags span{margin-left:3px}
.privacy-note{display:flex;align-items:flex-start;gap:7px;margin:17px 5px 12px;color:#a1898f;font-size:9px;line-height:1.6}.privacy-note svg{flex:0 0 14px;width:14px;margin-top:1px;fill:none;stroke:#b37582;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}.primary-save{width:100%;height:49px;border:0;border-radius:16px;background:linear-gradient(135deg,#db657b,#bc526f);box-shadow:0 10px 24px rgba(181,72,97,.2);color:#fff;font-size:13px;font-weight:700}.primary-save:disabled{opacity:.6}
.toast{position:fixed;z-index:80;left:50%;bottom:28px;max-width:80%;padding:10px 16px;border-radius:12px;background:rgba(68,47,53,.92);color:#fff;font-size:11px;opacity:0;transform:translate(-50%,15px);pointer-events:none;transition:.25s}.toast.show{opacity:1;transform:translate(-50%,0)}
@media(max-width:390px){.profile-content{padding:12px}.form-card{padding:17px 14px}.love-grid{grid-template-columns:repeat(3,1fr)}.gender-grid{grid-template-columns:repeat(2,1fr)}}
</style>
