/**
 * ===================================
 * 排班管理控制器 - Schedule Controller
 * ===================================
 * 智慧排班系統控制器 - 實現6重規則引擎的排班管理功能
 */

const { Op } = require('sequelize');
const { initModels, getModels } = require('../models');
const ScheduleRuleEngine = require('../services/schedule-rule-engine');
const ScheduleTimeController = require('../services/schedule-time-controller');
const logger = require('../utils/logger');
const responseHelper = require('../utils/responseHelper');

class ScheduleController {

    /**
     * 獲取排班系統狀態
     */
    static async getScheduleStatus(req, res) {
        try {
            await initModels();
            const models = getModels();
            
            const { year, month } = req.params;
            const scheduleYear = parseInt(year) || new Date().getFullYear();
            const scheduleMonth = parseInt(month) || (new Date().getMonth() + 1);
            
            // 獲取配置
            const config = await models.ScheduleConfig.getConfig(scheduleYear, scheduleMonth);
            if (!config) {
                return responseHelper.error(res, '無法獲取排班配置', 'CONFIG_NOT_FOUND', 404);
            }
            
            // 檢查系統是否開放
            const isOpen = ScheduleTimeController.isSystemOpen(scheduleYear, scheduleMonth, config);
            const isBusy = await ScheduleTimeController.isSystemBusy();
            
            // 獲取統計資訊
            const totalEmployees = await models.Employee.count({ where: { status: '在職' } });
            const completedSchedules = await models.Schedule.count({
                where: { 
                    scheduleYear,
                    scheduleMonth,
                    scheduleStatus: 'completed'
                }
            });
            
            responseHelper.success(res, {
                period: { year: scheduleYear, month: scheduleMonth },
                systemStatus: {
                    isOpen,
                    isBusy: !!isBusy,
                    currentUser: isBusy?.employeeName || null,
                    remainingTime: isBusy?.timeRemaining || null
                },
                config: {
                    maxOffDaysPerPerson: config.maxOffDaysPerPerson,
                    maxOffDaysPerDay: config.maxOffDaysPerDay,
                    maxWeekendOffDays: config.maxWeekendOffDays,
                    systemOpenDate: config.systemOpenDate,
                    systemCloseDate: config.systemCloseDate,
                    scheduleTimeLimit: config.scheduleTimeLimit
                },
                statistics: {
                    totalEmployees,
                    completedSchedules,
                    completionRate: totalEmployees > 0 ? ((completedSchedules / totalEmployees) * 100).toFixed(1) : '0.0'
                }
            }, '排班系統狀態獲取成功');
            
        } catch (error) {
            logger.error('獲取排班系統狀態失敗:', error);
            responseHelper.error(res, '獲取排班系統狀態失敗', 'SYSTEM_ERROR');
        }
    }

    /**
     * 獲取員工排班記錄
     */
    static async getEmployeeSchedule(req, res) {
        try {
            await initModels();
            const models = getModels();
            
            const { employeeId, year, month } = req.params;
            const scheduleYear = parseInt(year) || new Date().getFullYear();
            const scheduleMonth = parseInt(month) || (new Date().getMonth() + 1);
            
            // 檢查員工是否存在
            const employee = await models.Employee.findByPk(employeeId);
            if (!employee) {
                return responseHelper.error(res, '員工不存在', 'EMPLOYEE_NOT_FOUND', 404);
            }
            
            // 獲取排班記錄
            let schedule = await models.Schedule.findOne({
                where: {
                    employeeId,
                    scheduleYear,
                    scheduleMonth
                }
            });
            
            // 如果沒有記錄，創建預設記錄
            if (!schedule) {
                schedule = {
                    employeeId,
                    employeeName: employee.name,
                    scheduleYear,
                    scheduleMonth,
                    offDates: [],
                    totalOffDays: 0,
                    weekendOffDays: 0,
                    scheduleStatus: 'pending'
                };
            }
            
            responseHelper.success(res, {
                schedule,
                employee: {
                    id: employee.id,
                    name: employee.name,
                    position: employee.position,
                    currentStore: employee.currentStore
                }
            }, '員工排班記錄獲取成功');
            
        } catch (error) {
            logger.error('獲取員工排班記錄失敗:', error);
            responseHelper.error(res, '獲取員工排班記錄失敗', 'SYSTEM_ERROR');
        }
    }

