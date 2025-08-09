// GPS打卡客戶端 - 整合智慧模板到前端界面
// 使用: modern-geolocation-tracker.js + 響應式設計

class GPSAttendanceClient {
  constructor() {
    // 初始化GPS追蹤器 (使用我們的智慧模板)
    this.gpsTracker = new ModernGeolocationTracker({
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 300000,
      privacyCompliant: true,
      encryptData: true
    });

    this.currentPosition = null;
    this.stores = [];
    this.isLocating = false;
    this.validationResult = null;
    
    // UI元素
    this.elements = {};
    this.initializeElements();
    this.setupEventListeners();
    this.loadStoreConfigurations();
    
    // 自動開始定位
    this.startLocationTracking();
  }

  // 初始化UI元素
  initializeElements() {
    this.elements = {
      mapContainer: document.getElementById('attendance-map'),
      locationStatus: document.getElementById('gps-status'),
      distanceText: document.getElementById('distance-text'),
      clockInBtn: document.getElementById('clock-in-btn'),
      clockOutBtn: document.getElementById('clock-out-btn'),
      storeInfo: document.getElementById('store-info'),
      accuracyInfo: document.getElementById('accuracy-info'),
      historyContainer: document.getElementById('attendance-history'),
      loadingOverlay: document.getElementById('loading-overlay')
    };
  }

  // 設定事件監聽器
  setupEventListeners() {
    // GPS回調設定
    this.gpsTracker.onPositionUpdate((position) => {
      this.handlePositionUpdate(position);
    });

    this.gpsTracker.onPositionError((error) => {
      this.handlePositionError(error);
    });

    // 打卡按鈕事件
    if (this.elements.clockInBtn) {
      this.elements.clockInBtn.addEventListener('click', () => {
        this.performClockAction('clock_in');
      });
    }

    if (this.elements.clockOutBtn) {
      this.elements.clockOutBtn.addEventListener('click', () => {
        this.performClockAction('clock_out');
      });
    }

    // 手動重新定位按鈕
    const refreshLocationBtn = document.getElementById('refresh-location');
    if (refreshLocationBtn) {
      refreshLocationBtn.addEventListener('click', () => {
        this.refreshLocation();
      });
    }
  }

  // 載入店面配置
  async loadStoreConfigurations() {
    try {
      const response = await fetch('/api/attendance/stores');
      const data = await response.json();
      
      if (data.success) {
        this.stores = data.stores;
        console.log('🏪 已載入店面配置:', this.stores.length, '個店面');
        this.updateMapDisplay();
      }
    } catch (error) {
      console.error('❌ 載入店面配置失敗:', error);
      this.showError('無法載入店面資訊');
    }
  }

  // 開始位置追蹤
  async startLocationTracking() {
    this.showLoadingStatus('正在請求位置權限...');
    
    try {
      // 檢查權限狀態
      const permissionStatus = await this.gpsTracker.requestLocationPermission();
      console.log('📍 位置權限狀態:', permissionStatus);

      if (permissionStatus === 'denied') {
        this.showError('位置權限被拒絕，請在瀏覽器設定中啟用位置存取');
        return;
      }

      this.showLoadingStatus('正在獲取GPS位置...');
      
      // 獲取當前位置
      const position = await this.gpsTracker.getCurrentPosition();
      this.handlePositionUpdate(position);

    } catch (error) {
      this.handlePositionError(error);
    }
  }

  // 處理位置更新
  async handlePositionUpdate(position) {
    console.log('📍 位置更新:', position);
    this.currentPosition = position;
    
    // 更新UI顯示
    this.updateLocationDisplay(position);
    
    // 驗證位置
    await this.validateLocation(position);
    
    // 隱藏載入中狀態
    this.hideLoadingStatus();
  }

  // 處理位置錯誤
  handlePositionError(error) {
    console.error('🚨 GPS錯誤:', error);
    this.hideLoadingStatus();
    
    let errorMessage = '位置獲取失敗';
    switch(error.type) {
      case 'PERMISSION_DENIED':
        errorMessage = '位置權限被拒絕，請允許瀏覽器存取位置';
        break;
      case 'POSITION_UNAVAILABLE':
        errorMessage = '無法獲取位置，請確保GPS功能正常';
        break;
      case 'TIMEOUT':
        errorMessage = '位置獲取逾時，請重新嘗試';
        break;
    }
    
    this.showError(errorMessage, error.suggestion);
    this.disableClockButtons();
  }

