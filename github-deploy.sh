#!/bin/bash

# 🚀 GitHub Repository 自動創建和部署腳本

echo "🚀 開始創建 GitHub Repository..."

# Repository 信息
REPO_NAME="enterprise-employee-management-system"
REPO_DESCRIPTION="🏢 Enterprise Employee Management System - Railway Cloud Deployment Ready | 企業員工管理系統 - Railway 雲端部署完整版"
GITHUB_USERNAME="user"  # 請替換為您的 GitHub 用戶名

echo "📝 Repository 信息:"
echo "名稱: $REPO_NAME"
echo "描述: $REPO_DESCRIPTION"
echo ""

# 檢查是否已有遠端倉庫
if git remote get-url origin 2>/dev/null; then
    echo "✅ 已存在遠端倉庫，推送更新..."
    git push origin master
else
    echo "📋 請手動執行以下步驟創建 GitHub Repository:"
    echo ""
    echo "1. 前往 https://github.com/new"
    echo "2. Repository name: $REPO_NAME"
    echo "3. Description: $REPO_DESCRIPTION"
    echo "4. 設置為 Public (方便 Railway 部署)"
    echo "5. 不要初始化 README、.gitignore 或 LICENSE (已存在)"
    echo "6. 點擊 'Create repository'"
    echo ""
    echo "7. 創建後，執行以下命令連接遠端倉庫:"
    echo "   git remote add origin https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
    echo "   git branch -M master"
    echo "   git push -u origin master"
    echo ""
fi

echo "🔗 Repository URL 將會是:"
echo "https://github.com/$GITHUB_USERNAME/$REPO_NAME"
echo ""
echo "🚀 完成後，您可以立即使用 Railway 部署:"
echo "1. 前往 https://railway.app"
echo "2. 選擇 'Deploy from GitHub repo'"
echo "3. 選擇剛創建的 repository"
echo "4. Railway 自動檢測配置並開始部署"
echo ""
echo "✅ GitHub 部署準備完成！"