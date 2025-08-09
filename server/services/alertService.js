/**
 * 🚨 系統告警服務
 * System Alert Service
 */

const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

class AlertService {
    constructor() {
        this.alerts = [];
        this.alertRules = new Map();
        this.notificationChannels = new Map();
        this.alertHistory = [];
        
        // 初始化預設告警規則
        this.initializeDefaultRules();
        
        // 初始化通知通道
        this.initializeNotificationChannels();
        
        // 啟動定期檢查
        this.startPeriodicChecks();
    }

    /**
     * 初始化預設告警規則
     */
    initializeDefaultRules() {
        // CPU 使用率告警
        this.addAlertRule('cpu_high', {
            name: 'CPU 使用率過高',
            condition: (metrics) => metrics.cpu > 80,
            severity: 'high',
            cooldown: 300000, // 5分鐘冷卻時間
            description: 'CPU 使用率超過 80%'
        });

        // 記憶體使用率告警
        this.addAlertRule('memory_high', {
            name: '記憶體使用率過高',
            condition: (metrics) => metrics.memory > 85,
            severity: 'high',
            cooldown: 300000,
            description: '記憶體使用率超過 85%'
        });

        // 磁碟使用率告警
        this.addAlertRule('disk_high', {
            name: '磁碟使用率過高',
            condition: (metrics) => metrics.disk > 90,
            severity: 'critical',
            cooldown: 600000, // 10分鐘冷卻時間
            description: '磁碟使用率超過 90%'
        });

        // 回應時間告警
        this.addAlertRule('response_slow', {
            name: 'API 回應時間過慢',
            condition: (metrics) => metrics.avgResponseTime > 5000,
            severity: 'medium',
            cooldown: 180000, // 3分鐘冷卻時間
            description: 'API 平均回應時間超過 5 秒'
        });

        // 錯誤率告警
        this.addAlertRule('error_rate_high', {
            name: '錯誤率過高',
            condition: (metrics) => metrics.errorRate > 5,
            severity: 'high',
            cooldown: 300000,
            description: '錯誤率超過 5%'
        });

        // 資料庫連接告警
        this.addAlertRule('database_connection', {
            name: '資料庫連接異常',
            condition: (metrics) => !metrics.databaseConnected,
            severity: 'critical',
            cooldown: 60000, // 1分鐘冷卻時間
            description: '無法連接到資料庫'
        });

        // 服務不可用告警
        this.addAlertRule('service_down', {
            name: '服務不可用',
            condition: (metrics) => !metrics.serviceHealthy,
            severity: 'critical',
            cooldown: 60000,
            description: '系統服務健康檢查失敗'
        });

        logger.info('告警規則初始化完成');
    }

    /**
     * 初始化通知通道
     */
    initializeNotificationChannels() {
        // Telegram 通知
        this.notificationChannels.set('telegram', {
            name: 'Telegram',
            enabled: !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
            send: this.sendTelegramNotification.bind(this)
        });

        // 郵件通知 (如果配置了)
        this.notificationChannels.set('email', {
            name: '郵件',
            enabled: !!(process.env.SMTP_HOST && process.env.SMTP_USER),
            send: this.sendEmailNotification.bind(this)
        });

        // 日誌通知 (總是啟用)
        this.notificationChannels.set('log', {
            name: '日誌',
            enabled: true,
            send: this.sendLogNotification.bind(this)
        });

        logger.info(`通知通道初始化完成: ${Array.from(this.notificationChannels.keys()).join(', ')}`);
    }

    /**
     * 新增告警規則
     */
    addAlertRule(id, rule) {
        this.alertRules.set(id, {
            ...rule,
            id,
            lastTriggered: 0,
            isActive: true
        });
    }

