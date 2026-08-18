const { query } = require('../config/db');

const getPlans = async (req, res) => {
  try {
    const plans = await query(
      'SELECT id, title, description, target_date, completed, completed_at, created_at FROM plans WHERE user_id = ? ORDER BY target_date ASC, created_at DESC',
      [req.user.id]
    );

    return res.json(plans);
  } catch (error) {
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

const createPlan = async (req, res) => {
  try {
    const { title, description, targetDate } = req.body;

    if (!title) {
      return res.status(400).json({ message: '请填写计划标题' });
    }

    const result = await query(
      'INSERT INTO plans (user_id, title, description, target_date) VALUES (?, ?, ?, ?)',
      [req.user.id, title, description || '', targetDate || null]
    );

    const plan = await query('SELECT * FROM plans WHERE id = ?', [result.insertId]);
    return res.status(201).json({ message: '创建成功', plan: plan[0] });
  } catch (error) {
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, targetDate } = req.body;

    const existing = await query('SELECT id FROM plans WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ message: '计划不存在' });
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
    await query(`UPDATE plans SET ${updates.join(', ')} WHERE id = ?`, params);

    const plan = await query('SELECT * FROM plans WHERE id = ?', [id]);
    return res.json({ message: '更新成功', plan: plan[0] });
  } catch (error) {
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await query('SELECT id FROM plans WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ message: '计划不存在' });
    }

    await query('DELETE FROM plans WHERE id = ?', [id]);
    return res.json({ message: '删除成功' });
  } catch (error) {
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

const completePlan = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await query('SELECT id, completed FROM plans WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ message: '计划不存在' });
    }

    const completed = !existing[0].completed;
    await query(
      'UPDATE plans SET completed = ?, completed_at = ? WHERE id = ?',
      [completed, completed ? new Date().toISOString() : null, id]
    );

    const plan = await query('SELECT * FROM plans WHERE id = ?', [id]);
    return res.json({ message: completed ? '已完成' : '未完成', plan: plan[0] });
  } catch (error) {
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

module.exports = {
  getPlans,
  createPlan,
  updatePlan,
  deletePlan,
  completePlan
};