@echo off
echo 🚀 開始部署企業員工管理系統到Railway...

REM 檢查Railway CLI
where railway >nul 2>nul
if %errorlevel% neq 0 (
    echo 📦 安裝 Railway CLI...
    npm install -g @railway/cli
)

REM 登入Railway
echo 🔐 請確認已登入Railway...
railway whoami || railway login

REM 初始化專案
if not exist "railway.json" (
    echo 🏗️ 初始化Railway專案...
    railway init
)

REM 設置環境變數
echo 🔧 設置生產環境變數...
railway variables set NODE_ENV=production
railway variables set PORT=3000

REM 部署應用
echo 🚀 部署應用...
railway up

echo ✅ 部署完成！
echo 🌐 請查看Railway Dashboard獲取部署URL
pause
