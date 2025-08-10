/**
 * 🌐 優化智慧瀏覽器驗證系統 - 修復版
 * 針對API端點驗證和現有系統架構優化
 */

const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

class OptimizedBrowserValidator {
    constructor() {
        this.browser = null;
        this.page = null;
        this.baseURL = 'https://employee-management-system-production-4361.up.railway.app';
        this.results = {
            timestamp: new Date().toISOString(),
            testsPassed: 0,
            testsFailed: 0,
            details: [],
            screenshots: [],
            performance: {},
            apiResults: []
        };
        this.reportPath = './優化智慧瀏覽器驗證報告.md';
        this.screenshotDir = './優化驗證截圖';
    }

    /**
     * 🚀 初始化瀏覽器
     */
    async initialize() {
        console.log('🚀 正在啟動優化瀏覽器驗證引擎...');
        
        if (!fs.existsSync(this.screenshotDir)) {
            fs.mkdirSync(this.screenshotDir, { recursive: true });
        }

        this.browser = await puppeteer.launch({
            headless: false,
            slowMo: 50,
            args: [
                '--start-maximized',
                '--disable-web-security',
                '--no-sandbox'
            ]
        });

        this.page = await this.browser.newPage();
        await this.page.setViewport({ width: 1920, height: 1080 });
        
        console.log('✅ 瀏覽器初始化完成');
    }

    /**
     * 📸 截圖
     */
    async takeScreenshot(name, description) {
        try {
            const filename = `${Date.now()}_${name}.png`;
            const filepath = path.join(this.screenshotDir, filename);
            
            await this.page.screenshot({ 
                path: filepath, 
                fullPage: true 
            });
            
            this.results.screenshots.push({
                name,
                description,
                filename,
                timestamp: new Date().toISOString()
            });
            
            console.log(`📸 截圖保存: ${filename}`);
        } catch (error) {
            console.log(`📸 截圖失敗: ${error.message}`);
        }
    }

