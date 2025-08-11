/**
 * 🏗️ 企業級員工管理系統 - 完整數據模型設計
 * 基於系統邏輯.txt v2.0 的20個核心資料表
 */

const enterpriseDataModel = {
    
    // ==================== 核心基礎表 ====================
    
    stores: {
        id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
        name: 'VARCHAR(100) NOT NULL',           // 分店名稱
        code: 'VARCHAR(20) UNIQUE NOT NULL',     // 分店代碼
        address: 'TEXT',                        // 地址
        phone: 'VARCHAR(20)',                   // 電話
        manager_id: 'INTEGER',                  // 店長ID
        latitude: 'DECIMAL(10,8)',              // GPS緯度
        longitude: 'DECIMAL(11,8)',             // GPS經度
        status: 'VARCHAR(20) DEFAULT "active"', // 狀態: active/inactive
        created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        updated_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
    },
    
    employees: {
        id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
        // 基本資料 (11個必填欄位)
        name: 'VARCHAR(50) NOT NULL',                    // 員工姓名 (登入帳號)
        idNumber: 'VARCHAR(20) UNIQUE NOT NULL',         // 身分證字號 (登入密碼)
        birthDate: 'DATE NOT NULL',                      // 出生日期
        gender: 'VARCHAR(10) NOT NULL',                  // 性別
        hasDriverLicense: 'BOOLEAN DEFAULT false',       // 是否持有駕照
        phone: 'VARCHAR(20) NOT NULL',                   // 聯絡電話
        address: 'TEXT NOT NULL',                        // 住址
        emergencyContactName: 'VARCHAR(50) NOT NULL',    // 緊急聯絡人姓名
        emergencyContactRelation: 'VARCHAR(20) NOT NULL', // 緊急聯絡人關係
        emergencyContactPhone: 'VARCHAR(20) NOT NULL',   // 緊急聯絡人電話
        hireDate: 'DATE NOT NULL',                       // 到職日期
        
        // 系統資料
        store_id: 'INTEGER NOT NULL REFERENCES stores(id)',
        position: 'VARCHAR(20) DEFAULT "實習生"',         // 職位: 實習生/員工/副店長/店長/區域經理
        status: 'VARCHAR(20) DEFAULT "審核中"',           // 狀態: 在職/離職/留職停薪/審核中
        salary: 'INTEGER',                               // 薪資
        permissions: 'TEXT',                            // JSON格式權限
        created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        updated_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
    },
    
    // ==================== GPS打卡系統 ====================
    
    attendance_records: {
        id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
        employee_id: 'INTEGER NOT NULL REFERENCES employees(id)',
        store_id: 'INTEGER NOT NULL REFERENCES stores(id)',
        check_type: 'VARCHAR(20) NOT NULL',              // 打卡類型: 上班打卡/下班打卡
        check_time: 'TIMESTAMP NOT NULL',               // 打卡時間
        latitude: 'DECIMAL(10,8)',                      // GPS緯度
        longitude: 'DECIMAL(11,8)',                     // GPS經度
        distance_from_store: 'INTEGER',                 // 距離分店公尺數
        device_info: 'TEXT',                           // 裝置資訊
        status: 'VARCHAR(20)',                         // 狀態: 正常/遲到/早退/異常
        late_minutes: 'INTEGER DEFAULT 0',            // 遲到分鐘數
        notes: 'TEXT',                                // 備註
        created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
    },
    
    attendance_statistics: {
        id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
        employee_id: 'INTEGER NOT NULL REFERENCES employees(id)',
        month: 'VARCHAR(7) NOT NULL',                  // 格式: 2025-08
        total_late_count: 'INTEGER DEFAULT 0',        // 月遲到次數
        total_late_minutes: 'INTEGER DEFAULT 0',      // 月遲到總分鐘數
        total_work_days: 'INTEGER DEFAULT 0',         // 總工作天數
        punishment_triggered: 'BOOLEAN DEFAULT false', // 是否觸發懲罰投票
        created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        updated_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
    },
    
    // ==================== 營收管理系統 ====================
    
    revenue_records: {
        id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
        store_id: 'INTEGER NOT NULL REFERENCES stores(id)',
        date: 'DATE NOT NULL',                         // 日期
        income_amount: 'DECIMAL(12,2) DEFAULT 0',      // 收入金額 ⭐
        expense_amount: 'DECIMAL(12,2) DEFAULT 0',     // 支出金額 ⭐
        income_category: 'VARCHAR(50)',                // 收入分類 ⭐
        expense_category: 'VARCHAR(50)',               // 支出分類 ⭐
        description: 'TEXT',                          // 詳細說明
        created_by: 'INTEGER REFERENCES employees(id)', // 記錄員工
        bonus_calculated: 'DECIMAL(10,2)',            // 計算獎金
        performance_target: 'DECIMAL(12,2)',          // 績效目標
        created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        updated_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
    },
    
    // ==================== 庫存管理系統 ====================
    
    inventory_categories: {
        id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
        name: 'VARCHAR(100) NOT NULL',                // 分類名稱
        parent_id: 'INTEGER REFERENCES inventory_categories(id)', // 父分類ID
        level: 'INTEGER DEFAULT 1',                  // 分類層級
        sort_order: 'INTEGER DEFAULT 0',             // 排序順序
        description: 'TEXT',                         // 分類說明
        created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
    },
    
    inventory_items: {
        id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
        name: 'VARCHAR(200) NOT NULL',                // 商品名稱
        category_id: 'INTEGER REFERENCES inventory_categories(id)',
        subcategory_id: 'INTEGER REFERENCES inventory_categories(id)',
        sku: 'VARCHAR(50) UNIQUE',                   // 商品編號
        price: 'DECIMAL(10,2)',                      // 單價
        unit: 'VARCHAR(20)',                         // 單位
        supplier: 'VARCHAR(200)',                    // 供應商
        description: 'TEXT',                         // 商品描述
        min_stock_level: 'INTEGER DEFAULT 0',       // 最低庫存
        max_stock_level: 'INTEGER DEFAULT 1000',    // 最高庫存
        current_stock: 'INTEGER DEFAULT 0',         // 目前庫存
        status: 'VARCHAR(20) DEFAULT "active"',     // 狀態
        created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        updated_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
    },
    
    inventory_orders: {
        id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
        store_id: 'INTEGER NOT NULL REFERENCES stores(id)',
        order_number: 'VARCHAR(50) UNIQUE',          // 叫貨單號
        order_date: 'DATE NOT NULL',                 // 叫貨日期
        status: 'VARCHAR(20) DEFAULT "pending"',     // 狀態: pending/approved/shipped/received
        total_amount: 'DECIMAL(12,2)',               // 總金額
        created_by: 'INTEGER REFERENCES employees(id)', // 建立人員
        approved_by: 'INTEGER REFERENCES employees(id)', // 審核人員
        notes: 'TEXT',                               // 備註
        created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        updated_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
    },
    
    inventory_order_items: {
        id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
        order_id: 'INTEGER NOT NULL REFERENCES inventory_orders(id)',
        item_id: 'INTEGER NOT NULL REFERENCES inventory_items(id)',
        quantity: 'INTEGER NOT NULL',               // 叫貨數量
        unit_price: 'DECIMAL(10,2)',               // 單價
        subtotal: 'DECIMAL(12,2)',                 // 小計
        received_quantity: 'INTEGER DEFAULT 0',    // 已收數量
        notes: 'TEXT'                              // 備註
    },
    
    inventory_logs: {
        id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
        item_id: 'INTEGER NOT NULL REFERENCES inventory_items(id)',
        store_id: 'INTEGER NOT NULL REFERENCES stores(id)',
        action_type: 'VARCHAR(20) NOT NULL',        // 異動類型: in/out/adjust
        quantity_change: 'INTEGER NOT NULL',       // 數量變更
        before_quantity: 'INTEGER',                // 異動前數量
        after_quantity: 'INTEGER',                 // 異動後數量
        reason: 'TEXT',                           // 異動原因
        created_by: 'INTEGER REFERENCES employees(id)',
        created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
    },
    
    inventory_alerts: {
        id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
        item_id: 'INTEGER NOT NULL REFERENCES inventory_items(id)',
        store_id: 'INTEGER NOT NULL REFERENCES stores(id)',
        alert_type: 'VARCHAR(20) NOT NULL',         // 警報類型: low_stock/overstock/expired
        message: 'TEXT',                           // 警報訊息
        is_resolved: 'BOOLEAN DEFAULT false',      // 是否已處理
        resolved_by: 'INTEGER REFERENCES employees(id)',
        created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        resolved_at: 'TIMESTAMP'
    },
    
    // ==================== 智慧排班系統 ====================
    
    schedules: {
        id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
        employee_id: 'INTEGER NOT NULL REFERENCES employees(id)',
        store_id: 'INTEGER NOT NULL REFERENCES stores(id)',
        date: 'DATE NOT NULL',                     // 排班日期
        shift_type: 'VARCHAR(20)',                 // 班別: 早班/晚班/全天
        start_time: 'TIME',                       // 開始時間
        end_time: 'TIME',                         // 結束時間
        hours: 'DECIMAL(4,2)',                    // 工作時數
        status: 'VARCHAR(20) DEFAULT "scheduled"', // 狀態: scheduled/confirmed/cancelled
        notes: 'TEXT',                            // 備註
        created_by: 'INTEGER REFERENCES employees(id)',
        created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        updated_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
    },
    
    schedule_configs: {
        id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
        store_id: 'INTEGER NOT NULL REFERENCES stores(id)',
        config_name: 'VARCHAR(100)',               // 配置名稱
        config_data: 'TEXT',                      // JSON格式配置數據
        is_active: 'BOOLEAN DEFAULT true',        // 是否啟用
        created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        updated_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
    },
    
    schedule_sessions: {
        id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
        store_id: 'INTEGER NOT NULL REFERENCES stores(id)',
        session_name: 'VARCHAR(50)',              // 時段名稱
        start_time: 'TIME',                       // 開始時間
        end_time: 'TIME',                         // 結束時間
        min_employees: 'INTEGER DEFAULT 1',      // 最少員工數
        max_employees: 'INTEGER DEFAULT 10',     // 最多員工數
        is_active: 'BOOLEAN DEFAULT true'
    },
    
    work_assignments: {
        id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
        schedule_id: 'INTEGER NOT NULL REFERENCES schedules(id)',
        employee_id: 'INTEGER NOT NULL REFERENCES employees(id)',
        assignment_type: 'VARCHAR(50)',           // 分配類型
        description: 'TEXT',                      // 工作描述
        created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
    },
    
    // ==================== 升遷投票系統 ====================
    
    promotion_campaigns: {
        id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
        campaign_name: 'VARCHAR(200)',            // 投票活動名稱
        campaign_type: 'VARCHAR(50)',             // 類型: 新人轉正/升遷申請/降職懲罰
        target_employee_id: 'INTEGER REFERENCES employees(id)', // 目標員工
        current_position: 'VARCHAR(20)',          // 當前職位
        target_position: 'VARCHAR(20)',           // 目標職位
        start_date: 'TIMESTAMP',                 // 開始時間
        end_date: 'TIMESTAMP',                   // 結束時間
        required_percentage: 'DECIMAL(5,2)',     // 通過比例
        status: 'VARCHAR(20) DEFAULT "active"',  // 狀態: active/completed/cancelled
        is_system_generated: 'BOOLEAN DEFAULT false', // 是否系統自動生成
        auto_trigger_reason: 'TEXT',             // 自動觸發原因
        created_by: 'INTEGER REFERENCES employees(id)',
        created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        updated_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
    },
    
    promotion_candidates: {
        id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
        campaign_id: 'INTEGER NOT NULL REFERENCES promotion_campaigns(id)',
        employee_id: 'INTEGER NOT NULL REFERENCES employees(id)',
        anonymous_id: 'VARCHAR(50)',              // 匿名ID: CANDIDATE_X_001
        candidate_description: 'TEXT',           // 候選人描述
        created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
    },
    
    promotion_votes: {
        id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
        campaign_id: 'INTEGER NOT NULL REFERENCES promotion_campaigns(id)',
        voter_id: 'INTEGER NOT NULL REFERENCES employees(id)',
        candidate_id: 'INTEGER REFERENCES promotion_candidates(id)',
        vote_value: 'VARCHAR(20)',               // 投票選擇: yes/no/abstain
        vote_weight: 'DECIMAL(3,2) DEFAULT 1.0', // 投票權重
        vote_hash: 'VARCHAR(64)',                // SHA-256加密投票記錄
        modification_count: 'INTEGER DEFAULT 0', // 修改次數
        final_vote: 'BOOLEAN DEFAULT true',      // 是否為最終投票
        created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        updated_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
    },
    
    vote_modification_history: {
        id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
        vote_id: 'INTEGER NOT NULL REFERENCES promotion_votes(id)',
        old_vote_value: 'VARCHAR(20)',           // 修改前投票
        new_vote_value: 'VARCHAR(20)',           // 修改後投票
        modification_reason: 'TEXT',             // 修改原因
        modification_time: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
    },
    
    // ==================== 維修保養系統 ====================
    
    maintenance_requests: {
        id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
        store_id: 'INTEGER NOT NULL REFERENCES stores(id)',
        item_name: 'VARCHAR(200) NOT NULL',       // 設備名稱
        description: 'TEXT NOT NULL',            // 問題描述
        priority: 'VARCHAR(20) DEFAULT "中"',     // 優先級: 高/中/低
        status: 'VARCHAR(20) DEFAULT "待處理"',    // 狀態: 待處理/處理中/已完成
        report_date: 'DATE NOT NULL',            // 申請日期
        reported_by: 'INTEGER REFERENCES employees(id)', // 申請人
        assigned_to: 'INTEGER REFERENCES employees(id)', // 派工人員
        estimated_cost: 'DECIMAL(10,2)',         // 預估費用
        actual_cost: 'DECIMAL(10,2)',           // 實際費用
        completion_date: 'DATE',                // 完成日期
        completion_notes: 'TEXT',               // 完工備註
        created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        updated_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
    },
    
    // ==================== 系統管理 ====================
    
    system_logs: {
        id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
        log_level: 'VARCHAR(20)',                // 日誌等級: INFO/WARN/ERROR
        module: 'VARCHAR(50)',                   // 模組名稱
        action: 'VARCHAR(100)',                  // 動作描述
        user_id: 'INTEGER REFERENCES employees(id)', // 操作用戶
        request_data: 'TEXT',                    // 請求數據
        response_data: 'TEXT',                   // 回應數據
        ip_address: 'VARCHAR(45)',              // IP位址
        user_agent: 'TEXT',                     // 瀏覽器資訊
        created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
    },
    
    notification_queue: {
        id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
        notification_type: 'VARCHAR(50)',        // 通知類型
        recipient_type: 'VARCHAR(20)',          // 接收者類型: user/group/all
        recipient_id: 'INTEGER',                // 接收者ID
        title: 'VARCHAR(200)',                  // 通知標題
        message: 'TEXT',                        // 通知內容
        telegram_message: 'TEXT',               // Telegram訊息格式
        status: 'VARCHAR(20) DEFAULT "pending"', // 狀態: pending/sent/failed
        send_time: 'TIMESTAMP',                 // 發送時間
        retry_count: 'INTEGER DEFAULT 0',       // 重試次數
        created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
        sent_at: 'TIMESTAMP'
    }
};

