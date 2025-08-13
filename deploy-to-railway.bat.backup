@echo off
echo ========================================
echo 企業級員工管理系統 - Railway部署腳本
echo ========================================

echo.
echo 步驟1: 檢查Railway CLI安裝
railway --version
if %errorlevel% neq 0 (
    echo ❌ Railway CLI未安裝，請先執行: npm install -g @railway/cli
    pause
    exit /b 1
)

echo.
echo 步驟2: 登入Railway (如果尚未登入)
echo 請執行: railway login
echo 完成登入後按任意鍵繼續...
pause

echo.
echo 步驟3: 初始化Railway專案
railway init

echo.
echo 步驟4: 添加PostgreSQL資料庫
railway add postgresql

echo.
echo 步驟5: 設定環境變數
railway variables:set NODE_ENV=production
railway variables:set JWT_SECRET=enterprise-management-system-jwt-secret-2025
railway variables:set TELEGRAM_BOT_TOKEN=7659930552:AAF_jF1rAXFnjFO176-9X5fKfBwbrko8BNc
railway variables:set TELEGRAM_CHAT_ID=-1002658082392
railway variables:set CORS_ORIGIN=*
railway variables:set RATE_LIMIT_WINDOW=900000
railway variables:set RATE_LIMIT_MAX=100
railway variables:set RATE_LIMIT_LOGIN_MAX=5
railway variables:set APP_NAME=企業員工管理系統
railway variables:set SEQUELIZE_LOGGING=false
railway variables:set FORCE_DB_SYNC=true

echo.
echo 步驟6: 部署應用程式
railway up

echo.
echo 步驟7: 開啟應用程式
railway open

echo.
echo ========================================
echo 🎉 部署完成！
echo ========================================
echo 您的企業管理系統現在已經在雲端運行！
pause