#!/bin/bash

# 🚨 災難恢復腳本
# Disaster Recovery Script

set -e
set -u

echo "🚨 開始災難恢復程序..."

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
RECOVERY_LOG="${LOG_DIR}/disaster-recovery.log"

# 建立必要目錄
mkdir -p "${LOG_DIR}"
mkdir -p "${BACKUP_ROOT}"

# 記錄恢復開始時間
RECOVERY_START=$(date +%s)
echo "$(date '+%Y-%m-%d %H:%M:%S') - 🚨 開始災難恢復" | tee -a "${RECOVERY_LOG}"

# 函數定義
log_info() {
    echo -e "${BLUE}[RECOVERY]${NC} $1" | tee -a "${RECOVERY_LOG}"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "${RECOVERY_LOG}"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "${RECOVERY_LOG}"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "${RECOVERY_LOG}"
}

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 顯示幫助資訊
show_help() {
    cat << EOF
🚨 災難恢復腳本使用指南

使用方法: $0 [選項]

選項:
    --full-restore              完整系統恢復
    --database-only             僅恢復資料庫
    --config-only               僅恢復配置檔案
    --source [local|remote]     指定備份來源 (預設: local)
    --backup-file [file]        指定特定備份檔案
    --dry-run                   模擬執行，不實際恢復
    --force                     強制執行，跳過確認
    --help                      顯示此幫助資訊

範例:
    $0 --full-restore --source local
    $0 --database-only --backup-file /backup/db_backup.sql
    $0 --config-only --dry-run

EOF
}

# 函數：檢查系統狀態
check_system_status() {
    log_info "🔍 檢查系統狀態..."
    
    # 檢查服務狀態
    local services_running=true
    
    if command_exists pm2; then
        if pm2 list | grep -q "online"; then
            log_warning "⚠️ PM2 服務仍在運行，建議先停止服務"
            if [ "$FORCE_MODE" != "true" ]; then
                read -p "是否停止所有服務? (y/N): " -n 1 -r
                echo
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    pm2 stop ecosystem.config.js || true
                    log_info "PM2 服務已停止"
                else
                    log_error "❌ 用戶取消恢復程序"
                    exit 1
                fi
            else
                pm2 stop ecosystem.config.js || true
                log_info "PM2 服務已停止 (強制模式)"
            fi
        fi
    fi
    
    # 檢查 Docker 服務
    if command_exists docker && [ -f "docker-compose.yml" ]; then
        if docker-compose ps | grep -q "Up"; then
            log_warning "⚠️ Docker 服務仍在運行"
            if [ "$FORCE_MODE" != "true" ]; then
                read -p "是否停止 Docker 服務? (y/N): " -n 1 -r
                echo
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    docker-compose down || true
                    log_info "Docker 服務已停止"
                fi
            else
                docker-compose down || true
                log_info "Docker 服務已停止 (強制模式)"
            fi
        fi
    fi
    
    log_success "✅ 系統狀態檢查完成"
}

# 函數：尋找最新備份
find_latest_backup() {
    local backup_type=$1
    local source_location=$2
    
    log_info "🔍 尋找最新 $backup_type 備份..."
    
    case $source_location in
        "local")
            if [ -f "${BACKUP_ROOT}/latest_backup.txt" ]; then
                LATEST_BACKUP=$(cat "${BACKUP_ROOT}/latest_backup.txt")
                if [ -f "$LATEST_BACKUP" ]; then
                    log_success "✅ 找到最新備份: $(basename "$LATEST_BACKUP")"
                    return 0
                fi
            fi
            
            # 尋找最新的 tar.gz 備份檔案
            LATEST_BACKUP=$(find "${BACKUP_ROOT}" -name "*.tar.gz" -type f | sort -r | head -n 1)
            if [ -n "$LATEST_BACKUP" ] && [ -f "$LATEST_BACKUP" ]; then
                log_success "✅ 找到最新備份: $(basename "$LATEST_BACKUP")"
                return 0
            fi
            ;;
            
        "remote")
            log_info "🌐 從遠程位置檢索備份..."
            # 這裡需要實現實際的遠程備份檢索邏輯
            # 例如從 S3、Google Cloud Storage 等
            log_warning "⚠️ 遠程備份功能尚未完全實現"
            return 1
            ;;
    esac
    
    log_error "❌ 找不到可用的 $backup_type 備份"
    return 1
}

