/**
 * 🚨 告警管理 API 路由
 * Alert Management API Routes
 */

const express = require('express');
const router = express.Router();
const alertService = require('../../services/alertService');
const { authMiddleware } = require('../../middleware/auth');

/**
 * @route GET /api/alerts
 * @desc 獲取告警列表
 * @access Private (管理員)
 */
router.get('/', authMiddleware, (req, res) => {
    try {
        const { status, severity, limit = 50, offset = 0 } = req.query;
        
        let alerts = alertService.alerts;
        
        // 篩選狀態
        if (status) {
            alerts = alerts.filter(alert => alert.status === status);
        }
        
        // 篩選嚴重性
        if (severity) {
            alerts = alerts.filter(alert => alert.severity === severity);
        }
        
        // 排序 (最新的在前面)
        alerts.sort((a, b) => b.timestamp - a.timestamp);
        
        // 分頁
        const totalCount = alerts.length;
        const paginatedAlerts = alerts.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
        
        res.json({
            success: true,
            data: {
                alerts: paginatedAlerts,
                pagination: {
                    totalCount,
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: parseInt(offset) + parseInt(limit) < totalCount
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'ALERTS_FETCH_ERROR',
            message: '獲取告警列表失敗',
            details: error.message
        });
    }
});

/**
 * @route GET /api/alerts/active
 * @desc 獲取活躍告警
 * @access Private (管理員)
 */
router.get('/active', authMiddleware, (req, res) => {
    try {
        const activeAlerts = alertService.getActiveAlerts();
        
        res.json({
            success: true,
            data: {
                alerts: activeAlerts,
                count: activeAlerts.length
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'ACTIVE_ALERTS_ERROR',
            message: '獲取活躍告警失敗',
            details: error.message
        });
    }
});

/**
 * @route GET /api/alerts/statistics
 * @desc 獲取告警統計
 * @access Private (管理員)
 */
router.get('/statistics', authMiddleware, (req, res) => {
    try {
        const statistics = alertService.getAlertStatistics();
        
        res.json({
            success: true,
            data: {
                statistics
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'STATISTICS_ERROR',
            message: '獲取告警統計失敗',
            details: error.message
        });
    }
});

/**
 * @route POST /api/alerts/:alertId/resolve
 * @desc 解決告警
 * @access Private (管理員)
 */
router.post('/:alertId/resolve', authMiddleware, (req, res) => {
    try {
        const { alertId } = req.params;
        const resolvedBy = req.user.employeeId;
        
        const resolved = alertService.resolveAlert(alertId, resolvedBy);
        
        if (resolved) {
            res.json({
                success: true,
                message: '告警已解決'
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'ALERT_NOT_FOUND',
                message: '找不到指定的告警或告警已被解決'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'RESOLVE_ALERT_ERROR',
            message: '解決告警失敗',
            details: error.message
        });
    }
});

/**
 * @route POST /api/alerts/rules
 * @desc 新增告警規則
 * @access Private (管理員)
 */
router.post('/rules', authMiddleware, (req, res) => {
    try {
        const { id, name, condition, severity, cooldown, description } = req.body;
        
        // 驗證必要欄位
        if (!id || !name || !condition || !severity) {
            return res.status(400).json({
                success: false,
                error: 'MISSING_FIELDS',
                message: '缺少必要欄位: id, name, condition, severity'
            });
        }
        
        // 驗證條件函數 (安全的字符串檢查)
        if (typeof condition !== 'string' || !condition.includes('metrics.')) {
            return res.status(400).json({
                success: false,
                error: 'INVALID_CONDITION',
                message: '無效的條件表達式'
            });
        }
        
        // 使用預定義的安全條件而不是動態執行
        const safeConditions = {
            'cpu_high': (metrics) => metrics.cpu > 80,
            'memory_high': (metrics) => metrics.memory > 85,
            'disk_high': (metrics) => metrics.disk > 90,
            'response_slow': (metrics) => metrics.avgResponseTime > 5000,
            'error_rate_high': (metrics) => metrics.errorRate > 5
        };
        
        const conditionId = condition.replace(/[^a-z_]/g, '').toLowerCase();
        const conditionFunc = safeConditions[conditionId];
        
        if (!conditionFunc) {
            return res.status(400).json({
                success: false,
                error: 'UNSUPPORTED_CONDITION',
                message: '不支援的條件類型'
            });
        }
        
        const rule = {
            name,
            condition: conditionFunc,
            severity,
            cooldown: cooldown || 300000,
            description: description || name
        };
        
        alertService.addAlertRule(id, rule);
        
        res.status(201).json({
            success: true,
            message: '告警規則已新增',
            data: {
                ruleId: id
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'ADD_RULE_ERROR',
            message: '新增告警規則失敗',
            details: error.message
        });
    }
});

/**
 * @route GET /api/alerts/rules
 * @desc 獲取告警規則列表
 * @access Private (管理員)
 */
router.get('/rules', authMiddleware, (req, res) => {
    try {
        const rules = Array.from(alertService.alertRules.entries()).map(([id, rule]) => ({
            id,
            name: rule.name,
            severity: rule.severity,
            cooldown: rule.cooldown,
            description: rule.description,
            isActive: rule.isActive,
            lastTriggered: rule.lastTriggered
        }));
        
        res.json({
            success: true,
            data: {
                rules,
                count: rules.length
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'RULES_FETCH_ERROR',
            message: '獲取告警規則失敗',
            details: error.message
        });
    }
});

/**
 * @route PUT /api/alerts/rules/:ruleId
 * @desc 更新告警規則
 * @access Private (管理員)
 */
router.put('/rules/:ruleId', authMiddleware, (req, res) => {
    try {
        const { ruleId } = req.params;
        const { name, condition, severity, cooldown, description, isActive } = req.body;
        
        const rule = alertService.alertRules.get(ruleId);
        if (!rule) {
            return res.status(404).json({
                success: false,
                error: 'RULE_NOT_FOUND',
                message: '找不到指定的告警規則'
            });
        }
        
        // 更新規則屬性
        if (name !== undefined) rule.name = name;
        if (severity !== undefined) rule.severity = severity;
        if (cooldown !== undefined) rule.cooldown = cooldown;
        if (description !== undefined) rule.description = description;
        if (isActive !== undefined) rule.isActive = isActive;
        
        if (condition !== undefined) {
            if (typeof condition !== 'string' || !condition.includes('metrics.')) {
                return res.status(400).json({
                    success: false,
                    error: 'INVALID_CONDITION',
                    message: '無效的條件表達式'
                });
            }
            
            // 使用相同的安全條件檢查
            const safeConditions = {
                'cpu_high': (metrics) => metrics.cpu > 80,
                'memory_high': (metrics) => metrics.memory > 85,
                'disk_high': (metrics) => metrics.disk > 90,
                'response_slow': (metrics) => metrics.avgResponseTime > 5000,
                'error_rate_high': (metrics) => metrics.errorRate > 5
            };
            
            const conditionId = condition.replace(/[^a-z_]/g, '').toLowerCase();
            const conditionFunc = safeConditions[conditionId];
            
            if (!conditionFunc) {
                return res.status(400).json({
                    success: false,
                    error: 'UNSUPPORTED_CONDITION',
                    message: '不支援的條件類型'
                });
            }
            
            rule.condition = conditionFunc;
        }
        
        alertService.alertRules.set(ruleId, rule);
        
        res.json({
            success: true,
            message: '告警規則已更新'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'UPDATE_RULE_ERROR',
            message: '更新告警規則失敗',
            details: error.message
        });
    }
});

/**
 * @route DELETE /api/alerts/rules/:ruleId
 * @desc 刪除告警規則
 * @access Private (管理員)
 */
router.delete('/rules/:ruleId', authMiddleware, (req, res) => {
    try {
        const { ruleId } = req.params;
        
        const deleted = alertService.alertRules.delete(ruleId);
        
        if (deleted) {
            res.json({
                success: true,
                message: '告警規則已刪除'
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'RULE_NOT_FOUND',
                message: '找不到指定的告警規則'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'DELETE_RULE_ERROR',
            message: '刪除告警規則失敗',
            details: error.message
        });
    }
});

/**
 * @route POST /api/alerts/test
 * @desc 測試告警系統
 * @access Private (管理員)
 */
router.post('/test', authMiddleware, async (req, res) => {
    try {
        const { ruleId, testMetrics } = req.body;
        
        if (!ruleId) {
            return res.status(400).json({
                success: false,
                error: 'MISSING_RULE_ID',
                message: '需要指定告警規則 ID'
            });
        }
        
        const rule = alertService.alertRules.get(ruleId);
        if (!rule) {
            return res.status(404).json({
                success: false,
                error: 'RULE_NOT_FOUND',
                message: '找不到指定的告警規則'
            });
        }
        
        const mockMetrics = testMetrics || {
            cpu: 90,
            memory: 95,
            disk: 95,
            avgResponseTime: 8000,
            errorRate: 15,
            databaseConnected: false,
            serviceHealthy: false
        };
        
        // 暫時停用冷卻時間進行測試
        const originalLastTriggered = rule.lastTriggered;
        rule.lastTriggered = 0;
        
        const triggeredAlerts = await alertService.checkAlerts(mockMetrics);
        
        // 恢復原始的最後觸發時間
        rule.lastTriggered = originalLastTriggered;
        
        res.json({
            success: true,
            message: '告警測試完成',
            data: {
                testMetrics: mockMetrics,
                triggeredAlerts: triggeredAlerts.filter(alert => alert.ruleId === ruleId),
                ruleTriggered: triggeredAlerts.some(alert => alert.ruleId === ruleId)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'TEST_ALERT_ERROR',
            message: '告警測試失敗',
            details: error.message
        });
    }
});

/**
 * @route GET /api/alerts/report
 * @desc 匯出告警報告
 * @access Private (管理員)
 */
router.get('/report', authMiddleware, (req, res) => {
    try {
        const { startDate, endDate, format = 'json' } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'MISSING_DATE_RANGE',
                message: '需要指定開始和結束日期'
            });
        }
        
        const report = alertService.exportAlertReport(startDate, endDate);
        
        if (format === 'json') {
            res.json({
                success: true,
                data: {
                    report
                }
            });
        } else if (format === 'csv') {
            // 生成 CSV 格式
            const csvHeaders = ['告警ID', '規則ID', '名稱', '嚴重性', '時間', '描述', '狀態'];
            const csvRows = report.alerts.map(alert => [
                alert.id,
                alert.ruleId,
                alert.name,
                alert.severity,
                new Date(alert.timestamp).toLocaleString('zh-TW'),
                alert.description,
                alert.status
            ]);
            
            const csvContent = [csvHeaders, ...csvRows]
                .map(row => row.map(field => `"${field}"`).join(','))
                .join('\n');
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="alert-report-${startDate}-${endDate}.csv"`);
            res.send(csvContent);
        } else {
            res.status(400).json({
                success: false,
                error: 'INVALID_FORMAT',
                message: '支援的格式: json, csv'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'EXPORT_REPORT_ERROR',
            message: '匯出告警報告失敗',
            details: error.message
        });
    }
});

module.exports = router;