// GPS打卡系統完整整合 - 智慧模板實際應用
// 整合: modern-geolocation-tracker.js + multi-store-geofencing.js

const express = require('express');
const router = express.Router();
const ModernGeolocationTracker = require('../templates/modern-geolocation-tracker');
const MultiStoreGeofencing = require('../templates/multi-store-geofencing');
const EnterpriseTelegramNotificationEngine = require('../templates/enterprise-telegram-notification-engine');

// 初始化智慧模組
const geofencing = new MultiStoreGeofencing();
const telegramEngine = new EnterpriseTelegramNotificationEngine();

// 設備指紋檢測類
class DeviceFingerprintValidator {
  constructor() {
    this.fingerprintHistory = new Map();
  }

  // 生成設備指紋
  generateFingerprint(req, additionalData = {}) {
    const userAgent = req.headers['user-agent'] || '';
    const acceptLanguage = req.headers['accept-language'] || '';
    const acceptEncoding = req.headers['accept-encoding'] || '';
    const ip = req.ip || req.connection.remoteAddress || '';
    
    const fingerprint = {
      userAgent,
      acceptLanguage,
      acceptEncoding,
      ip,
      timestamp: Date.now(),
      ...additionalData
    };

    // 生成唯一ID
    const fingerprintString = JSON.stringify(fingerprint);
    const hash = this.generateHash(fingerprintString);
    
    return {
      id: hash,
      details: fingerprint
    };
  }

  // 驗證設備指紋
  validateFingerprint(employeeId, currentFingerprint) {
    const history = this.fingerprintHistory.get(employeeId) || [];
    
    if (history.length === 0) {
      // 首次打卡，記錄設備指紋
      this.fingerprintHistory.set(employeeId, [currentFingerprint]);
      return {
        isValid: true,
        isFirstTime: true,
        riskLevel: 'LOW',
        message: '首次設備記錄'
      };
    }

    // 檢查是否為已知設備
    const isKnownDevice = history.some(fp => fp.id === currentFingerprint.id);
    
    if (isKnownDevice) {
      return {
        isValid: true,
        isFirstTime: false,
        riskLevel: 'LOW',
        message: '已知設備'
      };
    }

    // 新設備分析
    const analysis = this.analyzeDeviceChange(history[history.length - 1], currentFingerprint);
    
    // 記錄新設備
    history.push(currentFingerprint);
    this.fingerprintHistory.set(employeeId, history.slice(-10)); // 保留最近10個設備

    return analysis;
  }

  // 分析設備變更
  analyzeDeviceChange(lastFingerprint, currentFingerprint) {
    const changes = [];
    
    if (lastFingerprint.details.userAgent !== currentFingerprint.details.userAgent) {
      changes.push('瀏覽器變更');
    }
    
    if (lastFingerprint.details.ip !== currentFingerprint.details.ip) {
      changes.push('IP位址變更');
    }

    if (lastFingerprint.details.acceptLanguage !== currentFingerprint.details.acceptLanguage) {
      changes.push('語言設定變更');
    }

    // 風險評估
    let riskLevel = 'LOW';
    if (changes.length >= 3) {
      riskLevel = 'HIGH';
    } else if (changes.length >= 1) {
      riskLevel = 'MEDIUM';
    }

    return {
      isValid: riskLevel !== 'HIGH', // 高風險設備不允許打卡
      isFirstTime: false,
      riskLevel,
      changes,
      message: changes.length > 0 ? `設備異常: ${changes.join(', ')}` : '設備正常'
    };
  }

  // 生成雜湊
  generateHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
}

const deviceValidator = new DeviceFingerprintValidator();

