#!/bin/bash

# 🏥 Employee Management System - 系統健康檢查腳本
# Comprehensive System Health Check Script

set -e

# 配置變數
APP_DIR="/var/www/employee-management"
HEALTH_LOG="/var/log/employee-management/health.log"
ALERT_THRESHOLD=80  # CPU/Memory 警告閾值 (%)
DISK_THRESHOLD=85   # 磁碟使用警告閾值 (%)

# 顏色輸出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日誌函數
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# 健康狀態追蹤
HEALTH_STATUS="HEALTHY"
ISSUES_FOUND=()
WARNINGS_FOUND=()

# 添加問題
add_issue() {
    ISSUES_FOUND+=("$1")
    HEALTH_STATUS="CRITICAL"
}

add_warning() {
    WARNINGS_FOUND+=("$1")
    if [ "$HEALTH_STATUS" == "HEALTHY" ]; then
        HEALTH_STATUS="WARNING"
    fi
}

# 檢查系統資源
check_system_resources() {
    log "檢查系統資源使用狀況..."
    
    # CPU 使用率
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
    if (( $(echo "$cpu_usage > $ALERT_THRESHOLD" | bc -l) )); then
        add_warning "CPU 使用率過高: ${cpu_usage}%"
    else
        log "✅ CPU 使用率正常: ${cpu_usage}%"
    fi
    
    # 記憶體使用率
    local mem_total=$(free | grep Mem | awk '{print $2}')
    local mem_used=$(free | grep Mem | awk '{print $3}')
    local mem_usage=$(echo "scale=2; $mem_used * 100 / $mem_total" | bc)
    
    if (( $(echo "$mem_usage > $ALERT_THRESHOLD" | bc -l) )); then
        add_warning "記憶體使用率過高: ${mem_usage}%"
    else
        log "✅ 記憶體使用率正常: ${mem_usage}%"
    fi
    
    # 磁碟使用率
    local disk_usage=$(df -h "$APP_DIR" | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt "$DISK_THRESHOLD" ]; then
        add_warning "磁碟使用率過高: ${disk_usage}%"
    else
        log "✅ 磁碟使用率正常: ${disk_usage}%"
    fi
    
    # 負載平均值
    local load_avg=$(uptime | awk -F'load average:' '{print $2}')
    log "系統負載: $load_avg"
}

# 檢查應用程式狀態
check_application_status() {
    log "檢查應用程式狀態..."
    
    cd "$APP_DIR" || exit 1
    
    # PM2 狀態檢查
    if command -v pm2 &> /dev/null; then
        local pm2_status=$(pm2 jlist 2>/dev/null || echo "[]")
        local running_processes=$(echo "$pm2_status" | jq -r '.[] | select(.pm2_env.status == "online") | .name' 2>/dev/null | wc -l)
        
        if [ "$running_processes" -gt 0 ]; then
            log "✅ PM2 進程運行正常: $running_processes 個進程"
            
            # 檢查特定進程
            local employee_mgmt_running=$(echo "$pm2_status" | jq -r '.[] | select(.name | contains("employee-management")) | select(.pm2_env.status == "online") | .name' 2>/dev/null | wc -l)
            if [ "$employee_mgmt_running" -eq 0 ]; then
                add_issue "Employee Management 進程未運行"
            fi
        else
            add_issue "沒有 PM2 進程在運行"
        fi
        
        # 檢查進程重啟次數
        local high_restart_processes=$(echo "$pm2_status" | jq -r '.[] | select(.pm2_env.restart_time > 10) | .name' 2>/dev/null)
        if [ -n "$high_restart_processes" ]; then
            add_warning "進程重啟次數過多: $high_restart_processes"
        fi
    else
        warn "PM2 未安裝或無法訪問"
    fi
    
    # Docker 狀態檢查 (如果使用)
    if [ -f "docker-compose.yml" ] && command -v docker-compose &> /dev/null; then
        local running_containers=$(docker-compose ps --services --filter "status=running" 2>/dev/null | wc -l)
        local total_containers=$(docker-compose ps --services 2>/dev/null | wc -l)
        
        if [ "$running_containers" -eq "$total_containers" ]; then
            log "✅ Docker 服務運行正常: $running_containers/$total_containers"
        else
            add_issue "Docker 服務狀態異常: $running_containers/$total_containers 運行中"
        fi
    fi
}