// ==================== API端點架構設計 ====================

const apiArchitecture = {
    
    // 基礎API
    system: {
        'GET /health': '系統健康檢查',
        'GET /api/test': '系統功能測試',
        'GET /api/stores': '獲取所有分店列表',
        'POST /api/stores': '新增分店'
    },
    
    // 員工認證系統
    auth: {
        'POST /api/auth/register': '員工註冊(11個必填欄位)',
        'POST /api/auth/login': '員工登入',
        'GET /api/auth/profile': '獲取個人資料',
        'PUT /api/auth/profile': '更新個人資料',
        'POST /api/auth/logout': '登出'
    },
    
    // 員工管理
    employees: {
        'GET /api/employees': '獲取員工列表(支援分店篩選)',
        'GET /api/employees/:id': '獲取單一員工資料',
        'PUT /api/employees/:id': '更新員工資料',
        'DELETE /api/employees/:id': '刪除員工',
        'PUT /api/employees/:id/position': '更新員工職位',
        'PUT /api/employees/:id/status': '更新員工狀態'
    },
    
    // GPS打卡系統
    attendance: {
        'POST /api/attendance/checkin': 'GPS上班打卡',
        'POST /api/attendance/checkout': 'GPS下班打卡',
        'GET /api/attendance/records': '獲取打卡記錄(分店+日期篩選)',
        'GET /api/attendance/statistics': '獲取遲到統計',
        'GET /api/attendance/monthly/:employeeId': '員工月度打卡統計'
    },
    
    // 營收管理系統 (重點修復)
    revenue: {
        'GET /api/revenue': '獲取營收記錄(分店+日期篩選)', 
        'POST /api/revenue': '新增營收記錄(收入支出分離)',
        'PUT /api/revenue/:id': '更新營收記錄',
        'DELETE /api/revenue/:id': '刪除營收記錄',
        'GET /api/revenue/categories': '獲取收支分類',
        'POST /api/revenue/categories': '新增收支分類',
        'GET /api/revenue/summary': '營收統計摘要(按分店)',
        'GET /api/revenue/chart': '營收圖表數據'
    },
    
    // 庫存管理系統 (重點修復)
    inventory: {
        'GET /api/inventory/categories': '獲取商品分類樹',
        'POST /api/inventory/categories': '新增商品分類',
        'GET /api/inventory/items': '獲取商品清單(支援分類篩選)',
        'POST /api/inventory/items': '新增商品',
        'PUT /api/inventory/items/:id': '更新商品資料',
        'GET /api/inventory/orders': '獲取叫貨單列表(分店篩選)',
        'POST /api/inventory/orders': '建立叫貨單',
        'PUT /api/inventory/orders/:id': '更新叫貨單狀態',
        'GET /api/inventory/orders/:id/items': '獲取叫貨單明細',
        'POST /api/inventory/orders/:id/items': '新增叫貨明細',
        'GET /api/inventory/alerts': '獲取庫存警報',
        'GET /api/inventory/logs': '獲取庫存異動記錄'
    },
    
    // 智慧排班系統
    schedules: {
        'GET /api/schedules': '獲取排班表(分店+日期篩選)',
        'POST /api/schedules': '新增排班',
        'PUT /api/schedules/:id': '更新排班',
        'DELETE /api/schedules/:id': '刪除排班',
        'POST /api/schedules/validate': '驗證排班規則',
        'GET /api/schedules/conflicts': '檢查排班衝突',
        'GET /api/schedules/sessions': '獲取時段配置'
    },
    
    // 升遷投票系統
    promotions: {
        'GET /api/promotions/campaigns': '獲取投票活動列表',
        'POST /api/promotions/campaigns': '建立投票活動',
        'GET /api/promotions/campaigns/:id': '獲取投票活動詳情',
        'POST /api/promotions/campaigns/:id/vote': '投票',
        'PUT /api/promotions/campaigns/:id/vote': '修改投票',
        'GET /api/promotions/campaigns/:id/results': '獲取投票結果',
        'POST /api/promotions/auto-check': '手動觸發自動投票檢查'
    },
    
    // 維修管理系統
    maintenance: {
        'GET /api/maintenance': '獲取維修請求(分店+狀態篩選)',
        'POST /api/maintenance': '提交維修請求',
        'PUT /api/maintenance/:id': '更新維修狀態',
        'DELETE /api/maintenance/:id': '刪除維修請求',
        'PUT /api/maintenance/:id/assign': '派工指派',
        'PUT /api/maintenance/:id/complete': '完工確認'
    },
    
    // 管理員專用API
    admin: {
        'GET /api/admin/dashboard': '管理員儀表板統計',
        'GET /api/admin/stats': '系統統計數據',
        'GET /api/admin/logs': '系統日誌查詢',
        'POST /api/admin/notifications/send': '發送通知',
        'GET /api/admin/notifications/queue': '通知佇列狀態',
        'POST /api/admin/system/backup': '系統備份',
        'POST /api/admin/system/maintenance': '系統維護模式'
    },
    
    // Telegram通知系統
    notifications: {
        'POST /api/notifications/telegram': '發送Telegram通知',
        'GET /api/notifications/templates': '獲取通知模板',
        'POST /api/notifications/templates': '新增通知模板',
        'PUT /api/notifications/templates/:id': '更新通知模板'
    }
};

