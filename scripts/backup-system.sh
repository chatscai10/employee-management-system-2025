#!/bin/bash

# 🗄️ 系統備份腳本
# System Backup Script

set -e
set -u

echo "🗄️ 開始系統備份..."

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置
PROJECT_NAME="employee-management-system"
BACKUP_ROOT="/backup/${PROJECT_NAME}"
LOG_DIR="/var/log/${PROJECT_NAME}"
BACKUP_LOG="${LOG_DIR}/backup.log"

# 創建備份目錄結構
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${BACKUP_ROOT}/${TIMESTAMP}"
DATABASE_BACKUP_DIR="${BACKUP_DIR}/database"
CONFIG_BACKUP_DIR="${BACKUP_DIR}/config"
LOGS_BACKUP_DIR="${BACKUP_DIR}/logs"
FILES_BACKUP_DIR="${BACKUP_DIR}/files"

mkdir -p "${DATABASE_BACKUP_DIR}"
mkdir -p "${CONFIG_BACKUP_DIR}"
mkdir -p "${LOGS_BACKUP_DIR}"
mkdir -p "${FILES_BACKUP_DIR}"
mkdir -p "${LOG_DIR}"

# 記錄備份開始時間
BACKUP_START=$(date +%s)
echo "$(date '+%Y-%m-%d %H:%M:%S') - 🗄️ 開始系統備份" | tee -a "${BACKUP_LOG}"

# 函數定義
log_info() {
    echo -e "${BLUE}[BACKUP]${NC} $1" | tee -a "${BACKUP_LOG}"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "${BACKUP_LOG}"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "${BACKUP_LOG}"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "${BACKUP_LOG}"
}

# 函數：備份資料庫
backup_database() {
    log_info "📊 備份資料庫..."
    
    if [ -f "database/employee_management.db" ]; then
        # 創建資料庫備份
        cp "database/employee_management.db" "${DATABASE_BACKUP_DIR}/employee_management_${TIMESTAMP}.db"
        
        # 創建 SQL 導出
        if command -v sqlite3 >/dev/null 2>&1; then
            sqlite3 "database/employee_management.db" .dump > "${DATABASE_BACKUP_DIR}/employee_management_${TIMESTAMP}.sql"
            log_success "✅ 資料庫 SQL 導出完成"
        fi
        
        # 驗證備份完整性
        local original_size=$(stat -f%z "database/employee_management.db" 2>/dev/null || stat -c%s "database/employee_management.db" 2>/dev/null)
        local backup_size=$(stat -f%z "${DATABASE_BACKUP_DIR}/employee_management_${TIMESTAMP}.db" 2>/dev/null || stat -c%s "${DATABASE_BACKUP_DIR}/employee_management_${TIMESTAMP}.db" 2>/dev/null)
        
        if [ "$original_size" -eq "$backup_size" ]; then
            log_success "✅ 資料庫備份完成並驗證通過 (${original_size} bytes)"
        else
            log_error "❌ 資料庫備份大小不匹配"
            return 1
        fi
    else
        log_warning "⚠️ 資料庫文件不存在，跳過備份"
    fi
}

# 函數：備份配置文件
backup_configurations() {
    log_info "⚙️ 備份配置文件..."
    
    local config_files=(
        ".env.production"
        ".env.staging"
        ".env.development"
        "ecosystem.config.js"
        "docker-compose.yml"
        "docker-compose.development.yml"
        "Dockerfile"
        "nginx.conf"
        "package.json"
        "package-lock.json"
        "SECURITY_CHECKLIST.md"
    )
    
    local backed_up_count=0
    
    for config_file in "${config_files[@]}"; do
        if [ -f "$config_file" ]; then
            cp "$config_file" "${CONFIG_BACKUP_DIR}/"
            log_info "  📄 已備份: $config_file"
            ((backed_up_count++))
        fi
    done
    
    # 備份整個 scripts 目錄
    if [ -d "scripts" ]; then
        cp -r scripts "${CONFIG_BACKUP_DIR}/"
        log_info "  📁 已備份: scripts/ 目錄"
    fi
    
    # 備份 server 配置
    if [ -d "server" ]; then
        find server -name "*.js" -path "*/middleware/*" -o -path "*/config/*" | \
        while read -r file; do
            local dest_dir="${CONFIG_BACKUP_DIR}/$(dirname "$file")"
            mkdir -p "$dest_dir"
            cp "$file" "$dest_dir/"
        done
        log_info "  📁 已備份: server/ 配置文件"
    fi
    
    log_success "✅ 配置文件備份完成 (共 ${backed_up_count} 個文件)"
}

