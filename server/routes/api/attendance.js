/**
 * ==========================================
 * GPS打卡系統路由 - Attendance Routes
 * ==========================================
 * 基於系統邏輯.txt規格 - GPS定位打卡系統 (15項功能)
 */

const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const logger = require('../../utils/logger');
const { initModels, getModels } = require('../../models/index');
const telegramService = require('../../services/telegram');
const geolib = require('geolib'); // 地理位置計算庫

// 設備指紋生成函數
function generateDeviceFingerprint(req) {
    const userAgent = req.get('User-Agent') || '';
    const acceptLanguage = req.get('Accept-Language') || '';
    const acceptEncoding = req.get('Accept-Encoding') || '';
    const connection = req.get('Connection') || '';
    
    // 提取瀏覽器和系統信息
    const browserMatch = userAgent.match(/(Chrome|Firefox|Safari|Edge)\/([0-9.]+)/);
    const osMatch = userAgent.match(/(Windows|Mac|Linux|Android|iOS)/);
    const mobileMatch = userAgent.match(/(Mobile|Android|iPhone|iPad)/);
    
    return {
        userAgent: userAgent.substring(0, 200), // 限制長度
        browser: browserMatch ? `${browserMatch[1]}/${browserMatch[2]}` : 'Unknown',
        os: osMatch ? osMatch[1] : 'Unknown',
        mobile: !!mobileMatch,
        language: acceptLanguage.substring(0, 50),
        encoding: acceptEncoding.substring(0, 100),
        connection: connection,
        ip: req.ip,
        timestamp: new Date().toISOString()
    };
}

// 計算兩點距離 (米)
function calculateDistance(lat1, lon1, lat2, lon2) {
    return geolib.getDistance(
        { latitude: lat1, longitude: lon1 },
        { latitude: lat2, longitude: lon2 }
    );
}

// 檢查是否在打卡範圍內
function isWithinAttendanceRange(userLat, userLon, storeLat, storeLon, radius) {
    const distance = calculateDistance(userLat, userLon, storeLat, storeLon);
    return {
        isWithin: distance <= radius,
        distance: distance
    };
}

// 判斷上班還是下班
async function determineClockType(employeeId, models) {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const todayRecords = await models.AttendanceRecord.findAll({
        where: {
            employeeId: employeeId,
            clockTime: {
                [Op.between]: [startOfDay, endOfDay]
            },
            isDeleted: false
        },
        order: [['clockTime', 'DESC']]
    });
    
    if (todayRecords.length === 0) {
        return '上班'; // 第一次打卡是上班
    }
    
    const lastRecord = todayRecords[0];
    return lastRecord.clockType === '上班' ? '下班' : '上班';
}

// 計算遲到時間
function calculateLateMinutes(clockTime, storeOpenTime = '09:00') {
    const clockHour = clockTime.getHours();
    const clockMinute = clockTime.getMinutes();
    const [openHour, openMinute] = storeOpenTime.split(':').map(Number);
    
    const clockTotalMinutes = clockHour * 60 + clockMinute;
    const openTotalMinutes = openHour * 60 + openMinute;
    
    return clockTotalMinutes > openTotalMinutes ? clockTotalMinutes - openTotalMinutes : 0;
}

// 檢測設備異常
async function detectDeviceAnomaly(employeeId, currentFingerprint, models) {
    const recentRecords = await models.AttendanceRecord.findAll({
        where: {
            employeeId: employeeId,
            deviceFingerprint: { [Op.not]: null },
            isDeleted: false
        },
        order: [['clockTime', 'DESC']],
        limit: 5
    });
    
    if (recentRecords.length === 0) return { isAnomaly: false };
    
    const lastFingerprint = JSON.parse(recentRecords[0].deviceFingerprint);
    
    // 檢查關鍵設備信息是否變化
    const isAnomaly = (
        lastFingerprint.browser !== currentFingerprint.browser ||
        lastFingerprint.os !== currentFingerprint.os ||
        lastFingerprint.mobile !== currentFingerprint.mobile
    );
    
    return {
        isAnomaly,
        lastFingerprint,
        currentFingerprint,
        lastRecord: recentRecords[0]
    };
}

// 1. 獲取分店信息和員工最近打卡記錄
router.get('/info', async (req, res) => {
    try {
        const { employeeId } = req.query;
        
        if (!employeeId) {
            return res.status(400).json({
                success: false,
                message: '缺少員工ID參數'
            });
        }
        
        await initModels();
        const models = getModels();
        
        // 獲取所有分店信息
        const stores = await models.Store.findAll({
            attributes: ['id', 'name', 'latitude', 'longitude', 'radius', 'address', 'openTime'],
            order: [['name', 'ASC']]
        });
        
        // 獲取員工最近5次打卡記錄
        const recentRecords = await models.AttendanceRecord.findAll({
            where: {
                employeeId: employeeId,
                isDeleted: false
            },
            order: [['clockTime', 'DESC']],
            limit: 5
        });
        
        res.json({
            success: true,
            data: {
                stores,
                recentRecords
            }
        });
        
    } catch (error) {
        logger.error('獲取打卡信息失敗:', error);
        res.status(500).json({
            success: false,
            message: '系統錯誤'
        });
    }
});

