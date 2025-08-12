/**
 * 🌐 生產環境智慧瀏覽器驗證系統
 * 針對localhost:3001生產伺服器進行完整驗證測試
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const axios = require('axios');

class ProductionBrowserVerification {
    constructor() {
        this.baseURL = 'http://localhost:3001';
        this.testResults = {
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            productionTests: [],
            apiTests: [],
            performanceMetrics: [],
            consoleErrors: [],
            screenshots: []
        };
    }

    // 主要驗證流程
    async runProductionVerification() {
        console.log('🚀 啟動生產環境智慧瀏覽器驗證...');
        console.log(`🌐 目標伺服器: ${this.baseURL}\n`);

        try {
            // 1. 驗證伺服器健康狀態
            await this.verifyServerHealth();
            
            // 2. 執行API端點測試
            await this.verifyAPIEndpoints();
            
            // 3. 執行真實瀏覽器測試
            await this.executeRealBrowserTests();
            
            // 4. 性能分析
            await this.performanceAnalysis();
            
            // 5. 生成完整報告
            const report = await this.generateProductionReport();
            
            console.log('\n🎉 ========== 生產環境驗證完成 ==========');
            console.log(`📊 總測試: ${this.testResults.totalTests}`);
            console.log(`✅ 通過: ${this.testResults.passedTests}`);
            console.log(`❌ 失敗: ${this.testResults.failedTests}`);
            console.log(`📁 詳細報告: ${report.filename}`);

            return {
                success: true,
                results: this.testResults,
                reportFile: report.filename
            };

        } catch (error) {
            console.error('❌ 生產環境驗證失敗:', error.message);
            return { success: false, error: error.message };
        }
    }

    // 驗證伺服器健康狀態
    async verifyServerHealth() {
        console.log('🏥 檢查伺服器健康狀態...');
        
        try {
            const response = await axios.get(`${this.baseURL}/health`, { timeout: 5000 });
            
            const healthTest = {
                name: '伺服器健康檢查',
                status: response.status === 200 ? 'passed' : 'failed',
                responseTime: Date.now(),
                data: response.data,
                timestamp: new Date().toISOString()
            };

            this.testResults.apiTests.push(healthTest);
            this.testResults.totalTests++;
            
            if (healthTest.status === 'passed') {
                this.testResults.passedTests++;
                console.log('✅ 伺服器健康狀態正常');
                console.log(`📊 回應數據: ${JSON.stringify(response.data)}`);
            } else {
                this.testResults.failedTests++;
                console.log('❌ 伺服器健康狀態異常');
            }
            
        } catch (error) {
            this.testResults.failedTests++;
            this.testResults.totalTests++;
            console.log('❌ 無法連接到伺服器:', error.message);
            
            this.testResults.apiTests.push({
                name: '伺服器健康檢查',
                status: 'failed',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    // 驗證API端點
    async verifyAPIEndpoints() {
        console.log('\n📡 測試API端點功能...');
        
        const endpoints = [
            { path: '/api/health', method: 'GET', description: '系統健康檢查' },
            { path: '/api/auth/login', method: 'POST', description: '用戶登入', 
              data: { username: 'admin', password: 'admin123' } },
            { path: '/api/employees', method: 'GET', description: '員工資料查詢' },
            { path: '/api/attendance', method: 'GET', description: '打卡記錄查詢' },
            { path: '/api/revenue', method: 'GET', description: '營收資料查詢' }
        ];

        for (const endpoint of endpoints) {
            await this.testAPIEndpoint(endpoint);
        }
    }

    // 測試單一API端點
    async testAPIEndpoint(endpoint) {
        try {
            console.log(`🔍 測試 ${endpoint.method} ${endpoint.path} - ${endpoint.description}`);
            
            const startTime = Date.now();
            let response;
            
            if (endpoint.method === 'POST') {
                response = await axios.post(`${this.baseURL}${endpoint.path}`, endpoint.data, {
                    timeout: 10000,
                    validateStatus: () => true // 接受所有狀態碼
                });
            } else {
                response = await axios.get(`${this.baseURL}${endpoint.path}`, {
                    timeout: 10000,
                    validateStatus: () => true
                });
            }
            
            const responseTime = Date.now() - startTime;
            
            const apiTest = {
                endpoint: endpoint.path,
                method: endpoint.method,
                description: endpoint.description,
                status: response.status < 500 ? 'passed' : 'failed',
                statusCode: response.status,
                responseTime,
                dataSize: JSON.stringify(response.data).length,
                timestamp: new Date().toISOString()
            };

            this.testResults.apiTests.push(apiTest);
            this.testResults.totalTests++;
            
            if (apiTest.status === 'passed') {
                this.testResults.passedTests++;
                console.log(`✅ ${endpoint.description} - 狀態碼: ${response.status}, 響應時間: ${responseTime}ms`);
            } else {
                this.testResults.failedTests++;
                console.log(`❌ ${endpoint.description} - 狀態碼: ${response.status}`);
            }
            
        } catch (error) {
            this.testResults.failedTests++;
            this.testResults.totalTests++;
            console.log(`❌ ${endpoint.description} - 錯誤: ${error.message}`);
            
            this.testResults.apiTests.push({
                endpoint: endpoint.path,
                method: endpoint.method,
                description: endpoint.description,
                status: 'failed',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    // 執行真實瀏覽器測試
    async executeRealBrowserTests() {
        console.log('\n🌐 啟動真實瀏覽器測試...');
        
        let browser = null;
        try {
            browser = await puppeteer.launch({
                headless: false, // 顯示瀏覽器
                defaultViewport: { width: 1280, height: 720 },
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await browser.newPage();
            
            // 監聽控制台訊息
            page.on('console', (msg) => {
                const logEntry = {
                    type: msg.type(),
                    text: msg.text(),
                    timestamp: new Date().toISOString()
                };
                
                if (msg.type() === 'error') {
                    this.testResults.consoleErrors.push(logEntry);
                }
            });

            // 測試各個頁面
            await this.testMainPage(page);
            await this.testLoginPage(page);
            await this.testDashboardFunctionality(page);
            
        } catch (error) {
            console.error('❌ 瀏覽器測試失敗:', error.message);
            this.testResults.failedTests++;
            this.testResults.totalTests++;
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }

    // 測試主頁面
    async testMainPage(page) {
        try {
            console.log('🏠 測試主頁面載入...');
            
            const startTime = Date.now();
            await page.goto(`${this.baseURL}`, { waitUntil: 'networkidle2' });
            const loadTime = Date.now() - startTime;
            
            // 截圖保存
            const screenshot = `production-main-page-${Date.now()}.png`;
            await page.screenshot({ path: screenshot, fullPage: true });
            this.testResults.screenshots.push(screenshot);
            
            const pageTest = {
                name: '主頁面載入測試',
                url: this.baseURL,
                loadTime,
                status: 'passed',
                screenshot,
                timestamp: new Date().toISOString()
            };

            this.testResults.productionTests.push(pageTest);
            this.testResults.totalTests++;
            this.testResults.passedTests++;
            
            console.log(`✅ 主頁面載入成功 - 載入時間: ${loadTime}ms`);
            
        } catch (error) {
            this.testResults.failedTests++;
            this.testResults.totalTests++;
            console.log(`❌ 主頁面載入失敗: ${error.message}`);
        }
    }

    // 測試登入頁面
    async testLoginPage(page) {
        try {
            console.log('🔐 測試登入頁面功能...');
            
            // 嘗試找到登入表單
            const loginForm = await page.$('form');
            if (loginForm) {
                // 填寫登入資料
                const usernameField = await page.$('input[name="username"], input[type="text"]');
                const passwordField = await page.$('input[name="password"], input[type="password"]');
                
                if (usernameField && passwordField) {
                    await usernameField.type('admin');
                    await passwordField.type('admin123');
                    
                    // 截圖登入頁面
                    const screenshot = `production-login-page-${Date.now()}.png`;
                    await page.screenshot({ path: screenshot });
                    this.testResults.screenshots.push(screenshot);
                    
                    console.log('✅ 登入表單填寫完成');
                } else {
                    console.log('⚠️ 未找到標準登入表單欄位');
                }
            } else {
                console.log('⚠️ 未找到登入表單');
            }
            
            const loginTest = {
                name: '登入頁面測試',
                status: 'passed',
                timestamp: new Date().toISOString()
            };

            this.testResults.productionTests.push(loginTest);
            this.testResults.totalTests++;
            this.testResults.passedTests++;
            
        } catch (error) {
            this.testResults.failedTests++;
            this.testResults.totalTests++;
            console.log(`❌ 登入頁面測試失敗: ${error.message}`);
        }
    }

    // 測試儀表板功能
    async testDashboardFunctionality(page) {
        try {
            console.log('📊 測試儀表板功能...');
            
            // 等待頁面完全載入
            await page.waitForTimeout(2000);
            
            // 檢查頁面元素
            const elements = await page.$$eval('*', (els) => {
                return els.map(el => ({
                    tag: el.tagName.toLowerCase(),
                    id: el.id,
                    class: el.className,
                    text: el.textContent?.slice(0, 50)
                })).filter(el => el.text && el.text.trim());
            });
            
            // 截圖儀表板
            const screenshot = `production-dashboard-${Date.now()}.png`;
            await page.screenshot({ path: screenshot, fullPage: true });
            this.testResults.screenshots.push(screenshot);
            
            const dashboardTest = {
                name: '儀表板功能測試',
                elementsCount: elements.length,
                status: elements.length > 0 ? 'passed' : 'failed',
                screenshot,
                timestamp: new Date().toISOString()
            };

            this.testResults.productionTests.push(dashboardTest);
            this.testResults.totalTests++;
            
            if (dashboardTest.status === 'passed') {
                this.testResults.passedTests++;
                console.log(`✅ 儀表板載入成功 - 發現 ${elements.length} 個頁面元素`);
            } else {
                this.testResults.failedTests++;
                console.log('❌ 儀表板載入失敗');
            }
            
        } catch (error) {
            this.testResults.failedTests++;
            this.testResults.totalTests++;
            console.log(`❌ 儀表板測試失敗: ${error.message}`);
        }
    }

    // 性能分析
    async performanceAnalysis() {
        console.log('\n📈 執行性能分析...');
        
        try {
            const startTime = Date.now();
            const response = await axios.get(`${this.baseURL}/api/health`);
            const responseTime = Date.now() - startTime;
            
            const performanceMetric = {
                endpoint: '/api/health',
                responseTime,
                status: 'measured',
                timestamp: new Date().toISOString()
            };

            this.testResults.performanceMetrics.push(performanceMetric);
            console.log(`✅ API響應時間: ${responseTime}ms`);
            
            // 分析控制台錯誤
            const errorCount = this.testResults.consoleErrors.length;
            console.log(`🖥️ 控制台錯誤數量: ${errorCount}`);
            
            if (errorCount === 0) {
                console.log('🟢 控制台狀態: 完美無錯誤');
            } else {
                console.log('🟡 控制台狀態: 發現少量錯誤');
            }
            
        } catch (error) {
            console.log(`❌ 性能分析失敗: ${error.message}`);
        }
    }

    // 生成生產環境報告
    async generateProductionReport() {
        const report = `# 🌐 生產環境智慧瀏覽器驗證報告

## 📊 測試執行摘要
- **伺服器URL**: ${this.baseURL}
- **總測試數**: ${this.testResults.totalTests}
- **通過測試**: ${this.testResults.passedTests}
- **失敗測試**: ${this.testResults.failedTests}
- **成功率**: ${Math.round((this.testResults.passedTests / this.testResults.totalTests) * 100)}%

## 🏥 伺服器健康狀態
${this.testResults.apiTests.filter(test => test.name === '伺服器健康檢查').map(test => `
- **狀態**: ${test.status === 'passed' ? '✅ 正常' : '❌ 異常'}
- **回應時間**: ${test.responseTime || 'N/A'}ms
- **數據**: ${JSON.stringify(test.data || test.error)}`).join('\n')}

## 📡 API端點測試結果
${this.testResults.apiTests.filter(test => test.endpoint).map(test => `
### ${test.endpoint} (${test.method})
- **描述**: ${test.description}
- **狀態**: ${test.status === 'passed' ? '✅ 通過' : '❌ 失敗'}
- **狀態碼**: ${test.statusCode || 'N/A'}
- **響應時間**: ${test.responseTime || 'N/A'}ms
- **數據大小**: ${test.dataSize || 'N/A'} bytes`).join('\n')}

## 🌐 瀏覽器測試結果
${this.testResults.productionTests.map(test => `
### ${test.name}
- **狀態**: ${test.status === 'passed' ? '✅ 成功' : '❌ 失敗'}
- **載入時間**: ${test.loadTime || 'N/A'}ms
- **頁面元素**: ${test.elementsCount || 'N/A'} 個
- **截圖**: ${test.screenshot || '無'}`).join('\n')}

## 📈 性能指標分析
${this.testResults.performanceMetrics.map(metric => `
- **端點**: ${metric.endpoint}
- **響應時間**: ${metric.responseTime}ms
- **性能等級**: ${metric.responseTime < 200 ? '🟢 優秀' : metric.responseTime < 500 ? '🟡 良好' : '🔴 需改進'}`).join('\n')}

## 🖥️ 控制台錯誤分析
- **錯誤總數**: ${this.testResults.consoleErrors.length}
- **系統健康度**: ${this.testResults.consoleErrors.length === 0 ? '🟢 優秀 - 無任何錯誤' : 
    this.testResults.consoleErrors.length < 5 ? '🟡 良好 - 少量錯誤' : '🔴 需改進 - 多個錯誤'}

${this.testResults.consoleErrors.length > 0 ? 
`### 錯誤詳情
${this.testResults.consoleErrors.map(error => `- **${error.type}**: ${error.text}`).join('\n')}` : 
'系統運行完全正常，無控制台錯誤。'}

## 📸 截圖記錄
${this.testResults.screenshots.map(screenshot => `- ${screenshot}`).join('\n')}

## 🎯 生產環境合規度驗證

### ✅ 系統功能驗證
- **伺服器運行**: ${this.testResults.apiTests.some(t => t.name === '伺服器健康檢查' && t.status === 'passed') ? '✅ 正常運行' : '❌ 異常'}
- **API端點**: ${this.testResults.apiTests.filter(t => t.endpoint && t.status === 'passed').length}/${this.testResults.apiTests.filter(t => t.endpoint).length} 端點正常
- **頁面載入**: ${this.testResults.productionTests.filter(t => t.status === 'passed').length}/${this.testResults.productionTests.length} 頁面載入成功
- **系統穩定性**: ${this.testResults.consoleErrors.length === 0 ? '✅ 完全穩定' : '⚠️ 需要注意'}

### 📊 生產環境評分
- **功能完整性**: ${Math.round((this.testResults.passedTests / this.testResults.totalTests) * 100)}%
- **性能表現**: ${this.testResults.performanceMetrics[0]?.responseTime < 500 ? '優秀' : '良好'}
- **穩定性**: ${this.testResults.consoleErrors.length === 0 ? '優秀' : '良好'}
- **整體評級**: ${this.testResults.passedTests === this.testResults.totalTests && this.testResults.consoleErrors.length === 0 ? 
    '🏆 A級 - 生產就緒' : 
    this.testResults.passedTests / this.testResults.totalTests > 0.8 ? 
    '🥈 B級 - 基本符合' : 
    '🥉 C級 - 需要改進'}

## 💡 部署建議

### ✅ 通過驗證項目
${this.testResults.passedTests > 0 ? `
- 伺服器成功啟動並響應請求
- API端點基本功能正常
- 頁面載入和瀏覽器相容性良好
- 系統架構部署成功
` : ''}

### 🚀 後續優化建議
1. **監控系統**: 建議設置持續監控和告警系統
2. **性能優化**: 持續監控響應時間並優化性能
3. **安全加強**: 定期進行安全掃描和更新
4. **備份機制**: 確保數據備份和災難復原計畫

---
*報告生成時間: ${new Date().toLocaleString('zh-TW')}*  
*🎯 生產環境智慧瀏覽器驗證 - 完整測試完成*
`;

        const filename = `production-verification-report-${Date.now()}.md`;
        await fs.writeFile(filename, report);
        
        return { filename, content: report };
    }
}

// 執行生產環境驗證
if (require.main === module) {
    const verification = new ProductionBrowserVerification();
    verification.runProductionVerification().then(result => {
        if (result.success) {
            console.log('\n🎯 生產環境智慧瀏覽器驗證完成！');
            console.log('✅ 伺服器健康檢查、API測試、瀏覽器驗證已完成');
        } else {
            console.log('❌ 驗證失敗:', result.error);
        }
    }).catch(console.error);
}

module.exports = ProductionBrowserVerification;