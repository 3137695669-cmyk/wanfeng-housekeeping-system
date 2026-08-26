#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
晚枫家政 · 离线数仓造数脚本
============================
生成模拟「业务库(MySQL)导出」的 CSV 文件，用于上传 HDFS 后由 Hive 加载。

输出文件（默认在 ./csv 目录下）：
  services.csv     服务维度（6 条，干净）
  staff.csv        师傅维度（默认 30 条，tags 为 JSON 文本，含少量脏 JSON）
  users.csv        用户维度（默认 10 万，含增强字段 gender / age / register_channel）
  bookings.csv     订单事实（默认 100 万，service_date 为 VARCHAR，含多种脏日期格式）
  reviews.csv      评价事实（默认 20 万，date 为 VARCHAR，含脏数据）
  dim_date.csv     时间维度（3 年 ≈ 1100 行，干净）
  dim_region.csv   区域维度（约 30 条，干净）

用法：
  python generate_data.py                          # 全量（百万级）
  python generate_data.py --small                  # 快速小样（千级 / 百级，用于先跑通流程）
  python generate_data.py --bookings 1000000 --reviews 200000 --users 100000 --staff 30
  python generate_data.py --out /path/to/csv       # 指定输出目录

说明：文件为 Tab 分隔（JSON 字段含逗号/引号，用 Tab 分隔可避免 Hive 解析冲突），
Hive 建表用 ROW FORMAT DELIMITED FIELDS TERMINATED BY '\\t'。

