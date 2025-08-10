/**
 * 🚀 最終智慧瀏覽器驗證系統 - 完整功能測試版
 * 基於實際部署的系統進行全面驗證
 */

const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

class FinalSmartBrowserValidator {
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
            functionalModules: [],
            overallScore: 0
        };
        this.reportPath = './最終智慧瀏覽器驗證報告.md';
        this.screenshotDir = './最終驗證截圖';
        
        // 基於server.js的實際路由配置
        this.apiEndpoints = [
            { url: '/health', name: '系統健康檢查', critical: true },
            { url: '/api/auth/login', name: '員工登入API', method: 'POST', critical: true },
            { url: '/api/attendance/records', name: '打卡記錄API', critical: true },
            { url: '/api/revenue/records', name: '營收記錄API', critical: true },
            { url: '/api/schedule/config', name: '排班配置API', critical: true },
            { url: '/api/promotion/campaigns', name: '升職活動API', critical: true },
            { url: '/api/maintenance/equipment', name: '維修設備API', critical: true },
            { url: '/api/telegram/groups', name: 'Telegram群組API', critical: false },
            { url: '/api/appeals', name: '申訴系統API', critical: false },
            { url: '/api/monitoring/health', name: '系統監控API', critical: false },
            { url: '/api/employees', name: '員工管理API', critical: true },
            { url: '/api/alerts', name: '警報系統API', critical: false }
        ];
    }

    /**
     * 🚀 初始化瀏覽器環境
     */
    async initialize() {
        console.log('🚀 正在啟動最終智慧瀏覽器驗證系統...');
        
        if (!fs.existsSync(this.screenshotDir)) {
            fs.mkdirSync(this.screenshotDir, { recursive: true });
        }

        this.browser = await puppeteer.launch({
            headless: false,
            slowMo: 100,
            args: [
                '--start-maximized',
                '--disable-web-security',
                '--no-sandbox',
                '--disable-dev-shm-usage'
            ]
        });

        this.page = await this.browser.newPage();
        await this.page.setViewport({ width: 1920, height: 1080 });
        
        // 設定請求攔截
        await this.page.setRequestInterception(true);
        this.page.on('request', (req) => {
            req.continue();
        });
        
        console.log('✅ 瀏覽器環境初始化完成');
    }

    /**
     * 📸 智慧截圖功能
     */
    async smartScreenshot(name, description, fullPage = true) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `${timestamp}_${name}.png`;
            const filepath = path.join(this.screenshotDir, filename);
            
            await this.page.screenshot({ 
                path: filepath, 
                fullPage,
                quality: 90
            });
            
            this.results.screenshots.push({
                name,
                description,
                filename,
                timestamp: new Date().toISOString()
            });
            
            console.log(`📸 截圖已保存: ${filename} - ${description}`);
            return filepath;
        } catch (error) {
            console.log(`📸 截圖失敗: ${error.message}`);
            return null;
        }
    }

    /**
     * ✅ 智慧測試結果記錄
     */
    logTest(testName, passed, details, error = null, critical = false) {
        const result = {
            testName,
            passed,
            details,
            error: error ? error.message : null,
            critical,
            timestamp: new Date().toISOString()
        };
        
        if (passed) {
            this.results.testsPassed++;
            console.log(`✅ ${testName}: 通過${critical ? ' (關鍵)' : ''}`);
        } else {
            this.results.testsFailed++;
            console.log(`❌ ${testName}: 失敗${critical ? ' (關鍵)' : ''} - ${error || details}`);
        }
        
        this.results.details.push(result);
        
        // 計算分數權重
        if (critical) {
            this.results.overallScore += passed ? 10 : -5;
        } else {
            this.results.overallScore += passed ? 5 : -2;
        }
    }

    /**
     * 🌐 第1階段：系統可用性和API端點測試
     */
    async testSystemAvailability() {
        console.log('\n🌐 === 第1階段：系統可用性測試 ===');
        
        // 等待部署完成
        console.log('⏳ 等待最新部署完成 (60秒)...');
        await this.delay(60000);
        
        for (const endpoint of this.apiEndpoints) {
            try {
                const fullURL = `${this.baseURL}${endpoint.url}`;
                console.log(`🔍 測試: ${endpoint.name} - ${endpoint.url}`);
                
                let response;
                if (endpoint.method === 'POST') {
                    // 模擬登入請求
                    response = await axios.post(fullURL, {
                        name: '測試員工',
                        idNumber: 'A123456789'
                    }, {
                        timeout: 15000,
                        validateStatus: () => true
                    });
                } else {
                    response = await axios.get(fullURL, {
                        timeout: 15000,
                        validateStatus: () => true
                    });
                }
                
                const isSuccess = response.status < 400 || response.status === 401; // 401是預期的未授權回應
                const details = `HTTP ${response.status} - ${response.statusText}`;
                
                this.logTest(`API-${endpoint.name}`, isSuccess, details, null, endpoint.critical);
                
                // 記錄功能模組狀態
                this.results.functionalModules.push({
                    name: endpoint.name,
                    url: endpoint.url,
                    status: response.status,
                    available: isSuccess,
                    critical: endpoint.critical,
                    responseTime: Date.now()
                });
                
                await this.delay(500); // 避免請求過於頻繁
                
            } catch (error) {
                this.logTest(`API-${endpoint.name}`, false, `請求失敗: ${endpoint.url}`, error, endpoint.critical);
                
                this.results.functionalModules.push({
                    name: endpoint.name,
                    url: endpoint.url,
                    status: 0,
                    available: false,
                    critical: endpoint.critical,
                    error: error.message
                });
            }
        }
    }

    /**
     * 🖥️ 第2階段：完整頁面載入和UI測試
     */
    async testPageLoadingAndUI() {
        console.log('\n🖥️ === 第2階段：頁面載入和UI測試 ===');
        
        try {
            // 測試主頁面載入
            console.log('🌐 載入主頁面...');
            const startTime = Date.now();
            
            const response = await this.page.goto(this.baseURL, { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });
            
            const loadTime = Date.now() - startTime;
            
            await this.smartScreenshot('homepage_loaded', '主頁面載入完成');
            
            this.logTest('主頁面載入', response.ok(), `HTTP ${response.status()}, 載入時間: ${loadTime}ms`, null, true);
            this.logTest('頁面載入速度', loadTime < 5000, `載入時間: ${loadTime}ms (標準: <5000ms)`);
            
            // 檢查頁面內容
            const pageContent = await this.page.content();
            const hasValidContent = pageContent.length > 500;
            this.logTest('頁面內容完整性', hasValidContent, `頁面內容長度: ${pageContent.length} 字元`);
            
            // 檢查頁面標題
            const title = await this.page.title();
            this.logTest('頁面標題設定', title && title.length > 0, `標題: \"${title}\"`);
            
            // 檢查是否正確重定向到登入頁面
            await this.delay(3000);
            const currentURL = this.page.url();
            const isLoginRedirect = currentURL.includes('/login') || pageContent.includes('login');
            this.logTest('登入頁面重定向', isLoginRedirect, `當前URL: ${currentURL}`, null, true);
            
            if (isLoginRedirect && currentURL.includes('/login')) {
                await this.smartScreenshot('login_page', '登入頁面顯示');
                await this.testLoginFunctionality();
            }
            
        } catch (error) {
            this.logTest('頁面載入測試', false, '頁面載入失敗', error, true);
        }
    }

    /**
     * 👤 登入功能詳細測試
     */
    async testLoginFunctionality() {
        console.log('\n👤 === 登入功能詳細測試 ===');
        
        try {
            // 檢查登入表單元素
            const loginForm = await this.page.$('form, .login-form');
            const nameInput = await this.page.$('input[name="name"], #name, input[placeholder*="姓名"], input[placeholder*="員工"]');
            const idInput = await this.page.$('input[name="idNumber"], #idNumber, input[placeholder*="身分證"], input[placeholder*="ID"]');
            const submitButton = await this.page.$('button[type="submit"], .login-btn, button:contains("登入"), input[type="submit"]');
            
            this.logTest('登入表單存在', !!loginForm, '檢查登入表單HTML結構');
            this.logTest('姓名輸入欄位', !!nameInput, '檢查員工姓名輸入欄位');
            this.logTest('身分證輸入欄位', !!idInput, '檢查身分證號輸入欄位');
            this.logTest('登入提交按鈕', !!submitButton, '檢查登入提交按鈕');
            
            if (nameInput && idInput && submitButton) {
                console.log('🔑 執行登入操作測試...');
                
                // 清空並填入測試資料
                await nameInput.click({ clickCount: 3 });
                await nameInput.type('測試員工');
                await this.delay(500);
                
                await idInput.click({ clickCount: 3 });
                await idInput.type('A123456789');
                await this.delay(500);
                
                await this.smartScreenshot('login_form_filled', '登入表單已填入測試資料');
                
                // 點擊登入按鈕
                await submitButton.click();
                await this.delay(3000);
                
                await this.smartScreenshot('after_login_attempt', '登入嘗試後的頁面狀態');
                
                // 檢查登入結果
                const newURL = this.page.url();
                const isLoggedIn = !newURL.includes('/login') || await this.page.$('.welcome, .dashboard, .employee-info');
                
                this.logTest('登入功能執行', isLoggedIn, `登入後URL: ${newURL}`, null, true);
                
                if (isLoggedIn) {
                    await this.testDashboardElements();
                }
            }
            
        } catch (error) {
            this.logTest('登入功能測試', false, '登入測試執行失敗', error, true);
        }
    }

    /**
     * 🏠 儀表板元素和導航測試
     */
    async testDashboardElements() {
        console.log('\n🏠 === 儀表板和導航測試 ===');
        
        try {
            await this.delay(2000);
            await this.smartScreenshot('dashboard_view', '儀表板頁面檢視');
            
            // 檢查常見的儀表板元素
            const dashboardElements = [
                { selector: '.dashboard, #dashboard, .main-content', name: '主要內容區域' },
                { selector: '.user-info, .employee-info, .welcome', name: '用戶資訊區塊' },
                { selector: '.navigation, nav, .menu', name: '導航選單' },
                { selector: '.stats, .statistics, .metrics', name: '統計資訊區塊' },
                { selector: '.actions, .quick-actions, .buttons', name: '快速操作按鈕' }
            ];
            
            for (const element of dashboardElements) {
                const found = await this.page.$(element.selector);
                this.logTest(`儀表板-${element.name}`, !!found, `選擇器: ${element.selector}`);
            }
            
            // 測試導航連結
            const navigationLinks = await this.page.$$('a[href], button[onclick]');
            this.logTest('導航連結數量', navigationLinks.length > 0, `找到 ${navigationLinks.length} 個可點擊元素`);
            
            // 測試響應式設計
            await this.testResponsiveDesign();
            
        } catch (error) {
            this.logTest('儀表板測試', false, '儀表板測試失敗', error);
        }
    }

    /**
     * 📱 響應式設計測試
     */
    async testResponsiveDesign() {
        console.log('\n📱 === 響應式設計測試 ===');
        
        const deviceSizes = [
            { name: 'Desktop', width: 1920, height: 1080 },
            { name: 'Tablet', width: 768, height: 1024 },
            { name: 'Mobile', width: 375, height: 667 }
        ];
        
        for (const device of deviceSizes) {
            try {
                console.log(`📏 測試 ${device.name} 檢視 (${device.width}x${device.height})`);
                
                await this.page.setViewport({ 
                    width: device.width, 
                    height: device.height 
                });
                
                await this.delay(1000);
                await this.smartScreenshot(`responsive_${device.name.toLowerCase()}`, 
                    `${device.name} 響應式檢視`);
                
                // 檢查是否有水平捲軸
                const hasHorizontalScroll = await this.page.evaluate(() => {
                    return document.body.scrollWidth > window.innerWidth;
                });
                
                this.logTest(`響應式-${device.name}`, !hasHorizontalScroll, 
                    `${!hasHorizontalScroll ? '正常適應' : '出現水平捲軸'}`);
                
            } catch (error) {
                this.logTest(`響應式-${device.name}`, false, '響應式測試失敗', error);
            }
        }
        
        // 恢復桌面檢視
        await this.page.setViewport({ width: 1920, height: 1080 });
    }

    /**
     * ⚡ 第3階段：系統效能和安全性測試
     */
    async testPerformanceAndSecurity() {
        console.log('\n⚡ === 第3階段：效能和安全性測試 ===');
        
        try {
            // 效能指標測試
            const performanceMetrics = await this.page.evaluate(() => {
                const navigation = performance.getEntriesByType('navigation')[0];
                return {
                    domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart),
                    loadComplete: Math.round(navigation.loadEventEnd - navigation.loadEventStart),
                    firstPaint: Math.round(performance.getEntriesByType('paint')[0]?.startTime || 0)
                };
            });
            
            this.results.performance = performanceMetrics;
            
            this.logTest('DOM載入效能', performanceMetrics.domContentLoaded < 3000, 
                `DOM載入: ${performanceMetrics.domContentLoaded}ms (標準: <3000ms)`);
                
            this.logTest('頁面完整載入效能', performanceMetrics.loadComplete < 5000, 
                `完整載入: ${performanceMetrics.loadComplete}ms (標準: <5000ms)`);
            
            // HTTPS安全性檢查
            const isHTTPS = this.page.url().startsWith('https://');
            this.logTest('HTTPS安全連接', isHTTPS, `協議: ${this.page.url().split('://')[0]}`, null, true);
            
            // 檢查控制台錯誤
            const consoleErrors = [];
            this.page.on('console', msg => {
                if (msg.type() === 'error') {
                    consoleErrors.push(msg.text());
                }
            });
            
            await this.delay(2000);
            
            this.logTest('控制台錯誤檢查', consoleErrors.length < 3, 
                `發現 ${consoleErrors.length} 個控制台錯誤`);
            
        } catch (error) {
            this.logTest('效能安全測試', false, '效能安全測試失敗', error);
        }
    }

    /**
     * 📊 第4階段：功能完整性評估
     */
    async testFunctionalCompleteness() {
        console.log('\n📊 === 第4階段：功能完整性評估 ===');
        
        // 計算關鍵功能可用率
        const criticalModules = this.results.functionalModules.filter(m => m.critical);
        const availableCritical = criticalModules.filter(m => m.available).length;
        const criticalAvailabilityRate = (availableCritical / criticalModules.length) * 100;
        
        this.logTest('關鍵功能完整性', criticalAvailabilityRate >= 70, 
            `關鍵功能可用率: ${criticalAvailabilityRate.toFixed(1)}% (${availableCritical}/${criticalModules.length})`, 
            null, true);
        
        // 計算總體功能完整性
        const totalAvailable = this.results.functionalModules.filter(m => m.available).length;
        const totalAvailabilityRate = (totalAvailable / this.results.functionalModules.length) * 100;
        
        this.logTest('系統整體完整性', totalAvailabilityRate >= 60, 
            `整體功能可用率: ${totalAvailabilityRate.toFixed(1)}% (${totalAvailable}/${this.results.functionalModules.length})`);
        
        console.log(`📈 功能模組狀態統計:`);
        console.log(`   關鍵模組: ${availableCritical}/${criticalModules.length} 可用`);
        console.log(`   總體模組: ${totalAvailable}/${this.results.functionalModules.length} 可用`);
    }

    /**
     * 🎯 生成終極驗證報告
     */
    async generateFinalReport() {
        console.log('\n🎯 === 生成終極驗證報告 ===');
        
        const totalTests = this.results.testsPassed + this.results.testsFailed;
        const passRate = totalTests > 0 ? ((this.results.testsPassed / totalTests) * 100).toFixed(2) : 0;
        const scoreRating = this.getScoreRating(parseFloat(passRate));
        
        // 功能模組摘要
        const modulesSummary = this.results.functionalModules.map(module => 
            `- **${module.name}**: ${module.available ? '✅' : '❌'} ${module.critical ? '(關鍵)' : ''}`
        ).join('\n');
        
        // 關鍵問題列表
        const criticalIssues = this.results.details
            .filter(detail => !detail.passed && detail.critical)
            .map(issue => `- **${issue.testName}**: ${issue.details}`)
            .join('\n');
            
        const report = `# 🚀 最終智慧瀏覽器驗證報告

## 🎯 驗證總結

**🕒 驗證時間**：${this.results.timestamp}  
**🌐 測試目標**：${this.baseURL}  
**✅ 通過測試**：${this.results.testsPassed}  
**❌ 失敗測試**：${this.results.testsFailed}  
**📊 通過率**：${passRate}%  
**🏆 系統評級**：${scoreRating.emoji} ${scoreRating.level}  
**📸 截圖數量**：${this.results.screenshots.length}

## 🎖️ 驗證評級說明

${scoreRating.description}

## 🔧 功能模組檢測結果

${modulesSummary}

## ⚡ 系統效能指標

${Object.keys(this.results.performance).length > 0 ? `
- **DOM載入時間**：${this.results.performance.domContentLoaded}ms
- **頁面完整載入**：${this.results.performance.loadComplete}ms  
- **首次繪製時間**：${this.results.performance.firstPaint}ms
` : '未收集到效能數據'}

## 🚨 關鍵問題清單

${criticalIssues || '無關鍵問題'}

## 📋 詳細測試結果

${this.results.details.map((test, index) => `
### ${index + 1}. ${test.passed ? '✅' : '❌'} ${test.testName}${test.critical ? ' (關鍵)' : ''}

**結果**：${test.passed ? '通過' : '失敗'}  
**詳情**：${test.details}  
${test.error ? `**錯誤**：${test.error}` : ''}  
**時間**：${test.timestamp}

---`).join('')}

## 📸 驗證截圖記錄

${this.results.screenshots.map((screenshot, index) => `
${index + 1}. **${screenshot.name}**: ${screenshot.description}  
   檔案: ${screenshot.filename} | 時間: ${screenshot.timestamp}
`).join('')}

## 💡 改善建議

### ✅ 系統優勢
${this.results.details.filter(t => t.passed).slice(0, 5).map(t => `- ${t.testName}: ${t.details}`).join('\n') || '無顯著優勢'}

### ⚠️ 優化建議
${this.results.details.filter(t => !t.passed).slice(0, 8).map(t => `- **${t.testName}**: ${t.details}`).join('\n') || '無需優化'}

## 🎯 後續行動計劃

${parseFloat(passRate) >= 80 ? `
### 🎉 系統已準備就緒
- 系統可以正式投入生產環境使用
- 建議設定定期自動化監控
- 可以開始用戶培訓和系統推廣
- 制定維護和更新計劃
` : parseFloat(passRate) >= 60 ? `
### 🔧 系統需要優化
- 修復失敗的關鍵功能模組
- 優化頁面載入和回應速度
- 完善錯誤處理和用戶體驗
- 進行額外的功能測試
` : `
### 🚨 系統需要重大改善
- 立即修復所有關鍵功能問題
- 重新檢查部署配置和環境設定
- 進行全面的系統除錯和測試
- 考慮重新部署或版本回滾
`}

## 📊 驗證統計圖表

\`\`\`
測試結果分佈:
✅ 通過: ${this.results.testsPassed} (${((this.results.testsPassed / totalTests) * 100).toFixed(1)}%)
❌ 失敗: ${this.results.testsFailed} (${((this.results.testsFailed / totalTests) * 100).toFixed(1)}%)

功能模組狀態:
關鍵模組: ${this.results.functionalModules.filter(m => m.critical && m.available).length}/${this.results.functionalModules.filter(m => m.critical).length}
一般模組: ${this.results.functionalModules.filter(m => !m.critical && m.available).length}/${this.results.functionalModules.filter(m => !m.critical).length}
\`\`\`

---
**🤖 報告生成**：${new Date().toISOString()}  
**🔧 驗證工具**：最終智慧瀏覽器驗證系統 v4.0  
**📍 測試環境**：Railway生產環境  
**👨‍💻 驗證引擎**：Puppeteer + Axios + 智慧分析`;

        fs.writeFileSync(this.reportPath, report, 'utf8');
        console.log(`📋 終極驗證報告已保存: ${this.reportPath}`);
        
        return {
            totalTests,
            passRate: parseFloat(passRate),
            reportPath: this.reportPath,
            screenshotDir: this.screenshotDir,
            rating: scoreRating,
            functionalModules: this.results.functionalModules
        };
    }

    /**
     * 📊 獲取評級系統
     */
    getScoreRating(passRate) {
        if (passRate >= 90) {
            return {
                emoji: '🏆',
                level: '優秀',
                description: '系統表現卓越，已完全準備好投入生產環境使用。所有關鍵功能正常運行，效能優異。'
            };
        } else if (passRate >= 75) {
            return {
                emoji: '🟢',
                level: '良好',
                description: '系統表現良好，基本功能正常運行。建議修復少數問題後即可投入使用。'
            };
        } else if (passRate >= 60) {
            return {
                emoji: '🟡',
                level: '合格',
                description: '系統基本可用，但存在一些需要改善的問題。建議進行優化後再正式使用。'
            };
        } else if (passRate >= 40) {
            return {
                emoji: '🟠',
                level: '需改善',
                description: '系統存在較多問題，需要進行重要修復才能正常使用。不建議立即投入生產環境。'
            };
        } else {
            return {
                emoji: '🔴',
                level: '需重大修復',
                description: '系統存在嚴重問題，需要全面檢查和重大修復。強烈不建議在當前狀態下使用。'
            };
        }
    }

    /**
     * ⏳ 延遲函數
     */
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 🧹 清理資源
     */
    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            console.log('🧹 瀏覽器已關閉，資源已清理');
        }
    }

    /**
     * 🚀 執行完整的終極驗證
     */
    async runCompleteValidation() {
        try {
            console.log('🌟 ===== 最終智慧瀏覽器驗證系統啟動 =====');
            
            await this.initialize();
            
            // 執行全面的驗證流程
            await this.testSystemAvailability();         // 系統可用性測試
            await this.testPageLoadingAndUI();          // 頁面和UI測試
            await this.testPerformanceAndSecurity();    // 效能和安全測試
            await this.testFunctionalCompleteness();    // 功能完整性評估
            
            // 生成最終報告
            const results = await this.generateFinalReport();
            
            console.log('\n🎉 ===== 最終驗證完成 =====');
            console.log(`📊 測試總數: ${results.totalTests}`);
            console.log(`✅ 通過率: ${results.passRate}%`);
            console.log(`🏆 系統評級: ${results.rating.emoji} ${results.rating.level}`);
            console.log(`📋 完整報告: ${results.reportPath}`);
            console.log(`📸 截圖目錄: ${results.screenshotDir}`);
            
            return results;
            
        } catch (error) {
            console.error('❌ 最終驗證過程中發生嚴重錯誤:', error);
            throw error;
        } finally {
            await this.cleanup();
        }
    }
}

// 執行最終驗證
async function main() {
    const validator = new FinalSmartBrowserValidator();
    
    try {
        const results = await validator.runCompleteValidation();
        
        console.log('\n🏆 === 最終驗證總結 ===');
        console.log(`總測試項目: ${results.totalTests}`);
        console.log(`通過率: ${results.passRate}%`);
        console.log(`系統評級: ${results.rating.emoji} ${results.rating.level}`);
        console.log(`評級說明: ${results.rating.description}`);
        
        console.log('\n📊 功能模組統計:');
        const critical = results.functionalModules.filter(m => m.critical);
        const available = critical.filter(m => m.available);
        console.log(`關鍵功能: ${available.length}/${critical.length} 可用`);
        
        results.functionalModules.forEach(module => {
            const status = module.available ? '✅' : '❌';
            const type = module.critical ? '[關鍵]' : '[一般]';
            console.log(`${status} ${type} ${module.name}`);
        });
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ 最終驗證執行失敗:', error);
        process.exit(1);
    }
}

// 如果直接執行此腳本
if (require.main === module) {
    main();
}

module.exports = FinalSmartBrowserValidator;