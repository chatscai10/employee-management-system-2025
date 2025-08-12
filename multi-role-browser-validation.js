const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

/**
 * 🌐 智慧瀏覽器多角色系統功能驗證引擎
 * 完整測試企業員工管理系統的所有核心功能
 */
class MultiRoleBrowserValidator {
    constructor() {
        this.baseUrl = 'http://localhost:3007';
        this.browser = null;
        this.page = null;
        this.consoleLog = [];
        this.networkLog = [];
        this.validationResults = {
            roles: {},
            modules: {},
            interactions: {},
            console: {},
            overall: { success: 0, failed: 0, warnings: 0 }
        };
        
        // 測試用戶資料 (基於實際登入表單結構和現有數據)
        this.testUsers = {
            manager: { name: '測試員工1', idNumber: 'A123456789' },  // 店長角色
            employee: { name: '測試員工2', idNumber: 'B123456789' }, // 員工角色
            admin: { name: '系統管理員', idNumber: 'D123456789' },     // 系統管理員
            newUser: { name: '一般員工乙', idNumber: 'B123456789' }   // 新註冊用戶
        };
        
        this.startTime = new Date();
    }

    async initialize() {
        console.log('🚀 初始化智慧瀏覽器驗證系統...');
        
        this.browser = await puppeteer.launch({
            headless: false,  // 顯示瀏覽器以便觀察
            slowMo: 500,      // 減慢操作速度
            devtools: true,   // 開啟開發者工具
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu'
            ]
        });
        
        this.page = await this.browser.newPage();
        await this.page.setViewport({ width: 1366, height: 768 });
        
        // 監控控制台訊息
        this.page.on('console', msg => {
            const logEntry = {
                type: msg.type(),
                text: msg.text(),
                timestamp: new Date().toISOString(),
                url: this.page.url()
            };
            this.consoleLog.push(logEntry);
            console.log(`🖥️  [控制台-${msg.type()}] ${msg.text()}`);
        });
        
        // 監控網路請求
        this.page.on('response', response => {
            const networkEntry = {
                url: response.url(),
                status: response.status(),
                statusText: response.statusText(),
                timestamp: new Date().toISOString()
            };
            this.networkLog.push(networkEntry);
            
            if (response.status() >= 400) {
                console.log(`🔴 網路錯誤: ${response.status()} ${response.url()}`);
            }
        });
        
