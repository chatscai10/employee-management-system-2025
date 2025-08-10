/**
 * 簡化版企業員工管理系統伺服器 - Render專用
 */

const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

console.log('🚀 啟動簡化版伺服器...');
console.log(`PORT: ${port}, NODE_ENV: ${process.env.NODE_ENV}`);

// 基本中間件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 健康檢查端點
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        port: port,
        env: process.env.NODE_ENV
    });
});

// 主頁
app.get('/', (req, res) => {
    res.json({
        message: '🏢 企業員工管理系統 - Render版本',
        status: 'running',
        timestamp: new Date().toISOString()
    });
});

// API測試端點
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'API正常工作',
        server: 'Render',
        timestamp: new Date().toISOString()
    });
});

// 認證API
app.get('/api/auth', (req, res) => {
    res.json({
        success: true,
        message: '認證API正常',
        timestamp: new Date().toISOString()
    });
});

// 錯誤處理
app.use((err, req, res, next) => {
    console.error('錯誤:', err);
    res.status(500).json({
        success: false,
        error: '內部伺服器錯誤',
        message: err.message
    });
});

// 啟動伺服器
app.listen(port, '0.0.0.0', () => {
    console.log(`✅ 伺服器成功啟動在端口 ${port}`);
    console.log(`🌐 URL: http://0.0.0.0:${port}`);
});

// 進程錯誤處理
process.on('uncaughtException', (err) => {
    console.error('未捕獲的例外:', err);
});

process.on('unhandledRejection', (reason) => {
    console.error('未處理的Promise拒絕:', reason);
});

console.log('🎉 簡化版系統就緒！');