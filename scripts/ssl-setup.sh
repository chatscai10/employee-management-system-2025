#!/bin/bash

# 🔒 Employee Management System - SSL/TLS 證書管理腳本
# SSL Certificate Management Script with Let's Encrypt and Certbot

set -e

# 配置變數
DOMAIN="your-domain.com"
EMAIL="admin@your-domain.com"
WEBROOT="/var/www/certbot"
SSL_DIR="/etc/nginx/ssl"
NGINX_CONFIG="/etc/nginx/nginx.conf"

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

# 檢查系統需求
check_requirements() {
    log "檢查系統需求..."
    
    # 檢查是否為 root 用戶
    if [ "$EUID" -ne 0 ]; then
        error "此腳本需要 root 權限執行"
        exit 1
    fi
    
    # 檢查必要指令
    local required_commands=("nginx" "openssl" "curl")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            error "必要指令 '$cmd' 未安裝"
            exit 1
        fi
    done
    
    # 檢查網路連接
    if ! curl -s --connect-timeout 5 https://google.com &>/dev/null; then
        error "網路連接異常，無法繼續"
        exit 1
    fi
    
    log "✅ 系統需求檢查完成"
}

# 安裝 Certbot
install_certbot() {
    log "安裝 Certbot..."
    
    if command -v certbot &> /dev/null; then
        log "Certbot 已安裝"
        return 0
    fi
    
    # 根據不同的 Linux 發行版安裝 Certbot
    if [ -f /etc/debian_version ]; then
        # Debian/Ubuntu
        apt-get update
        apt-get install -y certbot python3-certbot-nginx
    elif [ -f /etc/redhat-release ]; then
        # CentOS/RHEL
        yum install -y epel-release
        yum install -y certbot python3-certbot-nginx
    elif [ -f /etc/alpine-release ]; then
        # Alpine Linux
        apk add --no-cache certbot certbot-nginx
    else
        error "不支援的 Linux 發行版"
        exit 1
    fi
    
    log "✅ Certbot 安裝完成"
}

# 創建 SSL 目錄和權限
setup_ssl_directories() {
    log "設置 SSL 目錄和權限..."
    
    # 創建必要目錄
    mkdir -p "$SSL_DIR"
    mkdir -p "$WEBROOT"
    mkdir -p "/var/log/letsencrypt"
    
    # 設置權限
    chmod 755 "$SSL_DIR"
    chmod 755 "$WEBROOT"
    chown -R nginx:nginx "$WEBROOT" 2>/dev/null || true
    
    log "✅ SSL 目錄設置完成"
}

# 生成自簽名證書 (暫時使用)
generate_self_signed_cert() {
    log "生成自簽名證書 (暫時使用)..."
    
    local cert_file="$SSL_DIR/selfsigned.pem"
    local key_file="$SSL_DIR/selfsigned-key.pem"
    
    if [ -f "$cert_file" ] && [ -f "$key_file" ]; then
        log "自簽名證書已存在"
        return 0
    fi
    
    # 生成私鑰
    openssl genrsa -out "$key_file" 2048
    
    # 生成證書
    openssl req -new -x509 -key "$key_file" -out "$cert_file" -days 365 -subj "/C=TW/ST=Taiwan/L=Taipei/O=Employee Management System/CN=$DOMAIN"
    
    # 設置權限
    chmod 600 "$key_file"
    chmod 644 "$cert_file"
    
    log "✅ 自簽名證書生成完成"
}

# 獲取 Let's Encrypt 證書
obtain_letsencrypt_cert() {
    log "獲取 Let's Encrypt 證書..."
    
    # 停止 nginx (避免端口衝突)
    systemctl stop nginx || true
    
    # 使用 standalone 模式獲取證書
    if certbot certonly \
        --standalone \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        --domains "$DOMAIN" \
        --domains "www.$DOMAIN"; then
        
        log "✅ Let's Encrypt 證書獲取成功"
        
        # 複製證書到 nginx ssl 目錄
        cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$SSL_DIR/"
        cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$SSL_DIR/"
        cp "/etc/letsencrypt/live/$DOMAIN/chain.pem" "$SSL_DIR/"
        
        # 設置權限
        chmod 644 "$SSL_DIR/fullchain.pem"
        chmod 644 "$SSL_DIR/chain.pem"
        chmod 600 "$SSL_DIR/privkey.pem"
        
    else
        warn "Let's Encrypt 證書獲取失敗，使用自簽名證書"
        generate_self_signed_cert
        
        # 更新 nginx 配置使用自簽名證書
        sed -i "s|/etc/nginx/ssl/fullchain.pem|$SSL_DIR/selfsigned.pem|g" "$NGINX_CONFIG"
        sed -i "s|/etc/nginx/ssl/privkey.pem|$SSL_DIR/selfsigned-key.pem|g" "$NGINX_CONFIG"
    fi
    
    # 重新啟動 nginx
    systemctl start nginx || true
}

