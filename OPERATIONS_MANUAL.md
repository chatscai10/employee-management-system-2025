# 📚 Employee Management System 運維手冊

## 📋 系統概述

Employee Management System 是一個基於 Node.js + Express + SQLite 的企業級員工管理系統，支援考勤管理、GPS定位、角色權限控制等功能。

### 🏗️ 系統架構

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端 Web UI   │◄──►│  Node.js API   │◄──►│  SQLite 資料庫  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Nginx       │    │      PM2        │    │   檔案系統      │
│   反向代理      │    │   程序管理      │    │   日誌/備份     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 🔧 技術棧

- **後端**: Node.js 18+, Express 4.x
- **資料庫**: SQLite 3.x
- **程序管理**: PM2
- **反向代理**: Nginx
- **容器化**: Docker & Docker Compose
- **監控**: 自建監控系統 + Telegram 通知
- **安全**: JWT, bcrypt, Helmet, Rate Limiting

## 🚀 系統部署

### 生產環境部署流程

#### 1. 環境準備
```bash
# 更新系統
sudo apt update && sudo apt upgrade -y

# 安裝 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安裝 PM2
sudo npm install -g pm2

# 安裝 Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER

# 安裝 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 2. 專案部署
```bash
# 複製專案
git clone <repository-url>
cd employee-management-system

