/**
 * 認證相關路由
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { initModels } = require('../../models');
const logger = require('../../utils/logger');
const responseHelper = require('../../utils/responseHelper');
const notificationService = require('../../services/notificationService');

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
 * 用戶登入 (使用姓名+身分證)
 */
router.post('/login', async (req, res) => {
    try {
        await initializeModels();
        const { name, idNumber } = req.body;

        // 輸入驗證
        if (!name || !idNumber) {
            return responseHelper.error(res, '請輸入姓名和身分證號碼', 400);
        }

        // 查找員工
        const employee = await models.Employee.findOne({
            where: { name, idNumber },
            include: [{
                model: models.Store,
                attributes: ['name', 'address']
            }]
        });

        if (!employee) {
            return responseHelper.error(res, '員工資料不存在或身分證號碼錯誤', 401);
        }

        if (employee.status !== '在職') {
            return responseHelper.error(res, '員工狀態異常，無法登入', 403);
        }

        // 生成 JWT
        const token = jwt.sign(
            { 
                id: employee.id,
                name: employee.name,
                position: employee.position,
                storeId: employee.storeId
            },
            process.env.JWT_SECRET || 'default-secret',
            { expiresIn: '7d' }
        );

        // 記錄登入日誌
        logger.info(`👤 員工登入: ${employee.name} (${employee.position})`);

        responseHelper.success(res, {
            token,
            user: {
                id: employee.id,
                name: employee.name,
                position: employee.position,
                storeId: employee.storeId,
                store: employee.Store
            }
        }, '登入成功');

    } catch (error) {
        logger.error('❌ 登入失敗:', error);
        responseHelper.error(res, '登入失敗，請稍後再試', 500);
    }
});

/**
 * 新員工註冊
 */
router.post('/register', async (req, res) => {
    try {
        await initializeModels();
        
        const {
            name, idNumber, birthday, gender, hasLicense,
            phone, address, emergencyContact, relationship,
            emergencyPhone, startDate
        } = req.body;

        // 輸入驗證
        const requiredFields = {
            name, idNumber, birthday, gender,
            phone, address, emergencyContact, relationship,
            emergencyPhone, startDate
        };

        for (const [field, value] of Object.entries(requiredFields)) {
            if (!value) {
                return responseHelper.error(res, `${field} 為必填欄位`, 400);
            }
        }

        // 檢查是否已存在
        const existingEmployee = await models.Employee.findOne({
            where: { idNumber }
        });

        if (existingEmployee) {
            return responseHelper.error(res, '此身分證號碼已註冊', 400);
        }

        // 創建新員工 (預設分配到內壢忠孝店)
        const employee = await models.Employee.create({
            name,
            idNumber,
            birthday,
            gender,
            hasLicense: hasLicense || false,
            phone,
            address,
            emergencyContact,
            relationship,
            emergencyPhone,
            startDate,
            storeId: 1, // 預設內壢忠孝店
            position: '實習生',
            status: '審核中'
        });

        // 發送通知
        await notificationService.sendNewEmployeeNotification(employee);

        logger.info(`🆕 新員工註冊: ${employee.name}`);

        responseHelper.success(res, {
            id: employee.id,
            message: '註冊成功，等待管理員審核'
        }, '註冊成功');

    } catch (error) {
        logger.error('❌ 註冊失敗:', error);
        responseHelper.error(res, '註冊失敗，請稍後再試', 500);
    }
});

/**
 * 驗證Token
 */
router.post('/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return responseHelper.error(res, 'Token不存在', 401);
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
        
        await initializeModels();
        const employee = await models.Employee.findByPk(decoded.id, {
            include: [{
                model: models.Store,
                attributes: ['name', 'address']
            }]
        });

        if (!employee || employee.status !== '在職') {
            return responseHelper.error(res, 'Token無效', 401);
        }

        responseHelper.success(res, {
            user: {
                id: employee.id,
                name: employee.name,
                position: employee.position,
                storeId: employee.storeId,
                store: employee.Store
            }
        }, 'Token有效');

    } catch (error) {
        logger.error('❌ Token驗證失敗:', error);
        responseHelper.error(res, 'Token無效', 401);
    }
});

/**
 * 獲取員工資料
 */
router.get('/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return responseHelper.error(res, '請先登入', 401);
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
        
        await initializeModels();
        const employee = await models.Employee.findByPk(decoded.id, {
            include: [{
                model: models.Store,
                attributes: ['name', 'address', 'latitude', 'longitude', 'radius']
            }]
        });

        if (!employee) {
            return responseHelper.error(res, '員工不存在', 404);
        }

        responseHelper.success(res, {
            id: employee.id,
            name: employee.name,
            position: employee.position,
            phone: employee.phone,
            storeId: employee.storeId,
            store: employee.Store,
            status: employee.status
        }, '獲取成功');

    } catch (error) {
        logger.error('❌ 獲取員工資料失敗:', error);
        responseHelper.error(res, '獲取失敗', 500);
    }
});

// 測試路由
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: '認證路由測試成功',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;