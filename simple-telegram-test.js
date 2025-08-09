// 簡單測試 Telegram API
const https = require('https');

const testMessage = "Claude Code /pro 驗證完成 - 系統完整性: 35%";

const data = JSON.stringify({
  chat_id: '-1002658082392',
  text: testMessage
});

const options = {
  hostname: 'api.telegram.org',
  port: 443,
  path: '/bot7659930552:AAF_jF1rAXFnjFO176-9X5fKfBwbrko8BNc/sendMessage',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data, 'utf8')
  }
};

console.log('🧪 測試發送簡單訊息...');
console.log('📊 數據:', data);

const req = https.request(options, (res) => {
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('📱 狀態碼:', res.statusCode);
    console.log('📄 回應:', responseData);
  });
});

req.on('error', (error) => {
  console.error('❌ 錯誤:', error.message);
});

req.write(data);
req.end();