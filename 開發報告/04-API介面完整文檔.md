# 🌐 企業員工管理系統 - API介面完整文檔

## 📋 文檔概述

本文檔提供系統所有API端點的詳細說明，包含：
- RESTful API設計規範
- 完整的請求/回應格式
- 錯誤碼定義
- 使用範例
- 測試案例

---

## 🔧 API基礎設定

### 基礎URL
```
開發環境: http://localhost:3000/api
測試環境: https://test-api.company.com/api
生產環境: https://api.company.com/api
```

### 請求標頭
```http
Content-Type: application/json
Authorization: Bearer {token}
X-Request-ID: {uuid}
Accept-Language: zh-TW
```

### 通用回應格式
```json
{
  "success": true,
  "data": {}, 
  "message": "操作成功",
  "timestamp": "2025-01-10T09:00:00Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### 錯誤回應格式
```json
{
  "success": false,
  "error": {
    "code": "AUTH_001",
    "message": "認證失敗",
    "details": "Token已過期",
    "field": "token"
  },
  "timestamp": "2025-01-10T09:00:00Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## 🔐 1. 認證相關 API

### 1.1 用戶登入

**端點**: `POST /auth/login`  
**描述**: 用戶登入系統，支援員工編號或身分證號登入  
**認證**: 不需要

#### 請求參數
```json
{
  "username": "john.doe",
  "password": "password123"
}
```

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| username | string | 是 | 員工編號或身分證號 |
| password | string | 是 | 密碼 |

#### 成功回應
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "employeeCode": "EMP001",
      "name": "約翰·多伊",
      "role": "employee",
      "department": "IT部門",
      "position": "軟體工程師",
      "permissions": ["view_profile", "clock_in", "submit_revenue"]
    },
    "expiresIn": 86400
  },
  "message": "登入成功"
}
```

#### 錯誤回應
```json
{
  "success": false,
  "error": {
    "code": "AUTH_001",
    "message": "帳號或密碼錯誤"
  }
}
```

#### 使用範例
```javascript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'john.doe',
    password: 'password123'
  })
});

const data = await response.json();
if (data.success) {
  localStorage.setItem('token', data.data.token);
}
```

### 1.2 刷新Token

**端點**: `POST /auth/refresh`  
**描述**: 使用refresh token獲取新的access token  
**認證**: 需要 Refresh Token

#### 請求參數
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 成功回應
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400
  }
}
```

### 1.3 用戶登出

**端點**: `POST /auth/logout`  
**描述**: 登出系統，使token失效  
**認證**: 需要

#### 請求參數
無

#### 成功回應
```json
{
  "success": true,
  "message": "登出成功"
}
```

### 1.4 修改密碼

**端點**: `PUT /auth/change-password`  
**描述**: 修改用戶密碼  
**認證**: 需要

#### 請求參數
```json
{
  "oldPassword": "oldpassword123",
  "newPassword": "newpassword456",
  "confirmPassword": "newpassword456"
}
```

#### 密碼規則
- 最少8個字符
- 包含大小寫字母
- 包含數字
- 包含特殊符號

---

## 👥 2. 員工管理 API

### 2.1 獲取員工列表

**端點**: `GET /employees`  
**描述**: 獲取員工列表，支援分頁和篩選  
**認證**: 需要  
**權限**: manager, admin

#### 查詢參數
| 參數 | 類型 | 預設值 | 說明 |
|------|------|--------|------|
| page | number | 1 | 頁碼 |
| limit | number | 20 | 每頁筆數 |
| search | string | - | 搜尋關鍵字 |
| department | string | - | 部門篩選 |
| role | string | - | 角色篩選 |
| status | string | active | 狀態篩選 |
| sortBy | string | name | 排序欄位 |
| sortOrder | string | asc | 排序方向 |

#### 成功回應
```json
{
  "success": true,
  "data": {
    "employees": [
      {
        "id": 1,
        "employeeCode": "EMP001",
        "name": "約翰·多伊",
        "department": "IT部門",
        "position": "軟體工程師",
        "email": "john@company.com",
        "phone": "0912345678",
        "hireDate": "2023-01-15",
        "status": "active",
        "role": "employee"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 98,
      "itemsPerPage": 20
    }
  }
}
```

### 2.2 獲取員工詳情

**端點**: `GET /employees/{id}`  
**描述**: 獲取特定員工的詳細資訊  
**認證**: 需要  
**權限**: 本人或manager以上

