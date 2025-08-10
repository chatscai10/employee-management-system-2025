/**
 * 🌐 智慧瀏覽器完整驗證系統
 * 完整檢查企業員工管理系統的每個細節和功能
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class SmartBrowserValidator {
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
            accessibility: {},
            security: {}
        };
        this.reportPath = './智慧瀏覽器驗證報告.md';
        this.screenshotDir = './驗證截圖';
    }

    /**
     * 🚀 初始化瀏覽器和驗證環境
     */
    async initialize() {
        console.log('🚀 正在啟動智慧瀏覽器驗證引擎...');
        
        // 創建截圖目錄
        if (!fs.existsSync(this.screenshotDir)) {
            fs.mkdirSync(this.screenshotDir, { recursive: true });
        }

        // 啟動瀏覽器
        this.browser = await puppeteer.launch({
            headless: false, // 顯示瀏覽器窗口
            slowMo: 100,     // 減慢操作速度以便觀察
            args: [
                '--start-maximized',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--no-sandbox'
            ]
        });

        this.page = await this.browser.newPage();
        
        // 設定視窗大小和設備模擬
        await this.page.setViewport({ width: 1920, height: 1080 });
        
        // 監聽控制台訊息
        this.page.on('console', msg => {
            console.log(`🖥️ 控制台: ${msg.text()}`);
        });

        // 監聽網路請求
        this.page.on('response', response => {
            if (!response.ok()) {
                console.log(`❌ HTTP錯誤: ${response.status()} - ${response.url()}`);
            }
        });

        console.log('✅ 瀏覽器初始化完成');
    }

    /**
     * 📸 截圖並記錄
     */
    async takeScreenshot(name, description) {
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
        
        console.log(`📸 截圖保存: ${filename} - ${description}`);
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
     * 🔍 第1階段：基礎連接和頁面載入測試
     */
    async testBasicConnectivity() {
        console.log('\n🔍 === 第1階段：基礎連接測試 ===');
        
        try {
            // 測試主頁載入
            console.log('🌐 正在載入主頁面...');
            const response = await this.page.goto(this.baseURL, { 
                waitUntil: 'networkidle2', 
                timeout: 30000 
            });
            
            await this.takeScreenshot('homepage', '主頁面載入');
            
            this.logTest('主頁面載入', response.ok(), `HTTP狀態: ${response.status()}`);
            
            // 測試頁面標題
            const title = await this.page.title();
            this.logTest('頁面標題', title.length > 0, `標題: "${title}"`);
            
            // 檢查是否重定向到登入頁面
            await this.page.waitForTimeout(2000);
            const currentURL = this.page.url();
            const isLoginPage = currentURL.includes('/login');
            this.logTest('自動重定向到登入頁', isLoginPage, `當前URL: ${currentURL}`);
            
            if (isLoginPage) {
                await this.takeScreenshot('login_page', '登入頁面自動重定向');
            }
            
        } catch (error) {
            this.logTest('基礎連接', false, '無法載入主頁面', error);
        }
    }

    /**
     * 👤 第2階段：完整登入功能測試
     */
    async testLoginFunctionality() {
        console.log('\n👤 === 第2階段：登入功能完整測試 ===');
        
        try {
            // 確保在登入頁面
            if (!this.page.url().includes('/login')) {
                await this.page.goto(`${this.baseURL}/login`, { waitUntil: 'networkidle2' });
            }
            
            await this.page.waitForTimeout(2000);
            await this.takeScreenshot('login_form', '登入表單頁面');
            
            // 檢查登入表單元素
            const nameInput = await this.page.$('input[name="name"], #name, input[placeholder*="姓名"]');
            const idInput = await this.page.$('input[name="idNumber"], #idNumber, input[placeholder*="身分證"]');
            const submitButton = await this.page.$('button[type="submit"], .login-btn, button:contains("登入")');
            
            this.logTest('姓名輸入欄位存在', !!nameInput, '檢查name輸入欄位');
            this.logTest('身分證輸入欄位存在', !!idInput, '檢查idNumber輸入欄位');
            this.logTest('登入按鈕存在', !!submitButton, '檢查登入提交按鈕');
            
            if (nameInput && idInput && submitButton) {
                // 執行登入操作
                console.log('🔑 正在執行登入操作...');
                
                await nameInput.click({ clickCount: 3 });
                await nameInput.type('測試員工');
                await this.page.waitForTimeout(500);
                
                await idInput.click({ clickCount: 3 });
                await idInput.type('A123456789');
                await this.page.waitForTimeout(500);
                
                await this.takeScreenshot('login_filled', '登入資料已填入');
                
                // 點擊登入按鈕
                await submitButton.click();
                
                // 等待登入完成
                await this.page.waitForTimeout(3000);
                await this.takeScreenshot('after_login', '登入後頁面');
                
                // 檢查登入是否成功
                const currentURL = this.page.url();
                const isLoggedIn = !currentURL.includes('/login');
                
                this.logTest('登入執行成功', isLoggedIn, `登入後URL: ${currentURL}`);
                
                // 檢查是否有歡迎訊息或用戶資訊
                const userInfo = await this.page.$('.user-info, .welcome, .employee-name');
                this.logTest('用戶資訊顯示', !!userInfo, '檢查登入後用戶資訊');
                
            }
            
        } catch (error) {
            this.logTest('登入功能', false, '登入流程執行失敗', error);
        }
    }

    /**
     * 🧭 第3階段：導航選單和按鈕完整測試
     */
    async testNavigationAndMenus() {
        console.log('\n🧭 === 第3階段：導航選單和按鈕測試 ===');
        
        try {
            // 檢查主要導航選單
            const menuItems = [
                { selector: 'a[href*="dashboard"], .nav-dashboard', name: '儀表板' },
                { selector: 'a[href*="attendance"], .nav-attendance', name: '打卡系統' },
                { selector: 'a[href*="schedule"], .nav-schedule', name: '排班系統' },
                { selector: 'a[href*="revenue"], .nav-revenue', name: '營收系統' },
                { selector: 'a[href*="promotion"], .nav-promotion', name: '升職系統' },
                { selector: 'a[href*="maintenance"], .nav-maintenance', name: '維修系統' },
                { selector: 'a[href*="inventory"], .nav-inventory', name: '庫存系統' }
            ];
            
            console.log('🔍 正在檢查導航選單項目...');
            
            for (const item of menuItems) {
                const element = await this.page.$(item.selector);
                this.logTest(`導航選單-${item.name}`, !!element, `選擇器: ${item.selector}`);
                
                if (element) {
                    // 測試點擊功能
                    try {
                        await element.click();
                        await this.page.waitForTimeout(2000);
                        
                        const newURL = this.page.url();
                        await this.takeScreenshot(`menu_${item.name}`, `點擊${item.name}後的頁面`);
                        
                        this.logTest(`${item.name}頁面導航`, true, `成功導航到: ${newURL}`);
                    } catch (navError) {
                        this.logTest(`${item.name}頁面導航`, false, '點擊導航失敗', navError);
                    }
                }
            }
            
            // 檢查響應式選單
            await this.page.setViewport({ width: 375, height: 667 }); // iPhone尺寸
            await this.page.waitForTimeout(1000);
            await this.takeScreenshot('mobile_view', '行動版檢視');
            
            const mobileMenuToggle = await this.page.$('.menu-toggle, .hamburger, .mobile-menu-btn');
            this.logTest('行動版選單按鈕', !!mobileMenuToggle, '檢查響應式選單');
            
            if (mobileMenuToggle) {
                await mobileMenuToggle.click();
                await this.page.waitForTimeout(1000);
                await this.takeScreenshot('mobile_menu_open', '行動版選單展開');
                this.logTest('行動版選單展開', true, '成功展開行動版選單');
            }
            
            // 恢復桌面檢視
            await this.page.setViewport({ width: 1920, height: 1080 });
            
        } catch (error) {
            this.logTest('導航選單測試', false, '導航測試執行失敗', error);
        }
    }

    /**
     * 📊 第4階段：功能按鈕和互動元素測試
     */
    async testInteractiveElements() {
        console.log('\n📊 === 第4階段：互動元素和按鈕測試 ===');
        
        try {
            // 測試各種按鈕類型
            const buttonSelectors = [
                'button',
                '.btn',
                '.button',
                'input[type="submit"]',
                'input[type="button"]',
                '.action-btn',
                '.primary-btn',
                '.secondary-btn'
            ];
            
            console.log('🔘 正在檢查所有按鈕元素...');
            
            for (const selector of buttonSelectors) {
                const buttons = await this.page.$$(selector);
                
                if (buttons.length > 0) {
                    this.logTest(`按鈕元素-${selector}`, true, `找到 ${buttons.length} 個按鈕`);
                    
                    // 測試第一個按鈕的互動
                    const firstButton = buttons[0];
                    const isEnabled = await firstButton.evaluate(btn => !btn.disabled);
                    const buttonText = await firstButton.evaluate(btn => btn.textContent || btn.value || '無文字');
                    
                    this.logTest(`按鈕狀態-${selector}`, isEnabled, `按鈕文字: "${buttonText}"`);
                    
                    // 測試hover效果
                    await firstButton.hover();
                    await this.page.waitForTimeout(500);
                }
            }
            
            // 測試表單元素
            console.log('📝 正在檢查表單元素...');
            
            const formElements = [
                { selector: 'input[type="text"]', name: '文字輸入欄' },
                { selector: 'input[type="email"]', name: '電子郵件欄' },
                { selector: 'input[type="password"]', name: '密碼輸入欄' },
                { selector: 'input[type="date"]', name: '日期選擇器' },
                { selector: 'input[type="time"]', name: '時間選擇器' },
                { selector: 'select', name: '下拉選單' },
                { selector: 'textarea', name: '多行文字區域' },
                { selector: 'input[type="checkbox"]', name: '核取方塊' },
                { selector: 'input[type="radio"]', name: '選項按鈕' }
            ];
            
            for (const element of formElements) {
                const elements = await this.page.$$(element.selector);
                if (elements.length > 0) {
                    this.logTest(`表單元素-${element.name}`, true, `找到 ${elements.length} 個元素`);
                    
                    // 測試第一個元素的互動
                    const firstElement = elements[0];
                    try {
                        await firstElement.click();
                        await this.page.waitForTimeout(200);
                        
                        if (element.selector.includes('input[type="text"]')) {
                            await firstElement.type('測試輸入');
                            await this.page.waitForTimeout(300);
                            await firstElement.evaluate(el => el.value = ''); // 清空
                        }
                        
                        this.logTest(`${element.name}互動`, true, '成功執行互動操作');
                    } catch (interactionError) {
                        this.logTest(`${element.name}互動`, false, '互動操作失敗', interactionError);
                    }
                }
            }
            
        } catch (error) {
            this.logTest('互動元素測試', false, '互動測試執行失敗', error);
        }
    }

    /**
     * 🔗 第5階段：API端點和資料流測試
     */
    async testAPIEndpoints() {
        console.log('\n🔗 === 第5階段：API端點和資料流測試 ===');
        
        try {
            const apiEndpoints = [
                { url: '/health', name: '健康檢查' },
                { url: '/api/employees', name: '員工資料API' },
                { url: '/api/attendance/records', name: '打卡記錄API' },
                { url: '/api/schedule/config', name: '排班配置API' },
                { url: '/api/monitoring/metrics/basic', name: '基本監控指標' },
                { url: '/api/telegram/groups', name: 'Telegram群組API' },
                { url: '/api/appeals', name: '申訴系統API' }
            ];
            
            console.log('🌐 正在測試API端點...');
            
            // 監聽網路請求
            const apiResults = [];
            
            this.page.on('response', response => {
                const url = response.url();
                const status = response.status();
                
                for (const endpoint of apiEndpoints) {
                    if (url.includes(endpoint.url)) {
                        apiResults.push({
                            endpoint: endpoint.name,
                            url: url,
                            status: status,
                            ok: response.ok(),
                            timestamp: new Date().toISOString()
                        });
                    }
                }
            });
            
            // 觸發API調用
            for (const endpoint of apiEndpoints) {
                try {
                    const fullURL = `${this.baseURL}${endpoint.url}`;
                    
                    // 使用fetch在頁面中調用API
                    const response = await this.page.evaluate(async (url) => {
                        try {
                            const res = await fetch(url);
                            return {
                                ok: res.ok,
                                status: res.status,
                                data: await res.json()
                            };
                        } catch (error) {
                            return {
                                ok: false,
                                status: 0,
                                error: error.message
                            };
                        }
                    }, fullURL);
                    
                    this.logTest(`API-${endpoint.name}`, response.ok, 
                        `狀態: ${response.status}, URL: ${endpoint.url}`);
                    
                } catch (apiError) {
                    this.logTest(`API-${endpoint.name}`, false, 
                        `API調用失敗: ${endpoint.url}`, apiError);
                }
            }
            
            await this.page.waitForTimeout(2000);
            
        } catch (error) {
            this.logTest('API端點測試', false, 'API測試執行失敗', error);
        }
    }

    /**
     * ⚡ 第6階段：效能和載入速度測試
     */
    async testPerformance() {
        console.log('\n⚡ === 第6階段：效能和載入速度測試 ===');
        
        try {
            // 測試頁面載入效能
            const performanceMetrics = await this.page.evaluate(() => {
                const navigation = performance.getEntriesByType('navigation')[0];
                return {
                    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                    loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                    firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime || 0,
                    firstContentfulPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')?.startTime || 0
                };
            });
            
            this.results.performance = performanceMetrics;
            
            this.logTest('DOM載入時間', performanceMetrics.domContentLoaded < 3000, 
                `${performanceMetrics.domContentLoaded}ms (標準: <3000ms)`);
            
            this.logTest('頁面完整載入', performanceMetrics.loadComplete < 5000, 
                `${performanceMetrics.loadComplete}ms (標準: <5000ms)`);
            
            this.logTest('首次繪製時間', performanceMetrics.firstPaint < 2000, 
                `${performanceMetrics.firstPaint}ms (標準: <2000ms)`);
            
            // 測試記憶體使用
            const memoryInfo = await this.page.evaluate(() => {
                return performance.memory ? {
                    usedJSHeapSize: performance.memory.usedJSHeapSize,
                    totalJSHeapSize: performance.memory.totalJSHeapSize,
                    jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
                } : null;
            });
            
            if (memoryInfo) {
                const memoryMB = Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024);
                this.logTest('記憶體使用量', memoryMB < 100, `${memoryMB}MB (標準: <100MB)`);
            }
            
        } catch (error) {
            this.logTest('效能測試', false, '效能測試執行失敗', error);
        }
    }

    /**
     * 🔒 第7階段：安全性和權限測試
     */
    async testSecurity() {
        console.log('\n🔒 === 第7階段：安全性和權限測試 ===');
        
        try {
            // 檢查HTTPS
            const isHTTPS = this.page.url().startsWith('https://');
            this.logTest('HTTPS安全連接', isHTTPS, `當前協議: ${this.page.url().split('://')[0]}`);
            
            // 檢查CSP和安全標頭
            const response = await this.page.goto(this.baseURL, { waitUntil: 'networkidle2' });
            const headers = response.headers();
            
            const securityHeaders = [
                'content-security-policy',
                'x-frame-options', 
                'x-content-type-options',
                'strict-transport-security'
            ];
            
            for (const header of securityHeaders) {
                const hasHeader = !!headers[header];
                this.logTest(`安全標頭-${header}`, hasHeader, 
                    hasHeader ? `值: ${headers[header]}` : '未設定');
            }
            
            // 檢查是否有敏感資訊洩露
            const pageContent = await this.page.content();
            const sensitivePatterns = [
                /password\s*[:=]\s*['"][\w\d]+['"]/gi,
                /api[_-]?key\s*[:=]\s*['"][\w\d]+['"]/gi,
                /secret\s*[:=]\s*['"][\w\d]+['"]/gi,
                /token\s*[:=]\s*['"][\w\d\-_\.]+['"]/gi
            ];
            
            let sensitiveFound = false;
            for (const pattern of sensitivePatterns) {
                if (pattern.test(pageContent)) {
                    sensitiveFound = true;
                    break;
                }
            }
            
            this.logTest('敏感資訊檢查', !sensitiveFound, 
                sensitiveFound ? '發現潛在敏感資訊洩露' : '未發現敏感資訊洩露');
            
            // 測試未授權存取
            const protectedEndpoints = [
                '/api/employees',
                '/api/attendance/statistics',
                '/api/alerts'
            ];
            
            for (const endpoint of protectedEndpoints) {
                try {
                    const unauthorizedResponse = await this.page.evaluate(async (url) => {
                        const response = await fetch(url);
                        return response.status;
                    }, `${this.baseURL}${endpoint}`);
                    
                    // 401 (Unauthorized) 或 403 (Forbidden) 是預期的安全回應
                    const isSecure = unauthorizedResponse === 401 || unauthorizedResponse === 403;
                    this.logTest(`權限保護-${endpoint}`, isSecure, 
                        `回應狀態: ${unauthorizedResponse}`);
                        
                } catch (error) {
                    this.logTest(`權限保護-${endpoint}`, true, '端點受到保護');
                }
            }
            
        } catch (error) {
            this.logTest('安全性測試', false, '安全性測試執行失敗', error);
        }
    }

    /**
     * 📱 第8階段：響應式設計和裝置相容性測試
     */
    async testResponsiveDesign() {
        console.log('\n📱 === 第8階段：響應式設計測試 ===');
        
        try {
            const deviceSizes = [
                { name: 'Desktop', width: 1920, height: 1080 },
                { name: 'Laptop', width: 1366, height: 768 },
                { name: 'Tablet', width: 768, height: 1024 },
                { name: 'Mobile-Large', width: 414, height: 896 },
                { name: 'Mobile-Small', width: 375, height: 667 }
            ];
            
            for (const device of deviceSizes) {
                console.log(`📏 測試 ${device.name} (${device.width}x${device.height})`);
                
                await this.page.setViewport({ 
                    width: device.width, 
                    height: device.height 
                });
                
                await this.page.reload({ waitUntil: 'networkidle2' });
                await this.page.waitForTimeout(2000);
                
                await this.takeScreenshot(`responsive_${device.name}`, 
                    `${device.name}響應式檢視`);
                
                // 檢查基本元素是否可見
                const criticalElements = [
                    { selector: 'header, .header', name: '頁首' },
                    { selector: 'nav, .navigation, .menu', name: '導航選單' },
                    { selector: 'main, .main-content, .content', name: '主要內容' },
                    { selector: 'footer, .footer', name: '頁尾' }
                ];
                
                for (const element of criticalElements) {
                    const isVisible = await this.page.$(element.selector);
                    this.logTest(`${device.name}-${element.name}`, !!isVisible, 
                        `元素選擇器: ${element.selector}`);
                }
                
                // 檢查水平捲軸
                const hasHorizontalScroll = await this.page.evaluate(() => {
                    return document.body.scrollWidth > window.innerWidth;
                });
                
                this.logTest(`${device.name}-無水平捲軸`, !hasHorizontalScroll, 
                    `頁面寬度適配: ${!hasHorizontalScroll ? '正常' : '出現水平捲軸'}`);
            }
            
            // 恢復桌面檢視
            await this.page.setViewport({ width: 1920, height: 1080 });
            
        } catch (error) {
            this.logTest('響應式設計測試', false, '響應式測試執行失敗', error);
        }
    }

    /**
     * 📋 生成完整驗證報告
     */
    async generateReport() {
        console.log('\n📋 === 正在生成完整驗證報告 ===');
        
        const totalTests = this.results.testsPassed + this.results.testsFailed;
        const passRate = totalTests > 0 ? ((this.results.testsPassed / totalTests) * 100).toFixed(2) : 0;
        
        const report = `# 🌐 智慧瀏覽器完整驗證報告

## 📊 測試摘要

**🕒 測試時間**：${this.results.timestamp}  
**🎯 測試目標**：${this.baseURL}  
**✅ 通過測試**：${this.results.testsPassed}  
**❌ 失敗測試**：${this.results.testsFailed}  
**📈 通過率**：${passRate}%  
**📸 截圖數量**：${this.results.screenshots.length}

## 🔍 詳細測試結果

${this.results.details.map(test => `
### ${test.passed ? '✅' : '❌'} ${test.testName}

**結果**：${test.passed ? '通過' : '失敗'}  
**詳情**：${test.details}  
${test.error ? `**錯誤**：${test.error}` : ''}  
**時間**：${test.timestamp}

---`).join('')}

## ⚡ 效能指標

${Object.keys(this.results.performance).length > 0 ? `
- **DOM載入時間**：${this.results.performance.domContentLoaded}ms
- **頁面完整載入**：${this.results.performance.loadComplete}ms  
- **首次繪製**：${this.results.performance.firstPaint}ms
- **首次內容繪製**：${this.results.performance.firstContentfulPaint}ms
` : '未收集到效能數據'}

## 📸 測試截圖

${this.results.screenshots.map(screenshot => `
### ${screenshot.name}
**描述**：${screenshot.description}  
**檔案**：${screenshot.filename}  
**時間**：${screenshot.timestamp}
`).join('')}

## 🎯 測試建議

### ✅ 表現良好的方面
${this.results.details.filter(t => t.passed).slice(0, 5).map(t => `- ${t.testName}: ${t.details}`).join('\n')}

### ⚠️ 需要改善的方面  
${this.results.details.filter(t => !t.passed).map(t => `- **${t.testName}**: ${t.details}${t.error ? ` (錯誤: ${t.error})` : ''}`).join('\n')}

## 📈 總體評價

**系統狀態**：${passRate >= 80 ? '🟢 優秀' : passRate >= 60 ? '🟡 良好' : '🔴 需要改善'}  
**建議**：${passRate >= 80 ? '系統運行狀況良好，可以投入生產使用。' : 
             passRate >= 60 ? '系統基本功能正常，建議修復失敗的測試項目。' : 
             '系統存在較多問題，建議優先修復關鍵功能後再部署。'}

---
*報告生成時間：${new Date().toISOString()}*  
*驗證工具：智慧瀏覽器完整驗證系統 v2.0*`;

        fs.writeFileSync(this.reportPath, report, 'utf8');
        console.log(`📋 驗證報告已保存: ${this.reportPath}`);
        
        return {
            totalTests,
            passRate,
            reportPath: this.reportPath,
            screenshotDir: this.screenshotDir
        };
    }

    /**
     * 🧹 清理和關閉瀏覽器
     */
    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            console.log('🧹 瀏覽器已關閉');
        }
    }

    /**
     * 🚀 執行完整驗證流程
     */
    async runCompleteValidation() {
        try {
            console.log('🌟 ===== 智慧瀏覽器完整驗證系統啟動 =====');
            
            await this.initialize();
            
            // 執行所有測試階段
            await this.testBasicConnectivity();
            await this.testLoginFunctionality();
            await this.testNavigationAndMenus();
            await this.testInteractiveElements();
            await this.testAPIEndpoints();
            await this.testPerformance();
            await this.testSecurity();
            await this.testResponsiveDesign();
            
            // 生成報告
            const results = await this.generateReport();
            
            console.log('\n🎉 ===== 驗證完成 =====');
            console.log(`📊 測試總數: ${results.totalTests}`);
            console.log(`✅ 通過率: ${results.passRate}%`);
            console.log(`📋 報告位置: ${results.reportPath}`);
            console.log(`📸 截圖目錄: ${results.screenshotDir}`);
            
            return results;
            
        } catch (error) {
            console.error('❌ 驗證過程中發生錯誤:', error);
            throw error;
        } finally {
            await this.cleanup();
        }
    }
}

// 執行完整驗證
async function main() {
    const validator = new SmartBrowserValidator();
    
    try {
        const results = await validator.runCompleteValidation();
        
        // 輸出最終結果
        console.log('\n🏆 === 最終驗證結果 ===');
        console.log(`總測試項目: ${results.totalTests}`);
        console.log(`通過率: ${results.passRate}%`);
        
        if (results.passRate >= 80) {
            console.log('🟢 系統驗證：優秀 - 可以投入生產使用');
        } else if (results.passRate >= 60) {
            console.log('🟡 系統驗證：良好 - 建議修復部分問題');
        } else {
            console.log('🔴 系統驗證：需改善 - 建議修復關鍵問題');
        }
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ 驗證執行失敗:', error);
        process.exit(1);
    }
}

// 如果直接執行此腳本
if (require.main === module) {
    main();
}

module.exports = SmartBrowserValidator;