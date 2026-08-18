const { query } = require('../config/db');

const getMoods = async (req, res) => {
  try {
    const moods = await query(
      'SELECT id, score, emoji, note, date, created_at FROM moods WHERE user_id = ? ORDER BY date DESC',
      [req.user.id]
    );

    return res.json({ data: moods, total: moods.length });
  } catch (error) {
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

const createMood = async (req, res) => {
  try {
    const { score, emoji, note } = req.body;
    const today = new Date().toISOString().split('T')[0];

    if (!score || !emoji) {
      return res.status(400).json({ message: '请填写心情评分和表情' });
    }

    const existing = await query(
      'SELECT id FROM moods WHERE user_id = ? AND date = ?',
      [req.user.id, today]
    );

    if (existing.length > 0) {
      await query(
        'UPDATE moods SET score = ?, emoji = ?, note = ? WHERE id = ?',
        [score, emoji, note || '', existing[0].id]
      );
      const mood = await query('SELECT * FROM moods WHERE id = ?', [existing[0].id]);
      return res.json({ message: '更新成功', mood: mood[0] });
    }

    const result = await query(
      'INSERT INTO moods (user_id, score, emoji, note, date) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, score, emoji, note || '', today]
    );

    const mood = await query('SELECT * FROM moods WHERE id = ?', [result.insertId]);
    return res.status(201).json({ message: '记录成功', mood: mood[0] });
  } catch (error) {
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

const getMoodStats = async (req, res) => {
  try {
    const stats = await query(
      'SELECT COUNT(*) AS total, AVG(score) AS avg_score FROM moods WHERE user_id = ?',
      [req.user.id]
    );

    const total = stats[0].total || 0;
    const avgScore = total > 0 ? Math.round(stats[0].avg_score * 10) / 10 : 0;

    const topMood = await query(
      'SELECT emoji, COUNT(*) AS count FROM moods WHERE user_id = ? GROUP BY emoji ORDER BY count DESC LIMIT 1',
      [req.user.id]
    );

    const streakResult = await query(
      'SELECT date FROM moods WHERE user_id = ? ORDER BY date DESC',
      [req.user.id]
    );

    let streak = 0;
    if (streakResult.length > 0) {
      const today = new Date();
      for (let i = 0; i < streakResult.length; i++) {
        const moodDate = new Date(streakResult[i].date);
        const expectedDate = new Date(today);
        expectedDate.setDate(expectedDate.getDate() - i);
        
        if (moodDate.toDateString() === expectedDate.toDateString()) {
          streak++;
        } else {
          break;
        }
      }
    }

    return res.json({
      total,
      avgScore,
      topMood: topMood.length > 0 ? { emoji: topMood[0].emoji, label: getMoodLabel(topMood[0].emoji) } : null,
      streak
    });
  } catch (error) {
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

const getMoodLabel = (emoji) => {
  const labels = {
    '😄': '开心',
    '😊': '愉快',
    '😐': '一般',
    '😔': '难过',
    '😢': '伤心',
    '😤': '生气',
    '😍': '恋爱',
    '🥰': '幸福'
  };
  return labels[emoji] || '其他';
};

module.exports = {
  getMoods,
  createMood,
  getMoodStats
};