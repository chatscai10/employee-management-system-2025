/**
 * API端點緊急修復測試腳本
 * 檢查修復後的API端點是否能正常響應
 */

const http = require('http');
const util = require('util');

const baseUrl = 'http://localhost:3001';

const endpoints = [
    // 基本健康檢查
    { method: 'GET', path: '/health', expected: true },
    
    // 認證相關API
    { method: 'GET', path: '/api/auth', expected: true },
    { method: 'GET', path: '/api/auth/test', expected: true },
    
    // 出勤相關API
    { method: 'GET', path: '/api/attendance', expected: true },
    { method: 'GET', path: '/api/attendance/test', expected: true },
    
    // 員工相關API
    { method: 'GET', path: '/api/employees', expected: true },
    
    // 營收相關API
    { method: 'GET', path: '/api/revenue', expected: true },
    { method: 'GET', path: '/api/revenue/test', expected: true }
];

function makeRequest(method, path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({
                        statusCode: res.statusCode,
                        data: jsonData,
                        success: res.statusCode >= 200 && res.statusCode < 400
                    });
                } catch (error) {
                    resolve({
                        statusCode: res.statusCode,
                        data: data,
                        success: false,
                        error: 'Invalid JSON response'
                    });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.setTimeout(5000, () => {
            req.abort();
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}

async function testEndpoints() {
    console.log('🚀 開始API端點緊急修復驗證測試...\n');
    
    const results = [];
    let passCount = 0;
    let failCount = 0;

    for (const endpoint of endpoints) {
        try {
            console.log(`📡 測試 ${endpoint.method} ${endpoint.path}`);
            
            const result = await makeRequest(endpoint.method, endpoint.path);
            
            const isPass = result.success && result.statusCode !== 404;
            
            if (isPass) {
                console.log(`✅ PASS - ${endpoint.method} ${endpoint.path} (${result.statusCode})`);
                passCount++;
            } else {
                console.log(`❌ FAIL - ${endpoint.method} ${endpoint.path} (${result.statusCode})`);
                console.log(`   Response: ${JSON.stringify(result.data, null, 2).substring(0, 200)}...`);
                failCount++;
            }
            
            results.push({
                endpoint: `${endpoint.method} ${endpoint.path}`,
                statusCode: result.statusCode,
                success: isPass,
                response: result.data
            });
            
        } catch (error) {
            console.log(`❌ ERROR - ${endpoint.method} ${endpoint.path}: ${error.message}`);
            failCount++;
            
            results.push({
                endpoint: `${endpoint.method} ${endpoint.path}`,
                success: false,
                error: error.message
            });
        }
        
        // 等待一小段時間避免請求過於頻繁
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log('\n📊 測試結果總結:');
    console.log('=' .repeat(50));
    console.log(`✅ 通過: ${passCount}`);
    console.log(`❌ 失敗: ${failCount}`);
    console.log(`📈 成功率: ${Math.round((passCount / (passCount + failCount)) * 100)}%`);
    console.log('=' .repeat(50));

    // 生成詳細報告
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            total: passCount + failCount,
            passed: passCount,
            failed: failCount,
            successRate: Math.round((passCount / (passCount + failCount)) * 100)
        },
        results: results
    };

    const fs = require('fs');
    const reportFile = `api-endpoints-test-report-${Date.now()}.json`;
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    console.log(`\n📄 詳細報告已保存至: ${reportFile}`);
    
    if (failCount === 0) {
        console.log('\n🎉 所有API端點測試通過！系統修復成功！');
        return true;
    } else {
        console.log(`\n⚠️  有 ${failCount} 個端點仍需修復`);
        return false;
    }
}

// 執行測試
testEndpoints().catch(error => {
    console.error('測試執行失敗:', error);
    process.exit(1);
});