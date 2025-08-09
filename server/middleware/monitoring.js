/**
 * 📊 監控中間件
 * Monitoring Middleware
 */

const MonitoringService = require('../services/monitoringService');

// 創建監控服務實例
const monitoringService = new MonitoringService();

/**
 * 請求監控中間件
 */
const requestMonitoring = (req, res, next) => {
    const startTime = Date.now();
    
    // 記錄請求開始
    req.startTime = startTime;
    
    // 監控回應結束
    const originalSend = res.send;
    res.send = function(data) {
        const responseTime = Date.now() - startTime;
        const hasError = res.statusCode >= 400;
        
        // 記錄請求指標
        monitoringService.recordRequest(responseTime, hasError);
        
        // 調用原始的 send 方法
        originalSend.call(this, data);
    };
    
    next();
};

/**
 * 健康檢查端點中間件
 */
const healthCheck = (req, res) => {
    try {
        const healthStatus = monitoringService.getHealthStatus();
        
        // 根據健康狀態設置 HTTP 狀態碼
        let statusCode = 200;
        if (healthStatus.status === 'warning') {
            statusCode = 200; // 警告狀態仍返回 200，但在回應中標明
        } else if (healthStatus.status === 'critical') {
            statusCode = 503; // 服務不可用
        }
        
        res.status(statusCode).json({
            success: statusCode === 200,
            status: healthStatus.status,
            timestamp: healthStatus.timestamp,
            uptime: healthStatus.uptime,
            metrics: healthStatus.metrics,
            alerts: healthStatus.alerts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            status: 'error',
            message: '無法獲取健康狀態',
            error: error.message
        });
    }
};

/**
 * 系統指標端點中間件
 */
const systemMetrics = (req, res) => {
    try {
        const timeRange = req.query.range || '1h';
        const stats = monitoringService.getDetailedStats(timeRange);
        
        res.json({
            success: true,
            stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '無法獲取系統指標',
            error: error.message
        });
    }
};

/**
 * 警告管理端點中間件
 */
const alertsManager = (req, res) => {
    try {
        const method = req.method;
        
        if (method === 'GET') {
            // 獲取警告列表
            const activeAlerts = monitoringService.alerts.filter(alert => !alert.resolved);
            const resolvedAlerts = monitoringService.alerts.filter(alert => alert.resolved);
            
            res.json({
                success: true,
                alerts: {
                    active: activeAlerts,
                    resolved: resolvedAlerts,
                    total: monitoringService.alerts.length
                }
            });
        } else if (method === 'POST') {
            // 解決警告
            const { alertId } = req.body;
            const resolved = monitoringService.resolveAlert(alertId);
            
            if (resolved) {
                res.json({
                    success: true,
                    message: '警告已解決'
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: '找不到指定的警告'
                });
            }
        } else {
            res.status(405).json({
                success: false,
                message: '不支援的 HTTP 方法'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '警告管理操作失敗',
            error: error.message
        });
    }
};

/**
 * 創建手動警告
 */
const createAlert = (req, res) => {
    try {
        const { type, message, severity = 'medium' } = req.body;
        
        if (!type || !message) {
            return res.status(400).json({
                success: false,
                message: '缺少必要參數: type 和 message'
            });
        }
        
        const alert = monitoringService.createAlert(type, message, severity);
        
        res.status(201).json({
            success: true,
            alert,
            message: '警告已創建'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '創建警告失敗',
            error: error.message
        });
    }
};

// 優雅關閉監控服務
process.on('SIGTERM', () => {
    console.log('收到 SIGTERM，正在關閉監控服務...');
    monitoringService.stopMonitoring();
});

process.on('SIGINT', () => {
    console.log('收到 SIGINT，正在關閉監控服務...');
    monitoringService.stopMonitoring();
});

module.exports = {
    monitoringService,
    requestMonitoring,
    healthCheck,
    systemMetrics,
    alertsManager,
    createAlert
};