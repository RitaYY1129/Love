const { query } = require('../config/db');

const getWishes = async (req, res) => {
  try {
    const wishes = await query(
      'SELECT id, title, description, target_date, completed, completed_at, created_at FROM wishes WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );

    return res.json(wishes);
  } catch (error) {
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

const createWish = async (req, res) => {
  try {
    const { title, description, targetDate } = req.body;

    if (!title) {
      return res.status(400).json({ message: '请填写愿望标题' });
    }

    const result = await query(
      'INSERT INTO wishes (user_id, title, description, target_date) VALUES (?, ?, ?, ?)',
      [req.user.id, title, description || '', targetDate || null]
    );

    const wish = await query('SELECT * FROM wishes WHERE id = ?', [result.insertId]);
    return res.status(201).json({ message: '创建成功', wish: wish[0] });
  } catch (error) {
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

const updateWish = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, targetDate } = req.body;

    const existing = await query('SELECT id FROM wishes WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ message: '愿望不存在' });
    }

    const updates = [];
    const params = [];

    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (targetDate !== undefined) {
      updates.push('target_date = ?');
      params.push(targetDate);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: '没有更新内容' });
    }

    params.push(id);
    await query(`UPDATE wishes SET ${updates.join(', ')} WHERE id = ?`, params);

    const wish = await query('SELECT * FROM wishes WHERE id = ?', [id]);
    return res.json({ message: '更新成功', wish: wish[0] });
  } catch (error) {
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

const deleteWish = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await query('SELECT id FROM wishes WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ message: '愿望不存在' });
    }

    await query('DELETE FROM wishes WHERE id = ?', [id]);
    return res.json({ message: '删除成功' });
  } catch (error) {
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

const completeWish = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await query('SELECT id, completed FROM wishes WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ message: '愿望不存在' });
    }

    const completed = !existing[0].completed;
    await query(
      'UPDATE wishes SET completed = ?, completed_at = ? WHERE id = ?',
      [completed, completed ? new Date().toISOString() : null, id]
    );

    const wish = await query('SELECT * FROM wishes WHERE id = ?', [id]);
    return res.json({ message: completed ? '已完成' : '未完成', wish: wish[0] });
  } catch (error) {
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

module.exports = {
  getWishes,
  createWish,
  updateWish,
  deleteWish,
  completeWish
};