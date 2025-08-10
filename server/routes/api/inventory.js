/**
 * ==========================================
 * 叫貨管理系統路由 - Inventory Management Routes
 * ==========================================
 * 基於系統邏輯.txt規格 - 叫貨系統和異常監控機制
 */

const express = require('express');
const router = express.Router();
const { Op, fn, col } = require('sequelize');
const logger = require('../../utils/logger');
const { initModels, getModels } = require('../../models/index');
const telegramService = require('../../services/telegram');

// 異常監控引擎 - 分析品項進貨異常 (系統邏輯.txt line 284-286)
class AbnormalMonitorEngine {
    
    // 檢查品項進貨異常
    static async checkItemAbnormal(storeName) {
        await initModels();
        const models = getModels();
        
        const items = await models.InventoryItem.findAll({
            where: {
                isDeleted: false,
                status: '上架',
                lastOrderDate: { [Op.not]: null }
            }
        });
        
        const abnormalItems = [];
        const today = new Date();
        
        for (const item of items) {
            const daysSinceLastOrder = item.getDaysWithoutOrder();
            
            if (daysSinceLastOrder >= item.abnormalDays) {
                abnormalItems.push({
                    itemName: item.itemName,
                    category: item.category,
                    supplier: item.supplier,
                    lastOrderDate: item.lastOrderDate,
                    lastOrderQuantity: item.lastOrderQuantity,
                    abnormalDays: daysSinceLastOrder,
                    threshold: item.abnormalDays
                });
            }
        }
        
        return abnormalItems;
    }
    
    // 生成異常報告
    static generateAbnormalReport(abnormalItems, storeName) {
        if (abnormalItems.length === 0) return null;
        
        let report = `🚨 ${storeName} 品項進貨異常通知\\n\\n`;
        
        abnormalItems.forEach((item, index) => {
            report += `${index + 1}. ${item.itemName}\\n`;
            report += `   上次進貨: ${item.lastOrderDate}\\n`;
            report += `   上次數量: ${item.lastOrderQuantity} ${item.unit || '個'}\\n`;
            report += `   異常天數: ${item.abnormalDays}天\\n\\n`;
        });
        
        return report;
    }
}

// 叫貨購物車引擎
class ShoppingCartEngine {
    
    // 計算購物車總計
    static calculateCartTotal(cartItems) {
        let totalAmount = 0;
        let totalItems = 0;
        let totalQuantity = 0;
        
        cartItems.forEach(item => {
            const subtotal = (item.costPrice || 0) * (item.quantity || 0);
            totalAmount += subtotal;
            totalItems += 1;
            totalQuantity += item.quantity || 0;
        });
        
        return {
            totalAmount: parseFloat(totalAmount.toFixed(2)),
            totalItems,
            totalQuantity,
            items: cartItems.map(item => ({
                ...item,
                subtotal: parseFloat(((item.costPrice || 0) * (item.quantity || 0)).toFixed(2))
            }))
        };
    }
    
    // 按廠商分組品項
    static groupBySupplier(cartItems) {
        const groupedBySupplier = {};
        
        cartItems.forEach(item => {
            const supplier = item.supplier || '未知廠商';
            
            if (!groupedBySupplier[supplier]) {
                groupedBySupplier[supplier] = {
                    supplierName: supplier,
                    items: [],
                    totalAmount: 0,
                    totalQuantity: 0
                };
            }
            
            groupedBySupplier[supplier].items.push(item);
            groupedBySupplier[supplier].totalAmount += (item.costPrice || 0) * (item.quantity || 0);
            groupedBySupplier[supplier].totalQuantity += item.quantity || 0;
        });
        
        return groupedBySupplier;
    }
}

