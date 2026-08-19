const STORAGE_PREFIX = 'loveDiary_';

export const StorageAdapter = {
  getItem: (key) => {
    try {
      const value = localStorage.getItem(STORAGE_PREFIX + key);
      return value ? JSON.parse(value) : null;
    } catch (e) {
      console.error('Storage getItem error:', e);
      return null;
    }
  },

  setItem: (key, value) => {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage setItem error:', e);
      return false;
    }
  },

  removeItem: (key) => {
    try {
      localStorage.removeItem(STORAGE_PREFIX + key);
      return true;
    } catch (e) {
      console.error('Storage removeItem error:', e);
      return false;
    }
  },

  clear: () => {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_PREFIX));
      keys.forEach(k => localStorage.removeItem(k));
      return true;
    } catch (e) {
      console.error('Storage clear error:', e);
      return false;
    }
  },

  getAllKeys: () => {
    try {
      return Object.keys(localStorage).filter(k => k.startsWith(STORAGE_PREFIX));
    } catch (e) {
      console.error('Storage getAllKeys error:', e);
      return [];
    }
  }
};

export default StorageAdapter;