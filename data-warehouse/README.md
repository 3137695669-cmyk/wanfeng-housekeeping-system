# 晚枫家政 · 离线数仓（Hadoop + Hive + Airflow）

在现有「晚枫家政服务系统」（Vue3 + Express + MySQL + ECharts）基础上，搭建的离线数仓。
链路：**业务系统(MySQL) → 造数导出 CSV → HDFS → Hive 数仓(ODS/DWD/DWS/ADS) → Airflow 每日调度 → 数据大屏**。

> 本项目为简历「大数据核心项目」，与已有的全栈家政系统互补，形成数据闭环。
> 完整项目规划见仓库根目录 `离线数仓项目计划.txt`。

---

## 一、架构总览

```
业务库(MySQL)
   │  造数脚本 generate_data.py（生成 CSV，模拟导出）
   ▼
HDFS（NameNode + DataNode，真正的分布式存储）
   │  hive.metastore.warehouse.dir = hdfs://namenode:8020/warehouse
   ▼
Hive 离线数仓（四层，计算引擎 Tez 本地模式）
   ├─ ODS  贴源层  原样加载，全 STRING，TEXTFILE，保留脏数据
   ├─ DWD  明细层  清洗/去重/解析日期/解析区域/字段转型，ORC 列存
   ├─ DWS  汇总层  按天/按主题轻度汇总，ORC
   └─ ADS  应用层  直接给大屏：师傅业绩榜、月度经营报表，ORC
   ▼
Apache Airflow（DAG 每日定时调度四层 ETL）
   ▼
ECharts 数据大屏（消费 ADS 结果）
```

维度建模：星型模型
- 事实表：订单事实(100万)、评价事实(20万)
- 维度表：时间(3年)、区域(32)、用户(10万)、师傅(30)、服务(6)

服务拓扑（docker-compose）：

| 服务 | 镜像 | 说明 | 端口 |
|---|---|---|---|
| namenode | apache/hadoop:3.3.6 | HDFS NameNode（RPC 8020 / Web UI 9870） | 8020、9870 |
| datanode | apache/hadoop:3.3.6 | HDFS DataNode（副本数 1） | — |
| hive | apache/hive:4.0.0 | HiveServer2（元数据 Derby，仓库落盘 HDFS） | 10000、10002 |
| airflow | apache/airflow:2.10.5 | 调度四层 ETL（DAG `wanfeng_etl`） | 8080 |

---

## 二、目录结构

```
data-warehouse/
├─ generate_data.py        造数脚本（纯 Python 标准库，零依赖）
├─ docker-compose.yml      HDFS + Hive + Airflow 完整栈
├─ hive/
│  ├─ conf/                自定义 Hadoop/Hive 配置（core-site / hdfs-site / hive-site）
│  ├─ 01_ods.sql          建库 + ODS 建表 + LOAD DATA
│  ├─ 02_dwd.sql          ODS → DWD 清洗
│  ├─ 03_dws.sql          DWD → DWS 汇总
│  └─ 04_ads.sql          DWS → ADS 报表
├─ airflow/
│  ├─ Dockerfile          apache/airflow + pyhive 客户端
│  └─ dags/wanfeng_etl.py 四层 ETL 调度 DAG
├─ csv/                    造数产出（已 gitignore，不入库）
└─ README.md
```

---

## 三、快速开始

### 0. 前置条件
- Docker Desktop（已装，且已配置国内镜像加速器，因为 Docker Hub 直连不通）

### 1. 造数（生成 CSV）
```bash
cd data-warehouse
python generate_data.py           # 全量：订单100万 / 评价20万 / 用户10万
python generate_data.py --small   # 小样：先跑通流程用
```
产出 7 个 Tab 分隔的 CSV 到 `csv/`（Hive 用 `FIELDS TERMINATED BY '\t'` 加载）。

### 2. 启动整套栈
```bash
docker compose up -d --build
docker compose logs -f hive      # 等 HiveServer2 起来（约 1~2 分钟）
```
首次启动会自动：format NameNode → 注册 DataNode → 起 HiveServer2 → 起 Airflow。

### 3. 触发四层 ETL（Airflow 调度）
```bash
# 手动触发一次 DAG（生产上由 @daily 每天 00:00 自动跑）
docker exec wanfeng-airflow airflow dags trigger wanfeng_etl

# 查看 DAG 运行状态
docker exec wanfeng-airflow airflow dags list-runs -d wanfeng_etl
```
- Airflow Web UI：http://localhost:8080 （账号/密码默认 `admin`）
- HDFS Web UI：http://localhost:9870

DAG `wanfeng_etl` 的依赖链：`01_ods → 02_dwd → 03_dws → 04_ads`，
通过 pyhive（`auth=NONE`，SASL PLAIN）连接 HiveServer2 逐层执行。

