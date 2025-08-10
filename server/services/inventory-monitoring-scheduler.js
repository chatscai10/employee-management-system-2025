/**
 * ==========================================
 * 庫存監控定時任務調度器 - Inventory Monitoring Scheduler
 * ==========================================
 * 定期執行異常監控分析並發送通知
 */

const cron = require('node-cron');
const logger = require('../utils/logger');
const AdvancedAbnormalEngine = require('./advanced-abnormal-engine');
const InventoryNotificationService = require('./inventory-notification-service');

class InventoryMonitoringScheduler {
    
    constructor() {
        this.jobs = new Map();
        this.isRunning = false;
    }
    
    /**
     * 啟動所有定時監控任務
     */
    start() {
        if (this.isRunning) {
            logger.warn('⚠️ 庫存監控調度器已經在運行中');
            return;
        }
        
        logger.info('⏰ 啟動庫存監控定時任務調度器...');
        
        // 每小時執行一次完整異常分析
        this.scheduleHourlyAnalysis();
        
        // 每天早上 9 點執行詳細報告
        this.scheduleDailyReport();
        
        // 每 30 分鐘檢查緊急庫存
        this.scheduleCriticalStockCheck();
        
        // 每週一早上 8 點執行週報
        this.scheduleWeeklyReport();
        
        this.isRunning = true;
        logger.info('✅ 庫存監控定時任務調度器啟動完成');
    }
    
    /**
     * 停止所有定時任務
     */
    stop() {
        if (!this.isRunning) {
            return;
        }
        
        logger.info('🛑 停止庫存監控定時任務...');
        
        this.jobs.forEach((job, name) => {
            job.stop();
            logger.info(`✅ 已停止任務: ${name}`);
        });
        
        this.jobs.clear();
        this.isRunning = false;
        
        logger.info('✅ 庫存監控定時任務已全部停止');
    }
    
    /**
     * 每小時異常分析任務
     */
    scheduleHourlyAnalysis() {
        // 每小時的第 0 分鐘執行
        const job = cron.schedule('0 * * * *', async () => {
            try {
                logger.info('🔍 開始執行每小時異常分析...');
                
                const analysisReport = await AdvancedAbnormalEngine.runCompleteAnalysis();
                
                // 如果發現異常，發送警報通知
                if (analysisReport.summary.abnormalItems > 0) {
                    await InventoryNotificationService.sendAbnormalAlertNotification(analysisReport);
                }
                
                // 創建警報記錄
                const createdAlerts = await AdvancedAbnormalEngine.createAlerts(analysisReport);
                
                logger.info('✅ 每小時異常分析完成', {
                    totalItems: analysisReport.summary.totalItems,
                    abnormalItems: analysisReport.summary.abnormalItems,
                    alertsCreated: createdAlerts.length
                });
                
            } catch (error) {
                logger.error('❌ 每小時異常分析失敗:', error);
            }
        }, {
            scheduled: false,
            timezone: "Asia/Taipei"
        });
        
        job.start();
        this.jobs.set('hourly_analysis', job);
        logger.info('⏰ 已設置每小時異常分析任務 (每小時執行)');
    }
    
    /**
     * 每日詳細報告任務
     */
    scheduleDailyReport() {
        // 每天早上 9 點執行
        const job = cron.schedule('0 9 * * *', async () => {
            try {
                logger.info('📊 開始生成每日庫存報告...');
                
                const analysisReport = await AdvancedAbnormalEngine.runCompleteAnalysis();
                
                // 構建詳細日報
                const dailyReport = await this.buildDailyReport(analysisReport);
                
                // 發送每日報告
                await InventoryNotificationService.sendTelegramNotification(dailyReport);
                
                logger.info('✅ 每日庫存報告已發送');
                
            } catch (error) {
                logger.error('❌ 每日庫存報告生成失敗:', error);
            }
        }, {
            scheduled: false,
            timezone: "Asia/Taipei"
        });
        
        job.start();
        this.jobs.set('daily_report', job);
        logger.info('📅 已設置每日報告任務 (每天9:00執行)');
    }
    
