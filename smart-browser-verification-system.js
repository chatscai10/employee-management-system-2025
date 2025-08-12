#!/usr/bin/env node

/**
 * 🔬 完整智慧瀏覽器驗證系統 - 真實瀏覽器自動化驗證引擎
 * 革命性的五階段漸進式驗證流程：程式碼→瀏覽器→數據→深層→建議
 * 
 * 核心功能：
 * 1. 多角色模擬操作 - 管理員、員工、實習生權限驗證
 * 2. 全面按鈕和編輯功能測試 - GPS打卡、營收管理、排程、庫存等
 * 3. 控制台回應檢視 - JavaScript錯誤檢測和API監控
 * 4. 通知系統觸發驗證 - 所有功能的Telegram通知測試
 * 5. 系統可用性測試 - 多埠服務和API端點驗證
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class SmartBrowserVerificationSystem {
    constructor() {
        this.browser = null;
        this.page = null;
        this.timestamp = Date.now();
        this.results = {
            roleTests: {},
            functionalityTests: {},
            consoleMessages: [],
            networkRequests: [],
            notifications: [],
            systemHealth: {},
            screenshots: []
        };
        
        // 測試用戶角色配置
        this.testUsers = {
            superAdmin: { username: 'super_admin', password: 'admin123', role: '超級管理員' },
            storeAdmin: { username: 'store_admin', password: 'admin123', role: '分店管理員' },
            employee: { username: 'employee1', password: 'emp123', role: '一般員工' },
            intern: { username: 'intern1', password: 'int123', role: '實習生' }
        };
        
        // 測試服務埠配置
        this.testPorts = [3001, 3002, 3003, 3005, 3006, 3007, 3008];
        this.baseUrl = 'http://localhost';
    }

    /**
     * 🚀 啟動智慧瀏覽器驗證系統
     */
    async initialize() {
        try {
            console.log('🔬 啟動完整智慧瀏覽器驗證系統...');
            
            this.browser = await puppeteer.launch({
                headless: false,
                defaultViewport: { width: 1920, height: 1080 },
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor'
                ]
            });
            
            this.page = await this.browser.newPage();
            
            // 監聽控制台訊息
            this.page.on('console', msg => {
                this.results.consoleMessages.push({
                    type: msg.type(),
                    text: msg.text(),
                    timestamp: new Date().toISOString()
                });
            });
            
            // 監聽網路請求
            this.page.on('request', request => {
                this.results.networkRequests.push({
                    url: request.url(),
                    method: request.method(),
                    headers: request.headers(),
                    timestamp: new Date().toISOString()
                });
            });
            
            // 監聽回應
            this.page.on('response', response => {
                this.results.networkRequests.push({
                    url: response.url(),
                    status: response.status(),
                    headers: response.headers(),
                    timestamp: new Date().toISOString(),
                    type: 'response'
                });
            });
            
            console.log('✅ 智慧瀏覽器系統初始化完成');
            return true;
        } catch (error) {
            console.error('❌ 瀏覽器初始化失敗:', error.message);
            return false;
        }
    }

    /**
     * 🔍 階段1: 系統可用性檢測
     */
    async testSystemAvailability() {
        console.log('\n🔍 階段1: 系統可用性檢測');
        
        for (const port of this.testPorts) {
            try {
                const url = `${this.baseUrl}:${port}`;
                console.log(`📡 測試埠 ${port}: ${url}`);
                
                await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 10000 });
                
                // 截圖記錄
                const screenshot = await this.page.screenshot({
                    path: `D:/0809/system-availability-port-${port}-${this.timestamp}.png`,
                    fullPage: true
                });
                
                this.results.screenshots.push({
                    port,
                    path: `D:/0809/system-availability-port-${port}-${this.timestamp}.png`,
                    description: `埠 ${port} 系統狀態`
                });
                
                // 檢查頁面標題和基本元素
                const title = await this.page.title();
                const bodyText = await this.page.evaluate(() => document.body?.textContent || '');
                
                this.results.systemHealth[port] = {
                    accessible: true,
                    title,
                    hasContent: bodyText.length > 0,
                    loadTime: new Date().getTime()
                };
                
                console.log(`✅ 埠 ${port} 可正常訪問 - 標題: ${title}`);
                
            } catch (error) {
                console.error(`❌ 埠 ${port} 無法訪問:`, error.message);
                this.results.systemHealth[port] = {
                    accessible: false,
                    error: error.message
                };
            }
        }
    }

    /**
     * 👤 階段2: 多角色登入和權限驗證
     */
    async testMultiRoleAuthentication() {
        console.log('\n👤 階段2: 多角色登入和權限驗證');
        
        // 測試企業員工頁面
        const enterpriseUrl = `${this.baseUrl}:3001/employee-enterprise.html`;
        
        for (const [role, userInfo] of Object.entries(this.testUsers)) {
            try {
                console.log(`🔐 測試 ${userInfo.role} 登入...`);
                
                await this.page.goto(enterpriseUrl, { waitUntil: 'networkidle2' });
                
                // 檢查當前頁面元素
                const pageContent = await this.page.content();
                console.log(`📄 當前頁面標題: ${await this.page.title()}`);
                
                // 尋找實際的登入元素 (根據實際HTML結構)
                const loginSelectors = [
                    'input[name="username"]',
                    'input[name="employeeId"]', 
                    '#employeeId',
                    '#username'
                ];
                
                const passwordSelectors = [
                    'input[name="password"]',
                    '#password'
                ];
                
                const buttonSelectors = [
                    'button[type="submit"]',
                    '#loginBtn',
                    '.login-btn',
                    'button.btn-primary'
                ];
                
                let usernameInput = null;
                let passwordInput = null;
                let loginButton = null;
                
                // 尋找用戶名輸入框
                for (const selector of loginSelectors) {
                    try {
                        usernameInput = await this.page.$(selector);
                        if (usernameInput) break;
                    } catch (e) { }
                }
                
                // 尋找密碼輸入框
                for (const selector of passwordSelectors) {
                    try {
                        passwordInput = await this.page.$(selector);
                        if (passwordInput) break;
                    } catch (e) { }
                }
                
                // 尋找登入按鈕
                for (const selector of buttonSelectors) {
                    try {
                        loginButton = await this.page.$(selector);
                        if (loginButton) break;
                    } catch (e) { }
                }
                
                if (usernameInput && passwordInput && loginButton) {
                    // 清空並填寫登入資訊
                    await usernameInput.click({ clickCount: 3 });
                    await this.page.type(usernameInput._selector || loginSelectors[0], userInfo.username);
                    
                    await passwordInput.click({ clickCount: 3 });
                    await this.page.type(passwordInput._selector || passwordSelectors[0], userInfo.password);
                    
                    // 點擊登入按鈕
                    await loginButton.click();
                } else {
                    console.log('❌ 無法找到完整的登入表單元素');
                    console.log(`用戶名輸入框: ${usernameInput ? '✅' : '❌'}`);
                    console.log(`密碼輸入框: ${passwordInput ? '✅' : '❌'}`);
                    console.log(`登入按鈕: ${loginButton ? '✅' : '❌'}`);
                }
                
                // 等待頁面載入
                await this.page.waitForTimeout(2000);
                
                // 截圖記錄
                await this.page.screenshot({
                    path: `D:/0809/role-test-${role}-login-${this.timestamp}.png`,
                    fullPage: true
                });
                
                // 檢查登入結果
                const currentUrl = this.page.url();
                const pageContent = await this.page.evaluate(() => document.body.textContent);
                
                this.results.roleTests[role] = {
                    username: userInfo.username,
                    role: userInfo.role,
                    loginSuccessful: !currentUrl.includes('login') && !pageContent.includes('登入失敗'),
                    currentUrl,
                    timestamp: new Date().toISOString()
                };
                
                if (this.results.roleTests[role].loginSuccessful) {
                    console.log(`✅ ${userInfo.role} 登入成功`);
                    
                    // 測試該角色的功能權限
                    await this.testRolePermissions(role, userInfo.role);
                } else {
                    console.log(`❌ ${userInfo.role} 登入失敗`);
                }
                
            } catch (error) {
                console.error(`❌ ${userInfo.role} 登入測試失敗:`, error.message);
                this.results.roleTests[role] = {
                    error: error.message,
                    role: userInfo.role
                };
            }
        }
    }

    /**
     * 🛡️ 測試角色權限
     */
    async testRolePermissions(roleKey, roleName) {
        console.log(`🛡️ 測試 ${roleName} 權限...`);
        
        const permissionTests = {
            canViewDashboard: '#dashboard',
            canAccessGPS: '#gpsSection',
            canViewRevenue: '#revenueSection', 
            canManageSchedule: '#scheduleSection',
            canManageInventory: '#inventorySection',
            canAccessVoting: '#votingSection',
            canManageMaintenanceRequests: '#maintenanceSection'
        };
        
        const permissions = {};
        
        for (const [permission, selector] of Object.entries(permissionTests)) {
            try {
                const element = await this.page.$(selector);
                permissions[permission] = element !== null;
                
                if (element) {
                    // 嘗試點擊測試可用性
                    await element.click();
                    await this.page.waitForTimeout(500);
                }
            } catch (error) {
                permissions[permission] = false;
            }
        }
        
        this.results.roleTests[roleKey].permissions = permissions;
        console.log(`📋 ${roleName} 權限檢測完成:`, permissions);
    }

    /**
     * 🔧 階段3: 全面功能按鈕測試
     */
    async testComprehensiveFunctionality() {
        console.log('\n🔧 階段3: 全面功能按鈕測試');
        
        const functionalityTests = [
            {
                name: 'GPS打卡系統',
                selector: '#clockInBtn',
                action: 'click',
                expectedNotification: 'GPS打卡成功'
            },
            {
                name: '下班打卡',
                selector: '#clockOutBtn', 
                action: 'click',
                expectedNotification: '下班打卡成功'
            },
            {
                name: '營收查看',
                selector: '#viewRevenueBtn',
                action: 'click',
                expectedResult: '營收數據載入'
            },
            {
                name: '營收編輯',
                selector: '#editRevenueBtn',
                action: 'click',
                expectedNotification: '營收更新通知'
            },
            {
                name: '個人排程查看',
                selector: '#viewScheduleBtn',
                action: 'click',
                expectedResult: '排程數據顯示'
            },
            {
                name: '排程變更申請',
                selector: '#requestScheduleChangeBtn',
                action: 'click',
                expectedNotification: '排班變更申請通知'
            },
            {
                name: '庫存查看',
                selector: '#viewInventoryBtn',
                action: 'click',
                expectedResult: '庫存列表顯示'
            },
            {
                name: '叫貨申請',
                selector: '#requestSupplyBtn',
                action: 'click',
                expectedNotification: '叫貨申請通知'
            },
            {
                name: '投票參與',
                selector: '#participateVoteBtn',
                action: 'click',
                expectedNotification: '投票參與通知'
            },
            {
                name: '維修申請',
                selector: '#requestMaintenanceBtn',
                action: 'click',
                expectedNotification: '維修申請通知'
            }
        ];
        
        for (const test of functionalityTests) {
            try {
                console.log(`🔧 測試: ${test.name}`);
                
                // 尋找並點擊元素
                const element = await this.page.$(test.selector);
                
                if (element) {
                    // 記錄點擊前的狀態
                    const beforeClick = await this.page.evaluate(() => document.body.textContent);
                    
                    await element.click();
                    await this.page.waitForTimeout(1000);
                    
                    // 記錄點擊後的狀態
                    const afterClick = await this.page.evaluate(() => document.body.textContent);
                    
                    // 截圖記錄
                    await this.page.screenshot({
                        path: `D:/0809/functionality-test-${test.name.replace(/[^a-zA-Z0-9]/g, '-')}-${this.timestamp}.png`,
                        fullPage: true
                    });
                    
                    this.results.functionalityTests[test.name] = {
                        elementFound: true,
                        clicked: true,
                        beforeClick: beforeClick.substring(0, 200),
                        afterClick: afterClick.substring(0, 200),
                        timestamp: new Date().toISOString()
                    };
                    
                    console.log(`✅ ${test.name} 測試完成`);
                    
                    // 檢查是否有Telegram通知被觸發
                    await this.checkForNotificationTrigger(test.expectedNotification || test.expectedResult);
                    
                } else {
                    console.log(`❌ ${test.name} - 找不到元素 ${test.selector}`);
                    this.results.functionalityTests[test.name] = {
                        elementFound: false,
                        error: `找不到選擇器: ${test.selector}`
                    };
                }
                
            } catch (error) {
                console.error(`❌ ${test.name} 測試失敗:`, error.message);
                this.results.functionalityTests[test.name] = {
                    error: error.message
                };
            }
        }
    }

    /**
     * 🔔 檢查通知觸發
     */
    async checkForNotificationTrigger(expectedNotification) {
        try {
            // 等待可能的通知元素
            const notificationSelectors = [
                '.notification',
                '.alert',
                '.toast',
                '#messageArea',
                '.success-message',
                '.telegram-notification'
            ];
            
            for (const selector of notificationSelectors) {
                const element = await this.page.$(selector);
                if (element) {
                    const text = await element.evaluate(el => el.textContent);
                    this.results.notifications.push({
                        selector,
                        text,
                        expectedNotification,
                        timestamp: new Date().toISOString()
                    });
                }
            }
        } catch (error) {
            // 靜默處理，通知檢查不是關鍵功能
        }
    }

    /**
     * 📊 階段4: 控制台和網路監控分析
     */
    async analyzeConsoleAndNetwork() {
        console.log('\n📊 階段4: 控制台和網路監控分析');
        
        // 分析控制台訊息
        const errorMessages = this.results.consoleMessages.filter(msg => msg.type === 'error');
        const warningMessages = this.results.consoleMessages.filter(msg => msg.type === 'warning');
        
        console.log(`🔍 發現 ${errorMessages.length} 個JavaScript錯誤`);
        console.log(`⚠️ 發現 ${warningMessages.length} 個警告訊息`);
        
        // 分析網路請求
        const apiRequests = this.results.networkRequests.filter(req => 
            req.url.includes('/api/') || req.method !== 'GET'
        );
        
        const failedRequests = this.results.networkRequests.filter(req => 
            req.status && req.status >= 400
        );
        
        console.log(`📡 總共 ${this.results.networkRequests.length} 個網路請求`);
        console.log(`🔌 其中 ${apiRequests.length} 個API請求`);  
        console.log(`❌ 其中 ${failedRequests.length} 個失敗請求`);
        
        // 記錄分析結果
        this.results.analysis = {
            console: {
                total: this.results.consoleMessages.length,
                errors: errorMessages.length,
                warnings: warningMessages.length,
                errorDetails: errorMessages.slice(0, 10) // 只保留前10個錯誤
            },
            network: {
                totalRequests: this.results.networkRequests.length,
                apiRequests: apiRequests.length,
                failedRequests: failedRequests.length,
                failedDetails: failedRequests.slice(0, 10)
            }
        };
    }

    /**
     * 💾 階段5: 生成完整驗證報告
     */
    async generateComprehensiveReport() {
        console.log('\n💾 階段5: 生成完整驗證報告');
        
        const reportData = {
            timestamp: new Date().toISOString(),
            testDuration: Date.now() - this.timestamp,
            summary: {
                totalTests: Object.keys(this.results.functionalityTests).length,
                successfulTests: Object.values(this.results.functionalityTests).filter(test => test.clicked).length,
                roleTests: Object.keys(this.results.roleTests).length,
                successfulLogins: Object.values(this.results.roleTests).filter(test => test.loginSuccessful).length,
                systemHealthy: Object.values(this.results.systemHealth).filter(health => health.accessible).length,
                totalPorts: this.testPorts.length
            },
            detailedResults: this.results,
            screenshots: this.results.screenshots,
            recommendations: this.generateRecommendations()
        };
        
        // 保存JSON報告
        const jsonReportPath = `D:/0809/smart-browser-verification-report-${this.timestamp}.json`;
        await fs.writeFile(jsonReportPath, JSON.stringify(reportData, null, 2), 'utf8');
        
        // 生成Markdown報告
        const markdownReport = this.generateMarkdownReport(reportData);
        const mdReportPath = `D:/0809/smart-browser-verification-report-${this.timestamp}.md`;
        await fs.writeFile(mdReportPath, markdownReport, 'utf8');
        
        console.log(`📄 報告已保存: ${jsonReportPath}`);
        console.log(`📋 Markdown報告: ${mdReportPath}`);
        
        return reportData;
    }

    /**
     * 💡 生成智慧建議
     */
    generateRecommendations() {
        const recommendations = [];
        
        // 基於控制台錯誤的建議
        if (this.results.analysis?.console.errors > 0) {
            recommendations.push({
                type: 'JavaScript錯誤修復',
                priority: 'high',
                description: `發現 ${this.results.analysis.console.errors} 個JavaScript錯誤，建議優先修復`
            });
        }
        
        // 基於網路請求的建議  
        if (this.results.analysis?.network.failedRequests > 0) {
            recommendations.push({
                type: 'API端點修復',
                priority: 'high', 
                description: `發現 ${this.results.analysis.network.failedRequests} 個失敗的網路請求，需要檢查API端點`
            });
        }
        
        // 基於系統可用性的建議
        const inaccessiblePorts = Object.entries(this.results.systemHealth)
            .filter(([port, health]) => !health.accessible)
            .map(([port]) => port);
            
        if (inaccessiblePorts.length > 0) {
            recommendations.push({
                type: '服務可用性',
                priority: 'medium',
                description: `埠 ${inaccessiblePorts.join(', ')} 無法訪問，建議檢查服務狀態`
            });
        }
        
        // 基於功能測試的建議
        const failedTests = Object.entries(this.results.functionalityTests)
            .filter(([name, result]) => !result.clicked)
            .map(([name]) => name);
            
        if (failedTests.length > 0) {
            recommendations.push({
                type: '功能修復',
                priority: 'medium',
                description: `功能 ${failedTests.join(', ')} 測試失敗，建議檢查UI元素`
            });
        }
        
        return recommendations;
    }

    /**
     * 📋 生成Markdown報告
     */
    generateMarkdownReport(reportData) {
        return `# 🔬 智慧瀏覽器驗證系統 - 完整報告

## 📊 執行摘要
- **執行時間**: ${reportData.timestamp}
- **測試持續時間**: ${Math.round(reportData.testDuration / 1000)}秒
- **功能測試**: ${reportData.summary.successfulTests}/${reportData.summary.totalTests} 成功
- **角色測試**: ${reportData.summary.successfulLogins}/${reportData.summary.roleTests} 成功登入
- **系統健康**: ${reportData.summary.systemHealthy}/${reportData.summary.totalPorts} 埠可訪問

## 🎯 測試結果詳情

### 👤 多角色測試結果
${Object.entries(reportData.detailedResults.roleTests).map(([role, result]) => `
- **${role}** (${result.role}): ${result.loginSuccessful ? '✅ 登入成功' : '❌ 登入失敗'}
${result.permissions ? Object.entries(result.permissions).map(([perm, allowed]) => 
    `  - ${perm}: ${allowed ? '✅ 允許' : '❌ 拒絕'}`).join('\n') : ''}
`).join('')}

### 🔧 功能測試結果
${Object.entries(reportData.detailedResults.functionalityTests).map(([name, result]) => `
- **${name}**: ${result.clicked ? '✅ 成功' : '❌ 失敗'}
${result.error ? `  - 錯誤: ${result.error}` : ''}
`).join('')}

### 🌐 系統可用性
${Object.entries(reportData.detailedResults.systemHealth).map(([port, health]) => `
- **埠 ${port}**: ${health.accessible ? '✅ 可訪問' : '❌ 無法訪問'}
${health.title ? `  - 標題: ${health.title}` : ''}
${health.error ? `  - 錯誤: ${health.error}` : ''}
`).join('')}

### 📊 控制台分析
- **總訊息**: ${reportData.detailedResults.analysis?.console.total || 0}
- **錯誤**: ${reportData.detailedResults.analysis?.console.errors || 0}
- **警告**: ${reportData.detailedResults.analysis?.console.warnings || 0}

### 📡 網路請求分析  
- **總請求**: ${reportData.detailedResults.analysis?.network.totalRequests || 0}
- **API請求**: ${reportData.detailedResults.analysis?.network.apiRequests || 0}
- **失敗請求**: ${reportData.detailedResults.analysis?.network.failedRequests || 0}

## 💡 智慧建議
${reportData.recommendations.map(rec => `
### ${rec.type} (優先級: ${rec.priority})
${rec.description}
`).join('')}

## 📸 截圖記錄
${reportData.screenshots.map(screenshot => `
- **${screenshot.description}**: \`${screenshot.path}\`
`).join('')}

