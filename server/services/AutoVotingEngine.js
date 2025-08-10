/**
 * =======================================
 * 自動投票引擎 - AutoVotingEngine
 * =======================================
 * 處理新人轉正和降職懲罰的自動投票邏輯
 */

const logger = require('../utils/logger');
const { getModels } = require('../models');

class AutoVotingEngine {
    constructor() {
        this.models = null;
        this.notificationService = null;
    }

    /**
     * 初始化引擎
     */
    async initialize() {
        this.models = getModels();
        // 延遲載入通知服務避免循環依賴
        this.notificationService = require('./notificationService');
        
        if (!this.models.Employee) {
            throw new Error('模型未初始化，請先載入數據庫模型');
        }
    }

    /**
     * ==========================================
     * 新人轉正自動投票系統
     * ==========================================
     */

    /**
     * 檢查並創建新人轉正投票
     * 每日00:00執行
     */
    async checkNewEmployeePromotions() {
        try {
            await this.initialize();
            
            logger.info('開始檢查新人轉正條件...');
            
            // 獲取所有實習生
            const trainees = await this.models.Employee.findAll({
                where: {
                    position: '實習生',
                    status: '在職'
                }
            });

            const promotionCandidates = [];
            
            for (const trainee of trainees) {
                const isEligible = await this.checkPromotionEligibility(trainee);
                if (isEligible.eligible) {
                    promotionCandidates.push(trainee);
                }
            }

            if (promotionCandidates.length > 0) {
                logger.info(`發現 ${promotionCandidates.length} 名員工符合轉正條件`);
                
                for (const candidate of promotionCandidates) {
                    await this.createPromotionCampaign(candidate);
                }
            } else {
                logger.info('今日無員工符合轉正條件');
            }

        } catch (error) {
            logger.error('檢查新人轉正條件失敗:', error);
            throw error;
        }
    }

    /**
     * 檢查員工是否符合轉正投票條件
     * @param {Object} employee 員工對象
     * @returns {Object} 檢查結果
     */
    async checkPromotionEligibility(employee) {
        try {
            const today = new Date();
            const hireDate = new Date(employee.hireDate);
            const daysWorked = Math.floor((today - hireDate) / (1000 * 60 * 60 * 24));

            // 條件1: 到職滿20天
            if (daysWorked < 20) {
                return {
                    eligible: false,
                    reason: `到職天數不足 (${daysWorked}/20天)`,
                    daysWorked
                };
            }

            // 條件2: 檢查是否已有進行中的轉正投票
            const existingCampaign = await this.models.PromotionCampaign.findOne({
                where: {
                    triggerEmployeeId: employee.id,
                    campaignSubType: 'auto_promotion',
                    status: { [this.models.PromotionCampaign.sequelize.Sequelize.Op.in]: ['active', 'draft'] }
                }
            });

            if (existingCampaign) {
                return {
                    eligible: false,
                    reason: '已有進行中的轉正投票',
                    existingCampaignId: existingCampaign.id
                };
            }

            // 條件3: 檢查緩衝期
            const recentFailedCampaign = await this.models.PromotionCampaign.findOne({
                where: {
                    triggerEmployeeId: employee.id,
                    campaignSubType: 'auto_promotion',
                    status: 'closed',
                    results: { [this.models.PromotionCampaign.sequelize.Sequelize.Op.like]: '%failed%' }
                },
                order: [['endDate', 'DESC']]
            });

            if (recentFailedCampaign) {
                const endDate = new Date(recentFailedCampaign.endDate);
                const bufferEndDate = new Date(endDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30天緩衝期
                
                if (today < bufferEndDate) {
                    return {
                        eligible: false,
                        reason: '仍在緩衝期內',
                        bufferEndDate
                    };
                }
            }

            return {
                eligible: true,
                reason: '符合轉正投票條件',
                daysWorked
            };

        } catch (error) {
            logger.error(`檢查員工 ${employee.id} 轉正資格失敗:`, error);
            return {
                eligible: false,
                reason: '系統檢查失敗'
            };
        }
    }

    /**
     * 創建新人轉正投票活動
     * @param {Object} employee 員工對象
     */
    async createPromotionCampaign(employee) {
        try {
            const startDate = new Date();
            startDate.setHours(0, 0, 0, 0);
            
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 5); // 5天投票期
            endDate.setHours(23, 59, 59, 999);

            const campaign = await this.models.PromotionCampaign.create({
                campaignName: `${employee.name} 轉正投票`,
                campaignDescription: `評估 ${employee.name} 是否適合從實習生轉為正式員工`,
                targetPosition: '員工',
                campaignType: 'single_choice',
                campaignSubType: 'auto_promotion',
                maxVotesPerPerson: 1,
                startDate,
                endDate,
                status: 'active',
                isAnonymous: true,
                priority: 5, // 高優先級
                canModifyVotes: true,
                maxModifications: 3,
                bufferPeriodDays: 30,
                passThreshold: 50.00,
                triggerEmployeeId: employee.id,
                systemGenerated: true,
                createdBy: 'AUTO_SYSTEM',
                eligibleVoterCriteria: {
                    positions: ['員工', '副店長', '店長', '區域經理'],
                    minYearsOfService: 0,
                    excludeEmployees: [employee.id] // 候選人不能投自己
                },
                triggerConditions: {
                    type: 'new_employee_promotion',
                    hireDate: employee.hireDate,
                    daysWorked: Math.floor((new Date() - new Date(employee.hireDate)) / (1000 * 60 * 60 * 24)),
                    autoGenerated: true
                }
            });

            // 創建候選人記錄 (員工自己)
            const anonymousId = `AUTO_PROMO_${campaign.id}_001`;
            
            const candidate = await this.models.PromotionCandidate.create({
                campaignId: campaign.id,
                employeeId: employee.id,
                candidateName: employee.name,
                currentPosition: employee.position,
                currentStore: employee.currentStore,
                yearsOfService: this.calculateYearsOfService(employee.hireDate),
                candidateStatement: '希望能夠轉為正式員工，繼續為公司貢獻',
                qualifications: ['完成實習期訓練', '具備基本工作技能'],
                achievements: ['準時出勤', '積極學習'],
                nominatedBy: 'AUTO_SYSTEM',
                anonymousId,
                displayOrder: 1,
                status: 'approved'
            });

            logger.info('新人轉正投票創建成功:', {
                campaignId: campaign.id,
                employeeName: employee.name,
                employeeId: employee.id,
                candidateId: candidate.id
            });

            // 發送通知
            await this.sendPromotionNotifications(campaign, employee);

            return campaign;

        } catch (error) {
            logger.error(`創建 ${employee.name} 轉正投票失敗:`, error);
            throw error;
        }
    }

