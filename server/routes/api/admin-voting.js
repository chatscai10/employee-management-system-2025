/**
 * =======================================
 * 管理員投票管理 API Routes
 * =======================================
 * 提供管理員查看匿名投票詳情和管理功能
 */

const express = require('express');
const router = express.Router();
const { getModels } = require('../../models');
const logger = require('../../utils/logger');
const responseHelper = require('../../utils/responseHelper');

/**
 * 獲取投票活動的完整投票記錄（管理員專用）
 * GET /api/admin/voting/campaigns/:id/votes
 */
router.get('/campaigns/:id/votes', async (req, res) => {
    try {
        const models = getModels();
        const { id } = req.params;
        const { includeEmployeeInfo = 'true', page = 1, limit = 50 } = req.query;

        // 檢查投票活動是否存在
        const campaign = await models.PromotionCampaign.findByPk(id);
        if (!campaign) {
            return responseHelper.error(res, '找不到投票活動', 'CAMPAIGN_NOT_FOUND', 404);
        }

        // 計算分頁
        const offset = (parseInt(page) - 1) * parseInt(limit);

        // 基礎投票查詢
        let voteQuery = {
            where: { campaignId: id },
            attributes: [
                'id',
                'candidateId', 
                'voterToken',
                'voterFingerprint',
                'voteRanking',
                'voteWeight',
                'voteReason',
                'votedAt',
                'isValid',
                'modificationCount',
                'originalDecision',
                'currentDecision',
                'lastModifiedAt'
            ],
            include: [{
                model: models.PromotionCandidate,
                as: 'Candidate',
                attributes: ['anonymousId', 'candidateName', 'currentPosition']
            }],
            order: [['votedAt', 'DESC']],
            offset,
            limit: parseInt(limit)
        };

        const votes = await models.PromotionVote.findAndCountAll(voteQuery);

        // 如果需要包含員工資訊，進行反向解析
        let enhancedVotes = votes.rows;
        if (includeEmployeeInfo === 'true') {
            enhancedVotes = await Promise.all(votes.rows.map(async (vote) => {
                // 通過voterFingerprint反向查找員工
                const employee = await findEmployeeByFingerprint(vote.voterFingerprint, id);
                
                return {
                    ...vote.toJSON(),
                    employeeInfo: employee ? {
                        id: employee.id,
                        name: employee.name,
                        position: employee.position,
                        currentStore: employee.currentStore
                    } : null,
                    // 保留匿名性，但提供管理查看
                    adminNotes: {
                        isAnonymous: campaign.isAnonymous,
                        canViewEmployeeInfo: true,
                        voterTokenPrefix: vote.voterToken?.substring(0, 8) + '...'
                    }
                };
            }));
        }

        // 統計信息
        const statistics = await getVoteStatistics(id);

        responseHelper.success(res, {
            campaign: {
                id: campaign.id,
                campaignName: campaign.campaignName,
                isAnonymous: campaign.isAnonymous,
                totalVotes: campaign.totalVotes,
                totalVoters: campaign.totalVoters
            },
            votes: enhancedVotes,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(votes.count / parseInt(limit)),
                totalVotes: votes.count,
                limit: parseInt(limit)
            },
            statistics
        }, '管理員投票詳情獲取成功');

    } catch (error) {
        logger.error('管理員獲取投票詳情失敗:', error);
        responseHelper.error(res, error.message, 'GET_ADMIN_VOTES_FAILED');
    }
});

// 緩存員工指紋映射以提升性能
const employeeFingerprintCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5分鐘緩存

/**
 * 通過指紋反向查找員工 - 優化版本
 */
async function findEmployeeByFingerprint(voterFingerprint, campaignId) {
    try {
        const models = getModels();
        const cacheKey = `${campaignId}_fingerprints`;
        
        // 檢查緩存
        let fingerprintMap = employeeFingerprintCache.get(cacheKey);
        
        if (!fingerprintMap || Date.now() - fingerprintMap.timestamp > CACHE_TTL) {
            // 重新構建緩存
            fingerprintMap = {
                map: new Map(),
                timestamp: Date.now()
            };
            
            const employees = await models.Employee.findAll({
                where: { status: '在職' },
                attributes: ['id', 'name', 'position', 'currentStore']
            });

            for (const employee of employees) {
                const testFingerprint = models.PromotionVote.generateVoterFingerprint(employee.id, campaignId);
                fingerprintMap.map.set(testFingerprint, employee);
            }
            
            employeeFingerprintCache.set(cacheKey, fingerprintMap);
        }

        return fingerprintMap.map.get(voterFingerprint) || null;
        
    } catch (error) {
        logger.error('反向查找員工失敗:', error);
        return null;
    }
}

