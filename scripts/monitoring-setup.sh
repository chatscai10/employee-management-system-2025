#!/bin/bash

# 📊 監控系統設置腳本
# Monitoring System Setup Script

set -e
set -u

echo "📊 開始設置監控系統..."

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置
PROJECT_NAME="employee-management-system"
LOG_DIR="/var/log/${PROJECT_NAME}"
MONITORING_LOG="${LOG_DIR}/monitoring-setup.log"

mkdir -p "${LOG_DIR}"

# 函數定義
log_info() {
    echo -e "${BLUE}[MONITORING]${NC} $1" | tee -a "${MONITORING_LOG}"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "${MONITORING_LOG}"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "${MONITORING_LOG}"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "${MONITORING_LOG}"
}

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 函數：設置系統監控
setup_system_monitoring() {
    log_info "🖥️ 設置系統監控..."
    
    # 創建系統監控腳本
    cat > /tmp/system-monitor.sh << 'EOF'
#!/bin/bash

# 系統監控腳本
PROJECT_NAME="employee-management-system"
METRICS_FILE="/tmp/${PROJECT_NAME}_metrics.json"

# 獲取系統指標
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}' | tr -d ' ')
MEMORY_INFO=$(free | grep Mem)
MEMORY_TOTAL=$(echo $MEMORY_INFO | awk '{print $2}')
MEMORY_USED=$(echo $MEMORY_INFO | awk '{print $3}')
MEMORY_USAGE=$(awk "BEGIN {printf \"%.2f\", ($MEMORY_USED/$MEMORY_TOTAL)*100}")

DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | tr -d '%')
LOAD_AVERAGE=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | tr -d ',')

# 檢查服務狀態
SERVICE_STATUS="unknown"
if pgrep -f "node.*server" > /dev/null; then
    SERVICE_STATUS="running"
else
    SERVICE_STATUS="stopped"
fi

# 檢查網路連接
NETWORK_STATUS="ok"
if ! curl -f -s http://localhost:3000/api/health > /dev/null 2>&1; then
    NETWORK_STATUS="error"
fi

# 生成 JSON 指標
cat > "$METRICS_FILE" << EOJ
{
    "timestamp": $(date +%s),
    "cpu": $CPU_USAGE,
    "memory": $MEMORY_USAGE,
    "disk": $DISK_USAGE,
    "loadAverage": $LOAD_AVERAGE,
    "service": "$SERVICE_STATUS",
    "network": "$NETWORK_STATUS",
    "hostname": "$(hostname)"
}
EOJ

# 發送指標到監控服務 (如果配置了)
if [ -n "${MONITORING_ENDPOINT:-}" ]; then
    curl -X POST "$MONITORING_ENDPOINT/metrics" \
         -H "Content-Type: application/json" \
         -d @"$METRICS_FILE" > /dev/null 2>&1 || true
fi
EOF
    
    chmod +x /tmp/system-monitor.sh
    sudo mv /tmp/system-monitor.sh /usr/local/bin/system-monitor.sh
    
    log_success "✅ 系統監控腳本已安裝"
}

# 函數：設置 Cron 任務
setup_cron_jobs() {
    log_info "⏰ 設置定期任務..."
    
    # 創建 Cron 任務
    cat > /tmp/monitoring-cron << EOF
# ${PROJECT_NAME} 監控任務
*/5 * * * * /usr/local/bin/system-monitor.sh
0 2 * * * $(pwd)/scripts/backup-system.sh
0 3 * * 0 $(pwd)/scripts/cleanup-logs.sh
*/15 * * * * $(pwd)/scripts/health-check.sh
EOF
    
    # 安裝 Cron 任務
    crontab -l > /tmp/current-cron 2>/dev/null || echo "" > /tmp/current-cron
    cat /tmp/current-cron /tmp/monitoring-cron | crontab -
    
    log_success "✅ Cron 任務設置完成"
    
    # 清理臨時文件
    rm -f /tmp/monitoring-cron /tmp/current-cron
}

# 函數：設置日誌輪轉
setup_log_rotation() {
    log_info "📄 設置日誌輪轉..."
    
    # 創建 logrotate 配置
    sudo tee /etc/logrotate.d/${PROJECT_NAME} > /dev/null << EOF
${LOG_DIR}/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
    create 644 $(whoami) $(whoami)
}

$(pwd)/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    copytruncate
    create 644 $(whoami) $(whoami)
}
EOF
    
    log_success "✅ 日誌輪轉配置完成"
}

