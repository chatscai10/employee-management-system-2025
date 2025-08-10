/**
 * ===================================
 * 投票修改歷史模型 - VoteModificationHistory Model
 * ===================================
 * 記錄員工投票修改的完整歷史
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const VoteModificationHistory = sequelize.define('VoteModificationHistory', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        originalVoteId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'promotion_votes',
                key: 'id'
            },
            comment: '原始投票記錄ID'
        },
        employeeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'employees',
                key: 'id'
            },
            comment: '投票員工ID'
        },
        campaignId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'promotion_campaigns',
                key: 'id'
            },
            comment: '投票活動ID'
        },
        modificationNumber: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '第幾次修改 (1-3)'
        },
        oldDecision: {
            type: DataTypes.ENUM('agree', 'disagree', 'abstain'),
            allowNull: true,
            comment: '修改前的決定'
        },
        newDecision: {
            type: DataTypes.ENUM('agree', 'disagree', 'abstain'),
            allowNull: false,
            comment: '修改後的決定'
        },
        oldCandidateId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: '修改前投票的候選人ID'
        },
        newCandidateId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '修改後投票的候選人ID'
        },
        modificationReason: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '修改原因說明'
        },
        modifiedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            comment: '修改時間'
        },
        // 審計資訊
        ipAddress: {
            type: DataTypes.STRING(45),
            allowNull: true,
            comment: '修改時的IP地址'
        },
        userAgent: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '修改時的用戶代理'
        },
        sessionId: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: '會話ID'
        }
    }, {
        tableName: 'vote_modification_history',
        timestamps: true,
        indexes: [
            {
                fields: ['originalVoteId'],
                name: 'idx_vote_history_original'
            },
            {
                fields: ['employeeId', 'campaignId'],
                name: 'idx_vote_history_employee_campaign'
            },
            {
                fields: ['campaignId'],
                name: 'idx_vote_history_campaign'
            },
            {
                fields: ['modifiedAt'],
                name: 'idx_vote_history_time'
            },
            {
                fields: ['modificationNumber'],
                name: 'idx_vote_history_number'
            }
        ],
        comment: '投票修改歷史記錄表'
    });

    /**
     * 記錄投票修改
     * @param {Object} modificationData 修改數據
     * @returns {Promise<VoteModificationHistory>}
     */
    VoteModificationHistory.recordModification = async function(modificationData) {
        const {
            originalVoteId,
            employeeId,
            campaignId,
            modificationNumber,
            oldDecision,
            newDecision,
            oldCandidateId,
            newCandidateId,
            modificationReason,
            ipAddress,
            userAgent,
            sessionId
        } = modificationData;

        return await this.create({
            originalVoteId,
            employeeId,
            campaignId,
            modificationNumber,
            oldDecision,
            newDecision,
            oldCandidateId,
            newCandidateId,
            modificationReason,
            modifiedAt: new Date(),
            ipAddress,
            userAgent,
            sessionId
        });
    };

    /**
     * 獲取員工在特定活動的修改歷史
     * @param {number} employeeId 員工ID
     * @param {number} campaignId 活動ID
     * @returns {Promise<Array>}
     */
    VoteModificationHistory.getEmployeeModificationHistory = async function(employeeId, campaignId) {
        return await this.findAll({
            where: { employeeId, campaignId },
            order: [['modificationNumber', 'ASC']],
            include: [
                {
                    model: sequelize.models.PromotionCandidate,
                    as: 'OldCandidate',
                    attributes: ['anonymousId', 'candidateName'],
                    required: false
                },
                {
                    model: sequelize.models.PromotionCandidate,
                    as: 'NewCandidate',
                    attributes: ['anonymousId', 'candidateName'],
                    required: false
                }
            ]
        });
    };

    /**
     * 獲取投票活動的所有修改統計
     * @param {number} campaignId 活動ID
     * @returns {Promise<Object>}
     */
    VoteModificationHistory.getCampaignModificationStats = async function(campaignId) {
        const modifications = await this.findAll({
            where: { campaignId },
            attributes: [
                'modificationNumber',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['modificationNumber'],
            raw: true
        });

        const totalModifications = await this.count({ where: { campaignId } });
        
        const uniqueModifiers = await this.count({
            where: { campaignId },
            distinct: true,
            col: 'employeeId'
        });

        return {
            totalModifications,
            uniqueModifiers,
            modificationBreakdown: modifications,
            averageModificationsPerVoter: uniqueModifiers > 0 ? (totalModifications / uniqueModifiers).toFixed(2) : 0
        };
    };

    /**
     * 檢查員工是否還可以修改投票
     * @param {number} employeeId 員工ID  
     * @param {number} campaignId 活動ID
     * @returns {Promise<Object>}
     */
    VoteModificationHistory.checkModificationEligibility = async function(employeeId, campaignId) {
        const modificationCount = await this.count({
            where: { employeeId, campaignId }
        });

        const canModify = modificationCount < 3;
        const remainingModifications = Math.max(0, 3 - modificationCount);

        return {
            canModify,
            currentModifications: modificationCount,
            remainingModifications,
            maxModifications: 3
        };
    };

    /**
     * 清理過期的修改歷史 (超過6個月)
     */
    VoteModificationHistory.cleanupExpiredHistory = async function() {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const deletedCount = await this.destroy({
            where: {
                modifiedAt: {
                    [sequelize.Sequelize.Op.lt]: sixMonthsAgo
                }
            }
        });

        return deletedCount;
    };

    /**
     * 設定模型關聯
     */
    VoteModificationHistory.associate = function(models) {
        // 修改歷史屬於一個原始投票
        VoteModificationHistory.belongsTo(models.PromotionVote, {
            foreignKey: 'originalVoteId',
            as: 'OriginalVote'
        });

        // 修改歷史屬於一個員工
        VoteModificationHistory.belongsTo(models.Employee, {
            foreignKey: 'employeeId',
            as: 'Employee'
        });

        // 修改歷史屬於一個投票活動
        VoteModificationHistory.belongsTo(models.PromotionCampaign, {
            foreignKey: 'campaignId',
            as: 'Campaign'
        });

        // 修改前候選人 (可能為空)
        VoteModificationHistory.belongsTo(models.PromotionCandidate, {
            foreignKey: 'oldCandidateId',
            as: 'OldCandidate'
        });

        // 修改後候選人
        VoteModificationHistory.belongsTo(models.PromotionCandidate, {
            foreignKey: 'newCandidateId',
            as: 'NewCandidate'
        });
    };

    return VoteModificationHistory;
};