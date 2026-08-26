# 在官方 Airflow 镜像上补一个 pyhive 客户端，用于通过 HiveServer2 跑四层 ETL。
# auth=NONE：走 SASL PLAIN 握手（HiveServer2 无论 authentication 为何都用 SASL transport，
# NOSASL 会被服务端以 "Invalid status -128" 拒绝）。thrift_sasl 自带 pure-sasl，无需编译 C 扩展。
FROM apache/airflow:2.10.5
RUN pip install --no-cache-dir -i https://pypi.tuna.tsinghua.edu.cn/simple pyhive thrift thrift_sasl
