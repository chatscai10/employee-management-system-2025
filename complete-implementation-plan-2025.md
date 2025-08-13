# 🏗️ 完整系統實現計劃 - 基於深度驗證結果

**基準**: 系統邏輯.txt (650行規格) + 通知模板.txt (301行模板)  
**當前狀態**: 25%完成度，146項功能缺失  
**目標**: 達到100%規格符合，實現完整可營運系統  
**執行時間**: 2025/8/9開始  

---

## 🎯 實現策略概述

### 📊 現狀分析
✅ **已完成 (25%)**:
- Node.js 18.x + Express 4.x 基礎架構
- 8大數據模型完整設計
- JWT安全認證系統
- 響應式登入註冊界面
- SQLite數據庫運行
- 基礎API框架

❌ **嚴重缺失 (75%)**:
- 9大核心業務系統完全未實現
- 29種Telegram通知模板缺失
- 3店面GPS定位配置未設定
- 複雜業務邏輯引擎未開發
- 員工操作界面統一設計未完成

### 🚨 緊急優先級分配
**🔥 第一優先級 (無法營運級別)**:
- GPS打卡系統 (15項功能)
- 營收管理系統 (12項功能)
- 員工統一界面 (20項功能)
- 管理員控制台 (25項功能)

**⚡ 第二優先級 (運營效率級別)**:
- Telegram通知系統 (25項模板)
- 叫貨管理系統 (10項功能)
- 排班管理系統 (18項功能)

**🌟 第三優先級 (完善功能級別)**:
- 升遷投票系統 (13項功能)
- 維修保養系統 (8項功能)

---

## 📅 詳細實現時程

### 🔥 第一階段 (7-10天) - 緊急核心功能

#### Day 1-2: GPS打卡系統實現
**目標**: 讓員工能在正確位置打卡

**1.1 GPS定位核心實現**
```javascript
// 實現 /public/js/attendance-gps.js
class AttendanceGPS {
  constructor() {
    this.stores = [
      {
        name: "內壢忠孝店",
        lat: 24.9748412,
        lng: 121.2556713,
        radius: 100000 // 特殊大範圍
      },
      {
        name: "桃園龍安店", 
        lat: 24.9880023,
        lng: 121.2812737,
        radius: 100
      },
      {
        name: "中壢龍崗店",
        lat: 24.9298502,
        lng: 121.2529472,
        radius: 100
      }
    ];
  }

  // HTML5 Geolocation API 實現
  getCurrentLocation() { /* 實現GPS獲取 */ }
  
  // 距離計算與範圍驗證
  validateLocation(userLat, userLng) { /* 實現範圍驗證 */ }
  
  // 地圖視覺化 (200m半徑顯示)
  renderMap() { /* 實現地圖顯示 */ }
}
```

**1.2 設備指紋檢測**
```javascript
// 實現 /utils/device-fingerprint.js
class DeviceFingerprint {
  generateFingerprint() {
    // 收集設備資訊: 螢幕尺寸、時區、語言、UserAgent等
    // 生成唯一設備ID
    // 存儲到資料庫並比對異常
  }
  
  detectAnomalies() {
    // 比對歷史設備指紋
    // 發送異常警告到Telegram
  }
}
```

**1.3 打卡狀態邏輯**
```javascript
// 實現 /routes/attendance.js 完整邏輯
router.post('/clock-in', async (req, res) => {
  // 1. GPS位置驗證
  // 2. 設備指紋檢測
  // 3. 上下班智能判斷
  // 4. 遲到計算 (累計統計)
  // 5. 資料庫存儲
  // 6. Telegram通知發送
});
```

#### Day 3-4: 營收管理系統實現
**目標**: 實現複雜獎金計算引擎

**2.1 獎金計算引擎**
```javascript
// 實現 /utils/bonus-calculator.js
class BonusCalculator {
  // 平日獎金: (收入-服務費) > 13000 取30%
  calculateWeekdayBonus(income, serviceFee) {
    const netIncome = income - (income * serviceFee);
    return netIncome > 13000 ? (netIncome - 13000) * 0.3 : 0;
  }
  
  // 假日獎金: (收入-服務費) > 0 取38%
  calculateHolidayBonus(income, serviceFee) {
    const netIncome = income - (income * serviceFee);
    return netIncome >= 0 ? netIncome * 0.38 : 0;
  }
}
```

**2.2 收入支出管理**
```javascript
// 實現 /models/revenue-config.js
const revenueConfig = {
  incomeTypes: [
    { name: "現場營業額", serviceFee: 0, includeInBonus: true },
    { name: "線上點餐", serviceFee: 0, includeInBonus: true },
    { name: "熊貓點餐", serviceFee: 0.35, includeInBonus: true },
    { name: "uber點餐", serviceFee: 0.35, includeInBonus: true },
    { name: "廢油回收", serviceFee: 0, includeInBonus: false }
  ],
  expenseTypes: [
    "瓦斯費", "水電費", "房租", "貨款", "清潔費", "其他支出"
  ],
  photoCategories: [
    "收入憑證", "支出憑證", "現金照片", "其他證明"
  ]
};
```

#### Day 5-6: 員工統一界面實現
**目標**: 一頁式設計+6大模組整合

**3.1 統一界面框架**
```html
<!-- 實現 /views/employee-dashboard.ejs -->
<div class="employee-dashboard">
  <!-- 頂部導航 -->
  <nav class="unified-nav">
    <button data-module="attendance">打卡</button>
    <button data-module="orders">叫貨</button>
    <button data-module="revenue">營收</button>
    <button data-module="schedule">排班</button>
    <button data-module="promotion">投票</button>
    <button data-module="maintenance">維修</button>
  </nav>
  
  <!-- 動態內容區域 -->
  <div class="module-container">
    <div class="module-content" data-module="attendance">
      <!-- 打卡系統界面 -->
    </div>
    <!-- 其他模組界面... -->
  </div>
</div>
```

**3.2 移動優先響應式設計**
```css
/* 實現 /public/css/employee-unified.css */
.employee-dashboard {
  /* 手機端優先設計 */
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
}

@media (min-width: 768px) {
  /* 平板適應 */
}

@media (min-width: 1024px) {
  /* 桌機適應 */
}
```

#### Day 7-8: 管理員控制台實現
**目標**: 完整的系統管理界面

**4.1 員工管理CRUD**
```javascript
// 實現 /routes/admin.js 完整功能
router.get('/employees', async (req, res) => {
  // 員工列表查詢+分頁+搜尋
});

router.post('/employees/:id/edit', async (req, res) => {
  // 員工資料編輯+狀態變更
});
```

**4.2 系統參數配置**
```html
<!-- 實現 /views/admin/system-config.ejs -->
<div class="config-panels">
  <div class="store-config">
    <!-- 3店面GPS參數設定 -->
  </div>
  <div class="revenue-config">
    <!-- 收入支出項目管理 -->
  </div>
  <div class="notification-config">
    <!-- Telegram通知開關 -->
  </div>
</div>
```

#### Day 9-10: 整合測試與基礎優化

---

### ⚡ 第二階段 (8-12天) - 運營效率系統

#### Day 11-13: Telegram通知系統實現
**目標**: 29種通知模板全部實現

