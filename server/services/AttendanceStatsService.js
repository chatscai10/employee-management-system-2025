/**
 * =======================================
 * 遲到統計服務 - AttendanceStatsService
 * =======================================
 * 處理員工遲到統計，整合到打卡系統
 */

const logger = require('../utils/logger');
const { getModels } = require('../models');

class AttendanceStatsService {
    constructor() {
        this.models = null;
    }

    /**
     * 初始化服務
     */
    async initialize() {
        this.models = getModels();
        
        if (!this.models.AttendanceStatistics) {
            throw new Error('AttendanceStatistics模型未載入');
        }
    }

    /**
     * 處理遲到打卡記錄
     * @param {Object} attendanceRecord 打卡記錄
     */
    async processLateAttendance(attendanceRecord) {
        try {
            await this.initialize();

            // 只處理遲到的上班打卡
            if (attendanceRecord.status !== '遲到' || attendanceRecord.clockType !== '上班') {
                return null;
            }

            const clockTime = new Date(attendanceRecord.clockTime);
            const year = clockTime.getFullYear();
            const month = clockTime.getMonth() + 1;

            // 計算遲到分鐘數 (假設上班時間是9:00)
            const expectedTime = new Date(clockTime);
            expectedTime.setHours(9, 0, 0, 0);
            
            const lateMinutes = Math.floor((clockTime - expectedTime) / (1000 * 60));
            
            if (lateMinutes <= 0) {
                return null; // 不是真正的遲到
            }

            // 獲取或創建月度統計
            const stats = await this.models.AttendanceStatistics.findOrCreateMonthlyStats(
                attendanceRecord.employeeId,
                year,
                month
            );

            // 更新遲到記錄
            await stats.addLateRecord({
                date: clockTime.toISOString().split('T')[0],
                minutes: lateMinutes,
                reason: '遲到打卡',
                attendanceRecordId: attendanceRecord.id
            });

            logger.info('遲到統計更新完成', {
                employeeId: attendanceRecord.employeeId,
                employeeName: attendanceRecord.employeeName,
                date: clockTime.toISOString().split('T')[0],
                lateMinutes,
                totalLateCount: stats.lateCount,
                totalLateMinutes: stats.lateMinutesTotal
            });

            // 檢查是否觸發懲罰條件
            if (stats.shouldTriggerPunishment()) {
                logger.warn('員工達到懲罰觸發條件', {
                    employeeId: attendanceRecord.employeeId,
                    employeeName: attendanceRecord.employeeName,
                    lateCount: stats.lateCount,
                    lateMinutesTotal: stats.lateMinutesTotal
                });

                // 通知自動投票引擎 (非阻塞)
                this.notifyAutoVotingEngine(stats, attendanceRecord).catch(error => {
                    logger.error('通知自動投票引擎失敗:', error);
                });
            }

            return {
                statsUpdated: true,
                currentLateCount: stats.lateCount,
                currentLateMinutes: stats.lateMinutesTotal,
                shouldTriggerPunishment: stats.shouldTriggerPunishment()
            };

        } catch (error) {
            logger.error('處理遲到統計失敗:', error);
            throw error;
        }
    }

    /**
     * 通知自動投票引擎觸發懲罰檢查
     * @param {Object} stats 統計對象
     * @param {Object} attendanceRecord 打卡記錄
     */
    async notifyAutoVotingEngine(stats, attendanceRecord) {
        try {
            // 延遲載入避免循環依賴
            const AutoVotingEngine = require('./AutoVotingEngine');
            
            // 只在第一次觸發時通知 (避免重複)
            if (!stats.isPunishmentTriggered) {
                const employee = await this.models.Employee.findByPk(attendanceRecord.employeeId);
                if (employee) {
                    await AutoVotingEngine.createDemotionCampaign(stats, employee);
                }
            }

        } catch (error) {
            logger.error('通知自動投票引擎失敗:', error);
        }
    }

    /**
     * 獲取員工月度遲到統計
     * @param {number} employeeId 員工ID
     * @param {number} year 年份
     * @param {number} month 月份
     * @returns {Promise<Object>}
     */
    async getEmployeeMonthlyStats(employeeId, year, month) {
        try {
            await this.initialize();

            const stats = await this.models.AttendanceStatistics.findOne({
                where: { employeeId, year, month },
                include: [{
                    model: this.models.Employee,
                    as: 'Employee',
                    attributes: ['name', 'position', 'currentStore']
                }]
            });

            if (!stats) {
                return {
                    employeeId,
                    year,
                    month,
                    lateCount: 0,
                    lateMinutesTotal: 0,
                    lateRecords: [],
                    isPunishmentTriggered: false,
                    punishmentCount: 0
                };
            }

            return stats;

        } catch (error) {
            logger.error('獲取員工月度統計失敗:', error);
            throw error;
        }
    }

    /**
     * 獲取所有員工當月遲到統計
     * @param {number} year 年份  
     * @param {number} month 月份
     * @returns {Promise<Array>}
     */
    async getAllEmployeesMonthlyStats(year, month) {
        try {
            await this.initialize();

            const allStats = await this.models.AttendanceStatistics.findAll({
                where: { year, month },
                include: [{
                    model: this.models.Employee,
                    as: 'Employee',
                    attributes: ['name', 'position', 'currentStore', 'status']
                }],
                order: [['lateMinutesTotal', 'DESC'], ['lateCount', 'DESC']]
            });

            return allStats;

        } catch (error) {
            logger.error('獲取所有員工月度統計失敗:', error);
            throw error;
        }
    }

