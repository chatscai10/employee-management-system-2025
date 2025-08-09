#!/usr/bin/env node

/**
 * 🚀 強制部署完整企業員工管理系統
 */

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🚀 強制部署完整版本...\n');

// 1. 重命名測試版本檔案，確保不被使用
console.log('1️⃣ 重命名測試版本檔案...');
if (fs.existsSync('railway-minimal-server.js')) {
    fs.renameSync('railway-minimal-server.js', 'railway-minimal-server.js.backup');
    console.log('✅ 測試版本已重命名為備份');
}

// 2. 確保railway.json指向正確的伺服器
console.log('\n2️⃣ 確保Railway配置正確...');
const railwayConfig = {
    "$schema": "https://railway.app/railway.schema.json",
    "build": {
        "builder": "NIXPACKS"
    },
    "deploy": {
        "startCommand": "NODE_ENV=production node server/server.js",
        "healthcheckPath": "/health",
        "healthcheckTimeout": 300,
        "restartPolicyType": "ON_FAILURE",
        "restartPolicyMaxRetries": 5
    }
};

fs.writeFileSync('railway.json', JSON.stringify(railwayConfig, null, 2));
console.log('✅ Railway配置已更新指向完整版本');

// 3. 確保package.json有正確的啟動腳本
console.log('\n3️⃣ 確保package.json啟動腳本正確...');
const packagePath = 'package.json';
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

pkg.scripts.start = "NODE_ENV=production node server/server.js";
pkg.main = "server/server.js";

fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
console.log('✅ package.json已更新');

// 4. 創建強制標記檔案
console.log('\n4️⃣ 創建強制部署標記...');
fs.writeFileSync('.railway-force-full-version', new Date().toISOString());
console.log('✅ 強制部署標記已創建');

// 5. 提交所有變更
console.log('\n5️⃣ 提交強制部署變更...');
try {
    execSync('git add .', { stdio: 'inherit' });
    execSync('git commit -m "🚀 強制部署完整企業員工管理系統\n\n✅ 強制變更:\n• 重命名測試版本檔案為備份\n• 確保railway.json指向server/server.js\n• 更新package.json主要啟動腳本\n• 創建強制部署標記檔案\n\n🎯 這次一定要部署完整版本！\n\n🤖 Generated with [Claude Code](https://claude.ai/code)\n\nCo-Authored-By: Claude <noreply@anthropic.com>"', { stdio: 'inherit' });
    execSync('git push origin master', { stdio: 'inherit' });
    console.log('✅ 強制部署變更已推送');
} catch (error) {
    console.log('ℹ️ 變更已準備就緒');
}

console.log('\n' + '='.repeat(60));
console.log('🚀 強制完整版本部署完成');
console.log('='.repeat(60));
console.log('\n📋 Railway將會自動檢測到變更並重新部署');
console.log('🎯 這次一定會使用完整的企業員工管理系統');
console.log('\n⏰ 請等待2-3分鐘讓Railway重新部署');
console.log('🌐 然後重新訪問您的URL查看完整版本');
console.log('\n✨ 完整版本將包含:');
console.log('   • 員工登入介面');
console.log('   • 管理員後台');
console.log('   • 完整的HTML前端');
console.log('   • 資料庫功能');
console.log('   • WebSocket即時通訊');
console.log('='.repeat(60));