/**
 * =======================================
 * 申訴機制 API Routes
 * =======================================
 * 提供投票結果申訴和撤銷功能的完整API接口
 */

const express = require('express');
const router = express.Router();
const { getModels } = require('../models');
const logger = require('../utils/logger');
const responseHelper = require('../utils/responseHelper');
const TelegramNotificationService = require('../services/TelegramNotificationService');

/**
 * 提交申訴
 * POST /api/appeals
 */
router.post('/', async (req, res) => {
    try {
        const models = getModels();
        const {
            campaignId,
            appealingEmployeeId,
            targetEmployeeId,
            appealType,
            appealReason,
            evidenceFiles,
            supportingEmployees
        } = req.body;

        // 基本驗證
        if (!campaignId || !appealingEmployeeId || !appealType || !appealReason) {
            return responseHelper.error(res, '缺少必要的申訴信息', 'MISSING_REQUIRED_FIELDS');
        }

        // 創建申訴
        const appeal = await models.VoteAppeal.createAppeal({
            campaignId,
            appealingEmployeeId,
            targetEmployeeId,
            appealType,
            appealReason,
            evidenceFiles: evidenceFiles || [],
            supportingEmployees: supportingEmployees || []
        });

        // 載入完整的申訴信息
        const fullAppeal = await models.VoteAppeal.findByPk(appeal.id, {
            include: ['Campaign', 'Appellant', 'TargetEmployee']
        });

        // 發送申訴提交確認通知
        try {
            await TelegramNotificationService.sendNotification('appeal_submitted', {
                campaignName: fullAppeal.Campaign.campaignName,
                appealType: fullAppeal.appealType,
                submittedAt: fullAppeal.appealSubmittedAt.toLocaleString('zh-TW'),
                expectedReviewTime: this.getExpectedReviewTime(fullAppeal.appealType),
                appealId: fullAppeal.id
            }, [`user_${appealingEmployeeId}`]);
        } catch (notificationError) {
            logger.warn('發送申訴確認通知失敗:', notificationError);
        }

        // 通知管理員有新申訴需要處理
        try {
            await TelegramNotificationService.sendNotification('appeal_review_reminder', {
                appealId: fullAppeal.id,
                appellant: fullAppeal.Appellant.name,
                campaignName: fullAppeal.Campaign.campaignName,
                submittedAt: fullAppeal.appealSubmittedAt.toLocaleString('zh-TW')
            });
        } catch (notificationError) {
            logger.warn('發送申訴提醒通知失敗:', notificationError);
        }

        responseHelper.success(res, fullAppeal, '申訴提交成功', 201);

    } catch (error) {
        logger.error('提交申訴失敗:', error);
        responseHelper.error(res, error.message, 'SUBMIT_APPEAL_FAILED');
    }
});

/**
 * 獲取申訴列表
 * GET /api/appeals
 */
router.get('/', async (req, res) => {
    try {
        const models = getModels();
        const {
            status,
            appealType,
            employeeId,
            campaignId,
            page = 1,
            limit = 20
        } = req.query;

        // 構建查詢條件
        const whereClause = {};
        if (status) whereClause.appealStatus = status;
        if (appealType) whereClause.appealType = appealType;
        if (employeeId) whereClause.appealingEmployeeId = employeeId;
        if (campaignId) whereClause.campaignId = campaignId;

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const appeals = await models.VoteAppeal.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: models.PromotionCampaign,
                    as: 'Campaign',
                    attributes: ['id', 'campaignName', 'campaignType', 'endDate']
                },
                {
                    model: models.Employee,
                    as: 'Appellant',
                    attributes: ['id', 'name', 'position', 'currentStore']
                },
                {
                    model: models.Employee,
                    as: 'TargetEmployee',
                    attributes: ['id', 'name', 'position']
                },
                {
                    model: models.Employee,
                    as: 'Reviewer',
                    attributes: ['id', 'name', 'position']
                }
            ],
            order: [
                ['priority', 'DESC'],
                ['appealSubmittedAt', 'DESC']
            ],
            offset,
            limit: parseInt(limit)
        });

        responseHelper.success(res, {
            appeals: appeals.rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(appeals.count / parseInt(limit)),
                totalItems: appeals.count,
                limit: parseInt(limit)
            }
        }, '申訴列表獲取成功');

    } catch (error) {
        logger.error('獲取申訴列表失敗:', error);
        responseHelper.error(res, error.message, 'GET_APPEALS_FAILED');
    }
});