# 檢查資料庫狀態
check_database_status() {
    log "檢查資料庫狀態..."
    
    local db_file="$APP_DIR/database/employee_management.db"
    
    if [ -f "$db_file" ]; then
        # 檢查資料庫檔案權限
        if [ -r "$db_file" ] && [ -w "$db_file" ]; then
            log "✅ 資料庫檔案權限正常"
        else
            add_issue "資料庫檔案權限問題"
        fi
        
        # 檢查資料庫連接
        if sqlite3 "$db_file" "SELECT 1;" &>/dev/null; then
            log "✅ 資料庫連接正常"
            
            # 檢查資料表
            local table_count=$(sqlite3 "$db_file" "SELECT COUNT(*) FROM sqlite_master WHERE type='table';" 2>/dev/null || echo "0")
            if [ "$table_count" -gt 0 ]; then
                log "✅ 資料庫包含 $table_count 個資料表"
            else
                add_warning "資料庫沒有資料表"
            fi
            
            # 檢查資料庫大小
            local db_size=$(du -h "$db_file" | cut -f1)
            log "資料庫大小: $db_size"
            
            # 檢查資料庫鎖定
            if sqlite3 "$db_file" "BEGIN IMMEDIATE; ROLLBACK;" &>/dev/null; then
                log "✅ 資料庫沒有被鎖定"
            else
                add_warning "資料庫可能被鎖定"
            fi
        else
            add_issue "資料庫連接失敗"
        fi
    else
        add_issue "資料庫檔案不存在: $db_file"
    fi
}

# 檢查網路連接
check_network_connectivity() {
    log "檢查網路連接狀況..."
    
    # 檢查本地端口
    local ports_to_check=("3000" "4000" "3001")
    
    for port in "${ports_to_check[@]}"; do
        if netstat -tuln | grep ":$port " &>/dev/null; then
            log "✅ 端口 $port 正在監聽"
        else
            add_warning "端口 $port 沒有在監聽"
        fi
    done
    
    # 檢查外部連接 (如果需要)
    if ping -c 1 8.8.8.8 &>/dev/null; then
        log "✅ 外部網路連接正常"
    else
        add_warning "外部網路連接異常"
    fi
    
    # 檢查 Telegram API 連接 (如果配置)
    if [ -f "$APP_DIR/.env.production" ]; then
        source "$APP_DIR/.env.production"
        if [ -n "$TELEGRAM_BOT_TOKEN" ]; then
            if curl -s --connect-timeout 5 "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getMe" &>/dev/null; then
                log "✅ Telegram API 連接正常"
            else
                add_warning "Telegram API 連接失敗"
            fi
        fi
    fi
}

# 檢查日誌文件
check_logs() {
    log "檢查日誌文件狀況..."
    
    local log_dir="$APP_DIR/logs"
    
    if [ -d "$log_dir" ]; then
        # 檢查日誌文件大小
        local large_logs=$(find "$log_dir" -name "*.log" -size +100M 2>/dev/null)
        if [ -n "$large_logs" ]; then
            add_warning "發現大型日誌文件: $large_logs"
        fi
        
        # 檢查錯誤日誌
        local error_logs=$(find "$log_dir" -name "*error*" -type f 2>/dev/null)
        for error_log in $error_logs; do
            if [ -f "$error_log" ]; then
                local recent_errors=$(tail -n 100 "$error_log" | grep -c "ERROR\|FATAL" || echo "0")
                if [ "$recent_errors" -gt 10 ]; then
                    add_warning "日誌文件中發現大量錯誤: $error_log ($recent_errors 個)"
                fi
            fi
        done
        
        log "✅ 日誌文件檢查完成"
    else
        add_warning "日誌目錄不存在: $log_dir"
    fi
}

