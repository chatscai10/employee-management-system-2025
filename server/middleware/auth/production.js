/**
 * 🔐 生產環境認證和授權機制
 * Production Environment Authentication & Authorization
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const logger = require('../../utils/logger');

class ProductionAuthService {
    constructor() {
        this.failedAttempts = new Map(); // 記錄失敗嘗試
        this.blockedIPs = new Set(); // 被封鎖的 IP
        this.activeSessions = new Map(); // 活躍會話
        this.refreshTokens = new Map(); // Refresh Token 存儲
        
        // 初始化清理定時器
        this.initCleanupTimers();
    }

    /**
     * 初始化清理定時器
     */
    initCleanupTimers() {
        // 每小時清理過期的失敗嘗試記錄
        setInterval(() => {
            this.cleanupFailedAttempts();
        }, 3600000);

        // 每12小時清理過期的會話
        setInterval(() => {
            this.cleanupExpiredSessions();
        }, 43200000);

        // 每24小時重置被封鎖的 IP (除非是永久封鎖)
        setInterval(() => {
            this.resetBlockedIPs();
        }, 86400000);
    }

    /**
     * 增強的密碼驗證
     */
    validatePasswordStrength = [
        body('password')
            .isLength({ min: 8 })
            .withMessage('密碼至少需要8個字符')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
            .withMessage('密碼必須包含大小寫字母、數字和特殊字符'),
        (req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    error: 'WEAK_PASSWORD',
                    message: '密碼強度不足',
                    details: errors.array()
                });
            }
            next();
        }
    ];

    /**
     * IP 白名單驗證
     */
    ipWhitelistCheck = (req, res, next) => {
        if (process.env.NODE_ENV !== 'production') {
            return next();
        }

        const clientIP = req.ip || req.connection.remoteAddress;
        const whitelistedIPs = process.env.IP_WHITELIST ? 
            process.env.IP_WHITELIST.split(',').map(ip => ip.trim()) : 
            [];

        // 如果設定了白名單且客戶端 IP 不在白名單中
        if (whitelistedIPs.length > 0 && !whitelistedIPs.includes(clientIP)) {
            logger.warn(`未授權的 IP 嘗試訪問: ${clientIP}`);
            
            return res.status(403).json({
                success: false,
                error: 'IP_NOT_WHITELISTED',
                message: '訪問被拒絕：IP 不在白名單中'
            });
        }

        next();
    };

    /**
     * 增強的登入速率限制
     */
    loginRateLimit = rateLimit({
        windowMs: 15 * 60 * 1000, // 15分鐘
        max: (req) => {
            const clientIP = req.ip;
            
            // 檢查是否為被封鎖的 IP
            if (this.blockedIPs.has(clientIP)) {
                return 0; // 完全封鎖
            }
            
            // 根據失敗嘗試次數調整限制
            const attempts = this.failedAttempts.get(clientIP) || 0;
            if (attempts >= 10) return 1;  // 10次失敗後，15分鐘內只能嘗試1次
            if (attempts >= 5) return 3;   // 5次失敗後，15分鐘內只能嘗試3次
            return 5; // 正常情況下15分鐘內5次
        },
        message: {
            success: false,
            error: 'TOO_MANY_ATTEMPTS',
            message: '登入嘗試過於頻繁，請稍後再試'
        },
        standardHeaders: true,
        legacyHeaders: false
    });

    /**
     * 記錄登入失敗
     */
    recordLoginFailure(clientIP, employeeId) {
        const key = `${clientIP}:${employeeId}`;
        const current = this.failedAttempts.get(key) || 0;
        const newCount = current + 1;
        
        this.failedAttempts.set(key, newCount);
        
        // 記錄日誌
        logger.warn(`登入失敗記錄: IP=${clientIP}, 員工ID=${employeeId}, 失敗次數=${newCount}`);
        
        // 如果失敗次數超過閾值，考慮封鎖 IP
        if (newCount >= 15) {
            this.blockedIPs.add(clientIP);
            logger.error(`IP 已被封鎖: ${clientIP} (失敗嘗試 ${newCount} 次)`);
            
            // 發送告警通知
            this.sendSecurityAlert('IP_BLOCKED', `IP ${clientIP} 因多次登入失敗被封鎖`);
        }
        
        return newCount;
    }

    /**
     * 生成安全的 JWT Token
     */
    generateSecureTokens(employee) {
        const payload = {
            employeeId: employee.employeeId,
            id: employee.id,
            role: employee.role,
            storeId: employee.storeId,
            permissions: this.getEmployeePermissions(employee.role),
            sessionId: this.generateSessionId()
        };

        // 生成訪問令牌 (短期)
        const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
            issuer: 'employee-management-system',
            audience: 'employee-management-api'
        });

        // 生成刷新令牌 (長期)
        const refreshPayload = {
            employeeId: employee.employeeId,
            sessionId: payload.sessionId,
            type: 'refresh'
        };

        const refreshToken = jwt.sign(refreshPayload, process.env.JWT_REFRESH_SECRET, {
            expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
            issuer: 'employee-management-system',
            audience: 'employee-management-api'
        });

        // 存儲活躍會話
        this.activeSessions.set(payload.sessionId, {
            employeeId: employee.employeeId,
            loginTime: Date.now(),
            lastActivity: Date.now(),
            ipAddress: null, // 將在中間件中設置
            userAgent: null  // 將在中間件中設置
        });

        // 存儲刷新令牌
        this.refreshTokens.set(refreshToken, {
            employeeId: employee.employeeId,
            sessionId: payload.sessionId,
            createdAt: Date.now()
        });

        return {
            accessToken,
            refreshToken,
            expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
            tokenType: 'Bearer'
        };
    }

    /**
     * 獲取員工權限
     */
    getEmployeePermissions(role) {
        const permissions = {
            employee: ['attendance:read', 'attendance:write', 'profile:read', 'profile:update'],
            manager: [
                'attendance:read', 'attendance:write', 'attendance:manage',
                'profile:read', 'profile:update',
                'reports:read', 'team:read'
            ],
            admin: [
                'attendance:*', 'profile:*', 'reports:*', 'team:*',
                'users:*', 'system:*', 'revenue:*'
            ]
        };

        return permissions[role] || permissions.employee;
    }

    /**
     * 生成會話 ID
     */
    generateSessionId() {
        return require('crypto').randomBytes(32).toString('hex');
    }

    /**
     * 驗證和更新會話
     */
    updateSession(sessionId, req) {
        const session = this.activeSessions.get(sessionId);
        if (session) {
            session.lastActivity = Date.now();
            session.ipAddress = req.ip;
            session.userAgent = req.get('User-Agent');
            this.activeSessions.set(sessionId, session);
        }
        return session;
    }

    /**
     * 刷新令牌驗證
     */
    async refreshAccessToken(refreshToken) {
        try {
            // 驗證刷新令牌
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            
            if (decoded.type !== 'refresh') {
                throw new Error('Invalid token type');
            }

            // 檢查令牌是否在存儲中
            const tokenData = this.refreshTokens.get(refreshToken);
            if (!tokenData) {
                throw new Error('Refresh token not found');
            }

            // 檢查會話是否仍然有效
            const session = this.activeSessions.get(decoded.sessionId);
            if (!session) {
                // 清理無效的刷新令牌
                this.refreshTokens.delete(refreshToken);
                throw new Error('Session expired');
            }

            // 獲取員工資料 (這裡需要實際的資料庫查詢)
            const employee = await this.getEmployeeById(decoded.employeeId);
            if (!employee) {
                throw new Error('Employee not found');
            }

            // 生成新的訪問令牌
            const payload = {
                employeeId: employee.employeeId,
                id: employee.id,
                role: employee.role,
                storeId: employee.storeId,
                permissions: this.getEmployeePermissions(employee.role),
                sessionId: decoded.sessionId
            };

            const newAccessToken = jwt.sign(payload, process.env.JWT_SECRET, {
                expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
                issuer: 'employee-management-system',
                audience: 'employee-management-api'
            });

            // 更新會話活動時間
            session.lastActivity = Date.now();
            this.activeSessions.set(decoded.sessionId, session);

            return {
                accessToken: newAccessToken,
                expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
                tokenType: 'Bearer'
            };

        } catch (error) {
            // 清理無效的刷新令牌
            this.refreshTokens.delete(refreshToken);
            throw error;
        }
    }

    /**
     * 登出處理
     */
    logout(sessionId, refreshToken) {
        // 移除活躍會話
        this.activeSessions.delete(sessionId);
        
        // 移除刷新令牌
        if (refreshToken) {
            this.refreshTokens.delete(refreshToken);
        }

        logger.info(`用戶登出: sessionId=${sessionId}`);
    }

    /**
     * 權限檢查中間件
     */
    requirePermission(permission) {
        return (req, res, next) => {
            const userPermissions = req.user?.permissions || [];
            
            // 檢查是否有通配符權限
            const hasWildcard = userPermissions.some(p => 
                p.endsWith(':*') && permission.startsWith(p.replace(':*', ':'))
            );
            
            // 檢查是否有確切權限
            const hasExactPermission = userPermissions.includes(permission);
            
            if (!hasWildcard && !hasExactPermission) {
                return res.status(403).json({
                    success: false,
                    error: 'INSUFFICIENT_PERMISSIONS',
                    message: '權限不足',
                    requiredPermission: permission
                });
            }
            
            next();
        };
    }

    /**
     * 發送安全告警
     */
    async sendSecurityAlert(type, message) {
        try {
            if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
                const alertMessage = `🚨 安全告警

⚠️ 告警類型: ${type}
📝 詳細訊息: ${message}
🕐 發生時間: ${new Date().toLocaleString('zh-TW')}
🖥️ 系統: Employee Management System

請立即檢查系統安全狀況。`;

                const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        chat_id: process.env.TELEGRAM_CHAT_ID,
                        text: alertMessage
                    })
                });

                if (response.ok) {
                    logger.info('安全告警已發送到 Telegram');
                }
            }
        } catch (error) {
            logger.error('發送安全告警失敗:', error);
        }
    }

    /**
     * 清理過期的失敗嘗試記錄
     */
    cleanupFailedAttempts() {
        const oneHourAgo = Date.now() - 3600000;
        
        // 這是簡化版本，實際應該記錄時間戳
        // 這裡假設每小時重置計數
        this.failedAttempts.clear();
        
        logger.info('失敗登入嘗試記錄已清理');
    }

    /**
     * 清理過期的會話
     */
    cleanupExpiredSessions() {
        const twelveHoursAgo = Date.now() - 43200000;
        
        for (const [sessionId, session] of this.activeSessions.entries()) {
            if (session.lastActivity < twelveHoursAgo) {
                this.activeSessions.delete(sessionId);
                logger.info(`已清理過期會話: ${sessionId}`);
            }
        }
    }

    /**
     * 重置被封鎖的 IP (除非是永久封鎖)
     */
    resetBlockedIPs() {
        // 這是簡化版本，實際應該區分臨時和永久封鎖
        this.blockedIPs.clear();
        logger.info('臨時封鎖的 IP 已重置');
    }

    /**
     * 獲取員工資料 (模擬方法，實際需要資料庫查詢)
     */
    async getEmployeeById(employeeId) {
        // 這裡應該是實際的資料庫查詢
        // 暫時返回模擬資料
        return {
            id: 1,
            employeeId: employeeId,
            name: '測試用戶',
            role: 'employee',
            storeId: 1
        };
    }
}

// 創建單例實例
const productionAuth = new ProductionAuthService();

module.exports = productionAuth;