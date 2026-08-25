const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT * FROM bookings ORDER BY created_at DESC';
    let params = [];
    
    if (status) {
      sql = 'SELECT * FROM bookings WHERE status = ? ORDER BY created_at DESC';
      params = [status];
    }
    
    const bookings = await db.all(sql, params);
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/staff/:staffId', async (req, res) => {
  try {
    const { staffId } = req.params;
    const bookings = await db.all('SELECT * FROM bookings WHERE staff_id = ? ORDER BY created_at DESC', [staffId]);
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/bookings/user/:phone — 根据用户手机号查询订单
router.get('/user/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    const bookings = await db.all('SELECT * FROM bookings WHERE user_phone = ? ORDER BY created_at DESC', [phone]);
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, phone, service, date, address, remark, staffId } = req.body;

    if (!name || !phone || !service || !address) {
      return res.status(400).json({ error: '请填写完整的预约信息' });
    }

    const bookingId = 'BK' + Date.now();
    let staffName = null;

    if (staffId) {
      const staff = await db.get('SELECT name FROM staff WHERE id = ?', [staffId]);
      staffName = staff ? staff.name : null;
    }

    // 根据服务名查询价格
    const svc = await db.get('SELECT price FROM services WHERE name = ?', [service]);
    const price = svc ? svc.price : 0;

    await db.run(
      'INSERT INTO bookings (id, user_name, user_phone, service, service_date, address, remark, staff_id, staff_name, price, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [bookingId, name, phone, service, date || '', address, remark || '', staffId || null, staffName || '', price, staffId ? 'claimed' : 'new']
    );

    res.json({ success: true, bookingId, message: staffId ? '预约成功！已为您指定师傅' : '预约提交成功！我们将尽快联系您' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/bookings/:id/claim — 员工接单
router.put('/:id/claim', async (req, res) => {
  try {
    const { staffId, staffName } = req.body;
    if (!staffId) {
      return res.status(400).json({ error: '缺少师傅信息' });
    }

    const booking = await db.get('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
    if (!booking) {
      return res.status(404).json({ error: '订单不存在' });
    }
    if (booking.status !== 'new') {
      return res.status(400).json({ error: '该订单已被其他师傅接走' });
    }

    await db.run(
      'UPDATE bookings SET status = ?, staff_id = ?, staff_name = ? WHERE id = ?',
      ['claimed', staffId, staffName, req.params.id]
    );

    // 更新师傅接单数
    await db.run('UPDATE staff SET orders = orders + 1 WHERE id = ?', [staffId]);

    res.json({ success: true, message: '接单成功！' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/status', async (req, res) => {
  try {
    const { status, staffId, staffName } = req.body;
    await db.run(
      'UPDATE bookings SET status = ?, staff_id = COALESCE(?, staff_id), staff_name = COALESCE(?, staff_name) WHERE id = ?',
      [status, staffId || null, staffName || null, req.params.id]
    );
    res.json({ success: true, message: '状态更新成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