依赖：仅 Python 标准库，无需 pip 安装。数据可复现（固定随机种子）。
"""

import argparse
import csv
import json
import os
import random
import sys
from datetime import date, timedelta

# 让 Windows 控制台正确输出中文（失败则忽略）
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

SEED = 42

# ---------------------------------------------------------------- 常量池 ----

SURNAMES = list("张王李赵刘陈杨黄周吴徐孙马朱胡郭何高林罗郑梁谢宋唐许韩冯邓曹彭曾肖"
                "田董袁潘蒋蔡余杜叶程苏魏吕丁任沈姚卢姜崔钟谭陆汪范金石廖贾夏韦付方白"
                "邹孟熊秦邱江尹薛闫段雷侯龙史陶黎贺顾毛郝龚邵万钱严覃武戴莫孔向汤")

GIVEN_CHARS = list("伟芳娜秀英敏静丽强磊军洋勇艳杰娟涛明超秀兰霞平刚桂英建国玉梅晓燕"
                   "红梅丽娟秀芳嘉琪浩然宇轩梓萱欣怡子墨雨桐梦琪晨曦博文雅静睿智")

PHONE_PREFIXES = ["130", "131", "132", "133", "135", "136", "137", "138", "139",
                  "150", "151", "152", "155", "156", "157", "158", "159",
                  "170", "176", "177", "178", "180", "181", "182", "183", "185",
                  "186", "187", "188", "189"]

STREETS = ["望京街", "中关村大街", "光华路", "中山路", "人民路", "建设路", "解放路",
           "滨江路", "科技路", "文化路", "幸福路", "和平街", "复兴路", "长江路",
           "黄河路", "珠江路", "天府大道", "文一西路", "深南大道", "青年路"]

COMMUNITIES = ["阳光", "幸福", "锦绣", "翠湖", "金桂", "玫瑰", "紫荆", "百合", "香樟",
               "枫林", "花园", "世纪", "华府", "雅居", "御景", "江南", "湖畔", "星河",
               "都市", "山水"]

REGISTER_CHANNELS = ["微信小程序", "App", "网页", "线下门店", "老客转介绍"]

PREFS = ["日常保洁", "深度清洁", "月嫂服务", "养老护理", "家电清洗", "收纳整理"]

SERVICES = [
    {"name": "日常保洁", "icon": "🧹", "desc": "全屋除尘、地面清洁、厨卫擦拭，让家每天焕然一新", "price": 99, "unit": "起"},
    {"name": "深度清洁", "icon": "✨", "desc": "彻底清洁每一处角落，包含油烟机拆洗、玻璃擦拭等", "price": 199, "unit": "起"},
    {"name": "月嫂服务", "icon": "👶", "desc": "持证上岗的金牌月嫂，科学护理产妇和新生儿", "price": 8880, "unit": "起/26天"},
    {"name": "养老护理", "icon": "❤️", "desc": "专业陪伴与照护，给长辈最温暖的关怀与关爱", "price": 4500, "unit": "起/月"},
    {"name": "家电清洗", "icon": "🔧", "desc": "空调、洗衣机、油烟机等家电深度拆洗，专业设备保障", "price": 129, "unit": "起"},
    {"name": "收纳整理", "icon": "📦", "desc": "科学规划空间，告别杂乱，让生活井井有条", "price": 159, "unit": "起"},
]

STAFF_ROLES = ["金牌月嫂", "资深保洁", "养老护理", "收纳整理师", "家电清洗", "月嫂/育儿嫂",
               "深度保洁", "开荒保洁", "育婴师", "钟点工"]

TAGS_POOL = ["母婴护理", "月子餐", "催乳", "深度清洁", "收纳", "除螨", "康复护理", "陪护",
             "膳食", "空间规划", "衣橱整理", "搬家整理", "油烟机", "空调", "洗衣机",
             "新生儿护理", "早教", "抚触", "开荒保洁", "擦窗", "地毯清洗", "失能护理",
             "康复训练", "心理疏导", "擦玻璃", "地板打蜡", "除甲醛"]

BOOKING_STATUSES = ["completed", "confirmed", "new", "in_progress", "cancelled"]
BOOKING_STATUS_W = [0.55, 0.15, 0.10, 0.10, 0.10]

# 区域维度：约 32 个区，覆盖 6 个城市。三元组为 (province, city, district)。
# address 自由文本里会内嵌 district 名，供 DWD 层解析 region_id 使用。
REGIONS = [
    ("北京市", "北京市", "朝阳区"), ("北京市", "北京市", "海淀区"), ("北京市", "北京市", "丰台区"),
    ("北京市", "北京市", "西城区"), ("北京市", "北京市", "东城区"), ("北京市", "北京市", "通州区"),
    ("北京市", "北京市", "昌平区"), ("北京市", "北京市", "大兴区"),
    ("上海市", "上海市", "浦东新区"), ("上海市", "上海市", "徐汇区"), ("上海市", "上海市", "静安区"),
    ("上海市", "上海市", "闵行区"), ("上海市", "上海市", "宝山区"), ("上海市", "上海市", "松江区"),
    ("广东省", "广州市", "天河区"), ("广东省", "广州市", "越秀区"), ("广东省", "广州市", "海珠区"),
    ("广东省", "广州市", "白云区"), ("广东省", "广州市", "番禺区"),
    ("广东省", "深圳市", "南山区"), ("广东省", "深圳市", "福田区"), ("广东省", "深圳市", "罗湖区"),
    ("广东省", "深圳市", "宝安区"), ("广东省", "深圳市", "龙岗区"),
    ("浙江省", "杭州市", "西湖区"), ("浙江省", "杭州市", "拱墅区"), ("浙江省", "杭州市", "滨江区"),
    ("浙江省", "杭州市", "余杭区"),
    ("四川省", "成都市", "锦江区"), ("四川省", "成都市", "武侯区"), ("四川省", "成都市", "青羊区"),
    ("四川省", "成都市", "金牛区"),
]

# 法定节假日（简化：仅取固定公历节假日，用于 dim_date.is_holiday 演示）
HOLIDAYS = {(1, 1), (5, 1), (10, 1), (10, 2), (10, 3)}


# ---------------------------------------------------------------- 工具函数 ----

def make_name(rng):
    length = rng.choice([2, 2, 2, 3])
    given = "".join(rng.choice(GIVEN_CHARS) for _ in range(length - 1))
    return rng.choice(SURNAMES) + given


def make_phone(rng, dirty_ratio=0.02):
    """大部分生成合法 11 位手机号，少量生成脏数据（空 / 非法）。"""
    r = rng.random()
    if r < dirty_ratio:
        return rng.choice(["", "123", "1380013800"])
    return rng.choice(PHONE_PREFIXES) + "".join(str(rng.randint(0, 9)) for _ in range(8))


def make_address(rng, regions):
    """生成自由文本地址，内嵌 district 名；少量缺失 / 缺区域，模拟脏数据。"""
    r = rng.random()
    if r < 0.04:
        return ""                                    # 地址缺失
    province, city, district = rng.choice(regions)
    prefix = province + (city if city != province else "")  # 直辖市不重复市名
    street = rng.choice(STREETS)
    community = rng.choice(COMMUNITIES)
    building = rng.randint(1, 30)
    room = rng.randint(101, 2604)
    if rng.random() < 0.05:
        return f"{community}小区{building}号楼"       # 缺区域，无法聚合到 region
    return f"{prefix}{district}{street}{community}小区{building}号楼{room}室"


def dirty_date(rng, d, clean_ratio=0.80):
    """把 date 渲染成 VARCHAR，混入多种脏格式，供 DWD 清洗。"""
    r = rng.random()
    if r < clean_ratio:
        return d.strftime("%Y-%m-%d")
    if r < 0.85:
        return d.strftime("%Y/%m/%d")
    if r < 0.90:
        return d.strftime("%m-%d-%Y")
    if r < 0.93:
        return d.strftime("%Y%m%d")
    if r < 0.95:
        return ""                                    # 空字符串
    if r < 0.97:
        return "\\N"                                 # Hive NULL 占位（单个反斜杠+N）
    return f"{d.year}年{d.month}月{d.day}日"          # 中文日期，无法直接解析


def make_tags(rng):
    """生成 JSON 数组文本，少量为非法 JSON（脏数据）。"""
    tags = rng.sample(TAGS_POOL, rng.randint(2, 4))
    if rng.random() < 0.05:
        return '["' + '","'.join(tags)               # 故意缺失右括号
    return json.dumps(tags, ensure_ascii=False)


def write_csv(path, header, rows, total=None, every=200000):
    """流式写 CSV（Tab 分隔 + 不转义引号，JSON 字段原样输出，避免被 quote 包裹）。

    utf-8 无 BOM，避免 Hive LOAD 时首列出现乱码。
    Hive 建表时用：ROW FORMAT DELIMITED FIELDS TERMINATED BY '\\t'
    """
    n = 0
    with open(path, "w", encoding="utf-8", newline="") as f:
        # quotechar 用反引号（数据里不会出现），这样 JSON 里的双引号不会被包裹转义
        w = csv.writer(f, delimiter="\t", quoting=csv.QUOTE_MINIMAL, quotechar="`")
        w.writerow(header)
        for row in rows:
            w.writerow(row)
            n += 1
            if total and n % every == 0:
                print(f"    ... {n:,} / {total:,}")
    return n


def daterange(start, days):
    return (start + timedelta(days=i) for i in range(days))


# ---------------------------------------------------------------- 各表生成 ----

def gen_dim_date(out, start, days):
    print(f"[dim_date]  生成 {days} 行（{start} 起）...")
    header = ["date_id", "date", "year", "month", "day", "quarter", "week_of_year",
              "day_of_week", "is_weekend", "is_holiday"]
    rows = []
    for d in daterange(start, days):
        rows.append([
            int(d.strftime("%Y%m%d")),
            d.strftime("%Y-%m-%d"),
            d.year, d.month, d.day,
            (d.month - 1) // 3 + 1,
            d.isocalendar()[1],
            d.weekday() + 1,                          # 1=周一 ... 7=周日
            1 if d.weekday() >= 5 else 0,
            1 if (d.month, d.day) in HOLIDAYS else 0,
        ])
    write_csv(os.path.join(out, "dim_date.csv"), header, rows)
    return days


def gen_dim_region(out):
    print(f"[dim_region] 生成 {len(REGIONS)} 行...")
    header = ["region_id", "region_name", "city", "province"]
    rows = [[i + 1, district, city, province] for i, (province, city, district) in enumerate(REGIONS)]
    write_csv(os.path.join(out, "dim_region.csv"), header, rows)
    return len(rows)


def gen_services(out):
    print(f"[services]  生成 {len(SERVICES)} 行...")
    header = ["id", "name", "icon", "description", "price", "price_unit", "created_at"]
    rows = [[i + 1, s["name"], s["icon"], s["desc"], s["price"], s["unit"],
             "2023-01-01 00:00:00"] for i, s in enumerate(SERVICES)]
    write_csv(os.path.join(out, "services.csv"), header, rows)
    return len(rows)


def gen_staff(out, rng, count):
    print(f"[staff]     生成 {count} 行...")
    header = ["id", "name", "role", "photo", "badge", "tags", "orders", "rate",
              "years", "phone", "password", "created_at"]
    badges = ["金牌", "资深", "专业", "人气", "新星"]

    def rows():
        for i in range(1, count + 1):
            yield [i, make_name(rng), rng.choice(STAFF_ROLES),
                   rng.choice(["👩‍🦰", "👩", "👩‍🦳", "👩‍💼", "👨‍🔧", "👨", "👩‍🦱"]),
                   rng.choice(badges), make_tags(rng), rng.randint(50, 900),
                   round(rng.uniform(4.5, 5.0), 1), rng.randint(1, 12),
                   make_phone(rng), "888888",
                   f"202{rng.randint(1, 3)}-0{rng.randint(1, 9)}-{rng.randint(10, 28):02d} 09:00:00"]

    write_csv(os.path.join(out, "staff.csv"), header, rows())
    return count


def gen_users(out, rng, count, regions):
    print(f"[users]     生成 {count:,} 行...")
    header = ["id", "name", "phone", "password", "address", "preferences",
              "created_at", "gender", "age", "register_channel"]

    def rows():
        for i in range(1, count + 1):
            pref = rng.sample(PREFS, rng.randint(0, 3))
            yield [i, make_name(rng), make_phone(rng, dirty_ratio=0.01),
                   "123456", make_address(rng, regions),
                   json.dumps(pref, ensure_ascii=False) if pref else "",
                   f"202{rng.randint(1, 3)}-{rng.randint(1, 12):02d}-{rng.randint(1, 28):02d} {rng.randint(0, 23):02d}:{rng.randint(0, 59):02d}:00",
                   rng.choice(["男", "女"]), rng.randint(18, 75),
                   rng.choice(REGISTER_CHANNELS)]

    write_csv(os.path.join(out, "users.csv"), header, rows(), total=count)
    return count


def gen_bookings(out, rng, count, regions, start, days, staff_count):
    print(f"[bookings]  生成 {count:,} 行...")
    header = ["id", "user_name", "user_phone", "service", "service_date", "address",
              "remark", "staff_id", "staff_name", "status", "created_at", "price"]
    service_names = [s["name"] for s in SERVICES]
    service_price = {s["name"]: s["price"] for s in SERVICES}

    def rows():
        for i in range(1, count + 1):
            svc = rng.choice(service_names)
            staff_id = rng.randint(1, staff_count) if rng.random() > 0.05 else ""
            staff_name = make_name(rng) if staff_id else ""
            d = start + timedelta(days=rng.randint(0, days - 1))
            base = service_price[svc]
            price = round(base * rng.uniform(0.9, 1.3), 2) if rng.random() > 0.05 else ""
            yield [f"BK{start.year}{i:09d}", make_name(rng), make_phone(rng, dirty_ratio=0.02),
                   svc, dirty_date(rng, d), make_address(rng, regions),
                   rng.choice(["", "", "", "家里有宠物", "需要带工具", "下午 3 点后上门"]),
                   staff_id, staff_name,
                   rng.choices(BOOKING_STATUSES, weights=BOOKING_STATUS_W, k=1)[0],
                   f"{d.strftime('%Y-%m-%d')} {rng.randint(8, 20):02d}:{rng.randint(0, 59):02d}:00",
                   price]

    write_csv(os.path.join(out, "bookings.csv"), header, rows(), total=count)
    return count


def gen_reviews(out, rng, count, start, days, staff_count):
    print(f"[reviews]   生成 {count:,} 行...")
    header = ["id", "name", "avatar", "text", "stars", "service", "staff_id",
              "staff_name", "date", "created_at"]
    service_names = [s["name"] for s in SERVICES]
    texts = ["服务很满意，师傅专业负责", "阿姨很细致，家里收拾得很干净", "非常专业，下次还会预约",
             "价格合理，服务到位", "师傅很准时，态度也好", "整体体验不错，推荐",
             "有改进空间，但总体还行", "做得比较快，效果可以"]

    def rows():
        for i in range(1, count + 1):
            svc = rng.choice(service_names)
            staff_id = rng.randint(1, staff_count) if rng.random() > 0.10 else ""
            staff_name = make_name(rng) if staff_id else ""
            d = start + timedelta(days=rng.randint(0, days - 1))
            stars = rng.choices([5, 4, 5, 3, 4, 5, 2, 0, 6], weights=[40, 25, 15, 8, 5, 4, 1, 1, 1], k=1)[0]
            yield [i, make_name(rng), rng.choice(SURNAMES), rng.choice(texts), stars,
                   svc, staff_id, staff_name, dirty_date(rng, d, clean_ratio=0.85),
                   f"{d.strftime('%Y-%m-%d')} {rng.randint(9, 21):02d}:{rng.randint(0, 59):02d}:00"]

    write_csv(os.path.join(out, "reviews.csv"), header, rows(), total=count)
    return count


# ---------------------------------------------------------------- 主入口 ----

def main():
    parser = argparse.ArgumentParser(description="晚枫家政离线数仓造数脚本")
    parser.add_argument("--out", default=os.path.join(os.path.dirname(__file__), "csv"),
                        help="CSV 输出目录（默认 ./csv）")
    parser.add_argument("--bookings", type=int, default=1000000, help="订单事实行数")
    parser.add_argument("--reviews", type=int, default=200000, help="评价事实行数")
    parser.add_argument("--users", type=int, default=100000, help="用户维度行数")
    parser.add_argument("--staff", type=int, default=30, help="师傅维度行数")
    parser.add_argument("--start", default="2023-01-01", help="数据起始日期 YYYY-MM-DD")
    parser.add_argument("--days", type=int, default=1096, help="时间跨度（天），默认 3 年")
    parser.add_argument("--small", action="store_true", help="快速小样：千级/百级数据")
    args = parser.parse_args()

    if args.small:
        args.bookings = 10000
        args.reviews = 2000
        args.users = 1000
        args.staff = 30

    os.makedirs(args.out, exist_ok=True)
    start = date.fromisoformat(args.start)
    rng = random.Random(SEED)

    print("=" * 60)
    print("晚枫家政 · 离线数仓造数")
    print(f"输出目录 : {args.out}")
    print(f"量级     : bookings={args.bookings:,}  reviews={args.reviews:,}  "
          f"users={args.users:,}  staff={args.staff}  days={args.days}")
    print("=" * 60)

    counts = {}
    counts["dim_date"] = gen_dim_date(args.out, start, args.days)
    counts["dim_region"] = gen_dim_region(args.out)
    counts["services"] = gen_services(args.out)
    counts["staff"] = gen_staff(args.out, rng, args.staff)
    counts["users"] = gen_users(args.out, rng, args.users, REGIONS)
    counts["bookings"] = gen_bookings(args.out, rng, args.bookings, REGIONS, start, args.days, args.staff)
    counts["reviews"] = gen_reviews(args.out, rng, args.reviews, start, args.days, args.staff)

    print("=" * 60)
    print("生成完成，各文件行数与大小：")
    total_bytes = 0
    for name, cnt in counts.items():
        p = os.path.join(args.out, f"{name}.csv")
        size = os.path.getsize(p)
        total_bytes += size
        print(f"  {name:12s} {cnt:>10,} 行  {size / 1024 / 1024:8.2f} MB")
    print("-" * 60)
    print(f"  合计       {sum(counts.values()):>10,} 行  {total_bytes / 1024 / 1024:8.2f} MB")
    print("=" * 60)
    print("下一步：把 csv/ 上传 HDFS → Hive 建表（FIELDS TERMINATED BY '\\t'）+ LOAD DATA。")


if __name__ == "__main__":
    main()
