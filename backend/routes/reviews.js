const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', async (req, res) => {
  try {
    const { service } = req.query;
    let sql = 'SELECT * FROM reviews ORDER BY created_at DESC';
    let params = [];
    
    if (service) {
      sql = 'SELECT * FROM reviews WHERE service = ? ORDER BY created_at DESC';
      params = [service];
    }
    
    const reviews = await db.all(sql, params);
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const reviews = await db.all('SELECT stars FROM reviews');
    const totalReviews = reviews.length;
    const avgRating = totalReviews > 0 
      ? (reviews.reduce((sum, r) => sum + r.stars, 0) / totalReviews).toFixed(1) 
      : 0;
    
    const stats = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      stats[r.stars]++;
    });

    res.json({ totalReviews, avgRating, stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, text, stars, service, staffId } = req.body;
    
    if (!text || !stars) {
      return res.status(400).json({ error: '请填写评价内容和评分' });
    }

    const avatar = (name || '匿名').charAt(0);
    let staffName = null;
    
    if (staffId) {
      const staff = await db.get('SELECT name FROM staff WHERE id = ?', [staffId]);
      staffName = staff ? staff.name : null;
    }

    const result = await db.run(
      'INSERT INTO reviews (name, avatar, text, stars, service, staff_id, staff_name, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name || '匿名', avatar, text, stars, service || '未指定', staffId || null, staffName || null, new Date().toISOString().split('T')[0]]
    );

    res.json({ success: true, reviewId: result.lastID, message: '评价发表成功！感谢您的反馈' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