# 函數：設置健康檢查
setup_health_check() {
    log_info "🏥 設置健康檢查..."
    
    cat > scripts/health-check.sh << 'EOF'
#!/bin/bash

# 健康檢查腳本
PROJECT_NAME="employee-management-system"
HEALTH_URL="http://localhost:3000/api/health"
LOG_FILE="/var/log/${PROJECT_NAME}/health-check.log"

# 檢查服務狀態
if curl -f -s --max-time 10 "$HEALTH_URL" > /dev/null 2>&1; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') - ✅ 服務健康檢查通過" >> "$LOG_FILE"
else
    echo "$(date '+%Y-%m-%d %H:%M:%S') - ❌ 服務健康檢查失敗" >> "$LOG_FILE"
    
    # 發送告警
    if [ -n "${TELEGRAM_BOT_TOKEN:-}" ] && [ -n "${TELEGRAM_CHAT_ID:-}" ]; then
        curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
            -d chat_id="${TELEGRAM_CHAT_ID}" \
            -d text="🚨 健康檢查失敗: ${PROJECT_NAME} 服務可能出現問題，請立即檢查！" > /dev/null || true
    fi
    
    # 嘗試重啟服務
    if command -v pm2 >/dev/null 2>&1; then
        echo "$(date '+%Y-%m-%d %H:%M:%S') - 🔄 嘗試重啟 PM2 服務" >> "$LOG_FILE"
        pm2 restart ecosystem.config.js --env production || true
    fi
fi
EOF
    
    chmod +x scripts/health-check.sh
    log_success "✅ 健康檢查腳本創建完成"
}

# 函數：設置清理腳本
setup_cleanup_script() {
    log_info "🧹 設置清理腳本..."
    
    cat > scripts/cleanup-logs.sh << 'EOF'
#!/bin/bash

# 日誌清理腳本
PROJECT_NAME="employee-management-system"
LOG_DIR="/var/log/${PROJECT_NAME}"
CLEANUP_LOG="${LOG_DIR}/cleanup.log"

echo "$(date '+%Y-%m-%d %H:%M:%S') - 🧹 開始清理作業" >> "$CLEANUP_LOG"

# 清理舊的應用程式日誌
if [ -d "logs" ]; then
    find logs -name "*.log" -type f -mtime +7 -delete
    echo "$(date '+%Y-%m-%d %H:%M:%S') - 應用程式日誌清理完成" >> "$CLEANUP_LOG"
fi

# 清理舊的系統日誌
find "$LOG_DIR" -name "*.log" -type f -mtime +30 -delete 2>/dev/null || true

# 清理舊的備份文件
if [ -d "/backup/${PROJECT_NAME}" ]; then
    find "/backup/${PROJECT_NAME}" -name "*.tar.gz" -type f -mtime +60 -delete 2>/dev/null || true
    echo "$(date '+%Y-%m-%d %H:%M:%S') - 備份文件清理完成" >> "$CLEANUP_LOG"
fi

# 清理臨時文件
find /tmp -name "${PROJECT_NAME}_*" -type f -mtime +1 -delete 2>/dev/null || true

# 清理 Docker 資源
if command -v docker >/dev/null 2>&1; then
    docker system prune -f > /dev/null 2>&1 || true
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Docker 資源清理完成" >> "$CLEANUP_LOG"
fi

echo "$(date '+%Y-%m-%d %H:%M:%S') - 🎉 清理作業完成" >> "$CLEANUP_LOG"
EOF
    
    chmod +x scripts/cleanup-logs.sh
    log_success "✅ 清理腳本創建完成"
}

