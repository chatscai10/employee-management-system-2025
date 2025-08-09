/**
 * ===========================
 * 企業員工管理系統 - API 規格文檔
 * ===========================
 */

// =============================
// 1. 身份認證 API
// =============================

/**
 * @api {post} /api/auth/login 用戶登入
 * @apiGroup Authentication
 * @apiParam {String} username 員工姓名或身分證號
 * @apiParam {String} password 密碼（身分證號）
 * @apiSuccess {Boolean} success 成功狀態
 * @apiSuccess {String} token JWT Token
 * @apiSuccess {Object} user 用戶資料
 * @apiError {String} error 錯誤訊息
 */
const loginAPI = {
  endpoint: 'POST /api/auth/login',
  requestBody: {
    username: 'john.doe 或 A123456789',
    password: 'A123456789'
  },
  responseSuccess: {
    success: true,
    token: 'eyJhbGciOiJIUzI1NiIs...',
    user: {
      id: 1,
      name: '約翰·多伊',
      role: 'employee',
      store: '內壢忠孝店',
      position: '正職員工'
    }
  },
  responseError: {
    success: false,
    error: '帳號或密碼錯誤',
    code: 'INVALID_CREDENTIALS'
  }
};

/**
 * @api {post} /api/auth/logout 用戶登出
 * @apiGroup Authentication
 * @apiHeader {String} Authorization Bearer Token
 * @apiSuccess {Boolean} success 成功狀態
 */
const logoutAPI = {
  endpoint: 'POST /api/auth/logout',
  headers: {
    'Authorization': 'Bearer {token}'
  },
  responseSuccess: {
    success: true,
    message: '登出成功'
  }
};

/**
 * @api {post} /api/auth/register 員工註冊
 * @apiGroup Authentication
 * @apiParam {String} name 姓名
 * @apiParam {String} idNumber 身分證號
 * @apiParam {String} birthDate 出生日期 (YYYY-MM-DD)
 * @apiParam {String} gender 性別 (male/female)
 * @apiParam {String} hasLicense 持有駕照 (yes/no)
 * @apiParam {String} phone 聯絡電話
 * @apiParam {String} address 聯絡地址
 * @apiParam {String} emergencyContact 緊急聯絡人
 * @apiParam {String} emergencyRelationship 關係
 * @apiParam {String} emergencyPhone 緊急聯絡人電話
 * @apiParam {String} hireDate 到職日 (YYYY-MM-DD)
 */
const registerAPI = {
  endpoint: 'POST /api/auth/register',
  requestBody: {
    name: '測試員工',
    idNumber: 'A123456789',
    birthDate: '1990-01-01',
    gender: 'male',
    hasLicense: 'yes',
    phone: '0912345678',
    address: '台北市信義區測試路123號',
    emergencyContact: '測試家屬',
    emergencyRelationship: '父親',
    emergencyPhone: '0987654321',
    hireDate: '2025-08-09'
  },
  responseSuccess: {
    success: true,
    message: '註冊成功，等待審核',
    employeeId: 1
  }
};

// =============================
// 2. 打卡系統 API
// =============================

/**
 * @api {post} /api/attendance/clock-in 上班打卡
 * @apiGroup Attendance
 * @apiHeader {String} Authorization Bearer Token
 * @apiParam {Number} latitude 緯度
 * @apiParam {Number} longitude 經度
 * @apiParam {String} deviceFingerprint 設備指紋
 */
const clockInAPI = {
  endpoint: 'POST /api/attendance/clock-in',
  headers: {
    'Authorization': 'Bearer {token}'
  },
  requestBody: {
    latitude: 24.9748412,
    longitude: 121.2556713,
    deviceFingerprint: 'hash-string-from-browser'
  },
  responseSuccess: {
    success: true,
    message: '上班打卡成功',
    data: {
      clockTime: '2025-08-09T09:00:00Z',
      storeName: '內壢忠孝店',
      distance: 25,
      isLate: false,
      lateMinutes: 0
    }
  }
};

