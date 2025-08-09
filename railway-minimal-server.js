#!/usr/bin/env node

/**
 * 🚀 Railway 最小化伺服器 - 用於診斷部署問題
 */

const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || process.env.RAILWAY_TCP_PROXY_PORT || 3000;
const host = '0.0.0.0';

console.log('🚀 啟動最小化Railway伺服器...');
console.log(`📊 環境變數檢查:`);
console.log(`   PORT: ${process.env.PORT}`);
console.log(`   RAILWAY_TCP_PROXY_PORT: ${process.env.RAILWAY_TCP_PROXY_PORT}`);
console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`   HOST: ${process.env.HOST}`);
console.log(`   使用端口: ${port}`);
console.log(`   監聽地址: ${host}`);

// 基本中間件
app.use(express.json());
app.use('/public', express.static(path.join(__dirname, 'public')));

// 健康檢查
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV,
        port: port,
        host: host
    });
});

// 根路由
app.get('/', (req, res) => {
    res.status(200).json({
        message: '🏢 企業員工管理系統 - Railway測試版',
        status: 'running',
        timestamp: new Date().toISOString()
    });
});

// 測試頁面
app.get('/test', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Railway測試頁面</title>
        <style>body { font-family: Arial; padding: 20px; }</style>
    </head>
    <body>
        <h1>🚀 Railway部署測試成功！</h1>
        <p>伺服器正在正常運行</p>
        <p>時間: ${new Date().toLocaleString('zh-TW')}</p>
        <p>環境: ${process.env.NODE_ENV}</p>
        <p>端口: ${port}</p>
        <p>主機: ${host}</p>
    </body>
    </html>
    `);
});

// 錯誤處理
app.use((err, req, res, next) => {
    console.error('❌ 伺服器錯誤:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
    });
});

// 啟動伺服器
const server = app.listen(port, host, () => {
    console.log('✅ 伺服器啟動成功!');
    console.log(`📍 HTTP: http://${host}:${port}`);
    console.log(`🌐 Railway URL: ${process.env.RAILWAY_PUBLIC_DOMAIN || 'Not provided'}`);
    console.log(`📊 健康檢查: http://${host}:${port}/health`);
    console.log(`🧪 測試頁面: http://${host}:${port}/test`);
    console.log('🎉 Railway最小化伺服器已就緒！');
});

// 優雅關閉
process.on('SIGTERM', () => {
    console.log('🛑 收到終止信號，開始優雅關閉...');
    server.close(() => {
        console.log('✅ 伺服器已關閉');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🛑 收到中斷信號，開始關閉...');
    server.close(() => {
        console.log('✅ 伺服器已關閉');
        process.exit(0);
    });
});

module.exports = app;