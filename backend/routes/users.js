const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../database');

// 配置文件上传
const uploadDir = path.join(__dirname, '..', 'uploads', 'backgrounds');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.params.id}_${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|bmp)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('仅支持 jpg/png/gif/webp/bmp 格式的图片'));
    }
  }
});

router.get('/', async (req, res) => {
  try {
    const users = await db.all('SELECT id, name, phone, address, created_at FROM users');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const user = await db.get('SELECT id, name, phone, address, created_at FROM users WHERE id = ?', [req.params.id]);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { name, phone, password, address, preferences } = req.body;
    
    if (!name || !phone || !password) {
      return res.status(400).json({ error: '姓名、手机号和密码必填' });
    }

    const result = await db.run(
      'INSERT INTO users (name, phone, password, address, preferences) VALUES (?, ?, ?, ?, ?)',
      [name, phone, password, address || '', JSON.stringify(preferences || [])]
    );

    res.json({ success: true, userId: result.lastID, message: '注册成功' });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      res.status(400).json({ error: '该手机号已注册' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    const user = await db.get('SELECT * FROM users WHERE phone = ? AND password = ?', [phone, password]);
    
    if (!user) {
      return res.status(401).json({ error: '手机号或密码错误' });
    }

    res.json({ success: true, user: { id: user.id, name: user.name, phone: user.phone, address: user.address, background: user.background || 'maple' } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id/background — 更新用户背景主题
const VALID_THEMES = ['maple', 'mint', 'sakura', 'ocean', 'galaxy', 'pure'];

router.put('/:id/background', async (req, res) => {
  try {
    const { background } = req.body;

    if (!background || !VALID_THEMES.includes(background)) {
      return res.status(400).json({ error: '无效的背景主题' });
    }

    const user = await db.get('SELECT id FROM users WHERE id = ?', [req.params.id]);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    await db.run('UPDATE users SET background = ? WHERE id = ?', [background, req.params.id]);
    res.json({ success: true, background });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/:id/background/upload — 上传自定义背景图片
router.post('/:id/background/upload', upload.single('background'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请选择图片文件' });
    }

    const user = await db.get('SELECT id FROM users WHERE id = ?', [req.params.id]);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const filePath = 'backgrounds/' + req.file.filename;
    await db.run('UPDATE users SET background = ? WHERE id = ?', [filePath, req.params.id]);

    res.json({ success: true, background: filePath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Multer 错误处理
router.use('/:id/background/upload', (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: '图片大小不能超过 5MB' });
    }
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

// DELETE /api/users/:id — 注销账号
router.delete('/:id', async (req, res) => {
  try {
    const user = await db.get('SELECT id FROM users WHERE id = ?', [req.params.id]);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    await db.run('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: '账号已注销' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
