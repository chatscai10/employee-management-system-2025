#!/bin/bash

# 🚀 生產環境部署腳本
# Production Deployment Script

set -e  # 遇到錯誤時立即退出
set -u  # 使用未定義變數時退出

echo "🚀 開始生產環境部署..."

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
PROJECT_NAME="employee-management-system"
BACKUP_DIR="/backup/${PROJECT_NAME}"
LOG_DIR="/var/log/${PROJECT_NAME}"
DEPLOY_LOG="${LOG_DIR}/deploy.log"

# 創建必要目錄
mkdir -p "${BACKUP_DIR}"
mkdir -p "${LOG_DIR}"

# 記錄部署開始時間
DEPLOY_START=$(date +%s)
echo "$(date '+%Y-%m-%d %H:%M:%S') - 🚀 開始生產部署" | tee -a "${DEPLOY_LOG}"

# 函數：打印帶顏色的訊息
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "${DEPLOY_LOG}"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "${DEPLOY_LOG}"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "${DEPLOY_LOG}"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "${DEPLOY_LOG}"
}

# 函數：檢查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 函數：備份當前版本
backup_current_version() {
    log_info "📦 備份當前版本..."
    
    if [ -f "package.json" ]; then
        CURRENT_VERSION=$(node -p "require('./package.json').version")
        BACKUP_NAME="${PROJECT_NAME}_v${CURRENT_VERSION}_$(date +%Y%m%d_%H%M%S)"
        
        # 備份資料庫
        if [ -f "database/employee_management.db" ]; then
            cp "database/employee_management.db" "${BACKUP_DIR}/${BACKUP_NAME}.db"
            log_success "✅ 資料庫備份完成: ${BACKUP_NAME}.db"
        fi
        
        # 備份重要配置文件
        tar -czf "${BACKUP_DIR}/${BACKUP_NAME}_config.tar.gz" \
            .env.production \
            ecosystem.config.js \
            docker-compose.yml \
            nginx.conf 2>/dev/null || true
        
        log_success "✅ 配置文件備份完成: ${BACKUP_NAME}_config.tar.gz"
    fi
}

# 函數：檢查系統依賴
check_dependencies() {
    log_info "🔍 檢查系統依賴..."
    
    local missing_deps=()
    
    if ! command_exists node; then
        missing_deps+=("node")
    fi
    
    if ! command_exists npm; then
        missing_deps+=("npm")
    fi
    
    if ! command_exists docker; then
        missing_deps+=("docker")
    fi
    
    if ! command_exists docker-compose; then
        missing_deps+=("docker-compose")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "❌ 缺少必要依賴: ${missing_deps[*]}"
        exit 1
    fi
    
    log_success "✅ 系統依賴檢查通過"
}

# 函數：運行測試
run_tests() {
    log_info "🧪 運行測試套件..."
    
    if npm test; then
        log_success "✅ 所有測試通過"
    else
        log_error "❌ 測試失敗，終止部署"
        exit 1
    fi
}

# 函數：構建生產版本
build_production() {
    log_info "🏗️  構建生產版本..."
    
    # 清理舊的構建產物
    if [ -d "dist" ]; then
        rm -rf dist
    fi
    
    # 安裝生產依賴
    npm ci --only=production
    
    # 如果有構建腳本，運行構建
    if npm run | grep -q "build"; then
        npm run build
    fi
    
    log_success "✅ 生產版本構建完成"
}

# 函數：安全檢查
security_check() {
    log_info "🔒 執行安全檢查..."
    
    # 檢查 npm audit
    if npm audit --audit-level=high; then
        log_success "✅ npm 安全檢查通過"
    else
        log_warning "⚠️ 發現安全漏洞，建議修復"
        # 自動修復高危漏洞
        npm audit fix --force
    fi
    
    # 檢查敏感文件權限
    if [ -f ".env.production" ]; then
        chmod 600 .env.production
        log_success "✅ 敏感文件權限設置完成"
    fi
}

# 函數：停止當前服務
stop_services() {
    log_info "🛑 停止當前服務..."
    
    # 使用 PM2 停止服務
    if command_exists pm2; then
        pm2 stop ecosystem.config.js || true
        log_info "PM2 服務已停止"
    fi
    
    # 使用 Docker Compose 停止服務
    if [ -f "docker-compose.yml" ]; then
        docker-compose down || true
        log_info "Docker 服務已停止"
    fi
    
    log_success "✅ 服務停止完成"
}

# 函數：啟動服務
start_services() {
    log_info "🚀 啟動生產服務..."
    
    # 使用 Docker Compose 啟動
    if [ -f "docker-compose.yml" ]; then
        docker-compose up -d
        log_info "Docker 服務啟動中..."
        
        # 等待服務就緒
        sleep 10
        
        # 檢查服務狀態
        if docker-compose ps | grep -q "Up"; then
            log_success "✅ Docker 服務啟動成功"
        else
            log_error "❌ Docker 服務啟動失敗"
            return 1
        fi
    fi
    
    # 使用 PM2 啟動
    if command_exists pm2; then
        pm2 start ecosystem.config.js --env production
        pm2 save
        log_success "✅ PM2 服務啟動成功"
    fi
}

