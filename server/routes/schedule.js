const express = require('express');
const router = express.Router();
const { initModels } = require('../models');
const ScheduleRuleEngine = require('../services/schedule-rule-engine');
const ScheduleTimeController = require('../services/schedule-time-controller');

let models = {};

// 初始化模型
const initializeModels = async () => {
    try {
        models = await initModels();
        console.log('✅ 排班路由 - 模型初始化完成');
    } catch (error) {
        console.error('❌ 排班路由 - 模型初始化失敗:', error);
        throw error;
    }
};

/**
 * 獲取系統狀態
 * GET /api/schedule/status/:year/:month
 */
router.get('/status/:year/:month', async (req, res) => {
    try {
        if (!models.ScheduleConfig) {
            await initializeModels();
        }

        const { year, month } = req.params;
        const systemStatus = await ScheduleTimeController.getSystemStatus(parseInt(year), parseInt(month));

        res.json({
            success: true,
            data: systemStatus
        });
    } catch (error) {
        console.error('獲取系統狀態錯誤:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * 開始排班會話
 * POST /api/schedule/start-session
 */
router.post('/start-session', async (req, res) => {
    try {
        if (!models.ScheduleSession) {
            await initializeModels();
        }

        const { employeeId, employeeName, year, month } = req.body;

        if (!employeeId || !employeeName || !year || !month) {
            return res.status(400).json({
                success: false,
                error: '缺少必要參數: employeeId, employeeName, year, month'
            });
        }

        const result = await ScheduleTimeController.startScheduleSession(
            employeeId, employeeName, year, month
        );

        res.json(result);
    } catch (error) {
        console.error('開始排班會話錯誤:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * 更新會話活動時間
 * PUT /api/schedule/session/:sessionId/activity
 */
router.put('/session/:sessionId/activity', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const result = await ScheduleTimeController.updateSessionActivity(parseInt(sessionId));
        
        res.json(result);
    } catch (error) {
        console.error('更新會話活動時間錯誤:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * 檢查會話超時
 * GET /api/schedule/session/:sessionId/timeout
 */
router.get('/session/:sessionId/timeout', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const result = await ScheduleTimeController.checkSessionTimeout(parseInt(sessionId));
        
        res.json(result);
    } catch (error) {
        console.error('檢查會話超時錯誤:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * 驗證排班規則
 * POST /api/schedule/validate-rules
 */
router.post('/validate-rules', async (req, res) => {
    try {
        if (!models.Schedule) {
            await initializeModels();
        }

        const { employeeId, year, month, offDates } = req.body;

        if (!employeeId || !year || !month || !Array.isArray(offDates)) {
            return res.status(400).json({
                success: false,
                error: '缺少必要參數: employeeId, year, month, offDates'
            });
        }

        const validationResult = await ScheduleRuleEngine.validateAllRules(
            employeeId, year, month, offDates
        );

        res.json({
            success: true,
            validation: validationResult
        });
    } catch (error) {
        console.error('驗證排班規則錯誤:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * 提交排班
 * POST /api/schedule/submit
 */
router.post('/submit', async (req, res) => {
    try {
        if (!models.Schedule) {
            await initializeModels();
        }

        const { employeeId, employeeName, year, month, offDates, sessionId } = req.body;

        if (!employeeId || !employeeName || !year || !month || !Array.isArray(offDates)) {
            return res.status(400).json({
                success: false,
                error: '缺少必要參數'
            });
        }

        // 先驗證規則
        const validationResult = await ScheduleRuleEngine.validateAllRules(
            employeeId, year, month, offDates
        );

        if (!validationResult.isValid) {
            return res.status(400).json({
                success: false,
                error: '排班規則驗證失敗',
                violations: validationResult.violations,
                details: validationResult.ruleResults
            });
        }

        // 查找或創建排班記錄
        let schedule = await models.Schedule.findOne({
            where: { employeeId, scheduleYear: year, scheduleMonth: month }
        });

        if (!schedule) {
            schedule = await models.Schedule.create({
                employeeId,
                employeeName,
                scheduleYear: year,
                scheduleMonth: month,
                offDates: [],
                scheduleStatus: 'in_progress',
                scheduleStartTime: new Date()
            });
        }

        // 更新排班數據
        await schedule.updateScheduleData(offDates, validationResult.ruleResults);

        // 完成會話
        if (sessionId) {
            await ScheduleTimeController.completeSession(sessionId);
        }

        console.log(`✅ 排班提交成功 - ${employeeName} (${year}-${month}): ${offDates.length}天`);

        res.json({
            success: true,
            message: '排班提交成功',
            data: {
                scheduleId: schedule.id,
                employeeName: schedule.employeeName,
                period: `${year}-${month}`,
                totalOffDays: schedule.totalOffDays,
                weekendOffDays: schedule.weekendOffDays,
                offDates: schedule.offDates,
                status: schedule.scheduleStatus
            }
        });
    } catch (error) {
        console.error('提交排班錯誤:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * 獲取員工排班記錄
 * GET /api/schedule/employee/:employeeId/:year/:month
 */
router.get('/employee/:employeeId/:year/:month', async (req, res) => {
    try {
        if (!models.Schedule) {
            await initializeModels();
        }

        const { employeeId, year, month } = req.params;
        
        const schedule = await models.Schedule.findOne({
            where: { 
                employeeId: parseInt(employeeId), 
                scheduleYear: parseInt(year), 
                scheduleMonth: parseInt(month) 
            }
        });

        if (!schedule) {
            return res.json({
                success: true,
                data: null,
                message: '尚無排班記錄'
            });
        }

        res.json({
            success: true,
            data: {
                id: schedule.id,
                employeeName: schedule.employeeName,
                period: `${schedule.scheduleYear}-${schedule.scheduleMonth}`,
                offDates: schedule.offDates,
                totalOffDays: schedule.totalOffDays,
                weekendOffDays: schedule.weekendOffDays,
                status: schedule.scheduleStatus,
                ruleValidation: schedule.ruleValidation,
                startTime: schedule.scheduleStartTime,
                endTime: schedule.scheduleEndTime
            }
        });
    } catch (error) {
        console.error('獲取員工排班記錄錯誤:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * 獲取排班配置
 * GET /api/schedule/config/:year/:month
 */
router.get('/config/:year/:month', async (req, res) => {
    try {
        if (!models.ScheduleConfig) {
            await initializeModels();
        }

        const { year, month } = req.params;
        const config = await models.ScheduleConfig.getConfig(parseInt(year), parseInt(month));

        if (!config) {
            return res.status(404).json({
                success: false,
                error: '找不到排班配置'
            });
        }

        res.json({
            success: true,
            data: {
                period: `${config.configYear}-${config.configMonth}`,
                rules: {
                    maxOffDaysPerPerson: config.maxOffDaysPerPerson,
                    maxOffDaysPerDay: config.maxOffDaysPerDay,
                    maxWeekendOffDays: config.maxWeekendOffDays,
                    maxStoreOffDaysPerDay: config.maxStoreOffDaysPerDay,
                    maxPartTimeOffDays: config.maxPartTimeOffDays,
                    maxStandbyOffDays: config.maxStandbyOffDays
                },
                timeControl: {
                    systemOpenDate: config.systemOpenDate,
                    systemCloseDate: config.systemCloseDate,
                    scheduleTimeLimit: config.scheduleTimeLimit
                },
                specialDates: {
                    holidayDates: config.holidayDates,
                    forbiddenDates: config.forbiddenDates,
                    storeHolidayDates: config.storeHolidayDates,
                    storeForbiddenDates: config.storeForbiddenDates
                }
            }
        });
    } catch (error) {
        console.error('獲取排班配置錯誤:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * 更新排班配置 (管理員)
 * PUT /api/schedule/config/:year/:month
 */
router.put('/config/:year/:month', async (req, res) => {
    try {
        if (!models.ScheduleConfig) {
            await initializeModels();
        }

        const { year, month } = req.params;
        const updateData = req.body;

        let config = await models.ScheduleConfig.getConfig(parseInt(year), parseInt(month));
        
        if (!config) {
            return res.status(404).json({
                success: false,
                error: '找不到排班配置'
            });
        }

        // 更新配置
        Object.keys(updateData).forEach(key => {
            if (config.hasOwnProperty(key)) {
                config[key] = updateData[key];
            }
        });

        await config.save();

        console.log(`✅ 排班配置更新成功 - ${year}-${month}`);

        res.json({
            success: true,
            message: '排班配置更新成功',
            data: config
        });
    } catch (error) {
        console.error('更新排班配置錯誤:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * 獲取月度排班統計
 * GET /api/schedule/statistics/:year/:month
 */
router.get('/statistics/:year/:month', async (req, res) => {
    try {
        if (!models.Schedule) {
            await initializeModels();
        }

        const { year, month } = req.params;
        
        const schedules = await models.Schedule.findAll({
            where: { 
                scheduleYear: parseInt(year), 
                scheduleMonth: parseInt(month) 
            },
            order: [['employeeName', 'ASC']]
        });

        const statistics = {
            totalEmployees: schedules.length,
            completedSchedules: schedules.filter(s => s.scheduleStatus === 'completed').length,
            totalOffDays: schedules.reduce((sum, s) => sum + s.totalOffDays, 0),
            totalWeekendOffDays: schedules.reduce((sum, s) => sum + s.weekendOffDays, 0),
            employeeStats: schedules.map(s => ({
                employeeName: s.employeeName,
                status: s.scheduleStatus,
                totalOffDays: s.totalOffDays,
                weekendOffDays: s.weekendOffDays,
                offDates: s.offDates,
                completedAt: s.scheduleEndTime
            }))
        };

        res.json({
            success: true,
            data: statistics
        });
    } catch (error) {
        console.error('獲取排班統計錯誤:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * 強制結束所有會話 (管理員)
 * POST /api/schedule/admin/force-end-sessions
 */
router.post('/admin/force-end-sessions', async (req, res) => {
    try {
        const { reason } = req.body;
        const result = await ScheduleTimeController.forceEndAllSessions(reason || '管理員強制結束');
        
        res.json(result);
    } catch (error) {
        console.error('強制結束會話錯誤:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * 清理超時會話 (定時任務)
 * POST /api/schedule/cleanup-sessions
 */
router.post('/cleanup-sessions', async (req, res) => {
    try {
        const result = await ScheduleTimeController.cleanupTimeoutSessions();
        
        res.json(result);
    } catch (error) {
        console.error('清理超時會話錯誤:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;