**5.1 通知引擎實現**
```javascript
// 實現 /utils/telegram-notification-engine.js
class TelegramNotificationEngine {
  constructor() {
    this.botToken = 'process.env.TELEGRAM_BOT_TOKEN';
    this.bossGroupId = 'process.env.TELEGRAM_GROUP_ID';
    this.employeeGroupId = 'process.env.TELEGRAM_GROUP_ID';
  }
  
  // 16種老闆群組詳細通知
  async sendBossNotification(type, data) {
    const templates = {
      'revenue_submit': this.generateRevenueDetailedNotification,
      'new_registration': this.generateRegistrationDetailedNotification,
      'attendance_record': this.generateAttendanceDetailedNotification,
      // ... 其他13種
    };
  }
  
  // 13種員工群組簡化通知
  async sendEmployeeNotification(type, data) {
    const templates = {
      'new_employee': this.generateNewEmployeeSimpleNotification,
      'attendance_simple': this.generateAttendanceSimpleNotification,
      // ... 其他11種
    };
  }
}
```

#### Day 14-16: 叫貨管理系統
**目標**: 品項管理+異常監控

#### Day 17-20: 排班管理系統
**目標**: 6重複雜規則引擎實現

**7.1 排班規則引擎**
```javascript
// 實現 /utils/schedule-rule-engine.js
class ScheduleRuleEngine {
  validateScheduleRequest(employeeId, date, storeId) {
    // 規則1: 每人月休假上限8天
    // 規則2: 每日休假總上限2人
    // 規則3: 週五六日休假上限3天
    // 規則4: 同店每日休假上限1人
    // 規則5: 待命/兼職每日上限1人
    // 規則6: 操作時間5分鐘限制
  }
  
  checkTimeWindow() {
    // 每月16號02:00開啟 ~ 21號02:00關閉
  }
}
```

---

### 🌟 第三階段 (5-8天) - 完善功能

#### Day 21-23: 升遷投票系統
**目標**: 匿名投票+階級管理

#### Day 24-25: 維修保養系統
**目標**: 工單管理+照片上傳

---

## 🔧 技術實現詳細規格

### 📍 GPS打卡系統詳細規格
```javascript
// /models/AttendanceRecord.js 擴展
const AttendanceSchema = {
  id: { type: 'INTEGER', primaryKey: true },
  employeeId: { type: 'TEXT', required: true },
  employeeName: { type: 'TEXT', required: true },
  storeId: { type: 'TEXT', required: true },
  storeName: { type: 'TEXT', required: true },
  clockType: { type: 'TEXT', enum: ['clock_in', 'clock_out'] },
  timestamp: { type: 'DATETIME', required: true },
  coordinates: { type: 'TEXT', required: true }, // "lat,lng"
  distance: { type: 'REAL', required: true }, // 距離店面公尺數
  deviceFingerprint: { type: 'TEXT', required: true },
  isLate: { type: 'BOOLEAN', default: false },
  lateMinutes: { type: 'INTEGER', default: 0 },
  monthlyLateTotal: { type: 'INTEGER', default: 0 }, // 本月累計遲到
  photo: { type: 'TEXT' }, // 打卡照片路徑
  deviceInfo: { type: 'JSON' }, // 設備詳細資訊
  ipAddress: { type: 'TEXT' },
  status: { type: 'TEXT', enum: ['valid', 'suspicious', 'invalid'] },
  validationNotes: { type: 'TEXT' }
};
```

### 💰 營收管理系統詳細規格
```javascript
// /models/RevenueRecord.js 擴展
const RevenueSchema = {
  id: { type: 'INTEGER', primaryKey: true },
  employeeId: { type: 'TEXT', required: true },
  employeeName: { type: 'TEXT', required: true },
  storeId: { type: 'TEXT', required: true },
  storeName: { type: 'TEXT', required: true },
  businessDate: { type: 'DATE', required: true },
  submitTime: { type: 'DATETIME', required: true },
  isHoliday: { type: 'BOOLEAN', required: true },
  
  // 收入項目
  onSiteRevenue: { type: 'REAL', default: 0 },
  onlineRevenue: { type: 'REAL', default: 0 },
  pandaRevenue: { type: 'REAL', default: 0 },
  uberRevenue: { type: 'REAL', default: 0 },
  oilRecyclingRevenue: { type: 'REAL', default: 0 },
  
  // 支出項目
  gasExpense: { type: 'REAL', default: 0 },
  utilityExpense: { type: 'REAL', default: 0 },
  rentExpense: { type: 'REAL', default: 0 },
  goodsExpense: { type: 'REAL', default: 0 },
  cleaningExpense: { type: 'REAL', default: 0 },
  otherExpense: { type: 'REAL', default: 0 },
  
  // 計算結果
  totalIncome: { type: 'REAL', required: true },
  totalExpense: { type: 'REAL', required: true },
  netIncome: { type: 'REAL', required: true },
  totalServiceFee: { type: 'REAL', required: true },
  finalIncome: { type: 'REAL', required: true }, // 扣除服務費後
  bonusAmount: { type: 'REAL', required: true },
  isQualified: { type: 'BOOLEAN', required: true }, // 是否達標
  shortfall: { type: 'REAL', default: 0 }, // 未達標差距
  
  // 照片證明
  incomePhotos: { type: 'JSON' }, // 收入憑證照片陣列
  expensePhotos: { type: 'JSON' }, // 支出憑證照片陣列
  cashPhotos: { type: 'JSON' }, // 現金照片陣列
  otherPhotos: { type: 'JSON' }, // 其他證明照片陣列
  
  // 訂單資訊
  orderCount: { type: 'INTEGER' },
  averageOrderValue: { type: 'REAL' },
  
  // 狀態管理
  status: { type: 'TEXT', enum: ['active', 'voided'], default: 'active' },
  voidedBy: { type: 'TEXT' },
  voidedAt: { type: 'DATETIME' },
  voidReason: { type: 'TEXT' }
};
```

### 🏪 店面配置詳細規格
```javascript
// /config/stores.js
const storeConfigurations = [
  {
    id: 'ZL_ZHONGXIAO',
    name: '內壢忠孝店',
    displayName: '內壢 忠孝店',
    address: '桃園市中壢區忠孝路XXX號',
    gps: {
      latitude: 24.9748412,
      longitude: 121.2556713,
      accuracy: 10 // GPS精度要求(公尺)
    },
    clockingRadius: 100000, // 打卡範圍(公尺) - 特殊大範圍
    mapDisplayRadius: 200, // 地圖顯示範圍(公尺)
    workHours: {
      weekday: { open: '09:00', close: '22:00' },
      weekend: { open: '09:00', close: '23:00' }
    },
    lateThreshold: 15, // 遲到閾值(分鐘)
    contactInfo: {
      phone: '03-XXXX-XXXX',
      manager: '店長姓名'
    }
  },
  {
    id: 'TY_LONGAN',
    name: '桃園龍安店',
    displayName: '桃園 龍安店',
    address: '桃園市桃園區龍安街XXX號',
    gps: {
      latitude: 24.9880023,
      longitude: 121.2812737,
      accuracy: 10
    },
    clockingRadius: 100, // 標準範圍
    mapDisplayRadius: 200,
    // ... 其他配置相同
  },
  {
    id: 'ZL_LONGGANG',
    name: '中壢龍崗店', 
    displayName: '中壢 龍崗店',
    address: '桃園市中壢區龍崗路XXX號',
    gps: {
      latitude: 24.9298502,
      longitude: 121.2529472,
      accuracy: 10
    },
    clockingRadius: 100, // 標準範圍
    mapDisplayRadius: 200,
    // ... 其他配置相同
  }
];
```

---

## 🌐 前端界面詳細規格

