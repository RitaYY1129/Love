import StorageAdapter from './adapter';

const DATA_KEYS = {
  DIARY: 'entries',
  MOOD: 'mood',
  CHECKIN: 'checkin',
  WISH: 'wishes',
  FINANCE: 'finance',
  ANNIVERSARY: 'anniversaries',
  PHOTO: 'photos',
  QUIZ: 'quiz',
  USER: 'users',
  SESSION: 'session',
  CONFIG: 'config'
};

export const DataStore = {
  get: (key) => {
    return StorageAdapter.getItem(DATA_KEYS[key] || key);
  },

  set: (key, value) => {
    return StorageAdapter.setItem(DATA_KEYS[key] || key, value);
  },

  remove: (key) => {
    return StorageAdapter.removeItem(DATA_KEYS[key] || key);
  },

  diary: {
    get: () => DataStore.get('DIARY') || [],
    set: (items) => DataStore.set('DIARY', items),
    add: (item) => {
      const items = DataStore.diary.get();
      items.push({ ...item, id: Date.now(), createdAt: Date.now() });
      DataStore.diary.set(items);
      return items;
    },
    update: (id, data) => {
      const items = DataStore.diary.get();
      const index = items.findIndex(i => i.id === id);
      if (index !== -1) {
        items[index] = { ...items[index], ...data, updatedAt: Date.now() };
        DataStore.diary.set(items);
      }
      return items;
    },
    delete: (id) => {
      const items = DataStore.diary.get();
      const filtered = items.filter(i => i.id !== id);
      DataStore.diary.set(filtered);
      return filtered;
    }
  },

  mood: {
    get: () => DataStore.get('MOOD') || [],
    set: (items) => DataStore.set('MOOD', items),
    add: (item) => {
      const items = DataStore.mood.get();
      items.push({ ...item, id: Date.now(), createdAt: Date.now() });
      DataStore.mood.set(items);
      return items;
    },
    getToday: () => {
      const items = DataStore.mood.get();
      const today = new Date().toISOString().split('T')[0];
      return items.find(i => i.date === today) || null;
    }
  },

  checkin: {
    get: () => DataStore.get('CHECKIN') || { history: [], streak: 0 },
    set: (data) => DataStore.set('CHECKIN', data),
    addToday: () => {
      const data = DataStore.checkin.get();
      const today = new Date().toISOString().split('T')[0];
      if (!data.history.includes(today)) {
        data.history.push(today);
        data.history.sort();
        DataStore.checkin.set(data);
      }
      return data;
    },
    getStreak: () => {
      const data = DataStore.checkin.get();
      if (!data.history || data.history.length === 0) return 0;
      
      let streak = 0;
      const today = new Date();
      for (let i = 0; i < 365; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        if (data.history.includes(dateStr)) {
          streak++;
        } else {
          break;
        }
      }
      return streak;
    }
  },

  wish: {
    get: () => DataStore.get('WISH') || [],
    set: (items) => DataStore.set('WISH', items),
    add: (item) => {
      const items = DataStore.wish.get();
      items.push({ ...item, id: Date.now(), done: false, createdAt: Date.now() });
      DataStore.wish.set(items);
      return items;
    },
    toggle: (id) => {
      const items = DataStore.wish.get();
      const index = items.findIndex(i => i.id === id);
      if (index !== -1) {
        items[index].done = !items[index].done;
        DataStore.wish.set(items);
      }
      return items;
    }
  },

  anniversary: {
    get: () => DataStore.get('ANNIVERSARY') || [],
    set: (items) => DataStore.set('ANNIVERSARY', items),
    add: (item) => {
      const items = DataStore.anniversary.get();
      items.push({ ...item, id: Date.now(), createdAt: Date.now() });
      DataStore.anniversary.set(items);
      return items;
    }
  },

  session: {
    get: () => DataStore.get('SESSION'),
    set: (data) => DataStore.set('SESSION', data),
    clear: () => DataStore.remove('SESSION')
  },

  config: {
    get: () => DataStore.get('CONFIG'),
    set: (data) => DataStore.set('CONFIG', data)
  }
};

export default DataStore;