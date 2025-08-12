#!/bin/bash
# 企業員工管理系統 Railway 部署腳本

echo "🚀 開始部署企業員工管理系統到Railway..."

# 檢查Railway CLI
if ! command -v railway &> /dev/null; then
    echo "📦 安裝 Railway CLI..."
    npm install -g @railway/cli
fi

# 登入Railway (如果需要)
echo "🔐 請確認已登入Railway..."
railway whoami || railway login

# 初始化專案 (如果需要)
if [ ! -f "railway.json" ]; then
    echo "🏗️ 初始化Railway專案..."
    railway init
fi

# 設置環境變數
echo "🔧 設置生產環境變數..."
railway variables set NODE_ENV=production
railway variables set PORT=3000

# 部署應用
echo "🚀 部署應用..."
railway up

echo "✅ 部署完成！"
echo "🌐 請查看Railway Dashboard獲取部署URL"
