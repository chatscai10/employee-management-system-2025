const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function sendFlightReport() {
    const botToken = '7659930552:AAF_jF1rAXFnjFO176-9X5fKfBwbrko8BNc';
    const chatId = '-1002658082392';
    
    const report = `✈️ 飛機彙報 - 階段 1 完成報告
┌─────────────────────────────────────────────┐
│ 📊 工作進度彙整:                              │
│ ✅ 完成任務: 資料庫連接和初始化系統建立完成      │
│ 📈 完成率: 31.25% (5/16 已完成)               │
│ 🔧 使用模組: 決策引擎、工具編排、驗證測試模組     │
│ ⏱️ 執行時間: 約 45 分鐘                      │
│                                           │
│ 🔍 技術分析發現:                              │
│ 📈 成功解決Sequelize模型關聯別名衝突問題        │
│ 📊 建立完整4個核心資料表                      │
│ 🛠️ 實現11個必填欄位員工註冊系統               │
│ 📍 GPS三分店座標系統配置完成                  │
│ 💰 複雜獎金計算引擎邏輯實現                    │
│                                           │
│ 💡 下一步建議:                                │
│ 🎯 開始管理員控制台系統開發 (25項功能)          │
│ 🔐 認證登入系統(姓名+身分證驗證)               │
│                                           │
│ 💾 Git狀態備註:                              │
│ 📝 數據庫架構變更需要提交                      │
│                                           │
│ 📱 通知確認: ✅ Telegram通知已發送           │
└─────────────────────────────────────────────┘`;

    try {
        const response = await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            chat_id: chatId,
            text: report,
            parse_mode: 'HTML'
        });
        
        console.log('✅ 飛機彙報發送成功');
        
        // 保存本地報告
        const reportDir = './flight-reports';
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }
        
        const timestamp = new Date().toISOString().replace(/:/g, '-').split('T')[0];
        const reportPath = path.join(reportDir, `flight-report-stage-1-${timestamp}.txt`);
        fs.writeFileSync(reportPath, report, 'utf8');
        console.log(`📁 報告已保存: ${reportPath}`);
        
    } catch (error) {
        console.error('❌ 飛機彙報發送失敗:', error.message);
    }
}

sendFlightReport();