# 檢查安全配置
check_security_config() {
    log "檢查安全配置..."
    
    # 檢查環境變數文件權限
    local env_files=(".env.production" ".env.staging")
    for env_file in "${env_files[@]}"; do
        if [ -f "$APP_DIR/$env_file" ]; then
            local file_perms=$(stat -c "%a" "$APP_DIR/$env_file")
            if [ "$file_perms" == "600" ] || [ "$file_perms" == "640" ]; then
                log "✅ $env_file 權限設置安全"
            else
                add_warning "$env_file 權限設置不安全: $file_perms"
            fi
        fi
    done
    
    # 檢查 SSL 證書 (如果使用)
    if [ -d "$APP_DIR/ssl" ]; then
        local cert_files=$(find "$APP_DIR/ssl" -name "*.crt" -o -name "*.pem" 2>/dev/null)
        for cert_file in $cert_files; do
            if openssl x509 -in "$cert_file" -checkend 2592000 -noout &>/dev/null; then
                log "✅ SSL 證書 $(basename "$cert_file") 有效"
            else
                add_warning "SSL 證書 $(basename "$cert_file") 將在 30 天內過期或已過期"
            fi
        done
    fi
}

# 檢查備份狀態
check_backup_status() {
    log "檢查備份狀態..."
    
    local backup_dir="/var/backups/employee-management"
    
    if [ -d "$backup_dir" ]; then
        # 檢查最近的備份
        local latest_backup=$(find "$backup_dir" -maxdepth 1 -type d -name "????????_??????" | sort -r | head -n 1)
        
        if [ -n "$latest_backup" ]; then
            local backup_date=$(basename "$latest_backup" | sed 's/^\([0-9]\{4\}\)\([0-9]\{2\}\)\([0-9]\{2\}\)_\([0-9]\{2\}\)\([0-9]\{2\}\)\([0-9]\{2\}\)$/\1-\2-\3 \4:\5:\6/')
            local backup_age=$(( ($(date +%s) - $(date -d "$backup_date" +%s)) / 86400 ))
            
            if [ "$backup_age" -le 1 ]; then
                log "✅ 最近備份: $backup_date (${backup_age} 天前)"
            elif [ "$backup_age" -le 7 ]; then
                add_warning "備份稍舊: $backup_date (${backup_age} 天前)"
            else
                add_issue "備份過舊: $backup_date (${backup_age} 天前)"
            fi
        else
            add_issue "沒有找到備份文件"
        fi
    else
        add_warning "備份目錄不存在: $backup_dir"
    fi
}

# 執行 HTTP 健康檢查
check_http_endpoints() {
    log "檢查 HTTP 端點狀況..."
    
    local endpoints=("http://localhost:3000/api/health" "http://localhost:3000/")
    
    for endpoint in "${endpoints[@]}"; do
        local response_code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "$endpoint" 2>/dev/null || echo "000")
        
        if [ "$response_code" == "200" ]; then
            log "✅ HTTP 端點正常: $endpoint"
        else
            add_warning "HTTP 端點異常: $endpoint (狀態碼: $response_code)"
        fi
    done
}

