/**
 * 打卡相關路由
 */

const express = require('express');
const { initModels } = require('../../models');
const logger = require('../../utils/logger');
const responseHelper = require('../../utils/responseHelper');
const notificationService = require('../../services/notificationService');
const { authMiddleware } = require('../../middleware/auth');
const crypto = require('crypto');

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
 * 計算兩點間距離 (公尺)
 * @param {number} lat1 緯度1
 * @param {number} lon1 經度1  
 * @param {number} lat2 緯度2
 * @param {number} lon2 經度2
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // 地球半徑(公尺)
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // 距離(公尺)
}

/**
 * 生成設備指紋
 * @param {object} req Express請求物件
 */
function generateDeviceFingerprint(req) {
    const userAgent = req.get('User-Agent') || '';
    const acceptLanguage = req.get('Accept-Language') || '';
    const acceptEncoding = req.get('Accept-Encoding') || '';
    const ip = req.ip || req.connection.remoteAddress;
    
    const fingerprint = crypto
        .createHash('sha256')
        .update(`${userAgent}${acceptLanguage}${acceptEncoding}${ip}`)
        .digest('hex');
    
    return fingerprint.substring(0, 32);
}

/**
 * 檢查打卡時間是否在營業時間內
 * @param {Date} clockTime 打卡時間
 * @param {string} openTime 營業時間 (格式: "1500-0200")
 */
function isWithinBusinessHours(clockTime, openTime = '1500-0200') {
    const [openHour, closeHour] = openTime.split('-').map(t => {
        const hour = parseInt(t.substring(0, 2));
        const minute = parseInt(t.substring(2));
        return hour + minute / 60;
    });
    
    const currentHour = clockTime.getHours() + clockTime.getMinutes() / 60;
    
    // 跨日營業 (如15:00-02:00)
    if (closeHour < openHour) {
        return currentHour >= openHour || currentHour <= closeHour;
    }
    // 同日營業
    return currentHour >= openHour && currentHour <= closeHour;
}

/**
 * 獲取員工所屬分店資訊
 */
router.get('/store-info', authMiddleware, async (req, res) => {
    try {
        await initializeModels();
        
        const employee = await models.Employee.findByPk(req.user.id, {
            include: [{
                model: models.Store,
                attributes: ['id', 'name', 'address', 'latitude', 'longitude', 'radius', 'openTime']
            }]
        });
        
        if (!employee || !employee.Store) {
            return responseHelper.error(res, '無法找到員工分店資訊', 404);
        }
        
        responseHelper.success(res, {
            store: employee.Store,
            employee: {
                id: employee.id,
                name: employee.name,
                position: employee.position
            }
        }, '獲取分店資訊成功');
        
    } catch (error) {
        logger.error('❌ 獲取分店資訊失敗:', error);
        responseHelper.error(res, '獲取分店資訊失敗', 500);
    }
});

/**
 * 員工打卡
 */