// ==================== 前端UI組件設計 ====================

const frontendComponents = {
    
    // 分店選擇器 (全局組件)
    storeSelector: {
        component: 'StoreSelector',
        props: ['selectedStore', 'onStoreChange', 'showAll'],
        features: [
            '下拉式分店選擇',
            '支援"所有分店"選項',
            '即時切換和數據更新',
            '記住用戶選擇'
        ]
    },
    
    // 日期範圍選擇器
    dateRangePicker: {
        component: 'DateRangePicker', 
        props: ['startDate', 'endDate', 'onDateChange'],
        features: [
            '開始/結束日期選擇',
            '預設範圍(今天/本週/本月)',
            '自訂日期範圍',
            '日期驗證'
        ]
    },
    
    // 營業額管理組件
    revenueManager: {
        component: 'RevenueManager',
        subComponents: [
            'RevenueForm - 收支錄入表單',
            'RevenueList - 收支記錄列表',
            'RevenueChart - 營收圖表',
            'CategoryManager - 分類管理'
        ],
        features: [
            '收入/支出分離輸入',
            '分類下拉選擇',
            '分店和日期篩選',
            '統計圖表顯示'
        ]
    },
    
    // 叫貨系統組件
    inventorySystem: {
        component: 'InventorySystem',
        subComponents: [
            'CategoryTree - 分類樹狀結構',
            'ItemList - 商品清單',
            'OrderForm - 叫貨單表單',
            'OrderList - 叫貨單列表'
        ],
        features: [
            '多級分類篩選',
            '商品搜尋和篩選',
            '叫貨單建立和管理',
            '庫存警報提示'
        ]
    },
    
    // GPS打卡組件
    attendanceSystem: {
        component: 'AttendanceSystem',
        subComponents: [
            'GPSChecker - GPS定位組件',
            'CheckInForm - 打卡表單',
            'AttendanceHistory - 打卡記錄',
            'LateStatistics - 遲到統計'
        ],
        features: [
            '實時GPS定位',
            '距離計算和驗證',
            '打卡狀態判定',
            '遲到統計圖表'
        ]
    }
};

console.log('🏗️ 企業級數據模型設計完成');
console.log(`📊 核心資料表: ${Object.keys(enterpriseDataModel).length} 個`);
console.log(`🔌 API端點: ${Object.values(apiArchitecture).reduce((sum, group) => sum + Object.keys(group).length, 0)} 個`);
console.log(`🎨 前端組件: ${Object.keys(frontendComponents).length} 個主要組件`);

module.exports = {
    enterpriseDataModel,
    apiArchitecture,
    frontendComponents
};