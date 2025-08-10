const ScheduleConfig = require('../models/ScheduleConfig');
const ScheduleSession = require('../models/ScheduleSession');

/**
 * 排班系統時間控制器
 * 負責管理系統開放時間、排他性操作、會話管理
 */
class ScheduleTimeController {

    /**
     * 檢查系統是否開放
     * @param {number} year 年份
     * @param {number} month 月份
     * @returns {Object} 系統狀態
     */
    static async isSystemOpen(year, month) {
        try {
            const config = await ScheduleConfig.getConfig(year, month);
            if (!config) {
                return {
                    isOpen: false,
                    reason: '無法獲取排班配置',
                    config: null
                };
            }

            const now = new Date();
            const isInTimeRange = now >= config.systemOpenDate && now <= config.systemCloseDate;

            return {
                isOpen: isInTimeRange,
                reason: isInTimeRange ? '系統開放中' : this.getCloseReason(now, config),
                config: {
                    openTime: config.systemOpenDate,
                    closeTime: config.systemCloseDate,
                    timeLimit: config.scheduleTimeLimit
                }
            };
        } catch (error) {
            console.error('檢查系統開放狀態錯誤:', error);
            return {
                isOpen: false,
                reason: `系統錯誤: ${error.message}`,
                config: null
            };
        }
    }

    /**
     * 檢查系統是否被佔用
     * @returns {Object} 佔用狀態
     */
    static async isSystemBusy() {
        try {
            // 先清理超時會話
            await ScheduleSession.checkAndCleanupSessions();

            // 檢查是否有活躍會話
            const activeSession = await ScheduleSession.getCurrentActiveSession();
            
            if (activeSession) {
                return {
                    isBusy: true,
                    session: {
                        employeeName: activeSession.employeeName,
                        startTime: activeSession.startTime,
                        remainingTime: activeSession.getFormattedRemainingTime(),
                        year: activeSession.sessionYear,
                        month: activeSession.sessionMonth
                    }
                };
            }

            return {
                isBusy: false,
                session: null
            };
        } catch (error) {
            console.error('檢查系統佔用狀態錯誤:', error);
            return {
                isBusy: false,
                session: null
            };
        }
    }

    /**
     * 開始排班會話
     * @param {number} employeeId 員工ID
     * @param {string} employeeName 員工姓名
     * @param {number} year 年份
     * @param {number} month 月份
     * @returns {Object} 會話結果
     */
    static async startScheduleSession(employeeId, employeeName, year, month) {
        try {
            // 檢查系統是否開放
            const systemStatus = await this.isSystemOpen(year, month);
            if (!systemStatus.isOpen) {
                return {
                    success: false,
                    reason: `系統未開放: ${systemStatus.reason}`,
                    session: null
                };
            }

            // 檢查系統是否被佔用
            const busyStatus = await this.isSystemBusy();
            if (busyStatus.isBusy) {
                return {
                    success: false,
                    reason: `系統被佔用中，${busyStatus.session.employeeName} 正在排班 (剩餘時間: ${busyStatus.session.remainingTime})`,
                    session: busyStatus.session
                };
            }

            // 創建新會話
            const session = await ScheduleSession.createSession(
                employeeId, 
                employeeName, 
                year, 
                month,
                systemStatus.config.timeLimit
            );

            console.log(`🚀 排班會話開始 - ${employeeName} (${year}-${month})`);

            return {
                success: true,
                reason: '會話創建成功',
                session: {
                    id: session.id,
                    employeeName: session.employeeName,
                    startTime: session.startTime,
                    remainingTime: session.getFormattedRemainingTime(),
                    year: session.sessionYear,
                    month: session.sessionMonth,
                    timeLimit: systemStatus.config.timeLimit
                }
            };
        } catch (error) {
            console.error('開始排班會話錯誤:', error);
            return {
                success: false,
                reason: `創建會話失敗: ${error.message}`,
                session: null
            };
        }
    }

    /**
     * 檢查會話是否超時
     * @param {number} sessionId 會話ID
     * @returns {Object} 超時檢查結果
     */
    static async checkSessionTimeout(sessionId) {
        try {
            const session = await ScheduleSession.findByPk(sessionId);
            if (!session) {
                return {
                    isTimeout: true,
                    reason: '會話不存在',
                    session: null
                };
            }

            if (session.sessionStatus !== 'active') {
                return {
                    isTimeout: true,
                    reason: `會話已結束 (狀態: ${session.sessionStatus})`,
                    session: session
                };
            }

            const remainingTime = session.getRemainingTime();
            if (remainingTime <= 0) {
                // 標記會話超時
                session.sessionStatus = 'expired';
                session.endTime = new Date();
                await session.save();

                return {
                    isTimeout: true,
                    reason: '會話已超時',
                    session: session
                };
            }

            return {
                isTimeout: false,
                reason: '會話正常',
                session: session,
                remainingTime: session.getFormattedRemainingTime()
            };
        } catch (error) {
            console.error('檢查會話超時錯誤:', error);
            return {
                isTimeout: true,
                reason: `檢查超時錯誤: ${error.message}`,
                session: null
            };
        }
    }

