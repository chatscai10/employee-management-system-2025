# Claude Code 安全修復實施計劃

## 🎯 修復目標

基於相容性分析報告，本計劃專注於解決：
1. **敏感資訊硬編碼問題** (118個檔案)
2. **Claude Code相容性優化**
3. **安全最佳實踐實施**

---

## 📋 詳細實施步驟

### 階段 1: 敏感資訊安全化 🔴 (優先級 P1)

#### 步驟 1.1: 建立統一配置系統
```javascript
// 建立 config/telegram-config.js
module.exports = {
    telegram: {
        botToken: process.env.TELEGRAM_BOT_TOKEN,
        groupId: process.env.TELEGRAM_GROUP_ID,
        apiBaseUrl: 'https://api.telegram.org'
    },
    
    validateConfig() {
        const required = ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_GROUP_ID'];
        const missing = required.filter(key => !process.env[key]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
        }
    }
};
```

#### 步驟 1.2: 更新環境變數配置
```env
# 更新 .env 檔案
# Telegram 通知系統設定
TELEGRAM_BOT_TOKEN=process.env.TELEGRAM_BOT_TOKEN
TELEGRAM_GROUP_ID=process.env.TELEGRAM_GROUP_ID

# 安全設定
ENVIRONMENT=development
SECURITY_MODE=strict
```

#### 步驟 1.3: 建立 .env.example 模板
```env
# 建立 .env.example 檔案
# 企業員工管理系統環境變數模板

# 基本設定
NODE_ENV=development
PORT=3009
HOST=localhost

# JWT 設定
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# Telegram 通知設定 (必填)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_GROUP_ID=your_telegram_group_id_here

# 資料庫設定
DATABASE_URL=sqlite:database/employee_management.db

# 安全設定
LOG_LEVEL=info
SEQUELIZE_LOGGING=false
API_DOCS_ENABLED=true
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
RATE_LIMIT_LOGIN_MAX=5
CORS_ORIGIN=http://localhost:3009
```

#### 步驟 1.4: 批量修復硬編碼Token
```javascript
// 建立 fix-hardcoded-tokens.js 腳本
const fs = require('fs');
const path = require('path');

class TokenReplacer {
    constructor() {
        this.hardcodedToken = 'process.env.TELEGRAM_BOT_TOKEN';
        this.hardcodedGroupId = 'process.env.TELEGRAM_GROUP_ID';
        this.replacements = [
            {
                search: /process.env.TELEGRAM_BOT_TOKEN/g,
                replace: 'process.env.TELEGRAM_BOT_TOKEN'
            },
            {
                search: /process.env.TELEGRAM_GROUP_ID/g,
                replace: 'process.env.TELEGRAM_GROUP_ID'
            }
        ];
    }

    async replaceInFile(filePath) {
        try {
            let content = fs.readFileSync(filePath, 'utf8');
            let modified = false;

            this.replacements.forEach(({ search, replace }) => {
                if (search.test(content)) {
                    content = content.replace(search, replace);
                    modified = true;
                }
            });

            if (modified) {
                // 添加配置導入 (如果需要)
                if (!content.includes("require('dotenv')") && 
                    !content.includes('process.env.TELEGRAM')) {
                    content = "require('dotenv').config();\n" + content;
                }

                fs.writeFileSync(filePath, content, 'utf8');
                console.log(`✅ 修復: ${filePath}`);
                return true;
            }
        } catch (error) {
            console.error(`❌ 錯誤修復 ${filePath}:`, error.message);
        }
        return false;
    }

    async scanAndFix() {
        const affectedFiles = [
            // 主要檔案列表將根據grep結果填入
        ];

        let fixedCount = 0;
        for (const file of affectedFiles) {
            if (await this.replaceInFile(file)) {
                fixedCount++;
            }
        }

        console.log(`🎉 完成! 修復了 ${fixedCount} 個檔案`);
    }
}

// 執行修復
new TokenReplacer().scanAndFix();
```

### 階段 2: Claude Code相容性優化 ⚠️ (優先級 P2)

#### 步驟 2.1: 建立Claude Code友好的配置
```json
// 建立 .claudecode.json
{
    "version": "1.0",
    "compatibility": {
        "requiredEnvVars": [
            "TELEGRAM_BOT_TOKEN",
            "TELEGRAM_GROUP_ID",
            "NODE_ENV"
        ],
        "allowedExternalAPIs": [
            "api.telegram.org"
        ],
        "safeCommands": [
            "npm start",
            "npm test",
            "npm run build"
        ],
        "restrictedCommands": [
            "rm -rf",
            "curl",
            "wget"
        ]
    },
    "security": {
        "scanForSecrets": true,
        "allowHardcodedSecrets": false,
        "requireEnvValidation": true
    }
}
```

