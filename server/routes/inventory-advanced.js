/**
 * ==========================================
 * 庫存進階管理路由 - Inventory Advanced Routes
 * ==========================================
 * 進階庫存管理、異常監控和警報系統
 */

const express = require('express');
const router = express.Router();
const { Op, fn, col } = require('sequelize');
const logger = require('../utils/logger');
const AdvancedAbnormalEngine = require('../services/advanced-abnormal-engine');
const InventoryNotificationService = require('../services/inventory-notification-service');

// 獲取資料庫模型
const getModels = () => {
    return require('../models').getModels();
};

/**
 * 執行完整異常分析
 * GET /api/inventory/advanced/analysis
 */
router.get('/analysis', async (req, res) => {
    try {
        logger.info('🔍 接收完整異常分析請求');
        
        const analysisReport = await AdvancedAbnormalEngine.runCompleteAnalysis();
        
        // 創建警報記錄
        const createdAlerts = await AdvancedAbnormalEngine.createAlerts(analysisReport);
        
        res.json({
            success: true,
            message: '異常分析完成',
            timestamp: new Date().toISOString(),
            report: analysisReport,
            alertsCreated: createdAlerts.length,
            summary: {
                totalAnalyzed: analysisReport.summary.totalItems,
                abnormalFound: analysisReport.summary.abnormalItems,
                criticalIssues: analysisReport.summary.criticalItems,
                recommendations: analysisReport.recommendations.length
            }
        });
        
    } catch (error) {
        logger.error('❌ 異常分析失敗:', error);
        res.status(500).json({
            success: false,
            message: '異常分析失敗',
            error: error.message
        });
    }
});

/**
 * 獲取太久沒叫貨的品項
 * GET /api/inventory/advanced/no-order-analysis
 */
router.get('/no-order-analysis', async (req, res) => {
    try {
        const noOrderItems = await AdvancedAbnormalEngine.checkNoOrderTooLong();
        
        res.json({
            success: true,
            message: '太久沒叫貨分析完成',
            count: noOrderItems.length,
            items: noOrderItems,
            summary: {
                high_severity: noOrderItems.filter(item => item.severity === 'high').length,
                medium_severity: noOrderItems.filter(item => item.severity === 'medium').length
            }
        });
        
    } catch (error) {
        logger.error('❌ 太久沒叫貨分析失敗:', error);
        res.status(500).json({
            success: false,
            message: '分析失敗',
            error: error.message
        });
    }
});

/**
 * 獲取叫貨太頻繁的品項
 * GET /api/inventory/advanced/frequent-order-analysis
 */
router.get('/frequent-order-analysis', async (req, res) => {
    try {
        const frequentItems = await AdvancedAbnormalEngine.checkTooFrequentOrders();
        
        res.json({
            success: true,
            message: '叫貨頻繁度分析完成',
            count: frequentItems.length,
            items: frequentItems,
            summary: {
                most_frequent: frequentItems.length > 0 ? 
                              frequentItems.reduce((max, item) => 
                                  item.ordersInPeriod > max.ordersInPeriod ? item : max
                              ) : null,
                avg_frequency: frequentItems.length > 0 ?
                              (frequentItems.reduce((sum, item) => sum + item.ordersInPeriod, 0) / frequentItems.length).toFixed(2)
                              : 0
            }
        });
        
    } catch (error) {
        logger.error('❌ 叫貨頻繁度分析失敗:', error);
        res.status(500).json({
            success: false,
            message: '分析失敗',
            error: error.message
        });
    }
});

/**
 * 獲取新品項無叫貨記錄
 * GET /api/inventory/advanced/new-item-analysis
 */
router.get('/new-item-analysis', async (req, res) => {
    try {
        const newItems = await AdvancedAbnormalEngine.checkNewItemNoOrder();
        
        res.json({
            success: true,
            message: '新品項分析完成',
            count: newItems.length,
            items: newItems,
            summary: {
                high_risk: newItems.filter(item => item.daysSinceCreated > 14).length,
                medium_risk: newItems.filter(item => item.daysSinceCreated <= 14).length,
                oldest_item: newItems.length > 0 ? 
                            newItems.reduce((oldest, item) => 
                                item.daysSinceCreated > oldest.daysSinceCreated ? item : oldest
                            ) : null
            }
        });
        
    } catch (error) {
        logger.error('❌ 新品項分析失敗:', error);
        res.status(500).json({
            success: false,
            message: '分析失敗',
            error: error.message
        });
    }
});

/**
 * 獲取低庫存分析
 * GET /api/inventory/advanced/low-stock-analysis
 */
