const https = require('https');

async function sendTelegram() {
    const message = "Railway驗證完成！系統部署成功，已修復登入問題並重新部署。";
    
    const data = JSON.stringify({
        chat_id: '-1002658082392',
        text: message
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

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => responseData += chunk);
            res.on('end', () => {
                console.log(`狀態: ${res.statusCode}`);
                console.log(`回應: ${responseData}`);
                
                if (res.statusCode === 200) {
                    console.log('✅ 成功發送');
                    resolve();
                } else {
                    reject(new Error(responseData));
                }
            });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

sendTelegram()
    .then(() => console.log('完成'))
    .catch(error => console.error('錯誤:', error));