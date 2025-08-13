# 🌩️ 企業員工管理系統 - Google Cloud 無伺服器架構完整指南

## 📋 文檔概述

本指南專為 Google Cloud 無伺服器架構設計，涵蓋：
- 架構設計與限制分析
- 必要資料表精簡分析
- UI/UX 柔和質感設計規格
- 元件與資料庫對應關係
- 部署流程與自動化驗證

---

## 🏗️ Google Cloud 無伺服器架構分析

### 架構選擇理由

| 服務 | 用途 | 優勢 | 限制 |
|------|------|------|------|
| **Cloud Run** | API 服務 | 自動擴展、按需付費 | 冷啟動、15分鐘超時 |
| **Cloud Functions** | 事件處理 | 完全無伺服器 | 10分鐘超時、10MB請求限制 |
| **Firestore** | NoSQL 資料庫 | 即時同步、自動備份 | 複雜查詢限制 |
| **Firebase Hosting** | 前端託管 | CDN、SSL、快速部署 | 靜態檔案限制 |
| **Cloud Storage** | 檔案儲存 | 無限容量、多層儲存 | 需要簽名URL |

### Google Cloud 限制與注意事項

#### 1. Cloud Run 限制
```yaml
# Cloud Run 配置限制
服務限制:
  請求超時: 60分鐘 (最大)
  並發請求: 1000 (每實例)
  記憶體: 32GB (最大)
  CPU: 8 vCPU (最大)
  請求大小: 32MB
  回應大小: 32MB
  
冷啟動考量:
  - 使用最小實例數避免冷啟動
  - 優化容器大小 (<100MB)
  - 使用預熱端點
```

#### 2. Firestore 限制
```yaml
文檔限制:
  文檔大小: 1MB
  寫入速率: 1次/秒 (每文檔)
  批次寫入: 500個操作
  查詢限制: 複合索引需預先定義
  
成本考量:
  讀取: $0.06/100K次
  寫入: $0.18/100K次
  儲存: $0.18/GB/月
```

#### 3. Firebase Hosting 限制
```yaml
託管限制:
  檔案大小: 2GB (單檔)
  部署大小: 1GB (總計)
  並發連線: 無限制
  頻寬: 360GB/月 (免費額度)
```

---

## 📊 精簡資料表分析

### 必要資料表（7個核心表）

根據需求分析，移除不必要的功能後，精簡為以下核心資料表：

