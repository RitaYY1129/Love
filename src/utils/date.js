export const formatDate = (date, format = 'YYYY-MM-DD') => {
  const d = date instanceof Date ? date : new Date(date);
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hour)
    .replace('mm', minute);
};

export const today = () => {
  return formatDate(new Date());
};

export const calcDaysBetween = (startDate, endDate = new Date()) => {
  const start = new Date(startDate);
  const end = endDate instanceof Date ? endDate : new Date(endDate);
  const diffTime = Math.abs(end - start);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

export const daysUntil = (targetDate) => {
  const target = new Date(targetDate);
  const now = new Date();
  target.setFullYear(now.getFullYear());
  if (target < now) {
    target.setFullYear(now.getFullYear() + 1);
  }
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
};

export const isToday = (dateStr) => {
  return dateStr === today();
};

export const getWeekDays = () => {
  return ['日', '一', '二', '三', '四', '五', '六'];
};

export const getMonthDays = (year, month) => {
  return new Date(year, month, 0).getDate();
};

export const getRelativeTime = (timestamp) => {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  
  if (diff < minute) return '刚刚';
  if (diff < hour) return `${Math.floor(diff / minute)}分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)}小时前`;
  if (diff < week) return `${Math.floor(diff / day)}天前`;
  
  return formatDate(new Date(timestamp));
};

export default {
  formatDate,
  today,
  calcDaysBetween,
  daysUntil,
  isToday,
  getWeekDays,
  getMonthDays,
  getRelativeTime
};