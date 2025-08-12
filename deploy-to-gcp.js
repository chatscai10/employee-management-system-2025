/**
 * 🚀 Google Cloud Platform 部署自動化工具
 * 企業員工管理系統 - GCP App Engine 部署
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class GCPDeploymentTool {
    constructor() {
        this.projectPath = __dirname;
        this.projectId = 'enterprise-employee-mgmt'; // 建議的GCP專案ID
        this.deploymentConfig = {
            platform: 'Google Cloud Platform',
            service: 'App Engine',
            runtime: 'nodejs18',
            region: 'asia-east1', // 台灣/香港區域
            scalingType: 'automatic'
        };
    }

    /**
     * 🔧 創建app.yaml配置檔案
     */
    createAppYaml() {
        console.log('📝 創建 app.yaml 配置檔案...');

        const appYaml = `# Google App Engine 配置檔案
# 企業員工管理系統

runtime: nodejs18

# 自動縮放配置
automatic_scaling:
  min_instances: 1
  max_instances: 10
  target_cpu_utilization: 0.6
  target_throughput_utilization: 0.6

# 環境變數
env_variables:
  NODE_ENV: "production"
  JWT_SECRET: "your-super-secret-jwt-key-change-this"
  CORS_ORIGIN: "*"
  RATE_LIMIT_WINDOW: "900000"
  RATE_LIMIT_MAX: "100"
  RATE_LIMIT_LOGIN_MAX: "5"
  
# 可選 - Telegram通知設定
  # TELEGRAM_BOT_TOKEN: "your-bot-token"
  # TELEGRAM_CHAT_ID: "your-chat-id"

# 實例配置
instance_class: F1

# 網路配置
network:
  session_affinity: true

# 靜態檔案處理
handlers:
  # 靜態資源
  - url: /public
    static_dir: public
    secure: always

  - url: /css
    static_dir: public/css
    secure: always

  - url: /js
    static_dir: public/js
    secure: always

  - url: /images
    static_dir: public/images
    secure: always

  # API和動態路由
  - url: /.*
    script: auto
    secure: always

# 跳過上傳的檔案
skip_files:
  - ^(.*/)?#.*#$
  - ^(.*/)?.*~$
  - ^(.*/)?.*\.py[co]$
  - ^(.*/)?.*/RCS/.*$
  - ^(.*/)?\..*$
  - ^(.*/)?node_modules/(.*/)?.*$
  - ^(.*/)?logs/(.*/)?.*$
  - ^(.*/)?\.git/(.*/)?.*$
  - .*\.backup\..*$
  - .*-test-.*$
  - .*-temp.*$
  - cleanup-.*$
  - final-.*$
  - multi-role-.*$
  - .*\.png$
  - .*\.jpg$
  - .*\.md$
  - railway\.json$
  - \.railwayignore$
  - deploy-.*\.sh$
  - deploy-.*\.bat$
`;

        fs.writeFileSync(path.join(this.projectPath, 'app.yaml'), appYaml, 'utf8');
        console.log('✅ app.yaml 檔案已創建');
    }

    /**
     * 📦 創建.gcloudignore檔案
     */
    createGcloudIgnore() {
        console.log('📝 創建 .gcloudignore 檔案...');

        const gcloudIgnore = `# Google Cloud 部署忽略檔案
# 企業員工管理系統

# 依賴檔案
node_modules/
npm-debug.log*
yarn-debug.log*

# 環境檔案
.env
.env.*

# 日誌檔案
logs/
*.log

# 資料庫檔案
*.sqlite
database.sqlite

# 測試和開發檔案
test-*
temp-*
cleanup-*
final-*
multi-role-*

# 圖片檔案
*.png
*.jpg
*.jpeg

# 備份檔案
*.backup.*

# 部署相關
railway.json
.railwayignore
deploy-railway.*
deploy-github-render.*

# 報告檔案
*-report-*.md
*-report-*.txt

# IDE設定
.vscode/
.idea/

# Git檔案
.git/
.gitignore

# 作業系統
.DS_Store
Thumbs.db

# 文檔檔案 (可選 - 如果不想部署文檔)
*.md
deployment-guide.md
deployment-checklist.md
`;

        fs.writeFileSync(path.join(this.projectPath, '.gcloudignore'), gcloudIgnore, 'utf8');
        console.log('✅ .gcloudignore 檔案已創建');
    }

    /**
     * 🔧 檢查GCP CLI安裝
     */
    checkGcloudCLI() {
        console.log('🔍 檢查 Google Cloud CLI 安裝狀態...');

        try {
            const version = execSync('gcloud version', { encoding: 'utf8' });
            console.log('✅ Google Cloud CLI 已安裝');
            console.log('版本資訊:', version.split('\n')[0]);
            return true;
        } catch (error) {
            console.log('❌ Google Cloud CLI 未安裝');
            console.log('\n📦 請先安裝 Google Cloud CLI:');
            console.log('Windows: https://cloud.google.com/sdk/docs/install-sdk#windows');
            console.log('Mac: brew install google-cloud-sdk');
            console.log('Linux: curl https://sdk.cloud.google.com | bash');
            return false;
        }
    }

    /**
     * 🏗️ 準備package.json的gcp-build腳本
     */
    preparePackageJson() {
        console.log('📦 準備 package.json GCP 設定...');

        const packagePath = path.join(this.projectPath, 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

        // 添加GCP特定腳本
        if (!packageJson.scripts) {
            packageJson.scripts = {};
        }

        // GCP build腳本
        packageJson.scripts['gcp-build'] = 'npm install --production';
        packageJson.scripts['deploy-gcp'] = 'gcloud app deploy';

        // 確保有正確的start腳本
        if (!packageJson.scripts.start) {
            packageJson.scripts.start = 'node server/server.js';
        }

        // 設定Node.js版本
        if (!packageJson.engines) {
            packageJson.engines = {};
        }
        packageJson.engines.node = '>=16.0.0';

        fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2), 'utf8');
        console.log('✅ package.json 已更新 GCP 設定');
    }

    /**
     * 📋 創建部署腳本
     */
    createDeploymentScripts() {
        console.log('📝 創建 GCP 部署腳本...');

        // Linux/Mac 部署腳本
        const deployScript = `#!/bin/bash
# Google Cloud Platform 部署腳本
# 企業員工管理系統

echo "🚀 開始部署企業員工管理系統到 Google Cloud Platform..."

# 檢查 gcloud CLI
if ! command -v gcloud &> /dev/null; then
    echo "❌ Google Cloud CLI 未安裝"
    echo "請先安裝: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

echo "✅ Google Cloud CLI 已安裝"

# 設定專案ID (請替換為您的專案ID)
PROJECT_ID="enterprise-employee-mgmt"
echo "🏗️ 使用專案ID: $PROJECT_ID"

# 登入和設定專案 (如果需要)
echo "🔐 檢查登入狀態..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -1 > /dev/null 2>&1; then
    echo "請先登入 Google Cloud:"
    gcloud auth login
fi

# 設定專案
echo "🏗️ 設定專案..."
gcloud config set project $PROJECT_ID

# 啟用必要的API
echo "🔧 啟用必要的API服務..."
gcloud services enable appengine.googleapis.com
gcloud services enable cloudbuild.googleapis.com

# 檢查App Engine是否已初始化
echo "🔍 檢查App Engine狀態..."
if ! gcloud app describe > /dev/null 2>&1; then
    echo "🏗️ 初始化App Engine..."
    gcloud app create --region=asia-east1
fi

# 部署應用
echo "🚀 開始部署應用..."
gcloud app deploy app.yaml --quiet

# 獲取應用URL
echo "🌐 獲取應用URL..."
gcloud app browse

echo "✅ 部署完成！"
echo "📱 您可以在Google Cloud Console查看應用狀態"
echo "🔧 管理面板: https://console.cloud.google.com/appengine"
`;

        fs.writeFileSync(path.join(this.projectPath, 'deploy-gcp.sh'), deployScript, 'utf8');
        console.log('✅ deploy-gcp.sh 腳本已創建');

        // Windows 部署腳本
        const deployBat = `@echo off
REM Google Cloud Platform 部署腳本
REM 企業員工管理系統

echo 🚀 開始部署企業員工管理系統到 Google Cloud Platform...

REM 檢查 gcloud CLI
where gcloud >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Google Cloud CLI 未安裝
    echo 請先安裝: https://cloud.google.com/sdk/docs/install-sdk#windows
    pause
    exit /b 1
)

echo ✅ Google Cloud CLI 已安裝

REM 設定專案ID
set PROJECT_ID=enterprise-employee-mgmt
echo 🏗️ 使用專案ID: %PROJECT_ID%

REM 登入檢查
echo 🔐 檢查登入狀態...
gcloud auth list --filter=status:ACTIVE --format="value(account)" >nul 2>nul
if %errorlevel% neq 0 (
    echo 請先登入 Google Cloud:
    gcloud auth login
)

REM 設定專案
echo 🏗️ 設定專案...
gcloud config set project %PROJECT_ID%

REM 啟用API
echo 🔧 啟用必要的API服務...
gcloud services enable appengine.googleapis.com
gcloud services enable cloudbuild.googleapis.com

REM 檢查App Engine
echo 🔍 檢查App Engine狀態...
gcloud app describe >nul 2>nul
if %errorlevel% neq 0 (
    echo 🏗️ 初始化App Engine...
    gcloud app create --region=asia-east1
)

REM 部署應用
echo 🚀 開始部署應用...
gcloud app deploy app.yaml --quiet

REM 獲取URL
echo 🌐 獲取應用URL...
gcloud app browse

echo ✅ 部署完成！
echo 📱 您可以在Google Cloud Console查看應用狀態
echo 🔧 管理面板: https://console.cloud.google.com/appengine
pause
`;

        fs.writeFileSync(path.join(this.projectPath, 'deploy-gcp.bat'), deployBat, 'utf8');
        console.log('✅ deploy-gcp.bat 腳本已創建');
    }

    /**
     * 📊 創建GCP部署指南
     */
    createGCPDeploymentGuide() {
        const guide = `# 🚀 Google Cloud Platform 部署指南

## 📋 部署前準備

### 1. 安裝 Google Cloud CLI
\`\`\`bash
# Windows
# 下載並安裝: https://cloud.google.com/sdk/docs/install-sdk#windows

# Mac
brew install google-cloud-sdk

# Linux
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
\`\`\`

### 2. 創建 GCP 專案
1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 點擊「創建專案」
3. 專案名稱: \`Enterprise Employee Management\`
4. 專案ID: \`enterprise-employee-mgmt\` (或您偏好的ID)
5. 選擇帳單帳戶 (需要啟用計費才能使用App Engine)

### 3. 啟用必要的API
- App Engine Admin API
- Cloud Build API

## 🚀 部署步驟

### 方法1: 使用部署腳本 (推薦)

#### Linux/Mac:
\`\`\`bash
chmod +x deploy-gcp.sh
./deploy-gcp.sh
\`\`\`

#### Windows:
\`\`\`cmd
deploy-gcp.bat
\`\`\`

### 方法2: 手動部署

#### 1. 登入Google Cloud
\`\`\`bash
gcloud auth login
\`\`\`

#### 2. 設定專案
\`\`\`bash
gcloud config set project enterprise-employee-mgmt
\`\`\`

#### 3. 啟用API服務
\`\`\`bash
gcloud services enable appengine.googleapis.com
gcloud services enable cloudbuild.googleapis.com
\`\`\`

#### 4. 創建App Engine應用
\`\`\`bash
gcloud app create --region=asia-east1
\`\`\`

#### 5. 部署應用
\`\`\`bash
gcloud app deploy
\`\`\`

#### 6. 開啟瀏覽器查看
\`\`\`bash
gcloud app browse
\`\`\`

## 🔧 環境變數設定

在app.yaml中更新環境變數：

\`\`\`yaml
env_variables:
  NODE_ENV: "production"
  JWT_SECRET: "請設置強密碼"
  CORS_ORIGIN: "*"
  # 其他變數...
\`\`\`

## 📊 監控和管理

### 查看應用狀態
\`\`\`bash
gcloud app describe
\`\`\`

### 查看日誌
\`\`\`bash
gcloud app logs tail -s default
\`\`\`

### 查看版本
\`\`\`bash
gcloud app versions list
\`\`\`

### 設定流量分配
\`\`\`bash
gcloud app services set-traffic default --splits=v1=100
\`\`\`

## 💰 費用估算

### App Engine 標準環境定價 (asia-east1)
- F1 實例: 免費額度內
- 超出免費額度後: ~$0.05/小時
- 請求處理: 前100萬次請求免費

### 建議配置
- 開發/測試: F1實例，自動縮放
- 生產環境: F2或以上實例

## 🛡️ 安全設定

### 1. IAM權限
- 設定適當的服務帳號權限
- 限制App Engine的訪問權限

### 2. 防火牆規則
- 使用VPC防火牆規則限制訪問
- 設定IP白名單

### 3. SSL/TLS
- App Engine自動提供HTTPS
- 可設定自訂域名和SSL證書

## 🔍 故障排除

### 常見問題

1. **部署失敗**
   \`\`\`bash
   gcloud app logs tail -s default
   \`\`\`

2. **記憶體不足**
   - 在app.yaml中增加instance_class

3. **靜態檔案404**
   - 檢查app.yaml中的handlers配置

4. **環境變數問題**
   - 確認app.yaml中的env_variables設定

### 有用的命令

\`\`\`bash
# 查看應用詳情
gcloud app describe

# 查看服務列表
gcloud app services list

# 查看版本列表
gcloud app versions list

# 刪除舊版本
gcloud app versions delete VERSION_ID

# 查看實時日誌
gcloud app logs tail -s default

# 查看歷史日誌
gcloud app logs read -s default --limit=50
\`\`\`

## 🌐 自訂域名

### 1. 驗證域名
\`\`\`bash
gcloud app domain-mappings create DOMAIN_NAME
\`\`\`

### 2. 設定DNS
- 在域名提供商處設定CNAME記錄
- 指向 ghs.googlehosted.com

## 📱 後續管理

### 更新應用
\`\`\`bash
gcloud app deploy --version=v2
gcloud app services set-traffic default --splits=v2=100
\`\`\`

### 回滾版本
\`\`\`bash
gcloud app services set-traffic default --splits=v1=100
\`\`\`

---

**完成部署後，您的企業員工管理系統將在以下URL可用：**
\`https://PROJECT_ID.uc.r.appspot.com\`

**管理面板：**
\`https://console.cloud.google.com/appengine\`
`;

        fs.writeFileSync(path.join(this.projectPath, 'gcp-deployment-guide.md'), guide, 'utf8');
        console.log('✅ GCP部署指南已創建: gcp-deployment-guide.md');
    }

    /**
     * 🚀 執行完整GCP部署準備
     */
    async runGCPDeploymentPreparation() {
        console.log('🚀 開始 Google Cloud Platform 部署準備...\n');

        try {
            // 1. 檢查GCP CLI
            const gcloudInstalled = this.checkGcloudCLI();
            
            // 2. 創建配置檔案
            this.createAppYaml();
            this.createGcloudIgnore();
            
            // 3. 準備package.json
            this.preparePackageJson();
            
            // 4. 創建部署腳本
            this.createDeploymentScripts();
            
            // 5. 創建部署指南
            this.createGCPDeploymentGuide();

            console.log('\n🎉 Google Cloud Platform 部署準備完成！\n');

            console.log('📋 後續步驟：');
            if (!gcloudInstalled) {
                console.log('1. 安裝 Google Cloud CLI');
                console.log('2. 創建 GCP 專案並啟用計費');
            } else {
                console.log('1. 創建 GCP 專案並啟用計費');
            }
            console.log('2. 執行: gcloud auth login');
            console.log('3. 執行: ./deploy-gcp.sh (Linux/Mac) 或 deploy-gcp.bat (Windows)');
            console.log('4. 在 app.yaml 中設定環境變數');
            console.log('5. 驗證部署成功');

            console.log('\n💡 重要提醒：');
            console.log('- GCP需要啟用計費帳戶才能使用App Engine');
            console.log('- 請在app.yaml中設定強密碼的JWT_SECRET');
            console.log('- 應用將部署到 asia-east1 區域 (台灣/香港)');

            return {
                success: true,
                platform: 'Google Cloud Platform',
                gcloudInstalled,
                files: [
                    'app.yaml',
                    '.gcloudignore',
                    'deploy-gcp.sh',
                    'deploy-gcp.bat',
                    'gcp-deployment-guide.md'
                ],
                nextSteps: [
                    gcloudInstalled ? '創建GCP專案' : '安裝Google Cloud CLI',
                    '登入Google Cloud',
                    '執行部署腳本',
                    '設定環境變數',
                    '驗證部署'
                ]
            };

        } catch (error) {
            console.error('🚨 GCP部署準備發生錯誤:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// 如果直接執行此文件，則運行GCP部署準備
if (require.main === module) {
    const deployer = new GCPDeploymentTool();
    deployer.runGCPDeploymentPreparation().catch(console.error);
}

module.exports = GCPDeploymentTool;