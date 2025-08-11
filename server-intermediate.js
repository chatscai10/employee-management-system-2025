/**
 * Render專用完整版企業員工管理系統伺服器
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

const app = express();
const port = process.env.PORT || 3000;

console.log('🚀 啟動Render專用完整版伺服器...');
console.log(`PORT: ${port}, NODE_ENV: ${process.env.NODE_ENV}`);

// 基本中間件設定 - 修復CSP阻止JavaScript問題
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "'unsafe-hashes'", "https://cdn.jsdelivr.net", "https://employee-management-system-intermediate.onrender.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            connectSrc: ["'self'", "https://employee-management-system-intermediate.onrender.com", "https://api.telegram.org"],
            fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'self'"],
            scriptSrcAttr: ["'unsafe-inline'", "'unsafe-hashes'"]
        }
    }
}));

app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 靜態檔案服務 - 完全重構確保JavaScript MIME類型正確
const staticOptions = {
    maxAge: '1d',
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
        // 強制設定正確的 MIME 類型
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
            res.setHeader('X-Content-Type-Options', 'nosniff');
        } else if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css; charset=utf-8');
            res.setHeader('X-Content-Type-Options', 'nosniff');
        } else if (filePath.match(/\.(png|jpg|jpeg|gif|ico|svg)$/i)) {
            res.setHeader('X-Content-Type-Options', 'nosniff');
        }
        console.log(`📁 Serving static file: ${filePath} with Content-Type: ${res.getHeader('Content-Type')}`);
    }
};

// 優先處理JavaScript文件
app.use('/js', express.static(path.join(__dirname, 'public', 'js'), staticOptions));
app.use('/css', express.static(path.join(__dirname, 'public', 'css'), staticOptions));
app.use('/images', express.static(path.join(__dirname, 'public', 'images'), staticOptions));

// 最後處理所有public目錄
app.use('/public', express.static(path.join(__dirname, 'public'), staticOptions));

// 健康檢查
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        version: 'intermediate-fixed',
        timestamp: new Date().toISOString(),
        port: port,
        env: process.env.NODE_ENV || 'production',
        features: ['完整HTML界面', '靜態資源', 'API端點', 'JavaScript功能']
    });
});

// 主頁 - 員工儀表板
app.get('/', (req, res) => {
    try {
        res.sendFile(path.join(__dirname, 'public', 'employee-dashboard.html'));
    } catch (error) {
        console.error('主頁載入錯誤:', error);
        res.status(500).json({
            error: '主頁載入失敗',
            message: error.message
        });
    }
});

// 頁面路由
const pages = [
    { path: '/login', file: 'login.html' },
    { path: '/register', file: 'register.html' },
    { path: '/employee', file: 'employee.html' },
    { path: '/admin', file: 'admin.html' },
    { path: '/dashboard', file: 'employee-dashboard.html' },
    { path: '/attendance', file: 'attendance.html' },
    { path: '/revenue', file: 'revenue.html' },
    { path: '/profile', file: 'profile.html' },
    { path: '/reports', file: 'reports.html' },
    { path: '/schedule', file: 'schedule.html' }
];

pages.forEach(page => {
    app.get(page.path, (req, res) => {
        try {
            res.sendFile(path.join(__dirname, 'public', page.file));
        } catch (error) {
            console.error(`${page.path} 載入錯誤:`, error);
            res.status(404).json({
                error: '頁面不存在',
                path: page.path,
                message: error.message
            });
        }
    });
});

// API 端點
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'Render完整版API正常工作',
        version: 'intermediate-fixed',
        features: ['員工管理', '考勤打卡', '營收統計', '庫存管理'],
        timestamp: new Date().toISOString()
    });
});

// 認證API
app.get('/api/auth', (req, res) => {
    res.json({
        success: true,
        message: 'Render完整版認證API正常',
        version: 'intermediate-fixed',
        methods: ['login', 'register', 'profile'],
        timestamp: new Date().toISOString()
    });
});

app.post('/api/auth/login', (req, res) => {
    const { employeeId, password, name, email } = req.body;
    
    if (!employeeId && !email && !name) {
        return res.status(400).json({
            success: false,
            error: '請提供有效的登入憑證',
            code: 'INVALID_CREDENTIALS'
        });
    }
    
    // 模擬成功登入
    res.json({
        success: true,
        message: 'Render完整版登入成功',
        data: { 
            token: 'render-full-token-' + Date.now(),
            employee: {
                id: 1,
                name: employeeId || name || 'Render用戶',
                email: email || 'user@company.com',
                position: '員工',
                store: '台北總店',
                permissions: ['attendance', 'revenue', 'profile']
            }
        },
        timestamp: new Date().toISOString()
    });
});

// 管理員認證API - 處理登入頁面的請求
app.post('/api/admin/auth/login', (req, res) => {
    const { name, idNumber } = req.body;
    
    if (!name || !idNumber) {
        return res.status(400).json({
            success: false,
            message: '請提供姓名和身分證號碼',
            code: 'MISSING_CREDENTIALS'
        });
    }
    
    // 預設管理員帳號驗證 (可擴展為資料庫查詢)
    const defaultAccounts = [
        { name: '系統管理員', idNumber: 'A123456789', position: '管理員' },
        { name: '店長', idNumber: 'B123456789', position: '店長' },
        { name: '張三', idNumber: 'C123456789', position: '員工' },
        { name: '李四', idNumber: 'D123456789', position: '員工' }
    ];
    
    const user = defaultAccounts.find(acc => 
        acc.name === name && acc.idNumber === idNumber
    );
    
    if (user) {
        res.json({
            success: true,
            message: '登入成功',
            data: {
                token: 'admin-token-' + Date.now(),
                employee: {
                    id: Date.now(),
                    name: user.name,
                    idNumber: user.idNumber,
                    position: user.position,
                    store: '台北總店',
                    storeLocation: '台北總店',
                    currentStore: '台北總店',  // employee.html期望的格式
                    permissions: user.position === '管理員' ? 
                        ['all'] : ['attendance', 'revenue', 'profile']
                }
            },
            timestamp: new Date().toISOString()
        });
    } else {
        res.status(401).json({
            success: false,
            message: '姓名或身分證號碼錯誤，請檢查後重試',
            code: 'INVALID_CREDENTIALS'
        });
    }
});

// 管理員註冊API
app.post('/api/admin/auth/register', (req, res) => {
    const { name, idNumber, phone, email, position = '員工', storeLocation = '台北總店' } = req.body;
    
    if (!name || !idNumber || !phone) {
        return res.status(400).json({
            success: false,
            message: '請填寫所有必填欄位（姓名、身分證號碼、電話）',
            code: 'MISSING_REQUIRED_FIELDS'
        });
    }
    
    // 檢查身分證號碼格式 (簡單驗證)
    if (!/^[A-Z][12][0-9]{8}$/.test(idNumber)) {
        return res.status(400).json({
            success: false,
            message: '身分證號碼格式不正確',
            code: 'INVALID_ID_FORMAT'
        });
    }
    
    // 模擬註冊成功 (實際應該儲存到資料庫)
    res.json({
        success: true,
        message: '註冊申請已提交，請等待管理員審核',
        data: {
            employee: {
                name,
                idNumber,
                phone,
                email: email || '',
                position,
                storeLocation,
                status: '待審核',
                registeredAt: new Date().toISOString()
            }
        },
        timestamp: new Date().toISOString()
    });
});

// 員工個人資料API
app.get('/api/admin/auth/profile', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: '需要登入',
            code: 'AUTH_REQUIRED'
        });
    }
    
    const token = authHeader.substring(7);
    if (token.startsWith('admin-token-') || token.startsWith('render-full-token-')) {
        res.json({
            success: true,
            message: '個人資料獲取成功',
            data: {
                name: '系統用戶',
                currentStore: '台北總店',
                position: '員工',
                hireDate: '2024-01-01',
                phone: '0912345678',
                email: 'user@company.com'
            }
        });
    } else {
        res.status(401).json({
            success: false,
            message: '無效的Token',
            code: 'INVALID_TOKEN'
        });
    }
});

// Token驗證API
app.post('/api/auth/verify', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: '無效的Token格式',
            code: 'INVALID_TOKEN_FORMAT'
        });
    }
    
    const token = authHeader.substring(7);
    if (token.startsWith('admin-token-') || token.startsWith('render-full-token-')) {
        res.json({
            success: true,
            message: 'Token有效',
            data: {
                user: {
                    name: '驗證用戶',
                    position: token.startsWith('admin-token-') ? '管理員' : '員工'
                }
            }
        });
    } else {
        res.status(401).json({
            success: false,
            message: '無效的Token',
            code: 'INVALID_TOKEN'
        });
    }
});

// 管理員統計API
app.get('/api/admin/stats', (req, res) => {
    res.json({
        success: true,
        message: '統計數據獲取成功',
        data: {
            totalEmployees: 15,
            activeEmployees: 12,
            pendingEmployees: 3,
            totalRevenue: 2580000,
            monthlyRevenue: 450000,
            totalAttendance: 347,
            monthlyAttendance: 89,
            averageAttendance: 92.5,
            stores: 3,
            activeStores: 3
        },
        timestamp: new Date().toISOString()
    });
});

// 管理員店鋪API
app.get('/api/admin/stores', (req, res) => {
    res.json({
        success: true,
        message: '店鋪列表獲取成功',
        data: [
            { id: 1, name: '台北總店', address: '台北市信義區信義路五段7號', phone: '02-2723-4567', status: 'active', employees: 8 },
            { id: 2, name: '台中分店', address: '台中市西屯區台灣大道四段925號', phone: '04-2461-2345', status: 'active', employees: 4 },
            { id: 3, name: '高雄分店', address: '高雄市前鎮區中山四路100號', phone: '07-536-7890', status: 'active', employees: 3 }
        ],
        count: 3,
        timestamp: new Date().toISOString()
    });
});

// 管理員員工列表API
app.get('/api/admin/employees', (req, res) => {
    const { page = 1, limit = 20, status = '', storeId = '', position = '' } = req.query;
    
    const employees = [
        { id: 1, name: '系統管理員', position: '管理員', store: '台北總店', status: 'active', phone: '0912-345-678', email: 'admin@company.com', hireDate: '2024-01-01' },
        { id: 2, name: '店長', position: '店長', store: '台北總店', status: 'active', phone: '0912-345-679', email: 'manager@company.com', hireDate: '2024-01-15' },
        { id: 3, name: '張三', position: '員工', store: '台北總店', status: 'active', phone: '0912-345-680', email: 'zhang@company.com', hireDate: '2024-02-01' },
        { id: 4, name: '李四', position: '員工', store: '台北總店', status: 'active', phone: '0912-345-681', email: 'li@company.com', hireDate: '2024-02-15' },
        { id: 5, name: '王五', position: '員工', store: '台中分店', status: 'active', phone: '0912-345-682', email: 'wang@company.com', hireDate: '2024-03-01' },
        { id: 6, name: '陳六', position: '員工', store: '台中分店', status: 'pending', phone: '0912-345-683', email: 'chen@company.com', hireDate: '2024-03-15' },
        { id: 7, name: '林七', position: '員工', store: '高雄分店', status: 'active', phone: '0912-345-684', email: 'lin@company.com', hireDate: '2024-04-01' },
        { id: 8, name: '黃八', position: '員工', store: '高雄分店', status: 'pending', phone: '0912-345-685', email: 'huang@company.com', hireDate: '2024-04-15' }
    ];
    
    // 過濾條件
    let filtered = employees;
    if (status) filtered = filtered.filter(emp => emp.status === status);
    if (storeId) filtered = filtered.filter(emp => emp.store === `店鋪${storeId}`);
    if (position) filtered = filtered.filter(emp => emp.position === position);
    
    // 分頁
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedEmployees = filtered.slice(startIndex, endIndex);
    
    res.json({
        success: true,
        message: '員工列表獲取成功',
        data: paginatedEmployees,
        pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(filtered.length / limit),
            totalItems: filtered.length,
            itemsPerPage: parseInt(limit)
        },
        timestamp: new Date().toISOString()
    });
});

// 員工API
app.get('/api/employees', (req, res) => {
    res.json({
        success: true,
        message: 'Render完整版員工API正常',
        data: [
            { id: 1, name: 'Render員工1', position: '店長', store: '台北店', status: '在職' },
            { id: 2, name: 'Render員工2', position: '副店長', store: '台北店', status: '在職' },
            { id: 3, name: 'Render員工3', position: '員工', store: '台中店', status: '在職' }
        ],
        count: 3,
        timestamp: new Date().toISOString()
    });
});

// 考勤API
app.get('/api/attendance/records', (req, res) => {
    const { employeeId, limit = 10 } = req.query;
    
    res.json({
        success: true,
        message: 'Render完整版考勤API正常',
        data: [
            {
                id: 1,
                employeeId: employeeId || 1,
                employeeName: 'Render員工',
                clockTime: new Date().toISOString(),
                clockType: '上班',
                location: '台北店',
                coordinates: '25.0330,121.5654',
                status: '正常'
            },
            {
                id: 2,
                employeeId: employeeId || 1,
                employeeName: 'Render員工',
                clockTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
                clockType: '午休',
                location: '台北店',
                coordinates: '25.0330,121.5654',
                status: '正常'
            }
        ],
        count: 2,
        filter: { employeeId, limit },
        timestamp: new Date().toISOString()
    });
});

app.post('/api/attendance/clock', (req, res) => {
    const { employeeId, location, coordinates } = req.body;
    
    if (!employeeId) {
        return res.status(400).json({
            success: false,
            error: '請提供員工編號',
            code: 'EMPLOYEE_ID_REQUIRED'
        });
    }
    
    res.json({
        success: true,
        message: 'Render打卡成功',
        data: {
            id: Date.now(),
            employeeId,
            clockTime: new Date().toISOString(),
            clockType: '上班',
            location: location || '台北店',
            coordinates: coordinates || '25.0330,121.5654',
            status: '已記錄'
        },
        timestamp: new Date().toISOString()
    });
});

// 營收API
app.get('/api/revenue', (req, res) => {
    res.json({
        success: true,
        message: 'Render完整版營收API正常',
        data: [
            { id: 1, amount: 15000, date: '2025-08-10', store: '台北店', category: '銷售' },
            { id: 2, amount: 8500, date: '2025-08-09', store: '台北店', category: '服務' },
            { id: 3, amount: 12000, date: '2025-08-08', store: '台中店', category: '銷售' }
        ],
        summary: {
            totalRevenue: 35500,
            averageDaily: 11833,
            topStore: '台北店'
        },
        timestamp: new Date().toISOString()
    });
});

app.post('/api/revenue', (req, res) => {
    const { amount, category, description, employeeId } = req.body;
    
    if (!amount || amount <= 0) {
        return res.status(400).json({
            success: false,
            error: '請提供有效的金額',
            code: 'INVALID_AMOUNT'
        });
    }
    
    res.json({
        success: true,
        message: 'Render營收記錄新增成功',
        data: {
            id: Date.now(),
            amount: parseFloat(amount),
            category: category || '銷售',
            description: description || '營收記錄',
            employeeId: employeeId || 1,
            date: new Date().toISOString().split('T')[0],
            timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
    });
});

// 測試API端點
const testEndpoints = ['auth', 'attendance', 'revenue', 'orders'];
testEndpoints.forEach(endpoint => {
    app.get(`/api/${endpoint}/test`, (req, res) => {
        res.json({
            success: true,
            message: `Render ${endpoint} API測試成功`,
            version: 'intermediate-fixed',
            endpoint: `/api/${endpoint}`,
            timestamp: new Date().toISOString()
        });
    });
});

// 404處理 - 緊急修復：排除靜態文件請求被攔截
app.use('*', (req, res) => {
    // 排除靜態文件請求（JavaScript、CSS、圖片等）
    if (req.originalUrl.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/i)) {
        return res.status(404).send('Static file not found');
    }
    
    if (req.originalUrl.startsWith('/api/')) {
        res.status(404).json({
            success: false,
            error: 'Render API端點不存在',
            path: req.originalUrl,
            availableEndpoints: ['/api/test', '/api/auth', '/api/employees', '/api/attendance', '/api/revenue', '/api/admin/stats', '/api/admin/stores', '/api/admin/employees', '/api/admin/auth/login', '/api/admin/auth/register', '/api/admin/auth/profile'],
            timestamp: new Date().toISOString()
        });
    } else {
        // SPA 路由處理，只對HTML頁面請求返回主頁面
        try {
            res.sendFile(path.join(__dirname, 'public', 'employee-dashboard.html'));
        } catch (error) {
            res.status(404).json({
                error: '頁面不存在',
                path: req.originalUrl,
                message: '請訪問 / 或 /dashboard',
                timestamp: new Date().toISOString()
            });
        }
    }
});

// 錯誤處理
app.use((err, req, res, next) => {
    console.error('Render完整版錯誤:', err);
    res.status(500).json({
        success: false,
        error: 'Render內部伺服器錯誤',
        message: err.message,
        timestamp: new Date().toISOString()
    });
});

// 啟動伺服器
app.listen(port, '0.0.0.0', () => {
    console.log(`✅ Render完整版伺服器成功啟動在端口 ${port}`);
    console.log(`🌐 URL: http://0.0.0.0:${port}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'production'}`);
    console.log(`🎯 Features: 完整HTML界面 + 全功能API + JavaScript互動`);
});

// 進程錯誤處理
process.on('uncaughtException', (err) => {
    console.error('Render未捕獲的例外:', err);
});

process.on('unhandledRejection', (reason) => {
    console.error('Render未處理的Promise拒絕:', reason);
});

console.log('🎉 Render專用完整版系統就緒！');