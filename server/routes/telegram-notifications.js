/**
 * =======================================
 * Telegram通知系統 API Routes
 * =======================================
 * 提供29種通知模板的管理和發送接口
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const responseHelper = require('../utils/responseHelper');
const TelegramNotificationService = require('../services/TelegramNotificationService');

/**
 * 獲取所有通知模板
 * GET /api/telegram/templates
 */
router.get('/templates', async (req, res) => {
    try {
        const templates = TelegramNotificationService.templates;
        const templateList = Object.keys(templates).map(key => ({
            name: key,
            ...templates[key]
        }));

        responseHelper.success(res, {
            templates: templateList,
            totalCount: templateList.length,
            categories: {
                campaign: templateList.filter(t => t.name.startsWith('campaign')).length,
                personal: ['vote_submitted', 'vote_modified', 'modification_limit_warning', 'voting_eligibility_granted', 'personal_vote_reminder', 'vote_invalidated', 'appeal_submitted'].length,
                auto_voting: ['auto_promotion_triggered', 'auto_demotion_triggered', 'promotion_approved', 'promotion_rejected', 'demotion_executed', 'demotion_rejected'].length,
                system: ['system_health_warning', 'scheduled_job_report', 'data_anomaly_detected', 'low_participation_warning'].length,
                admin: ['appeal_review_reminder', 'voting_audit_alert', 'admin_action_logged', 'weekly_statistics_report'].length
            }
        }, '通知模板列表獲取成功');

    } catch (error) {
        logger.error('獲取通知模板失敗:', error);
        responseHelper.error(res, error.message, 'GET_TEMPLATES_FAILED');
    }
});

/**
 * 獲取特定通知模板
 * GET /api/telegram/templates/:templateName
 */
router.get('/templates/:templateName', async (req, res) => {
    try {
        const { templateName } = req.params;
        const template = TelegramNotificationService.templates[templateName];

        if (!template) {
            return responseHelper.error(res, '通知模板不存在', 'TEMPLATE_NOT_FOUND', 404);
        }

        responseHelper.success(res, {
            name: templateName,
            ...template
        }, '通知模板獲取成功');

    } catch (error) {
        logger.error('獲取通知模板失敗:', error);
        responseHelper.error(res, error.message, 'GET_TEMPLATE_FAILED');
    }
});

/**
 * 發送通知
 * POST /api/telegram/send
 */
router.post('/send', async (req, res) => {
    try {
        const { templateName, data, recipients } = req.body;

        if (!templateName) {
            return responseHelper.error(res, '缺少通知模板名稱', 'MISSING_TEMPLATE_NAME');
        }

        if (!data) {
            return responseHelper.error(res, '缺少通知數據', 'MISSING_NOTIFICATION_DATA');
        }

        const result = await TelegramNotificationService.sendNotification(
            templateName,
            data,
            recipients
        );

        responseHelper.success(res, result, '通知發送完成');

    } catch (error) {
        logger.error('發送通知失敗:', error);
        responseHelper.error(res, error.message, 'SEND_NOTIFICATION_FAILED');
    }
});

/**
 * 批量發送通知
 * POST /api/telegram/send-batch
 */
router.post('/send-batch', async (req, res) => {
    try {
        const { notifications } = req.body;

        if (!Array.isArray(notifications) || notifications.length === 0) {
            return responseHelper.error(res, '缺少通知列表或列表為空', 'MISSING_NOTIFICATIONS');
        }

        const results = await TelegramNotificationService.sendBatchNotifications(notifications);

        const successCount = results.filter(r => r.result.success).length;
        const totalCount = results.length;

        responseHelper.success(res, {
            results,
            summary: {
                total: totalCount,
                successful: successCount,
                failed: totalCount - successCount,
                successRate: totalCount > 0 ? ((successCount / totalCount) * 100).toFixed(2) : 0
            }
        }, '批量通知發送完成');

    } catch (error) {
        logger.error('批量發送通知失敗:', error);
        responseHelper.error(res, error.message, 'SEND_BATCH_NOTIFICATIONS_FAILED');
    }
});

