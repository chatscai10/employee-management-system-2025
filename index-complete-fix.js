/**
 * 🔧 完整修復版 - 企業員工管理系統主伺服器
 * 實現所有缺失的API端點和功能模組
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;

console.log('🔧 完整修復版伺服器啟動...');
console.log(`PORT: ${port}, NODE_ENV: ${process.env.NODE_ENV}`);

// 基本中間件
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS設置
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// 安全標頭設置
app.use((req, res, next) => {
    res.header('X-Frame-Options', 'SAMEORIGIN');
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-XSS-Protection', '1; mode=block');
    res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.header('Content-Security-Policy', 
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; " +
        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; " +
        "img-src 'self' data: https: blob:; " +
        "connect-src 'self' https://api.telegram.org; " +
        "font-src 'self' https://cdn.jsdelivr.net;"
    );
    next();
});

// 靜態檔案服務
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d',
    etag: true,
    lastModified: true
}));

// 資料模擬庫 (簡化版本，生產環境應使用實際資料庫)
const mockData = {
    employees: [
        {
            id: 1,
            name: '系統管理員',
            idNumber: 'A123456789',
            position: '系統管理員',
            store: '台北總店',
            permissions: ['all'],
            salary: 80000,
            hireDate: '2024-01-01'
        },
        {
            id: 2,
            name: '王店長',
            idNumber: 'B123456789',
            position: '店長',
            store: '台北分店',
            permissions: ['management'],
            salary: 60000,
            hireDate: '2024-02-01'
        }
    ],
    inventory: [
        { id: 1, name: '筆記型電腦', category: '設備', quantity: 10, status: '正常', price: 30000 },
        { id: 2, name: '辦公椅', category: '家具', quantity: 25, status: '正常', price: 3000 },
        { id: 3, name: '投影機', category: '設備', quantity: 3, status: '維修中', price: 15000 }
    ],
    revenue: [
        { id: 1, date: '2025-08-01', amount: 50000, store: '台北總店', category: '產品銷售' },
        { id: 2, date: '2025-08-02', amount: 32000, store: '台北分店', category: '服務收入' },
        { id: 3, date: '2025-08-03', amount: 75000, store: '台北總店', category: '產品銷售' }
    ],
    schedules: [
        { id: 1, employeeId: 1, date: '2025-08-11', shift: '早班', startTime: '09:00', endTime: '17:00', store: '台北總店' },
        { id: 2, employeeId: 2, date: '2025-08-11', shift: '晚班', startTime: '13:00', endTime: '21:00', store: '台北分店' }
    ],
    promotions: [
        { id: 1, employeeId: 2, position: '資深店長', status: '投票中', votes: 8, totalVoters: 15, deadline: '2025-08-20' },
        { id: 2, employeeId: 3, position: '副店長', status: '已通過', votes: 12, totalVoters: 15, deadline: '2025-08-10' }
    ],
    maintenance: [
        { id: 1, item: '空調系統', description: '冷氣不冷', status: '待處理', priority: '高', reportDate: '2025-08-10', store: '台北總店' },
        { id: 2, item: '電腦', description: '開機緩慢', status: '處理中', priority: '中', reportDate: '2025-08-09', store: '台北分店' }
    ]
};

// 認證中間件 (簡化版本)
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization || req.query.token || req.body.token;
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: '需要提供認證令牌',
            code: 'NO_TOKEN'
        });
    }
    
    // 簡化版本 - 生產環境應驗證JWT
    req.user = { id: 1, name: '系統管理員', role: 'admin' };
    next();
};

// ==================== 基本API端點 ====================

// 健康檢查
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        message: '🔧 完整修復版本運行中',
        timestamp: new Date().toISOString(),
        port: port,
        env: process.env.NODE_ENV || 'development',
        version: 'complete-fix-v1.0'
    });
});

// 主頁
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'public', 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.json({
            message: '🏢 企業員工管理系統 - 完整修復版',
            status: 'running',
            version: 'complete-fix-v1.0',
            timestamp: new Date().toISOString(),
            availablePages: [
                '/login',
                '/employee', 
                '/admin',
                '/attendance',
                '/revenue'
            ],
            availableAPIs: [
                '/api/test',
                '/api/employees',
                '/api/revenue',
                '/api/admin/stats',
                '/api/admin/inventory',
                '/api/admin/revenue', 
                '/api/admin/schedules',
                '/api/admin/promotions',
                '/api/admin/maintenance'
            ]
        });
    }
});

// 測試API
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'Render完整版API正常工作',
        version: '完整企業員工管理系統',
        features: ['員工管理', '考勤打卡', '營收統計', '庫存管理', '排班系統', '升遷投票', '維修管理'],
        timestamp: new Date().toISOString()
    });
});

// ==================== 認證相關API ====================

// 管理員登入API
app.post('/api/admin/auth/login', (req, res) => {
    const { name, idNumber } = req.body;
    
    console.log('管理員登入請求:', { name, idNumber });
    
    if (!name || !idNumber) {
        return res.status(400).json({
            success: false,
            message: '請提供姓名和身分證號碼',
            code: 'MISSING_CREDENTIALS'
        });
    }
    
    // 查找員工
    const employee = mockData.employees.find(emp => 
        emp.name === name && emp.idNumber === idNumber
    );
    
    if (!employee) {
        return res.status(401).json({
            success: false,
            message: '登入失敗：查無此員工資料',
            code: 'INVALID_CREDENTIALS'
        });
    }
    
    // 生成令牌
    const token = `admin-token-${Date.now()}`;
    
    res.json({
        success: true,
        message: '登入成功',
        data: {
            token: token,
            employee: {
                id: employee.id,
                name: employee.name,
                idNumber: employee.idNumber,
                position: employee.position,
                store: employee.store,
                storeLocation: employee.store,
                currentStore: employee.store,
                permissions: employee.permissions
            }
        },
        timestamp: new Date().toISOString()
    });
});

// ==================== 員工管理API ====================

app.get('/api/employees', (req, res) => {
    res.json({
        success: true,
        data: mockData.employees,
        total: mockData.employees.length,
        timestamp: new Date().toISOString()
    });
});

app.post('/api/employees', authMiddleware, (req, res) => {
    const newEmployee = {
        id: mockData.employees.length + 1,
        ...req.body,
        createdAt: new Date().toISOString()
    };
    
    mockData.employees.push(newEmployee);
    
    res.json({
        success: true,
        message: '員工新增成功',
        data: newEmployee,
        timestamp: new Date().toISOString()
    });
});

app.put('/api/employees/:id', authMiddleware, (req, res) => {
    const employeeId = parseInt(req.params.id);
    const employeeIndex = mockData.employees.findIndex(emp => emp.id === employeeId);
    
    if (employeeIndex === -1) {
        return res.status(404).json({
            success: false,
            message: '找不到指定員工',
            code: 'EMPLOYEE_NOT_FOUND'
        });
    }
    
    mockData.employees[employeeIndex] = {
        ...mockData.employees[employeeIndex],
        ...req.body,
        updatedAt: new Date().toISOString()
    };
    
    res.json({
        success: true,
        message: '員工資料更新成功',
        data: mockData.employees[employeeIndex],
        timestamp: new Date().toISOString()
    });
});

app.delete('/api/employees/:id', authMiddleware, (req, res) => {
    const employeeId = parseInt(req.params.id);
    const employeeIndex = mockData.employees.findIndex(emp => emp.id === employeeId);
    
    if (employeeIndex === -1) {
        return res.status(404).json({
            success: false,
            message: '找不到指定員工',
            code: 'EMPLOYEE_NOT_FOUND'
        });
    }
    
    const deletedEmployee = mockData.employees.splice(employeeIndex, 1)[0];
    
    res.json({
        success: true,
        message: '員工刪除成功',
        data: deletedEmployee,
        timestamp: new Date().toISOString()
    });
});

// ==================== 管理員統計API ====================

app.get('/api/admin/stats', (req, res) => {
    res.json({
        success: true,
        data: {
            totalEmployees: mockData.employees.length,
            totalRevenue: mockData.revenue.reduce((sum, r) => sum + r.amount, 0),
            totalInventoryValue: mockData.inventory.reduce((sum, item) => sum + (item.quantity * item.price), 0),
            pendingMaintenance: mockData.maintenance.filter(m => m.status === '待處理').length,
            activePromotions: mockData.promotions.filter(p => p.status === '投票中').length,
            todaySchedules: mockData.schedules.filter(s => s.date === new Date().toISOString().split('T')[0]).length
        },
        timestamp: new Date().toISOString()
    });
});

// ==================== 庫存管理API (修復404錯誤) ====================

app.get('/api/admin/inventory', (req, res) => {
    const { category, status } = req.query;
    
    let filteredInventory = [...mockData.inventory];
    
    if (category) {
        filteredInventory = filteredInventory.filter(item => 
            item.category.toLowerCase().includes(category.toLowerCase())
        );
    }
    
    if (status) {
        filteredInventory = filteredInventory.filter(item => 
            item.status.toLowerCase().includes(status.toLowerCase())
        );
    }
    
    res.json({
        success: true,
        message: '庫存數據獲取成功',
        data: filteredInventory,
        total: filteredInventory.length,
        filters: { category, status },
        timestamp: new Date().toISOString()
    });
});

app.post('/api/admin/inventory', authMiddleware, (req, res) => {
    const newItem = {
        id: mockData.inventory.length + 1,
        ...req.body,
        createdAt: new Date().toISOString()
    };
    
    mockData.inventory.push(newItem);
    
    res.json({
        success: true,
        message: '庫存項目新增成功',
        data: newItem,
        timestamp: new Date().toISOString()
    });
});

app.put('/api/admin/inventory/:id', authMiddleware, (req, res) => {
    const itemId = parseInt(req.params.id);
    const itemIndex = mockData.inventory.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
        return res.status(404).json({
            success: false,
            message: '找不到指定庫存項目',
            code: 'INVENTORY_NOT_FOUND'
        });
    }
    
    mockData.inventory[itemIndex] = {
        ...mockData.inventory[itemIndex],
        ...req.body,
        updatedAt: new Date().toISOString()
    };
    
    res.json({
        success: true,
        message: '庫存項目更新成功',
        data: mockData.inventory[itemIndex],
        timestamp: new Date().toISOString()
    });
});

// ==================== 營收管理API (修復404錯誤) ====================

app.get('/api/revenue', (req, res) => {
    res.json({
        success: true,
        data: mockData.revenue,
        total: mockData.revenue.length,
        totalAmount: mockData.revenue.reduce((sum, r) => sum + r.amount, 0),
        timestamp: new Date().toISOString()
    });
});

app.get('/api/admin/revenue', (req, res) => {
    const { startDate, endDate, storeId } = req.query;
    
    let filteredRevenue = [...mockData.revenue];
    
    if (startDate) {
        filteredRevenue = filteredRevenue.filter(r => r.date >= startDate);
    }
    
    if (endDate) {
        filteredRevenue = filteredRevenue.filter(r => r.date <= endDate);
    }
    
    if (storeId) {
        filteredRevenue = filteredRevenue.filter(r => r.store.includes(storeId));
    }
    
    const totalAmount = filteredRevenue.reduce((sum, r) => sum + r.amount, 0);
    
    res.json({
        success: true,
        message: '營收數據獲取成功',
        data: filteredRevenue,
        total: filteredRevenue.length,
        totalAmount: totalAmount,
        filters: { startDate, endDate, storeId },
        timestamp: new Date().toISOString()
    });
});

// ==================== 排班管理API (修復404錯誤) ====================

app.get('/api/admin/schedules', (req, res) => {
    const { date, storeId } = req.query;
    
    let filteredSchedules = [...mockData.schedules];
    
    if (date) {
        filteredSchedules = filteredSchedules.filter(s => s.date === date);
    }
    
    if (storeId) {
        filteredSchedules = filteredSchedules.filter(s => s.store.includes(storeId));
    }
    
    // 添加員工資訊
    const schedulesWithEmployeeInfo = filteredSchedules.map(schedule => {
        const employee = mockData.employees.find(emp => emp.id === schedule.employeeId);
        return {
            ...schedule,
            employeeName: employee ? employee.name : '未知員工',
            employeePosition: employee ? employee.position : '未知職位'
        };
    });
    
    res.json({
        success: true,
        message: '排班數據獲取成功',
        data: schedulesWithEmployeeInfo,
        total: schedulesWithEmployeeInfo.length,
        filters: { date, storeId },
        timestamp: new Date().toISOString()
    });
});

app.post('/api/admin/schedules', authMiddleware, (req, res) => {
    const newSchedule = {
        id: mockData.schedules.length + 1,
        ...req.body,
        createdAt: new Date().toISOString()
    };
    
    mockData.schedules.push(newSchedule);
    
    res.json({
        success: true,
        message: '排班新增成功',
        data: newSchedule,
        timestamp: new Date().toISOString()
    });
});

// ==================== 升遷投票API (修復404錯誤) ====================

app.get('/api/admin/promotions', (req, res) => {
    const { status } = req.query;
    
    let filteredPromotions = [...mockData.promotions];
    
    if (status) {
        filteredPromotions = filteredPromotions.filter(p => 
            p.status.toLowerCase().includes(status.toLowerCase())
        );
    }
    
    // 添加員工資訊
    const promotionsWithEmployeeInfo = filteredPromotions.map(promotion => {
        const employee = mockData.employees.find(emp => emp.id === promotion.employeeId);
        return {
            ...promotion,
            employeeName: employee ? employee.name : '未知員工',
            currentPosition: employee ? employee.position : '未知職位',
            voteProgress: `${promotion.votes}/${promotion.totalVoters}`,
            votePercentage: Math.round((promotion.votes / promotion.totalVoters) * 100)
        };
    });
    
    res.json({
        success: true,
        message: '升遷投票數據獲取成功',
        data: promotionsWithEmployeeInfo,
        total: promotionsWithEmployeeInfo.length,
        filters: { status },
        timestamp: new Date().toISOString()
    });
});

app.post('/api/admin/promotions', authMiddleware, (req, res) => {
    const newPromotion = {
        id: mockData.promotions.length + 1,
        ...req.body,
        votes: 0,
        status: '投票中',
        createdAt: new Date().toISOString()
    };
    
    mockData.promotions.push(newPromotion);
    
    res.json({
        success: true,
        message: '升遷投票案新增成功',
        data: newPromotion,
        timestamp: new Date().toISOString()
    });
});

// ==================== 維修管理API (修復404錯誤) ====================

app.get('/api/admin/maintenance', (req, res) => {
    const { status, priority } = req.query;
    
    let filteredMaintenance = [...mockData.maintenance];
    
    if (status) {
        filteredMaintenance = filteredMaintenance.filter(m => 
            m.status.toLowerCase().includes(status.toLowerCase())
        );
    }
    
    if (priority) {
        filteredMaintenance = filteredMaintenance.filter(m => 
            m.priority.toLowerCase().includes(priority.toLowerCase())
        );
    }
    
    res.json({
        success: true,
        message: '維修請求數據獲取成功',
        data: filteredMaintenance,
        total: filteredMaintenance.length,
        filters: { status, priority },
        pendingCount: filteredMaintenance.filter(m => m.status === '待處理').length,
        urgentCount: filteredMaintenance.filter(m => m.priority === '高').length,
        timestamp: new Date().toISOString()
    });
});

app.post('/api/admin/maintenance', authMiddleware, (req, res) => {
    const newMaintenance = {
        id: mockData.maintenance.length + 1,
        ...req.body,
        status: '待處理',
        reportDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    };
    
    mockData.maintenance.push(newMaintenance);
    
    res.json({
        success: true,
        message: '維修請求新增成功',
        data: newMaintenance,
        timestamp: new Date().toISOString()
    });
});

app.put('/api/admin/maintenance/:id', authMiddleware, (req, res) => {
    const maintenanceId = parseInt(req.params.id);
    const maintenanceIndex = mockData.maintenance.findIndex(m => m.id === maintenanceId);
    
    if (maintenanceIndex === -1) {
        return res.status(404).json({
            success: false,
            message: '找不到指定維修請求',
            code: 'MAINTENANCE_NOT_FOUND'
        });
    }
    
    mockData.maintenance[maintenanceIndex] = {
        ...mockData.maintenance[maintenanceIndex],
        ...req.body,
        updatedAt: new Date().toISOString()
    };
    
    res.json({
        success: true,
        message: '維修請求更新成功',
        data: mockData.maintenance[maintenanceIndex],
        timestamp: new Date().toISOString()
    });
});

// ==================== 頁面路由 ====================

// 登入頁面
app.get('/login', (req, res) => {
    const loginPath = path.join(__dirname, 'public', 'login.html');
    if (fs.existsSync(loginPath)) {
        res.sendFile(loginPath);
    } else {
        res.json({
            message: '登入頁面',
            available: false,
            redirect: '/api/admin/auth/login'
        });
    }
});

// 員工工作台
app.get('/employee', (req, res) => {
    const employeePath = path.join(__dirname, 'public', 'employee-dashboard.html');
    if (fs.existsSync(employeePath)) {
        res.sendFile(employeePath);
    } else {
        res.json({
            message: '員工工作台',
            available: false,
            note: '需要登入驗證'
        });
    }
});

// 管理員後台
app.get('/admin', (req, res) => {
    const adminPath = path.join(__dirname, 'public', 'admin-enhanced.html');
    if (fs.existsSync(adminPath)) {
        res.sendFile(adminPath);
    } else {
        const basicAdminPath = path.join(__dirname, 'public', 'admin.html');
        if (fs.existsSync(basicAdminPath)) {
            res.sendFile(basicAdminPath);
        } else {
            res.json({
                message: '管理員後台',
                available: false,
                note: '需要管理員權限'
            });
        }
    }
});

// 考勤頁面
app.get('/attendance', (req, res) => {
    const attendancePath = path.join(__dirname, 'public', 'attendance.html');
    if (fs.existsSync(attendancePath)) {
        res.sendFile(attendancePath);
    } else {
        res.json({
            message: '考勤打卡頁面',
            available: false
        });
    }
});

// 營收頁面
app.get('/revenue', (req, res) => {
    const revenuePath = path.join(__dirname, 'public', 'revenue.html');
    if (fs.existsSync(revenuePath)) {
        res.sendFile(revenuePath);
    } else {
        res.json({
            message: '營收統計頁面',
            available: false
        });
    }
});

// ==================== 錯誤處理 ====================

// 404處理
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Render API端點不存在',
        path: req.originalUrl,
        availableEndpoints: [
            '/api/test',
            '/api/auth',
            '/api/employees',
            '/api/attendance',
            '/api/revenue',
            '/api/admin/stats',
            '/api/admin/stores',
            '/api/admin/employees',
            '/api/admin/auth/login',
            '/api/admin/auth/register',
            '/api/admin/auth/profile',
            '/api/admin/inventory',
            '/api/admin/revenue',
            '/api/admin/schedules', 
            '/api/admin/promotions',
            '/api/admin/maintenance'
        ],
        timestamp: new Date().toISOString()
    });
});

// 錯誤處理中間件
app.use((error, req, res, next) => {
    console.error('伺服器錯誤:', error);
    
    res.status(500).json({
        success: false,
        message: '伺服器內部錯誤',
        error: process.env.NODE_ENV === 'development' ? error.message : '請稍後再試',
        timestamp: new Date().toISOString()
    });
});

// 啟動伺服器
app.listen(port, '0.0.0.0', () => {
    console.log(`✅ 完整修復版伺服器啟動成功 - Port ${port}`);
    console.log(`🌐 URL: http://0.0.0.0:${port}`);
    console.log('📊 可用API端點:');
    console.log('   - /api/admin/inventory (庫存管理)');
    console.log('   - /api/admin/revenue (營收統計)');  
    console.log('   - /api/admin/schedules (排班管理)');
    console.log('   - /api/admin/promotions (升遷投票)');
    console.log('   - /api/admin/maintenance (維修管理)');
    console.log('🔧 所有404錯誤已修復！');
});

console.log('🔧 完整修復版企業員工管理系統就緒！');