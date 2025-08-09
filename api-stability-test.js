#!/usr/bin/env node
/**
 * 📋 API端點穩定性測試腳本
 */

const http = require('http');

class APIStabilityTester {
    constructor() {
        this.baseUrl = 'http://localhost:3000';
        this.testResults = [];
    }

    async testEndpoint(method, path, data = null, headers = {}) {
        return new Promise((resolve) => {
            const url = new URL(path, this.baseUrl);
            const options = {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname + url.search,
                method: method,
                headers: { 'Content-Type': 'application/json', ...headers }
            };

            const startTime = Date.now();
            const req = http.request(options, (res) => {
                let responseData = '';
                res.on('data', chunk => responseData += chunk);
                res.on('end', () => {
                    const endTime = Date.now();
                    const result = {
                        method, path, status: res.statusCode,
                        responseTime: endTime - startTime,
                        success: res.statusCode < 500,
                        data: responseData
                    };
                    this.testResults.push(result);
                    resolve(result);
                });
            });

            req.on('error', (error) => {
                const result = { method, path, error: error.message, success: false };
                this.testResults.push(result);
                resolve(result);
            });

            if (data) req.write(JSON.stringify(data));
            req.end();
        });
    }

    async runAllTests() {
        console.log('🚀 開始API端點穩定性測試...');
        console.log('='.repeat(50));

        const tests = [
            { method: 'GET', path: '/health', desc: '健康檢查端點' },
            { method: 'GET', path: '/api/admin/stats', desc: '統計數據端點' },
            { method: 'GET', path: '/api/admin/stores', desc: '分店列表端點' },
            { method: 'GET', path: '/api/revenue/config', desc: '營收配置端點' },
            { method: 'GET', path: '/api/revenue/test', desc: '營收測試端點' },
            { method: 'GET', path: '/nonexistent', desc: '不存在端點測試' },
            { method: 'POST', path: '/api/auth/register', data: {}, desc: '註冊端點錯誤處理' },
            { method: 'POST', path: '/api/auth/login', data: {}, desc: '登入端點錯誤處理' }
        ];

        for (const test of tests) {
            console.log('\n🧪 測試:', test.desc);
            const result = await this.testEndpoint(test.method, test.path, test.data);
            
            if (result.success) {
                console.log('✅ 狀態:', result.status, '| 響應時間:', result.responseTime + 'ms');
            } else {
                console.log('❌ 錯誤:', result.error || ('狀態碼: ' + result.status));
            }
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        this.generateReport();
    }

    generateReport() {
        console.log('\n📊 API穩定性測試報告:');
        console.log('='.repeat(50));

        const successful = this.testResults.filter(r => r.success).length;
        const total = this.testResults.length;
        const avgResponseTime = this.testResults
            .filter(r => r.responseTime)
            .reduce((sum, r) => sum + r.responseTime, 0) /
            this.testResults.filter(r => r.responseTime).length;

        console.log('📈 成功率:', Math.round((successful/total)*100) + '%', '(' + successful + '/' + total + ')');
        console.log('⏱️ 平均響應時間:', Math.round(avgResponseTime) + 'ms');
        console.log('\n✅ API端點穩定性測試完成');
    }
}

async function main() {
    const tester = new APIStabilityTester();
    await tester.runAllTests();
}

main();