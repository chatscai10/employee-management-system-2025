/**
 * JWT 認證中間件
 */

const jwt = require('jsonwebtoken');
const responseHelper = require('../utils/responseHelper');
const logger = require('../utils/logger');

/**
 * JWT 認證中間件
 */
function authMiddleware(req, res, next) {
    try {
        // 從 Header 取得 Token
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return responseHelper.unauthorized(res, '請提供授權Token');
        }

        if (!authHeader.startsWith('Bearer ')) {
            return responseHelper.unauthorized(res, 'Token格式不正確');
        }

        const token = authHeader.substring(7); // 移除 "Bearer " 前綴

        if (!token) {
            return responseHelper.unauthorized(res, 'Token不能為空');
        }

        // 驗證 Token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 檢查 Token 是否即將過期 (少於1小時)
        const timeUntilExpiry = decoded.exp * 1000 - Date.now();
        if (timeUntilExpiry < 3600000) { // 1小時 = 3600000毫秒
            logger.warn('⚠️ Token即將過期', {
                userId: decoded.userId,
                expiresIn: Math.floor(timeUntilExpiry / 1000 / 60) + ' 分鐘'
            });
        }

        // 將用戶資訊附加到請求物件
        req.user = {
            id: decoded.id,
            name: decoded.name,
            position: decoded.position,
            storeId: decoded.storeId
        };

        // 記錄認證成功
        logger.debug('✅ 認證成功', {
            userId: decoded.id,
            name: decoded.name,
            position: decoded.position,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });

        next();

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            logger.warn('❌ Token格式不正確', { 
                error: error.message,
                ip: req.ip 
            });
            return responseHelper.unauthorized(res, 'Token格式不正確');
        }

        if (error.name === 'TokenExpiredError') {
            logger.warn('❌ Token已過期', { 
                expiredAt: error.expiredAt,
                ip: req.ip 
            });
            return responseHelper.unauthorized(res, 'Token已過期，請重新登入');
        }

        if (error.name === 'NotBeforeError') {
            logger.warn('❌ Token尚未生效', { 
                notBefore: error.notBefore,
                ip: req.ip 
            });
            return responseHelper.unauthorized(res, 'Token尚未生效');
        }

        logger.error('❌ Token驗證發生未知錯誤:', error);
        return responseHelper.internalError(res, 'Token驗證失敗');
    }
}

/**
 * 角色權限檢查中間件
 * @param {Array} allowedRoles - 允許的角色陣列
 */
function requireRoles(allowedRoles = []) {
    return (req, res, next) => {
        if (!req.user) {
            return responseHelper.unauthorized(res, '用戶未認證');
        }

        if (allowedRoles.length === 0) {
            return next(); // 如果沒有指定角色限制，直接通過
        }

        if (!allowedRoles.includes(req.user.role)) {
            logger.warn('❌ 權限不足', {
                userId: req.user.id,
                userRole: req.user.role,
                requiredRoles: allowedRoles,
                path: req.path
            });
            
            return responseHelper.forbidden(res, `權限不足，需要以下角色之一: ${allowedRoles.join(', ')}`);
        }

        next();
    };
}

/**
 * 管理員權限中間件
 */
function requireAdmin(req, res, next) {
    return requireRoles(['admin'])(req, res, next);
}

/**
 * 主管以上權限中間件
 */
function requireManager(req, res, next) {
    return requireRoles(['admin', 'manager'])(req, res, next);
}

/**
 * 檢查用戶是否為資源擁有者或管理員
 * @param {Function} getResourceOwnerId - 取得資源擁有者ID的函數
 */
function requireOwnerOrAdmin(getResourceOwnerId) {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return responseHelper.unauthorized(res, '用戶未認證');
            }

            // 管理員可以存取所有資源
            if (req.user.role === 'admin') {
                return next();
            }

            // 檢查是否為資源擁有者
            const resourceOwnerId = await getResourceOwnerId(req);
            
            if (req.user.id === resourceOwnerId) {
                return next();
            }

            logger.warn('❌ 存取被拒絕', {
                userId: req.user.id,
                resourceOwnerId: resourceOwnerId,
                path: req.path
            });

            return responseHelper.forbidden(res, '只能存取自己的資源');

        } catch (error) {
            logger.error('❌ 權限檢查發生錯誤:', error);
            return responseHelper.internalError(res, '權限檢查失敗');
        }
    };
}

/**
 * 可選認證中間件 - 如果有 Token 就驗證，沒有就跳過
 */
function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(); // 沒有 Token，直接通過
    }

    // 有 Token，使用標準認證流程
    return authMiddleware(req, res, next);
}

/**
 * API Key 認證中間件 (用於系統間通信)
 */
function requireApiKey(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
        return responseHelper.unauthorized(res, '請提供API Key');
    }

    if (apiKey !== process.env.API_KEY) {
        logger.warn('❌ API Key不正確', {
            providedKey: apiKey.substring(0, 8) + '...',
            ip: req.ip
        });
        return responseHelper.unauthorized(res, 'API Key不正確');
    }

    next();
}

module.exports = {
    authMiddleware,
    requireRoles,
    requireAdmin,
    requireManager,
    requireOwnerOrAdmin,
    optionalAuth,
    requireApiKey,
    adminMiddleware: requireAdmin  // 別名供管理員路由使用
};