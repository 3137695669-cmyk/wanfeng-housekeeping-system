-- ============================================================
-- 晚枫家政 · 离线数仓  ADS 层（应用层）
-- ------------------------------------------------------------
-- 作用：直接面向报表 / 数据大屏，产出最终指标。
--   1) ads_staff_performance：师傅业绩榜（按营收排序）
--   2) ads_monthly_report   ：月度经营报表（含环比）
-- 存储：ORC
-- 运行方式：beeline -u jdbc:hive2://localhost:10000 -f 04_ads.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS wanfeng_ads;
USE wanfeng_ads;

-- ------------------------------------------------------------
-- 应用表 1：师傅业绩榜（给大屏「师傅业绩榜」用）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS ads_staff_performance;
CREATE TABLE ads_staff_performance (
  rnk         INT,             -- 排名
  staff_id    INT,
  staff_name  STRING,
  role        STRING,
  order_cnt   BIGINT,
  order_amt   DECIMAL(14,2),   -- 营收
  avg_rate    DOUBLE           -- 平均评分
) STORED AS ORC;

INSERT OVERWRITE TABLE ads_staff_performance
SELECT
  ROW_NUMBER() OVER (ORDER BY order_amt DESC) AS rnk,
  staff_id, staff_name, role, order_cnt, order_amt, avg_rate
FROM wanfeng_dws.dws_staff_stats
WHERE order_cnt > 0;

-- ------------------------------------------------------------
-- 应用表 2：月度经营报表（给大屏「月度订单/营收趋势」用，含环比）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS ads_monthly_report;
CREATE TABLE ads_monthly_report (
  ym            STRING,         -- 月份，如 '2025-03'
  order_cnt     BIGINT,         -- 月订单量
  order_amt     DECIMAL(14,2),  -- 月营收
  avg_price     DECIMAL(10,2),  -- 客单价
  mom_cnt_rate  DOUBLE          -- 订单量环比（本月/上月 - 1）
) STORED AS ORC;

INSERT OVERWRITE TABLE ads_monthly_report
SELECT
  ym,
  order_cnt,
  order_amt,
  avg_price,
  (order_cnt - prev_cnt) / NULLIF(prev_cnt, 0) AS mom_cnt_rate
FROM (
  SELECT
    ym,
    order_cnt,
    order_amt,
    avg_price,
    LAG(order_cnt) OVER (ORDER BY ym) AS prev_cnt
  FROM (
    SELECT
      date_format(dt, 'yyyy-MM') AS ym,
      SUM(order_cnt) AS order_cnt,
      CAST(SUM(order_amt) AS DECIMAL(14,2)) AS order_amt,
      CAST(SUM(order_amt) / NULLIF(SUM(valid_cnt), 0) AS DECIMAL(10,2)) AS avg_price
    FROM wanfeng_dws.dws_order_daily
    GROUP BY date_format(dt, 'yyyy-MM')
  ) m
) t;

-- ------------------------------------------------------------
-- 大屏取数示例（ECharts 直接消费）：
--   月度趋势：SELECT * FROM wanfeng_ads.ads_monthly_report ORDER BY ym;
--   师傅业绩：SELECT * FROM wanfeng_ads.ads_staff_performance ORDER BY rnk;
-- ------------------------------------------------------------