/**
 * @api {post} /api/attendance/clock-out 下班打卡
 * @apiGroup Attendance  
 * @apiHeader {String} Authorization Bearer Token
 * @apiParam {Number} latitude 緯度
 * @apiParam {Number} longitude 經度
 * @apiParam {String} deviceFingerprint 設備指紋
 */
const clockOutAPI = {
  endpoint: 'POST /api/attendance/clock-out',
  headers: {
    'Authorization': 'Bearer {token}'
  },
  requestBody: {
    latitude: 24.9748412,
    longitude: 121.2556713,
    deviceFingerprint: 'hash-string-from-browser'
  },
  responseSuccess: {
    success: true,
    message: '下班打卡成功',
    data: {
      clockTime: '2025-08-09T18:00:00Z',
      storeName: '內壢忠孝店',
      distance: 30,
      workHours: 9.0
    }
  }
};

/**
 * @api {get} /api/attendance/recent 最近打卡記錄
 * @apiGroup Attendance
 * @apiHeader {String} Authorization Bearer Token
 * @apiParam {Number} [limit=5] 回傳筆數
 */
const recentAttendanceAPI = {
  endpoint: 'GET /api/attendance/recent?limit=5',
  headers: {
    'Authorization': 'Bearer {token}'
  },
  responseSuccess: {
    success: true,
    data: [
      {
        id: 1,
        clockType: 'clock_in',
        clockTime: '2025-08-09T09:00:00Z',
        storeName: '內壢忠孝店',
        distance: 25,
        isLate: false
      }
    ]
  }
};

// =============================
// 3. 營收管理 API
// =============================

/**
 * @api {get} /api/revenue/categories 取得營收類別
 * @apiGroup Revenue
 * @apiHeader {String} Authorization Bearer Token
 */
const revenueCategoriesAPI = {
  endpoint: 'GET /api/revenue/categories',
  headers: {
    'Authorization': 'Bearer {token}'
  },
  responseSuccess: {
    success: true,
    data: {
      income: [
        { id: 1, name: '現場營業額', serviceFee: 0 },
        { id: 2, name: '熊貓點餐', serviceFee: 0.35 }
      ],
      expense: [
        { id: 6, name: '瓦斯', serviceFee: 0 },
        { id: 7, name: '水電', serviceFee: 0 }
      ]
    }
  }
};

/**
 * @api {post} /api/revenue/record 營收記錄
 * @apiGroup Revenue
 * @apiHeader {String} Authorization Bearer Token
 * @apiParam {String} recordDate 記錄日期 (YYYY-MM-DD)
 * @apiParam {Number} storeId 分店ID
 * @apiParam {String} bonusType 獎金類別 (weekday/holiday)
 * @apiParam {Number} orderCount 訂單數量
 * @apiParam {Array} incomeItems 收入項目
 * @apiParam {Array} expenseItems 支出項目
 * @apiParam {String} [notes] 備註
 */
const revenueRecordAPI = {
  endpoint: 'POST /api/revenue/record',
  headers: {
    'Authorization': 'Bearer {token}'
  },
  requestBody: {
    recordDate: '2025-08-09',
    storeId: 1,
    bonusType: 'weekday',
    orderCount: 10,
    incomeItems: [
      { categoryId: 1, amount: 10000 },
      { categoryId: 3, amount: 5000 }
    ],
    expenseItems: [
      { categoryId: 6, amount: 1000 },
      { categoryId: 7, amount: 500 }
    ],
    notes: '正常營業'
  },
  responseSuccess: {
    success: true,
    message: '營收記錄成功',
    data: {
      totalIncome: 15000,
      totalExpense: 1500,
      netIncome: 13500,
      bonusAmount: 4050,
      bonusEligible: true
    }
  }
};

