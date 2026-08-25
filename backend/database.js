const mysql = require('mysql2/promise');

class Database {
  constructor() {
    this.pool = null;
  }

  async init() {
    this.pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'wanfeng',
      charset: 'utf8mb4',
      waitForConnections: true,
      connectionLimit: 10
    });

    // 验证连接
    const conn = await this.pool.getConnection();
    console.log('✅ MySQL 数据库连接成功');
    conn.release();

    await this.createTables();

    // 数据迁移：已有表新增列
    try {
      await this.run('ALTER TABLE users ADD COLUMN background VARCHAR(50) DEFAULT \'maple\'');
      console.log('✅ 已添加 background 列');
    } catch (e) {
      if (e.code !== 'ER_DUP_FIELDNAME') console.log('background 列已存在');
    }

    try {
      await this.run('ALTER TABLE bookings ADD COLUMN price REAL DEFAULT 0');
      console.log('✅ 已添加 price 列');
    } catch (e) {
      if (e.code !== 'ER_DUP_FIELDNAME') console.log('price 列已存在');
    }

    try {
      await this.run('ALTER TABLE staff MODIFY photo VARCHAR(255)');
      console.log('✅ 已扩展 staff.photo 列');
    } catch (e) {
      if (e.code !== 'ER_DUP_FIELDNAME') console.log('staff.photo 列已扩展或无需修改');
    }

    try {
      await this.run('ALTER TABLE services MODIFY icon VARCHAR(255)');
      console.log('✅ 已扩展 services.icon 列');
    } catch (e) {
      if (e.code !== 'ER_DUP_FIELDNAME') console.log('services.icon 列已扩展或无需修改');
    }

    try {
      await this.run('ALTER TABLE staff ADD COLUMN display_photo VARCHAR(255)');
      console.log('✅ 已添加 staff.display_photo 列');
    } catch (e) {
      if (e.code !== 'ER_DUP_FIELDNAME') console.log('staff.display_photo 列已存在');
    }

    await this.insertDefaultData();
  }

  async createTables() {
    const tables = [
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        address VARCHAR(500),
        preferences TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

      `CREATE TABLE IF NOT EXISTS staff (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        role VARCHAR(100) NOT NULL,
        photo VARCHAR(50),
        badge VARCHAR(50),
        tags TEXT,
        orders INTEGER DEFAULT 0,
        rate REAL DEFAULT 5.0,
        years INTEGER DEFAULT 1,
        phone VARCHAR(20),
        password VARCHAR(100) DEFAULT '888888',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

      `CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(200) NOT NULL,
        icon VARCHAR(50),
        description TEXT,
        price REAL NOT NULL,
        price_unit VARCHAR(50) DEFAULT '起',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

      `CREATE TABLE IF NOT EXISTS bookings (
        id VARCHAR(50) PRIMARY KEY,
        user_name VARCHAR(100) NOT NULL,
        user_phone VARCHAR(20) NOT NULL,
        service VARCHAR(200) NOT NULL,
        service_date VARCHAR(50),
        address VARCHAR(500) NOT NULL,
        remark TEXT,
        staff_id INTEGER,
        staff_name VARCHAR(100),
        status VARCHAR(50) DEFAULT 'new',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (staff_id) REFERENCES staff(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

      `CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        avatar VARCHAR(10),
        text TEXT NOT NULL,
        stars INTEGER NOT NULL,
        service VARCHAR(200) NOT NULL,
        staff_id INTEGER,
        staff_name VARCHAR(100),
        date VARCHAR(50),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

      `CREATE TABLE IF NOT EXISTS settings (
        key_name VARCHAR(100) PRIMARY KEY,
        value TEXT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    ];

    for (const sql of tables) {
      await this.run(sql);
    }

    console.log('✅ 数据表创建成功');
  }

  async insertDefaultData() {
    // 防止重复插入默认数据
    const existingStaff = await this.get('SELECT COUNT(*) as count FROM staff');
    if (existingStaff && existingStaff.count > 0) {
      console.log('✅ 默认数据已存在，跳过插入');
      return;
    }

    const defaultStaff = [
      { name: '李秀芳', role: '金牌月嫂', photo: '👩‍🦰', badge: '金牌', tags: JSON.stringify(['母婴护理', '月子餐', '催乳']), orders: 328, rate: 4.9, years: 8 },
      { name: '张美华', role: '资深保洁', photo: '👩', badge: '资深', tags: JSON.stringify(['深度清洁', '收纳', '除螨']), orders: 562, rate: 4.8, years: 6 },
      { name: '王桂兰', role: '养老护理', photo: '👩‍🦳', badge: '专业', tags: JSON.stringify(['康复护理', '陪护', '膳食']), orders: 215, rate: 4.9, years: 10 },
      { name: '陈晓燕', role: '收纳整理师', photo: '👩‍💼', badge: '人气', tags: JSON.stringify(['空间规划', '衣橱整理', '搬家整理']), orders: 198, rate: 4.7, years: 4 },
      { name: '赵建国', role: '家电清洗', photo: '👨‍🔧', badge: '专业', tags: JSON.stringify(['油烟机', '空调', '洗衣机']), orders: 441, rate: 4.8, years: 7 },
      { name: '刘丽娟', role: '月嫂/育儿嫂', photo: '👩‍🦱', badge: '金牌', tags: JSON.stringify(['新生儿护理', '早教', '抚触']), orders: 276, rate: 4.9, years: 9 },
      { name: '孙明辉', role: '深度保洁', photo: '👨', badge: '资深', tags: JSON.stringify(['开荒保洁', '擦窗', '地毯清洗']), orders: 387, rate: 4.7, years: 5 },
      { name: '周玉兰', role: '养老护理', photo: '👩‍🦳', badge: '专业', tags: JSON.stringify(['失能护理', '康复训练', '心理疏导']), orders: 163, rate: 4.8, years: 11 }
    ];

    const defaultServices = [
      { name: '日常保洁', icon: '🧹', description: '全屋除尘、地面清洁、厨卫擦拭，让家每天焕然一新', price: 99, price_unit: '起' },
      { name: '深度清洁', icon: '✨', description: '彻底清洁每一处角落，包含油烟机拆洗、玻璃擦拭等', price: 199, price_unit: '起' },
      { name: '月嫂服务', icon: '👶', description: '持证上岗的金牌月嫂，科学护理产妇和新生儿', price: 8880, price_unit: '起/26天' },
      { name: '养老护理', icon: '❤️', description: '专业陪伴与照护，给长辈最温暖的关怀与关爱', price: 4500, price_unit: '起/月' },
      { name: '家电清洗', icon: '🔧', description: '空调、洗衣机、油烟机等家电深度拆洗，专业设备保障', price: 129, price_unit: '起' },
      { name: '收纳整理', icon: '📦', description: '科学规划空间，告别杂乱，让生活井井有条', price: 159, price_unit: '起' }
    ];

    const defaultReviews = [
      { name: '张女士', avatar: '张', text: '阿姨很细致，连窗缝都擦得干干净净。做完之后家里像新的一样，太舒心了！', stars: 5, service: '日常保洁', date: '2025-03-15' },
      { name: '刘女士', avatar: '刘', text: '月嫂李姐非常专业，对宝宝护理特别细心，月子餐也做得好吃，全家人一致好评。', stars: 5, service: '月嫂服务', date: '2025-04-02' },
      { name: '王先生', avatar: '王', text: '用了家电清洗服务，把我们家用了三年的油烟机洗得跟新的一样。师傅工具齐全，很专业！', stars: 5, service: '家电清洗', date: '2025-04-20' },
      { name: '陈女士', avatar: '陈', text: '收纳师小陈太厉害了，把我乱糟糟的衣帽间整理得井井有条，找东西再也不用翻半天！', stars: 5, service: '收纳整理', date: '2025-05-08' },
      { name: '李女士', avatar: '李', text: '给80岁的老父亲请了养老护理员，阿姨特别有耐心，父亲很开心，我们做子女的也放心多了。', stars: 4, service: '养老护理', date: '2025-05-10' },
      { name: '赵先生', avatar: '赵', text: '深度清洁做完，连空调滤网都拆下来洗干净了，非常满意，已经推荐给邻居了。', stars: 5, service: '深度清洁', date: '2025-05-18' }
    ];

    for (const staff of defaultStaff) {
      await this.run(
        'INSERT INTO staff (name, role, photo, badge, tags, orders, rate, years, phone, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [staff.name, staff.role, staff.photo, staff.badge, staff.tags, staff.orders, staff.rate, staff.years, '', '888888']
      );
    }

    for (const service of defaultServices) {
      await this.run(
        'INSERT INTO services (name, icon, description, price, price_unit) VALUES (?, ?, ?, ?, ?)',
        [service.name, service.icon, service.description, service.price, service.price_unit]
      );
    }

    for (const review of defaultReviews) {
      await this.run(
        'INSERT INTO reviews (name, avatar, text, stars, service, staff_id, staff_name, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [review.name, review.avatar, review.text, review.stars, review.service, null, null, review.date]
      );
    }

    // 默认关于我们设置
    const existingSettings = await this.get("SELECT COUNT(*) as count FROM settings WHERE key_name LIKE 'about_%'");
    if (!existingSettings || existingSettings.count === 0) {
      const defaultAbout = [
        ['about_title', '关于晚枫'],
        ['about_subtitle', '✦ 晚枫 · 让家更有温度 ✦'],
        ['about_intro', '晚枫家政成立于2020年，始终秉持"用心服务每一个家"的理念。我们深知，家是每个人最柔软的港湾——而我们的使命，就是让这份柔软被温柔对待。'],
        ['about_detail', '每一位晚枫服务人员都经过严格的背景调查、技能考核和岗前培训，持证上岗，服务全程保险保障。'],
        ['about_feature_1', '实名认证，背景调查'],
        ['about_feature_2', '岗前培训，持证上岗'],
        ['about_feature_3', '服务保险，全程保障'],
        ['about_feature_4', '品质督导，售后无忧'],
        ['about_image', '']
      ];
      for (const [key, value] of defaultAbout) {
        await this.run('INSERT INTO settings (key_name, value) VALUES (?, ?)', [key, value]);
      }
      console.log('✅ 默认关于我们数据已插入');
    }

    console.log('✅ 初始数据插入完成');
  }

  // ---------- 与 SQLite 版本保持一致的方法签名 ----------

  async run(sql, params = []) {
    const [result] = await this.pool.execute(sql, params);
    return { lastID: result.insertId, changes: result.affectedRows };
  }

  async get(sql, params = []) {
    const [rows] = await this.pool.execute(sql, params);
    return rows.length > 0 ? rows[0] : undefined;
  }

  async all(sql, params = []) {
    const [rows] = await this.pool.execute(sql, params);
    return rows;
  }
}

// 导出单例实例
const db = new Database();
module.exports = db;