### 📱 員工一頁式界面設計
```html
<!-- /views/employee-unified-dashboard.ejs -->
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>員工系統 - 統一操作界面</title>
  <link rel="stylesheet" href="/css/employee-unified.css">
  <link rel="stylesheet" href="/css/mobile-first.css">
</head>
<body class="mobile-first">
  <div class="unified-dashboard">
    <!-- 頂部狀態列 -->
    <header class="status-bar">
      <div class="employee-info">
        <span class="name"><%= employee.name %></span>
        <span class="store"><%= employee.currentStore %></span>
        <span class="position"><%= employee.position %></span>
      </div>
      <div class="system-status">
        <span class="connection-status online">●</span>
        <span class="time" id="current-time"></span>
      </div>
    </header>

    <!-- 功能導航列 -->
    <nav class="function-nav">
      <button class="nav-btn active" data-module="attendance">
        <i class="icon-clock"></i>
        <span>打卡</span>
      </button>
      <button class="nav-btn" data-module="orders">
        <i class="icon-shopping"></i>
        <span>叫貨</span>
      </button>
      <button class="nav-btn" data-module="revenue">
        <i class="icon-money"></i>
        <span>營收</span>
      </button>
      <button class="nav-btn" data-module="schedule">
        <i class="icon-calendar"></i>
        <span>排班</span>
      </button>
      <button class="nav-btn" data-module="promotion">
        <i class="icon-vote"></i>
        <span>投票</span>
      </button>
      <button class="nav-btn" data-module="maintenance">
        <i class="icon-tool"></i>
        <span>維修</span>
      </button>
    </nav>

    <!-- 動態內容區域 -->
    <main class="content-area">
      <!-- 打卡模組 -->
      <div class="module-panel" id="attendance-panel">
        <div class="module-header">
          <h2>GPS定位打卡</h2>
          <div class="location-status">
            <span class="gps-indicator" id="gps-status">定位中...</span>
          </div>
        </div>
        
        <!-- 地圖顯示區域 -->
        <div class="map-container">
          <div id="attendance-map" class="gps-map"></div>
          <div class="map-overlay">
            <div class="distance-info">
              <span id="distance-text">計算距離中...</span>
            </div>
          </div>
        </div>

        <!-- 打卡操作區域 -->
        <div class="clock-actions">
          <button id="clock-in-btn" class="action-btn primary disabled">
            <span class="btn-text">上班打卡</span>
            <span class="btn-status"></span>
          </button>
          <button id="clock-out-btn" class="action-btn secondary disabled">
            <span class="btn-text">下班打卡</span>
            <span class="btn-status"></span>
          </button>
        </div>

        <!-- 最近打卡記錄 -->
        <div class="recent-records">
          <h3>最近5次打卡記錄</h3>
          <div class="records-list">
            <!-- 動態載入打卡記錄 -->
          </div>
        </div>
      </div>

      <!-- 營收模組 -->
      <div class="module-panel" id="revenue-panel" style="display:none;">
        <div class="module-header">
          <h2>營收記錄</h2>
          <div class="bonus-indicator">
            <span class="bonus-status" id="bonus-status">未計算</span>
          </div>
        </div>

        <!-- 收入項目 -->
        <div class="income-section">
          <h3>收入項目</h3>
          <div class="input-group">
            <label for="onsite-revenue">現場營業額</label>
            <input type="number" id="onsite-revenue" placeholder="0" min="0" step="0.01">
          </div>
          <div class="input-group">
            <label for="online-revenue">線上點餐</label>
            <input type="number" id="online-revenue" placeholder="0" min="0" step="0.01">
          </div>
          <div class="input-group">
            <label for="panda-revenue">熊貓點餐 (服務費35%)</label>
            <input type="number" id="panda-revenue" placeholder="0" min="0" step="0.01">
          </div>
          <div class="input-group">
            <label for="uber-revenue">Uber點餐 (服務費35%)</label>
            <input type="number" id="uber-revenue" placeholder="0" min="0" step="0.01">
          </div>
          <div class="input-group">
            <label for="oil-revenue">廢油回收 (不計獎金)</label>
            <input type="number" id="oil-revenue" placeholder="0" min="0" step="0.01">
          </div>
        </div>

        <!-- 支出項目 -->
        <div class="expense-section">
          <h3>支出項目</h3>
          <div class="input-group">
            <label for="gas-expense">瓦斯費</label>
            <input type="number" id="gas-expense" placeholder="0" min="0" step="0.01">
          </div>
          <!-- ... 其他支出項目 ... -->
        </div>

        <!-- 獎金計算顯示 -->
        <div class="bonus-calculation">
          <div class="calc-summary">
            <div class="calc-item">
              <span class="label">總收入:</span>
              <span class="value" id="total-income">NT$ 0</span>
            </div>
            <div class="calc-item">
              <span class="label">服務費:</span>
              <span class="value" id="service-fee">NT$ 0</span>
            </div>
            <div class="calc-item highlight">
              <span class="label">獎金:</span>
              <span class="value" id="bonus-amount">NT$ 0</span>
            </div>
          </div>
        </div>

        <!-- 照片上傳 -->
        <div class="photo-upload">
          <h3>憑證照片</h3>
          <div class="photo-categories">
            <div class="photo-group">
              <label>收入憑證</label>
              <input type="file" multiple accept="image/*" data-category="income">
            </div>
            <!-- ... 其他照片類別 ... -->
          </div>
        </div>

        <!-- 提交按鈕 -->
        <div class="submit-actions">
          <button id="submit-revenue" class="action-btn primary">
            <span class="btn-text">提交營收記錄</span>
            <span class="btn-status"></span>
          </button>
        </div>

        <!-- 歷史記錄 -->
        <div class="revenue-history">
          <h3>各分店最近記錄 (各顯示3筆)</h3>
          <div class="store-records">
            <!-- 動態載入各店營收記錄 -->
          </div>
        </div>
      </div>

      <!-- 其他模組面板... -->
    </main>
  </div>

  <!-- JavaScript -->
  <script src="/js/employee-unified.js"></script>
  <script src="/js/attendance-gps.js"></script>
  <script src="/js/revenue-calculator.js"></script>
  <script src="/js/mobile-optimized.js"></script>
</body>
</html>
```

