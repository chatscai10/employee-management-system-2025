const express = require('express');
const router = express.Router();
const { getModels } = require('../models');
const logger = require('../utils/logger');

/**
 * =======================================
 * 升遷投票系統 API Routes  
 * =======================================
 * 實現完全匿名的升遷投票機制
 */

/**
 * 獲取所有投票活動 (用於測試)
 * GET /api/promotion/campaigns
 */
router.get('/campaigns', async (req, res) => {
    try {
        const models = getModels();
        
        const campaigns = await models.PromotionCampaign.findAll({
            include: [
                {
                    model: models.PromotionCandidate,
                    as: 'candidates',
                    include: [{
                        model: models.Employee,
                        as: 'employee',
                        attributes: ['id', 'name', 'position', 'currentStore']
                    }]
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: 50
        });

        res.json({
            success: true,
            data: campaigns.map(campaign => ({
                id: campaign.id,
                campaignName: campaign.campaignName,
                campaignType: campaign.campaignType,
                status: campaign.status,
                startDate: campaign.startDate,
                endDate: campaign.endDate,
                candidateCount: campaign.candidates?.length || 0
            })),
            message: '投票活動列表獲取成功'
        });
        
    } catch (error) {
        console.error('獲取投票活動列表失敗:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * 獲取活動中的升遷投票
 * GET /api/promotion/campaigns/active
 */
router.get('/campaigns/active', async (req, res) => {
    try {
        const models = getModels();
        if (!models.PromotionCampaign || !models.PromotionCandidate) {
            return res.status(500).json({
                success: false,
                error: '模型未初始化'
            });
        }

        const now = new Date();
        const activeCampaigns = await models.PromotionCampaign.findAll({
            where: {
                status: 'active',
                startDate: { [models.PromotionCampaign.sequelize.Sequelize.Op.lte]: now },
                endDate: { [models.PromotionCampaign.sequelize.Sequelize.Op.gte]: now }
            },
            include: [{
                model: models.PromotionCandidate,
                as: 'PromotionCandidates',
                where: { status: 'approved' },
                required: false,
                attributes: ['id', 'anonymousId', 'currentPosition', 'yearsOfService', 
                           'candidateStatement', 'qualifications', 'achievements', 
                           'displayOrder', 'voteCount', 'votePercentage']
            }],
            order: [
                ['startDate', 'DESC'],
                [{ model: models.PromotionCandidate, as: 'PromotionCandidates' }, 'displayOrder', 'ASC']
            ]
        });

        const campaigns = activeCampaigns.map(campaign => ({
            id: campaign.id,
            campaignName: campaign.campaignName,
            campaignDescription: campaign.campaignDescription,
            targetPosition: campaign.targetPosition,
            campaignType: campaign.campaignType,
            maxVotesPerPerson: campaign.maxVotesPerPerson,
            startDate: campaign.startDate,
            endDate: campaign.endDate,
            remainingMinutes: campaign.getRemainingMinutes(),
            isAnonymous: campaign.isAnonymous,
            totalVotes: campaign.totalVotes,
            totalVoters: campaign.totalVoters,
            candidates: campaign.PromotionCandidates || []
        }));

        res.json({
            success: true,
            data: campaigns
        });

    } catch (error) {
        logger.error('獲取活動投票失敗:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * 檢查投票資格
 * GET /api/promotion/campaigns/:id/eligibility/:employeeId
 */
router.get('/campaigns/:id/eligibility/:employeeId', async (req, res) => {
    try {
        const models = getModels();
        const { id, employeeId } = req.params;

        // 檢查活動是否存在且進行中
        const campaign = await models.PromotionCampaign.findByPk(id);
        if (!campaign) {
            return res.status(404).json({
                success: false,
                error: '找不到投票活動'
            });
        }

        if (!campaign.isActive()) {
            return res.json({
                success: true,
                data: {
                    eligible: false,
                    reason: '投票活動未進行中',
                    remainingMinutes: campaign.getRemainingMinutes()
                }
            });
        }

        // 檢查員工是否存在
        const employee = await models.Employee.findByPk(employeeId);
        if (!employee) {
            return res.status(404).json({
                success: false,
                error: '員工不存在'
            });
        }

        // 檢查是否已投票
        const hasVoted = await models.PromotionVote.hasVoted(id, employeeId);
        if (hasVoted) {
            return res.json({
                success: true,
                data: {
                    eligible: false,
                    reason: '您已經完成投票',
                    hasVoted: true
                }
            });
        }

        // 檢查投票資格條件
        const eligibleVoterCriteria = campaign.eligibleVoterCriteria || {};
        let eligible = true;
        let eligibilityReason = '';

        // 檢查職位要求
        if (eligibleVoterCriteria.positions && eligibleVoterCriteria.positions.length > 0) {
            if (!eligibleVoterCriteria.positions.includes(employee.position)) {
                eligible = false;
                eligibilityReason = `職位限制：僅限 ${eligibleVoterCriteria.positions.join(', ')} 參與投票`;
            }
        }

        // 檢查服務年資要求
        if (eligible && eligibleVoterCriteria.minYearsOfService) {
            const hireDate = new Date(employee.hireDate);
            const yearsOfService = (new Date() - hireDate) / (1000 * 60 * 60 * 24 * 365);
            if (yearsOfService < eligibleVoterCriteria.minYearsOfService) {
                eligible = false;
                eligibilityReason = `服務年資不足：需滿 ${eligibleVoterCriteria.minYearsOfService} 年`;
            }
        }

        // 檢查分店限制
        if (eligible && eligibleVoterCriteria.stores && eligibleVoterCriteria.stores.length > 0) {
            if (!eligibleVoterCriteria.stores.includes(employee.currentStore)) {
                eligible = false;
                eligibilityReason = `分店限制：僅限 ${eligibleVoterCriteria.stores.join(', ')} 參與投票`;
            }
        }

        res.json({
            success: true,
            data: {
                eligible,
                reason: eligible ? '符合投票資格' : eligibilityReason,
                remainingMinutes: campaign.getRemainingMinutes(),
                hasVoted: false
            }
        });

    } catch (error) {
        logger.error('檢查投票資格失敗:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * 提交匿名投票
 * POST /api/promotion/campaigns/:id/vote
 */
router.post('/campaigns/:id/vote', async (req, res) => {
    try {
        const models = getModels();
        const { id } = req.params;
        const { employeeId, candidateVotes, voteReason, sessionId } = req.body;

        if (!employeeId || !Array.isArray(candidateVotes) || candidateVotes.length === 0) {
            return res.status(400).json({
                success: false,
                error: '缺少必要參數：employeeId, candidateVotes'
            });
        }

        // 檢查活動
        const campaign = await models.PromotionCampaign.findByPk(id);
        if (!campaign || !campaign.isActive()) {
            return res.status(400).json({
                success: false,
                error: '投票活動未進行中'
            });
        }

        // 檢查投票資格
        const eligibilityResponse = await fetch(
            `http://localhost:${process.env.PORT || 3000}/api/promotion/campaigns/${id}/eligibility/${employeeId}`
        );
        const eligibilityData = await eligibilityResponse.json();
        
        if (!eligibilityData.success || !eligibilityData.data.eligible) {
            return res.status(403).json({
                success: false,
                error: eligibilityData.data.reason || '不符合投票資格'
            });
        }

        // 檢查投票數量
        if (candidateVotes.length > campaign.maxVotesPerPerson) {
            return res.status(400).json({
                success: false,
                error: `超過最大投票數限制 (${campaign.maxVotesPerPerson})`
            });
        }

        // 開始事務
        const transaction = await models.PromotionCampaign.sequelize.transaction();

        try {
            const voteRecords = [];
            
            // 創建投票記錄
            for (const vote of candidateVotes) {
                const voteRecord = await models.PromotionVote.createAnonymousVote({
                    campaignId: id,
                    candidateId: vote.candidateId,
                    employeeId: employeeId,
                    voteRanking: vote.ranking || null,
                    voteWeight: vote.weight || 1.00,
                    voteReason: voteReason,
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent'),
                    sessionId: sessionId
                }, { transaction });

                voteRecords.push(voteRecord);
            }

            // 更新候選人投票統計
            const candidates = await models.PromotionCandidate.findAll({
                where: { campaignId: id },
                transaction
            });

            for (const candidate of candidates) {
                const voteCount = await models.PromotionVote.count({
                    where: { 
                        campaignId: id, 
                        candidateId: candidate.id, 
                        isValid: true 
                    },
                    transaction
                });

                await candidate.updateVoteStats(voteCount, campaign.totalVotes + voteRecords.length);
            }

            // 更新活動統計
            const totalVotes = campaign.totalVotes + voteRecords.length;
            const uniqueVoters = await models.PromotionVote.count({
                where: { campaignId: id, isValid: true },
                distinct: true,
                col: 'voterFingerprint',
                transaction
            });

            await campaign.updateVoteStats(totalVotes, uniqueVoters);

            await transaction.commit();

            logger.info('匿名投票提交成功', {
                campaignId: id,
                voteCount: candidateVotes.length,
                voterToken: voteRecords[0]?.voterToken?.substring(0, 8) + '...'
            });

            res.json({
                success: true,
                message: '投票提交成功',
                data: {
                    campaignId: id,
                    voteCount: candidateVotes.length,
                    submittedAt: new Date(),
                    anonymousReceipt: voteRecords[0]?.voterToken?.substring(0, 16) + '...'
                }
            });

        } catch (error) {
            await transaction.rollback();
            throw error;
        }

    } catch (error) {
        logger.error('提交匿名投票失敗:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * 獲取投票活動統計 (管理員)
 * GET /api/promotion/campaigns/:id/statistics
 */
router.get('/campaigns/:id/statistics', async (req, res) => {
    try {
        const models = getModels();
        const { id } = req.params;

        const campaign = await models.PromotionCampaign.findByPk(id);
        if (!campaign) {
            return res.status(404).json({
                success: false,
                error: '找不到投票活動'
            });
        }

        // 獲取投票統計
        const stats = await models.PromotionVote.getCampaignStats(id);
        
        // 獲取候選人詳細統計
        const candidates = await models.PromotionCandidate.findAll({
            where: { campaignId: id },
            order: [['voteCount', 'DESC']]
        });

        const candidateStats = candidates.map((candidate, index) => ({
            anonymousId: candidate.anonymousId,
            candidateName: candidate.candidateName, // 管理員可見真實姓名
            currentPosition: candidate.currentPosition,
            voteCount: candidate.voteCount,
            votePercentage: candidate.votePercentage,
            ranking: index + 1
        }));

        // 投票時間分析 (SQLite compatible) - 修復版本
        const hourlyVotes = await models.PromotionCampaign.sequelize.query(`
            SELECT 
                strftime('%H', votedAt) as hour,
                COUNT(*) as count
            FROM promotion_votes
            WHERE campaignId = :campaignId AND isValid = 1
            GROUP BY strftime('%H', votedAt)
            ORDER BY hour
        `, {
            replacements: { campaignId: id },
            type: models.PromotionCampaign.sequelize.QueryTypes.SELECT
        });

        // 投票完整性檢查
        const integrity = await models.PromotionVote.validateVoteIntegrity(id);

        res.json({
            success: true,
            data: {
                campaign: {
                    id: campaign.id,
                    campaignName: campaign.campaignName,
                    targetPosition: campaign.targetPosition,
                    status: campaign.status,
                    isEnded: campaign.isEnded(),
                    totalVotes: campaign.totalVotes,
                    totalVoters: campaign.totalVoters
                },
                statistics: {
                    ...stats,
                    candidates: candidateStats,
                    hourlyDistribution: hourlyVotes,
                    integrity
                }
            }
        });

    } catch (error) {
        logger.error('獲取投票統計失敗:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * 創建新的升遷投票活動 (管理員)
 * POST /api/promotion/campaigns
 */
router.post('/campaigns', async (req, res) => {
    try {
        const models = getModels();
        const {
            campaignName,
            campaignDescription,
            targetPosition,
            campaignType = 'single_choice',
            maxVotesPerPerson = 1,
            startDate,
            endDate,
            eligibleVoterCriteria,
            createdBy,
            candidates = []
        } = req.body;

        if (!campaignName || !targetPosition || !startDate || !endDate || !createdBy) {
            return res.status(400).json({
                success: false,
                error: '缺少必要參數'
            });
        }

        // 開始事務
        const transaction = await models.PromotionCampaign.sequelize.transaction();

        try {
            // 創建投票活動
            const campaign = await models.PromotionCampaign.create({
                campaignName,
                campaignDescription,
                targetPosition,
                campaignType,
                maxVotesPerPerson,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                status: 'active',
                isAnonymous: true,
                eligibleVoterCriteria,
                createdBy
            }, { transaction });

            // 創建候選人
            const createdCandidates = [];
            for (let i = 0; i < candidates.length; i++) {
                const candidate = candidates[i];
                // 為每個候選人生成基於活動ID和索引的唯一匿名ID
                const anonymousId = `CANDIDATE_${campaign.id}_${(i + 1).toString().padStart(3, '0')}`;
                
                const createdCandidate = await models.PromotionCandidate.create({
                    campaignId: campaign.id,
                    employeeId: candidate.employeeId,
                    candidateName: candidate.candidateName,
                    currentPosition: candidate.currentPosition,
                    currentStore: candidate.currentStore,
                    yearsOfService: candidate.yearsOfService,
                    candidateStatement: candidate.candidateStatement,
                    qualifications: candidate.qualifications,
                    achievements: candidate.achievements,
                    nominatedBy: candidate.nominatedBy,
                    anonymousId,
                    displayOrder: i + 1,
                    status: 'approved'
                }, { transaction });

                createdCandidates.push(createdCandidate);
            }

            await transaction.commit();

            logger.info('升遷投票活動創建成功', {
                campaignId: campaign.id,
                campaignName: campaign.campaignName,
                candidateCount: createdCandidates.length
            });

            res.json({
                success: true,
                message: '升遷投票活動創建成功',
                data: {
                    campaign: {
                        id: campaign.id,
                        campaignName: campaign.campaignName,
                        targetPosition: campaign.targetPosition,
                        status: campaign.status
                    },
                    candidates: createdCandidates.map(c => ({
                        id: c.id,
                        anonymousId: c.anonymousId,
                        candidateName: c.candidateName,
                        status: c.status
                    }))
                }
            });

        } catch (error) {
            await transaction.rollback();
            throw error;
        }

    } catch (error) {
        logger.error('創建升遷投票活動失敗:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * ==========================================
 * 投票修改相關 API
 * ==========================================
 */

/**
 * 修改已存在的投票
 * PUT /api/promotion/campaigns/:id/vote/:voteId/modify
 */
router.put('/campaigns/:id/vote/:voteId/modify', async (req, res) => {
    try {
        const models = getModels();
        const { id: campaignId, voteId } = req.params;
        const { newDecision, newCandidateId, modificationReason, employeeId } = req.body;

        if (!newDecision || !employeeId) {
            return res.status(400).json({
                success: false,
                error: '缺少必要參數：newDecision, employeeId'
            });
        }

        // 檢查投票是否存在
        const vote = await models.PromotionVote.findOne({
            where: { id: voteId, campaignId, isValid: true }
        });

        if (!vote) {
            return res.status(404).json({
                success: false,
                error: '找不到投票記錄'
            });
        }

        // 檢查是否還能修改
        if (!vote.canStillModify || vote.modificationCount >= 3) {
            return res.status(403).json({
                success: false,
                error: '已達修改次數上限'
            });
        }

        // 檢查活動是否允許修改
        const campaign = await models.PromotionCampaign.findByPk(campaignId);
        if (!campaign || !campaign.canModifyVotes) {
            return res.status(403).json({
                success: false,
                error: '此投票活動不允許修改'
            });
        }

        // 檢查是否在活動期間內
        const now = new Date();
        if (now < campaign.startDate || now > campaign.endDate) {
            return res.status(403).json({
                success: false,
                error: '不在投票期間內'
            });
        }

        const transaction = await models.PromotionVote.sequelize.transaction();

        try {
            // 記錄修改歷史
            const modificationNumber = vote.modificationCount + 1;
            
            await models.VoteModificationHistory.recordModification({
                originalVoteId: vote.id,
                employeeId,
                campaignId,
                modificationNumber,
                oldDecision: vote.currentDecision,
                newDecision,
                oldCandidateId: vote.candidateId,
                newCandidateId: newCandidateId || vote.candidateId,
                modificationReason,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                sessionId: req.sessionID
            });

            // 更新投票記錄
            await vote.update({
                currentDecision: newDecision,
                candidateId: newCandidateId || vote.candidateId,
                modificationCount: modificationNumber,
                canStillModify: modificationNumber < 3,
                lastModifiedAt: new Date(),
                // 保留原始決定
                originalDecision: vote.originalDecision || vote.currentDecision
            }, { transaction });

            await transaction.commit();

            logger.info('投票修改成功', {
                voteId,
                campaignId,
                employeeId,
                modificationNumber,
                oldDecision: vote.currentDecision,
                newDecision
            });

            res.json({
                success: true,
                message: '投票修改成功',
                data: {
                    voteId,
                    modificationNumber,
                    remainingModifications: 3 - modificationNumber,
                    modifiedAt: new Date()
                }
            });

        } catch (error) {
            await transaction.rollback();
            throw error;
        }

    } catch (error) {
        logger.error('修改投票失敗:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * 獲取投票修改歷史
 * GET /api/promotion/campaigns/:id/vote/:voteId/history
 */
router.get('/campaigns/:id/vote/:voteId/history', async (req, res) => {
    try {
        const models = getModels();
        const { id: campaignId, voteId } = req.params;
        const { employeeId } = req.query;

        if (!employeeId) {
            return res.status(400).json({
                success: false,
                error: '缺少員工ID參數'
            });
        }

        const history = await models.VoteModificationHistory.getEmployeeModificationHistory(
            employeeId, 
            campaignId
        );

        res.json({
            success: true,
            data: {
                voteId,
                campaignId,
                employeeId,
                modifications: history,
                totalModifications: history.length
            }
        });

    } catch (error) {
        logger.error('獲取投票修改歷史失敗:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * 檢查投票修改狀態
 * GET /api/promotion/campaigns/:id/vote/modification-status/:employeeId
 */
router.get('/campaigns/:id/vote/modification-status/:employeeId', async (req, res) => {
    try {
        const models = getModels();
        const { id: campaignId, employeeId } = req.params;

        const status = await models.VoteModificationHistory.checkModificationEligibility(
            employeeId,
            campaignId
        );

        // 獲取當前投票記錄
        const currentVote = await models.PromotionVote.findOne({
            where: { campaignId, voterFingerprint: models.PromotionVote.generateVoterFingerprint(employeeId, campaignId) }
        });

        res.json({
            success: true,
            data: {
                ...status,
                hasVoted: !!currentVote,
                currentDecision: currentVote?.currentDecision,
                lastModifiedAt: currentVote?.lastModifiedAt
            }
        });

    } catch (error) {
        logger.error('檢查投票修改狀態失敗:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * ==========================================
 * 自動投票系統 API
 * ==========================================
 */

/**
 * 手動觸發條件檢查 (管理員用)
 * POST /api/promotion/auto-campaigns/check-conditions
 */
router.post('/auto-campaigns/check-conditions', async (req, res) => {
    try {
        const { checkType } = req.body; // 'promotion' | 'demotion' | 'all'
        
        const AutoVotingEngine = require('../services/AutoVotingEngine');
        
        let results = {};
        
        if (checkType === 'promotion' || checkType === 'all') {
            await AutoVotingEngine.checkNewEmployeePromotions();
            results.promotion = 'completed';
        }
        
        if (checkType === 'demotion' || checkType === 'all') {
            await AutoVotingEngine.checkDemotionPunishments();
            results.demotion = 'completed';
        }

        res.json({
            success: true,
            message: '自動投票條件檢查完成',
            data: results
        });

    } catch (error) {
        logger.error('自動投票條件檢查失敗:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * 獲取系統投票活動
 * GET /api/promotion/auto-campaigns/system
 */
router.get('/auto-campaigns/system', async (req, res) => {
    try {
        const models = getModels();
        
        const systemCampaigns = await models.PromotionCampaign.findAll({
            where: {
                systemGenerated: true,
                campaignSubType: { [models.PromotionCampaign.sequelize.Sequelize.Op.in]: ['auto_promotion', 'auto_demotion'] }
            },
            order: [['createdAt', 'DESC']],
            include: [
                {
                    model: models.PromotionCandidate,
                    as: 'PromotionCandidates',
                    attributes: ['anonymousId', 'candidateName', 'currentPosition', 'status']
                }
            ]
        });

        const categorized = {
            promotions: systemCampaigns.filter(c => c.campaignSubType === 'auto_promotion'),
            demotions: systemCampaigns.filter(c => c.campaignSubType === 'auto_demotion')
        };

        res.json({
            success: true,
            data: {
                total: systemCampaigns.length,
                ...categorized
            }
        });

    } catch (error) {
        logger.error('獲取系統投票活動失敗:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * 重置月度遲到統計 (管理員用)
 * POST /api/promotion/auto-campaigns/reset-stats
 */
router.post('/auto-campaigns/reset-stats', async (req, res) => {
    try {
        const AutoVotingEngine = require('../services/AutoVotingEngine');
        await AutoVotingEngine.resetMonthlyAttendanceStats();

        res.json({
            success: true,
            message: '月度遲到統計已重置'
        });

    } catch (error) {
        logger.error('重置月度統計失敗:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * 獲取投票活動衝突檢查
 * GET /api/promotion/campaigns/conflicts
 */
router.get('/campaigns/conflicts', async (req, res) => {
    try {
        const models = getModels();
        
        const now = new Date();
        const activeCampaigns = await models.PromotionCampaign.findAll({
            where: {
                status: 'active',
                startDate: { [models.PromotionCampaign.sequelize.Sequelize.Op.lte]: now },
                endDate: { [models.PromotionCampaign.sequelize.Sequelize.Op.gte]: now }
            },
            attributes: ['id', 'campaignName', 'campaignSubType', 'priority', 'triggerEmployeeId', 'startDate', 'endDate'],
            order: [['priority', 'DESC'], ['startDate', 'ASC']]
        });

        // 檢查衝突
        const conflicts = [];
        const employeeVotes = {}; // 記錄員工參與的投票

        for (const campaign of activeCampaigns) {
            if (campaign.triggerEmployeeId) {
                if (employeeVotes[campaign.triggerEmployeeId]) {
                    conflicts.push({
                        type: 'employee_multiple_campaigns',
                        employeeId: campaign.triggerEmployeeId,
                        campaigns: [employeeVotes[campaign.triggerEmployeeId].id, campaign.id],
                        severity: 'medium'
                    });
                }
                employeeVotes[campaign.triggerEmployeeId] = campaign;
            }
        }

        res.json({
            success: true,
            data: {
                activeCampaigns: activeCampaigns.length,
                campaigns: activeCampaigns,
                conflicts: conflicts,
                hasConflicts: conflicts.length > 0
            }
        });

    } catch (error) {
        logger.error('檢查投票衝突失敗:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;