
// 添加頻率限制機制 - 性能優化
const rateLimiter = {
    lastSent: {},
    minInterval: 5000, // 5秒最小間隔
    
    canSend(key) {
        const now = Date.now();
        if (!this.lastSent[key] || now - this.lastSent[key] > this.minInterval) {
            this.lastSent[key] = now;
            return true;
        }
        return false;
    }
};

// 包裝原始發送函數
const originalSendFunction = global.sendTelegramNotification || function(){};
global.sendTelegramNotification = function(message, key = 'default') {
    if (rateLimiter.canSend(key)) {
        return originalSendFunction(message);
    } else {
        console.log('⚡ Telegram 頻率限制: 跳過發送');
        return Promise.resolve();
    }
};

/**
 * 📱 最終Telegram通知
 */

const https = require('https');

const telegramConfig = {
    botToken: 'process.env.TELEGRAM_BOT_TOKEN',
    chatId: 'process.env.TELEGRAM_GROUP_ID'
};

const message = `🎉 企業系統界面問題修復完成

✅ 核心問題解決: 用戶不再看到測試頁面
✅ 登入界面正常: 企業員工管理系統
🌐 系統地址: http://localhost:3007
📊 修復狀態: 完全成功

🔧 主要修復項目:
• Express路由優先級修復
• 靜態文件配置修正  
• 用戶體驗完全恢復

🎯 系統現在可正常使用

⚡ ${new Date().toLocaleString('zh-TW')}
🤖 PRO智慧模組`;

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
console.log('📱 發送最終修復通知...');
sendTelegramNotification()
    .then(() => {
        console.log('🎉 通知發送完成！');
        console.log('📊 企業系統界面問題修復任務完成');
    })
    .catch((error) => {
        console.log('❌ 通知發送失敗:', error.message);
    });