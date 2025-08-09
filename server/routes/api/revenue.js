/**
 * 營收管理路由
 */

const express = require('express');
const { initModels } = require('../../models');
const logger = require('../../utils/logger');
const responseHelper = require('../../utils/responseHelper');
const { authMiddleware } = require('../../middleware/auth');

const router = express.Router();
let models = null;

// 初始化模型
const initializeModels = async () => {
    if (!models) {
        models = await initModels();
    }
    return models;
};

/**
 * 獲取營收類型和設定
 */
router.get('/config', async (req, res) => {
    try {
        await initializeModels();
        
        const config = await models.SystemConfig.findOne({
            where: { configKey: 'income_types' }
        });
        
        const expenseConfig = await models.SystemConfig.findOne({
            where: { configKey: 'expense_types' }
        });
        
        responseHelper.success(res, {
            incomeTypes: config ? config.configValue : [],
            expenseTypes: expenseConfig ? expenseConfig.configValue : [],
            bonusRules: {
                weekdayThreshold: 13000,
                weekdayRate: 0.30,
                holidayThreshold: 0,
                holidayRate: 0.38
            }
        }, '獲取營收設定成功');
        
    } catch (error) {
        logger.error('❌ 獲取營收設定失敗:', error);
        responseHelper.error(res, '獲取營收設定失敗', 500);
    }
});

/**
 * 新增營收記錄
 */
router.post('/add', authMiddleware, async (req, res) => {
    try {
        await initializeModels();
        const { date, bonusType, income, expense, photos, notes } = req.body;
        
        if (!date || !bonusType || !income) {
            return responseHelper.error(res, '請提供日期、獎金類型和收入資料', 400);
        }
        
        // 計算總收入和總支出
        let totalIncome = 0;
        let totalExpense = 0;
        
        // 計算收入 (考慮服務費)
        if (income && Array.isArray(income)) {
            income.forEach(item => {
                const amount = parseFloat(item.amount) || 0;
                const serviceFee = parseFloat(item.serviceFee) || 0;
                const actualAmount = amount * (1 - serviceFee);
                totalIncome += actualAmount;
            });
        }
        
        // 計算支出
        if (expense && Array.isArray(expense)) {
            expense.forEach(item => {
                totalExpense += parseFloat(item.amount) || 0;
            });
        }
        
        const netIncome = totalIncome - totalExpense;
        
        // 計算獎金
        let bonusAmount = 0;
        if (bonusType === '平日獎金') {
            bonusAmount = netIncome > 13000 ? (netIncome - 13000) * 0.30 : 0;
        } else if (bonusType === '假日獎金') {
            bonusAmount = netIncome > 0 ? netIncome * 0.38 : 0;
        }
        
        // 創建營收記錄
        const revenue = await models.Revenue.create({
            employeeId: req.user.id,
            storeId: req.user.storeId,
            date: new Date(date),
            bonusType: bonusType,
            orderCount: income ? income.length : 0,
            income: income || [],
            expense: expense || [],
            totalIncome: totalIncome,
            totalExpense: totalExpense,
            netIncome: netIncome,
            bonusAmount: bonusAmount,
            photos: photos || [],
            notes: notes || null
        });
        
        logger.info(`💰 營收記錄新增: 員工ID ${req.user.id}, 金額 ${netIncome}`);
        
        responseHelper.success(res, {
            id: revenue.id,
            totalIncome: totalIncome,
            totalExpense: totalExpense,
            netIncome: netIncome,
            bonusAmount: bonusAmount,
            isTarget: bonusAmount > 0
        }, '營收記錄新增成功');
        
    } catch (error) {
        logger.error('❌ 新增營收記錄失敗:', error);
        responseHelper.error(res, '新增營收記錄失敗', 500);
    }
});

/**
 * 獲取營收記錄列表
 */
router.get('/records', authMiddleware, async (req, res) => {
    try {
        await initializeModels();
        
        const { page = 1, limit = 20, startDate, endDate, storeId } = req.query;
        const offset = (page - 1) * limit;
        
        const where = {};
        
        // 管理員可查看所有分店，員工只能查看自己的
        if (req.user.position.includes('管理') || req.user.position.includes('店長')) {
            if (storeId) where.storeId = parseInt(storeId);
        } else {
            where.employeeId = req.user.id;
        }
        
        if (startDate && endDate) {
            where.date = {
                [require('sequelize').Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }
        
        const { rows: records, count } = await models.Revenue.findAndCountAll({
            where,
            include: [
                {
                    model: models.Employee,
                    attributes: ['name', 'position']
                },
                {
                    model: models.Store,
                    attributes: ['name', 'address']
                }
            ],
            order: [['date', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        
        responseHelper.success(res, {
            records,
            pagination: {
                current: parseInt(page),
                total: Math.ceil(count / limit),
                count,
                limit: parseInt(limit)
            }
        }, '獲取營收記錄成功');
        
    } catch (error) {
        logger.error('❌ 獲取營收記錄失敗:', error);
        responseHelper.error(res, '獲取營收記錄失敗', 500);
    }
});

/**
 * 作廢營收記錄
 */
router.patch('/records/:id/cancel', authMiddleware, async (req, res) => {
    try {
        await initializeModels();
        const { id } = req.params;
        
        const revenue = await models.Revenue.findByPk(id);
        if (!revenue) {
            return responseHelper.error(res, '營收記錄不存在', 404);
        }
        
        // 檢查權限
        if (revenue.employeeId !== req.user.id && 
            !req.user.position.includes('管理') && 
            !req.user.position.includes('店長')) {
            return responseHelper.error(res, '權限不足', 403);
        }
        
        await revenue.update({ status: '已作廢' });
        
        logger.info(`🗑️ 營收記錄作廢: ID ${id}`);
        
        responseHelper.success(res, null, '營收記錄已作廢');
        
    } catch (error) {
        logger.error('❌ 作廢營收記錄失敗:', error);
        responseHelper.error(res, '作廢營收記錄失敗', 500);
    }
});

router.get('/test', (req, res) => {
    res.json({ success: true, message: '營收路由測試成功', timestamp: new Date().toISOString() });
});


// 營收統計端點
router.get('/summary', async (req, res) => {
    try {
        const result = await getSummaryController(req, res);
        res.json({
            success: true,
            data: result,
            message: '操作成功'
        });
    } catch (error) {
        console.error('營收統計端點錯誤:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: '服務器內部錯誤'
        });
    }
});

module.exports = router;