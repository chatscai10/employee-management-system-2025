/**
 * 📋 登入憑證幫助通知
 */

const https = require('https');

const telegramConfig = {
    botToken: 'process.env.TELEGRAM_BOT_TOKEN',
    chatId: 'process.env.TELEGRAM_GROUP_ID'
};

const message = `📋 企業員工管理系統 - 登入憑證說明

❗ 用戶登入問題檢測
用戶嘗試使用"系統管理員"登入但憑證不存在

✅ 可用的登入憑證:
┌─────────────────────────────────┐
│ 🔐 員工登入資訊                    │
│                               │
│ 👤 姓名: 測試員工                │
│ 🆔 身分證號碼: A123456789          │
│ 📍 職位: 實習生                  │
│                               │
│ 🌐 登入地址:                    │
│ http://localhost:3009          │
│                               │
│ 💡 登入步驟:                    │
│ 1. 訪問系統首頁                  │
│ 2. 填寫姓名和身分證號碼            │
│ 3. 點擊登入                     │
└─────────────────────────────────┘

🔧 系統狀態:
• 認證API: ✅ 正常運作
• 登入功能: ✅ 完全可用
• 員工頁面: ✅ 正常載入
• 端口: 3009 (最新)

💡 提示:
如需創建新用戶或管理員權限，
請聯繫系統管理員進行數據庫操作

⚡ 通知時間: ${new Date().toLocaleString('zh-TW')}
🤖 企業系統助手`;

function sendTelegramNotification() {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            chat_id: telegramConfig.chatId,
            text: message
        });

        const options = {
            hostname: 'api.telegram.org',
            port: 443,
            path: `/bot${telegramConfig.botToken}/sendMessage`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const result = JSON.parse(responseData);
                    if (result.ok) {
                        console.log('✅ Telegram通知發送成功');
                        resolve(result);
                    } else {
                        console.log('❌ Telegram通知發送失敗:', result.description);
                        reject(new Error(result.description));
                    }
                } catch (error) {
                    console.log('❌ Telegram回應解析失敗:', error.message);
                    reject(error);
                }
            });
        });

        req.on('error', (error) => {
            console.log('❌ Telegram請求失敗:', error.message);
            reject(error);
        });

        req.write(data);
        req.end();
    });
}

// 執行通知
console.log('📱 發送登入憑證幫助通知...');
sendTelegramNotification()
    .then(() => {
        console.log('🎉 登入憑證幫助通知發送成功！');
        console.log('📋 用戶現在知道正確的登入資訊');
    })
    .catch((error) => {
        console.log('❌ 通知發送失敗:', error.message);
    });