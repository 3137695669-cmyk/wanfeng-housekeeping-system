# -*- coding: utf-8 -*-
"""
晚枫家政 · 离线数仓四层 ETL 调度 DAG

依赖链：ODS → DWD → DWS → ADS
调度：每天一次（@daily）
执行方式：通过 pyhive 连接 HiveServer2（走 Thrift + SASL PLAIN，auth=NONE），
         按顺序执行 hive/ 目录下的 01~04 SQL 脚本。
"""
from datetime import datetime, timedelta

from airflow import DAG
from airflow.operators.python import PythonOperator
from pyhive import hive

SQL_DIR = "/opt/hive-sql"
HIVE_HOST = "hive"
HIVE_PORT = 10000


def _read_statements(path):
    """读取 SQL 脚本，去掉 -- 注释，按 ; 拆成语句列表。"""
    code_lines = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            if "--" in line:
                line = line.split("--", 1)[0]
            code_lines.append(line)
    text = "\n".join(code_lines)
    return [s.strip() for s in text.split(";") if s.strip()]


def _run_sql(sql_file, **context):
    """连接 HiveServer2，逐条执行一个 SQL 脚本。"""
    conn = hive.Connection(
        host=HIVE_HOST, port=HIVE_PORT, username="airflow",
        auth="NONE", database="default",
    )
    try:
        cur = conn.cursor()
        for stmt in _read_statements(f"{SQL_DIR}/{sql_file}"):
            cur.execute(stmt)
        cur.close()
    finally:
        conn.close()


default_args = {
    "owner": "wanfeng",
    "depends_on_past": False,
    "retries": 1,
    "retry_delay": timedelta(minutes=1),
}

with DAG(
    dag_id="wanfeng_etl",
    default_args=default_args,
    description="晚枫家政离线数仓四层 ETL（ODS→DWD→DWS→ADS）",
    schedule="@daily",
    start_date=datetime(2026, 1, 1),
    catchup=False,
    max_active_runs=1,
    tags=["wanfeng", "hive", "etl"],
) as dag:

    ods = PythonOperator(
        task_id="01_ods", python_callable=_run_sql,
        op_kwargs={"sql_file": "01_ods.sql"},
    )
    dwd = PythonOperator(
        task_id="02_dwd", python_callable=_run_sql,
        op_kwargs={"sql_file": "02_dwd.sql"},
    )
    dws = PythonOperator(
        task_id="03_dws", python_callable=_run_sql,
        op_kwargs={"sql_file": "03_dws.sql"},
    )
    ads = PythonOperator(
        task_id="04_ads", python_callable=_run_sql,
        op_kwargs={"sql_file": "04_ads.sql"},
    )

    ods >> dwd >> dws >> ads
