export const themeOptions = [
  {
    id: 'rose',
    name: '恋爱玫瑰',
    description: '温柔、有质感的默认粉',
    colors: ['#d95f78', '#fff3f5', '#8f5368']
  },
  {
    id: 'strawberry',
    name: '草莓粉',
    description: '更明亮的甜甜少女感',
    colors: ['#ff78a7', '#fff0f6', '#ffb5ca']
  },
  {
    id: 'cloud',
    name: '云朵蓝',
    description: '软绵绵的蓝白治愈感',
    colors: ['#62b9e9', '#f1fbff', '#a9def5']
  },
  {
    id: 'cream',
    name: '奶油小屋',
    description: '暖杏与焦糖的柔和日常',
    colors: ['#c98d6b', '#fff9ef', '#efd6b8']
  },
  {
    id: 'berry',
    name: '暮莓紫',
    description: '浪漫但不俗气的高级紫',
    colors: ['#a86f9e', '#fbf3fa', '#dcb8d6']
  }
]

const storageKey = 'loveDiary_theme'

export const getStoredTheme = () => {
  try {
    return {
      id: 'rose',
      customColor: '#d95f78',
      customBackground: '',
      backgroundOpacity: 0.16,
      cardStyle: 'round',
      chatStyle: 'round',
      navStyle: 'glass',
      decorations: true,
      ...JSON.parse(localStorage.getItem(storageKey) || '{}')
    }
  } catch {
    return {
      id: 'rose',
      customColor: '#d95f78',
      customBackground: '',
      backgroundOpacity: 0.16,
      cardStyle: 'round',
      chatStyle: 'round',
      navStyle: 'glass',
      decorations: true
    }
  }
}

export const applyTheme = config => {
  const root = document.documentElement
  const theme = themeOptions.find(item => item.id === config.id) || themeOptions[0]
  root.dataset.theme = config.id || 'rose'
  root.dataset.cardStyle = config.cardStyle || 'round'
  root.dataset.chatStyle = config.chatStyle || 'round'
  root.dataset.navStyle = config.navStyle || 'glass'
  root.dataset.decorations = config.decorations === false ? 'off' : 'on'
  root.style.setProperty('--theme-primary', config.id === 'custom' ? config.customColor : theme.colors[0])
  root.style.setProperty('--theme-soft', config.id === 'custom' ? '#fff5f7' : theme.colors[1])
  root.style.setProperty('--theme-accent', config.id === 'custom' ? config.customColor : theme.colors[2])
  root.style.setProperty('--theme-background-image', config.customBackground ? `url("${config.customBackground}")` : 'none')
  root.style.setProperty('--theme-background-opacity', String(config.backgroundOpacity ?? 0.16))
}

export const saveTheme = config => {
  localStorage.setItem(storageKey, JSON.stringify(config))
  applyTheme(config)
}

export const initTheme = () => applyTheme(getStoredTheme())