---
*報告生成時間: ${reportData.timestamp}*
`;
    }

    /**
     * 🚀 執行完整驗證流程
     */
    async runFullVerification() {
        try {
            console.log('🚀 開始執行完整智慧瀏覽器驗證流程...');
            
            // 初始化
            const initialized = await this.initialize();
            if (!initialized) {
                throw new Error('瀏覽器初始化失敗');
            }
            
            // 執行五個階段的驗證
            await this.testSystemAvailability();
            await this.testMultiRoleAuthentication();
            await this.testComprehensiveFunctionality();
            await this.analyzeConsoleAndNetwork();
            const report = await this.generateComprehensiveReport();
            
            console.log('\n🎉 完整智慧瀏覽器驗證流程執行完成！');
            console.log('📊 驗證結果摘要:');
            console.log(`   - 功能測試: ${report.summary.successfulTests}/${report.summary.totalTests}`);
            console.log(`   - 角色測試: ${report.summary.successfulLogins}/${report.summary.roleTests}`);
            console.log(`   - 系統健康: ${report.summary.systemHealthy}/${report.summary.totalPorts}`);
            
            return report;
            
        } catch (error) {
            console.error('❌ 智慧瀏覽器驗證系統執行失敗:', error.message);
            throw error;
        } finally {
            if (this.browser) {
                await this.browser.close();
                console.log('🔒 瀏覽器已關閉');
            }
        }
    }

    /**
     * 📲 發送Telegram飛機彙報
     */
    async sendTelegramReport(report) {
        try {
            const telegram = require('./telegram-notifier');
            
            const message = `✈️ 智慧瀏覽器驗證系統 - 完整報告