#### 1. 員工資料 (employees)
```javascript
{
  id: "自動生成",
  employeeCode: "EMP001",
  username: "john.doe",
  passwordHash: "加密後密碼",
  name: "約翰·多伊",
  idNumber: "A123456789", // 加密儲存
  department: "餐飲部",
  position: "服務員",
  role: "employee", // employee | manager | admin
  storeName: "內壢店",
  phone: "0912345678",
  hireDate: "2024-01-15",
  isActive: true,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### 2. 考勤記錄 (attendance)
```javascript
{
  id: "自動生成",
  employeeId: "EMP001",
  type: "clockIn", // clockIn | clockOut
  timestamp: "2025-01-27T15:00:00Z",
  location: {
    lat: 24.9748412,
    lng: 121.2556713,
    accuracy: 10
  },
  storeName: "內壢店",
  distance: 25, // 公尺
  deviceFingerprint: "hash值",
  // 固定班次 15:00-02:00，自動計算跨日
  shiftDate: "2025-01-27", // 班次歸屬日期
  isLate: false,
  lateMinutes: 0
}
```

#### 3. 營收記錄 (revenue)
```javascript
{
  id: "自動生成",
  date: "2025-01-27",
  storeName: "內壢店",
  recordedBy: "EMP001",
  revenue: {
    dineIn: 35000,
    delivery: 15000,
    takeout: 8000,
    other: 2000
  },
  expenses: {
    food: 18000,
    labor: 12000,
    utilities: 3000,
    other: 2000
  },
  totalRevenue: 60000,
  totalExpense: 35000,
  netRevenue: 25000,
  photos: ["gs://bucket/photo1.jpg"],
  status: "pending", // pending | approved
  approvedBy: null,
  approvedAt: null
}
```

#### 4. 庫存項目 (inventory)
```javascript
{
  id: "自動生成",
  itemCode: "ITEM001",
  itemName: "雞胸肉",
  category: "肉類",
  unit: "公斤",
  currentStock: 50,
  minStock: 20,
  lastPrice: 120,
  supplier: "優質肉品",
  isActive: true
}
```

#### 5. 叫貨訂單 (orders)
```javascript
{
  id: "自動生成",
  orderNumber: "ORD20250127001",
  orderDate: "2025-01-27",
  storeName: "內壢店",
  orderedBy: "EMP001",
  items: [
    {
      itemCode: "ITEM001",
      itemName: "雞胸肉",
      quantity: 30,
      unit: "公斤",
      unitPrice: 120,
      subtotal: 3600
    }
  ],
  totalAmount: 3600,
  status: "pending", // pending | received
  expectedDelivery: "2025-01-29",
  notes: "請確保冷鏈運輸"
}
```

#### 6. 公告系統 (announcements)
```javascript
{
  id: "自動生成",
  title: "春節排班通知",
  content: "請同仁於1/30前完成2月份排班登記",
  priority: "high", // low | normal | high
  targetRoles: ["employee", "manager"],
  targetStores: ["內壢店", "桃園店"],
  createdBy: "ADMIN001",
  createdAt: Timestamp,
  expiresAt: Timestamp,
  isActive: true,
  readBy: ["EMP001", "EMP002"] // 已讀員工清單
}
```

#### 7. 系統設定 (settings)
```javascript
{
  id: "自動生成",
  category: "telegram",
  settings: {
    botToken: "7659930552:AAF_jF1rAXFnjFO176-9X5fKfBwbrko8BNc",
    bossGroupId: "-1002658082392", // 可從管理頁面修改
    employeeGroupId: "-1002658082392", // 暫時相同，之後修改
    notificationEnabled: true
  },
  updatedBy: "ADMIN001",
  updatedAt: Timestamp
}
```

### 移除的資料表說明

| 移除項目 | 原因 |
|----------|------|
| schedules (排班) | 固定班次15:00-02:00，無需複雜排班 |
| maintenanceRequests | 非核心功能 |
| promotionVotes | 非核心功能 |
| auditLogs | 可用 Cloud Logging 替代 |

---

## 🎨 UI/UX 柔和質感設計規格

### 設計原則
- **柔和配色**：避免高對比和鮮豔色彩
- **質感層次**：適度陰影和圓角
- **舒適閱讀**：充足留白和字距

### 配色方案

```css
/* 主要色彩系統 - 柔和藍灰色系 */
:root {
  /* 主色調 */
  --primary-50: #E8F4FD;
  --primary-100: #C3E4FB;
  --primary-200: #9DD3F8;
  --primary-300: #77C1F5;
  --primary-400: #51AFF2;
  --primary-500: #2B9DEF; /* 主要色 */
  --primary-600: #1E8DDC;
  --primary-700: #1A7BC2;
  
  /* 中性色 */
  --gray-50: #FAFBFC;
  --gray-100: #F4F6F8;
  --gray-200: #E9ECEF;
  --gray-300: #DEE2E6;
  --gray-400: #CED4DA;
  --gray-500: #ADB5BD;
  --gray-600: #6C757D;
  --gray-700: #495057;
  --gray-800: #343A40;
  --gray-900: #212529;
  
  /* 背景色 */
  --bg-primary: #FFFFFF;
  --bg-secondary: #F8FAFB;
  --bg-tertiary: #F0F4F7;
  
  /* 功能色 */
  --success: #4ECDC4;
  --warning: #FFD93D;
  --danger: #FF6B6B;
  --info: #4DABF7;
  
  /* 陰影系統 */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.12);
}
```

### 字體系統
```css
/* 字體配置 */
--font-primary: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans TC", "Microsoft JhengHei", sans-serif;
--font-mono: "SF Mono", Monaco, "Cascadia Code", monospace;

/* 字體大小 */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
```

---

## 🔗 頁面元件與資料庫對應關係

### 1. 登入頁面 (/login)

#### 元件結構
```html
<div class="login-container">
  <div class="login-card">
    <h1 class="login-title">員工管理系統</h1>
    <form id="loginForm">
      <div class="form-group">
        <label>帳號</label>
        <input id="username" type="text" />
      </div>
      <div class="form-group">
        <label>密碼</label>
        <input id="password" type="password" />
      </div>
      <button id="loginButton" class="btn-primary">登入</button>
    </form>
  </div>