    /**
     * 緊急庫存檢查任務
     */
    scheduleCriticalStockCheck() {
        // 每 30 分鐘檢查一次
        const job = cron.schedule('*/30 * * * *', async () => {
            try {
                logger.info('🚨 執行緊急庫存檢查...');
                
                const lowStockItems = await AdvancedAbnormalEngine.checkLowStock();
                const criticalItems = lowStockItems.filter(item => item.severity === 'critical');
                
                if (criticalItems.length > 0) {
                    await InventoryNotificationService.sendCriticalStockAlert(criticalItems);
                    
                    logger.warn('🚨 發現緊急庫存項目', {
                        criticalItemsCount: criticalItems.length,
                        items: criticalItems.map(item => item.itemName).join('、')
                    });
                }
                
                logger.info('✅ 緊急庫存檢查完成', {
                    lowStockItems: lowStockItems.length,
                    criticalItems: criticalItems.length
                });
                
            } catch (error) {
                logger.error('❌ 緊急庫存檢查失敗:', error);
            }
        }, {
            scheduled: false,
            timezone: "Asia/Taipei"
        });
        
        job.start();
        this.jobs.set('critical_stock_check', job);
        logger.info('🚨 已設置緊急庫存檢查任務 (每30分鐘執行)');
    }
    
    /**
     * 週報任務
     */
    scheduleWeeklyReport() {
        // 每週一早上 8 點執行
        const job = cron.schedule('0 8 * * 1', async () => {
            try {
                logger.info('📋 開始生成週庫存報告...');
                
                const weeklyReport = await this.buildWeeklyReport();
                
                // 發送週報
                await InventoryNotificationService.sendTelegramNotification(weeklyReport);
                
                logger.info('✅ 週庫存報告已發送');
                
            } catch (error) {
                logger.error('❌ 週庫存報告生成失敗:', error);
            }
        }, {
            scheduled: false,
            timezone: "Asia/Taipei"
        });
        
        job.start();
        this.jobs.set('weekly_report', job);
        logger.info('📅 已設置週報任務 (每週一8:00執行)');
    }
    
    /**
     * 構建每日報告
     * @param {Object} analysisReport - 分析報告
     * @returns {String} 報告內容
     */
    async buildDailyReport(analysisReport) {
        const today = new Date().toLocaleDateString('zh-TW');
        
        let report = `📊 每日庫存監控報告\\n`;
        report += `━━━━━━━━━━━━━━━━━━━\\n`;
        report += `📅 日期: ${today}\\n`;
        report += `🔍 監控品項: ${analysisReport.summary.totalItems}項\\n`;
        report += `⚠️ 異常項目: ${analysisReport.summary.abnormalItems}項\\n`;
        report += `🚨 緊急項目: ${analysisReport.summary.criticalItems}項\\n\\n`;
        
        // 系統健康度
        const healthScore = this.calculateHealthScore(analysisReport);
        report += `💚 系統健康度: ${healthScore}%\\n\\n`;
        
        // 主要發現
        if (analysisReport.findings.noOrderTooLong.length > 0) {
            report += `⏰ 太久沒叫貨: ${analysisReport.findings.noOrderTooLong.length}項\\n`;
        }
        
        if (analysisReport.findings.tooFrequentOrders.length > 0) {
            report += `🔄 叫貨頻繁: ${analysisReport.findings.tooFrequentOrders.length}項\\n`;
        }
        
        if (analysisReport.findings.newItemNoOrder.length > 0) {
            report += `🆕 新品項未叫貨: ${analysisReport.findings.newItemNoOrder.length}項\\n`;
        }
        
        if (analysisReport.findings.lowStock.length > 0) {
            report += `📉 低庫存: ${analysisReport.findings.lowStock.length}項\\n`;
        }
        
        report += `\\n💡 建議行動項: ${analysisReport.recommendations.length}項\\n`;
        report += `━━━━━━━━━━━━━━━━━━━`;
        
        return report;
    }
    