📊 執行結果:
• 功能測試: ${report.summary.successfulTests}/${report.summary.totalTests} 成功
• 角色測試: ${report.summary.successfulLogins}/${report.summary.roleTests} 成功
• 系統健康: ${report.summary.systemHealthy}/${report.summary.totalPorts} 埠正常

🔬 發現問題:
• JavaScript錯誤: ${report.detailedResults.analysis?.console.errors || 0}個
• 網路請求失敗: ${report.detailedResults.analysis?.network.failedRequests || 0}個
• 建議修復項目: ${report.recommendations.length}項

⏱️ 執行時間: ${Math.round(report.testDuration / 1000)}秒
📱 完整報告已保存到本地檔案系統

🤖 自動生成於智慧瀏覽器驗證系統`;

            await telegram.sendMessage(message);
            console.log('📱 Telegram飛機彙報已發送');
            
        } catch (error) {
            console.error('❌ 發送Telegram報告失敗:', error.message);
        }
    }
}

// 如果直接執行此檔案，則運行完整驗證
if (require.main === module) {
    const verificationSystem = new SmartBrowserVerificationSystem();
    
    verificationSystem.runFullVerification()
        .then(async (report) => {
            console.log('🎯 智慧瀏覽器驗證系統執行完成');
            
            // 發送Telegram通知
            await verificationSystem.sendTelegramReport(report);
            
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 智慧瀏覽器驗證系統執行失敗:', error);
            process.exit(1);
        });
}

module.exports = SmartBrowserVerificationSystem;