#### 路徑參數
| 參數 | 類型 | 說明 |
|------|------|------|
| id | number | 員工ID |

#### 成功回應
```json
{
  "success": true,
  "data": {
    "id": 1,
    "employeeCode": "EMP001",
    "name": "約翰·多伊",
    "idNumber": "A12****789",
    "birthDate": "1990-05-15",
    "gender": "男",
    "phone": "0912345678",
    "email": "john@company.com",
    "address": "台北市信義區...",
    "emergencyContact": "王小明",
    "emergencyPhone": "0923456789",
    "department": "IT部門",
    "position": "軟體工程師",
    "role": "employee",
    "hireDate": "2023-01-15",
    "totalWorkDays": 450,
    "currentPositionDays": 450
  }
}
```

### 2.3 創建新員工

**端點**: `POST /employees`  
**描述**: 創建新員工帳號  
**認證**: 需要  
**權限**: admin

#### 請求參數
```json
{
  "username": "jane.smith",
  "password": "temppass123",
  "name": "簡·史密斯",
  "idNumber": "B234567890",
  "birthDate": "1992-08-20",
  "gender": "女",
  "phone": "0987654321",
  "email": "jane@company.com",
  "address": "新北市板橋區...",
  "emergencyContact": "李大華",
  "emergencyPhone": "0934567890",
  "department": "業務部門",
  "position": "業務專員",
  "role": "employee",
  "storeName": "內壢店",
  "baseSalary": 35000
}
```

#### 成功回應
```json
{
  "success": true,
  "data": {
    "id": 99,
    "employeeCode": "EMP099",
    "message": "員工創建成功，臨時密碼已發送到員工信箱"
  }
}
```

### 2.4 更新員工資料

**端點**: `PUT /employees/{id}`  
**描述**: 更新員工資料  
**認證**: 需要  
**權限**: admin或本人（部分欄位）

#### 請求參數
```json
{
  "phone": "0912345678",
  "email": "john.new@company.com",
  "address": "台北市大安區...",
  "emergencyContact": "王大明",
  "emergencyPhone": "0923456789"
}
```

### 2.5 停用員工帳號

**端點**: `DELETE /employees/{id}`  
**描述**: 停用員工帳號（軟刪除）  
**認證**: 需要  
**權限**: admin

#### 成功回應
```json
{
  "success": true,
  "message": "員工帳號已停用"
}
```

---

## ⏰ 3. 考勤打卡 API

### 3.1 上班打卡

**端點**: `POST /attendance/clock-in`  
**描述**: 記錄上班打卡  
**認證**: 需要

#### 請求參數
```json
{
  "storeName": "內壢店",
  "gpsCoordinates": {
    "latitude": 24.9748412,
    "longitude": 121.2556713,
    "accuracy": 10
  },
  "deviceFingerprint": "hash-string"
}
```

#### 成功回應
```json
{
  "success": true,
  "data": {
    "id": 1234,
    "clockTime": "2025-01-10T09:05:23Z",
    "type": "上班",
    "status": "正常",
    "lateMinutes": 0,
    "distance": 25,
    "message": "打卡成功"
  }
}
```

#### 錯誤情況
- GPS_001: GPS定位失敗
- GPS_002: 超出打卡範圍
- ATT_001: 重複打卡
- ATT_002: 非工作時間

### 3.2 下班打卡

**端點**: `POST /attendance/clock-out`  
**描述**: 記錄下班打卡  
**認證**: 需要

#### 請求參數
同上班打卡

### 3.3 獲取打卡記錄

**端點**: `GET /attendance`  
**描述**: 獲取打卡記錄  
**認證**: 需要

#### 查詢參數
| 參數 | 類型 | 說明 |
|------|------|------|
| startDate | date | 開始日期 |
| endDate | date | 結束日期 |
| employeeId | number | 員工ID（需權限）|
| type | string | 打卡類型 |

