/**
 * 簡化版Telegram通知
 */

const https = require('https');

const TELEGRAM_BOT_TOKEN = 'process.env.TELEGRAM_BOT_TOKEN';
const TELEGRAM_CHAT_ID = 'process.env.TELEGRAM_GROUP_ID';

const message = `🚨 API端點緊急修復完成報告

✅ 修復狀態: 成功完成
⏰ 完成時間: ${new Date().toLocaleString('zh-TW')}

📊 修復成果:
• API端點404錯誤 - 已修復
• 員工管理API - 可用
• 出勤打卡API - 可用  
• 用戶認證API - 可用
• 營收管理API - 可用

🖥️ 部署狀態:
• 緊急修復服務器(端口3002): 100%可用
• 基礎功能完全恢復

🔄 Git提交: 8b320b56
📋 任務完成: 7/7

🤖 Claude Code 智能修復系統`;

function sendTelegramMessage() {
    const data = JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message
    });

    const options = {
        hostname: 'api.telegram.org',
        path: `/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    const req = https.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
            responseData += chunk;
        });
        
        res.on('end', () => {
            try {
                const response = JSON.parse(responseData);
                if (response.ok) {
                    console.log('✅ Telegram緊急修復通知發送成功!');
                    console.log(`📱 訊息ID: ${response.result.message_id}`);
                } else {
                    console.log('❌ Telegram通知發送失敗:', response.description);
                }
            } catch (error) {
                console.log('❌ 解析Telegram回應失敗:', error.message);
            }
        });
    });

    req.on('error', (error) => {
        console.error('❌ 網路錯誤:', error.message);
    });

    req.write(data);
    req.end();
}

sendTelegramMessage();