#### 步驟 2.2: 建立安全檢查腳本
```javascript
// 建立 scripts/security-check.js
const fs = require('fs');
const path = require('path');

class SecurityChecker {
    constructor() {
        this.securityPatterns = [
            {
                name: 'Telegram Bot Token',
                pattern: /\d+:[A-Za-z0-9_-]+/g,
                severity: 'HIGH'
            },
            {
                name: 'Hardcoded Group ID',
                pattern: /-\d{13}/g,
                severity: 'MEDIUM'
            },
            {
                name: 'SQL Injection Risk',
                pattern: /['"]\s*\+\s*\w+\s*\+\s*['"]/g,
                severity: 'HIGH'
            }
        ];
    }

    scanFile(filePath) {
        const content = fs.readFileSync(filePath, 'utf8');
        const issues = [];

        this.securityPatterns.forEach(({ name, pattern, severity }) => {
            const matches = content.match(pattern);
            if (matches) {
                issues.push({
                    file: filePath,
                    issue: name,
                    severity,
                    matches: matches.length
                });
            }
        });

        return issues;
    }

    async runFullScan() {
        console.log('🔍 開始安全掃描...');
        
        const issues = [];
        const scanPaths = ['server', 'public', '.'];
        
        scanPaths.forEach(scanPath => {
            // 遞歸掃描檔案
            this.scanDirectory(scanPath, issues);
        });

        this.generateReport(issues);
    }

    generateReport(issues) {
        const report = {
            timestamp: new Date().toISOString(),
            totalIssues: issues.length,
            highSeverity: issues.filter(i => i.severity === 'HIGH').length,
            mediumSeverity: issues.filter(i => i.severity === 'MEDIUM').length,
            issues: issues
        };

        fs.writeFileSync(
            'security-scan-report.json', 
            JSON.stringify(report, null, 2)
        );

        console.log('📊 安全掃描報告:');
        console.log(`   總問題數: ${report.totalIssues}`);
        console.log(`   高風險: ${report.highSeverity}`);
        console.log(`   中風險: ${report.mediumSeverity}`);
    }
}

// 執行掃描
new SecurityChecker().runFullScan();
```

#### 步驟 2.3: 優化部署腳本
```bash
# 更新 deploy-railway.sh
#!/bin/bash
# Claude Code 友好的Railway部署腳本

set -e  # 錯誤時停止

echo "🔍 Claude Code相容性檢查..."

# 檢查必要環境變數
if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
    echo "❌ 缺少 TELEGRAM_BOT_TOKEN 環境變數"
    echo "請在.env檔案中設定或使用: export TELEGRAM_BOT_TOKEN=your_token"
    exit 1
fi

# 檢查Railway CLI (非互動式)
if ! command -v railway &> /dev/null; then
    echo "📦 Railway CLI未安裝"
    echo "請執行: npm install -g @railway/cli"
    echo "然後手動執行: railway login"
    exit 1
fi

# 檢查是否已登入
if ! railway whoami &> /dev/null; then
    echo "🔐 請先登入Railway: railway login"
    exit 1
fi

echo "✅ 前置檢查通過"
echo "🚀 開始部署..."

# 設置環境變數 (從本地.env讀取)
source .env 2>/dev/null || echo "⚠️ 未找到.env檔案"

railway variables set NODE_ENV=production
railway variables set TELEGRAM_BOT_TOKEN="$TELEGRAM_BOT_TOKEN"
railway variables set TELEGRAM_GROUP_ID="$TELEGRAM_GROUP_ID"

# 部署
railway up

echo "✅ 部署完成！"
```

### 階段 3: 持續監控與維護 📊 (優先級 P3)