    /**
     * 檢查告警條件
     */
    async checkAlerts(systemMetrics) {
        const currentTime = Date.now();
        const triggeredAlerts = [];

        for (const [ruleId, rule] of this.alertRules.entries()) {
            if (!rule.isActive) continue;

            // 檢查冷卻時間
            if (currentTime - rule.lastTriggered < rule.cooldown) continue;

            try {
                // 評估告警條件
                if (rule.condition(systemMetrics)) {
                    const alert = {
                        id: `${ruleId}_${currentTime}`,
                        ruleId,
                        name: rule.name,
                        description: rule.description,
                        severity: rule.severity,
                        timestamp: currentTime,
                        metrics: systemMetrics,
                        status: 'active'
                    };

                    this.alerts.push(alert);
                    triggeredAlerts.push(alert);

                    // 更新規則的最後觸發時間
                    rule.lastTriggered = currentTime;

                    // 發送通知
                    await this.sendAlert(alert);

                    logger.warn(`告警觸發: ${rule.name} [${rule.severity}]`);
                }
            } catch (error) {
                logger.error(`告警規則評估錯誤 [${ruleId}]:`, error);
            }
        }

        // 清理舊告警 (只保留最近24小時的)
        this.cleanupOldAlerts();

        return triggeredAlerts;
    }

    /**
     * 發送告警通知
     */
    async sendAlert(alert) {
        const promises = [];

        // 根據嚴重性決定使用的通知通道
        const channels = this.getNotificationChannelsForSeverity(alert.severity);

        for (const channelName of channels) {
            const channel = this.notificationChannels.get(channelName);
            if (channel && channel.enabled) {
                promises.push(
                    channel.send(alert).catch(error => {
                        logger.error(`通知發送失敗 [${channelName}]:`, error);
                    })
                );
            }
        }

        await Promise.allSettled(promises);

        // 記錄到告警歷史
        this.alertHistory.push({
            ...alert,
            notificationsSent: channels.length
        });
    }

    /**
     * 根據嚴重性獲取通知通道
     */
    getNotificationChannelsForSeverity(severity) {
        switch (severity) {
            case 'critical':
                return ['telegram', 'email', 'log'];
            case 'high':
                return ['telegram', 'log'];
            case 'medium':
                return ['log'];
            default:
                return ['log'];
        }
    }

    /**
     * 發送 Telegram 通知
     */
    async sendTelegramNotification(alert) {
        if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
            throw new Error('Telegram 配置不完整');
        }

        const severityEmoji = {
            critical: '🔥',
            high: '⚠️',
            medium: 'ℹ️',
            low: '📝'
        };

        const message = `${severityEmoji[alert.severity] || '📢'} 系統告警通知

📋 告警名稱: ${alert.name}
🔥 嚴重性: ${alert.severity.toUpperCase()}
🕐 發生時間: ${new Date(alert.timestamp).toLocaleString('zh-TW')}
📝 描述: ${alert.description}

📊 系統指標:
• CPU 使用率: ${alert.metrics.cpu || 0}%
• 記憶體使用率: ${alert.metrics.memory || 0}%
• 平均回應時間: ${alert.metrics.avgResponseTime || 0}ms
• 錯誤率: ${alert.metrics.errorRate || 0}%

🏥 系統狀態: ${alert.metrics.serviceHealthy ? '正常' : '異常'}
💾 資料庫: ${alert.metrics.databaseConnected ? '已連接' : '連接失敗'}

請立即檢查系統狀況！`;

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

        if (!response.ok) {
            throw new Error(`Telegram API 錯誤: ${response.status}`);
        }

