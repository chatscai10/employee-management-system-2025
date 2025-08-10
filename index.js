/**
 * 緊急修復版 - 直接啟動伺服器
 */

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

console.log('🚨 緊急修復版伺服器啟動...');
console.log(`PORT: ${port}, NODE_ENV: ${process.env.NODE_ENV}`);

// 基本中間件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 健康檢查
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        message: '🚨 緊急修復版本運行中',
        timestamp: new Date().toISOString(),
        port: port,
        env: process.env.NODE_ENV || 'development'
    });
});

// 主頁
app.get('/', (req, res) => {
    res.json({
        message: '🏢 企業員工管理系統 - 緊急修復版',
        status: 'running',
        version: 'emergency-fix',
        timestamp: new Date().toISOString(),
        availableEndpoints: {
            health: '/health',
            api_test: '/api/test',
            api_auth: '/api/auth'
        }
    });
});

// API端點
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: '緊急修復API正常工作',
        version: 'emergency-fix',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/auth', (req, res) => {
    res.json({
        success: true,
        message: '緊急修復認證API正常',
        version: 'emergency-fix',
        timestamp: new Date().toISOString()
    });
});

app.post('/api/auth/login', (req, res) => {
    const { employeeId, password, name } = req.body;
    
    res.json({
        success: true,
        message: '緊急修復登入成功',
        data: { 
            token: 'emergency-token-' + Date.now(),
            employee: {
                id: 1,
                name: employeeId || name || '緊急修復用戶',
                position: '員工'
            }
        },
        version: 'emergency-fix',
        timestamp: new Date().toISOString()
    });
});

// 404處理
app.use('*', (req, res) => {
    res.status(404).json({
        error: '端點不存在',
        path: req.originalUrl,
        suggestion: '嘗試訪問 / 或 /health',
        version: 'emergency-fix',
        timestamp: new Date().toISOString()
    });
});

// 啟動伺服器
app.listen(port, '0.0.0.0', () => {
    console.log(`✅ 緊急修復版伺服器啟動成功 - Port ${port}`);
    console.log(`🌐 URL: http://0.0.0.0:${port}`);
});

console.log('🚨 緊急修復版系統就緒！');