### 📱 移動優先CSS樣式
```css
/* /public/css/mobile-first.css */

/* 基礎重置 */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body.mobile-first {
  font-family: 'Microsoft JhengHei', 'PingFang TC', sans-serif;
  font-size: 16px; /* 確保手機端可讀性 */
  line-height: 1.6;
  color: #333;
  background: #f5f5f5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 統一儀表板 */
.unified-dashboard {
  max-width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 狀態列 */
.status-bar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
}

.employee-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.employee-info .name {
  font-weight: 600;
  font-size: 14px;
}

.employee-info .store,
.employee-info .position {
  font-size: 12px;
  opacity: 0.9;
}

/* 功能導航 - 手機端優化 */
.function-nav {
  display: flex;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  position: sticky;
  top: 60px;
  z-index: 99;
}

.nav-btn {
  flex: 1;
  min-width: 80px;
  padding: 12px 8px;
  border: none;
  background: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
  transition: all 0.3s ease;
  cursor: pointer;
  touch-action: manipulation; /* 優化觸控響應 */
}

.nav-btn:active {
  background: #f0f0f0;
  transform: scale(0.95);
}

.nav-btn.active {
  color: #667eea;
  border-bottom: 2px solid #667eea;
}

.nav-btn i {
  font-size: 18px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 內容區域 */
.content-area {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.module-panel {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}

/* 地圖容器 - 手機端優化 */
.map-container {
  position: relative;
  height: 250px;
  margin: 16px 0;
  border-radius: 8px;
  overflow: hidden;
}

.gps-map {
  width: 100%;
  height: 100%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
}

.map-overlay {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(255,255,255,0.9);
  padding: 6px 10px;
  border-radius: 16px;
  font-size: 12px;
  backdrop-filter: blur(4px);
}

/* 操作按鈕 - 觸控友好 */
.action-btn {
  width: 100%;
  padding: 16px;
  margin: 8px 0;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  touch-action: manipulation;
  position: relative;
  overflow: hidden;
}

.action-btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.action-btn.secondary {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.action-btn:active {
  transform: scale(0.98);
}

.action-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.action-btn.processing {
  background: #ccc;
  cursor: not-allowed;
}

.action-btn.processing::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  margin: -10px 0 0 -10px;
  border: 2px solid #fff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 輸入欄位 - 手機端優化 */
.input-group {
  margin-bottom: 16px;
}

.input-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.input-group input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 16px; /* 防止iOS縮放 */
  transition: border-color 0.3s ease;
}

.input-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* 計算結果顯示 */
.calc-summary {
  background: #f8f9ff;
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
}

.calc-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.calc-item.highlight {
  font-size: 16px;
  font-weight: 600;
  color: #667eea;
  border-top: 1px solid #e0e0e0;
  padding-top: 8px;
}

/* 記錄列表 */
.records-list,
.store-records {
  max-height: 300px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.record-item {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
}

.record-item:last-child {
  border-bottom: none;
}

/* 照片上傳 */
.photo-group {
  margin-bottom: 16px;
}

.photo-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.photo-group input[type="file"] {
  width: 100%;
  padding: 8px;
  border: 2px dashed #ddd;
  border-radius: 6px;
  background: #fafafa;
  font-size: 14px;
}

/* 平板端適應 */
@media (min-width: 768px) {
  .unified-dashboard {
    max-width: 768px;
    margin: 0 auto;
  }
  
  .content-area {
    padding: 24px;
  }
  
  .nav-btn {
    min-width: 100px;
    font-size: 13px;
  }
  
  .map-container {
    height: 300px;
  }
}

/* 桌機端適應 */
@media (min-width: 1024px) {
  .unified-dashboard {
    max-width: 1024px;
  }
  
  .content-area {
    padding: 32px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }
  
  .module-panel {
    margin-bottom: 0;
  }
  
  .function-nav {
    justify-content: center;
  }
  
  .nav-btn {
    min-width: 120px;
    font-size: 14px;
  }
}

/* 離線狀態指示 */
.offline-indicator {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: #ff5722;
  color: white;
  text-align: center;
  padding: 8px;
  font-size: 14px;
  z-index: 1000;
  transform: translateY(-100%);
  transition: transform 0.3s ease;
}

.offline-indicator.show {
  transform: translateY(0);
}

/* 載入中狀態 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255,255,255,0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f0f0f0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* 無障礙優化 */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* 高對比模式 */
@media (prefers-contrast: high) {
  .action-btn.primary {
    background: #000;
    border: 2px solid #fff;
  }
  
  .action-btn.secondary {
    background: #333;
    border: 2px solid #fff;
  }
  
  .input-group input {
    border-width: 3px;
  }
}

/* Dark mode 準備 */
@media (prefers-color-scheme: dark) {
  body.mobile-first {
    background: #1a1a1a;
    color: #f0f0f0;
  }
  
  .module-panel {
    background: #2d2d2d;
    color: #f0f0f0;
  }
  
  .function-nav {
    background: #2d2d2d;
    border-bottom-color: #444;
  }
  
  .nav-btn {
    color: #ccc;
  }
  
  .nav-btn.active {
    color: #8fa4f3;
  }
  
  .input-group input {
    background: #3d3d3d;
    border-color: #555;
    color: #f0f0f0;
  }
}
```

---

## 🤖 Telegram通知系統詳細實現