        logger.info(`Telegram 告警通知已發送: ${alert.name}`);
    }

    /**
     * 發送郵件通知
     */
    async sendEmailNotification(alert) {
        // 這裡應該實現實際的郵件發送邏輯
        // 暫時只記錄日誌
        logger.info(`郵件告警通知 (模擬): ${alert.name} [${alert.severity}]`);
    }

    /**
     * 發送日誌通知
     */
    async sendLogNotification(alert) {
        const logLevel = {
            critical: 'error',
            high: 'warn',
            medium: 'info',
            low: 'info'
        }[alert.severity] || 'info';

        logger[logLevel](`告警: ${alert.name} - ${alert.description}`);
    }

    /**
     * 解決告警
     */
    resolveAlert(alertId, resolvedBy = 'system') {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert && alert.status === 'active') {
            alert.status = 'resolved';
            alert.resolvedAt = Date.now();
            alert.resolvedBy = resolvedBy;

            logger.info(`告警已解決: ${alert.name} by ${resolvedBy}`);
            return true;
        }
        return false;
    }

    /**
     * 獲取活躍告警
     */
    getActiveAlerts() {
        return this.alerts.filter(alert => alert.status === 'active');
    }

    /**
     * 獲取告警統計
     */
    getAlertStatistics() {
        const now = Date.now();
        const last24Hours = now - 86400000;
        const last7Days = now - 604800000;

        const recent24h = this.alertHistory.filter(alert => alert.timestamp > last24Hours);
        const recent7d = this.alertHistory.filter(alert => alert.timestamp > last7Days);

        const severityCount = {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0
        };

        recent24h.forEach(alert => {
            severityCount[alert.severity] = (severityCount[alert.severity] || 0) + 1;
        });

        return {
            activeAlerts: this.getActiveAlerts().length,
            totalAlerts: this.alerts.length,
            last24Hours: {
                total: recent24h.length,
                bySeverity: severityCount
            },
            last7Days: {
                total: recent7d.length
            },
            alertRules: {
                total: this.alertRules.size,
                active: Array.from(this.alertRules.values()).filter(rule => rule.isActive).length
            }
        };
    }

    /**
     * 啟動定期檢查
     */
    startPeriodicChecks() {
        // 每分鐘執行一次告警檢查
        setInterval(async () => {
            try {
                // 這裡應該獲取實際的系統指標
                const mockMetrics = await this.getCurrentSystemMetrics();
                await this.checkAlerts(mockMetrics);
            } catch (error) {
                logger.error('定期告警檢查失敗:', error);
            }
        }, 60000);

        // 每小時清理一次舊告警
        setInterval(() => {
            this.cleanupOldAlerts();
        }, 3600000);

        logger.info('定期告警檢查已啟動');
    }

    /**
     * 獲取當前系統指標 (模擬)
     */
    async getCurrentSystemMetrics() {
        const os = require('os');
        
        return {
            cpu: Math.random() * 100,
            memory: (1 - os.freemem() / os.totalmem()) * 100,
            disk: Math.random() * 100,
            avgResponseTime: Math.random() * 3000,
            errorRate: Math.random() * 10,
            databaseConnected: true,
            serviceHealthy: true,
            timestamp: Date.now()
        };
    }

    /**
     * 清理舊告警
     */
    cleanupOldAlerts() {
        const oneDayAgo = Date.now() - 86400000;

        // 只保留活躍的告警和最近24小時的告警
        this.alerts = this.alerts.filter(alert => 
            alert.status === 'active' || alert.timestamp > oneDayAgo
        );

        // 清理告警歷史 (只保留最近7天的)
        const sevenDaysAgo = Date.now() - 604800000;
        this.alertHistory = this.alertHistory.filter(alert => 
            alert.timestamp > sevenDaysAgo
        );
    }

    /**
     * 匯出告警報告
     */
    exportAlertReport(startDate, endDate) {
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();

        const reportAlerts = this.alertHistory.filter(alert => 
            alert.timestamp >= start && alert.timestamp <= end
        );

        const report = {
            period: {
                start: new Date(start).toISOString(),
                end: new Date(end).toISOString()
            },
            summary: {
                totalAlerts: reportAlerts.length,
                bySeverity: {},
                byRule: {}
            },
            alerts: reportAlerts
        };

        // 統計按嚴重性
        reportAlerts.forEach(alert => {
            report.summary.bySeverity[alert.severity] = 
                (report.summary.bySeverity[alert.severity] || 0) + 1;
            
            report.summary.byRule[alert.ruleId] = 
                (report.summary.byRule[alert.ruleId] || 0) + 1;
        });

        return report;
    }

    /**
     * 停止告警服務
     */
    shutdown() {
        // 清理定時器等資源
        logger.info('告警服務正在關閉...');
    }
}

// 創建單例
const alertService = new AlertService();

// 優雅關閉
process.on('SIGTERM', () => alertService.shutdown());
process.on('SIGINT', () => alertService.shutdown());

module.exports = alertService;