    /**
     * 獲取觸發懲罰條件的員工
     * @param {number} year 年份
     * @param {number} month 月份
     * @returns {Promise<Array>}
     */
    async getPunishmentCandidates(year, month) {
        try {
            await this.initialize();
            
            return await this.models.AttendanceStatistics.findPunishmentCandidates(year, month);

        } catch (error) {
            logger.error('獲取懲罰候選人失敗:', error);
            throw error;
        }
    }

    /**
     * 重新計算所有統計 (修復數據用)
     * @param {number} year 年份
     * @param {number} month 月份
     */
    async recalculateMonthlyStats(year, month) {
        try {
            await this.initialize();
            
            logger.info(`開始重新計算 ${year}年${month}月 遲到統計...`);

            // 獲取該月所有遲到記錄
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59);

            const lateRecords = await this.models.AttendanceRecord.findAll({
                where: {
                    status: '遲到',
                    clockType: '上班',
                    clockTime: {
                        [this.models.AttendanceRecord.sequelize.Sequelize.Op.between]: [startDate, endDate]
                    }
                },
                order: [['employeeId', 'ASC'], ['clockTime', 'ASC']]
            });

            // 清空現有統計
            await this.models.AttendanceStatistics.destroy({
                where: { year, month }
            });

            // 按員工分組重新計算
            const employeeStats = {};
            
            for (const record of lateRecords) {
                if (!employeeStats[record.employeeId]) {
                    employeeStats[record.employeeId] = {
                        employeeId: record.employeeId,
                        year,
                        month,
                        lateCount: 0,
                        lateMinutesTotal: 0,
                        lateRecords: []
                    };
                }

                const clockTime = new Date(record.clockTime);
                const expectedTime = new Date(clockTime);
                expectedTime.setHours(9, 0, 0, 0);
                
                const lateMinutes = Math.floor((clockTime - expectedTime) / (1000 * 60));
                
                if (lateMinutes > 0) {
                    employeeStats[record.employeeId].lateCount++;
                    employeeStats[record.employeeId].lateMinutesTotal += lateMinutes;
                    employeeStats[record.employeeId].lateRecords.push({
                        date: clockTime.toISOString().split('T')[0],
                        minutes: lateMinutes,
                        reason: '遲到打卡',
                        attendanceRecordId: record.id
                    });
                }
            }

            // 創建新的統計記錄
            const createdStats = [];
            for (const stats of Object.values(employeeStats)) {
                const created = await this.models.AttendanceStatistics.create({
                    ...stats,
                    lastUpdated: new Date(),
                    isPunishmentTriggered: false,
                    punishmentCount: 0
                });
                createdStats.push(created);
            }

            logger.info(`重新計算完成，處理了 ${createdStats.length} 個員工的統計`);

            return {
                processedEmployees: createdStats.length,
                totalLateRecords: lateRecords.length,
                stats: createdStats
            };

        } catch (error) {
            logger.error('重新計算月度統計失敗:', error);
            throw error;
        }
    }

    /**
     * 獲取遲到排行榜
     * @param {number} year 年份
     * @param {number} month 月份
     * @param {number} limit 返回數量
     * @returns {Promise<Array>}
     */
    async getLatenessRanking(year, month, limit = 10) {
        try {
            await this.initialize();

            const ranking = await this.models.AttendanceStatistics.findAll({
                where: { year, month },
                include: [{
                    model: this.models.Employee,
                    as: 'Employee',
                    attributes: ['name', 'position', 'currentStore']
                }],
                order: [
                    ['lateMinutesTotal', 'DESC'],
                    ['lateCount', 'DESC']
                ],
                limit
            });

            return ranking.map((stats, index) => ({
                rank: index + 1,
                employeeId: stats.employeeId,
                employeeName: stats.Employee?.name,
                position: stats.Employee?.position,
                currentStore: stats.Employee?.currentStore,
                lateCount: stats.lateCount,
                lateMinutesTotal: stats.lateMinutesTotal,
                averageLateness: stats.lateCount > 0 ? Math.round(stats.lateMinutesTotal / stats.lateCount) : 0,
                isPunishmentTriggered: stats.isPunishmentTriggered,
                punishmentCount: stats.punishmentCount
            }));

        } catch (error) {
            logger.error('獲取遲到排行榜失敗:', error);
            throw error;
        }
    }

    /**
     * 獲取統計摘要
     * @param {number} year 年份
     * @param {number} month 月份
     * @returns {Promise<Object>}
     */
    async getStatsSummary(year, month) {
        try {
            await this.initialize();

            const allStats = await this.models.AttendanceStatistics.findAll({
                where: { year, month }
            });

            const totalEmployees = allStats.length;
            const lateEmployees = allStats.filter(s => s.lateCount > 0).length;
            const punishmentTriggered = allStats.filter(s => s.isPunishmentTriggered).length;
            const totalLateCount = allStats.reduce((sum, s) => sum + s.lateCount, 0);
            const totalLateMinutes = allStats.reduce((sum, s) => sum + s.lateMinutesTotal, 0);

            return {
                period: `${year}年${month}月`,
                totalEmployees,
                lateEmployees,
                onTimeEmployees: totalEmployees - lateEmployees,
                lateEmployeeRate: totalEmployees > 0 ? Math.round(lateEmployees / totalEmployees * 100) : 0,
                punishmentTriggered,
                punishmentRate: totalEmployees > 0 ? Math.round(punishmentTriggered / totalEmployees * 100) : 0,
                totalLateCount,
                totalLateMinutes,
                averageLateMinutesPerEmployee: totalEmployees > 0 ? Math.round(totalLateMinutes / totalEmployees) : 0,
                averageLateCountPerEmployee: totalEmployees > 0 ? Math.round(totalLateCount / totalEmployees * 10) / 10 : 0
            };

        } catch (error) {
            logger.error('獲取統計摘要失敗:', error);
            throw error;
        }
    }
}

module.exports = new AttendanceStatsService();