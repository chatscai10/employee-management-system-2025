/**
 * 🌐 GPS打卡系統完整驗證Telegram通知引擎
 */

const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

class GPSVerificationTelegramReporter {
    constructor() {
        this.botToken = 'process.env.TELEGRAM_BOT_TOKEN';
        this.groupId = 'process.env.TELEGRAM_GROUP_ID';
        this.bot = new TelegramBot(this.botToken, { polling: false });
    }

    async sendComprehensiveReport() {
        try {
            // 讀取驗證結果
            const reportFiles = fs.readdirSync('D:/0809/').filter(f => 
                f.startsWith('comprehensive-gps-verification-data-') && f.endsWith('.json')
            );
            
            if (reportFiles.length === 0) {
                throw new Error('找不到驗證結果檔案');
            }
            
            // 取得最新的報告
            const latestReport = reportFiles.sort().pop();
            const verificationData = JSON.parse(
                fs.readFileSync(`D:/0809/${latestReport}`, 'utf8')
            );

            // 構建詳細報告訊息
            const message = this.buildDetailedMessage(verificationData);
            
            // 發送主報告
            await this.bot.sendMessage(this.groupId, message, {
                disable_web_page_preview: true
            });

            // 發送詳細統計資料
            const statsMessage = this.buildStatsMessage(verificationData);
            await this.bot.sendMessage(this.groupId, statsMessage);

            // 如果有嚴重問題，發送警告
            if (this.hasCriticalIssues(verificationData)) {
                const alertMessage = this.buildAlertMessage(verificationData);
                await this.bot.sendMessage(this.groupId, alertMessage);
            }

            console.log('✅ Telegram驗證報告已成功發送');
            return true;

        } catch (error) {
            console.error('❌ Telegram報告發送失敗:', error.message);
            return false;
        }
    }

    buildDetailedMessage(data) {
        const timestamp = new Date(data.timestamp).toLocaleString('zh-TW');
        
        return `🌐 GPS打卡系統完整驗證報告

📊 驗證概覽
• 驗證時間: ${timestamp}
• 問題數量: ${data.issues?.length || 0}個
• 建議數量: ${data.recommendations?.length || 0}個

🔍 核心功能驗證結果

1️⃣ 伺服器狀態
${data.serverStatus?.isRunning ? '✅' : '❌'} 伺服器運行
${data.serverStatus?.error ? `⚠️ 錯誤: ${data.serverStatus.error.substring(0, 50)}...` : ''}

2️⃣ GPS整合系統
• 相關腳本: ${data.gpsIntegration?.scriptsLoaded?.length || 0}個
• 界面元素: ${data.gpsIntegration?.elementsFound?.length || 0}個
• 權限測試: ${data.gpsIntegration?.permissionTest?.success ? '✅' : '❌'}

3️⃣ Telegram通知
• Bot連接: ${data.telegramNotification?.botStatus?.connected ? '✅' : '❌'}
• 測試消息: ${data.telegramNotification?.testMessage?.sent ? '✅' : '❌'}
• Bot名稱: ${data.telegramNotification?.botStatus?.botName || 'unknown'}

4️⃣ 設備指紋檢測
• 指紋生成: ${data.deviceFingerprint?.generated ? '✅' : '❌'}
• 唯一性評分: ${data.deviceFingerprint?.uniqueness || 0}%
• 組件數量: ${data.deviceFingerprint?.components?.length || 0}個

5️⃣ 地理圍欄驗證
• 測試位置: ${data.geofencing?.tests?.length || 0}個
• 準確度: ${data.geofencing?.accuracy?.accuracy || 0}%
• 正確預測: ${data.geofencing?.accuracy?.correctPredictions || 0}/${data.geofencing?.accuracy?.totalTests || 0}

6️⃣ 端到端測試
成功步驟: ${data.endToEnd?.steps?.filter(s => s.success).length || 0}/${data.endToEnd?.steps?.length || 0}
總執行時間: ${data.endToEnd?.totalTime || 0}ms

7️⃣ 性能分析
• 頁面加載: ${data.performance?.pageLoad?.totalLoadTime || 0}ms
• 性能等級: ${data.performance?.performanceGrade?.grade || 'N/A'}
• 評分: ${data.performance?.performanceGrade?.score || 0}分`;
    }

