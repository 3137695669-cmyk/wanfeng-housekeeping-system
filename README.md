# 晚枫家政服务系统 - 前后端分离版

## 📋 项目简介

本项目已从纯前端版本升级为**前后端分离架构**：
- **前端**：Vue 3 + Vite
- **后端**：Node.js + Express + SQLite3
- **数据存储**：SQLite 本地数据库

## 📁 目录结构

```
晚枫家政服务系统/
├── backend/                    # 后端项目
│   ├── package.json
│   ├── server.js              # 后端入口
│   ├── database.js            # 数据库初始化
│   └── routes/                # API 路由
│       ├── users.js
│       ├── staff.js
│       ├── services.js
│       ├── bookings.js
│       └── reviews.js
├── frontend/                  # 前端项目
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.js
│       ├── App.vue
│       ├── api.js             # API 封装
│       ├── style.css
│       └── components/        # Vue 组件
│           ├── NavBar.vue
│           ├── HeroSection.vue
│           ├── ServicesSection.vue
│           ├── StaffSection.vue
│           ├── AboutSection.vue
│           ├── BookingSection.vue
│           ├── ReviewsSection.vue
│           ├── Footer.vue
│           ├── Toast.vue
│           ├── LoginModal.vue
│           ├── RegisterModal.vue
│           └── AdminPanel.vue
├── 晚枫家政服务.html          # 旧版纯前端文件（保留）
└── README.md                  # 本文件
```

## 🚀 快速启动

### 前置要求

- Node.js 16+ 已安装
- npm 或 yarn 包管理器

### 1️⃣ 安装后端依赖并启动

```bash
cd backend
npm install
npm start
```

后端服务将在 `http://localhost:3000` 启动

### 2️⃣ 安装前端依赖并启动

新开一个终端窗口：

```bash
cd frontend
npm install
npm run dev
```

前端服务将在 `http://localhost:5173` 启动

### 3️⃣ 访问应用

在浏览器中打开：`http://localhost:5173`

## 🔧 API 接口说明

### 健康检查

- `GET /api/health` - 检查后端是否正常运行

### 用户相关

- `GET /api/users` - 获取用户列表
- `POST /api/users/register` - 用户注册
- `POST /api/users/login` - 用户登录

### 服务人员相关

- `GET /api/staff` - 获取所有服务人员
- `GET /api/staff/:id` - 获取单个服务人员详情
- `POST /api/staff/login` - 服务人员登录
- `PUT /api/staff/:id/rate` - 更新服务人员评分

### 服务项目相关

- `GET /api/services` - 获取所有服务项目
- `GET /api/services/:id` - 获取单个服务详情
- `PUT /api/services/:id` - 更新服务信息

### 预约相关

- `GET /api/bookings` - 获取预约列表
- `GET /api/bookings/staff/:staffId` - 获取服务人员的预约
- `POST /api/bookings` - 创建预约
- `PUT /api/bookings/:id/status` - 更新预约状态

### 评价相关

- `GET /api/reviews` - 获取评价列表
- `GET /api/reviews/stats` - 获取评价统计
- `POST /api/reviews` - 发表评价

## 💾 数据库说明

- 数据库文件位置：`backend/data/wanfeng.db`
- 数据库会在首次启动时自动创建并初始化默认数据
- 默认数据包括：6个服务项目、8位服务人员、6条用户评价

## 📝 注意事项

1. 确保两个终端都在运行（前端和后端）
2. 前端通过 Vite 代理转发 `/api` 请求到后端
3. 如遇端口冲突，可分别修改端口号
4. 旧版文件 `晚枫家政服务.html` 仍然可用作对比参考

## 🎯 默认数据（首次启动自动创建）

### 服务项目
- 日常保洁、深度清洁、月嫂服务、养老护理、家电清洗、收纳整理

### 服务人员
- 李秀芳（金牌月嫂）、张美华（资深保洁）、王桂兰（养老护理）等8人

### 用户评价
- 预设6条真实客户好评

---

祝使用愉快！🍁
