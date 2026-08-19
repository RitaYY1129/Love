<template>
  <div class="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <div class="text-6xl mb-4">💕</div>
        <h1 class="text-2xl font-bold text-primary">恋爱日记</h1>
        <p class="text-gray-500 mt-2">记录你们的甜蜜时光</p>
      </div>

      <div class="card p-6">
        <div class="flex justify-center gap-4 mb-6">
          <button 
            @click="mode = 'login'" 
            :class="['px-6 py-2 rounded-lg font-medium transition-all', mode === 'login' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600']"
          >
            登录
          </button>
          <button 
            @click="mode = 'register'" 
            :class="['px-6 py-2 rounded-lg font-medium transition-all', mode === 'register' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600']"
          >
            注册
          </button>
        </div>

        <form @submit.prevent="handleSubmit">
          <div class="space-y-4">
            <div v-if="mode === 'register'">
              <label class="block text-sm font-medium text-gray-700 mb-2">用户名</label>
              <input 
                v-model="form.username"
                type="text"
                autocomplete="username"
                class="form-input" 
                placeholder="请输入用户名"
                maxlength="50"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">{{ mode === 'register' ? '邮箱或手机号' : '用户名 / 邮箱 / 手机号' }}</label>
              <input 
                v-model="form.identifier"
                type="text"
                autocomplete="username"
                class="form-input" 
                :placeholder="mode === 'register' ? '邮箱会发送验证码；手机号无需验证码' : '请输入用户名、邮箱或手机号'"
              />
            </div>

            <div v-if="mode === 'register' && isEmail">
              <label class="block text-sm font-medium text-gray-700 mb-2">邮箱验证码</label>
              <div class="flex gap-2">
                <input v-model="form.emailCode" type="text" inputmode="numeric" autocomplete="one-time-code" class="form-input flex-1" placeholder="请输入邮箱中的验证码" maxlength="8" />
                <button type="button" class="btn btn-outline shrink-0 min-w-[112px]" :disabled="codeSending || codeCooldown > 0" @click="sendEmailCode">
                  {{ codeCooldown > 0 ? `${codeCooldown}s` : '发送验证码' }}
                </button>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">密码</label>
              <div class="relative">
                <input v-model="form.password" :type="showPassword ? 'text' : 'password'" class="form-input pr-16" placeholder="请输入至少 6 位密码" />
                <button type="button" class="absolute right-1 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[56px] px-3 text-sm text-primary" @click="showPassword = !showPassword">{{ showPassword ? '隐藏' : '显示' }}</button>
              </div>
            </div>

            <div v-if="mode === 'login'" class="flex justify-between text-sm">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" v-model="rememberMe" />
                <span class="text-gray-600">记住我</span>
              </label>
              <button type="button" @click="openReset" class="text-primary">忘记密码？</button>
            </div>
          </div>

          <button 
            type="submit" 
            class="btn btn-primary btn-block mt-6"
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? '加载中...' : (mode === 'login' ? '登录' : '注册') }}
          </button>
        </form>

        <label v-if="mode === 'register'" class="mt-4 flex items-start justify-center gap-2 text-xs text-gray-500">
          <input v-model="agreedToTerms" type="checkbox" class="mt-0.5" />
          <span>我已阅读并同意《用户协议》和《隐私政策》</span>
        </label>

        <div class="mt-6 text-center">
          <button @click="showPartnerBind = true" class="min-h-[44px] px-4 text-primary text-sm">
            绑定另一半
          </button>
        </div>

      </div>
    </div>

    <div v-if="showPartnerBind" class="overlay show" @click.self="showPartnerBind = false">
      <div class="overlay-box p-6">
        <h3 class="text-lg font-bold mb-4">绑定另一半</h3>
        <p class="text-gray-500 text-sm mb-4">输入对方的邀请码进行绑定</p>
        <input 
          v-model="partnerCode" 
          type="text" 
          class="form-input mb-4" 
          placeholder="请输入邀请码"
        />
        <div class="flex gap-3 mb-3">
          <button @click="showPartnerBind = false" class="btn btn-secondary flex-1">取消</button>
          <button @click="bindPartner" class="btn btn-primary flex-1">绑定</button>
        </div>
        <button @click="bindVirtualPartner" class="btn btn-outline btn-block">
          👫 绑定虚拟情人 (测试)
        </button>
      </div>
    </div>

    <div v-if="showReset" class="overlay show" @click.self="showReset = false">
      <div class="overlay-box p-6">
        <h3 class="text-lg font-bold mb-4">重置密码</h3>
        <p class="text-gray-500 text-sm mb-4">输入手机号和新密码，无需原密码即可重置</p>
        <label class="block text-sm font-medium text-gray-700 mb-2">手机号</label>
        <input v-model="resetForm.identifier" type="text" class="form-input mb-4" placeholder="请输入注册时的手机号" />
        <label class="block text-sm font-medium text-gray-700 mb-2">新密码</label>
        <input v-model="resetForm.password" type="password" class="form-input mb-4" placeholder="请输入至少 6 位新密码" />
        <button class="btn btn-primary btn-block" :disabled="resetSubmitting" @click="handleReset">
          {{ resetSubmitting ? '加载中...' : '确认重置' }}
        </button>
        <button class="btn btn-secondary btn-block mt-3" @click="showReset = false">取消</button>
      </div>
    </div>

    <div :class="['toast', toast.show ? 'show' : '']">{{ toast.message }}</div>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

