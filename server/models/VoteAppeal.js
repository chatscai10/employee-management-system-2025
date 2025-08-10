/**
 * =======================================
 * 投票申訴記錄模型 - VoteAppeal
 * =======================================
 * 實現投票結果申訴和撤銷功能
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const VoteAppeal = sequelize.define('VoteAppeal', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        campaignId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '投票活動ID'
        },
        appealingEmployeeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '申訴人ID'
        },
        targetEmployeeId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: '被申訴決定影響的員工ID'
        },
        appealType: {
            type: DataTypes.ENUM('promotion_result', 'demotion_result', 'vote_manipulation', 'unfair_process'),
            allowNull: false,
            comment: '申訴類型'
        },
        appealReason: {
            type: DataTypes.TEXT,
            allowNull: false,
            comment: '申訴理由'
        },
        appealStatus: {
            type: DataTypes.ENUM('pending', 'under_review', 'approved', 'rejected', 'withdrawn'),
            allowNull: false,
            defaultValue: 'pending',
            comment: '申訴狀態'
        },
        appealSubmittedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            comment: '申訴提交時間'
        },
        appealDeadline: {
            type: DataTypes.DATE,
            allowNull: false,
            comment: '申訴截止時間'
        },
        reviewedBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: '審核人員ID'
        },
        reviewedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '審核時間'
        },
        reviewNotes: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '審核備註'
        },
        reviewDecision: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '審核決定說明'
        },
        originalResult: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: '原始投票結果'
        },
        appealOutcome: {
            type: DataTypes.ENUM('maintain_result', 'revote', 'direct_override', 'position_restored'),
            allowNull: true,
            comment: '申訴結果'
        },
        evidenceFiles: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: '證據文件列表'
        },
        supportingEmployees: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: '支持申訴的員工列表'
        },
        priority: {
            type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
            allowNull: false,
            defaultValue: 'medium',
            comment: '申訴優先級'
        },
        investigationNotes: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '調查記錄'
        },
        resolutionTimeLimit: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '處理時限'
        }
    }, {
        tableName: 'vote_appeals',
        timestamps: true,
        indexes: [
            {
                fields: ['campaignId']
            },
            {
                fields: ['appealingEmployeeId']
            },
            {
                fields: ['targetEmployeeId']
            },
            {
                fields: ['appealStatus']
            },
            {
                fields: ['appealType']
            },
            {
                fields: ['appealDeadline']
            }
        ]
    });

    // 關聯設定
    VoteAppeal.associate = (models) => {
        // 關聯投票活動
        VoteAppeal.belongsTo(models.PromotionCampaign, {
            foreignKey: 'campaignId',
            as: 'Campaign'
        });

        // 關聯申訴人
        VoteAppeal.belongsTo(models.Employee, {
            foreignKey: 'appealingEmployeeId',
            as: 'Appellant'
        });

        // 關聯目標員工
        VoteAppeal.belongsTo(models.Employee, {
            foreignKey: 'targetEmployeeId',
            as: 'TargetEmployee'
        });

        // 關聯審核人員
        VoteAppeal.belongsTo(models.Employee, {
            foreignKey: 'reviewedBy',
            as: 'Reviewer'
        });
    };

    // 實例方法
    VoteAppeal.prototype.isWithinDeadline = function() {
        return new Date() <= new Date(this.appealDeadline);
    };

    VoteAppeal.prototype.canBeWithdrawn = function() {
        const allowedStatuses = ['pending', 'under_review'];
        return allowedStatuses.includes(this.appealStatus);
    };

    VoteAppeal.prototype.isOverdue = function() {
        if (!this.resolutionTimeLimit) return false;
        return new Date() > new Date(this.resolutionTimeLimit) && 
               ['pending', 'under_review'].includes(this.appealStatus);
    };

    VoteAppeal.prototype.calculateProcessingTime = function() {
        if (!this.reviewedAt) return null;
        
        const submitted = new Date(this.appealSubmittedAt);
        const reviewed = new Date(this.reviewedAt);
        const diffMs = reviewed - submitted;
        
        return {
            milliseconds: diffMs,
            hours: Math.round(diffMs / (1000 * 60 * 60)),
            days: Math.round(diffMs / (1000 * 60 * 60 * 24))
        };
    };

    VoteAppeal.prototype.setResolutionTimeLimit = function() {
        const appealTypeTimeLimits = {
            'vote_manipulation': 1, // 1天 - 緊急處理
            'demotion_result': 2,   // 2天 - 優先處理
            'promotion_result': 3,  // 3天
            'unfair_process': 5     // 5天
        };
        
        const days = appealTypeTimeLimits[this.appealType] || 3;
        const deadline = new Date(this.appealSubmittedAt);
        deadline.setDate(deadline.getDate() + days);
        
        this.resolutionTimeLimit = deadline;
        return deadline;
    };

    // 靜態方法
    VoteAppeal.createAppeal = async function(appealData) {
        // 檢查申訴資格
        const eligibilityCheck = await this.checkAppealEligibility(
            appealData.campaignId,
            appealData.appealingEmployeeId,
            appealData.appealType
        );
        
        if (!eligibilityCheck.eligible) {
            throw new Error(eligibilityCheck.reason);
        }

        // 設定申訴截止時間 (投票結果公布後7天內)
        const campaign = await this.sequelize.models.PromotionCampaign.findByPk(appealData.campaignId);
        const deadline = new Date(campaign.endDate);
        deadline.setDate(deadline.getDate() + 7);

        const appeal = await this.create({
            ...appealData,
            appealDeadline: deadline
        });

        // 設定處理時限
        appeal.setResolutionTimeLimit();
        await appeal.save();

        return appeal;
    };

    VoteAppeal.checkAppealEligibility = async function(campaignId, employeeId, appealType) {
        // 檢查是否在申訴期限內
        const campaign = await this.sequelize.models.PromotionCampaign.findByPk(campaignId);
        if (!campaign) {
            return { eligible: false, reason: '投票活動不存在' };
        }

        if (campaign.status !== 'closed') {
            return { eligible: false, reason: '投票活動尚未結束' };
        }

        const deadline = new Date(campaign.endDate);
        deadline.setDate(deadline.getDate() + 7);
        
        if (new Date() > deadline) {
            return { eligible: false, reason: '已超過申訴期限' };
        }

        // 檢查是否已經申訴過同一活動
        const existingAppeal = await this.findOne({
            where: {
                campaignId,
                appealingEmployeeId: employeeId,
                appealType
            }
        });

        if (existingAppeal) {
            return { eligible: false, reason: '您已對此活動提出過同類型的申訴' };
        }

        // 檢查申訴頻率限制 (一個月內不超過2次)
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        const recentAppeals = await this.count({
            where: {
                appealingEmployeeId: employeeId,
                appealSubmittedAt: {
                    [this.sequelize.Sequelize.Op.gte]: oneMonthAgo
                }
            }
        });

        if (recentAppeals >= 2) {
            return { eligible: false, reason: '本月申訴次數已達上限' };
        }

        return { eligible: true };
    };

    VoteAppeal.getPendingAppeals = async function() {
        return await this.findAll({
            where: {
                appealStatus: ['pending', 'under_review']
            },
            include: ['Campaign', 'Appellant', 'TargetEmployee', 'Reviewer'],
            order: [['priority', 'DESC'], ['appealSubmittedAt', 'ASC']]
        });
    };

    VoteAppeal.getOverdueAppeals = async function() {
        return await this.findAll({
            where: {
                appealStatus: ['pending', 'under_review'],
                resolutionTimeLimit: {
                    [this.sequelize.Sequelize.Op.lt]: new Date()
                }
            },
            include: ['Campaign', 'Appellant', 'TargetEmployee']
        });
    };

    VoteAppeal.getAppealsByEmployee = async function(employeeId, includeCompleted = false) {
        const whereClause = {
            appealingEmployeeId: employeeId
        };

        if (!includeCompleted) {
            whereClause.appealStatus = ['pending', 'under_review'];
        }

        return await this.findAll({
            where: whereClause,
            include: ['Campaign', 'TargetEmployee', 'Reviewer'],
            order: [['appealSubmittedAt', 'DESC']]
        });
    };

    VoteAppeal.getAppealStatistics = async function(startDate, endDate) {
        const whereClause = {};
        if (startDate && endDate) {
            whereClause.appealSubmittedAt = {
                [this.sequelize.Sequelize.Op.between]: [startDate, endDate]
            };
        }

        const [
            totalAppeals,
            pendingAppeals,
            approvedAppeals,
            rejectedAppeals,
            withdrawnAppeals
        ] = await Promise.all([
            this.count({ where: whereClause }),
            this.count({ where: { ...whereClause, appealStatus: 'pending' } }),
            this.count({ where: { ...whereClause, appealStatus: 'approved' } }),
            this.count({ where: { ...whereClause, appealStatus: 'rejected' } }),
            this.count({ where: { ...whereClause, appealStatus: 'withdrawn' } })
        ]);

        // 按申訴類型統計
        const appealsByType = await this.findAll({
            where: whereClause,
            attributes: [
                'appealType',
                'appealStatus',
                [this.sequelize.fn('COUNT', '*'), 'count']
            ],
            group: ['appealType', 'appealStatus']
        });

        const approvalRate = totalAppeals > 0 ? ((approvedAppeals / totalAppeals) * 100).toFixed(2) : 0;
        const rejectionRate = totalAppeals > 0 ? ((rejectedAppeals / totalAppeals) * 100).toFixed(2) : 0;

        return {
            summary: {
                totalAppeals,
                pendingAppeals,
                approvedAppeals,
                rejectedAppeals,
                withdrawnAppeals,
                approvalRate: parseFloat(approvalRate),
                rejectionRate: parseFloat(rejectionRate)
            },
            appealsByType
        };
    };

    return VoteAppeal;
};