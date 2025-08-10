/**
 * ==========================================
 * 員工認證系統路由 - Employee Auth Routes  
 * ==========================================
 * 基於系統邏輯.txt規格 - 姓名+身分證驗證
 */

const express = require('express');
const router = express.Router();
const session = require('express-session');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { initModels, getModels } = require('../models/index');
const telegramService = require('../services/telegram');

// Session 中間件
router.use(session({
    secret: process.env.SESSION_SECRET || 'employee-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // 開發環境設為false
        maxAge: 24 * 60 * 60 * 1000 // 24小時
    }
}));

// 驗證員工認證狀態中間件
const verifyEmployeeAuth = (req, res, next) => {
    const { employeeId } = req.session;
    if (!employeeId) {
        return res.status(401).json({ 
            success: false, 
            message: '請先登入系統',
            code: 'UNAUTHORIZED'
        });
    }
    next();
};

// 1. 員工登入 (姓名+身分證驗證)
router.post('/login', async (req, res) => {
    try {
        const { name, idNumber } = req.body;
        
        // 驗證必填欄位
        if (!name || !idNumber) {
            return res.status(400).json({
                success: false,
                message: '請輸入姓名和身分證字號',
                code: 'MISSING_FIELDS'
            });
        }

        await initModels();
        const models = getModels();
        
        // 查找員工 (基於系統邏輯.txt規格)
        const employee = await models.Employee.findOne({
            where: {
                name: name.trim(),
                idNumber: idNumber.trim(),
                status: '在職'
            }
        });

        if (!employee) {
            logger.warn('員工登入失敗 - 找不到員工', { name, idNumber: idNumber.substring(0, 3) + '****' });
            return res.status(401).json({
                success: false,
                message: '姓名或身分證字號錯誤，或帳號未審核通過',
                code: 'INVALID_CREDENTIALS'
            });
        }

        // 設定session
        req.session.employeeId = employee.id;
        req.session.employeeName = employee.name;
        req.session.employeeStore = employee.currentStore;
        req.session.employeePosition = employee.position;

        // 生成JWT Token (可選)
        const token = jwt.sign(
            { 
                employeeId: employee.id,
                name: employee.name,
                store: employee.currentStore,
                position: employee.position
            },
            process.env.JWT_SECRET || 'employee-jwt-secret',
            { expiresIn: '24h' }
        );

        logger.info('員工登入成功', { 
            employeeId: employee.id,
            name: employee.name,
            store: employee.currentStore,
            ip: req.ip 
        });

        res.json({
            success: true,
            message: '登入成功！',
            data: {
                employee: {
                    id: employee.id,
                    name: employee.name,
                    currentStore: employee.currentStore,
                    position: employee.position,
                    hireDate: employee.hireDate
                },
                token: token
            }
        });

        // 發送Telegram登入通知
        try {
            await telegramService.sendEmployeeNotification(
                '👤 員工登入通知',
                `${employee.name} 已登入系統\n分店: ${employee.currentStore}\n時間: ${new Date().toLocaleString('zh-TW')}`
            );
        } catch (notifyError) {
            logger.error('發送登入通知失敗:', notifyError);
        }

    } catch (error) {
        logger.error('員工登入系統錯誤:', error);
        res.status(500).json({
            success: false,
            message: '系統錯誤，請稍後再試',
            code: 'SERVER_ERROR'
        });
    }
});

// 2. 員工註冊 (基於系統邏輯.txt的11個必填欄位)
router.post('/register', async (req, res) => {
    try {
        const {
            name,
            idNumber,
            birthDate,
            gender,
            hasDriverLicense,
            phone,
            address,
            emergencyContactName,
            emergencyContactRelation,
            emergencyContactPhone,
            hireDate
        } = req.body;

        // 驗證必填欄位 (系統邏輯.txt規格)
        const requiredFields = [
            'name', 'idNumber', 'birthDate', 'gender', 'hasDriverLicense',
            'phone', 'address', 'emergencyContactName', 'emergencyContactRelation',
            'emergencyContactPhone', 'hireDate'
        ];

        const missingFields = requiredFields.filter(field => !req.body[field] && req.body[field] !== false);
        
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `請填寫所有必填欄位: ${missingFields.join(', ')}`,
                code: 'MISSING_REQUIRED_FIELDS',
                missingFields
            });
        }

        await initModels();
        const models = getModels();

        // 檢查是否已存在
        const existingEmployee = await models.Employee.findOne({
            where: {
                [Op.or]: [
                    { name: name.trim() },
                    { idNumber: idNumber.trim() }
                ]
            }
        });

        if (existingEmployee) {
            return res.status(409).json({
                success: false,
                message: '員工姓名或身分證字號已存在',
                code: 'EMPLOYEE_EXISTS'
            });
        }

        // 建立新員工 (預設狀態為審核中)
        const newEmployee = await models.Employee.create({
            name: name.trim(),
            idNumber: idNumber.trim(),
            birthDate,
            gender,
            hasDriverLicense: hasDriverLicense === true || hasDriverLicense === 'true',
            phone: phone.trim(),
            address: address.trim(),
            emergencyContactName: emergencyContactName.trim(),
            emergencyContactRelation: emergencyContactRelation.trim(),
            emergencyContactPhone: emergencyContactPhone.trim(),
            hireDate,
            currentStore: '內壢忠孝店', // 預設分店
            position: '實習生', // 預設職位
            positionStartDate: hireDate,
            status: '審核中'
        });

        logger.info('新員工註冊成功', { 
            employeeId: newEmployee.id,
            name: newEmployee.name,
            store: newEmployee.currentStore
        });

        res.status(201).json({
            success: true,
            message: '註冊成功！請等待審核通過後即可登入',
            data: {
                employeeId: newEmployee.id,
                name: newEmployee.name,
                status: newEmployee.status
            }
        });

        // 發送新員工註冊Telegram通知 (基於通知模板.txt)
        try {
            await telegramService.sendEmployeeRegistrationNotification(newEmployee);
        } catch (notifyError) {
            logger.error('發送註冊通知失敗:', notifyError);
        }

    } catch (error) {
        logger.error('員工註冊系統錯誤:', error);
        res.status(500).json({
            success: false,
            message: '系統錯誤，請稍後再試',
            code: 'SERVER_ERROR'
        });
    }
});

