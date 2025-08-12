@echo off
REM Google Cloud Platform 部署腳本
REM 企業員工管理系統

echo 🚀 開始部署企業員工管理系統到 Google Cloud Platform...

REM 檢查 gcloud CLI
where gcloud >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Google Cloud CLI 未安裝
    echo 請先安裝: https://cloud.google.com/sdk/docs/install-sdk#windows
    pause
    exit /b 1
)

echo ✅ Google Cloud CLI 已安裝

REM 設定專案ID
set PROJECT_ID=enterprise-employee-mgmt
echo 🏗️ 使用專案ID: %PROJECT_ID%

REM 登入檢查
echo 🔐 檢查登入狀態...
gcloud auth list --filter=status:ACTIVE --format="value(account)" >nul 2>nul
if %errorlevel% neq 0 (
    echo 請先登入 Google Cloud:
    gcloud auth login
)

REM 設定專案
echo 🏗️ 設定專案...
gcloud config set project %PROJECT_ID%

REM 啟用API
echo 🔧 啟用必要的API服務...
gcloud services enable appengine.googleapis.com
gcloud services enable cloudbuild.googleapis.com

REM 檢查App Engine
echo 🔍 檢查App Engine狀態...
gcloud app describe >nul 2>nul
if %errorlevel% neq 0 (
    echo 🏗️ 初始化App Engine...
    gcloud app create --region=asia-east1
)

REM 部署應用
echo 🚀 開始部署應用...
gcloud app deploy app.yaml --quiet

REM 獲取URL
echo 🌐 獲取應用URL...
gcloud app browse

echo ✅ 部署完成！
echo 📱 您可以在Google Cloud Console查看應用狀態
echo 🔧 管理面板: https://console.cloud.google.com/appengine
pause
