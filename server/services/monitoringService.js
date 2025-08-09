/**
 * 📊 系統監控服務
 * System Monitoring Service
 */

const os = require('os');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class MonitoringService {
    constructor() {
        this.metrics = {
            startTime: Date.now(),
            requestCount: 0,
            errorCount: 0,
            responseTimeHistory: [],
            memoryUsage: [],
            cpuUsage: [],
            diskUsage: []
        };
        
        this.alerts = [];
        this.thresholds = {
            cpu: 80,        // CPU 使用率警告閾值 (%)
            memory: 85,     // 記憶體使用率警告閾值 (%)
            disk: 90,       // 磁碟使用率警告閾值 (%)
            responseTime: 5000,  // 回應時間警告閾值 (ms)
            errorRate: 10   // 錯誤率警告閾值 (%)
        };
        
        this.startMonitoring();
    }

    /**
     * 開始監控
     */
    startMonitoring() {
        logger.info('🔍 啟動系統監控服務');
        
        // 每30秒收集系統指標
        this.systemMetricsInterval = setInterval(() => {
            this.collectSystemMetrics();
        }, 30000);

        // 每5分鐘檢查警告條件
        this.alertCheckInterval = setInterval(() => {
            this.checkAlerts();
        }, 300000);

        // 每小時清理歷史數據 (只保留最近24小時)
        this.cleanupInterval = setInterval(() => {
            this.cleanupHistoricalData();
        }, 3600000);
    }

    /**
     * 停止監控
     */
    stopMonitoring() {
        if (this.systemMetricsInterval) {
            clearInterval(this.systemMetricsInterval);
        }
        if (this.alertCheckInterval) {
            clearInterval(this.alertCheckInterval);
        }
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        logger.info('🛑 系統監控服務已停止');
    }

    /**
     * 收集系統指標
     */
    collectSystemMetrics() {
        const timestamp = Date.now();

        try {
            // CPU 使用率
            const cpuUsage = this.getCPUUsage();
            this.metrics.cpuUsage.push({
                timestamp,
                usage: cpuUsage
            });

            // 記憶體使用率
            const memoryUsage = this.getMemoryUsage();
            this.metrics.memoryUsage.push({
                timestamp,
                ...memoryUsage
            });

            // 磁碟使用率
            const diskUsage = this.getDiskUsage();
            this.metrics.diskUsage.push({
                timestamp,
                ...diskUsage
            });

        } catch (error) {
            logger.error('系統指標收集失敗:', error);
        }
    }

    /**
     * 獲取 CPU 使用率
     */
    getCPUUsage() {
        const cpus = os.cpus();
        let totalIdle = 0;
        let totalTick = 0;

        cpus.forEach(cpu => {
            for (const type in cpu.times) {
                totalTick += cpu.times[type];
            }
            totalIdle += cpu.times.idle;
        });

        const usage = 100 - ~~(100 * totalIdle / totalTick);
        return Math.max(0, Math.min(100, usage));
    }

    /**
     * 獲取記憶體使用情況
     */
    getMemoryUsage() {
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        const usagePercentage = (usedMemory / totalMemory) * 100;

        return {
            total: totalMemory,
            used: usedMemory,
            free: freeMemory,
            usage: Math.round(usagePercentage * 100) / 100
        };
    }

    /**
     * 獲取磁碟使用情況
     */
    getDiskUsage() {
        try {
            const stats = fs.statSync('.');
            const total = stats.size || 0;
            
            // 簡化的磁碟使用率計算
            // 實際部署時應使用 statvfs 或類似系統調用
            return {
                total: total,
                used: 0,
                free: total,
                usage: 0
            };
        } catch (error) {
            logger.warn('無法獲取磁碟使用情況:', error.message);
            return {
                total: 0,
                used: 0,
                free: 0,
                usage: 0
            };
        }
    }

    /**
     * 記錄請求指標
     */
    recordRequest(responseTime, hasError = false) {
        this.metrics.requestCount++;
        
        if (hasError) {
            this.metrics.errorCount++;
        }

        this.metrics.responseTimeHistory.push({
            timestamp: Date.now(),
            responseTime,
            hasError
        });

        // 只保留最近1000個請求記錄
        if (this.metrics.responseTimeHistory.length > 1000) {
            this.metrics.responseTimeHistory = this.metrics.responseTimeHistory.slice(-1000);
        }
    }

    /**
     * 檢查警告條件
     */
    checkAlerts() {
        const now = Date.now();
        const oneHourAgo = now - 3600000; // 1小時前

        try {
            // 檢查 CPU 使用率
            const recentCPU = this.metrics.cpuUsage
                .filter(metric => metric.timestamp > oneHourAgo)
                .map(metric => metric.usage);
            
            if (recentCPU.length > 0) {
                const avgCPU = recentCPU.reduce((a, b) => a + b) / recentCPU.length;
                if (avgCPU > this.thresholds.cpu) {
                    this.createAlert('HIGH_CPU_USAGE', `CPU 平均使用率: ${avgCPU.toFixed(2)}%`, 'high');
                }
            }

            // 檢查記憶體使用率
            const recentMemory = this.metrics.memoryUsage
                .filter(metric => metric.timestamp > oneHourAgo)
                .map(metric => metric.usage);
            
            if (recentMemory.length > 0) {
                const avgMemory = recentMemory.reduce((a, b) => a + b) / recentMemory.length;
                if (avgMemory > this.thresholds.memory) {
                    this.createAlert('HIGH_MEMORY_USAGE', `記憶體平均使用率: ${avgMemory.toFixed(2)}%`, 'high');
                }
            }

            // 檢查回應時間
            const recentResponses = this.metrics.responseTimeHistory
                .filter(metric => metric.timestamp > oneHourAgo)
                .map(metric => metric.responseTime);
            
            if (recentResponses.length > 0) {
                const avgResponseTime = recentResponses.reduce((a, b) => a + b) / recentResponses.length;
                if (avgResponseTime > this.thresholds.responseTime) {
                    this.createAlert('SLOW_RESPONSE', `平均回應時間: ${avgResponseTime.toFixed(0)}ms`, 'medium');
                }
            }

            // 檢查錯誤率
            const recentErrors = this.metrics.responseTimeHistory
                .filter(metric => metric.timestamp > oneHourAgo);
            
            if (recentErrors.length > 0) {
                const errorRate = (recentErrors.filter(r => r.hasError).length / recentErrors.length) * 100;
                if (errorRate > this.thresholds.errorRate) {
                    this.createAlert('HIGH_ERROR_RATE', `錯誤率: ${errorRate.toFixed(2)}%`, 'high');
                }
            }

        } catch (error) {
            logger.error('警告檢查失敗:', error);
        }
    }

    /**
     * 創建警告
     */
    createAlert(type, message, severity = 'medium') {
        const alert = {
            id: Date.now() + Math.random(),
            type,
            message,
            severity,
            timestamp: Date.now(),
            resolved: false
        };

        this.alerts.push(alert);
        
        // 只保留最近50個警告
        if (this.alerts.length > 50) {
            this.alerts = this.alerts.slice(-50);
        }

        logger.warn(`🚨 系統警告 [${severity.toUpperCase()}]: ${message}`);

        // 發送 Telegram 通知 (如果是高嚴重性警告)
        if (severity === 'high') {
            this.sendAlertNotification(alert);
        }

        return alert;
    }

    /**
     * 發送警告通知
     */
    async sendAlertNotification(alert) {
        try {
            if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
                const message = `🚨 系統警告通知

🕐 時間: ${new Date(alert.timestamp).toLocaleString('zh-TW')}
🔥 嚴重性: ${alert.severity.toUpperCase()}
📋 類型: ${alert.type}
📝 訊息: ${alert.message}

請檢查系統狀況並採取適當措施。`;

                const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        chat_id: process.env.TELEGRAM_CHAT_ID,
                        text: message,
                        parse_mode: 'HTML'
                    })
                });

                if (response.ok) {
                    logger.info('警告通知已發送到 Telegram');
                }
            }
        } catch (error) {
            logger.error('發送警告通知失敗:', error);
        }
    }

    /**
     * 清理歷史數據
     */
    cleanupHistoricalData() {
        const oneDayAgo = Date.now() - 86400000; // 24小時前

        // 清理系統指標歷史
        this.metrics.cpuUsage = this.metrics.cpuUsage.filter(
            metric => metric.timestamp > oneDayAgo
        );
        this.metrics.memoryUsage = this.metrics.memoryUsage.filter(
            metric => metric.timestamp > oneDayAgo
        );
        this.metrics.diskUsage = this.metrics.diskUsage.filter(
            metric => metric.timestamp > oneDayAgo
        );

        // 清理已解決的舊警告
        this.alerts = this.alerts.filter(
            alert => !alert.resolved || alert.timestamp > oneDayAgo
        );

        logger.info('歷史監控數據清理完成');
    }

    /**
     * 獲取系統健康狀態
     */
    getHealthStatus() {
        const now = Date.now();
        const uptime = now - this.metrics.startTime;
        
        // 獲取最新指標
        const latestCPU = this.metrics.cpuUsage[this.metrics.cpuUsage.length - 1];
        const latestMemory = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1];
        
        // 計算錯誤率
        const recentRequests = this.metrics.responseTimeHistory.filter(
            r => r.timestamp > now - 3600000 // 最近1小時
        );
        const errorRate = recentRequests.length > 0 
            ? (recentRequests.filter(r => r.hasError).length / recentRequests.length) * 100 
            : 0;

        // 計算平均回應時間
        const avgResponseTime = recentRequests.length > 0
            ? recentRequests.reduce((sum, r) => sum + r.responseTime, 0) / recentRequests.length
            : 0;

        // 判斷整體健康狀態
        let status = 'healthy';
        const activeAlerts = this.alerts.filter(alert => !alert.resolved);
        const criticalAlerts = activeAlerts.filter(alert => alert.severity === 'high');
        
        if (criticalAlerts.length > 0) {
            status = 'critical';
        } else if (activeAlerts.length > 0) {
            status = 'warning';
        }

        return {
            status,
            timestamp: now,
            uptime,
            metrics: {
                cpu: latestCPU ? latestCPU.usage : 0,
                memory: latestMemory ? latestMemory.usage : 0,
                errorRate: Math.round(errorRate * 100) / 100,
                avgResponseTime: Math.round(avgResponseTime),
                totalRequests: this.metrics.requestCount,
                totalErrors: this.metrics.errorCount
            },
            alerts: {
                total: activeAlerts.length,
                critical: criticalAlerts.length,
                recent: activeAlerts.slice(-5)
            }
        };
    }

    /**
     * 獲取詳細統計
     */
    getDetailedStats(timeRange = '1h') {
        const now = Date.now();
        let startTime;

        switch (timeRange) {
            case '1h':
                startTime = now - 3600000;
                break;
            case '6h':
                startTime = now - 21600000;
                break;
            case '24h':
                startTime = now - 86400000;
                break;
            default:
                startTime = now - 3600000;
        }

        const cpuData = this.metrics.cpuUsage.filter(m => m.timestamp > startTime);
        const memoryData = this.metrics.memoryUsage.filter(m => m.timestamp > startTime);
        const responseData = this.metrics.responseTimeHistory.filter(m => m.timestamp > startTime);

        return {
            timeRange,
            startTime,
            endTime: now,
            cpu: {
                data: cpuData,
                average: cpuData.length > 0 ? cpuData.reduce((sum, d) => sum + d.usage, 0) / cpuData.length : 0,
                max: cpuData.length > 0 ? Math.max(...cpuData.map(d => d.usage)) : 0
            },
            memory: {
                data: memoryData,
                average: memoryData.length > 0 ? memoryData.reduce((sum, d) => sum + d.usage, 0) / memoryData.length : 0,
                max: memoryData.length > 0 ? Math.max(...memoryData.map(d => d.usage)) : 0
            },
            requests: {
                data: responseData,
                total: responseData.length,
                errors: responseData.filter(r => r.hasError).length,
                averageResponseTime: responseData.length > 0 ? responseData.reduce((sum, r) => sum + r.responseTime, 0) / responseData.length : 0
            }
        };
    }

    /**
     * 解決警告
     */
    resolveAlert(alertId) {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.resolved = true;
            alert.resolvedAt = Date.now();
            logger.info(`警告已解決: ${alert.type} - ${alert.message}`);
            return true;
        }
        return false;
    }
}

module.exports = MonitoringService;