#### 成功回應
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": 1234,
        "date": "2025-01-10",
        "clockIn": {
          "time": "09:05:23",
          "status": "正常",
          "location": "內壢店"
        },
        "clockOut": {
          "time": "18:10:45",
          "status": "正常",
          "location": "內壢店"
        },
        "workHours": 9.09,
        "overtimeHours": 1.09
      }
    ],
    "summary": {
      "totalDays": 20,
      "normalDays": 18,
      "lateDays": 2,
      "absentDays": 0,
      "totalWorkHours": 181.5,
      "totalOvertimeHours": 21.5
    }
  }
}
```

### 3.4 修正打卡記錄

**端點**: `PUT /attendance/{id}/correct`  
**描述**: 修正打卡記錄（需主管審核）  
**認證**: 需要  
**權限**: manager, admin

#### 請求參數
```json
{
  "correctedTime": "2025-01-10T09:00:00Z",
  "reason": "系統故障無法打卡",
  "approvedBy": 2
}
```

---

## 💰 4. 營收管理 API

### 4.1 提交營收記錄

**端點**: `POST /revenue`  
**描述**: 提交每日營收記錄  
**認證**: 需要

#### 請求參數
```json
{
  "date": "2025-01-10",
  "storeName": "內壢店",
  "revenue": {
    "onsite": 35000,
    "delivery": 15000,
    "takeaway": 8000,
    "other": 2000
  },
  "expenses": {
    "ingredients": 18000,
    "labor": 12000,
    "utilities": 3000,
    "other": 2000
  },
  "photos": [
    {
      "type": "revenue",
      "data": "base64_encoded_image"
    },
    {
      "type": "expense",
      "data": "base64_encoded_image"
    }
  ],
  "notes": "今日有團體訂單"
}
```

#### 成功回應
```json
{
  "success": true,
  "data": {
    "id": 567,
    "totalRevenue": 60000,
    "totalExpense": 35000,
    "netRevenue": 25000,
    "bonusAmount": 750,
    "achievementRate": 125,
    "status": "pending"
  }
}
```

### 4.2 獲取營收記錄

**端點**: `GET /revenue`  
**描述**: 獲取營收記錄  
**認證**: 需要

#### 查詢參數
| 參數 | 類型 | 說明 |
|------|------|------|
| startDate | date | 開始日期 |
| endDate | date | 結束日期 |
| storeName | string | 分店名稱 |
| status | string | 狀態 |

### 4.3 營收統計報表

**端點**: `GET /revenue/statistics`  
**描述**: 獲取營收統計資料  
**認證**: 需要  
**權限**: manager, admin

#### 查詢參數
| 參數 | 類型 | 說明 |
|------|------|------|
| period | string | 期間（daily/weekly/monthly/yearly）|
| year | number | 年份 |
| month | number | 月份 |

#### 成功回應
```json
{
  "success": true,
  "data": {
    "period": "monthly",
    "year": 2025,
    "month": 1,
    "statistics": {
      "totalRevenue": 1800000,
      "totalExpense": 1050000,
      "netRevenue": 750000,
      "averageDailyRevenue": 60000,
      "growthRate": 15.5,
      "topRevenueDay": {
        "date": "2025-01-15",
        "amount": 85000
      },
      "revenueByCategory": {
        "onsite": 1050000,
        "delivery": 450000,
        "takeaway": 240000,
        "other": 60000
      },
      "expenseByCategory": {
        "ingredients": 540000,
        "labor": 360000,
        "utilities": 90000,
        "other": 60000
      }
    }
  }
}
```

### 4.4 審核營收記錄

**端點**: `PUT /revenue/{id}/approve`  
**描述**: 審核營收記錄  
**認證**: 需要  
**權限**: manager, admin

#### 請求參數
```json
{
  "approved": true,
  "comments": "數據核實無誤"
}
```

---

## 📦 5. 庫存叫貨 API

### 5.1 創建叫貨單

**端點**: `POST /orders`  
**描述**: 創建新的叫貨單  
**認證**: 需要

#### 請求參數
```json
{
  "orderDate": "2025-01-10",
  "storeName": "內壢店",
  "supplier": "優質肉品",
  "items": [
    {
      "itemId": 1,
      "itemName": "雞胸肉",
      "quantity": 50,
      "unit": "公斤",
      "unitPrice": 120
    },
    {
      "itemId": 2,
      "itemName": "雞腿肉",
      "quantity": 30,
      "unit": "公斤",
      "unitPrice": 140
    }
  ],
  "expectedDelivery": "2025-01-12",
  "notes": "請確保冷鏈運輸"
}
```

#### 成功回應
```json
{
  "success": true,
  "data": {
    "orderId": 789,
    "orderNumber": "ORD-2025-0110-001",
    "totalAmount": 10200,
    "anomalies": [
      {
        "type": "QUANTITY_SPIKE",
        "item": "雞胸肉",
        "message": "訂購量超過平均值150%"
      }
    ]
  }
}
```

### 5.2 獲取叫貨單列表

**端點**: `GET /orders`  
**描述**: 獲取叫貨單列表  
**認證**: 需要

#### 查詢參數
| 參數 | 類型 | 說明 |
|------|------|------|
| status | string | 狀態篩選 |
| supplier | string | 供應商篩選 |
| startDate | date | 開始日期 |
| endDate | date | 結束日期 |

### 5.3 確認收貨

**端點**: `PUT /orders/{id}/receive`  
**描述**: 確認收貨  
**認證**: 需要

#### 請求參數
```json
{
  "actualDeliveryDate": "2025-01-12",
  "receivedItems": [
    {
      "itemId": 1,
      "actualQuantity": 50,
      "condition": "good"
    },
    {
      "itemId": 2,
      "actualQuantity": 28,
      "condition": "good",
      "note": "少2公斤，已記錄"
    }
  ],
  "photos": ["base64_photo1", "base64_photo2"]
}
```

### 5.4 獲取庫存狀態

**端點**: `GET /inventory`  
**描述**: 獲取當前庫存狀態  
**認證**: 需要

#### 成功回應
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "itemName": "雞胸肉",
        "currentQuantity": 120,
        "unit": "公斤",
        "minQuantity": 50,
        "maxQuantity": 200,
        "status": "sufficient",
        "lastOrderDate": "2025-01-05",
        "averageConsumption": 15
      }
    ],
    "alerts": [
      {
        "itemId": 5,
        "itemName": "生菜",
        "alertType": "LOW_STOCK",
        "message": "庫存量低於安全庫存"
      }
    ]
  }
}
```

