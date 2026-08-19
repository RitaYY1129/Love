export const getStorage = (key, defaultValue = null) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : defaultValue;
  } catch (e) {
    console.error('getStorage error:', e);
    return defaultValue;
  }
};

export const setStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error('setStorage error:', e);
    return false;
  }
};

export const removeStorage = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    console.error('removeStorage error:', e);
    return false;
  }
};

export const clearStorage = (prefix = '') => {
  try {
    const keys = prefix 
      ? Object.keys(localStorage).filter(k => k.startsWith(prefix))
      : Object.keys(localStorage);
    keys.forEach(k => localStorage.removeItem(k));
    return true;
  } catch (e) {
    console.error('clearStorage error:', e);
    return false;
  }
};

export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const throttle = (func, limit = 300) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

export default {
  get: getStorage,
  set: setStorage,
  remove: removeStorage,
  clear: clearStorage,
  debounce,
  throttle
};