router.get('/low-stock-analysis', async (req, res) => {
    try {
        const lowStockItems = await AdvancedAbnormalEngine.checkLowStock();
        
        res.json({
            success: true,
            message: '低庫存分析完成',
            count: lowStockItems.length,
            items: lowStockItems,
            summary: {
                critical_items: lowStockItems.filter(item => item.severity === 'critical').length,
                high_priority: lowStockItems.filter(item => item.severity === 'high').length,
                medium_priority: lowStockItems.filter(item => item.severity === 'medium').length,
                total_suggested_orders: lowStockItems.reduce((sum, item) => sum + item.suggestedOrderQuantity, 0)
            }
        });
        
    } catch (error) {
        logger.error('❌ 低庫存分析失敗:', error);
        res.status(500).json({
            success: false,
            message: '分析失敗',
            error: error.message
        });
    }
});

/**
 * 獲取品項詳細分析
 * GET /api/inventory/advanced/item/:itemId/analysis
 */
router.get('/item/:itemId/analysis', async (req, res) => {
    try {
        const { itemId } = req.params;
        const { InventoryItem, InventoryOrder, InventoryLog, InventoryAlert } = getModels();
        
        // 獲取品項基本信息
        const item = await InventoryItem.findByPk(itemId);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: '品項不存在'
            });
        }
        
        // 獲取最近的叫貨記錄
        const recentOrders = await InventoryOrder.findAll({
            where: {
                orderItems: {
                    [Op.like]: `%"itemId":${itemId}%`
                }
            },
            order: [['createdAt', 'DESC']],
            limit: 10
        });
        
        // 獲取庫存變動日誌
        const inventoryLogs = await InventoryLog.getItemHistory(itemId, 20);
        
        // 獲取相關警報
        const alerts = await InventoryAlert.getItemAlerts(itemId);
        
        // 計算統計數據
        const daysSinceOrder = item.getDaysWithoutOrder();
        const isAbnormal = item.checkAbnormal();
        
        // 檢查該品項的各種異常情況
        const analysisResults = {
            noOrderTooLong: daysSinceOrder > item.abnormalDays,
            lowStock: item.currentStock <= item.lowStockThreshold,
            criticalStock: item.currentStock === 0
        };
        
        // 檢查頻繁叫貨
        const today = new Date();
        const checkStartDate = new Date(today);
        checkStartDate.setDate(today.getDate() - item.frequentOrderDays);
        
        const recentOrdersCount = recentOrders.filter(order => 
            new Date(order.createdAt) >= checkStartDate
        ).length;
        
        analysisResults.tooFrequentOrders = recentOrdersCount > item.maxOrdersInPeriod;
        
        const itemAnalysis = {
            itemInfo: {
                id: item.id,
                itemName: item.itemName,
                category: item.category,
                supplier: item.supplier,
                status: item.status,
                unit: item.unit,
                sellingPrice: item.sellingPrice,
                costPrice: item.costPrice
            },
            stockInfo: {
                currentStock: item.currentStock,
                lowStockThreshold: item.lowStockThreshold,
                autoRestockLevel: item.autoRestockLevel,
                minStock: item.minStock,
                maxStock: item.maxStock
            },
            orderingInfo: {
                lastOrderDate: item.lastOrderDate,
                lastOrderQuantity: item.lastOrderQuantity,
                daysSinceOrder: daysSinceOrder,
                abnormalDays: item.abnormalDays,
                frequentOrderDays: item.frequentOrderDays,
                maxOrdersInPeriod: item.maxOrdersInPeriod,
                recentOrdersCount: recentOrdersCount
            },
            analysisResults: analysisResults,
            recommendations: [],
            recentOrders: recentOrders.slice(0, 5),
            inventoryLogs: inventoryLogs.slice(0, 10),
            alerts: alerts.slice(0, 5)
        };
        
        // 生成建議
        if (analysisResults.criticalStock) {
            itemAnalysis.recommendations.push({
                type: 'critical',
                message: '品項已缺貨，需要緊急叫貨',
                action: '立即聯繫供應商安排緊急補貨'
            });
        } else if (analysisResults.lowStock) {
            itemAnalysis.recommendations.push({
                type: 'warning',
                message: '庫存偏低，建議安排補貨',
                action: `建議叫貨 ${Math.max(item.autoRestockLevel - item.currentStock, 1)} ${item.unit}`
            });
        }
        
        if (analysisResults.noOrderTooLong) {
            itemAnalysis.recommendations.push({
                type: 'warning',
                message: `已經 ${daysSinceOrder} 天沒有叫貨，超過異常閾值 ${item.abnormalDays} 天`,
                action: '檢查是否需要補貨或調整異常監控參數'
            });
        }
        
        if (analysisResults.tooFrequentOrders) {
            itemAnalysis.recommendations.push({
                type: 'info',
                message: `${item.frequentOrderDays} 天內已叫貨 ${recentOrdersCount} 次，超過上限 ${item.maxOrdersInPeriod} 次`,
                action: '考慮增加自動補貨量或延長檢測期間'
            });
        }
        
        res.json({
            success: true,
            message: '品項分析完成',
            analysis: itemAnalysis
        });
        
    } catch (error) {
        logger.error('❌ 品項分析失敗:', error);
        res.status(500).json({
            success: false,
            message: '品項分析失敗',
            error: error.message
        });
    }
});

