const { query } = require('../config/db');

const checkin = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const existing = await query(
      'SELECT id FROM checkins WHERE user_id = ? AND date = ?',
      [req.user.id, today]
    );

    if (existing.length > 0) {
      return res.json({ success: false, message: '今日已打卡' });
    }

    await query(
      'INSERT INTO checkins (user_id, date) VALUES (?, ?)',
      [req.user.id, today]
    );

    const streak = await calculateStreak(req.user.id);
    return res.json({ success: true, streak, message: '打卡成功' });
  } catch (error) {
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

const getHistory = async (req, res) => {
  try {
    const history = await query(
      'SELECT date FROM checkins WHERE user_id = ? ORDER BY date DESC',
      [req.user.id]
    );

    return res.json({ data: history.map(h => h.date) });
  } catch (error) {
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

const getStats = async (req, res) => {
  try {
    const stats = await query(
      'SELECT COUNT(*) AS total FROM checkins WHERE user_id = ?',
      [req.user.id]
    );

    const total = stats[0].total || 0;
    const streak = await calculateStreak(req.user.id);

    return res.json({ total, streak });
  } catch (error) {
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

const calculateStreak = async (userId) => {
  const history = await query(
    'SELECT date FROM checkins WHERE user_id = ? ORDER BY date DESC',
    [userId]
  );

  if (history.length === 0) return 0;

  const today = new Date();
  let streak = 0;

  for (let i = 0; i < history.length; i++) {
    const checkinDate = new Date(history[i].date);
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);

    if (checkinDate.toDateString() === expectedDate.toDateString()) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};

module.exports = {
  checkin,
  getHistory,
  getStats
};