/**
 * 獲取投票統計
 */
async function getVoteStatistics(campaignId) {
    try {
        const models = getModels();
        
        const [
            totalVotes,
            validVotes,
            invalidVotes,
            modifiedVotes,
            agreeVotes,
            disagreeVotes,
            abstainVotes
        ] = await Promise.all([
            models.PromotionVote.count({ where: { campaignId } }),
            models.PromotionVote.count({ where: { campaignId, isValid: true } }),
            models.PromotionVote.count({ where: { campaignId, isValid: false } }),
            models.PromotionVote.count({ where: { campaignId, modificationCount: { [models.PromotionVote.sequelize.Sequelize.Op.gt]: 0 } } }),
            models.PromotionVote.count({ where: { campaignId, currentDecision: 'agree', isValid: true } }),
            models.PromotionVote.count({ where: { campaignId, currentDecision: 'disagree', isValid: true } }),
            models.PromotionVote.count({ where: { campaignId, currentDecision: 'abstain', isValid: true } })
        ]);

        const agreePercentage = validVotes > 0 ? ((agreeVotes / validVotes) * 100).toFixed(2) : 0;
        const disagreePercentage = validVotes > 0 ? ((disagreeVotes / validVotes) * 100).toFixed(2) : 0;
        const abstainPercentage = validVotes > 0 ? ((abstainVotes / validVotes) * 100).toFixed(2) : 0;

        return {
            totalVotes,
            validVotes,
            invalidVotes,
            modifiedVotes,
            decisions: {
                agree: { count: agreeVotes, percentage: agreePercentage },
                disagree: { count: disagreeVotes, percentage: disagreePercentage },
                abstain: { count: abstainVotes, percentage: abstainPercentage }
            },
            modificationRate: totalVotes > 0 ? ((modifiedVotes / totalVotes) * 100).toFixed(2) : 0
        };
    } catch (error) {
        logger.error('獲取投票統計失敗:', error);
        return null;
    }
}

/**
 * 獲取投票修改歷史（管理員專用）
 * GET /api/admin/voting/campaigns/:id/modification-history
 */
router.get('/campaigns/:id/modification-history', async (req, res) => {
    try {
        const models = getModels();
        const { id } = req.params;

        const modificationHistory = await models.VoteModificationHistory.findAll({
            where: { campaignId: id },
            order: [['modifiedAt', 'DESC']],
            limit: 100 // 限制返回最近100條記錄
        });

        // 增強修改歷史，添加員工信息
        const enhancedHistory = await Promise.all(modificationHistory.map(async (record) => {
            const employee = await models.Employee.findByPk(record.employeeId, {
                attributes: ['id', 'name', 'position', 'currentStore']
            });

            return {
                ...record.toJSON(),
                employeeInfo: employee ? {
                    id: employee.id,
                    name: employee.name,
                    position: employee.position,
                    currentStore: employee.currentStore
                } : null
            };
        }));

        responseHelper.success(res, {
            campaignId: id,
            totalModifications: modificationHistory.length,
            modifications: enhancedHistory
        }, '投票修改歷史獲取成功');

    } catch (error) {
        logger.error('獲取投票修改歷史失敗:', error);
        responseHelper.error(res, error.message, 'GET_MODIFICATION_HISTORY_FAILED');
    }
});

/**
 * 管理員投票活動管理操作
 * POST /api/admin/voting/campaigns/:id/actions/:action
 */