    /**
     * 提交員工排班
     */
    static async submitEmployeeSchedule(req, res) {
        try {
            await initModels();
            const models = getModels();
            
            const { employeeId, year, month } = req.params;
            const { offDates } = req.body;
            const scheduleYear = parseInt(year);
            const scheduleMonth = parseInt(month);
            
            // 驗證輸入
            if (!Array.isArray(offDates)) {
                return responseHelper.error(res, '休假日期格式錯誤', 'INVALID_INPUT', 400);
            }
            
            // 檢查系統狀態
            const config = await models.ScheduleConfig.getConfig(scheduleYear, scheduleMonth);
            if (!config) {
                return responseHelper.error(res, '無法獲取排班配置', 'CONFIG_NOT_FOUND', 404);
            }
            
            const isOpen = ScheduleTimeController.isSystemOpen(scheduleYear, scheduleMonth, config);
            if (!isOpen) {
                return responseHelper.error(res, '排班系統未開放或已關閉', 'SYSTEM_CLOSED', 403);
            }
            
            // 檢查是否有其他員工在使用
            const busySession = await ScheduleTimeController.isSystemBusy();
            if (busySession && busySession.employeeId !== parseInt(employeeId)) {
                return responseHelper.error(res, `系統正被 ${busySession.employeeName} 使用中`, 'SYSTEM_BUSY', 409);
            }
            
            // 開始排班會話
            const session = await ScheduleTimeController.startScheduleSession(employeeId, scheduleYear, scheduleMonth);
            
            try {
                // 執行6重規則驗證
                const validation = await ScheduleRuleEngine.validateAllRules(
                    parseInt(employeeId), 
                    scheduleYear, 
                    scheduleMonth, 
                    offDates
                );
                
                if (!validation.isValid) {
                    return responseHelper.error(res, validation.violations.join('; '), 'VALIDATION_FAILED', 400);
                }
                
                // 保存排班記錄
                const weekendOffDays = ScheduleRuleEngine.countWeekendDays(offDates);
                
                const [schedule] = await models.Schedule.upsert({
                    employeeId: parseInt(employeeId),
                    employeeName: (await models.Employee.findByPk(employeeId)).name,
                    scheduleYear,
                    scheduleMonth,
                    offDates,
                    totalOffDays: offDates.length,
                    weekendOffDays,
                    scheduleStatus: 'completed',
                    ruleValidation: validation,
                    updatedAt: new Date()
                });
                
                // 結束會話
                await ScheduleTimeController.endScheduleSession(session.id);
                
                logger.info('排班提交成功', {
                    employeeId,
                    scheduleYear,
                    scheduleMonth,
                    offDatesCount: offDates.length
                });
                
                responseHelper.success(res, {
                    schedule,
                    validation
                }, '排班提交成功');
                
            } catch (error) {
                // 確保會話結束
                if (session) {
                    await ScheduleTimeController.endScheduleSession(session.id).catch(() => {});
                }
                throw error;
            }
            
        } catch (error) {
            logger.error('提交員工排班失敗:', error);
            responseHelper.error(res, '提交排班失敗', 'SYSTEM_ERROR');
        }
    }