/**
 * 更新品項監控參數
 * PUT /api/inventory/advanced/item/:itemId/monitoring-params
 */
router.put('/item/:itemId/monitoring-params', async (req, res) => {
    try {
        const { itemId } = req.params;
        const {
            abnormalDays,
            frequentOrderDays,
            maxOrdersInPeriod,
            lowStockThreshold,
            autoRestockLevel,
            employeeNotes,
            managerNotes
        } = req.body;
        
        const { InventoryItem } = getModels();
        
        const item = await InventoryItem.findByPk(itemId);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: '品項不存在'
            });
        }
        
        // 更新監控參數
        const updateData = {};
        if (abnormalDays !== undefined) updateData.abnormalDays = abnormalDays;
        if (frequentOrderDays !== undefined) updateData.frequentOrderDays = frequentOrderDays;
        if (maxOrdersInPeriod !== undefined) updateData.maxOrdersInPeriod = maxOrdersInPeriod;
        if (lowStockThreshold !== undefined) updateData.lowStockThreshold = lowStockThreshold;
        if (autoRestockLevel !== undefined) updateData.autoRestockLevel = autoRestockLevel;
        if (employeeNotes !== undefined) updateData.employeeNotes = employeeNotes;
        if (managerNotes !== undefined) updateData.managerNotes = managerNotes;
        
        await item.update(updateData);
        
        logger.info(`✅ 品項 ${item.itemName} 監控參數已更新`, { itemId, updateData });
        
        res.json({
            success: true,
            message: '監控參數更新成功',
            item: {
                id: item.id,
                itemName: item.itemName,
                abnormalDays: item.abnormalDays,
                frequentOrderDays: item.frequentOrderDays,
                maxOrdersInPeriod: item.maxOrdersInPeriod,
                lowStockThreshold: item.lowStockThreshold,
                autoRestockLevel: item.autoRestockLevel,
                employeeNotes: item.employeeNotes,
                managerNotes: item.managerNotes
            }
        });
        
    } catch (error) {
        logger.error('❌ 更新監控參數失敗:', error);
        res.status(500).json({
            success: false,
            message: '更新失敗',
            error: error.message
        });
    }
});

/**
 * 手動調整庫存
 * POST /api/inventory/advanced/item/:itemId/adjust-stock
 */
router.post('/item/:itemId/adjust-stock', async (req, res) => {
    try {
        const { itemId } = req.params;
        const { newQuantity, reason, operatorName } = req.body;
        
        if (newQuantity === undefined || newQuantity < 0) {
            return res.status(400).json({
                success: false,
                message: '庫存數量無效'
            });
        }
        
        const { InventoryItem, InventoryLog } = getModels();
        
        const item = await InventoryItem.findByPk(itemId);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: '品項不存在'
            });
        }
        
        const oldQuantity = item.currentStock;
        
        // 更新庫存
        await item.update({ currentStock: newQuantity });
        
        // 記錄庫存調整日誌
        await InventoryLog.createAdjustLog(
            itemId,
            item.itemName,
            oldQuantity,
            newQuantity,
            reason || '手動庫存調整',
            null, // operatorId
            operatorName || '管理員'
        );
        
        logger.info(`✅ 品項 ${item.itemName} 庫存已調整`, {
            itemId,
            oldQuantity,
            newQuantity,
            operator: operatorName
        });
        
        res.json({
            success: true,
            message: '庫存調整成功',
            adjustment: {
                itemName: item.itemName,
                oldQuantity,
                newQuantity,
                difference: newQuantity - oldQuantity,
                reason: reason || '手動庫存調整',
                operator: operatorName || '管理員',
                timestamp: new Date().toISOString()
            }
        });
        
    } catch (error) {
        logger.error('❌ 庫存調整失敗:', error);
        res.status(500).json({
            success: false,
            message: '庫存調整失敗',
            error: error.message
        });
    }
});

/**
 * 獲取活躍警報
 * GET /api/inventory/advanced/alerts
 */