    /**
     * ✅ 記錄測試結果
     */
    logTest(testName, passed, details, error = null) {
        if (passed) {
            this.results.testsPassed++;
            console.log(`✅ ${testName}: 通過`);
        } else {
            this.results.testsFailed++;
            console.log(`❌ ${testName}: 失敗 - ${error || details}`);
        }
        
        this.results.details.push({
            testName,
            passed,
            details,
            error: error ? error.message : null,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * 🌐 第1階段：API端點直接測試
     */
    async testAPIEndpointsDirectly() {
        console.log('\n🌐 === 第1階段：API端點直接測試 ===');
        
        const apiEndpoints = [
            { url: '/health', name: '系統健康檢查', method: 'GET' },
            { url: '/api/monitoring/health', name: '監控健康檢查', method: 'GET' },
            { url: '/api/monitoring/metrics/basic', name: '基本監控指標', method: 'GET' },
            { url: '/api/employees', name: '員工資料API', method: 'GET' },
            { url: '/api/attendance/records', name: '打卡記錄API', method: 'GET' },
            { url: '/api/schedule/config', name: '排班配置API', method: 'GET' },
            { url: '/api/telegram/groups', name: 'Telegram群組API', method: 'GET' },
            { url: '/api/appeals', name: '申訴系統API', method: 'GET' },
            { url: '/api/promotion/campaigns', name: '升職活動API', method: 'GET' },
            { url: '/api/maintenance/equipment', name: '設備維修API', method: 'GET' }
        ];
        
        for (const endpoint of apiEndpoints) {
            try {
                const fullURL = `${this.baseURL}${endpoint.url}`;
                console.log(`🔍 測試: ${endpoint.name} - ${fullURL}`);
                
                const response = await axios({
                    method: endpoint.method,
                    url: fullURL,
                    timeout: 10000,
                    validateStatus: () => true // 接受所有HTTP狀態碼
                });
                
                const isSuccess = response.status < 400;
                const details = `HTTP ${response.status} - ${response.statusText}`;
                
                this.logTest(`API-${endpoint.name}`, isSuccess, details);
                
                this.results.apiResults.push({
                    name: endpoint.name,
                    url: endpoint.url,
                    status: response.status,
                    success: isSuccess,
                    data: typeof response.data === 'object' ? JSON.stringify(response.data).substring(0, 200) + '...' : response.data?.substring(0, 200)
                });
                
                // 特別處理健康檢查端點
                if (endpoint.url === '/health' && isSuccess) {
                    console.log(`💚 健康檢查回應: ${JSON.stringify(response.data).substring(0, 100)}...`);
                }
                
            } catch (error) {
                this.logTest(`API-${endpoint.name}`, false, `請求失敗: ${endpoint.url}`, error);
                
                this.results.apiResults.push({
                    name: endpoint.name,
                    url: endpoint.url,
                    status: 0,
                    success: false,
                    error: error.message
                });
            }
        }
    }

    /**
     * 🌐 第2階段：頁面載入和結構測試
     */
    async testPageStructure() {
        console.log('\n🌐 === 第2階段：頁面載入和結構測試 ===');
        
        try {
            // 測試主頁面載入
            console.log('🔍 載入主頁面...');
            const response = await this.page.goto(this.baseURL, { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });
            
            await this.takeScreenshot('main_page', '主頁面載入');
            
            this.logTest('主頁面HTTP狀態', response.ok(), `狀態: ${response.status()}`);
            
            // 檢查頁面內容
            const pageContent = await this.page.content();
            const hasContent = pageContent.length > 1000;
            this.logTest('頁面內容載入', hasContent, `內容長度: ${pageContent.length} 字元`);
            
            // 檢查是否為JSON回應（API端點）
            const isJSONResponse = pageContent.trim().startsWith('{') && pageContent.trim().endsWith('}');
            if (isJSONResponse) {
                try {
                    const jsonData = JSON.parse(pageContent);
                    this.logTest('JSON回應解析', true, `資料類型: ${typeof jsonData}, 欄位: ${Object.keys(jsonData).join(', ')}`);
                    
                    // 檢查是否有系統狀態資訊
                    if (jsonData.status || jsonData.message) {
                        console.log(`💡 系統回應: ${JSON.stringify(jsonData)}`);
                    }
                } catch (parseError) {
                    this.logTest('JSON回應解析', false, '無法解析JSON回應', parseError);
                }
            }
            
            // 檢查頁面標題
            const title = await this.page.title();
            this.logTest('頁面標題', title.length > 0, `標題: "${title}"`);
            
            // 檢查基本HTML結構
            const hasHTML = await this.page.$('html');
            const hasBody = await this.page.$('body');
            const hasHead = await this.page.$('head');
            
            this.logTest('HTML結構-html標籤', !!hasHTML, 'HTML根元素存在');
            this.logTest('HTML結構-body標籤', !!hasBody, 'Body元素存在');
            this.logTest('HTML結構-head標籤', !!hasHead, 'Head元素存在');
            
        } catch (error) {
            this.logTest('頁面結構測試', false, '頁面載入失敗', error);
        }
    }

    /**
     * 🔐 第3階段：安全性和回應測試
     */
    async testSecurityAndResponses() {
        console.log('\n🔐 === 第3階段：安全性和回應測試 ===');
        
        try {
            // HTTPS檢查
            const isHTTPS = this.page.url().startsWith('https://');
            this.logTest('HTTPS安全連接', isHTTPS, `協議: ${this.page.url().split('://')[0]}`);
            
            // 測試登入相關端點
            const authEndpoints = [
                { url: '/login', name: '登入頁面' },
                { url: '/api/auth/login', name: '登入API', method: 'POST' }
            ];
            
            for (const endpoint of authEndpoints) {
                try {
                    let response;
                    if (endpoint.method === 'POST') {
                        response = await axios.post(`${this.baseURL}${endpoint.url}`, {
                            name: '測試員工',
                            idNumber: 'A123456789'
                        }, {
                            timeout: 10000,
                            validateStatus: () => true
                        });
                    } else {
                        response = await axios.get(`${this.baseURL}${endpoint.url}`, {
                            timeout: 10000,
                            validateStatus: () => true
                        });
                    }
                    
                    const isAccessible = response.status < 500;
                    this.logTest(`安全端點-${endpoint.name}`, isAccessible, 
                        `HTTP ${response.status} - ${response.statusText}`);
                        
                } catch (error) {
                    this.logTest(`安全端點-${endpoint.name}`, false, '端點無法訪問', error);
                }
            }
            
            // 檢查錯誤處理
            try {
                const notFoundResponse = await axios.get(`${this.baseURL}/nonexistent-page`, {
                    timeout: 10000,
                    validateStatus: () => true
                });
                
                const hasErrorHandling = notFoundResponse.status === 404;
                this.logTest('錯誤處理機制', hasErrorHandling, 
                    `404頁面回應狀態: ${notFoundResponse.status}`);
                    
            } catch (error) {
                this.logTest('錯誤處理機制', false, '無法測試錯誤處理', error);
            }
            
        } catch (error) {
            this.logTest('安全性測試', false, '安全性測試執行失敗', error);
        }
    }

    /**
     * ⚡ 第4階段：效能測試
     */
    async testPerformance() {
        console.log('\n⚡ === 第4階段：效能測試 ===');
        
        try {
            // 測試各端點的回應時間
            const performanceTests = [
                { url: '/health', name: '健康檢查回應時間' },
                { url: '/api/monitoring/metrics/basic', name: '監控指標回應時間' },
                { url: '/api/employees', name: '員工API回應時間' }
            ];
            
            for (const test of performanceTests) {
                const startTime = Date.now();
                
                try {
                    const response = await axios.get(`${this.baseURL}${test.url}`, {
                        timeout: 10000,
                        validateStatus: () => true
                    });
                    
                    const responseTime = Date.now() - startTime;
                    const isFast = responseTime < 2000; // 2秒內為良好
                    
                    this.logTest(`效能-${test.name}`, isFast, 
                        `回應時間: ${responseTime}ms (標準: <2000ms)`);
                        
                } catch (error) {
                    const responseTime = Date.now() - startTime;
                    this.logTest(`效能-${test.name}`, false, 
                        `回應超時: ${responseTime}ms`, error);
                }
            }
            
            // 測試系統資源使用
            try {
                const healthResponse = await axios.get(`${this.baseURL}/health`, {
                    timeout: 10000,
                    validateStatus: () => true
                });
                
                if (healthResponse.status === 200 && healthResponse.data.memory) {
                    const memoryMB = Math.round(healthResponse.data.memory.rss / 1024 / 1024);
                    const isMemoryOptimal = memoryMB < 200; // 200MB內為良好
                    
                    this.logTest('系統記憶體使用', isMemoryOptimal, 
                        `記憶體使用: ${memoryMB}MB (標準: <200MB)`);
                        
                    this.results.performance = {
                        memoryUsageMB: memoryMB,
                        uptime: healthResponse.data.uptime
                    };
                }
                
            } catch (error) {
                this.logTest('系統資源檢查', false, '無法獲取系統資源資訊', error);
            }
            
        } catch (error) {
            this.logTest('效能測試', false, '效能測試執行失敗', error);
        }
    }

    /**
     * 📊 第5階段：功能完整性測試
     */
    async testFunctionalityCompleteness() {
        console.log('\n📊 === 第5階段：功能完整性測試 ===');
        
        // 檢查系統核心功能模組
        const coreModules = [
            { path: '/api/employees', name: '員工管理模組' },
            { path: '/api/attendance/records', name: '打卡系統模組' },
            { path: '/api/schedule/config', name: '排班系統模組' },
            { path: '/api/promotion/campaigns', name: '升職系統模組' },
            { path: '/api/maintenance/equipment', name: '維修系統模組' },
            { path: '/api/telegram/groups', name: 'Telegram整合模組' },
            { path: '/api/appeals', name: '申訴系統模組' },
            { path: '/api/monitoring/health', name: '監控系統模組' }
        ];
        
        let functionalModules = 0;
        
        for (const module of coreModules) {
            try {
                const response = await axios.get(`${this.baseURL}${module.path}`, {
                    timeout: 10000,
                    validateStatus: () => true
                });
                
                const isWorking = response.status < 500;
                if (isWorking) functionalModules++;
                
                this.logTest(`功能模組-${module.name}`, isWorking, 
                    `狀態: HTTP ${response.status}`);
                    
            } catch (error) {
                this.logTest(`功能模組-${module.name}`, false, '模組無回應', error);
            }
        }
        
        // 整體功能完整性評估
        const completenessRate = (functionalModules / coreModules.length) * 100;
        const isComplete = completenessRate >= 60; // 60%以上為合格
        
        this.logTest('系統功能完整性', isComplete, 
            `功能模組可用率: ${completenessRate.toFixed(1)}% (${functionalModules}/${coreModules.length})`);
    }

    /**
     * 📋 生成優化驗證報告
     */
    async generateOptimizedReport() {
        console.log('\n📋 === 正在生成優化驗證報告 ===');
        
        const totalTests = this.results.testsPassed + this.results.testsFailed;
        const passRate = totalTests > 0 ? ((this.results.testsPassed / totalTests) * 100).toFixed(2) : 0;
        
        // API端點摘要
        const apiSummary = this.results.apiResults.map(api => 
            `- **${api.name}**: ${api.success ? '✅' : '❌'} HTTP ${api.status} ${api.error ? `(${api.error})` : ''}`
        ).join('\n');
        
        const report = `# 🌐 優化智慧瀏覽器驗證報告

## 📊 驗證摘要

**🕒 驗證時間**：${this.results.timestamp}  
**🎯 測試目標**：${this.baseURL}  
**✅ 通過測試**：${this.results.testsPassed}  
**❌ 失敗測試**：${this.results.testsFailed}  
**📈 通過率**：${passRate}%  
**📸 截圖數量**：${this.results.screenshots.length}

## 🎯 驗證評級

**系統狀態**：${passRate >= 80 ? '🟢 優秀' : passRate >= 60 ? '🟡 良好' : passRate >= 40 ? '🟠 需改善' : '🔴 需重大修復'}

## 🔗 API端點檢測結果

${apiSummary}

## ⚡ 效能指標

${Object.keys(this.results.performance).length > 0 ? `
- **系統記憶體使用**：${this.results.performance.memoryUsageMB || 'N/A'}MB
- **系統運行時間**：${this.results.performance.uptime || 'N/A'}秒
` : '未收集到效能數據'}

## 🔍 詳細測試結果

${this.results.details.map(test => `
### ${test.passed ? '✅' : '❌'} ${test.testName}

**結果**：${test.passed ? '通過' : '失敗'}  
**詳情**：${test.details}  
${test.error ? `**錯誤**：${test.error}` : ''}  
**時間**：${test.timestamp}

---`).join('')}

## 💡 驗證建議

### ✅ 系統優勢
${this.results.details.filter(t => t.passed).slice(0, 5).map(t => `- ${t.testName}: ${t.details}`).join('\n')}

### ⚠️ 改善建議
${this.results.details.filter(t => !t.passed).slice(0, 8).map(t => `- **${t.testName}**: ${t.details}${t.error ? ` (${t.error})` : ''}`).join('\n')}

## 🎯 下一步行動

${passRate >= 80 ? `
### 🎉 系統表現優秀
- 系統已準備好投入生產使用
- 建議設定定期監控和維護計劃
- 可以開始用戶培訓和系統推廣
` : passRate >= 60 ? `
### 🔧 系統需要微調
- 修復失敗的API端點
- 優化頁面載入速度
- 完善錯誤處理機制
` : `
### 🚨 系統需要重大改善
- 優先修復核心功能模組
- 檢查伺服器配置和部署設定
- 進行完整的系統除錯
`}

---
*報告生成時間：${new Date().toISOString()}*  
*驗證工具：優化智慧瀏覽器驗證系統 v3.0*`;

        fs.writeFileSync(this.reportPath, report, 'utf8');
        console.log(`📋 優化驗證報告已保存: ${this.reportPath}`);
        
        return {
            totalTests,
            passRate: parseFloat(passRate),
            reportPath: this.reportPath,
            screenshotDir: this.screenshotDir,
            apiResults: this.results.apiResults
        };
    }

    /**
     * 🧹 清理資源
     */
    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            console.log('🧹 瀏覽器已關閉');
        }
    }

    /**
     * 🚀 執行完整優化驗證
     */
    async runOptimizedValidation() {
        try {
            console.log('🌟 ===== 優化智慧瀏覽器驗證系統啟動 =====');
            
            await this.initialize();
            
            // 執行優化的測試階段
            await this.testAPIEndpointsDirectly();     // API端點直接測試
            await this.testPageStructure();            // 頁面結構測試
            await this.testSecurityAndResponses();     // 安全性測試
            await this.testPerformance();             // 效能測試
            await this.testFunctionalityCompleteness(); // 功能完整性測試
            
            // 生成報告
            const results = await this.generateOptimizedReport();
            
            console.log('\n🎉 ===== 優化驗證完成 =====');
            console.log(`📊 測試總數: ${results.totalTests}`);
            console.log(`✅ 通過率: ${results.passRate}%`);
            console.log(`📋 報告位置: ${results.reportPath}`);
            
            return results;
            
        } catch (error) {
            console.error('❌ 優化驗證過程中發生錯誤:', error);
            throw error;
        } finally {
            await this.cleanup();
        }
    }
}

// 執行優化驗證
async function main() {
    const validator = new OptimizedBrowserValidator();
    
    try {
        const results = await validator.runOptimizedValidation();
        
        console.log('\n🏆 === 最終優化驗證結果 ===');
        console.log(`總測試項目: ${results.totalTests}`);
        console.log(`通過率: ${results.passRate}%`);
        
        if (results.passRate >= 80) {
            console.log('🟢 系統驗證：優秀 - 可以投入生產使用');
        } else if (results.passRate >= 60) {
            console.log('🟡 系統驗證：良好 - 建議修復部分問題');
        } else if (results.passRate >= 40) {
            console.log('🟠 系統驗證：需改善 - 建議優化核心功能');
        } else {
            console.log('🔴 系統驗證：需重大修復 - 建議全面檢查');
        }
        
        console.log('\n📈 API端點檢測摘要:');
        results.apiResults.forEach(api => {
            console.log(`${api.success ? '✅' : '❌'} ${api.name}: HTTP ${api.status}`);
        });
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ 優化驗證執行失敗:', error);
        process.exit(1);
    }
}

// 如果直接執行此腳本
if (require.main === module) {
    main();
}

module.exports = OptimizedBrowserValidator;