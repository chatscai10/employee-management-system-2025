// 多店面地理圍欄系統 - 支援不同範圍動態驗證
// 基於系統邏輯.txt的3店面配置要求設計

class MultiStoreGeofencing {
  constructor() {
    // 基於系統邏輯.txt的店面配置
    this.storeConfigurations = [
      {
        id: 'ZL_ZHONGXIAO',
        name: '內壢忠孝店',
        displayName: '內壢 忠孝店',
        latitude: 24.9748412,
        longitude: 121.2556713,
        radius: 100000, // 特殊大範圍設定
        address: '桃園市中壢區忠孝路',
        people: 2, // 最少值班人數
        open: '15:00-02:00',
        workHours: {
          weekday: { start: '15:00', end: '02:00' },
          weekend: { start: '15:00', end: '02:00' }
        },
        specialRules: {
          isHeadquarters: true, // 總店特殊範圍
          allowRemoteAccess: true,
          extendedRadius: true
        }
      },
      {
        id: 'TY_LONGAN',
        name: '桃園龍安店',
        displayName: '桃園 龍安店',
        latitude: 24.9880023,
        longitude: 121.2812737,
        radius: 100, // 標準範圍
        address: '桃園市桃園區龍安街',
        people: 2,
        open: '15:00-02:00',
        workHours: {
          weekday: { start: '15:00', end: '02:00' },
          weekend: { start: '15:00', end: '02:00' }
        },
        specialRules: {
          isHeadquarters: false,
          allowRemoteAccess: false,
          strictGeofencing: true
        }
      },
      {
        id: 'ZL_LONGGANG',
        name: '中壢龍崗店',
        displayName: '中壢 龍崗店',
        latitude: 24.9298502,
        longitude: 121.2529472,
        radius: 100, // 標準範圍
        address: '桃園市中壢區龍崗路',
        people: 2,
        open: '15:00-02:00',
        workHours: {
          weekday: { start: '15:00', end: '02:00' },
          weekend: { start: '15:00', end: '02:00' }
        },
        specialRules: {
          isHeadquarters: false,
          allowRemoteAccess: false,
          strictGeofencing: true
        }
      }
    ];

    this.geofenceHistory = [];
    this.validationRules = this.initValidationRules();
  }

  // 初始化驗證規則
  initValidationRules() {
    return {
      // 最小精度要求 (公尺)
      minimumAccuracy: 50,
      
      // 最大允許距離 (用於異常檢測)
      maxAllowedDistance: 200000, // 200公里
      
      // 連續驗證次數
      consecutiveValidations: 3,
      
      // 時間窗口限制 (毫秒)
      validationWindow: 300000, // 5分鐘
      
      // 異常檢測閾值
      anomalyThreshold: {
        speedLimit: 120, // km/h
        jumpDistance: 1000, // 公尺
        accuracyDegradation: 100 // 公尺
      }
    };
  }

  // 驗證用戶位置是否在任一店面範圍內
  validateUserLocation(userLatitude, userLongitude, accuracy = 0, timestamp = Date.now()) {
    const validationResult = {
      timestamp,
      userLocation: { latitude: userLatitude, longitude: userLongitude },
      accuracy,
      validStores: [],
      nearbyStores: [],
      isValid: false,
      bestMatch: null,
      validationDetails: {}
    };

    // 檢查每個店面
    this.storeConfigurations.forEach(store => {
      const distance = this.calculateDistance(
        userLatitude, userLongitude,
        store.latitude, store.longitude
      );

      const storeValidation = {
        storeId: store.id,
        storeName: store.name,
        displayName: store.displayName,
        distance: Math.round(distance),
        radius: store.radius,
        isWithinRange: distance <= store.radius,
        accuracy,
        confidence: this.calculateConfidence(distance, store.radius, accuracy),
        specialRules: store.specialRules
      };

      // 加入詳細分析
      storeValidation.analysis = this.analyzeLocationValidation(storeValidation, store);

      validationResult.validationDetails[store.id] = storeValidation;

      // 在範圍內的店面
      if (storeValidation.isWithinRange) {
        validationResult.validStores.push(storeValidation);
        validationResult.isValid = true;
      }
      // 附近的店面 (在兩倍半徑內)
      else if (distance <= store.radius * 2) {
        validationResult.nearbyStores.push(storeValidation);
      }
    });

    // 選擇最佳匹配店面
    if (validationResult.validStores.length > 0) {
      validationResult.bestMatch = validationResult.validStores.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      );
    }

    // 記錄驗證歷史
    this.recordGeofenceValidation(validationResult);

