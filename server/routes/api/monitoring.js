/**
 * 📊 監控 API 路由
 * Monitoring API Routes
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../middleware/auth');
const { 
    healthCheck, 
    systemMetrics, 
    alertsManager, 
    createAlert 
} = require('../../middleware/monitoring');

/**
 * @route GET /api/monitoring/health
 * @desc 系統健康檢查
 * @access Public
 */
router.get('/health', healthCheck);

/**
 * @route GET /api/monitoring/metrics/basic
 * @desc 獲取基本系統指標 (用於測試)
 * @access Public
 */
router.get('/metrics/basic', (req, res) => {
    const used = process.memoryUsage();
    const startTime = process.uptime();
    
    res.json({
        success: true,
        data: {
            timestamp: new Date().toISOString(),
            uptime: Math.floor(startTime),
            memory: {
                rss: Math.round(used.rss / 1024 / 1024) + ' MB',
                heapTotal: Math.round(used.heapTotal / 1024 / 1024) + ' MB',
                heapUsed: Math.round(used.heapUsed / 1024 / 1024) + ' MB'
            },
            system: {
                platform: process.platform,
                nodeVersion: process.version,
                pid: process.pid
            }
        },
        message: '基本系統指標獲取成功'
    });
});

/**
 * @route GET /api/monitoring/metrics
 * @desc 獲取系統指標
 * @access Private (需要認證)
 */
router.get('/metrics', authMiddleware, systemMetrics);

/**
 * @route GET /api/monitoring/alerts
 * @desc 獲取警告列表
 * @access Private (需要管理員權限)
 */
router.get('/alerts', authMiddleware, alertsManager);

/**
 * @route POST /api/monitoring/alerts/resolve
 * @desc 解決警告
 * @access Private (需要管理員權限)
 */
router.post('/alerts/resolve', authMiddleware, alertsManager);

/**
 * @route POST /api/monitoring/alerts/create
 * @desc 創建手動警告
 * @access Private (需要管理員權限)
 */
router.post('/alerts/create', authMiddleware, createAlert);

/**
 * @route GET /api/monitoring/status
 * @desc 獲取簡化的系統狀態
 * @access Private
 */
router.get('/status', authMiddleware, (req, res) => {
    try {
        const { monitoringService } = require('../../middleware/monitoring');
        const healthStatus = monitoringService.getHealthStatus();
        
        // 返回簡化的狀態信息
        res.json({
            success: true,
            status: healthStatus.status,
            uptime: healthStatus.uptime,
            alerts: healthStatus.alerts.total,
            metrics: {
                cpu: Math.round(healthStatus.metrics.cpu),
                memory: Math.round(healthStatus.metrics.memory),
                responseTime: healthStatus.metrics.avgResponseTime
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '無法獲取系統狀態',
            error: error.message
        });
    }
});

/**
 * @route GET /api/monitoring/dashboard
 * @desc 獲取監控儀表板數據
 * @access Private (需要管理員權限)
 */
router.get('/dashboard', authMiddleware, (req, res) => {
    try {
        const { monitoringService } = require('../../middleware/monitoring');
        const timeRange = req.query.range || '1h';
        
        const healthStatus = monitoringService.getHealthStatus();
        const detailedStats = monitoringService.getDetailedStats(timeRange);
        
        // 計算一些額外的統計信息
        const now = Date.now();
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        
        const todayRequests = monitoringService.metrics.responseTimeHistory.filter(
            r => r.timestamp > startOfDay.getTime()
        );
        
        const dashboardData = {
            overview: {
                status: healthStatus.status,
                uptime: healthStatus.uptime,
                totalRequests: healthStatus.metrics.totalRequests,
                totalErrors: healthStatus.metrics.totalErrors,
                errorRate: healthStatus.metrics.errorRate,
                avgResponseTime: healthStatus.metrics.avgResponseTime
            },
            todayStats: {
                requests: todayRequests.length,
                errors: todayRequests.filter(r => r.hasError).length,
                avgResponseTime: todayRequests.length > 0 
                    ? Math.round(todayRequests.reduce((sum, r) => sum + r.responseTime, 0) / todayRequests.length)
                    : 0
            },
            systemMetrics: {
                cpu: detailedStats.cpu,
                memory: detailedStats.memory,
                requests: detailedStats.requests
            },
            alerts: {
                active: monitoringService.alerts.filter(alert => !alert.resolved),
                recent: monitoringService.alerts.slice(-10)
            },
            charts: {
                cpuUsage: detailedStats.cpu.data.map(d => ({
                    timestamp: d.timestamp,
                    value: d.usage
                })),
                memoryUsage: detailedStats.memory.data.map(d => ({
                    timestamp: d.timestamp,
                    value: d.usage
                })),
                responseTime: detailedStats.requests.data
                    .filter((_, index) => index % 5 === 0) // 取樣，避免數據過多
                    .map(d => ({
                        timestamp: d.timestamp,
                        value: d.responseTime
                    }))
            }
        };
        
        res.json({
            success: true,
            dashboard: dashboardData,
            timestamp: now
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '無法獲取儀表板數據',
            error: error.message
        });
    }
});

module.exports = router;