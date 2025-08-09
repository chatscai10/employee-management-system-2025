/**
 * 全域錯誤處理中間件
 */

const logger = require('../utils/logger');
const responseHelper = require('../utils/responseHelper');

/**
 * 全域錯誤處理中間件
 */
function errorHandler(err, req, res, next) {
    // 記錄錯誤
    logger.error('❌ 全域錯誤處理:', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        body: req.body,
        params: req.params,
        query: req.query
    });

    // Sequelize 資料庫錯誤
    if (err.name === 'SequelizeValidationError') {
        const errors = err.errors.map(error => ({
            field: error.path,
            message: error.message,
            value: error.value
        }));
        
        return responseHelper.validationError(res, errors);
    }

    if (err.name === 'SequelizeUniqueConstraintError') {
        return responseHelper.conflict(res, '資料已存在，不能重複建立');
    }

    if (err.name === 'SequelizeForeignKeyConstraintError') {
        return responseHelper.error(res, '關聯資料不存在', 'FOREIGN_KEY_CONSTRAINT', 400);
    }

    if (err.name === 'SequelizeConnectionError') {
        return responseHelper.internalError(res, '資料庫連接失敗');
    }

    // JWT 錯誤
    if (err.name === 'JsonWebTokenError') {
        return responseHelper.unauthorized(res, 'Token格式不正確');
    }

    if (err.name === 'TokenExpiredError') {
        return responseHelper.unauthorized(res, 'Token已過期');
    }

    // Multer 檔案上傳錯誤
    if (err.code === 'LIMIT_FILE_SIZE') {
        return responseHelper.error(res, '檔案大小超過限制', 'FILE_TOO_LARGE', 413);
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
        return responseHelper.error(res, '檔案數量超過限制', 'TOO_MANY_FILES', 413);
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return responseHelper.error(res, '不支援的檔案類型', 'UNSUPPORTED_FILE_TYPE', 415);
    }

    // Express-validator 錯誤
    if (err.type === 'entity.parse.failed') {
        return responseHelper.error(res, 'JSON格式不正確', 'INVALID_JSON', 400);
    }

    // 語法錯誤
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return responseHelper.error(res, 'JSON格式不正確', 'INVALID_JSON', 400);
    }

    // 自定義業務邏輯錯誤
    if (err.isBusinessError) {
        return responseHelper.error(res, err.message, err.code || 'BUSINESS_ERROR', err.statusCode || 422);
    }

    // 認證錯誤
    if (err.isAuthError) {
        return responseHelper.unauthorized(res, err.message);
    }

    // 權限錯誤
    if (err.isForbiddenError) {
        return responseHelper.forbidden(res, err.message);
    }

    // 404 錯誤
    if (err.status === 404) {
        return responseHelper.notFound(res);
    }

    // 其他已知錯誤
    if (err.status && err.message) {
        return responseHelper.error(res, err.message, 'KNOWN_ERROR', err.status);
    }

    // 未知錯誤 - 不洩露詳細資訊給客戶端
    if (process.env.NODE_ENV === 'production') {
        return responseHelper.internalError(res, '系統發生未知錯誤');
    } else {
        // 開發環境顯示詳細錯誤資訊
        return responseHelper.error(res, err.message || '未知錯誤', 'UNKNOWN_ERROR', 500, {
            stack: err.stack,
            name: err.name
        });
    }
}

/**
 * 創建業務邏輯錯誤
 */
function createBusinessError(message, code = 'BUSINESS_ERROR', statusCode = 422) {
    const error = new Error(message);
    error.isBusinessError = true;
    error.code = code;
    error.statusCode = statusCode;
    return error;
}

/**
 * 創建認證錯誤
 */
function createAuthError(message = 'Token無效或已過期') {
    const error = new Error(message);
    error.isAuthError = true;
    return error;
}

/**
 * 創建權限錯誤
 */
function createForbiddenError(message = '權限不足') {
    const error = new Error(message);
    error.isForbiddenError = true;
    return error;
}

module.exports = {
    errorHandler,
    createBusinessError,
    createAuthError,
    createForbiddenError
};