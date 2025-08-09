/**
 * 健康檢查服務
 */

const logger = require('../utils/logger');

class HealthService {
    async performHealthCheck() {
        // 簡單的健康檢查
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage()
        };
        
        return health;
    }
}

module.exports = new HealthService();