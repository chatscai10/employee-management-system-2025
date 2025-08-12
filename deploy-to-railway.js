/**
 * 🚀 Railway部署自動化工具
 * 企業員工管理系統生產環境部署
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class RailwayDeploymentTool {
    constructor() {
        this.projectPath = __dirname;
        this.deploymentConfig = {
            platform: 'Railway',
            region: 'us-west1',
            runtime: 'nodejs18',
            buildCommand: 'npm install',
            startCommand: 'npm start',
            port: process.env.PORT || 3000
        };
        this.deploymentSteps = [];
    }

    /**
     * 🔍 預部署檢查
     */
    async preDeploymentCheck() {
        console.log('🔍 執行預部署系統檢查...\n');

        const checks = [
            this.checkNodeVersion,
            this.checkPackageJson,
            this.checkEnvironmentConfig,
            this.checkDatabaseSetup,
            this.checkPortConfiguration,
            this.checkRailwayRequirements
        ];

        const results = [];
        for (const check of checks) {
            try {
                const result = await check.call(this);
                results.push(result);
                this.logStep(result.name, result.status, result.message);
            } catch (error) {
                results.push({ name: check.name, status: 'failed', error: error.message });
                this.logStep(check.name, 'failed', error.message);
            }
        }

        const passed = results.filter(r => r.status === 'passed').length;
        const total = results.length;

        console.log(`\n📊 預檢查完成: ${passed}/${total} 項通過`);
        
        if (passed < total) {
            console.log('⚠️ 部分檢查未通過，建議修復後再部署');
            return { success: false, results };
        }

        console.log('✅ 所有預檢查通過，系統準備就緒！\n');
        return { success: true, results };
    }

    /**
     * 🔧 檢查Node.js版本
     */
    async checkNodeVersion() {
        const version = process.version;
        const major = parseInt(version.slice(1).split('.')[0]);
        
        if (major >= 16) {
            return { name: 'Node.js版本', status: 'passed', message: `版本 ${version} ✓` };
        } else {
            return { name: 'Node.js版本', status: 'failed', message: `需要 Node.js 16+，當前版本 ${version}` };
        }
    }

    /**
     * 📦 檢查package.json配置
     */
    async checkPackageJson() {
        const packagePath = path.join(this.projectPath, 'package.json');
        
        if (!fs.existsSync(packagePath)) {
            return { name: 'package.json', status: 'failed', message: '檔案不存在' };
        }

        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        
        const requiredFields = ['name', 'version', 'scripts', 'dependencies'];
        const missing = requiredFields.filter(field => !packageJson[field]);
        
        if (missing.length > 0) {
            return { name: 'package.json', status: 'failed', message: `缺少欄位: ${missing.join(', ')}` };
        }

        if (!packageJson.scripts.start) {
            return { name: 'package.json', status: 'failed', message: '缺少 start 腳本' };
        }

        return { name: 'package.json', status: 'passed', message: '配置完整' };
    }

    /**
     * 🔐 檢查環境變數配置
     */
    async checkEnvironmentConfig() {
        const envPath = path.join(this.projectPath, '.env');
        
        if (!fs.existsSync(envPath)) {
            // 創建基本的.env範例
            const envExample = `# 企業員工管理系統 - 生產環境配置
NODE_ENV=production
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-here
DATABASE_URL=sqlite:./database.sqlite

# Telegram Bot (可選)
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_CHAT_ID=your-chat-id

# CORS設定
CORS_ORIGIN=*

# 速率限制
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
RATE_LIMIT_LOGIN_MAX=5
`;
            fs.writeFileSync(envPath, envExample, 'utf8');
            return { name: '環境變數', status: 'warning', message: '已創建.env範例，請配置實際值' };
        }

        return { name: '環境變數', status: 'passed', message: '.env檔案存在' };
    }

    /**
     * 🗄️ 檢查資料庫設置
     */
    async checkDatabaseSetup() {
        // 檢查資料庫相關檔案
        const dbPaths = [
            'server/models/index.js',
            'server/database.sqlite',
            'database.sqlite'
        ];

        const hasModels = fs.existsSync(path.join(this.projectPath, 'server/models/index.js'));
        if (!hasModels) {
            return { name: '資料庫設置', status: 'failed', message: '缺少資料庫模型檔案' };
        }

        return { name: '資料庫設置', status: 'passed', message: 'SQLite資料庫配置就緒' };
    }

    /**
     * 🌐 檢查埠配置
     */
    async checkPortConfiguration() {
        const serverPath = path.join(this.projectPath, 'server/server.js');
        
        if (!fs.existsSync(serverPath)) {
            return { name: '埠配置', status: 'failed', message: '找不到主伺服器檔案' };
        }

        const serverContent = fs.readFileSync(serverPath, 'utf8');
        const hasPortEnv = serverContent.includes('process.env.PORT');
        
        if (!hasPortEnv) {
            return { name: '埠配置', status: 'warning', message: '建議使用 process.env.PORT' };
        }

        return { name: '埠配置', status: 'passed', message: '動態埠配置正確' };
    }

    /**
     * 🚂 檢查Railway特定需求
     */
    async checkRailwayRequirements() {
        // 檢查是否有Railway配置檔案
        const railwayFiles = ['railway.json', 'railway.toml', 'Procfile'];
        const hasConfig = railwayFiles.some(file => fs.existsSync(path.join(this.projectPath, file)));

        // 檢查start腳本
        const packageJson = JSON.parse(fs.readFileSync(path.join(this.projectPath, 'package.json'), 'utf8'));
        const startScript = packageJson.scripts?.start;

        if (!startScript) {
            return { name: 'Railway需求', status: 'failed', message: '缺少start腳本' };
        }

        return { name: 'Railway需求', status: 'passed', message: `啟動腳本: ${startScript}` };
    }

    /**
     * 📋 記錄部署步驟
     */
    logStep(name, status, message) {
        const icons = {
            'passed': '✅',
            'warning': '⚠️',
            'failed': '❌'
        };
        
        console.log(`${icons[status]} ${name}: ${message}`);
        this.deploymentSteps.push({ name, status, message, timestamp: new Date() });
    }

    /**
     * 🏗️ 準備部署檔案
     */
    async prepareDeploymentFiles() {
        console.log('🏗️ 準備部署檔案...\n');

        // 創建railway.json配置
        const railwayConfig = {
            "$schema": "https://railway.app/railway.schema.json",
            "build": {
                "builder": "NIXPACKS"
            },
            "deploy": {
                "startCommand": "npm start",
                "restartPolicyType": "ON_FAILURE",
                "restartPolicyMaxRetries": 10
            }
        };

        fs.writeFileSync(
            path.join(this.projectPath, 'railway.json'), 
            JSON.stringify(railwayConfig, null, 2), 
            'utf8'
        );
        console.log('✅ 創建 railway.json 配置檔案');

        // 創建.railwayignore
        const railwayIgnore = `# Railway部署忽略檔案
node_modules/
*.log
.env.local
.env.development
*.backup.*
test-*
temp-*
cleanup-*
final-*
multi-role-*
*.png
*.md
logs/
.git/
`;
        fs.writeFileSync(path.join(this.projectPath, '.railwayignore'), railwayIgnore, 'utf8');
        console.log('✅ 創建 .railwayignore 檔案');

        // 更新package.json的engines欄位
        const packagePath = path.join(this.projectPath, 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        
        if (!packageJson.engines) {
            packageJson.engines = {};
        }
        packageJson.engines.node = '>=16.0.0';
        packageJson.engines.npm = '>=8.0.0';

        fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2), 'utf8');
        console.log('✅ 更新 package.json engines 配置');

        return true;
    }

    /**
     * 🚀 執行Railway CLI部署
     */
    async deployToRailway() {
        console.log('🚀 開始Railway部署流程...\n');

        try {
            // 檢查Railway CLI是否安裝
            try {
                execSync('railway --version', { stdio: 'pipe' });
                console.log('✅ Railway CLI 已安裝');
            } catch (error) {
                console.log('📦 安裝 Railway CLI...');
                execSync('npm install -g @railway/cli', { stdio: 'inherit' });
                console.log('✅ Railway CLI 安裝完成');
            }

            // 初始化Railway專案
            console.log('\n🏗️ 初始化Railway專案...');
            console.log('請按照以下步驟操作：');
            console.log('1. 執行: railway login');
            console.log('2. 執行: railway init');
            console.log('3. 選擇 "Create new project"');
            console.log('4. 輸入專案名稱: enterprise-employee-management');
            console.log('5. 執行: railway up');

            // 生成部署命令腳本
            const deployScript = `#!/bin/bash
# 企業員工管理系統 Railway 部署腳本

echo "🚀 開始部署企業員工管理系統到Railway..."

# 檢查Railway CLI
if ! command -v railway &> /dev/null; then
    echo "📦 安裝 Railway CLI..."
    npm install -g @railway/cli
fi

# 登入Railway (如果需要)
echo "🔐 請確認已登入Railway..."
railway whoami || railway login

# 初始化專案 (如果需要)
if [ ! -f "railway.json" ]; then
    echo "🏗️ 初始化Railway專案..."
    railway init
fi

# 設置環境變數
echo "🔧 設置生產環境變數..."
railway variables set NODE_ENV=production
railway variables set PORT=3000

# 部署應用
echo "🚀 部署應用..."
railway up

echo "✅ 部署完成！"
echo "🌐 請查看Railway Dashboard獲取部署URL"
`;

            fs.writeFileSync(path.join(this.projectPath, 'deploy-railway.sh'), deployScript, 'utf8');
            console.log('✅ 創建部署腳本: deploy-railway.sh');

            // Windows批次檔案
            const deployBat = `@echo off
echo 🚀 開始部署企業員工管理系統到Railway...

REM 檢查Railway CLI
where railway >nul 2>nul
if %errorlevel% neq 0 (
    echo 📦 安裝 Railway CLI...
    npm install -g @railway/cli
)

REM 登入Railway
echo 🔐 請確認已登入Railway...
railway whoami || railway login

REM 初始化專案
if not exist "railway.json" (
    echo 🏗️ 初始化Railway專案...
    railway init
)

REM 設置環境變數
echo 🔧 設置生產環境變數...
railway variables set NODE_ENV=production
railway variables set PORT=3000

REM 部署應用
echo 🚀 部署應用...
railway up

echo ✅ 部署完成！
echo 🌐 請查看Railway Dashboard獲取部署URL
pause
`;

            fs.writeFileSync(path.join(this.projectPath, 'deploy-railway.bat'), deployBat, 'utf8');
            console.log('✅ 創建Windows部署腳本: deploy-railway.bat');

            return {
                success: true,
                message: '部署腳本已準備就緒',
                scripts: ['deploy-railway.sh', 'deploy-railway.bat']
            };

        } catch (error) {
            console.error('❌ Railway部署準備失敗:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 📊 生成部署報告
     */
    generateDeploymentReport() {
        const report = `
# 🚀 企業員工管理系統 - Railway部署報告

## 📊 部署摘要
- **部署平台**: Railway
- **專案類型**: Node.js應用程式
- **資料庫**: SQLite (檔案型資料庫)
- **部署時間**: ${new Date().toLocaleString('zh-TW')}

## 🔧 部署配置
\`\`\`json
${JSON.stringify(this.deploymentConfig, null, 2)}
\`\`\`

## 📋 部署步驟記錄
${this.deploymentSteps.map(step => `
### ${step.name}
- **狀態**: ${step.status}
- **訊息**: ${step.message}
- **時間**: ${step.timestamp.toLocaleString('zh-TW')}
`).join('')}

## 🌐 部署後設定

### 環境變數設置
在Railway Dashboard中設置以下環境變數：

\`\`\`env
NODE_ENV=production
PORT=3000
JWT_SECRET=請設置強密碼
CORS_ORIGIN=*
TELEGRAM_BOT_TOKEN=可選
TELEGRAM_CHAT_ID=可選
\`\`\`

### 域名配置
1. 在Railway Dashboard中點擊專案
2. 進入Settings頁面
3. 在Domains區塊添加自定義域名
4. 或使用Railway提供的免費域名

## 📱 部署後驗證

### 健康檢查端點
- \`GET /health\` - 系統健康狀態
- \`GET /api/test\` - API測試端點

### 主要功能頁面
- \`/login.html\` - 登入頁面
- \`/employee-dashboard.html\` - 員工儀表板
- \`/employee-enterprise.html\` - 企業管理頁面

## 🔧 故障排除

### 常見問題
1. **500錯誤**: 檢查環境變數配置
2. **資料庫錯誤**: 確認SQLite檔案權限
3. **靜態檔案404**: 檢查public目錄配置

### 日誌查看
\`\`\`bash
railway logs
railway logs --follow
\`\`\`

## 🚀 部署命令

### 手動部署
\`\`\`bash
# 登入Railway
railway login

# 初始化專案
railway init

# 部署應用
railway up
\`\`\`

### 使用腳本部署
\`\`\`bash
# Linux/Mac
chmod +x deploy-railway.sh
./deploy-railway.sh

# Windows
deploy-railway.bat
\`\`\`

## 📈 監控與維護

### 效能監控
- Railway Dashboard提供即時監控
- CPU、記憶體、網路使用情況
- 錯誤日誌和警報

### 自動重啟
- 配置了自動重啟策略
- 失敗時最多重試10次
- 支援零停機部署

---
**報告生成時間**: ${new Date().toISOString()}  
**部署工具**: Railway自動化部署工具 v1.0
`;

        const reportPath = path.join(this.projectPath, `railway-deployment-report-${Date.now()}.md`);
        fs.writeFileSync(reportPath, report, 'utf8');

        console.log(`\n📄 部署報告已保存: ${reportPath}`);
        return reportPath;
    }

    /**
     * 🎯 執行完整部署流程
     */
    async runFullDeployment() {
        console.log('🎯 開始企業員工管理系統Railway部署流程...\n');

        try {
            // 1. 預部署檢查
            const preCheck = await this.preDeploymentCheck();
            if (!preCheck.success) {
                return { success: false, stage: 'pre-check', details: preCheck };
            }

            // 2. 準備部署檔案
            await this.prepareDeploymentFiles();

            // 3. 執行Railway部署
            const deployResult = await this.deployToRailway();

            // 4. 生成部署報告
            const reportPath = this.generateDeploymentReport();

            console.log('\n🎉 Railway部署流程完成！');
            console.log('\n📋 後續步驟：');
            console.log('1. 執行 railway login 登入您的Railway帳號');
            console.log('2. 執行 railway init 初始化專案');
            console.log('3. 執行 railway up 開始部署');
            console.log('4. 在Railway Dashboard設置環境變數');
            console.log('5. 配置自定義域名（可選）');

            return {
                success: true,
                platform: 'Railway',
                deployResult,
                reportPath,
                nextSteps: [
                    'railway login',
                    'railway init',
                    'railway up',
                    '設置環境變數',
                    '配置域名'
                ]
            };

        } catch (error) {
            console.error('🚨 部署流程發生錯誤:', error);
            return {
                success: false,
                error: error.message,
                stage: 'deployment'
            };
        }
    }
}

// 如果直接執行此文件，則運行完整部署
if (require.main === module) {
    const deployer = new RailwayDeploymentTool();
    deployer.runFullDeployment().catch(console.error);
}

module.exports = RailwayDeploymentTool;