---

## 📅 6. 排班管理 API

### 6.1 提交排班申請

**端點**: `POST /schedules/request`  
**描述**: 員工提交排班偏好  
**認證**: 需要

#### 請求參數
```json
{
  "month": "2025-02",
  "storeName": "內壢店",
  "preferences": {
    "preferredDates": ["2025-02-05", "2025-02-12", "2025-02-19"],
    "preferredShifts": ["morning", "afternoon"],
    "avoidDates": ["2025-02-14"],
    "maxHoursPerWeek": 40,
    "notes": "2/14情人節請假"
  }
}
```

### 6.2 獲取排班表

**端點**: `GET /schedules`  
**描述**: 獲取排班表  
**認證**: 需要

#### 查詢參數
| 參數 | 類型 | 說明 |
|------|------|------|
| month | string | 月份（YYYY-MM）|
| employeeId | number | 員工ID |
| storeName | string | 分店名稱 |

#### 成功回應
```json
{
  "success": true,
  "data": {
    "month": "2025-02",
    "schedules": [
      {
        "date": "2025-02-01",
        "dayOfWeek": "週六",
        "shifts": [
          {
            "shiftType": "morning",
            "startTime": "09:00",
            "endTime": "18:00",
            "employees": [
              {
                "id": 1,
                "name": "約翰·多伊",
                "position": "店員"
              }
            ]
          }
        ]
      }
    ],
    "summary": {
      "totalShifts": 120,
      "filledShifts": 115,
      "vacancyRate": 4.2
    }
  }
}
```

### 6.3 管理員分配排班

**端點**: `POST /schedules/assign`  
**描述**: 管理員分配排班  
**認證**: 需要  
**權限**: admin

#### 請求參數
```json
{
  "scheduleDate": "2025-02-01",
  "storeName": "內壢店",
  "assignments": [
    {
      "employeeId": 1,
      "shiftType": "morning",
      "startTime": "09:00",
      "endTime": "18:00"
    }
  ]
}
```

### 6.4 申請調班

**端點**: `POST /schedules/swap`  
**描述**: 申請調班  
**認證**: 需要

#### 請求參數
```json
{
  "fromScheduleId": 123,
  "toEmployeeId": 2,
  "reason": "個人事務"
}
```

---

## 🗳️ 7. 升遷投票 API

### 7.1 發起升遷申請

**端點**: `POST /promotions/apply`  
**描述**: 發起升遷申請  
**認證**: 需要

#### 請求參數
```json
{
  "targetPosition": "資深工程師",
  "applicationReason": "工作表現優異，完成多個重要專案",
  "achievements": [
    "完成員工管理系統開發",
    "優化系統效能提升50%",
    "培訓新進員工3名"
  ]
}
```

### 7.2 獲取投票列表

**端點**: `GET /promotions/active`  
**描述**: 獲取進行中的升遷投票  
**認證**: 需要