/**
 * @api {get} /api/revenue/recent 最近營收記錄
 * @apiGroup Revenue
 * @apiHeader {String} Authorization Bearer Token
 * @apiParam {Number} [limit=9] 回傳筆數（每店3筆）
 */
const recentRevenueAPI = {
  endpoint: 'GET /api/revenue/recent?limit=9',
  headers: {
    'Authorization': 'Bearer {token}'
  },
  responseSuccess: {
    success: true,
    data: [
      {
        id: 1,
        recordDate: '2025-08-09',
        storeName: '內壢忠孝店',
        bonusType: 'weekday',
        bonusAmount: 4050,
        bonusStatus: 'qualified',
        createdAt: '2025-08-09T10:30:00Z'
      }
    ]
  }
};

/**
 * @api {put} /api/revenue/void/{id} 作廢營收記錄
 * @apiGroup Revenue
 * @apiHeader {String} Authorization Bearer Token
 * @apiParam {String} reason 作廢原因
 */
const voidRevenueAPI = {
  endpoint: 'PUT /api/revenue/void/{id}',
  headers: {
    'Authorization': 'Bearer {token}'
  },
  requestBody: {
    reason: '數據錯誤需要重新輸入'
  },
  responseSuccess: {
    success: true,
    message: '營收記錄已作廢'
  }
};

// =============================
// 4. 叫貨系統 API
// =============================

/**
 * @api {get} /api/orders/products 取得商品清單
 * @apiGroup Orders
 * @apiHeader {String} Authorization Bearer Token
 * @apiParam {Number} [categoryId] 商品類別ID
 */
const productsAPI = {
  endpoint: 'GET /api/orders/products?categoryId=1',
  headers: {
    'Authorization': 'Bearer {token}'
  },
  responseSuccess: {
    success: true,
    data: {
      categories: [
        { id: 1, name: '肉類' },
        { id: 2, name: '蔬菜' }
      ],
      products: [
        {
          id: 1,
          name: '雞胸肉',
          categoryName: '肉類',
          supplierName: '聯華食品',
          unit: '公斤',
          unitPrice: 120,
          alertDays: 2
        }
      ]
    }
  }
};

/**
 * @api {post} /api/orders/create 建立叫貨單
 * @apiGroup Orders
 * @apiHeader {String} Authorization Bearer Token
 * @apiParam {String} deliveryDate 送貨日期 (YYYY-MM-DD)
 * @apiParam {Number} storeId 分店ID
 * @apiParam {Array} items 商品項目
 */
const createOrderAPI = {
  endpoint: 'POST /api/orders/create',
  headers: {
    'Authorization': 'Bearer {token}'
  },
  requestBody: {
    deliveryDate: '2025-08-11',
    storeId: 1,
    items: [
      {
        productId: 1,
        quantity: 10,
        unitPrice: 120
      },
      {
        productId: 2,
        quantity: 5,
        unitPrice: 80
      }
    ]
  },
  responseSuccess: {
    success: true,
    message: '叫貨單建立成功',
    data: {
      orderId: 1,
      totalAmount: 1600,
      supplierBreakdown: [
        {
          supplierName: '聯華食品',
          items: ['雞胸肉 x10'],
          subtotal: 1200
        },
        {
          supplierName: '新鮮蔬果',
          items: ['生菜 x5'],
          subtotal: 400
        }
      ]
    }
  }
};

/**
 * @api {get} /api/orders/recent 最近叫貨記錄
 * @apiGroup Orders
 * @apiHeader {String} Authorization Bearer Token
 * @apiParam {Number} [limit=10] 回傳筆數
 */
const recentOrdersAPI = {
  endpoint: 'GET /api/orders/recent?limit=10',
  headers: {
    'Authorization': 'Bearer {token}'
  },
  responseSuccess: {
    success: true,
    data: [
      {
        id: 1,
        deliveryDate: '2025-08-11',
        storeName: '內壢忠孝店',
        totalAmount: 1600,
        itemCount: 2,
        status: 'pending',
        createdAt: '2025-08-09T14:30:00Z'
      }
    ]
  }
};

