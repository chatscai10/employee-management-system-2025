/**
 * ===================================
 * 升遷候選人模型 - PromotionCandidate Model
 * ===================================  
 * 管理升遷投票的候選人資訊
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const PromotionCandidate = sequelize.define('PromotionCandidate', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        campaignId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'promotion_campaigns',
                key: 'id'
            }
        },
        employeeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'employees',
                key: 'id'
            }
        },
        candidateName: {
            type: DataTypes.STRING(50),
            allowNull: false,
            comment: '候選人姓名'
        },
        currentPosition: {
            type: DataTypes.STRING(50),
            allowNull: false,
            comment: '現職位'
        },
        currentStore: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: '現分店'
        },
        yearsOfService: {
            type: DataTypes.DECIMAL(3, 1),
            allowNull: true,
            comment: '服務年資'
        },
        candidateStatement: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '候選人自述'
        },
        qualifications: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: '資格條件 JSON'
        },
        achievements: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: '工作成就 JSON'
        },
        endorsements: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: '推薦資料 JSON'
        },
        nominatedBy: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: '推薦人'
        },
        nominatedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '推薦時間'
        },
        status: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected', 'withdrawn'),
            defaultValue: 'pending',
            comment: '候選人狀態'
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
        // 匿名化顯示用欄位
        anonymousId: {
            type: DataTypes.STRING(20),
            allowNull: true,
            unique: true,
            comment: '匿名ID (如 CANDIDATE_001)'
        },
        displayOrder: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: '顯示順序'
        },
        // 投票統計
        voteCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '得票數'
        },
        votePercentage: {
            type: DataTypes.DECIMAL(5, 2),
            defaultValue: 0.00,
            comment: '得票率'
        },
        ranking: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: '排名'
        }
    }, {
        tableName: 'promotion_candidates',
        timestamps: true,
        indexes: [
            {
                fields: ['campaignId'],
                name: 'idx_candidate_campaign'
            },
            {
                fields: ['employeeId'],
                name: 'idx_candidate_employee'
            },
            {
                fields: ['status'],
                name: 'idx_candidate_status'
            },
            {
                fields: ['anonymousId'],
                name: 'idx_candidate_anonymous',
                unique: true
            },
            {
                unique: true,
                fields: ['campaignId', 'employeeId'],
                name: 'idx_candidate_unique'
            }
        ],
        comment: '升遷候選人表'
    });

    /**
     * 生成匿名ID
     * @param {number} campaignId 活動ID
     */
    PromotionCandidate.generateAnonymousId = async function(campaignId) {
        // 使用全局計數而不是活動計數，避免重複
        const totalCount = await this.count();
        const candidateNumber = (totalCount + 1).toString().padStart(3, '0');
        return `CANDIDATE_${candidateNumber}`;
    };

    /**
     * 更新候選人投票統計
     * @param {number} voteCount 得票數
     * @param {number} totalVotes 總票數
     */
    PromotionCandidate.prototype.updateVoteStats = async function(voteCount, totalVotes) {
        this.voteCount = voteCount;
        this.votePercentage = totalVotes > 0 ? (voteCount / totalVotes * 100) : 0;
        await this.save();
    };

    /**
     * 獲取匿名化的候選人資訊
     * @returns {Object}
     */
    PromotionCandidate.prototype.getAnonymousInfo = function() {
        return {
            anonymousId: this.anonymousId,
            displayOrder: this.displayOrder,
            currentPosition: this.currentPosition,
            yearsOfService: this.yearsOfService,
            candidateStatement: this.candidateStatement,
            qualifications: this.qualifications,
            achievements: this.achievements,
            voteCount: this.voteCount,
            votePercentage: this.votePercentage,
            ranking: this.ranking
        };
    };

    /**
     * 獲取完整候選人資訊（管理員用）
     * @returns {Object}
     */
    PromotionCandidate.prototype.getFullInfo = function() {
        return {
            id: this.id,
            anonymousId: this.anonymousId,
            candidateName: this.candidateName,
            employeeId: this.employeeId,
            currentPosition: this.currentPosition,
            currentStore: this.currentStore,
            yearsOfService: this.yearsOfService,
            candidateStatement: this.candidateStatement,
            qualifications: this.qualifications,
            achievements: this.achievements,
            endorsements: this.endorsements,
            nominatedBy: this.nominatedBy,
            nominatedAt: this.nominatedAt,
            status: this.status,
            voteCount: this.voteCount,
            votePercentage: this.votePercentage,
            ranking: this.ranking,
            displayOrder: this.displayOrder
        };
    };

    /**
     * 設定模型關聯
     */
    PromotionCandidate.associate = function(models) {
        // 候選人屬於一個活動
        PromotionCandidate.belongsTo(models.PromotionCampaign, {
            foreignKey: 'campaignId',
            as: 'Campaign'
        });
        
        // 候選人屬於一個員工
        PromotionCandidate.belongsTo(models.Employee, {
            foreignKey: 'employeeId',
            as: 'Employee'
        });
        
        // 一個候選人有多個投票
        PromotionCandidate.hasMany(models.PromotionVote, {
            foreignKey: 'candidateId',
            as: 'Votes'
        });
    };

    return PromotionCandidate;
};