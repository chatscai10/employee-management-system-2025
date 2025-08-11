const https = require('https');

const testAPIs = [
    '/api/schedule/statistics/2025/8',
    '/api/promotion/vote', 
    '/api/maintenance/requests',
    '/api/inventory/items',
    '/api/work-assignments',
    '/api/attendance/clock'
];

function testAPI(endpoint, method = 'GET', data = null) {
    return new Promise((resolve) => {
        const url = `https://employee-management-system-intermediate.onrender.com${endpoint}`;
        
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        const req = https.request(url, options, (res) => {
            let responseData = '';
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => {
                resolve({
                    endpoint,
                    method,
                    status: res.statusCode,
                    success: res.statusCode < 400,
                    response: responseData
                });
            });
        });
        
        if (data && method === 'POST') {
            req.write(JSON.stringify(data));
        }
        
        req.on('error', (error) => {
            resolve({
                endpoint,
                method, 
                status: 0,
                success: false,
                error: error.message
            });
        });
        
        req.end();
    });
}

async function runTests() {
    console.log('🧪 測試新添加的API端點...\n');
    
    // GET請求測試
    const getTests = testAPIs.slice(0, 4);
    for (const endpoint of getTests) {
        const result = await testAPI(endpoint, 'GET');
        const status = result.success ? '✅' : '❌';
        console.log(`${status} ${result.method} ${result.endpoint}: ${result.status}`);
        if (!result.success) {
            console.log(`   錯誤: ${result.response || result.error}`);
        }
    }
    
    console.log('\n🧪 測試POST端點...\n');
    
    // POST請求測試
    const postTests = [
        { endpoint: '/api/promotion/vote', data: { campaignId: 1, candidateId: 1, employeeId: 1 } },
        { endpoint: '/api/maintenance/requests', data: { description: '測試維修', priority: 'high' } },
        { endpoint: '/api/work-assignments', data: { employeeId: 1, shiftType: 'morning' } },
        { endpoint: '/api/attendance/clock', data: { employeeId: 1, clockType: '上班' } }
    ];
    
    for (const test of postTests) {
        const result = await testAPI(test.endpoint, 'POST', test.data);
        const status = result.success ? '✅' : '❌';
        console.log(`${status} ${result.method} ${test.endpoint}: ${result.status}`);
        if (!result.success) {
            console.log(`   錯誤: ${result.response || result.error}`);
        }
    }
    
    console.log('\n📊 測試完成！');
}

runTests().catch(console.error);