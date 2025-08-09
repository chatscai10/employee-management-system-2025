#!/bin/bash

# 🔄 Employee Management System - 災難恢復腳本
# Disaster Recovery Script for Production Environment

set -e  # 遇到錯誤立即停止

# 配置變數
BACKUP_DIR="/var/backups/employee-management"
APP_DIR="/var/www/employee-management"
RESTORE_DATE=""
RESTORE_COMPONENTS=""

# 顏色輸出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# 顯示可用備份
list_available_backups() {
    log "可用的備份列表："
    echo ""
    
    if [ ! -d "$BACKUP_DIR" ]; then
        error "備份目錄不存在: $BACKUP_DIR"
        return 1
    fi
    
    local backups=($(find "$BACKUP_DIR" -maxdepth 1 -type d -name "????????_??????" | sort -r))
    
    if [ ${#backups[@]} -eq 0 ]; then
        warn "沒有找到可用的備份"
        return 1
    fi
    
    echo "序號  備份日期          大小      狀態"
    echo "----------------------------------------"
    
    for i in "${!backups[@]}"; do
        local backup_dir="${backups[$i]}"
        local basename=$(basename "$backup_dir")
        local date_formatted=$(echo "$basename" | sed 's/^\([0-9]\{4\}\)\([0-9]\{2\}\)\([0-9]\{2\}\)_\([0-9]\{2\}\)\([0-9]\{2\}\)\([0-9]\{2\}\)$/\1-\2-\3 \4:\5:\6/')
        local size=$(du -sh "$backup_dir" 2>/dev/null | cut -f1 || echo "未知")
        local status="✅"
        
        # 檢查備份完整性
        if [ ! -f "$backup_dir/backup_summary_$basename.txt" ]; then
            status="⚠️ "
        fi
        
        printf "%-4s  %-16s  %-8s  %s\n" "$((i+1))" "$date_formatted" "$size" "$status"
    done
    echo ""
}

# 選擇要恢復的備份
select_backup() {
    if [ -n "$RESTORE_DATE" ]; then
        return 0
    fi
    
    list_available_backups
    
    echo -n "請選擇要恢復的備份序號 (1-$(find "$BACKUP_DIR" -maxdepth 1 -type d -name "????????_??????" | wc -l)): "
    read backup_num
    
    local backups=($(find "$BACKUP_DIR" -maxdepth 1 -type d -name "????????_??????" | sort -r))
    local selected_index=$((backup_num - 1))
    
    if [ $selected_index -lt 0 ] || [ $selected_index -ge ${#backups[@]} ]; then
        error "無效的選擇"
        return 1
    fi
    
    RESTORE_DATE=$(basename "${backups[$selected_index]}")
    log "選擇的備份: $RESTORE_DATE"
}

# 確認恢復操作
confirm_restore() {
    echo ""
    warn "⚠️  恢復操作將會覆蓋現有數據！"
    echo ""
    info "恢復詳情："
    info "- 備份日期: $RESTORE_DATE" 
    info "- 恢復組件: ${RESTORE_COMPONENTS:-all}"
    info "- 應用目錄: $APP_DIR"
    echo ""
    
    echo -n "您確定要執行恢復操作嗎？(輸入 'YES' 確認): "
    read confirmation
    
    if [ "$confirmation" != "YES" ]; then
        log "恢復操作已取消"
        exit 0
    fi
}

# 停止應用程式
stop_application() {
    log "停止應用程式服務..."
    
    # 停止 PM2 進程
    if command -v pm2 &> /dev/null; then
        pm2 stop all 2>/dev/null || true
        pm2 delete all 2>/dev/null || true
        log "PM2 進程已停止"
    fi
    
    # 停止 Docker 容器 (如果使用)
    if command -v docker &> /dev/null && [ -f "$APP_DIR/docker-compose.yml" ]; then
        cd "$APP_DIR"
        docker-compose down 2>/dev/null || true
        log "Docker 服務已停止"
    fi
}

# 啟動應用程式
start_application() {
    log "啟動應用程式服務..."
    
    cd "$APP_DIR"
    
    # 如果使用 Docker
    if [ -f "docker-compose.yml" ]; then
        docker-compose up -d
        log "Docker 服務已啟動"
    # 如果使用 PM2
    elif [ -f "ecosystem.config.js" ] && command -v pm2 &> /dev/null; then
        pm2 start ecosystem.config.js --env production
        log "PM2 服務已啟動"
    # 直接啟動
    else
        nohup npm start > logs/restore.log 2>&1 &
        log "應用程式已啟動"
    fi
}

# 恢復資料庫
restore_database() {
    local backup_path="$BACKUP_DIR/$RESTORE_DATE"
    log "開始恢復資料庫..."
    
    local db_backup="$backup_path/database/employee_management_$RESTORE_DATE.db"
    local target_db="$APP_DIR/database/employee_management.db"
    
    if [ -f "$db_backup" ]; then
        # 備份當前資料庫
        if [ -f "$target_db" ]; then
            cp "$target_db" "$target_db.backup.$(date +%s)"
            log "當前資料庫已備份"
        fi
        
        # 創建目標目錄
        mkdir -p "$(dirname "$target_db")"
        
        # 恢復資料庫
        cp "$db_backup" "$target_db"
        
        # 驗證恢復
        if sqlite3 "$target_db" ".tables" &>/dev/null; then
            log "✅ 資料庫恢復成功"
            
            # 顯示資料庫統計
            local table_count=$(sqlite3 "$target_db" "SELECT COUNT(*) FROM sqlite_master WHERE type='table';")
            log "恢復的資料表數量: $table_count"
        else
            error "❌ 資料庫恢復失敗"
            return 1
        fi
    else
        warn "資料庫備份文件不存在: $db_backup"
    fi
}

# 恢復日誌文件
restore_logs() {
    local backup_path="$BACKUP_DIR/$RESTORE_DATE"
    log "開始恢復日誌文件..."
    
    local logs_backup="$backup_path/logs/logs_$RESTORE_DATE.tar.gz"
    
    if [ -f "$logs_backup" ]; then
        # 備份當前日誌
        if [ -d "$APP_DIR/logs" ]; then
            mv "$APP_DIR/logs" "$APP_DIR/logs.backup.$(date +%s)"
            log "當前日誌已備份"
        fi
        
        # 恢復日誌
        tar -xzf "$logs_backup" -C "$APP_DIR"
        log "✅ 日誌文件恢復成功"
    else
        warn "日誌備份文件不存在: $logs_backup"
    fi
}

# 恢復上傳文件
restore_uploads() {
    local backup_path="$BACKUP_DIR/$RESTORE_DATE"
    log "開始恢復上傳文件..."
    
    local uploads_backup="$backup_path/uploads/uploads_$RESTORE_DATE.tar.gz"
    
    if [ -f "$uploads_backup" ]; then
        # 備份當前上傳文件
        if [ -d "$APP_DIR/uploads" ]; then
            mv "$APP_DIR/uploads" "$APP_DIR/uploads.backup.$(date +%s)"
            log "當前上傳文件已備份"
        fi
        
        # 恢復上傳文件
        tar -xzf "$uploads_backup" -C "$APP_DIR"
        log "✅ 上傳文件恢復成功"
    else
        warn "上傳文件備份不存在: $uploads_backup"
    fi
}

# 恢復配置文件
restore_config() {
    local backup_path="$BACKUP_DIR/$RESTORE_DATE"
    log "開始恢復配置文件..."
    
    if [ -d "$backup_path/config" ]; then
        # 重要配置文件列表
        config_files=(
            ".env.production"
            ".env.staging"
            "ecosystem.config.js"
            "docker-compose.yml"
            "nginx.conf"
        )
        
        for file in "${config_files[@]}"; do
            if [ -f "$backup_path/config/$file" ]; then
                # 備份當前配置
                if [ -f "$APP_DIR/$file" ]; then
                    cp "$APP_DIR/$file" "$APP_DIR/$file.backup.$(date +%s)"
                fi
                
                # 恢復配置
                cp "$backup_path/config/$file" "$APP_DIR/"
                log "配置文件恢復: $file"
            fi
        done
        
        # 恢復安全配置
        local security_backup="$backup_path/config/security_config_$RESTORE_DATE.tar.gz"
        if [ -f "$security_backup" ]; then
            tar -xzf "$security_backup" -C "$APP_DIR/server/middleware"
            log "安全配置恢復完成"
        fi
        
        log "✅ 配置文件恢復成功"
    else
        warn "配置文件備份不存在"
    fi
}

# 執行系統健康檢查
health_check() {
    log "執行系統健康檢查..."
    
    # 檢查資料庫連接
    if [ -f "$APP_DIR/database/employee_management.db" ]; then
        if sqlite3 "$APP_DIR/database/employee_management.db" "SELECT 1;" &>/dev/null; then
            log "✅ 資料庫連接正常"
        else
            error "❌ 資料庫連接失敗"
            return 1
        fi
    fi
    
    # 檢查必要文件
    essential_files=(
        "server/server.js"
        "package.json"
        ".env.production"
    )
    
    for file in "${essential_files[@]}"; do
        if [ -f "$APP_DIR/$file" ]; then
            log "✅ $file 存在"
        else
            error "❌ $file 缺失"
            return 1
        fi
    done
    
    # 等待服務啟動
    sleep 10
    
    # 檢查服務狀態
    if command -v pm2 &> /dev/null; then
        local running_processes=$(pm2 list | grep -c "online" || echo "0")
        if [ "$running_processes" -gt 0 ]; then
            log "✅ PM2 服務運行正常 ($running_processes 個進程)"
        else
            warn "⚠️  PM2 服務狀態異常"
        fi
    fi
    
    log "✅ 系統健康檢查完成"
}

# 發送恢復通知
send_restore_notification() {
    local success=$1
    
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
        
        local message="$status_emoji 系統恢復通知

📅 恢復時間: $(date +'%Y-%m-%d %H:%M:%S')
📦 恢復備份: $RESTORE_DATE
🔧 恢復組件: ${RESTORE_COMPONENTS:-全部}
📊 恢復狀態: $status_text

🔄 系統狀態: $(pm2 list | grep employee-management | wc -l) 個進程運行中
💾 資料庫狀態: $([ -f "$APP_DIR/database/employee_management.db" ] && echo "正常" || echo "異常")"

        curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
             -d "chat_id=$TELEGRAM_CHAT_ID" \
             -d "text=$message" \
             -d "parse_mode=HTML" > /dev/null
        
        log "恢復通知已發送"
    fi
}

# 顯示使用說明
show_help() {
    echo "Employee Management System 恢復腳本"
    echo ""
    echo "用法: $0 [選項]"
    echo ""
    echo "選項:"
    echo "  -h, --help              顯示此說明"
    echo "  -d, --date DATE         指定恢復的備份日期 (格式: YYYYMMDD_HHMMSS)"
    echo "  -c, --components COMP   指定要恢復的組件 (database,logs,uploads,config)"
    echo "  -l, --list              列出可用的備份"
    echo "  --no-confirm            跳過確認步驟 (危險！)"
    echo ""
    echo "範例:"
    echo "  $0                              # 互動式恢復"
    echo "  $0 --list                       # 列出可用備份"
    echo "  $0 -d 20241201_120000           # 恢復指定日期的備份"
    echo "  $0 -c database,config           # 只恢復資料庫和配置"
}

# 主恢復函數
main() {
    log "開始 Employee Management System 災難恢復..."
    
    # 檢查權限
    if [ "$EUID" -ne 0 ]; then
        error "此腳本需要 root 權限執行"
        exit 1
    fi
    
    # 檢查備份目錄
    if [ ! -d "$BACKUP_DIR" ]; then
        error "備份目錄不存在: $BACKUP_DIR"
        exit 1
    fi
    
    # 選擇備份
    select_backup || exit 1
    
    # 確認操作
    if [ "$NO_CONFIRM" != "true" ]; then
        confirm_restore
    fi
    
    # 停止應用程式
    stop_application
    
    local restore_success=true
    
    # 執行恢復
    case "${RESTORE_COMPONENTS:-all}" in
        *database*|all)
            restore_database || restore_success=false
            ;;
    esac
    
    case "${RESTORE_COMPONENTS:-all}" in
        *logs*|all)
            restore_logs || restore_success=false
            ;;
    esac
    
    case "${RESTORE_COMPONENTS:-all}" in
        *uploads*|all)
            restore_uploads || restore_success=false
            ;;
    esac
    
    case "${RESTORE_COMPONENTS:-all}" in
        *config*|all)
            restore_config || restore_success=false
            ;;
    esac
    
    # 啟動應用程式
    start_application
    
    # 健康檢查
    health_check || restore_success=false
    
    # 發送通知
    send_restore_notification "$restore_success"
    
    if [ "$restore_success" = "true" ]; then
        log "🎉 系統恢復完成！"
        exit 0
    else
        error "❌ 系統恢復過程中發生錯誤"
        exit 1
    fi
}

# 處理命令列參數
NO_CONFIRM=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -d|--date)
            if [ -n "$2" ]; then
                RESTORE_DATE="$2"
                shift 2
            else
                error "需要指定恢復日期"
                exit 1
            fi
            ;;
        -c|--components)
            if [ -n "$2" ]; then
                RESTORE_COMPONENTS="$2"
                shift 2
            else
                error "需要指定恢復組件"
                exit 1
            fi
            ;;
        -l|--list)
            list_available_backups
            exit 0
            ;;
        --no-confirm)
            NO_CONFIRM=true
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