    /**
     * 獲取所有員工排班統計
     */
    static async getAllSchedulesSummary(req, res) {
        try {
            await initModels();
            const models = getModels();
            
            const { year, month } = req.params;
            const scheduleYear = parseInt(year) || new Date().getFullYear();
            const scheduleMonth = parseInt(month) || (new Date().getMonth() + 1);
            
            // 獲取所有員工排班記錄
            const schedules = await models.Schedule.findAll({
                where: {
                    scheduleYear,
                    scheduleMonth
                },
                order: [['employeeName', 'ASC']]
            });
            
            // 統計每日休假人數
            const dailyStats = {};
            const daysInMonth = new Date(scheduleYear, scheduleMonth, 0).getDate();
            
            for (let day = 1; day <= daysInMonth; day++) {
                const dateStr = `${scheduleYear}-${scheduleMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                dailyStats[dateStr] = {
                    date: dateStr,
                    offCount: 0,
                    employees: []
                };
            }
            
            schedules.forEach(schedule => {
                if (schedule.offDates && Array.isArray(schedule.offDates)) {
                    schedule.offDates.forEach(dateStr => {
                        if (dailyStats[dateStr]) {
                            dailyStats[dateStr].offCount++;
                            dailyStats[dateStr].employees.push({
                                id: schedule.employeeId,
                                name: schedule.employeeName
                            });
                        }
                    });
                }
            });
            
            responseHelper.success(res, {
                period: { year: scheduleYear, month: scheduleMonth },
                schedules,
                dailyStats: Object.values(dailyStats),
                summary: {
                    totalEmployees: schedules.length,
                    completedSchedules: schedules.filter(s => s.scheduleStatus === 'completed').length,
                    avgOffDays: schedules.length > 0 ? 
                        (schedules.reduce((sum, s) => sum + (s.totalOffDays || 0), 0) / schedules.length).toFixed(1) : 0
                }
            }, '排班統計獲取成功');
            
        } catch (error) {
            logger.error('獲取排班統計失敗:', error);
            responseHelper.error(res, '獲取排班統計失敗', 'SYSTEM_ERROR');
        }
    }

    /**
     * 開始排班會話 (用於排他性控制)
     */
    static async startScheduleSession(req, res) {
        try {
            await initModels();
            const { employeeId, year, month } = req.params;
            const scheduleYear = parseInt(year);
            const scheduleMonth = parseInt(month);
            
            const session = await ScheduleTimeController.startScheduleSession(employeeId, scheduleYear, scheduleMonth);
            
            responseHelper.success(res, {
                session,
                timeLimit: 5 * 60 * 1000 // 5分鐘
            }, '排班會話開始');
            
        } catch (error) {
            logger.error('開始排班會話失敗:', error);
            responseHelper.error(res, error.message || '開始排班會話失敗', 'SESSION_ERROR');
        }
    }

    /**
     * 結束排班會話
     */
    static async endScheduleSession(req, res) {
        try {
            const { sessionId } = req.params;
            
            await ScheduleTimeController.endScheduleSession(sessionId);
            
            responseHelper.success(res, null, '排班會話結束');
            
        } catch (error) {
            logger.error('結束排班會話失敗:', error);
            responseHelper.error(res, '結束排班會話失敗', 'SESSION_ERROR');
        }
    }

    /**
     * 驗證排班規則 (不提交)
     */
    static async validateScheduleRules(req, res) {
        try {
            await initModels();
            
            const { employeeId, year, month } = req.params;
            const { offDates } = req.body;
            const scheduleYear = parseInt(year);
            const scheduleMonth = parseInt(month);
            
            if (!Array.isArray(offDates)) {
                return responseHelper.error(res, '休假日期格式錯誤', 'INVALID_INPUT', 400);
            }
            
            const validation = await ScheduleRuleEngine.validateAllRules(
                parseInt(employeeId), 
                scheduleYear, 
                scheduleMonth, 
                offDates
            );
            
            responseHelper.success(res, validation, '規則驗證完成');
            
        } catch (error) {
            logger.error('規則驗證失敗:', error);
            responseHelper.error(res, '規則驗證失敗', 'VALIDATION_ERROR');
        }
    }
}

module.exports = ScheduleController;