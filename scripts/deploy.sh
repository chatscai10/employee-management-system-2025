#!/bin/bash
# ===========================
# 企業員工管理系統部署腳本
# ===========================

echo "🚀 開始部署企業員工管理系統"
echo "==============================================="

# 檢查 Node.js 版本
echo "📦 檢查 Node.js 環境..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安裝，請先安裝 Node.js 18.x 或更高版本"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'.' -f1 | cut -d'v' -f2)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 版本過低，需要 18.x 或更高版本"
    exit 1
fi

echo "✅ Node.js 版本檢查通過: $(node -v)"

# 檢查 npm 版本
echo "📦 檢查 npm 環境..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安裝"
    exit 1
fi

echo "✅ npm 版本: $(npm -v)"

# 安裝依賴套件
echo "📦 安裝依賴套件..."
npm install --production

if [ $? -ne 0 ]; then
    echo "❌ 依賴套件安裝失敗"
    exit 1
fi

echo "✅ 依賴套件安裝完成"

# 檢查環境變數檔案
echo "⚙️ 檢查環境配置..."
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "📋 複製環境變數範例檔案..."
        cp .env.example .env
        echo "⚠️ 請編輯 .env 檔案設置正確的環境變數"
    else
        echo "❌ 找不到 .env 或 .env.example 檔案"
        exit 1
    fi
fi

echo "✅ 環境配置檢查完成"

# 創建必要目錄
echo "📁 創建必要目錄..."
mkdir -p logs
mkdir -p public/uploads/{revenue,maintenance,temp}
mkdir -p server/uploads/{revenue,maintenance,temp}

echo "✅ 目錄結構創建完成"

# 執行測試
echo "🧪 執行系統測試..."
npm test 2>/dev/null || echo "⚠️ 測試腳本未配置或測試失敗"

# 檢查語法錯誤
echo "🔍 檢查程式碼語法..."
node -c server/server.js

if [ $? -ne 0 ]; then
    echo "❌ 程式碼語法檢查失敗"
    exit 1
fi

echo "✅ 程式碼語法檢查通過"

# 設置檔案權限
echo "🔒 設置檔案權限..."
chmod -R 755 scripts/
chmod -R 755 public/
chmod 600 .env 2>/dev/null || echo "⚠️ .env 檔案權限設置失敗"

echo "✅ 檔案權限設置完成"

# 檢查連接埠是否被佔用
echo "🔌 檢查連接埠狀態..."
PORT=${PORT:-3000}

if command -v lsof &> /dev/null; then
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null; then
        echo "⚠️ 連接埠 $PORT 已被佔用"
        echo "請修改 .env 檔案中的 PORT 設定或停止佔用該連接埠的程序"
    else
        echo "✅ 連接埠 $PORT 可用"
    fi
else
    echo "⚠️ 無法檢查連接埠狀態 (lsof 未安裝)"
fi

# 啟動應用程式
echo "🚀 啟動應用程式..."

# 檢查是否安裝 PM2
if command -v pm2 &> /dev/null; then
    echo "🔄 使用 PM2 啟動應用程式..."
    
    # 停止現有實例 (如果存在)
    pm2 stop employee-management-system 2>/dev/null || echo "📝 沒有現有的PM2實例需要停止"
    
    # 啟動新實例
    pm2 start ecosystem.config.js --env production
    
    if [ $? -eq 0 ]; then
        echo "✅ PM2 啟動成功"
        pm2 list
        pm2 logs employee-management-system --lines 10
    else
        echo "❌ PM2 啟動失敗"
        exit 1
    fi
    
else
    echo "🔄 使用 npm 啟動應用程式..."
    echo "⚠️ 建議安裝 PM2 以獲得更好的生產環境管理"
    echo "安裝命令: npm install -g pm2"
    
    # 後台啟動
    nohup npm start > logs/app.log 2>&1 &
    APP_PID=$!
    
    # 等待啟動
    sleep 3
    
    # 檢查是否啟動成功
    if ps -p $APP_PID > /dev/null; then
        echo "✅ 應用程式啟動成功 (PID: $APP_PID)"
        echo "📄 日誌文件: logs/app.log"
    else
        echo "❌ 應用程式啟動失敗"
        cat logs/app.log
        exit 1
    fi
fi

# 健康檢查
echo "🏥 執行健康檢查..."
sleep 5

if command -v curl &> /dev/null; then
    HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/health)
    
    if [ "$HEALTH_CHECK" = "200" ]; then
        echo "✅ 健康檢查通過"
        echo "🌐 應用程式已成功部署並運行"
        echo "📍 訪問地址: http://localhost:$PORT"
        echo "📊 健康檢查: http://localhost:$PORT/health"
    else
        echo "❌ 健康檢查失敗 (HTTP $HEALTH_CHECK)"
        exit 1
    fi
else
    echo "⚠️ curl 未安裝，無法執行健康檢查"
    echo "🌐 請手動訪問 http://localhost:$PORT 檢查應用程式狀態"
fi

echo ""
echo "🎉 部署完成！"
echo "==============================================="
echo "📱 應用程式: 企業員工管理系統"
echo "🌐 訪問地址: http://localhost:$PORT"
echo "📊 健康檢查: http://localhost:$PORT/health"
echo "📄 日誌目錄: logs/"

if command -v pm2 &> /dev/null; then
    echo "🔧 PM2 管理命令:"
    echo "  查看狀態: pm2 list"
    echo "  查看日誌: pm2 logs employee-management-system"
    echo "  重新啟動: pm2 restart employee-management-system"
    echo "  停止服務: pm2 stop employee-management-system"
fi

echo "==============================================="