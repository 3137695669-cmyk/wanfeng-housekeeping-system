# ============================================
# 晚枫家政服务系统 - VS Code 快速配置脚本
# ============================================

# 使用方法：
# 1. 右键点击此文件
# 2. 选择 "使用 PowerShell 运行"
# 3. 或者在 VS Code 终端中运行: .\一键配置.ps1

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  晚枫家政服务系统 - VS Code 配置工具" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# 获取当前脚本所在目录
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host "[1/5] 检查 .vscode 目录..." -ForegroundColor Yellow
if (-not (Test-Path ".vscode")) {
    New-Item -ItemType Directory -Force -Path ".vscode" | Out-Null
    Write-Host "  ✓ .vscode 目录创建成功" -ForegroundColor Green
} else {
    Write-Host "  ✓ .vscode 目录已存在" -ForegroundColor Green
}

Write-Host "[2/5] 复制配置文件..." -ForegroundColor Yellow

# 复制配置文件
if (Test-Path "配置包_launch.json") {
    Copy-Item "配置包_launch.json" ".vscode\launch.json" -Force
    Write-Host "  ✓ launch.json 已配置" -ForegroundColor Green
}

if (Test-Path "配置包_tasks.json") {
    Copy-Item "配置包_tasks.json" ".vscode\tasks.json" -Force
    Write-Host "  ✓ tasks.json 已配置" -ForegroundColor Green
}

if (Test-Path "配置包_extensions.json") {
    Copy-Item "配置包_extensions.json" ".vscode\extensions.json" -Force
    Write-Host "  ✓ extensions.json 已配置" -ForegroundColor Green
}

if (Test-Path "配置包_settings.json") {
    Copy-Item "配置包_settings.json" ".vscode\settings.json" -Force
    Write-Host "  ✓ settings.json 已配置" -ForegroundColor Green
}

Write-Host "[3/5] 检查 VS Code..." -ForegroundColor Yellow
$vscode = Get-Command code -ErrorAction SilentlyContinue
if ($vscode) {
    Write-Host "  ✓ VS Code 已安装: $($vscode.Source)" -ForegroundColor Green
} else {
    Write-Host "  ⚠ VS Code 未找到，请先安装" -ForegroundColor Red
    Write-Host "    下载地址: https://code.visualstudio.com/" -ForegroundColor Yellow
}

Write-Host "[4/5] 检查 Live Server 插件..." -ForegroundColor Yellow
Write-Host "  ⚠ 请在 VS Code 中手动安装 Live Server 插件" -ForegroundColor Yellow
Write-Host "    快捷键: Ctrl+Shift+X" -ForegroundColor Gray
Write-Host "    搜索: Live Server (Ritwick Dey)" -ForegroundColor Gray

Write-Host "[5/5] 清理配置包文件..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  配置完成！" -ForegroundColor Green
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  下一步操作:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  1. 打开 VS Code" -ForegroundColor White
Write-Host "  2. 选择 文件 → 打开文件夹" -ForegroundColor White
Write-Host "  3. 选择 '晚枫家政服务系统' 文件夹" -ForegroundColor White
Write-Host "  4. 安装 Live Server 插件" -ForegroundColor White
Write-Host "  5. 右键点击 晚枫家政服务.html" -ForegroundColor White
Write-Host "  6. 选择 'Open with Live Server'" -ForegroundColor White
Write-Host ""
Write-Host "  祝项目顺利！🍁" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# 打开 VS Code（如果已安装）
if ($vscode) {
    Write-Host "是否现在打开 VS Code? (Y/N): " -NoNewline -ForegroundColor Yellow
    $response = Read-Host
    if ($response -eq 'Y' -or $response -eq 'y') {
        code .
        Write-Host "VS Code 已打开！" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "按任意键退出..." -NoNewline
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
