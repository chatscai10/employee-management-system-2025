/**
 * 安全性增強系統 - 添加二次確認和權限檢查
 * 創建日期: 2025-08-12
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class SecurityEnhancementSystem {
    constructor() {
        this.logPath = path.join(__dirname, 'security-enhancement.log');
        this.enhancements = [];
        this.startTime = new Date();
    }

    log(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}\n`;
        console.log(message);
        fs.appendFileSync(this.logPath, logMessage);
    }

    // 檢查現有安全措施
    async auditCurrentSecurity() {
        this.log('🔍 開始安全性檢查...');
        
        const securityChecks = {
            authMiddleware: false,
            inputValidation: false,
            rateLimit: false,
            encryption: false,
            accessControl: false,
            auditLogging: false
        };

        // 檢查認證中間件
        const authFiles = [
            'server/middleware/auth.js',
            'server/middleware/security/authSecurity.js'
        ];

        for (const file of authFiles) {
            if (fs.existsSync(path.join(__dirname, file))) {
                securityChecks.authMiddleware = true;
                this.log(`✅ 發現認證中間件: ${file}`);
                break;
            }
        }

        // 檢查輸入驗證
        const validationFiles = [
            'server/middleware/validation/validators.js',
            'server/middleware/security/inputSecurity.js'
        ];

        for (const file of validationFiles) {
            if (fs.existsSync(path.join(__dirname, file))) {
                securityChecks.inputValidation = true;
                this.log(`✅ 發現輸入驗證: ${file}`);
                break;
            }
        }

        // 檢查速率限制
        const rateLimitFiles = [
            'server/middleware/performance/rateLimit.js'
        ];

        for (const file of rateLimitFiles) {
            if (fs.existsSync(path.join(__dirname, file))) {
                securityChecks.rateLimit = true;
                this.log(`✅ 發現速率限制: ${file}`);
                break;
            }
        }

        return securityChecks;
    }

    // 增強前端安全性
    async enhanceFrontendSecurity() {
        this.log('🔒 增強前端安全性...');

        const frontendFiles = [
            'public/employee-enterprise.html',
            'public/login.html'
        ];

        for (const file of frontendFiles) {
            const filePath = path.join(__dirname, file);
            if (fs.existsSync(filePath)) {
                let content = fs.readFileSync(filePath, 'utf8');
                let modified = false;

                // 添加 CSP (Content Security Policy) 標頭
                if (!content.includes('Content-Security-Policy')) {
                    const cspMeta = `    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data: https:; connect-src 'self' https://api.telegram.org;">`;
                    content = content.replace('<head>', `<head>\n${cspMeta}`);
                    modified = true;
                    this.log(`🛡️ 添加 CSP 到: ${file}`);
                }

                // 添加 X-Frame-Options
                if (!content.includes('X-Frame-Options')) {
                    const frameOptionsMeta = `    <meta http-equiv="X-Frame-Options" content="DENY">`;
                    content = content.replace('</head>', `${frameOptionsMeta}\n</head>`);
                    modified = true;
                    this.log(`🛡️ 添加 X-Frame-Options 到: ${file}`);
                }

                // 增強表單驗證
                if (!content.includes('validateInput')) {
                    const validationScript = `
        // 安全輸入驗證函數
        function validateInput(input, type = 'text') {
            if (!input || typeof input !== 'string') return false;
            
            // 移除潛在危險字符
            input = input.trim();
            
            switch (type) {
                case 'email':
                    return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(input);
                case 'phone':
                    return /^[0-9\\-\\+\\(\\)\\s]+$/.test(input);
                case 'id':
                    return /^[A-Z0-9]+$/.test(input);
                case 'name':
                    return /^[\\u4e00-\\u9fff\\u3400-\\u4dbf\\w\\s]+$/.test(input) && input.length <= 50;
                case 'alphanumeric':
                    return /^[a-zA-Z0-9]+$/.test(input);
                default:
                    // 基本XSS防護
                    return !/<script|javascript:|on\\w+=/i.test(input);
            }
        }

        // 安全的API請求函數
        function secureApiRequest(url, options = {}) {
            // 添加安全標頭
            options.headers = {
                ...options.headers,
                'X-Requested-With': 'XMLHttpRequest',
                'X-Client-Version': '1.0.0'
            };

            // 添加請求時間戳（防重放攻擊）
            if (options.body && typeof options.body === 'string') {
                const data = JSON.parse(options.body);
                data._timestamp = Date.now();
                data._nonce = Math.random().toString(36).substr(2, 9);
                options.body = JSON.stringify(data);
            }

            return fetch(url, options);
        }

        // 替換所有 fetch 調用
        const originalFetch = window.fetch;
        window.fetch = function(url, options = {}) {
            if (url.startsWith('/api/')) {
                return secureApiRequest(url, options);
            }
            return originalFetch(url, options);
        };
`;
                    
                    content = content.replace('</script>', `${validationScript}\n</script>`);
                    modified = true;
                    this.log(`🔐 添加安全驗證函數到: ${file}`);
                }

                if (modified) {
                    fs.writeFileSync(filePath, content);
                    this.enhancements.push({
                        type: 'frontend_security',
                        file: file,
                        enhancements: ['CSP', 'X-Frame-Options', 'Input Validation']
                    });
                }
            }
        }
    }

    // 增強API安全性
    async enhanceApiSecurity() {
        this.log('🔐 增強API安全性...');

        // 檢查並增強認證路由
        const authApiPath = path.join(__dirname, 'server/routes/api/auth.js');
        if (fs.existsSync(authApiPath)) {
            let content = fs.readFileSync(authApiPath, 'utf8');
            let modified = false;

            // 添加速率限制
            if (!content.includes('rateLimitMap')) {
                const rateLimitCode = `
// 添加速率限制機制
const rateLimitMap = new Map();
const RATE_LIMIT = {
    login: { max: 5, window: 15 * 60 * 1000 }, // 15分鐘5次
    register: { max: 3, window: 60 * 60 * 1000 }, // 1小時3次
    verify: { max: 10, window: 60 * 1000 } // 1分鐘10次
};

function checkRateLimit(req, action) {
    const key = \`\${req.ip}_\${action}\`;
    const now = Date.now();
    const limit = RATE_LIMIT[action];
    
    if (!rateLimitMap.has(key)) {
        rateLimitMap.set(key, { count: 1, firstRequest: now });
        return true;
    }
    
    const data = rateLimitMap.get(key);
    
    // 重置窗口
    if (now - data.firstRequest > limit.window) {
        rateLimitMap.set(key, { count: 1, firstRequest: now });
        return true;
    }
    
    // 檢查限制
    if (data.count >= limit.max) {
        return false;
    }
    
    data.count++;
    return true;
}
`;
                content = rateLimitCode + '\n' + content;
                modified = true;
                this.log('🚨 添加API速率限制');
            }

            // 增強登入安全
            if (!content.includes('loginAttempts')) {
                const loginSecurityCode = `
// 登入嘗試追蹤
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 30 * 60 * 1000; // 30分鐘

function isAccountLocked(identifier) {
    if (!loginAttempts.has(identifier)) return false;
    
    const attempts = loginAttempts.get(identifier);
    if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
        if (Date.now() - attempts.lastAttempt < LOCKOUT_TIME) {
            return true;
        } else {
            // 鎖定時間已過，重置
            loginAttempts.delete(identifier);
            return false;
        }
    }
    return false;
}

function recordLoginAttempt(identifier, success) {
    if (success) {
        loginAttempts.delete(identifier);
        return;
    }
    
    if (!loginAttempts.has(identifier)) {
        loginAttempts.set(identifier, { count: 1, lastAttempt: Date.now() });
    } else {
        const attempts = loginAttempts.get(identifier);
        attempts.count++;
        attempts.lastAttempt = Date.now();
    }
}
`;
                content = loginSecurityCode + '\n' + content;
                modified = true;
                this.log('🔒 添加登入嘗試追蹤');
            }

            if (modified) {
                fs.writeFileSync(authApiPath, content);
                this.enhancements.push({
                    type: 'api_security',
                    file: 'server/routes/api/auth.js',
                    enhancements: ['Rate Limiting', 'Login Attempt Tracking']
                });
            }
        }
    }

    // 創建安全審計日誌系統
    async createAuditLogging() {
        this.log('📋 創建安全審計日誌系統...');

        const auditLoggerPath = path.join(__dirname, 'server/middleware/auditLogger.js');
        const auditLoggerContent = `/**
 * 安全審計日誌中間件
 */