router.post('/clock', authMiddleware, async (req, res) => {
    try {
        await initializeModels();
        const { latitude, longitude, clockType, notes } = req.body;
        
        // 輸入驗證
        if (!latitude || !longitude) {
            return responseHelper.error(res, '請提供GPS定位座標', 400);
        }
        
        if (!['上班', '下班'].includes(clockType)) {
            return responseHelper.error(res, '打卡類型必須是上班或下班', 400);
        }
        
        // 獲取員工和分店資訊
        const employee = await models.Employee.findByPk(req.user.id, {
            include: [{
                model: models.Store,
                attributes: ['id', 'name', 'address', 'latitude', 'longitude', 'radius', 'openTime']
            }]
        });
        
        if (!employee || !employee.Store) {
            return responseHelper.error(res, '無法找到員工分店資訊', 404);
        }
        
        const store = employee.Store;
        const clockTime = new Date();
        
        // 計算與分店的距離
        const distance = Math.round(calculateDistance(
            parseFloat(latitude),
            parseFloat(longitude),
            parseFloat(store.latitude),
            parseFloat(store.longitude)
        ));
        
        // 檢查是否在允許範圍內
        const isInRange = distance <= store.radius;
        
        // 檢查是否在營業時間內
        const isInBusinessHours = isWithinBusinessHours(clockTime, store.openTime);
        
        // 生成設備指紋
        const deviceFingerprint = generateDeviceFingerprint(req);
        
        // 檢查今日是否已有相同類型的打卡記錄
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const existingRecord = await models.Attendance.findOne({
            where: {
                employeeId: employee.id,
                clockType: clockType,
                clockTime: {
                    [require('sequelize').Op.between]: [today, tomorrow]
                }
            }
        });
        
        if (existingRecord) {
            return responseHelper.error(res, `今日已有${clockType}打卡記錄`, 400);
        }
        
        // 判斷打卡狀態
        let status = '正常';
        if (!isInRange) {
            status = '異常';
        } else if (!isInBusinessHours && clockType === '上班') {
            // 上班太早或太晚
            const currentHour = clockTime.getHours();
            if (currentHour < 12) {
                status = '正常'; // 早班可能較早到
            } else {
                status = '遲到';
            }
        }
        
        // 創建打卡記錄
        const attendance = await models.Attendance.create({
            employeeId: employee.id,
            storeId: store.id,
            clockTime: clockTime,
            clockType: clockType,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            distance: distance,
            deviceFingerprint: deviceFingerprint,
            status: status,
            notes: notes || null
        });
        
        // 發送打卡通知
        const notificationMessage = `${employee.name} ${clockType}打卡\n` +
                                   `時間: ${clockTime.toLocaleString('zh-TW')}\n` +
                                   `地點: ${store.name}\n` +
                                   `距離: ${distance}公尺\n` +
                                   `狀態: ${status}`;
        
        await notificationService.sendSystemNotification(
            `📍 ${clockType}打卡通知`,
            notificationMessage
        );
        
        logger.info(`📍 ${clockType}打卡: ${employee.name} - ${status}`, {
            distance: distance,
            status: status,
            storeId: store.id
        });
        
        responseHelper.success(res, {
            id: attendance.id,
            clockTime: attendance.clockTime,
            clockType: attendance.clockType,
            distance: distance,
            status: status,
            store: {
                name: store.name,
                address: store.address
            },
            isInRange: isInRange,
            isInBusinessHours: isInBusinessHours
        }, `${clockType}打卡成功`);
        
    } catch (error) {
        logger.error('❌ 打卡失敗:', error);
        responseHelper.error(res, '打卡失敗，請稍後再試', 500);
    }
});

/**
 * 獲取員工打卡記錄
 */
router.get('/records', authMiddleware, async (req, res) => {
    try {
        await initializeModels();
        
        const { page = 1, limit = 20, startDate, endDate, clockType } = req.query;
        const offset = (page - 1) * limit;
        
        // 建立查詢條件
        const where = { employeeId: req.user.id };
        
        if (startDate && endDate) {
            where.clockTime = {
                [require('sequelize').Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }
        
        if (clockType) {
            where.clockType = clockType;
        }
        
        const { rows: records, count } = await models.Attendance.findAndCountAll({
            where,
            include: [{
                model: models.Store,
                attributes: ['name', 'address']
            }],
            order: [['clockTime', 'DESC']],
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
        }, '獲取打卡記錄成功');
        
    } catch (error) {
        logger.error('❌ 獲取打卡記錄失敗:', error);
        responseHelper.error(res, '獲取打卡記錄失敗', 500);
    }
});

/**
 * 獲取今日打卡狀態
 */
router.get('/today-status', authMiddleware, async (req, res) => {
    try {
        await initializeModels();
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const todayRecords = await models.Attendance.findAll({
            where: {
                employeeId: req.user.id,
                clockTime: {
                    [require('sequelize').Op.between]: [today, tomorrow]
                }
            },
            include: [{
                model: models.Store,
                attributes: ['name']
            }],
            order: [['clockTime', 'ASC']]
        });
        
        const status = {
            hasClockedIn: todayRecords.some(r => r.clockType === '上班'),
            hasClockedOut: todayRecords.some(r => r.clockType === '下班'),
            records: todayRecords
        };
        
        responseHelper.success(res, status, '獲取今日打卡狀態成功');
        
    } catch (error) {
        logger.error('❌ 獲取今日打卡狀態失敗:', error);
        responseHelper.error(res, '獲取今日打卡狀態失敗', 500);
    }
});

/**
 * 管理員獲取所有員工打卡記錄
 */
router.get('/admin/records', async (req, res) => {
    try {
        await initializeModels();
        
        const { page = 1, limit = 50, storeId, employeeId, startDate, endDate, status } = req.query;
        const offset = (page - 1) * limit;
        
        const where = {};
        if (storeId) where.storeId = parseInt(storeId);
        if (employeeId) where.employeeId = parseInt(employeeId);
        if (status) where.status = status;
        
        if (startDate && endDate) {
            where.clockTime = {
                [require('sequelize').Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }
        
        const { rows: records, count } = await models.Attendance.findAndCountAll({
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
            order: [['clockTime', 'DESC']],
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
        }, '獲取打卡記錄成功');
        
    } catch (error) {
        logger.error('❌ 管理員獲取打卡記錄失敗:', error);
        responseHelper.error(res, '獲取打卡記錄失敗', 500);
    }
});

// 測試路由
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: '打卡路由測試成功',
        user: req.user || null,
        timestamp: new Date().toISOString()
    });
});


