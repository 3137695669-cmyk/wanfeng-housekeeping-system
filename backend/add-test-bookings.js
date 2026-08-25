// 一次性脚本：插入测试订单
require('dotenv').config();
const db = require('./database');

async function main() {
  await db.init();

  const bookings = [
    {
      id: 'TEST001',
      user_name: '赵先生',
      user_phone: '13800001111',
      service: '日常保洁',
      service_date: '2026-06-16',
      address: '朝阳区建国路88号 阳光花园 3栋1201',
      remark: '家里有猫，注意关门',
      price: 99,
      status: 'new'
    },
    {
      id: 'TEST002',
      user_name: '钱女士',
      user_phone: '13800002222',
      service: '深度清洁',
      service_date: '2026-06-17',
      address: '海淀区中关村南大街 科苑小区 5号楼302',
      remark: '重点清洁厨房油烟机',
      price: 199,
      status: 'new'
    },
    {
      id: 'TEST003',
      user_name: '孙先生',
      user_phone: '13800003333',
      service: '家电清洗',
      service_date: '2026-06-16',
      address: '西城区金融街 金宸公寓 2号楼1506',
      remark: '空调和洗衣机都需要清洗',
      price: 129,
      status: 'new'
    },
    {
      id: 'TEST004',
      user_name: '周女士',
      user_phone: '13800004444',
      service: '收纳整理',
      service_date: '2026-06-18',
      address: '东城区东直门外大街 万国城 7栋801',
      remark: '主卧衣帽间需要整理',
      price: 159,
      status: 'new'
    },
    {
      id: 'TEST005',
      user_name: '吴先生',
      user_phone: '13800005555',
      service: '月嫂服务',
      service_date: '2026-07-01',
      address: '朝阳区望京 花园西区 9栋2202',
      remark: '预产期6月28日，提前联系',
      price: 8880,
      status: 'new'
    },
    {
      id: 'TEST006',
      user_name: '郑女士',
      user_phone: '13800006666',
      service: '养老护理',
      service_date: '2026-06-20',
      address: '丰台区方庄 芳城园 1号楼1005',
      remark: '老人78岁，行动不便，需要白天陪护',
      price: 4500,
      status: 'new'
    }
  ];

  for (const b of bookings) {
    try {
      await db.run(
        `INSERT INTO bookings (id, user_name, user_phone, service, service_date, address, remark, price, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [b.id, b.user_name, b.user_phone, b.service, b.service_date, b.address, b.remark, b.price, b.status]
      );
      console.log(`✅ 已添加: ${b.id} - ${b.service} (${b.user_name})`);
    } catch (e) {
      if (e.code === 'ER_DUP_ENTRY') {
        console.log(`⏭️ 已存在，跳过: ${b.id}`);
      } else {
        console.error(`❌ 失败 ${b.id}:`, e.message);
      }
    }
  }

  console.log('\n✅ 测试订单添加完成！');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