    /**
     * 構建週報
     * @returns {String} 週報內容
     */
    async buildWeeklyReport() {
        try {
            const { InventoryItem, InventoryOrder, InventoryLog } = require('../models').getModels();
            const today = new Date();
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - 7);
            
            // 獲取週統計數據
            const [totalItems, weeklyOrders, weeklyLogs] = await Promise.all([
                InventoryItem.count({ where: { status: '上架', isDeleted: false } }),
                InventoryOrder.count({
                    where: {
                        createdAt: {
                            [require('sequelize').Op.gte]: weekStart
                        }
                    }
                }),
                InventoryLog.count({
                    where: {
                        createdAt: {
                            [require('sequelize').Op.gte]: weekStart
                        }
                    }
                })
            ]);
            
            let report = `📋 週庫存監控報告\\n`;
            report += `━━━━━━━━━━━━━━━━━━━\\n`;
            report += `📅 期間: ${weekStart.toLocaleDateString('zh-TW')} - ${today.toLocaleDateString('zh-TW')}\\n`;
            report += `🏪 監控品項: ${totalItems}項\\n`;
            report += `📦 本週叫貨: ${weeklyOrders}次\\n`;
            report += `📝 庫存異動: ${weeklyLogs}筆\\n\\n`;
            
            // 執行當前分析
            const analysisReport = await AdvancedAbnormalEngine.runCompleteAnalysis();
            
            report += `⚠️ 當前異常: ${analysisReport.summary.abnormalItems}項\\n`;
            report += `🚨 緊急處理: ${analysisReport.summary.criticalItems}項\\n\\n`;
            
            // 週趨勢分析
            report += `📈 週趨勢分析:\\n`;
            report += `  • 平均每日叫貨: ${Math.round(weeklyOrders / 7)}次\\n`;
            report += `  • 庫存流動性: ${weeklyLogs > 0 ? '活躍' : '靜態'}\\n`;
            report += `  • 系統穩定性: ${analysisReport.summary.abnormalItems < 5 ? '良好' : '需關注'}\\n\\n`;
            
            report += `💡 下週重點關注:\\n`;
            if (analysisReport.recommendations.length > 0) {
                analysisReport.recommendations.slice(0, 3).forEach(rec => {
                    report += `  • ${rec.title}\\n`;
                });
            } else {
                report += `  • 系統運行正常，持續監控\\n`;
            }
            
            report += `━━━━━━━━━━━━━━━━━━━`;
            
            return report;
            
        } catch (error) {
            logger.error('❌ 週報構建失敗:', error);
            return `❌ 週報生成失敗: ${error.message}`;
        }
    }
    
    /**
     * 計算系統健康度分數
     * @param {Object} analysisReport - 分析報告
     * @returns {Number} 健康度分數 (0-100)
     */
    calculateHealthScore(analysisReport) {
        const { totalItems, abnormalItems, criticalItems } = analysisReport.summary;
        
        if (totalItems === 0) return 100;
        
        // 基礎分數 100 分
        let score = 100;
        
        // 異常項目每個扣 5 分
        score -= abnormalItems * 5;
        
        // 緊急項目每個扣 15 分
        score -= criticalItems * 15;
        
        // 確保分數在 0-100 範圍內
        return Math.max(0, Math.min(100, Math.round(score)));
    }
    
    /**
     * 手動觸發完整分析
     */
    async triggerManualAnalysis() {
        try {
            logger.info('🔍 手動觸發異常分析...');
            
            const analysisReport = await AdvancedAbnormalEngine.runCompleteAnalysis();
            
            if (analysisReport.summary.abnormalItems > 0) {
                await InventoryNotificationService.sendAbnormalAlertNotification(analysisReport);
            }
            
            const createdAlerts = await AdvancedAbnormalEngine.createAlerts(analysisReport);
            
            logger.info('✅ 手動異常分析完成', {
                abnormalItems: analysisReport.summary.abnormalItems,
                alertsCreated: createdAlerts.length
            });
            
            return analysisReport;
            
        } catch (error) {
            logger.error('❌ 手動異常分析失敗:', error);
            throw error;
        }
    }
    
    /**
     * 獲取調度器狀態
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            activeJobs: Array.from(this.jobs.keys()),
            jobCount: this.jobs.size
        };
    }
}

module.exports = InventoryMonitoringScheduler;