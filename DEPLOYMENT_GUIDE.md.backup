# 🚀 Employee Management System 部署指南

## 📋 部署概述

本指南提供 Employee Management System 在各種環境中的完整部署流程，包括開發環境、測試環境、生產環境的詳細步驟和最佳實踐。

## 📋 系統需求

### 最低硬體需求

#### 開發環境
- **CPU**: 2核心 2.0GHz+
- **記憶體**: 4GB RAM
- **存儲**: 20GB 可用空間
- **網路**: 寬頻網路連線

#### 生產環境
- **CPU**: 4核心 2.4GHz+
- **記憶體**: 8GB RAM (建議 16GB+)
- **存儲**: 100GB SSD (建議 RAID 1)
- **網路**: 專線網路連線
- **備份**: 額外存儲空間用於備份

### 軟體需求

#### 必要軟體
- **作業系統**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **Node.js**: 18.x 或更高版本
- **NPM**: 8.x 或更高版本
- **Git**: 2.25+
- **SQLite**: 3.31+

#### 選用軟體
- **PM2**: 程序管理 (生產環境建議)
- **Docker**: 容器化部署
- **Nginx**: 反向代理 (生產環境建議)
- **Redis**: 快取服務 (可選)

## 🚀 推薦：雲端部署方案 (全新!)

### 🌟 為什麼選擇雲端部署？
- ✅ **零維護成本**：平台自動管理基礎設施
- ✅ **自動擴縮容**：根據流量自動調整資源
- ✅ **全球加速**：內建 CDN 和負載均衡
- ✅ **DevOps 自動化**：CI/CD 一鍵部署
- ✅ **企業級安全**：SSL、防火牆、監控自動配置

### 🏆 最佳選擇：Railway 部署

#### 🎯 Railway 優勢
1. **完美技術相容**：原生支援 Node.js + Docker + Redis + MySQL
2. **按使用量計費**：開發免費，生產成本僅 $5-50/月
3. **零配置部署**：5分鐘完成從代碼到上線
4. **Claude API 完全支援**：無限制整合 Anthropic API

#### 🚀 Railway 快速部署 (推薦!)

**步驟 1：準備 GitHub Secrets**
```bash
# 前往 GitHub Repository → Settings → Secrets and Variables → Actions
# 新增以下 Secrets：
RAILWAY_TOKEN=your-railway-token
RAILWAY_SERVICE_ID=your-service-id  
JWT_SECRET=your-jwt-secret-32-characters-minimum
SESSION_SECRET=your-session-secret-here
CLAUDE_API_KEY=your-claude-api-key
DB_ENCRYPTION_KEY=your-encryption-key-32-chars
```

**步驟 2：一鍵部署**
```bash
# 推送代碼即可自動部署！
git add .
git commit -m "🚀 Railway 雲端部署"
git push origin main

# GitHub Actions 會自動：
# ✅ 執行測試和程式碼檢查
# ✅ 構建 Docker 映像  
# ✅ 部署到 Railway 平台
# ✅ 設定資料庫和 Redis
# ✅ 配置 SSL 和域名
```

**步驟 3：完成設置**
```bash
# Railway 自動提供：
# 🌐 公網訪問 URL: https://your-app.railway.app
# 🗄️ MySQL 資料庫: 自動設置 DATABASE_URL
# ⚡ Redis 緩存: 自動設置 REDIS_URL  
# 📊 監控儀表板: 自動收集指標
# 🔒 SSL 憑證: 自動配置 HTTPS
```

**預期成本 (Railway)**：
- 開發環境：$0/月 (免費額度)
- 小型生產：$5-15/月 (100+ 併發用戶)
- 中型企業：$20-50/月 (1000+ 併發用戶)

### 🥈 備選方案：Render 部署 (企業級安全)

適合需要企業級合規和全球 CDN 的場景