/**
 * 打卡上班端點
 */
router.post('/checkin', authMiddleware, async (req, res) => {
    try {
        await initializeModels();
        const { latitude, longitude, address, notes } = req.body;
        
        // 輸入驗證
        if (!latitude || !longitude) {
            return responseHelper.error(res, '請提供GPS定位座標', 'INVALID_GPS', 400);
        }
        
        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
            return responseHelper.error(res, 'GPS座標必須是數字', 'INVALID_GPS_FORMAT', 400);
        }
        
        // 獲取員工和分店資訊
        const employee = await models.Employee.findByPk(req.user.id, {
            include: [{
                model: models.Store,
                attributes: ['id', 'name', 'address', 'latitude', 'longitude', 'radius', 'openTime']
            }]
        });
        
        if (!employee || !employee.Store) {
            return responseHelper.error(res, '無法找到員工分店資訊', 'EMPLOYEE_NOT_FOUND', 404);
        }
        
        const store = employee.Store;
        const clockTime = new Date();
        
        // 計算與分店的距離
        const distance = Math.round(calculateDistance(
            parseFloat(latitude),
            parseFloat(longitude),
            parseFloat(store.latitude),
            parseFloat(store.longitude)
        ));
        
        // 檢查是否在允許範圍內
        const isInRange = distance <= store.radius;
        
        // 生成設備指紋
        const deviceFingerprint = generateDeviceFingerprint(req);
        
        // 檢查今日是否已有上班打卡記錄
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const existingRecord = await models.Attendance.findOne({
            where: {
                employeeId: employee.id,
                clockType: '上班',
                clockTime: {
                    [require('sequelize').Op.between]: [today, tomorrow]
                }
            }
        });
        
        if (existingRecord) {
            return responseHelper.error(res, '今日已有上班打卡記錄', 'ALREADY_CHECKED_IN', 409);
        }
        
        // 判斷打卡狀態
        let status = '正常';
        if (!isInRange) {
            status = '異常';
        }
        
        // 創建打卡記錄
        const attendance = await models.Attendance.create({
            employeeId: employee.id,
            storeId: store.id,
            clockTime: clockTime,
            clockType: '上班',
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            distance: distance,
            deviceFingerprint: deviceFingerprint,
            status: status,
            notes: notes || null
        });
        
        logger.info(`📍 上班打卡: ${employee.name} - ${status}`, {
            distance: distance,
            status: status,
            storeId: store.id
        });
        
        responseHelper.success(res, {
            attendance: {
                id: attendance.id,
                checkinTime: attendance.clockTime,
                checkinLocation: {
                    latitude: attendance.latitude,
                    longitude: attendance.longitude,
                    address: address || store.address
                },
                distance: distance,
                status: status,
                store: {
                    name: store.name,
                    address: store.address
                },
                isInRange: isInRange
            }
        }, '上班打卡成功');
        
    } catch (error) {
        logger.error('❌ 上班打卡失敗:', error);
        responseHelper.error(res, '上班打卡失敗，請稍後再試', 'CHECKIN_FAILED', 500);
    }
});