// 3. 員工登出
router.post('/logout', verifyEmployeeAuth, (req, res) => {
    const employeeName = req.session.employeeName;
    
    req.session.destroy((err) => {
        if (err) {
            logger.error('員工登出錯誤:', err);
            return res.status(500).json({
                success: false,
                message: '登出失敗'
            });
        }

        logger.info('員工登出成功', { employeeName });
        
        res.json({
            success: true,
            message: '已登出'
        });
    });
});

// 4. 檢查登入狀態
router.get('/verify', (req, res) => {
    const { employeeId, employeeName, employeeStore, employeePosition } = req.session;
    
    if (employeeId) {
        res.json({
            success: true,
            data: {
                isAuthenticated: true,
                employee: {
                    id: employeeId,
                    name: employeeName,
                    currentStore: employeeStore,
                    position: employeePosition
                }
            }
        });
    } else {
        res.json({
            success: true,
            data: {
                isAuthenticated: false
            }
        });
    }
});

// 5. 獲取員工個人資料
router.get('/profile', verifyEmployeeAuth, async (req, res) => {
    try {
        await initModels();
        const models = getModels();
        
        const employee = await models.Employee.findByPk(req.session.employeeId, {
            attributes: [
                'id', 'name', 'idNumber', 'birthDate', 'gender',
                'hasDriverLicense', 'phone', 'address', 'emergencyContactName',
                'emergencyContactRelation', 'emergencyContactPhone', 'hireDate',
                'currentStore', 'position', 'positionStartDate', 'status',
                'createdAt', 'updatedAt'
            ]
        });

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: '員工資料不存在'
            });
        }

        res.json({
            success: true,
            data: employee
        });

    } catch (error) {
        logger.error('獲取員工資料錯誤:', error);
        res.status(500).json({
            success: false,
            message: '系統錯誤'
        });
    }
});

// 6. 更新員工個人資料
router.put('/profile', verifyEmployeeAuth, async (req, res) => {
    try {
        await initModels();
        const models = getModels();
        
        const employee = await models.Employee.findByPk(req.session.employeeId);
        
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: '員工資料不存在'
            });
        }

        // 只允許更新特定欄位 (安全考量)
        const allowedFields = [
            'phone', 'address', 'emergencyContactName',
            'emergencyContactRelation', 'emergencyContactPhone'
        ];

        const updateData = {};
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: '沒有可更新的欄位'
            });
        }

        await employee.update(updateData);

        logger.info('員工更新個人資料', { 
            employeeId: employee.id,
            name: employee.name,
            updatedFields: Object.keys(updateData)
        });

        res.json({
            success: true,
            message: '個人資料更新成功',
            data: employee
        });

    } catch (error) {
        logger.error('更新員工資料錯誤:', error);
        res.status(500).json({
            success: false,
            message: '系統錯誤'
        });
    }
});

// 7. 密碼重設 (使用身分證後4碼驗證)
router.post('/reset-password', async (req, res) => {
    try {
        const { name, idNumberLast4, newIdNumber } = req.body;

        if (!name || !idNumberLast4 || !newIdNumber) {
            return res.status(400).json({
                success: false,
                message: '請填寫所有必填欄位'
            });
        }

        await initModels();
        const models = getModels();

        const employee = await models.Employee.findOne({
            where: {
                name: name.trim(),
                status: '在職'
            }
        });

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: '找不到該員工'
            });
        }

        // 驗證身分證後4碼
        const actualLast4 = employee.idNumber.slice(-4);
        if (idNumberLast4 !== actualLast4) {
            return res.status(401).json({
                success: false,
                message: '身分證後4碼驗證失敗'
            });
        }

        // 更新身分證字號 (作為新密碼)
        await employee.update({
            idNumber: newIdNumber.trim()
        });

        logger.info('員工重設密碼成功', { 
            employeeId: employee.id,
            name: employee.name
        });

        res.json({
            success: true,
            message: '密碼重設成功！請使用新的身分證字號登入'
        });

        // 發送密碼重設通知
        try {
            await telegramService.sendEmployeeNotification(
                '🔑 密碼重設通知',
                `${employee.name} 已重設登入密碼\n時間: ${new Date().toLocaleString('zh-TW')}`
            );
        } catch (notifyError) {
            logger.error('發送密碼重設通知失敗:', notifyError);
        }

    } catch (error) {
        logger.error('密碼重設錯誤:', error);
        res.status(500).json({
            success: false,
            message: '系統錯誤'
        });
    }
});

module.exports = router;