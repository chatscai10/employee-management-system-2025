/**
 * 🔐 增強身份驗證安全中間件
 * 實施強化的JWT認證和會話管理
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
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
        errors.push(`密碼長度至少需要 ${requirements.minLength} 個字符`);
    }
    
    if (password.length > requirements.maxLength) {
        errors.push(`密碼長度不能超過 ${requirements.maxLength} 個字符`);
    }
    
    if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('密碼必須包含至少一個大寫字母');
    }
    
    if (requirements.requireLowercase && !/[a-z]/.test(password)) {
        errors.push('密碼必須包含至少一個小寫字母');
    }
    
    if (requirements.requireNumbers && !/\d/.test(password)) {
        errors.push('密碼必須包含至少一個數字');
    }
    
    if (requirements.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
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
    if (/\d/.test(password)) score += 5;
    if (/[^\w\s]/.test(password)) score += 10;
    
    // 複雜度分數
    const uniqueChars = new Set(password).size;
    score += Math.min(uniqueChars * 2, 20);
    
    // 模式扣分
    if (/(..).*\1/.test(password)) score -= 10; // 重複模式
    if (/012|123|234|345|456|567|678|789|890/.test(password)) score -= 15; // 連續數字
    if (/abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/.test(password.toLowerCase())) score -= 15; // 連續字母
    
    return Math.max(0, Math.min(100, score));
}

// 安全的密碼雜湊
async function hashPassword(password) {
    const validation = validatePasswordStrength(password);
    if (!validation.isValid) {
        throw new Error(`密碼不符合安全要求: ${validation.errors.join(', ')}`);
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
        console.log(`Session revoked: ${sessionId}`);
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
};