/**
 * 打卡下班端點
 */
router.post('/checkout', authMiddleware, async (req, res) => {
    try {
        await initializeModels();
        const { latitude, longitude, address, notes } = req.body;
        
        // 輸入驗證
        if (!latitude || !longitude) {
            return responseHelper.error(res, '請提供GPS定位座標', 'INVALID_GPS', 400);
        }
        
        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
            return responseHelper.error(res, 'GPS座標必須是數字', 'INVALID_GPS_FORMAT', 400);
        }
        
        // 獲取員工和分店資訊
        const employee = await models.Employee.findByPk(req.user.id, {
            include: [{
                model: models.Store,
                attributes: ['id', 'name', 'address', 'latitude', 'longitude', 'radius', 'openTime']
            }]
        });
        
        if (!employee || !employee.Store) {
            return responseHelper.error(res, '無法找到員工分店資訊', 'EMPLOYEE_NOT_FOUND', 404);
        }
        
        const store = employee.Store;
        const clockTime = new Date();
        
        // 計算與分店的距離
        const distance = Math.round(calculateDistance(
            parseFloat(latitude),
            parseFloat(longitude),
            parseFloat(store.latitude),
            parseFloat(store.longitude)
        ));
        
        // 檢查是否在允許範圍內
        const isInRange = distance <= store.radius;
        
        // 生成設備指紋
        const deviceFingerprint = generateDeviceFingerprint(req);
        
        // 檢查今日是否已有下班打卡記錄
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const existingRecord = await models.Attendance.findOne({
            where: {
                employeeId: employee.id,
                clockType: '下班',
                clockTime: {
                    [require('sequelize').Op.between]: [today, tomorrow]
                }
            }
        });
        
        if (existingRecord) {
            return responseHelper.error(res, '今日已有下班打卡記錄', 'ALREADY_CHECKED_OUT', 409);
        }
        
        // 尋找今日上班記錄來計算工作時數
        const checkinRecord = await models.Attendance.findOne({
            where: {
                employeeId: employee.id,
                clockType: '上班',
                clockTime: {
                    [require('sequelize').Op.between]: [today, tomorrow]
                }
            }
        });
        
        let workingHours = null;
        if (checkinRecord) {
            workingHours = Math.round((clockTime - checkinRecord.clockTime) / (1000 * 60 * 60) * 100) / 100;
        }
        
        // 判斷打卡狀態
        let status = '正常';
        if (!isInRange) {
            status = '異常';
        }
        
        // 創建打卡記錄
        const attendance = await models.Attendance.create({
            employeeId: employee.id,
            storeId: store.id,
            clockTime: clockTime,
            clockType: '下班',
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            distance: distance,
            deviceFingerprint: deviceFingerprint,
            status: status,
            notes: notes || null
        });
        
        logger.info(`📍 下班打卡: ${employee.name} - ${status}`, {
            distance: distance,
            status: status,
            workingHours: workingHours,
            storeId: store.id
        });
        
        responseHelper.success(res, {
            attendance: {
                id: attendance.id,
                checkoutTime: attendance.clockTime,
                checkoutLocation: {
                    latitude: attendance.latitude,
                    longitude: attendance.longitude,
                    address: address || store.address
                },
                distance: distance,
                status: status,
                workingHours: workingHours,
                store: {
                    name: store.name,
                    address: store.address
                },
                isInRange: isInRange
            }
        }, '下班打卡成功');
        
    } catch (error) {
        logger.error('❌ 下班打卡失敗:', error);
        responseHelper.error(res, '下班打卡失敗，請稍後再試', 'CHECKOUT_FAILED', 500);
    }
});

module.exports = router;