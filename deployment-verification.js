const https = require('https');
const fs = require('fs');

async function verifyDeployment() {
    console.log('🔍 檢查Render部署狀態...');
    
    const testUrl = 'https://employee-management-system-intermediate.onrender.com/api/test';
    
    return new Promise((resolve, reject) => {
        https.get(testUrl, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    console.log('📊 API測試回應:', JSON.stringify(response, null, 2));
                    
                    if (response.version === 'intermediate-fixed') {
                        console.log('❌ Render仍在使用簡化版 (intermediate-fixed)');
                        console.log('🔧 需要強制重新部署完整版系統');
                        resolve(false);
                    } else if (response.version === '完整企業員工管理系統') {
                        console.log('✅ Render已切換到完整版系統');
                        resolve(true);
                    } else {
                        console.log('⚠️ 未知版本:', response.version);
                        resolve(false);
                    }
                } catch (error) {
                    console.error('❌ 解析回應失敗:', error);
                    reject(error);
                }
            });
        }).on('error', (error) => {
            console.error('❌ 請求失敗:', error);
            reject(error);
        });
    });
}

async function forceCompleteSystemDeploy() {
    console.log('🚀 強制部署完整版系統...');
    
    // 檢查完整版server/server.js是否存在
    if (fs.existsSync('./server/server.js')) {
        console.log('✅ 完整版server/server.js確認存在');
        
        // 檢查完整版employee.html是否存在
        if (fs.existsSync('./public/employee.html')) {
            console.log('✅ 完整版employee.html確認存在');
            
            // 檢查package.json配置
            const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
            console.log('📋 package.json start命令:', packageJson.scripts.start);
            
            if (packageJson.scripts.start === 'node server/server.js') {
                console.log('✅ package.json已正確配置');
                return true;
            } else {
                console.log('❌ package.json配置不正確');
                return false;
            }
        } else {
            console.log('❌ 完整版employee.html不存在');
            return false;
        }
    } else {
        console.log('❌ 完整版server/server.js不存在');
        return false;
    }
}

// 發送Telegram通知
function sendTelegramNotification(message) {
    const telegramData = {
        chat_id: 'process.env.TELEGRAM_GROUP_ID',
        text: `🚀 完整版系統部署狀態通知\n\n${message}\n\n時間: ${new Date().toLocaleString('zh-TW')}`
    };
    
    const postData = JSON.stringify(telegramData);
    const options = {
        hostname: 'api.telegram.org',
        port: 443,
        path: '/botprocess.env.TELEGRAM_BOT_TOKEN/sendMessage',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };
    
    const req = https.request(options, (res) => {
        console.log('📱 Telegram通知已發送');
    });
    
    req.write(postData);
    req.end();
}

async function main() {
    try {
        const isComplete = await verifyDeployment();
        
        if (!isComplete) {
            console.log('\n⚠️ 檢測到Render仍在使用簡化版系統');
            
            const configCorrect = await forceCompleteSystemDeploy();
            if (configCorrect) {
                console.log('✅ 配置已正確，需要Render重新讀取配置');
                console.log('🔄 可能需要觸發新的部署來強制更新');
                
                sendTelegramNotification('❌ Render部署配置問題\n\n雖然已更新package.json指向完整版server/server.js，但Render仍在使用簡化版。需要強制重新部署。');
            } else {
                console.log('❌ 配置有問題，需要修復');
                sendTelegramNotification('❌ 完整版系統配置有問題\n\n需要檢查server/server.js和package.json配置');
            }
        } else {
            console.log('🎉 Render已成功部署完整版系統！');
            sendTelegramNotification('🎉 完整版系統部署成功\n\nRender已切換到完整企業員工管理系統');
        }
        
    } catch (error) {
        console.error('❌ 部署驗證失敗:', error);
        sendTelegramNotification(`❌ 部署驗證失敗\n\n錯誤: ${error.message}`);
    }
}

main();