router.post('/campaigns/:id/actions/:action', async (req, res) => {
    try {
        const models = getModels();
        const { id, action } = req.params;
        const { reason, adminId } = req.body;

        const campaign = await models.PromotionCampaign.findByPk(id);
        if (!campaign) {
            return responseHelper.error(res, '找不到投票活動', 'CAMPAIGN_NOT_FOUND', 404);
        }

        let result = {};

        switch (action) {
            case 'force-close':
                await campaign.update({
                    status: 'closed',
                    endDate: new Date(),
                    adminNotes: `管理員強制關閉：${reason || '無備註'}`
                });
                result = { action: 'force-close', message: '投票活動已強制關閉' };
                break;

            case 'extend':
                const { extendDays } = req.body;
                if (!extendDays || extendDays < 1) {
                    return responseHelper.error(res, '延長天數必須大於0', 'INVALID_EXTEND_DAYS');
                }
                
                const newEndDate = new Date(campaign.endDate);
                newEndDate.setDate(newEndDate.getDate() + parseInt(extendDays));
                
                await campaign.update({
                    endDate: newEndDate,
                    adminNotes: `管理員延長投票：${extendDays}天，理由：${reason || '無備註'}`
                });
                result = { 
                    action: 'extend', 
                    message: `投票活動已延長${extendDays}天`,
                    newEndDate: newEndDate
                };
                break;

            case 'invalidate-vote':
                const { voteId } = req.body;
                const vote = await models.PromotionVote.findByPk(voteId);
                if (!vote) {
                    return responseHelper.error(res, '找不到投票記錄', 'VOTE_NOT_FOUND', 404);
                }
                
                await vote.update({
                    isValid: false,
                    validationNotes: `管理員作廢：${reason || '無備註'}`
                });
                result = { action: 'invalidate-vote', message: '投票記錄已作廢' };
                break;

            default:
                return responseHelper.error(res, '不支援的操作', 'UNSUPPORTED_ACTION');
        }

        // 記錄管理操作
        logger.info('管理員投票操作', {
            action,
            campaignId: id,
            adminId,
            reason,
            timestamp: new Date()
        });

        responseHelper.success(res, result, '管理操作執行成功');

    } catch (error) {
        logger.error('管理員投票操作失敗:', error);
        responseHelper.error(res, error.message, 'ADMIN_ACTION_FAILED');
    }
});

/**
 * 獲取系統投票健康度報告
 * GET /api/admin/voting/health-report
 */
router.get('/health-report', async (req, res) => {
    try {
        const models = getModels();
        const now = new Date();

        // 基礎統計
        const [
            totalCampaigns,
            activeCampaigns,
            expiredCampaigns,
            systemCampaigns,
            totalVotes,
            invalidVotes
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
                where: {
                    status: 'active',
                    endDate: { [models.PromotionCampaign.sequelize.Sequelize.Op.lt]: now }
                }
            }),
            models.PromotionCampaign.count({ where: { systemGenerated: true } }),
            models.PromotionVote.count(),
            models.PromotionVote.count({ where: { isValid: false } })
        ]);

        // 健康度評分
        let healthScore = 100;
        const issues = [];

        if (expiredCampaigns > 5) {
            healthScore -= 20;
            issues.push(`過多未處理的到期活動: ${expiredCampaigns}個`);
        }

        if (activeCampaigns > 10) {
            healthScore -= 15;
            issues.push(`同時進行的活動過多: ${activeCampaigns}個`);
        }

        const invalidRate = totalVotes > 0 ? (invalidVotes / totalVotes) * 100 : 0;
        if (invalidRate > 5) {
            healthScore -= 25;
            issues.push(`無效投票比例過高: ${invalidRate.toFixed(2)}%`);
        }

        const healthReport = {
            timestamp: now,
            healthScore,
            healthLevel: healthScore >= 80 ? 'healthy' : healthScore >= 60 ? 'warning' : 'critical',
            statistics: {
                totalCampaigns,
                activeCampaigns,
                expiredCampaigns,
                systemCampaigns,
                totalVotes,
                invalidVotes,
                invalidRate: invalidRate.toFixed(2) + '%'
            },
            issues,
            recommendations: generateRecommendations(healthScore, issues)
        };

        responseHelper.success(res, healthReport, '投票系統健康度報告獲取成功');

    } catch (error) {
        logger.error('獲取投票健康度報告失敗:', error);
        responseHelper.error(res, error.message, 'GET_HEALTH_REPORT_FAILED');
    }
});

/**
 * 生成改善建議
 */
function generateRecommendations(healthScore, issues) {
    const recommendations = [];

    if (healthScore < 80) {
        recommendations.push('建議定期執行系統維護，處理到期的投票活動');
    }

    if (issues.some(issue => issue.includes('到期活動'))) {
        recommendations.push('啟用自動化任務處理到期投票活動');
    }

    if (issues.some(issue => issue.includes('活動過多'))) {
        recommendations.push('考慮限制同時進行的投票活動數量');
    }

    if (issues.some(issue => issue.includes('無效投票'))) {
        recommendations.push('檢查投票驗證機制，加強投票資格審查');
    }

    if (recommendations.length === 0) {
        recommendations.push('系統運行良好，持續監控即可');
    }

    return recommendations;
}

module.exports = router;