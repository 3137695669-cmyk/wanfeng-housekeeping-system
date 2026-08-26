-- ============================================================
-- 晚枫家政 · 离线数仓  DWD 层（明细层）
-- ------------------------------------------------------------
-- 作用：对 ODS 做清洗 / 去重 / 脱敏 / 统一日期格式 / 字段转型。
-- 核心清洗点：
--   1) 脏日期解析：service_date / date 是 VARCHAR 混合格式，统一成 DATE
--   2) 区域解析：从 address 自由文本里提取区名 → region_id（连 dim_region）
--   3) 空值处理：空串 / \N → NULL
--   4) 越界值处理：stars 只保留 1~5，其余置 NULL
--   5) 去重：ROW_NUMBER 按主键去重
-- 存储：ORC（列式压缩）
-- 运行方式：beeline -u jdbc:hive2://localhost:10000 -f 02_dwd.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS wanfeng_dwd;
USE wanfeng_dwd;

-- ------------------------------------------------------------
-- 维度表：时间（干净数据，转型即可）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS dim_date;
CREATE TABLE dim_date (
  date_id      INT,
  dt           DATE,
  year         INT,
  month        INT,
  day          INT,
  quarter      INT,
  week_of_year INT,
  day_of_week  INT,
  is_weekend   INT,
  is_holiday   INT
) STORED AS ORC;

INSERT OVERWRITE TABLE dim_date
SELECT
  CAST(date_id      AS INT),
  CAST(dt           AS DATE),
  CAST(year         AS INT),
  CAST(month        AS INT),
  CAST(day          AS INT),
  CAST(quarter      AS INT),
  CAST(week_of_year AS INT),
  CAST(day_of_week  AS INT),
  CAST(is_weekend   AS INT),
  CAST(is_holiday   AS INT)
FROM wanfeng_ods.ods_dim_date;

-- ------------------------------------------------------------
-- 维度表：区域
-- ------------------------------------------------------------
DROP TABLE IF EXISTS dim_region;
CREATE TABLE dim_region (
  region_id    INT,
  region_name  STRING,
  city         STRING,
  province     STRING
) STORED AS ORC;

INSERT OVERWRITE TABLE dim_region
SELECT
  CAST(region_id AS INT), region_name, city, province
FROM wanfeng_ods.ods_dim_region;

-- ------------------------------------------------------------
-- 维度表：服务
-- ------------------------------------------------------------
DROP TABLE IF EXISTS dim_service;
CREATE TABLE dim_service (
  service_id   INT,
  service_name STRING,
  icon         STRING,
  description  STRING,
  price        DECIMAL(10,2),
  price_unit   STRING,
  created_at   TIMESTAMP
) STORED AS ORC;

INSERT OVERWRITE TABLE dim_service
SELECT
  CAST(id AS INT), name, icon, description,
  CAST(price AS DECIMAL(10,2)), price_unit,
  CAST(created_at AS TIMESTAMP)
FROM wanfeng_ods.ods_services;

-- ------------------------------------------------------------
-- 维度表：师傅（tags 为 JSON，原样保留；可后续 explode 成标签维度）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS dim_staff;
CREATE TABLE dim_staff (
  staff_id   INT,
  name       STRING,
  role       STRING,
  photo      STRING,
  badge      STRING,
  tags       STRING,     -- JSON 文本
  orders     INT,
  rate       DOUBLE,
  years      INT,
  phone      STRING,
  created_at TIMESTAMP
) STORED AS ORC;

INSERT OVERWRITE TABLE dim_staff
SELECT
  CAST(id AS INT), name, role, photo, badge, tags,
  CAST(orders AS INT), CAST(rate AS DOUBLE), CAST(years AS INT),
  phone, CAST(created_at AS TIMESTAMP)
FROM wanfeng_ods.ods_staff;

-- ------------------------------------------------------------
-- 维度表：用户（address 自由文本 → 解析 region_id）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS dim_user;
CREATE TABLE dim_user (
  user_id          INT,
  name             STRING,
  phone            STRING,
  gender           STRING,
  age              INT,
  register_channel STRING,
  region_id        INT,      -- 从 address 解析而来
  address          STRING,
  preferences      STRING,   -- JSON 文本
  created_at       TIMESTAMP
) STORED AS ORC;

INSERT OVERWRITE TABLE dim_user
SELECT
  CAST(u.id AS INT), u.name, u.phone, u.gender, CAST(u.age AS INT),
  u.register_channel,
  CAST(r.region_id AS INT),   -- 匹配不到区域 → NULL
  u.address, u.preferences,
  CAST(u.created_at AS TIMESTAMP)
FROM wanfeng_ods.ods_users u
LEFT JOIN wanfeng_ods.ods_dim_region r
       ON u.address LIKE CONCAT('%', r.region_name, '%');

