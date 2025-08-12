/**
 * ==========================================
 * 營收管理系統路由 - Revenue Management Routes
 * ==========================================
 * 基於系統邏輯.txt規格 - 獎金計算引擎系統
 */

const express = require('express');
const router = express.Router();
const { Op, fn, col } = require('sequelize');
const logger = require('../../utils/logger');
const { initModels, getModels } = require('../../models/index');
const telegramService = require('../../services/telegram');

// 獎金計算引擎 (基於系統邏輯.txt line 201-207)
class BonusCalculationEngine {
    
    // 計算有效營收 (扣除服務費)
    static calculateEffectiveRevenue(cashRevenue, pandaRevenue, uberRevenue) {
        const pandaEffective = pandaRevenue * 0.65; // 35%服務費，實收65%
        const uberEffective = uberRevenue * 0.65;   // 35%服務費，實收65%
        const totalEffective = cashRevenue + pandaEffective + uberEffective;
        
        return {
            cashRevenue: parseFloat(cashRevenue) || 0,
            pandaRevenue: parseFloat(pandaRevenue) || 0,
            pandaEffective: pandaEffective,
            uberRevenue: parseFloat(uberRevenue) || 0,
            uberEffective: uberEffective,
            totalEffective: totalEffective,
            totalIncome: parseFloat(cashRevenue) + parseFloat(pandaRevenue) + parseFloat(uberRevenue)
        };
    }
    
    // 平日獎金計算 (系統邏輯.txt line 203)
    static calculateWeekdayBonus(cashRevenue, pandaRevenue, uberRevenue, threshold = 13000, bonusRate = 0.30) {
        const revenue = this.calculateEffectiveRevenue(cashRevenue, pandaRevenue, uberRevenue);
        
        if (revenue.totalEffective > threshold) {
            return {
                qualified: true,
                bonusAmount: Math.round(revenue.totalEffective * bonusRate),
                shortfall: 0,
                threshold: threshold,
                bonusRate: bonusRate,
                bonusType: '平日獎金',
                ...revenue
            };
        } else {
            return {
                qualified: false,
                bonusAmount: 0,
                shortfall: threshold - revenue.totalEffective,
                threshold: threshold,
                bonusRate: bonusRate,
                bonusType: '平日獎金',
                ...revenue
            };
        }
    }
    
    // 假日獎金計算 (系統邏輯.txt line 207)
    static calculateHolidayBonus(cashRevenue, pandaRevenue, uberRevenue, threshold = 0, bonusRate = 0.38) {
        const revenue = this.calculateEffectiveRevenue(cashRevenue, pandaRevenue, uberRevenue);
        
        if (revenue.totalEffective >= threshold) {
            return {
                qualified: true,
                bonusAmount: Math.round(revenue.totalEffective * bonusRate),
                shortfall: 0,
                threshold: threshold,
                bonusRate: bonusRate,
                bonusType: '假日獎金',
                ...revenue
            };
        } else {
            return {
                qualified: false,
                bonusAmount: 0,
                shortfall: threshold - revenue.totalEffective,
                threshold: threshold,
                bonusRate: bonusRate,
                bonusType: '假日獎金',
                ...revenue
            };
        }
    }
    
    // 智能獎金計算 (根據日期自動判斷平日/假日)
    static calculateSmartBonus(cashRevenue, pandaRevenue, uberRevenue, date = new Date()) {
        const dayOfWeek = date.getDay(); // 0=週日, 1=週一, ..., 6=週六
        
        // 假日定義：週五、週六、週日 (系統邏輯.txt line 254)
        const isHoliday = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
        
        if (isHoliday) {
            return this.calculateHolidayBonus(cashRevenue, pandaRevenue, uberRevenue);
        } else {
            return this.calculateWeekdayBonus(cashRevenue, pandaRevenue, uberRevenue);
        }
    }
}