/**
 * 獲取申訴詳情
 * GET /api/appeals/:id
 */
router.get('/:id', async (req, res) => {
    try {
        const models = getModels();
        const { id } = req.params;

        const appeal = await models.VoteAppeal.findByPk(id, {
            include: [
                {
                    model: models.PromotionCampaign,
                    as: 'Campaign'
                },
                {
                    model: models.Employee,
                    as: 'Appellant'
                },
                {
                    model: models.Employee,
                    as: 'TargetEmployee'
                },
                {
                    model: models.Employee,
                    as: 'Reviewer'
                }
            ]
        });

        if (!appeal) {
            return responseHelper.error(res, '申訴記錄不存在', 'APPEAL_NOT_FOUND', 404);
        }

        // 添加處理時間信息
        const appealData = appeal.toJSON();
        appealData.processingTime = appeal.calculateProcessingTime();
        appealData.isOverdue = appeal.isOverdue();
        appealData.canBeWithdrawn = appeal.canBeWithdrawn();
        appealData.isWithinDeadline = appeal.isWithinDeadline();

        responseHelper.success(res, appealData, '申訴詳情獲取成功');

    } catch (error) {
        logger.error('獲取申訴詳情失敗:', error);
        responseHelper.error(res, error.message, 'GET_APPEAL_DETAIL_FAILED');
    }
});

/**
 * 審核申訴
 * POST /api/appeals/:id/review
 */
router.post('/:id/review', async (req, res) => {
    try {
        const models = getModels();
        const { id } = req.params;
        const {
            reviewerId,
            decision, // 'approved' | 'rejected'
            reviewNotes,
            reviewDecision,
            appealOutcome,
            investigationNotes
        } = req.body;

        const appeal = await models.VoteAppeal.findByPk(id, {
            include: ['Campaign', 'Appellant', 'TargetEmployee']
        });

        if (!appeal) {
            return responseHelper.error(res, '申訴記錄不存在', 'APPEAL_NOT_FOUND', 404);
        }

        if (!['pending', 'under_review'].includes(appeal.appealStatus)) {
            return responseHelper.error(res, '該申訴已處理完成，無法再次審核', 'APPEAL_ALREADY_PROCESSED');
        }

        // 更新申訴狀態
        await appeal.update({
            appealStatus: decision,
            reviewedBy: reviewerId,
            reviewedAt: new Date(),
            reviewNotes,
            reviewDecision,
            appealOutcome,
            investigationNotes
        });

        // 如果申訴被批准，可能需要執行相應的補救措施
        if (decision === 'approved' && appealOutcome) {
            await this.executeAppealOutcome(appeal, appealOutcome);
        }

        // 發送審核結果通知
        try {
            const notificationTemplate = decision === 'approved' ? 'appeal_approved' : 'appeal_rejected';
            await TelegramNotificationService.sendNotification(notificationTemplate, {
                appealId: appeal.id,
                campaignName: appeal.Campaign.campaignName,
                appellant: appeal.Appellant.name,
                reviewDecision: reviewDecision,
                reviewedAt: new Date().toLocaleString('zh-TW')
            }, [`user_${appeal.appealingEmployeeId}`]);
        } catch (notificationError) {
            logger.warn('發送審核結果通知失敗:', notificationError);
        }

        responseHelper.success(res, appeal, '申訴審核完成');

    } catch (error) {
        logger.error('審核申訴失敗:', error);
        responseHelper.error(res, error.message, 'REVIEW_APPEAL_FAILED');
    }
});

/**
 * 撤回申訴
 * POST /api/appeals/:id/withdraw
 */