    return validationResult;
  }

  // 計算兩點間距離 (Haversine公式)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // 地球半徑 (公尺)
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  // 計算驗證信心度
  calculateConfidence(distance, radius, accuracy) {
    // 基礎信心度計算
    let confidence = Math.max(0, 100 - (distance / radius) * 50);
    
    // 精度調整
    if (accuracy > 0) {
      const accuracyPenalty = Math.min(30, accuracy / 2);
      confidence = Math.max(0, confidence - accuracyPenalty);
    }
    
    // 範圍內獎勵
    if (distance <= radius) {
      confidence = Math.min(100, confidence + 20);
    }

    return Math.round(confidence);
  }

  // 分析位置驗證詳情
  analyzeLocationValidation(validation, store) {
    const analysis = {
      status: validation.isWithinRange ? 'VALID' : 'OUT_OF_RANGE',
      riskLevel: 'LOW',
      factors: [],
      recommendations: []
    };

    // 距離分析
    if (validation.distance > store.radius) {
      analysis.status = 'OUT_OF_RANGE';
      analysis.factors.push(`距離店面${validation.distance}公尺，超出允許範圍${store.radius}公尺`);
      
      if (validation.distance > store.radius * 2) {
        analysis.riskLevel = 'HIGH';
        analysis.recommendations.push('位置明顯異常，建議人工確認');
      } else {
        analysis.riskLevel = 'MEDIUM';
        analysis.recommendations.push('位置稍微超出範圍，可能是GPS誤差');
      }
    }

    // 精度分析
    if (validation.accuracy > this.validationRules.minimumAccuracy) {
      analysis.factors.push(`GPS精度${validation.accuracy}公尺，低於建議精度${this.validationRules.minimumAccuracy}公尺`);
      analysis.recommendations.push('建議移動到GPS訊號較好的位置重新定位');
    }

    // 特殊規則分析
    if (store.specialRules.isHeadquarters && validation.distance <= store.radius) {
      analysis.factors.push('總店特殊範圍驗證通過');
      analysis.status = 'HEADQUARTERS_VALID';
    }

    if (store.specialRules.strictGeofencing && validation.distance > store.radius * 0.8) {
      analysis.factors.push('嚴格地理圍欄檢查，接近邊界');
      analysis.recommendations.push('建議更靠近店面中心位置');
    }

    return analysis;
  }

  // 異常檢測
  detectLocationAnomalies(currentLocation, previousLocation) {
    if (!previousLocation) return { hasAnomalies: false };

    const anomalies = [];
    const timeDiff = (currentLocation.timestamp - previousLocation.timestamp) / 1000; // 秒
    
    if (timeDiff <= 0) return { hasAnomalies: false };

    const distance = this.calculateDistance(
      currentLocation.userLocation.latitude, currentLocation.userLocation.longitude,
      previousLocation.userLocation.latitude, previousLocation.userLocation.longitude
    );

    // 速度異常檢測
    const speed = (distance / timeDiff) * 3.6; // km/h
    if (speed > this.validationRules.anomalyThreshold.speedLimit) {
      anomalies.push({
        type: 'EXCESSIVE_SPEED',
        value: speed,
        threshold: this.validationRules.anomalyThreshold.speedLimit,
        message: `移動速度異常: ${speed.toFixed(1)} km/h`
      });
    }

    // 瞬移檢測
    if (distance > this.validationRules.anomalyThreshold.jumpDistance && timeDiff < 60) {
      anomalies.push({
        type: 'LOCATION_JUMP',
        value: distance,
        threshold: this.validationRules.anomalyThreshold.jumpDistance,
        message: `位置瞬移異常: ${distance.toFixed(0)}公尺/${timeDiff}秒`
      });
    }

    // 精度惡化檢測
    if (currentLocation.accuracy > previousLocation.accuracy + this.validationRules.anomalyThreshold.accuracyDegradation) {
      anomalies.push({
        type: 'ACCURACY_DEGRADATION',
        value: currentLocation.accuracy,
        threshold: previousLocation.accuracy + this.validationRules.anomalyThreshold.accuracyDegradation,
        message: `GPS精度顯著下降: ${currentLocation.accuracy}公尺`
      });
    }

    return {
      hasAnomalies: anomalies.length > 0,
      anomalies,
      riskScore: this.calculateRiskScore(anomalies)
    };
  }

  // 計算風險分數
  calculateRiskScore(anomalies) {
    if (anomalies.length === 0) return 0;

    let score = 0;
    anomalies.forEach(anomaly => {
      switch(anomaly.type) {
        case 'EXCESSIVE_SPEED':
          score += 40;
          break;
        case 'LOCATION_JUMP':
          score += 60;
          break;
        case 'ACCURACY_DEGRADATION':
          score += 20;
          break;
        default:
          score += 10;
      }
    });

    return Math.min(100, score);
  }

  // 記錄地理圍欄驗證歷史
  recordGeofenceValidation(validationResult) {
    this.geofenceHistory.push({
      ...validationResult,
      id: this.generateValidationId()
    });

    // 保持歷史記錄在合理範圍內
    if (this.geofenceHistory.length > 1000) {
      this.geofenceHistory = this.geofenceHistory.slice(-500);
    }
  }

  // 生成驗證ID
  generateValidationId() {
    return `gf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 獲取店面資訊
  getStoreInfo(storeId) {
    return this.storeConfigurations.find(store => store.id === storeId);
  }

  // 獲取所有店面配置
  getAllStores() {
    return this.storeConfigurations.map(store => ({
      id: store.id,
      name: store.name,
      displayName: store.displayName,
      latitude: store.latitude,
      longitude: store.longitude,
      radius: store.radius,
      address: store.address,
      workHours: store.workHours
    }));
  }

  // 更新店面配置
  updateStoreConfiguration(storeId, updates) {
    const storeIndex = this.storeConfigurations.findIndex(store => store.id === storeId);
    if (storeIndex === -1) {
      throw new Error(`找不到店面: ${storeId}`);
    }

    this.storeConfigurations[storeIndex] = {
      ...this.storeConfigurations[storeIndex],
      ...updates
    };

    return this.storeConfigurations[storeIndex];
  }

  // 檢查工作時間
  isWithinWorkHours(storeId, timestamp = Date.now()) {
    const store = this.getStoreInfo(storeId);
    if (!store) return false;

    const date = new Date(timestamp);
    const currentTime = date.getHours() * 60 + date.getMinutes(); // 分鐘
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;

    const workHours = isWeekend ? store.workHours.weekend : store.workHours.weekday;
    const [startHour, startMin] = workHours.start.split(':').map(Number);
    const [endHour, endMin] = workHours.end.split(':').map(Number);

    const startTime = startHour * 60 + startMin;
    let endTime = endHour * 60 + endMin;

    // 處理跨日營業 (如15:00-02:00)
    if (endTime < startTime) {
      endTime += 24 * 60; // 加上24小時
      if (currentTime < startTime) {
        return currentTime + 24 * 60 <= endTime;
      }
    }

    return currentTime >= startTime && currentTime <= endTime;
  }

  // 獲取驗證統計
  getValidationStatistics(timeRange = 86400000) { // 24小時
    const cutoffTime = Date.now() - timeRange;
    const recentValidations = this.geofenceHistory.filter(v => v.timestamp > cutoffTime);

    if (recentValidations.length === 0) {
      return { error: '無驗證記錄' };
    }

    const stats = {
      totalValidations: recentValidations.length,
      validValidations: recentValidations.filter(v => v.isValid).length,
      invalidValidations: recentValidations.filter(v => !v.isValid).length,
      averageAccuracy: 0,
      storeBreakdown: {},
      anomaliesDetected: 0
    };

    // 計算平均精度
    const accuracies = recentValidations.map(v => v.accuracy).filter(a => a > 0);
    if (accuracies.length > 0) {
      stats.averageAccuracy = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
    }

    // 店面統計
    this.storeConfigurations.forEach(store => {
      const storeValidations = recentValidations.filter(v => 
        v.validStores.some(vs => vs.storeId === store.id)
      );
      stats.storeBreakdown[store.id] = {
        name: store.name,
        validations: storeValidations.length,
        percentage: recentValidations.length > 0 ? 
          (storeValidations.length / recentValidations.length * 100).toFixed(1) : 0
      };
    });

    stats.successRate = ((stats.validValidations / stats.totalValidations) * 100).toFixed(1);

    return stats;
  }

  // 清理舊記錄
  cleanupHistory(daysToKeep = 30) {
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    const beforeCount = this.geofenceHistory.length;
    
    this.geofenceHistory = this.geofenceHistory.filter(v => v.timestamp > cutoffTime);
    
    const removedCount = beforeCount - this.geofenceHistory.length;
    console.log(`🧹 清理了 ${removedCount} 筆過期的地理圍欄記錄`);
    
    return { removed: removedCount, remaining: this.geofenceHistory.length };
  }

  // 匯出配置
  exportConfiguration() {
    return {
      stores: this.storeConfigurations,
      rules: this.validationRules,
      exportTime: new Date().toISOString()
    };
  }

  // 匯入配置
  importConfiguration(config) {
    if (config.stores) {
      this.storeConfigurations = config.stores;
    }
    if (config.rules) {
      this.validationRules = { ...this.validationRules, ...config.rules };
    }
    console.log('📥 地理圍欄配置已匯入');
  }
}

// 使用範例
/*
const geofencing = new MultiStoreGeofencing();

// 驗證位置
const result = geofencing.validateUserLocation(24.9748412, 121.2556713, 10);
console.log('驗證結果:', result);

// 檢查工作時間
const isWorkTime = geofencing.isWithinWorkHours('ZL_ZHONGXIAO');
console.log('是否在工作時間:', isWorkTime);

// 獲取統計
const stats = geofencing.getValidationStatistics();
console.log('驗證統計:', stats);
*/

module.exports = MultiStoreGeofencing;