  // 更新位置顯示
  updateLocationDisplay(position) {
    // 更新GPS狀態
    if (this.elements.locationStatus) {
      const quality = position.quality;
      const statusText = `GPS已定位 (精度: ${position.accuracy.toFixed(0)}m, 品質: ${quality.level})`;
      this.elements.locationStatus.textContent = statusText;
      this.elements.locationStatus.className = `gps-indicator ${quality.level}`;
    }

    // 更新精度資訊
    if (this.elements.accuracyInfo) {
      const qualityEmoji = position.quality.score > 80 ? '🟢' : 
                          position.quality.score > 60 ? '🟡' : '🔴';
      this.elements.accuracyInfo.innerHTML = `
        ${qualityEmoji} 精度: ${position.accuracy.toFixed(0)}m 
        (品質分數: ${position.quality.score}/100)
      `;
    }

    // 更新地圖顯示
    this.updateMapDisplay();
  }

  // 驗證位置
  async validateLocation(position) {
    try {
      const response = await fetch('/api/attendance/validate-location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          latitude: position.latitude,
          longitude: position.longitude,
          accuracy: position.accuracy,
          timestamp: position.timestamp
        })
      });

      const data = await response.json();
      
      if (data.success) {
        this.validationResult = data.validation;
        this.updateValidationDisplay(data);
      } else {
        this.showError(data.error);
      }

    } catch (error) {
      console.error('❌ 位置驗證失敗:', error);
      this.showError('位置驗證服務異常');
    }
  }

  // 更新驗證結果顯示
  updateValidationDisplay(data) {
    const validation = data.validation;
    
    // 更新距離顯示
    if (this.elements.distanceText) {
      if (validation.validStores.length > 0) {
        const bestStore = validation.bestMatch;
        this.elements.distanceText.textContent = 
          `距離 ${bestStore.storeName}: ${bestStore.distance}m`;
      } else if (validation.nearbyStores.length > 0) {
        const nearestStore = validation.nearbyStores[0];
        this.elements.distanceText.textContent = 
          `距離 ${nearestStore.storeName}: ${nearestStore.distance}m (超出範圍)`;
      } else {
        this.elements.distanceText.textContent = '不在任何店面附近';
      }
    }

    // 更新店面資訊
    if (this.elements.storeInfo) {
      if (validation.validStores.length > 0) {
        const store = validation.bestMatch;
        this.elements.storeInfo.innerHTML = `
          <div class="store-valid">
            <h4>✅ ${store.storeName}</h4>
            <p>距離: ${store.distance}m (範圍: ${store.radius}m)</p>
            <p>信心度: ${store.confidence}%</p>
          </div>
        `;
      } else {
        this.elements.storeInfo.innerHTML = `
          <div class="store-invalid">
            <h4>❌ 無法打卡</h4>
            <p>請移動到店面範圍內</p>
          </div>
        `;
      }
    }

    // 更新打卡按鈕狀態
    this.updateClockButtons(validation.isValid);

    // 顯示異常檢測結果
    if (data.anomalyDetection && data.anomalyDetection.hasAnomalies) {
      this.showWarning('位置異常檢測', data.anomalyDetection.anomalies);
    }
  }

  // 更新地圖顯示
  updateMapDisplay() {
    if (!this.elements.mapContainer) return;

    // 這裡應該整合實際的地圖API (如Google Maps)
    // 現在使用簡化的視覺表示
    let mapHTML = '<div class="mock-map">';
    
    if (this.currentPosition) {
      mapHTML += `
        <div class="user-location">
          📍 您的位置
          <small>精度: ${this.currentPosition.accuracy.toFixed(0)}m</small>
        </div>
      `;

      // 顯示店面位置
      this.stores.forEach(store => {
        const distance = this.calculateDistance(
          this.currentPosition.latitude, 
          this.currentPosition.longitude,
          store.latitude, 
          store.longitude
        );

        const isInRange = distance <= store.radius;
        mapHTML += `
          <div class="store-location ${isInRange ? 'in-range' : 'out-range'}">
            🏪 ${store.displayName}
            <small>${Math.round(distance)}m</small>
          </div>
        `;
      });
    } else {
      mapHTML += '<div class="no-location">正在定位中...</div>';
    }

    mapHTML += '</div>';
    this.elements.mapContainer.innerHTML = mapHTML;
  }

  // 計算距離
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
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

  // 執行打卡動作
  async performClockAction(clockType) {
    if (!this.currentPosition) {
      this.showError('請等待GPS定位完成');
      return;
    }

    if (!this.validationResult || !this.validationResult.isValid) {
      this.showError('位置驗證失敗，無法打卡');
      return;
    }

    // 鎖定按鈕並顯示處理中狀態
    this.lockClockButtons(clockType);

    try {
      // 收集設備資訊
      const deviceInfo = this.collectDeviceInfo();

      // 發送打卡請求
      const response = await fetch('/api/attendance/clock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          employeeId: this.getUserId(), // 應該從登入狀態獲取
          employeeName: this.getUserName(), // 應該從登入狀態獲取
          clockType,
          latitude: this.currentPosition.latitude,
          longitude: this.currentPosition.longitude,
          accuracy: this.currentPosition.accuracy,
          deviceInfo
        })
      });

      const data = await response.json();

      if (data.success) {
        this.showSuccess(`${clockType === 'clock_in' ? '上班' : '下班'}打卡成功！`);
        this.refreshAttendanceHistory();
        
        // 顯示打卡結果
        this.displayClockResult(data.attendanceRecord);
      } else {
        this.showError(data.error);
      }

    } catch (error) {
      console.error('❌ 打卡失敗:', error);
      this.showError('打卡處理失敗，請重試');
    } finally {
      // 解鎖按鈕
      this.unlockClockButtons();
    }
  }

  // 收集設備資訊
  collectDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      pixelRatio: window.devicePixelRatio,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      deviceType: this.detectDeviceType(),
      os: this.detectOperatingSystem(),
      browser: this.detectBrowser()
    };
  }

  // 檢測設備類型
  detectDeviceType() {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
      return 'mobile';
    } else if (/tablet|ipad/i.test(userAgent)) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }

  // 檢測作業系統
  detectOperatingSystem() {
    const userAgent = navigator.userAgent;
    
    if (/Windows/i.test(userAgent)) return 'Windows';
    if (/Mac OS/i.test(userAgent)) return 'macOS';
    if (/Linux/i.test(userAgent)) return 'Linux';
    if (/Android/i.test(userAgent)) return 'Android';
    if (/iOS|iPhone|iPad|iPod/i.test(userAgent)) return 'iOS';
    
    return 'Unknown';
  }

  // 檢測瀏覽器
  detectBrowser() {
    const userAgent = navigator.userAgent;
    
    if (/Chrome/i.test(userAgent)) return 'Chrome';
    if (/Firefox/i.test(userAgent)) return 'Firefox';
    if (/Safari/i.test(userAgent)) return 'Safari';
    if (/Edge/i.test(userAgent)) return 'Edge';
    if (/Opera/i.test(userAgent)) return 'Opera';
    
    return 'Unknown';
  }

  // 更新打卡按鈕狀態
  updateClockButtons(isValid) {
    const buttons = [this.elements.clockInBtn, this.elements.clockOutBtn];
    
    buttons.forEach(button => {
      if (button) {
        if (isValid) {
          button.classList.remove('disabled');
          button.disabled = false;
        } else {
          button.classList.add('disabled');
          button.disabled = true;
        }
      }
    });
  }

  // 停用打卡按鈕
  disableClockButtons() {
    this.updateClockButtons(false);
  }

  // 鎖定打卡按鈕 (處理中狀態)
  lockClockButtons(clockType) {
    const allButtons = [this.elements.clockInBtn, this.elements.clockOutBtn];
    
    allButtons.forEach(button => {
      if (button) {
        button.classList.add('processing');
        button.disabled = true;
        
        // 更新按鈕文字
        if (button === this.elements.clockInBtn) {
          button.querySelector('.btn-text').textContent = 
            clockType === 'clock_in' ? '上班打卡中...' : '上班打卡';
        } else {
          button.querySelector('.btn-text').textContent = 
            clockType === 'clock_out' ? '下班打卡中...' : '下班打卡';
        }
      }
    });
  }

  // 解鎖打卡按鈕
  unlockClockButtons() {
    const allButtons = [this.elements.clockInBtn, this.elements.clockOutBtn];
    
    allButtons.forEach(button => {
      if (button) {
        button.classList.remove('processing');
        button.disabled = false;
        
        // 還原按鈕文字
        if (button === this.elements.clockInBtn) {
          button.querySelector('.btn-text').textContent = '上班打卡';
        } else {
          button.querySelector('.btn-text').textContent = '下班打卡';
        }
      }
    });

    // 重新檢查驗證狀態
    if (this.validationResult) {
      this.updateClockButtons(this.validationResult.isValid);
    }
  }

  // 手動重新定位
  async refreshLocation() {
    this.showLoadingStatus('重新定位中...');
    
    try {
      const position = await this.gpsTracker.getCurrentPosition({
        maximumAge: 0 // 強制獲取新的位置
      });
      
      this.handlePositionUpdate(position);
      this.showSuccess('位置已更新');
    } catch (error) {
      this.handlePositionError(error);
    }
  }

  // 顯示載入狀態
  showLoadingStatus(message) {
    if (this.elements.locationStatus) {
      this.elements.locationStatus.textContent = message;
      this.elements.locationStatus.className = 'gps-indicator loading';
    }

    if (this.elements.loadingOverlay) {
      this.elements.loadingOverlay.style.display = 'flex';
    }
  }

  // 隱藏載入狀態
  hideLoadingStatus() {
    if (this.elements.loadingOverlay) {
      this.elements.loadingOverlay.style.display = 'none';
    }
  }

  // 顯示成功訊息
  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  // 顯示錯誤訊息
  showError(message, suggestion = null) {
    let fullMessage = message;
    if (suggestion) {
      fullMessage += '\n建議: ' + suggestion;
    }
    this.showNotification(fullMessage, 'error');
  }

  // 顯示警告訊息
  showWarning(title, details) {
    const message = `${title}: ${JSON.stringify(details)}`;
    this.showNotification(message, 'warning');
  }

  // 通用通知顯示
  showNotification(message, type = 'info') {
    // 創建通知元素
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">${this.getNotificationIcon(type)}</span>
        <span class="notification-message">${message}</span>
        <button class="notification-close">&times;</button>
      </div>
    `;

    // 添加到頁面
    document.body.appendChild(notification);

    // 自動關閉
    setTimeout(() => {
      notification.remove();
    }, 5000);

    // 手動關閉
    notification.querySelector('.notification-close').addEventListener('click', () => {
      notification.remove();
    });
  }

  // 獲取通知圖示
  getNotificationIcon(type) {
    switch(type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  }

  // 顯示打卡結果
  displayClockResult(record) {
    const resultHTML = `
      <div class="clock-result">
        <h3>打卡成功 ✅</h3>
        <div class="result-details">
          <p><strong>時間:</strong> ${new Date(record.timestamp).toLocaleString()}</p>
          <p><strong>店面:</strong> ${record.storeName}</p>
          <p><strong>距離:</strong> ${record.distance}公尺</p>
          <p><strong>狀態:</strong> ${record.isLate ? `遲到 ${record.lateMinutes} 分鐘` : '準時'}</p>
        </div>
      </div>
    `;
    
    // 可以顯示在模態框或特定區域
    this.showNotification(resultHTML, 'success');
  }

  // 刷新出勤歷史記錄
  async refreshAttendanceHistory() {
    try {
      const employeeId = this.getUserId();
      const response = await fetch(`/api/attendance/history/${employeeId}`);
      const data = await response.json();
      
      if (data.success && this.elements.historyContainer) {
        this.updateHistoryDisplay(data.history);
      }
    } catch (error) {
      console.error('❌ 載入出勤歷史失敗:', error);
    }
  }

  // 更新歷史記錄顯示
  updateHistoryDisplay(history) {
    if (!this.elements.historyContainer) return;

    const historyHTML = history.map(record => `
      <div class="history-item">
        <div class="history-type ${record.clockType}">
          ${record.clockType === 'clock_in' ? '🟢 上班' : '🔴 下班'}
        </div>
        <div class="history-details">
          <div class="history-time">${new Date(record.timestamp).toLocaleString()}</div>
          <div class="history-location">${record.storeName} (${record.distance}m)</div>
          <div class="history-status ${record.status}">
            ${record.isLate ? '遲到' : '準時'} • ${record.status}
          </div>
        </div>
      </div>
    `).join('');

    this.elements.historyContainer.innerHTML = historyHTML;
  }

  // 獲取用戶ID (應該從實際登入系統獲取)
  getUserId() {
    return 'emp_001'; // 模擬數據
  }

  // 獲取用戶姓名 (應該從實際登入系統獲取)
  getUserName() {
    return '測試員工'; // 模擬數據
  }
}

// 頁面載入後初始化
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 GPS打卡系統初始化...');
  window.gpsAttendance = new GPSAttendanceClient();
});