### 4. 取大屏数据
```bash
docker compose exec hive beeline -u jdbc:hive2://localhost:10000 \
  -e "SELECT * FROM wanfeng_ads.ads_monthly_report ORDER BY ym;"
```

### （可选）手动跑 ETL（不经 Airflow，纯 beeline）
> ⚠️ **Windows 注意**：在 **Git Bash** 里要加 `MSYS_NO_PATHCONV=1`（否则 `/opt/...` 会被转成 `C:/...` 报 `No FileSystem for scheme "C"`）。
> 在 **PowerShell** 里则直接跑，无需这个前缀。

```bash
MSYS_NO_PATHCONV=1 docker compose exec hive beeline -u jdbc:hive2://localhost:10000 -f /opt/hive-sql/01_ods.sql
MSYS_NO_PATHCONV=1 docker compose exec hive beeline -u jdbc:hive2://localhost:10000 -f /opt/hive-sql/02_dwd.sql
MSYS_NO_PATHCONV=1 docker compose exec hive beeline -u jdbc:hive2://localhost:10000 -f /opt/hive-sql/03_dws.sql
MSYS_NO_PATHCONV=1 docker compose exec hive beeline -u jdbc:hive2://localhost:10000 -f /opt/hive-sql/04_ads.sql
```

---

## 四、核心清洗逻辑（DWD 层体现 ETL 能力）

| 清洗点 | 脏数据样例 | 处理方式 |
|---|---|---|
| 日期统一 | `2025/03/31`、`03-15-2025`、`20250315`、`2023年2月14日`、空串、`\N` | CASE + 正则匹配多格式 → `unix_timestamp` 解析为 DATE；空/乱码 → NULL |
| 区域解析 | address 是自由文本 `广东省广州市天河区…` | `LEFT JOIN dim_region ON address LIKE '%区名%'` 提取 region_id |
| 越界值 | stars 出现 0 / 6 | `CASE WHEN stars BETWEEN 1 AND 5`，否则 NULL |
| 空值 | staff_id / price 为空 | `CAST('' AS INT/DECIMAL)` → NULL |
| 去重 | 主键重复 | `ROW_NUMBER() OVER(PARTITION BY id)` 取 rn=1 |

清洗效果（100 万订单实测）：
- 日期解析成功率 ≈ **96%**（4% 空/乱码正确置 NULL）
- 区域解析覆盖率 ≈ **91%**（9% 缺区域地址正确置 NULL）

---

## 五、最终产出（ADS 层）

1. **`wanfeng_ads.ads_staff_performance`** —— 师傅业绩榜（按营收排名 + 平均评分）
   - 示例：田浩（养老护理）32,227 单 / ¥44,421,468.55 / 均分 4.50
2. **`wanfeng_ads.ads_monthly_report`** —— 月度经营报表（36 个月订单量/营收/客单价 + 环比）

---

## 六、踩坑记录

1. **Docker Hub 直连不通** → 配国内镜像加速器（`docker.1ms.run` 支持 `apache/*` 命名空间，`DaoCloud` 只支持 `library/*`）。
2. **`docker pull apache/hive:latest` 报 denied** → 该镜像无 `latest` 标签，用具体版本 `apache/hive:4.0.0`，且走 `docker.1ms.run`。
3. **Git Bash 路径转换** → `MSYS_NO_PATHCONV=1`（见上文）。
4. **`dws_staff_stats` 三表直连扇出卡死** → 订单/评价两个事实表先各自聚合，再按 `staff_id` 关联，避免笛卡尔积。
5. **日期解析失败的行污染月报** → DWS 层加 `WHERE service_date IS NOT NULL` 过滤。
6. **pyhive 连 HiveServer2 报 `TSocket read 0 bytes` / 服务端 `Invalid status -128`** →
   HiveServer2 无论 `hive.server2.authentication` 为何，**传输层都走 SASL**；pyhive 必须用
   `auth='NONE'`（触发 SASL PLAIN 握手，靠 `thrift_sasl` + `pure-sasl`），不能用 `auth='NOSASL'`（裸二进制会被服务端直接断开）。
7. **NameNode healthcheck 用 `localhost` 失败** → NameNode RPC 绑定在主机名 `namenode`（容器 IP），healthcheck 须用 `nc -z namenode 8020`。

---

## 七、简历写法参考

> 基于 Hadoop + Hive 搭建离线数仓，从 MySQL 业务库抽取百万级订单数据落地 HDFS，
> 设计 ODS/DWD/DWS/ADS 四层架构与星型维度模型，使用 Hive SQL 完成 ETL 加工
> （脏日期多格式解析、自由文本地址的区域维度推导、数据去重与越界值清洗），
> 并引入 Apache Airflow 对四层 ETL 做每日定时调度，产出师傅业绩榜与月度经营报表，
> 支撑经营分析大屏。
