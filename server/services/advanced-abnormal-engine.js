/**
 * ==========================================
 * 進階異常監控引擎 - Advanced Abnormal Engine
 * ==========================================
 * 基於用戶需求：分析叫貨品項異常情況
 * 每個品項個別化設定閾值和監控參數
 */

const { Op, fn, col } = require('sequelize');
const logger = require('../utils/logger');

class AdvancedAbnormalEngine {
    
    /**
     * 檢測太久沒叫貨的品項
     * @param {Array} items - 品項列表
     * @returns {Array} 異常品項列表
     */
    static async checkNoOrderTooLong(items = null) {
        try {
            const { InventoryItem, InventoryOrder } = require('../models').getModels();
            
            // 如果沒有提供品項，查詢所有上架品項
            if (!items) {
                items = await InventoryItem.findAll({
                    where: {
                        status: '上架',
                        isDeleted: false
                    }
                });
            }
            
            const abnormalItems = [];
            const today = new Date();
            
            for (const item of items) {
                // 計算距離上次叫貨的天數
                const daysSinceOrder = item.getDaysWithoutOrder();
                
                // 檢查是否超過異常閾值
                if (daysSinceOrder > item.abnormalDays) {
                    // 查找最後一次叫貨記錄
                    const lastOrder = await InventoryOrder.findOne({
                        where: {
                            orderItems: {
                                [Op.like]: `%"itemId":${item.id}%`
                            }
                        },
                        order: [['createdAt', 'DESC']]
                    });
                    
                    abnormalItems.push({
                        itemId: item.id,
                        itemName: item.itemName,
                        category: item.category,
                        supplier: item.supplier,
                        daysSinceOrder: daysSinceOrder,
                        abnormalThreshold: item.abnormalDays,
                        lastOrderDate: item.lastOrderDate,
                        lastOrderQuantity: item.lastOrderQuantity,
                        severity: daysSinceOrder > item.abnormalDays * 2 ? 'high' : 'medium',
                        analysisData: {
                            unit: item.unit,
                            currentStock: item.currentStock,
                            lowStockThreshold: item.lowStockThreshold,
                            lastOrder: lastOrder ? {
                                date: lastOrder.createdAt,
                                orderNumber: lastOrder.orderNumber
                            } : null
                        }
                    });
                }
            }
            
            return abnormalItems;
            
        } catch (error) {
            logger.error('檢測太久沒叫貨異常:', error);
            return [];
        }
    }
    
    /**
     * 檢測叫貨太頻繁的品項
     * @param {Array} items - 品項列表
     * @returns {Array} 頻繁叫貨品項列表
     */
    static async checkTooFrequentOrders(items = null) {
        try {
            const { InventoryItem, InventoryOrder } = require('../models').getModels();
            
            if (!items) {
                items = await InventoryItem.findAll({
                    where: {
                        status: '上架',
                        isDeleted: false
                    }
                });
            }
            
            const frequentItems = [];
            const today = new Date();
            
            for (const item of items) {
                // 計算檢測期間的開始日期
                const checkStartDate = new Date(today);
                checkStartDate.setDate(today.getDate() - item.frequentOrderDays);
                
                // 查詢期間內的叫貨次數
                const recentOrders = await InventoryOrder.findAll({
                    where: {
                        createdAt: {
                            [Op.gte]: checkStartDate
                        },
                        orderItems: {
                            [Op.like]: `%"itemId":${item.id}%`
                        }
                    }
                });
                
                // 檢查是否超過頻繁叫貨閾值
                if (recentOrders.length > item.maxOrdersInPeriod) {
                    const orderDetails = recentOrders.map(order => ({
                        orderNumber: order.orderNumber,
                        date: order.createdAt,
                        employeeName: order.employeeName
                    }));
                    
                    frequentItems.push({
                        itemId: item.id,
                        itemName: item.itemName,
                        category: item.category,
                        supplier: item.supplier,
                        ordersInPeriod: recentOrders.length,
                        maxAllowedOrders: item.maxOrdersInPeriod,
                        checkPeriodDays: item.frequentOrderDays,
                        severity: 'medium',
                        analysisData: {
                            unit: item.unit,
                            currentStock: item.currentStock,
                            recentOrders: orderDetails,
                            checkStartDate: checkStartDate.toISOString().split('T')[0]
                        }
                    });
                }
            }
            
            return frequentItems;
            
        } catch (error) {
            logger.error('檢測叫貨太頻繁異常:', error);
            return [];
        }
    }
    
