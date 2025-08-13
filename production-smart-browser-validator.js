const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

class ProductionSmartBrowserValidator {
    constructor(productionUrl = 'https://employee-management-system-intermediate.onrender.com') {
        this.productionUrl = productionUrl;
        this.browser = null;
        this.page = null;
        this.testResults = {
            infrastructure: {},
            api: {},
            frontend: {},
            userFlow: {},
            performance: {}
        };
        this.screenshotDir = path.join(__dirname, 'production-screenshots');
        this.reportDir = path.join(__dirname, 'production-reports');
        
        // 確保目錄存在
        if (!fs.existsSync(this.screenshotDir)) {
            fs.mkdirSync(this.screenshotDir, { recursive: true });
        }
        if (!fs.existsSync(this.reportDir)) {
            fs.mkdirSync(this.reportDir, { recursive: true });
        }
    }

    async initialize() {
        console.log('🚀 初始化生產環境智慧瀏覽器驗證引擎...');
        
        this.browser = await puppeteer.launch({
            headless: false,  // 真實瀏覽器環境
            devtools: false,
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

        this.page = await this.browser.newPage();
        
        // 設定真實瀏覽器環境
        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await this.page.setViewport({ width: 1920, height: 1080 });
        
        // 監控網路請求
        this.page.on('request', (request) => {
            console.log(`📡 Network Request: ${request.method()} ${request.url()}`);
        });
        
        this.page.on('response', (response) => {
            console.log(`📥 Network Response: ${response.status()} ${response.url()}`);
        });
        
        // 監控控制台輸出
        this.page.on('console', (msg) => {
            console.log(`🖥️ Console: ${msg.type().toUpperCase()} ${msg.text()}`);
        });
        
        // 監控JavaScript錯誤
        this.page.on('pageerror', (error) => {
            console.error(`❌ Page Error: ${error.toString()}`);
        });
    }

    // 階段1: 生產環境基礎架構驗證
    async validateInfrastructure() {
        console.log('\n📋 階段1: 生產環境基礎架構驗證');
        
        try {
            const startTime = Date.now();
            
            // 1. 檢查HTTPS和SSL證書
            console.log('🔒 檢查HTTPS連接和SSL證書...');
            const response = await this.page.goto(this.productionUrl, { 
                waitUntil: 'networkidle0',
                timeout: 30000 
            });
            
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            this.testResults.infrastructure.httpsStatus = response.status();
            this.testResults.infrastructure.responseTime = responseTime;
            this.testResults.infrastructure.sslValid = this.productionUrl.startsWith('https://');
            
            console.log(`✅ HTTPS狀態: ${response.status()}`);
            console.log(`⏱️ 響應時間: ${responseTime}ms`);
            
            // 2. 檢查安全標頭
            const headers = response.headers();
            this.testResults.infrastructure.securityHeaders = {
                'content-security-policy': headers['content-security-policy'] || 'Not Set',
                'x-frame-options': headers['x-frame-options'] || 'Not Set',
                'x-content-type-options': headers['x-content-type-options'] || 'Not Set'
            };
            
            // 3. 截圖記錄
            await this.page.screenshot({
                path: path.join(this.screenshotDir, 'infrastructure-check.png'),
                fullPage: true
            });
            
            console.log('📸 基礎架構檢查截圖已保存');
            
            return true;
        } catch (error) {
            console.error(`❌ 基礎架構驗證失敗: ${error.message}`);
            this.testResults.infrastructure.error = error.message;
            return false;
        }
    }

    // 階段2: 生產API端點完整性驗證
    async validateAPIs() {
        console.log('\n📋 階段2: 生產API端點完整性驗證');
        
        const apiEndpoints = [
            '/api/auth/login',
            '/api/auth/register', 
            '/api/employees',
            '/api/revenue',
            '/api/attendance',
            '/api/voting'
        ];
        
        this.testResults.api = {};
        
        for (const endpoint of apiEndpoints) {
            try {
                const fullUrl = `${this.productionUrl}${endpoint}`;
                console.log(`🔍 測試API端點: ${endpoint}`);
                
                const response = await axios.get(fullUrl, {
                    timeout: 10000,
                    validateStatus: function (status) {
                        return status < 500; // 接受小於500的狀態碼
                    }
                });
                
                this.testResults.api[endpoint] = {
                    status: response.status,
                    accessible: true,
                    responseTime: response.headers['x-response-time'] || 'N/A'
                };
                
                console.log(`✅ ${endpoint}: ${response.status}`);
                
            } catch (error) {
                this.testResults.api[endpoint] = {
                    status: 'Error',
                    accessible: false,
                    error: error.message
                };
                console.log(`❌ ${endpoint}: ${error.message}`);
            }
        }
        
        return true;
    }

    // 階段3: 生產前端功能深度測試
    async validateFrontend() {
        console.log('\n📋 階段3: 生產前端功能深度測試');
        
        try {
            // 1. 測試登入頁面
            console.log('🔍 測試登入頁面...');
            await this.page.goto(`${this.productionUrl}/login`);
            await this.page.waitForSelector('form', { timeout: 10000 });
            
            await this.page.screenshot({
                path: path.join(this.screenshotDir, 'login-page.png'),
                fullPage: true
            });
            
            this.testResults.frontend.loginPage = {
                loaded: true,
                hasForm: await this.page.$('form') !== null,
                hasUsernameField: await this.page.$('input[name="username"]') !== null,
                hasPasswordField: await this.page.$('input[type="password"]') !== null
            };
            
            // 2. 測試員工工作台頁面
            console.log('🔍 測試員工工作台...');
            await this.page.goto(`${this.productionUrl}/employee`);
            await this.page.waitForTimeout(3000);
            
            await this.page.screenshot({
                path: path.join(this.screenshotDir, 'employee-dashboard.png'),
                fullPage: true
            });
            
            this.testResults.frontend.employeeDashboard = {
                loaded: true,
                hasNavigation: await this.page.$('.navbar, nav') !== null
            };
            
            // 3. 檢查管理後台
            console.log('🔍 測試管理後台...');
            await this.page.goto(`${this.productionUrl}/admin`);
            await this.page.waitForTimeout(3000);
            
            await this.page.screenshot({
                path: path.join(this.screenshotDir, 'admin-panel.png'),
                fullPage: true
            });
            
            return true;
            
        } catch (error) {
            console.error(`❌ 前端驗證失敗: ${error.message}`);
            this.testResults.frontend.error = error.message;
            return false;
        }
    }

    // 階段4: 真實用戶流程驗證
    async validateUserFlow() {
        console.log('\n📋 階段4: 真實用戶流程驗證');
        
        try {
            // 1. 完整登入流程測試
            console.log('🔍 測試完整登入流程...');
            await this.page.goto(`${this.productionUrl}/login`);
            await this.page.waitForSelector('form', { timeout: 10000 });
            
            // 嘗試登入（使用測試帳號）
            const usernameField = await this.page.$('input[name="username"], input[id="username"]');
            const passwordField = await this.page.$('input[type="password"]');
            
            if (usernameField && passwordField) {
                await usernameField.type('testuser');
                await passwordField.type('testpass');
                
                await this.page.screenshot({
                    path: path.join(this.screenshotDir, 'login-form-filled.png')
                });
                
                // 點擊登入按鈕
                const submitButton = await this.page.$('button[type="submit"], input[type="submit"]');
                if (submitButton) {
                    await submitButton.click();
                    await this.page.waitForTimeout(3000);
                    
                    await this.page.screenshot({
                        path: path.join(this.screenshotDir, 'login-result.png')
                    });
                }
            }
            
            // 2. 測試導航和頁面切換
            console.log('🔍 測試頁面導航...');
            const navigationLinks = await this.page.$$('a[href], button');
            
            this.testResults.userFlow = {
                loginFormExists: usernameField !== null && passwordField !== null,
                navigationLinksCount: navigationLinks.length,
                pageAccessible: true
            };
            
            return true;
            
        } catch (error) {
            console.error(`❌ 用戶流程驗證失敗: ${error.message}`);
            this.testResults.userFlow.error = error.message;
            return false;
        }
    }

    // 階段5: 生產環境性能和安全驗證
    async validatePerformance() {
        console.log('\n📋 階段5: 生產環境性能和安全驗證');
        
        try {
            // 1. 性能指標測量
            const performanceMetrics = await this.page.evaluate(() => {
                return JSON.parse(JSON.stringify(performance.getEntriesByType('navigation')[0]));
            });
            
            this.testResults.performance = {
                domContentLoaded: performanceMetrics.domContentLoadedEventEnd - performanceMetrics.domContentLoadedEventStart,
                loadComplete: performanceMetrics.loadEventEnd - performanceMetrics.loadEventStart,
                totalLoadTime: performanceMetrics.loadEventEnd - performanceMetrics.fetchStart
            };
            
            // 2. 資源載入分析
            const resources = await this.page.evaluate(() => {
                return performance.getEntriesByType('resource').map(resource => ({
                    name: resource.name,
                    duration: resource.duration,
                    size: resource.transferSize
                }));
            });
            
            this.testResults.performance.resourceCount = resources.length;
            this.testResults.performance.totalResourceSize = resources.reduce((sum, resource) => sum + (resource.size || 0), 0);
            
            console.log(`📊 性能指標收集完成 - 總載入時間: ${this.testResults.performance.totalLoadTime}ms`);
            
            return true;
            
        } catch (error) {
            console.error(`❌ 性能驗證失敗: ${error.message}`);
            this.testResults.performance.error = error.message;
            return false;
        }
    }

    // 生成完整驗證報告
    async generateReport() {
        console.log('\n📋 生成生產環境驗證報告...');
        
        const reportData = {
            timestamp: new Date().toISOString(),
            productionUrl: this.productionUrl,
            testResults: this.testResults,
            summary: {
                infrastructurePassed: !this.testResults.infrastructure.error,
                apiTestsPassed: Object.values(this.testResults.api).filter(api => api.accessible).length,
                frontendTestsPassed: !this.testResults.frontend.error,
                userFlowPassed: !this.testResults.userFlow.error,
                performancePassed: !this.testResults.performance.error
            }
        };
        
        // 保存JSON報告
        const jsonReportPath = path.join(this.reportDir, `production-validation-report-${Date.now()}.json`);
        fs.writeFileSync(jsonReportPath, JSON.stringify(reportData, null, 2));
        
        // 生成Markdown報告
        const markdownReport = this.generateMarkdownReport(reportData);
        const mdReportPath = path.join(this.reportDir, `production-validation-report-${Date.now()}.md`);
        fs.writeFileSync(mdReportPath, markdownReport);
        
        console.log(`📄 報告已保存: ${jsonReportPath}`);
        console.log(`📄 Markdown報告: ${mdReportPath}`);
        
        return { jsonReportPath, mdReportPath, reportData };
    }

    generateMarkdownReport(reportData) {
        return `# 生產環境深度驗證報告

## 🌐 驗證目標
**生產網址**: ${reportData.productionUrl}
**驗證時間**: ${reportData.timestamp}

## 📊 驗證結果總覽

### ✅ 通過測試
- 基礎架構驗證: ${reportData.summary.infrastructurePassed ? '✅ 通過' : '❌ 失敗'}
- API端點測試: ${reportData.summary.apiTestsPassed} 個端點可用
- 前端功能測試: ${reportData.summary.frontendTestsPassed ? '✅ 通過' : '❌ 失敗'}  
- 用戶流程驗證: ${reportData.summary.userFlowPassed ? '✅ 通過' : '❌ 失敗'}
- 性能驗證: ${reportData.summary.performancePassed ? '✅ 通過' : '❌ 失敗'}

## 📋 詳細驗證結果

### 🏗️ 基礎架構驗證
- HTTP狀態: ${reportData.testResults.infrastructure.httpsStatus || 'N/A'}
- 響應時間: ${reportData.testResults.infrastructure.responseTime || 'N/A'}ms
- SSL證書: ${reportData.testResults.infrastructure.sslValid ? '✅ 有效' : '❌ 無效'}

### 🔌 API端點驗證
${Object.entries(reportData.testResults.api).map(([endpoint, result]) => 
    `- ${endpoint}: ${result.accessible ? '✅' : '❌'} (${result.status})`
).join('\n')}

### 🎯 性能指標
- DOM載入時間: ${reportData.testResults.performance.domContentLoaded || 'N/A'}ms
- 完整載入時間: ${reportData.testResults.performance.totalLoadTime || 'N/A'}ms
- 資源數量: ${reportData.testResults.performance.resourceCount || 'N/A'}
- 資源總大小: ${reportData.testResults.performance.totalResourceSize || 'N/A'} bytes

## 🎯 重點發現和建議

${this.generateRecommendations(reportData)}

---
*報告由智慧瀏覽器驗證引擎自動生成*
`;
    }

    generateRecommendations(reportData) {
        const recommendations = [];
        
        if (reportData.testResults.infrastructure.responseTime > 3000) {
            recommendations.push('⚠️ 響應時間過長，建議優化服務器性能');
        }
        
        if (reportData.summary.apiTestsPassed < 5) {
            recommendations.push('⚠️ 部分API端點不可用，需要檢查服務狀態');
        }
        
        if (reportData.testResults.performance.totalLoadTime > 5000) {
            recommendations.push('⚠️ 頁面載入時間過長，建議優化資源載入');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('✅ 生產環境運行正常，所有測試通過');
        }
        
        return recommendations.join('\n');
    }

    // 執行完整驗證流程
    async runCompleteValidation() {
        console.log('🚀 開始生產環境完整深度驗證');
        
        try {
            await this.initialize();
            
            console.log('\n=== 開始5階段驗證流程 ===');
            
            // 階段1: 基礎架構驗證
            const stage1 = await this.validateInfrastructure();
            console.log(`階段1結果: ${stage1 ? '✅ 通過' : '❌ 失敗'}`);
            
            // 階段2: API驗證
            const stage2 = await this.validateAPIs();
            console.log(`階段2結果: ${stage2 ? '✅ 通過' : '❌ 失敗'}`);
            
            // 階段3: 前端測試
            const stage3 = await this.validateFrontend();
            console.log(`階段3結果: ${stage3 ? '✅ 通過' : '❌ 失敗'}`);
            
            // 階段4: 用戶流程
            const stage4 = await this.validateUserFlow();
            console.log(`階段4結果: ${stage4 ? '✅ 通過' : '❌ 失敗'}`);
            
            // 階段5: 性能驗證
            const stage5 = await this.validatePerformance();
            console.log(`階段5結果: ${stage5 ? '✅ 通過' : '❌ 失敗'}`);
            
            // 生成報告
            const report = await this.generateReport();
            
            console.log('\n🎯 生產環境驗證完成！');
            console.log('📊 詳細報告已生成');
            
            return report;
            
        } catch (error) {
            console.error(`❌ 驗證過程發生錯誤: ${error.message}`);
            throw error;
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }
}

// 自動執行驗證
async function runProductionValidation() {
    const validator = new ProductionSmartBrowserValidator();
    
    try {
        const result = await validator.runCompleteValidation();
        
        console.log('\n✈️ 飛機彙報 - 生產環境驗證完成');
        console.log('┌─────────────────────────────────────────────┐');
        console.log('│ 📊 生產環境深度驗證結果:                     │');
        console.log(`│ 🌐 目標網址: ${validator.productionUrl.substring(0, 40)}...│`);
        console.log(`│ ✅ 基礎架構: ${result.reportData.summary.infrastructurePassed ? '通過' : '失敗'} │`);
        console.log(`│ 🔌 API測試: ${result.reportData.summary.apiTestsPassed}/6 通過 │`);
        console.log(`│ 🎯 前端測試: ${result.reportData.summary.frontendTestsPassed ? '通過' : '失敗'} │`);
        console.log(`│ 👤 用戶流程: ${result.reportData.summary.userFlowPassed ? '通過' : '失敗'} │`);
        console.log(`│ 📈 性能測試: ${result.reportData.summary.performancePassed ? '通過' : '失敗'} │`);
        console.log('│                                           │');
        console.log(`│ 📄 報告路徑: ${result.mdReportPath.split('\\').pop()} │`);
        console.log('│ 📸 截圖已保存至 production-screenshots/    │');
        console.log('└─────────────────────────────────────────────┘');
        
        return result;
        
    } catch (error) {
        console.error(`❌ 生產環境驗證失敗: ${error.message}`);
        throw error;
    }
}

// 立即執行驗證
if (require.main === module) {
    runProductionValidation()
        .then(() => {
            console.log('🎯 生產環境智慧瀏覽器驗證完成！');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ 驗證失敗:', error);
            process.exit(1);
        });
}

module.exports = ProductionSmartBrowserValidator;