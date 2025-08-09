/**
 * API 回應格式統一工具
 */

class ResponseHelper {
    /**
     * 成功回應
     * @param {Object} res - Express response object
     * @param {*} data - 回應資料
     * @param {String} message - 回應訊息
     * @param {Number} statusCode - HTTP狀態碼
     */
    success(res, data = null, message = '操作成功', statusCode = 200) {
        const response = {
            success: true,
            message: message,
            timestamp: new Date().toISOString()
        };

        if (data !== null) {
            response.data = data;
        }

        return res.status(statusCode).json(response);
    }

    /**
     * 錯誤回應
     * @param {Object} res - Express response object
     * @param {String} message - 錯誤訊息
     * @param {String} code - 錯誤代碼
     * @param {Number} statusCode - HTTP狀態碼
     * @param {Array} details - 錯誤詳細資訊
     */
    error(res, message = '操作失敗', code = 'OPERATION_FAILED', statusCode = 400, details = null) {
        const response = {
            success: false,
            error: message,
            code: code,
            timestamp: new Date().toISOString()
        };

        if (details && details.length > 0) {
            response.details = details;
        }

        return res.status(statusCode).json(response);
    }

    /**
     * 驗證錯誤回應
     * @param {Object} res - Express response object
     * @param {Array} errors - 驗證錯誤陣列
     */
    validationError(res, errors) {
        return this.error(
            res,
            '資料驗證失敗',
            'VALIDATION_ERROR',
            422,
            errors
        );
    }

    /**
     * 認證錯誤回應
     * @param {Object} res - Express response object
     * @param {String} message - 錯誤訊息
     */
    unauthorized(res, message = 'Token無效或已過期') {
        return this.error(
            res,
            message,
            'UNAUTHORIZED',
            401
        );
    }

    /**
     * 權限不足錯誤回應
     * @param {Object} res - Express response object
     * @param {String} message - 錯誤訊息
     */
    forbidden(res, message = '權限不足') {
        return this.error(
            res,
            message,
            'FORBIDDEN',
            403
        );
    }

    /**
     * 資源不存在錯誤回應
     * @param {Object} res - Express response object
     * @param {String} resource - 資源名稱
     */
    notFound(res, resource = '資源') {
        return this.error(
            res,
            `${resource}不存在`,
            'RESOURCE_NOT_FOUND',
            404
        );
    }

    /**
     * 衝突錯誤回應
     * @param {Object} res - Express response object
     * @param {String} message - 錯誤訊息
     */
    conflict(res, message = '資源已存在或發生衝突') {
        return this.error(
            res,
            message,
            'RESOURCE_CONFLICT',
            409
        );
    }

    /**
     * 速率限制錯誤回應
     * @param {Object} res - Express response object
     */
    rateLimited(res) {
        return this.error(
            res,
            '請求過於頻繁，請稍後再試',
            'RATE_LIMIT_EXCEEDED',
            429
        );
    }

    /**
     * 伺服器內部錯誤回應
     * @param {Object} res - Express response object
     * @param {String} message - 錯誤訊息
     */
    internalError(res, message = '系統內部錯誤') {
        return this.error(
            res,
            message,
            'INTERNAL_SERVER_ERROR',
            500
        );
    }

    /**
     * 分頁回應
     * @param {Object} res - Express response object
     * @param {Array} data - 資料陣列
     * @param {Object} pagination - 分頁資訊
     * @param {String} message - 回應訊息
     */
    paginated(res, data, pagination, message = '查詢成功') {
        return this.success(res, {
            items: data,
            pagination: {
                currentPage: pagination.page || 1,
                totalPages: pagination.totalPages || 1,
                totalItems: pagination.totalItems || data.length,
                itemsPerPage: pagination.limit || 10,
                hasNext: pagination.hasNext || false,
                hasPrevious: pagination.hasPrevious || false
            }
        }, message);
    }

    /**
     * 檔案上傳成功回應
     * @param {Object} res - Express response object
     * @param {Object} fileInfo - 檔案資訊
     */
    fileUploaded(res, fileInfo) {
        return this.success(res, {
            filename: fileInfo.filename,
            originalName: fileInfo.originalname,
            size: fileInfo.size,
            mimeType: fileInfo.mimetype,
            path: fileInfo.path,
            url: `/uploads/${fileInfo.filename}`
        }, '檔案上傳成功');
    }

    /**
     * 批量操作回應
     * @param {Object} res - Express response object
     * @param {Object} results - 批量操作結果
     */
    batchResult(res, results) {
        return this.success(res, {
            total: results.total || 0,
            successful: results.successful || 0,
            failed: results.failed || 0,
            errors: results.errors || [],
            results: results.results || []
        }, '批量操作完成');
    }
}

module.exports = new ResponseHelper();