/**
 * 🧹 輸入安全驗證和清理中間件
 * 防止SQL注入、XSS攻擊和其他輸入相關攻擊
 */

const validator = require('validator');
const DOMPurify = require('isomorphic-dompurify');

// 危險模式檢測
const dangerousPatterns = [
    // SQL 注入模式
    /(union|select|insert|delete|update|create|drop|exec|execute)\s/gi,
    /('|(\-\-)|(;)|(\||\|)|(\*|\*))/gi,
    
    // XSS 模式
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    
    // 命令注入模式
    /(&|\||;|\$|\|\||&&|\n|\r)/gi,
    
    // 路徑遍歷模式
    /\.\.[\/\\]/gi,
    
    // NoSQL 注入模式
    /\$where|\$ne|\$gt|\$lt|\$regex/gi
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
        console.warn(`🚨 Dangerous input detected in ${fieldName}:`, {
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
            .replace(/\//g, '&#x2F;');
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
        .replace(/\/\*/g, '')
        .replace(/\*\//g, '');
    
    return cleaned;
}

// 數據類型驗證
const typeValidators = {
    email: (value) => validator.isEmail(value),
    phone: (value) => /^09\d{8}$/.test(value),
    idNumber: (value) => /^[A-Z]\d{9}$/.test(value),
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
                        const threats = detectDangerousInput(value, `${source}.${key}`);
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
                    message: `不允許的文件類型: ${fileExt}`
                });
            }
            
            // 檢查文件大小
            if (file.size > maxSize) {
                return res.status(400).json({
                    success: false,
                    error: 'FILE_TOO_LARGE',
                    message: `文件過大，最大允許 ${maxSize / 1024 / 1024}MB`
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
};