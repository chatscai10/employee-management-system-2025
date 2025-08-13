/**
 * ==========================================
 * 庫存管理通知服務 - Inventory Notification Service
 * ==========================================
 * 基於用戶需求：管理員詳細通知，員工簡化通知
 * 整合進階異常監控和權限分級通知系統
 */

const logger = require('../utils/logger');

class InventoryNotificationService {
    
    /**
     * 發送叫貨記錄詳細管理員通知
     * @param {Object} orderData - 叫貨數據
     * @param {Object} analysisData - 異常分析數據
     */
    static async sendManagerDetailedNotification(orderData, analysisData) {
        try {
            // 構建詳細管理員通知
            const notification = this.buildManagerNotification(orderData, analysisData);
            
            // 發送 Telegram 通知
            await this.sendTelegramNotification(notification);
            
            // 記錄通知
            logger.info('✅ 管理員詳細通知已發送', {
                orderNumber: orderData.orderNumber,
                itemCount: orderData.orderItems.length,
                abnormalItemsCount: analysisData.abnormalItems
            });
            
            return {
                success: true,
                message: '管理員詳細通知發送成功',
                notification: notification
            };
            
        } catch (error) {
            logger.error('❌ 管理員詳細通知發送失敗:', error);
            throw error;
        }
    }
    
    /**
     * 發送員工簡化通知
     * @param {Object} orderData - 叫貨數據
     */
    static async sendEmployeeSimpleNotification(orderData) {
        try {
            // 構建簡化員工通知
            const notification = this.buildEmployeeNotification(orderData);
            
            // 發送 Telegram 通知
            await this.sendTelegramNotification(notification);
            
            logger.info('✅ 員工簡化通知已發送', {
                orderNumber: orderData.orderNumber,
                employeeName: orderData.employeeName
            });
            
            return {
                success: true,
                message: '員工簡化通知發送成功',
                notification: notification
            };
            
        } catch (error) {
            logger.error('❌ 員工簡化通知發送失敗:', error);
            throw error;
        }
    }
    
    /**
     * 構建管理員詳細通知內容
     * @param {Object} orderData - 叫貨數據
     * @param {Object} analysisData - 分析數據
     * @returns {String} 通知內容
     */
    static buildManagerNotification(orderData, analysisData) {
        let notification = `🛒 叫貨記錄詳細報告 + 庫存分析\n`;
        notification += `━━━━━━━━━━━━━━━━━━━\n\n`;
        
        // 叫貨明細
        notification += `📦 叫貨明細:\n`;
        notification += `叫貨人員：${orderData.employeeName}\n`;
        notification += `📅 送貨日期: ${orderData.deliveryDate || '待確認'}\n`;
        notification += `🏪 分店: ${orderData.storeName}\n`;
        notification += `💰 總金額: $${orderData.totalAmount}\n\n`;
        
        // 廠商分類
        notification += `🏭 廠商分類:\n`;
        const supplierGroups = this.groupItemsBySupplier(orderData.orderItems);
        
        Object.keys(supplierGroups).forEach(supplier => {
            notification += `${supplier}\n`;
            supplierGroups[supplier].forEach(item => {
                notification += `  • ${item.itemName} ${item.quantity} ${item.unit}\n`;
            });
            notification += `\n`;
        });
        
        // 庫存警報 - 只顯示低庫存需要備貨的品項
        if (analysisData && analysisData.findings && analysisData.findings.lowStock && analysisData.findings.lowStock.length > 0) {
            notification += `⚠️ 庫存警報 - 需要備貨:\n`;
            
            analysisData.findings.lowStock.forEach(item => {
                const urgency = item.severity === 'critical' ? '🚨 緊急' : 
                               item.severity === 'high' ? '🔥 較急' : '⚠️ 注意';
                notification += `  ${urgency} ${item.itemName}: 剩餘 ${item.currentStock} ${item.analysisData.unit}`;
                
                if (item.suggestedOrderQuantity > 0) {
                    notification += ` (建議叫貨: ${item.suggestedOrderQuantity} ${item.analysisData.unit})`;
                }
                notification += `\n`;
            });
            notification += `\n`;
        } else {
            notification += `✅ 庫存狀況: 所有品項庫存充足\n\n`;
        }
        
        notification += `━━━━━━━━━━━━━━━━━━━`;
        
        return notification;
    }
    
