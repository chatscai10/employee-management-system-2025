/**
 * ===================================
 * 排班管理路由 - Schedule Routes  
 * ===================================
 * 智慧排班系統API路由 - 實現6重規則引擎的完整排班功能
 */

const express = require('express');
const router = express.Router();
const ScheduleController = require('../../controllers/scheduleController');
const logger = require('../../utils/logger');

// 健康檢查端點
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: '智慧排班系統API運行正常',
        timestamp: new Date().toISOString(),
        endpoints: [
            'GET /api/schedule/status/:year/:month - 獲取排班系統狀態',
            'GET /api/schedule/employee/:employeeId/:year/:month - 獲取員工排班記錄',
            'POST /api/schedule/employee/:employeeId/:year/:month - 提交員工排班',
            'POST /api/schedule/validate/:employeeId/:year/:month - 驗證排班規則',
            'GET /api/schedule/summary/:year/:month - 獲取排班統計',
            'POST /api/schedule/session/:employeeId/:year/:month - 開始排班會話',
            'DELETE /api/schedule/session/:sessionId - 結束排班會話'
        ]
    });
});

// 1. 獲取排班系統狀態 (系統邏輯.txt 第102-116行)
router.get('/status/:year/:month', ScheduleController.getScheduleStatus);

// 2. 獲取員工排班記錄
router.get('/employee/:employeeId/:year/:month', ScheduleController.getEmployeeSchedule);

// 3. 提交員工排班 (執行6重規則驗證)
router.post('/employee/:employeeId/:year/:month', ScheduleController.submitEmployeeSchedule);

// 4. 驗證排班規則 (不提交，僅驗證)
router.post('/validate/:employeeId/:year/:month', ScheduleController.validateScheduleRules);

// 5. 獲取所有員工排班統計
router.get('/summary/:year/:month', ScheduleController.getAllSchedulesSummary);

// 6. 排班會話管理 (排他性控制)
router.post('/session/:employeeId/:year/:month', ScheduleController.startScheduleSession);
router.delete('/session/:sessionId', ScheduleController.endScheduleSession);

// 7. 根路由 - 系統資訊
router.get('/', (req, res) => {
    try {
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        
        res.json({
            success: true,
            message: '智慧排班系統API (6重規則引擎)',
            version: '1.0.0',
            currentPeriod: { year, month },
            features: [
                '6重規則引擎驗證',
                '排他性會話控制',
                '即時規則驗證',
                '完整統計分析',
                '系統狀態監控'
            ],
            ruleEngine: {
                rule1: '月度休假限制',
                rule2: '日度休假限制',
                rule3: '週末休假限制',
                rule4: '分店休假限制',
                rule5: '職位休假限制',
                rule6: '特殊日期規則'
            },
            quickAccess: {
                currentStatus: `/api/schedule/status/${year}/${month}`,
                employeeSchedule: `/api/schedule/employee/{employeeId}/${year}/${month}`,
                systemSummary: `/api/schedule/summary/${year}/${month}`
            }
        });
        
    } catch (error) {
        logger.error('排班系統根路由錯誤:', error);
        res.json({
            success: true,
            message: '智慧排班系統API運行正常',
            status: 'healthy'
        });
    }
});

// 錯誤處理中間件
router.use((error, req, res, next) => {
    logger.error('排班路由錯誤:', {
        path: req.path,
        method: req.method,
        error: error.message,
        stack: error.stack
    });
    
    res.status(500).json({
        success: false,
        message: '排班系統內部錯誤',
        error: error.message,
        timestamp: new Date().toISOString()
    });
});

module.exports = router;