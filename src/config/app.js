export const APP_CONFIG = {
  name: '恋爱日记',
  version: '2.0.0',
  description: '记录我们的每一个甜蜜瞬间',
  
  themes: [
    { id: 'pink', name: '樱花粉', class: '', primaryColor: '#ff6fa8' },
    { id: 'blue', name: '天空蓝', class: 'theme-blue', primaryColor: '#4a90d9' },
    { id: 'purple', name: '梦幻紫', class: 'theme-purple', primaryColor: '#9b59b6' },
    { id: 'green', name: '森林绿', class: 'theme-green', primaryColor: '#27ae60' },
    { id: 'orange', name: '暖阳橙', class: 'theme-orange', primaryColor: '#e67e22' },
    { id: 'dark', name: '深夜黑', class: 'theme-dark', primaryColor: '#34495e' }
  ],

  defaultTheme: 'pink',

  modules: {
    home: { enabled: true, order: 0, icon: '🏠', label: '首页' },
    plan: { enabled: true, order: 1, icon: '🎯', label: '规划' },
    photo: { enabled: true, order: 2, icon: '📸', label: '相册' },
    location: { enabled: true, order: 3, icon: '📍', label: '地图' },
    me: { enabled: true, order: 4, icon: '👤', label: '我的' },
    alarm: { enabled: false, order: 5, icon: '⏰', label: '闹钟' },
    vent: { enabled: false, order: 6, icon: '🗣️', label: '吐槽' },
    quiz: { enabled: false, order: 8, icon: '🧠', label: '答题' },
    bucketlist: { enabled: false, order: 9, icon: '📋', label: '愿望清单' },
    games: { enabled: false, order: 11, icon: '🎮', label: '游戏' }
  },

  api: {
    baseUrl: process.env.NODE_ENV === 'production' 
      ? 'https://api.lovediary.com' 
      : 'http://localhost:3000/api',
    timeout: 10000
  },

  storage: {
    prefix: 'loveDiary_',
    sessionKey: 'session',
    configKey: 'config'
  }
};

export default APP_CONFIG;