# 函數：設置監控面板
setup_monitoring_dashboard() {
    log_info "📊 設置監控面板..."
    
    # 創建簡單的 HTML 監控面板
    cat > public/monitoring.html << 'EOF'
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>系統監控面板</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .dashboard {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            max-width: 1200px;
            margin: 0 auto;
        }
        .card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .metric {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
        }
        .status-ok { color: #28a745; }
        .status-warning { color: #ffc107; }
        .status-error { color: #dc3545; }
        .refresh-btn {
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            margin: 10px 0;
        }
        .refresh-btn:hover {
            background: #0056b3;
        }
    </style>
</head>
<body>
    <h1>📊 Employee Management System - 監控面板</h1>
    
    <button class="refresh-btn" onclick="refreshData()">🔄 重新整理</button>
    
    <div class="dashboard">
        <div class="card">
            <h3>🖥️ 系統資源</h3>
            <div id="system-metrics">
                <div class="metric">
                    <span>CPU 使用率:</span>
                    <span id="cpu-usage">載入中...</span>
                </div>
                <div class="metric">
                    <span>記憶體使用率:</span>
                    <span id="memory-usage">載入中...</span>
                </div>
                <div class="metric">
                    <span>磁碟使用率:</span>
                    <span id="disk-usage">載入中...</span>
                </div>
            </div>
        </div>
        
        <div class="card">
            <h3>🚀 服務狀態</h3>
            <div id="service-status">
                <div class="metric">
                    <span>應用程式服務:</span>
                    <span id="app-status">載入中...</span>
                </div>
                <div class="metric">
                    <span>資料庫:</span>
                    <span id="db-status">載入中...</span>
                </div>
                <div class="metric">
                    <span>最後健康檢查:</span>
                    <span id="last-check">載入中...</span>
                </div>
            </div>
        </div>
        
        <div class="card">
            <h3>📊 應用程式指標</h3>
            <div id="app-metrics">
                <div class="metric">
                    <span>平均回應時間:</span>
                    <span id="response-time">載入中...</span>
                </div>
                <div class="metric">
                    <span>錯誤率:</span>
                    <span id="error-rate">載入中...</span>
                </div>
                <div class="metric">
                    <span>活躍連接數:</span>
                    <span id="active-connections">載入中...</span>
                </div>
            </div>
        </div>
        
        <div class="card">
            <h3>🚨 最近告警</h3>
            <div id="recent-alerts">
                載入中...
            </div>
        </div>
    </div>

    <script>
        function refreshData() {
            // 獲取系統指標
            fetch('/api/monitoring/metrics')
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        updateSystemMetrics(data.data);
                    }
                })
                .catch(error => console.error('Error:', error));
                
            // 獲取告警
            fetch('/api/alerts/active')
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        updateAlerts(data.data.alerts);
                    }
                })
                .catch(error => console.error('Error:', error));
        }
        
        function updateSystemMetrics(metrics) {
            document.getElementById('cpu-usage').textContent = metrics.cpu + '%';
            document.getElementById('memory-usage').textContent = metrics.memory + '%';
            document.getElementById('disk-usage').textContent = metrics.disk + '%';
            document.getElementById('app-status').textContent = metrics.serviceHealthy ? '正常' : '異常';
            document.getElementById('app-status').className = metrics.serviceHealthy ? 'status-ok' : 'status-error';
            document.getElementById('db-status').textContent = metrics.databaseConnected ? '已連接' : '連接失敗';
            document.getElementById('db-status').className = metrics.databaseConnected ? 'status-ok' : 'status-error';
            document.getElementById('response-time').textContent = metrics.avgResponseTime + 'ms';
            document.getElementById('error-rate').textContent = metrics.errorRate + '%';
            document.getElementById('last-check').textContent = new Date().toLocaleString('zh-TW');
        }
        
        function updateAlerts(alerts) {
            const alertsContainer = document.getElementById('recent-alerts');
            if (alerts.length === 0) {
                alertsContainer.innerHTML = '<p class="status-ok">✅ 無活躍告警</p>';
            } else {
                alertsContainer.innerHTML = alerts.map(alert => 
                    `<div class="status-error">❌ ${alert.name} - ${alert.description}</div>`
                ).join('');
            }
        }
        
        // 每30秒自動重新整理
        setInterval(refreshData, 30000);
        
        // 頁面載入時初始化
        refreshData();
    </script>
</body>
</html>
EOF
    
    # 確保 public 目錄存在
    mkdir -p public
    
    log_success "✅ 監控面板創建完成 - 訪問 http://localhost:3000/monitoring.html"
}

# 函數：安裝監控依賴
install_monitoring_dependencies() {
    log_info "📦 安裝監控依賴..."
    
    # 檢查並安裝 curl
    if ! command_exists curl; then
        log_warning "⚠️ curl 未安裝，嘗試安裝..."
        if command_exists apt-get; then
            sudo apt-get update && sudo apt-get install -y curl
        elif command_exists yum; then
            sudo yum install -y curl
        else
            log_error "❌ 無法自動安裝 curl，請手動安裝"
        fi
    fi
    
    log_success "✅ 監控依賴檢查完成"
}

# 主要設置流程
main() {
    log_info "🎯 開始設置監控系統"
    
    # 載入環境變數
    if [ -f ".env.production" ]; then
        export $(cat .env.production | grep -v '^#' | xargs) 2>/dev/null || true
    fi
    
    # 執行設置步驟
    install_monitoring_dependencies
    setup_system_monitoring
    setup_health_check
    setup_cleanup_script
    setup_log_rotation
    setup_cron_jobs
    setup_monitoring_dashboard
    
    log_success "🎉 監控系統設置完成！"
    log_info "📊 監控功能："
    log_info "   🖥️ 系統指標監控: 每5分鐘執行"
    log_info "   🏥 健康檢查: 每15分鐘執行"
    log_info "   💾 自動備份: 每天凌晨2點"
    log_info "   🧹 日誌清理: 每週日凌晨3點"
    log_info "   📊 監控面板: /monitoring.html"
    log_info "   📄 設置日誌: ${MONITORING_LOG}"
    
    log_info "📝 接下來需要手動操作："
    log_info "   1. 確保 Telegram Bot Token 和 Chat ID 已設置"
    log_info "   2. 檢查 Cron 服務是否正在運行: service cron status"
    log_info "   3. 訪問監控面板測試功能"
}

# 執行主流程
main "$@"