// 登录页空闲时先加载首页模块，避免首次登录后才现场编译页面。
onMounted(() => {
  import('@/views/Home.vue')
})

const mode = ref('login')
const rememberMe = ref(false)
const showPartnerBind = ref(false)
const partnerCode = ref('')
const showReset = ref(false)
const resetSubmitting = ref(false)
const resetForm = ref({ identifier: '', password: '' })
const isSubmitting = ref(false)
const agreedToTerms = ref(false)
const showPassword = ref(false)
const codeSending = ref(false)
const codeCooldown = ref(0)

const form = ref({
  username: '',
  identifier: '',
  password: '',
  emailCode: ''
})

const toast = ref({
  show: false,
  message: ''
})

const showToast = (message, duration = 2000) => {
  toast.value = { show: true, message }
  setTimeout(() => {
    toast.value.show = false
  }, duration)
}

const isEmail = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.identifier.trim()))
const isPhone = computed(() => /^1[3-9]\d{9}$/.test(form.value.identifier.trim()))

const sendEmailCode = async () => {
  if (!isEmail.value) return showToast('请先输入正确的邮箱')
  codeSending.value = true
  const result = await authStore.sendEmailCode(form.value.identifier.trim())
  codeSending.value = false
  showToast(result.message)
  if (result.ok) {
    codeCooldown.value = 60
    const timer = setInterval(() => {
      codeCooldown.value -= 1
      if (codeCooldown.value <= 0) clearInterval(timer)
    }, 1000)
  }
}

const handleSubmit = async () => {
  if (mode.value === 'register' && !agreedToTerms.value) {
    showToast('请先阅读并同意用户协议和隐私政策')
    return
  }

  if (!form.value.identifier.trim()) {
    showToast('请输入用户名、邮箱或手机号')
    return
  }
  
  if (mode.value === 'register') {
    if (!form.value.username.trim()) {
      showToast('请输入用户名')
      return
    }
    if (!isEmail.value && !isPhone.value) {
      showToast('注册时请输入正确的邮箱或手机号')
      return
    }
    if (isEmail.value && !form.value.emailCode.trim()) {
      showToast('请输入邮箱验证码')
      return
    }
    if (form.value.password.length < 6) {
      showToast('密码至少需要 6 位')
      return
    }
  } else {
    if (!form.value.password) {
      showToast('请输入密码')
      return
    }
    if (!isPhone.value && !isEmail.value) {
      showToast('请输入正确的手机号或邮箱')
      return
    }
  }
  
  isSubmitting.value = true
  
  let result
  if (mode.value === 'login') {
    result = await authStore.login(form.value.identifier, form.value.password)
  } else {
    result = isEmail.value
      ? await authStore.registerByEmailCode(form.value.username, form.value.identifier.trim(), form.value.emailCode.trim(), form.value.password)
      : await authStore.registerByPhone(form.value.username, form.value.identifier.trim(), form.value.password)
  }
  
  isSubmitting.value = false
  
  if (result.ok) {
    await router.replace('/home')
  } else {
    showToast(result.message)
  }
}

const openReset = () => {
  resetForm.value = { identifier: form.value.identifier, password: '' }
  showReset.value = true
}

const handleReset = async () => {
  if (!/^1[3-9]\d{9}$/.test(resetForm.value.identifier.trim())) {
    showToast('请输入正确的手机号')
    return
  }
  if (resetForm.value.password.length < 6) {
    showToast('新密码至少需要 6 位')
    return
  }
  resetSubmitting.value = true
  const result = await authStore.resetPassword(resetForm.value.identifier.trim(), resetForm.value.password)
  resetSubmitting.value = false
  showToast(result.message)
  if (result.ok) {
    showReset.value = false
    form.value.identifier = resetForm.value.identifier
  }
}

const bindPartner = async () => {
  if (!partnerCode.value) {
    showToast('请输入邀请码')
    return
  }
  
  const result = await authStore.bindPartner(partnerCode.value)
  if (result.ok) {
    showToast(result.message)
    showPartnerBind.value = false
  } else {
    showToast(result.message)
  }
}

const bindVirtualPartner = () => {
  if (!authStore.isLoggedIn) {
    showToast('请先登录')
    return
  }
  
  const virtualPartner = {
    id: '2',
    nickname: '虚拟情人',
    phone: '13800138001',
    createdAt: '2024-01-02T00:00:00Z'
  }
  
  if (authStore.user) {
    authStore.user.partner = virtualPartner
    localStorage.setItem('loveDiary_partner', JSON.stringify(virtualPartner))
    showToast('虚拟情人绑定成功')
    showPartnerBind.value = false
  }
}

onBeforeUnmount(() => {
})
</script>