</div>
```

#### 對應關係
| 元件 | 資料庫 | 函式 | 說明 |
|------|--------|------|------|
| #username | employees.username | validateUsername() | 驗證用戶名 |
| #password | employees.passwordHash | validatePassword() | 驗證密碼 |
| #loginButton | - | handleLogin() | 處理登入邏輯 |

### 2. 儀表板頁面 (/dashboard)

#### 元件結構
```html
<div class="dashboard">
  <!-- 側邊欄 -->
  <nav class="sidebar">
    <div class="sidebar-header">
      <img class="logo" src="/logo.png" />
      <h2>內壢店</h2>
    </div>
    <ul class="sidebar-nav">
      <li><a href="/dashboard" data-page="dashboard">總覽</a></li>
      <li><a href="/attendance" data-page="attendance">打卡系統</a></li>
      <li><a href="/revenue" data-page="revenue">營收管理</a></li>
      <li><a href="/inventory" data-page="inventory">庫存叫貨</a></li>
      <li><a href="/announcements" data-page="announcements">公告</a></li>
    </ul>
  </nav>
  
  <!-- 主內容區 -->
  <main class="main-content">
    <!-- 頂部導航 -->
    <header class="topbar">
      <div class="user-info">
        <span class="user-name">約翰·多伊</span>
        <span class="user-role">服務員</span>
      </div>
      <button class="logout-btn">登出</button>
    </header>
    
    <!-- 快速統計卡片 -->
    <div class="quick-stats">
      <div class="stat-card" id="todayRevenue">
        <h3>今日營收</h3>
        <p class="stat-value">NT$ 0</p>
      </div>
      <div class="stat-card" id="attendance-status">
        <h3>出勤狀態</h3>
        <p class="stat-value">未打卡</p>
      </div>
      <div class="stat-card" id="lowStock">
        <h3>低庫存</h3>
        <p class="stat-value">0 項</p>
      </div>
      <div class="stat-card" id="newAnnouncements">
        <h3>新公告</h3>
        <p class="stat-value">0 則</p>
      </div>
    </div>
  </main>
</div>
```

#### 對應關係
| 元件 | 資料庫查詢 | 函式 | 更新頻率 |
|------|------------|------|----------|
| .user-name | employees.name | getUserInfo() | 登入時 |
| .user-role | employees.role | getUserRole() | 登入時 |
| #todayRevenue | revenue (今日) | getTodayRevenue() | 每5分鐘 |
| #attendance-status | attendance (最新) | getAttendanceStatus() | 即時 |
| #lowStock | inventory (stock < minStock) | getLowStockCount() | 每10分鐘 |
| #newAnnouncements | announcements (未讀) | getUnreadAnnouncements() | 每分鐘 |

### 3. 打卡頁面 (/attendance)

#### 元件結構
```html
<div class="attendance-page">
  <div class="clock-section">
    <div class="current-time" id="currentTime">15:00:00</div>
    <div class="current-location" id="currentLocation">取得定位中...</div>
    
    <button id="clockInButton" class="btn-clock-in">
      <i class="icon-clock"></i>
      上班打卡
    </button>
    
    <button id="clockOutButton" class="btn-clock-out" disabled>
      <i class="icon-clock"></i>
      下班打卡
    </button>
  </div>
  
  <div class="attendance-history">
    <h3>本月打卡記錄</h3>
    <table id="attendanceTable">
      <thead>
        <tr>
          <th>日期</th>
          <th>上班時間</th>
          <th>下班時間</th>
          <th>狀態</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  </div>
