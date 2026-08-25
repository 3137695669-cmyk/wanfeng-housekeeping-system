# 晚枫家政服务系统 - VS Code 配置指南

## 📁 需要手动创建的配置文件

由于系统限制，请手动创建以下文件：

---

### 1️⃣ 创建 .vscode 目录
在项目根目录创建 `.vscode` 文件夹

---

### 2️⃣ 创建 `.vscode/launch.json`

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "启动本地服务器并调试",
      "type": "chrome",
      "request": "launch",
      "file": "${workspaceFolder}/晚枫家政服务.html",
      "userDataDir": false,
      "preLaunchTask": "启动LiveServer"
    },
    {
      "name": "直接打开HTML文件",
      "type": "chrome",
      "request": "launch",
      "file": "${workspaceFolder}/晚枫家政服务.html",
      "userDataDir": false
    }
  ]
}
```

---

### 3️⃣ 创建 `.vscode/tasks.json`

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "启动LiveServer",
      "type": "shell",
      "command": "npx",
      "args": ["live-server", "--port=5500"],
      "isBackground": true,
      "problemMatcher": [],
      "group": {
        "kind": "none",
        "isDefault": true
      }
    },
    {
      "label": "安装依赖",
      "type": "shell",
      "command": "npm",
      "args": ["install"],
      "problemMatcher": []
    }
  ]
}
```

---

### 4️⃣ 创建 `.vscode/extensions.json`

```json
{
  "recommendations": [
    "ritwickdey.live-server",
    "ms-vscode.vscode-typescript-next",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

---

## 🚀 快速使用步骤

### 方式一：使用 Live Server 插件（推荐）

1. **安装 VS Code**
   - 下载地址：https://code.visualstudio.com/

2. **安装插件**
   - 在 VS Code 中按 `Ctrl+Shift+X`
   - 搜索安装 **"Live Server"** 插件（作者: Ritwick Dey）

3. **打开项目**
   - 在 VS Code 中选择 "文件" → "打开文件夹"
   - 选择 `晚枫家政服务系统` 文件夹

4. **启动调试**
   - 右键点击 `晚枫家政服务.html` 文件
   - 选择 "Open with Live Server"
   - 或者按 `Alt+L Alt+O`

---

### 方式二：手动配置调试

1. 按照上面的步骤创建 `.vscode` 文件夹和配置文件
2. 按 `F5` 启动调试
3. 选择 "启动本地服务器并调试"

---

## 📝 其他有用的 VS Code 快捷键

| 功能 | 快捷键 |
|------|--------|
| 打开命令面板 | `Ctrl+Shift+P` |
| 快速打开文件 | `Ctrl+P` |
| 全局搜索 | `Ctrl+Shift+F` |
| 格式化代码 | `Shift+Alt+F` |
| 自动重命名标签 | 选中标签按 `Ctrl+Shift+P` → "Auto Rename Tag" |
| 打开终端 | `` Ctrl+` `` |

---

## 🎯 推荐的 VS Code 设置

按 `Ctrl+,` 打开设置，添加以下配置：

```json
{
  "editor.fontSize": 14,
  "editor.tabSize": 2,
  "editor.formatOnSave": true,
  "emmet.includeLanguages": {
    "javascript": "javascriptreact"
  },
  "liveServer.settings.CustomBrowser": "edge",
  "liveServer.settings.port": 5500
}
```

---

## 📦 项目已配置的功能

✅ HTML5 页面结构  
✅ CSS3 动画效果  
✅ JavaScript 业务逻辑  
✅ LocalStorage 数据持久化  
✅ 响应式设计  

---

## ❓ 常见问题

**Q: 为什么选择 Live Server？**
A: Live Server 可以自动刷新页面，方便调试。

**Q: 如何使用 Chrome 调试？**
A: 安装 "Debugger for Chrome" 插件，然后按 F5 启动调试。

**Q: 是否需要安装 Node.js？**
A: 不需要，纯前端项目可以直接用浏览器打开。

---

## 📂 项目结构

```
晚枫家政服务系统/
├── 晚枫家政服务.html    # 主页面
├── 项目说明书.txt       # 项目说明文档
├── .vscode/            # ⚠️ 需手动创建
│   ├── launch.json
│   ├── tasks.json
│   └── extensions.json
└── .claude/           # AI助手配置
```

---

有任何问题请随时询问！祝项目顺利完成！ 🍁
