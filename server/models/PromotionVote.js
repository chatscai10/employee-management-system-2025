/**
 * ===================================
 * 升遷投票記錄模型 - PromotionVote Model
 * ===================================
 * 匿名投票記錄系統 - 使用加密Token保護投票者身份
 */

const { DataTypes } = require('sequelize');
const crypto = require('crypto');

module.exports = (sequelize) => {
    const PromotionVote = sequelize.define('PromotionVote', {
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
        candidateId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'promotion_candidates',
                key: 'id'
            }
        },
        // 匿名化投票者身份保護
        voterToken: {
            type: DataTypes.STRING(128),
            allowNull: false,
            comment: '投票者加密Token (SHA-256)'
        },
        voterFingerprint: {
            type: DataTypes.STRING(64),
            allowNull: false,
            comment: '投票者指紋 (用於防止重複投票)'
        },
        // 投票詳情
        voteRanking: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: '投票排名 (排名制投票用)'
        },
        voteWeight: {
            type: DataTypes.DECIMAL(3, 2),
            defaultValue: 1.00,
            comment: '投票權重'
        },
        voteReason: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '投票理由 (匿名)'
        },
        // 投票環境資訊 (用於審計)
        ipAddressHash: {
            type: DataTypes.STRING(64),
            allowNull: true,
            comment: 'IP地址雜湊值'
        },
        userAgentHash: {
            type: DataTypes.STRING(64),
            allowNull: true,
            comment: '瀏覽器資訊雜湊值'
        },
        sessionId: {
            type: DataTypes.STRING(64),
            allowNull: true,
            comment: '投票會話ID'
        },
        // 時間戳記
        votedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            comment: '投票時間'
        },
        // 驗證狀態
        isValid: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: '投票是否有效'
        },
        validationNotes: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '驗證備註'
        },
        // 投票修改相關欄位
        modificationCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '已修改次數'
        },
        canStillModify: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: '是否還能修改'
        },
        originalDecision: {
            type: DataTypes.ENUM('agree', 'disagree', 'abstain'),
            allowNull: true,
            comment: '原始決定'
        },
        currentDecision: {
            type: DataTypes.ENUM('agree', 'disagree', 'abstain'),
            allowNull: false,
            defaultValue: 'agree',
            comment: '當前決定'
        },
        lastModifiedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '最後修改時間'
        }
    }, {
        tableName: 'promotion_votes',
        timestamps: true,
        indexes: [
            {
                fields: ['campaignId'],
                name: 'idx_vote_campaign'
            },
            {
                fields: ['candidateId'],
                name: 'idx_vote_candidate'
            },
            {
                fields: ['voterFingerprint'],
                name: 'idx_vote_fingerprint'
            },
            {
                fields: ['votedAt'],
                name: 'idx_vote_time'
            },
            {
                unique: true,
                fields: ['campaignId', 'voterFingerprint'],
                name: 'idx_vote_unique_voter'
            },
            {
                fields: ['campaignId', 'candidateId'],
                name: 'idx_vote_campaign_candidate'
            }
        ],
        comment: '匿名升遷投票記錄表'
    });

    /**
     * 生成投票者加密Token
     * @param {number} employeeId 員工ID
     * @param {number} campaignId 活動ID
     * @param {string} salt 加密鹽值
     * @returns {string}
     */
    PromotionVote.generateVoterToken = function(employeeId, campaignId, salt = process.env.VOTE_SALT || 'default_salt') {
        const data = `${employeeId}_${campaignId}_${salt}_${Date.now()}`;
        return crypto.createHash('sha256').update(data).digest('hex');
    };

    /**
     * 生成投票者指紋
     * @param {number} employeeId 員工ID
     * @param {number} campaignId 活動ID
     * @returns {string}
     */
    PromotionVote.generateVoterFingerprint = function(employeeId, campaignId) {
        const data = `${employeeId}_${campaignId}`;
        return crypto.createHash('sha256').update(data).digest('hex');
    };

    /**
     * 生成IP地址雜湊
     * @param {string} ipAddress IP地址
     * @returns {string}
     */
    PromotionVote.hashIpAddress = function(ipAddress) {
        return crypto.createHash('sha256').update(ipAddress || 'unknown').digest('hex');
    };

    /**
     * 生成用戶代理雜湊
     * @param {string} userAgent 用戶代理字符串
     * @returns {string}
     */
    PromotionVote.hashUserAgent = function(userAgent) {
        return crypto.createHash('sha256').update(userAgent || 'unknown').digest('hex');
    };

    /**
     * 檢查投票者是否已投票
     * @param {number} campaignId 活動ID
     * @param {number} employeeId 員工ID
     * @returns {Promise<boolean>}
     */
    PromotionVote.hasVoted = async function(campaignId, employeeId) {
        const fingerprint = this.generateVoterFingerprint(employeeId, campaignId);
        const existingVote = await this.findOne({
            where: {
                campaignId,
                voterFingerprint: fingerprint,
                isValid: true
            }
        });
        return !!existingVote;
    };

    /**
     * 創建匿名投票記錄
     * @param {Object} voteData 投票數據
     * @returns {Promise<PromotionVote>}
     */
    PromotionVote.createAnonymousVote = async function(voteData) {
        const {
            campaignId,
            candidateId,
            employeeId,
            voteRanking,
            voteWeight = 1.00,
            voteReason,
            ipAddress,
            userAgent,
            sessionId
        } = voteData;

        // 生成匿名化標識符
        const voterToken = this.generateVoterToken(employeeId, campaignId);
        const voterFingerprint = this.generateVoterFingerprint(employeeId, campaignId);
        const ipAddressHash = this.hashIpAddress(ipAddress);
        const userAgentHash = this.hashUserAgent(userAgent);

        return await this.create({
            campaignId,
            candidateId,
            voterToken,
            voterFingerprint,
            voteRanking,
            voteWeight,
            voteReason,
            ipAddressHash,
            userAgentHash,
            sessionId,
            votedAt: new Date(),
            isValid: true
        });
    };

    /**
     * 獲取活動投票統計
     * @param {number} campaignId 活動ID
     * @returns {Promise<Object>}
     */
    PromotionVote.getCampaignStats = async function(campaignId) {
        const totalVotes = await this.count({
            where: { campaignId, isValid: true }
        });

        const uniqueVoters = await this.count({
            where: { campaignId, isValid: true },
            distinct: true,
            col: 'voterFingerprint'
        });

        const candidateVotes = await sequelize.query(`
            SELECT 
                pv.candidateId,
                COUNT(*) as voteCount,
                AVG(pv.voteWeight) as avgWeight,
                ROUND(COUNT(*) * 100.0 / ${totalVotes}, 2) as percentage
            FROM promotion_votes pv
            WHERE pv.campaignId = :campaignId AND pv.isValid = 1
            GROUP BY pv.candidateId
            ORDER BY voteCount DESC
        `, {
            replacements: { campaignId },
            type: sequelize.QueryTypes.SELECT
        });

        return {
            totalVotes,
            uniqueVoters,
            candidateVotes,
            participationRate: uniqueVoters // 可以與總員工數比較計算參與率
        };
    };

    /**
     * 獲取匿名投票列表 (用於審計)
     * @param {number} campaignId 活動ID
     * @param {Object} options 選項
     * @returns {Promise<Array>}
     */
    PromotionVote.getAnonymousVotesList = async function(campaignId, options = {}) {
        const { limit = 100, offset = 0, includeReasons = false } = options;

        const attributes = [
            'id',
            'candidateId',
            'voteRanking',
            'voteWeight',
            'votedAt',
            'sessionId',
            'isValid'
        ];

        if (includeReasons) {
            attributes.push('voteReason');
        }

        return await this.findAll({
            where: { 
                campaignId,
                isValid: true 
            },
            attributes,
            order: [['votedAt', 'ASC']],
            limit,
            offset
        });
    };

    /**
     * 驗證投票完整性
     * @param {number} campaignId 活動ID
     * @returns {Promise<Object>}
     */
    PromotionVote.validateVoteIntegrity = async function(campaignId) {
        // 檢查重複投票
        const duplicateVotes = await sequelize.query(`
            SELECT voterFingerprint, COUNT(*) as count
            FROM promotion_votes
            WHERE campaignId = :campaignId AND isValid = 1
            GROUP BY voterFingerprint
            HAVING COUNT(*) > 1
        `, {
            replacements: { campaignId },
            type: sequelize.QueryTypes.SELECT
        });

        // 檢查時間異常投票 (活動時間外的投票)
        const campaign = await sequelize.models.PromotionCampaign.findByPk(campaignId);
        const timeAnomalies = await this.count({
            where: {
                campaignId,
                isValid: true,
                [sequelize.Sequelize.Op.or]: [
                    { votedAt: { [sequelize.Sequelize.Op.lt]: campaign.startDate } },
                    { votedAt: { [sequelize.Sequelize.Op.gt]: campaign.endDate } }
                ]
            }
        });

        return {
            duplicateVotes: duplicateVotes.length,
            timeAnomalies,
            isValid: duplicateVotes.length === 0 && timeAnomalies === 0
        };
    };

    /**
     * 設定模型關聯
     */
    PromotionVote.associate = function(models) {
        // 投票屬於一個活動
        PromotionVote.belongsTo(models.PromotionCampaign, {
            foreignKey: 'campaignId',
            as: 'Campaign'
        });
        
        // 投票屬於一個候選人
        PromotionVote.belongsTo(models.PromotionCandidate, {
            foreignKey: 'candidateId',
            as: 'Candidate'
        });
    };

    return PromotionVote;
};