# 函數：備份日誌文件
backup_logs() {
    log_info "📝 備份日誌文件..."
    
    local logs_backed_up=0
    
    # 備份應用程式日誌
    if [ -d "logs" ]; then
        cp -r logs/* "${LOGS_BACKUP_DIR}/" 2>/dev/null || true
        logs_backed_up=$(find "${LOGS_BACKUP_DIR}" -type f | wc -l)
        log_info "  📄 已備份應用程式日誌 (${logs_backed_up} 個文件)"
    fi
    
    # 備份系統日誌目錄的相關日誌
    if [ -d "${LOG_DIR}" ]; then
        cp -r "${LOG_DIR}"/* "${LOGS_BACKUP_DIR}/" 2>/dev/null || true
        log_info "  📄 已備份系統日誌"
    fi
    
    # 備份 PM2 日誌
    if command -v pm2 >/dev/null 2>&1; then
        local pm2_log_dir="$HOME/.pm2/logs"
        if [ -d "$pm2_log_dir" ]; then
            mkdir -p "${LOGS_BACKUP_DIR}/pm2"
            cp "$pm2_log_dir"/*employee* "${LOGS_BACKUP_DIR}/pm2/" 2>/dev/null || true
            log_info "  📄 已備份 PM2 日誌"
        fi
    fi
    
    log_success "✅ 日誌備份完成"
}

# 函數：備份重要文件
backup_important_files() {
    log_info "📁 備份重要文件..."
    
    # 備份上傳文件 (如果存在)
    if [ -d "uploads" ]; then
        cp -r uploads "${FILES_BACKUP_DIR}/"
        local file_count=$(find "${FILES_BACKUP_DIR}/uploads" -type f | wc -l)
        log_info "  📸 已備份上傳文件 (${file_count} 個文件)"
    fi
    
    # 備份證書文件 (如果存在)
    if [ -d "certs" ]; then
        cp -r certs "${FILES_BACKUP_DIR}/"
        log_info "  🔐 已備份證書文件"
    fi
    
    # 備份備份工作目錄中的重要文件
    local important_files=(
        "README.md"
        "CHANGELOG.md"
        "LICENSE"
        ".gitignore"
    )
    
    for file in "${important_files[@]}"; do
        if [ -f "$file" ]; then
            cp "$file" "${FILES_BACKUP_DIR}/"
            log_info "  📄 已備份: $file"
        fi
    done
    
    log_success "✅ 重要文件備份完成"
}

# 函數：創建備份清單
create_backup_manifest() {
    log_info "📋 創建備份清單..."
    
    local manifest_file="${BACKUP_DIR}/backup_manifest.txt"
    
    cat > "$manifest_file" << EOF
========================================
${PROJECT_NAME} 系統備份清單
========================================
備份時間: $(date '+%Y-%m-%d %H:%M:%S')
備份目錄: ${BACKUP_DIR}
系統資訊: $(uname -a)
Node.js 版本: $(node --version 2>/dev/null || echo "未安裝")
NPM 版本: $(npm --version 2>/dev/null || echo "未安裝")
========================================

📊 資料庫備份:
$(find "${DATABASE_BACKUP_DIR}" -type f -exec ls -lh {} \; 2>/dev/null || echo "無資料庫備份")

⚙️ 配置文件備份:
$(find "${CONFIG_BACKUP_DIR}" -type f -exec ls -lh {} \; 2>/dev/null || echo "無配置文件備份")

📝 日誌備份:
$(find "${LOGS_BACKUP_DIR}" -type f | wc -l) 個日誌文件

📁 重要文件備份:
$(find "${FILES_BACKUP_DIR}" -type f -exec ls -lh {} \; 2>/dev/null || echo "無重要文件備份")

========================================
備份總大小: $(du -sh "${BACKUP_DIR}" | cut -f1)
========================================
EOF
    
    log_success "✅ 備份清單創建完成: $manifest_file"
}

# 函數：壓縮備份
compress_backup() {
    log_info "🗜️ 壓縮備份文件..."
    
    local archive_name="${PROJECT_NAME}_backup_${TIMESTAMP}.tar.gz"
    local archive_path="${BACKUP_ROOT}/${archive_name}"
    
    # 創建壓縮檔案
    cd "${BACKUP_ROOT}"
    tar -czf "$archive_name" "${TIMESTAMP}/"
    
    # 驗證壓縮檔案
    if [ -f "$archive_path" ]; then
        local archive_size=$(stat -f%z "$archive_path" 2>/dev/null || stat -c%s "$archive_path" 2>/dev/null)
        log_success "✅ 備份壓縮完成: $archive_name ($(numfmt --to=iec-i --suffix=B $archive_size))"
        
        # 刪除原始備份目錄
        rm -rf "${BACKUP_DIR}"
        log_info "🧹 已清理臨時備份目錄"
        
        echo "$archive_path" > "${BACKUP_ROOT}/latest_backup.txt"
    else
        log_error "❌ 備份壓縮失敗"
        return 1
    fi
}

# 函數：清理舊備份
cleanup_old_backups() {
    log_info "🧹 清理舊備份..."
    
    # 保留最近 30 天的備份
    find "${BACKUP_ROOT}" -name "*.tar.gz" -type f -mtime +30 -delete 2>/dev/null || true
    
    # 計算剩餘備份數量
    local remaining_backups=$(find "${BACKUP_ROOT}" -name "*.tar.gz" -type f | wc -l)
    log_success "✅ 舊備份清理完成，剩餘 ${remaining_backups} 個備份文件"
}

# 函數：發送備份通知
send_backup_notification() {
    local status=$1
    local message=$2
    
    log_info "📱 發送備份通知..."
    
    if [ -n "${TELEGRAM_BOT_TOKEN:-}" ] && [ -n "${TELEGRAM_CHAT_ID:-}" ]; then
        local emoji="🗄️"
        if [ "$status" != "success" ]; then
            emoji="❌"
        fi
        
        local backup_size="未知"
        if [ -f "${BACKUP_ROOT}/latest_backup.txt" ]; then
            local latest_backup=$(cat "${BACKUP_ROOT}/latest_backup.txt")
            if [ -f "$latest_backup" ]; then
                local size_bytes=$(stat -f%z "$latest_backup" 2>/dev/null || stat -c%s "$latest_backup" 2>/dev/null)
                backup_size=$(numfmt --to=iec-i --suffix=B $size_bytes)
            fi
        fi
        
        local notification_message="${emoji} 系統備份通知

📋 專案: ${PROJECT_NAME}
📅 備份時間: $(date '+%Y-%m-%d %H:%M:%S')
⏱️ 耗時: $(($(date +%s) - BACKUP_START))秒
📦 大小: ${backup_size}
📝 狀態: ${message}
🖥️ 伺服器: $(hostname)
💾 備份位置: ${BACKUP_ROOT}

備份詳細日誌: ${BACKUP_LOG}"

        curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
            -d chat_id="${TELEGRAM_CHAT_ID}" \
            -d text="${notification_message}" > /dev/null || true
        
        log_success "✅ Telegram 備份通知已發送"
    else
        log_warning "⚠️ Telegram 配置不完整，跳過通知發送"
    fi
}

# 主要備份流程
main() {
    log_info "🎯 開始執行系統備份"
    
    # 載入環境變數
    if [ -f ".env.production" ]; then
        export $(cat .env.production | grep -v '^#' | xargs) 2>/dev/null || true
    fi
    
    # 檢查備份目錄權限
    if [ ! -w "$(dirname "${BACKUP_ROOT}")" ]; then
        log_error "❌ 備份目錄無寫入權限: $(dirname "${BACKUP_ROOT}")"
        exit 1
    fi
    
    # 執行備份步驟
    backup_database
    backup_configurations
    backup_logs  
    backup_important_files
    create_backup_manifest
    compress_backup
    cleanup_old_backups
    
    # 記錄備份完成
    BACKUP_END=$(date +%s)
    BACKUP_TIME=$((BACKUP_END - BACKUP_START))
    
    log_success "🎉 系統備份完成！"
    log_info "📊 備份統計:"
    log_info "   ⏱️ 總耗時: ${BACKUP_TIME}秒"
    log_info "   💾 備份位置: ${BACKUP_ROOT}"
    log_info "   📄 日誌文件: ${BACKUP_LOG}"
    
    if [ -f "${BACKUP_ROOT}/latest_backup.txt" ]; then
        local latest_backup=$(cat "${BACKUP_ROOT}/latest_backup.txt")
        log_info "   📦 最新備份: $(basename "$latest_backup")"
    fi
    
    send_backup_notification "success" "備份成功完成，耗時 ${BACKUP_TIME}秒"
}

# 處理腳本參數
case "${1:-backup}" in
    "backup")
        main
        ;;
    "restore")
        log_info "🔄 備份恢復功能尚未實現"
        exit 1
        ;;
    "list")
        log_info "📋 可用備份列表:"
        find "${BACKUP_ROOT}" -name "*.tar.gz" -type f -exec ls -lh {} \;
        ;;
    *)
        echo "使用方法: $0 [backup|restore|list]"
        exit 1
        ;;
esac