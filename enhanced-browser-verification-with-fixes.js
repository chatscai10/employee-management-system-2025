/**
 * 增強版智慧瀏覽器驗證系統 v2.2
 * 根據初始測試結果進行優化和修復
 * 
 * 主要改進：
 * 1. 動態探測頁面結構和路由
 * 2. 智能表單元素識別
 * 3. 更好的錯誤處理和回退機制
 * 4. 深度業務邏輯驗證
 * 5. 實時問題修復建議
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

class EnhancedBrowserVerificationWithFixes {
    constructor(options = {}) {
        this.baseUrl = options.baseUrl || 'https://employee-management-system-production-4361.up.railway.app';
        this.screenshotPath = options.screenshotPath || 'D:\\0809\\enhanced-test-screenshots';
        this.reportPath = options.reportPath || 'D:\\0809';
        this.testResults = {
            siteStructureAnalysis: {},
            realRoutesDiscovered: {},
            enhancedBusinessLogic: {},
            deepSecurityAnalysis: {},
            intelligentRecommendations: {},
            summary: {
                totalTests: 0,
                passed: 0,
                failed: 0,
                warnings: 0,
                critical: 0,
                startTime: null,
                endTime: null,
                duration: null
            }
        };
        this.discoveredRoutes = new Set();
        this.workingRoutes = new Set();
        this.formElements = new Map();
        this.browser = null;
        this.page = null;
    }

    /**
     * 初始化增強版驗證系統
     */
    async initialize() {
        console.log('🚀 初始化增強版智慧瀏覽器驗證系統...');
        
        try {
            await fs.mkdir(this.screenshotPath, { recursive: true });
            
            this.browser = await puppeteer.launch({
                headless: false,
                defaultViewport: null,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                    '--disable-gpu',
                    '--disable-web-security',
                    '--allow-running-insecure-content'
                ]
            });

            this.page = await this.browser.newPage();
            await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
            await this.page.setViewport({ width: 1920, height: 1080 });
            
            // 設置更詳細的錯誤監聽
            this.page.on('pageerror', error => {
                console.warn('📄 頁面錯誤:', error.message);
            });

            this.page.on('requestfailed', request => {
                console.warn('🚫 請求失敗:', request.url(), request.failure().errorText);
            });

            this.testResults.summary.startTime = new Date().toISOString();
            console.log('✅ 增強版驗證系統初始化完成');
            
        } catch (error) {
            console.error('❌ 初始化失敗:', error.message);
            throw error;
        }
    }

    /**
     * 動態探測網站結構和可用路由
     */
    async discoverSiteStructure() {
        console.log('\n🔍 開始動態探測網站結構...');
        
        try {
            // 首先測試主頁
            console.log('🌐 分析主頁結構...');
            await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });
            await this.takeScreenshot('site-structure-homepage');
            
            const homepageAnalysis = await this.analyzePageStructure();
            this.testResults.siteStructureAnalysis.homepage = homepageAnalysis;
            
            // 探測可能的路由
            const potentialRoutes = [
                '/',
                '/login',
                '/login.html',
                '/admin',
                '/admin.html',
                '/employee',
                '/employee.html',
                '/attendance',
                '/attendance.html',
                '/revenue',
                '/revenue.html',
                '/dashboard',
                '/dashboard.html',
                '/register',
                '/register.html',
                '/profile',
                '/profile.html',
                '/reports',
                '/reports.html',
                '/index.html',
                '/employee-dashboard.html'
            ];

            console.log('🛣️ 探測可用路由...');
            for (const route of potentialRoutes) {
                const fullUrl = route.startsWith('http') ? route : `${this.baseUrl}${route}`;
                
                try {
                    const response = await this.page.goto(fullUrl, { 
                        waitUntil: 'networkidle0', 
                        timeout: 15000 
                    });
                    
                    if (response && response.ok()) {
                        this.discoveredRoutes.add(route);
                        this.workingRoutes.add(fullUrl);
                        
                        const pageAnalysis = await this.analyzePageStructure();
                        this.testResults.realRoutesDiscovered[route] = {
                            url: fullUrl,
                            status: 'working',
                            analysis: pageAnalysis,
                            statusCode: response.status()
                        };
                        
                        console.log(`✅ 發現可用路由: ${route}`);
                        await this.takeScreenshot(`route-discovery-${route.replace(/[\\\/]/g, '-')}`);
                    }
                    
                } catch (error) {
                    this.testResults.realRoutesDiscovered[route] = {
                        url: fullUrl,
                        status: 'not_working',
                        error: error.message
                    };
                    console.log(`❌ 路由無法訪問: ${route} - ${error.message}`);
                }
            }

            console.log(`📊 探測完成: 發現 ${this.workingRoutes.size} 個可用路由`);
            
            return this.testResults.siteStructureAnalysis;
            
        } catch (error) {
            console.error('❌ 網站結構探測失敗:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 分析頁面結構
     */
    async analyzePageStructure() {
        try {
            const analysis = await this.page.evaluate(() => {
                const structure = {
                    title: document.title,
                    url: window.location.href,
                    hasContent: document.body.children.length > 0,
                    contentLength: document.body.innerHTML.length
                };

                // 分析表單元素
                structure.forms = Array.from(document.forms).map((form, index) => ({
                    id: form.id || `form-${index}`,
                    action: form.action,
                    method: form.method,
                    elements: Array.from(form.elements).map(el => ({
                        name: el.name,
                        type: el.type,
                        id: el.id,
                        required: el.required,
                        placeholder: el.placeholder
                    }))
                }));

                // 分析按鈕
                structure.buttons = Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"]'))
                    .map(btn => ({
                        text: btn.textContent?.trim() || btn.value || '',
                        id: btn.id,
                        className: btn.className,
                        onclick: btn.onclick ? 'has_handler' : 'no_handler'
                    }));

                // 分析連結
                structure.links = Array.from(document.querySelectorAll('a[href]'))
                    .map(link => ({
                        href: link.href,
                        text: link.textContent?.trim(),
                        isInternal: link.href.includes(window.location.hostname)
                    }));

                // 檢查JavaScript錯誤
                structure.hasJSErrors = window.jsErrors && window.jsErrors.length > 0;
                
                // 檢查是否為單頁應用
                structure.isSPA = !!window.history.pushState && 
                                  (document.querySelectorAll('[data-route], [router-link], .route').length > 0 ||
                                   document.body.innerHTML.includes('router') ||
                                   document.body.innerHTML.includes('angular') ||
                                   document.body.innerHTML.includes('react') ||
                                   document.body.innerHTML.includes('vue'));

                return structure;
            });

            return analysis;
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 智能表單探測和測試
     */
    async intelligentFormTesting() {
        console.log('\n📋 開始智能表單探測和測試...');
        
        const formTests = {};
        
        // 遍歷所有發現的路由
        for (const routeUrl of this.workingRoutes) {
            try {
                console.log(`🔍 分析頁面表單: ${routeUrl}`);
                await this.page.goto(routeUrl, { waitUntil: 'networkidle2', timeout: 15000 });
                
                const pageStructure = await this.analyzePageStructure();
                
                if (pageStructure.forms && pageStructure.forms.length > 0) {
                    console.log(`📝 發現 ${pageStructure.forms.length} 個表單`);
                    
                    for (const formInfo of pageStructure.forms) {
                        const formTest = await this.testFormFunctionality(formInfo, routeUrl);
                        formTests[`${routeUrl}-${formInfo.id}`] = formTest;
                    }
                }
                
            } catch (error) {
                console.warn(`⚠️ 分析頁面失敗 ${routeUrl}:`, error.message);
            }
        }

        this.testResults.enhancedBusinessLogic.formTesting = formTests;
        return formTests;
    }

    /**
     * 測試表單功能
     */
    async testFormFunctionality(formInfo, pageUrl) {
        console.log(`🧪 測試表單功能: ${formInfo.id} at ${pageUrl}`);
        
        try {
            const testResult = {
                formId: formInfo.id,
                pageUrl: pageUrl,
                tests: {}
            };

            // 測試表單驗證
            if (formInfo.elements.length > 0) {
                // 嘗試提交空白表單
                try {
                    const submitBtn = await this.page.$('button[type="submit"], input[type="submit"]');
                    if (submitBtn) {
                        await submitBtn.click();
                        await this.page.waitForTimeout(2000);
                        
                        // 檢查驗證訊息
                        const validationMessages = await this.page.$$eval(
                            'input:invalid, .error, .is-invalid, .field-error, [class*="error"]',
                            elements => elements.map(el => el.textContent || el.validationMessage)
                        );
                        
                        testResult.tests.emptyFormValidation = {
                            hasValidation: validationMessages.length > 0,
                            messages: validationMessages,
                            status: validationMessages.length > 0 ? 'passed' : 'failed'
                        };
                        
                        await this.takeScreenshot(`form-validation-${formInfo.id.replace(/[^a-zA-Z0-9]/g, '-')}`);
                    }
                } catch (error) {
                    testResult.tests.emptyFormValidation = {
                        error: error.message,
                        status: 'failed'
                    };
                }

                // 測試登入表單（如果是登入表單）
                if (this.isLoginForm(formInfo)) {
                    testResult.tests.loginTest = await this.testLoginForm(formInfo);
                }

                // 測試其他業務表單
                if (this.isAttendanceForm(formInfo)) {
                    testResult.tests.attendanceTest = await this.testAttendanceForm(formInfo);
                }
            }

            return testResult;
            
        } catch (error) {
            return {
                formId: formInfo.id,
                pageUrl: pageUrl,
                error: error.message,
                status: 'failed'
            };
        }
    }

    /**
     * 判斷是否為登入表單
     */
    isLoginForm(formInfo) {
        const formContent = JSON.stringify(formInfo).toLowerCase();
        return formContent.includes('password') || 
               formContent.includes('login') || 
               formContent.includes('username') || 
               formContent.includes('email');
    }

    /**
     * 判斷是否為出勤表單
     */
    isAttendanceForm(formInfo) {
        const formContent = JSON.stringify(formInfo).toLowerCase();
        return formContent.includes('attendance') || 
               formContent.includes('clock') || 
               formContent.includes('checkin') || 
               formContent.includes('checkout');
    }

    /**
     * 測試登入表單
     */
    async testLoginForm(formInfo) {
        console.log('🔐 執行登入表單測試...');
        
        try {
            const testUsers = [
                { username: 'admin', password: 'admin123', role: 'admin' },
                { username: 'test', password: 'test123', role: 'user' },
                { username: 'manager', password: 'manager123', role: 'manager' }
            ];

            const loginResults = {};

            for (const user of testUsers) {
                try {
                    // 尋找用戶名和密碼輸入框
                    const usernameInput = await this.findInputByType(['username', 'email', 'user', 'login']);
                    const passwordInput = await this.findInputByType(['password', 'pass']);

                    if (usernameInput && passwordInput) {
                        // 清空並填入測試數據
                        await this.page.evaluate(() => {
                            document.querySelectorAll('input').forEach(input => input.value = '');
                        });

                        await usernameInput.type(user.username);
                        await passwordInput.type(user.password);

                        await this.takeScreenshot(`login-test-${user.role}-filled`);

                        // 提交表單
                        const submitBtn = await this.page.$('button[type="submit"], input[type="submit"]');
                        if (submitBtn) {
                            await submitBtn.click();
                            await this.page.waitForTimeout(3000);

                            const currentUrl = this.page.url();
                            const isSuccessful = !currentUrl.includes('login') || 
                                                currentUrl.includes('dashboard') || 
                                                currentUrl.includes('admin') || 
                                                currentUrl.includes('employee');

                            loginResults[user.role] = {
                                attempted: true,
                                successful: isSuccessful,
                                resultUrl: currentUrl,
                                status: isSuccessful ? 'passed' : 'failed'
                            };

                            await this.takeScreenshot(`login-test-${user.role}-result`);

                            // 如果登入成功，嘗試登出
                            if (isSuccessful) {
                                await this.attemptLogout();
                            }
                        }
                    } else {
                        loginResults[user.role] = {
                            attempted: false,
                            error: '找不到登入表單元素',
                            status: 'failed'
                        };
                    }

                } catch (error) {
                    loginResults[user.role] = {
                        attempted: false,
                        error: error.message,
                        status: 'failed'
                    };
                }
            }

            return {
                testType: 'login',
                results: loginResults,
                status: Object.values(loginResults).some(r => r.status === 'passed') ? 'passed' : 'failed'
            };

        } catch (error) {
            return {
                testType: 'login',
                error: error.message,
                status: 'failed'
            };
        }
    }

    /**
     * 測試出勤表單
     */
    async testAttendanceForm(formInfo) {
        console.log('⏰ 執行出勤表單測試...');
        
        try {
            // 尋找出勤相關按鈕
            const clockInBtn = await this.page.$('button[onclick*="clockIn"], .clock-in, #clockIn, [data-action="clockin"]');
            const clockOutBtn = await this.page.$('button[onclick*="clockOut"], .clock-out, #clockOut, [data-action="checkout"]');

            const attendanceTest = {
                testType: 'attendance',
                tests: {}
            };

            // 測試打卡上班
            if (clockInBtn) {
                try {
                    await clockInBtn.click();
                    await this.page.waitForTimeout(2000);
                    
                    attendanceTest.tests.clockIn = {
                        buttonFound: true,
                        clicked: true,
                        status: 'passed'
                    };
                    
                    await this.takeScreenshot('attendance-clock-in-test');
                } catch (error) {
                    attendanceTest.tests.clockIn = {
                        buttonFound: true,
                        clicked: false,
                        error: error.message,
                        status: 'failed'
                    };
                }
            } else {
                attendanceTest.tests.clockIn = {
                    buttonFound: false,
                    status: 'warning'
                };
            }

            // 測試打卡下班
            if (clockOutBtn) {
                try {
                    await clockOutBtn.click();
                    await this.page.waitForTimeout(2000);
                    
                    attendanceTest.tests.clockOut = {
                        buttonFound: true,
                        clicked: true,
                        status: 'passed'
                    };
                    
                    await this.takeScreenshot('attendance-clock-out-test');
                } catch (error) {
                    attendanceTest.tests.clockOut = {
                        buttonFound: true,
                        clicked: false,
                        error: error.message,
                        status: 'failed'
                    };
                }
            } else {
                attendanceTest.tests.clockOut = {
                    buttonFound: false,
                    status: 'warning'
                };
            }

            return attendanceTest;

        } catch (error) {
            return {
                testType: 'attendance',
                error: error.message,
                status: 'failed'
            };
        }
    }

    /**
     * 根據類型尋找輸入框
     */
    async findInputByType(possibleNames) {
        for (const name of possibleNames) {
            const selectors = [
                `input[name*="${name}"]`,
                `input[id*="${name}"]`,
                `input[placeholder*="${name}"]`,
                `#${name}`,
                `.${name}`,
                `input[type="${name}"]`
            ];

            for (const selector of selectors) {
                try {
                    const element = await this.page.$(selector);
                    if (element) {
                        return element;
                    }
                } catch (error) {
                    continue;
                }
            }
        }
        return null;
    }

    /**
     * 嘗試登出
     */
    async attemptLogout() {
        const logoutSelectors = [
            'a[href*="logout"]',
            'button[onclick*="logout"]',
            '#logout',
            '.logout',
            '[data-action="logout"]'
        ];

        for (const selector of logoutSelectors) {
            try {
                const element = await this.page.$(selector);
                if (element) {
                    await element.click();
                    await this.page.waitForTimeout(2000);
                    return true;
                }
            } catch (error) {
                continue;
            }
        }

        // 如果找不到登出按鈕，嘗試導航回登入頁面
        try {
            for (const route of this.workingRoutes) {
                if (route.includes('login')) {
                    await this.page.goto(route, { waitUntil: 'networkidle2' });
                    return true;
                }
            }
        } catch (error) {
            console.warn('⚠️ 自動登出失敗');
        }

        return false;
    }

    /**
     * 深度安全性分析
     */
    async performDeepSecurityAnalysis() {
        console.log('\n🔒 開始深度安全性分析...');
        
        const securityTests = {
            httpsValidation: await this.testHttpsConfiguration(),
            headerSecurity: await this.testSecurityHeaders(),
            inputValidation: await this.testInputValidation(),
            sessionSecurity: await this.testSessionSecurity(),
            apiSecurity: await this.testApiEndpointSecurity()
        };

        this.testResults.deepSecurityAnalysis = securityTests;
        return securityTests;
    }

    /**
     * 測試 HTTPS 設定
     */
    async testHttpsConfiguration() {
        console.log('🔐 測試 HTTPS 設定...');
        
        try {
            const isHttps = this.baseUrl.startsWith('https://');
            
            if (isHttps) {
                // 測試 HTTP 重定向
                try {
                    const httpUrl = this.baseUrl.replace('https://', 'http://');
                    const response = await axios.get(httpUrl, {
                        maxRedirects: 0,
                        validateStatus: () => true,
                        timeout: 10000
                    });

                    return {
                        isHttps: true,
                        httpRedirectsToHttps: response.status >= 300 && response.status < 400,
                        status: response.status >= 300 && response.status < 400 ? 'passed' : 'warning'
                    };
                } catch (error) {
                    return {
                        isHttps: true,
                        httpRedirectsToHttps: false,
                        error: error.message,
                        status: 'warning'
                    };
                }
            } else {
                return {
                    isHttps: false,
                    status: 'critical',
                    recommendation: '建議啟用 HTTPS 以確保資料安全'
                };
            }
            
        } catch (error) {
            return {
                error: error.message,
                status: 'failed'
            };
        }
    }

    /**
     * 測試安全標頭
     */
    async testSecurityHeaders() {
        console.log('🛡️ 測試安全標頭...');
        
        try {
            const response = await axios.get(this.baseUrl, { timeout: 10000 });
            const headers = response.headers;

            const securityHeaders = {
                'x-frame-options': headers['x-frame-options'],
                'x-content-type-options': headers['x-content-type-options'],
                'x-xss-protection': headers['x-xss-protection'],
                'strict-transport-security': headers['strict-transport-security'],
                'content-security-policy': headers['content-security-policy'],
                'referrer-policy': headers['referrer-policy']
            };

            const hasSecurityHeaders = Object.values(securityHeaders).some(header => header !== undefined);
            const criticalHeadersMissing = !securityHeaders['x-frame-options'] || !securityHeaders['x-content-type-options'];

            return {
                headers: securityHeaders,
                hasSecurityHeaders: hasSecurityHeaders,
                criticalHeadersMissing: criticalHeadersMissing,
                status: hasSecurityHeaders && !criticalHeadersMissing ? 'passed' : 'warning',
                recommendations: this.generateSecurityHeaderRecommendations(securityHeaders)
            };

        } catch (error) {
            return {
                error: error.message,
                status: 'failed'
            };
        }
    }

    /**
     * 測試輸入驗證
     */
    async testInputValidation() {
        console.log('✅ 測試輸入驗證...');
        
        const maliciousInputs = [
            '<script>alert("XSS")</script>',
            '\'; DROP TABLE users; --',
            '../../../etc/passwd',
            '${7*7}',
            'javascript:alert(1)'
        ];

        const validationTests = {};

        // 在所有發現的表單上測試惡意輸入
        for (const routeUrl of this.workingRoutes) {
            try {
                await this.page.goto(routeUrl, { waitUntil: 'networkidle2' });
                
                const inputs = await this.page.$$('input[type="text"], input[type="email"], textarea');
                
                if (inputs.length > 0) {
                    for (const [index, maliciousInput] of maliciousInputs.entries()) {
                        try {
                            const input = inputs[0]; // 使用第一個輸入框
                            await input.click();
                            await input.clear();
                            await input.type(maliciousInput);
                            
                            // 檢查輸入是否被過濾或轉義
                            const inputValue = await input.evaluate(el => el.value);
                            const isFiltered = inputValue !== maliciousInput;
                            
                            validationTests[`${routeUrl}-payload-${index}`] = {
                                payload: maliciousInput,
                                inputFiltered: isFiltered,
                                actualValue: inputValue,
                                status: isFiltered ? 'passed' : 'critical'
                            };

                        } catch (error) {
                            validationTests[`${routeUrl}-payload-${index}`] = {
                                payload: maliciousInput,
                                error: error.message,
                                status: 'failed'
                            };
                        }
                    }
                }

            } catch (error) {
                console.warn(`⚠️ 無法測試輸入驗證 ${routeUrl}:`, error.message);
            }
        }

        return {
            tests: validationTests,
            status: Object.values(validationTests).every(test => test.status === 'passed') ? 'passed' : 'critical'
        };
    }

    /**
     * 測試會話安全性
     */
    async testSessionSecurity() {
        console.log('🔑 測試會話安全性...');
        
        try {
            // 檢查 Cookie 設定
            const cookies = await this.page.cookies();
            
            const cookieAnalysis = cookies.map(cookie => ({
                name: cookie.name,
                secure: cookie.secure,
                httpOnly: cookie.httpOnly,
                sameSite: cookie.sameSite,
                hasSecureAttributes: cookie.secure && cookie.httpOnly
            }));

            const hasSecureCookies = cookieAnalysis.some(cookie => cookie.hasSecureAttributes);

            return {
                cookies: cookieAnalysis,
                hasSecureCookies: hasSecureCookies,
                status: hasSecureCookies ? 'passed' : 'warning',
                recommendations: hasSecureCookies ? [] : ['建議設定 Cookie 的 Secure 和 HttpOnly 屬性']
            };

        } catch (error) {
            return {
                error: error.message,
                status: 'failed'
            };
        }
    }

    /**
     * 測試 API 端點安全性
     */
    async testApiEndpointSecurity() {
        console.log('🔌 測試 API 端點安全性...');
        
        const apiEndpoints = [
            '/api/auth/login',
            '/api/users',
            '/api/employees',
            '/api/attendance',
            '/api/revenue',
            '/api/admin',
            '/api/config',
            '/api/backup'
        ];

        const apiTests = {};

        for (const endpoint of apiEndpoints) {
            try {
                const fullUrl = `${this.baseUrl}${endpoint}`;
                
                // 測試未授權存取
                const unauthorizedResponse = await axios.get(fullUrl, {
                    timeout: 5000,
                    validateStatus: () => true
                });

                apiTests[endpoint] = {
                    url: fullUrl,
                    unauthorizedStatus: unauthorizedResponse.status,
                    hasAuthProtection: unauthorizedResponse.status === 401 || unauthorizedResponse.status === 403,
                    status: (unauthorizedResponse.status === 401 || unauthorizedResponse.status === 403) ? 'passed' : 'warning'
                };

            } catch (error) {
                apiTests[endpoint] = {
                    url: `${this.baseUrl}${endpoint}`,
                    error: error.message,
                    status: 'failed'
                };
            }
        }

        return {
            endpoints: apiTests,
            status: Object.values(apiTests).every(test => test.status === 'passed') ? 'passed' : 'warning'
        };
    }

    /**
     * 生成安全標頭建議
     */
    generateSecurityHeaderRecommendations(headers) {
        const recommendations = [];

        if (!headers['x-frame-options']) {
            recommendations.push('建議添加 X-Frame-Options 標頭以防止點擊劫持攻擊');
        }

        if (!headers['x-content-type-options']) {
            recommendations.push('建議添加 X-Content-Type-Options: nosniff 標頭');
        }

        if (!headers['x-xss-protection']) {
            recommendations.push('建議添加 X-XSS-Protection 標頭');
        }

        if (!headers['strict-transport-security']) {
            recommendations.push('建議添加 Strict-Transport-Security 標頭強制使用 HTTPS');
        }

        if (!headers['content-security-policy']) {
            recommendations.push('建議實施 Content Security Policy (CSP) 以防止 XSS 攻擊');
        }

        return recommendations;
    }

    /**
     * 生成智能改進建議
     */
    async generateIntelligentRecommendations() {
        console.log('\n💡 生成智能改進建議...');
        
        const recommendations = {
            critical: [],
            high: [],
            medium: [],
            low: [],
            enhancements: []
        };

        // 基於發現的路由生成建議
        if (this.workingRoutes.size < 3) {
            recommendations.high.push({
                category: 'Route Coverage',
                issue: '發現的可用路由較少',
                recommendation: '建議檢查路由配置，確保所有功能頁面都可正確訪問',
                impact: 'high'
            });
        }

        // 基於表單測試結果生成建議
        const formTests = this.testResults.enhancedBusinessLogic.formTesting || {};
        const failedFormTests = Object.values(formTests).filter(test => 
            test.tests && Object.values(test.tests).some(t => t.status === 'failed')
        );

        if (failedFormTests.length > 0) {
            recommendations.critical.push({
                category: 'Form Functionality',
                issue: '部分表單功能測試失敗',
                recommendation: '建議檢查表單驗證邏輯和提交處理',
                impact: 'critical',
                affectedForms: failedFormTests.map(test => test.formId)
            });
        }

        // 基於安全性測試生成建議
        const securityTests = this.testResults.deepSecurityAnalysis || {};
        if (securityTests.httpsValidation && securityTests.httpsValidation.status === 'critical') {
            recommendations.critical.push({
                category: 'Security',
                issue: '未使用 HTTPS 協議',
                recommendation: '立即啟用 HTTPS 以保護用戶數據傳輸安全',
                impact: 'critical'
            });
        }

        if (securityTests.headerSecurity && securityTests.headerSecurity.criticalHeadersMissing) {
            recommendations.high.push({
                category: 'Security Headers',
                issue: '缺少重要的安全標頭',
                recommendation: securityTests.headerSecurity.recommendations,
                impact: 'high'
            });
        }

        // 基於效能分析生成建議
        if (this.testResults.siteStructureAnalysis.homepage && 
            this.testResults.siteStructureAnalysis.homepage.contentLength > 100000) {
            recommendations.medium.push({
                category: 'Performance',
                issue: '頁面內容較大',
                recommendation: '建議優化頁面內容，考慮使用壓縮或延遲載入',
                impact: 'medium'
            });
        }

        // 增強功能建議
        recommendations.enhancements.push({
            category: 'User Experience',
            suggestion: '建議添加載入指示器提升用戶體驗',
            implementation: '在表單提交和頁面載入時顯示載入動畫'
        });

        recommendations.enhancements.push({
            category: 'Monitoring',
            suggestion: '建議實施錯誤監控和日誌記錄',
            implementation: '集成錯誤追蹤工具如 Sentry 或實施自定義日誌系統'
        });

        this.testResults.intelligentRecommendations = recommendations;
        return recommendations;
    }

    /**
     * 截圖功能
     */
    async takeScreenshot(name) {
        try {
            const timestamp = Date.now();
            const filename = `${name}-${timestamp}.png`;
            const filepath = path.join(this.screenshotPath, filename);
            
            await this.page.screenshot({
                path: filepath,
                fullPage: true
            });
            
            console.log(`📸 截圖已保存: ${filename}`);
            return filepath;
        } catch (error) {
            console.warn(`📸 截圖失敗 ${name}:`, error.message);
            return null;
        }
    }

    /**
     * 生成增強版測試報告
     */
    async generateEnhancedReport() {
        console.log('\n📊 生成增強版測試報告...');
        
        this.testResults.summary.endTime = new Date().toISOString();
        const startTime = new Date(this.testResults.summary.startTime);
        const endTime = new Date(this.testResults.summary.endTime);
        this.testResults.summary.duration = `${Math.round((endTime - startTime) / 1000)} 秒`;

        // 統計各類問題
        const recommendations = this.testResults.intelligentRecommendations || {};
        this.testResults.summary.critical = (recommendations.critical || []).length;
        this.testResults.summary.warnings = (recommendations.high || []).length + (recommendations.medium || []).length;

        // 生成詳細報告
        const markdownReport = this.generateEnhancedMarkdownReport();
        const timestamp = Date.now();
        
        const jsonReportPath = path.join(this.reportPath, `enhanced-verification-report-${timestamp}.json`);
        const mdReportPath = path.join(this.reportPath, `enhanced-verification-report-${timestamp}.md`);
        
        await fs.writeFile(jsonReportPath, JSON.stringify(this.testResults, null, 2), 'utf8');
        await fs.writeFile(mdReportPath, markdownReport, 'utf8');

        console.log(`📋 增強版 JSON 報告: ${jsonReportPath}`);
        console.log(`📋 增強版 Markdown 報告: ${mdReportPath}`);

        return {
            jsonReport: jsonReportPath,
            markdownReport: mdReportPath,
            summary: this.testResults.summary,
            recommendations: this.testResults.intelligentRecommendations
        };
    }

    /**
     * 生成增強版 Markdown 報告
     */
    generateEnhancedMarkdownReport() {
        const { summary, siteStructureAnalysis, realRoutesDiscovered, enhancedBusinessLogic, deepSecurityAnalysis, intelligentRecommendations } = this.testResults;
        
        return `# 企業員工管理系統 - 增強版智慧瀏覽器驗證報告

## 📊 執行摘要

- **測試開始時間**: ${summary.startTime}
- **測試結束時間**: ${summary.endTime}
- **測試持續時間**: ${summary.duration}
- **系統URL**: ${this.baseUrl}
- **發現的可用路由**: ${this.workingRoutes.size} 個
- **關鍵問題**: ${summary.critical} 個
- **警告問題**: ${summary.warnings} 個

## 🎯 整體健康度評估

${summary.critical === 0 && summary.warnings <= 2 ? 
  '🟢 **系統健康狀況良好** - 可以安全運行' : 
  summary.critical > 0 ? 
  '🔴 **發現嚴重問題** - 需要立即處理' : 
  '🟡 **存在一些問題** - 建議儘快改善'}

---

## 🔍 網站結構探測結果

### 發現的可用路由
${Array.from(this.workingRoutes).map(route => `- ✅ \`${route}\``).join('\n')}

### 失效的路由
${Object.entries(realRoutesDiscovered).filter(([route, info]) => info.status === 'not_working')
  .map(([route, info]) => `- ❌ \`${route}\` - ${info.error}`).join('\n')}

---

## 📋 表單功能測試結果

${Object.entries(enhancedBusinessLogic.formTesting || {}).map(([formId, testResult]) => `
### 表單: ${formId}
- **頁面URL**: ${testResult.pageUrl}
- **測試結果**:
${Object.entries(testResult.tests || {}).map(([testName, result]) => 
  `  - **${testName}**: ${result.status} ${result.error ? `(${result.error})` : ''}`
).join('\n')}
`).join('\n')}

---

## 🔒 深度安全性分析結果

### HTTPS 配置
- **狀態**: ${deepSecurityAnalysis.httpsValidation?.status || 'unknown'}
- **HTTPS 啟用**: ${deepSecurityAnalysis.httpsValidation?.isHttps ? '✅' : '❌'}
- **HTTP 重定向**: ${deepSecurityAnalysis.httpsValidation?.httpRedirectsToHttps ? '✅' : '❌'}

### 安全標頭檢查
${deepSecurityAnalysis.headerSecurity?.headers ? 
  Object.entries(deepSecurityAnalysis.headerSecurity.headers)
    .map(([header, value]) => `- **${header}**: ${value || '❌ 未設定'}`)
    .join('\n') : '- 無法檢測安全標頭'}

### API 端點安全性
${Object.entries(deepSecurityAnalysis.apiSecurity?.endpoints || {}).map(([endpoint, result]) => 
  `- **${endpoint}**: ${result.hasAuthProtection ? '🔒 有保護' : '⚠️ 無保護'} (HTTP ${result.unauthorizedStatus})`
).join('\n')}

---

## 💡 智能改進建議

### 🚨 關鍵問題 (立即處理)
${(intelligentRecommendations.critical || []).map(rec => 
  `- **${rec.category}**: ${rec.issue}\n  - 建議: ${rec.recommendation}`
).join('\n\n')}

### ⚠️ 高優先級問題
${(intelligentRecommendations.high || []).map(rec => 
  `- **${rec.category}**: ${rec.issue}\n  - 建議: ${Array.isArray(rec.recommendation) ? rec.recommendation.join(', ') : rec.recommendation}`
).join('\n\n')}

### 📈 中優先級改進
${(intelligentRecommendations.medium || []).map(rec => 
  `- **${rec.category}**: ${rec.issue}\n  - 建議: ${rec.recommendation}`
).join('\n\n')}

### 🌟 功能增強建議
${(intelligentRecommendations.enhancements || []).map(rec => 
  `- **${rec.category}**: ${rec.suggestion}\n  - 實施方式: ${rec.implementation}`
).join('\n\n')}

---

## 📸 測試截圖記錄

測試過程中的所有截圖已保存至: \`${this.screenshotPath}\`

包含以下類型的截圖：
- 網站結構探測截圖
- 表單功能測試截圖
- 登入流程測試截圖
- 響應性設計測試截圖
- 錯誤頁面截圖

---

## 🔧 建議後續行動

### 立即執行 (1-3天)
1. 處理所有關鍵安全性問題
2. 修復失效的表單功能
3. 確保 HTTPS 正確配置

### 短期改善 (1-2週)
1. 實施安全標頭配置
2. 改善表單驗證機制
3. 優化用戶體驗流程

### 長期優化 (1個月)
1. 實施監控和日誌系統
2. 添加自動化測試
3. 效能優化和快取機制

---

**報告生成時間**: ${new Date().toISOString()}
**測試工具**: 增強版智慧瀏覽器驗證系統 v2.2
**測試深度**: 完整結構探測 + 業務邏輯驗證 + 安全性分析
`;
    }

    /**
     * 執行完整的增強版測試流程
     */
    async runEnhancedTestSuite() {
        console.log('🚀 開始執行增強版智慧瀏覽器驗證系統...\n');
        
        try {
            // 初始化
            await this.initialize();

            // 動態探測網站結構
            await this.discoverSiteStructure();

            // 智能表單測試
            await this.intelligentFormTesting();

            // 深度安全性分析
            await this.performDeepSecurityAnalysis();

            // 生成智能建議
            await this.generateIntelligentRecommendations();

            // 生成報告
            const reportInfo = await this.generateEnhancedReport();
            
            console.log('\n✅ 增強版智慧瀏覽器驗證系統測試完成!');
            console.log(`🌐 發現可用路由: ${this.workingRoutes.size} 個`);
            console.log(`🚨 關鍵問題: ${this.testResults.summary.critical} 個`);
            console.log(`⚠️ 警告問題: ${this.testResults.summary.warnings} 個`);
            console.log(`📋 詳細報告: ${reportInfo.markdownReport}`);

            return {
                success: true,
                summary: this.testResults.summary,
                reportPath: reportInfo.markdownReport,
                jsonReportPath: reportInfo.jsonReport,
                recommendations: reportInfo.recommendations
            };

        } catch (error) {
            console.error('❌ 增強版測試執行失敗:', error);
            return {
                success: false,
                error: error.message
            };
        } finally {
            if (this.browser) {
                await this.browser.close();
                console.log('🧹 瀏覽器資源已清理');
            }
        }
    }
}

// 執行增強版測試
if (require.main === module) {
    const enhancedSystem = new EnhancedBrowserVerificationWithFixes({
        baseUrl: 'https://employee-management-system-production-4361.up.railway.app',
        screenshotPath: 'D:\\0809\\enhanced-test-screenshots',
        reportPath: 'D:\\0809'
    });

    enhancedSystem.runEnhancedTestSuite()
        .then(result => {
            if (result.success) {
                console.log('\n🎉 增強版測試系統執行成功!');
                console.log('📊 關鍵發現:');
                if (result.recommendations.critical && result.recommendations.critical.length > 0) {
                    console.log(`🚨 關鍵問題需要立即處理: ${result.recommendations.critical.length} 個`);
                }
                if (result.recommendations.high && result.recommendations.high.length > 0) {
                    console.log(`⚠️ 高優先級問題: ${result.recommendations.high.length} 個`);
                }
                process.exit(0);
            } else {
                console.error('\n💥 增強版測試系統執行失敗:', result.error);
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('\n💥 未處理的錯誤:', error);
            process.exit(1);
        });
}

module.exports = EnhancedBrowserVerificationWithFixes;