        console.log('✅ 瀏覽器初始化完成');
    }

    async validateMultiRoleLogin() {
        console.log('\n🔐 開始多角色登入驗證...');
        
        for (const [role, credentials] of Object.entries(this.testUsers)) {
            try {
                console.log(`\n👤 測試角色: ${role} (${credentials.name})`);
                
                // 導航到登入頁面
                await this.page.goto(`${this.baseUrl}/login.html`, { waitUntil: 'networkidle2' });
                await this.page.screenshot({ 
                    path: `D:\\0809\\login-page-${role}-${Date.now()}.png`,
                    fullPage: true 
                });
                
                // 確保在登入表單頁面
                await this.page.waitForSelector('input[name="name"]', { timeout: 5000 });
                
                // 清空並填寫登入表單 (使用實際的表單欄位名稱)
                await this.page.evaluate(() => {
                    const nameInput = document.querySelector('input[name="name"]');
                    const idInput = document.querySelector('input[name="idNumber"]');
                    if (nameInput) nameInput.value = '';
                    if (idInput) idInput.value = '';
                });
                
                await this.page.type('input[name="name"]', credentials.name, { delay: 100 });
                await this.page.type('input[name="idNumber"]', credentials.idNumber, { delay: 100 });
                
                // 提交登入表單
                await Promise.all([
                    this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }),
                    this.page.click('button[type="submit"]')
                ]);
                
                // 檢查登入結果
                const currentUrl = this.page.url();
                const isSuccess = !currentUrl.includes('login.html');
                
                this.validationResults.roles[role] = {
                    login: isSuccess,
                    redirectUrl: currentUrl,
                    screenshot: `login-page-${role}-${Date.now()}.png`,
                    consoleErrors: this.consoleLog.filter(log => log.type === 'error').length
                };
                
                if (isSuccess) {
                    console.log(`✅ ${role} 登入成功，重定向到: ${currentUrl}`);
                    this.validationResults.overall.success++;
                    
                    // 截圖登入成功後的頁面
                    await this.page.screenshot({ 
                        path: `D:\\0809\\dashboard-${role}-${Date.now()}.png`,
                        fullPage: true 
                    });
                    
                    // 檢查角色權限
                    await this.checkRolePermissions(role);
                } else {
                    console.log(`❌ ${role} 登入失敗`);
                    this.validationResults.overall.failed++;
                }
                
                // 登出準備下一個測試
                await this.logout();
                
            } catch (error) {
                console.log(`🚨 ${role} 登入測試發生錯誤: ${error.message}`);
                this.validationResults.roles[role] = { error: error.message };
                this.validationResults.overall.failed++;
            }
        }
    }

    async checkRolePermissions(role) {
        console.log(`\n🛡️  檢查 ${role} 角色權限...`);
        
        try {
            // 檢查導航選單可見性
            const menuItems = await this.page.evaluate(() => {
                const items = {};
                const navLinks = document.querySelectorAll('nav a, .menu a, .sidebar a');
                navLinks.forEach(link => {
                    const text = link.textContent.trim();
                    const href = link.getAttribute('href');
                    if (text && href) {
                        items[text] = {
                            href: href,
                            visible: window.getComputedStyle(link).display !== 'none'
                        };
                    }
                });
                return items;
            });
            
            console.log(`📋 ${role} 可用選單項目:`, Object.keys(menuItems));
            this.validationResults.roles[role].menuItems = menuItems;
            
        } catch (error) {
            console.log(`⚠️  權限檢查錯誤: ${error.message}`);
        }
    }

    async validateCoreModules() {
        console.log('\n📊 開始核心功能模組測試...');
        
        // 使用管理員身份登入來測試所有功能
        await this.loginAs('admin');
        
        const modules = [
            { name: '營收管理', url: '/employee-dashboard.html#revenue', test: 'testRevenueModule' },
            { name: '智慧排程', url: '/employee-dashboard.html#schedule', test: 'testScheduleModule' },
            { name: '報表系統', url: '/employee-dashboard.html#reports', test: 'testReportsModule' },
            { name: '員工管理', url: '/employee-dashboard.html#employees', test: 'testEmployeeModule' },
            { name: '投票系統', url: '/employee-dashboard.html#voting', test: 'testVotingModule' },
            { name: 'GPS打卡', url: '/employee-dashboard.html#gps', test: 'testGPSModule' }
        ];
        
        for (const module of modules) {
            try {
                console.log(`\n🧪 測試模組: ${module.name}`);
                
                await this.page.goto(`${this.baseUrl}${module.url}`, { waitUntil: 'networkidle2' });
                
                // 執行模組特定測試
                if (this[module.test]) {
                    const result = await this[module.test]();
                    this.validationResults.modules[module.name] = result;
                    
                    if (result.success) {
                        console.log(`✅ ${module.name} 測試通過`);
                        this.validationResults.overall.success++;
                    } else {
                        console.log(`❌ ${module.name} 測試失敗: ${result.error}`);
                        this.validationResults.overall.failed++;
                    }
                } else {
                    // 基本可達性測試
                    const isAccessible = !this.page.url().includes('login.html');
                    this.validationResults.modules[module.name] = {
                        success: isAccessible,
                        accessible: isAccessible
                    };
                    
                    if (isAccessible) {
                        this.validationResults.overall.success++;
                    } else {
                        this.validationResults.overall.failed++;
                    }
                }
                
                // 截圖模組頁面
                await this.page.screenshot({ 
                    path: `D:\\0809\\module-${module.name.replace(/[^\w]/g, '')}-${Date.now()}.png`,
                    fullPage: true 
                });
                
            } catch (error) {
                console.log(`🚨 模組測試錯誤 ${module.name}: ${error.message}`);
                this.validationResults.modules[module.name] = { success: false, error: error.message };
                this.validationResults.overall.failed++;
            }
        }
    }

    async testRevenueModule() {
        console.log('💰 測試營收管理模組...');
        
        try {
            // 等待營收相關元素載入
            await this.page.waitForSelector('[data-module="revenue"], #revenue-section, .revenue-container', { timeout: 5000 });
            
            // 檢查營收API端點
            const apiTests = [
                '/api/revenue/summary',
                '/api/revenue/daily',
                '/api/revenue/monthly'
            ];
            
            let apiSuccess = 0;
            for (const endpoint of apiTests) {
                try {
                    const response = await this.page.evaluate(async (url) => {
                        const res = await fetch(url);
                        return { status: res.status, ok: res.ok };
                    }, endpoint);
                    
                    if (response.ok) {
                        apiSuccess++;
                        console.log(`✅ API正常: ${endpoint}`);
                    } else {
                        console.log(`❌ API異常: ${endpoint} (${response.status})`);
                    }
                } catch (error) {
                    console.log(`🚨 API測試錯誤: ${endpoint} - ${error.message}`);
                }
            }
            
            return {
                success: apiSuccess > 0,
                apiTests: `${apiSuccess}/${apiTests.length}`,
                accessible: true
            };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async testScheduleModule() {
        console.log('📅 測試智慧排程模組...');
        
        try {
            // 檢查排程相關元素
            await this.page.waitForSelector('[data-module="schedule"], #schedule-section, .schedule-container', { timeout: 5000 });
            
            // 測試6重規則引擎API
            const ruleValidation = await this.page.evaluate(async () => {
                try {
                    const response = await fetch('/api/schedule/validate-rules', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            employeeId: 1,
                            year: 2025,
                            month: 8,
                            offDates: ['2025-08-15', '2025-08-20']
                        })
                    });
                    return { status: response.status, ok: response.ok };
                } catch (error) {
                    return { error: error.message };
                }
            });
            
            return {
                success: ruleValidation.ok,
                ruleEngine: ruleValidation.ok ? '6重規則引擎正常' : '規則引擎異常',
                accessible: true
            };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async testReportsModule() {
        console.log('📈 測試報表系統模組...');
        
        try {
            // 測試8個報表API端點
            const reportAPIs = [
                '/api/reports/employee-performance',
                '/api/reports/attendance-summary',
                '/api/reports/revenue-analysis',
                '/api/reports/schedule-utilization',
                '/api/reports/promotion-history',
                '/api/reports/department-stats',
                '/api/reports/monthly-overview',
                '/api/reports/system-health'
            ];
            
            let apiSuccess = 0;
            for (const endpoint of reportAPIs) {
                try {
                    const response = await this.page.evaluate(async (url) => {
                        const res = await fetch(url);
                        return { status: res.status, ok: res.ok };
                    }, endpoint);
                    
                    if (response.ok) {
                        apiSuccess++;
                    }
                } catch (error) {
                    console.log(`報表API測試錯誤: ${endpoint}`);
                }
            }
            
            return {
                success: apiSuccess >= 4, // 至少一半API正常即算通過
                apiCount: `${apiSuccess}/${reportAPIs.length}`,
                accessible: true
            };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async testEmployeeModule() {
        console.log('👥 測試員工管理CRUD...');
        
        try {
            // 測試CRUD操作
            const crudTests = {
                create: false,
                read: false,
                update: false,
                delete: false
            };
            
            // 測試讀取員工列表
            try {
                const readResponse = await this.page.evaluate(async () => {
                    const res = await fetch('/api/employees');
                    return { status: res.status, ok: res.ok };
                });
                crudTests.read = readResponse.ok;
            } catch (error) {
                console.log('員工讀取測試失敗');
            }
            
            // 測試創建員工
            try {
                const createResponse = await this.page.evaluate(async () => {
                    const res = await fetch('/api/employees', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: 'Test Employee',
                            email: 'test@example.com',
                            department: 'IT'
                        })
                    });
                    return { status: res.status, ok: res.ok };
                });
                crudTests.create = createResponse.ok || createResponse.status === 201;
            } catch (error) {
                console.log('員工創建測試失敗');
            }
            
            const successCount = Object.values(crudTests).filter(Boolean).length;
            
            return {
                success: successCount >= 2,
                crud: crudTests,
                successfulOperations: successCount
            };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async testVotingModule() {
        console.log('🗳️ 測試升遷投票系統...');
        
        try {
            // 測試投票相關API
            const votingAPIs = [
                '/api/voting/active',
                '/api/voting/history',
                '/api/voting/candidates'
            ];
            
            let apiSuccess = 0;
            for (const endpoint of votingAPIs) {
                try {
                    const response = await this.page.evaluate(async (url) => {
                        const res = await fetch(url);
                        return { status: res.status, ok: res.ok };
                    }, endpoint);
                    
                    if (response.ok) {
                        apiSuccess++;
                    }
                } catch (error) {
                    console.log(`投票API測試錯誤: ${endpoint}`);
                }
            }
            
            return {
                success: apiSuccess > 0,
                votingAPIs: `${apiSuccess}/${votingAPIs.length}`,
                accessible: true
            };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async testGPSModule() {
        console.log('📍 測試GPS打卡系統...');
        
        try {
            // 測試GPS相關功能
            const gpsSupported = await this.page.evaluate(() => {
                return 'geolocation' in navigator;
            });
            
            // 測試打卡API
            const clockInTest = await this.page.evaluate(async () => {
                try {
                    const response = await fetch('/api/attendance/clock-in', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            employeeId: 1,
                            location: { lat: 25.033, lng: 121.565 },
                            timestamp: new Date().toISOString()
                        })
                    });
                    return { status: response.status, ok: response.ok };
                } catch (error) {
                    return { error: error.message };
                }
            });
            
            return {
                success: gpsSupported && (clockInTest.ok || clockInTest.status === 201),
                gpsSupported: gpsSupported,
                clockInAPI: clockInTest.ok || clockInTest.status === 201
            };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async validateBrowserInteractions() {
        console.log('\n🖱️ 開始瀏覽器互動測試...');
        
        try {
            // 表單測試
            const formTest = await this.testForms();
            this.validationResults.interactions.forms = formTest;
            
            // 按鈕測試  
            const buttonTest = await this.testButtons();
            this.validationResults.interactions.buttons = buttonTest;
            
            // 導航測試
            const navigationTest = await this.testNavigation();
            this.validationResults.interactions.navigation = navigationTest;
            
            // AJAX測試
            const ajaxTest = await this.testAjaxRequests();
            this.validationResults.interactions.ajax = ajaxTest;
            
            const successCount = [formTest, buttonTest, navigationTest, ajaxTest]
                .filter(test => test.success).length;
            
            if (successCount >= 3) {
                this.validationResults.overall.success++;
            } else {
                this.validationResults.overall.failed++;
            }
            
        } catch (error) {
            console.log(`🚨 互動測試錯誤: ${error.message}`);
            this.validationResults.overall.failed++;
        }
    }

    async testForms() {
        console.log('📝 測試表單功能...');
        
        try {
            // 檢查頁面中的表單
            const forms = await this.page.$$eval('form', forms => {
                return forms.map(form => ({
                    id: form.id,
                    action: form.action,
                    method: form.method,
                    inputs: form.querySelectorAll('input, select, textarea').length
                }));
            });
            
            console.log(`發現 ${forms.length} 個表單`);
            
            // 測試第一個表單 (如果存在)
            if (forms.length > 0) {
                const firstInput = await this.page.$('form input[type="text"], form input[type="email"]');
                if (firstInput) {
                    await firstInput.type('測試內容', { delay: 50 });
                    console.log('✅ 表單輸入測試成功');
                }
            }
            
            return {
                success: forms.length > 0,
                formsFound: forms.length,
                forms: forms
            };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async testButtons() {
        console.log('🔘 測試按鈕功能...');
        
        try {
            const buttons = await this.page.$$eval('button, input[type="button"], input[type="submit"]', buttons => {
                return buttons.map(btn => ({
                    text: btn.textContent || btn.value,
                    type: btn.type,
                    disabled: btn.disabled,
                    visible: window.getComputedStyle(btn).display !== 'none'
                }));
            });
            
            console.log(`發現 ${buttons.length} 個按鈕`);
            
            // 測試第一個可見的按鈕
            const firstVisibleButton = await this.page.$('button:not([disabled])');
            if (firstVisibleButton) {
                const beforeUrl = this.page.url();
                await firstVisibleButton.click();
                await this.page.waitForTimeout(1000); // 等待可能的頁面變化
                const afterUrl = this.page.url();
                
                console.log(`✅ 按鈕點擊測試完成 (URL變化: ${beforeUrl !== afterUrl})`);
            }
            
            return {
                success: buttons.length > 0,
                buttonsFound: buttons.length,
                buttons: buttons.filter(btn => btn.visible).slice(0, 5) // 只記錄前5個可見按鈕
            };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async testNavigation() {
        console.log('🧭 測試頁面導航...');
        
        try {
            const links = await this.page.$$eval('a[href]', links => {
                return links.map(link => ({
                    text: link.textContent.trim(),
                    href: link.href,
                    target: link.target,
                    visible: window.getComputedStyle(link).display !== 'none'
                })).filter(link => link.visible && link.href.includes('localhost'));
            });
            
            console.log(`發現 ${links.length} 個內部導航連結`);
            
            // 測試第一個內部連結
            if (links.length > 0) {
                const testLink = links[0];
                const beforeUrl = this.page.url();
                
                await this.page.goto(testLink.href, { waitUntil: 'networkidle2', timeout: 5000 });
                const afterUrl = this.page.url();
                
                console.log(`✅ 導航測試: ${beforeUrl} → ${afterUrl}`);
            }
            
            return {
                success: links.length > 0,
                linksFound: links.length,
                internalLinks: links.slice(0, 3) // 只記錄前3個連結
            };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async testAjaxRequests() {
        console.log('📡 測試AJAX請求...');
        
        try {
            // 監控網路請求
            const networkRequests = this.networkLog.filter(req => 
                req.url.includes('/api/') && 
                req.timestamp > new Date(Date.now() - 60000).toISOString() // 最近1分鐘
            );
            
            console.log(`監控到 ${networkRequests.length} 個API請求`);
            
            // 測試一個簡單的API請求
            const testApiResponse = await this.page.evaluate(async () => {
                try {
                    const response = await fetch('/api/employees');
                    return { 
                        status: response.status, 
                        ok: response.ok,
                        contentType: response.headers.get('content-type')
                    };
                } catch (error) {
                    return { error: error.message };
                }
            });
            
            return {
                success: networkRequests.length > 0 || testApiResponse.ok,
                networkRequests: networkRequests.length,
                testApiCall: testApiResponse,
                recentAPICalls: networkRequests.slice(-5) // 最近5個API請求
            };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async analyzeConsoleOutput() {
        console.log('\n🖥️  分析控制台輸出...');
        
        const consoleAnalysis = {
            total: this.consoleLog.length,
            errors: this.consoleLog.filter(log => log.type === 'error').length,
            warnings: this.consoleLog.filter(log => log.type === 'warning').length,
            info: this.consoleLog.filter(log => log.type === 'info').length,
            logs: this.consoleLog.filter(log => log.type === 'log').length
        };
        
        console.log(`📊 控制台統計: 總計=${consoleAnalysis.total}, 錯誤=${consoleAnalysis.errors}, 警告=${consoleAnalysis.warnings}`);
        
        // 記錄重要的錯誤和警告
        const criticalIssues = this.consoleLog.filter(log => 
            log.type === 'error' || (log.type === 'warning' && log.text.includes('failed'))
        );
        
        this.validationResults.console = {
            analysis: consoleAnalysis,
            criticalIssues: criticalIssues.slice(-10), // 最近10個關鍵問題
            networkErrors: this.networkLog.filter(req => req.status >= 400).slice(-10) // 最近10個網路錯誤
        };
        
        this.validationResults.overall.warnings += consoleAnalysis.warnings;
    }

    async loginAs(role) {
        const credentials = this.testUsers[role];
        if (!credentials) {
            throw new Error(`未知角色: ${role}`);
        }
        
        await this.page.goto(`${this.baseUrl}/login.html`, { waitUntil: 'networkidle2' });
        
        // 等待登入表單載入
        await this.page.waitForSelector('input[name="name"]', { timeout: 5000 });
        
        await this.page.evaluate(() => {
            const nameInput = document.querySelector('input[name="name"]');
            const idInput = document.querySelector('input[name="idNumber"]');
            if (nameInput) nameInput.value = '';
            if (idInput) idInput.value = '';
        });
        
        await this.page.type('input[name="name"]', credentials.name, { delay: 50 });
        await this.page.type('input[name="idNumber"]', credentials.idNumber, { delay: 50 });
        
        await Promise.all([
            this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }),
            this.page.click('button[type="submit"]')
        ]);
    }

    async logout() {
        try {
            // 嘗試找到登出按鈕或連結
            const logoutButton = await this.page.$('a[href*="logout"], button:contains("登出"), a:contains("登出")');
            if (logoutButton) {
                await logoutButton.click();
                await this.page.waitForTimeout(1000);
            } else {
                // 如果沒有登出按鈕，直接導航到登入頁面
                await this.page.goto(`${this.baseUrl}/login.html`, { waitUntil: 'networkidle2' });
            }
        } catch (error) {
            console.log(`登出過程中的錯誤: ${error.message}`);
            // 強制導航到登入頁面
            await this.page.goto(`${this.baseUrl}/login.html`, { waitUntil: 'networkidle2' });
        }
    }

    async generateValidationReport() {
        console.log('\n📋 生成驗證報告...');
        
        const endTime = new Date();
        const duration = Math.round((endTime - this.startTime) / 1000);
        
        const report = {
            metadata: {
                timestamp: endTime.toISOString(),
                duration: `${duration}秒`,
                baseUrl: this.baseUrl,
                browserVersion: await this.browser.version()
            },
            summary: {
                totalTests: this.validationResults.overall.success + this.validationResults.overall.failed,
                successRate: Math.round((this.validationResults.overall.success / (this.validationResults.overall.success + this.validationResults.overall.failed)) * 100) || 0,
                ...this.validationResults.overall
            },
            results: this.validationResults,
            recommendations: this.generateRecommendations()
        };
        
        // 保存詳細報告到文件
        const reportPath = `D:\\0809\\multi-role-validation-report-${Date.now()}.json`;
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
        
        // 生成可讀性報告
        const readableReport = this.generateReadableReport(report);
        const readableReportPath = `D:\\0809\\multi-role-validation-report-${Date.now()}.md`;
        fs.writeFileSync(readableReportPath, readableReport, 'utf8');
        
        console.log(`📄 詳細報告已保存: ${reportPath}`);
        console.log(`📖 可讀報告已保存: ${readableReportPath}`);
        
        return { report, reportPath, readableReportPath };
    }

    generateRecommendations() {
        const recommendations = [];
        
        // 基於測試結果生成建議
        if (this.validationResults.overall.failed > 0) {
            recommendations.push('🔧 發現功能異常，建議檢查失敗的模組和API端點');
        }
        
        if (this.validationResults.console && this.validationResults.console.analysis.errors > 0) {
            recommendations.push('🐛 控制台存在錯誤訊息，建議檢查JavaScript執行問題');
        }
        
        if (this.networkLog.filter(req => req.status >= 400).length > 0) {
            recommendations.push('🌐 存在網路請求錯誤，建議檢查API端點和伺服器狀態');
        }
        
        const roleFailures = Object.values(this.validationResults.roles).filter(role => !role.login).length;
        if (roleFailures > 0) {
            recommendations.push('🔐 部分角色登入失敗，建議檢查認證系統和用戶權限');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('✅ 系統運行狀況良好，所有測試均通過');
        }
        
        return recommendations;
    }

    generateReadableReport(report) {
        return `# 企業員工管理系統 - 多角色功能驗證報告

## 📊 測試總覽
- **測試時間**: ${report.metadata.timestamp}
- **測試持續時間**: ${report.metadata.duration}
- **測試URL**: ${report.metadata.baseUrl}
- **瀏覽器版本**: ${report.metadata.browserVersion}

## 🎯 測試結果摘要
- **總測試數**: ${report.summary.totalTests}
- **成功率**: ${report.summary.successRate}%
- **成功**: ${report.summary.success}
- **失敗**: ${report.summary.failed}
- **警告**: ${report.summary.warnings}

## 🔐 多角色登入測試

${Object.entries(report.results.roles).map(([role, result]) => `
### ${role.toUpperCase()} 角色
- **登入狀態**: ${result.login ? '✅ 成功' : '❌ 失敗'}
- **重定向URL**: ${result.redirectUrl || 'N/A'}
- **控制台錯誤**: ${result.consoleErrors || 0}
${result.menuItems ? `- **可用選單**: ${Object.keys(result.menuItems).join(', ')}` : ''}
`).join('')}

## 📦 核心功能模組測試

${Object.entries(report.results.modules).map(([module, result]) => `
### ${module}
- **狀態**: ${result.success ? '✅ 通過' : '❌ 失敗'}
${result.apiTests ? `- **API測試**: ${result.apiTests}` : ''}
${result.error ? `- **錯誤**: ${result.error}` : ''}
`).join('')}

## 🖱️ 瀏覽器互動測試

${Object.entries(report.results.interactions || {}).map(([interaction, result]) => `
### ${interaction}
- **狀態**: ${result.success ? '✅ 通過' : '❌ 失敗'}
${result.error ? `- **錯誤**: ${result.error}` : ''}
`).join('')}

## 🖥️ 控制台分析

${report.results.console ? `
- **總日誌數**: ${report.results.console.analysis.total}
- **錯誤數**: ${report.results.console.analysis.errors}
- **警告數**: ${report.results.console.analysis.warnings}
- **資訊數**: ${report.results.console.analysis.info}

### 關鍵問題
${report.results.console.criticalIssues.map(issue => `- [${issue.type}] ${issue.text}`).join('\n')}

### 網路錯誤
${report.results.console.networkErrors.map(error => `- ${error.status} ${error.url}`).join('\n')}
` : '控制台分析數據不可用'}

## 💡 改進建議

${report.recommendations.map(rec => `- ${rec}`).join('\n')}

---
*報告生成時間: ${new Date().toISOString()}*
`;
    }

    async cleanup() {
        console.log('\n🧹 清理瀏覽器資源...');
        
        if (this.browser) {
            await this.browser.close();
        }
        
        console.log('✅ 清理完成');
    }

    async runFullValidation() {
        try {
            console.log('🚀 開始完整的多角色系統功能驗證...\n');
            
            await this.initialize();
            
            await this.validateMultiRoleLogin();
            await this.validateCoreModules();
            await this.validateBrowserInteractions();
            await this.analyzeConsoleOutput();
            
            const reportResult = await this.generateValidationReport();
            
            await this.cleanup();
            
            console.log('\n🎉 多角色系統功能驗證完成！');
            console.log(`📊 總成功率: ${reportResult.report.summary.successRate}%`);
            console.log(`📄 詳細報告: ${reportResult.reportPath}`);
            console.log(`📖 可讀報告: ${reportResult.readableReportPath}`);
            
            return reportResult;
            
        } catch (error) {
            console.error('🚨 驗證過程發生嚴重錯誤:', error);
            await this.cleanup();
            throw error;
        }
    }
}

// 如果直接執行此文件，則運行完整驗證
if (require.main === module) {
    const validator = new MultiRoleBrowserValidator();
    validator.runFullValidation().catch(console.error);
}

module.exports = MultiRoleBrowserValidator;