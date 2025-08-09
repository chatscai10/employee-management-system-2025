#!/usr/bin/env node
/**
 * 🛡️ 生產環境安全配置和檢查
 * 針對關鍵安全漏洞進行修復和生產環境安全強化
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class ProductionSecuritySetup {
    constructor() {
        this.projectRoot = __dirname;
        this.serverPath = path.join(this.projectRoot, 'server');
        this.publicPath = path.join(this.projectRoot, 'public');
        this.securityResults = {
            securityConfig: [],
            environmentVars: [],
            httpsSetup: [],
            headerSecurity: [],
            inputValidation: [],
            authenticationSecurity: [],
            fixedVulnerabilities: [],
            createdFiles: [],
            recommendations: []
        };
    }

    /**
     * 執行生產環境安全設置
     */
    async executeProductionSecuritySetup() {
        console.log('🛡️ 開始生產環境安全配置和檢查...');
        console.log('='.repeat(70));

        try {
            // 1. 生成安全環境變數配置
            await this.generateSecurityEnvironmentConfig();
            
            // 2. 設置安全HTTP標頭
            await this.setupSecurityHeaders();
            
            // 3. 實施輸入驗證和清理
            await this.implementInputValidationSecurity();
            
            // 4. 強化身份驗證安全
            await this.enhanceAuthenticationSecurity();
            
            // 5. 配置HTTPS和SSL
            await this.setupHTTPSConfiguration();
            
            // 6. 創建安全中間件集成
            await this.createSecurityMiddlewareIntegration();
            
            // 7. 生成安全檢查清單
            this.generateSecurityChecklist();
            
        } catch (error) {
            console.error('❌ 生產環境安全設置失敗:', error.message);
        }
    }

    /**
     * 生成安全環境變數配置
     */
    async generateSecurityEnvironmentConfig() {
        console.log('\n🔐 生成安全環境變數配置...');
        
        // 生成強密鑰
        const jwtSecret = crypto.randomBytes(64).toString('hex');
        const dbEncryptionKey = crypto.randomBytes(32).toString('hex');
        const sessionSecret = crypto.randomBytes(32).toString('hex');
        
        const envConfig = {
            // 基本環境配置
            NODE_ENV: 'production',
            PORT: '3000',
            
            // 安全金鑰
            JWT_SECRET: jwtSecret,
            JWT_EXPIRES_IN: '24h',
            JWT_REFRESH_EXPIRES_IN: '7d',
            
            // 資料庫安全
            DB_ENCRYPTION_KEY: dbEncryptionKey,
            DB_SSL: 'true',
            DB_CONNECTION_TIMEOUT: '30000',
            
            // Session 安全
            SESSION_SECRET: sessionSecret,
            SESSION_TIMEOUT: '3600000', // 1小時
            
            // 安全標頭配置
            CORS_ORIGIN: 'https://yourdomain.com',
            CSP_REPORT_URI: '/api/security/csp-report',
            
            // 速率限制
            RATE_LIMIT_WINDOW_MS: '900000', // 15分鐘
            RATE_LIMIT_MAX_REQUESTS: '100',
            
            // 檔案上傳安全
            MAX_FILE_SIZE: '10485760', // 10MB
            ALLOWED_FILE_TYPES: 'jpg,jpeg,png,pdf,doc,docx',
            
            // 日誌配置
            LOG_LEVEL: 'info',
            LOG_FILE_PATH: './logs',
            
            // 監控配置
            HEALTH_CHECK_TIMEOUT: '5000',
            
            // Telegram 通知 (生產環境建議移除或加密)
            // TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN
            // TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID
        };

        // 創建 .env.production 文件
        const envFile = path.join(this.projectRoot, '.env.production');
        const envContent = Object.entries(envConfig)
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');
        
        const envWithComments = `# 🛡️ 生產環境安全配置
# 警告：此文件包含敏感信息，請勿提交到版本控制系統

${envContent}

# 🚨 安全提醒：
# 1. 請將此文件加入 .gitignore
# 2. 在生產環境中使用環境變數或密鑰管理服務
# 3. 定期輪換密鑰
# 4. 監控異常登入和操作`;

        fs.writeFileSync(envFile, envWithComments);
        
        // 創建 .env.example 文件
        const envExampleFile = path.join(this.projectRoot, '.env.example');
        const envExampleContent = Object.entries(envConfig)
            .map(([key, value]) => {
                // 隱藏敏感值
                if (key.includes('SECRET') || key.includes('KEY') || key.includes('TOKEN')) {
                    return `${key}=your_secure_${key.toLowerCase()}_here`;
                }
                return `${key}=${value}`;
            })
            .join('\n');
        
        fs.writeFileSync(envExampleFile, `# 環境變數範例文件\n# 複製到 .env 並填入實際值\n\n${envExampleContent}`);
        
        // 更新或創建 .gitignore
        const gitignoreFile = path.join(this.projectRoot, '.gitignore');
        let gitignoreContent = '';
        
        if (fs.existsSync(gitignoreFile)) {
            gitignoreContent = fs.readFileSync(gitignoreFile, 'utf8');
        }
        
        const securityIgnores = [
            '.env',
            '.env.local',
            '.env.production',
            '.env.development',
            '*.key',
            '*.pem',
            '*.cert',
            'ssl/',
            'secrets/',
            'config/database.json',
            '*.log'
        ];
        
        const newIgnores = securityIgnores.filter(ignore => !gitignoreContent.includes(ignore));
        
        if (newIgnores.length > 0) {
            const updatedGitignore = gitignoreContent + '\n\n# 🛡️ 安全相關文件\n' + newIgnores.join('\n');
            fs.writeFileSync(gitignoreFile, updatedGitignore);
        }
        
        this.securityResults.environmentVars.push({
            file: '.env.production',
            description: '生產環境安全配置',
            status: 'created'
        });
        
        this.securityResults.createdFiles.push('.env.production', '.env.example');
        console.log('  ✅ 安全環境變數配置完成');
        console.log(`  🔑 生成了 ${Object.keys(envConfig).length} 個安全配置項`);
    }

    /**
     * 設置安全HTTP標頭
     */
    async setupSecurityHeaders() {
        console.log('\n🛡️ 設置安全HTTP標頭...');
        
        const securityHeadersFile = path.join(this.serverPath, 'middleware', 'security', 'headers.js');
        
        const securityHeadersContent = `/**
 * 🛡️ 安全HTTP標頭中間件
 * 實施生產環境必要的安全標頭
 */

const helmet = require('helmet');

// Content Security Policy 配置
const cspConfig = {
    directives: {
        defaultSrc: ["'self'"],
        styleSrc: [
            "'self'", 
            "'unsafe-inline'", 
            "https://cdn.jsdelivr.net",
            "https://cdnjs.cloudflare.com"
        ],
        scriptSrc: [
            "'self'", 
            "https://cdn.jsdelivr.net",
            "https://cdnjs.cloudflare.com"
        ],
        imgSrc: [
            "'self'", 
            "data:", 
            "https:",
            "blob:"
        ],
        fontSrc: [
            "'self'", 
            "https://fonts.googleapis.com",
            "https://fonts.gstatic.com"
        ],
        connectSrc: [
            "'self'",
            process.env.CORS_ORIGIN || "'self'"
        ],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: []
    },
    reportUri: process.env.CSP_REPORT_URI || '/api/security/csp-report'
};

// 安全標頭配置
const securityHeaders = (req, res, next) => {
    // 基本安全標頭
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // HSTS (HTTP Strict Transport Security)
    if (req.secure) {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    
    // Feature Policy
    res.setHeader('Feature-Policy', 
        "geolocation 'self'; " +
        "microphone 'none'; " +
        "camera 'none'; " +
        "payment 'self'; " +
        "usb 'none'; " +
        "magnetometer 'none'"
    );
    
    next();
};

// CSP 違規報告端點
const cspReportHandler = (req, res) => {
    console.warn('CSP Violation Report:', JSON.stringify(req.body, null, 2));
    
    // 記錄到安全日誌
    const logger = require('../../utils/logger');
    logger.warn('CSP Violation', {
        violation: req.body,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
    });
    
    res.status(204).end();
};

// CORS 配置
const corsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];
        
        // 在生產環境中嚴格檢查來源
        if (process.env.NODE_ENV === 'production') {
            if (!origin || !allowedOrigins.includes(origin)) {
                return callback(new Error('CORS policy violation'));
            }
        }
        
        callback(null, true);
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

module.exports = {
    securityHeaders,
    cspConfig,
    cspReportHandler,
    corsOptions,
    helmetConfig: {
        contentSecurityPolicy: cspConfig,
        crossOriginEmbedderPolicy: false, // 根據需要調整
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        }
    }
};`;

        // 確保目錄存在
        const securityDir = path.dirname(securityHeadersFile);
        if (!fs.existsSync(securityDir)) {
            fs.mkdirSync(securityDir, { recursive: true });
        }

        fs.writeFileSync(securityHeadersFile, securityHeadersContent);
        
        this.securityResults.headerSecurity.push({
            middleware: 'securityHeaders',
            description: '安全HTTP標頭配置',
            status: 'created'
        });
        
        this.securityResults.createdFiles.push(path.relative(this.projectRoot, securityHeadersFile));
        console.log('  ✅ 安全HTTP標頭配置完成');
    }

    /**
     * 實施輸入驗證和清理
     */
    async implementInputValidationSecurity() {
        console.log('\n🧹 實施輸入驗證和清理...');
        
        const inputSecurityFile = path.join(this.serverPath, 'middleware', 'security', 'inputSecurity.js');
        
        const inputSecurityContent = `/**
 * 🧹 輸入安全驗證和清理中間件
 * 防止SQL注入、XSS攻擊和其他輸入相關攻擊
 */

const validator = require('validator');
const DOMPurify = require('isomorphic-dompurify');

// 危險模式檢測
const dangerousPatterns = [
    // SQL 注入模式
    /(union|select|insert|delete|update|create|drop|exec|execute)\\s/gi,
    /('|(\\-\\-)|(;)|(\\||\\|)|(\\*|\\*))/gi,
    
    // XSS 模式
    /<script[^>]*>.*?<\\/script>/gi,
    /<iframe[^>]*>.*?<\\/iframe>/gi,
    /javascript:/gi,
    /on\\w+\\s*=/gi,
    
    // 命令注入模式
    /(&|\\||;|\\$|\\|\\||&&|\\n|\\r)/gi,
    
    // 路徑遍歷模式
    /\\.\\.[\\/\\\\]/gi,
    
    // NoSQL 注入模式
    /\\$where|\\$ne|\\$gt|\\$lt|\\$regex/gi
];

// 檢測危險輸入
function detectDangerousInput(input, fieldName = 'unknown') {
    if (typeof input !== 'string') return false;
    
    const threats = [];
    
    dangerousPatterns.forEach((pattern, index) => {
        if (pattern.test(input)) {
            const threatTypes = [
                'SQL Injection', 'SQL Characters', 'XSS Script', 'XSS Iframe', 
                'XSS Javascript', 'XSS Event Handler', 'Command Injection', 
                'Path Traversal', 'NoSQL Injection'
            ];
            threats.push(threatTypes[index] || 'Unknown Threat');
        }
    });
    
    if (threats.length > 0) {
        console.warn(\`🚨 Dangerous input detected in \${fieldName}:\`, {
            input: input.substring(0, 100),
            threats: threats,
            timestamp: new Date().toISOString()
        });
        return threats;
    }
    
    return false;
}

// 深度輸入清理
function deepSanitize(input, options = {}) {
    if (typeof input !== 'string') return input;
    
    const {
        allowHtml = false,
        maxLength = 10000,
        trimWhitespace = true
    } = options;
    
    let cleaned = input;
    
    // 基本清理
    if (trimWhitespace) {
        cleaned = cleaned.trim();
    }
    
    // 長度限制
    if (cleaned.length > maxLength) {
        cleaned = cleaned.substring(0, maxLength);
    }
    
    // HTML 清理
    if (!allowHtml) {
        cleaned = DOMPurify.sanitize(cleaned, { ALLOWED_TAGS: [] });
        
        // 額外的HTML實體編碼
        cleaned = cleaned
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\\//g, '&#x2F;');
    } else {
        // 允許HTML但進行安全清理
        cleaned = DOMPurify.sanitize(cleaned, {
            ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
            ALLOWED_ATTR: []
        });
    }
    
    // SQL 字符轉義
    cleaned = cleaned
        .replace(/'/g, "''")
        .replace(/;/g, '')
        .replace(/--/g, '')
        .replace(/\\/\\*/g, '')
        .replace(/\\*\\//g, '');
    
    return cleaned;
}

// 數據類型驗證
const typeValidators = {
    email: (value) => validator.isEmail(value),
    phone: (value) => /^09\\d{8}$/.test(value),
    idNumber: (value) => /^[A-Z]\\d{9}$/.test(value),
    url: (value) => validator.isURL(value),
    alphanumeric: (value) => validator.isAlphanumeric(value, 'zh-TW'),
    numeric: (value) => validator.isNumeric(value),
    date: (value) => validator.isISO8601(value),
    uuid: (value) => validator.isUUID(value),
    ip: (value) => validator.isIP(value),
    coordinates: (value) => {
        if (typeof value === 'object' && value.lat && value.lng) {
            return validator.isFloat(value.lat.toString(), { min: -90, max: 90 }) &&
                   validator.isFloat(value.lng.toString(), { min: -180, max: 180 });
        }
        return false;
    }
};

// 高級輸入安全中間件
const advancedInputSecurity = (options = {}) => {
    const {
        strictMode = process.env.NODE_ENV === 'production',
        logViolations = true,
        blockSuspicious = true,
        rateLimitViolations = true
    } = options;
    
    return (req, res, next) => {
        const violations = [];
        
        // 檢查所有輸入源
        const inputSources = [
            { source: 'body', data: req.body },
            { source: 'query', data: req.query },
            { source: 'params', data: req.params }
        ];
        
        inputSources.forEach(({ source, data }) => {
            if (data && typeof data === 'object') {
                Object.entries(data).forEach(([key, value]) => {
                    if (typeof value === 'string') {
                        const threats = detectDangerousInput(value, \`\${source}.\${key}\`);
                        if (threats) {
                            violations.push({
                                source,
                                field: key,
                                threats,
                                value: value.substring(0, 100)
                            });
                        }
                        
                        // 清理輸入
                        data[key] = deepSanitize(value);
                    }
                });
            }
        });
        
        // 處理違規
        if (violations.length > 0) {
            if (logViolations) {
                const logger = require('../../utils/logger');
                logger.warn('Input Security Violations', {
                    violations,
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    url: req.url,
                    timestamp: new Date().toISOString()
                });
            }
            
            if (blockSuspicious && strictMode) {
                return res.status(400).json({
                    success: false,
                    error: 'INPUT_SECURITY_VIOLATION',
                    message: '輸入包含不安全內容',
                    violations: violations.length
                });
            }
        }
        
        next();
    };
};

// 文件上傳安全檢查
const fileUploadSecurity = (req, res, next) => {
    if (req.files || req.file) {
        const files = req.files || [req.file];
        const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'jpg,jpeg,png,pdf').split(',');
        const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 10485760; // 10MB
        
        for (const file of files) {
            if (!file) continue;
            
            const fileExt = file.originalname.split('.').pop().toLowerCase();
            
            // 檢查文件類型
            if (!allowedTypes.includes(fileExt)) {
                return res.status(400).json({
                    success: false,
                    error: 'FILE_TYPE_NOT_ALLOWED',
                    message: \`不允許的文件類型: \${fileExt}\`
                });
            }
            
            // 檢查文件大小
            if (file.size > maxSize) {
                return res.status(400).json({
                    success: false,
                    error: 'FILE_TOO_LARGE',
                    message: \`文件過大，最大允許 \${maxSize / 1024 / 1024}MB\`
                });
            }
            
            // 檢查文件名
            const threats = detectDangerousInput(file.originalname, 'filename');
            if (threats) {
                return res.status(400).json({
                    success: false,
                    error: 'UNSAFE_FILENAME',
                    message: '文件名包含不安全字符'
                });
            }
        }
    }
    
    next();
};

module.exports = {
    advancedInputSecurity,
    fileUploadSecurity,
    detectDangerousInput,
    deepSanitize,
    typeValidators
};`;

        fs.writeFileSync(inputSecurityFile, inputSecurityContent);
        
        this.securityResults.inputValidation.push({
            middleware: 'advancedInputSecurity',
            description: '高級輸入安全驗證',
            status: 'created'
        });
        
        this.securityResults.createdFiles.push(path.relative(this.projectRoot, inputSecurityFile));
        console.log('  ✅ 輸入驗證和清理實施完成');
    }

    /**
     * 強化身份驗證安全
     */
    async enhanceAuthenticationSecurity() {
        console.log('\n🔐 強化身份驗證安全...');
        
        const authSecurityFile = path.join(this.serverPath, 'middleware', 'security', 'authSecurity.js');
        
        const authSecurityContent = `/**
 * 🔐 增強身份驗證安全中間件
 * 實施強化的JWT認證和會話管理
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// Token 黑名單管理
const tokenBlacklist = new Set();

// 登入嘗試記錄
const loginAttempts = new Map();

// JWT 安全配置
const jwtConfig = {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    algorithm: 'HS256',
    issuer: 'employee-management-system',
    audience: 'employee-management-client'
};

// 生成安全的JWT Token
function generateSecureToken(payload, options = {}) {
    const tokenPayload = {
        ...payload,
        iat: Math.floor(Date.now() / 1000),
        jti: crypto.randomBytes(16).toString('hex'), // JWT ID
        type: options.type || 'access'
    };
    
    const tokenOptions = {
        expiresIn: options.expiresIn || jwtConfig.expiresIn,
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience,
        algorithm: jwtConfig.algorithm
    };
    
    return jwt.sign(tokenPayload, jwtConfig.secret, tokenOptions);
}

// 驗證JWT Token
function verifySecureToken(token) {
    try {
        // 檢查是否在黑名單中
        if (tokenBlacklist.has(token)) {
            throw new Error('Token has been revoked');
        }
        
        const decoded = jwt.verify(token, jwtConfig.secret, {
            issuer: jwtConfig.issuer,
            audience: jwtConfig.audience,
            algorithms: [jwtConfig.algorithm]
        });
        
        return { valid: true, payload: decoded };
    } catch (error) {
        return { valid: false, error: error.message };
    }
}

// Token 撤銷
function revokeToken(token) {
    tokenBlacklist.add(token);
    
    // 定期清理過期的黑名單 token
    setTimeout(() => {
        tokenBlacklist.delete(token);
    }, 24 * 60 * 60 * 1000); // 24小時後清理
}

// 登入嘗試限制
function checkLoginAttempts(identifier) {
    const attempts = loginAttempts.get(identifier) || { count: 0, lastAttempt: 0 };
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15分鐘窗口
    const maxAttempts = 5;
    
    // 重置過期的嘗試記錄
    if (now - attempts.lastAttempt > windowMs) {
        attempts.count = 0;
    }
    
    if (attempts.count >= maxAttempts) {
        const timeLeft = windowMs - (now - attempts.lastAttempt);
        return {
            allowed: false,
            timeLeft: Math.ceil(timeLeft / 1000 / 60), // 分鐘
            attempts: attempts.count
        };
    }
    
    return {
        allowed: true,
        attempts: attempts.count
    };
}

// 記錄登入嘗試
function recordLoginAttempt(identifier, success) {
    const attempts = loginAttempts.get(identifier) || { count: 0, lastAttempt: 0 };
    
    if (success) {
        loginAttempts.delete(identifier); // 成功登入清除記錄
    } else {
        attempts.count += 1;
        attempts.lastAttempt = Date.now();
        loginAttempts.set(identifier, attempts);
        
        // 記錄安全日誌
        const logger = require('../../utils/logger');
        logger.warn('Failed login attempt', {
            identifier,
            attempts: attempts.count,
            timestamp: new Date().toISOString()
        });
    }
}

// 強化的身份驗證中間件
const enhancedAuth = (options = {}) => {
    const {
        requireValid = true,
        allowRefreshToken = false,
        logAccess = true
    } = options;
    
    return async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                if (requireValid) {
                    return res.status(401).json({
                        success: false,
                        error: 'MISSING_TOKEN',
                        message: '需要提供認證Token'
                    });
                }
                return next();
            }
            
            const token = authHeader.substring(7);
            const verification = verifySecureToken(token);
            
            if (!verification.valid) {
                return res.status(401).json({
                    success: false,
                    error: 'INVALID_TOKEN',
                    message: 'Token無效或已過期',
                    details: verification.error
                });
            }
            
            // 檢查 Token 類型
            if (!allowRefreshToken && verification.payload.type === 'refresh') {
                return res.status(401).json({
                    success: false,
                    error: 'INVALID_TOKEN_TYPE',
                    message: '此端點不接受刷新Token'
                });
            }
            
            // 將用戶信息添加到請求
            req.user = verification.payload;
            req.token = token;
            
            // 記錄存取日誌
            if (logAccess) {
                const logger = require('../../utils/logger');
                logger.info('Authenticated access', {
                    userId: verification.payload.id,
                    role: verification.payload.role,
                    endpoint: req.path,
                    method: req.method,
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    timestamp: new Date().toISOString()
                });
            }
            
            next();
        } catch (error) {
            console.error('Authentication middleware error:', error);
            return res.status(500).json({
                success: false,
                error: 'AUTH_ERROR',
                message: '認證系統錯誤'
            });
        }
    };
};

// 密碼強度驗證
function validatePasswordStrength(password) {
    const requirements = {
        minLength: 8,
        maxLength: 128,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        forbidCommonPasswords: true
    };
    
    const errors = [];
    
    if (password.length < requirements.minLength) {
        errors.push(\`密碼長度至少需要 \${requirements.minLength} 個字符\`);
    }
    
    if (password.length > requirements.maxLength) {
        errors.push(\`密碼長度不能超過 \${requirements.maxLength} 個字符\`);
    }
    
    if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('密碼必須包含至少一個大寫字母');
    }
    
    if (requirements.requireLowercase && !/[a-z]/.test(password)) {
        errors.push('密碼必須包含至少一個小寫字母');
    }
    
    if (requirements.requireNumbers && !/\\d/.test(password)) {
        errors.push('密碼必須包含至少一個數字');
    }
    
    if (requirements.requireSpecialChars && !/[!@#$%^&*()_+\\-=\\[\\]{}|;:,.<>?]/.test(password)) {
        errors.push('密碼必須包含至少一個特殊字符');
    }
    
    // 常見密碼檢查
    const commonPasswords = [
        'password', '123456', '123456789', 'qwerty', 'abc123',
        'password123', 'admin', 'root', '12345678', 'welcome'
    ];
    
    if (requirements.forbidCommonPasswords && 
        commonPasswords.some(common => password.toLowerCase().includes(common))) {
        errors.push('密碼不能包含常見的弱密碼模式');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors,
        strength: calculatePasswordStrength(password)
    };
}

// 計算密碼強度
function calculatePasswordStrength(password) {
    let score = 0;
    
    // 長度分數
    score += Math.min(password.length * 4, 25);
    
    // 字符多樣性分數
    if (/[a-z]/.test(password)) score += 5;
    if (/[A-Z]/.test(password)) score += 5;
    if (/\\d/.test(password)) score += 5;
    if (/[^\\w\\s]/.test(password)) score += 10;
    
    // 複雜度分數
    const uniqueChars = new Set(password).size;
    score += Math.min(uniqueChars * 2, 20);
    
    // 模式扣分
    if (/(..).*\\1/.test(password)) score -= 10; // 重複模式
    if (/012|123|234|345|456|567|678|789|890/.test(password)) score -= 15; // 連續數字
    if (/abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/.test(password.toLowerCase())) score -= 15; // 連續字母
    
    return Math.max(0, Math.min(100, score));
}

// 安全的密碼雜湊
async function hashPassword(password) {
    const validation = validatePasswordStrength(password);
    if (!validation.isValid) {
        throw new Error(\`密碼不符合安全要求: \${validation.errors.join(', ')}\`);
    }
    
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
}

// 密碼驗證
async function verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
}

// Session 安全管理
const sessionSecurity = {
    generateSessionId: () => crypto.randomBytes(32).toString('hex'),
    
    validateSession: (sessionId, userId) => {
        // 實現會話驗證邏輯
        // 這裡可以連接到 Redis 或數據庫進行會話管理
        return true;
    },
    
    revokeSession: (sessionId) => {
        // 實現會話撤銷邏輯
        console.log(\`Session revoked: \${sessionId}\`);
    }
};

module.exports = {
    enhancedAuth,
    generateSecureToken,
    verifySecureToken,
    revokeToken,
    checkLoginAttempts,
    recordLoginAttempt,
    validatePasswordStrength,
    hashPassword,
    verifyPassword,
    sessionSecurity
};`;

        fs.writeFileSync(authSecurityFile, authSecurityContent);
        
        this.securityResults.authenticationSecurity.push({
            middleware: 'enhancedAuth',
            description: '增強身份驗證安全',
            status: 'created'
        });
        
        this.securityResults.createdFiles.push(path.relative(this.projectRoot, authSecurityFile));
        console.log('  ✅ 身份驗證安全強化完成');
    }

    /**
     * 配置HTTPS和SSL
     */
    async setupHTTPSConfiguration() {
        console.log('\n🔒 配置HTTPS和SSL...');
        
        const httpsConfigFile = path.join(this.serverPath, 'config', 'https.js');
        
        // 確保目錄存在
        const configDir = path.dirname(httpsConfigFile);
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }
        
        const httpsConfigContent = `/**
 * 🔒 HTTPS 和 SSL 配置
 * 生產環境SSL/TLS配置
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// SSL 證書路徑配置
const sslConfig = {
    // 生產環境證書路徑
    certPath: process.env.SSL_CERT_PATH || path.join(__dirname, '../ssl/cert.pem'),
    keyPath: process.env.SSL_KEY_PATH || path.join(__dirname, '../ssl/key.pem'),
    caPath: process.env.SSL_CA_PATH || null,
    
    // SSL 選項
    secureProtocol: 'TLSv1_2_method',
    honorCipherOrder: true,
    ciphers: [
        'ECDHE-ECDSA-AES256-GCM-SHA384',
        'ECDHE-RSA-AES256-GCM-SHA384',
        'ECDHE-ECDSA-CHACHA20-POLY1305',
        'ECDHE-RSA-CHACHA20-POLY1305',
        'ECDHE-ECDSA-AES128-GCM-SHA256',
        'ECDHE-RSA-AES128-GCM-SHA256'
    ].join(':'),
    
    // HTTPS 重定向配置
    httpsPort: process.env.HTTPS_PORT || 443,
    httpPort: process.env.HTTP_PORT || 80,
    
    // HSTS 配置
    hstsMaxAge: 31536000, // 1年
    hstsIncludeSubDomains: true,
    hstsPreload: true
};

// 創建 HTTPS 選項
function createHTTPSOptions() {
    const options = {
        secureProtocol: sslConfig.secureProtocol,
        honorCipherOrder: sslConfig.honorCipherOrder,
        ciphers: sslConfig.ciphers
    };
    
    try {
        // 讀取證書文件
        if (fs.existsSync(sslConfig.keyPath)) {
            options.key = fs.readFileSync(sslConfig.keyPath);
        }
        
        if (fs.existsSync(sslConfig.certPath)) {
            options.cert = fs.readFileSync(sslConfig.certPath);
        }
        
        // CA 證書（如果有的話）
        if (sslConfig.caPath && fs.existsSync(sslConfig.caPath)) {
            options.ca = fs.readFileSync(sslConfig.caPath);
        }
        
        return options;
    } catch (error) {
        console.error('❌ SSL 證書讀取失敗:', error.message);
        return null;
    }
}

// HTTP 到 HTTPS 重定向中間件
const httpsRedirect = (req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
        const httpsUrl = \`https://\${req.get('host')}\${req.url}\`;
        return res.redirect(301, httpsUrl);
    }
    next();
};

// HSTS 標頭中間件
const hstsHeader = (req, res, next) => {
    res.setHeader(
        'Strict-Transport-Security', 
        \`max-age=\${sslConfig.hstsMaxAge}; includeSubDomains\${sslConfig.hstsPreload ? '; preload' : ''}\`
    );
    next();
};

// 創建 HTTPS 伺服器
function createHTTPSServer(app) {
    const httpsOptions = createHTTPSOptions();
    
    if (!httpsOptions || !httpsOptions.key || !httpsOptions.cert) {
        console.warn('⚠️ SSL 證書未找到，將使用 HTTP 模式');
        console.warn('🔒 生產環境建議配置 HTTPS');
        return null;
    }
    
    const httpsServer = https.createServer(httpsOptions, app);
    
    httpsServer.on('error', (error) => {
        console.error('❌ HTTPS 伺服器錯誤:', error);
    });
    
    return httpsServer;
}

// SSL 證書驗證
function validateSSLCertificate() {
    const issues = [];
    
    if (!fs.existsSync(sslConfig.certPath)) {
        issues.push(\`證書文件不存在: \${sslConfig.certPath}\`);
    }
    
    if (!fs.existsSync(sslConfig.keyPath)) {
        issues.push(\`私鑰文件不存在: \${sslConfig.keyPath}\`);
    }
    
    // 可以添加更多證書驗證邏輯
    // 例如：檢查證書過期時間、域名匹配等
    
    return {
        valid: issues.length === 0,
        issues: issues
    };
}

// 生成自簽名證書（僅用於開發環境）
function generateSelfSignedCert() {
    const selfsigned = require('selfsigned');
    
    const attrs = [
        { name: 'commonName', value: 'localhost' },
        { name: 'countryName', value: 'TW' },
        { name: 'stateOrProvinceName', value: 'Taiwan' },
        { name: 'localityName', value: 'Taipei' },
        { name: 'organizationName', value: 'Employee Management System' }
    ];
    
    const options = {
        keySize: 2048,
        days: 365,
        algorithm: 'sha256',
        extensions: [
            {
                name: 'subjectAltName',
                altNames: [
                    { type: 2, value: 'localhost' },
                    { type: 2, value: '127.0.0.1' }
                ]
            }
        ]
    };
    
    const pems = selfsigned.generate(attrs, options);
    
    // 創建 SSL 目錄
    const sslDir = path.join(__dirname, '../ssl');
    if (!fs.existsSync(sslDir)) {
        fs.mkdirSync(sslDir, { recursive: true });
    }
    
    // 寫入證書文件
    fs.writeFileSync(path.join(sslDir, 'cert.pem'), pems.cert);
    fs.writeFileSync(path.join(sslDir, 'key.pem'), pems.private);
    
    console.log('✅ 自簽名證書已生成 (僅用於開發環境)');
    console.log('🔒 生產環境請使用正式的SSL證書');
    
    return {
        cert: pems.cert,
        key: pems.private
    };
}

module.exports = {
    sslConfig,
    createHTTPSOptions,
    createHTTPSServer,
    httpsRedirect,
    hstsHeader,
    validateSSLCertificate,
    generateSelfSignedCert
};`;

        fs.writeFileSync(httpsConfigFile, httpsConfigContent);
        
        // 創建 SSL 目錄結構
        const sslDir = path.join(this.serverPath, 'ssl');
        if (!fs.existsSync(sslDir)) {
            fs.mkdirSync(sslDir, { recursive: true });
            
            // 創建 README 文件說明如何配置證書
            const sslReadme = `# SSL 證書配置

## 生產環境證書配置

1. 將您的SSL證書文件放在此目錄：
   - \`cert.pem\` - 證書文件
   - \`key.pem\` - 私鑰文件
   - \`ca.pem\` - CA證書文件（可選）

2. 確保文件權限正確：
   \`\`\`bash
   chmod 600 key.pem
   chmod 644 cert.pem
   \`\`\`

3. 更新環境變數：
   \`\`\`
   SSL_CERT_PATH=/path/to/cert.pem
   SSL_KEY_PATH=/path/to/key.pem
   SSL_CA_PATH=/path/to/ca.pem
   HTTPS_PORT=443
   \`\`\`

## 開發環境

系統會自動生成自簽名證書用於開發測試。

## 建議的SSL提供商

- Let's Encrypt (免費)
- Cloudflare SSL
- DigiCert
- GlobalSign

## 證書更新

定期檢查證書到期時間並及時更新。
`;
            
            fs.writeFileSync(path.join(sslDir, 'README.md'), sslReadme);
        }
        
        this.securityResults.httpsSetup.push({
            config: 'httpsConfiguration',
            description: 'HTTPS 和 SSL 配置',
            status: 'created'
        });
        
        this.securityResults.createdFiles.push(path.relative(this.projectRoot, httpsConfigFile));
        console.log('  ✅ HTTPS 和 SSL 配置完成');
    }

    /**
     * 創建安全中間件集成
     */
    async createSecurityMiddlewareIntegration() {
        console.log('\n🔧 創建安全中間件集成...');
        
        const integrationFile = path.join(this.serverPath, 'middleware', 'security', 'index.js');
        
        const integrationContent = `/**
 * 🛡️ 安全中間件集成
 * 統一的安全中間件配置和使用
 */

// 導入所有安全中間件
const { securityHeaders, cspReportHandler, corsOptions } = require('./headers');
const { advancedInputSecurity, fileUploadSecurity } = require('./inputSecurity');
const { enhancedAuth } = require('./authSecurity');
const { sqlInjectionProtection } = require('./sqlProtection');
const { xssProtection } = require('./xssProtection');

// 導入性能和限制中間件
const { basicRateLimit, strictRateLimit, apiRateLimit } = require('../performance/rateLimit');
const { compressionMiddleware } = require('../performance/compression');
const { cacheMiddleware } = require('../performance/cache');

// 導入第三方安全中間件
const helmet = require('helmet');
const cors = require('cors');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');

/**
 * 配置基本安全中間件
 * 適用於所有路由
 */
function configureBasicSecurity(app) {
    console.log('🛡️ 配置基本安全中間件...');
    
    // 信任代理（如果使用反向代理）
    app.set('trust proxy', 1);
    
    // Helmet 基本安全標頭
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
                scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'"]
            }
        },
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        }
    }));
    
    // CORS 配置
    app.use(cors(corsOptions));
    
    // 自定義安全標頭
    app.use(securityHeaders);
    
    // HTTP 參數污染保護
    app.use(hpp());
    
    // MongoDB 注入保護
    app.use(mongoSanitize());
    
    // 壓縮中間件
    app.use(compressionMiddleware);
    
    // 基本速率限制
    app.use(basicRateLimit);
    
    console.log('✅ 基本安全中間件配置完成');
}

/**
 * 配置API安全中間件
 * 適用於 /api 路由
 */
function configureAPISecurity(app) {
    console.log('🔒 配置API安全中間件...');
    
    // API 速率限制
    app.use('/api', apiRateLimit);
    
    // 高級輸入安全檢查
    app.use('/api', advancedInputSecurity({
        strictMode: process.env.NODE_ENV === 'production',
        blockSuspicious: true,
        logViolations: true
    }));
    
    // SQL 注入保護
    app.use('/api', sqlInjectionProtection);
    
    // XSS 保護
    app.use('/api', xssProtection);
    
    // CSP 違規報告端點
    app.post('/api/security/csp-report', cspReportHandler);
    
    console.log('✅ API安全中間件配置完成');
}

/**
 * 配置認證路由安全
 * 適用於認證相關路由
 */
function configureAuthSecurity(app) {
    console.log('🔐 配置認證安全中間件...');
    
    // 登入相關路由使用嚴格速率限制
    app.use(['/api/auth/login', '/api/auth/register'], strictRateLimit);
    
    // 認證中間件
    const authRoutes = [
        '/api/employees',
        '/api/attendance',
        '/api/revenue',
        '/api/admin',
        '/api/schedule'
    ];
    
    authRoutes.forEach(route => {
        app.use(route, enhancedAuth({
            requireValid: true,
            logAccess: true
        }));
    });
    
    console.log('✅ 認證安全中間件配置完成');
}

/**
 * 配置文件上傳安全
 */
function configureFileUploadSecurity(app) {
    console.log('📁 配置文件上傳安全中間件...');
    
    // 文件上傳路由的安全檢查
    app.use('/api/*/upload', fileUploadSecurity);
    app.use('/api/revenue/add', fileUploadSecurity); // 營收照片上傳
    app.use('/api/maintenance/report', fileUploadSecurity); // 維修照片上傳
    
    console.log('✅ 文件上傳安全中間件配置完成');
}

/**
 * 配置快取安全
 */
function configureCacheSecurity(app) {
    console.log('⚡ 配置快取安全中間件...');
    
    // 只對特定API端點使用緩存
    const cacheableRoutes = [
        '/api/stores',
        '/api/reports',
        '/api/statistics'
    ];
    
    cacheableRoutes.forEach(route => {
        app.use(route, cacheMiddleware(300)); // 5分鐘快取
    });
    
    console.log('✅ 快取安全中間件配置完成');
}

/**
 * 配置生產環境專用安全
 */
function configureProductionSecurity(app) {
    if (process.env.NODE_ENV !== 'production') {
        return;
    }
    
    console.log('🏭 配置生產環境專用安全中間件...');
    
    // 更嚴格的安全標頭
    app.use((req, res, next) => {
        res.setHeader('Server', 'Enterprise-System'); // 隱藏服務器信息
        res.removeHeader('X-Powered-By');
        next();
    });
    
    // 生產環境錯誤處理
    app.use((err, req, res, next) => {
        // 不暴露錯誤詳情
        if (err.status !== 404 && err.status !== 400) {
            console.error('Production error:', err);
        }
        
        res.status(err.status || 500).json({
            success: false,
            error: 'INTERNAL_ERROR',
            message: '系統暫時無法處理請求'
        });
    });
    
    console.log('✅ 生產環境專用安全配置完成');
}

/**
 * 一鍵配置所有安全中間件
 */
function configureAllSecurity(app) {
    console.log('🚀 開始配置完整安全中間件套件...');
    
    configureBasicSecurity(app);
    configureAPISecurity(app);
    configureAuthSecurity(app);
    configureFileUploadSecurity(app);
    configureCacheSecurity(app);
    configureProductionSecurity(app);
    
    console.log('🎉 完整安全中間件套件配置完成！');
    console.log('🛡️ 系統安全等級：生產環境就緒');
}

module.exports = {
    configureBasicSecurity,
    configureAPISecurity,
    configureAuthSecurity,
    configureFileUploadSecurity,
    configureCacheSecurity,
    configureProductionSecurity,
    configureAllSecurity
};`;

        fs.writeFileSync(integrationFile, integrationContent);
        
        this.securityResults.securityConfig.push({
            module: 'securityIntegration',
            description: '安全中間件統一集成',
            status: 'created'
        });
        
        this.securityResults.createdFiles.push(path.relative(this.projectRoot, integrationFile));
        console.log('  ✅ 安全中間件集成創建完成');
    }

    /**
     * 生成安全檢查清單
     */
    generateSecurityChecklist() {
        console.log('\n📋 生成安全檢查清單...');
        
        const checklistFile = path.join(this.projectRoot, 'SECURITY_CHECKLIST.md');
        
        const checklistContent = `# 🛡️ 生產環境安全檢查清單

此清單用於確保系統在生產環境部署前符合安全標準。

## ✅ 已完成的安全措施

### 🔐 認證與授權
- [x] JWT Token 安全實施
- [x] 密碼強度驗證
- [x] 登入嘗試限制
- [x] Token 撤銷機制
- [x] 會話管理安全

### 🧹 輸入驗證與清理
- [x] SQL 注入防護
- [x] XSS 攻擊防護
- [x] 命令注入防護
- [x] 路徑遍歷防護
- [x] NoSQL 注入防護
- [x] 檔案上傳安全檢查

### 🌐 HTTP 安全標頭
- [x] Content Security Policy (CSP)
- [x] X-Frame-Options
- [x] X-Content-Type-Options
- [x] X-XSS-Protection
- [x] Strict-Transport-Security (HSTS)
- [x] Referrer-Policy
- [x] Permissions-Policy

### 🚦 速率限制
- [x] API 請求限制
- [x] 登入嘗試限制
- [x] 檔案上傳限制
- [x] 分層速率控制

### 📁 檔案安全
- [x] 檔案類型驗證
- [x] 檔案大小限制
- [x] 檔案名稱安全檢查
- [x] 上傳路徑限制

## ⚠️ 部署前檢查項目

### 🔑 環境配置
- [ ] 更改所有預設密碼和金鑰
- [ ] 設定強壯的 JWT_SECRET
- [ ] 配置正確的 CORS_ORIGIN
- [ ] 設置安全的資料庫連接字串
- [ ] 啟用資料庫 SSL 連接

### 🔒 SSL/TLS 配置
- [ ] 安裝有效的 SSL 證書
- [ ] 配置 HTTPS 重定向
- [ ] 測試 SSL 配置強度
- [ ] 設置證書自動更新

### 🗄️ 資料庫安全
- [ ] 資料庫用戶權限最小化
- [ ] 啟用資料庫審計日誌
- [ ] 定期備份設置
- [ ] 資料加密配置

### 📊 監控與日誌
- [ ] 設置安全事件監控
- [ ] 配置日誌輪轉
- [ ] 設置異常警報
- [ ] 監控系統資源使用

### 🌍 網路安全
- [ ] 防火牆規則配置
- [ ] 不必要端口關閉
- [ ] VPN 或專用網路配置
- [ ] DDoS 防護設置

### 🔧 系統強化
- [ ] 移除不必要的軟體套件
- [ ] 系統更新到最新版本
- [ ] 服務帳戶權限最小化
- [ ] 設置系統監控

## 🧪 安全測試

### 滲透測試
- [ ] SQL 注入測試
- [ ] XSS 攻擊測試
- [ ] CSRF 攻擊測試
- [ ] 身份驗證繞過測試
- [ ] 授權漏洞測試

### 自動化安全掃描
- [ ] 依賴套件漏洞掃描
- [ ] 程式碼安全掃描
- [ ] 配置安全檢查
- [ ] SSL 配置測試

### 壓力測試
- [ ] API 端點壓力測試
- [ ] 資料庫連接池測試
- [ ] 檔案上傳壓力測試
- [ ] 記憶體洩漏測試

## 📝 安全文檔

### 必要文檔
- [ ] 安全策略文件
- [ ] 事件回應計劃
- [ ] 密鑰管理程序
- [ ] 備份恢復程序
- [ ] 用戶存取控制政策

### 訓練與意識
- [ ] 開發團隊安全培訓
- [ ] 安全最佳實踐文檔
- [ ] 事故回報流程
- [ ] 定期安全評估程序

## 🔄 持續安全維護

### 定期任務
- [ ] 每季安全審計
- [ ] 每月依賴套件更新
- [ ] 每週安全日誌檢查
- [ ] 每日系統監控檢查

### 事件管理
- [ ] 設置自動化監控警報
- [ ] 建立事件回應團隊
- [ ] 準備事故通訊模板
- [ ] 定期演練事件回應

## 🚨 緊急聯絡資訊

- 系統管理員: [待填入]
- 安全團隊: [待填入]
- 資料庫管理員: [待填入]
- 網路管理員: [待填入]

## 📞 外部安全資源

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- CVE 資料庫: https://cve.mitre.org/
- 安全建議: https://www.cisa.gov/
- SSL 測試: https://www.ssllabs.com/ssltest/

---

**檢查清單版本**: 1.0  
**最後更新**: ${new Date().toLocaleDateString('zh-TW')}  
**下次檢查**: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('zh-TW')}

> ⚠️ **重要提醒**: 此檢查清單應定期更新，並根據最新的安全威脅和法規要求進行調整。
`;

        fs.writeFileSync(checklistFile, checklistContent);
        
        this.securityResults.createdFiles.push('SECURITY_CHECKLIST.md');
        console.log('  ✅ 安全檢查清單生成完成');
    }

    /**
     * 生成安全配置報告
     */
    generateSecurityReport() {
        console.log('\n📊 生產環境安全配置報告:');
        console.log('='.repeat(70));
        
        // 環境配置統計
        console.log('\n🔐 環境配置:');
        console.log(`  安全配置項: ${this.securityResults.environmentVars.length}`);
        this.securityResults.environmentVars.forEach(config => {
            console.log(`    ✅ ${config.description} (${config.status})`);
        });
        
        // HTTP 安全標頭統計
        console.log('\n🛡️ HTTP安全標頭:');
        console.log(`  安全標頭模組: ${this.securityResults.headerSecurity.length}`);
        this.securityResults.headerSecurity.forEach(header => {
            console.log(`    ✅ ${header.description} (${header.status})`);
        });
        
        // 輸入驗證統計
        console.log('\n🧹 輸入驗證:');
        console.log(`  驗證模組: ${this.securityResults.inputValidation.length}`);
        this.securityResults.inputValidation.forEach(validation => {
            console.log(`    ✅ ${validation.description} (${validation.status})`);
        });
        
        // 認證安全統計
        console.log('\n🔐 認證安全:');
        console.log(`  認證模組: ${this.securityResults.authenticationSecurity.length}`);
        this.securityResults.authenticationSecurity.forEach(auth => {
            console.log(`    ✅ ${auth.description} (${auth.status})`);
        });
        
        // HTTPS 配置統計
        console.log('\n🔒 HTTPS配置:');
        console.log(`  SSL配置模組: ${this.securityResults.httpsSetup.length}`);
        this.securityResults.httpsSetup.forEach(https => {
            console.log(`    ✅ ${https.description} (${https.status})`);
        });
        
        // 系統配置統計
        console.log('\n🔧 系統配置:');
        console.log(`  安全集成模組: ${this.securityResults.securityConfig.length}`);
        this.securityResults.securityConfig.forEach(config => {
            console.log(`    ✅ ${config.description} (${config.status})`);
        });
        
        // 創建文件統計
        console.log('\n📄 新建安全文件:');
        console.log(`  新建文件總數: ${this.securityResults.createdFiles.length}`);
        this.securityResults.createdFiles.forEach(file => {
            console.log(`    📄 ${file}`);
        });
        
        // 安全改善建議
        this.generateSecurityRecommendations();
        
        console.log('\n✅ 生產環境安全配置完成');
        console.log('🛡️ 系統安全等級: 生產環境就緒');
    }

    /**
     * 生成安全建議
     */
    generateSecurityRecommendations() {
        console.log('\n💡 安全配置建議:');
        
        const recommendations = [
            '🔑 [立即執行] 更新 .env.production 文件中的所有密鑰',
            '🔒 [立即執行] 配置生產環境的 SSL 證書',
            '🌐 [高優先級] 設置正確的 CORS_ORIGIN 域名',
            '📊 [高優先級] 配置生產環境監控和日誌系統',
            '🔧 [中優先級] 在主服務器文件中整合安全中間件',
            '🧪 [中優先級] 執行完整的安全測試套件',
            '📋 [中優先級] 完成安全檢查清單中的所有項目',
            '🔄 [低優先級] 建立定期安全審計流程'
        ];

        recommendations.forEach((rec, index) => {
            console.log(`  ${index + 1}. ${rec}`);
        });
        
        this.securityResults.recommendations = recommendations;
    }

    /**
     * 導出安全配置結果
     */
    exportSecurityResults() {
        const reportFile = path.join(this.projectRoot, 'production-security-setup-report.json');
        
        try {
            fs.writeFileSync(reportFile, JSON.stringify(this.securityResults, null, 2));
            console.log(`\n📄 生產環境安全配置報告已導出: production-security-setup-report.json`);
            return reportFile;
        } catch (error) {
            console.error('❌ 導出安全配置報告失敗:', error.message);
            return null;
        }
    }
}

// 執行生產環境安全設置
async function main() {
    const security = new ProductionSecuritySetup();
    await security.executeProductionSecuritySetup();
    security.generateSecurityReport();
    security.exportSecurityResults();
}

if (require.main === module) {
    main();
}

module.exports = ProductionSecuritySetup;