-- ------------------------------------------------------------
-- 事实表：订单（重点清洗）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS dwd_bookings;
CREATE TABLE dwd_bookings (
  booking_id   STRING,
  user_name    STRING,
  user_phone   STRING,
  service      STRING,
  service_date DATE,          -- 清洗后：统一 yyyy-MM-dd
  region_id    INT,           -- 清洗后：从 address 解析
  address      STRING,
  remark       STRING,
  staff_id     INT,           -- 空 → NULL
  staff_name   STRING,
  status       STRING,
  created_at   TIMESTAMP,
  price        DECIMAL(10,2)  -- 空 → NULL
) STORED AS ORC;

INSERT OVERWRITE TABLE dwd_bookings
SELECT
  b.id, b.user_name, b.user_phone, b.service,
  -- 脏日期清洗：多格式 → DATE（空/乱码/\N 一律 NULL）
  CASE
    WHEN b.service_date IS NULL OR b.service_date = '' THEN NULL
    WHEN b.service_date RLIKE '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
         THEN CAST(from_unixtime(unix_timestamp(b.service_date, 'yyyy-MM-dd'), 'yyyy-MM-dd') AS DATE)
    WHEN b.service_date RLIKE '^[0-9]{4}/[0-9]{2}/[0-9]{2}$'
         THEN CAST(from_unixtime(unix_timestamp(b.service_date, 'yyyy/MM/dd'), 'yyyy-MM-dd') AS DATE)
    WHEN b.service_date RLIKE '^[0-9]{2}-[0-9]{2}-[0-9]{4}$'
         THEN CAST(from_unixtime(unix_timestamp(b.service_date, 'MM-dd-yyyy'), 'yyyy-MM-dd') AS DATE)
    WHEN b.service_date RLIKE '^[0-9]{8}$'
         THEN CAST(from_unixtime(unix_timestamp(b.service_date, 'yyyyMMdd'), 'yyyy-MM-dd') AS DATE)
    WHEN b.service_date RLIKE '年'
         THEN CAST(from_unixtime(unix_timestamp(b.service_date, 'yyyy年M月d日'), 'yyyy-MM-dd') AS DATE)
    ELSE NULL
  END AS service_date,
  CAST(r.region_id AS INT) AS region_id,
  b.address, b.remark,
  CAST(b.staff_id AS INT) AS staff_id,     -- '' / NULL → NULL
  b.staff_name, b.status,
  CAST(b.created_at AS TIMESTAMP),
  CAST(b.price AS DECIMAL(10,2))           -- '' / NULL → NULL
FROM (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY id ORDER BY created_at DESC) AS rn
  FROM wanfeng_ods.ods_bookings
) b
LEFT JOIN wanfeng_ods.ods_dim_region r
       ON b.address LIKE CONCAT('%', r.region_name, '%')
WHERE b.rn = 1;

-- ------------------------------------------------------------
-- 事实表：评价（重点清洗）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS dwd_reviews;
CREATE TABLE dwd_reviews (
  review_id   INT,
  name        STRING,
  avatar      STRING,
  text        STRING,
  stars       INT,           -- 越界值（0/6）→ NULL
  service     STRING,
  staff_id    INT,           -- 空 → NULL
  staff_name  STRING,
  review_date DATE,          -- 清洗后：统一 yyyy-MM-dd
  created_at  TIMESTAMP
) STORED AS ORC;

INSERT OVERWRITE TABLE dwd_reviews
SELECT
  CAST(rv.id AS INT), rv.name, rv.avatar, rv.text,
  CASE WHEN CAST(rv.stars AS INT) BETWEEN 1 AND 5 THEN CAST(rv.stars AS INT) ELSE NULL END,
  rv.service,
  CAST(rv.staff_id AS INT),
  rv.staff_name,
  CASE
    WHEN rv.dt IS NULL OR rv.dt = '' THEN NULL
    WHEN rv.dt RLIKE '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
         THEN CAST(from_unixtime(unix_timestamp(rv.dt, 'yyyy-MM-dd'), 'yyyy-MM-dd') AS DATE)
    WHEN rv.dt RLIKE '^[0-9]{4}/[0-9]{2}/[0-9]{2}$'
         THEN CAST(from_unixtime(unix_timestamp(rv.dt, 'yyyy/MM/dd'), 'yyyy-MM-dd') AS DATE)
    WHEN rv.dt RLIKE '^[0-9]{2}-[0-9]{2}-[0-9]{4}$'
         THEN CAST(from_unixtime(unix_timestamp(rv.dt, 'MM-dd-yyyy'), 'yyyy-MM-dd') AS DATE)
    WHEN rv.dt RLIKE '^[0-9]{8}$'
         THEN CAST(from_unixtime(unix_timestamp(rv.dt, 'yyyyMMdd'), 'yyyy-MM-dd') AS DATE)
    WHEN rv.dt RLIKE '年'
         THEN CAST(from_unixtime(unix_timestamp(rv.dt, 'yyyy年M月d日'), 'yyyy-MM-dd') AS DATE)
    ELSE NULL
  END AS review_date,
  CAST(rv.created_at AS TIMESTAMP)
FROM wanfeng_ods.ods_reviews rv;