### 📱 通知引擎完整實現
```javascript
// /utils/telegram-notification-engine.js
class TelegramNotificationEngine {
  constructor() {
    this.botToken = 'process.env.TELEGRAM_BOT_TOKEN';
    this.bossGroupId = 'process.env.TELEGRAM_GROUP_ID';
    this.employeeGroupId = 'process.env.TELEGRAM_GROUP_ID';
    this.apiUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  // 統一發送方法
  async sendMessage(chatId, message, options = {}) {
    try {
      const response = await fetch(`${this.apiUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
          ...options
        })
      });
      
      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Telegram notification failed:', error);
      throw error;
    }
  }

  // 16種老闆群組詳細通知模板

  // 1. 營業額提交詳細數據通知
  async sendRevenueDetailedNotification(revenueData) {
    const message = `
🏪 <b>${revenueData.storeName} 營業額提交</b>

👤 <b>提交員工:</b> ${revenueData.employeeName}
📅 <b>營業日期:</b> ${revenueData.businessDate}
⏰ <b>提交時間:</b> ${revenueData.submitTime}
📊 <b>日期類型:</b> ${revenueData.isHoliday ? '假日' : '平日'}

💰 <b>收入明細:</b>
├ 現場營業額: NT$ ${revenueData.onSiteRevenue.toLocaleString()}
├ 線上點餐: NT$ ${revenueData.onlineRevenue.toLocaleString()}
├ 熊貓點餐: NT$ ${revenueData.pandaRevenue.toLocaleString()} (服務費35%)
├ Uber點餐: NT$ ${revenueData.uberRevenue.toLocaleString()} (服務費35%)
└ 廢油回收: NT$ ${revenueData.oilRevenue.toLocaleString()} (不計獎金)

💸 <b>支出明細:</b>
├ 瓦斯費: NT$ ${revenueData.gasExpense.toLocaleString()}
├ 水電費: NT$ ${revenueData.utilityExpense.toLocaleString()}
├ 房租: NT$ ${revenueData.rentExpense.toLocaleString()}
├ 貨款: NT$ ${revenueData.goodsExpense.toLocaleString()}
├ 清潔費: NT$ ${revenueData.cleaningExpense.toLocaleString()}
└ 其他支出: NT$ ${revenueData.otherExpense.toLocaleString()}

📊 <b>計算結果:</b>
├ 總收入: NT$ ${revenueData.totalIncome.toLocaleString()}
├ 總支出: NT$ ${revenueData.totalExpense.toLocaleString()}
├ 淨收入: NT$ ${revenueData.netIncome.toLocaleString()}
├ 服務費: NT$ ${revenueData.totalServiceFee.toLocaleString()}
├ 最終收入: NT$ ${revenueData.finalIncome.toLocaleString()}
└ 獎金金額: NT$ ${revenueData.bonusAmount.toLocaleString()}

${revenueData.isQualified ? 
  '🎉 <b>狀態:</b> 達標 ✅' : 
  `⚠️ <b>狀態:</b> 未達標 (差距 NT$ ${revenueData.shortfall.toLocaleString()})`
}

📸 <b>憑證照片:</b>
├ 收入憑證: ${revenueData.incomePhotos?.length || 0} 張
├ 支出憑證: ${revenueData.expensePhotos?.length || 0} 張
├ 現金照片: ${revenueData.cashPhotos?.length || 0} 張
└ 其他證明: ${revenueData.otherPhotos?.length || 0} 張

📈 <b>訂單統計:</b>
├ 總訂單數: ${revenueData.orderCount || 0} 筆
└ 平均客單價: NT$ ${(revenueData.averageOrderValue || 0).toLocaleString()}
    `;

    return await this.sendMessage(this.bossGroupId, message);
  }

  // 2. 新人註冊完整資訊通知
  async sendRegistrationDetailedNotification(employeeData) {
    const message = `
👥 <b>新員工註冊申請</b>

📋 <b>基本資料:</b>
├ 姓名: ${employeeData.name}
├ 身分證: ${employeeData.idNumber}
├ 出生日期: ${employeeData.birthDate}
├ 性別: ${employeeData.gender}
├ 持有駕照: ${employeeData.drivingLicense}

📞 <b>聯絡資訊:</b>
├ 電話: ${employeeData.phone}
├ 地址: ${employeeData.address}
├ 緊急聯絡人: ${employeeData.emergencyContact}
├ 關係: ${employeeData.relationship}
└ 緊急聯絡電話: ${employeeData.emergencyPhone}

🏢 <b>工作資訊:</b>
├ 到職日: ${employeeData.startDate}
├ 分派店面: ${employeeData.assignedStore}
├ 職位: ${employeeData.position}
└ 狀態: ${employeeData.status}

🔗 <b>系統資訊:</b>
├ 員工編號: ${employeeData.employeeId}
├ LINE ID: ${employeeData.lineUserId || '未綁定'}
├ 註冊時間: ${employeeData.registrationTime}
└ IP地址: ${employeeData.ipAddress}

⚠️ <b>待辦事項:</b>
□ 管理員審核資料
□ 設定系統權限
□ 安排職前訓練
□ 綁定LINE通知
    `;

    return await this.sendMessage(this.bossGroupId, message);
  }

  // 3. 員工GPS打卡+設備指紋詳細
  async sendAttendanceDetailedNotification(attendanceData) {
    const message = `
📍 <b>員工打卡記錄</b>

👤 <b>員工資訊:</b>
├ 姓名: ${attendanceData.employeeName}
├ 員工編號: ${attendanceData.employeeId}
└ 打卡類型: ${attendanceData.clockType === 'clock_in' ? '上班打卡 🟢' : '下班打卡 🔴'}

🏪 <b>店面資訊:</b>
├ 店面: ${attendanceData.storeName}
├ 打卡時間: ${attendanceData.timestamp}
└ 距離: ${attendanceData.distance}公尺

📍 <b>GPS定位:</b>
├ 座標: ${attendanceData.coordinates}
├ 定位精度: ${attendanceData.accuracy || '未知'}公尺
└ 位置狀態: ${attendanceData.status === 'valid' ? '正常 ✅' : attendanceData.status === 'suspicious' ? '可疑 ⚠️' : '異常 ❌'}

⏰ <b>時間分析:</b>
${attendanceData.isLate ? 
  `├ 遲到狀況: 遲到 ${attendanceData.lateMinutes} 分鐘 ⚠️\n└ 本月累計: 遲到 ${attendanceData.monthlyLateTotal} 分鐘` :
  '├ 時間狀況: 準時 ✅\n└ 本月累計: 無遲到記錄'
}

🔐 <b>設備指紋:</b>
├ 設備ID: ${attendanceData.deviceFingerprint}
├ 裝置類型: ${attendanceData.deviceInfo?.type || '未知'}
├ 作業系統: ${attendanceData.deviceInfo?.os || '未知'}
├ 瀏覽器: ${attendanceData.deviceInfo?.browser || '未知'}
├ 螢幕解析度: ${attendanceData.deviceInfo?.screenResolution || '未知'}
└ IP位址: ${attendanceData.ipAddress}

${attendanceData.status === 'suspicious' ? 
  '⚠️ <b>異常警告:</b>\n設備指紋與歷史記錄不符，建議人工確認' : 
  attendanceData.status === 'invalid' ? 
  '❌ <b>嚴重警告:</b>\n定位或設備異常，可能存在作弊行為' : 
  '✅ 所有驗證通過，打卡記錄正常'
}

📸 打卡照片: ${attendanceData.photo ? '已上傳 ✅' : '未上傳 ⚠️'}
    `;

    return await this.sendMessage(this.bossGroupId, message);
  }

  // 4. 叫貨記錄+異常天數分析
  async sendOrderDetailedNotification(orderData) {
    const message = `
📦 <b>叫貨記錄提交</b>

👤 <b>操作員工:</b> ${orderData.employeeName}
🏪 <b>操作店面:</b> ${orderData.storeName}
📅 <b>叫貨日期:</b> ${orderData.orderDate}
⏰ <b>提交時間:</b> ${orderData.submitTime}

📋 <b>叫貨明細:</b>
${orderData.items.map(item => 
  `├ ${item.name}: ${item.quantity} ${item.unit}`
).join('\n')}

🏭 <b>供應商分布:</b>
${orderData.supplierBreakdown.map(supplier => 
  `├ ${supplier.name}: ${supplier.itemCount} 項品項`
).join('\n')}

📊 <b>異常天數分析:</b>
${orderData.abnormalItems.length > 0 ? 
  orderData.abnormalItems.map(item => 
    `⚠️ ${item.name}: 距離上次叫貨 ${item.daysSinceLastOrder} 天 ${item.daysSinceLastOrder > 7 ? '(異常)' : ''}`
  ).join('\n') :
  '✅ 所有品項叫貨頻率正常'
}

💰 <b>預估成本:</b>
├ 總品項數: ${orderData.totalItems} 項
├ 預估金額: NT$ ${orderData.estimatedCost?.toLocaleString() || '未計算'}
└ 上月同期: NT$ ${orderData.lastMonthComparison?.toLocaleString() || '無資料'}

📈 <b>庫存建議:</b>
${orderData.stockSuggestions?.length > 0 ?
  orderData.stockSuggestions.map(suggestion => 
    `💡 ${suggestion.item}: ${suggestion.recommendation}`
  ).join('\n') :
  '📊 庫存水位正常'
}
    `;

    return await this.sendMessage(this.bossGroupId, message);
  }

  // 5-16. 其他12種老闆群組通知... (類似實現)

  // 13種員工群組簡化通知

  // 1. 新人登錄簡訊
  async sendNewEmployeeSimpleNotification(employeeData) {
    const message = `
👋 歡迎新同事加入！

🆕 ${employeeData.name} 已加入 ${employeeData.assignedStore}
📅 到職日期: ${employeeData.startDate}
💼 職位: ${employeeData.position}

期待與您一起工作！🎉
    `;

    return await this.sendMessage(this.employeeGroupId, message);
  }

  // 2. 員工上班打卡簡訊
  async sendAttendanceSimpleNotification(attendanceData) {
    const message = `
${attendanceData.clockType === 'clock_in' ? '🟢' : '🔴'} ${attendanceData.employeeName} 
${attendanceData.clockType === 'clock_in' ? '上班' : '下班'}打卡成功

🏪 ${attendanceData.storeName}
⏰ ${new Date(attendanceData.timestamp).toLocaleTimeString()}
${attendanceData.isLate ? `⚠️ 遲到${attendanceData.lateMinutes}分鐘` : ''}
    `;

    return await this.sendMessage(this.employeeGroupId, message);
  }

  // 3-13. 其他11種員工群組通知... (類似實現)

  // 自動觸發系統
  async triggerNotification(event, data) {
    try {
      switch (event) {
        case 'revenue_submit':
          await this.sendRevenueDetailedNotification(data);
          break;
        case 'employee_register':
          await this.sendRegistrationDetailedNotification(data);
          await this.sendNewEmployeeSimpleNotification(data);
          break;
        case 'attendance_record':
          await this.sendAttendanceDetailedNotification(data);
          await this.sendAttendanceSimpleNotification(data);
          break;
        case 'order_submit':
          await this.sendOrderDetailedNotification(data);
          break;
        // ... 其他事件觸發
        default:
          console.warn(`Unknown notification event: ${event}`);
      }
    } catch (error) {
      console.error(`Notification trigger failed for ${event}:`, error);
      // 可以考慮重試機制或錯誤通知
    }
  }
}

