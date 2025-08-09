/**
 * 請求限制中間件
 */

const rateLimit = require('express-rate-limit');
const MongoStore = require('rate-limit-mongo');

// 創建不同等級的速率限制
const createRateLimit = (windowMs, max, message, skipSuccessfulRequests = false) => {
    return rateLimit({
        windowMs,
        max,
        message: {
            success: false,
            error: message,
            retryAfter: Math.ceil(windowMs / 1000)
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests,
        // 根據用戶ID或IP生成key
        keyGenerator: (req) => {
            return req.user?.id || req.ip;
        }
    });
};

// 基本請求限制（每小時100個請求）
const basicRateLimit = createRateLimit(
    60 * 60 * 1000, // 1小時
    100,
    '請求過於頻繁，請稍後再試'
);

// 嚴格請求限制（每分鐘5個請求）- 用於登入等敏感操作
const strictRateLimit = createRateLimit(
    60 * 1000, // 1分鐘
    5,
    '操作過於頻繁，請稍後再試',
    true // 跳過成功的請求
);

// API請求限制（每分鐘30個請求）
const apiRateLimit = createRateLimit(
    60 * 1000, // 1分鐘
    30,
    'API請求過於頻繁，請稍後再試'
);

// 上傳請求限制（每小時10個上傳）
const uploadRateLimit = createRateLimit(
    60 * 60 * 1000, // 1小時
    10,
    '上傳過於頻繁，請稍後再試'
);

// 自定義速率限制中間件
const customRateLimit = (options) => {
    const {
        windowMs = 15 * 60 * 1000, // 預設15分鐘
        max = 100, // 預設100個請求
        message = '請求過於頻繁',
        skipCondition = null // 跳過條件函數
    } = options;
    
    return rateLimit({
        windowMs,
        max,
        message: {
            success: false,
            error: message,
            retryAfter: Math.ceil(windowMs / 1000)
        },
        skip: (req) => {
            // 如果提供了跳過條件，使用它
            if (typeof skipCondition === 'function') {
                return skipCondition(req);
            }
            
            // 管理員跳過速率限制
            return req.user && req.user.role === 'admin';
        },
        keyGenerator: (req) => {
            return req.user?.id || req.ip;
        },
        onLimitReached: (req) => {
            console.warn(`Rate limit reached for ${req.user?.id || req.ip}`);
        }
    });
};

module.exports = {
    basicRateLimit,
    strictRateLimit,
    apiRateLimit,
    uploadRateLimit,
    customRateLimit
};