router.post('/:id/withdraw', async (req, res) => {
    try {
        const models = getModels();
        const { id } = req.params;
        const { reason } = req.body;

        const appeal = await models.VoteAppeal.findByPk(id, {
            include: ['Campaign', 'Appellant']
        });

        if (!appeal) {
            return responseHelper.error(res, '申訴記錄不存在', 'APPEAL_NOT_FOUND', 404);
        }

        if (!appeal.canBeWithdrawn()) {
            return responseHelper.error(res, '該申訴目前無法撤回', 'APPEAL_CANNOT_BE_WITHDRAWN');
        }

        // 更新申訴狀態
        await appeal.update({
            appealStatus: 'withdrawn',
            reviewNotes: `申訴人主動撤回。原因：${reason || '無原因說明'}`
        });

        logger.info(`申訴撤回: ID ${id}, 申訴人 ${appeal.Appellant.name}`);

        responseHelper.success(res, appeal, '申訴撤回成功');

    } catch (error) {
        logger.error('撤回申訴失敗:', error);
        responseHelper.error(res, error.message, 'WITHDRAW_APPEAL_FAILED');
    }
});

/**
 * 獲取待處理申訴
 * GET /api/appeals/pending
 */
router.get('/status/pending', async (req, res) => {
    try {
        const models = getModels();

        const pendingAppeals = await models.VoteAppeal.getPendingAppeals();

        responseHelper.success(res, pendingAppeals, '待處理申訴獲取成功');

    } catch (error) {
        logger.error('獲取待處理申訴失敗:', error);
        responseHelper.error(res, error.message, 'GET_PENDING_APPEALS_FAILED');
    }
});

/**
 * 獲取過期申訴
 * GET /api/appeals/overdue
 */
router.get('/status/overdue', async (req, res) => {
    try {
        const models = getModels();

        const overdueAppeals = await models.VoteAppeal.getOverdueAppeals();

        responseHelper.success(res, overdueAppeals, '過期申訴獲取成功');

    } catch (error) {
        logger.error('獲取過期申訴失敗:', error);
        responseHelper.error(res, error.message, 'GET_OVERDUE_APPEALS_FAILED');
    }
});

/**
 * 獲取申訴統計
 * GET /api/appeals/statistics
 */
router.get('/report/statistics', async (req, res) => {
    try {
        const models = getModels();
        const { startDate, endDate } = req.query;

        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        const statistics = await models.VoteAppeal.getAppealStatistics(start, end);

        responseHelper.success(res, statistics, '申訴統計獲取成功');

    } catch (error) {
        logger.error('獲取申訴統計失敗:', error);
        responseHelper.error(res, error.message, 'GET_APPEAL_STATISTICS_FAILED');
    }
});

/**
 * 檢查申訴資格
 * POST /api/appeals/check-eligibility
 */
router.post('/check-eligibility', async (req, res) => {
    try {
        const models = getModels();
        const { campaignId, employeeId, appealType } = req.body;

        const eligibility = await models.VoteAppeal.checkAppealEligibility(
            campaignId,
            employeeId,
            appealType
        );

        responseHelper.success(res, eligibility, '申訴資格檢查完成');

    } catch (error) {
        logger.error('檢查申訴資格失敗:', error);
        responseHelper.error(res, error.message, 'CHECK_APPEAL_ELIGIBILITY_FAILED');
    }
});

/**
 * 輔助函數：獲取預期審核時間
 */
function getExpectedReviewTime(appealType) {
    const reviewTimes = {
        'vote_manipulation': 1,
        'demotion_result': 2,
        'promotion_result': 3,
        'unfair_process': 5
    };
    return reviewTimes[appealType] || 3;
}

/**
 * 輔助函數：執行申訴結果
 */
async function executeAppealOutcome(appeal, outcome) {
    try {
        const models = getModels();
        
        switch (outcome) {
            case 'revote':
                // 觸發重新投票
                logger.info(`執行申訴結果 - 重新投票: 活動 ${appeal.campaignId}`);
                // 這裡可以整合重新投票邏輯
                break;
                
            case 'direct_override':
                // 直接推翻決定
                logger.info(`執行申訴結果 - 推翻決定: 活動 ${appeal.campaignId}`);
                break;
                
            case 'position_restored':
                // 恢復職位
                if (appeal.targetEmployeeId) {
                    logger.info(`執行申訴結果 - 恢復職位: 員工 ${appeal.targetEmployeeId}`);
                    // 這裡可以整合職位恢復邏輯
                }
                break;
                
            case 'maintain_result':
            default:
                // 維持原結果，無需額外操作
                break;
        }
        
    } catch (error) {
        logger.error('執行申訴結果失敗:', error);
    }
}

module.exports = router;