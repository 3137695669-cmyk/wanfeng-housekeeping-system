const express = require('express');
const router = express.Router();
const db = require('../database');

// GET /api/settings/about — 获取关于我们所有数据
router.get('/about', async (req, res) => {
  try {
    const rows = await db.all("SELECT key_name, value FROM settings WHERE key_name LIKE 'about_%'");
    const data = {};
    rows.forEach(r => { data[r.key_name] = r.value; });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/settings/about — 批量更新关于我们文本
router.put('/about', async (req, res) => {
  try {
    const updates = req.body;
    for (const [key, value] of Object.entries(updates)) {
      if (key.startsWith('about_') && key !== 'about_image') {
        await db.run(
          'INSERT INTO settings (key_name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?',
          [key, value, value]
        );
      }
    }
    res.json({ success: true, message: '关于我们内容已更新' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
