/**
 * 通知服務
 */

const logger = require('../utils/logger');

class NotificationService {
    constructor() {
        this.io = null;
    }

    setSocketIO(io) {
        this.io = io;
        logger.info('✅ WebSocket 已連接到通知服務');
    }

    async sendSystemNotification(title, message) {
        try {
            logger.info(`📢 系統通知: ${title} - ${message}`);
            return { success: true, message: '通知發送成功' };
        } catch (error) {
            logger.error('❌ 發送系統通知失敗:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new NotificationService();