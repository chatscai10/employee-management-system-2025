/**
 * 🔐 生產環境認證路由
 * Production Authentication Routes
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const productionAuth = require('../../middleware/auth/production');
const logger = require('../../utils/logger');

/**
 * @route POST /api/auth/login
 * @desc 生產環境安全登入
 * @access Public
 */
router.post('/login', 
    productionAuth.ipWhitelistCheck,
    productionAuth.loginRateLimit,
    async (req, res) => {
        try {
            const { employeeId, password, rememberMe } = req.body;
            const clientIP = req.ip;

            // 基本驗證
            if (!employeeId || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'MISSING_CREDENTIALS',
                    message: '請提供員工編號和密碼'
                });
            }

            // 檢查 IP 是否被封鎖
            if (productionAuth.blockedIPs.has(clientIP)) {
                return res.status(403).json({
                    success: false,
                    error: 'IP_BLOCKED',
                    message: 'IP 地址已被封鎖，請聯繫系統管理員'
                });
            }

            // 這裡應該查詢實際的資料庫
            // 暫時使用模擬查詢
            const employee = await findEmployeeByCredentials(employeeId, password);

            if (!employee) {
                // 記錄登入失敗
                const failureCount = productionAuth.recordLoginFailure(clientIP, employeeId);
                
                return res.status(401).json({
                    success: false,
                    error: 'INVALID_CREDENTIALS',
                    message: '員工編號或密碼錯誤',
                    attemptsRemaining: Math.max(0, 15 - failureCount)
                });
            }

            // 檢查帳號狀態
            if (!employee.isActive) {
                return res.status(403).json({
                    success: false,
                    error: 'ACCOUNT_DISABLED',
                    message: '帳號已被停用，請聯繫管理員'
                });
            }

            // 生成安全令牌
            const tokens = productionAuth.generateSecureTokens(employee);

            // 更新會話資訊
            productionAuth.updateSession(tokens.sessionId, req);

            // 記錄成功登入
            logger.info(`用戶登入成功: ${employeeId}, IP: ${clientIP}`);

            // 清除該用戶的失敗記錄
            const failureKey = `${clientIP}:${employeeId}`;
            productionAuth.failedAttempts.delete(failureKey);

            // 設置安全的 Cookie (如果記住我)
            if (rememberMe) {
                res.cookie('refreshToken', tokens.refreshToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    maxAge: 7 * 24 * 60 * 60 * 1000 // 7天
                });
            }

            res.json({
                success: true,
                message: '登入成功',
                data: {
                    employee: {
                        id: employee.id,
                        employeeId: employee.employeeId,
                        name: employee.name,
                        role: employee.role,
                        storeId: employee.storeId,
                        permissions: tokens.permissions
                    },
                    tokens: {
                        accessToken: tokens.accessToken,
                        tokenType: tokens.tokenType,
                        expiresIn: tokens.expiresIn
                    }
                }
            });

        } catch (error) {
            logger.error('登入處理錯誤:', error);
            res.status(500).json({
                success: false,
                error: 'LOGIN_ERROR',
                message: '登入處理發生錯誤'
            });
        }
    }
);

/**
 * @route POST /api/auth/refresh
 * @desc 刷新訪問令牌
 * @access Private
 */
router.post('/refresh', async (req, res) => {
    try {
        const refreshToken = req.body.refreshToken || req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                error: 'MISSING_REFRESH_TOKEN',
                message: '缺少刷新令牌'
            });
        }

        const newTokens = await productionAuth.refreshAccessToken(refreshToken);

        res.json({
            success: true,
            message: '令牌刷新成功',
            data: {
                tokens: newTokens
            }
        });

    } catch (error) {
        logger.error('令牌刷新錯誤:', error);
        
        // 清除無效的 Cookie
        res.clearCookie('refreshToken');

        res.status(401).json({
            success: false,
            error: 'REFRESH_TOKEN_INVALID',
            message: '刷新令牌無效或已過期'
        });
    }
});

/**
 * @route POST /api/auth/logout
 * @desc 安全登出
 * @access Private
 */
router.post('/logout', authenticateToken, (req, res) => {
    try {
        const sessionId = req.user?.sessionId;
        const refreshToken = req.body.refreshToken || req.cookies.refreshToken;

        // 執行登出
        productionAuth.logout(sessionId, refreshToken);

        // 清除 Cookie
        res.clearCookie('refreshToken');

        res.json({
            success: true,
            message: '登出成功'
        });

    } catch (error) {
        logger.error('登出錯誤:', error);
        res.status(500).json({
            success: false,
            error: 'LOGOUT_ERROR',
            message: '登出處理發生錯誤'
        });
    }
});

/**
 * @route POST /api/auth/change-password
 * @desc 更改密碼
 * @access Private
 */