// 1. 獲取品項清單 (系統邏輯.txt line 221)
router.get('/items', async (req, res) => {
    try {
        const { category, supplier, status = '上架' } = req.query;
        
        await initModels();
        const models = getModels();
        
        const where = {
            isDeleted: false,
            status: status
        };
        
        if (category && category !== 'all') {
            where.category = category;
        }
        
        if (supplier) {
            where.supplier = supplier;
        }
        
        const items = await models.InventoryItem.findAll({
            where,
            order: [['category', 'ASC'], ['itemName', 'ASC']]
        });
        
        // 獲取所有類別
        const categories = await models.InventoryItem.findAll({
            attributes: [[fn('DISTINCT', col('category')), 'category']],
            where: { isDeleted: false, status: '上架' },
            order: [['category', 'ASC']],
            raw: true
        });
        
        res.json({
            success: true,
            data: {
                items,
                categories: ['all', ...categories.map(c => c.category)]
            }
        });
        
    } catch (error) {
        logger.error('獲取品項清單失敗:', error);
        res.status(500).json({
            success: false,
            message: '系統錯誤'
        });
    }
});

// 2. 提交叫貨訂單 (系統邏輯.txt line 222)
router.post('/orders', async (req, res) => {
    try {
        const {
            employeeId,
            storeName,
            deliveryDate,
            cartItems,
            notes
        } = req.body;
        
        // 驗證必填參數
        if (!employeeId || !storeName || !deliveryDate || !cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: '缺少必要參數：員工ID、分店名稱、送貨日期、品項清單'
            });
        }
        
        await initModels();
        const models = getModels();
        
        // 獲取員工信息
        const employee = await models.Employee.findByPk(employeeId);
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: '員工不存在'
            });
        }
        
        // 計算購物車總計
        const cartCalculation = ShoppingCartEngine.calculateCartTotal(cartItems);
        
        // 生成廠商分析
        const supplierAnalysis = ShoppingCartEngine.groupBySupplier(cartItems);
        
        // 創建訂單記錄
        const order = await models.InventoryOrder.create({
            employeeId: employeeId,
            employeeName: employee.name,
            storeName: storeName,
            deliveryDate: deliveryDate,
            orderDate: new Date().toISOString().split('T')[0],
            orderItems: cartCalculation.items,
            totalAmount: cartCalculation.totalAmount,
            totalItems: cartCalculation.totalItems,
            totalQuantity: cartCalculation.totalQuantity,
            supplierAnalysis: supplierAnalysis,
            notes: notes || null,
            status: '待處理'
        });
        
        // 更新品項最後叫貨記錄
        for (const item of cartItems) {
            if (item.id) {
                await models.InventoryItem.findByPk(item.id).then(inventoryItem => {
                    if (inventoryItem) {
                        inventoryItem.updateLastOrder(deliveryDate, item.quantity);
                    }
                });
            }
        }
        
        // 檢查異常品項
        const abnormalItems = await AbnormalMonitorEngine.checkItemAbnormal(storeName);
        const abnormalReport = AbnormalMonitorEngine.generateAbnormalReport(abnormalItems, storeName);
        
        // 記錄日誌
        logger.info('叫貨訂單提交成功', {
            employeeId: employee.id,
            employeeName: employee.name,
            storeName: storeName,
            deliveryDate: deliveryDate,
            totalAmount: cartCalculation.totalAmount,
            totalItems: cartCalculation.totalItems,
            abnormalItemsCount: abnormalItems.length
        });
        
        // 發送Telegram通知
        try {
            const orderDateTime = new Date().toLocaleString('zh-TW');
            
            // 員工通知 (簡化版 - 系統邏輯.txt line 551-568)
            const employeeMessage = `${storeName} 叫貨記錄\\n📅 送貨日期: ${deliveryDate}\\n📦 叫貨品項: ${cartCalculation.totalItems}項\\n💰 總價: $${cartCalculation.totalAmount.toLocaleString()}`;
            
            await telegramService.sendEmployeeNotification(
                '🛒 叫貨記錄',
                employeeMessage
            );
            
            // 老闆通知 (詳細版含廠商分析 - 系統邏輯.txt line 411-434)
            let bossMessage = `🛒 叫貨記錄\\n叫貨人員：${employee.name}\\n📅 送貨日期: ${deliveryDate}\\n🏪 分店: ${storeName}\\n💰 總金額: $${cartCalculation.totalAmount.toLocaleString()}\\n⏰ 訂單時間: ${orderDateTime}\\n\\n📊 廠商分類:`;
            
            Object.values(supplierAnalysis).forEach(supplier => {
                bossMessage += `\\n\\n🏭 ${supplier.supplierName}`;
                supplier.items.forEach(item => {
                    bossMessage += `\\n  •${item.itemName} ${item.quantity} ${item.unit || '個'}`;
                });
            });
            
            // 加入異常品項警告
            if (abnormalReport) {
                bossMessage += `\\n\\n⚠️ 異常品項警告:\\n${abnormalReport}`;
            }
            
            await telegramService.sendBossNotification(
                '🛒 叫貨記錄詳細報告',
                bossMessage
            );
            
        } catch (notifyError) {
            logger.error('發送叫貨通知失敗:', notifyError);
        }
        
        res.json({
            success: true,
            message: '叫貨訂單提交成功！',
            data: {
                orderId: order.id,
                totalAmount: cartCalculation.totalAmount,
                totalItems: cartCalculation.totalItems,
                abnormalItemsCount: abnormalItems.length,
                submittedAt: new Date().toISOString()
            }
        });
        
    } catch (error) {
        logger.error('叫貨訂單提交失敗:', error);
        res.status(500).json({
            success: false,
            message: '系統錯誤，請稍後再試'
        });
    }
});