# 生成健康報告
generate_health_report() {
    local report_file="$APP_DIR/health-report-$(date +%Y%m%d_%H%M%S).txt"
    
    cat > "$report_file" << EOF
🏥 Employee Management System 健康檢查報告
================================================
檢查時間: $(date)
系統狀態: $HEALTH_STATUS
主機名稱: $(hostname)
系統版本: $(uname -a)

📊 系統資源狀況:
$(free -h)
$(df -h "$APP_DIR")

🔍 檢查結果摘要:
總檢查項目: $((${#ISSUES_FOUND[@]} + ${#WARNINGS_FOUND[@]} + 10))
關鍵問題: ${#ISSUES_FOUND[@]}
警告項目: ${#WARNINGS_FOUND[@]}

EOF

    if [ ${#ISSUES_FOUND[@]} -gt 0 ]; then
        echo "❌ 發現的關鍵問題:" >> "$report_file"
        for issue in "${ISSUES_FOUND[@]}"; do
            echo "  - $issue" >> "$report_file"
        done
        echo "" >> "$report_file"
    fi

    if [ ${#WARNINGS_FOUND[@]} -gt 0 ]; then
        echo "⚠️  發現的警告項目:" >> "$report_file"
        for warning in "${WARNINGS_FOUND[@]}"; do
            echo "  - $warning" >> "$report_file"
        done
        echo "" >> "$report_file"
    fi

    echo "📱 建議行動:" >> "$report_file"
    case "$HEALTH_STATUS" in
        "CRITICAL")
            echo "  - 立即檢查並修復關鍵問題" >> "$report_file"
            echo "  - 考慮啟動備用系統" >> "$report_file"
            ;;
        "WARNING")
            echo "  - 監控系統狀況" >> "$report_file"
            echo "  - 計劃維護窗口修復警告項目" >> "$report_file"
            ;;
        "HEALTHY")
            echo "  - 系統運行良好，繼續監控" >> "$report_file"
            ;;
    esac

    echo "報告保存: $report_file"
}

# 發送健康狀態通知
send_health_notification() {
    if [ -f "$APP_DIR/.env.production" ]; then
        source "$APP_DIR/.env.production"
    fi
    
    # 只有在有問題時才發送通知
    if [ "$HEALTH_STATUS" != "HEALTHY" ] && [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
        local status_emoji
        case "$HEALTH_STATUS" in
            "CRITICAL")
                status_emoji="🚨"
                ;;
            "WARNING")
                status_emoji="⚠️"
                ;;
            *)
                status_emoji="ℹ️"
                ;;
        esac
        
        local message="$status_emoji 系統健康檢查報告

📅 檢查時間: $(date +'%Y-%m-%d %H:%M:%S')
📊 系統狀態: $HEALTH_STATUS
🖥️ 主機名稱: $(hostname)

🔍 問題摘要:
❌ 關鍵問題: ${#ISSUES_FOUND[@]} 個
⚠️ 警告項目: ${#WARNINGS_FOUND[@]} 個"

        if [ ${#ISSUES_FOUND[@]} -gt 0 ]; then
            message="$message

❌ 關鍵問題:"
            for issue in "${ISSUES_FOUND[@]:0:3}"; do  # 只顯示前3個問題
                message="$message
  • $issue"
            done
        fi

        curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
             -d "chat_id=$TELEGRAM_CHAT_ID" \
             -d "text=$message" \
             -d "parse_mode=HTML" > /dev/null
        
        log "健康狀態通知已發送"
    fi
}

# 主檢查函數
main() {
    log "開始 Employee Management System 健康檢查..."
    
    # 創建健康日誌目錄
    mkdir -p "$(dirname "$HEALTH_LOG")"
    
    # 執行各項檢查
    check_system_resources
    check_application_status
    check_database_status
    check_network_connectivity
    check_logs
    check_security_config
    check_backup_status
    check_http_endpoints
    
    # 生成報告
    generate_health_report
    
    # 發送通知
    send_health_notification
    
    # 輸出最終狀態
    case "$HEALTH_STATUS" in
        "HEALTHY")
            log "🎉 系統健康狀況良好！"
            exit 0
            ;;
        "WARNING")
            warn "⚠️  系統存在警告項目，請關注"
            exit 1
            ;;
        "CRITICAL")
            error "🚨 系統存在關鍵問題，需要立即處理！"
            exit 2
            ;;
    esac
}

# 顯示使用說明
show_help() {
    echo "Employee Management System 健康檢查腳本"
    echo ""
    echo "用法: $0 [選項]"
    echo ""
    echo "選項:"
    echo "  -h, --help     顯示此說明"
    echo "  -q, --quiet    靜默模式（只輸出錯誤）"
    echo "  -v, --verbose  詳細模式"
    echo ""
    echo "退出代碼:"
    echo "  0 - 健康"
    echo "  1 - 警告"
    echo "  2 - 關鍵問題"
}

# 處理命令列參數
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -q|--quiet)
            exec > /dev/null
            shift
            ;;
        -v|--verbose)
            set -x
            shift
            ;;
        *)
            error "未知選項: $1"
            show_help
            exit 1
            ;;
    esac
done

# 執行主程序
main