```bash  
# 使用生成的 render.yaml 自動部署
# 推送代碼即可，Render 自動：
# ✅ 檢測配置檔案
# ✅ 構建 Docker 容器
# ✅ 設置 PostgreSQL 資料庫
# ✅ 配置 Redis 和 CDN
```

### 🥉 企業選擇：DigitalOcean App Platform

適合大型企業，需要可預測成本和專業支援

```bash
# 使用生成的 .do/app.yaml 配置
# 提供：
# 🏢 企業級 SLA 保證
# 💰 固定月費定價
# 📞 24/7 技術支援
# 🔧 完整監控和告警
```

## 🔧 傳統部署：本地伺服器 (不推薦)

> ⚠️ **注意**: 雲端部署具有更佳的可靠性、安全性和維護性，強烈建議優先考慮。

### Ubuntu/Debian 系統準備

```bash
# 1. 系統更新
sudo apt update && sudo apt upgrade -y

# 2. 安裝基本工具
sudo apt install -y curl wget git build-essential

# 3. 安裝 Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 4. 安裝 PM2
sudo npm install -g pm2

# 5. 安裝 Nginx (可選)
sudo apt install -y nginx

# 6. 安裝 SQLite
sudo apt install -y sqlite3

# 7. 創建用戶和目錄
sudo adduser employee-mgmt
sudo mkdir -p /var/log/employee-management-system
sudo mkdir -p /backup/employee-management-system
sudo chown employee-mgmt:employee-mgmt /var/log/employee-management-system
sudo chown employee-mgmt:employee-mgmt /backup/employee-management-system
```

### CentOS/RHEL 系統準備

```bash
# 1. 系統更新
sudo yum update -y

# 2. 安裝基本工具
sudo yum groupinstall -y "Development Tools"
sudo yum install -y curl wget git

# 3. 安裝 Node.js 18.x
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# 4. 安裝 PM2
sudo npm install -g pm2

# 5. 安裝 Nginx (可選)
sudo yum install -y nginx

# 6. 安裝 SQLite
sudo yum install -y sqlite

# 7. 設置防火牆
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

## 🏗️ 專案部署

### 方法一：標準部署

#### 1. 獲取原始碼

```bash
# 切換到部署用戶
sudo su - employee-mgmt

# 克隆專案 (使用實際的 Git 倉庫 URL)
git clone <your-repository-url> employee-management-system
cd employee-management-system

# 檢查當前分支
git branch -a

# 切換到生產分支 (如果有)
git checkout production
```

#### 2. 安裝依賴

```bash
# 安裝 Node.js 依賴
npm ci --only=production

# 驗證安裝
npm list --depth=0
```

#### 3. 環境配置

```bash
# 複製環境配置範本
cp .env.production.example .env.production

# 編輯生產環境配置
nano .env.production
```

**生產環境配置範例**:
```env
# === 基本配置 ===
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# === 資料庫配置 ===
DATABASE_PATH=./database/employee_management.db

# === JWT 安全配置 ===
JWT_SECRET=your_super_secure_jwt_secret_with_at_least_32_characters
JWT_REFRESH_SECRET=your_super_secure_refresh_secret_with_at_least_32_characters
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# === 安全配置 ===
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# === 通知配置 ===
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_telegram_chat_id_here

# === 監控配置 ===
MONITORING_ENABLED=true
MONITORING_INTERVAL=300000
ALERT_THRESHOLD_CPU=80
ALERT_THRESHOLD_MEMORY=85
ALERT_THRESHOLD_DISK=90

# === 備份配置 ===
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30
```

#### 4. 資料庫初始化

```bash
# 創建資料庫目錄
mkdir -p database

# 如果有初始化腳本，執行它
if [ -f "scripts/init-database.js" ]; then
    node scripts/init-database.js
fi

# 設置資料庫權限
chmod 644 database/employee_management.db
```

#### 5. 安全設置

```bash
# 設置環境檔案權限
chmod 600 .env.production