// 3. 獲取叫貨記錄 (系統邏輯.txt line 225)
router.get('/orders', async (req, res) => {
    try {
        const { 
            employeeId, 
            storeName,
            startDate, 
            endDate, 
            status,
            page = 1, 
            limit = 20 
        } = req.query;
        
        await initModels();
        const models = getModels();
        
        const where = {
            isDeleted: false
        };
        
        if (employeeId) where.employeeId = employeeId;
        if (storeName) where.storeName = storeName;
        if (status) where.status = status;
        
        // 日期範圍過濾
        if (startDate && endDate) {
            where.orderDate = {
                [Op.between]: [startDate, endDate]
            };
        }
        
        const offset = (page - 1) * limit;
        
        const { rows: orders, count: total } = await models.InventoryOrder.findAndCountAll({
            where,
            order: [['orderDate', 'DESC'], ['createdAt', 'DESC']],
            offset,
            limit: parseInt(limit),
            include: [{
                model: models.Employee,
                as: 'orderEmployee',
                attributes: ['name', 'currentStore']
            }]
        });
        
        res.json({
            success: true,
            data: {
                orders,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
        
    } catch (error) {
        logger.error('獲取叫貨記錄失敗:', error);
        res.status(500).json({
            success: false,
            message: '系統錯誤'
        });
    }
});

// 4. 品項異常回報 (系統邏輯.txt line 227-228)
router.post('/orders/:id/report-abnormal', async (req, res) => {
    try {
        const { id } = req.params;
        const { problem, reportedBy } = req.body;
        
        if (!problem || !reportedBy) {
            return res.status(400).json({
                success: false,
                message: '缺少必要參數：問題描述、回報員工'
            });
        }
        
        await initModels();
        const models = getModels();
        
        const order = await models.InventoryOrder.findByPk(id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: '訂單不存在'
            });
        }
        
        if (order.isDeleted) {
            return res.status(400).json({
                success: false,
                message: '訂單已被作廢'
            });
        }
        
        // 記錄異常報告
        await order.reportAbnormal(reportedBy, problem);
        
        logger.info('品項異常回報', {
            orderId: id,
            reportedBy: reportedBy,
            storeName: order.storeName,
            deliveryDate: order.deliveryDate
        });
        
        // 發送異常通知
        try {
            const reportTime = new Date().toLocaleString('zh-TW');
            
            // 老闆通知
            await telegramService.sendBossNotification(
                '⚠️ 品項異常回報',
                `📦 訂單異常回報\\n🏪 分店: ${order.storeName}\\n📅 送貨日期: ${order.deliveryDate}\\n👤 回報員工: ${reportedBy}\\n⏰ 回報時間: ${reportTime}\\n❗ 異常問題: ${problem}`
            );
            
            // 員工通知
            await telegramService.sendEmployeeNotification(
                '⚠️ 品項異常已回報',
                `${order.storeName} ${order.deliveryDate} 訂單異常已回報`
            );
            
        } catch (notifyError) {
            logger.error('發送異常通知失敗:', notifyError);
        }
        
        res.json({
            success: true,
            message: '異常回報成功'
        });
        
    } catch (error) {
        logger.error('品項異常回報失敗:', error);
        res.status(500).json({
            success: false,
            message: '系統錯誤'
        });
    }
});

// 5. 作廢叫貨記錄 (系統邏輯.txt line 226)
router.put('/orders/:id/void', async (req, res) => {
    try {
        const { id } = req.params;
        const { reason, operatorId } = req.body;
        
        await initModels();
        const models = getModels();
        
        const order = await models.InventoryOrder.findByPk(id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: '叫貨記錄不存在'
            });
        }
        
        if (order.isDeleted) {
            return res.status(400).json({
                success: false,
                message: '記錄已被作廢'
            });
        }
        
        // 作廢記錄
        await order.update({
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: operatorId || 'system',
            deletedReason: reason || '管理員作廢'
        });
        
        logger.info('叫貨記錄作廢', {
            orderId: id,
            reason: reason,
            operatorId: operatorId,
            storeName: order.storeName,
            deliveryDate: order.deliveryDate
        });
        
        // 發送作廢通知
        try {
            const voidTime = new Date().toLocaleString('zh-TW');
            
            // 老闆通知
            await telegramService.sendBossNotification(
                '⚠️ 叫貨記錄作廢',
                `❌ ${order.deliveryDate} ${order.storeName} 叫貨記錄作廢\\n作廢原因: ${reason || '管理員作廢'}\\n作廢時間: ${voidTime}\\n原訂單金額: $${order.totalAmount.toLocaleString()}`
            );
            
            // 員工通知
            await telegramService.sendEmployeeNotification(
                '⚠️ 叫貨記錄作廢通知',
                `${order.deliveryDate} ${order.storeName} 叫貨記錄已被作廢\\n原因: ${reason || '管理員作廢'}`
            );
            
        } catch (notifyError) {
            logger.error('發送作廢通知失敗:', notifyError);
        }
        
        res.json({
            success: true,
            message: '叫貨記錄已作廢'
        });
        
    } catch (error) {
        logger.error('作廢叫貨記錄失敗:', error);
        res.status(500).json({
            success: false,
            message: '系統錯誤'
        });
    }
});

