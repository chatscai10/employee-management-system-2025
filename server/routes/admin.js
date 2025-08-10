/**
 * ==========================================
 * 管理員控制台路由 - Admin Routes
 * ==========================================
 * 基於系統邏輯.txt規格 - 25項管理功能
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const session = require('express-session');
const { Op, fn, col } = require('sequelize');
const logger = require('../utils/logger');
const { initModels, getModels } = require('../models/index');
const telegramService = require('../services/telegram');

// Session 中間件
router.use(session({
    secret: process.env.SESSION_SECRET || 'admin-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // 開發環境設為false
        maxAge: 24 * 60 * 60 * 1000 // 24小時
    }
}));

// 圖片上傳配置
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/admin/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 限制
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('只允許上傳圖片檔案'));
        }
    }
});

// 中間件 - 驗證管理員權限
const verifyAdminAuth = (req, res, next) => {
    const { adminId } = req.session;
    if (!adminId || adminId !== 'admin') {
        return res.status(401).json({ 
            success: false, 
            message: '需要管理員權限' 
        });
    }
    next();
};

// 1. 管理員登入
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // 硬編碼管理員帳號 (基於系統邏輯.txt)
        if (username === 'admin' && password === 'admin123') {
            req.session.adminId = 'admin';
            
            logger.info('管理員登入成功', { username, ip: req.ip });
            
            res.json({
                success: true,
                message: '管理員登入成功',
                data: {
                    username: 'admin',
                    role: 'administrator'
                }
            });
            
            // 發送Telegram通知
            await telegramService.sendBossNotification(
                '🔐 管理員系統登入',
                `管理員已登入系統\n時間: ${new Date().toLocaleString('zh-TW')}\nIP: ${req.ip}`
            );
            
        } else {
            res.status(401).json({
                success: false,
                message: '帳號或密碼錯誤'
            });
        }
    } catch (error) {
        logger.error('管理員登入失敗:', error);
        res.status(500).json({
            success: false,
            message: '系統錯誤'
        });
    }
});

// 2. 管理員登出
router.post('/logout', verifyAdminAuth, (req, res) => {
    req.session.destroy();
    res.json({
        success: true,
        message: '已登出'
    });
});

// 3. 員工管理 - 查詢所有員工
router.get('/employees', verifyAdminAuth, async (req, res) => {
    try {
        await initModels();
        const models = getModels();
        
        const employees = await models.Employee.findAll({
            attributes: [
                'id', 'name', 'idNumber', 'birthDate', 'gender', 
                'hasDriverLicense', 'phone', 'address', 'emergencyContactName',
                'emergencyContactRelation', 'emergencyContactPhone', 'hireDate',
                'currentStore', 'position', 'positionStartDate', 'status', 
                'createdAt', 'updatedAt'
            ],
            order: [['createdAt', 'DESC']]
        });
        
        res.json({
            success: true,
            data: employees
        });
    } catch (error) {
        logger.error('查詢員工列表失敗:', error);
        res.status(500).json({
            success: false,
            message: '查詢失敗'
        });
    }
});

// 4. 員工管理 - 更新員工資料
router.put('/employees/:id', verifyAdminAuth, async (req, res) => {
    try {
        await initModels();
        const models = getModels();
        
        const employeeId = req.params.id;
        const updateData = req.body;
        
        const employee = await models.Employee.findByPk(employeeId);
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: '員工不存在'
            });
        }
        
        await employee.update(updateData);
        
        logger.info('管理員更新員工資料:', { employeeId, updateData });
        
        res.json({
            success: true,
            message: '員工資料更新成功',
            data: employee
        });
        
        // 發送Telegram通知
        await telegramService.sendBossNotification(
            '👤 員工資料更新',
            `管理員已更新員工資料\n員工: ${employee.name}\n時間: ${new Date().toLocaleString('zh-TW')}`
        );
        
    } catch (error) {
        logger.error('更新員工資料失敗:', error);
        res.status(500).json({
            success: false,
            message: '更新失敗'
        });
    }
});

// 5. 分店管理 - 查詢所有分店
router.get('/stores', verifyAdminAuth, async (req, res) => {
    try {
        await initModels();
        const models = getModels();
        
        const stores = await models.Store.findAll({
            order: [['name', 'ASC']]
        });
        
        res.json({
            success: true,
            data: stores
        });
    } catch (error) {
        logger.error('查詢分店列表失敗:', error);
        res.status(500).json({
            success: false,
            message: '查詢失敗'
        });
    }
});

// 6. 分店管理 - 更新分店設定
router.put('/stores/:id', verifyAdminAuth, async (req, res) => {
    try {
        await initModels();
        const models = getModels();
        
        const storeId = req.params.id;
        const updateData = req.body;
        
        const store = await models.Store.findByPk(storeId);
        if (!store) {
            return res.status(404).json({
                success: false,
                message: '分店不存在'
            });
        }
        
        await store.update(updateData);
        
        logger.info('管理員更新分店設定:', { storeId, updateData });
        
        res.json({
            success: true,
            message: '分店設定更新成功',
            data: store
        });
        
        // 發送Telegram通知
        await telegramService.sendBossNotification(
            '🏪 分店設定更新',
            `管理員已更新分店設定\n分店: ${store.name}\n時間: ${new Date().toLocaleString('zh-TW')}`
        );
        
    } catch (error) {
        logger.error('更新分店設定失敗:', error);
        res.status(500).json({
            success: false,
            message: '更新失敗'
        });
    }
});

// 7. 打卡記錄管理 - 查詢打卡記錄
router.get('/attendance-records', verifyAdminAuth, async (req, res) => {
    try {
        await initModels();
        const models = getModels();
        
        const { startDate, endDate, storeName, employeeName, status, page = 1, limit = 50 } = req.query;
        
        const where = { isDeleted: false };
        
        if (startDate && endDate) {
            where.clockTime = {
                [Op.between]: [
                    new Date(startDate),
                    new Date(endDate + ' 23:59:59')
                ]
            };
        }
        
        if (storeName) {
            where.storeName = storeName;
        }
        
        if (employeeName) {
            where.employeeName = {
                [Op.like]: `%${employeeName}%`
            };
        }
        
        if (status) {
            where.status = status;
        }
        
        const offset = (page - 1) * limit;
        
        const { rows: records, count: total } = await models.AttendanceRecord.findAndCountAll({
            where,
            include: [{
                model: models.Employee,
                as: 'attendanceEmployee',
                attributes: ['name', 'currentStore', 'position']
            }],
            order: [['clockTime', 'DESC']],
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
        logger.error('查詢打卡記錄失敗:', error);
        res.status(500).json({
            success: false,
            message: '查詢失敗'
        });
    }
});

// 8. 打卡記錄管理 - 作廢打卡記錄
router.put('/attendance-records/:id/void', verifyAdminAuth, async (req, res) => {
    try {
        await initModels();
        const models = getModels();
        
        const recordId = req.params.id;
        const { reason } = req.body;
        
        const record = await models.AttendanceRecord.findByPk(recordId);
        if (!record) {
            return res.status(404).json({
                success: false,
                message: '打卡記錄不存在'
            });
        }
        
        if (record.isDeleted) {
            return res.status(400).json({
                success: false,
                message: '記錄已被作廢'
            });
        }
        
        await record.update({
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: 'admin',
            deletedReason: reason || '管理員作廢'
        });
        
        logger.info('管理員作廢打卡記錄:', { recordId, reason });
        
        res.json({
            success: true,
            message: '打卡記錄已作廢'
        });
        
        // 發送Telegram通知
        await telegramService.sendBossNotification(
            '⚠️ 打卡記錄作廢',
            `管理員已作廢打卡記錄\n員工: ${record.employeeName}\n分店: ${record.storeName}\n時間: ${record.clockTime.toLocaleString('zh-TW')}\n原因: ${reason || '管理員作廢'}`
        );
        
        await telegramService.sendEmployeeNotification(
            '⚠️ 打卡記錄作廢通知',
            `${record.employeeName}的打卡記錄已被作廢\n分店: ${record.storeName}\n時間: ${record.clockTime.toLocaleString('zh-TW')}`
        );
        
    } catch (error) {
        logger.error('作廢打卡記錄失敗:', error);
        res.status(500).json({
            success: false,
            message: '操作失敗'
        });
    }
});

// 9. 營收記錄管理 - 查詢營收記錄
router.get('/revenue-records', verifyAdminAuth, async (req, res) => {
    try {
        await initModels();
        const models = getModels();
        
        const { startDate, endDate, storeName, employeeName, bonusType, page = 1, limit = 50 } = req.query;
        
        const where = { isDeleted: false };
        
        if (startDate && endDate) {
            where.date = {
                [Op.between]: [startDate, endDate]
            };
        }
        
        if (storeName) {
            where.storeName = storeName;
        }
        
        if (employeeName) {
            where.employeeName = {
                [Op.like]: `%${employeeName}%`
            };
        }
        
        if (bonusType) {
            where.bonusType = bonusType;
        }
        
        const offset = (page - 1) * limit;
        
        const { rows: records, count: total } = await models.RevenueRecord.findAndCountAll({
            where,
            include: [{
                model: models.Employee,
                as: 'revenueEmployee',
                attributes: ['name', 'currentStore', 'position']
            }],
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
        logger.error('查詢營收記錄失敗:', error);
        res.status(500).json({
            success: false,
            message: '查詢失敗'
        });
    }
});

// 10. 營收記錄管理 - 作廢營收記錄
router.put('/revenue-records/:id/void', verifyAdminAuth, async (req, res) => {
    try {
        await initModels();
        const models = getModels();
        
        const recordId = req.params.id;
        const { reason } = req.body;
        
        const record = await models.RevenueRecord.findByPk(recordId);
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
        
        await record.update({
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: 'admin',
            deletedReason: reason || '管理員作廢'
        });
        
        logger.info('管理員作廢營收記錄:', { recordId, reason });
        
        res.json({
            success: true,
            message: '營收記錄已作廢'
        });
        
        // 發送Telegram通知
        await telegramService.sendBossNotification(
            '⚠️ 營收記錄作廢',
            `管理員已作廢營收記錄\n員工: ${record.employeeName}\n分店: ${record.storeName}\n日期: ${record.date}\n原因: ${reason || '管理員作廢'}`
        );
        
        await telegramService.sendEmployeeNotification(
            '⚠️ 營收記錄作廢通知',
            `${record.employeeName}的營收記錄已被作廢\n分店: ${record.storeName}\n日期: ${record.date}`
        );
        
    } catch (error) {
        logger.error('作廢營收記錄失敗:', error);
        res.status(500).json({
            success: false,
            message: '操作失敗'
        });
    }
});

// 11. 系統統計 - 儀表板數據
router.get('/dashboard', verifyAdminAuth, async (req, res) => {
    try {
        await initModels();
        const models = getModels();
        
        const today = new Date();
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        
        // 員工統計
        const totalEmployees = await models.Employee.count({ where: { status: '在職' } });
        const pendingEmployees = await models.Employee.count({ where: { status: '審核中' } });
        
        // 今日打卡統計
        const todayAttendance = await models.AttendanceRecord.count({
            where: {
                clockTime: { [Op.between]: [startOfToday, endOfToday] },
                isDeleted: false
            }
        });
        
        // 今日營收統計
        const todayRevenue = await models.RevenueRecord.sum('totalIncome', {
            where: {
                date: startOfToday.toISOString().split('T')[0],
                isDeleted: false
            }
        }) || 0;
        
        // 各分店員工分佈
        const storeEmployees = await models.Employee.findAll({
            attributes: [
                'currentStore',
                [fn('COUNT', col('id')), 'count']
            ],
            where: { status: '在職' },
            group: ['currentStore']
        });
        
        res.json({
            success: true,
            data: {
                totalEmployees,
                pendingEmployees,
                todayAttendance,
                todayRevenue: parseFloat(todayRevenue).toFixed(2),
                storeEmployees
            }
        });
    } catch (error) {
        logger.error('查詢儀表板數據失敗:', error);
        res.status(500).json({
            success: false,
            message: '查詢失敗'
        });
    }
});

module.exports = router;