# 函數：解壓備份檔案
extract_backup() {
    local backup_file=$1
    local extract_dir="/tmp/recovery_$(date +%s)"
    
    log_info "📦 解壓備份檔案..."
    
    mkdir -p "$extract_dir"
    
    if tar -tzf "$backup_file" >/dev/null 2>&1; then
        tar -xzf "$backup_file" -C "$extract_dir"
        
        # 找到解壓後的目錄
        EXTRACTED_BACKUP_DIR=$(find "$extract_dir" -maxdepth 1 -type d | grep -v "^$extract_dir$" | head -n 1)
        
        if [ -d "$EXTRACTED_BACKUP_DIR" ]; then
            log_success "✅ 備份檔案解壓成功: $EXTRACTED_BACKUP_DIR"
            return 0
        else
            log_error "❌ 解壓後找不到備份目錄"
            rm -rf "$extract_dir"
            return 1
        fi
    else
        log_error "❌ 備份檔案格式錯誤或損壞"
        rm -rf "$extract_dir"
        return 1
    fi
}

# 函數：恢復資料庫
restore_database() {
    local backup_source=$1
    
    log_info "🗄️ 開始恢復資料庫..."
    
    # 備份當前資料庫（如果存在）
    if [ -f "database/employee_management.db" ]; then
        local current_backup="database/employee_management_pre_recovery_$(date +%Y%m%d_%H%M%S).db"
        cp "database/employee_management.db" "$current_backup"
        log_info "💾 當前資料庫已備份至: $current_backup"
    fi
    
    # 尋找資料庫備份檔案
    local db_backup_file=""
    
    if [ -f "${backup_source}/database/employee_management.db" ]; then
        db_backup_file="${backup_source}/database/employee_management.db"
    elif ls "${backup_source}"/database/employee_management_*.db >/dev/null 2>&1; then
        db_backup_file=$(ls "${backup_source}"/database/employee_management_*.db | sort -r | head -n 1)
    elif ls "${backup_source}"/database/employee_management_*.sql >/dev/null 2>&1; then
        local sql_file=$(ls "${backup_source}"/database/employee_management_*.sql | sort -r | head -n 1)
        log_info "📄 找到 SQL 備份檔案，正在恢復..."
        
        # 確保資料庫目錄存在
        mkdir -p database
        
        # 從 SQL 檔案恢復
        if command_exists sqlite3; then
            sqlite3 "database/employee_management.db" < "$sql_file"
            log_success "✅ 從 SQL 檔案恢復資料庫成功"
        else
            log_error "❌ sqlite3 未安裝，無法從 SQL 檔案恢復"
            return 1
        fi
        
        return 0
    fi
    
    if [ -n "$db_backup_file" ] && [ -f "$db_backup_file" ]; then
        # 確保資料庫目錄存在
        mkdir -p database
        
        # 恢復資料庫檔案
        cp "$db_backup_file" "database/employee_management.db"
        
        # 驗證資料庫完整性
        if command_exists sqlite3; then
            if sqlite3 "database/employee_management.db" "PRAGMA integrity_check;" | grep -q "ok"; then
                log_success "✅ 資料庫恢復成功並通過完整性檢查"
            else
                log_error "❌ 資料庫完整性檢查失敗"
                return 1
            fi
        else
            log_warning "⚠️ sqlite3 未安裝，跳過完整性檢查"
        fi
        
        # 設置適當的權限
        chmod 644 "database/employee_management.db"
        
        return 0
    else
        log_error "❌ 找不到資料庫備份檔案"
        return 1
    fi
}