</div>
```

#### 對應關係
| 元件 | 資料庫操作 | 函式 | 觸發條件 |
|------|------------|------|----------|
| #currentTime | - | updateClock() | 每秒更新 |
| #currentLocation | - | getCurrentLocation() | 頁面載入 |
| #clockInButton | attendance.create() | handleClockIn() | 點擊按鈕 |
| #clockOutButton | attendance.update() | handleClockOut() | 點擊按鈕 |
| #attendanceTable | attendance.query() | loadAttendanceHistory() | 頁面載入/打卡後 |

#### 打卡邏輯函式
```javascript
async function handleClockIn() {
  // 1. 獲取GPS位置
  const position = await getCurrentPosition();
  
  // 2. 驗證距離
  const distance = calculateDistance(
    position.coords,
    STORE_LOCATION[currentStore]
  );
  
  if (distance > 100) {
    showError('距離超過100公尺，無法打卡');
    return;
  }
  
  // 3. 提交打卡記錄
  const record = {
    employeeId: currentUser.employeeCode,
    type: 'clockIn',
    timestamp: new Date(),
    location: {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy
    },
    storeName: currentStore,
    distance: distance,
    deviceFingerprint: generateFingerprint(),
    shiftDate: getShiftDate(), // 處理跨日班次
    isLate: checkIfLate()
  };
  
  await db.collection('attendance').add(record);
  
  // 4. 發送Telegram通知
  await sendTelegramNotification('clockIn', record);
  
  // 5. 更新UI
  updateClockButtons('clockedIn');
  loadAttendanceHistory();
}
```

### 4. 營收管理頁面 (/revenue)

#### 元件結構
```html
<div class="revenue-page">
  <div class="revenue-form-card">
    <h2>營收登記</h2>
    <form id="revenueForm">
      <!-- 收入區塊 -->
      <div class="form-section">
        <h3>收入明細</h3>
        <div class="form-grid">
          <div class="form-group">
            <label>內用</label>
            <input type="number" id="dineIn" />
          </div>
          <div class="form-group">
            <label>外送</label>
            <input type="number" id="delivery" />
          </div>
          <div class="form-group">
            <label>外帶</label>
            <input type="number" id="takeout" />
          </div>
          <div class="form-group">
            <label>其他</label>
            <input type="number" id="otherRevenue" />
          </div>
        </div>
      </div>
      
      <!-- 支出區塊 -->
      <div class="form-section">
        <h3>支出明細</h3>
        <div class="form-grid">
          <div class="form-group">
            <label>食材</label>
            <input type="number" id="food" />
          </div>
          <div class="form-group">
            <label>人事</label>
            <input type="number" id="labor" />
          </div>
          <div class="form-group">
            <label>水電</label>
            <input type="number" id="utilities" />
          </div>
          <div class="form-group">
            <label>其他</label>
            <input type="number" id="otherExpense" />
          </div>
        </div>
      </div>
      
      <!-- 照片上傳 -->
      <div class="form-section">
        <h3>上傳照片</h3>
        <input type="file" id="photos" multiple accept="image/*" />
        <div id="photoPreview" class="photo-preview"></div>
      </div>
      
      <!-- 統計顯示 -->
      <div class="revenue-summary">
        <div class="summary-item">
          <span>總收入:</span>
          <span id="totalRevenue">NT$ 0</span>
        </div>
        <div class="summary-item">
          <span>總支出:</span>
          <span id="totalExpense">NT$ 0</span>
        </div>
        <div class="summary-item highlight">
          <span>淨收入:</span>
          <span id="netRevenue">NT$ 0</span>
        </div>
      </div>
      
      <button type="submit" class="btn-primary">提交營收</button>
    </form>
  </div>
</div>
```

#### 對應關係
| 元件 | 資料庫欄位 | 函式 | 觸發時機 |
|------|------------|------|----------|
| #dineIn | revenue.revenue.dineIn | calculateTotal() | 輸入時 |
| #delivery | revenue.revenue.delivery | calculateTotal() | 輸入時 |
| #photos | Cloud Storage | uploadPhotos() | 選擇檔案 |
| #totalRevenue | 計算值 | updateSummary() | 自動計算 |
| #revenueForm | revenue.create() | submitRevenue() | 表單提交 |

### 5. 庫存叫貨頁面 (/inventory)

#### 元件結構
```html
<div class="inventory-page">
  <!-- 庫存列表 -->
  <div class="inventory-list">
    <h2>庫存狀態</h2>
    <div class="inventory-grid" id="inventoryGrid">
      <!-- 動態生成庫存卡片 -->
    </div>
  </div>
  
  <!-- 叫貨表單 -->
  <div class="order-form-card">
    <h2>建立叫貨單</h2>
    <form id="orderForm">
      <div id="orderItems">
        <!-- 動態生成叫貨項目 -->
      </div>
      <button type="button" id="addItemButton">新增項目</button>
      <button type="submit" class="btn-primary">送出叫貨單</button>
    </form>
  </div>
