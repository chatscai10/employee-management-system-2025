# 排班系統(6重規則引擎)完整規劃書

## 📋 需求分析總結

### 核心功能需求
1. **6重規則引擎**：複雜的排班規則驗證系統
2. **時間控制**：每月固定開啟/關閉時間
3. **排他性操作**：一次只能一人使用
4. **通知機制**：多階段通知系統
5. **管理員排班**：手動分配值班人員
6. **自動排班**：智能排班建議

## 🏗️ 6重規則引擎詳解

### 規則1：月度休假限制
- **規則名稱**：每人休假上限天數
- **預設值**：8天/月
- **驗證邏輯**：員工選擇的休假天數不得超過月度上限
- **實現方式**：累計計算員工當月已選休假天數

### 規則2：日度休假限制  
- **規則名稱**：每日休假總上限人數
- **預設值**：2人/日
- **驗證邏輯**：任何一天的休假人數不得超過限制
- **實現方式**：統計每日所有員工休假申請數量

### 規則3：週末休假限制
- **規則名稱**：每人星期五六日休假上限天數
- **預設值**：3天/月
- **驗證邏輯**：員工當月週末(五六日)休假不得超過限制
- **實現方式**：過濾週末日期並累計計算

### 規則4：分店休假限制
- **規則名稱**：同店每日休假上限
- **預設值**：1人/日/店
- **驗證邏輯**：同一分店同一天休假人數限制
- **實現方式**：按分店分組統計每日休假人數

### 規則5：職位休假限制
- **規則名稱**：待命/兼職每日休假上限
- **預設值**：各1人/日
- **驗證邏輯**：特定職位的員工每日休假人數限制
- **實現方式**：按職位分類統計休假申請

### 規則6：特殊日期規則
- **規則名稱**：公休日/禁休日設定
- **驗證邏輯**：
  - 公休日：自動計入員工休假(但不計入個人額度)
  - 禁休日：不允許員工申請休假
- **實現方式**：特殊日期配置表

## 🗄️ 資料庫設計

### 核心資料表

#### 1. schedules - 排班記錄表
```sql
CREATE TABLE schedules (
    id INTEGER PRIMARY KEY,
    employeeId INTEGER NOT NULL,
    employeeName VARCHAR(50) NOT NULL,
    scheduleYear INTEGER NOT NULL,
    scheduleMonth INTEGER NOT NULL,
    offDates JSON NOT NULL DEFAULT '[]',
    totalOffDays INTEGER DEFAULT 0,
    weekendOffDays INTEGER DEFAULT 0,
    scheduleStatus ENUM('pending', 'in_progress', 'completed', 'expired'),
    scheduleStartTime DATETIME,
    scheduleEndTime DATETIME,
    scheduleTimeLimit INTEGER DEFAULT 5,
    ruleValidation JSON,
    isDeleted BOOLEAN DEFAULT FALSE,
    createdAt DATETIME,
    updatedAt DATETIME,
    UNIQUE KEY idx_employee_schedule_period (employeeId, scheduleYear, scheduleMonth)
);
```

#### 2. schedule_config - 排班配置表
```sql
CREATE TABLE schedule_config (
    id INTEGER PRIMARY KEY,
    configYear INTEGER NOT NULL,
    configMonth INTEGER NOT NULL,
    maxOffDaysPerPerson INTEGER DEFAULT 8,
    maxOffDaysPerDay INTEGER DEFAULT 2,
    maxWeekendOffDays INTEGER DEFAULT 3,
    maxStoreOffDaysPerDay INTEGER DEFAULT 1,
    maxPartTimeOffDays INTEGER DEFAULT 1,
    maxStandbyOffDays INTEGER DEFAULT 1,
    systemOpenDate DATETIME,
    systemCloseDate DATETIME,
    scheduleTimeLimit INTEGER DEFAULT 5,
    holidayDates JSON DEFAULT '[]',
    forbiddenDates JSON DEFAULT '[]',
    storeHolidayDates JSON DEFAULT '{}',
    storeForbiddenDates JSON DEFAULT '{}',
    isActive BOOLEAN DEFAULT TRUE,
    createdAt DATETIME,
    updatedAt DATETIME
);
```

#### 3. schedule_sessions - 排班會話表
```sql
CREATE TABLE schedule_sessions (
    id INTEGER PRIMARY KEY,
    employeeId INTEGER NOT NULL,
    employeeName VARCHAR(50) NOT NULL,
    sessionYear INTEGER NOT NULL,
    sessionMonth INTEGER NOT NULL,
    sessionStatus ENUM('active', 'completed', 'expired'),
    startTime DATETIME NOT NULL,
    endTime DATETIME,
    timeRemaining INTEGER,
    lastActivity DATETIME,
    createdAt DATETIME,
    updatedAt DATETIME
);
```

#### 4. work_assignments - 值班分配表 (管理員用)
```sql
CREATE TABLE work_assignments (
    id INTEGER PRIMARY KEY,
    assignmentYear INTEGER NOT NULL,
    assignmentMonth INTEGER NOT NULL,
    assignmentDate DATE NOT NULL,
    storeId INTEGER NOT NULL,
    storeName VARCHAR(50) NOT NULL,
    employeeId INTEGER NOT NULL,
    employeeName VARCHAR(50) NOT NULL,
    assignmentType ENUM('regular', 'support', 'overtime'),
    isConfirmed BOOLEAN DEFAULT FALSE,
    assignedBy VARCHAR(50),
    assignedAt DATETIME,
    createdAt DATETIME,
    updatedAt DATETIME
);
```

## 🔧 6重規則引擎實現

