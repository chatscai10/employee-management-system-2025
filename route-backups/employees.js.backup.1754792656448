/**
 * 員工資料相關路由
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
 * 獲取員工個人資料
 */
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        await initializeModels();
        
        const employee = await models.Employee.findByPk(req.user.id, {
            include: [{
                model: models.Store,
                attributes: ['id', 'name', 'address']
            }],
            attributes: { exclude: ['password'] }
        });
        
        if (!employee) {
            return responseHelper.error(res, '無法找到員工資料', 'EMPLOYEE_NOT_FOUND', 404);
        }
        
        responseHelper.success(res, {
            employee: {
                id: employee.id,
                name: employee.name,
                position: employee.position,
                phone: employee.phone,
                email: employee.email,
                status: employee.status,
                storeId: employee.storeId,
                store: employee.Store,
                createdAt: employee.createdAt
            }
        }, '獲取員工資料成功');
        
    } catch (error) {
        logger.error('❌ 獲取員工資料失敗:', error);
        responseHelper.error(res, '獲取員工資料失敗', 'PROFILE_ERROR', 500);
    }
});

/**
 * 更新員工個人資料
 */
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        await initializeModels();
        
        const { phone, email, address, emergencyContact, emergencyPhone } = req.body;
        
        const employee = await models.Employee.findByPk(req.user.id);
        
        if (!employee) {
            return responseHelper.error(res, '無法找到員工資料', 'EMPLOYEE_NOT_FOUND', 404);
        }
        
        // 只允許更新特定欄位
        const updateData = {};
        if (phone !== undefined) updateData.phone = phone;
        if (email !== undefined) updateData.email = email;
        if (address !== undefined) updateData.address = address;
        if (emergencyContact !== undefined) updateData.emergencyContact = emergencyContact;
        if (emergencyPhone !== undefined) updateData.emergencyPhone = emergencyPhone;
        
        await employee.update(updateData);
        
        logger.info(`👤 員工更新資料: ${employee.name}`, updateData);
        
        responseHelper.success(res, {
            employee: {
                id: employee.id,
                name: employee.name,
                position: employee.position,
                phone: employee.phone,
                email: employee.email,
                address: employee.address,
                emergencyContact: employee.emergencyContact,
                emergencyPhone: employee.emergencyPhone
            }
        }, '更新員工資料成功');
        
    } catch (error) {
        logger.error('❌ 更新員工資料失敗:', error);
        responseHelper.error(res, '更新員工資料失敗', 'UPDATE_PROFILE_ERROR', 500);
    }
});

/**
 * 獲取員工列表 (管理員)
 */
router.get('/list', authMiddleware, async (req, res) => {
    try {
        await initializeModels();
        
        // 簡單權限檢查 (這裡應該有更完整的權限系統)
        if (req.user.position !== '店長' && req.user.position !== '經理') {
            return responseHelper.error(res, '權限不足', 'INSUFFICIENT_PERMISSION', 403);
        }
        
        const { page = 1, limit = 20, status, storeId } = req.query;
        const offset = (page - 1) * limit;
        
        const where = {};
        if (status) where.status = status;
        if (storeId) where.storeId = parseInt(storeId);
        
        const { rows: employees, count } = await models.Employee.findAndCountAll({
            where,
            include: [{
                model: models.Store,
                attributes: ['id', 'name']
            }],
            attributes: { exclude: ['password'] },
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
        responseHelper.error(res, '獲取員工列表失敗', 'LIST_ERROR', 500);
    }
});

/**
 * 獲取員工統計
 */
router.get('/statistics', authMiddleware, async (req, res) => {
    try {
        await initializeModels();
        
        // 簡單權限檢查
        if (req.user.position !== '店長' && req.user.position !== '經理') {
            return responseHelper.error(res, '權限不足', 'INSUFFICIENT_PERMISSION', 403);
        }
        
        const totalEmployees = await models.Employee.count();
        const activeEmployees = await models.Employee.count({ where: { status: '在職' } });
        const inactiveEmployees = await models.Employee.count({ where: { status: '離職' } });
        
        // 按職位統計
        const positionStats = await models.Employee.findAll({
            attributes: [
                'position',
                [models.sequelize.fn('COUNT', models.sequelize.col('*')), 'count']
            ],
            where: { status: '在職' },
            group: 'position'
        });
        
        responseHelper.success(res, {
            total: totalEmployees,
            active: activeEmployees,
            inactive: inactiveEmployees,
            byPosition: positionStats
        }, '獲取員工統計成功');
        
    } catch (error) {
        logger.error('❌ 獲取員工統計失敗:', error);
        responseHelper.error(res, '獲取員工統計失敗', 'STATISTICS_ERROR', 500);
    }
});

module.exports = router;