    /**
     * ==========================================
     * 降職懲罰自動投票系統  
     * ==========================================
     */

    /**
     * 檢查並創建降職懲罰投票
     * 每日00:00執行
     */
    async checkDemotionPunishments() {
        try {
            await this.initialize();
            
            logger.info('開始檢查降職懲罰條件...');
            
            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth() + 1;

            // 獲取符合懲罰條件的員工統計
            const punishmentCandidates = await this.models.AttendanceStatistics.findPunishmentCandidates(year, month);

            if (punishmentCandidates.length > 0) {
                logger.info(`發現 ${punishmentCandidates.length} 名員工觸發懲罰條件`);
                
                for (const stats of punishmentCandidates) {
                    await this.createDemotionCampaign(stats, stats.Employee);
                }
            } else {
                logger.info('今日無員工觸發懲罰條件');
            }

        } catch (error) {
            logger.error('檢查降職懲罰條件失敗:', error);
            throw error;
        }
    }

    /**
     * 創建降職懲罰投票活動
     * @param {Object} stats 遲到統計對象
     * @param {Object} employee 員工對象
     */
    async createDemotionCampaign(stats, employee) {
        try {
            // 檢查員工是否可以被降職 (實習生無法再降職)
            if (employee.position === '實習生') {
                logger.info(`員工 ${employee.name} 已是實習生，無法降職`);
                return null;
            }

            const startDate = new Date();
            startDate.setHours(0, 0, 0, 0);
            
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 3); // 3天投票期
            endDate.setHours(23, 59, 59, 999);

            // 分析目標降職職位
            const targetPosition = this.analyzeDemotionTarget(employee, stats);

            const campaign = await this.models.PromotionCampaign.create({
                campaignName: `${employee.name} 降職懲罰投票`,
                campaignDescription: `因遲到問題對 ${employee.name} 進行降職懲罰投票 (遲到${stats.lateCount}次/${stats.lateMinutesTotal}分鐘)`,
                targetPosition,
                campaignType: 'single_choice',
                campaignSubType: 'auto_demotion',
                maxVotesPerPerson: 1,
                startDate,
                endDate,
                status: 'active',
                isAnonymous: true,
                priority: 10, // 最高優先級
                canModifyVotes: true,
                maxModifications: 3,
                bufferPeriodDays: 0, // 無緩衝期
                passThreshold: 30.00, // 30%同意即成立
                triggerEmployeeId: employee.id,
                systemGenerated: true,
                createdBy: 'AUTO_SYSTEM',
                eligibleVoterCriteria: {
                    positions: ['員工', '副店長', '店長', '區域經理'],
                    minYearsOfService: 0,
                    excludeEmployees: [employee.id] // 當事人不能投票
                },
                triggerConditions: {
                    type: 'lateness_punishment',
                    year: stats.year,
                    month: stats.month,
                    lateCount: stats.lateCount,
                    lateMinutesTotal: stats.lateMinutesTotal,
                    punishmentNumber: stats.punishmentCount + 1,
                    autoGenerated: true
                }
            });

            // 創建候選人記錄 (被懲罰的員工)
            const anonymousId = `AUTO_DEMO_${campaign.id}_001`;
            
            const candidate = await this.models.PromotionCandidate.create({
                campaignId: campaign.id,
                employeeId: employee.id,
                candidateName: employee.name,
                currentPosition: employee.position,
                currentStore: employee.currentStore,
                yearsOfService: this.calculateYearsOfService(employee.hireDate),
                candidateStatement: '遲到情況說明和改善承諾',
                qualifications: [],
                achievements: [],
                nominatedBy: 'AUTO_SYSTEM',
                anonymousId,
                displayOrder: 1,
                status: 'approved'
            });

            // 標記統計已觸發懲罰
            await stats.markPunishmentTriggered();

            logger.info('降職懲罰投票創建成功:', {
                campaignId: campaign.id,
                employeeName: employee.name,
                employeeId: employee.id,
                lateCount: stats.lateCount,
                lateMinutes: stats.lateMinutesTotal,
                targetPosition
            });

            // 發送通知
            await this.sendDemotionNotifications(campaign, employee, stats);

            return campaign;

        } catch (error) {
            logger.error(`創建 ${employee.name} 降職懲罰投票失敗:`, error);
            throw error;
        }
    }

    /**
     * ==========================================
     * 輔助方法
     * ==========================================
     */

    /**
     * 分析降職目標職位
     * @param {Object} employee 員工對象
     * @param {Object} stats 遲到統計
     * @returns {string} 目標職位
     */
    analyzeDemotionTarget(employee, stats) {
        const positionHierarchy = ['區域經理', '店長', '副店長', '員工', '實習生'];
        const currentIndex = positionHierarchy.indexOf(employee.position);
        
        if (currentIndex === -1 || currentIndex === positionHierarchy.length - 1) {
            return employee.position; // 已是最低職位或職位不在階層中
        }

        // 檢查是否有進行中的其他懲罰投票
        // TODO: 實現智能分析邏輯，預測第一次懲罰結果來決定第二次懲罰職位

        return positionHierarchy[currentIndex + 1]; // 降一級
    }

    /**
     * 計算工作年資
     * @param {string|Date} hireDate 到職日期
     * @returns {number} 年資
     */
    calculateYearsOfService(hireDate) {
        const hire = new Date(hireDate);
        const now = new Date();
        return Math.round((now - hire) / (1000 * 60 * 60 * 24 * 365) * 10) / 10;
    }

    /**
     * 發送轉正投票通知
     * @param {Object} campaign 投票活動
     * @param {Object} employee 員工對象
     */
    async sendPromotionNotifications(campaign, employee) {
        try {
            const daysWorked = Math.floor((new Date() - new Date(employee.hireDate)) / (1000 * 60 * 60 * 24));
            
            // 管理員群組通知
            const adminMessage = `🏢 系統通知：員工 ${employee.name} 已到職滿20天(${daysWorked}天)，轉正投票已自動開啟，請大家評估其工作表現。\n\n` +
                `📊 投票詳情：\n` +
                `• 投票期間：${campaign.startDate.toLocaleDateString()} - ${campaign.endDate.toLocaleDateString()}\n` +
                `• 通過門檻：50%同意\n` +
                `• 投票ID：${campaign.id}`;

            await this.notificationService.sendNotification('admin', adminMessage);

            // 員工群組通知
            const employeeMessage = `📊 投票通知：員工 ${employee.name} 轉正投票已開始，請各位同事參與投票評估。\n\n` +
                `投票截止：${campaign.endDate.toLocaleString()}\n` +
                `投票連結：/promotion/vote/${campaign.id}`;

            await this.notificationService.sendNotification('employee', employeeMessage);

        } catch (error) {
            logger.error('發送轉正投票通知失敗:', error);
        }
    }

    /**
     * 發送降職懲罰通知
     * @param {Object} campaign 投票活動
     * @param {Object} employee 員工對象
     * @param {Object} stats 遲到統計
     */
    async sendDemotionNotifications(campaign, employee, stats) {
        try {
            // 管理員群組通知
            const adminMessage = `⚠️ 懲罰通知：員工 ${employee.name} 因遲到問題觸發降職投票。\n\n` +
                `📊 遲到統計：\n` +
                `• 遲到次數：${stats.lateCount}次\n` +
                `• 遲到分鐘：${stats.lateMinutesTotal}分鐘\n` +
                `• 目標職位：${campaign.targetPosition}\n` +
                `• 通過門檻：30%同意\n\n` +
                `投票期間：${campaign.startDate.toLocaleDateString()} - ${campaign.endDate.toLocaleDateString()}`;

            await this.notificationService.sendNotification('admin', adminMessage);

            // 員工群組通知  
            const employeeMessage = `📋 投票通知：降職懲罰投票已開始，請評估相關員工情況。\n\n` +
                `投票截止：${campaign.endDate.toLocaleString()}\n` +
                `投票連結：/promotion/vote/${campaign.id}`;

            await this.notificationService.sendNotification('employee', employeeMessage);

        } catch (error) {
            logger.error('發送降職懲罰通知失敗:', error);
        }
    }

    /**
     * 每月重置遲到統計
     */
    async resetMonthlyAttendanceStats() {
        try {
            await this.initialize();
            
            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth() + 1;

            await this.models.AttendanceStatistics.resetAllMonthlyStats(year, month);
            
            logger.info(`已重置 ${year}年${month}月 所有員工遲到統計`);

            // 發送重置通知
            const resetMessage = `📊 系統通知：${year}年${month}月遲到統計已重置，新月度統計開始計算。`;
            await this.notificationService.sendNotification('admin', resetMessage);

        } catch (error) {
            logger.error('重置月度遲到統計失敗:', error);
            throw error;
        }
    }

    /**
     * 處理到期投票活動
     */
    async processExpiredCampaigns() {
        try {
            await this.initialize();
            
            const now = new Date();
            const expiredCampaigns = await this.models.PromotionCampaign.findAll({
                where: {
                    status: 'active',
                    endDate: { [this.models.PromotionCampaign.sequelize.Sequelize.Op.lt]: now }
                }
            });

            for (const campaign of expiredCampaigns) {
                await this.processCampaignResults(campaign);
            }

            if (expiredCampaigns.length > 0) {
                logger.info(`處理了 ${expiredCampaigns.length} 個到期投票活動`);
            }

        } catch (error) {
            logger.error('處理到期投票活動失敗:', error);
            throw error;
        }
    }

    /**
     * 處理投票活動結果
     * @param {Object} campaign 投票活動
     */
    async processCampaignResults(campaign) {
        try {
            // 計算投票結果
            const totalVotes = await this.models.PromotionVote.count({
                where: { campaignId: campaign.id, isValid: true }
            });

            const agreeVotes = await this.models.PromotionVote.count({
                where: { 
                    campaignId: campaign.id, 
                    isValid: true,
                    currentDecision: 'agree'
                }
            });

            const agreePercentage = totalVotes > 0 ? (agreeVotes / totalVotes * 100) : 0;
            const passed = agreePercentage >= campaign.passThreshold;

            const results = {
                totalVotes,
                agreeVotes,
                agreePercentage: agreePercentage.toFixed(2),
                passed,
                processedAt: new Date(),
                campaignType: campaign.campaignSubType
            };

            // 更新活動狀態和結果
            await campaign.update({
                status: 'closed',
                results
            });

            // 執行相應的職位變更
            if (passed) {
                await this.executePositionChange(campaign, 'promotion');
            } else if (campaign.campaignSubType === 'auto_demotion' && passed) {
                await this.executePositionChange(campaign, 'demotion');
            }

            logger.info(`投票活動 ${campaign.id} 結果處理完成:`, results);

        } catch (error) {
            logger.error(`處理投票活動 ${campaign.id} 結果失敗:`, error);
            throw error;
        }
    }

    /**
     * 執行職位變更
     * @param {Object} campaign 投票活動
     * @param {string} type 變更類型 ('promotion' | 'demotion')
     */
    async executePositionChange(campaign, type) {
        try {
            if (!campaign.triggerEmployeeId) return;

            const employee = await this.models.Employee.findByPk(campaign.triggerEmployeeId);
            if (!employee) return;

            const oldPosition = employee.position;
            const newPosition = campaign.targetPosition;

            await employee.update({
                position: newPosition,
                positionStartDate: new Date()
            });

            logger.info(`員工 ${employee.name} 職位變更: ${oldPosition} → ${newPosition}`);

            // 發送職位變更通知
            const changeType = type === 'promotion' ? '晉升' : '降職';
            const changeMessage = `🔄 職位變更：員工 ${employee.name} 已執行${changeType} (${oldPosition} → ${newPosition})`;
            
            await this.notificationService.sendNotification('admin', changeMessage);

        } catch (error) {
            logger.error('執行職位變更失敗:', error);
            throw error;
        }
    }
}

module.exports = new AutoVotingEngine();