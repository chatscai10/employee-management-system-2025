
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
 * 🔄 無限重定向循環修復完成通知
 */

const https = require('https');

const telegramConfig = {
    botToken: '7659930552:AAF_jF1rAXFnjFO176-9X5fKfBwbrko8BNc',
    chatId: '-1002658082392'
};

const message = `🔄 無限重定向循環問題修復完成

✅ 問題根因: Token存儲key不一致
✅ 修復狀態: 完全解決
🌐 系統地址: http://localhost:3009
📊 登入流程: 正常無循環

🔧 修復詳情:
• 統一token存儲key為 'employeeToken'
• 統一員工數據key為 'employeeData'  
• 添加500ms延遲確保localStorage同步
• 移除localStorage key不一致問題

🎯 修復前問題:
❌ 登入頁面存儲: localStorage.setItem('token', ...)
❌ 員工頁面檢查: localStorage.getItem('employeeToken')
❌ Key不匹配導致認證失敗
❌ 無限重定向 login ↔ employee

✅ 修復後狀態:
✅ 登入頁面存儲: localStorage.setItem('employeeToken', ...)
✅ 員工頁面檢查: localStorage.getItem('employeeToken')
✅ Key完全匹配
✅ 認證檢查成功
✅ 停留在員工頁面

🏆 現在登入流程:
1. 用戶填寫正確憑證
2. 登入成功，token存儲到localStorage
3. 跳轉到員工頁面
4. 認證檢查成功找到token
5. 顯示員工工作台內容
6. ✅ 停留在員工頁面，無循環

💡 使用提醒:
• 姓名: 測試員工
• 身分證: A123456789
• 清除瀏覽器緩存重新測試

⚡ 修復完成時間: ${new Date().toLocaleString('zh-TW')}
🤖 智慧修復系統 - 重定向模組`;

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
console.log('📱 發送無限重定向修復完成通知...');
sendTelegramNotification()
    .then(() => {
        console.log('🎉 修復完成通知發送成功！');
        console.log('🔄 無限重定向循環問題已徹底解決');
    })
    .catch((error) => {
        console.log('❌ 通知發送失敗:', error.message);
    });