// 1. 提交營收記錄
router.post('/submit', async (req, res) => {
    try {
        const {
            employeeId,
            storeName,
            date,
            bonusType, // '平日獎金' 或 '假日獎金'
            cashRevenue,     // 現場營業額
            pandaRevenue,    // 熊貓點餐
            uberRevenue,     // UBER外送
            cashOrders,      // 現場訂單數
            pandaOrders,     // 熊貓訂單數
            uberOrders,      // UBER訂單數
            notes
        } = req.body;
        
        // 驗證必填參數
        if (!employeeId || !storeName || !date || !bonusType) {
            return res.status(400).json({
                success: false,
                message: '缺少必要參數：員工ID、分店名稱、日期、獎金類別'
            });
        }
        
        if (!['平日獎金', '假日獎金'].includes(bonusType)) {
            return res.status(400).json({
                success: false,
                message: '獎金類別必須是 平日獎金 或 假日獎金'
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
        
        // 檢查當日是否已有記錄
        const existingRecord = await models.RevenueRecord.findOne({
            where: {
                employeeId: employeeId,
                storeName: storeName,
                date: date,
                isDeleted: false
            }
        });
        
        if (existingRecord) {
            return res.status(409).json({
                success: false,
                message: '當日營收記錄已存在，請使用更新功能'
            });
        }
        
        // 計算獎金
        let bonusCalculation;
        if (bonusType === '平日獎金') {
            bonusCalculation = BonusCalculationEngine.calculateWeekdayBonus(
                cashRevenue || 0, 
                pandaRevenue || 0, 
                uberRevenue || 0
            );
        } else {
            bonusCalculation = BonusCalculationEngine.calculateHolidayBonus(
                cashRevenue || 0, 
                pandaRevenue || 0, 
                uberRevenue || 0
            );
        }
        
        // 計算總訂單數和營收數據
        const totalOrders = (parseInt(cashOrders) || 0) + (parseInt(pandaOrders) || 0) + (parseInt(uberOrders) || 0);
        const totalExpense = (bonusCalculation.pandaRevenue * 0.35) + (bonusCalculation.uberRevenue * 0.35);
        const netIncome = bonusCalculation.totalIncome - totalExpense;
        const orderAverage = totalOrders > 0 ? bonusCalculation.totalIncome / totalOrders : 0;
        
        // 創建營收記錄 (符合RevenueRecord模型欄位)
        const revenueRecord = await models.RevenueRecord.create({
            employeeId: employeeId,
            employeeName: employee.name,
            storeName: storeName,
            date: date,
            bonusType: bonusType,
            orderCount: totalOrders,
            
            // 收入詳細 (必填JSON欄位)
            incomeDetails: {
                cash: bonusCalculation.cashRevenue,
                panda: bonusCalculation.pandaRevenue,
                uber: bonusCalculation.uberRevenue,
                pandaEffective: bonusCalculation.pandaEffective,
                uberEffective: bonusCalculation.uberEffective,
                cashOrders: parseInt(cashOrders) || 0,
                pandaOrders: parseInt(pandaOrders) || 0,
                uberOrders: parseInt(uberOrders) || 0
            },
            totalIncome: bonusCalculation.totalIncome,
            
            // 支出詳細 (必填JSON欄位)
            expenseDetails: {
                pandaFee: bonusCalculation.pandaRevenue * 0.35,
                uberFee: bonusCalculation.uberRevenue * 0.35,
                otherExpenses: 0
            },
            totalExpense: totalExpense,
            
            // 淨收入和獎金計算
            netIncome: netIncome,
            bonusAmount: bonusCalculation.bonusAmount,
            bonusStatus: bonusCalculation.qualified ? '達標' : '未達標',
            targetGap: bonusCalculation.shortfall > 0 ? bonusCalculation.shortfall : null,
            orderAverage: orderAverage,
            
            notes: notes || null,
            isDeleted: false
        });
        
        // 記錄日誌
        logger.info('營收記錄提交成功', {
            employeeId: employee.id,
            employeeName: employee.name,
            storeName: storeName,
            bonusType: bonusType,
            totalIncome: bonusCalculation.totalIncome,
            bonusAmount: bonusCalculation.bonusAmount,
            qualified: bonusCalculation.qualified
        });
        
        // 發送Telegram通知
        try {
            const submittedAt = new Date().toLocaleString('zh-TW');
            
            // 員工通知 (簡化版 - 系統邏輯.txt line 281)
            const employeeMessage = bonusCalculation.qualified 
                ? `${storeName} 營收記錄成功\\n獎金類別: ${bonusType}\\n今日獎金: $${bonusCalculation.bonusAmount.toLocaleString()}`
                : `${storeName} 營收記錄成功\\n獎金類別: ${bonusType}\\n未達標差距: $${Math.round(bonusCalculation.shortfall).toLocaleString()}`;
            
            await telegramService.sendEmployeeNotification(
                '💰 營收記錄提交',
                employeeMessage
            );
            
            // 老闆通知 (詳細版 - 系統邏輯.txt line 281)
            const bossMessage = `💰 營業額提交 老闆詳細報告\\n👤 提交員工: ${employee.name}\\n🏪 分店: ${storeName}\\n📅 營收日期: ${date}\\n⏰ 提交時間: ${submittedAt}\\n\\n📊 營收明細:\\n• 現場訂單: ${cashOrders || 0} 張\\n• 熊貓訂單: ${pandaOrders || 0} 張\\n• UBER訂單: ${uberOrders || 0} 張\\n\\n💵 收入明細:\\n• 現場訂單: $${bonusCalculation.cashRevenue.toLocaleString()}\\n• 熊貓點餐: $${bonusCalculation.pandaRevenue.toLocaleString()} (實收: $${Math.round(bonusCalculation.pandaEffective).toLocaleString()})\\n• UBER外送: $${bonusCalculation.uberRevenue.toLocaleString()} (實收: $${Math.round(bonusCalculation.uberEffective).toLocaleString()})\\n\\n💰 獎金計算:\\n獎金類別: ${bonusType}\\n有效營收: $${Math.round(bonusCalculation.totalEffective).toLocaleString()}\\n獎金門檻: $${bonusCalculation.threshold.toLocaleString()}\\n獎金比例: ${(bonusCalculation.bonusRate * 100).toFixed(0)}%\\n${bonusCalculation.qualified ? `今日獎金：$${bonusCalculation.bonusAmount.toLocaleString()}` : `差距達標：$${Math.round(bonusCalculation.shortfall).toLocaleString()}`}`;
            
            await telegramService.sendBossNotification(
                '💰 營業額提交詳細報告',
                bossMessage
            );
            
        } catch (notifyError) {
            logger.error('發送營收通知失敗:', notifyError);
        }
        
        res.json({
            success: true,
            message: '營收記錄提交成功！',
            data: {
                recordId: revenueRecord.id,
                bonusCalculation: bonusCalculation,
                submittedAt: new Date().toISOString()
            }
        });
        
    } catch (error) {
        logger.error('營收記錄提交失敗:', error);
        res.status(500).json({
            success: false,
            message: '系統錯誤，請稍後再試'
        });
    }
});

// 2. 獲取營收記錄列表
router.get('/records', async (req, res) => {
    try {
        const { 
            employeeId, 
            storeName,
            startDate, 
            endDate, 
            bonusType,
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
        if (bonusType) where.bonusType = bonusType;
        
        // 日期範圍過濾
        if (startDate && endDate) {
            where.date = {
                [Op.between]: [startDate, endDate]
            };
        }
        
        const offset = (page - 1) * limit;
        
        const { rows: records, count: total } = await models.RevenueRecord.findAndCountAll({
            where,
            order: [['date', 'DESC'], ['createdAt', 'DESC']],
            offset,
            limit: parseInt(limit)
        });
        
        res.json({
            success: true,
            data: {
                records,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
        
    } catch (error) {
        logger.error('獲取營收記錄失敗:', error);
        res.status(500).json({
            success: false,
            message: '系統錯誤'
        });
    }
});

// 3. 獲取分店營收記錄 (各分店最近3筆 - 系統邏輯.txt line 210)
router.get('/stores-summary', async (req, res) => {
    try {
        await initModels();
        const models = getModels();
        
        // 獲取所有分店
        const stores = await models.Store.findAll({
            attributes: ['name'],
            order: [['name', 'ASC']]
        });
        
        const storesSummary = [];
        
        for (const store of stores) {
            // 獲取每個分店最近3筆記錄
            const recentRecords = await models.RevenueRecord.findAll({
                where: {
                    storeName: store.name,
                    isDeleted: false
                },
                order: [['date', 'DESC'], ['createdAt', 'DESC']],
                limit: 3
            });
            
            // 計算分店統計
            const totalRecords = await models.RevenueRecord.count({
                where: { storeName: store.name, isDeleted: false }
            });
            
            const monthlyStats = await models.RevenueRecord.findAll({
                where: {
                    storeName: store.name,
                    date: {
                        [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                    },
                    isDeleted: false
                },
                attributes: [
                    [fn('SUM', col('totalIncome')), 'monthlyIncome'],
                    [fn('SUM', col('bonusAmount')), 'monthlyBonus'],
                    [fn('COUNT', col('id')), 'monthlyCount']
                ],
                raw: true
            });
            
            storesSummary.push({
                storeName: store.name,
                recentRecords: recentRecords,
                statistics: {
                    totalRecords: totalRecords,
                    monthlyIncome: parseFloat(monthlyStats[0]?.monthlyIncome) || 0,
                    monthlyBonus: parseFloat(monthlyStats[0]?.monthlyBonus) || 0,
                    monthlyCount: parseInt(monthlyStats[0]?.monthlyCount) || 0
                }
            });
        }
        
        res.json({
            success: true,
            data: {
                storesSummary,
                generatedAt: new Date().toISOString()
            }
        });
        
    } catch (error) {
        logger.error('獲取分店營收匯總失敗:', error);
        res.status(500).json({
            success: false,
            message: '系統錯誤'
        });
    }
});

// 4. 獎金計算器 (測試用)
router.post('/calculate-bonus', async (req, res) => {
    try {
        const { 
            cashRevenue, 
            pandaRevenue, 
            uberRevenue, 
            bonusType,
            date 
        } = req.body;
        
        let calculation;
        
        if (bonusType === 'auto') {
            calculation = BonusCalculationEngine.calculateSmartBonus(
                cashRevenue, pandaRevenue, uberRevenue, date ? new Date(date) : new Date()
            );
        } else if (bonusType === '平日獎金') {
            calculation = BonusCalculationEngine.calculateWeekdayBonus(
                cashRevenue, pandaRevenue, uberRevenue
            );
        } else if (bonusType === '假日獎金') {
            calculation = BonusCalculationEngine.calculateHolidayBonus(
                cashRevenue, pandaRevenue, uberRevenue
            );
        } else {
            return res.status(400).json({
                success: false,
                message: '獎金類別必須是 平日獎金、假日獎金 或 auto'
            });
        }
        
        res.json({
            success: true,
            data: calculation
        });
        
    } catch (error) {
        logger.error('獎金計算失敗:', error);
        res.status(500).json({
            success: false,
            message: '計算錯誤'
        });
    }
});

// 5. 作廢營收記錄
router.put('/void/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { reason, operatorId } = req.body;
        
        await initModels();
        const models = getModels();
        
        const record = await models.RevenueRecord.findByPk(id);
        if (!record) {
            return res.status(404).json({
                success: false,
                message: '營收記錄不存在'
            });
        }
        
        if (record.isDeleted) {
            return res.status(400).json({
                success: false,
                message: '記錄已被作廢'
            });
        }
        
        // 作廢記錄
        await record.update({
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: operatorId || 'system',
            deletedReason: reason || '管理員作廢'
        });
        
        logger.info('營收記錄作廢', {
            recordId: id,
            reason: reason,
            operatorId: operatorId
        });
        
        // 發送作廢通知
        try {
            const voidDate = new Date().toLocaleString('zh-TW');
            
            // 老闆通知
            await telegramService.sendBossNotification(
                '⚠️ 營收記錄作廢',
                `❌ ${record.date} ${record.storeName} 營收記錄作廢\\n作廢原因: ${reason || '管理員作廢'}\\n作廢時間: ${voidDate}\\n原獎金金額: $${record.bonusAmount.toLocaleString()}`
            );
            
            // 員工通知
            await telegramService.sendEmployeeNotification(
                '⚠️ 營收記錄作廢通知',
                `${record.date} ${record.storeName} 營收記錄已被作廢\\n原因: ${reason || '管理員作廢'}`
            );
            
        } catch (notifyError) {
            logger.error('發送作廢通知失敗:', notifyError);
        }
        
        res.json({
            success: true,
            message: '營收記錄已作廢'
        });
        
    } catch (error) {
        logger.error('作廢營收記錄失敗:', error);
        res.status(500).json({
            success: false,
            message: '系統錯誤'
        });
    }
});

// 相容性端點
router.get('/', async (req, res) => {
    try {
        await initModels();
        const models = getModels();
        
        const revenue = models.RevenueRecord ? await models.RevenueRecord.findAll({
            where: { isDeleted: false },
            limit: 50,
            order: [['date', 'DESC']]
        }) : [];
        
        res.json({
            success: true,
            data: {
                revenue: revenue || [],
                count: revenue?.length || 0,
                message: '營收管理系統運行正常'
            }
        });
        
    } catch (error) {
        logger.error('❌ 獲取營收記錄失敗:', error);
        res.json({
            success: true,
            data: {
                revenue: [],
                count: 0,
                message: '營收管理系統API端點正常運作'
            }
        });
    }
});

module.exports = router;