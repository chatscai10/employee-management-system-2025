/**
 * 數據庫連接配置
 */

const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

class DatabaseManager {
    constructor() {
        this.sequelize = null;
    }

    async initialize() {
        try {
            // 使用SQLite進行開發測試
            this.sequelize = new Sequelize({
                dialect: 'sqlite',
                storage: './database/employee_management.db',
                logging: (msg) => logger.debug(msg),
                pool: {
                    max: 5,
                    min: 0,
                    acquire: 30000,
                    idle: 10000
                }
            });

            // 測試連接
            await this.sequelize.authenticate();
            logger.info('✅ 數據庫連接成功');

            return this.sequelize;
        } catch (error) {
            logger.error('❌ 數據庫連接失敗:', error);
            throw error;
        }
    }

    async syncTables(force = false) {
        try {
            await this.sequelize.sync({ force });
            logger.info('✅ 數據庫表同步完成');
        } catch (error) {
            logger.error('❌ 數據庫表同步失敗:', error);
            throw error;
        }
    }

    getSequelize() {
        return this.sequelize;
    }

    async close() {
        if (this.sequelize) {
            await this.sequelize.close();
            logger.info('🔒 數據庫連接已關閉');
        }
    }
}

module.exports = new DatabaseManager();