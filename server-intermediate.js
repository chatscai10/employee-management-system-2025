/**
 * 中級版企業員工管理系統 - 逐步添加功能
 */

const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

console.log('🚀 啟動中級版伺服器...');
console.log(`PORT: ${port}, NODE_ENV: ${process.env.NODE_ENV}`);

// 中間件設定
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 靜態檔案服務 - 為網頁界面準備
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'public')));

// 健康檢查
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        version: 'intermediate',
        timestamp: new Date().toISOString(),
        port: port,
        env: process.env.NODE_ENV,
        database: process.env.DATABASE_URL ? 'configured' : 'not_configured'
    });
});

// 主頁 - 提供HTML界面
app.get('/', (req, res) => {
    try {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } catch (error) {
        res.json({
            message: '🏢 企業員工管理系統 - 中級版',
            status: 'running',
            timestamp: new Date().toISOString(),
            note: 'HTML界面載入中，目前提供API服務'
        });
    }
});

// 登入頁面
app.get('/login', (req, res) => {
    try {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } catch (error) {
        res.json({
            message: '登入頁面',
            api_login: '/api/auth/login',
            timestamp: new Date().toISOString()
        });
    }
});

// 管理員頁面
app.get('/admin', (req, res) => {
    try {
        res.sendFile(path.join(__dirname, 'public', 'admin.html'));
    } catch (error) {
        res.json({
            message: '管理員頁面',
            timestamp: new Date().toISOString()
        });
    }
});

// API端點
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'API正常工作',
        version: 'intermediate',
        features: ['基本API', '靜態檔案', 'HTML界面'],
        timestamp: new Date().toISOString()
    });
});

// 認證API - 基本版本
app.get('/api/auth', (req, res) => {
    res.json({
        success: true,
        message: '認證API正常',
        methods: ['login', 'register'],
        timestamp: new Date().toISOString()
    });
});

app.post('/api/auth/login', (req, res) => {
    const { employeeId, password } = req.body;
    
    // 基本驗證邏輯（測試版）
    if (employeeId && password) {
        res.json({
            success: true,
            message: '登入成功（測試版）',
            token: 'test-token-' + Date.now(),
            user: {
                id: 1,
                employeeId,
                name: '測試用戶',
                position: '員工'
            },
            timestamp: new Date().toISOString()
        });
    } else {
        res.status(400).json({
            success: false,
            error: '請提供員工編號和密碼',
            timestamp: new Date().toISOString()
        });
    }
});

// 員工API
app.get('/api/employees', (req, res) => {
    res.json({
        success: true,
        message: '員工API正常',
        data: [
            { id: 1, name: '張三', position: '店長', status: '在職' },
            { id: 2, name: '李四', position: '員工', status: '在職' },
            { id: 3, name: '王五', position: '實習生', status: '在職' }
        ],
        count: 3,
        timestamp: new Date().toISOString()
    });
});

// 打卡API
app.get('/api/attendance/records', (req, res) => {
    res.json({
        success: true,
        message: '打卡API正常',
        data: [
            {
                id: 1,
                employeeName: '張三',
                clockTime: new Date().toISOString(),
                clockType: '上班',
                status: '正常'
            }
        ],
        count: 1,
        timestamp: new Date().toISOString()
    });
});

// 營收API
app.get('/api/revenue', (req, res) => {
    res.json({
        success: true,
        message: '營收API正常',
        data: [],
        timestamp: new Date().toISOString()
    });
});

// 測試端點 - 網頁需要的API
app.get('/api/auth/test', (req, res) => {
    res.json({
        success: true,
        message: '認證API測試成功',
        version: 'intermediate',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/attendance/test', (req, res) => {
    res.json({
        success: true,
        message: '打卡API測試成功',
        version: 'intermediate',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/revenue/test', (req, res) => {
    res.json({
        success: true,
        message: '營收API測試成功',
        version: 'intermediate',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/orders/test', (req, res) => {
    res.json({
        success: true,
        message: '叫貨API測試成功',
        version: 'intermediate',
        timestamp: new Date().toISOString()
    });
});

// 錯誤處理
app.use((err, req, res, next) => {
    console.error('錯誤:', err);
    res.status(500).json({
        success: false,
        error: '內部伺服器錯誤',
        message: err.message,
        timestamp: new Date().toISOString()
    });
});

// 404處理
app.use('*', (req, res) => {
    if (req.originalUrl.startsWith('/api/')) {
        res.status(404).json({
            success: false,
            error: 'API端點不存在',
            path: req.originalUrl,
            timestamp: new Date().toISOString()
        });
    } else {
        // 嘗試返回主頁
        try {
            res.sendFile(path.join(__dirname, 'public', 'index.html'));
        } catch (error) {
            res.status(404).json({
                error: '頁面不存在',
                path: req.originalUrl,
                suggestion: '嘗試訪問 / 或 /login',
                timestamp: new Date().toISOString()
            });
        }
    }
});

// 啟動伺服器
app.listen(port, '0.0.0.0', () => {
    console.log(`✅ 中級版伺服器啟動在端口 ${port}`);
    console.log(`🌐 URL: http://0.0.0.0:${port}`);
    console.log(`📁 靜態檔案: ${path.join(__dirname, 'public')}`);
});

// 進程錯誤處理
process.on('uncaughtException', (err) => {
    console.error('未捕獲的例外:', err);
});

process.on('unhandledRejection', (reason) => {
    console.error('未處理的Promise拒絕:', reason);
});

console.log('🎉 中級版系統就緒！支援HTML界面和基本API');