/**
 * 清理服務
 */

const logger = require('../utils/logger');

class CleanupService {
    async cleanupTempFiles() {
        logger.debug('🧹 清理臨時檔案...');
        // 清理邏輯將在後續實作
        return { success: true, message: '清理完成' };
    }
}

module.exports = new CleanupService();