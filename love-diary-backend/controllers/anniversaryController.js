const { query } = require('../config/db');

const getAnniversaries = async (req, res) => {
  try {
    const anniversaries = await query(
      'SELECT id, name, date, type, created_at FROM anniversaries WHERE user_id = ? ORDER BY date ASC',
      [req.user.id]
    );

    const today = new Date();
    const result = anniversaries.map(item => {
      const anniversaryDate = new Date(item.date);
      anniversaryDate.setFullYear(today.getFullYear());
      
      if (anniversaryDate < today) {
        anniversaryDate.setFullYear(today.getFullYear() + 1);
      }
      
      const daysLeft = Math.ceil((anniversaryDate - today) / (1000 * 60 * 60 * 24));
      
      return { ...item, daysLeft };
    });

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

const createAnniversary = async (req, res) => {
  try {
    const { name, date, type } = req.body;

    if (!name || !date) {
      return res.status(400).json({ message: '请填写名称和日期' });
    }

    const result = await query(
      'INSERT INTO anniversaries (user_id, name, date, type) VALUES (?, ?, ?, ?)',
      [req.user.id, name, date, type || 'custom']
    );

    const anniversary = await query('SELECT * FROM anniversaries WHERE id = ?', [result.insertId]);
    return res.status(201).json({ message: '创建成功', anniversary: anniversary[0] });
  } catch (error) {
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

const updateAnniversary = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, date, type } = req.body;

    const existing = await query('SELECT id FROM anniversaries WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ message: '纪念日不存在' });
    }

    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (date !== undefined) {
      updates.push('date = ?');
      params.push(date);
    }
    if (type !== undefined) {
      updates.push('type = ?');
      params.push(type);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: '没有更新内容' });
    }

    params.push(id);
    await query(`UPDATE anniversaries SET ${updates.join(', ')} WHERE id = ?`, params);

    const anniversary = await query('SELECT * FROM anniversaries WHERE id = ?', [id]);
    return res.json({ message: '更新成功', anniversary: anniversary[0] });
  } catch (error) {
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

const deleteAnniversary = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await query('SELECT id FROM anniversaries WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ message: '纪念日不存在' });
    }

    await query('DELETE FROM anniversaries WHERE id = ?', [id]);
    return res.json({ message: '删除成功' });
  } catch (error) {
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

module.exports = {
  getAnniversaries,
  createAnniversary,
  updateAnniversary,
  deleteAnniversary
};