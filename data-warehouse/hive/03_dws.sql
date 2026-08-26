-- ============================================================
-- 晚枫家政 · 离线数仓  DWS 层（汇总层）
-- ------------------------------------------------------------
-- 作用：按天 / 按主题对 DWD 做轻度汇总（日订单量、日营收、客单价等）。
-- 口径说明：
--   order_cnt  = 总订单量（含取消）
--   valid_cnt  = 有效订单量（status = 'completed'）
--   order_amt  = 营收（仅 completed 订单的 price 合计，NULL 已忽略）
--   avg_price  = 客单价 = 营收 / 有效订单量
-- 存储：ORC
-- 运行方式：beeline -u jdbc:hive2://localhost:10000 -f 03_dws.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS wanfeng_dws;
USE wanfeng_dws;

-- ------------------------------------------------------------
-- 汇总：每日订单概况
-- ------------------------------------------------------------
DROP TABLE IF EXISTS dws_order_daily;
CREATE TABLE dws_order_daily (
  dt         DATE,
  order_cnt  BIGINT,         -- 总订单量
  valid_cnt  BIGINT,         -- 有效订单量
  cancel_cnt BIGINT,         -- 取消订单量
  order_amt  DECIMAL(14,2),  -- 营收
  avg_price  DECIMAL(10,2)   -- 客单价
) STORED AS ORC;

INSERT OVERWRITE TABLE dws_order_daily
SELECT
  service_date AS dt,
  COUNT(1) AS order_cnt,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS valid_cnt,
  SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancel_cnt,
  CAST(SUM(CASE WHEN status = 'completed' THEN price ELSE 0 END) AS DECIMAL(14,2)) AS order_amt,
  CAST(
    SUM(CASE WHEN status = 'completed' THEN price ELSE 0 END)
    / NULLIF(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0)
    AS DECIMAL(10,2)
  ) AS avg_price
FROM wanfeng_dwd.dwd_bookings
WHERE service_date IS NOT NULL   -- 日期解析失败的脏数据不进日汇总
GROUP BY service_date;

-- ------------------------------------------------------------
-- 汇总：每日 × 服务 订单/营收
-- ------------------------------------------------------------
DROP TABLE IF EXISTS dws_service_daily;
CREATE TABLE dws_service_daily (
  dt         DATE,
  service    STRING,
  order_cnt  BIGINT,
  order_amt  DECIMAL(14,2)
) STORED AS ORC;

INSERT OVERWRITE TABLE dws_service_daily
SELECT
  service_date AS dt,
  service,
  COUNT(1) AS order_cnt,
  CAST(SUM(CASE WHEN status = 'completed' THEN price ELSE 0 END) AS DECIMAL(14,2)) AS order_amt
FROM wanfeng_dwd.dwd_bookings
WHERE service_date IS NOT NULL
GROUP BY service_date, service;

-- ------------------------------------------------------------
-- 汇总：每日 × 区域 订单/营收
-- ------------------------------------------------------------
DROP TABLE IF EXISTS dws_region_daily;
CREATE TABLE dws_region_daily (
  dt          DATE,
  region_id   INT,
  region_name STRING,
  order_cnt   BIGINT,
  order_amt   DECIMAL(14,2)
) STORED AS ORC;

INSERT OVERWRITE TABLE dws_region_daily
SELECT
  b.service_date AS dt,
  b.region_id,
  r.region_name,
  COUNT(1) AS order_cnt,
  CAST(SUM(CASE WHEN b.status = 'completed' THEN b.price ELSE 0 END) AS DECIMAL(14,2)) AS order_amt
FROM wanfeng_dwd.dwd_bookings b
LEFT JOIN wanfeng_dwd.dim_region r ON b.region_id = r.region_id
WHERE b.service_date IS NOT NULL
GROUP BY b.service_date, b.region_id, r.region_name;

-- ------------------------------------------------------------
-- 汇总：师傅累计业绩（订单量、营收、平均评分）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS dws_staff_stats;
CREATE TABLE dws_staff_stats (
  staff_id   INT,
  staff_name STRING,
  role       STRING,
  order_cnt  BIGINT,
  order_amt  DECIMAL(14,2),
  avg_rate   DOUBLE          -- 来自评价表
) STORED AS ORC;

INSERT OVERWRITE TABLE dws_staff_stats
SELECT
  s.staff_id,
  s.name,
  s.role,
  COALESCE(o.order_cnt, 0) AS order_cnt,
  COALESCE(o.order_amt, 0) AS order_amt,
  r.avg_rate
FROM wanfeng_dwd.dim_staff s
-- 订单口径：先按师傅聚合（避免与评价表 join 造成扇出）
LEFT JOIN (
  SELECT staff_id,
         COUNT(1) AS order_cnt,
         CAST(SUM(CASE WHEN status = 'completed' THEN price ELSE 0 END) AS DECIMAL(14,2)) AS order_amt
  FROM wanfeng_dwd.dwd_bookings
  GROUP BY staff_id
) o ON s.staff_id = o.staff_id
-- 评价口径：先按师傅聚合平均分
LEFT JOIN (
  SELECT staff_id, CAST(AVG(stars) AS DOUBLE) AS avg_rate
  FROM wanfeng_dwd.dwd_reviews
  WHERE stars IS NOT NULL
  GROUP BY staff_id
) r ON s.staff_id = r.staff_id;