/**
 * @api {put} /api/orders/void/{id} 作廢叫貨單
 * @apiGroup Orders
 * @apiHeader {String} Authorization Bearer Token
 * @apiParam {String} reason 作廢原因
 */
const voidOrderAPI = {
  endpoint: 'PUT /api/orders/void/{id}',
  headers: {
    'Authorization': 'Bearer {token}'
  },
  requestBody: {
    reason: '數量錯誤需要重新下單'
  },
  responseSuccess: {
    success: true,
    message: '叫貨單已作廢'
  }
};

/**
 * @api {post} /api/orders/report-anomaly 回報品項異常
 * @apiGroup Orders
 * @apiHeader {String} Authorization Bearer Token
 * @apiParam {Number} productId 商品ID
 * @apiParam {String} description 異常描述
 */
const reportAnomalyAPI = {
  endpoint: 'POST /api/orders/report-anomaly',
  headers: {
    'Authorization': 'Bearer {token}'
  },
  requestBody: {
    productId: 1,
    description: '雞胸肉品質不佳，有異味'
  },
  responseSuccess: {
    success: true,
    message: '異常回報已提交'
  }
};

// =============================
// 5. 排班系統 API
// =============================

/**
 * @api {get} /api/schedule/settings 取得排班設定
 * @apiGroup Schedule
 * @apiHeader {String} Authorization Bearer Token
 */
const scheduleSettingsAPI = {
  endpoint: 'GET /api/schedule/settings',
  headers: {
    'Authorization': 'Bearer {token}'
  },
  responseSuccess: {
    success: true,
    data: {
      scheduleMonth: '2025-09',
      maxDaysOffPerPerson: 8,
      maxDailyOffTotal: 2,
      maxWeekendOffPerPerson: 3,
      maxStoreDailyOff: 1,
      operationTimeMinutes: 5,
      systemOpenTime: '2025-08-16T02:00:00Z',
      systemCloseTime: '2025-08-21T02:00:00Z',
      status: 'upcoming',
      restrictions: [
        {
          storeId: 1,
          storeName: '內壢忠孝店',
          forbiddenDates: ['2025-09-15', '2025-09-30'],
          holidayDates: ['2025-09-10', '2025-09-20']
        }
      ]
    }
  }
};

/**
 * @api {get} /api/schedule/status 檢查排班系統狀態
 * @apiGroup Schedule
 * @apiHeader {String} Authorization Bearer Token
 */
const scheduleStatusAPI = {
  endpoint: 'GET /api/schedule/status',
  headers: {
    'Authorization': 'Bearer {token}'
  },
  responseSuccess: {
    success: true,
    data: {
      systemStatus: 'closed', // upcoming, active, closed
      canEnter: false,
      reason: '系統未開放',
      currentUser: null,
      timeRemaining: 0,
      hasCompleted: false
    }
  }
};

/**
 * @api {post} /api/schedule/enter 進入排班系統
 * @apiGroup Schedule
 * @apiHeader {String} Authorization Bearer Token
 */
const enterScheduleAPI = {
  endpoint: 'POST /api/schedule/enter',
  headers: {
    'Authorization': 'Bearer {token}'
  },
  responseSuccess: {
    success: true,
    message: '成功進入排班系統',
    data: {
      sessionId: 1,
      timeLimit: 300000, // 5分鐘 (毫秒)
      calendar: [
        {
          date: '2025-09-01',
          dayOfWeek: 0, // 0=Sunday
          isWeekend: true,
          isForbidden: false,
          isStoreHoliday: false,
          canSelect: true,
          isSelected: false
        }
      ]
    }
  }
};

/**
 * @api {post} /api/schedule/select-dates 選擇休假日期
 * @apiGroup Schedule  
 * @apiHeader {String} Authorization Bearer Token
 * @apiParam {Array} selectedDates 選擇的日期陣列
 */