# 函數：恢復配置檔案
restore_configurations() {
    local backup_source=$1
    
    log_info "⚙️ 開始恢復配置檔案..."
    
    local config_backup_dir="${backup_source}/config"
    
    if [ ! -d "$config_backup_dir" ]; then
        log_error "❌ 找不到配置備份目錄: $config_backup_dir"
        return 1
    fi
    
    local restored_count=0
    
    # 恢復環境配置檔案
    local env_files=(".env.production" ".env.staging" ".env.development")
    for env_file in "${env_files[@]}"; do
        if [ -f "${config_backup_dir}/${env_file}" ]; then
            # 備份現有檔案
            if [ -f "$env_file" ]; then
                cp "$env_file" "${env_file}.pre_recovery_$(date +%Y%m%d_%H%M%S)"
            fi
            
            cp "${config_backup_dir}/${env_file}" "$env_file"
            chmod 600 "$env_file"  # 設置安全權限
            log_info "  📄 已恢復: $env_file"
            ((restored_count++))
        fi
    done
    
    # 恢復其他配置檔案
    local config_files=(
        "ecosystem.config.js"
        "docker-compose.yml"
        "docker-compose.development.yml"
        "Dockerfile"
        "nginx.conf"
        "package.json"
    )
    
    for config_file in "${config_files[@]}"; do
        if [ -f "${config_backup_dir}/${config_file}" ]; then
            # 備份現有檔案
            if [ -f "$config_file" ]; then
                cp "$config_file" "${config_file}.pre_recovery_$(date +%Y%m%d_%H%M%S)"
            fi
            
            cp "${config_backup_dir}/${config_file}" "$config_file"
            log_info "  📄 已恢復: $config_file"
            ((restored_count++))
        fi
    done
    
    # 恢復 scripts 目錄
    if [ -d "${config_backup_dir}/scripts" ]; then
        if [ -d "scripts" ]; then
            cp -r scripts "scripts.pre_recovery_$(date +%Y%m%d_%H%M%S)"
        fi
        
        cp -r "${config_backup_dir}/scripts" .
        chmod +x scripts/*.sh
        log_info "  📁 已恢復: scripts/ 目錄"
        ((restored_count++))
    fi
    
    # 恢復伺服器配置
    if [ -d "${config_backup_dir}/server" ]; then
        find "${config_backup_dir}/server" -name "*.js" | while read -r config_file; do
            local relative_path=${config_file#${config_backup_dir}/}
            local dest_dir=$(dirname "$relative_path")
            
            mkdir -p "$dest_dir"
            
            if [ -f "$relative_path" ]; then
                cp "$relative_path" "${relative_path}.pre_recovery_$(date +%Y%m%d_%H%M%S)"
            fi
            
            cp "$config_file" "$relative_path"
            log_info "  📄 已恢復: $relative_path"
            ((restored_count++))
        done
    fi
    
    log_success "✅ 配置檔案恢復完成 (共 ${restored_count} 個檔案)"
    return 0
}

# 函數：恢復重要檔案
restore_important_files() {
    local backup_source=$1
    
    log_info "📁 開始恢復重要檔案..."
    
    local files_backup_dir="${backup_source}/files"
    
    if [ ! -d "$files_backup_dir" ]; then
        log_warning "⚠️ 找不到檔案備份目錄，跳過檔案恢復"
        return 0
    fi
    
    local restored_count=0
    
    # 恢復上傳檔案
    if [ -d "${files_backup_dir}/uploads" ]; then
        if [ -d "uploads" ]; then
            mv uploads "uploads.pre_recovery_$(date +%Y%m%d_%H%M%S)"
        fi
        
        cp -r "${files_backup_dir}/uploads" .
        log_info "  📸 已恢復: uploads/ 目錄"
        ((restored_count++))
    fi
    
    # 恢復證書檔案
    if [ -d "${files_backup_dir}/certs" ]; then
        if [ -d "certs" ]; then
            mv certs "certs.pre_recovery_$(date +%Y%m%d_%H%M%S)"
        fi
        
        cp -r "${files_backup_dir}/certs" .
        chmod 600 certs/* 2>/dev/null || true
        log_info "  🔐 已恢復: certs/ 目錄"
        ((restored_count++))
    fi
    
    # 恢復其他重要檔案
    local important_files=("README.md" "CHANGELOG.md" "LICENSE" ".gitignore")
    for file in "${important_files[@]}"; do
        if [ -f "${files_backup_dir}/${file}" ]; then
            if [ -f "$file" ]; then
                cp "$file" "${file}.pre_recovery_$(date +%Y%m%d_%H%M%S)"
            fi
            
            cp "${files_backup_dir}/${file}" "$file"
            log_info "  📄 已恢復: $file"
            ((restored_count++))
        fi
    done
    
    log_success "✅ 重要檔案恢復完成 (共 ${restored_count} 項)"
    return 0
}

# 函數：驗證恢復結果
verify_recovery() {
    log_info "🔍 驗證恢復結果..."
    
    local verification_passed=true
    
    # 檢查資料庫
    if [ -f "database/employee_management.db" ]; then
        if command_exists sqlite3; then
            if sqlite3 "database/employee_management.db" "PRAGMA integrity_check;" | grep -q "ok"; then
                log_success "✅ 資料庫完整性驗證通過"
            else
                log_error "❌ 資料庫完整性驗證失敗"
                verification_passed=false
            fi
        fi
    else
        log_error "❌ 資料庫檔案不存在"
        verification_passed=false
    fi
    
    # 檢查重要配置檔案
    local critical_files=("package.json" "ecosystem.config.js")
    for file in "${critical_files[@]}"; do
        if [ -f "$file" ]; then
            log_success "✅ 發現關鍵檔案: $file"
        else
            log_error "❌ 缺少關鍵檔案: $file"
            verification_passed=false
        fi
    done
    
    # 檢查環境配置
    if [ -f ".env.production" ]; then
        log_success "✅ 生產環境配置檔案存在"
    else
        log_warning "⚠️ 生產環境配置檔案不存在"
    fi
    
    if [ "$verification_passed" = true ]; then
        log_success "🎉 恢復結果驗證通過"
        return 0
    else
        log_error "❌ 恢復結果驗證失敗"
        return 1
    fi
}

# 函數：重啟服務
restart_services() {
    log_info "🚀 重啟服務..."
    
    # 安裝依賴（如果需要）
    if [ -f "package.json" ]; then
        log_info "📦 安裝 NPM 依賴..."
        npm install --production
    fi
    
    # 啟動 Docker 服務
    if [ -f "docker-compose.yml" ]; then
        log_info "🐳 啟動 Docker 服務..."
        docker-compose up -d
        sleep 10
    fi
    
    # 啟動 PM2 服務
    if command_exists pm2 && [ -f "ecosystem.config.js" ]; then
        log_info "⚡ 啟動 PM2 服務..."
        pm2 start ecosystem.config.js --env production
        pm2 save
    fi
    
    # 等待服務啟動
    log_info "⏳ 等待服務完全啟動..."
    sleep 15
    
    # 健康檢查
    local max_attempts=12
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s --max-time 10 "http://localhost:3000/api/health" > /dev/null 2>&1; then
            log_success "✅ 服務健康檢查通過"
            return 0
        fi
        
        log_info "⏳ 等待服務啟動... (${attempt}/${max_attempts})"
        sleep 10
        ((attempt++))
    done
    
    log_error "❌ 服務啟動失敗或健康檢查不通過"
    return 1
}

# 函數：清理臨時檔案
cleanup_temp_files() {
    log_info "🧹 清理臨時檔案..."
    
    if [ -n "${EXTRACTED_BACKUP_DIR:-}" ] && [ -d "$EXTRACTED_BACKUP_DIR" ]; then
        rm -rf "$(dirname "$EXTRACTED_BACKUP_DIR")"
        log_info "已清理臨時解壓目錄"
    fi
    
    # 清理其他臨時檔案
    find /tmp -name "*recovery*" -type d -mmin +60 -exec rm -rf {} + 2>/dev/null || true
    
    log_success "✅ 臨時檔案清理完成"
}

# 函數：發送恢復通知
send_recovery_notification() {
    local status=$1
    local message=$2
    
    log_info "📱 發送恢復通知..."
    
    if [ -n "${TELEGRAM_BOT_TOKEN:-}" ] && [ -n "${TELEGRAM_CHAT_ID:-}" ]; then
        local emoji="🚨"
        if [ "$status" = "success" ]; then
            emoji="✅"
        elif [ "$status" = "failed" ]; then
            emoji="❌"
        fi
        
        local recovery_time=$(($(date +%s) - RECOVERY_START))
        
        local notification_message="${emoji} 災難恢復通知

📋 專案: ${PROJECT_NAME}
📅 恢復時間: $(date '+%Y-%m-%d %H:%M:%S')
⏱️ 耗時: ${recovery_time}秒
🔧 恢復類型: ${RECOVERY_TYPE}
📝 狀態: ${message}
🖥️ 伺服器: $(hostname)

詳細日誌請查看: ${RECOVERY_LOG}"

        curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
            -d chat_id="${TELEGRAM_CHAT_ID}" \
            -d text="${notification_message}" > /dev/null || true
        
        log_success "✅ Telegram 恢復通知已發送"
    else
        log_warning "⚠️ Telegram 配置不完整，跳過通知發送"
    fi
}

# 主要恢復流程
perform_recovery() {
    local recovery_type=$1
    local backup_source=$2
    
    log_info "🎯 開始執行 ${recovery_type} 恢復"
    
    # 檢查系統狀態
    check_system_status
    
    # 尋找備份
    if [ -z "${SPECIFIC_BACKUP_FILE:-}" ]; then
        if ! find_latest_backup "$recovery_type" "$backup_source"; then
            log_error "❌ 無法找到有效的備份檔案"
            return 1
        fi
        
        BACKUP_FILE="$LATEST_BACKUP"
    else
        BACKUP_FILE="$SPECIFIC_BACKUP_FILE"
        log_info "使用指定的備份檔案: $BACKUP_FILE"
    fi
    
    # 解壓備份檔案
    if [[ "$BACKUP_FILE" == *.tar.gz ]]; then
        if ! extract_backup "$BACKUP_FILE"; then
            log_error "❌ 備份檔案解壓失敗"
            return 1
        fi
        BACKUP_SOURCE_DIR="$EXTRACTED_BACKUP_DIR"
    else
        BACKUP_SOURCE_DIR="$(dirname "$BACKUP_FILE")"
    fi
    
    # 執行恢復
    local recovery_success=true
    
    case $recovery_type in
        "full")
            if ! restore_database "$BACKUP_SOURCE_DIR"; then
                recovery_success=false
            fi
            if ! restore_configurations "$BACKUP_SOURCE_DIR"; then
                recovery_success=false
            fi
            if ! restore_important_files "$BACKUP_SOURCE_DIR"; then
                recovery_success=false
            fi
            ;;
        "database")
            if ! restore_database "$BACKUP_SOURCE_DIR"; then
                recovery_success=false
            fi
            ;;
        "config")
            if ! restore_configurations "$BACKUP_SOURCE_DIR"; then
                recovery_success=false
            fi
            ;;
    esac
    
    if [ "$recovery_success" = false ]; then
        log_error "❌ 恢復過程中出現錯誤"
        cleanup_temp_files
        return 1
    fi
    
    # 驗證恢復結果
    if ! verify_recovery; then
        log_error "❌ 恢復結果驗證失敗"
        cleanup_temp_files
        return 1
    fi
    
    # 重啟服務（僅限完整恢復或資料庫恢復）
    if [ "$recovery_type" = "full" ] || [ "$recovery_type" = "database" ]; then
        if [ "$DRY_RUN" != "true" ]; then
            if ! restart_services; then
                log_error "❌ 服務重啟失敗"
                cleanup_temp_files
                return 1
            fi
        else
            log_info "🔍 模擬模式：跳過服務重啟"
        fi
    fi
    
    # 清理臨時檔案
    cleanup_temp_files
    
    return 0
}

# 解析命令列參數
RECOVERY_TYPE=""
BACKUP_SOURCE="local"
SPECIFIC_BACKUP_FILE=""
DRY_RUN="false"
FORCE_MODE="false"

while [[ $# -gt 0 ]]; do
    case $1 in
        --full-restore)
            RECOVERY_TYPE="full"
            shift
            ;;
        --database-only)
            RECOVERY_TYPE="database"
            shift
            ;;
        --config-only)
            RECOVERY_TYPE="config"
            shift
            ;;
        --source)
            BACKUP_SOURCE="$2"
            shift 2
            ;;
        --backup-file)
            SPECIFIC_BACKUP_FILE="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN="true"
            shift
            ;;
        --force)
            FORCE_MODE="true"
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            log_error "未知參數: $1"
            show_help
            exit 1
            ;;
    esac
done

# 檢查必要參數
if [ -z "$RECOVERY_TYPE" ]; then
    log_error "❌ 請指定恢復類型"
    show_help
    exit 1
fi

# 載入環境變數
if [ -f ".env.production" ]; then
    export $(cat .env.production | grep -v '^#' | xargs) 2>/dev/null || true
fi

# 確認執行（除非是強制模式或模擬模式）
if [ "$FORCE_MODE" != "true" ] && [ "$DRY_RUN" != "true" ]; then
    echo
    echo "⚠️  警告：即將執行災難恢復程序"
    echo "恢復類型: $RECOVERY_TYPE"
    echo "備份來源: $BACKUP_SOURCE"
    if [ -n "$SPECIFIC_BACKUP_FILE" ]; then
        echo "指定檔案: $SPECIFIC_BACKUP_FILE"
    fi
    echo
    read -p "確認執行災難恢復? (輸入 'CONFIRM' 確認): " -r
    if [ "$REPLY" != "CONFIRM" ]; then
        log_error "❌ 用戶取消恢復程序"
        exit 1
    fi
fi

# 執行恢復
if [ "$DRY_RUN" = "true" ]; then
    log_info "🔍 模擬執行模式啟用"
fi

if perform_recovery "$RECOVERY_TYPE" "$BACKUP_SOURCE"; then
    RECOVERY_END=$(date +%s)
    RECOVERY_TIME=$((RECOVERY_END - RECOVERY_START))
    
    log_success "🎉 災難恢復成功完成！"
    log_info "📊 恢復統計:"
    log_info "   🔧 恢復類型: $RECOVERY_TYPE"
    log_info "   ⏱️ 總耗時: ${RECOVERY_TIME}秒"
    log_info "   📁 備份來源: $BACKUP_SOURCE"
    log_info "   📄 詳細日誌: $RECOVERY_LOG"
    
    send_recovery_notification "success" "災難恢復成功完成，耗時 ${RECOVERY_TIME}秒"
    
    if [ "$DRY_RUN" != "true" ]; then
        log_info "🔧 系統恢復完成，建議執行完整的功能測試"
    fi
    
    exit 0
else
    log_error "💥 災難恢復失敗"
    send_recovery_notification "failed" "災難恢復失敗，請檢查日誌並聯繫技術團隊"
    exit 1
fi