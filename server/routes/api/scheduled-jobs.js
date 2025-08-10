/**
 * =======================================
 * 定時任務管理 API Routes
 * =======================================
 * 提供定時任務的管理界面和控制功能
 */

const express = require('express');
const router = express.Router();
const logger = require('../../utils/logger');
const responseHelper = require('../../utils/responseHelper');

/**
 * 獲取所有定時任務狀態
 * GET /api/scheduled-jobs/status
 */
router.get('/status', async (req, res) => {
    try {
        const scheduledJobManager = require('../../jobs/ScheduledJobManager');
        const jobsStatus = scheduledJobManager.getJobsStatus();
        
        responseHelper.success(res, {
            totalJobs: Object.keys(jobsStatus).length,
            isInitialized: scheduledJobManager.isInitialized,
            jobs: jobsStatus,
            serverTime: new Date(),
            timezone: 'Asia/Taipei'
        }, '定時任務狀態獲取成功');
        
    } catch (error) {
        logger.error('獲取定時任務狀態失敗:', error);
        responseHelper.error(res, error.message, 'GET_JOBS_STATUS_FAILED');
    }
});

/**
 * 手動執行指定的定時任務
 * POST /api/scheduled-jobs/:jobName/run
 */
router.post('/:jobName/run', async (req, res) => {
    try {
        const { jobName } = req.params;
        const scheduledJobManager = require('../../jobs/ScheduledJobManager');
        
        const startTime = Date.now();
        await scheduledJobManager.runJobManually(jobName);
        const duration = Date.now() - startTime;
        
        logger.info(`手動執行定時任務完成: ${jobName} (${duration}ms)`);
        
        responseHelper.success(res, {
            jobName,
            executedAt: new Date(),
            duration,
            status: 'completed'
        }, `定時任務 ${jobName} 手動執行成功`);
        
    } catch (error) {
        logger.error(`手動執行定時任務失敗 [${req.params.jobName}]:`, error);
        responseHelper.error(res, error.message, 'MANUAL_JOB_EXECUTION_FAILED');
    }
});

/**
 * 獲取系統健康檢查結果
 * GET /api/scheduled-jobs/health
 */
router.get('/health', async (req, res) => {
    try {
        const scheduledJobManager = require('../../jobs/ScheduledJobManager');
        const healthStatus = await scheduledJobManager.performHealthCheck();
        
        const statusCode = healthStatus.systemHealthy ? 200 : 503;
        
        res.status(statusCode).json({
            success: healthStatus.systemHealthy,
            data: healthStatus,
            message: healthStatus.systemHealthy ? '系統健康狀態良好' : '系統健康狀態異常'
        });
        
    } catch (error) {
        logger.error('獲取系統健康狀態失敗:', error);
        responseHelper.error(res, error.message, 'HEALTH_CHECK_FAILED', 503);
    }
});

/**
 * 強制檢查新員工轉正條件
 * POST /api/scheduled-jobs/actions/check-promotions
 */
router.post('/actions/check-promotions', async (req, res) => {
    try {
        const AutoVotingEngine = require('../../services/AutoVotingEngine');
        
        logger.info('管理員手動觸發新員工轉正檢查');
        await AutoVotingEngine.checkNewEmployeePromotions();
        
        responseHelper.success(res, {
            action: 'check-promotions',
            executedAt: new Date(),
            trigger: 'manual_admin'
        }, '新員工轉正條件檢查已完成');
        
    } catch (error) {
        logger.error('手動檢查新員工轉正條件失敗:', error);
        responseHelper.error(res, error.message, 'CHECK_PROMOTIONS_FAILED');
    }
});

/**
 * 強制檢查降職懲罰條件
 * POST /api/scheduled-jobs/actions/check-demotions
 */
router.post('/actions/check-demotions', async (req, res) => {
    try {
        const AutoVotingEngine = require('../../services/AutoVotingEngine');
        
        logger.info('管理員手動觸發降職懲罰檢查');
        await AutoVotingEngine.checkDemotionPunishments();
        
        responseHelper.success(res, {
            action: 'check-demotions',
            executedAt: new Date(),
            trigger: 'manual_admin'
        }, '降職懲罰條件檢查已完成');
        
    } catch (error) {
        logger.error('手動檢查降職懲罰條件失敗:', error);
        responseHelper.error(res, error.message, 'CHECK_DEMOTIONS_FAILED');
    }
});

