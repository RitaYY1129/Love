const { query } = require('../config/db');

const getDiaries = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const diaries = await query(
      'SELECT id, title, content, created_at, updated_at FROM diaries WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [req.user.id, parseInt(limit), parseInt(offset)]
    );

    const total = await query('SELECT COUNT(*) AS count FROM diaries WHERE user_id = ?', [req.user.id]);

    return res.json({ data: diaries, total: total[0].count });
  } catch (error) {
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

const getDiary = async (req, res) => {
  try {
    const { id } = req.params;
    
    const diary = await query(
      'SELECT id, title, content, created_at, updated_at FROM diaries WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    if (!diary || diary.length === 0) {
      return res.status(404).json({ message: '日记不存在' });
    }

    return res.json(diary[0]);
  } catch (error) {
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

const createDiary = async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!content) {
      return res.status(400).json({ message: '请填写日记内容' });
    }

    const result = await query(
      'INSERT INTO diaries (user_id, title, content) VALUES (?, ?, ?)',
      [req.user.id, title || '', content]
    );

    const diary = await query('SELECT * FROM diaries WHERE id = ?', [result.insertId]);
    return res.status(201).json({ message: '创建成功', diary: diary[0] });
  } catch (error) {
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

const updateDiary = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    const existing = await query('SELECT id FROM diaries WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ message: '日记不存在' });
    }

    const updates = [];
    const params = [];

    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title);
    }
    if (content !== undefined) {
      updates.push('content = ?');
      params.push(content);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: '没有更新内容' });
    }

    params.push(id);
    await query(`UPDATE diaries SET ${updates.join(', ')} WHERE id = ?`, params);

    const diary = await query('SELECT * FROM diaries WHERE id = ?', [id]);
    return res.json({ message: '更新成功', diary: diary[0] });
  } catch (error) {
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

const deleteDiary = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await query('SELECT id FROM diaries WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ message: '日记不存在' });
    }

    await query('DELETE FROM diaries WHERE id = ?', [id]);
    return res.json({ message: '删除成功' });
  } catch (error) {
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

module.exports = {
  getDiaries,
  getDiary,
  createDiary,
  updateDiary,
  deleteDiary
};