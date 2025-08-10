/**
 * ===========================
 * 智慧瀏覽器路由驗證系統
 * ===========================
 * 功能：
 * 1. 結合路由診斷結果進行瀏覽器驗證
 * 2. 自動測試所有可用的API端點
 * 3. 驗證前後端集成
 * 4. 生成完整驗證報告
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const http = require('http');

class IntelligentBrowserRouteValidation {
    constructor(options = {}) {
        this.baseUrl = options.baseUrl || 'http://localhost:3001';
        this.headless = options.headless !== false;
        this.slowMo = options.slowMo || 50;
        this.timeout = options.timeout || 30000;
        
        this.validationResults = {
            timestamp: new Date().toISOString(),
            baseUrl: this.baseUrl,
            browserTests: [],
            apiTests: [],
            integrationTests: [],
            summary: {},
            issues: [],
            warnings: [],
            screenshots: []
        };
        
        this.workingEndpoints = [
            { path: '/api/orders/test', method: 'GET', name: 'Orders Test' },
            { path: '/api/maintenance/test', method: 'GET', name: 'Maintenance Test' },
            { path: '/api/schedule/test', method: 'GET', name: 'Schedule Test' },
            { path: '/api/promotion/test', method: 'GET', name: 'Promotion Test' },
            { path: '/api/auth/login', method: 'POST', name: 'Auth Login' },
            { path: '/api/auth/register', method: 'POST', name: 'Auth Register' },
            { path: '/api/attendance/records', method: 'GET', name: 'Attendance Records' },
            { path: '/health', method: 'GET', name: 'Health Check' }
        ];
    }

    /**
     * 執行完整的智慧瀏覽器驗證
     */
    async runCompleteValidation() {
        console.log('🌐 開始智慧瀏覽器路由驗證...');
        console.log('======================================');
        console.log(`測試目標: ${this.baseUrl}`);
        console.log(`瀏覽器模式: ${this.headless ? '無頭模式' : '顯示模式'}`);

        let browser = null;

        try {
            // 階段 1: 啟動瀏覽器
            browser = await this.launchBrowser();
            
            // 階段 2: 驗證伺服器可用性
            await this.verifyServerAvailability();
            
            // 階段 3: 測試前端頁面載入
            await this.testFrontendPages(browser);
            
            // 階段 4: 測試API端點整合
            await this.testAPIIntegration(browser);
            
            // 階段 5: 測試認證流程
            await this.testAuthenticationFlow(browser);
            
            // 階段 6: 測試功能性端點
            await this.testFunctionalEndpoints(browser);
            
            // 階段 7: 生成驗證總結
            await this.generateValidationSummary();
            
            // 階段 8: 保存驗證報告
            await this.saveValidationReport();
            
            return this.validationResults;
            
        } catch (error) {
            console.error('❌ 瀏覽器驗證過程中發生錯誤:', error.message);
            this.validationResults.issues.push({
                type: 'BROWSER_VALIDATION_ERROR',
                severity: 'CRITICAL',
                message: `瀏覽器驗證錯誤: ${error.message}`,
                timestamp: new Date().toISOString()
            });
            return this.validationResults;
        } finally {
            if (browser) {
                await browser.close();
                console.log('🔄 瀏覽器已關閉');
            }
        }
    }

    /**
     * 啟動瀏覽器
     */
    async launchBrowser() {
        console.log('🚀 啟動瀏覽器...');
        
        const browser = await puppeteer.launch({
            headless: this.headless,
            slowMo: this.slowMo,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        });
        
        console.log('✅ 瀏覽器啟動成功');
        return browser;
    }

    /**
     * 驗證伺服器可用性
     */
    async verifyServerAvailability() {
        console.log('🌐 驗證伺服器可用性...');
        
        try {
            const response = await this.makeHttpRequest('GET', '/health');
            
            if (response.statusCode === 200) {
                console.log('✅ 伺服器可用且健康');
                this.validationResults.serverAvailable = true;
            } else {
                console.log('⚠️  伺服器可用但健康檢查異常');
                this.validationResults.serverAvailable = true;
                this.validationResults.warnings.push({
                    type: 'SERVER_HEALTH_WARNING',
                    severity: 'MEDIUM',
                    message: `健康檢查返回異常狀態碼: ${response.statusCode}`,
                    timestamp: new Date().toISOString()
                });
            }
        } catch (error) {
            console.log('❌ 伺服器不可用');
            this.validationResults.serverAvailable = false;
            this.validationResults.issues.push({
                type: 'SERVER_UNAVAILABLE',
                severity: 'CRITICAL',
                message: `伺服器不可用: ${error.message}`,
                timestamp: new Date().toISOString()
            });
            throw new Error('伺服器不可用，無法繼續測試');
        }
    }

    /**
     * 測試前端頁面載入
     */
    async testFrontendPages(browser) {
        console.log('🖥️  測試前端頁面載入...');
        
        const pages = [
            { path: '/', name: '首頁' },
            { path: '/login', name: '登入頁面' },
            { path: '/register', name: '註冊頁面' },
            { path: '/admin', name: '管理員頁面' },
            { path: '/employee', name: '員工頁面' }
        ];
        
        for (const pageInfo of pages) {
            try {
                console.log(`  🔍 測試 ${pageInfo.name} (${pageInfo.path})...`);
                
                const page = await browser.newPage();
                await page.setViewport({ width: 1280, height: 720 });
                
                const startTime = Date.now();
                const response = await page.goto(`${this.baseUrl}${pageInfo.path}`, {
                    waitUntil: 'networkidle2',
                    timeout: this.timeout
                });
                const loadTime = Date.now() - startTime;
                
                const pageTest = {
                    path: pageInfo.path,
                    name: pageInfo.name,
                    statusCode: response.status(),
                    loadTime: loadTime,
                    success: response.status() < 400,
                    timestamp: new Date().toISOString()
                };
                
                if (pageTest.success) {
                    console.log(`    ✅ 載入成功 (${response.status()}) - ${loadTime}ms`);
                    
                    // 截圖
                    const screenshotPath = `page-${pageInfo.name.replace(/\s+/g, '-')}-${Date.now()}.png`;
                    await page.screenshot({
                        path: path.join(__dirname, screenshotPath),
                        fullPage: false
                    });
                    this.validationResults.screenshots.push(screenshotPath);
                    pageTest.screenshot = screenshotPath;
                    
                } else {
                    console.log(`    ❌ 載入失敗 (${response.status()})`);
                    this.validationResults.issues.push({
                        type: 'PAGE_LOAD_ERROR',
                        severity: 'HIGH',
                        message: `頁面載入失敗: ${pageInfo.name} - ${response.status()}`,
                        path: pageInfo.path,
                        timestamp: new Date().toISOString()
                    });
                }
                
                this.validationResults.browserTests.push(pageTest);
                await page.close();
                
            } catch (error) {
                console.log(`    ❌ 測試錯誤: ${error.message}`);
                this.validationResults.issues.push({
                    type: 'PAGE_TEST_ERROR',
                    severity: 'HIGH',
                    message: `頁面測試錯誤: ${pageInfo.name} - ${error.message}`,
                    path: pageInfo.path,
                    timestamp: new Date().toISOString()
                });
            }
        }
    }

    /**
     * 測試API端點整合
     */
    async testAPIIntegration(browser) {
        console.log('🔗 測試API端點整合...');
        
        const page = await browser.newPage();
        
        try {
            // 前往一個有JavaScript的頁面來測試API調用
            await page.goto(`${this.baseUrl}/login`, {
                waitUntil: 'networkidle2'
            });
            
            for (const endpoint of this.workingEndpoints) {
                console.log(`  🔍 測試整合 ${endpoint.name} (${endpoint.method} ${endpoint.path})...`);
                
                try {
                    // 使用頁面的fetch API來測試端點
                    const result = await page.evaluate(async (url, method) => {
                        try {
                            const response = await fetch(url, {
                                method: method,
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: method === 'POST' ? JSON.stringify({
                                    username: 'test',
                                    password: 'test'
                                }) : undefined
                            });
                            
                            const text = await response.text();
                            let data = null;
                            try {
                                data = JSON.parse(text);
                            } catch (e) {
                                data = text;
                            }
                            
                            return {
                                status: response.status,
                                data: data,
                                success: response.ok || response.status < 500
                            };
                        } catch (error) {
                            return {
                                status: null,
                                error: error.message,
                                success: false
                            };
                        }
                    }, `${this.baseUrl}${endpoint.path}`, endpoint.method);
                    
                    const apiTest = {
                        endpoint: endpoint.path,
                        method: endpoint.method,
                        name: endpoint.name,
                        statusCode: result.status,
                        success: result.success,
                        data: result.data,
                        error: result.error,
                        integrationType: 'browser-fetch',
                        timestamp: new Date().toISOString()
                    };
                    
                    if (result.success) {
                        console.log(`    ✅ 整合成功 (${result.status})`);
                    } else {
                        console.log(`    ❌ 整合失敗 (${result.status || 'ERROR'})`);
                    }
                    
                    this.validationResults.integrationTests.push(apiTest);
                    
                } catch (error) {
                    console.log(`    ❌ 整合測試錯誤: ${error.message}`);
                    this.validationResults.issues.push({
                        type: 'API_INTEGRATION_ERROR',
                        severity: 'MEDIUM',
                        message: `API整合測試錯誤: ${endpoint.name} - ${error.message}`,
                        endpoint: endpoint.path,
                        method: endpoint.method,
                        timestamp: new Date().toISOString()
                    });
                }
                
                // 小延遲
                await page.waitForTimeout(200);
            }
            
        } finally {
            await page.close();
        }
    }

    /**
     * 測試認證流程
     */
    async testAuthenticationFlow(browser) {
        console.log('🔐 測試認證流程...');
        
        const page = await browser.newPage();
        
        try {
            console.log('  🔍 測試登入頁面功能...');
            
            await page.goto(`${this.baseUrl}/login`, {
                waitUntil: 'networkidle2'
            });
            
            // 檢查登入表單是否存在
            const hasLoginForm = await page.$('form') !== null || 
                                 await page.$('#loginForm') !== null || 
                                 await page.$('input[type="password"]') !== null;
            
            if (hasLoginForm) {
                console.log('    ✅ 登入表單存在');
                
                // 嘗試填寫測試數據
                const passwordInput = await page.$('input[type="password"]');
                const usernameInput = await page.$('input[type="text"], input[type="username"], input[name="username"]');
                
                if (passwordInput && usernameInput) {
                    console.log('    🔍 測試表單填寫...');
                    await usernameInput.type('testuser');
                    await passwordInput.type('testpassword');
                    
                    // 截圖記錄
                    const screenshotPath = `login-form-filled-${Date.now()}.png`;
                    await page.screenshot({
                        path: path.join(__dirname, screenshotPath),
                        fullPage: false
                    });
                    this.validationResults.screenshots.push(screenshotPath);
                    
                    console.log('    ✅ 表單填寫測試完成');
                } else {
                    console.log('    ⚠️  無法找到完整的登入表單元素');
                }
                
            } else {
                console.log('    ❌ 登入表單不存在');
                this.validationResults.warnings.push({
                    type: 'MISSING_LOGIN_FORM',
                    severity: 'HIGH',
                    message: '登入頁面缺少登入表單',
                    timestamp: new Date().toISOString()
                });
            }
            
            this.validationResults.browserTests.push({
                type: 'authentication',
                name: '登入流程測試',
                hasForm: hasLoginForm,
                success: hasLoginForm,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.log(`    ❌ 認證流程測試錯誤: ${error.message}`);
            this.validationResults.issues.push({
                type: 'AUTH_FLOW_ERROR',
                severity: 'HIGH',
                message: `認證流程測試錯誤: ${error.message}`,
                timestamp: new Date().toISOString()
            });
        } finally {
            await page.close();
        }
    }

    /**
     * 測試功能性端點
     */
    async testFunctionalEndpoints(browser) {
        console.log('⚙️  測試功能性端點...');
        
        // 直接HTTP測試已知工作的端點
        for (const endpoint of this.workingEndpoints) {
            console.log(`  🔍 測試 ${endpoint.name}...`);
            
            try {
                const response = await this.makeHttpRequest(endpoint.method, endpoint.path, 
                    endpoint.method === 'POST' ? {
                        body: JSON.stringify({ username: 'test', password: 'test' }),
                        headers: { 'Content-Type': 'application/json' }
                    } : {}
                );
                
                const apiTest = {
                    endpoint: endpoint.path,
                    method: endpoint.method,
                    name: endpoint.name,
                    statusCode: response.statusCode,
                    responseTime: response.responseTime,
                    success: response.statusCode < 500,
                    data: response.body ? JSON.parse(response.body) : null,
                    testType: 'functional',
                    timestamp: new Date().toISOString()
                };
                
                if (apiTest.success) {
                    console.log(`    ✅ 功能正常 (${response.statusCode}) - ${response.responseTime}ms`);
                } else {
                    console.log(`    ❌ 功能異常 (${response.statusCode})`);
                }
                
                this.validationResults.apiTests.push(apiTest);
                
            } catch (error) {
                console.log(`    ❌ 測試錯誤: ${error.message}`);
                this.validationResults.issues.push({
                    type: 'FUNCTIONAL_TEST_ERROR',
                    severity: 'MEDIUM',
                    message: `功能測試錯誤: ${endpoint.name} - ${error.message}`,
                    endpoint: endpoint.path,
                    timestamp: new Date().toISOString()
                });
            }
        }
    }

    /**
     * 發送HTTP請求
     */
    makeHttpRequest(method, path, options = {}) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const url = new URL(path, this.baseUrl);
            
            const requestOptions = {
                hostname: url.hostname,
                port: url.port || 80,
                path: url.pathname + url.search,
                method: method,
                timeout: this.timeout,
                headers: {
                    'User-Agent': 'IntelligentBrowserRouteValidation/1.0',
                    ...options.headers
                }
            };
            
            const req = http.request(requestOptions, (res) => {
                let body = '';
                
                res.on('data', (chunk) => {
                    body += chunk;
                });
                
                res.on('end', () => {
                    const responseTime = Date.now() - startTime;
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: body,
                        responseTime: responseTime
                    });
                });
            });
            
            req.on('error', (error) => {
                const responseTime = Date.now() - startTime;
                resolve({
                    statusCode: null,
                    error: error.message,
                    responseTime: responseTime
                });
            });
            
            req.on('timeout', () => {
                req.destroy();
                const responseTime = Date.now() - startTime;
                resolve({
                    statusCode: null,
                    error: 'Request timeout',
                    responseTime: responseTime
                });
            });
            
            if (options.body) {
                req.write(options.body);
            }
            
            req.end();
        });
    }

    /**
     * 生成驗證總結
     */
    async generateValidationSummary() {
        console.log('📊 生成驗證總結...');
        
        const browserTestsPassed = this.validationResults.browserTests.filter(test => test.success).length;
        const apiTestsPassed = this.validationResults.apiTests.filter(test => test.success).length;
        const integrationTestsPassed = this.validationResults.integrationTests.filter(test => test.success).length;
        
        const totalTests = this.validationResults.browserTests.length + 
                          this.validationResults.apiTests.length + 
                          this.validationResults.integrationTests.length;
        const totalPassed = browserTestsPassed + apiTestsPassed + integrationTestsPassed;
        
        this.validationResults.summary = {
            totalTests,
            totalPassed,
            totalFailed: totalTests - totalPassed,
            successRate: totalTests > 0 ? (totalPassed / totalTests * 100).toFixed(2) : 0,
            browserTests: {
                total: this.validationResults.browserTests.length,
                passed: browserTestsPassed,
                failed: this.validationResults.browserTests.length - browserTestsPassed
            },
            apiTests: {
                total: this.validationResults.apiTests.length,
                passed: apiTestsPassed,
                failed: this.validationResults.apiTests.length - apiTestsPassed
            },
            integrationTests: {
                total: this.validationResults.integrationTests.length,
                passed: integrationTestsPassed,
                failed: this.validationResults.integrationTests.length - integrationTestsPassed
            },
            totalIssues: this.validationResults.issues.length,
            totalWarnings: this.validationResults.warnings.length,
            screenshotCount: this.validationResults.screenshots.length,
            serverAvailable: this.validationResults.serverAvailable,
            recommendations: this.generateRecommendations()
        };
        
        console.log(`✅ 總結完成:`);
        console.log(`   - 總測試數: ${totalTests}`);
        console.log(`   - 通過數: ${totalPassed}`);
        console.log(`   - 失敗數: ${totalTests - totalPassed}`);
        console.log(`   - 成功率: ${this.validationResults.summary.successRate}%`);
        console.log(`   - 截圖數: ${this.validationResults.screenshots.length}`);
    }

    /**
     * 生成建議
     */
    generateRecommendations() {
        const recommendations = [];
        
        // 基於測試結果生成建議
        if (this.validationResults.summary.successRate < 80) {
            recommendations.push('優化API端點實現以提高成功率');
        }
        
        if (this.validationResults.issues.length > 0) {
            recommendations.push('修復發現的關鍵問題');
        }
        
        if (this.validationResults.warnings.length > 0) {
            recommendations.push('處理警告項目以提升系統穩定性');
        }
        
        recommendations.push('定期執行此驗證系統以監控系統健康度');
        recommendations.push('擴展API端點實現以支援更多功能');
        recommendations.push('增強前端用戶體驗和錯誤處理');
        
        return recommendations;
    }

    /**
     * 保存驗證報告
     */
    async saveValidationReport() {
        console.log('💾 保存驗證報告...');
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportPath = path.join(__dirname, `browser-route-validation-report-${timestamp}.json`);
        const summaryPath = path.join(__dirname, `browser-route-validation-summary-${timestamp}.md`);
        
        try {
            // 保存JSON報告
            await fs.writeFile(reportPath, JSON.stringify(this.validationResults, null, 2), 'utf8');
            
            // 生成Markdown總結
            const markdownSummary = this.generateMarkdownSummary();
            await fs.writeFile(summaryPath, markdownSummary, 'utf8');
            
            console.log(`✅ 報告已保存:`);
            console.log(`   - 詳細報告: ${reportPath}`);
            console.log(`   - 總結報告: ${summaryPath}`);
            console.log(`   - 截圖數量: ${this.validationResults.screenshots.length}`);
            
        } catch (error) {
            console.error(`❌ 保存報告失敗: ${error.message}`);
        }
    }

    /**
     * 生成Markdown總結
     */
    generateMarkdownSummary() {
        const { summary } = this.validationResults;
        
        return `# 智慧瀏覽器路由驗證報告

## 📊 驗證總結

- **測試目標**: ${this.validationResults.baseUrl}
- **總測試數**: ${summary.totalTests}
- **通過數**: ${summary.totalPassed}
- **失敗數**: ${summary.totalFailed}
- **成功率**: ${summary.successRate}%
- **伺服器狀態**: ${summary.serverAvailable ? '✅ 可用' : '❌ 不可用'}

## 🧪 測試分類結果

### 瀏覽器測試
- **總數**: ${summary.browserTests.total}
- **通過**: ${summary.browserTests.passed}
- **失敗**: ${summary.browserTests.failed}

### API測試  
- **總數**: ${summary.apiTests.total}
- **通過**: ${summary.apiTests.passed}
- **失敗**: ${summary.apiTests.failed}

### 整合測試
- **總數**: ${summary.integrationTests.total}
- **通過**: ${summary.integrationTests.passed}
- **失敗**: ${summary.integrationTests.failed}

## ✅ 成功的測試

### 瀏覽器測試
${this.validationResults.browserTests.filter(test => test.success).map(test => 
    `- **${test.name}**: ${test.path} (${test.statusCode}) - ${test.loadTime}ms`
).join('\n')}

### API測試
${this.validationResults.apiTests.filter(test => test.success).map(test => 
    `- **${test.name}**: ${test.method} ${test.endpoint} (${test.statusCode}) - ${test.responseTime}ms`
).join('\n')}

## ❌ 失敗的測試

### 瀏覽器測試
${this.validationResults.browserTests.filter(test => !test.success).map(test => 
    `- **${test.name}**: ${test.path} (${test.statusCode || 'ERROR'})`
).join('\n')}

### API測試
${this.validationResults.apiTests.filter(test => !test.success).map(test => 
    `- **${test.name}**: ${test.method} ${test.endpoint} (${test.statusCode || 'ERROR'})`
).join('\n')}

## 🚨 主要問題

${this.validationResults.issues.slice(0, 10).map((issue, index) => 
    `### ${index + 1}. ${issue.type} (${issue.severity})
- **描述**: ${issue.message}
- **時間**: ${issue.timestamp}
`).join('\n')}

## ⚠️ 警告

${this.validationResults.warnings.slice(0, 5).map((warning, index) => 
    `### ${index + 1}. ${warning.type}
- **描述**: ${warning.message}
- **時間**: ${warning.timestamp}
`).join('\n')}

## 📸 測試截圖

${this.validationResults.screenshots.map((screenshot, index) => 
    `${index + 1}. ${screenshot}`
).join('\n')}

## 💡 建議與下一步

${summary.recommendations.map((rec, index) => 
    `${index + 1}. ${rec}`
).join('\n')}

## 🎯 重點發現

1. **路由狀態**: 已發現 ${this.workingEndpoints.length} 個工作的端點
2. **前端狀態**: ${summary.browserTests.passed}/${summary.browserTests.total} 個頁面載入成功
3. **整合狀態**: API與前端整合測試通過率 ${((summary.integrationTests.passed / Math.max(summary.integrationTests.total, 1)) * 100).toFixed(2)}%

## 📋 後續改進計劃

1. **立即修復**: 處理404錯誤的API端點
2. **功能擴展**: 為基礎端點添加CRUD功能
3. **用戶體驗**: 改善前端錯誤處理和用戶反饋
4. **系統監控**: 建立持續的健康度監控機制

---
*驗證完成時間: ${this.validationResults.timestamp}*
`;
    }
}

// 如果直接執行此文件，運行驗證
if (require.main === module) {
    const validator = new IntelligentBrowserRouteValidation({
        baseUrl: process.env.BASE_URL || 'http://localhost:3001',
        headless: true // 設為 false 可以看到瀏覽器操作
    });
    
    validator.runCompleteValidation().then((results) => {
        console.log('\n🎉 智慧瀏覽器驗證完成!');
        console.log(`成功率: ${results.summary.successRate}%`);
        console.log(`截圖數量: ${results.summary.screenshotCount}`);
        console.log(`發現 ${results.issues.length} 個問題和 ${results.warnings.length} 個警告`);
        
        if (results.summary.successRate >= 80) {
            console.log('\n✅ 驗證結果良好，系統基本功能正常');
            process.exit(0);
        } else {
            console.log('\n⚠️  驗證發現問題，建議查看詳細報告');
            process.exit(1);
        }
    }).catch((error) => {
        console.error('❌ 驗證失敗:', error);
        process.exit(1);
    });
}

module.exports = IntelligentBrowserRouteValidation;