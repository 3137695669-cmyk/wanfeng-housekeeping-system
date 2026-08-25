const express = require('express');
const router = express.Router();
const db = require('../database');

// POST /api/migrate/users — 从旧版 localStorage 导入用户数据
router.post('/users', async (req, res) => {
  try {
    const users = req.body;

    if (!Array.isArray(users)) {
      return res.status(400).json({ error: '数据格式错误，应为用户数组' });
    }

    let imported = 0;
    let skipped = 0;
    const errors = [];

    for (const u of users) {
      if (!u.phone || !u.name || !u.pwd) {
        errors.push(`跳过无效记录: ${JSON.stringify(u)}`);
        skipped++;
        continue;
      }

      try {
        // 检查手机号是否已存在
        const existing = await db.get(
          'SELECT id FROM users WHERE phone = ?',
          [u.phone]
        );

        if (existing) {
          skipped++;
          continue;
        }

        // 插入用户，字段映射: pwd→password, preferences数组→JSON字符串
        await db.run(
          `INSERT INTO users (name, phone, password, address, preferences)
           VALUES (?, ?, ?, ?, ?)`,
          [
            u.name,
            u.phone,
            u.pwd,
            u.address || '',
            JSON.stringify(u.preferences || [])
          ]
        );

        imported++;
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          skipped++;
        } else {
          errors.push(`${u.phone}: ${err.message}`);
          skipped++;
        }
      }
    }

    res.json({
      success: true,
      total: users.length,
      imported,
      skipped,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