# 設置自動續期
setup_auto_renewal() {
    log "設置證書自動續期..."
    
    # 創建續期腳本
    cat > /usr/local/bin/certbot-renewal.sh << 'EOF'
#!/bin/bash

# Let's Encrypt 證書自動續期腳本
DOMAIN="your-domain.com"
SSL_DIR="/etc/nginx/ssl"

# 續期證書
certbot renew --quiet --no-self-upgrade

# 檢查是否有更新
if [ $? -eq 0 ]; then
    # 複製新證書
    if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
        cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$SSL_DIR/"
        cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$SSL_DIR/"
        cp "/etc/letsencrypt/live/$DOMAIN/chain.pem" "$SSL_DIR/"
        
        # 重新加載 nginx
        nginx -s reload
        
        # 發送成功通知
        if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
            curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
                 -d "chat_id=$TELEGRAM_CHAT_ID" \
                 -d "text=🔒 SSL證書自動續期成功 - $(date)" > /dev/null
        fi
        
        echo "Certificate renewed successfully on $(date)"
    fi
fi
EOF

    # 設置腳本權限
    chmod +x /usr/local/bin/certbot-renewal.sh
    
    # 添加 crontab 任務 (每天凌晨 2 點檢查)
    (crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/certbot-renewal.sh") | crontab -
    
    log "✅ 證書自動續期設置完成"
}

# 測試 SSL 配置
test_ssl_config() {
    log "測試 SSL 配置..."
    
    # 測試 nginx 配置
    if nginx -t; then
        log "✅ Nginx 配置測試通過"
    else
        error "❌ Nginx 配置測試失敗"
        return 1
    fi
    
    # 重新加載 nginx
    systemctl reload nginx
    
    # 等待服務啟動
    sleep 5
    
    # 測試 HTTPS 連接
    if curl -k -s --connect-timeout 10 "https://localhost" &>/dev/null; then
        log "✅ HTTPS 連接測試成功"
    else
        warn "⚠️ HTTPS 連接測試失敗，可能需要檢查防火牆設置"
    fi
    
    # 測試證書有效性
    local cert_expiry=$(openssl x509 -in "$SSL_DIR/fullchain.pem" -noout -enddate 2>/dev/null | cut -d= -f2)
    if [ -n "$cert_expiry" ]; then
        log "證書到期時間: $cert_expiry"
    fi
}

# 顯示 SSL 狀態
show_ssl_status() {
    log "SSL 配置狀態："
    echo ""
    
    # 顯示證書信息
    if [ -f "$SSL_DIR/fullchain.pem" ]; then
        echo "📋 證書信息："
        openssl x509 -in "$SSL_DIR/fullchain.pem" -noout -subject -issuer -dates
        echo ""
    fi
    
    # 顯示 nginx SSL 設置
    echo "🔧 Nginx SSL 設置："
    nginx -T | grep -A 5 -B 5 "ssl_certificate" || echo "未找到 SSL 配置"
    echo ""
    
    # 顯示端口監聽狀態
    echo "🌐 端口監聽狀態："
    netstat -tuln | grep -E ":80|:443" || echo "未找到監聽端口"
    echo ""
}

# 備份現有證書
backup_existing_certs() {
    if [ -d "$SSL_DIR" ] && [ "$(ls -A $SSL_DIR)" ]; then
        local backup_dir="/etc/ssl-backup-$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$backup_dir"
        cp -r "$SSL_DIR"/* "$backup_dir/"
        log "現有證書已備份到: $backup_dir"
    fi
}

# 主函數
main() {
    log "開始 SSL/TLS 證書設置..."
    
    check_requirements
    backup_existing_certs
    install_certbot
    setup_ssl_directories
    obtain_letsencrypt_cert
    setup_auto_renewal
    test_ssl_config
    show_ssl_status
    
    log "🎉 SSL/TLS 證書設置完成！"
    
    echo ""
    info "後續步驟："
    info "1. 更新 nginx.conf 中的域名設置"
    info "2. 設置防火牆規則允許 80 和 443 端口"
    info "3. 配置 DNS 記錄指向您的伺服器"
    info "4. 測試 HTTPS 連接: https://$DOMAIN"
    
    # 發送完成通知
    if [ -f "/var/www/employee-management/.env.production" ]; then
        source "/var/www/employee-management/.env.production"
        if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
            curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
                 -d "chat_id=$TELEGRAM_CHAT_ID" \
                 -d "text=🔒 SSL證書設置完成！域名: $DOMAIN" > /dev/null
        fi
    fi
}

# 顯示使用說明
show_help() {
    echo "Employee Management System SSL 設置腳本"
    echo ""
    echo "用法: $0 [選項]"
    echo ""
    echo "選項:"
    echo "  -h, --help              顯示此說明"
    echo "  -d, --domain DOMAIN     設置域名 (預設: $DOMAIN)"
    echo "  -e, --email EMAIL       設置郵箱 (預設: $EMAIL)"
    echo "  --self-signed           只生成自簽名證書"
    echo "  --renew                 手動續期證書"
    echo "  --status                顯示 SSL 狀態"
    echo ""
    echo "範例:"
    echo "  $0 -d example.com -e admin@example.com"
    echo "  $0 --self-signed"
    echo "  $0 --status"
}

# 手動續期證書
manual_renew() {
    log "手動續期證書..."
    
    certbot renew --force-renewal
    
    if [ $? -eq 0 ]; then
        log "✅ 證書續期成功"
        systemctl reload nginx
    else
        error "❌ 證書續期失敗"
        exit 1
    fi
}

# 處理命令列參數
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -d|--domain)
            if [ -n "$2" ]; then
                DOMAIN="$2"
                shift 2
            else
                error "需要指定域名"
                exit 1
            fi
            ;;
        -e|--email)
            if [ -n "$2" ]; then
                EMAIL="$2"
                shift 2
            else
                error "需要指定郵箱"
                exit 1
            fi
            ;;
        --self-signed)
            check_requirements
            setup_ssl_directories
            generate_self_signed_cert
            test_ssl_config
            exit 0
            ;;
        --renew)
            manual_renew
            exit 0
            ;;
        --status)
            show_ssl_status
            exit 0
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