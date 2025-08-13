#!/bin/bash
# 生產環境部署腳本 (修復後)
echo "🚀 開始部署修復後的系統..."

# 檢查修復狀態
echo "🔍 檢查修復狀態..."
if [ -f "public/login.html" ]; then
    echo "✅ login.html 檔案存在"
else
    echo "❌ login.html 檔案缺失"
    exit 1
fi

# Railway部署
echo "🚂 部署到Railway..."
railway up

echo "✅ 部署完成！"
echo "🔗 生產環境: https://employee-management-system-intermediate.onrender.com"