const selectDatesAPI = {
  endpoint: 'POST /api/schedule/select-dates',
  headers: {
    'Authorization': 'Bearer {token}'
  },
  requestBody: {
    selectedDates: ['2025-09-01', '2025-09-08', '2025-09-15']
  },
  responseSuccess: {
    success: true,
    message: '排班設定成功',
    data: {
      selectedCount: 3,
      remainingDays: 5,
      violations: []
    }
  }
};

/**
 * @api {get} /api/schedule/my-schedule 我的排班記錄
 * @apiGroup Schedule
 * @apiHeader {String} Authorization Bearer Token
 */
const myScheduleAPI = {
  endpoint: 'GET /api/schedule/my-schedule',
  headers: {
    'Authorization': 'Bearer {token}'
  },
  responseSuccess: {
    success: true,
    data: [
      {
        id: 1,
        scheduleMonth: '2025-09',
        selectedDates: ['2025-09-01', '2025-09-08'],
        totalDaysOff: 2,
        canVoid: true,
        createdAt: '2025-08-20T10:30:00Z'
      }
    ]
  }
};

// =============================
// 6. 升遷投票 API
// =============================

/**
 * @api {get} /api/promotion/positions 取得職位階級
 * @apiGroup Promotion
 * @apiHeader {String} Authorization Bearer Token
 */
const promotionPositionsAPI = {
  endpoint: 'GET /api/promotion/positions',
  headers: {
    'Authorization': 'Bearer {token}'
  },
  responseSuccess: {
    success: true,
    data: [
      {
        id: 2,
        name: '正職員工',
        levelOrder: 2,
        baseSalary: 28000,
        bonusRate: 0.01,
        quotaLimit: 0,
        requiredDays: 30,
        description: '正式員工'
      }
    ]
  }
};

/**
 * @api {get} /api/promotion/eligibility 檢查升遷資格
 * @apiGroup Promotion
 * @apiHeader {String} Authorization Bearer Token
 */
const promotionEligibilityAPI = {
  endpoint: 'GET /api/promotion/eligibility',
  headers: {
    'Authorization': 'Bearer {token}'
  },
  responseSuccess: {
    success: true,
    data: {
      currentPosition: '實習生',
      positionStartDate: '2025-07-10',
      daysInPosition: 30,
      canPromote: true,
      nextPosition: '正職員工',
      requiredDays: 30,
      cooldownEnd: null,
      quotaAvailable: true,
      eligibilityReasons: []
    }
  }
};

/**
 * @api {post} /api/promotion/initiate 發起升遷投票
 * @apiGroup Promotion
 * @apiHeader {String} Authorization Bearer Token
 * @apiParam {Number} targetPositionId 目標職位ID
 */
const initiatePromotionAPI = {
  endpoint: 'POST /api/promotion/initiate',
  headers: {
    'Authorization': 'Bearer {token}'
  },
  requestBody: {
    targetPositionId: 2
  },
  responseSuccess: {
    success: true,
    message: '升遷投票已發起',
    data: {
      voteId: 1,
      voteEndDate: '2025-08-14',
      totalVoters: 8,
      requiredApprovalRate: 0.6
    }
  }
};

/**
 * @api {get} /api/promotion/active 取得進行中投票
 * @apiGroup Promotion
 * @apiHeader {String} Authorization Bearer Token
 */
const activePromotionsAPI = {
  endpoint: 'GET /api/promotion/active',
  headers: {
    'Authorization': 'Bearer {token}'
  },
  responseSuccess: {
    success: true,
    data: [
      {
        id: 1,
        candidateName: '測試員工',
        currentPosition: '實習生',
        targetPosition: '正職員工',
        voteEndDate: '2025-08-14',
        totalVoters: 8,
        approveVotes: 3,
        rejectVotes: 2,
        requiredApprovalRate: 0.6,
        hasVoted: false,
        myVote: null,
        canChangeVote: true,
        dailyChangesUsed: 0
      }
    ]
  }
};