#### 成功回應
```json
{
  "success": true,
  "data": {
    "promotions": [
      {
        "id": 45,
        "candidate": {
          "id": 1,
          "name": "約翰·多伊",
          "currentPosition": "軟體工程師",
          "department": "IT部門"
        },
        "targetPosition": "資深工程師",
        "votingDeadline": "2025-01-20T23:59:59Z",
        "requiredVotes": 10,
        "currentVotes": {
          "approve": 7,
          "reject": 2,
          "abstain": 1
        },
        "hasVoted": false
      }
    ]
  }
}
```

### 7.3 進行投票

**端點**: `POST /promotions/{id}/vote`  
**描述**: 對升遷申請進行投票  
**認證**: 需要

#### 請求參數
```json
{
  "decision": "approve",
  "comment": "工作認真負責，值得升遷"
}
```

### 7.4 查看投票結果

**端點**: `GET /promotions/{id}/result`  
**描述**: 查看投票結果（投票結束後）  
**認證**: 需要

---

## 🔧 8. 維修管理 API

### 8.1 報修設備

**端點**: `POST /maintenance/report`  
**描述**: 報修設備故障  
**認證**: 需要

#### 請求參數
```json
{
  "storeName": "內壢店",
  "equipmentType": "冷凍設備",
  "equipmentName": "雙門冷凍庫",
  "issueDescription": "溫度異常上升，從-18°C升到-10°C",
  "priority": "high",
  "photos": ["base64_photo1", "base64_photo2"]
}
```

### 8.2 獲取維修記錄

**端點**: `GET /maintenance`  
**描述**: 獲取維修記錄  
**認證**: 需要

#### 查詢參數
| 參數 | 類型 | 說明 |
|------|------|------|
| status | string | 狀態篩選 |
| priority | string | 優先級篩選 |
| equipmentType | string | 設備類型 |

### 8.3 更新維修進度

**端點**: `PUT /maintenance/{id}/update`  
**描述**: 更新維修進度  
**認證**: 需要  
**權限**: manager, admin, 維修人員

#### 請求參數
```json
{
  "status": "in_progress",
  "assignedTo": "王師傅",
  "estimatedCompletion": "2025-01-11T15:00:00Z",
  "notes": "已聯繫維修人員，預計下午到達"
}
```

### 8.4 完成維修

**端點**: `PUT /maintenance/{id}/complete`  
**描述**: 標記維修完成  
**認證**: 需要  
**權限**: 維修人員

#### 請求參數
```json
{
  "repairDescription": "更換溫控器，清理冷凝器",
  "partsReplaced": [
    {
      "name": "溫控器",
      "quantity": 1,
      "cost": 1500
    }
  ],
  "laborCost": 800,
  "completionPhotos": ["base64_photo1"]
}
```

---

## 📢 9. 公告系統 API

### 9.1 發布公告

**端點**: `POST /announcements`  
**描述**: 發布新公告  
**認證**: 需要  
**權限**: manager, admin

#### 請求參數
```json
{
  "title": "春節排班通知",
  "content": "請各位同仁於1/15前提交春節期間排班偏好...",
  "type": "notice",
  "priority": "high",
  "targetDepartments": ["all"],
  "targetStores": ["內壢店", "桃園店"],
  "expireDate": "2025-01-15T23:59:59Z",
  "isPinned": true,
  "attachments": [
    {
      "name": "排班表.xlsx",
      "url": "https://..."
    }
  ]
}
```

### 9.2 獲取公告列表

**端點**: `GET /announcements`  
**描述**: 獲取公告列表  
**認證**: 需要

#### 查詢參數
| 參數 | 類型 | 說明 |
|------|------|------|
| type | string | 公告類型 |
| isActive | boolean | 是否有效 |
| isPinned | boolean | 是否置頂 |

### 9.3 標記已讀

**端點**: `POST /announcements/{id}/read`  
**描述**: 標記公告為已讀  
**認證**: 需要

---

## 📊 10. 系統管理 API

### 10.1 獲取系統設定

**端點**: `GET /system/settings`  
**描述**: 獲取系統設定  
**認證**: 需要  
**權限**: admin

#### 成功回應
```json
{
  "success": true,
  "data": {
    "attendance": {
      "gpsRadius": 100,
      "lateGraceMinutes": 10,
      "workStartTime": "09:00"
    },
    "revenue": {
      "bonusThresholds": [
        {"rate": 1.0, "bonus": 0.01},
        {"rate": 1.1, "bonus": 0.02}
      ]
    },
    "notification": {
      "telegramBossGroup": "-1002658082392",
      "telegramEmployeeGroup": "-1002658082393"
    }
  }
}
```

