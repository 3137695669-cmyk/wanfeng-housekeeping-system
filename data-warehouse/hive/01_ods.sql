-- ============================================================
-- 晚枫家政 · 离线数仓  ODS 层（贴源层）
-- ------------------------------------------------------------
-- 作用：原样加载「业务库(MySQL)导出」的 CSV，不做任何加工。
--       所有字段统一 STRING，保留脏数据（混合日期格式 / 自由文本 / JSON）。
-- 分隔符：Tab（FIELDS TERMINATED BY '\t'）
-- 文件来源：容器内 /data/csv/*.csv（由 docker-compose 挂载本机 data-warehouse/csv）
-- 运行方式：beeline -u jdbc:hive2://localhost:10000 -f 01_ods.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS wanfeng_ods;
USE wanfeng_ods;

-- ------------------------------------------------------------
-- 事实表 1：订单（脏数据集中营）
--   service_date：VARCHAR，混了 yyyy-MM-dd / yyyy/MM/dd / MM-dd-yyyy / yyyyMMdd / 中文 / 空 / \N
--   address     ：自由文本，内嵌区名，部分缺失或缺区域
--   staff_id    ：部分为空（未派单）
--   price       ：部分为空
-- ------------------------------------------------------------
DROP TABLE IF EXISTS ods_bookings;
CREATE TABLE ods_bookings (
  id            STRING,
  user_name     STRING,
  user_phone    STRING,
  service       STRING,
  service_date  STRING,
  address       STRING,
  remark        STRING,
  staff_id      STRING,
  staff_name    STRING,
  status        STRING,
  created_at    STRING,
  price         STRING
)
ROW FORMAT DELIMITED FIELDS TERMINATED BY '\t'
STORED AS TEXTFILE
TBLPROPERTIES ('skip.header.line.count'='1');

LOAD DATA LOCAL INPATH '/data/csv/bookings.csv' INTO TABLE ods_bookings;

-- ------------------------------------------------------------
-- 事实表 2：评价
--   date ：VARCHAR 混合格式（同订单）
--   stars：少量越界值（0 / 6）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS ods_reviews;
CREATE TABLE ods_reviews (
  id          STRING,
  name        STRING,
  avatar      STRING,
  text        STRING,
  stars       STRING,
  service     STRING,
  staff_id    STRING,
  staff_name  STRING,
  dt          STRING,          -- 原 CSV 列名是 date（保留字），此处改名，位置加载不受影响
  created_at  STRING
)
ROW FORMAT DELIMITED FIELDS TERMINATED BY '\t'
STORED AS TEXTFILE
TBLPROPERTIES ('skip.header.line.count'='1');

LOAD DATA LOCAL INPATH '/data/csv/reviews.csv' INTO TABLE ods_reviews;

-- ------------------------------------------------------------
-- 维度表：用户（含增强字段 gender / age / register_channel）
--   preferences：JSON 数组文本
-- ------------------------------------------------------------
DROP TABLE IF EXISTS ods_users;
CREATE TABLE ods_users (
  id                STRING,
  name              STRING,
  phone             STRING,
  password          STRING,
  address           STRING,
  preferences       STRING,
  created_at        STRING,
  gender            STRING,
  age               STRING,
  register_channel  STRING
)
ROW FORMAT DELIMITED FIELDS TERMINATED BY '\t'
STORED AS TEXTFILE
TBLPROPERTIES ('skip.header.line.count'='1');

LOAD DATA LOCAL INPATH '/data/csv/users.csv' INTO TABLE ods_users;

-- ------------------------------------------------------------
-- 维度表：师傅（tags 为 JSON 文本，少量非法 JSON）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS ods_staff;
CREATE TABLE ods_staff (
  id          STRING,
  name        STRING,
  role        STRING,
  photo       STRING,
  badge       STRING,
  tags        STRING,
  orders      STRING,
  rate        STRING,
  years       STRING,
  phone       STRING,
  password    STRING,
  created_at  STRING
)
ROW FORMAT DELIMITED FIELDS TERMINATED BY '\t'
STORED AS TEXTFILE
TBLPROPERTIES ('skip.header.line.count'='1');

LOAD DATA LOCAL INPATH '/data/csv/staff.csv' INTO TABLE ods_staff;

-- ------------------------------------------------------------
-- 维度表：服务（干净）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS ods_services;
CREATE TABLE ods_services (
  id           STRING,
  name         STRING,
  icon         STRING,
  description  STRING,
  price        STRING,
  price_unit   STRING,
  created_at   STRING
)
ROW FORMAT DELIMITED FIELDS TERMINATED BY '\t'
STORED AS TEXTFILE
TBLPROPERTIES ('skip.header.line.count'='1');

LOAD DATA LOCAL INPATH '/data/csv/services.csv' INTO TABLE ods_services;

-- ------------------------------------------------------------
-- 维度表：时间（干净，3 年 1096 行）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS ods_dim_date;
CREATE TABLE ods_dim_date (
  date_id      STRING,
  dt           STRING,          -- 原 CSV 列名 date
  year         STRING,
  month        STRING,
  day          STRING,
  quarter      STRING,
  week_of_year STRING,
  day_of_week  STRING,
  is_weekend   STRING,
  is_holiday   STRING
)
ROW FORMAT DELIMITED FIELDS TERMINATED BY '\t'
STORED AS TEXTFILE
TBLPROPERTIES ('skip.header.line.count'='1');

LOAD DATA LOCAL INPATH '/data/csv/dim_date.csv' INTO TABLE ods_dim_date;

-- ------------------------------------------------------------
-- 维度表：区域（干净）
-- ------------------------------------------------------------
DROP TABLE IF EXISTS ods_dim_region;
CREATE TABLE ods_dim_region (
  region_id    STRING,
  region_name  STRING,
  city         STRING,
  province     STRING
)
ROW FORMAT DELIMITED FIELDS TERMINATED BY '\t'
STORED AS TEXTFILE
TBLPROPERTIES ('skip.header.line.count'='1');

LOAD DATA LOCAL INPATH '/data/csv/dim_region.csv' INTO TABLE ods_dim_region;
