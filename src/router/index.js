import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/',
    name: 'Auth',
    component: () => import('@/views/Auth.vue')
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/diary',
    name: 'Diary',
    component: () => import('@/views/Diary.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/photo',
    name: 'Photo',
    component: () => import('@/views/Photo.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/wishes',
    redirect: '/bucketlist'
  },
  {
    path: '/anniversary',
    name: 'Anniversary',
    component: () => import('@/views/Anniversary.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/plan',
    name: 'Plan',
    component: () => import('@/views/Plan.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/me',
    name: 'Me',
    component: () => import('@/views/Me.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/Settings.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/guardian',
    name: 'Guardian',
    component: () => import('@/views/Guardian.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/themes',
    name: 'Themes',
    component: () => import('@/views/Themes.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/alarm',
    name: 'Alarm',
    component: () => import('@/views/Alarm.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/bucketlist',
    name: 'BucketList',
    component: () => import('@/views/BucketList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/games',
    name: 'Games',
    component: () => import('@/views/Games.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/location',
    name: 'Location',
    component: () => import('@/views/Location.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/chat',
    name: 'Chat',
    component: () => import('@/views/Chat.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/fund',
    name: 'Fund',
    component: () => import('@/views/Fund.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/vent',
    name: 'Vent',
    component: () => import('@/views/Vent.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: import.meta.env.VITE_NATIVE_APP === 'true'
    ? createWebHashHistory()
    : createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    next('/')
  } else if (to.path === '/' && authStore.isLoggedIn) {
    next('/home')
  } else {
    next()
  }
})

export default router