/**
 * @api {post} /api/promotion/vote 投票
 * @apiGroup Promotion
 * @apiHeader {String} Authorization Bearer Token
 * @apiParam {Number} voteId 投票ID
 * @apiParam {String} decision 投票決定 (approve/reject)
 */
const castVoteAPI = {
  endpoint: 'POST /api/promotion/vote',
  headers: {
    'Authorization': 'Bearer {token}'
  },
  requestBody: {
    voteId: 1,
    decision: 'approve'
  },
  responseSuccess: {
    success: true,
    message: '投票成功',
    data: {
      currentVote: 'approve',
      remainingChanges: 2
    }
  }
};

// =============================
// 7. 維修管理 API
// =============================

/**
 * @api {post} /api/maintenance/report 設備報修
 * @apiGroup Maintenance
 * @apiHeader {String} Authorization Bearer Token
 * @apiParam {Number} storeId 分店ID
 * @apiParam {String} equipmentName 設備名稱
 * @apiParam {String} issueDescription 問題描述
 * @apiParam {String} priority 優先級 (low/medium/high/critical)
 * @apiParam {String} category 類別 (repair/maintenance/replacement)
 * @apiParam {Array} [photos] 照片檔案
 */
const reportMaintenanceAPI = {
  endpoint: 'POST /api/maintenance/report',
  headers: {
    'Authorization': 'Bearer {token}'
  },
  requestBody: {
    storeId: 1,
    equipmentName: '冷凍櫃',
    issueDescription: '冷凍櫃溫度異常，無法正常製冷',
    priority: 'high',
    category: 'repair',
    photos: ['base64-encoded-image-1', 'base64-encoded-image-2']
  },
  responseSuccess: {
    success: true,
    message: '維修申請已提交',
    data: {
      requestId: 1,
      estimatedPriority: 'high',
      autoAssignedCategory: 'repair'
    }
  }
};

/**
 * @api {get} /api/maintenance/recent 最近維修記錄
 * @apiGroup Maintenance
 * @apiHeader {String} Authorization Bearer Token
 * @apiParam {Number} [limit=10] 回傳筆數
 */
const recentMaintenanceAPI = {
  endpoint: 'GET /api/maintenance/recent?limit=10',
  headers: {
    'Authorization': 'Bearer {token}'
  },
  responseSuccess: {
    success: true,
    data: [
      {
        id: 1,
        equipmentName: '冷凍櫃',
        storeName: '內壢忠孝店',
        priority: 'high',
        status: 'reported',
        reportedAt: '2025-08-09T15:30:00Z',
        photoCount: 2
      }
    ]
  }
};

// =============================
// 8. 照片管理 API
// =============================

/**
 * @api {post} /api/photos/upload 上傳照片
 * @apiGroup Photos
 * @apiHeader {String} Authorization Bearer Token
 * @apiParam {String} referenceType 關聯類型 (revenue/maintenance/order)
 * @apiParam {Number} referenceId 關聯ID
 * @apiParam {String} category 照片類別
 * @apiParam {File} file 照片檔案
 */
const uploadPhotoAPI = {
  endpoint: 'POST /api/photos/upload',
  headers: {
    'Authorization': 'Bearer {token}',
    'Content-Type': 'multipart/form-data'
  },
  requestBody: {
    referenceType: 'maintenance',
    referenceId: 1,
    category: '設備故障',
    file: 'binary-file-data'
  },
  responseSuccess: {
    success: true,
    message: '照片上傳成功',
    data: {
      photoId: 1,
      fileName: 'maintenance_20250809_001.jpg',
      fileSize: 2048576,
      url: '/uploads/maintenance/20250809/maintenance_20250809_001.jpg'
    }
  }
};

// =============================
// 9. 系統管理 API (管理員專用)
// =============================

