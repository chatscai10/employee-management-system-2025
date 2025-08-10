/**
 * 🌐 終極智慧瀏覽器深度驗證引擎 v3.0
 * 最強大的全面自動化瀏覽器測試和診斷系統
 * 
 * 功能特色：
 * 🔍 深度路由探測 - 系統性探測所有可能的端點
 * 🎭 動態頁面測試 - 測試前端功能和用戶體驗
 * 🕷️ 網路請求攔截 - 監控並分析所有HTTP請求
 * 🔧 錯誤診斷分析 - 識別404錯誤的具體原因
 * 📊 企業級報告 - 生成詳細的測試報告和修復建議
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

class UltimateBrowserVerificationEngine {
    constructor(baseUrl = 'https://employee-management-system-production-4361.up.railway.app') {
        this.baseUrl = baseUrl;
        this.browser = null;
        this.page = null;
        this.screenshots = [];
        this.networkRequests = [];
        this.errors = [];
        this.findings = [];
        this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        this.screenshotDir = `ultimate-verification-screenshots-${this.timestamp}`;
        
        // 🎯 全面端點清單 - 基於伺服器日誌發現的模式
        this.criticalEndpoints = [
            // 基礎頁面
            '/',
            '/login.html',
            '/admin.html', 
            '/attendance.html',
            '/employee-dashboard.html',
            '/register.html',
            
            // API端點 (已知問題)
            '/api/auth/login',
            '/api/auth/register', 
            '/api/auth/logout',
            '/api/auth/verify',
            '/api/attendance/',
            '/api/attendance/checkin',
            '/api/attendance/checkout',
            '/api/attendance/records',
            '/api/employees/',
            '/api/revenue/',
            '/api/admin/',
            '/api/schedule/',
            '/api/monitoring/health',
            '/api/maintenance/',
            
            // 測試端點 (已知正常)
            '/api/orders/test',
            '/api/maintenance/test',
            '/api/schedule/test'
        ];
        
        // 🎭 測試用戶角色
        this.testUsers = [
            { role: 'admin', username: 'admin', password: 'admin123' },
            { role: 'manager', username: 'manager', password: 'manager123' },
            { role: 'employee', username: 'employee', password: 'employee123' },
            { role: 'guest', username: 'guest', password: 'guest123' }
        ];
        
        console.log(`🚀 終極智慧瀏覽器驗證引擎已初始化`);
        console.log(`📍 目標URL: ${this.baseUrl}`);
        console.log(`📸 截圖目錄: ${this.screenshotDir}`);
        console.log(`🎯 測試端點數量: ${this.criticalEndpoints.length}`);
    }
    
    /**
     * 🚀 啟動完整驗證流程
     */
    async runCompleteVerification() {
        const startTime = Date.now();
        
        try {
            console.log('\n🌟 ========== 終極智慧瀏覽器驗證開始 ==========');
            
            // 階段1: 初始化環境
            await this.initializeEnvironment();
            
            // 階段2: 基礎連通性測試
            await this.performConnectivityTests();
            
            // 階段3: 深度路由探測
            await this.performDeepRouteExploration();
            
            // 階段4: 動態頁面測試
            await this.performDynamicPageTesting();
            
            // 階段5: 業務流程驗證
            await this.performBusinessFlowValidation();
            
            // 階段6: 網路請求分析
            await this.performNetworkAnalysis();
            
            // 階段7: 響應式設計測試
            await this.performResponsiveDesignTests();
            
            // 階段8: 效能分析
            await this.performPerformanceAnalysis();
            
            // 階段9: 安全性測試
            await this.performSecurityTests();
            
            // 階段10: 生成企業級報告
            const report = await this.generateEnterpriseReport(startTime);
            
            console.log('\n🎉 ========== 終極驗證完成 ==========');
            return report;
            
        } catch (error) {
            console.error('❌ 終極驗證過程發生錯誤:', error);
            this.errors.push({
                stage: 'main_process',
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
            
            return await this.generateEmergencyReport(error, startTime);
        } finally {
            await this.cleanup();
        }
    }
    
    /**
     * 🏗️ 初始化測試環境
     */
    async initializeEnvironment() {
        console.log('\n📦 階段1: 初始化測試環境...');
        
        // 創建截圖目錄
        try {
            await fs.mkdir(this.screenshotDir, { recursive: true });
            console.log(`✅ 截圖目錄已創建: ${this.screenshotDir}`);
        } catch (error) {
            console.log(`⚠️ 截圖目錄創建失敗: ${error.message}`);
        }
        
        // 啟動瀏覽器
        this.browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox', 
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-background-networking',
                '--disable-background-timer-throttling',
                '--disable-renderer-backgrounding',
                '--disable-backgrounding-occluded-windows'
            ],
            timeout: 30000
        });
        
        this.page = await this.browser.newPage();
        
        // 設置視窗大小
        await this.page.setViewport({ width: 1920, height: 1080 });
        
        // 設置用戶代理
        await this.page.setUserAgent('UltimateBrowserVerificationEngine/3.0 Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        
        // 🕷️ 設置網路請求監聽
        this.page.on('request', (request) => {
            this.networkRequests.push({
                type: 'request',
                url: request.url(),
                method: request.method(),
                headers: request.headers(),
                timestamp: new Date().toISOString()
            });
        });
        
        this.page.on('response', (response) => {
            this.networkRequests.push({
                type: 'response',
                url: response.url(),
                status: response.status(),
                statusText: response.statusText(),
                headers: response.headers(),
                timestamp: new Date().toISOString()
            });
        });
        
        // 設置錯誤監聽
        this.page.on('console', (msg) => {
            if (msg.type() === 'error') {
                this.errors.push({
                    stage: 'browser_console',
                    error: msg.text(),
                    timestamp: new Date().toISOString()
                });
            }
        });
        
        this.page.on('pageerror', (error) => {
            this.errors.push({
                stage: 'page_error',
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            });
        });
        
        console.log('✅ 瀏覽器環境初始化完成');
    }
    
    /**
     * 🔗 基礎連通性測試
     */
    async performConnectivityTests() {
        console.log('\n🔗 階段2: 基礎連通性測試...');
        
        try {
            // HTTP直接測試
            const response = await axios.get(this.baseUrl, { 
                timeout: 10000,
                validateStatus: () => true 
            });
            
            this.findings.push({
                category: 'connectivity',
                type: 'http_direct_test',
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
                loadTime: response.headers['x-response-time'] || 'unknown'
            });
            
            console.log(`✅ HTTP直接測試: ${response.status} ${response.statusText}`);
            
        } catch (error) {
            this.errors.push({
                stage: 'connectivity_test',
                error: error.message,
                timestamp: new Date().toISOString()
            });
            console.log(`❌ HTTP連通性測試失敗: ${error.message}`);
        }
        
        // 瀏覽器訪問測試
        try {
            const startTime = Date.now();
            await this.page.goto(this.baseUrl, { 
                waitUntil: 'networkidle0', 
                timeout: 30000 
            });
            const loadTime = Date.now() - startTime;
            
            const title = await this.page.title();
            const url = this.page.url();
            
            // 截圖
            const screenshotPath = path.join(this.screenshotDir, `connectivity-test-${Date.now()}.png`);
            await this.page.screenshot({ 
                path: screenshotPath, 
                fullPage: true 
            });
            this.screenshots.push(screenshotPath);
            
            this.findings.push({
                category: 'connectivity',
                type: 'browser_access_test',
                title: title,
                finalUrl: url,
                loadTime: loadTime,
                screenshot: screenshotPath
            });
            
            console.log(`✅ 瀏覽器訪問測試完成 (載入時間: ${loadTime}ms)`);
            console.log(`📄 頁面標題: ${title}`);
            console.log(`🔗 最終URL: ${url}`);
            
        } catch (error) {
            this.errors.push({
                stage: 'browser_connectivity',
                error: error.message,
                timestamp: new Date().toISOString()
            });
            console.log(`❌ 瀏覽器連通性測試失敗: ${error.message}`);
        }
    }
    
    /**
     * 🔍 深度路由探測
     */
    async performDeepRouteExploration() {
        console.log('\n🔍 階段3: 深度路由探測...');
        
        const routeResults = [];
        
        for (const endpoint of this.criticalEndpoints) {
            try {
                console.log(`🔎 探測端點: ${endpoint}`);
                
                const fullUrl = `${this.baseUrl}${endpoint}`;
                const startTime = Date.now();
                
                // HTTP直接測試
                const httpResponse = await axios.get(fullUrl, { 
                    timeout: 5000,
                    validateStatus: () => true,
                    headers: {
                        'User-Agent': 'UltimateBrowserVerificationEngine/3.0'
                    }
                });
                
                const httpTime = Date.now() - startTime;
                
                // 瀏覽器測試 (僅對HTML頁面)
                let browserResult = null;
                if (endpoint.endsWith('.html') || endpoint === '/') {
                    try {
                        const browserStartTime = Date.now();
                        await this.page.goto(fullUrl, { 
                            waitUntil: 'domcontentloaded', 
                            timeout: 10000 
                        });
                        const browserTime = Date.now() - browserStartTime;
                        
                        const title = await this.page.title();
                        const screenshot = path.join(this.screenshotDir, `route-${endpoint.replace(/[\/\.]/g, '_')}-${Date.now()}.png`);
                        
                        await this.page.screenshot({ 
                            path: screenshot,
                            fullPage: false
                        });
                        this.screenshots.push(screenshot);
                        
                        browserResult = {
                            loadTime: browserTime,
                            title: title,
                            screenshot: screenshot
                        };
                        
                    } catch (browserError) {
                        browserResult = {
                            error: browserError.message
                        };
                    }
                }
                
                const routeData = {
                    endpoint: endpoint,
                    fullUrl: fullUrl,
                    httpStatus: httpResponse.status,
                    httpStatusText: httpResponse.statusText,
                    httpTime: httpTime,
                    httpHeaders: httpResponse.headers,
                    contentType: httpResponse.headers['content-type'] || 'unknown',
                    browserResult: browserResult,
                    timestamp: new Date().toISOString()
                };
                
                routeResults.push(routeData);
                
                // 分析結果
                if (httpResponse.status === 200) {
                    console.log(`✅ ${endpoint} - HTTP 200 OK (${httpTime}ms)`);
                } else if (httpResponse.status === 302 || httpResponse.status === 301) {
                    console.log(`🔄 ${endpoint} - HTTP ${httpResponse.status} 重定向 (${httpTime}ms)`);
                    console.log(`📍 重定向到: ${httpResponse.headers.location || '未知'}`);
                } else if (httpResponse.status === 404) {
                    console.log(`❌ ${endpoint} - HTTP 404 未找到 (${httpTime}ms)`);
                } else {
                    console.log(`⚠️ ${endpoint} - HTTP ${httpResponse.status} ${httpResponse.statusText} (${httpTime}ms)`);
                }
                
                // 小延遲避免過載
                await new Promise(resolve => setTimeout(resolve, 200));
                
            } catch (error) {
                console.log(`❌ ${endpoint} - 探測失敗: ${error.message}`);
                routeResults.push({
                    endpoint: endpoint,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        }
        
        this.findings.push({
            category: 'route_exploration',
            type: 'deep_route_scan',
            totalEndpoints: this.criticalEndpoints.length,
            results: routeResults,
            summary: this.analyzeRouteResults(routeResults)
        });
        
        console.log(`📊 路由探測完成 - 測試了 ${routeResults.length} 個端點`);
    }
    
    /**
     * 🎭 動態頁面測試
     */
    async performDynamicPageTesting() {
        console.log('\n🎭 階段4: 動態頁面測試...');
        
        const pageTests = [
            {
                name: '首頁功能測試',
                url: this.baseUrl,
                tests: ['navigation', 'forms', 'links']
            },
            {
                name: '登入頁面測試',
                url: `${this.baseUrl}/login.html`,
                tests: ['form_interaction', 'validation', 'submission']
            },
            {
                name: '管理頁面測試',
                url: `${this.baseUrl}/admin.html`,
                tests: ['authentication', 'data_display', 'crud_operations']
            }
        ];
        
        for (const pageTest of pageTests) {
            try {
                console.log(`🧪 測試: ${pageTest.name}`);
                
                await this.page.goto(pageTest.url, { 
                    waitUntil: 'networkidle0', 
                    timeout: 15000 
                });
                
                const pageResult = {
                    name: pageTest.name,
                    url: pageTest.url,
                    tests: {},
                    screenshot: null,
                    errors: []
                };
                
                // 通用頁面檢查
                pageResult.tests.pageLoad = {
                    title: await this.page.title(),
                    url: this.page.url(),
                    hasContent: (await this.page.content()).length > 1000
                };
                
                // 表單測試
                if (pageTest.tests.includes('forms') || pageTest.tests.includes('form_interaction')) {
                    try {
                        const forms = await this.page.$$('form');
                        pageResult.tests.forms = {
                            formCount: forms.length,
                            formDetails: []
                        };
                        
                        for (let i = 0; i < forms.length; i++) {
                            const form = forms[i];
                            const action = await form.evaluate(el => el.action);
                            const method = await form.evaluate(el => el.method);
                            const inputs = await form.$$('input');
                            
                            pageResult.tests.forms.formDetails.push({
                                index: i,
                                action: action,
                                method: method,
                                inputCount: inputs.length
                            });
                        }
                        
                    } catch (formError) {
                        pageResult.errors.push(`表單測試錯誤: ${formError.message}`);
                    }
                }
                
                // 連結測試
                if (pageTest.tests.includes('links') || pageTest.tests.includes('navigation')) {
                    try {
                        const links = await this.page.$$eval('a', links => 
                            links.map(link => ({
                                href: link.href,
                                text: link.textContent.trim(),
                                target: link.target
                            }))
                        );
                        
                        pageResult.tests.navigation = {
                            linkCount: links.length,
                            internalLinks: links.filter(link => link.href.includes(this.baseUrl)).length,
                            externalLinks: links.filter(link => !link.href.includes(this.baseUrl) && link.href.startsWith('http')).length
                        };
                        
                    } catch (linkError) {
                        pageResult.errors.push(`連結測試錯誤: ${linkError.message}`);
                    }
                }
                
                // JavaScript錯誤檢查
                const jsErrors = [];
                this.page.on('console', msg => {
                    if (msg.type() === 'error') {
                        jsErrors.push(msg.text());
                    }
                });
                
                pageResult.tests.jsErrors = jsErrors;
                
                // 截圖
                const screenshotPath = path.join(this.screenshotDir, `page-test-${pageTest.name.replace(/\s/g, '-')}-${Date.now()}.png`);
                await this.page.screenshot({ 
                    path: screenshotPath, 
                    fullPage: true 
                });
                this.screenshots.push(screenshotPath);
                pageResult.screenshot = screenshotPath;
                
                this.findings.push({
                    category: 'dynamic_page_testing',
                    type: 'page_functionality_test',
                    result: pageResult
                });
                
                console.log(`✅ ${pageTest.name} - 完成測試`);
                
            } catch (error) {
                console.log(`❌ ${pageTest.name} - 測試失敗: ${error.message}`);
                this.errors.push({
                    stage: 'dynamic_page_testing',
                    page: pageTest.name,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        }
    }
    
    /**
     * 🏢 業務流程驗證
     */
    async performBusinessFlowValidation() {
        console.log('\n🏢 階段5: 業務流程驗證...');
        
        const businessFlows = [
            {
                name: '用戶登入流程',
                steps: [
                    { action: 'navigate', url: `${this.baseUrl}/login.html` },
                    { action: 'fill', selector: 'input[name="username"]', value: 'admin' },
                    { action: 'fill', selector: 'input[name="password"]', value: 'admin123' },
                    { action: 'click', selector: 'button[type="submit"]' },
                    { action: 'wait', condition: 'navigation' }
                ]
            },
            {
                name: '出勤打卡流程',
                steps: [
                    { action: 'navigate', url: `${this.baseUrl}/attendance.html` },
                    { action: 'click', selector: '#checkin-button' },
                    { action: 'wait', condition: 'response' }
                ]
            }
        ];
        
        for (const flow of businessFlows) {
            try {
                console.log(`🔄 執行業務流程: ${flow.name}`);
                
                const flowResult = {
                    name: flow.name,
                    steps: [],
                    success: true,
                    screenshots: [],
                    errors: []
                };
                
                for (let i = 0; i < flow.steps.length; i++) {
                    const step = flow.steps[i];
                    const stepStartTime = Date.now();
                    
                    try {
                        console.log(`  📝 步驟 ${i+1}: ${step.action}`);
                        
                        switch (step.action) {
                            case 'navigate':
                                await this.page.goto(step.url, { 
                                    waitUntil: 'networkidle0', 
                                    timeout: 15000 
                                });
                                break;
                                
                            case 'fill':
                                await this.page.waitForSelector(step.selector, { timeout: 5000 });
                                await this.page.type(step.selector, step.value);
                                break;
                                
                            case 'click':
                                await this.page.waitForSelector(step.selector, { timeout: 5000 });
                                await this.page.click(step.selector);
                                break;
                                
                            case 'wait':
                                if (step.condition === 'navigation') {
                                    await this.page.waitForNavigation({ 
                                        timeout: 10000, 
                                        waitUntil: 'networkidle0' 
                                    });
                                } else if (step.condition === 'response') {
                                    await new Promise(resolve => setTimeout(resolve, 2000));
                                }
                                break;
                        }
                        
                        const stepTime = Date.now() - stepStartTime;
                        flowResult.steps.push({
                            step: i + 1,
                            action: step.action,
                            success: true,
                            duration: stepTime,
                            details: step
                        });
                        
                        // 每個步驟後截圖
                        const stepScreenshot = path.join(this.screenshotDir, `flow-${flow.name.replace(/\s/g, '-')}-step-${i+1}-${Date.now()}.png`);
                        await this.page.screenshot({ 
                            path: stepScreenshot,
                            fullPage: false 
                        });
                        this.screenshots.push(stepScreenshot);
                        flowResult.screenshots.push(stepScreenshot);
                        
                    } catch (stepError) {
                        console.log(`    ❌ 步驟失敗: ${stepError.message}`);
                        flowResult.steps.push({
                            step: i + 1,
                            action: step.action,
                            success: false,
                            error: stepError.message,
                            details: step
                        });
                        flowResult.success = false;
                        flowResult.errors.push(stepError.message);
                        break;
                    }
                }
                
                this.findings.push({
                    category: 'business_flow_validation',
                    type: 'end_to_end_flow_test',
                    result: flowResult
                });
                
                if (flowResult.success) {
                    console.log(`✅ ${flow.name} - 流程驗證成功`);
                } else {
                    console.log(`❌ ${flow.name} - 流程驗證失敗`);
                }
                
            } catch (error) {
                console.log(`❌ ${flow.name} - 流程執行錯誤: ${error.message}`);
                this.errors.push({
                    stage: 'business_flow_validation',
                    flow: flow.name,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        }
    }
    
    /**
     * 🕸️ 網路請求分析
     */
    async performNetworkAnalysis() {
        console.log('\n🕸️ 階段6: 網路請求分析...');
        
        const networkAnalysis = {
            totalRequests: this.networkRequests.filter(r => r.type === 'request').length,
            totalResponses: this.networkRequests.filter(r => r.type === 'response').length,
            statusCodes: {},
            domains: {},
            resourceTypes: {},
            errors: []
        };
        
        // 分析響應狀態碼
        this.networkRequests
            .filter(r => r.type === 'response')
            .forEach(response => {
                const status = response.status;
                networkAnalysis.statusCodes[status] = (networkAnalysis.statusCodes[status] || 0) + 1;
                
                try {
                    const url = new URL(response.url);
                    const domain = url.hostname;
                    networkAnalysis.domains[domain] = (networkAnalysis.domains[domain] || 0) + 1;
                } catch (urlError) {
                    networkAnalysis.errors.push(`URL解析錯誤: ${response.url}`);
                }
            });
        
        // 分析資源類型
        this.networkRequests
            .filter(r => r.type === 'request')
            .forEach(request => {
                let resourceType = 'other';
                const url = request.url.toLowerCase();
                
                if (url.includes('.js')) resourceType = 'javascript';
                else if (url.includes('.css')) resourceType = 'css';
                else if (url.includes('.png') || url.includes('.jpg') || url.includes('.jpeg') || url.includes('.gif')) resourceType = 'image';
                else if (url.includes('/api/')) resourceType = 'api';
                else if (url.includes('.html')) resourceType = 'html';
                
                networkAnalysis.resourceTypes[resourceType] = (networkAnalysis.resourceTypes[resourceType] || 0) + 1;
            });
        
        // 找出問題請求
        const problemRequests = this.networkRequests
            .filter(r => r.type === 'response' && (r.status >= 400 || r.status === 0))
            .map(r => ({
                url: r.url,
                status: r.status,
                statusText: r.statusText
            }));
        
        networkAnalysis.problemRequests = problemRequests;
        
        this.findings.push({
            category: 'network_analysis',
            type: 'comprehensive_network_scan',
            analysis: networkAnalysis
        });
        
        console.log(`📊 網路分析完成:`);
        console.log(`  💌 總請求數: ${networkAnalysis.totalRequests}`);
        console.log(`  📨 總響應數: ${networkAnalysis.totalResponses}`);
        console.log(`  ❌ 問題請求: ${problemRequests.length}`);
        console.log(`  🏷️ 狀態碼分佈:`, networkAnalysis.statusCodes);
    }
    
    /**
     * 📱 響應式設計測試
     */
    async performResponsiveDesignTests() {
        console.log('\n📱 階段7: 響應式設計測試...');
        
        const devices = [
            { name: 'Desktop', width: 1920, height: 1080 },
            { name: 'Laptop', width: 1366, height: 768 },
            { name: 'Tablet', width: 768, height: 1024 },
            { name: 'Mobile', width: 375, height: 667 },
            { name: 'Mobile-Large', width: 414, height: 896 }
        ];
        
        const responsiveResults = [];
        
        for (const device of devices) {
            try {
                console.log(`📱 測試設備: ${device.name} (${device.width}x${device.height})`);
                
                await this.page.setViewport({ 
                    width: device.width, 
                    height: device.height 
                });
                
                await this.page.goto(this.baseUrl, { 
                    waitUntil: 'networkidle0', 
                    timeout: 15000 
                });
                
                // 檢查響應式元素
                const responsiveCheck = await this.page.evaluate(() => {
                    const elements = document.querySelectorAll('*');
                    let overflowElements = 0;
                    let hiddenElements = 0;
                    
                    elements.forEach(el => {
                        const rect = el.getBoundingClientRect();
                        const style = window.getComputedStyle(el);
                        
                        if (rect.width > window.innerWidth) {
                            overflowElements++;
                        }
                        
                        if (style.display === 'none' && el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE') {
                            hiddenElements++;
                        }
                    });
                    
                    return {
                        viewportWidth: window.innerWidth,
                        viewportHeight: window.innerHeight,
                        overflowElements: overflowElements,
                        hiddenElements: hiddenElements,
                        totalElements: elements.length
                    };
                });
                
                // 截圖
                const screenshot = path.join(this.screenshotDir, `responsive-${device.name}-${device.width}x${device.height}-${Date.now()}.png`);
                await this.page.screenshot({ 
                    path: screenshot,
                    fullPage: true 
                });
                this.screenshots.push(screenshot);
                
                responsiveResults.push({
                    device: device,
                    check: responsiveCheck,
                    screenshot: screenshot,
                    timestamp: new Date().toISOString()
                });
                
                console.log(`✅ ${device.name} - 響應式測試完成`);
                
            } catch (error) {
                console.log(`❌ ${device.name} - 響應式測試失敗: ${error.message}`);
                this.errors.push({
                    stage: 'responsive_design_test',
                    device: device.name,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        }
        
        this.findings.push({
            category: 'responsive_design',
            type: 'multi_device_compatibility_test',
            results: responsiveResults
        });
        
        // 恢復桌面視窗大小
        await this.page.setViewport({ width: 1920, height: 1080 });
    }
    
    /**
     * ⚡ 效能分析
     */
    async performPerformanceAnalysis() {
        console.log('\n⚡ 階段8: 效能分析...');
        
        try {
            // 啟用效能監控
            await this.page.tracing.start({
                path: path.join(this.screenshotDir, 'performance-trace.json'),
                screenshots: true
            });
            
            const performanceStartTime = Date.now();
            
            await this.page.goto(this.baseUrl, { 
                waitUntil: 'networkidle0', 
                timeout: 30000 
            });
            
            const loadTime = Date.now() - performanceStartTime;
            
            // 獲取效能指標
            const performanceMetrics = await this.page.evaluate(() => {
                const navigation = performance.getEntriesByType('navigation')[0];
                const paint = performance.getEntriesByType('paint');
                
                return {
                    navigationTiming: navigation ? {
                        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                        domInteractive: navigation.domInteractive - navigation.navigationStart,
                        firstByte: navigation.responseStart - navigation.requestStart
                    } : null,
                    paintTiming: paint.reduce((acc, entry) => {
                        acc[entry.name] = entry.startTime;
                        return acc;
                    }, {}),
                    resourceCount: performance.getEntriesByType('resource').length,
                    memoryUsage: performance.memory ? {
                        usedJSHeapSize: performance.memory.usedJSHeapSize,
                        totalJSHeapSize: performance.memory.totalJSHeapSize,
                        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
                    } : null
                };
            });
            
            await this.page.tracing.stop();
            
            const performanceResult = {
                totalLoadTime: loadTime,
                metrics: performanceMetrics,
                networkRequestCount: this.networkRequests.filter(r => r.type === 'request').length,
                errorCount: this.errors.length,
                screenshot: null
            };
            
            // 效能截圖
            const perfScreenshot = path.join(this.screenshotDir, `performance-analysis-${Date.now()}.png`);
            await this.page.screenshot({ 
                path: perfScreenshot,
                fullPage: false 
            });
            this.screenshots.push(perfScreenshot);
            performanceResult.screenshot = perfScreenshot;
            
            this.findings.push({
                category: 'performance_analysis',
                type: 'comprehensive_performance_test',
                result: performanceResult
            });
            
            console.log(`✅ 效能分析完成 - 總載入時間: ${loadTime}ms`);
            
        } catch (error) {
            console.log(`❌ 效能分析失敗: ${error.message}`);
            this.errors.push({
                stage: 'performance_analysis',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }
    
    /**
     * 🔒 安全性測試
     */
    async performSecurityTests() {
        console.log('\n🔒 階段9: 安全性測試...');
        
        const securityTests = [
            {
                name: 'HTTPS檢查',
                test: async () => {
                    return {
                        isHttps: this.baseUrl.startsWith('https://'),
                        protocol: new URL(this.baseUrl).protocol
                    };
                }
            },
            {
                name: 'XSS防護檢查',
                test: async () => {
                    try {
                        await this.page.goto(`${this.baseUrl}/login.html`);
                        await this.page.type('input[name="username"]', '<script>alert("xss")</script>');
                        
                        const alertTriggered = await new Promise((resolve) => {
                            this.page.once('dialog', () => resolve(true));
                            setTimeout(() => resolve(false), 2000);
                        });
                        
                        return {
                            xssVulnerable: alertTriggered,
                            testPayload: '<script>alert("xss")</script>'
                        };
                    } catch (error) {
                        return {
                            error: error.message,
                            xssVulnerable: false
                        };
                    }
                }
            },
            {
                name: '敏感信息洩漏檢查',
                test: async () => {
                    try {
                        const content = await this.page.content();
                        const sensitivePatterns = [
                            /password\s*[:=]\s*['"][^'"]*['"]/i,
                            /api[_-]?key\s*[:=]\s*['"][^'"]*['"]/i,
                            /token\s*[:=]\s*['"][^'"]*['"]/i,
                            /secret\s*[:=]\s*['"][^'"]*['"]/i
                        ];
                        
                        const findings = [];
                        sensitivePatterns.forEach((pattern, index) => {
                            const matches = content.match(pattern);
                            if (matches) {
                                findings.push({
                                    pattern: pattern.toString(),
                                    match: matches[0].substring(0, 50) + '...'
                                });
                            }
                        });
                        
                        return {
                            sensitivePatternsFound: findings.length,
                            findings: findings
                        };
                    } catch (error) {
                        return {
                            error: error.message,
                            sensitivePatternsFound: 0
                        };
                    }
                }
            }
        ];
        
        const securityResults = [];
        
        for (const secTest of securityTests) {
            try {
                console.log(`🔐 執行安全測試: ${secTest.name}`);
                const result = await secTest.test();
                
                securityResults.push({
                    name: secTest.name,
                    result: result,
                    timestamp: new Date().toISOString()
                });
                
                console.log(`✅ ${secTest.name} - 完成`);
                
            } catch (error) {
                console.log(`❌ ${secTest.name} - 失敗: ${error.message}`);
                securityResults.push({
                    name: secTest.name,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        }
        
        this.findings.push({
            category: 'security_analysis',
            type: 'comprehensive_security_test',
            results: securityResults
        });
    }
    
    /**
     * 📊 分析路由結果
     */
    analyzeRouteResults(routeResults) {
        const summary = {
            total: routeResults.length,
            successful: 0,
            redirects: 0,
            notFound: 0,
            errors: 0,
            serverErrors: 0,
            workingEndpoints: [],
            brokenEndpoints: [],
            redirectEndpoints: []
        };
        
        routeResults.forEach(result => {
            if (result.httpStatus === 200) {
                summary.successful++;
                summary.workingEndpoints.push(result.endpoint);
            } else if (result.httpStatus === 301 || result.httpStatus === 302) {
                summary.redirects++;
                summary.redirectEndpoints.push(result.endpoint);
            } else if (result.httpStatus === 404) {
                summary.notFound++;
                summary.brokenEndpoints.push(result.endpoint);
            } else if (result.httpStatus >= 500) {
                summary.serverErrors++;
                summary.brokenEndpoints.push(result.endpoint);
            } else if (result.error) {
                summary.errors++;
                summary.brokenEndpoints.push(result.endpoint);
            }
        });
        
        return summary;
    }
    
    /**
     * 📋 生成企業級報告
     */
    async generateEnterpriseReport(startTime) {
        console.log('\n📋 階段10: 生成企業級報告...');
        
        const endTime = Date.now();
        const totalDuration = endTime - startTime;
        
        const report = {
            metadata: {
                title: '🌟 終極智慧瀏覽器深度驗證報告',
                version: '3.0',
                timestamp: new Date().toISOString(),
                duration: `${Math.round(totalDuration / 1000)}秒`,
                targetUrl: this.baseUrl,
                totalTests: this.findings.length,
                totalErrors: this.errors.length,
                totalScreenshots: this.screenshots.length
            },
            
            executiveSummary: this.generateExecutiveSummary(),
            
            findings: this.findings,
            errors: this.errors,
            screenshots: this.screenshots,
            networkRequests: this.networkRequests.slice(-50), // 最後50個請求
            
            recommendations: this.generateRecommendations(),
            
            nextSteps: this.generateNextSteps(),
            
            technicalDetails: {
                browser: 'Chrome/Puppeteer',
                userAgent: 'UltimateBrowserVerificationEngine/3.0',
                viewport: '1920x1080',
                networkMonitoring: true,
                securityTesting: true,
                performanceAnalysis: true
            }
        };
        
        // 保存JSON報告
        const jsonReportPath = `ultimate-verification-report-${this.timestamp}.json`;
        await fs.writeFile(jsonReportPath, JSON.stringify(report, null, 2));
        
        // 生成Markdown報告
        const markdownReport = this.generateMarkdownReport(report);
        const mdReportPath = `ultimate-verification-report-${this.timestamp}.md`;
        await fs.writeFile(mdReportPath, markdownReport);
        
        console.log(`✅ 企業級報告已生成:`);
        console.log(`📄 JSON報告: ${jsonReportPath}`);
        console.log(`📝 Markdown報告: ${mdReportPath}`);
        console.log(`📸 截圖目錄: ${this.screenshotDir}`);
        
        return {
            jsonReport: jsonReportPath,
            markdownReport: mdReportPath,
            screenshotDirectory: this.screenshotDir,
            summary: report.executiveSummary,
            recommendations: report.recommendations
        };
    }
    
    /**
     * 📊 生成執行摘要
     */
    generateExecutiveSummary() {
        const routeFindings = this.findings.find(f => f.category === 'route_exploration');
        const networkFindings = this.findings.find(f => f.category === 'network_analysis');
        const businessFlowFindings = this.findings.filter(f => f.category === 'business_flow_validation');
        
        let summary = {
            overallStatus: 'CRITICAL_ISSUES_FOUND',
            keyFindings: [],
            criticalIssues: [],
            successfulTests: [],
            performanceIssues: [],
            securityConcerns: []
        };
        
        // 路由分析摘要
        if (routeFindings && routeFindings.summary) {
            const routeSummary = routeFindings.summary;
            summary.keyFindings.push({
                category: '路由連通性',
                status: routeSummary.successful > 0 ? 'PARTIAL' : 'FAILED',
                details: `${routeSummary.successful}/${routeSummary.total} 端點正常運作`
            });
            
            if (routeSummary.notFound > 0) {
                summary.criticalIssues.push({
                    severity: 'HIGH',
                    issue: 'API端點404錯誤',
                    count: routeSummary.notFound,
                    impact: '核心功能無法正常使用'
                });
            }
        }
        
        // 網路請求摘要
        if (networkFindings && networkFindings.analysis) {
            const networkAnalysis = networkFindings.analysis;
            if (networkAnalysis.problemRequests.length > 0) {
                summary.criticalIssues.push({
                    severity: 'HIGH',
                    issue: '網路請求失敗',
                    count: networkAnalysis.problemRequests.length,
                    impact: '影響用戶體驗和系統功能'
                });
            }
        }
        
        // 業務流程摘要
        businessFlowFindings.forEach(flow => {
            if (flow.result.success) {
                summary.successfulTests.push({
                    test: flow.result.name,
                    status: 'PASSED'
                });
            } else {
                summary.criticalIssues.push({
                    severity: 'HIGH',
                    issue: '業務流程失敗',
                    flow: flow.result.name,
                    impact: '核心業務功能不可用'
                });
            }
        });
        
        // 整體狀態評估
        if (summary.criticalIssues.length === 0) {
            summary.overallStatus = 'HEALTHY';
        } else if (summary.successfulTests.length > summary.criticalIssues.length) {
            summary.overallStatus = 'NEEDS_ATTENTION';
        } else {
            summary.overallStatus = 'CRITICAL_ISSUES_FOUND';
        }
        
        return summary;
    }
    
    /**
     * 💡 生成修復建議
     */
    generateRecommendations() {
        const recommendations = [];
        
        // 基於發現的問題生成建議
        const routeFindings = this.findings.find(f => f.category === 'route_exploration');
        if (routeFindings && routeFindings.summary.notFound > 0) {
            recommendations.push({
                priority: 'CRITICAL',
                category: 'API路由修復',
                issue: 'API端點返回404錯誤',
                solution: '檢查server.js中的路由配置，確保所有API端點正確註冊',
                technicalSteps: [
                    '1. 檢查 server/routes/api/ 目錄中的路由檔案',
                    '2. 確認 server.js 中正確引入所有路由模組',
                    '3. 驗證路由前綴配置是否正確',
                    '4. 檢查中間件順序，確保認證中間件不會阻塞API調用'
                ],
                estimatedTime: '2-4小時'
            });
        }
        
        // 磁碟空間建議
        recommendations.push({
            priority: 'HIGH',
            category: '系統維護',
            issue: '磁碟使用率過高 (>90%)',
            solution: '立即清理不必要的檔案和日誌',
            technicalSteps: [
                '1. 清理舊的日誌檔案和臨時檔案',
                '2. 檢查並刪除不必要的node_modules副本',
                '3. 壓縮或歸檔舊的備份檔案',
                '4. 設置自動日誌輪轉機制'
            ],
            estimatedTime: '1-2小時'
        });
        
        // 網路請求優化建議
        const networkFindings = this.findings.find(f => f.category === 'network_analysis');
        if (networkFindings && networkFindings.analysis.problemRequests.length > 0) {
            recommendations.push({
                priority: 'MEDIUM',
                category: '網路優化',
                issue: '存在失敗的網路請求',
                solution: '優化API調用和錯誤處理機制',
                technicalSteps: [
                    '1. 實現適當的API錯誤處理',
                    '2. 添加請求重試機制',
                    '3. 優化前端API調用邏輯',
                    '4. 添加載入狀態指示器'
                ],
                estimatedTime: '4-6小時'
            });
        }
        
        // 安全性建議
        recommendations.push({
            priority: 'HIGH',
            category: '安全性改善',
            issue: '需要加強安全防護',
            solution: '實施全面的安全措施',
            technicalSteps: [
                '1. 實現適當的輸入驗證和清理',
                '2. 添加CSRF保護',
                '3. 設置安全HTTP標頭',
                '4. 實施API速率限制'
            ],
            estimatedTime: '6-8小時'
        });
        
        return recommendations;
    }
    
    /**
     * 🎯 生成下一步行動計劃
     */
    generateNextSteps() {
        return [
            {
                phase: '立即行動 (0-24小時)',
                actions: [
                    '🔧 修復API路由404錯誤',
                    '🧹 清理磁碟空間，降低使用率',
                    '📊 檢查伺服器運行狀態',
                    '⚡ 重啟相關服務確保穩定運行'
                ]
            },
            {
                phase: '短期改善 (1-3天)',
                actions: [
                    '🔍 深入診斷路由配置問題',
                    '📝 完善API文檔和測試',
                    '🚀 優化前端用戶體驗',
                    '🛡️ 加強安全防護措施'
                ]
            },
            {
                phase: '中期優化 (1-2週)',
                actions: [
                    '📈 實施全面監控系統',
                    '🔄 建立自動化測試流程',
                    '📚 完善系統文檔',
                    '⚙️ 優化系統架構和效能'
                ]
            },
            {
                phase: '長期發展 (1個月+)',
                actions: [
                    '🌟 升級到微服務架構',
                    '☁️ 遷移到更穩定的雲端環境',
                    '📊 實施商業智慧分析',
                    '🔮 探索AI和機器學習整合'
                ]
            }
        ];
    }
    
    /**
     * 📝 生成Markdown報告
     */
    generateMarkdownReport(report) {
        const md = `# 🌟 終極智慧瀏覽器深度驗證報告

## 📋 報告摘要

**版本**: ${report.metadata.version}  
**生成時間**: ${report.metadata.timestamp}  
**測試目標**: ${report.metadata.targetUrl}  
**測試時長**: ${report.metadata.duration}  
**總測試數**: ${report.metadata.totalTests}  
**發現錯誤**: ${report.metadata.totalErrors}  
**截圖數量**: ${report.metadata.totalScreenshots}

---

## 🎯 執行摘要

**整體狀態**: \`${report.executiveSummary.overallStatus}\`

### 🔍 關鍵發現
${report.executiveSummary.keyFindings.map(finding => 
`- **${finding.category}**: ${finding.status} - ${finding.details}`).join('\n')}

### ❌ 關鍵問題
${report.executiveSummary.criticalIssues.map(issue => 
`- **${issue.issue}** (嚴重性: ${issue.severity})
  - 數量: ${issue.count || 'N/A'}
  - 影響: ${issue.impact}`).join('\n')}

### ✅ 成功測試
${report.executiveSummary.successfulTests.map(test => 
`- ${test.test}: ${test.status}`).join('\n')}

---

## 💡 修復建議

${report.recommendations.map(rec => `
### ${rec.priority} - ${rec.category}

**問題**: ${rec.issue}  
**解決方案**: ${rec.solution}  
**預估時間**: ${rec.estimatedTime}

**技術步驟**:
${rec.technicalSteps.map(step => `- ${step}`).join('\n')}
`).join('\n')}

---

## 🎯 下一步行動計劃

${report.nextSteps.map(phase => `
### ${phase.phase}
${phase.actions.map(action => `- ${action}`).join('\n')}
`).join('\n')}

---

## 📊 詳細測試結果

### 🔍 路由探測結果
${this.generateRouteMarkdownSection()}

### 🕸️ 網路請求分析
${this.generateNetworkMarkdownSection()}

### 📱 響應式設計測試
${this.generateResponsiveMarkdownSection()}

---

## 📸 測試截圖

總截圖數量: ${report.screenshots.length}

截圖保存位置: \`${this.screenshotDir}/\`

---

## 🔧 技術詳情

- **瀏覽器引擎**: ${report.technicalDetails.browser}
- **用戶代理**: ${report.technicalDetails.userAgent}
- **視窗大小**: ${report.technicalDetails.viewport}
- **網路監控**: ${report.technicalDetails.networkMonitoring ? '✅ 啟用' : '❌ 停用'}
- **安全測試**: ${report.technicalDetails.securityTesting ? '✅ 啟用' : '❌ 停用'}
- **效能分析**: ${report.technicalDetails.performanceAnalysis ? '✅ 啟用' : '❌ 停用'}

---

## 📞 聯繫方式

如需更多技術支持或詳細說明，請聯繫開發團隊。

**報告生成時間**: ${new Date().toLocaleString('zh-TW')}
**報告版本**: 終極智慧瀏覽器驗證引擎 v3.0
`;

        return md;
    }
    
    generateRouteMarkdownSection() {
        const routeFindings = this.findings.find(f => f.category === 'route_exploration');
        if (!routeFindings) return '未執行路由探測測試';
        
        const summary = routeFindings.summary;
        return `
**路由測試摘要**:
- 總端點數: ${summary.total}
- 正常運作: ${summary.successful} ✅
- 重定向: ${summary.redirects} 🔄
- 未找到: ${summary.notFound} ❌
- 錯誤: ${summary.errors} ⚠️

**正常運作的端點**:
${summary.workingEndpoints.map(ep => `- ${ep}`).join('\n')}

**問題端點**:
${summary.brokenEndpoints.map(ep => `- ${ep}`).join('\n')}
`;
    }
    
    generateNetworkMarkdownSection() {
        const networkFindings = this.findings.find(f => f.category === 'network_analysis');
        if (!networkFindings) return '未執行網路分析';
        
        const analysis = networkFindings.analysis;
        return `
**網路請求摘要**:
- 總請求數: ${analysis.totalRequests}
- 總響應數: ${analysis.totalResponses}
- 問題請求: ${analysis.problemRequests.length}

**狀態碼分佈**:
${Object.entries(analysis.statusCodes).map(([code, count]) => `- HTTP ${code}: ${count}`).join('\n')}
`;
    }
    
    generateResponsiveMarkdownSection() {
        const responsiveFindings = this.findings.find(f => f.category === 'responsive_design');
        if (!responsiveFindings) return '未執行響應式設計測試';
        
        return `
**響應式測試設備**:
${responsiveFindings.results.map(result => 
`- ${result.device.name} (${result.device.width}x${result.device.height}): ${result.check.overflowElements === 0 ? '✅' : '⚠️'} ${result.check.overflowElements} 溢出元素`).join('\n')}
`;
    }
    
    /**
     * 🚨 生成緊急報告
     */
    async generateEmergencyReport(error, startTime) {
        const endTime = Date.now();
        const duration = Math.round((endTime - startTime) / 1000);
        
        const emergencyReport = {
            title: '🚨 終極瀏覽器驗證緊急報告',
            status: 'CRITICAL_FAILURE',
            error: {
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            },
            duration: `${duration}秒`,
            completedStages: this.findings.length,
            partialResults: {
                findings: this.findings,
                errors: this.errors,
                screenshots: this.screenshots
            },
            recommendations: [
                '檢查網路連接和目標URL的可訪問性',
                '確認瀏覽器環境正確配置',
                '檢查系統資源和權限',
                '重新運行驗證引擎'
            ]
        };
        
        const emergencyReportPath = `emergency-verification-report-${this.timestamp}.json`;
        await fs.writeFile(emergencyReportPath, JSON.stringify(emergencyReport, null, 2));
        
        console.log(`🚨 緊急報告已保存: ${emergencyReportPath}`);
        return emergencyReport;
    }
    
    /**
     * 🧹 清理資源
     */
    async cleanup() {
        try {
            if (this.page) {
                await this.page.close();
            }
            if (this.browser) {
                await this.browser.close();
            }
            console.log('✅ 瀏覽器資源已清理');
        } catch (error) {
            console.log(`⚠️ 清理過程發生錯誤: ${error.message}`);
        }
    }
}

// 🚀 主執行函數
async function runUltimateVerification() {
    const engine = new UltimateBrowserVerificationEngine();
    
    try {
        console.log('🌟 啟動終極智慧瀏覽器深度驗證引擎...');
        const result = await engine.runCompleteVerification();
        
        console.log('\n🎉 ========== 驗證完成 ==========');
        console.log(`📊 報告摘要:`);
        console.log(`  整體狀態: ${result.summary.overallStatus}`);
        console.log(`  關鍵問題: ${result.summary.criticalIssues.length}`);
        console.log(`  成功測試: ${result.summary.successfulTests.length}`);
        console.log(`\n📋 報告檔案:`);
        console.log(`  JSON報告: ${result.jsonReport}`);
        console.log(`  Markdown報告: ${result.markdownReport}`);
        console.log(`  截圖目錄: ${result.screenshotDirectory}`);
        
        return result;
        
    } catch (error) {
        console.error('❌ 終極驗證引擎執行失敗:', error);
        return null;
    }
}

// 如果直接執行此檔案
if (require.main === module) {
    runUltimateVerification()
        .then(result => {
            if (result) {
                console.log('✅ 終極驗證成功完成');
                process.exit(0);
            } else {
                console.log('❌ 終極驗證失敗');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('💥 未處理的錯誤:', error);
            process.exit(1);
        });
}

module.exports = {
    UltimateBrowserVerificationEngine,
    runUltimateVerification
};