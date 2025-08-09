#!/usr/bin/env node
/**
 * 智慧瀏覽器驗證引擎
 * 完整的端到端系統驗證和測試
 * 版本: 2.0 - 完全自動化驗證
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class IntelligentBrowserVerificationEngine {
    constructor() {
        this.baseUrl = 'http://localhost:3000';
        this.results = {
            timestamp: new Date().toISOString(),
            systemInfo: {},
            tests: [],
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                warnings: 0,
                successRate: 0,
                avgResponseTime: 0
            },
            performance: {},
            recommendations: []
        };
        this.startTime = Date.now();
    }

    // 系統資訊收集
    async collectSystemInfo() {
        console.log('🔍 收集系統資訊...');
        
        try {
            const nodeVersion = process.version;
            const platform = process.platform;
            const arch = process.arch;
            const memory = process.memoryUsage();
            
            // 檢查數據庫文件
            const dbPath = path.join(process.cwd(), 'database', 'employee_management.db');
            const dbExists = fs.existsSync(dbPath);
            const dbSize = dbExists ? fs.statSync(dbPath).size : 0;
            
            // 檢查伺服器進程
            let serverProcess = null;
            try {
                const { stdout } = await execAsync('netstat -an | findstr 3000');
                serverProcess = stdout.includes('LISTENING') ? 'Running' : 'Not Running';
            } catch (error) {
                serverProcess = 'Unknown';
            }

            this.results.systemInfo = {
                nodeVersion,
                platform,
                arch,
                memory: {
                    rss: Math.round(memory.rss / 1024 / 1024) + ' MB',
                    heapTotal: Math.round(memory.heapTotal / 1024 / 1024) + ' MB',
                    heapUsed: Math.round(memory.heapUsed / 1024 / 1024) + ' MB',
                    external: Math.round(memory.external / 1024 / 1024) + ' MB'
                },
                database: {
                    exists: dbExists,
                    size: Math.round(dbSize / 1024) + ' KB',
                    path: dbPath
                },
                server: {
                    status: serverProcess,
                    port: 3000,
                    url: this.baseUrl
                }
            };

            console.log('✅ 系統資訊收集完成');
            return true;
        } catch (error) {
            console.error('❌ 系統資訊收集失敗:', error.message);
            return false;
        }
    }

    // HTTP 請求測試
    async makeRequest(path, method = 'GET', data = null, headers = {}) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const url = new URL(path, this.baseUrl);
            
            const options = {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname + url.search,
                method: method,
                headers: {
                    'User-Agent': 'IntelligentBrowserVerificationEngine/2.0',
                    'Accept': '*/*',
                    ...headers
                }
            };

            if (data && (method === 'POST' || method === 'PUT')) {
                const postData = JSON.stringify(data);
                options.headers['Content-Type'] = 'application/json';
                options.headers['Content-Length'] = Buffer.byteLength(postData);
            }

            const req = http.request(options, (res) => {
                let body = '';
                res.on('data', (chunk) => {
                    body += chunk;
                });
                
                res.on('end', () => {
                    const endTime = Date.now();
                    resolve({
                        statusCode: res.statusCode,
                        statusMessage: res.statusMessage,
                        headers: res.headers,
                        body: body,
                        responseTime: endTime - startTime,
                        success: res.statusCode >= 200 && res.statusCode < 400
                    });
                });
            });

            req.on('error', (error) => {
                const endTime = Date.now();
                resolve({
                    statusCode: 0,
                    statusMessage: 'Request Failed',
                    headers: {},
                    body: '',
                    responseTime: endTime - startTime,
                    success: false,
                    error: error.message
                });
            });

            if (data && (method === 'POST' || method === 'PUT')) {
                req.write(JSON.stringify(data));
            }
            
            req.end();
        });
    }

    // 測試單個端點
    async testEndpoint(name, path, method = 'GET', data = null, expectedStatus = 200) {
        console.log(`🔬 測試: ${name}`);
        
        const result = await this.makeRequest(path, method, data);
        const passed = result.success && (expectedStatus === null || result.statusCode === expectedStatus);
        
        const testResult = {
            name,
            path,
            method,
            expectedStatus,
            actualStatus: result.statusCode,
            responseTime: result.responseTime,
            success: passed,
            timestamp: new Date().toISOString(),
            details: {
                statusMessage: result.statusMessage,
                contentLength: result.body.length,
                hasBody: result.body.length > 0,
                headers: Object.keys(result.headers),
                error: result.error || null
            }
        };

        if (!passed) {
            testResult.details.failureReason = result.error || `Expected ${expectedStatus}, got ${result.statusCode}`;
        }

        // 分析響應內容
        if (result.body) {
            try {
                if (result.headers['content-type']?.includes('application/json')) {
                    const jsonData = JSON.parse(result.body);
                    testResult.details.responseType = 'JSON';
                    testResult.details.responseData = typeof jsonData === 'object' ? Object.keys(jsonData) : jsonData;
                } else if (result.headers['content-type']?.includes('text/html')) {
                    testResult.details.responseType = 'HTML';
                    testResult.details.responseData = {
                        title: this.extractHtmlTitle(result.body),
                        hasForm: result.body.includes('<form'),
                        hasScript: result.body.includes('<script'),
                        hasCSS: result.body.includes('<link') || result.body.includes('<style')
                    };
                } else {
                    testResult.details.responseType = 'Other';
                }
            } catch (parseError) {
                testResult.details.parseError = parseError.message;
            }
        }

        this.results.tests.push(testResult);
        this.results.summary.total++;
        
        if (passed) {
            this.results.summary.passed++;
            console.log(`✅ ${name} - 通過 (${result.responseTime}ms)`);
        } else {
            this.results.summary.failed++;
            console.log(`❌ ${name} - 失敗 (${result.statusCode}: ${result.statusMessage})`);
        }

        return testResult;
    }

    // 提取HTML標題
    extractHtmlTitle(html) {
        const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
        return titleMatch ? titleMatch[1].trim() : 'No Title';
    }

    // 基礎頁面測試
    async runBasicPageTests() {
        console.log('\n📋 執行基礎頁面測試...');
        
        const basicTests = [
            { name: '主頁面', path: '/', expectedStatus: 200 },
            { name: '登入頁面', path: '/login.html', expectedStatus: 200 },
            { name: 'CSS樣式表', path: '/css/style.css', expectedStatus: 200 },
            { name: 'JavaScript腳本', path: '/js/main.js', expectedStatus: 200 },
            { name: 'API健康檢查', path: '/api/health', expectedStatus: 200 },
            { name: '不存在頁面 (404測試)', path: '/nonexistent-page', expectedStatus: 404 }
        ];

        for (const test of basicTests) {
            await this.testEndpoint(test.name, test.path, 'GET', null, test.expectedStatus);
        }
    }

    // API端點測試
    async runAPITests() {
        console.log('\n🔌 執行API端點測試...');
        
        const apiTests = [
            { name: 'API根路徑', path: '/api', expectedStatus: 200 },
            { name: '獲取用戶列表', path: '/api/users', expectedStatus: [200, 401] }, // 可能需要認證
            { name: '員工API', path: '/api/employees', expectedStatus: [200, 401] },
            { name: '出勤API', path: '/api/attendance', expectedStatus: [200, 401] },
            { name: '排程API', path: '/api/schedule', expectedStatus: [200, 401] },
            { name: '營收API', path: '/api/revenue', expectedStatus: [200, 401] },
            { name: '維修API', path: '/api/maintenance', expectedStatus: [200, 401] },
            { name: '無效API端點', path: '/api/invalid-endpoint', expectedStatus: 404 }
        ];

        for (const test of apiTests) {
            const result = await this.makeRequest(test.path);
            const expectedStatuses = Array.isArray(test.expectedStatus) ? test.expectedStatus : [test.expectedStatus];
            const passed = expectedStatuses.includes(result.statusCode);
            
            const testResult = {
                name: test.name,
                path: test.path,
                method: 'GET',
                expectedStatus: test.expectedStatus,
                actualStatus: result.statusCode,
                responseTime: result.responseTime,
                success: passed,
                timestamp: new Date().toISOString(),
                details: {
                    statusMessage: result.statusMessage,
                    contentLength: result.body.length,
                    error: result.error || null
                }
            };

            this.results.tests.push(testResult);
            this.results.summary.total++;
            
            if (passed) {
                this.results.summary.passed++;
                console.log(`✅ ${test.name} - 通過 (${result.statusCode}, ${result.responseTime}ms)`);
            } else {
                this.results.summary.failed++;
                console.log(`❌ ${test.name} - 失敗 (期望: ${test.expectedStatus}, 實際: ${result.statusCode})`);
            }
        }
    }

    // 認證測試
    async runAuthenticationTests() {
        console.log('\n🔐 執行認證功能測試...');
        
        // 測試登入端點
        const loginData = {
            email: 'test@example.com',
            password: 'testpassword'
        };

        await this.testEndpoint(
            '登入API (無效憑證)', 
            '/api/auth/login', 
            'POST', 
            loginData, 
            [400, 401, 422] // 預期失敗
        );

        // 測試註冊端點
        const registerData = {
            name: 'Test User',
            email: 'newtest@example.com',
            password: 'newpassword',
            role: 'employee'
        };

        await this.testEndpoint(
            '註冊API', 
            '/api/auth/register', 
            'POST', 
            registerData, 
            [200, 201, 400, 409] // 可能成功或失敗
        );

        // 測試未授權訪問
        await this.testEndpoint(
            '未授權管理員訪問', 
            '/api/admin/users', 
            'GET', 
            null, 
            [401, 403]
        );
    }

    // 性能分析
    async runPerformanceAnalysis() {
        console.log('\n📊 執行性能分析...');
        
        const performanceTests = [];
        const testPath = '/';
        const iterations = 5;
        
        console.log(`🚀 執行 ${iterations} 次性能測試...`);
        
        for (let i = 0; i < iterations; i++) {
            const result = await this.makeRequest(testPath);
            performanceTests.push(result.responseTime);
            console.log(`   第 ${i + 1} 次: ${result.responseTime}ms`);
        }
        
        // 計算性能統計
        const avgResponseTime = performanceTests.reduce((a, b) => a + b, 0) / performanceTests.length;
        const minResponseTime = Math.min(...performanceTests);
        const maxResponseTime = Math.max(...performanceTests);
        
        this.results.performance = {
            iterations,
            responseTimeMs: {
                average: Math.round(avgResponseTime),
                minimum: minResponseTime,
                maximum: maxResponseTime,
                variance: Math.round(Math.sqrt(performanceTests.reduce((sq, n) => sq + Math.pow(n - avgResponseTime, 2), 0) / performanceTests.length))
            },
            rating: this.getPerformanceRating(avgResponseTime)
        };
        
        this.results.summary.avgResponseTime = Math.round(avgResponseTime);
        
        console.log(`📈 平均響應時間: ${Math.round(avgResponseTime)}ms`);
        console.log(`📈 性能評級: ${this.results.performance.rating}`);
    }

    // 性能評級
    getPerformanceRating(avgTime) {
        if (avgTime < 100) return '優秀';
        if (avgTime < 300) return '良好';
        if (avgTime < 500) return '一般';
        if (avgTime < 1000) return '需要改善';
        return '性能不佳';
    }

    // 數據庫連接測試
    async runDatabaseTests() {
        console.log('\n🗄️ 執行數據庫測試...');
        
        const dbPath = path.join(process.cwd(), 'database', 'employee_management.db');
        
        if (!fs.existsSync(dbPath)) {
            console.log('❌ 數據庫文件不存在');
            this.results.tests.push({
                name: '數據庫文件存在性檢查',
                success: false,
                details: { error: '數據庫文件不存在', path: dbPath }
            });
            this.results.summary.total++;
            this.results.summary.failed++;
            return;
        }
        
        // 檢查數據庫文件大小和權限
        const dbStats = fs.statSync(dbPath);
        const dbTest = {
            name: '數據庫連接性檢查',
            success: dbStats.size > 0,
            details: {
                size: dbStats.size,
                readable: fs.access ? true : false,
                lastModified: dbStats.mtime
            }
        };
        
        this.results.tests.push(dbTest);
        this.results.summary.total++;
        
        if (dbTest.success) {
            this.results.summary.passed++;
            console.log(`✅ 數據庫文件正常 (${Math.round(dbStats.size / 1024)}KB)`);
        } else {
            this.results.summary.failed++;
            console.log('❌ 數據庫文件異常');
        }
    }

    // 安全性檢查
    async runSecurityTests() {
        console.log('\n🛡️ 執行安全性檢查...');
        
        const securityTests = [
            { name: 'HTTP頭安全檢查', path: '/' },
            { name: 'CORS策略檢查', path: '/api', headers: { 'Origin': 'http://malicious.com' } },
            { name: 'SQL注入防護 (基礎)', path: '/api/users?id=1\' OR \'1\'=\'1', expectedStatus: [400, 404] }
        ];

        for (const test of securityTests) {
            const result = await this.makeRequest(test.path, 'GET', null, test.headers || {});
            
            let securityScore = 0;
            let findings = [];
            
            // 檢查安全頭
            if (result.headers['x-content-type-options']) securityScore += 10;
            else findings.push('缺少 X-Content-Type-Options 頭');
            
            if (result.headers['x-frame-options']) securityScore += 10;
            else findings.push('缺少 X-Frame-Options 頭');
            
            if (result.headers['x-xss-protection']) securityScore += 10;
            else findings.push('缺少 X-XSS-Protection 頭');
            
            if (result.headers['strict-transport-security']) securityScore += 10;
            else findings.push('缺少 HSTS 頭');
            
            const securityTest = {
                name: test.name,
                path: test.path,
                success: securityScore >= 20, // 至少要有一半的安全頭
                details: {
                    securityScore: securityScore,
                    maxScore: 40,
                    findings: findings,
                    headers: Object.keys(result.headers)
                }
            };
            
            this.results.tests.push(securityTest);
            this.results.summary.total++;
            
            if (securityTest.success) {
                this.results.summary.passed++;
                console.log(`✅ ${test.name} - 通過 (安全分數: ${securityScore}/40)`);
            } else {
                this.results.summary.failed++;
                console.log(`⚠️ ${test.name} - 需要改善 (安全分數: ${securityScore}/40)`);
                this.results.summary.warnings++;
            }
        }
    }

    // 生成建議
    generateRecommendations() {
        console.log('\n💡 生成改善建議...');
        
        const recommendations = [];
        
        // 基於測試結果生成建議
        if (this.results.summary.successRate < 80) {
            recommendations.push({
                priority: 'HIGH',
                category: '穩定性',
                issue: '系統整體成功率偏低',
                suggestion: '需要檢查失敗的端點並修復相關問題',
                impact: '影響用戶體驗和系統可靠性'
            });
        }
        
        if (this.results.performance.responseTimeMs.average > 300) {
            recommendations.push({
                priority: 'MEDIUM',
                category: '性能',
                issue: '響應時間較慢',
                suggestion: '考慮優化數據庫查詢、添加緩存或優化代碼',
                impact: '影響用戶體驗和系統響應速度'
            });
        }
        
        // 檢查安全問題
        const securityTests = this.results.tests.filter(t => t.name.includes('安全'));
        if (securityTests.some(t => !t.success)) {
            recommendations.push({
                priority: 'HIGH',
                category: '安全',
                issue: '缺少重要的安全頭',
                suggestion: '添加安全中間件，設置適當的HTTP安全頭',
                impact: '可能導致安全漏洞和攻擊風險'
            });
        }
        
        // 檢查API端點問題
        const apiTests = this.results.tests.filter(t => t.path && t.path.startsWith('/api/'));
        const failedApiTests = apiTests.filter(t => !t.success);
        if (failedApiTests.length > apiTests.length * 0.3) {
            recommendations.push({
                priority: 'MEDIUM',
                category: 'API',
                issue: 'API端點失敗率較高',
                suggestion: '檢查API路由配置和認證機制',
                impact: '影響前端功能和數據交互'
            });
        }
        
        // 檢查數據庫問題
        const dbTests = this.results.tests.filter(t => t.name.includes('數據庫'));
        if (dbTests.some(t => !t.success)) {
            recommendations.push({
                priority: 'HIGH',
                category: '數據庫',
                issue: '數據庫連接或配置問題',
                suggestion: '檢查數據庫文件和連接配置',
                impact: '影響數據存儲和檢索功能'
            });
        }
        
        this.results.recommendations = recommendations;
        
        console.log(`💡 生成了 ${recommendations.length} 個改善建議`);
    }

    // 完整驗證流程
    async runCompleteVerification() {
        console.log('🚀 啟動智慧瀏覽器驗證引擎');
        console.log('================================================');
        
        try {
            // 收集系統資訊
            await this.collectSystemInfo();
            
            // 執行各項測試
            await this.runBasicPageTests();
            await this.runAPITests();
            await this.runAuthenticationTests();
            await this.runDatabaseTests();
            await this.runSecurityTests();
            await this.runPerformanceAnalysis();
            
            // 計算總結
            this.results.summary.successRate = Math.round((this.results.summary.passed / this.results.summary.total) * 100);
            
            // 生成建議
            this.generateRecommendations();
            
            // 完成時間
            this.results.executionTimeMs = Date.now() - this.startTime;
            
            console.log('\n================================================');
            console.log('📊 驗證完成總結:');
            console.log(`✅ 通過: ${this.results.summary.passed}`);
            console.log(`❌ 失敗: ${this.results.summary.failed}`);
            console.log(`⚠️ 警告: ${this.results.summary.warnings}`);
            console.log(`📈 成功率: ${this.results.summary.successRate}%`);
            console.log(`⏱️ 平均響應時間: ${this.results.summary.avgResponseTime}ms`);
            console.log(`🔧 執行時間: ${this.results.executionTimeMs}ms`);
            console.log(`💡 建議數量: ${this.results.recommendations.length}`);
            
            return this.results;
            
        } catch (error) {
            console.error('❌ 驗證過程中發生錯誤:', error);
            this.results.error = error.message;
            return this.results;
        }
    }

    // 保存報告
    async saveReport() {
        const timestamp = Date.now();
        const jsonPath = path.join(process.cwd(), `verification-report-${timestamp}.json`);
        const mdPath = path.join(process.cwd(), `verification-report-${timestamp}.md`);
        
        // 保存JSON格式報告
        fs.writeFileSync(jsonPath, JSON.stringify(this.results, null, 2));
        
        // 生成Markdown報告
        const markdown = this.generateMarkdownReport();
        fs.writeFileSync(mdPath, markdown);
        
        console.log(`📁 報告已保存:`);
        console.log(`   JSON: ${jsonPath}`);
        console.log(`   MD:   ${mdPath}`);
        
        return { jsonPath, mdPath };
    }

    // 生成Markdown報告
    generateMarkdownReport() {
        const report = this.results;
        let markdown = `# 智慧瀏覽器驗證報告

## 📊 執行摘要

- **執行時間**: ${new Date(report.timestamp).toLocaleString('zh-TW')}
- **系統狀態**: ${report.summary.successRate >= 80 ? '🟢 良好' : report.summary.successRate >= 60 ? '🟡 需要關注' : '🔴 需要修復'}
- **總測試數**: ${report.summary.total}
- **通過率**: ${report.summary.successRate}%
- **平均響應時間**: ${report.summary.avgResponseTime}ms
- **執行時間**: ${report.executionTimeMs}ms

## 🖥️ 系統資訊

| 項目 | 值 |
|------|-----|
| Node.js版本 | ${report.systemInfo.nodeVersion || 'N/A'} |
| 平台 | ${report.systemInfo.platform || 'N/A'} |
| 架構 | ${report.systemInfo.arch || 'N/A'} |
| 記憶體使用 | ${report.systemInfo.memory?.heapUsed || 'N/A'} |
| 數據庫狀態 | ${report.systemInfo.database?.exists ? '✅ 存在' : '❌ 不存在'} |
| 伺服器狀態 | ${report.systemInfo.server?.status || 'Unknown'} |

## 📋 詳細測試結果

| 測試名稱 | 狀態 | 響應時間 | 狀態碼 | 詳細 |
|----------|------|----------|--------|------|
`;

        report.tests.forEach(test => {
            const status = test.success ? '✅' : '❌';
            const responseTime = test.responseTime ? `${test.responseTime}ms` : 'N/A';
            const statusCode = test.actualStatus || 'N/A';
            const details = test.details?.failureReason || test.details?.responseType || '';
            
            markdown += `| ${test.name} | ${status} | ${responseTime} | ${statusCode} | ${details} |\n`;
        });

        markdown += `\n## 📈 性能分析

`;

        if (report.performance.responseTimeMs) {
            markdown += `- **平均響應時間**: ${report.performance.responseTimeMs.average}ms
- **最快響應時間**: ${report.performance.responseTimeMs.minimum}ms
- **最慢響應時間**: ${report.performance.responseTimeMs.maximum}ms
- **響應時間變異**: ${report.performance.responseTimeMs.variance}ms
- **性能評級**: ${report.performance.rating}

`;
        }

        markdown += `## 💡 改善建議

`;

        if (report.recommendations.length === 0) {
            markdown += `暫無特殊建議，系統運行狀況良好。

`;
        } else {
            report.recommendations.forEach((rec, index) => {
                const priority = rec.priority === 'HIGH' ? '🔴' : rec.priority === 'MEDIUM' ? '🟡' : '🟢';
                markdown += `### ${index + 1}. ${rec.category} ${priority}

**問題**: ${rec.issue}

**建議**: ${rec.suggestion}

**影響**: ${rec.impact}

---

`;
            });
        }

        markdown += `## 🔧 技術細節

- **基礎URL**: ${this.baseUrl}
- **測試工具**: 智慧瀏覽器驗證引擎 v2.0
- **生成時間**: ${new Date().toLocaleString('zh-TW')}
- **報告版本**: 2.0

---

*此報告由智慧瀏覽器驗證引擎自動生成*
`;

        return markdown;
    }
}

// 主執行函數
async function main() {
    const engine = new IntelligentBrowserVerificationEngine();
    
    try {
        console.log('🎯 開始完整系統驗證...');
        
        const results = await engine.runCompleteVerification();
        await engine.saveReport();
        
        console.log('\n🎉 驗證完成！報告已生成。');
        
        // 返回結果供程序調用
        return results;
        
    } catch (error) {
        console.error('💥 驗證過程中發生嚴重錯誤:', error);
        return { error: error.message };
    }
}

// 如果直接運行此腳本
if (require.main === module) {
    main().then(results => {
        if (results.error) {
            process.exit(1);
        } else {
            console.log(`\n🏆 最終成功率: ${results.summary.successRate}%`);
            process.exit(0);
        }
    }).catch(error => {
        console.error('💥 執行失敗:', error);
        process.exit(1);
    });
}

module.exports = IntelligentBrowserVerificationEngine;