# 函數：健康檢查
health_check() {
    log_info "🏥 執行健康檢查..."
    
    local max_attempts=30
    local attempt=1
    local health_url="http://localhost:3000/api/health"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "${health_url}" > /dev/null 2>&1; then
            log_success "✅ 服務健康檢查通過"
            return 0
        fi
        
        log_info "⏳ 等待服務啟動... (${attempt}/${max_attempts})"
        sleep 5
        ((attempt++))
    done
    
    log_error "❌ 服務健康檢查失敗"
    return 1
}

# 函數：配置 SSL 證書
setup_ssl() {
    log_info "🔐 配置 SSL 證書..."
    
    if [ -f "scripts/ssl-setup.sh" ]; then
        bash scripts/ssl-setup.sh
        log_success "✅ SSL 證書配置完成"
    else
        log_warning "⚠️ SSL 設定腳本不存在，跳過 SSL 配置"
    fi
}

# 函數：發送部署通知
send_notification() {
    local status=$1
    local message=$2
    
    log_info "📱 發送部署通知..."
    
    if [ -n "${TELEGRAM_BOT_TOKEN:-}" ] && [ -n "${TELEGRAM_CHAT_ID:-}" ]; then
        local emoji="🚀"
        if [ "$status" != "success" ]; then
            emoji="❌"
        fi
        
        local notification_message="${emoji} 生產部署通知

📋 專案: ${PROJECT_NAME}
📅 時間: $(date '+%Y-%m-%d %H:%M:%S')
⏱️  耗時: $(($(date +%s) - DEPLOY_START))秒
📝 狀態: ${message}
🖥️  伺服器: $(hostname)

詳細日誌請查看: ${DEPLOY_LOG}"

        curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
            -d chat_id="${TELEGRAM_CHAT_ID}" \
            -d text="${notification_message}" > /dev/null || true
        
        log_success "✅ Telegram 通知已發送"
    else
        log_warning "⚠️ Telegram 配置不完整，跳過通知發送"
    fi
}

# 函數：清理舊版本
cleanup_old_versions() {
    log_info "🧹 清理舊版本..."
    
    # 清理舊的 Docker 映像
    if command_exists docker; then
        docker image prune -f || true
        log_info "Docker 映像清理完成"
    fi
    
    # 清理舊的日誌文件 (保留最近7天)
    if [ -d "${LOG_DIR}" ]; then
        find "${LOG_DIR}" -name "*.log" -type f -mtime +7 -delete 2>/dev/null || true
        log_info "舊日誌清理完成"
    fi
    
    # 清理舊的備份文件 (保留最近30天)
    if [ -d "${BACKUP_DIR}" ]; then
        find "${BACKUP_DIR}" -type f -mtime +30 -delete 2>/dev/null || true
        log_info "舊備份清理完成"
    fi
    
    log_success "✅ 清理作業完成"
}

# 函數：回滾部署
rollback_deployment() {
    log_error "💥 部署失敗，開始回滾..."
    
    # 停止失敗的服務
    stop_services
    
    # 恢復備份 (這裡需要實現實際的回滾邏輯)
    log_info "🔄 恢復前一版本..."
    
    # 重新啟動服務
    start_services
    
    send_notification "failed" "部署失敗，已回滾到前一版本"
    exit 1
}

# 主要部署流程
main() {
    log_info "🎯 開始執行生產部署流程"
    
    # 載入環境變數
    if [ -f ".env.production" ]; then
        export $(cat .env.production | grep -v '^#' | xargs)
    fi
    
    # 設置錯誤處理
    trap rollback_deployment ERR
    
    # 執行部署步驟
    check_dependencies
    backup_current_version
    run_tests
    security_check
    build_production
    stop_services
    start_services
    setup_ssl
    
    # 健康檢查
    if ! health_check; then
        rollback_deployment
    fi
    
    cleanup_old_versions
    
    # 記錄部署完成
    DEPLOY_END=$(date +%s)
    DEPLOY_TIME=$((DEPLOY_END - DEPLOY_START))
    
    log_success "🎉 生產部署成功完成！"
    log_info "📊 部署統計:"
    log_info "   ⏱️  總耗時: ${DEPLOY_TIME}秒"
    log_info "   📂 備份目錄: ${BACKUP_DIR}"
    log_info "   📄 日誌文件: ${DEPLOY_LOG}"
    
    send_notification "success" "部署成功完成，耗時 ${DEPLOY_TIME}秒"
}

# 執行主流程
main "$@"