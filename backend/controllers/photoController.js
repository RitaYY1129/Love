const { query } = require('../config/db');

const getPhotos = async (req, res) => {
  try {
    const photos = await query(
      'SELECT id, url, title, description, created_at FROM photos WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );

    return res.json(photos);
  } catch (error) {
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

const uploadPhoto = async (req, res) => {
  try {
    const { url, title, description } = req.body;

    if (!url) {
      return res.status(400).json({ message: '请提供图片URL' });
    }

    const result = await query(
      'INSERT INTO photos (user_id, url, title, description) VALUES (?, ?, ?, ?)',
      [req.user.id, url, title || '', description || '']
    );

    const photo = await query('SELECT * FROM photos WHERE id = ?', [result.insertId]);
    return res.status(201).json({ message: '上传成功', photo: photo[0] });
  } catch (error) {
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

const updatePhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    const existing = await query('SELECT id FROM photos WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ message: '照片不存在' });
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

    if (updates.length === 0) {
      return res.status(400).json({ message: '没有更新内容' });
    }

    params.push(id);
    await query(`UPDATE photos SET ${updates.join(', ')} WHERE id = ?`, params);

    const photo = await query('SELECT * FROM photos WHERE id = ?', [id]);
    return res.json({ message: '更新成功', photo: photo[0] });
  } catch (error) {
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

const deletePhoto = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await query('SELECT id FROM photos WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ message: '照片不存在' });
    }

    await query('DELETE FROM photos WHERE id = ?', [id]);
    return res.json({ message: '删除成功' });
  } catch (error) {
    return res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

module.exports = {
  getPhotos,
  uploadPhoto,
  updatePhoto,
  deletePhoto
};