/**
 * @api {get} /api/admin/employees 員工清單
 * @apiGroup Admin
 * @apiHeader {String} Authorization Bearer Token (管理員)
 * @apiParam {String} [status] 員工狀態篩選
 * @apiParam {Number} [storeId] 分店篩選
 */
const adminEmployeesAPI = {
  endpoint: 'GET /api/admin/employees?status=active&storeId=1',
  headers: {
    'Authorization': 'Bearer {admin-token}'
  },
  responseSuccess: {
    success: true,
    data: [
      {
        id: 1,
        name: '測試員工',
        idNumber: 'A123******',
        currentStore: '內壢忠孝店',
        position: '正職員工',
        status: 'active',
        hireDate: '2025-07-10',
        phone: '0912345678'
      }
    ]
  }
};

/**
 * @api {put} /api/admin/employees/{id} 更新員工資料
 * @apiGroup Admin
 * @apiHeader {String} Authorization Bearer Token (管理員)
 */
const updateEmployeeAPI = {
  endpoint: 'PUT /api/admin/employees/{id}',
  headers: {
    'Authorization': 'Bearer {admin-token}'
  },
  requestBody: {
    name: '測試員工',
    currentStoreId: 2,
    positionId: 3,
    status: 'active',
    phone: '0912345679'
  },
  responseSuccess: {
    success: true,
    message: '員工資料更新成功'
  }
};

/**
 * @api {get} /api/admin/config 取得系統配置
 * @apiGroup Admin
 * @apiHeader {String} Authorization Bearer Token (管理員)
 */
const adminConfigAPI = {
  endpoint: 'GET /api/admin/config',
  headers: {
    'Authorization': 'Bearer {admin-token}'
  },
  responseSuccess: {
    success: true,
    data: {
      stores: [/* 分店設定 */],
      positions: [/* 職位設定 */],
      revenueCategories: [/* 營收類別 */],
      products: [/* 商品清單 */],
      notifications: {
        telegramBotToken: '7659930552:AAF_jF1rAXFnjFO176-9X5fKfBwbrko8BNc',
        bossChatId: '-1002658082392',
        employeeChatId: '-1002658082392'
      },
      scheduleSettings: {/* 排班設定 */},
      backupSettings: {/* 備份設定 */}
    }
  }
};

/**
 * @api {put} /api/admin/config 更新系統配置
 * @apiGroup Admin
 * @apiHeader {String} Authorization Bearer Token (管理員)
 */
const updateConfigAPI = {
  endpoint: 'PUT /api/admin/config',
  headers: {
    'Authorization': 'Bearer {admin-token}'
  },
  requestBody: {
    configKey: 'weekday_bonus_threshold',
    configValue: '15000',
    category: 'bonus'
  },
  responseSuccess: {
    success: true,
    message: '系統配置更新成功'
  }
};

// =============================
// 10. 通知系統 API
// =============================

/**
 * @api {post} /api/notifications/send 發送通知
 * @apiGroup Notifications
 * @apiHeader {String} Authorization Bearer Token
 * @apiParam {String} type 通知類型
 * @apiParam {Object} data 通知資料
 * @apiParam {String} [priority] 優先級 (high/normal/low)
 */
const sendNotificationAPI = {
  endpoint: 'POST /api/notifications/send',
  headers: {
    'Authorization': 'Bearer {token}'
  },
  requestBody: {
    type: 'CLOCK_IN',
    data: {
      employeeName: '測試員工',
      storeName: '內壢忠孝店',
      time: '2025-08-09T09:00:00Z',
      distance: 25,
      isLate: false
    },
    priority: 'normal'
  },
  responseSuccess: {
    success: true,
    message: '通知發送成功',
    data: {
      telegramMessageId: '12345',
      sentAt: '2025-08-09T09:01:00Z'
    }
  }
};

// =============================
// 通用錯誤回應格式
// =============================

