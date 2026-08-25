const express = require('express');
const router = express.Router();
const db = require('../database');

const ADMIN_USER = 'admin';
const ADMIN_PASS = 'wanfeng2025';

// POST /api/admin/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    res.json({ success: true, message: '管理员登录成功' });
  } else {
    res.status(401).json({ error: '账号或密码错误' });
  }
});

// GET /api/admin/stats — 全部统计数据
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      totalStaff,
      totalBookings,
      totalReviews,
      bookingsByStatus,
      bookingsByService,
      topStaff,
      avgRating,
      totalRevenue
    ] = await Promise.all([
      db.get('SELECT COUNT(*) as count FROM users'),
      db.get('SELECT COUNT(*) as count FROM staff'),
      db.get('SELECT COUNT(*) as count FROM bookings'),
      db.get('SELECT COUNT(*) as count FROM reviews'),
      db.all(
        `SELECT status, COUNT(*) as count FROM bookings GROUP BY status`
      ),
      db.all(
        `SELECT service, COUNT(*) as count, SUM(COALESCE(price,0)) as revenue
         FROM bookings GROUP BY service ORDER BY count DESC`
      ),
      db.all(
        `SELECT id, name, role, rate, orders
         FROM staff ORDER BY orders DESC LIMIT 5`
      ),
      db.get(
        `SELECT COALESCE(ROUND(AVG(stars), 1), 0) as avg FROM reviews`
      ),
      db.get(
        `SELECT COALESCE(SUM(COALESCE(price,0)), 0) as total
         FROM bookings WHERE status = 'completed'`
      )
    ]);

    // 构建状态分布
    const statusMap = { new: 0, claimed: 0, completed: 0, cancelled: 0 };
    bookingsByStatus.forEach(s => { statusMap[s.status] = s.count; });

    res.json({
      totalUsers: totalUsers.count,
      totalStaff: totalStaff.count,
      totalBookings: totalBookings.count,
      totalReviews: totalReviews.count,
      bookingsByStatus: statusMap,
      bookingsByService: bookingsByService.map(s => ({
        service: s.service,
        count: s.count,
        revenue: s.revenue
      })),
      topStaff: topStaff.map(s => ({
        id: s.id, name: s.name, role: s.role, rate: s.rate, orders: s.orders
      })),
      avgRating: avgRating.avg,
      totalRevenue: totalRevenue.total
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
