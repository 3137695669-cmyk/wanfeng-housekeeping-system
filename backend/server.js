require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('./database');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务（用户上传的背景图片）
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==================== 文件上传配置 ====================
// 员工头像上传
const photoDir = path.join(__dirname, 'uploads', 'photos');
if (!fs.existsSync(photoDir)) { fs.mkdirSync(photoDir, { recursive: true }); }
const photoStorage = multer.diskStorage({
  destination: photoDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.body.id || 'unknown'}_${Date.now()}${ext}`);
  }
});
const photoUpload = multer({
  storage: photoStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|bmp)$/i;
    cb(allowed.test(path.extname(file.originalname)) ? null : new Error('仅支持 jpg/png/gif/webp/bmp'), allowed.test(path.extname(file.originalname)));
  }
});

// 服务图标上传
const iconDir = path.join(__dirname, 'uploads', 'icons');
if (!fs.existsSync(iconDir)) { fs.mkdirSync(iconDir, { recursive: true }); }
const iconStorage = multer.diskStorage({
  destination: iconDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.body.id || '0'}_${Date.now()}${ext}`);
  }
});
const iconUpload = multer({
  storage: iconStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|bmp)$/i;
    cb(allowed.test(path.extname(file.originalname)) ? null : new Error('仅支持 jpg/png/gif/webp/bmp'), allowed.test(path.extname(file.originalname)));
  }
});

// 关于我们图片上传
const aboutDir = path.join(__dirname, 'uploads', 'about');
if (!fs.existsSync(aboutDir)) { fs.mkdirSync(aboutDir, { recursive: true }); }
const aboutStorage = multer.diskStorage({
  destination: aboutDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `about_${Date.now()}${ext}`);
  }
});
const aboutUpload = multer({
  storage: aboutStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|bmp)$/i;
    cb(allowed.test(path.extname(file.originalname)) ? null : new Error('仅支持 jpg/png/gif/webp/bmp'), allowed.test(path.extname(file.originalname)));
  }
});

// ==================== 上传 API（直接注册在 app 上，确保路由稳定） ====================

// 员工头像上传 POST /api/staff/photo-upload
app.post('/api/staff/photo-upload', (req, res, next) => {
  photoUpload.single('photo')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE')
        return res.status(400).json({ error: '图片大小不能超过 10MB' });
      return res.status(400).json({ error: err.message || '上传失败' });
    }
    next();
  });
}, async (req, res) => {
  try {
    const id = req.body.id;
    if (!id) return res.status(400).json({ error: '缺少员工ID' });
    if (!req.file) return res.status(400).json({ error: '请选择图片文件' });

    const staff = await db.get('SELECT id FROM staff WHERE id = ?', [id]);
    if (!staff) return res.status(404).json({ error: `员工不存在 (ID: ${id})` });

    const filePath = 'photos/' + req.file.filename;
    await db.run('UPDATE staff SET photo = ? WHERE id = ?', [filePath, id]);
    res.json({ success: true, photo: filePath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 员工展示图片上传 POST /api/staff/display-photo-upload
app.post('/api/staff/display-photo-upload', (req, res, next) => {
  photoUpload.single('display_photo')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE')
        return res.status(400).json({ error: '图片大小不能超过 10MB' });
      return res.status(400).json({ error: err.message || '上传失败' });
    }
    next();
  });
}, async (req, res) => {
  try {
    const id = req.body.id;
    if (!id) return res.status(400).json({ error: '缺少员工ID' });
    if (!req.file) return res.status(400).json({ error: '请选择图片文件' });

    const staff = await db.get('SELECT id FROM staff WHERE id = ?', [id]);
    if (!staff) return res.status(404).json({ error: `员工不存在 (ID: ${id})` });

    const filePath = 'photos/' + req.file.filename;
    await db.run('UPDATE staff SET display_photo = ? WHERE id = ?', [filePath, id]);
    res.json({ success: true, display_photo: filePath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 服务图标上传 POST /api/services/icon-upload
app.post('/api/services/icon-upload', (req, res, next) => {
  iconUpload.single('icon')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE')
        return res.status(400).json({ error: '图片大小不能超过 10MB' });
      return res.status(400).json({ error: err.message || '上传失败' });
    }
    next();
  });
}, async (req, res) => {
  try {
    const id = req.body.id;
    if (!id) return res.status(400).json({ error: '缺少服务ID' });
    if (!req.file) return res.status(400).json({ error: '请选择图片文件' });

    const service = await db.get('SELECT id FROM services WHERE id = ?', [id]);
    if (!service) return res.status(404).json({ error: `服务不存在 (ID: ${id})` });

    const filePath = 'icons/' + req.file.filename;
    await db.run('UPDATE services SET icon = ? WHERE id = ?', [filePath, id]);
    res.json({ success: true, icon: filePath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 关于我们图片上传 POST /api/settings/about/image
app.post('/api/settings/about/image', (req, res, next) => {
  aboutUpload.single('image')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE')
        return res.status(400).json({ error: '图片大小不能超过 10MB' });
      return res.status(400).json({ error: err.message || '上传失败' });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: '请选择图片文件' });
    const filePath = 'about/' + req.file.filename;
    await db.run(
      "INSERT INTO settings (key_name, value) VALUES ('about_image', ?) ON DUPLICATE KEY UPDATE value = ?",
      [filePath, filePath]
    );
    res.json({ success: true, image: filePath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== API 路由 ====================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '晚枫家政服务系统后端正常运行' });
});

app.use('/api/users', require('./routes/users'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/services', require('./routes/services'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/migrate', require('./routes/migrate'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/settings', require('./routes/settings'));

// ==================== 前端静态文件托管 ====================
// 如果前端已构建（frontend/dist 存在），则托管前端页面
// 这样只需启动后端，访问 http://localhost:3000 即可使用完整系统
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  // SPA 回退：非 API 请求全部返回 index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  // 前端未构建时，根路径返回友好提示
  app.get('/', (req, res) => {
    res.json({
      status: 'ok',
      message: '晚枫家政服务系统后端运行中',
      tip: '前端尚未构建，请在 frontend 目录运行 npm run build，或使用 npm run dev 启动开发服务器',
      api: '/api/health',
      admin: '/api/admin/login'
    });
  });
}

// ==================== 启动服务 ====================
// 先启动 HTTP 服务（即使数据库未就绪，前端页面也能正常访问）
app.listen(PORT, () => {
  console.log(`🍁 晚枫家政服务系统后端已启动`);
  console.log(`📍 服务地址: http://localhost:${PORT}`);
  if (fs.existsSync(frontendDist)) {
    console.log(`🌐 前端页面: http://localhost:${PORT}`);
  }
});

// 数据库初始化（异步进行，失败不影响 HTTP 服务）
db.init().then(() => {
  console.log(`✅ 数据库已就绪，API 接口可用`);
  console.log(`💻 API 健康检查: http://localhost:${PORT}/api/health`);
}).catch(err => {
  console.error('❌ 数据库初始化失败，API 接口将不可用');
  console.error('   错误:', err.message);
  console.error('   请检查:');
  console.error('   1. MySQL 服务是否已启动');
  console.error('   2. backend\\.env 中的数据库配置是否正确');
  console.error('   3. 数据库 wanfeng 是否已创建');
  console.error('   前端页面仍可正常访问，但数据相关功能不可用');
});