# 設置權限
chmod +x scripts/*.sh

# 執行生產部署
./scripts/production-deploy.sh
```

#### 3. 啟動服務
```bash
# 使用 PM2 啟動
pm2 start ecosystem.config.js --env production

# 使用 Docker 啟動
docker-compose up -d

# 啟用 PM2 自動啟動
pm2 startup
pm2 save
```

### 開發環境設置

```bash
# 安裝依賴
npm install

# 複製環境配置
cp .env.development.example .env.development

# 初始化資料庫
npm run db:init

# 啟動開發服務
npm run dev
```

## ⚙️ 系統配置

### 環境變數配置

#### 生產環境 (.env.production)
```env
# 伺服器配置
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# 資料庫配置
DATABASE_PATH=./database/employee_management.db
DATABASE_BACKUP_PATH=/backup/database

# JWT 配置
JWT_SECRET=your_super_secure_jwt_secret_here
JWT_REFRESH_SECRET=your_super_secure_refresh_secret_here
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# 安全配置
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
IP_WHITELIST=

# Telegram 通知
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id

# 監控配置
MONITORING_ENABLED=true
MONITORING_INTERVAL=300000
ALERT_THRESHOLD_CPU=80
ALERT_THRESHOLD_MEMORY=85
ALERT_THRESHOLD_DISK=90
```

### PM2 配置 (ecosystem.config.js)

```javascript
module.exports = {
  apps: [{
    name: 'employee-management-production',
    script: './server/server.js',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 'max',
    exec_mode: 'cluster',
    max_memory_restart: '512M',
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

### Nginx 配置

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # 重導向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL 配置
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # 安全標頭
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    
    # 反向代理
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超時設定
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 靜態檔案
    location /static {
        alias /path/to/static/files;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API 速率限制
    location /api {
        limit_req zone=api burst=10 nodelay;
        proxy_pass http://localhost:3000;
        # ... 其他 proxy 設定
    }
}
```

## 🔍 系統監控

### 監控指標

#### 系統資源監控
- **CPU 使用率**: 目標 < 70%, 告警 > 80%
- **記憶體使用率**: 目標 < 75%, 告警 > 85%
- **磁碟使用率**: 目標 < 80%, 告警 > 90%
- **負載平均值**: 監控 1分鐘、5分鐘、15分鐘負載

#### 應用程式監控
- **回應時間**: 目標 < 500ms, 告警 > 2000ms
- **錯誤率**: 目標 < 1%, 告警 > 5%
- **併發連線數**: 監控活躍連線數
- **資料庫連線狀態**: 監控資料庫可用性

#### 業務指標監控
- **每日活躍用戶數**: DAU
- **考勤打卡成功率**: 目標 > 99%
- **API 調用次數**: QPS/TPS
- **用戶登入成功率**: 目標 > 98%

### 監控工具使用

#### 查看系統狀態
```bash
# PM2 狀態
pm2 status
pm2 monit

# Docker 狀態
docker-compose ps
docker stats

# 系統資源
htop
df -h
free -h
```

#### 查看日誌
```bash
# 應用程式日誌
pm2 logs employee-management-production

# 系統日誌
tail -f /var/log/employee-management-system/*.log

# Nginx 日誌
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

#### 監控面板
- **訪問監控面板**: http://your-domain.com/monitoring.html
- **健康檢查端點**: http://your-domain.com/api/health
- **系統指標端點**: http://your-domain.com/api/monitoring/metrics

## 🔧 日常維護

### 每日檢查項目

#### 上班前檢查 (09:00)
```bash
# 執行健康檢查腳本
./scripts/health-check.sh --detailed

# 檢查昨日備份
ls -la /backup/employee-management-system/ | head -10

# 檢查磁碟空間
df -h

# 檢查系統負載
uptime
```

#### 下班前檢查 (18:00)
```bash
# 檢查今日錯誤日誌
grep -i error /var/log/employee-management-system/*.log | tail -20

# 檢查 PM2 狀態
pm2 status

# 檢查今日考勤統計
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     http://localhost:3000/api/attendance/daily-stats
```

### 每週維護項目

#### 週一上午 (10:00)
```bash
# 清理舊日誌
./scripts/cleanup-logs.sh

# 檢查備份完整性
./scripts/backup-system.sh list

# 更新系統套件
sudo apt update && sudo apt list --upgradable

# 檢查安全更新
npm audit
```

#### 週日晚上 (20:00)
```bash
# 執行完整備份
./scripts/backup-system.sh

# 重啟服務（如需要）
pm2 reload ecosystem.config.js --env production

# 執行資料庫優化
sqlite3 database/employee_management.db "VACUUM;"
```

### 每月維護項目

#### 月初 (每月1日)
```bash
# 生成月度報告
./scripts/generate-monthly-report.sh

# 清理舊備份
find /backup -name "*.tar.gz" -mtime +60 -delete

# 檢查 SSL 證書有效期
./scripts/ssl-setup.sh --check-expiry

# 更新依賴
npm audit fix
npm update
```

## 🚨 故障排除

### 常見問題及解決方案

#### 1. 服務無法啟動

**症狀**: PM2 顯示服務 stopped 或 errored
```bash
# 診斷步驟
pm2 logs employee-management-production --lines 50

# 常見原因和解決方案
# 1. 連接埠被佔用
sudo netstat -tlnp | grep :3000
sudo kill -9 <PID>

# 2. 資料庫檔案權限問題
chmod 644 database/employee_management.db
chown $USER:$USER database/employee_management.db

# 3. 環境變數配置錯誤
pm2 start ecosystem.config.js --env production --update-env
```

#### 2. 資料庫連線失敗

**症狀**: 無法連接到資料庫的錯誤
```bash
# 檢查資料庫檔案
ls -la database/employee_management.db

# 檢查資料庫完整性
sqlite3 database/employee_management.db "PRAGMA integrity_check;"

# 恢復資料庫（如果損壞）
cp /backup/employee-management-system/latest/database/employee_management.db database/
```

#### 3. 記憶體使用率過高

**症狀**: 系統響應緩慢，記憶體告警
```bash
# 檢查記憶體使用
free -h
ps aux --sort=-%mem | head -10

# 重啟 PM2 服務
pm2 reload ecosystem.config.js --env production

# 檢查記憶體洩漏
pm2 monit
```

#### 4. 磁碟空間不足

**症狀**: 磁碟使用率告警
```bash
# 檢查磁碟使用
df -h
du -sh /* | sort -rh | head -10

# 清理日誌檔案
./scripts/cleanup-logs.sh

# 清理 Docker 資源
docker system prune -f

# 清理舊備份
find /backup -name "*.tar.gz" -mtime +30 -delete
```

#### 5. 高 CPU 使用率

**症狀**: CPU 使用率持續高於 80%
```bash
# 檢查 CPU 使用
top
htop

# 檢查 Node.js 程序
pm2 monit

# 分析慢查詢
tail -f logs/app.log | grep "slow"

# 重啟服務
pm2 reload ecosystem.config.js --env production
```

### 緊急處理程序

#### 系統完全不可用
1. **立即響應** (目標: 5分鐘內)
   ```bash
   # 檢查服務狀態
   pm2 status
   docker-compose ps
   
   # 嘗試快速重啟
   pm2 restart all
   ```

2. **初步診斷** (目標: 15分鐘內)
   ```bash
   # 檢查系統資源
   htop
   df -h
   free -h
   
   # 檢查錯誤日誌
   tail -50 logs/app.log
   tail -50 /var/log/nginx/error.log
   ```

3. **恢復措施** (目標: 30分鐘內)
   ```bash
   # 如果服務異常，執行災難恢復
   ./scripts/disaster-recovery.sh --full-restore --force
   
   # 通知相關人員
   # 發送 Telegram 通知會自動執行
   ```

## 📊 效能優化

### 資料庫優化

#### 定期維護
```bash
# 每週執行 VACUUM（整理資料庫）
sqlite3 database/employee_management.db "VACUUM;"

# 更新統計資訊
sqlite3 database/employee_management.db "ANALYZE;"

# 檢查資料庫大小
du -h database/employee_management.db
```

#### 查詢優化
```sql
-- 檢查慢查詢
PRAGMA compile_options;

-- 建立索引（如需要）
CREATE INDEX IF NOT EXISTS idx_attendance_date 
ON attendance(attendance_date);

CREATE INDEX IF NOT EXISTS idx_employees_active 
ON employees(is_active);
```

### 應用程式效能優化

#### Node.js 優化
```bash
# 啟用 cluster 模式
pm2 start ecosystem.config.js --env production

# 調整記憶體限制
pm2 start ecosystem.config.js --env production --max-memory-restart 512M

# 啟用 gzip 壓縮
# 在 Nginx 配置中已啟用
```

#### 快取策略
```javascript
// Redis 快取（如果使用）
const redis = require('redis');
const client = redis.createClient();

// 靜態檔案快取
app.use('/static', express.static('public', {
    maxAge: '1y',
    etag: true,
    lastModified: true
}));
```

## 🔒 安全維護

### 安全檢查清單

#### 每日檢查
- [ ] 檢查異常登入嘗試
- [ ] 檢查系統安全日誌
- [ ] 檢查 IP 黑名單狀態
- [ ] 驗證備份加密狀態

#### 每週檢查
- [ ] 執行安全漏洞掃描 (`npm audit`)
- [ ] 檢查 SSL 證書狀態
- [ ] 檢查防火牆規則
- [ ] 檢查使用者權限設定

#### 每月檢查
- [ ] 更新系統安全補丁
- [ ] 檢查和更新密碼政策
- [ ] 審核使用者帳號狀態
- [ ] 檢查存取日誌異常

### 安全事件響應

#### 發現安全威脅
1. **立即隔離**
   ```bash
   # 封鎖可疑 IP
   sudo ufw deny from <suspicious_ip>
   
   # 停用受影響帳號
   # 在管理介面中操作
   ```

2. **保存證據**
   ```bash
   # 備份相關日誌
   cp /var/log/nginx/access.log /backup/security/incident_$(date +%Y%m%d_%H%M%S).log
   cp logs/app.log /backup/security/app_incident_$(date +%Y%m%d_%H%M%S).log
   ```

3. **通知相關人員**
   ```bash
   # 會自動發送 Telegram 通知
   # 手動通知管理層和安全團隊
   ```

## 📚 參考文檔

### 內部文檔
- [災難恢復計劃](DISASTER_RECOVERY_PLAN.md)
- [安全檢查清單](SECURITY_CHECKLIST.md)
- [部署指南](DEPLOYMENT_GUIDE.md)

### 外部資源
- [Node.js 官方文檔](https://nodejs.org/docs/)
- [PM2 官方指南](https://pm2.keymetrics.io/docs/)
- [SQLite 文檔](https://sqlite.org/docs.html)
- [Nginx 配置指南](https://nginx.org/en/docs/)

### 緊急聯絡資訊
- **技術團隊**: tech-support@company.com
- **系統管理員**: +886-XXX-XXXXX
- **24小時熱線**: +886-XXX-XXXXX

---

**文檔版本**: 1.0  
**最後更新**: 2025-01-09  
**維護人員**: 系統管理員  
**審核人員**: 技術主管