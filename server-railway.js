/**
 * Railway專用企業員工管理系統伺服器
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

console.log('🚀 啟動Railway專用伺服器...');
console.log(`PORT: ${port}, NODE_ENV: ${process.env.NODE_ENV}`);

// 基本中間件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 健康檢查端點
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        port: port,
        env: process.env.NODE_ENV || 'development',
        platform: 'Railway',
        version: '1.0.0'
    });
});

// 主頁
app.get('/', (req, res) => {
    res.json({
        message: '🏢 企業員工管理系統 - Railway版本',
        status: 'running',
        timestamp: new Date().toISOString(),
        platform: 'Railway',
        availableEndpoints: {
            health: '/health',
            api_test: '/api/test',
            api_auth: '/api/auth'
        }
    });
});

// API測試端點
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'Railway API正常工作',
        platform: 'Railway',
        server: 'railway-optimized',
        timestamp: new Date().toISOString()
    });
});

// 認證API端點
app.get('/api/auth', (req, res) => {
    res.json({
        success: true,
        message: 'Railway認證API正常',
        platform: 'Railway',
        methods: ['login', 'register'],
        timestamp: new Date().toISOString()
    });
});

app.post('/api/auth/login', (req, res) => {
    const { employeeId, password, name } = req.body;
    
    if (!employeeId && !name) {
        return res.status(400).json({
            success: false,
            error: '請提供有效的登入憑證',
            code: 'INVALID_CREDENTIALS'
        });
    }
    
    res.json({
        success: true,
        message: 'Railway登入成功（測試版）',
        data: { 
            token: 'railway-token-' + Date.now(),
            employee: {
                id: 1,
                name: employeeId || name || 'Railway User',
                position: '員工',
                platform: 'Railway'
            }
        },
        timestamp: new Date().toISOString()
    });
});

// 員工API
app.get('/api/employees', (req, res) => {
    res.json({
        success: true,
        message: 'Railway員工API正常',
        data: [
            { id: 1, name: 'Railway測試員工1', position: '店長', platform: 'Railway' },
            { id: 2, name: 'Railway測試員工2', position: '員工', platform: 'Railway' }
        ],
        count: 2,
        timestamp: new Date().toISOString()
    });
});

// 打卡API
app.get('/api/attendance/records', (req, res) => {
    res.json({
        success: true,
        message: 'Railway打卡API正常',
        data: [
            {
                id: 1,
                employeeName: 'Railway測試員工',
                clockTime: new Date().toISOString(),
                clockType: '上班',
                status: '正常',
                platform: 'Railway'
            }
        ],
        count: 1,
        timestamp: new Date().toISOString()
    });
});

// 404處理
app.use('*', (req, res) => {
    if (req.originalUrl.startsWith('/api/')) {
        res.status(404).json({
            success: false,
            error: 'Railway API端點不存在',
            path: req.originalUrl,
            platform: 'Railway',
            timestamp: new Date().toISOString()
        });
    } else {
        res.status(404).json({
            error: '頁面不存在',
            path: req.originalUrl,
            suggestion: '嘗試訪問 / 或 /health',
            platform: 'Railway',
            timestamp: new Date().toISOString()
        });
    }
});

// 錯誤處理
app.use((err, req, res, next) => {
    console.error('Railway錯誤:', err);
    res.status(500).json({
        success: false,
        error: '內部伺服器錯誤',
        message: err.message,
        platform: 'Railway',
        timestamp: new Date().toISOString()
    });
});

// 啟動伺服器
app.listen(port, '0.0.0.0', () => {
    console.log(`✅ Railway伺服器成功啟動在端口 ${port}`);
    console.log(`🌐 URL: http://0.0.0.0:${port}`);
    console.log(`🚀 Platform: Railway`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// 進程錯誤處理
process.on('uncaughtException', (err) => {
    console.error('Railway未捕獲的例外:', err);
});

process.on('unhandledRejection', (reason) => {
    console.error('Railway未處理的Promise拒絕:', reason);
});

console.log('🎉 Railway專用系統就緒！');