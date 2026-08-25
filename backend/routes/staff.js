const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../database');

// 配置文件上传（员工头像）
const photoDir = path.join(__dirname, '..', 'uploads', 'photos');
if (!fs.existsSync(photoDir)) {
  fs.mkdirSync(photoDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: photoDir,
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

// 测试路由
router.get('/test-route', (req, res) => {
  res.json({ ok: true, message: 'staff router is working' });
});

router.get('/', async (req, res) => {
  try {
    const staff = await db.all('SELECT * FROM staff ORDER BY orders DESC');
    const staffWithTags = staff.map(s => ({
      ...s,
      tags: JSON.parse(s.tags || '[]')
    }));
    res.json(staffWithTags);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const staff = await db.get('SELECT * FROM staff WHERE id = ?', [req.params.id]);
    if (!staff) {
      return res.status(404).json({ error: '员工不存在' });
    }
    res.json({
      ...staff,
      tags: JSON.parse(staff.tags || '[]')
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { phone, password, id } = req.body;

    let staff = null;

    // 支持手机号登录
    if (phone) {
      staff = await db.get('SELECT * FROM staff WHERE phone = ? AND password = ?', [phone, password || '888888']);
    } else if (id) {
      staff = await db.get('SELECT * FROM staff WHERE id = ? AND password = ?', [id, password || '888888']);
    }

    if (!staff) {
      return res.status(401).json({ error: '账号或密码错误' });
    }

    res.json({
      success: true,
      staff: {
        id: staff.id,
        name: staff.name,
        role: staff.role,
        phone: staff.phone,
        photo: staff.photo,
        display_photo: staff.display_photo || '',
        badge: staff.badge,
        tags: JSON.parse(staff.tags || '[]'),
        orders: staff.orders,
        rate: staff.rate
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/rate', async (req, res) => {
  try {
    const { stars } = req.body;
    const staff = await db.get('SELECT * FROM staff WHERE id = ?', [req.params.id]);

    if (!staff) {
      return res.status(404).json({ error: '员工不存在' });
    }

    const newRate = ((staff.rate * staff.orders) + stars) / (staff.orders + 1);
    await db.run('UPDATE staff SET rate = ?, orders = orders + 1 WHERE id = ?', [Math.round(newRate * 10) / 10, req.params.id]);

    res.json({ success: true, newRate: Math.round(newRate * 10) / 10 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/staff/:id/photo-upload — 上传员工头像
router.post('/:id/photo-upload', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请选择图片文件' });
    }

    const staff = await db.get('SELECT id FROM staff WHERE id = ?', [req.params.id]);
    if (!staff) {
      return res.status(404).json({ error: `员工不存在 (ID: ${req.params.id})` });
    }

    const filePath = 'photos/' + req.file.filename;
    await db.run('UPDATE staff SET photo = ? WHERE id = ?', [filePath, req.params.id]);

    res.json({ success: true, photo: filePath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Multer 错误处理
router.use('/:id/photo-upload', (err, req, res, next) => {
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

// POST /api/staff/register — 家政师傅注册
const VALID_ROLES = [
  '金牌月嫂', '月嫂/育儿嫂', '资深保洁', '深度保洁',
  '养老护理', '家电清洗', '收纳整理师', '其他'
];

router.post('/register', async (req, res) => {
  try {
    const { name, phone, password, role, tags } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ error: '姓名、手机号和密码必填' });
    }

    // 手机号唯一检查
    const existing = await db.get('SELECT id FROM staff WHERE phone = ?', [phone]);
    if (existing) {
      return res.status(400).json({ error: '该手机号已注册' });
    }

    const result = await db.run(
      `INSERT INTO staff (name, role, photo, badge, tags, orders, rate, years, phone, password)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        role || '其他',
        '👨‍🔧',
        '新人',
        JSON.stringify(tags || []),
        0,
        5.0,
        1,
        phone,
        password
      ]
    );

    res.json({
      success: true,
      staffId: result.lastID,
      message: '注册成功！管理员审核通过后即可登录接单'
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: '该手机号已注册' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

module.exports = router;
