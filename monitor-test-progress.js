#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 監控綜合角色驗證測試進度...\n');

// 檢查截圖目錄
const screenshotDir = path.join(__dirname, 'D:0809screenshots');
if (fs.existsSync(screenshotDir)) {
    const screenshots = fs.readdirSync(screenshotDir).filter(file => 
        file.includes('role') || file.includes('test') || file.includes('verification')
    );
    console.log(`📸 已生成截圖: ${screenshots.length} 張`);
    screenshots.slice(-5).forEach(file => {
        console.log(`   └─ ${file}`);
    });
} else {
    console.log('📸 截圖目錄尚未創建或無相關截圖');
}

// 檢查測試報告
const reportFiles = fs.readdirSync(__dirname).filter(file => 
    file.includes('role') && (file.endsWith('.json') || file.endsWith('.md'))
);

if (reportFiles.length > 0) {
    console.log(`\n📊 測試報告文件: ${reportFiles.length} 個`);
    reportFiles.forEach(file => {
        const stats = fs.statSync(path.join(__dirname, file));
        console.log(`   └─ ${file} (${Math.round(stats.size/1024)}KB)`);
    });
} else {
    console.log('\n📊 測試報告尚未生成，測試可能仍在進行中...');
}

// 檢查日誌文件
const logFiles = fs.readdirSync(__dirname).filter(file => 
    file.includes('log') || file.includes('error')
);

if (logFiles.length > 0) {
    console.log(`\n📝 日誌文件: ${logFiles.length} 個`);
    logFiles.slice(-3).forEach(file => {
        console.log(`   └─ ${file}`);
    });
}

console.log('\n⏱️ 測試監控完成');