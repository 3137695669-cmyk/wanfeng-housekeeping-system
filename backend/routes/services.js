const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../database');

// 配置文件上传（服务图标）
const iconDir = path.join(__dirname, '..', 'uploads', 'icons');
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: iconDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.params.id}_${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
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
    const services = await db.all('SELECT * FROM services ORDER BY id');
    res.json(services.map(s => ({
      ...s,
      price_unit: s.price_unit
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const service = await db.get('SELECT * FROM services WHERE id = ?', [req.params.id]);
    if (!service) {
      return res.status(404).json({ error: '服务不存在' });
    }
    res.json(service);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, icon, description, price, price_unit } = req.body;
    await db.run(
      'UPDATE services SET name = ?, icon = ?, description = ?, price = ?, price_unit = ? WHERE id = ?',
      [name, icon, description, price, price_unit, req.params.id]
    );
    res.json({ success: true, message: '服务更新成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/services/:id/icon-upload — 上传服务图标
router.post('/:id/icon-upload', upload.single('icon'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请选择图片文件' });
    }

    const service = await db.get('SELECT id FROM services WHERE id = ?', [req.params.id]);
    if (!service) {
      return res.status(404).json({ error: '服务不存在' });
    }

    const filePath = 'icons/' + req.file.filename;
    await db.run('UPDATE services SET icon = ? WHERE id = ?', [filePath, req.params.id]);

    res.json({ success: true, icon: filePath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Multer 错误处理
router.use('/:id/icon-upload', (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: '图片大小不能超过 10MB' });
    }
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

module.exports = router;
