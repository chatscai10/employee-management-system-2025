#!/bin/bash
# GitHub + Render 部署腳本

echo "🚀 開始GitHub + Render部署流程..."

# 檢查Git狀態
echo "📋 檢查Git狀態..."
git status

# 推送到GitHub
echo "📦 推送到GitHub..."
echo "請確認已設置遠端倉庫: git remote add origin YOUR_REPO_URL"
git push -u origin main

echo "✅ 推送完成！"
echo ""
echo "🌐 現在可以在Render中部署:"
echo "1. 前往 https://render.com"
echo "2. 新增 Web Service"
echo "3. 連接GitHub倉庫"
echo "4. 設置構建和啟動命令"
echo "5. 配置環境變數"
echo ""
echo "🎉 部署完成後您將獲得一個公開URL！"
