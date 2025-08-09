#!/bin/bash

# 🔄 Employee Management System - 自動備份腳本
# Automated Backup Script for Production Environment

set -e  # 遇到錯誤立即停止

# 配置變數
BACKUP_DIR="/var/backups/employee-management"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/var/www/employee-management"
DATABASE_FILE="database/employee_management.db"
LOGS_DIR="logs"
UPLOADS_DIR="uploads"
CONFIG_DIR="."

# 顏色輸出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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

# 創建備份目錄
create_backup_dir() {
    local backup_path="$BACKUP_DIR/$DATE"
    mkdir -p "$backup_path"/{database,logs,uploads,config}
    echo "$backup_path"
}

# 備份資料庫
backup_database() {
    local backup_path=$1
    log "開始備份資料庫..."
    
    if [ -f "$APP_DIR/$DATABASE_FILE" ]; then
        # SQLite 備份
        sqlite3 "$APP_DIR/$DATABASE_FILE" ".backup '$backup_path/database/employee_management_$DATE.db'"
        
        # 驗證備份
        if sqlite3 "$backup_path/database/employee_management_$DATE.db" ".tables" &>/dev/null; then
            log "資料庫備份成功: employee_management_$DATE.db"
        else
            error "資料庫備份驗證失敗"
            return 1
        fi
        
        # 創建 SQL 轉儲
        sqlite3 "$APP_DIR/$DATABASE_FILE" ".dump" > "$backup_path/database/schema_dump_$DATE.sql"
        log "資料庫 SQL 轉儲完成: schema_dump_$DATE.sql"
    else
        warn "資料庫文件不存在: $APP_DIR/$DATABASE_FILE"
    fi
}

# 備份日誌文件
backup_logs() {
    local backup_path=$1
    log "開始備份日誌文件..."
    
    if [ -d "$APP_DIR/$LOGS_DIR" ]; then
        tar -czf "$backup_path/logs/logs_$DATE.tar.gz" -C "$APP_DIR" "$LOGS_DIR"
        log "日誌備份完成: logs_$DATE.tar.gz"
    else
        warn "日誌目錄不存在: $APP_DIR/$LOGS_DIR"
    fi
}

# 備份上傳文件
backup_uploads() {
    local backup_path=$1
    log "開始備份上傳文件..."
    
    if [ -d "$APP_DIR/$UPLOADS_DIR" ]; then
        tar -czf "$backup_path/uploads/uploads_$DATE.tar.gz" -C "$APP_DIR" "$UPLOADS_DIR"
        log "上傳文件備份完成: uploads_$DATE.tar.gz"
    else
        warn "上傳目錄不存在: $APP_DIR/$UPLOADS_DIR"
    fi
}

# 備份配置文件
backup_config() {
    local backup_path=$1
    log "開始備份配置文件..."
    
    # 重要配置文件列表
    config_files=(
        ".env.production"
        ".env.staging" 
        "ecosystem.config.js"
        "package.json"
        "package-lock.json"
        "docker-compose.yml"
        "Dockerfile"
        "nginx.conf"
    )
    
    for file in "${config_files[@]}"; do
        if [ -f "$APP_DIR/$file" ]; then
            cp "$APP_DIR/$file" "$backup_path/config/"
            log "配置文件備份: $file"
        fi
    done
    
    # 備份安全配置目錄
    if [ -d "$APP_DIR/server/middleware/security" ]; then
        tar -czf "$backup_path/config/security_config_$DATE.tar.gz" -C "$APP_DIR/server/middleware" "security"
        log "安全配置備份完成"
    fi
}

# 創建備份摘要
create_backup_summary() {
    local backup_path=$1
    local summary_file="$backup_path/backup_summary_$DATE.txt"
    
    cat > "$summary_file" << EOF
🔄 Employee Management System 備份摘要
=====================================
備份時間: $(date)
備份路徑: $backup_path
系統版本: $(node --version)
PM2 狀態: $(pm2 list | grep employee-management || echo "PM2 未運行")

📂 備份內容:
$(find "$backup_path" -type f -exec ls -lh {} \; | awk '{print $9 " (" $5 ")"}")

📊 備份統計:
總文件數: $(find "$backup_path" -type f | wc -l)
總大小: $(du -sh "$backup_path" | cut -f1)

✅ 備份完成狀態: 成功
EOF
    
    log "備份摘要創建: $summary_file"
}

# 清理舊備份
cleanup_old_backups() {
    log "開始清理超過 30 天的舊備份..."
    find "$BACKUP_DIR" -type d -mtime +30 -name "????????_??????" -exec rm -rf {} \;
    log "舊備份清理完成"
}

# 發送 Telegram 通知
send_telegram_notification() {
    local backup_path=$1
    local success=$2
    
    if [ -f "$APP_DIR/.env.production" ]; then
        source "$APP_DIR/.env.production"
    fi
    
    if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
        local status_emoji
        local status_text
        
        if [ "$success" = "true" ]; then
            status_emoji="✅"
            status_text="成功"
        else
            status_emoji="❌" 
            status_text="失敗"
        fi
        
        local message="$status_emoji 自動備份通知

📅 備份日期: $(date +'%Y-%m-%d %H:%M:%S')
📂 備份路徑: $backup_path
📊 備份狀態: $status_text
💾 備份大小: $(du -sh "$backup_path" 2>/dev/null | cut -f1 || echo "未知")

🔄 系統狀態: $(pm2 list | grep employee-management | wc -l) 個進程運行中"

        curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
             -d "chat_id=$TELEGRAM_CHAT_ID" \
             -d "text=$message" \
             -d "parse_mode=HTML" > /dev/null
        
        log "Telegram 通知已發送"
    fi
}

# 主備份函數
main() {
    log "開始 Employee Management System 自動備份..."
    
    # 檢查必要目錄
    if [ ! -d "$APP_DIR" ]; then
        error "應用程式目錄不存在: $APP_DIR"
        exit 1
    fi
    
    local backup_path
    backup_path=$(create_backup_dir)
    local backup_success=true
    
    # 執行各項備份
    backup_database "$backup_path" || backup_success=false
    backup_logs "$backup_path" || backup_success=false
    backup_uploads "$backup_path" || backup_success=false 
    backup_config "$backup_path" || backup_success=false
    
    # 創建備份摘要
    create_backup_summary "$backup_path"
    
    # 清理舊備份
    cleanup_old_backups
    
    # 發送通知
    send_telegram_notification "$backup_path" "$backup_success"
    
    if [ "$backup_success" = "true" ]; then
        log "🎉 備份完成! 備份路徑: $backup_path"
        exit 0
    else
        error "❌ 備份過程中發生錯誤"
        exit 1
    fi
}

# 顯示使用說明
show_help() {
    echo "Employee Management System 備份腳本"
    echo ""
    echo "用法: $0 [選項]"
    echo ""
    echo "選項:"
    echo "  -h, --help     顯示此說明"
    echo "  -c, --config   指定配置檔案路徑"
    echo ""
    echo "範例:"
    echo "  $0                    # 執行完整備份"
    echo "  $0 --config /path    # 使用自定義配置"
}

# 處理命令列參數
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -c|--config)
            if [ -n "$2" ]; then
                APP_DIR="$2"
                shift 2
            else
                error "需要指定配置檔案路徑"
                exit 1
            fi
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