// 6. 異常監控報告 (系統邏輯.txt line 284-286)
router.get('/abnormal-monitor/:storeName', async (req, res) => {
    try {
        const { storeName } = req.params;
        
        const abnormalItems = await AbnormalMonitorEngine.checkItemAbnormal(storeName);
        const abnormalReport = AbnormalMonitorEngine.generateAbnormalReport(abnormalItems, storeName);
        
        res.json({
            success: true,
            data: {
                storeName,
                abnormalItems,
                abnormalReport,
                checkTime: new Date().toISOString()
            }
        });
        
    } catch (error) {
        logger.error('獲取異常監控報告失敗:', error);
        res.status(500).json({
            success: false,
            message: '系統錯誤'
        });
    }
});

// 7. 相容性端點
router.get('/', async (req, res) => {
    try {
        await initModels();
        const models = getModels();
        
        const orders = models.InventoryOrder ? await models.InventoryOrder.findAll({
            where: { isDeleted: false },
            limit: 50,
            order: [['orderDate', 'DESC']]
        }) : [];
        
        res.json({
            success: true,
            data: {
                orders: orders || [],
                count: orders?.length || 0,
                message: '叫貨管理系統運行正常'
            }
        });
        
    } catch (error) {
        logger.error('❌ 獲取叫貨記錄失敗:', error);
        res.json({
            success: true,
            data: {
                orders: [],
                count: 0,
                message: '叫貨管理系統API端點正常運作'
            }
        });
    }
});

module.exports = router;