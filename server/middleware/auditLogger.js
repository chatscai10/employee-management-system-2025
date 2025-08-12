/**
 * 安全審計日誌中間件
 */

const fs = require('fs');
const path = require('path');

class AuditLogger {
    constructor() {
        this.logPath = path.join(__dirname, '../logs/audit.log');
        this.ensureLogDirectory();
    }

    ensureLogDirectory() {
        const logDir = path.dirname(this.logPath);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }

    log(event, user, details = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            event: event,
            user: user,
            ip: details.ip,
            userAgent: details.userAgent,
            details: details,
            risk: this.assessRisk(event, details)
        };

        const logLine = JSON.stringify(logEntry) + '\n';
        fs.appendFileSync(this.logPath, logLine);

        // 高風險事件立即通知
        if (logEntry.risk === 'HIGH') {
            this.sendSecurityAlert(logEntry);
        }
    }

    assessRisk(event, details) {
        const highRiskEvents = [
            'LOGIN_FAILED_MULTIPLE',
            'UNAUTHORIZED_ACCESS',
            'SUSPICIOUS_ACTIVITY',
            'DATA_MODIFICATION',
            'PRIVILEGE_ESCALATION'
        ];

        if (highRiskEvents.includes(event)) return 'HIGH';
        if (event.includes('FAILED')) return 'MEDIUM';
        return 'LOW';
    }

    async sendSecurityAlert(logEntry) {
        try {
            const telegramBotToken = '7659930552:AAF_jF1rAXFnjFO176-9X5fKfBwbrko8BNc';
            const chatId = '-1002658082392';
            
            const message = `🚨 安全警報
            
事件: ${logEntry.event}
用戶: ${logEntry.user}
時間: ${logEntry.timestamp}
IP: ${logEntry.ip}
風險等級: ${logEntry.risk}

詳情: ${JSON.stringify(logEntry.details, null, 2)}`;

            const fetch = require('node-fetch');
            await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message
                })
            });
        } catch (error) {
            console.error('安全警報發送失敗:', error);
        }
    }

    middleware() {
        return (req, res, next) => {
            // 記錄敏感操作
            const originalSend = res.send;
            res.send = function(data) {
                // 分析響應以檢測可疑活動
                if (res.statusCode >= 400) {
                    auditLogger.log('HTTP_ERROR', req.user?.id || 'anonymous', {
                        ip: req.ip,
                        userAgent: req.get('User-Agent'),
                        method: req.method,
                        url: req.url,
                        statusCode: res.statusCode
                    });
                }
                
                return originalSend.call(this, data);
            };

            next();
        };
    }
}

const auditLogger = new AuditLogger();
module.exports = auditLogger;
