const express = require('express');
const { initModels } = require('../../models');
const logger = require('../../utils/logger');
const responseHelper = require('../../utils/responseHelper');
const notificationService = require('../../services/notificationService');
const { authMiddleware, adminMiddleware } = require('../../middleware/auth');

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
 * 獲取所有員工列表
 */
router.get('/employees', async (req, res) => {
    try {
        await initializeModels();
        
        const { page = 1, limit = 20, status, position, storeId } = req.query;
        const offset = (page - 1) * limit;
        
        // 建立查詢條件
        const where = {};
        if (status) where.status = status;
        if (position) where.position = position;
        if (storeId) where.storeId = parseInt(storeId);
        
        const { rows: employees, count } = await models.Employee.findAndCountAll({
            where,
            include: [{
                model: models.Store,
                attributes: ['name', 'address']
            }],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        
        responseHelper.success(res, {
            employees,
            pagination: {
                current: parseInt(page),
                total: Math.ceil(count / limit),
                count,
                limit: parseInt(limit)
            }
        }, '獲取員工列表成功');
        
    } catch (error) {
        logger.error('❌ 獲取員工列表失敗:', error);
        responseHelper.error(res, '獲取員工列表失敗', 500);
    }
});

/**
 * 獲取單一員工資料
 */
router.get('/employees/:id', async (req, res) => {
    try {
        await initializeModels();
        const { id } = req.params;
        
        const employee = await models.Employee.findByPk(id, {
            include: [{
                model: models.Store,
                attributes: ['name', 'address', 'latitude', 'longitude']
            }]
        });
        
        if (!employee) {
            return responseHelper.error(res, '員工不存在', 404);
        }
        
        responseHelper.success(res, employee, '獲取員工資料成功');
        
    } catch (error) {
        logger.error('❌ 獲取員工資料失敗:', error);
        responseHelper.error(res, '獲取員工資料失敗', 500);
    }
});

/**
 * 更新員工資料
 */
router.put('/employees/:id', async (req, res) => {
    try {
        await initializeModels();
        const { id } = req.params;
        const updateData = req.body;
        
        const employee = await models.Employee.findByPk(id);
        if (!employee) {
            return responseHelper.error(res, '員工不存在', 404);
        }
        
        // 如果更新身分證號碼，檢查重複
        if (updateData.idNumber && updateData.idNumber !== employee.idNumber) {
            const existing = await models.Employee.findOne({
                where: { idNumber: updateData.idNumber }
            });
            if (existing) {
                return responseHelper.error(res, '身分證號碼已存在', 400);
            }
        }
        
        await employee.update(updateData);
        
        // 重新獲取更新後的資料
        const updatedEmployee = await models.Employee.findByPk(id, {
            include: [{
                model: models.Store,
                attributes: ['name', 'address']
            }]
        });
        
        logger.info(`✏️ 員工資料更新: ${employee.name} (ID: ${id})`);
        
        responseHelper.success(res, updatedEmployee, '員工資料更新成功');
        
    } catch (error) {
        logger.error('❌ 更新員工資料失敗:', error);
        responseHelper.error(res, '更新員工資料失敗', 500);
    }
});

/**
 * 刪除員工
 */
router.delete('/employees/:id', async (req, res) => {
    try {
        await initializeModels();
        const { id } = req.params;
        
        const employee = await models.Employee.findByPk(id);
        if (!employee) {
            return responseHelper.error(res, '員工不存在', 404);
        }
        
        // 軟刪除：更新狀態為離職
        await employee.update({ status: '離職' });
        
        logger.info(`🗑️ 員工設為離職: ${employee.name} (ID: ${id})`);
        
        responseHelper.success(res, null, '員工已設為離職狀態');
        
    } catch (error) {
        logger.error('❌ 刪除員工失敗:', error);
        responseHelper.error(res, '刪除員工失敗', 500);
    }
});

/**
 * 審核員工註冊
 */
router.patch('/employees/:id/approve', async (req, res) => {
    try {
        await initializeModels();
        const { id } = req.params;
        const { approved, position = '實習生', storeId = 1 } = req.body;
        
        const employee = await models.Employee.findByPk(id);
        if (!employee) {
            return responseHelper.error(res, '員工不存在', 404);
        }
        
        if (employee.status !== '審核中') {
            return responseHelper.error(res, '員工狀態不是審核中', 400);
        }
        
        if (approved) {
            await employee.update({
                status: '在職',
                position: position,
                storeId: parseInt(storeId)
            });
            
            // 發送審核通過通知
            await notificationService.sendSystemNotification(
                '✅ 員工審核通過',
                `員工 ${employee.name} 已審核通過\n職位: ${position}\n分店ID: ${storeId}`
            );
            
            logger.info(`✅ 員工審核通過: ${employee.name}`);
            responseHelper.success(res, null, '員工審核通過');
        } else {
            await employee.update({ status: '離職' });
            
            logger.info(`❌ 員工審核拒絕: ${employee.name}`);
            responseHelper.success(res, null, '員工審核已拒絕');
        }
        
    } catch (error) {
        logger.error('❌ 審核員工失敗:', error);
        responseHelper.error(res, '審核員工失敗', 500);
    }
});

/**
 * 獲取分店列表
 */
router.get('/stores', async (req, res) => {
    try {
        await initializeModels();
        
        const stores = await models.Store.findAll({
            include: [{
                model: models.Employee,
                attributes: ['id', 'name', 'position', 'status']
            }]
        });
        
        responseHelper.success(res, stores, '獲取分店列表成功');
        
    } catch (error) {
        logger.error('❌ 獲取分店列表失敗:', error);
        responseHelper.error(res, '獲取分店列表失敗', 500);
    }
});

/**
 * 獲取系統統計
 */
router.get('/stats', async (req, res) => {
    try {
        await initializeModels();
        
        const totalEmployees = await models.Employee.count();
        const activeEmployees = await models.Employee.count({ where: { status: '在職' } });
        const pendingEmployees = await models.Employee.count({ where: { status: '審核中' } });
        const totalStores = await models.Store.count();
        
        // 按分店統計員工數量
        const storeStats = await models.Store.findAll({
            include: [{
                model: models.Employee,
                attributes: ['id', 'status'],
                where: { status: '在職' },
                required: false
            }],
            attributes: ['id', 'name']
        });
        
        const storeEmployeeCounts = storeStats.map(store => ({
            storeId: store.id,
            storeName: store.name,
            employeeCount: store.Employees ? store.Employees.length : 0
        }));
        
        responseHelper.success(res, {
            totalEmployees,
            activeEmployees,
            pendingEmployees,
            totalStores,
            storeEmployeeCounts
        }, '獲取系統統計成功');
        
    } catch (error) {
        logger.error('❌ 獲取系統統計失敗:', error);
        responseHelper.error(res, '獲取系統統計失敗', 500);
    }
});

router.get('/test', (req, res) => {
    res.json({ success: true, message: '管理員路由測試成功', timestamp: new Date().toISOString() });
});


// 管理員分店管理端點
router.get('/stores', async (req, res) => {
    try {
        const result = await getStoresController(req, res);
        res.json({
            success: true,
            data: result,
            message: '操作成功'
        });
    } catch (error) {
        console.error('管理員分店管理端點錯誤:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: '服務器內部錯誤'
        });
    }
});

module.exports = router;