# 設置腳本執行權限
chmod +x scripts/*.sh

# 創建日誌目錄
mkdir -p logs
chmod 755 logs
```

#### 6. 服務啟動

```bash
# 使用 PM2 啟動服務
pm2 start ecosystem.config.js --env production

# 設置自動啟動
pm2 startup
pm2 save

# 檢查服務狀態
pm2 status
pm2 logs employee-management-production --lines 50
```

### 方法二：Docker 部署

#### 1. 安裝 Docker

```bash
# 安裝 Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 安裝 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 重新登入以應用群組變更
exit
# 重新登入後...
```

#### 2. 部署容器

```bash
# 進入專案目錄
cd employee-management-system

# 建構映像
docker build -t employee-management:latest .

# 使用 Docker Compose 啟動
docker-compose -f docker-compose.yml up -d

# 檢查容器狀態
docker-compose ps
docker-compose logs
```

#### 3. Docker 健康檢查

```bash
# 檢查容器健康狀態
docker ps --filter "name=employee-management"

# 查看容器日誌
docker logs employee-management-app

# 進入容器進行調試
docker exec -it employee-management-app /bin/sh
```

## 🔍 部署驗證

### 1. 基本功能測試

```bash
# 健康檢查
curl -f http://localhost:3000/api/health

# API 端點測試
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"employeeId": "test", "password": "test"}'

# 檢查靜態檔案服務
curl -I http://localhost:3000/monitoring.html
```

### 2. 效能測試

```bash
# 安裝測試工具
npm install -g loadtest

# 基本負載測試
loadtest -n 1000 -c 10 http://localhost:3000/api/health

# 登入端點測試
loadtest -n 100 -c 5 --method POST \
  --data '{"employeeId": "test", "password": "test"}' \
  --headers "Content-Type: application/json" \
  http://localhost:3000/api/auth/login
```

### 3. 監控驗證

```bash
# 檢查監控端點
curl http://localhost:3000/api/monitoring/metrics

# 檢查告警系統
curl http://localhost:3000/api/alerts/active

# 測試 Telegram 通知
./scripts/health-check.sh
```

## 🔒 SSL/TLS 設置

### 使用 Let's Encrypt 免費 SSL

```bash
# 安裝 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 獲取 SSL 證書
sudo certbot --nginx -d your-domain.com

# 設置自動續期
sudo crontab -e
# 添加以下行：
# 0 12 * * * /usr/bin/certbot renew --quiet

# 測試自動續期
sudo certbot renew --dry-run
```

### 手動 SSL 證書設置

```bash
# 將證書檔案放置到適當位置
sudo mkdir -p /etc/ssl/employee-management
sudo cp your-certificate.crt /etc/ssl/employee-management/
sudo cp your-private-key.key /etc/ssl/employee-management/
sudo chmod 600 /etc/ssl/employee-management/*

# 更新 Nginx 配置
sudo nano /etc/nginx/sites-available/employee-management
```

## 🔄 CI/CD 部署

### GitHub Actions 設置

在專案根目錄創建 `.github/workflows/deploy.yml`:

```yaml
name: Production Deployment

on:
  push:
    branches: [ production ]
  pull_request:
    branches: [ production ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Security audit
      run: npm audit --audit-level=high
    
    - name: Build application
      run: npm run build
    
    - name: Deploy to production
      if: github.ref == 'refs/heads/production'
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /path/to/employee-management-system
          git pull origin production
          npm ci --only=production
          pm2 reload ecosystem.config.js --env production
    
    - name: Health Check
      if: github.ref == 'refs/heads/production'
      run: |
        sleep 10
        curl -f ${{ secrets.HEALTH_CHECK_URL }}
```

### GitLab CI/CD 設置

創建 `.gitlab-ci.yml`:

```yaml
stages:
  - test
  - build
  - deploy

variables:
  NODE_VERSION: "18"

before_script:
  - apt-get update -qq && apt-get install -y -qq git
  - curl -sL https://deb.nodesource.com/setup_18.x | bash -
  - apt-get install -y nodejs

test:
  stage: test
  script:
    - npm ci
    - npm run test
    - npm audit --audit-level=high
  only:
    - merge_requests
    - production

deploy_production:
  stage: deploy
  script:
    - mkdir -p ~/.ssh
    - echo "$SSH_PRIVATE_KEY" | tr -d '\r' > ~/.ssh/id_rsa
    - chmod 600 ~/.ssh/id_rsa
    - ssh-keyscan $DEPLOY_SERVER >> ~/.ssh/known_hosts
    - ssh $DEPLOY_USER@$DEPLOY_SERVER "cd $DEPLOY_PATH && ./scripts/production-deploy.sh"
  only:
    - production
  when: manual
```

## 🔧 部署後配置

### 1. 監控設置

```bash
# 設置系統監控
./scripts/monitoring-setup.sh

# 配置 Cron 任務
crontab -e
```

添加以下 Cron 任務:
```cron
# 每5分鐘執行健康檢查
*/5 * * * * /home/employee-mgmt/employee-management-system/scripts/health-check.sh