/**
 * 測試通知模板
 * POST /api/telegram/test/:templateName
 */
router.post('/test/:templateName', async (req, res) => {
    try {
        const { templateName } = req.params;
        const { testData } = req.body;

        const result = await TelegramNotificationService.testNotification(templateName, testData);

        responseHelper.success(res, result, '測試通知發送成功');

    } catch (error) {
        logger.error('測試通知發送失敗:', error);
        responseHelper.error(res, error.message, 'TEST_NOTIFICATION_FAILED');
    }
});

/**
 * 投票活動通知觸發
 * POST /api/telegram/campaign-notifications
 */
router.post('/campaign-notifications', async (req, res) => {
    try {
        const { campaignId, notificationType, customData } = req.body;

        if (!campaignId || !notificationType) {
            return responseHelper.error(res, '缺少活動ID或通知類型', 'MISSING_REQUIRED_PARAMS');
        }

        // 根據活動ID獲取相關數據
        const campaignData = await getCampaignNotificationData(campaignId);
        const data = { ...campaignData, ...customData };

        const result = await TelegramNotificationService.sendNotification(notificationType, data);

        responseHelper.success(res, result, '活動通知發送成功');

    } catch (error) {
        logger.error('發送活動通知失敗:', error);
        responseHelper.error(res, error.message, 'SEND_CAMPAIGN_NOTIFICATION_FAILED');
    }
});

/**
 * 自動投票通知觸發
 * POST /api/telegram/auto-voting-notifications
 */
router.post('/auto-voting-notifications', async (req, res) => {
    try {
        const { employeeId, notificationType, voteData } = req.body;

        if (!employeeId || !notificationType) {
            return responseHelper.error(res, '缺少員工ID或通知類型', 'MISSING_REQUIRED_PARAMS');
        }

        // 根據員工ID獲取相關數據
        const employeeData = await getEmployeeNotificationData(employeeId);
        const data = { ...employeeData, ...voteData };

        const result = await TelegramNotificationService.sendNotification(notificationType, data);

        responseHelper.success(res, result, '自動投票通知發送成功');

    } catch (error) {
        logger.error('發送自動投票通知失敗:', error);
        responseHelper.error(res, error.message, 'SEND_AUTO_VOTING_NOTIFICATION_FAILED');
    }
});

/**
 * 系統監控通知觸發
 * POST /api/telegram/system-notifications
 */
router.post('/system-notifications', async (req, res) => {
    try {
        const { notificationType, systemData } = req.body;

        if (!notificationType) {
            return responseHelper.error(res, '缺少通知類型', 'MISSING_NOTIFICATION_TYPE');
        }

        const result = await TelegramNotificationService.sendNotification(notificationType, systemData);

        responseHelper.success(res, result, '系統通知發送成功');

    } catch (error) {
        logger.error('發送系統通知失敗:', error);
        responseHelper.error(res, error.message, 'SEND_SYSTEM_NOTIFICATION_FAILED');
    }
});

/**
 * 獲取通知統計
 * GET /api/telegram/statistics
 */
router.get('/statistics', async (req, res) => {
    try {
        const stats = TelegramNotificationService.getNotificationStatistics();

        responseHelper.success(res, stats, '通知統計獲取成功');

    } catch (error) {
        logger.error('獲取通知統計失敗:', error);
        responseHelper.error(res, error.message, 'GET_STATISTICS_FAILED');
    }
});

/**
 * 獲取群組配置
 * GET /api/telegram/groups
 */
router.get('/groups', async (req, res) => {
    try {
        const groups = TelegramNotificationService.groups;

        responseHelper.success(res, {
            groups,
            totalGroups: Object.keys(groups).length,
            groupTypes: Object.keys(groups)
        }, '群組配置獲取成功');

    } catch (error) {
        logger.error('獲取群組配置失敗:', error);
        responseHelper.error(res, error.message, 'GET_GROUPS_FAILED');
    }
});

/**
 * 輔助函數：獲取活動通知數據
 */
