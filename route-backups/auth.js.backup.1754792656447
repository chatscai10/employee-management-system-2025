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
 * 用戶登入 (支援多種登入方式)
 */
router.post('/login', async (req, res) => {
    try {
        await initializeModels();
        const { employeeId, password, name, idNumber } = req.body;

        let whereClause = {};
        let authMethod = '';

        // 支援 employeeId + password 登入方式
        if (employeeId && password) {
            whereClause = { employeeId };
            authMethod = 'employeeId';
        }
        // 支援 name + idNumber 登入方式 (舊版本)
        else if (name && idNumber) {
            whereClause = { name, idNumber };
            authMethod = 'nameId';
        }
        else {
            return responseHelper.error(res, '請提供有效的登入憑證', 'INVALID_CREDENTIALS', 400);
        }

        // 查找員工
        const employee = await models.Employee.findOne({
            where: whereClause,
            include: [{
                model: models.Store,
                attributes: ['name', 'address']
            }]
        });

        if (!employee) {
            return responseHelper.error(res, '員工資料不存在或登入憑證錯誤', 'LOGIN_FAILED', 401);
        }

        if (employee.status !== '在職') {
            return responseHelper.error(res, '員工狀態異常，無法登入', 'INACTIVE_EMPLOYEE', 403);
        }

        // 如果使用密碼登入，需要驗證密碼
        if (authMethod === 'employeeId' && password) {
            if (!employee.password) {
                return responseHelper.error(res, '此員工尚未設定密碼', 'PASSWORD_NOT_SET', 401);
            }

            const isValidPassword = await bcrypt.compare(password, employee.password);
            if (!isValidPassword) {
                return responseHelper.error(res, '密碼錯誤', 'INVALID_PASSWORD', 401);
            }
        }

        // 生成 JWT
        const token = jwt.sign(
            { 
                id: employee.id,
                employeeId: employee.employeeId,
                name: employee.name,
                position: employee.position,
                storeId: employee.storeId,
                role: employee.position
            },
            process.env.JWT_SECRET || 'default-secret',
            { expiresIn: '7d' }
        );

        // 記錄登入日誌
        logger.info(`👤 員工登入: ${employee.name} (${employee.position}) - ${authMethod}`);

        responseHelper.success(res, {
            token,
            employee: {
                id: employee.id,
                employeeId: employee.employeeId,
                name: employee.name,
                position: employee.position,
                storeId: employee.storeId,
                store: employee.Store
            }
        }, '登入成功');

    } catch (error) {
        logger.error('❌ 登入失敗:', error);
        responseHelper.error(res, '登入失敗，請稍後再試', 'LOGIN_ERROR', 500);
    }
});

/**
 * 新員工註冊
 */
router.post('/register', async (req, res) => {
    try {
        await initializeModels();
        
        const {
            employeeId, name, email, password, role, storeId,
            idNumber, birthday, gender, hasLicense,
            phone, address, emergencyContact, relationship,
            emergencyPhone, startDate
        } = req.body;

        // 輸入驗證
        const requiredFields = {
            employeeId: '員工編號',
            name: '姓名',
            password: '密碼'
        };
        
        for (const [field, label] of Object.entries(requiredFields)) {
            if (!req.body[field]) {
                return responseHelper.error(res, `請輸入${label}`, 'MISSING_FIELD', 400);
            }
        }

        // 檢查員工編號是否已存在
        const existingEmployee = await models.Employee.findOne({
            where: { employeeId }
        });

        if (existingEmployee) {
            return responseHelper.error(res, '員工編號已存在', 'EMPLOYEE_ID_EXISTS', 400);
        }

        // 檢查email是否已存在
        if (email) {
            const existingEmail = await models.Employee.findOne({
                where: { email }
            });

            if (existingEmail) {
                return responseHelper.error(res, '電子信箱已被使用', 'EMAIL_EXISTS', 400);
            }
        }

        // 加密密碼
        const hashedPassword = await bcrypt.hash(password, 10);

        // 確保至少有一個Store存在
        let targetStoreId = storeId || 1;
        const storeCount = await models.Store.count();
        if (storeCount === 0) {
            // 創建預設Store
            const defaultStore = await models.Store.create({
                name: '預設分店',
                minPeople: 2,
                openTime: '1500-0200',
                latitude: 24.9748412,
                longitude: 121.2556713,
                radius: 100,
                address: '預設地址'
            });
            targetStoreId = defaultStore.id;
        }

        // 創建員工記錄
        const employee = await models.Employee.create({
            employeeId,
            name,
            email: email || null,
            password: hashedPassword,
            position: role || '員工',
            storeId: targetStoreId,
            status: '在職',
            idNumber: idNumber || null,
            birthday: birthday || null,
            gender: gender || null,
            hasLicense: hasLicense || false,
            phone: phone || null,
            address: address || null,
            emergencyContact: emergencyContact || null,
            relationship: relationship || null,
            emergencyPhone: emergencyPhone || null,
            startDate: startDate || new Date()
        });

        logger.info(`👤 新員工註冊: ${employee.name} (${employee.employeeId})`);

        responseHelper.success(res, {
            employee: {
                id: employee.id,
                employeeId: employee.employeeId,
                name: employee.name,
                email: employee.email,
                position: employee.position,
                storeId: employee.storeId,
                status: employee.status
            }
        }, '員工註冊成功');

    } catch (error) {
        logger.error('❌ 員工註冊失敗:', error);
        responseHelper.error(res, '員工註冊失敗，請稍後再試', 'REGISTER_ERROR', 500);
    }
});

/**
 * 舊版註冊 (保持向後相容)
 */
router.post('/register-old', async (req, res) => {
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


// 員工註冊端點
router.post('/register', async (req, res) => {
    try {
        const result = await registerController(req, res);
        res.json({
            success: true,
            data: result,
            message: '操作成功'
        });
    } catch (error) {
        console.error('員工註冊端點錯誤:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: '服務器內部錯誤'
        });
    }
});


// 員工登入端點
router.post('/login', async (req, res) => {
    try {
        const result = await loginController(req, res);
        res.json({
            success: true,
            data: result,
            message: '操作成功'
        });
    } catch (error) {
        console.error('員工登入端點錯誤:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: '服務器內部錯誤'
        });
    }
});


// Token驗證端點
router.get('/verify', async (req, res) => {
    try {
        const result = await verifyController(req, res);
        res.json({
            success: true,
            data: result,
            message: '操作成功'
        });
    } catch (error) {
        console.error('Token驗證端點錯誤:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: '服務器內部錯誤'
        });
    }
});

module.exports = router;