#### 步驟 3.1: 建立自動化檢查
```javascript
// 建立 scripts/claude-code-check.js
const { execSync } = require('child_process');

class ClaudeCodeChecker {
    async checkCompatibility() {
        const checks = [
            this.checkEnvironmentVariables(),
            this.checkFileStructure(),
            this.checkSecurityCompliance(),
            this.checkDependencies()
        ];

        const results = await Promise.all(checks);
        const report = this.generateCompatibilityReport(results);
        
        console.log('📋 Claude Code相容性檢查結果:');
        console.log(report);

        return report.compatible;
    }

    checkEnvironmentVariables() {
        const required = ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_GROUP_ID', 'NODE_ENV'];
        const missing = required.filter(key => !process.env[key]);
        
        return {
            check: 'Environment Variables',
            passed: missing.length === 0,
            details: missing.length > 0 ? `Missing: ${missing.join(', ')}` : 'All required variables present'
        };
    }

    checkFileStructure() {
        const requiredFiles = ['.env.example', 'package.json', 'README.md'];
        const missing = requiredFiles.filter(file => !fs.existsSync(file));
        
        return {
            check: 'File Structure',
            passed: missing.length === 0,
            details: missing.length > 0 ? `Missing: ${missing.join(', ')}` : 'All required files present'
        };
    }

    generateCompatibilityReport(results) {
        const passed = results.filter(r => r.passed).length;
        const total = results.length;
        
        return {
            compatible: passed === total,
            score: `${passed}/${total}`,
            details: results
        };
    }
}

// NPM script 整合
if (require.main === module) {
    new ClaudeCodeChecker().checkCompatibility()
        .then(compatible => {
            process.exit(compatible ? 0 : 1);
        });
}
```

#### 步驟 3.2: 更新package.json scripts
```json
{
    "scripts": {
        "start": "node server/server.js",
        "dev": "NODE_ENV=development nodemon server/server.js",
        "test": "node system-test.js",
        "security-check": "node scripts/security-check.js",
        "claude-check": "node scripts/claude-code-check.js",
        "fix-tokens": "node scripts/fix-hardcoded-tokens.js",
        "deploy": "npm run claude-check && railway deploy",
        "deploy-gcp": "npm run claude-check && gcloud app deploy",
        "prebuild": "npm run security-check",
        "pretest": "npm run claude-check"
    }
}
```

---

## 📊 實施時程表

| 階段 | 任務 | 預估時間 | 負責人 | 狀態 |
|------|------|----------|--------|------|
| 1.1 | 建立統一配置系統 | 2小時 | 開發團隊 | 待開始 |
| 1.2 | 環境變數配置 | 1小時 | 開發團隊 | 待開始 |
| 1.3 | 建立.env模板 | 1小時 | 開發團隊 | 待開始 |
| 1.4 | 批量修復Token | 4小時 | 開發團隊 | 待開始 |
| 2.1 | Claude Code配置 | 2小時 | 開發團隊 | 待開始 |
| 2.2 | 安全檢查腳本 | 3小時 | 開發團隊 | 待開始 |
| 2.3 | 優化部署腳本 | 2小時 | 開發團隊 | 待開始 |
| 3.1 | 自動化檢查 | 3小時 | 開發團隊 | 待開始 |
| 3.2 | NPM scripts更新 | 1小時 | 開發團隊 | 待開始 |

**總預估時間**: 19小時 (約2.5個工作天)

---

## ✅ 驗收標準

### 階段 1 完成標準
- [ ] 所有118個檔案中的硬編碼Token已移除
- [ ] 環境變數配置完整且有效
- [ ] .env.example檔案建立完成
- [ ] 安全掃描通過，無硬編碼敏感資訊

### 階段 2 完成標準
- [ ] .claudecode.json配置檔案建立
- [ ] 安全檢查腳本可正常執行
- [ ] 部署腳本通過Claude Code相容性測試
- [ ] 所有外部依賴都有適當的錯誤處理

### 階段 3 完成標準
- [ ] 自動化檢查腳本運行正常
- [ ] package.json scripts更新完成
- [ ] 持續監控機制建立
- [ ] 文檔更新完成

---

## 🚨 風險緩解措施

### 風險1: 大量檔案修改可能導致功能異常
**緩解措施**: 
- 建立Git分支進行修改
- 逐步測試每個修改的檔案
- 保留備份檔案

### 風險2: 環境變數配置錯誤
**緩解措施**:
- 建立驗證腳本確保配置正確
- 提供詳細的配置文檔
- 建立測試環境先行驗證

### 風險3: 部署腳本相容性問題
**緩解措施**:
- 保留原始部署腳本作為備份
- 在測試環境中充分驗證
- 提供手動部署選項

---

## 📝 後續建議

1. **定期安全掃描**: 每週執行一次安全檢查
2. **文檔維護**: 保持.env.example與實際需求同步
3. **團隊培訓**: 確保團隊成員了解安全最佳實踐
4. **工具更新**: 定期更新Claude Code相容性檢查工具

---

**計劃建立時間**: 2025-08-13 10:40:00  
**計劃版本**: v1.0  
**下次檢討時間**: 2025-08-15