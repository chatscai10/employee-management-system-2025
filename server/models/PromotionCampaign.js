/**
 * ===================================
 * 升遷活動模型 - PromotionCampaign Model  
 * ===================================
 * 管理升遷投票活動的基本資訊
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const PromotionCampaign = sequelize.define('PromotionCampaign', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        campaignName: {
            type: DataTypes.STRING(100),
            allowNull: false,
            comment: '升遷活動名稱'
        },
        campaignDescription: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '活動描述'
        },
        targetPosition: {
            type: DataTypes.STRING(50),
            allowNull: false,
            comment: '目標職位'
        },
        campaignType: {
            type: DataTypes.ENUM('single_choice', 'multiple_choice', 'ranking'),
            defaultValue: 'single_choice',
            comment: '投票類型'
        },
        maxVotesPerPerson: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
            comment: '每人最大投票數'
        },
        startDate: {
            type: DataTypes.DATE,
            allowNull: false,
            comment: '投票開始時間'
        },
        endDate: {
            type: DataTypes.DATE,
            allowNull: false,
            comment: '投票結束時間'
        },
        status: {
            type: DataTypes.ENUM('draft', 'active', 'closed', 'cancelled'),
            defaultValue: 'draft',
            comment: '活動狀態'
        },
        isAnonymous: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: '是否匿名投票'
        },
        eligibleVoterCriteria: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: '投票者資格條件 JSON'
        },
        createdBy: {
            type: DataTypes.STRING(50),
            allowNull: false,
            comment: '創建者'
        },
        approvedBy: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: '審核者'
        },
        approvedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '審核時間'
        },
        results: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: '投票結果 JSON (活動結束後填入)'
        },
        totalVotes: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '總投票數'
        },
        totalVoters: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '參與投票人數'
        },
        // 擴展欄位 - 支援複雜投票機制
        campaignSubType: {
            type: DataTypes.ENUM('manual', 'auto_promotion', 'auto_demotion'),
            defaultValue: 'manual',
            comment: '投票子類型'
        },
        triggerConditions: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: '觸發條件 (自動投票用)'
        },
        priority: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '優先級 (系統投票優先級高)'
        },
        canModifyVotes: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: '是否允許修改投票'
        },
        maxModifications: {
            type: DataTypes.INTEGER,
            defaultValue: 3,
            comment: '最大修改次數'
        },
        bufferPeriodDays: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '緩衝天數 (失敗後的等待期)'
        },
        passThreshold: {
            type: DataTypes.DECIMAL(5, 2),
            defaultValue: 50.00,
            comment: '通過門檻百分比'
        },
        triggerEmployeeId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'employees',
                key: 'id'
            },
            comment: '觸發投票的員工ID (自動投票用)'
        },
        systemGenerated: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: '是否由系統自動生成'
        }
    }, {
        tableName: 'promotion_campaigns',
        timestamps: true,
        indexes: [
            {
                fields: ['status'],
                name: 'idx_campaign_status'
            },
            {
                fields: ['startDate', 'endDate'],
                name: 'idx_campaign_dates'
            },
            {
                fields: ['targetPosition'],
                name: 'idx_campaign_position'
            },
            {
                fields: ['createdBy'],
                name: 'idx_campaign_creator'
            }
        ],
        comment: '升遷投票活動表'
    });

    /**
     * 檢查投票活動是否進行中
     * @returns {boolean}
     */
    PromotionCampaign.prototype.isActive = function() {
        const now = new Date();
        return this.status === 'active' && 
               now >= this.startDate && 
               now <= this.endDate;
    };

    /**
     * 檢查投票活動是否已結束
     * @returns {boolean}
     */
    PromotionCampaign.prototype.isEnded = function() {
        const now = new Date();
        return this.status === 'closed' || now > this.endDate;
    };

    /**
     * 獲取活動剩餘時間（分鐘）
     * @returns {number}
     */
    PromotionCampaign.prototype.getRemainingMinutes = function() {
        if (this.isEnded()) return 0;
        const now = new Date();
        const remaining = this.endDate - now;
        return Math.floor(remaining / (1000 * 60));
    };

    /**
     * 更新投票統計
     * @param {number} totalVotes 總投票數
     * @param {number} totalVoters 參與人數
     */
    PromotionCampaign.prototype.updateVoteStats = async function(totalVotes, totalVoters) {
        this.totalVotes = totalVotes;
        this.totalVoters = totalVoters;
        await this.save();
    };

    /**
     * 設定投票結果
     * @param {Object} results 投票結果
     */
    PromotionCampaign.prototype.setResults = async function(results) {
        this.results = results;
        this.status = 'closed';
        await this.save();
    };

    /**
     * 獲取活動中的投票活動
     */
    PromotionCampaign.getActiveCampaigns = async function() {
        const now = new Date();
        return await this.findAll({
            where: {
                status: 'active',
                startDate: { [sequelize.Sequelize.Op.lte]: now },
                endDate: { [sequelize.Sequelize.Op.gte]: now }
            },
            order: [['startDate', 'DESC']]
        });
    };

    /**
     * 設定模型關聯
     */
    PromotionCampaign.associate = function(models) {
        // 一個活動有多個候選人
        PromotionCampaign.hasMany(models.PromotionCandidate, {
            foreignKey: 'campaignId',
            as: 'PromotionCandidates'
        });
        
        // 一個活動有多個投票記錄
        PromotionCampaign.hasMany(models.PromotionVote, {
            foreignKey: 'campaignId',
            as: 'PromotionVotes'
        });
    };

    return PromotionCampaign;
};