router.get('/alerts', async (req, res) => {
    try {
        const { severity } = req.query;
        const { InventoryAlert } = getModels();
        
        const alerts = await InventoryAlert.getActiveAlerts(severity);
        
        res.json({
            success: true,
            message: '警報資料獲取成功',
            count: alerts.length,
            alerts: alerts,
            summary: {
                critical: alerts.filter(alert => alert.severity === 4).length,
                high: alerts.filter(alert => alert.severity === 3).length,
                medium: alerts.filter(alert => alert.severity === 2).length,
                low: alerts.filter(alert => alert.severity === 1).length
            }
        });
        
    } catch (error) {
        logger.error('❌ 獲取警報失敗:', error);
        res.status(500).json({
            success: false,
            message: '獲取警報失敗',
            error: error.message
        });
    }
});

/**
 * 解決警報
 * PUT /api/inventory/advanced/alerts/:alertId/resolve
 */
router.put('/alerts/:alertId/resolve', async (req, res) => {
    try {
        const { alertId } = req.params;
        const { resolvedBy, reason } = req.body;
        
        const { InventoryAlert } = getModels();
        
        const alert = await InventoryAlert.findByPk(alertId);
        if (!alert) {
            return res.status(404).json({
                success: false,
                message: '警報不存在'
            });
        }
        
        await alert.resolve(resolvedBy, reason || '問題已解決');
        
        res.json({
            success: true,
            message: '警報已解決',
            alert: {
                id: alert.id,
                itemName: alert.itemName,
                alertType: alert.alertType,
                resolvedAt: alert.resolvedAt,
                resolvedBy: alert.resolvedBy,
                resolvedReason: alert.resolvedReason
            }
        });
        
    } catch (error) {
        logger.error('❌ 解決警報失敗:', error);
        res.status(500).json({
            success: false,
            message: '解決警報失敗',
            error: error.message
        });
    }
});

/**
 * 發送測試通知
 * POST /api/inventory/advanced/send-notification
 */
router.post('/send-notification', async (req, res) => {
    try {
        const { type } = req.body;
        
        let result = null;
        
        switch (type) {
            case 'abnormal_alert':
                // 執行分析並發送異常警報
                const analysisReport = await AdvancedAbnormalEngine.runCompleteAnalysis();
                result = await InventoryNotificationService.sendAbnormalAlertNotification(analysisReport);
                break;
                
            case 'critical_stock':
                // 檢查並發送緊急庫存警報
                const lowStockItems = await AdvancedAbnormalEngine.checkLowStock();
                const criticalItems = lowStockItems.filter(item => item.severity === 'critical');
                result = await InventoryNotificationService.sendCriticalStockAlert(criticalItems);
                break;
                
            case 'manager_detailed':
                // 發送管理員詳細通知測試
                const testOrderData = {
                    orderNumber: 'TEST-' + Date.now(),
                    employeeName: '測試員工',
                    deliveryDate: new Date().toLocaleDateString('zh-TW'),
                    storeName: '內壢忠孝店',
                    totalAmount: 1500,
                    orderItems: [
                        {
                            itemName: '雞排',
                            quantity: 10,
                            unit: '包',
                            supplier: '大大食品'
                        },
                        {
                            itemName: '薯條',
                            quantity: 5,
                            unit: '包',
                            supplier: '大大食品'
                        }
                    ]
                };
                
                const testAnalysisData = await AdvancedAbnormalEngine.runCompleteAnalysis();
                result = await InventoryNotificationService.sendManagerDetailedNotification(testOrderData, testAnalysisData);
                break;
                
            case 'employee_simple':
                // 發送員工簡化通知測試
                const simpleOrderData = {
                    deliveryDate: new Date().toLocaleDateString('zh-TW'),
                    storeName: '內壢忠孝店',
                    orderItems: [
                        { itemName: '雞排', quantity: 10, unit: '包', supplier: '大大食品' },
                        { itemName: '薯條', quantity: 5, unit: '包', supplier: '大大食品' },
                        { itemName: '飲料', quantity: 8, unit: '瓶', supplier: '飲料供應商' }
                    ],
                    totalAmount: 1200
                };
                result = await InventoryNotificationService.sendEmployeeSimpleNotification(simpleOrderData);
                break;
                
            default:
                return res.status(400).json({
                    success: false,
                    message: '無效的通知類型',
                    supportedTypes: ['abnormal_alert', 'critical_stock', 'manager_detailed', 'employee_simple']
                });
        }
        
        res.json({
            success: true,
            message: '通知發送成功',
            type: type,
            result: result
        });
        
    } catch (error) {
        logger.error('❌ 發送測試通知失敗:', error);
        res.status(500).json({
            success: false,
            message: '通知發送失敗',
            error: error.message
        });
    }
});

module.exports = router;