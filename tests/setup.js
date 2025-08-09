/**
 * 🧪 測試環境設置
 * Test Environment Setup
 */

const path = require('path');
const fs = require('fs');

// 設置測試環境變數
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'sqlite::memory:';
process.env.JWT_SECRET = 'test_jwt_secret_for_testing_only';
process.env.LOG_LEVEL = 'error';

// 創建測試用資料庫目錄
const testDbDir = path.join(__dirname, '../database');
if (!fs.existsSync(testDbDir)) {
    fs.mkdirSync(testDbDir, { recursive: true });
}

// 全域測試超時設置
jest.setTimeout(30000);

// 測試前清理
beforeAll(async () => {
    console.log('🧪 設置測試環境...');
});

// 測試後清理
afterAll(async () => {
    console.log('🧹 清理測試環境...');
});