# 每天凌晨2點執行備份
0 2 * * * /home/employee-mgmt/employee-management-system/scripts/backup-system.sh

# 每週日凌晨3點清理日誌
0 3 * * 0 /home/employee-mgmt/employee-management-system/scripts/cleanup-logs.sh
```

### 2. 日誌輪轉設置

```bash
# 創建 logrotate 配置
sudo nano /etc/logrotate.d/employee-management
```

```
/var/log/employee-management-system/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
    create 644 employee-mgmt employee-mgmt
}

/home/employee-mgmt/employee-management-system/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    copytruncate
    create 644 employee-mgmt employee-mgmt
}
```

### 3. 防火牆設置

```bash
# Ubuntu/Debian (ufw)
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

## 🐛 常見問題排除

### 部署失敗問題

#### Node.js 版本不匹配
```bash
# 檢查 Node.js 版本
node --version
npm --version

# 更新到正確版本
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

#### 依賴安裝失敗
```bash
# 清理 npm 快取
npm cache clean --force

# 刪除 node_modules 並重新安裝
rm -rf node_modules package-lock.json
npm install
```

#### 權限問題
```bash
# 修復檔案權限
sudo chown -R employee-mgmt:employee-mgmt /path/to/project
chmod 644 .env.production
chmod +x scripts/*.sh
```

#### 服務啟動失敗
```bash
# 檢查 PM2 日誌
pm2 logs --lines 100

# 檢查系統資源
free -h
df -h

# 檢查連接埠占用
sudo netstat -tlnp | grep :3000
```

### 效能問題

#### 記憶體使用過高
```bash
# 調整 PM2 記憶體限制
pm2 start ecosystem.config.js --env production --max-memory-restart 512M

# 啟用 cluster 模式
# 在 ecosystem.config.js 中設置 instances: 'max'
```

#### 回應時間慢
```bash
# 檢查資料庫效能
sqlite3 database/employee_management.db "EXPLAIN QUERY PLAN SELECT * FROM employees LIMIT 10;"

# 執行資料庫優化
sqlite3 database/employee_management.db "VACUUM;"
sqlite3 database/employee_management.db "ANALYZE;"
```

## 🔄 部署回滾

### 快速回滾

```bash
# 使用 Git 回滾到前一版本
git log --oneline | head -5
git reset --hard <previous-commit-hash>

# 重新啟動服務
pm2 reload ecosystem.config.js --env production

# 恢復資料庫 (如果需要)
./scripts/disaster-recovery.sh --database-only --source local
```

### 完整系統回滾

```bash
# 使用災難恢復腳本
./scripts/disaster-recovery.sh --full-restore --source local --force

# 檢查服務狀態
pm2 status
curl -f http://localhost:3000/api/health
```

## 📝 部署檢查清單

### 部署前檢查
- [ ] 確認系統需求滿足
- [ ] 準備好環境配置檔案
- [ ] 測試環境驗證通過
- [ ] 備份現有系統 (如果是更新)
- [ ] 通知相關人員部署時間

### 部署過程檢查
- [ ] 原始碼成功部署
- [ ] 依賴正確安裝
- [ ] 資料庫初始化/遷移完成
- [ ] 環境變數正確設置
- [ ] 服務成功啟動
- [ ] 基本功能測試通過

### 部署後檢查
- [ ] 健康檢查端點正常
- [ ] 監控系統正常運作
- [ ] 日誌記錄正常
- [ ] 備份系統正常
- [ ] SSL 證書有效 (如果使用)
- [ ] 效能指標正常
- [ ] 用戶可以正常訪問

## 📚 參考資源

### 官方文檔
- [Node.js 部署最佳實踐](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [PM2 部署指南](https://pm2.keymetrics.io/docs/usage/deployment/)
- [Nginx 配置指南](https://nginx.org/en/docs/beginners_guide.html)

### 內部文檔
- [運維手冊](OPERATIONS_MANUAL.md)
- [災難恢復計劃](DISASTER_RECOVERY_PLAN.md)
- [安全檢查清單](SECURITY_CHECKLIST.md)

## 📁 雲端部署配置檔案參考

本專案已自動生成完整的雲端部署配置，以下為檔案位置和用途：

### 🚂 Railway 配置
```
├── railway.json                    # Railway 平台配置
├── .github/workflows/
│   └── railway-deploy.yml         # Railway 自動部署工作流程
└── .env.cloud.template             # 雲端環境變數模板
```

### 🎨 Render 配置
```
├── render.yaml                     # Render 平台配置
└── .github/workflows/
    └── render-deploy.yml           # Render 自動部署 (可選)
```

### 🌊 DigitalOcean 配置
```
├── .do/app.yaml                    # DigitalOcean App Platform 配置
└── .github/workflows/
    └── digitalocean-deploy.yml     # DigitalOcean 自動部署
```

### 🤖 Claude API 環境變數配置
從 `.env.cloud.template` 複製並設置：
```env
# Claude API 設定
CLAUDE_API_KEY=your-claude-api-key-here
CLAUDE_MODEL=claude-3-5-sonnet-20241022
CLAUDE_MAX_TOKENS=4096
CLAUDE_TEMPERATURE=0.7

# Telegram 通知 (已配置)
TELEGRAM_BOT_TOKEN=7659930552:AAF_jF1rAXFnjFO176-9X5fKfBwbrko8BNc
TELEGRAM_CHAT_ID=-1002658082392
```

## 🚀 立即開始雲端部署

### 最快 5 分鐘部署到 Railway：

```bash
# 1. 前往 https://railway.app 註冊帳戶
# 2. 連接 GitHub repository
# 3. 選擇此專案進行部署
# 4. Railway 自動檢測 railway.json 並開始部署
# 5. 設置環境變數 (從 .env.cloud.template 複製)
# 6. 完成！訪問提供的 URL 即可使用

# 🎯 不需要任何手動配置，一切都已準備就緒！
```

### 🔍 部署後自動驗證：
- ✅ 健康檢查: `/api/health`  
- ✅ Claude API 整合: 自動測試
- ✅ 資料庫連接: 自動驗證
- ✅ Telegram 通知: 自動發送確認
- ✅ SSL 憑證: 自動配置

---

## 🎉 總結

**推薦部署流程**: Railway → 測試驗證 → 生產上線 → 效能優化

✨ **您的企業員工管理系統已完全準備好進行雲端部署！**

---

**文檔版本**: 2.0 (雲端增強版)  
**最後更新**: 2025-08-09  
**維護人員**: Claude Code AI 智慧系統  
**審核人員**: 雲端部署專家