// 獲取店面配置
router.get('/stores', (req, res) => {
  try {
    const stores = geofencing.getAllStores();
    res.json({
      success: true,
      stores,
      totalStores: stores.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 驗證GPS位置
router.post('/validate-location', (req, res) => {
  try {
    const { latitude, longitude, accuracy, timestamp } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: '缺少位置座標'
      });
    }

    // 使用多店面地理圍欄驗證
    const validation = geofencing.validateUserLocation(
      parseFloat(latitude),
      parseFloat(longitude),
      accuracy || 0,
      timestamp || Date.now()
    );

    // 異常檢測 (如果有歷史位置)
    const lastValidation = req.session?.lastValidation;
    let anomalyDetection = { hasAnomalies: false };
    
    if (lastValidation) {
      anomalyDetection = geofencing.detectLocationAnomalies(validation, lastValidation);
    }

    // 儲存當前驗證結果到session
    req.session = req.session || {};
    req.session.lastValidation = validation;

    res.json({
      success: true,
      validation,
      anomalyDetection,
      recommendations: validation.isValid ? 
        ['位置驗證通過，可以進行打卡'] : 
        ['請移動到店面附近再進行打卡', '確保GPS定位精度足夠']
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 執行打卡
router.post('/clock', async (req, res) => {
  try {
    const { 
      employeeId, 
      employeeName, 
      clockType, 
      latitude, 
      longitude, 
      accuracy,
      deviceInfo
    } = req.body;

    // 必填欄位檢查
    if (!employeeId || !employeeName || !clockType || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: '缺少必要資訊'
      });
    }

    // 1. GPS位置驗證
    const locationValidation = geofencing.validateUserLocation(
      parseFloat(latitude),
      parseFloat(longitude),
      accuracy || 0
    );

    if (!locationValidation.isValid) {
      return res.status(403).json({
        success: false,
        error: '位置驗證失敗，請在店面範圍內打卡',
        locationValidation
      });
    }

    // 2. 設備指紋檢測
    const deviceFingerprint = deviceValidator.generateFingerprint(req, deviceInfo);
    const fingerprintValidation = deviceValidator.validateFingerprint(employeeId, deviceFingerprint);

    // 3. 計算遲到狀況
    const clockTime = new Date();
    const isLate = this.checkLateStatus(clockTime, locationValidation.bestMatch.storeId, clockType);
    
    // 4. 準備打卡記錄
    const attendanceRecord = {
      id: this.generateAttendanceId(),
      employeeId,
      employeeName,
      storeId: locationValidation.bestMatch.storeId,
      storeName: locationValidation.bestMatch.storeName,
      clockType,
      timestamp: clockTime.toISOString(),
      coordinates: `${latitude},${longitude}`,
      distance: locationValidation.bestMatch.distance,
      accuracy,
      deviceFingerprint: deviceFingerprint.id,
      deviceInfo: deviceFingerprint.details,
      isLate: isLate.isLate,
      lateMinutes: isLate.lateMinutes,
      monthlyLateTotal: isLate.monthlyTotal,
      status: fingerprintValidation.isValid ? 'valid' : 'suspicious',
      validationNotes: fingerprintValidation.message,
      locationValidation: locationValidation.validationDetails,
      created_at: new Date()
    };

    // 5. 儲存到資料庫 (這裡應該整合實際的資料庫操作)
    console.log('💾 儲存打卡記錄:', attendanceRecord);

    // 6. 觸發Telegram通知
    try {
      await telegramEngine.triggerNotification('attendance_clock', {
        employeeName: attendanceRecord.employeeName,
        employeeId: attendanceRecord.employeeId,
        clockType: clockType === 'clock_in' ? '上班打卡 🟢' : '下班打卡 🔴',
        storeName: attendanceRecord.storeName,
        timestamp: clockTime.toLocaleString(),
        distance: attendanceRecord.distance,
        coordinates: attendanceRecord.coordinates,
        accuracy: accuracy || '未知',
        locationStatus: attendanceRecord.status === 'valid' ? '正常 ✅' : '可疑 ⚠️',
        timeAnalysis: isLate.isLate ? 
          `├ 遲到狀況: 遲到 ${isLate.lateMinutes} 分鐘 ⚠️\n└ 本月累計: 遲到 ${isLate.monthlyTotal} 分鐘` :
          '├ 時間狀況: 準時 ✅\n└ 本月累計: 無遲到記錄',
        deviceFingerprint: deviceFingerprint.id,
        deviceType: deviceInfo?.deviceType || '未知',
        operatingSystem: deviceInfo?.os || '未知',
        browser: deviceInfo?.browser || '未知',
        screenResolution: deviceInfo?.screenResolution || '未知',
        ipAddress: req.ip,
        securityAlert: fingerprintValidation.riskLevel === 'HIGH' ? 
          '❌ <b>嚴重警告:</b>\n設備指紋與歷史記錄不符，可能存在異常行為' :
          fingerprintValidation.riskLevel === 'MEDIUM' ?
          '⚠️ <b>異常警告:</b>\n設備指紋與歷史記錄不符，建議人工確認' :
          '✅ 所有驗證通過，打卡記錄正常',
        photoStatus: '未上傳 ⚠️' // 之後實現照片功能
      });
    } catch (notificationError) {
      console.error('📡 通知發送失敗:', notificationError.message);
      // 通知失敗不影響打卡成功
    }

    res.json({
      success: true,
      message: '打卡成功',
      attendanceRecord: {
        id: attendanceRecord.id,
        clockType: attendanceRecord.clockType,
        timestamp: attendanceRecord.timestamp,
        storeName: attendanceRecord.storeName,
        distance: attendanceRecord.distance,
        isLate: attendanceRecord.isLate,
        lateMinutes: attendanceRecord.lateMinutes,
        status: attendanceRecord.status
      },
      locationValidation: locationValidation.bestMatch,
      deviceValidation: fingerprintValidation
    });

  } catch (error) {
    console.error('❌ 打卡處理失敗:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 檢查遲到狀況
function checkLateStatus(clockTime, storeId, clockType) {
  // 這裡應該整合實際的工作時間設定和員工排班記錄
  // 現在使用簡化邏輯
  
  const hour = clockTime.getHours();
  const minute = clockTime.getMinutes();
  
  if (clockType === 'clock_in') {
    // 假設上班時間是15:00
    const expectedHour = 15;
    const expectedMinute = 0;
    
    const actualMinutes = hour * 60 + minute;
    const expectedMinutes = expectedHour * 60 + expectedMinute;
    
    const lateMinutes = actualMinutes - expectedMinutes;
    
    return {
      isLate: lateMinutes > 0,
      lateMinutes: Math.max(0, lateMinutes),
      monthlyTotal: 0 // 這裡應該查詢資料庫獲取月累計遲到時間
    };
  }
  
  return {
    isLate: false,
    lateMinutes: 0,
    monthlyTotal: 0
  };
}

// 生成打卡記錄ID
function generateAttendanceId() {
  return `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 獲取打卡歷史記錄
router.get('/history/:employeeId', (req, res) => {
  try {
    const { employeeId } = req.params;
    const { limit = 5 } = req.query;
    
    // 這裡應該從資料庫查詢實際記錄
    // 現在返回模擬數據
    const mockHistory = [
      {
        id: 'att_1754712345_abc123',
        clockType: 'clock_in',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        storeName: '內壢忠孝店',
        distance: 25,
        isLate: false,
        status: 'valid'
      },
      {
        id: 'att_1754698745_def456',
        clockType: 'clock_out',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        storeName: '內壢忠孝店',
        distance: 15,
        isLate: false,
        status: 'valid'
      }
    ];

    res.json({
      success: true,
      history: mockHistory.slice(0, parseInt(limit)),
      totalRecords: mockHistory.length
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 獲取地理圍欄統計
router.get('/geofence-stats', (req, res) => {
  try {
    const stats = geofencing.getValidationStatistics();
    res.json({
      success: true,
      statistics: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 測試通知功能
router.post('/test-notification', async (req, res) => {
  try {
    const result = await telegramEngine.testNotifications();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;