router.post('/change-password',
    authenticateToken,
    productionAuth.validatePasswordStrength,
    async (req, res) => {
        try {
            const { currentPassword, newPassword } = req.body;
            const employeeId = req.user.employeeId;

            // 驗證當前密碼
            const employee = await findEmployeeById(employeeId);
            if (!employee) {
                return res.status(404).json({
                    success: false,
                    error: 'EMPLOYEE_NOT_FOUND',
                    message: '找不到員工資料'
                });
            }

            const isCurrentPasswordValid = await bcrypt.compare(currentPassword, employee.password);
            if (!isCurrentPasswordValid) {
                return res.status(400).json({
                    success: false,
                    error: 'INVALID_CURRENT_PASSWORD',
                    message: '當前密碼不正確'
                });
            }

            // 檢查新密碼是否與當前密碼相同
            const isSamePassword = await bcrypt.compare(newPassword, employee.password);
            if (isSamePassword) {
                return res.status(400).json({
                    success: false,
                    error: 'SAME_PASSWORD',
                    message: '新密碼不能與當前密碼相同'
                });
            }

            // 加密新密碼
            const hashedNewPassword = await bcrypt.hash(newPassword, 12);

            // 更新密碼 (這裡需要實際的資料庫更新)
            await updateEmployeePassword(employeeId, hashedNewPassword);

            // 記錄密碼更改
            logger.info(`密碼更改成功: ${employeeId}`);

            // 發送安全通知
            await productionAuth.sendSecurityAlert(
                'PASSWORD_CHANGED',
                `員工 ${employeeId} 更改了密碼`
            );

            res.json({
                success: true,
                message: '密碼更改成功'
            });

        } catch (error) {
            logger.error('更改密碼錯誤:', error);
            res.status(500).json({
                success: false,
                error: 'PASSWORD_CHANGE_ERROR',
                message: '密碼更改失敗'
            });
        }
    }
);

/**
 * @route GET /api/auth/sessions
 * @desc 獲取活躍會話
 * @access Private
 */
router.get('/sessions', authenticateToken, (req, res) => {
    try {
        const employeeId = req.user.employeeId;
        const sessions = [];

        // 獲取該用戶的所有活躍會話
        for (const [sessionId, session] of productionAuth.activeSessions.entries()) {
            if (session.employeeId === employeeId) {
                sessions.push({
                    sessionId,
                    loginTime: session.loginTime,
                    lastActivity: session.lastActivity,
                    ipAddress: session.ipAddress,
                    userAgent: session.userAgent,
                    isCurrent: sessionId === req.user.sessionId
                });
            }
        }

        res.json({
            success: true,
            data: {
                sessions,
                totalSessions: sessions.length
            }
        });

    } catch (error) {
        logger.error('獲取會話錯誤:', error);
        res.status(500).json({
            success: false,
            error: 'SESSIONS_ERROR',
            message: '獲取會話資料失敗'
        });
    }
});

/**
 * @route DELETE /api/auth/sessions/:sessionId
 * @desc 終止特定會話
 * @access Private
 */
router.delete('/sessions/:sessionId', authenticateToken, (req, res) => {
    try {
        const { sessionId } = req.params;
        const employeeId = req.user.employeeId;

        const session = productionAuth.activeSessions.get(sessionId);
        
        if (!session || session.employeeId !== employeeId) {
            return res.status(404).json({
                success: false,
                error: 'SESSION_NOT_FOUND',
                message: '找不到指定的會話'
            });
        }

        // 不允許終止當前會話
        if (sessionId === req.user.sessionId) {
            return res.status(400).json({
                success: false,
                error: 'CANNOT_TERMINATE_CURRENT_SESSION',
                message: '無法終止當前會話'
            });
        }

        // 終止會話
        productionAuth.activeSessions.delete(sessionId);

        logger.info(`會話已終止: ${sessionId} by ${employeeId}`);

        res.json({
            success: true,
            message: '會話已終止'
        });

    } catch (error) {
        logger.error('終止會話錯誤:', error);
        res.status(500).json({
            success: false,
            error: 'TERMINATE_SESSION_ERROR',
            message: '終止會話失敗'
        });
    }
});

/**
 * 令牌認證中間件
 */
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'MISSING_TOKEN',
            message: '缺少訪問令牌'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 檢查會話是否仍然有效
        const session = productionAuth.activeSessions.get(decoded.sessionId);
        if (!session) {
            return res.status(401).json({
                success: false,
                error: 'SESSION_EXPIRED',
                message: '會話已過期'
            });
        }

        // 更新會話活動時間
        productionAuth.updateSession(decoded.sessionId, req);

        req.user = decoded;
        next();

    } catch (error) {
        logger.error('令牌驗證錯誤:', error);
        
        return res.status(403).json({
            success: false,
            error: 'INVALID_TOKEN',
            message: '無效的訪問令牌'
        });
    }
}

// 模擬資料庫查詢函數 (實際使用時應該替換為真實的資料庫操作)
async function findEmployeeByCredentials(employeeId, password) {
    // 這裡應該是實際的資料庫查詢
    const mockEmployee = {
        id: 1,
        employeeId: 'EMP001',
        name: '管理員',
        password: await bcrypt.hash('password123', 12),
        role: 'admin',
        storeId: 1,
        isActive: true
    };

    if (employeeId === mockEmployee.employeeId) {
        const isPasswordValid = await bcrypt.compare(password, mockEmployee.password);
        return isPasswordValid ? mockEmployee : null;
    }

    return null;
}

async function findEmployeeById(employeeId) {
    // 模擬查詢
    return {
        id: 1,
        employeeId: employeeId,
        name: '管理員',
        password: await bcrypt.hash('password123', 12),
        role: 'admin',
        storeId: 1,
        isActive: true
    };
}

async function updateEmployeePassword(employeeId, hashedPassword) {
    // 模擬更新
    console.log(`更新密碼: ${employeeId}`);
    return true;
}

module.exports = router;