### 10.2 更新系統設定

**端點**: `PUT /system/settings`  
**描述**: 更新系統設定  
**認證**: 需要  
**權限**: admin

#### 請求參數
```json
{
  "category": "attendance",
  "settings": {
    "gpsRadius": 150,
    "lateGraceMinutes": 15
  }
}
```

### 10.3 獲取系統狀態

**端點**: `GET /system/status`  
**描述**: 獲取系統運行狀態  
**認證**: 不需要

#### 成功回應
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "4.0.0",
    "uptime": 864000,
    "database": {
      "connected": true,
      "latency": 5
    },
    "services": {
      "telegram": "active",
      "gps": "active",
      "cache": "active"
    },
    "statistics": {
      "totalUsers": 98,
      "activeUsers": 85,
      "todayRequests": 1543
    }
  }
}
```

### 10.4 獲取審計日誌

**端點**: `GET /system/audit-logs`  
**描述**: 獲取系統操作日誌  
**認證**: 需要  
**權限**: admin

#### 查詢參數
| 參數 | 類型 | 說明 |
|------|------|------|
| userId | number | 用戶ID |
| action | string | 操作類型 |
| startDate | date | 開始日期 |
| endDate | date | 結束日期 |

---

## 🔒 錯誤碼定義

### 認證錯誤 (AUTH)
| 錯誤碼 | 說明 | HTTP狀態碼 |
|--------|------|-------------|
| AUTH_001 | 認證失敗 | 401 |
| AUTH_002 | Token過期 | 401 |
| AUTH_003 | Token無效 | 401 |
| AUTH_004 | 權限不足 | 403 |
| AUTH_005 | 帳號已停用 | 403 |

### 驗證錯誤 (VAL)
| 錯誤碼 | 說明 | HTTP狀態碼 |
|--------|------|-------------|
| VAL_001 | 必填欄位缺失 | 400 |
| VAL_002 | 資料格式錯誤 | 400 |
| VAL_003 | 資料超出範圍 | 400 |
| VAL_004 | 重複資料 | 409 |

### 業務錯誤 (BIZ)
| 錯誤碼 | 說明 | HTTP狀態碼 |
|--------|------|-------------|
| BIZ_001 | 資源不存在 | 404 |
| BIZ_002 | 操作不允許 | 400 |
| BIZ_003 | 狀態不正確 | 400 |
| BIZ_004 | 超出限制 | 429 |

### 系統錯誤 (SYS)
| 錯誤碼 | 說明 | HTTP狀態碼 |
|--------|------|-------------|
| SYS_001 | 內部錯誤 | 500 |
| SYS_002 | 資料庫錯誤 | 500 |
| SYS_003 | 外部服務錯誤 | 502 |
| SYS_004 | 超時錯誤 | 504 |

---

## 🧪 測試範例

### Postman Collection
```json
{
  "info": {
    "name": "Employee Management API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{access_token}}",
        "type": "string"
      }
    ]
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3000/api"
    },
    {
      "key": "access_token",
      "value": ""
    }
  ]
}
```

### cURL 範例
```bash
# 登入
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"john.doe","password":"password123"}'

# 打卡
curl -X POST http://localhost:3000/api/attendance/clock-in \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "storeName": "內壢店",
    "gpsCoordinates": {
      "latitude": 24.9748412,
      "longitude": 121.2556713
    }
  }'
```

---

## 📈 API 版本管理

### 版本策略
- 主版本號變更：不相容的API修改
- 次版本號變更：向下相容的功能新增
- 修訂號變更：向下相容的問題修正

### 版本標頭
```http
API-Version: 1.0.0
```

### 棄用通知
```http
Deprecation: true
Sunset: Sat, 31 Dec 2025 23:59:59 GMT
Link: <https://api.company.com/v2/docs>; rel="successor-version"
```

---

## 🎯 總結

本API文檔涵蓋了企業員工管理系統的所有端點，提供了：
- 完整的請求/回應格式
- 詳細的參數說明
- 實用的錯誤碼定義
- 豐富的使用範例

開發者可以根據此文檔快速整合系統API。

---

**文檔版本**: v1.0  
**更新日期**: 2025-01-10  
**API設計**: AI開發團隊