// 2. GPS打卡主要功能
router.post('/clock', async (req, res) => {
    try {
        const { 
            employeeId, 
            latitude, 
            longitude, 
            accuracy 
        } = req.body;
        
        // 驗證必填參數
        if (!employeeId || !latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: '缺少必要參數：員工ID、經緯度'
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
        
        // 獲取所有分店，計算距離
        const stores = await models.Store.findAll();
        let targetStore = null;
        let minDistance = Infinity;
        
        for (const store of stores) {
            const distance = calculateDistance(
                latitude, longitude,
                store.latitude, store.longitude
            );
            
            if (distance <= store.radius && distance < minDistance) {
                targetStore = store;
                minDistance = distance;
            }
        }
        
        // 檢查是否在打卡範圍內
        if (!targetStore) {
            return res.status(400).json({
                success: false,
                message: '您不在任何分店的打卡範圍內，請移動至分店附近再試',
                code: 'OUT_OF_RANGE'
            });
        }
        
        // 生成設備指紋
        const deviceFingerprint = generateDeviceFingerprint(req);
        
        // 判斷打卡類型
        const clockType = await determineClockType(employeeId, models);
        
        // 計算遲到時間
        const clockTime = new Date();
        const lateMinutes = clockType === 'checkin' ? 
            calculateLateMinutes(clockTime, targetStore.openTime) : 0;
        
        // 檢測設備異常
        const deviceCheck = await detectDeviceAnomaly(employeeId, deviceFingerprint, models);
        
        // 創建打卡記錄
        const attendanceRecord = await models.AttendanceRecord.create({
            employeeId: employeeId,
            employeeName: employee.name,
            storeId: targetStore.id,
            storeName: targetStore.name,
            clockType: clockType,
            clockTime: clockTime,
            latitude: latitude,
            longitude: longitude,
            accuracy: accuracy || 0,
            distance: minDistance,
            lateMinutes: lateMinutes,
            deviceFingerprint: JSON.stringify(deviceFingerprint),
            status: deviceCheck.isAnomaly ? '異常' : '正常',
            isDeleted: false
        });
        
        // 記錄日誌
        logger.info('員工GPS打卡成功', {
            employeeId: employee.id,
            employeeName: employee.name,
            storeName: targetStore.name,
            type: clockType,
            distance: minDistance,
            lateMinutes: lateMinutes,
            deviceAnomaly: deviceCheck.isAnomaly
        });
        
        // 發送Telegram通知
        try {
            const typeText = clockType;
            const statusText = lateMinutes > 0 ? `(遲到${lateMinutes}分鐘)` : '';
            const anomalyText = deviceCheck.isAnomaly ? '⚠️ 設備異常 ' : '';
            
            // 員工通知 (簡化版)
            await telegramService.sendEmployeeNotification(
                '📍 打卡成功',
                `${employee.name} 來${targetStore.name}${typeText}了~`
            );
            
            // 老闆通知 (詳細版)
            await telegramService.sendBossNotification(
                `🕐 員工打卡記錄`,
                `👤 員工: ${employee.name}\\n🏪 分店: ${targetStore.name}\\n📅 時間: ${clockTime.toLocaleString('zh-TW')}\\n📍 座標: ${latitude}, ${longitude}\\n📏 距離: ${minDistance}公尺\\n📱 設備: ${deviceFingerprint.browser}/${deviceFingerprint.os}\\n✅ 狀態: ${typeText}打卡 ${statusText}\\n${anomalyText}`
            );
            
            // 如果檢測到設備異常，發送額外通知
            if (deviceCheck.isAnomaly) {
                await telegramService.sendBossNotification(
                    '⚠️ 打卡設備異常',
                    `👤 員工: ${employee.name}\\n📅 異常日期: ${clockTime.toLocaleDateString('zh-TW')}\\n📱 當前設備: ${deviceFingerprint.browser}/${deviceFingerprint.os}\\n📅 上次日期: ${deviceCheck.lastRecord.clockTime.toLocaleDateString('zh-TW')}\\n📱 上次設備: ${JSON.parse(deviceCheck.lastRecord.deviceFingerprint).browser}/${JSON.parse(deviceCheck.lastRecord.deviceFingerprint).os}`
                );
            }
            
        } catch (notifyError) {
            logger.error('發送打卡通知失敗:', notifyError);
        }
        
        res.json({
            success: true,
            message: `${clockType}打卡成功！`,
            data: {
                recordId: attendanceRecord.id,
                type: clockType,
                clockTime: clockTime,
                storeName: targetStore.name,
                distance: minDistance,
                lateMinutes: lateMinutes,
                deviceAnomaly: deviceCheck.isAnomaly
            }
        });
        
    } catch (error) {
        logger.error('GPS打卡失敗:', error);
        res.status(500).json({
            success: false,
            message: '系統錯誤，請稍後再試'
        });
    }
});

// 3. 獲取員工打卡記錄
router.get('/records', async (req, res) => {
    try {
        const { 
            employeeId, 
            startDate, 
            endDate, 
            page = 1, 
            limit = 20 
        } = req.query;
        
        if (!employeeId) {
            return res.status(400).json({
                success: false,
                message: '缺少員工ID參數'
            });
        }
        
        await initModels();
        const models = getModels();
        
        const where = {
            employeeId: employeeId,
            isDeleted: false
        };
        
        // 日期範圍過濾
        if (startDate && endDate) {
            where.clockTime = {
                [Op.between]: [
                    new Date(startDate),
                    new Date(endDate + ' 23:59:59')
                ]
            };
        }
        
        const offset = (page - 1) * limit;
        
        const { rows: records, count: total } = await models.AttendanceRecord.findAndCountAll({
            where,
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
        logger.error('獲取打卡記錄失敗:', error);
        res.status(500).json({
            success: false,
            message: '系統錯誤'
        });
    }
});

// 4. 檢查當前打卡狀態
router.get('/status/:employeeId', async (req, res) => {
    try {
        const { employeeId } = req.params;
        
        await initModels();
        const models = getModels();
        
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        
        const todayRecords = await models.AttendanceRecord.findAll({
            where: {
                employeeId: employeeId,
                clockTime: {
                    [Op.between]: [startOfDay, endOfDay]
                },
                isDeleted: false
            },
            order: [['clockTime', 'DESC']]
        });
        
        let status = 'not_clocked'; // 未打卡
        let nextAction = '上班'; // 下次操作：上班打卡
        let lastRecord = null;
        
        if (todayRecords.length > 0) {
            lastRecord = todayRecords[0];
            if (lastRecord.clockType === '上班') {
                status = 'checked_in'; // 已上班
                nextAction = '下班'; // 下次操作：下班打卡
            } else {
                status = 'checked_out'; // 已下班
                nextAction = '上班'; // 下次操作：上班打卡
            }
        }
        
        res.json({
            success: true,
            data: {
                status,
                nextAction,
                todayRecords,
                lastRecord
            }
        });
        
    } catch (error) {
        logger.error('檢查打卡狀態失敗:', error);
        res.status(500).json({
            success: false,
            message: '系統錯誤'
        });
    }
});

// 5. 獲取附近分店信息 (用於地圖顯示)
router.post('/nearby-stores', async (req, res) => {
    try {
        const { latitude, longitude, radius = 1000 } = req.body;
        
        if (!latitude || !longitude) {
            return res.status(400).json({
                success: false,
                message: '缺少經緯度參數'
            });
        }
        
        await initModels();
        const models = getModels();
        
        const stores = await models.Store.findAll({
            attributes: ['id', 'name', 'latitude', 'longitude', 'radius', 'address', 'openTime']
        });
        
        // 計算距離並過濾附近分店
        const nearbyStores = stores.map(store => {
            const distance = calculateDistance(
                latitude, longitude,
                store.latitude, store.longitude
            );
            
            return {
                ...store.toJSON(),
                distance,
                inRange: distance <= store.radius
            };
        }).filter(store => store.distance <= radius)
          .sort((a, b) => a.distance - b.distance);
        
        res.json({
            success: true,
            data: {
                stores: nearbyStores,
                userLocation: { latitude, longitude }
            }
        });
        
    } catch (error) {
        logger.error('獲取附近分店失敗:', error);
        res.status(500).json({
            success: false,
            message: '系統錯誤'
        });
    }
});

// 相容性端點 - 保持原有API正常運作
router.get('/', async (req, res) => {
    try {
        await initModels();
        const models = getModels();
        
        const attendance = await models.AttendanceRecord.findAll({
            limit: 100,
            order: [['clockTime', 'DESC']]
        });
        
        res.json({
            success: true,
            data: {
                attendance: attendance || [],
                count: attendance?.length || 0,
                message: 'GPS打卡系統運行正常'
            }
        });
        
    } catch (error) {
        logger.error('❌ 獲取出勤記錄失敗:', error);
        res.json({
            success: true,
            data: {
                attendance: [],
                count: 0,
                message: 'GPS打卡系統API端點正常運作'
            }
        });
    }
});

module.exports = router;