</div>
```

#### 庫存卡片元件
```javascript
function createInventoryCard(item) {
  const stockPercentage = (item.currentStock / item.minStock) * 100;
  const stockStatus = stockPercentage < 50 ? 'low' : 
                     stockPercentage < 100 ? 'warning' : 'good';
  
  return `
    <div class="inventory-card ${stockStatus}">
      <h4>${item.itemName}</h4>
      <div class="stock-info">
        <span class="current">${item.currentStock}</span>
        <span class="unit">${item.unit}</span>
      </div>
      <div class="stock-bar">
        <div class="stock-fill" style="width: ${Math.min(stockPercentage, 100)}%"></div>
      </div>
      <p class="min-stock">最低庫存: ${item.minStock}</p>
      <button onclick="addToOrder('${item.itemCode}')" class="btn-sm">叫貨</button>
    </div>
  `;
}
```

---

## 🚀 Google Cloud 部署流程

### Phase 1: 專案設置 (30分鐘)

#### 1.1 建立 Google Cloud 專案
```bash
# 安裝 gcloud CLI
curl https://sdk.cloud.google.com | bash

# 初始化專案
gcloud init
gcloud projects create employee-mgmt-2025 --name="Employee Management"
gcloud config set project employee-mgmt-2025

# 啟用必要的 API
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  firestore.googleapis.com \
  storage.googleapis.com \
  firebase.googleapis.com
```

#### 1.2 設置 Firebase
```bash
# 安裝 Firebase CLI
npm install -g firebase-tools

# 初始化 Firebase
firebase login
firebase init

# 選擇：
# - Firestore
# - Functions
# - Hosting
# - Storage
```

### Phase 2: 後端部署 (45分鐘)

#### 2.1 準備 Cloud Run 服務
```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

# 複製依賴文件
COPY package*.json ./
RUN npm ci --only=production

# 複製應用程式碼
COPY . .

# 設置環境變數
ENV NODE_ENV=production
ENV PORT=8080

# 健康檢查
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node healthcheck.js

EXPOSE 8080

CMD ["node", "app.js"]
```

#### 2.2 部署到 Cloud Run
```bash
# 建構容器映像
gcloud builds submit --tag gcr.io/employee-mgmt-2025/api

# 部署到 Cloud Run
gcloud run deploy employee-api \
  --image gcr.io/employee-mgmt-2025/api \
  --platform managed \
  --region asia-east1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production \
  --min-instances 1 \
  --max-instances 10 \
  --memory 512Mi
```

### Phase 3: 前端部署 (30分鐘)

#### 3.1 建構前端
```bash
# 建構生產版本
npm run build

# 部署到 Firebase Hosting
firebase deploy --only hosting
```

### Phase 4: 資料庫設置 (20分鐘)

#### 4.1 Firestore 索引
```json
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "attendance",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "employeeId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "revenue",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "storeName", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    }
  ]
}
```

#### 4.2 安全規則
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 員工只能讀取自己的資料
    match /employees/{employeeId} {
      allow read: if request.auth != null && 
        (request.auth.uid == employeeId || request.auth.token.role == 'admin');
      allow write: if request.auth.token.role == 'admin';
    }
    
    // 考勤記錄
    match /attendance/{recordId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && 
        request.auth.uid == resource.data.employeeId;
      allow update: if false; // 禁止修改
    }
    
    // 營收記錄
    match /revenue/{recordId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth.token.role in ['manager', 'admin'];
    }
  }
}
```

---

## 🤖 智慧瀏覽器驗證模板

