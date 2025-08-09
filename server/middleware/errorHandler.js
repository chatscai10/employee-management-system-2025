/**
 * Enhanced Error Handler
 * 增強版統一錯誤處理中間件
 */

const logger = require('../utils/logger');

// 錯誤代碼對應表
const errorCodes = {
    VALIDATION_ERROR: 'E001',
    AUTHENTICATION_ERROR: 'E002',
    AUTHORIZATION_ERROR: 'E003',
    NOT_FOUND_ERROR: 'E004',
    DATABASE_ERROR: 'E005',
    NETWORK_ERROR: 'E006',
    FILE_ERROR: 'E007',
    GPS_ERROR: 'E008',
    BUSINESS_LOGIC_ERROR: 'E009',
    UNKNOWN_ERROR: 'E999'
};

// 錯誤分類器
function classifyError(error) {
    if (error.name === 'ValidationError' || error.name === 'SequelizeValidationError') {
        return { type: 'VALIDATION_ERROR', statusCode: 400 };
    }
    
    if (error.name === 'UnauthorizedError' || error.message.includes('token')) {
        return { type: 'AUTHENTICATION_ERROR', statusCode: 401 };
    }
    
    if (error.name === 'ForbiddenError' || error.message.includes('permission')) {
        return { type: 'AUTHORIZATION_ERROR', statusCode: 403 };
    }
    
    if (error.name === 'NotFoundError' || error.message.includes('not found')) {
        return { type: 'NOT_FOUND_ERROR', statusCode: 404 };
    }
    
    if (error.name === 'SequelizeError' || error.message.includes('database')) {
        return { type: 'DATABASE_ERROR', statusCode: 500 };
    }
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        return { type: 'NETWORK_ERROR', statusCode: 503 };
    }
    
    if (error.code === 'ENOENT' || error.message.includes('file')) {
        return { type: 'FILE_ERROR', statusCode: 500 };
    }
    
    if (error.message.includes('GPS') || error.message.includes('location')) {
        return { type: 'GPS_ERROR', statusCode: 400 };
    }
    
    return { type: 'UNKNOWN_ERROR', statusCode: 500 };
}

// 生成用戶友善的錯誤訊息
function generateUserMessage(errorType) {
    const messages = {
        VALIDATION_ERROR: '輸入的資料格式不正確，請檢查後重新提交',
        AUTHENTICATION_ERROR: '登入已過期，請重新登入',
        AUTHORIZATION_ERROR: '您沒有權限執行此操作',
        NOT_FOUND_ERROR: '找不到您要求的資源',
        DATABASE_ERROR: '資料庫暫時無法存取，請稍後重試',
        NETWORK_ERROR: '網路連接異常，請檢查網路狀態',
        FILE_ERROR: '檔案處理失敗，請重新上傳',
        GPS_ERROR: 'GPS定位失敗，請確認定位權限',
        BUSINESS_LOGIC_ERROR: '業務邏輯處理異常',
        UNKNOWN_ERROR: '系統發生未知錯誤，請聯繫系統管理員'
    };
    
    return messages[errorType] || messages.UNKNOWN_ERROR;
}

// 主要錯誤處理中間件
const errorHandler = (err, req, res, next) => {
    const { type, statusCode } = classifyError(err);
    const errorCode = errorCodes[type];
    const userMessage = generateUserMessage(type);
    
    // 記錄詳細錯誤信息
    logger.error('Error occurred:', {
        error: err.message,
        stack: err.stack,
        type: type,
        errorCode: errorCode,
        url: req.url,
        method: req.method,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        timestamp: new Date().toISOString()
    });
    
    // 開發環境顯示詳細錯誤，生產環境隱藏敏感信息
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    const errorResponse = {
        success: false,
        error: {
            code: errorCode,
            type: type,
            message: userMessage
        },
        timestamp: new Date().toISOString(),
        path: req.path
    };
    
    // 開發環境添加更多調試信息
    if (isDevelopment) {
        errorResponse.debug = {
            originalError: err.message,
            stack: err.stack
        };
    }
    
    // 特殊處理驗證錯誤
    if (type === 'VALIDATION_ERROR' && err.errors) {
        errorResponse.error.details = err.errors;
    }
    
    res.status(statusCode).json(errorResponse);
};

// 404 處理中間件
const notFoundHandler = (req, res) => {
    const errorResponse = {
        success: false,
        error: {
            code: errorCodes.NOT_FOUND_ERROR,
            type: 'NOT_FOUND_ERROR',
            message: generateUserMessage('NOT_FOUND_ERROR')
        },
        timestamp: new Date().toISOString(),
        path: req.path
    };
    
    res.status(404).json(errorResponse);
};

// Promise 拒絕處理
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // 不要退出進程，但要記錄錯誤
});

// 未捕獲異常處理
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    // 在生產環境中，可能需要優雅地關閉進程
    if (process.env.NODE_ENV === 'production') {
        setTimeout(() => {
            process.exit(1);
        }, 1000);
    }
});

module.exports = {
    errorHandler,
    notFoundHandler,
    errorCodes,
    classifyError,
    generateUserMessage
};