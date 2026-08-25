@echo off
chcp 65001 >nul 2>&1
set "SD=%~sdp0"
cd /d "%SD%backend"
echo Starting Wanfeng Jiazheng...
echo Backend: http://localhost:3000
echo.
start http://localhost:3000
node server.js
echo.
echo Server stopped.
pause