    /**
     * 更新會話活動時間
     * @param {number} sessionId 會話ID
     * @returns {Object} 更新結果
     */
    static async updateSessionActivity(sessionId) {
        try {
            const session = await ScheduleSession.findByPk(sessionId);
            if (!session) {
                return {
                    success: false,
                    reason: '會話不存在'
                };
            }

            if (session.sessionStatus !== 'active') {
                return {
                    success: false,
                    reason: `會話已結束 (狀態: ${session.sessionStatus})`
                };
            }

            await session.updateActivity();

            return {
                success: true,
                reason: '活動時間更新成功',
                remainingTime: session.getFormattedRemainingTime()
            };
        } catch (error) {
            console.error('更新會話活動時間錯誤:', error);
            return {
                success: false,
                reason: `更新失敗: ${error.message}`
            };
        }
    }

    /**
     * 完成會話
     * @param {number} sessionId 會話ID
     * @returns {Object} 完成結果
     */
    static async completeSession(sessionId) {
        try {
            const session = await ScheduleSession.findByPk(sessionId);
            if (!session) {
                return {
                    success: false,
                    reason: '會話不存在'
                };
            }

            await session.completeSession();

            console.log(`✅ 排班會話完成 - ${session.employeeName} (${session.sessionYear}-${session.sessionMonth})`);

            return {
                success: true,
                reason: '會話完成',
                session: session
            };
        } catch (error) {
            console.error('完成會話錯誤:', error);
            return {
                success: false,
                reason: `完成會話失敗: ${error.message}`
            };
        }
    }

    /**
     * 強制結束所有會話 (管理員用)
     * @param {string} reason 結束原因
     * @returns {Object} 結束結果
     */
    static async forceEndAllSessions(reason = '管理員強制結束') {
        try {
            const activeSessions = await ScheduleSession.findAll({
                where: { sessionStatus: 'active' }
            });

            if (activeSessions.length === 0) {
                return {
                    success: true,
                    reason: '無活躍會話需要結束',
                    endedCount: 0
                };
            }

            // 結束所有活躍會話
            await ScheduleSession.update(
                { 
                    sessionStatus: 'expired', 
                    endTime: new Date() 
                },
                { where: { sessionStatus: 'active' } }
            );

            console.log(`🔴 強制結束 ${activeSessions.length} 個排班會話 - 原因: ${reason}`);

            return {
                success: true,
                reason: `成功結束 ${activeSessions.length} 個會話`,
                endedCount: activeSessions.length
            };
        } catch (error) {
            console.error('強制結束會話錯誤:', error);
            return {
                success: false,
                reason: `強制結束失敗: ${error.message}`,
                endedCount: 0
            };
        }
    }

    /**
     * 獲取系統關閉原因
     * @param {Date} now 當前時間
     * @param {Object} config 配置
     * @returns {string} 關閉原因
     */
    static getCloseReason(now, config) {
        if (now < config.systemOpenDate) {
            const timeDiff = Math.ceil((config.systemOpenDate - now) / (1000 * 60 * 60 * 24));
            return `系統未開啟，將於 ${config.systemOpenDate.toLocaleString()} 開放 (剩餘 ${timeDiff} 天)`;
        } else if (now > config.systemCloseDate) {
            return `系統已關閉，關閉時間: ${config.systemCloseDate.toLocaleString()}`;
        } else {
            return '系統時間配置異常';
        }
    }

    /**
     * 獲取系統完整狀態
     * @param {number} year 年份
     * @param {number} month 月份
     * @returns {Object} 完整系統狀態
     */
    static async getSystemStatus(year, month) {
        try {
            const systemOpen = await this.isSystemOpen(year, month);
            const systemBusy = await this.isSystemBusy();

            return {
                isOpen: systemOpen.isOpen,
                isBusy: systemBusy.isBusy,
                canAccess: systemOpen.isOpen && !systemBusy.isBusy,
                openInfo: systemOpen,
                busyInfo: systemBusy,
                currentTime: new Date(),
                status: systemOpen.isOpen ? 
                    (systemBusy.isBusy ? 'busy' : 'available') : 
                    'closed'
            };
        } catch (error) {
            console.error('獲取系統狀態錯誤:', error);
            return {
                isOpen: false,
                isBusy: false,
                canAccess: false,
                error: error.message,
                status: 'error'
            };
        }
    }

    /**
     * 定期清理超時會話 (定時任務用)
     * @returns {Object} 清理結果
     */
    static async cleanupTimeoutSessions() {
        try {
            const cleanedCount = await ScheduleSession.checkAndCleanupSessions();
            
            if (cleanedCount > 0) {
                console.log(`🧹 定期清理了 ${cleanedCount} 個超時的排班會話`);
            }

            return {
                success: true,
                cleanedCount: cleanedCount
            };
        } catch (error) {
            console.error('定期清理會話錯誤:', error);
            return {
                success: false,
                error: error.message,
                cleanedCount: 0
            };
        }
    }
}

module.exports = ScheduleTimeController;