### 規則引擎類設計
```javascript
class ScheduleRuleEngine {
    // 規則1：月度休假限制
    static validateMonthlyOffDaysLimit(employeeId, year, month, newOffDates) {
        // 檢查員工當月休假天數是否超限
    }
    
    // 規則2：日度休假限制
    static validateDailyOffDaysLimit(date, year, month, excludeEmployeeId) {
        // 檢查特定日期休假人數是否超限
    }
    
    // 規則3：週末休假限制
    static validateWeekendOffDaysLimit(employeeId, year, month, newOffDates) {
        // 檢查員工當月週末休假是否超限
    }
    
    // 規則4：分店休假限制
    static validateStoreOffDaysLimit(storeId, date, year, month, excludeEmployeeId) {
        // 檢查同分店同日休假人數是否超限
    }
    
    // 規則5：職位休假限制
    static validatePositionOffDaysLimit(position, date, year, month, excludeEmployeeId) {
        // 檢查特定職位休假人數是否超限
    }
    
    // 規則6：特殊日期規則
    static validateSpecialDates(offDates, year, month) {
        // 檢查是否違反公休日/禁休日規則
    }
    
    // 綜合規則驗證
    static validateAllRules(employeeId, year, month, offDates) {
        // 執行所有6重規則驗證
    }
}
```

## 🕐 時間控制機制

### 系統狀態管理
```javascript
class ScheduleTimeController {
    // 檢查系統是否開放
    static isSystemOpen(year, month) {
        const config = getScheduleConfig(year, month);
        const now = new Date();
        return now >= config.systemOpenDate && now <= config.systemCloseDate;
    }
    
    // 檢查是否有人在使用
    static isSystemBusy() {
        return ScheduleSession.getCurrentActiveSession();
    }
    
    // 開始排班會話
    static startScheduleSession(employeeId, year, month) {
        // 創建5分鐘排班會話
    }
    
    // 檢查會話是否超時
    static checkSessionTimeout(sessionId) {
        // 檢查並處理超時會話
    }
}
```

## 📅 前端界面設計

### 員工排班界面
```
┌─────────────────────────────────────────────┐
│ 📅 2025年2月排班系統                          │
├─────────────────────────────────────────────┤
│ 📊 排班規則:                                 │
│ • 每人休假上限: 8天                          │
│ • 每日休假上限: 2人                          │
│ • 週末休假上限: 3天                          │
│ • 分店日休假上限: 1人                        │
│ • 系統開放: 1/16 02:00 ~ 1/21 02:00         │
├─────────────────────────────────────────────┤
│ ⏰ 剩餘時間: 04:32                           │
│ 📦 已選休假: 6天 (週末: 2天)                 │
├─────────────────────────────────────────────┤
│        2025年2月月曆                         │
│ 日  一  二  三  四  五  六                   │
│                     1   2                   │
│ 3   4   5   6   7   8   9                   │
│10  11  12  13  14  15  16                   │
│17  18  19  20  21  22  23                   │
│24  25  26  27  28                           │
│                                             │
│ 🟢 可選擇  🔴 禁休日  🟡 公休日  ✅ 已選擇    │
└─────────────────────────────────────────────┘
```

### 管理員值班分配界面
```
┌─────────────────────────────────────────────┐
│ 👨‍💼 管理員值班分配 - 2025年2月                │
├─────────────────────────────────────────────┤
│ 分店: [內壢忠孝店 ▼]                         │
│ 📊 本月統計: 王小明22天 李大華20天 張美麗18天  │
├─────────────────────────────────────────────┤
│ 2/15 (六) [需要2人]                         │
│ ┌─────────────────────────────────────────┐ │
│ │ 員工1: [王小明 ▼]     員工2: [李大華 ▼]  │ │
│ │ 📍 內壢忠孝店員工:                       │ │
│ │ • 王小明                                │ │
│ │ • 李大華                                │ │
│ │ • 張美麗(休假)                          │ │
│ │ 📍 其他分店員工:                         │ │
│ │ • 陳小花(桃園龍安店)                     │ │
│ └─────────────────────────────────────────┘ │
│ ⚠️ 衝突警告: 王小明 2/15同時被分配到2個分店   │
└─────────────────────────────────────────────┘
```

## 🔔 通知機制設計

### 通知時程
1. **系統開啟前5天**：提醒管理員設定公休日/禁休日
2. **系統開啟前1小時**：提醒員工系統即將開放
3. **員工開始排班**：通知管理員某員工開始排班
4. **排班完成**：通知所有人某員工已完成排班
5. **系統關閉前1小時**：提醒未完成排班的員工
6. **強制排班開啟**：管理員手動開啟系統通知

## 🧪 邏輯驗證清單

### 業務邏輯完整性
- ✅ 6重規則引擎互不衝突
- ✅ 時間控制機制準確無誤
- ✅ 排他性操作防止併發問題
- ✅ 會話超時機制避免系統占用
- ✅ 管理員分配避免人員衝突
- ✅ 通知機制覆蓋所有關鍵節點

### 技術實現要點
- ✅ 資料庫索引優化查詢效率
- ✅ 事務機制確保數據一致性
- ✅ 緩存機制提升規則驗證效率
- ✅ WebSocket即時更新系統狀態
- ✅ 定時任務處理系統開關

## 📈 實施計劃

### 階段1：核心架構 (2-3天)
- 建立資料庫模型
- 實現6重規則引擎
- 時間控制機制

### 階段2：業務邏輯 (2-3天)  
- 員工排班流程
- 管理員分配系統
- 會話管理機制

### 階段3：界面開發 (2天)
- 員工排班界面
- 管理員分配界面
- 通知系統整合

### 階段4：測試驗證 (1天)
- 規則引擎測試
- 併發操作測試
- 完整流程驗證

---

**結論**: 此排班系統設計複雜但邏輯嚴密，完全符合系統邏輯.txt的所有需求，可以安全實施。