    /**
     * 檢測新品項無叫貨記錄
     * @returns {Array} 新品項無叫貨記錄列表
     */
    static async checkNewItemNoOrder() {
        try {
            const { InventoryItem, InventoryOrder } = require('../models').getModels();
            
            const today = new Date();
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() - 7); // 上架7天後檢查
            
            // 查詢7天前上架但從未叫貨的品項
            const newItems = await InventoryItem.findAll({
                where: {
                    status: '上架',
                    isDeleted: false,
                    createdAt: {
                        [Op.lte]: checkDate
                    },
                    lastOrderDate: null
                }
            });
            
            const noOrderItems = [];
            
            for (const item of newItems) {
                const daysSinceCreated = Math.floor((today - new Date(item.createdAt)) / (1000 * 60 * 60 * 24));
                
                noOrderItems.push({
                    itemId: item.id,
                    itemName: item.itemName,
                    category: item.category,
                    supplier: item.supplier,
                    daysSinceCreated: daysSinceCreated,
                    createdDate: item.createdAt.toISOString().split('T')[0],
                    severity: daysSinceCreated > 14 ? 'high' : 'medium',
                    analysisData: {
                        unit: item.unit,
                        currentStock: item.currentStock,
                        sellingPrice: item.sellingPrice,
                        costPrice: item.costPrice,
                        priority: item.priority
                    }
                });
            }
            
            return noOrderItems;
            
        } catch (error) {
            logger.error('檢測新品項無叫貨記錄異常:', error);
            return [];
        }
    }
    
    /**
     * 檢測低庫存品項
     * @param {Array} items - 品項列表
     * @returns {Array} 低庫存品項列表
     */
    static async checkLowStock(items = null) {
        try {
            const { InventoryItem } = require('../models').getModels();
            
            if (!items) {
                items = await InventoryItem.findAll({
                    where: {
                        status: '上架',
                        isDeleted: false
                    }
                });
            }
            
            const lowStockItems = [];
            
            for (const item of items) {
                if (item.currentStock <= item.lowStockThreshold) {
                    const suggestedOrder = Math.max(item.autoRestockLevel - item.currentStock, 1);
                    
                    lowStockItems.push({
                        itemId: item.id,
                        itemName: item.itemName,
                        category: item.category,
                        supplier: item.supplier,
                        currentStock: item.currentStock,
                        lowStockThreshold: item.lowStockThreshold,
                        suggestedOrderQuantity: suggestedOrder,
                        severity: item.currentStock === 0 ? 'critical' : 
                                 item.currentStock < item.lowStockThreshold / 2 ? 'high' : 'medium',
                        analysisData: {
                            unit: item.unit,
                            autoRestockLevel: item.autoRestockLevel,
                            supplierLeadTime: item.supplierLeadTime,
                            costPrice: item.costPrice,
                            sellingPrice: item.sellingPrice,
                            priority: item.priority
                        }
                    });
                }
            }
            
            return lowStockItems;
            
        } catch (error) {
            logger.error('檢測低庫存異常:', error);
            return [];
        }
    }
    
    /**
     * 執行完整異常分析
     * @returns {Object} 完整分析報告
     */
    static async runCompleteAnalysis() {
        try {
            logger.info('🔍 啟動進階異常監控引擎分析...');
            
            const analysisReport = {
                analysisTime: new Date().toISOString(),
                summary: {
                    totalItems: 0,
                    abnormalItems: 0,
                    criticalItems: 0,
                    warningItems: 0
                },
                findings: {
                    noOrderTooLong: [],
                    tooFrequentOrders: [],
                    newItemNoOrder: [],
                    lowStock: []
                },
                recommendations: []
            };
            
            // 獲取所有上架品項
            const { InventoryItem } = require('../models').getModels();
            const allItems = await InventoryItem.findAll({
                where: {
                    status: '上架',
                    isDeleted: false
                }
            });
            
            analysisReport.summary.totalItems = allItems.length;
            
            // 並行執行各種異常檢測
            const [noOrderItems, frequentItems, newItems, lowStockItems] = await Promise.all([
                this.checkNoOrderTooLong(allItems),
                this.checkTooFrequentOrders(allItems),
                this.checkNewItemNoOrder(),
                this.checkLowStock(allItems)
            ]);
            
            analysisReport.findings.noOrderTooLong = noOrderItems;
            analysisReport.findings.tooFrequentOrders = frequentItems;
            analysisReport.findings.newItemNoOrder = newItems;
            analysisReport.findings.lowStock = lowStockItems;
            
            // 統計異常項目數量
            const allAbnormalItems = [
                ...noOrderItems,
                ...frequentItems,
                ...newItems,
                ...lowStockItems
            ];
            
            analysisReport.summary.abnormalItems = allAbnormalItems.length;
            analysisReport.summary.criticalItems = allAbnormalItems.filter(item => item.severity === 'critical').length;
            analysisReport.summary.warningItems = allAbnormalItems.filter(item => item.severity === 'medium').length;
            
            // 生成建議
            analysisReport.recommendations = this.generateRecommendations(analysisReport.findings);
            
            logger.info('✅ 進階異常監控分析完成', {
                totalItems: analysisReport.summary.totalItems,
                abnormalItems: analysisReport.summary.abnormalItems,
                criticalItems: analysisReport.summary.criticalItems
            });
            
            return analysisReport;
            
        } catch (error) {
            logger.error('❌ 進階異常監控分析失敗:', error);
            throw error;
        }
    }
    
    /**
     * 生成改善建議
     * @param {Object} findings - 分析結果
     * @returns {Array} 建議列表
     */
    static generateRecommendations(findings) {
        const recommendations = [];
        
        // 太久沒叫貨建議
        if (findings.noOrderTooLong.length > 0) {
            recommendations.push({
                type: 'no_order_action',
                priority: 'high',
                title: '太久沒叫貨品項建議',
                description: `發現 ${findings.noOrderTooLong.length} 個品項太久沒叫貨，建議檢查是否需要補貨或下架`,
                actionItems: findings.noOrderTooLong.map(item => ({
                    item: item.itemName,
                    action: item.daysSinceOrder > item.abnormalThreshold * 3 ? '考慮下架或調整設定' : '建議立即叫貨',
                    days: item.daysSinceOrder
                }))
            });
        }
        
        // 叫貨頻繁建議
        if (findings.tooFrequentOrders.length > 0) {
            recommendations.push({
                type: 'frequent_order_analysis',
                priority: 'medium',
                title: '頻繁叫貨分析建議',
                description: `發現 ${findings.tooFrequentOrders.length} 個品項叫貨頻率偏高，建議分析銷售模式或調整庫存參數`,
                actionItems: findings.tooFrequentOrders.map(item => ({
                    item: item.itemName,
                    action: '增加自動補貨量或延長檢測期間',
                    frequency: `${item.checkPeriodDays}天內${item.ordersInPeriod}次`
                }))
            });
        }
        
        // 新品項建議
        if (findings.newItemNoOrder.length > 0) {
            recommendations.push({
                type: 'new_item_promotion',
                priority: 'medium',
                title: '新品項推廣建議',
                description: `發現 ${findings.newItemNoOrder.length} 個新品項從未被叫貨，建議加強推廣或檢視定價策略`,
                actionItems: findings.newItemNoOrder.map(item => ({
                    item: item.itemName,
                    action: item.daysSinceCreated > 14 ? '檢討定價或下架' : '加強員工推廣',
                    daysOnline: item.daysSinceCreated
                }))
            });
        }
        
        // 低庫存建議
        if (findings.lowStock.length > 0) {
            const criticalStock = findings.lowStock.filter(item => item.severity === 'critical');
            if (criticalStock.length > 0) {
                recommendations.push({
                    type: 'urgent_restock',
                    priority: 'critical',
                    title: '緊急補貨建議',
                    description: `發現 ${criticalStock.length} 個品項已缺貨，需要緊急補貨`,
                    actionItems: criticalStock.map(item => ({
                        item: item.itemName,
                        action: '緊急叫貨',
                        suggestedQuantity: `${item.suggestedOrderQuantity} ${item.analysisData.unit}`
                    }))
                });
            }
            
            const lowStock = findings.lowStock.filter(item => item.severity !== 'critical');
            if (lowStock.length > 0) {
                recommendations.push({
                    type: 'regular_restock',
                    priority: 'high',
                    title: '常規補貨建議',
                    description: `發現 ${lowStock.length} 個品項庫存偏低，建議安排補貨`,
                    actionItems: lowStock.map(item => ({
                        item: item.itemName,
                        action: '安排叫貨',
                        currentStock: `${item.currentStock} ${item.analysisData.unit}`,
                        suggestedQuantity: `${item.suggestedOrderQuantity} ${item.analysisData.unit}`
                    }))
                });
            }
        }
        
        return recommendations;
    }
    
    /**
     * 創建警報記錄
     * @param {Object} analysisReport - 分析報告
     * @returns {Array} 創建的警報列表
     */
    static async createAlerts(analysisReport) {
        try {
            const { InventoryAlert } = require('../models').getModels();
            const createdAlerts = [];
            
            // 為每個異常情況創建警報
            for (const noOrderItem of analysisReport.findings.noOrderTooLong) {
                const alert = await InventoryAlert.createNoOrderAlert({
                    id: noOrderItem.itemId,
                    itemName: noOrderItem.itemName,
                    abnormalDays: noOrderItem.abnormalThreshold,
                    lastOrderDate: noOrderItem.lastOrderDate,
                    lastOrderQuantity: noOrderItem.lastOrderQuantity
                }, noOrderItem.daysSinceOrder);
                
                if (alert) createdAlerts.push(alert);
            }
            
            for (const frequentItem of analysisReport.findings.tooFrequentOrders) {
                const alert = await InventoryAlert.createFrequentOrderAlert({
                    id: frequentItem.itemId,
                    itemName: frequentItem.itemName,
                    frequentOrderDays: frequentItem.checkPeriodDays,
                    maxOrdersInPeriod: frequentItem.maxAllowedOrders,
                    supplier: frequentItem.supplier
                }, frequentItem.ordersInPeriod);
                
                if (alert) createdAlerts.push(alert);
            }
            
            for (const lowStockItem of analysisReport.findings.lowStock) {
                const alert = await InventoryAlert.createLowStockAlert({
                    id: lowStockItem.itemId,
                    itemName: lowStockItem.itemName,
                    currentStock: lowStockItem.currentStock,
                    lowStockThreshold: lowStockItem.lowStockThreshold,
                    unit: lowStockItem.analysisData.unit,
                    supplier: lowStockItem.supplier,
                    supplierLeadTime: lowStockItem.analysisData.supplierLeadTime,
                    autoRestockLevel: lowStockItem.analysisData.autoRestockLevel
                });
                
                if (alert) createdAlerts.push(alert);
            }
            
            logger.info(`✅ 創建了 ${createdAlerts.length} 個庫存警報`);
            return createdAlerts;
            
        } catch (error) {
            logger.error('❌ 創建警報失敗:', error);
            throw error;
        }
    }
}

module.exports = AdvancedAbnormalEngine;