module.exports = TelegramNotificationEngine;
```

---

## 🧪 智慧瀏覽器完整驗證實現

### 🌐 智慧瀏覽器驗證引擎
```javascript
// /utils/smart-browser-verification-engine.js
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class SmartBrowserVerificationEngine {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.browser = null;
    this.page = null;
    this.verificationResults = [];
    this.screenshots = [];
  }

  async initialize() {
    this.browser = await puppeteer.launch({
      headless: false, // 顯示瀏覽器窗口
      devtools: true,
      slowMo: 50,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--allow-running-insecure-content'
      ]
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 375, height: 667 }); // iPhone尺寸
    
    // 監聽console輸出
    this.page.on('console', msg => {
      console.log(`Browser Console: ${msg.text()}`);
    });

    // 監聽網路請求
    this.page.on('response', response => {
      if (response.status() >= 400) {
        console.warn(`Network Error: ${response.url()} - ${response.status()}`);
      }
    });
  }

  async takeScreenshot(name) {
    const filename = `verification-${Date.now()}-${name}.png`;
    const filepath = path.join(__dirname, '../screenshots', filename);
    await this.page.screenshot({ path: filepath, fullPage: true });
    this.screenshots.push({ name, filepath, timestamp: new Date() });
    return filepath;
  }

  async verifySystem() {
    console.log('🚀 開始智慧瀏覽器完整驗證...');
    
    try {
      await this.initialize();

      // 第1階段: 基礎功能驗證
      await this.verifyBasicFunctionality();
      
      // 第2階段: GPS打卡系統驗證
      await this.verifyGPSAttendanceSystem();
      
      // 第3階段: 營收管理系統驗證
      await this.verifyRevenueManagementSystem();
      
      // 第4階段: 員工操作界面驗證
      await this.verifyEmployeeInterface();
      
      // 第5階段: 管理員控制台驗證
      await this.verifyAdminConsole();
      
      // 第6階段: Telegram通知驗證
      await this.verifyTelegramNotifications();
      
      // 第7階段: 整合功能驗證
      await this.verifyIntegrationFeatures();

      // 生成完整驗證報告
      await this.generateVerificationReport();

    } catch (error) {
      console.error('驗證過程出錯:', error);
      await this.recordError('System Verification', error.message);
    } finally {
      await this.cleanup();
    }

    return this.verificationResults;
  }

  async verifyBasicFunctionality() {
    console.log('📋 階段1: 基礎功能驗證');

    // 1.1 首頁載入測試
    await this.testStep('首頁載入', async () => {
      const startTime = Date.now();
      await this.page.goto(this.baseUrl);
      const loadTime = Date.now() - startTime;
      
      await this.takeScreenshot('homepage-load');
      
      const title = await this.page.title();
      if (!title || title.includes('Error')) {
        throw new Error('首頁載入失敗或包含錯誤');
      }
      
      return { loadTime, title };
    });

    // 1.2 登入功能測試
    await this.testStep('登入功能', async () => {
      // 導航到登入頁面
      await this.page.goto(`${this.baseUrl}/login`);
      await this.page.waitForSelector('#loginForm', { timeout: 5000 });
      
      // 測試登入表單
      await this.page.type('#name', '測試員工');
      await this.page.type('#idNumber', 'A123456789');
      
      await this.takeScreenshot('login-form-filled');
      
      // 點擊登入按鈕
      await this.page.click('#loginBtn');
      
      // 等待登入結果
      await this.page.waitForTimeout(2000);
      const currentUrl = this.page.url();
      
      return { loginAttempted: true, redirectUrl: currentUrl };
    });

    // 1.3 API端點測試
    const apiEndpoints = [
      '/api/attendance',
      '/api/revenue', 
      '/api/orders',
      '/api/schedule',
      '/api/promotion',
      '/api/maintenance',
      '/api/admin'
    ];

    for (const endpoint of apiEndpoints) {
      await this.testStep(`API端點 ${endpoint}`, async () => {
        const response = await this.page.evaluate(async (url) => {
          const res = await fetch(url);
          return { status: res.status, ok: res.ok };
        }, `${this.baseUrl}${endpoint}`);
        
        return response;
      });
    }
  }

  async verifyGPSAttendanceSystem() {
    console.log('📍 階段2: GPS打卡系統驗證');

    // 2.1 GPS定位功能測試
    await this.testStep('GPS定位權限', async () => {
      await this.page.goto(`${this.baseUrl}/employee-dashboard`);
      
      // 模擬授予位置權限
      const context = this.browser.defaultBrowserContext();
      await context.overridePermissions(this.baseUrl, ['geolocation']);
      
      // 設置模擬GPS座標 (內壢忠孝店)
      await this.page.setGeolocation({
        latitude: 24.9748412,
        longitude: 121.2556713
      });
      
      await this.takeScreenshot('gps-permission-granted');
      
      return { geolocationSet: true };
    });

    // 2.2 地圖顯示測試
    await this.testStep('地圖顯示功能', async () => {
      // 點擊打卡選項
      await this.page.click('[data-module="attendance"]');
      await this.page.waitForSelector('#attendance-map', { timeout: 5000 });
      
      await this.takeScreenshot('attendance-map-display');
      
      // 檢查地圖元素是否存在
      const mapExists = await this.page.$('#attendance-map') !== null;
      const distanceInfo = await this.page.textContent('#distance-text');
      
      return { mapDisplayed: mapExists, distanceInfo };
    });

    // 2.3 打卡按鈕功能測試
    await this.testStep('打卡按鈕功能', async () => {
      // 檢查打卡按鈕狀態
      const clockInBtn = await this.page.$('#clock-in-btn');
      const clockOutBtn = await this.page.$('#clock-out-btn');
      
      const clockInDisabled = await this.page.$eval('#clock-in-btn', 
        el => el.classList.contains('disabled')
      );
      
      await this.takeScreenshot('clock-buttons-state');
      
      if (!clockInDisabled) {
        // 嘗試打卡
        await this.page.click('#clock-in-btn');
        await this.page.waitForTimeout(2000);
        
        const buttonText = await this.page.textContent('#clock-in-btn .btn-text');
        await this.takeScreenshot('after-clock-attempt');
        
        return { buttonClicked: true, newButtonText: buttonText };
      }
      
      return { buttonsFound: !!clockInBtn && !!clockOutBtn, clockInDisabled };
    });

    // 2.4 設備指紋檢測測試
    await this.testStep('設備指紋檢測', async () => {
      const deviceInfo = await this.page.evaluate(() => {
        return {
          userAgent: navigator.userAgent,
          screen: `${screen.width}x${screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: navigator.language,
          platform: navigator.platform
        };
      });
      
      return { deviceFingerprint: deviceInfo };
    });
  }

  async verifyRevenueManagementSystem() {
    console.log('💰 階段3: 營收管理系統驗證');

    // 3.1 營收界面測試
    await this.testStep('營收管理界面', async () => {
      await this.page.click('[data-module="revenue"]');
      await this.page.waitForSelector('#revenue-panel', { timeout: 5000 });
      
      await this.takeScreenshot('revenue-panel-display');
      
      // 檢查收入輸入欄位
      const incomeFields = [
        '#onsite-revenue',
        '#online-revenue', 
        '#panda-revenue',
        '#uber-revenue',
        '#oil-revenue'
      ];
      
      const fieldsFound = [];
      for (const field of incomeFields) {
        const exists = await this.page.$(field) !== null;
        fieldsFound.push({ field, exists });
      }
      
      return { incomeFieldsStatus: fieldsFound };
    });

    // 3.2 獎金計算引擎測試
    await this.testStep('獎金計算引擎', async () => {
      // 輸入測試數據
      await this.page.fill('#onsite-revenue', '15000');
      await this.page.fill('#online-revenue', '5000');
      await this.page.fill('#panda-revenue', '8000');
      
      await this.takeScreenshot('revenue-data-input');
      
      // 觸發計算 (如果有自動計算功能)
      const bonusDisplay = await this.page.textContent('#bonus-amount');
      const totalIncomeDisplay = await this.page.textContent('#total-income');
      
      return { 
        totalIncome: totalIncomeDisplay,
        bonusAmount: bonusDisplay,
        calculationTriggered: true 
      };
    });

    // 3.3 照片上傳功能測試
    await this.testStep('照片上傳功能', async () => {
      const fileInputs = await this.page.$$('input[type="file"]');
      
      await this.takeScreenshot('photo-upload-interface');
      
      return { 
        photoUploadFields: fileInputs.length,
        uploadInterfaceExists: fileInputs.length > 0 
      };
    });

    // 3.4 營收記錄歷史測試
    await this.testStep('營收歷史記錄', async () => {
      const historySection = await this.page.$('.revenue-history');
      const recordsExist = historySection !== null;
      
      if (recordsExist) {
        const recordsText = await this.page.textContent('.revenue-history');
        await this.takeScreenshot('revenue-history-display');
        return { historyDisplayed: true, content: recordsText.slice(0, 100) };
      }
      
      return { historyDisplayed: false };
    });
  }

  async verifyEmployeeInterface() {
    console.log('👤 階段4: 員工操作界面驗證');

    // 4.1 統一導航測試
    await this.testStep('統一導航系統', async () => {
      const navButtons = await this.page.$$('.nav-btn');
      const buttonTexts = [];
      
      for (const btn of navButtons) {
        const text = await btn.textContent();
        buttonTexts.push(text.trim());
      }
      
      await this.takeScreenshot('unified-navigation');
      
      return { 
        navigationButtons: buttonTexts,
        totalButtons: navButtons.length,
        expectedButtons: ['打卡', '叫貨', '營收', '排班', '投票', '維修']
      };
    });

    // 4.2 響應式設計測試
    await this.testStep('響應式設計', async () => {
      const viewports = [
        { width: 320, height: 568, name: 'iPhone SE' },
        { width: 375, height: 667, name: 'iPhone 8' },
        { width: 768, height: 1024, name: 'iPad' },
        { width: 1024, height: 768, name: 'Desktop' }
      ];
      
      const responsiveResults = [];
      
      for (const viewport of viewports) {
        await this.page.setViewport(viewport);
        await this.page.waitForTimeout(500);
        
        const screenshot = await this.takeScreenshot(`responsive-${viewport.name.toLowerCase()}`);
        
        // 檢查元素是否正確顯示
        const navVisible = await this.page.isVisible('.function-nav');
        const contentVisible = await this.page.isVisible('.content-area');
        
        responsiveResults.push({
          viewport: viewport.name,
          dimensions: `${viewport.width}x${viewport.height}`,
          navigationVisible: navVisible,
          contentVisible: contentVisible,
          screenshot
        });
      }
      
      // 重置回手機視窗
      await this.page.setViewport({ width: 375, height: 667 });
      
      return { responsiveTests: responsiveResults };
    });

    // 4.3 模組切換測試
    await this.testStep('模組切換功能', async () => {
      const modules = ['attendance', 'orders', 'revenue', 'schedule', 'promotion', 'maintenance'];
      const switchResults = [];
      
      for (const module of modules) {
        try {
          await this.page.click(`[data-module="${module}"]`);
          await this.page.waitForTimeout(300);
          
          const panelVisible = await this.page.isVisible(`#${module}-panel`);
          const buttonActive = await this.page.$eval(`[data-module="${module}"]`, 
            el => el.classList.contains('active')
          );
          
          switchResults.push({
            module,
            panelVisible,
            buttonActive,
            success: panelVisible && buttonActive
          });
          
        } catch (error) {
          switchResults.push({
            module,
            error: error.message,
            success: false
          });
        }
      }
      
      await this.takeScreenshot('module-switching-test');
      
      return { moduleSwitching: switchResults };
    });
  }

  async verifyAdminConsole() {
    console.log('👨‍💼 階段5: 管理員控制台驗證');

    // 5.1 管理員登入測試
    await this.testStep('管理員登入', async () => {
      await this.page.goto(`${this.baseUrl}/admin/login`);
      
      const adminLoginExists = await this.page.$('#adminLoginForm') !== null;
      
      if (adminLoginExists) {
        await this.page.fill('#adminUsername', 'admin');
        await this.page.fill('#adminPassword', 'admin123');
        
        await this.takeScreenshot('admin-login-form');
        
        await this.page.click('#adminLoginBtn');
        await this.page.waitForTimeout(2000);
        
        const currentUrl = this.page.url();
        return { loginFormExists: true, attemptedLogin: true, resultUrl: currentUrl };
      }
      
      return { loginFormExists: false };
    });

    // 5.2 員工管理界面測試
    await this.testStep('員工管理界面', async () => {
      try {
        await this.page.goto(`${this.baseUrl}/admin/employees`);
        
        const employeeTableExists = await this.page.$('.employee-table') !== null;
        const addEmployeeBtn = await this.page.$('#addEmployeeBtn') !== null;
        
        await this.takeScreenshot('employee-management');
        
        return { 
          employeeTableExists,
          addButtonExists: addEmployeeBtn,
          interfaceAccessible: true 
        };
      } catch (error) {
        return { 
          interfaceAccessible: false, 
          error: error.message 
        };
      }
    });

    // 5.3 系統參數配置測試
    await this.testStep('系統參數配置', async () => {
      try {
        await this.page.goto(`${this.baseUrl}/admin/settings`);
        
        const configPanels = await this.page.$$('.config-panel');
        const storeConfig = await this.page.$('.store-config') !== null;
        const notificationConfig = await this.page.$('.notification-config') !== null;
        
        await this.takeScreenshot('system-configuration');
        
        return {
          configPanelsCount: configPanels.length,
          storeConfigExists: storeConfig,
          notificationConfigExists: notificationConfig
        };
      } catch (error) {
        return { configAccessible: false, error: error.message };
      }
    });
  }

  async verifyTelegramNotifications() {
    console.log('📱 階段6: Telegram通知驗證');

    // 6.1 通知配置測試
    await this.testStep('Telegram配置驗證', async () => {
      const response = await this.page.evaluate(async () => {
        try {
          const res = await fetch('/api/telegram/test');
          return { status: res.status, ok: res.ok };
        } catch (error) {
          return { error: error.message };
        }
      });
      
      return { telegramApiTest: response };
    });

    // 6.2 測試通知發送
    await this.testStep('測試通知發送', async () => {
      try {
        const testResult = await this.page.evaluate(async () => {
          const response = await fetch('/api/telegram/send-test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: '🧪 智慧瀏覽器驗證測試通知',
              type: 'test'
            })
          });
          return { status: response.status, ok: response.ok };
        });
        
        return { testNotificationSent: testResult.ok };
      } catch (error) {
        return { testNotificationSent: false, error: error.message };
      }
    });
  }

  async verifyIntegrationFeatures() {
    console.log('🔗 階段7: 整合功能驗證');

    // 7.1 數據流測試
    await this.testStep('數據流整合', async () => {
      // 模擬完整業務流程：打卡 -> 營收記錄 -> 通知發送
      const workflow = [];
      
      // 步驟1: 嘗試打卡
      await this.page.click('[data-module="attendance"]');
      workflow.push({ step: 'navigation_to_attendance', success: true });
      
      // 步驟2: 嘗試營收記錄
      await this.page.click('[data-module="revenue"]');
      await this.page.fill('#onsite-revenue', '12000');
      workflow.push({ step: 'revenue_input', success: true });
      
      // 步驟3: 檢查通知觸發
      const notificationCheck = await this.page.evaluate(() => {
        return document.querySelector('#notification-indicator') !== null;
      });
      workflow.push({ step: 'notification_check', success: notificationCheck });
      
      await this.takeScreenshot('integration-workflow');
      
      return { workflowSteps: workflow };
    });

    // 7.2 系統性能測試
    await this.testStep('系統性能分析', async () => {
      const performanceMetrics = await this.page.evaluate(() => {
        return {
          timing: performance.timing,
          navigation: performance.navigation,
          memory: performance.memory || null
        };
      });
      
      const loadTime = performanceMetrics.timing.loadEventEnd - performanceMetrics.timing.navigationStart;
      const domContentLoaded = performanceMetrics.timing.domContentLoadedEventEnd - performanceMetrics.timing.navigationStart;
      
      return {
        totalLoadTime: loadTime,
        domContentLoadedTime: domContentLoaded,
        memoryUsage: performanceMetrics.memory
      };
    });
  }

  async testStep(stepName, testFunction) {
    console.log(`  🔍 測試: ${stepName}`);
    
    try {
      const startTime = Date.now();
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      this.verificationResults.push({
        step: stepName,
        status: 'PASSED',
        duration,
        result,
        timestamp: new Date()
      });
      
      console.log(`  ✅ ${stepName} - 通過 (${duration}ms)`);
      return result;
      
    } catch (error) {
      this.verificationResults.push({
        step: stepName,
        status: 'FAILED',
        error: error.message,
        timestamp: new Date()
      });
      
      console.log(`  ❌ ${stepName} - 失敗: ${error.message}`);
      await this.takeScreenshot(`error-${stepName.replace(/\s+/g, '-').toLowerCase()}`);
      return null;
    }
  }

  async recordError(step, error) {
    this.verificationResults.push({
      step,
      status: 'ERROR',
      error,
      timestamp: new Date()
    });
  }

  async generateVerificationReport() {
    const totalTests = this.verificationResults.length;
    const passedTests = this.verificationResults.filter(r => r.status === 'PASSED').length;
    const failedTests = this.verificationResults.filter(r => r.status === 'FAILED').length;
    const errorTests = this.verificationResults.filter(r => r.status === 'ERROR').length;
    const successRate = ((passedTests / totalTests) * 100).toFixed(1);

    const report = `
# 🌐 智慧瀏覽器完整驗證報告

**執行時間**: ${new Date().toLocaleString()}
**總測試數**: ${totalTests}
**通過**: ${passedTests} ✅
**失敗**: ${failedTests} ❌  
**錯誤**: ${errorTests} ⚠️
**成功率**: ${successRate}%

## 📊 詳細測試結果

${this.verificationResults.map(result => `
### ${result.status === 'PASSED' ? '✅' : result.status === 'FAILED' ? '❌' : '⚠️'} ${result.step}
- **狀態**: ${result.status}
- **執行時間**: ${result.duration || 'N/A'}ms
- **時間**: ${result.timestamp.toLocaleString()}
${result.error ? `- **錯誤**: ${result.error}` : ''}
${result.result ? `- **結果**: ${JSON.stringify(result.result, null, 2)}` : ''}
`).join('\n')}

## 📸 截圖記錄

${this.screenshots.map(screenshot => `
- **${screenshot.name}**: ${screenshot.filepath}
  - 時間: ${screenshot.timestamp.toLocaleString()}
`).join('\n')}

## 🎯 驗證結論

${successRate >= 90 ? 
  '🎉 系統基本架構運行良好，大部分功能正常運作。' :
  successRate >= 70 ?
  '⚠️ 系統存在一些問題，需要進行修復和優化。' :
  '🚨 系統存在嚴重問題，需要立即進行大量修復工作。'
}

系統成功率達到 ${successRate}%，${passedTests}項功能驗證通過，${failedTests}項功能需要修復。
`;

    await fs.writeFile(path.join(__dirname, '../browser-verification-report.md'), report);
    console.log('\n📄 驗證報告已生成: browser-verification-report.md');

    return {
      totalTests,
      passedTests,
      failedTests,
      errorTests,
      successRate: parseFloat(successRate),
      detailedResults: this.verificationResults,
      screenshots: this.screenshots
    };
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

module.exports = SmartBrowserVerificationEngine;
```

---

## 📅 實施時程與里程碑

### 🎯 第一週 (Day 1-7): 緊急核心系統
- **Day 1-2**: GPS打卡系統完整實現
- **Day 3-4**: 營收管理系統完整實現  
- **Day 5-6**: 員工統一界面完整實現
- **Day 7**: 整合測試與基礎驗證

### 🎯 第二週 (Day 8-14): 管理與通知
- **Day 8-9**: 管理員控制台完整實現
- **Day 10-12**: Telegram通知系統29種模板實現
- **Day 13-14**: 系統整合與智慧瀏覽器驗證

### 🎯 第三週 (Day 15-21): 進階功能
- **Day 15-17**: 叫貨管理系統實現
- **Day 18-20**: 排班管理系統複雜規則引擎實現
- **Day 21**: 第二階段整合驗證

### 🎯 第四週 (Day 22-28): 完善與驗證
- **Day 22-24**: 升遷投票系統實現
- **Day 25-26**: 維修保養系統實現
- **Day 27-28**: 完整系統驗證與部署準備

---

## 🏁 預期成果

### ✅ 第一階段完成後 (7天):
- ✅ 員工能正常GPS打卡 (3店面定位驗證)
- ✅ 管理員能查看完整營收計算
- ✅ 統一員工操作界面基本可用
- ✅ 基礎Telegram通知發送

### ✅ 第二階段完成後 (14天):
- ✅ 管理員控制台完整功能
- ✅ 29種通知模板全部實現
- ✅ 智慧瀏覽器驗證通過95%+

### ✅ 最終完成 (28天):
- ✅ 所有146項功能完整實現
- ✅ 系統邏輯.txt 100%符合
- ✅ 通知模板.txt 100%實現
- ✅ 完整可營運狀態

---

**📋 實現計劃總結:**
此計劃基於深度驗證結果，針對146項缺失功能制定了詳細的28天完整實現方案。每個階段都有明確的交付目標和驗證標準，確保最終系統100%符合規格要求。