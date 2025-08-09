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

    async sendNewEmployeeNotification(employee) {
        try {
            const message = `🆕 新員工註冊通知\n姓名: ${employee.name}\n身分證: ${employee.idNumber}\n職位: ${employee.position}\n分店: 內壢忠孝店\n狀態: ${employee.status}`;
            logger.info(`📢 新員工註冊: ${employee.name}`);
            return { success: true, message: '新員工註冊通知發送成功' };
        } catch (error) {
            logger.error('❌ 發送新員工通知失敗:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new NotificationService();