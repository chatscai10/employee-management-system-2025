/**
 * 🔧 修復admin部署問題
 * 將正確的admin-enhanced.html直接覆寫到public目錄
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 開始修復admin-enhanced.html部署問題...');

// 讀取現有的admin.html作為參考
const adminPath = path.join(__dirname, 'public', 'admin.html');
const adminEnhancedPath = path.join(__dirname, 'public', 'admin-enhanced.html');

try {
    // 檢查原admin.html內容
    console.log('📖 檢查原admin.html...');
    const adminContent = fs.readFileSync(adminPath, 'utf8');
    console.log(`📏 admin.html大小: ${adminContent.length} 字符`);
    
    // 檢查標題
    const adminTitleMatch = adminContent.match(/<title>(.*?)<\/title>/);
    if (adminTitleMatch) {
        console.log(`🏷️  admin.html標題: ${adminTitleMatch[1]}`);
    }
    
    // 檢查是否有管理員功能
    const hasManagementFeatures = adminContent.includes('employee-management') ||
                                  adminContent.includes('員工管理') ||
                                  adminContent.includes('庫存管理');
    
    console.log(`🎯 admin.html包含管理功能: ${hasManagementFeatures ? '✅ 是' : '❌ 否'}`);
    
    if (hasManagementFeatures) {
        console.log('✅ 使用admin.html作為admin-enhanced.html的基礎');
        
        // 修改標題為增強版
        const enhancedContent = adminContent.replace(
            /<title>.*?<\/title>/,
            '<title>企業管理員控制台 - 增強版</title>'
        );
        
        // 寫入admin-enhanced.html
        fs.writeFileSync(adminEnhancedPath, enhancedContent);
        console.log('✅ admin-enhanced.html已更新');
        
        // 驗證寫入結果
        const newContent = fs.readFileSync(adminEnhancedPath, 'utf8');
        console.log(`📏 新admin-enhanced.html大小: ${newContent.length} 字符`);
        
        const newTitleMatch = newContent.match(/<title>(.*?)<\/title>/);
        if (newTitleMatch) {
            console.log(`🏷️  新標題: ${newTitleMatch[1]}`);
        }
    }
    
} catch (error) {
    console.error('❌ 修復過程發生錯誤:', error.message);
}

console.log('🎯 修復完成，準備重新部署...');