/**
 * 處理所有到期投票活動
 * POST /api/scheduled-jobs/actions/process-expired-campaigns
 */
router.post('/actions/process-expired-campaigns', async (req, res) => {
    try {
        const AutoVotingEngine = require('../../services/AutoVotingEngine');
        
        logger.info('管理員手動觸發到期投票活動處理');
        await AutoVotingEngine.processExpiredCampaigns();
        
        responseHelper.success(res, {
            action: 'process-expired-campaigns',
            executedAt: new Date(),
            trigger: 'manual_admin'
        }, '到期投票活動處理已完成');
        
    } catch (error) {
        logger.error('手動處理到期投票活動失敗:', error);
        responseHelper.error(res, error.message, 'PROCESS_EXPIRED_CAMPAIGNS_FAILED');
    }
});

/**
 * 重置月度遲到統計
 * POST /api/scheduled-jobs/actions/reset-monthly-stats
 */
router.post('/actions/reset-monthly-stats', async (req, res) => {
    try {
        const AutoVotingEngine = require('../../services/AutoVotingEngine');
        
        logger.info('管理員手動觸發月度遲到統計重置');
        await AutoVotingEngine.resetMonthlyAttendanceStats();
        
        responseHelper.success(res, {
            action: 'reset-monthly-stats',
            executedAt: new Date(),
            trigger: 'manual_admin'
        }, '月度遲到統計重置已完成');
        
    } catch (error) {
        logger.error('手動重置月度遲到統計失敗:', error);
        responseHelper.error(res, error.message, 'RESET_MONTHLY_STATS_FAILED');
    }
});

/**
 * 獲取自動投票引擎統計
 * GET /api/scheduled-jobs/voting-statistics
 */
router.get('/voting-statistics', async (req, res) => {
    try {
        const { getModels } = require('../../models');
        const models = getModels();
        
        const now = new Date();
        
        // 統計各種投票活動
        const [
            totalCampaigns,
            activeCampaigns,
            autoPromotionCampaigns,
            autoDemotionCampaigns,
            systemGeneratedCampaigns
        ] = await Promise.all([
            models.PromotionCampaign.count(),
            models.PromotionCampaign.count({
                where: {
                    status: 'active',
                    startDate: { [models.PromotionCampaign.sequelize.Sequelize.Op.lte]: now },
                    endDate: { [models.PromotionCampaign.sequelize.Sequelize.Op.gte]: now }
                }
            }),
            models.PromotionCampaign.count({
                where: { campaignSubType: 'auto_promotion' }
            }),
            models.PromotionCampaign.count({
                where: { campaignSubType: 'auto_demotion' }
            }),
            models.PromotionCampaign.count({
                where: { systemGenerated: true }
            })
        ]);

        // 遲到統計
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        
        const [
            totalLateRecords,
            punishmentTriggeredCount
        ] = await Promise.all([
            models.AttendanceStatistics.count({
                where: { year: currentYear, month: currentMonth }
            }),
            models.AttendanceStatistics.count({
                where: { 
                    year: currentYear, 
                    month: currentMonth,
                    isPunishmentTriggered: true 
                }
            })
        ]);

        const statistics = {
            campaigns: {
                total: totalCampaigns,
                active: activeCampaigns,
                autoPromotion: autoPromotionCampaigns,
                autoDemotion: autoDemotionCampaigns,
                systemGenerated: systemGeneratedCampaigns
            },
            attendance: {
                currentPeriod: `${currentYear}-${currentMonth.toString().padStart(2, '0')}`,
                employeesWithLateRecords: totalLateRecords,
                punishmentTriggered: punishmentTriggeredCount
            },
            systemHealth: {
                timestamp: now,
                activeCampaignsHealthy: activeCampaigns < 10, // 超過10個活動視為異常
                punishmentRateHealthy: totalLateRecords > 0 ? (punishmentTriggeredCount / totalLateRecords) < 0.3 : true
            }
        };
        
        responseHelper.success(res, statistics, '自動投票系統統計獲取成功');
        
    } catch (error) {
        logger.error('獲取自動投票統計失敗:', error);
        responseHelper.error(res, error.message, 'GET_VOTING_STATISTICS_FAILED');
    }
});

module.exports = router;