    /**
     * 構建員工簡化通知內容
     * @param {Object} orderData - 叫貨數據
     * @returns {String} 通知內容
     */
    static buildEmployeeNotification(orderData) {
        let notification = `🛒 叫貨記錄\n`;
        notification += `📅 送貨日期: ${orderData.deliveryDate || '待確認'}\n`;
        notification += `🏪 分店: ${orderData.storeName}\n`;
        notification += `💰 總價: $${orderData.totalAmount}\n\n`;
        
        // 顯示具體品項和數量 (不顯示廠商名稱)
        notification += `📦 叫貨明細:\n`;
        orderData.orderItems.forEach(item => {
            notification += `  • ${item.itemName} ${item.quantity} ${item.unit}\n`;
        });
        
        return notification.trim();
    }
    
    /**
     * 按供應商分組品項
     * @param {Array} orderItems - 訂單品項列表
     * @returns {Object} 分組結果
     */
    static groupItemsBySupplier(orderItems) {
        const groups = {};
        
        orderItems.forEach(item => {
            const supplier = item.supplier || '未知供應商';
            if (!groups[supplier]) {
                groups[supplier] = [];
            }
            groups[supplier].push(item);
        });
        
        return groups;
    }
    
    /**
     * 發送異常警報通知
     * @param {Object} analysisReport - 完整分析報告
     */
    static async sendAbnormalAlertNotification(analysisReport) {
        try {
            if (analysisReport.summary.abnormalItems === 0) {
                return { success: true, message: '無異常項目，不需發送警報' };
            }
            
            let notification = `⚠️ 庫存異常監控警報\n`;
            notification += `━━━━━━━━━━━━━━━━━━━\n`;
            notification += `📊 監控時間: ${new Date(analysisReport.analysisTime).toLocaleString('zh-TW')}\n`;
            notification += `🔍 分析品項: ${analysisReport.summary.totalItems}項\n`;
            notification += `🚨 發現異常: ${analysisReport.summary.abnormalItems}項\n`;
            notification += `🔥 緊急項目: ${analysisReport.summary.criticalItems}項\n\n`;
            
            // 太久沒叫貨項目
            if (analysisReport.findings.noOrderTooLong.length > 0) {
                notification += `⏰ 太久沒叫貨項目 (${analysisReport.findings.noOrderTooLong.length}項):\n`;
                analysisReport.findings.noOrderTooLong.forEach(item => {
                    notification += `  • ${item.itemName}: ${item.daysSinceOrder}天 (${item.supplier})\n`;
                });
                notification += `\n`;
            }
            
            // 頻繁叫貨項目
            if (analysisReport.findings.tooFrequentOrders.length > 0) {
                notification += `🔄 頻繁叫貨項目 (${analysisReport.findings.tooFrequentOrders.length}項):\n`;
                analysisReport.findings.tooFrequentOrders.forEach(item => {
                    notification += `  • ${item.itemName}: ${item.ordersInPeriod}次/${item.checkPeriodDays}天\n`;
                });
                notification += `\n`;
            }
            
            // 新品項無叫貨
            if (analysisReport.findings.newItemNoOrder.length > 0) {
                notification += `🆕 新品項無叫貨 (${analysisReport.findings.newItemNoOrder.length}項):\n`;
                analysisReport.findings.newItemNoOrder.forEach(item => {
                    notification += `  • ${item.itemName}: ${item.daysSinceCreated}天無叫貨\n`;
                });
                notification += `\n`;
            }
            
            // 低庫存項目
            if (analysisReport.findings.lowStock.length > 0) {
                notification += `📉 低庫存項目 (${analysisReport.findings.lowStock.length}項):\n`;
                analysisReport.findings.lowStock.forEach(item => {
                    const urgency = item.severity === 'critical' ? '🚨' : 
                                   item.severity === 'high' ? '🔥' : '⚠️';
                    notification += `  ${urgency} ${item.itemName}: ${item.currentStock}${item.analysisData.unit}\n`;
                });
                notification += `\n`;
            }
            
            // 建議行動
            if (analysisReport.recommendations.length > 0) {
                notification += `💡 建議行動:\n`;
                analysisReport.recommendations.forEach(rec => {
                    notification += `  • ${rec.title}\n`;
                });
            }
            
            notification += `━━━━━━━━━━━━━━━━━━━`;
            
            // 發送通知
            await this.sendTelegramNotification(notification);
            
            logger.info('✅ 異常警報通知已發送', {
                abnormalItems: analysisReport.summary.abnormalItems,
                criticalItems: analysisReport.summary.criticalItems
            });
            
            return {
                success: true,
                message: '異常警報通知發送成功',
                notification: notification
            };
            
        } catch (error) {
            logger.error('❌ 異常警報通知發送失敗:', error);
            throw error;
        }
    }
    