const errorResponses = {
  // 認證錯誤
  UNAUTHORIZED: {
    success: false,
    error: 'Token無效或已過期',
    code: 'UNAUTHORIZED',
    statusCode: 401
  },
  
  // 權限不足
  FORBIDDEN: {
    success: false,
    error: '權限不足',
    code: 'FORBIDDEN',
    statusCode: 403
  },
  
  // 資料驗證錯誤
  VALIDATION_ERROR: {
    success: false,
    error: '資料驗證失敗',
    code: 'VALIDATION_ERROR',
    details: [
      {
        field: 'phone',
        message: '手機號碼格式不正確'
      }
    ],
    statusCode: 400
  },
  
  // 業務邏輯錯誤
  BUSINESS_ERROR: {
    success: false,
    error: '距離分店太遠，無法打卡',
    code: 'OUT_OF_RANGE',
    statusCode: 422
  },
  
  // 系統錯誤
  INTERNAL_ERROR: {
    success: false,
    error: '系統內部錯誤',
    code: 'INTERNAL_ERROR',
    statusCode: 500
  }
};

// =============================
// API 速率限制說明
// =============================

const rateLimits = {
  login: '5 requests per 15 minutes per IP',
  register: '3 requests per hour per IP', 
  attendance: '10 requests per minute per user',
  revenue: '20 requests per minute per user',
  orders: '20 requests per minute per user',
  schedule: '5 requests per minute per user during active period',
  promotion: '3 requests per minute per user',
  maintenance: '10 requests per minute per user',
  photos: '5 uploads per minute per user',
  admin: '100 requests per minute per admin',
  notifications: '50 requests per minute per user'
};

// =============================
// WebSocket 事件 (即時通知)
// =============================

const websocketEvents = {
  // 連線
  connect: {
    event: 'connect',
    auth: { token: 'Bearer {token}' }
  },
  
  // 排班系統狀態更新
  scheduleStatusUpdate: {
    event: 'schedule_status_update',
    data: {
      systemStatus: 'active',
      currentUser: '測試員工',
      timeRemaining: 240000
    }
  },
  
  // 投票狀態更新
  voteUpdate: {
    event: 'vote_update',
    data: {
      voteId: 1,
      approveVotes: 4,
      rejectVotes: 2,
      timeRemaining: 86400000
    }
  },
  
  // 系統通知
  systemNotification: {
    event: 'system_notification',
    data: {
      type: 'info',
      title: '系統維護通知',
      message: '系統將於今晚23:00-01:00進行維護',
      timestamp: '2025-08-09T16:00:00Z'
    }
  }
};

module.exports = {
  // 認證相關
  loginAPI,
  logoutAPI,
  registerAPI,
  
  // 打卡系統
  clockInAPI,
  clockOutAPI,
  recentAttendanceAPI,
  
  // 營收管理
  revenueCategoriesAPI,
  revenueRecordAPI,
  recentRevenueAPI,
  voidRevenueAPI,
  
  // 叫貨系統
  productsAPI,
  createOrderAPI,
  recentOrdersAPI,
  voidOrderAPI,
  reportAnomalyAPI,
  
  // 排班系統
  scheduleSettingsAPI,
  scheduleStatusAPI,
  enterScheduleAPI,
  selectDatesAPI,
  myScheduleAPI,
  
  // 升遷投票
  promotionPositionsAPI,
  promotionEligibilityAPI,
  initiatePromotionAPI,
  activePromotionsAPI,
  castVoteAPI,
  
  // 維修管理
  reportMaintenanceAPI,
  recentMaintenanceAPI,
  
  // 照片管理
  uploadPhotoAPI,
  
  // 系統管理
  adminEmployeesAPI,
  updateEmployeeAPI,
  adminConfigAPI,
  updateConfigAPI,
  
  // 通知系統
  sendNotificationAPI,
  
  // 錯誤處理
  errorResponses,
  rateLimits,
  websocketEvents
};