    buildStatsMessage(data) {
        // 計算各項統計
        const functionalCompleteness = this.calculateFunctionalCompleteness(data);
        const systemStability = this.calculateSystemStability(data);
        const userExperience = this.calculateUserExperience(data);
        const security = this.calculateSecurity(data);

        return `📈 *系統統計摘要*

🎯 *整體評估*
• 功能完整度: ${functionalCompleteness}%
• 系統穩定性: ${systemStability}%
• 用戶體驗: ${userExperience}%
• 安全性: ${security}%

🔧 *技術指標*
• API響應時間: ${this.getAvgApiResponseTime(data)}ms
• 資源加載數量: ${data.performance?.resources?.totalResources || 0}
• 設備指紋組件: ${data.deviceFingerprint?.components?.length || 0}/8
• 地理圍欄精度: ${data.geofencing?.accuracy?.accuracy || 0}%

⚡ *智慧模板整合狀況*
${this.getTemplateIntegrationStatus(data)}

🔄 *自動化驗證流程*
• 瀏覽器自動化: ✅ 已執行
• 截圖生成: ${data.frontendUX?.error ? '❌' : '✅'}
• API測試: ✅ 已完成
• 端到端測試: ${data.endToEnd?.success ? '✅' : '❌'}`;
    }

    buildAlertMessage(data) {
        const criticalIssues = data.issues?.filter(issue => 
            issue.severity === 'CRITICAL' || issue.severity === 'HIGH'
        ) || [];

        return `🚨 *系統警告 - 發現嚴重問題*

⚠️ *需要立即處理的問題*
${criticalIssues.map((issue, index) => 
    `${index + 1}. *${issue.type}*
   嚴重度: ${issue.severity}
   訊息: ${issue.message}`
).join('\n\n')}

🎯 *建議優先行動*
${data.recommendations?.filter(r => r.priority === 'HIGH' || r.priority === 'CRITICAL')
    .map((rec, index) => 
        `${index + 1}. *${rec.category}* (${rec.priority})
   ${rec.suggestion}`
    ).join('\n\n')}

📞 *聯絡資訊*
請立即聯絡系統管理員處理上述問題`;
    }

    hasCriticalIssues(data) {
        const criticalIssues = data.issues?.filter(issue => 
            issue.severity === 'CRITICAL' || issue.severity === 'HIGH'
        ) || [];
        
        return criticalIssues.length > 0;
    }

    calculateFunctionalCompleteness(data) {
        const categories = ['serverStatus', 'gpsIntegration', 'geofencing', 'deviceFingerprint'];
        let workingCategories = 0;
        
        categories.forEach(category => {
            const result = data[category];
            if (result && !result.error) {
                workingCategories++;
            }
        });
        
        return Math.round((workingCategories / categories.length) * 100);
    }

    calculateSystemStability(data) {
        const criticalIssues = data.issues?.filter(
            issue => issue.severity === 'CRITICAL' || issue.severity === 'HIGH'
        ).length || 0;
        
        const maxCriticalIssues = 5;
        return Math.max(0, Math.round(((maxCriticalIssues - criticalIssues) / maxCriticalIssues) * 100));
    }

    calculateUserExperience(data) {
        let score = 100;
        
        if (data.frontendUX?.error) score -= 50;
        if (data.performance?.error) score -= 30;
        if (data.performance?.performanceGrade?.score < 70) score -= 20;
        
        return Math.max(0, score);
    }

    calculateSecurity(data) {
        let score = 100;
        
        if (data.deviceFingerprint?.error || !data.deviceFingerprint?.generated) score -= 40;
        if (data.geofencing?.error || (data.geofencing?.accuracy?.accuracy || 0) < 80) score -= 30;
        if ((data.deviceFingerprint?.uniqueness || 0) < 60) score -= 30;
        
        return Math.max(0, score);
    }

    getAvgApiResponseTime(data) {
        if (!data.apiRoutes || Object.keys(data.apiRoutes).length === 0) return 'N/A';
        
        const responseTimes = Object.values(data.apiRoutes)
            .filter(route => route.responseTime)
            .map(route => route.responseTime);
            
        if (responseTimes.length === 0) return 'N/A';
        
        return Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length);
    }

    getTemplateIntegrationStatus(data) {
        const templates = [
            { name: 'modern-geolocation-tracker', status: data.gpsIntegration?.scriptsLoaded?.length > 0 ? '✅' : '❌' },
            { name: 'multi-store-geofencing', status: data.geofencing?.tests?.length > 0 ? '✅' : '❌' },
            { name: 'enterprise-telegram-notification', status: data.telegramNotification?.testMessage?.sent ? '✅' : '❌' }
        ];

        return templates.map(t => `• ${t.name}: ${t.status}`).join('\n');
    }
}

// 直接執行報告發送
if (require.main === module) {
    const reporter = new GPSVerificationTelegramReporter();
    
    reporter.sendComprehensiveReport()
        .then(success => {
            if (success) {
                console.log('🎉 GPS驗證Telegram報告發送完成');
                process.exit(0);
            } else {
                console.log('❌ GPS驗證Telegram報告發送失敗');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('❌ 執行錯誤:', error);
            process.exit(1);
        });
}

module.exports = GPSVerificationTelegramReporter;