    /**
     * 發送 Telegram 通知
     * @param {String} message - 通知消息
     */
    static async sendTelegramNotification(message) {
        try {
            // Telegram Bot 配置
            const botToken = 'process.env.TELEGRAM_BOT_TOKEN';
            const chatId = 'process.env.TELEGRAM_GROUP_ID';
            
            const axios = require('axios');
            const telegramAPI = `https://api.telegram.org/bot${botToken}/sendMessage`;
            
            const response = await axios.post(telegramAPI, {
                chat_id: chatId,
                text: message,
                parse_mode: 'MarkdownV2'
            }, {
                timeout: 5000
            });
            
            if (response.data.ok) {
                logger.info('✅ Telegram 通知發送成功');
                return { success: true, messageId: response.data.result.message_id };
            } else {
                throw new Error(`Telegram API 錯誤: ${response.data.description}`);
            }
            
        } catch (error) {
            // 如果是 Markdown 格式錯誤，嘗試純文本發送
            if (error.response && error.response.data && error.response.data.description && 
                error.response.data.description.includes('parse')) {
                
                logger.warn('⚠️ Markdown 格式錯誤，改用純文本發送');
                return await this.sendTelegramNotificationPlain(message.replace(/\\\\/g, ''));
            }
            
            logger.error('❌ Telegram 通知發送失敗:', error.message);
            throw error;
        }
    }
    
    /**
     * 發送純文本 Telegram 通知
     * @param {String} message - 通知消息
     */
    static async sendTelegramNotificationPlain(message) {
        try {
            const botToken = 'process.env.TELEGRAM_BOT_TOKEN';
            const chatId = 'process.env.TELEGRAM_GROUP_ID';
            
            const axios = require('axios');
            const telegramAPI = `https://api.telegram.org/bot${botToken}/sendMessage`;
            
            const response = await axios.post(telegramAPI, {
                chat_id: chatId,
                text: message
            }, {
                timeout: 5000
            });
            
            if (response.data.ok) {
                logger.info('✅ Telegram 純文本通知發送成功');
                return { success: true, messageId: response.data.result.message_id };
            } else {
                throw new Error(`Telegram API 錯誤: ${response.data.description}`);
            }
            
        } catch (error) {
            logger.error('❌ Telegram 純文本通知發送失敗:', error.message);
            throw error;
        }
    }
    
    /**
     * 發送緊急庫存警報
     * @param {Array} criticalItems - 緊急項目列表
     */
    static async sendCriticalStockAlert(criticalItems) {
        try {
            if (!criticalItems || criticalItems.length === 0) {
                return { success: true, message: '無緊急項目需要通知' };
            }
            
            let notification = `🚨 緊急庫存警報 🚨\n`;
            notification += `━━━━━━━━━━━━━━━━━━━\n`;
            notification += `⏰ 時間: ${new Date().toLocaleString('zh-TW')}\n`;
            notification += `🔥 緊急項目: ${criticalItems.length}項\n\n`;
            
            criticalItems.forEach(item => {
                notification += `🚨 ${item.itemName}\n`;
                notification += `  📦 目前庫存: ${item.currentStock} ${item.analysisData.unit}\n`;
                notification += `  🏭 供應商: ${item.supplier}\n`;
                notification += `  💡 建議叫貨: ${item.suggestedOrderQuantity} ${item.analysisData.unit}\n\n`;
            });
            
            notification += `⚡ 請立即處理緊急補貨！\n`;
            notification += `━━━━━━━━━━━━━━━━━━━`;
            
            // 發送通知
            await this.sendTelegramNotification(notification);
            
            logger.info('🚨 緊急庫存警報已發送', {
                criticalItemsCount: criticalItems.length
            });
            
            return {
                success: true,
                message: '緊急庫存警報發送成功',
                notification: notification
            };
            
        } catch (error) {
            logger.error('❌ 緊急庫存警報發送失敗:', error);
            throw error;
        }
    }
}

module.exports = InventoryNotificationService;