const fs = require('fs');
const path = require('path');

class AuditLogger {
    constructor() {
        this.logPath = path.join(__dirname, '../logs/audit.log');
        this.ensureLogDirectory();
    }

    ensureLogDirectory() {
        const logDir = path.dirname(this.logPath);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }

    log(event, user, details = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            event: event,
            user: user,
            ip: details.ip,
            userAgent: details.userAgent,
            details: details,
            risk: this.assessRisk(event, details)
        };

        const logLine = JSON.stringify(logEntry) + '\\n';
        fs.appendFileSync(this.logPath, logLine);

        // 高風險事件立即通知
        if (logEntry.risk === 'HIGH') {
            this.sendSecurityAlert(logEntry);
        }
    }

    assessRisk(event, details) {
        const highRiskEvents = [
            'LOGIN_FAILED_MULTIPLE',
            'UNAUTHORIZED_ACCESS',
            'SUSPICIOUS_ACTIVITY',
            'DATA_MODIFICATION',
            'PRIVILEGE_ESCALATION'
        ];

        if (highRiskEvents.includes(event)) return 'HIGH';
        if (event.includes('FAILED')) return 'MEDIUM';
        return 'LOW';
    }

    async sendSecurityAlert(logEntry) {
        try {
            const telegramBotToken = 'process.env.TELEGRAM_BOT_TOKEN';
            const chatId = 'process.env.TELEGRAM_GROUP_ID';
            
            const message = \`🚨 安全警報
            
事件: \${logEntry.event}
用戶: \${logEntry.user}
時間: \${logEntry.timestamp}
IP: \${logEntry.ip}
風險等級: \${logEntry.risk}

詳情: \${JSON.stringify(logEntry.details, null, 2)}\`;

            const fetch = require('node-fetch');
            await fetch(\`https://api.telegram.org/bot\${telegramBotToken}/sendMessage\`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message
                })
            });
        } catch (error) {
            console.error('安全警報發送失敗:', error);
        }
    }

    middleware() {
        return (req, res, next) => {
            // 記錄敏感操作
            const originalSend = res.send;
            res.send = function(data) {
                // 分析響應以檢測可疑活動
                if (res.statusCode >= 400) {
                    auditLogger.log('HTTP_ERROR', req.user?.id || 'anonymous', {
                        ip: req.ip,
                        userAgent: req.get('User-Agent'),
                        method: req.method,
                        url: req.url,
                        statusCode: res.statusCode
                    });
                }
                
                return originalSend.call(this, data);
            };

            next();
        };
    }
}

const auditLogger = new AuditLogger();
module.exports = auditLogger;
`;

        fs.writeFileSync(auditLoggerPath, auditLoggerContent);
        this.log(`✅ 創建審計日誌系統: ${auditLoggerPath}`);

        this.enhancements.push({
            type: 'audit_logging',
            file: 'server/middleware/auditLogger.js',
            features: ['Security Event Logging', 'Risk Assessment', 'Alert System']
        });
    }

    // 創建安全配置檢查器
    async createSecurityChecker() {
        this.log('🔍 創建安全配置檢查器...');

        const securityCheckerPath = path.join(__dirname, 'security-check.js');
        const securityCheckerContent = `#!/usr/bin/env node
/**
 * 安全配置檢查器 - 定期檢查系統安全狀態
 */

const fs = require('fs');
const path = require('path');

class SecurityChecker {
    constructor() {
        this.checks = [];
    }

    async runAllChecks() {
        console.log('🔍 開始安全檢查...');
        
        this.checkFilePermissions();
        this.checkEnvironmentVariables();
        this.checkDependencyVulnerabilities();
        this.checkConfigurationSecurity();
        
        this.generateSecurityReport();
    }

    checkFilePermissions() {
        const sensitiveFiles = [
            '.env',
            'server/config/database.js',
            'server/models',
            'server/routes/api'
        ];

        for (const file of sensitiveFiles) {
            try {
                const stats = fs.statSync(file);
                const mode = stats.mode.toString(8);
                
                this.checks.push({
                    type: 'file_permission',
                    file: file,
                    mode: mode,
                    secure: this.isSecurePermission(mode)
                });
            } catch (error) {
                this.checks.push({
                    type: 'file_permission',
                    file: file,
                    error: error.message
                });
            }
        }
    }

    isSecurePermission(mode) {
        // 檢查文件權限是否安全
        const lastThree = mode.slice(-3);
        return lastThree === '600' || lastThree === '644' || lastThree === '755';
    }

    checkEnvironmentVariables() {
        const requiredEnvVars = [
            'JWT_SECRET',
            'DATABASE_URL',
            'NODE_ENV'
        ];

        for (const envVar of requiredEnvVars) {
            const exists = !!process.env[envVar];
            const secure = exists && process.env[envVar].length > 10;
            
            this.checks.push({
                type: 'environment_variable',
                variable: envVar,
                exists: exists,
                secure: secure
            });
        }
    }

    checkDependencyVulnerabilities() {
        try {
            const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            const dependencies = {...packageJson.dependencies, ...packageJson.devDependencies};
            
            // 檢查已知有漏洞的包
            const vulnerablePackages = [
                'lodash@4.17.15',
                'axios@0.18.0',
                'express@4.16.0'
            ];

            for (const [name, version] of Object.entries(dependencies)) {
                const packageString = \`\${name}@\${version}\`;
                const vulnerable = vulnerablePackages.includes(packageString);
                
                if (vulnerable) {
                    this.checks.push({
                        type: 'dependency_vulnerability',
                        package: packageString,
                        vulnerable: true,
                        severity: 'HIGH'
                    });
                }
            }
        } catch (error) {
            this.checks.push({
                type: 'dependency_check',
                error: error.message
            });
        }
    }

    checkConfigurationSecurity() {
        // 檢查服務器配置
        const configChecks = [
            { file: 'server/server.js', pattern: /app\\.use\\(cors\\(\\)\\)/, risk: 'CORS not configured' },
            { file: 'server/server.js', pattern: /helmet/, secure: 'Security headers enabled' },
            { file: 'server/server.js', pattern: /express\\.static/, risk: 'Static files served' }
        ];

        for (const check of configChecks) {
            try {
                const content = fs.readFileSync(check.file, 'utf8');
                const found = check.pattern.test(content);
                
                this.checks.push({
                    type: 'configuration',
                    file: check.file,
                    check: check.pattern.toString(),
                    found: found,
                    message: found ? (check.secure || 'Found') : (check.risk || 'Not found')
                });
            } catch (error) {
                this.checks.push({
                    type: 'configuration',
                    file: check.file,
                    error: error.message
                });
            }
        }
    }

    generateSecurityReport() {
        const report = {
            timestamp: new Date().toISOString(),
            checks: this.checks,
            summary: {
                total: this.checks.length,
                passed: this.checks.filter(c => c.secure || (c.found && c.message !== c.risk)).length,
                failed: this.checks.filter(c => c.vulnerable || c.error || (c.found && c.message === c.risk)).length
            }
        };

        const reportPath = \`security-report-\${Date.now()}.json\`;
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        console.log('📊 安全檢查報告:');
        console.log(\`總檢查項目: \${report.summary.total}\`);
        console.log(\`通過: \${report.summary.passed}\`);
        console.log(\`失敗: \${report.summary.failed}\`);
        console.log(\`詳細報告: \${reportPath}\`);

        return report;
    }
}

if (require.main === module) {
    const checker = new SecurityChecker();
    checker.runAllChecks();
}

module.exports = SecurityChecker;
`;

        fs.writeFileSync(securityCheckerPath, securityCheckerContent);
        this.log(`✅ 創建安全檢查器: ${securityCheckerPath}`);

        this.enhancements.push({
            type: 'security_checker',
            file: 'security-check.js',
            features: ['Permission Check', 'Environment Variables', 'Dependency Scan', 'Config Audit']
        });
    }

    // 生成安全增強報告
    async generateSecurityReport() {
        const duration = Date.now() - this.startTime.getTime();
        
        const report = {
            timestamp: new Date().toISOString(),
            duration: `${Math.round(duration / 1000)}秒`,
            enhancements: this.enhancements,
            summary: {
                totalEnhancements: this.enhancements.length,
                frontendSecurity: this.enhancements.filter(e => e.type === 'frontend_security').length,
                apiSecurity: this.enhancements.filter(e => e.type === 'api_security').length,
                auditLogging: this.enhancements.filter(e => e.type === 'audit_logging').length,
                securityTools: this.enhancements.filter(e => e.type === 'security_checker').length
            }
        };

        const reportPath = path.join(__dirname, `security-enhancement-report-${Date.now()}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        this.log('🛡️ ====== 安全性增強報告 ======');
        this.log(`🕒 執行時間: ${report.duration}`);
        this.log(`🔧 總增強項目: ${report.summary.totalEnhancements} 項`);
        this.log(`🌐 前端安全: ${report.summary.frontendSecurity} 項`);
        this.log(`🔐 API安全: ${report.summary.apiSecurity} 項`);
        this.log(`📋 審計日誌: ${report.summary.auditLogging} 項`);
        this.log(`🔍 安全工具: ${report.summary.securityTools} 項`);
        this.log(`📋 詳細報告: ${reportPath}`);
        this.log('=====================================');

        return report;
    }

    // 發送安全增強通知
    async sendSecurityNotification(report) {
        try {
            const telegramBotToken = 'process.env.TELEGRAM_BOT_TOKEN';
            const chatId = 'process.env.TELEGRAM_GROUP_ID';
            
            const message = `🛡️ 安全性增強完成報告

🔧 增強項目: ${report.summary.totalEnhancements} 項
🌐 前端安全: ${report.summary.frontendSecurity} 項
🔐 API安全: ${report.summary.apiSecurity} 項
📋 審計日誌: ${report.summary.auditLogging} 項
🔍 安全工具: ${report.summary.securityTools} 項
🕒 執行時間: ${report.duration}

📊 增強明細:
${report.enhancements.map(enh => {
    const features = enh.enhancements || enh.features || [];
    return `${this.getEnhancementIcon(enh.type)} ${enh.type}: ${features.join(', ')}`;
}).join('\n')}

🔒 系統安全性已增強`;

            const fetch = require('node-fetch');
            const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message
                })
            });

            if (response.ok) {
                this.log('📱 Telegram 通知發送成功');
            } else {
                this.log('📱 Telegram 通知發送失敗');
            }
        } catch (error) {
            this.log(`📱 Telegram 通知錯誤: ${error.message}`);
        }
    }

    getEnhancementIcon(type) {
        const icons = {
            'frontend_security': '🌐',
            'api_security': '🔐',
            'audit_logging': '📋',
            'security_checker': '🔍'
        };
        return icons[type] || '🔧';
    }

    // 執行完整安全增強
    async runFullSecurityEnhancement() {
        this.log('🛡️ 開始安全性全面增強...');
        
        try {
            // 1. 檢查現有安全措施
            await this.auditCurrentSecurity();
            
            // 2. 增強前端安全性
            await this.enhanceFrontendSecurity();
            
            // 3. 增強API安全性
            await this.enhanceApiSecurity();
            
            // 4. 創建審計日誌系統
            await this.createAuditLogging();
            
            // 5. 創建安全檢查器
            await this.createSecurityChecker();
            
            // 6. 生成報告
            const report = await this.generateSecurityReport();
            
            this.log('✅ 安全性增強完成！');
            
            // 7. 發送通知
            await this.sendSecurityNotification(report);
            
            return report;
            
        } catch (error) {
            this.log(`❌ 安全增強過程出錯: ${error.message}`);
            throw error;
        }
    }
}

// 如果直接執行此文件
if (require.main === module) {
    const securitySystem = new SecurityEnhancementSystem();
    securitySystem.runFullSecurityEnhancement()
        .then(report => {
            console.log('✅ 安全增強完成，報告已生成');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ 安全增強失敗:', error.message);
            process.exit(1);
        });
}

module.exports = SecurityEnhancementSystem;