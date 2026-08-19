const mockUserData = {
  id: 1,
  phone: '13800138000',
  nickname: '小情侣',
  avatar: '',
  partner: null,
  partnerCode: 'LOVE123456',
  created_at: '2024-01-01 12:00:00'
}

const mockDiaries = [
  {
    id: 1,
    user_id: 1,
    title: '第一次约会',
    content: '今天和TA第一次见面，心情特别激动！我们去了咖啡馆，聊了很多有趣的话题。期待下一次见面！',
    created_at: '2024-02-14 14:30:00',
    updated_at: '2024-02-14 14:30:00'
  },
  {
    id: 2,
    user_id: 1,
    title: '一起看电影',
    content: '周末一起去看了一场浪漫的电影，手牵着手，感觉幸福满满。',
    created_at: '2024-02-17 20:00:00',
    updated_at: '2024-02-17 20:00:00'
  }
]

const mockMoods = [
  { id: 1, user_id: 1, score: 5, emoji: '😊', note: '开心的一天', date: '2024-07-25' },
  { id: 2, user_id: 1, score: 4, emoji: '😀', note: '不错的一天', date: '2024-07-26' },
  { id: 3, user_id: 1, score: 5, emoji: '🥰', note: '超幸福', date: '2024-07-27' }
]

const mockCheckins = [
  { id: 1, user_id: 1, date: '2024-07-25', created_at: '2024-07-25 08:00:00' },
  { id: 2, user_id: 1, date: '2024-07-26', created_at: '2024-07-26 08:30:00' },
  { id: 3, user_id: 1, date: '2024-07-27', created_at: '2024-07-27 09:00:00' }
]

const mockWishes = [
  {
    id: 1,
    user_id: 1,
    title: '一起去旅行',
    description: '计划下个月去海边旅行',
    target_date: '2024-08-15',
    completed: false,
    completed_at: null,
    created_at: '2024-07-01 10:00:00'
  },
  {
    id: 2,
    user_id: 1,
    title: '学会做TA喜欢的菜',
    description: '学习做TA最喜欢吃的红烧肉',
    target_date: '2024-08-01',
    completed: true,
    completed_at: '2024-07-20 18:00:00',
    created_at: '2024-07-10 15:00:00'
  }
]

const mockAnniversaries = [
  {
    id: 1,
    user_id: 1,
    name: '恋爱纪念日',
    date: '2024-02-14',
    type: 'love',
    created_at: '2024-02-14 12:00:00'
  },
  {
    id: 2,
    user_id: 1,
    name: 'TA的生日',
    date: '2024-05-20',
    type: 'birthday',
    created_at: '2024-02-15 10:00:00'
  }
]

const mockPlans = [
  {
    id: 1,
    user_id: 1,
    title: '准备惊喜礼物',
    description: '为TA准备一个特别的生日礼物',
    target_date: '2024-05-20',
    completed: false,
    completed_at: null,
    created_at: '2024-04-01 09:00:00'
  }
]

export const initMockData = () => {
  // 旧版本会自动写入模拟登录，导致页面看似已登录但所有真实接口都返回 401。
  // 只清理旧模拟会话，不影响用户已经通过手机号或微信取得的真实会话。
  if (localStorage.getItem('loveDiary_token') === 'mock-token-12345') {
    localStorage.removeItem('loveDiary_token')
    localStorage.removeItem('loveDiary_user')
  }
  
  if (!localStorage.getItem('loveDiary_diaries')) {
    localStorage.setItem('loveDiary_diaries', JSON.stringify(mockDiaries))
  }
  
  if (!localStorage.getItem('loveDiary_moods')) {
    localStorage.setItem('loveDiary_moods', JSON.stringify(mockMoods))
  }
  
  if (!localStorage.getItem('loveDiary_checkins')) {
    localStorage.setItem('loveDiary_checkins', JSON.stringify(mockCheckins))
  }
  
  if (!localStorage.getItem('loveDiary_wishes')) {
    localStorage.setItem('loveDiary_wishes', JSON.stringify(mockWishes))
  }
  
  if (!localStorage.getItem('loveDiary_anniversaries')) {
    localStorage.setItem('loveDiary_anniversaries', JSON.stringify(mockAnniversaries))
  }
  
  if (!localStorage.getItem('loveDiary_plans')) {
    localStorage.setItem('loveDiary_plans', JSON.stringify(mockPlans))
  }
  
  console.log('Mock data initialized successfully!')
}

export const getMockUser = () => mockUserData
export const getMockDiaries = () => mockDiaries
export const getMockMoods = () => mockMoods
export const getMockCheckins = () => mockCheckins
export const getMockWishes = () => mockWishes
export const getMockAnniversaries = () => mockAnniversaries
export const getMockPlans = () => mockPlans

