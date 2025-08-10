/**
 * =======================================
 * 定時任務管理器 - ScheduledJobManager
 * =======================================
 * 處理自動投票觸發、月度統計重置等定時任務
 */

const cron = require('node-cron');
const logger = require('../utils/logger');
const AutoVotingEngine = require('../services/AutoVotingEngine');
const ExecutionEngine = require('../services/ExecutionEngine');

class ScheduledJobManager {
    constructor() {
        this.jobs = new Map();
        this.isInitialized = false;
    }

    /**
     * 初始化所有定時任務
     */
    async initialize() {
        try {
            logger.info('開始初始化定時任務管理器...');
            
            // 1. 每日00:00 - 檢查新人轉正條件
            this.scheduleJob('daily-promotion-check', '0 0 * * *', async () => {
                logger.info('執行每日新人轉正檢查...');
                await AutoVotingEngine.checkNewEmployeePromotions();
            });

            // 2. 每日00:00 - 檢查降職懲罰條件
            this.scheduleJob('daily-demotion-check', '0 0 * * *', async () => {
                logger.info('執行每日降職懲罰檢查...');
                await AutoVotingEngine.checkDemotionPunishments();
            });

            // 3. 每小時 - 處理到期投票活動
            this.scheduleJob('hourly-campaign-process', '0 * * * *', async () => {
                logger.info('處理到期投票活動...');
                await AutoVotingEngine.processExpiredCampaigns();
            });

            // 4. 每月1日00:00 - 重置月度遲到統計
            this.scheduleJob('monthly-stats-reset', '0 0 1 * *', async () => {
                logger.info('執行月度遲到統計重置...');
                await AutoVotingEngine.resetMonthlyAttendanceStats();
            });

            // 5. 每日12:00 - 系統健康檢查
            this.scheduleJob('daily-health-check', '0 12 * * *', async () => {
                logger.info('執行系統健康檢查...');
                await this.performHealthCheck();
            });

            // 6. 每30分鐘 - 檢查緊急投票條件 (遲到觸發) - 優化頻率
            this.scheduleJob('urgent-voting-check', '*/30 * * * *', async () => {
                logger.debug('檢查緊急投票條件...');
                await this.checkUrgentVotingConditions();
            });

            // 7. 每小時 - 執行職位變更
            this.scheduleJob('execute-position-changes', '0 * * * *', async () => {
                logger.info('執行職位變更...');
                await ExecutionEngine.executeScheduledChanges();
            });

            this.isInitialized = true;
            logger.info(`✅ 定時任務管理器初始化完成，共載入 ${this.jobs.size} 個任務`);
            
            // 發送初始化完成通知
            this.notifyJobStatus('init', '定時任務系統已啟動');

        } catch (error) {
            logger.error('❌ 定時任務管理器初始化失敗:', error);
            throw error;
        }
    }

    /**
     * 註冊定時任務
     * @param {string} name 任務名稱
     * @param {string} schedule Cron表達式
     * @param {Function} task 任務函數
     */
    scheduleJob(name, schedule, task) {
        try {
            const job = cron.schedule(schedule, async () => {
                const startTime = Date.now();
                
                try {
                    logger.info(`⏰ 開始執行定時任務: ${name}`);
                    await task();
                    
                    const duration = Date.now() - startTime;
                    logger.info(`✅ 定時任務執行完成: ${name} (耗時: ${duration}ms)`);
                    
                    this.updateJobStatus(name, 'success', duration);
                    
                } catch (error) {
                    const duration = Date.now() - startTime;
                    logger.error(`❌ 定時任務執行失敗: ${name}`, error);
                    
                    this.updateJobStatus(name, 'error', duration, error.message);
                }
            }, {
                scheduled: false, // 初始化時不自動開始
                timezone: 'Asia/Taipei'
            });

            this.jobs.set(name, {
                job,
                schedule,
                task,
                isRunning: false,
                lastRun: null,
                lastStatus: 'pending',
                lastDuration: 0,
                errorCount: 0,
                successCount: 0
            });

            logger.info(`📅 註冊定時任務: ${name} (${schedule})`);
            
        } catch (error) {
            logger.error(`註冊定時任務失敗: ${name}`, error);
            throw error;
        }
    }

    /**
     * 啟動所有定時任務
     */
    startAllJobs() {
        logger.info('啟動所有定時任務...');
        
        this.jobs.forEach((jobInfo, name) => {
            jobInfo.job.start();
            jobInfo.isRunning = true;
            logger.info(`▶️ 定時任務已啟動: ${name}`);
        });

        logger.info(`✅ 所有定時任務已啟動 (共 ${this.jobs.size} 個)`);
    }

    /**
     * 停止所有定時任務
     */
    stopAllJobs() {
        logger.info('停止所有定時任務...');
        
        this.jobs.forEach((jobInfo, name) => {
            jobInfo.job.stop();
            jobInfo.isRunning = false;
            logger.info(`⏸️ 定時任務已停止: ${name}`);
        });

        logger.info('✅ 所有定時任務已停止');
    }

