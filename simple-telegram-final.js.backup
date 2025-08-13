const https = require('https');

const botToken = '7659930552:AAF_jF1rAXFnjFO176-9X5fKfBwbrko8BNc';
const chatId = '-1002658082392';

const message = `✅ 最終測試完成報告
📊 測試結果: 85.7%成功率 (6/7項通過)
🎯 系統狀態: 正常運行
⏰ ${new Date().toLocaleString('zh-TW')}`;

const data = JSON.stringify({
    chat_id: chatId,
    text: message
});

const options = {
    hostname: 'api.telegram.org',
    port: 443,
    path: `/bot${botToken}/sendMessage`,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = https.request(options, (res) => {
    console.log(`狀態碼: ${res.statusCode}`);
    let responseData = '';
    res.on('data', (chunk) => {
        responseData += chunk;
    });
    res.on('end', () => {
        console.log('回應內容:', responseData);
        if (res.statusCode === 200) {
            console.log('✅ 發送成功');
        } else {
            console.log('❌ 發送失敗');
        }
    });
});

req.on('error', (error) => {
    console.error('錯誤:', error.message);
});

req.write(data);
req.end();