async function getCampaignNotificationData(campaignId) {
    try {
        const { getModels } = require('../models');
        const models = getModels();

        const campaign = await models.PromotionCampaign.findByPk(campaignId, {
            include: [
                {
                    model: models.PromotionCandidate,
                    as: 'Candidates',
                    include: [{
                        model: models.Employee,
                        as: 'Employee'
                    }]
                }
            ]
        });

        if (!campaign) {
            throw new Error(`投票活動不存在: ${campaignId}`);
        }

        // 計算投票統計
        const voteStats = await calculateVoteStatistics(campaignId);

        return {
            campaignId: campaign.id,
            campaignName: campaign.campaignName,
            campaignType: campaign.campaignType,
            startDate: campaign.startDate?.toLocaleDateString('zh-TW'),
            endDate: campaign.endDate?.toLocaleDateString('zh-TW'),
            totalVotes: voteStats.totalVotes || 0,
            totalVoters: voteStats.totalVoters || 0,
            agreeVotes: voteStats.agreeVotes || 0,
            disagreeVotes: voteStats.disagreeVotes || 0,
            agreePercentage: voteStats.agreePercentage || 0,
            disagreePercentage: voteStats.disagreePercentage || 0,
            participationRate: voteStats.participationRate || 0,
            candidates: campaign.Candidates?.map(c => ({
                name: c.Employee?.name,
                position: c.Employee?.position
            })) || []
        };

    } catch (error) {
        logger.error(`獲取活動通知數據失敗: ${campaignId}`, error);
        throw error;
    }
}

/**
 * 輔助函數：獲取員工通知數據
 */
async function getEmployeeNotificationData(employeeId) {
    try {
        const { getModels } = require('../models');
        const models = getModels();

        const employee = await models.Employee.findByPk(employeeId);
        if (!employee) {
            throw new Error(`員工不存在: ${employeeId}`);
        }

        return {
            employeeId: employee.id,
            employeeName: employee.name,
            position: employee.position,
            currentStore: employee.currentStore,
            hireDate: employee.hireDate?.toLocaleDateString('zh-TW'),
            workingDays: Math.floor((new Date() - new Date(employee.hireDate)) / (1000 * 60 * 60 * 24))
        };

    } catch (error) {
        logger.error(`獲取員工通知數據失敗: ${employeeId}`, error);
        throw error;
    }
}

/**
 * 輔助函數：計算投票統計
 */
async function calculateVoteStatistics(campaignId) {
    try {
        const { getModels } = require('../models');
        const models = getModels();

        const votes = await models.PromotionVote.findAll({
            where: { 
                campaignId,
                isValid: true 
            }
        });

        const totalVotes = votes.length;
        const agreeVotes = votes.filter(v => v.currentDecision === 'agree').length;
        const disagreeVotes = votes.filter(v => v.currentDecision === 'disagree').length;

        const agreePercentage = totalVotes > 0 ? ((agreeVotes / totalVotes) * 100).toFixed(2) : 0;
        const disagreePercentage = totalVotes > 0 ? ((disagreeVotes / totalVotes) * 100).toFixed(2) : 0;

        // 計算參與率 (需要知道符合資格的總人數)
        const eligibleVoters = await models.Employee.count({
            where: { status: '在職' }
        });
        const participationRate = eligibleVoters > 0 ? ((totalVotes / eligibleVoters) * 100).toFixed(2) : 0;

        return {
            totalVotes,
            totalVoters: totalVotes, // 假設每人只投一票
            agreeVotes,
            disagreeVotes,
            agreePercentage: parseFloat(agreePercentage),
            disagreePercentage: parseFloat(disagreePercentage),
            participationRate: parseFloat(participationRate)
        };

    } catch (error) {
        logger.error(`計算投票統計失敗: ${campaignId}`, error);
        return {
            totalVotes: 0,
            totalVoters: 0,
            agreeVotes: 0,
            disagreeVotes: 0,
            agreePercentage: 0,
            disagreePercentage: 0,
            participationRate: 0
        };
    }
}

module.exports = router;