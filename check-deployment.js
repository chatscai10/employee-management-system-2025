/**
 * 🔍 檢查部署狀態工具
 */

const https = require('https');

function checkDeployment() {
    console.log('🔍 檢查Railway部署狀態...');
    
    const options = {
        hostname: 'employee-management-system-intermediate.onrender.com',
        port: 443,
        path: '/admin-enhanced.html',
        method: 'GET',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    };

    const req = https.request(options, (res) => {
        console.log(`📊 HTTP狀態碼: ${res.statusCode}`);
        console.log(`📄 內容類型: ${res.headers['content-type']}`);
        console.log(`📏 內容長度: ${res.headers['content-length']}`);
        console.log(`⏰ 最後修改: ${res.headers['last-modified']}`);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            // 檢查標題
            const titleMatch = data.match(/<title>(.*?)<\/title>/);
            if (titleMatch) {
                console.log(`🏷️  頁面標題: ${titleMatch[1]}`);
            }
            
            // 檢查是否包含管理員界面特徵
            const hasAdminFeatures = data.includes('企業管理員控制台') || 
                                   data.includes('data-section="employee-management"') ||
                                   data.includes('員工管理') && data.includes('庫存管理') && data.includes('營收管理');
            
            console.log(`🎯 包含管理員功能: ${hasAdminFeatures ? '✅ 是' : '❌ 否'}`);
            
            // 檢查內容長度
            console.log(`📝 頁面內容大小: ${data.length} 字符`);
            
            if (data.length < 10000) {
                console.log('⚠️  警告: 頁面內容過短，可能部署不完整');
            }
            
            // 檢查關鍵元素
            const keyElements = [
                'employee-management',
                'inventory-management', 
                'revenue-management',
                'schedule-management'
            ];
            
            const foundElements = keyElements.filter(element => data.includes(element));
            console.log(`🔧 找到的系統元素 (${foundElements.length}/${keyElements.length}):`, foundElements);
        });
    });

    req.on('error', (error) => {
        console.error('❌ 請求失敗:', error.message);
    });

    req.setTimeout(10000, () => {
        console.log('⏰ 請求逾時');
        req.destroy();
    });

    req.end();
}

checkDeployment();