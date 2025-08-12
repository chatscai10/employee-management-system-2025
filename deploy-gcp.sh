#!/bin/bash
# Google Cloud Platform 部署腳本
# 企業員工管理系統

echo "🚀 開始部署企業員工管理系統到 Google Cloud Platform..."

# 檢查 gcloud CLI
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud CLI 未安裝"
    echo "請先安裝: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

echo "✅ Google Cloud CLI 已安裝"

# 設定專案ID (請替換為您的專案ID)
PROJECT_ID="enterprise-employee-mgmt"
echo "🏗️ 使用專案ID: $PROJECT_ID"

# 登入和設定專案 (如果需要)
echo "🔐 檢查登入狀態..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -1 > /dev/null 2>&1; then
    echo "請先登入 Google Cloud:"
    gcloud auth login
fi

# 設定專案
echo "🏗️ 設定專案..."
gcloud config set project $PROJECT_ID

# 啟用必要的API
echo "🔧 啟用必要的API服務..."
gcloud services enable appengine.googleapis.com
gcloud services enable cloudbuild.googleapis.com

# 檢查App Engine是否已初始化
echo "🔍 檢查App Engine狀態..."
if ! gcloud app describe > /dev/null 2>&1; then
    echo "🏗️ 初始化App Engine..."
    gcloud app create --region=asia-east1
fi

# 部署應用
echo "🚀 開始部署應用..."
gcloud app deploy app.yaml --quiet

# 獲取應用URL
echo "🌐 獲取應用URL..."
gcloud app browse

echo "✅ 部署完成！"
echo "📱 您可以在Google Cloud Console查看應用狀態"
echo "🔧 管理面板: https://console.cloud.google.com/appengine"