    /**
     * 手動執行特定任務
     * @param {string} name 任務名稱
     */
    async runJobManually(name) {
        const jobInfo = this.jobs.get(name);
        
        if (!jobInfo) {
            throw new Error(`找不到定時任務: ${name}`);
        }

        logger.info(`🔄 手動執行定時任務: ${name}`);
        await jobInfo.task();
    }

    /**
     * 獲取所有任務狀態
     */
    getJobsStatus() {
        const status = {};
        
        this.jobs.forEach((jobInfo, name) => {
            status[name] = {
                schedule: jobInfo.schedule,
                isRunning: jobInfo.isRunning,
                lastRun: jobInfo.lastRun,
                lastStatus: jobInfo.lastStatus,
                lastDuration: jobInfo.lastDuration,
                errorCount: jobInfo.errorCount,
                successCount: jobInfo.successCount
            };
        });

        return status;
    }

    /**
     * 更新任務執行狀態
     */
    updateJobStatus(name, status, duration = 0, error = null) {
        const jobInfo = this.jobs.get(name);
        if (jobInfo) {
            jobInfo.lastRun = new Date();
            jobInfo.lastStatus = status;
            jobInfo.lastDuration = duration;
            
            if (status === 'success') {
                jobInfo.successCount++;
            } else if (status === 'error') {
                jobInfo.errorCount++;
            }

            // 記錄到日誌
            const logData = {
                job: name,
                status,
                duration,
                error,
                timestamp: new Date()
            };

            if (status === 'success') {
                logger.info('定時任務執行記錄:', logData);
            } else {
                logger.error('定時任務執行記錄:', logData);
            }
        }
    }

    /**
     * 執行系統健康檢查
     */
    async performHealthCheck() {
        try {
            const models = require('../models').getModels();
            
            // 檢查數據庫連接
            await models.Employee.count();
            
            // 檢查活動投票狀態
            const now = new Date();
            const activeCampaigns = await models.PromotionCampaign.count({
                where: {
                    status: 'active',
                    startDate: { [models.PromotionCampaign.sequelize.Sequelize.Op.lte]: now },
                    endDate: { [models.PromotionCampaign.sequelize.Sequelize.Op.gte]: now }
                }
            });

            // 檢查待處理的到期活動
            const expiredCampaigns = await models.PromotionCampaign.count({
                where: {
                    status: 'active',
                    endDate: { [models.PromotionCampaign.sequelize.Sequelize.Op.lt]: now }
                }
            });

            const healthStatus = {
                timestamp: new Date(),
                databaseConnected: true,
                activeCampaigns,
                expiredCampaigns,
                scheduledJobsRunning: this.jobs.size,
                systemHealthy: expiredCampaigns < 5 // 如果超過5個到期活動，視為異常
            };

            logger.info('系統健康檢查結果:', healthStatus);

            if (!healthStatus.systemHealthy) {
                logger.warn('⚠️ 系統健康警告: 發現過多到期投票活動未處理');
                this.notifyJobStatus('health-warning', `發現 ${expiredCampaigns} 個到期投票活動`);
            }

            return healthStatus;

        } catch (error) {
            logger.error('系統健康檢查失敗:', error);
            this.notifyJobStatus('health-error', error.message);
            throw error;
        }
    }

    /**
     * 檢查緊急投票條件
     */
    async checkUrgentVotingConditions() {
        try {
            const models = require('../models').getModels();
            
            // 檢查是否有新的遲到記錄觸發懲罰條件
            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth() + 1;

            // 查找最近15分鐘內的遲到記錄
            const recentLateRecords = await models.AttendanceRecord.findAll({
                where: {
                    status: '遲到',
                    clockType: '上班',
                    clockTime: {
                        [models.AttendanceRecord.sequelize.Sequelize.Op.gte]: new Date(Date.now() - 15 * 60 * 1000)
                    }
                }
            });

            if (recentLateRecords.length > 0) {
                logger.debug(`發現 ${recentLateRecords.length} 筆最近遲到記錄`);
                
                // 處理每筆遲到記錄
                const AttendanceStatsService = require('../services/AttendanceStatsService');
                
                for (const record of recentLateRecords) {
                    await AttendanceStatsService.processLateAttendance(record);
                }
            }

        } catch (error) {
            logger.error('檢查緊急投票條件失敗:', error);
        }
    }

    /**
     * 發送任務狀態通知
     */
    async notifyJobStatus(type, message) {
        try {
            // 這裡可以整合 Telegram 通知或其他通知方式
            logger.info(`📢 任務狀態通知 [${type}]: ${message}`);
            
            // TODO: 整合實際的通知服務
            // const notificationService = require('../services/notificationService');
            // await notificationService.sendNotification('admin', `定時任務通知: ${message}`);
            
        } catch (error) {
            logger.error('發送任務狀態通知失敗:', error);
        }
    }

    /**
     * 優雅關閉
     */
    async shutdown() {
        logger.info('正在關閉定時任務管理器...');
        
        this.stopAllJobs();
        
        // 等待當前任務執行完成
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        logger.info('✅ 定時任務管理器已關閉');
    }
}

module.exports = new ScheduledJobManager();