### 驗證腳本結構
```javascript
const IntelligentBrowserVerification = require('./browser-verification');

// 配置驗證參數
const config = {
  appUrl: 'https://employee-mgmt-2025.web.app',
  apiUrl: 'https://employee-api-xxxx.a.run.app',
  testAccounts: {
    admin: { username: 'admin', password: 'admin123' },
    employee: { username: 'john.doe', password: 'pass123' }
  }
};

// 執行階段驗證
async function runPhaseVerification(phase) {
  const verifier = new IntelligentBrowserVerification(config);
  
  switch(phase) {
    case 1:
      await verifier.verifyDeployment();
      break;
    case 2:
      await verifier.verifyFunctionality();
      break;
    case 3:
      await verifier.verifyDatabase();
      break;
    case 4:
      await verifier.verifyPerformance();
      break;
  }
}
```

### 驗證檢查點

#### Phase 1: 部署驗證 ✓
- [ ] Cloud Run 服務運行中
- [ ] Firebase Hosting 可訪問
- [ ] 自訂網域 SSL 證書有效
- [ ] 健康檢查端點回應正常

#### Phase 2: 功能驗證 ✓
- [ ] 登入功能正常
- [ ] GPS 打卡可用
- [ ] 營收提交成功
- [ ] 檔案上傳正常
- [ ] Telegram 通知發送

#### Phase 3: 資料庫驗證 ✓
- [ ] Firestore 連線正常
- [ ] 索引建立完成
- [ ] 安全規則生效
- [ ] 資料同步正常

#### Phase 4: 效能驗證 ✓
- [ ] 頁面載入 < 3秒
- [ ] API 回應 < 500ms
- [ ] 冷啟動 < 5秒
- [ ] 並發測試通過

---

## 👨‍💻 新開發者視角審查

### 還需要補充的資訊

#### 1. 環境變數完整清單
```env
# .env.production
PROJECT_ID=employee-mgmt-2025
REGION=asia-east1
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_STORAGE_BUCKET=
TELEGRAM_BOT_TOKEN=
TELEGRAM_GROUP_ID=
```

#### 2. 錯誤處理規範
```javascript
// 統一錯誤格式
class AppError extends Error {
  constructor(message, code, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

// 錯誤代碼定義
const ERROR_CODES = {
  AUTH_FAILED: 'E001',
  GPS_UNAVAILABLE: 'E002',
  DISTANCE_EXCEEDED: 'E003',
  UPLOAD_FAILED: 'E004',
  DB_ERROR: 'E005'
};
```

#### 3. 監控與日誌
```javascript
// Cloud Logging 整合
const { Logging } = require('@google-cloud/logging');
const logging = new Logging();
const log = logging.log('employee-app');

// 記錄關鍵操作
function logOperation(operation, data) {
  const metadata = {
    severity: 'INFO',
    labels: {
      operation: operation,
      timestamp: new Date().toISOString()
    }
  };
  
  const entry = log.entry(metadata, data);
  log.write(entry);
}
```

#### 4. 版本管理策略
```yaml
# 版本標記規則
版本格式: v{major}.{minor}.{patch}
範例: v1.0.0

# 發布流程
1. 功能分支開發
2. Pull Request 審查
3. 合併到 main
4. 自動部署到 staging
5. 手動部署到 production
```

### 建議優先實作順序

1. **基礎設施** (第1週)
   - Google Cloud 專案設置
   - Firebase 初始化
   - CI/CD 管道

2. **核心功能** (第2-3週)
   - 登入系統
   - GPS 打卡
   - 營收管理

3. **進階功能** (第4週)
   - 庫存系統
   - 公告系統
   - Telegram 整合

4. **優化部署** (第5週)
   - 效能調校
   - 監控設置
   - 文檔完善

---

## 📋 總結

本報告提供了完整的 Google Cloud 無伺服器架構方案，包含：

1. **精簡資料表**：從 11 個減至 7 個核心表
2. **柔和 UI 設計**：藍灰色系，避免紫色等刺眼配色  
3. **詳細元件對應**：每個按鈕、輸入框都有明確的資料庫關聯
4. **完整部署流程**：包含自動化驗證腳本
5. **新手友善**：提供環境變數、錯誤處理等補充資訊

遵循此報告可確保系統順利部署於 Google Cloud，並符合所有無伺服器架構的限制與最佳實踐。

---

**文檔版本**: v1.0  
**更新日期**: 2025-08-06  
**架構設計**: AI 開發團隊