export const MockAPI = {
  diary: {
    list: async () => {
      const data = JSON.parse(localStorage.getItem('loveDiary_diaries') || '[]')
      return { data }
    },
    get: async (id) => {
      const data = JSON.parse(localStorage.getItem('loveDiary_diaries') || '[]')
      return data.find(d => d.id === parseInt(id))
    },
    create: async (entry) => {
      const data = JSON.parse(localStorage.getItem('loveDiary_diaries') || '[]')
      const newEntry = {
        ...entry,
        id: Date.now(),
        user_id: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      data.unshift(newEntry)
      localStorage.setItem('loveDiary_diaries', JSON.stringify(data))
      return newEntry
    },
    update: async (id, entry) => {
      const data = JSON.parse(localStorage.getItem('loveDiary_diaries') || '[]')
      const index = data.findIndex(d => d.id === parseInt(id))
      if (index !== -1) {
        data[index] = { ...data[index], ...entry, updated_at: new Date().toISOString() }
        localStorage.setItem('loveDiary_diaries', JSON.stringify(data))
        return data[index]
      }
      return null
    },
    delete: async (id) => {
      const data = JSON.parse(localStorage.getItem('loveDiary_diaries') || '[]')
      const filtered = data.filter(d => d.id !== parseInt(id))
      localStorage.setItem('loveDiary_diaries', JSON.stringify(filtered))
      return { success: true }
    }
  },
  mood: {
    list: async () => {
      const data = JSON.parse(localStorage.getItem('loveDiary_moods') || '[]')
      return { data }
    },
    create: async (mood) => {
      const data = JSON.parse(localStorage.getItem('loveDiary_moods') || '[]')
      const newMood = {
        ...mood,
        id: Date.now(),
        user_id: 1,
        date: new Date().toISOString().split('T')[0]
      }
      data.push(newMood)
      localStorage.setItem('loveDiary_moods', JSON.stringify(data))
      return newMood
    },
    update: async (id, mood) => {
      const data = JSON.parse(localStorage.getItem('loveDiary_moods') || '[]')
      const index = data.findIndex(m => m.id === parseInt(id))
      if (index !== -1) {
        data[index] = { ...data[index], ...mood }
        localStorage.setItem('loveDiary_moods', JSON.stringify(data))
        return data[index]
      }
      return null
    },
    delete: async (id) => {
      const data = JSON.parse(localStorage.getItem('loveDiary_moods') || '[]')
      const filtered = data.filter(m => m.id !== parseInt(id))
      localStorage.setItem('loveDiary_moods', JSON.stringify(filtered))
      return { success: true }
    },
    stats: async () => {
      const data = JSON.parse(localStorage.getItem('loveDiary_moods') || '[]')
      return {
        count: data.length,
        average: data.length > 0 
          ? Math.round(data.reduce((sum, m) => sum + m.score, 0) / data.length * 10) / 10 
          : 0
      }
    }
  },
  checkin: {
    checkin: async () => {
      const data = JSON.parse(localStorage.getItem('loveDiary_checkins') || '[]')
      const today = new Date().toISOString().split('T')[0]
      const exists = data.some(c => c.date === today)
      
      if (!exists) {
        const newCheckin = {
          id: Date.now(),
          user_id: 1,
          date: today,
          created_at: new Date().toISOString()
        }
        data.push(newCheckin)
        localStorage.setItem('loveDiary_checkins', JSON.stringify(data))
      }
      
      let streak = 0
      const sortedDates = [...data].sort((a, b) => new Date(b.date) - new Date(a.date))
      const todayDate = new Date(today)
      
      for (let i = 0; i < sortedDates.length; i++) {
        const checkinDate = new Date(sortedDates[i].date)
        const expectedDate = new Date(todayDate)
        expectedDate.setDate(expectedDate.getDate() - i)
        
        if (checkinDate.toDateString() === expectedDate.toDateString()) {
          streak++
        } else {
          break
        }
      }
      
      return { success: !exists, streak }
    },
    getHistory: async () => {
      const data = JSON.parse(localStorage.getItem('loveDiary_checkins') || '[]')
      return { data: data.map(c => c.date) }
    },
    getStreak: async () => {
      const data = JSON.parse(localStorage.getItem('loveDiary_checkins') || '[]')
      const today = new Date().toISOString().split('T')[0]
      const sortedDates = [...data].sort((a, b) => new Date(b.date) - new Date(a.date))
      
      let streak = 0
      const todayDate = new Date(today)
      
      for (let i = 0; i < sortedDates.length; i++) {
        const checkinDate = new Date(sortedDates[i].date)
        const expectedDate = new Date(todayDate)
        expectedDate.setDate(expectedDate.getDate() - i)
        
        if (checkinDate.toDateString() === expectedDate.toDateString()) {
          streak++
        } else {
          break
        }
      }
      
      return { streak }
    },
    getStats: async () => {
      const data = JSON.parse(localStorage.getItem('loveDiary_checkins') || '[]')
      const today = new Date().toISOString().split('T')[0]
      const sortedDates = [...data].sort((a, b) => new Date(b.date) - new Date(a.date))
      
      let streak = 0
      const todayDate = new Date(today)
      
      for (let i = 0; i < sortedDates.length; i++) {
        const checkinDate = new Date(sortedDates[i].date)
        const expectedDate = new Date(todayDate)
        expectedDate.setDate(expectedDate.getDate() - i)
        
        if (checkinDate.toDateString() === expectedDate.toDateString()) {
          streak++
        } else {
          break
        }
      }
      
      return {
        total: data.length,
        streak,
        thisMonth: data.filter(c => {
          const checkinDate = new Date(c.date)
          const now = new Date()
          return checkinDate.getMonth() === now.getMonth() && 
                 checkinDate.getFullYear() === now.getFullYear()
        }).length
      }
    }
  },
  wish: {
    list: async () => {
      const data = JSON.parse(localStorage.getItem('loveDiary_wishes') || '[]')
      return { data }
    },
    create: async (wish) => {
      const data = JSON.parse(localStorage.getItem('loveDiary_wishes') || '[]')
      const newWish = {
        ...wish,
        id: Date.now(),
        user_id: 1,
        completed: false,
        completed_at: null,
        created_at: new Date().toISOString()
      }
      data.push(newWish)
      localStorage.setItem('loveDiary_wishes', JSON.stringify(data))
      return newWish
    },
    update: async (id, wish) => {
      const data = JSON.parse(localStorage.getItem('loveDiary_wishes') || '[]')
      const index = data.findIndex(w => w.id === parseInt(id))
      if (index !== -1) {
        data[index] = { 
          ...data[index], 
          ...wish, 
          completed_at: wish.completed ? new Date().toISOString() : null 
        }
        localStorage.setItem('loveDiary_wishes', JSON.stringify(data))
        return data[index]
      }
      return null
    },
    delete: async (id) => {
      const data = JSON.parse(localStorage.getItem('loveDiary_wishes') || '[]')
      const filtered = data.filter(w => w.id !== parseInt(id))
      localStorage.setItem('loveDiary_wishes', JSON.stringify(filtered))
      return { success: true }
    }
  },
  anniversary: {
    list: async () => {
      const data = JSON.parse(localStorage.getItem('loveDiary_anniversaries') || '[]')
      return { data }
    },
    create: async (anniversary) => {
      const data = JSON.parse(localStorage.getItem('loveDiary_anniversaries') || '[]')
      const newAnniversary = {
        ...anniversary,
        id: Date.now(),
        user_id: 1,
        created_at: new Date().toISOString()
      }
      data.push(newAnniversary)
      localStorage.setItem('loveDiary_anniversaries', JSON.stringify(data))
      return newAnniversary
    },
    update: async (id, anniversary) => {
      const data = JSON.parse(localStorage.getItem('loveDiary_anniversaries') || '[]')
      const index = data.findIndex(a => a.id === parseInt(id))
      if (index !== -1) {
        data[index] = { ...data[index], ...anniversary }
        localStorage.setItem('loveDiary_anniversaries', JSON.stringify(data))
        return data[index]
      }
      return null
    },
    delete: async (id) => {
      const data = JSON.parse(localStorage.getItem('loveDiary_anniversaries') || '[]')
      const filtered = data.filter(a => a.id !== parseInt(id))
      localStorage.setItem('loveDiary_anniversaries', JSON.stringify(filtered))
      return { success: true }
    }
  },
  plan: {
    list: async () => {
      const data = JSON.parse(localStorage.getItem('loveDiary_plans') || '[]')
      return { data }
    },
    create: async (plan) => {
      const data = JSON.parse(localStorage.getItem('loveDiary_plans') || '[]')
      const newPlan = {
        ...plan,
        id: Date.now(),
        user_id: 1,
        completed: false,
        completed_at: null,
        created_at: new Date().toISOString()
      }
      data.push(newPlan)
      localStorage.setItem('loveDiary_plans', JSON.stringify(data))
      return newPlan
    },
    update: async (id, plan) => {
      const data = JSON.parse(localStorage.getItem('loveDiary_plans') || '[]')
      const index = data.findIndex(p => p.id === parseInt(id))
      if (index !== -1) {
        data[index] = { 
          ...data[index], 
          ...plan, 
          completed_at: plan.completed ? new Date().toISOString() : null 
        }
        localStorage.setItem('loveDiary_plans', JSON.stringify(data))
        return data[index]
      }
      return null
    },
    delete: async (id) => {
      const data = JSON.parse(localStorage.getItem('loveDiary_plans') || '[]')
      const filtered = data.filter(p => p.id !== parseInt(id))
      localStorage.setItem('loveDiary_plans', JSON.stringify(filtered))
      return { success: true }
    }
  }
}
