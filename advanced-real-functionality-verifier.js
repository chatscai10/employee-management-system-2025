#!/usr/bin/env node

/**
 * 🎯 進階真實功能驗證系統
 * 基於HTML實際結構的智慧瀏覽器驗證引擎
 * 
 * 核心特色：
 * 1. 動態元素檢測 - 智慧識別頁面中實際存在的按鈕和功能
 * 2. 真實用戶流程模擬 - 完整模擬從登入到各功能操作的整個流程
 * 3. Telegram通知觸發驗證 - 確保每個操作都正確觸發後端通知
 * 4. 多頁面流程驗證 - 測試頁面跳轉和狀態保持
 * 5. 深度互動測試 - 表單填寫、數據提交、檔案上傳等複雜操作
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;

class AdvancedRealFunctionalityVerifier {
    constructor() {
        this.browser = null;
        this.page = null;
        this.timestamp = Date.now();
        this.baseUrl = 'http://localhost:3001';
        this.results = {
            pageStructures: {},
            realFunctionalities: {},
            telegramNotifications: [],
            userFlows: {},
            deepInteractions: {},
            screenshots: [],
            errors: []
        };
    }

    /**
     * 🚀 初始化進階驗證系統
     */
    async initialize() {
        try {
            console.log('🎯 啟動進階真實功能驗證系統...');
            
            this.browser = await puppeteer.launch({
                headless: false,
                defaultViewport: { width: 1920, height: 1080 },
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-web-security'
                ]
            });
            
            this.page = await this.browser.newPage();
            
            // 設定監聽器
            this.setupEventListeners();
            
            console.log('✅ 進階驗證系統初始化完成');
            return true;
        } catch (error) {
            console.error('❌ 初始化失敗:', error.message);
            return false;
        }
    }

    /**
     * 🎧 設定事件監聽器
     */
    setupEventListeners() {
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                this.results.errors.push({
                    type: 'console',
                    message: msg.text(),
                    timestamp: new Date().toISOString()
                });
            }
        });

        this.page.on('response', response => {
            const url = response.url();
            if (url.includes('telegram') || url.includes('notification')) {
                this.results.telegramNotifications.push({
                    url,
                    status: response.status(),
                    timestamp: new Date().toISOString()
                });
            }
        });
    }

    /**
     * 🔍 階段1: 頁面結構深度分析
     */
    async analyzePageStructures() {
        console.log('\n🔍 階段1: 頁面結構深度分析');
        
        const pages = [
            { name: '登入頁面', url: `${this.baseUrl}/login.html` },
            { name: '員工工作台', url: `${this.baseUrl}/employee-dashboard.html` },
            { name: '企業員工頁面', url: `${this.baseUrl}/employee-enterprise.html` }
        ];

        for (const pageInfo of pages) {
            try {
                console.log(`📄 分析 ${pageInfo.name}: ${pageInfo.url}`);
                
                await this.page.goto(pageInfo.url, { waitUntil: 'networkidle2' });
                
                // 截圖記錄
                const screenshotPath = `D:/0809/page-analysis-${pageInfo.name.replace(/[^a-zA-Z0-9]/g, '-')}-${this.timestamp}.png`;
                await this.page.screenshot({
                    path: screenshotPath,
                    fullPage: true
                });
                
                this.results.screenshots.push({
                    description: `${pageInfo.name} 結構分析`,
                    path: screenshotPath
                });

                // 分析頁面結構
                const structure = await this.page.evaluate(() => {
                    const getAllClickableElements = () => {
                        const selectors = [
                            'button',
                            'a[href]',
                            'input[type="button"]',
                            'input[type="submit"]',
                            '[onclick]',
                            '.btn',
                            '.action-btn',
                            '.nav-link'
                        ];

                        const elements = [];
                        selectors.forEach(selector => {
                            const found = document.querySelectorAll(selector);
                            found.forEach(el => {
                                const rect = el.getBoundingClientRect();
                                if (rect.width > 0 && rect.height > 0) { // 只要可見元素
                                    elements.push({
                                        tagName: el.tagName,
                                        selector: selector,
                                        text: el.textContent?.trim() || '',
                                        id: el.id || '',
                                        className: el.className || '',
                                        onclick: el.getAttribute('onclick') || '',
                                        href: el.getAttribute('href') || '',
                                        visible: true,
                                        position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
                                    });
                                }
                            });
                        });
                        return elements;
                    };

                    const getAllFormElements = () => {
                        const inputs = Array.from(document.querySelectorAll('input, select, textarea')).map(el => ({
                            tagName: el.tagName,
                            type: el.type,
                            name: el.name,
                            id: el.id,
                            placeholder: el.placeholder || '',
                            required: el.required
                        }));
                        return inputs;
                    };

                    return {
                        title: document.title,
                        url: window.location.href,
                        clickableElements: getAllClickableElements(),
                        formElements: getAllFormElements(),
                        bodyText: document.body.textContent.slice(0, 500)
                    };
                });

                this.results.pageStructures[pageInfo.name] = structure;
                console.log(`✅ ${pageInfo.name} 分析完成 - 發現 ${structure.clickableElements.length} 個可點擊元素`);

            } catch (error) {
                console.error(`❌ ${pageInfo.name} 分析失敗:`, error.message);
                this.results.errors.push({
                    type: 'pageAnalysis',
                    page: pageInfo.name,
                    error: error.message
                });
            }
        }
    }

    /**
     * 👥 階段2: 真實用戶登入流程驗證
     */
    async testRealUserLoginFlow() {
        console.log('\n👥 階段2: 真實用戶登入流程驗證');
        
        try {
            // 前往登入頁面
            await this.page.goto(`${this.baseUrl}/login.html`, { waitUntil: 'networkidle2' });
            
            // 分析登入頁面的實際表單結構
            const loginStructure = this.results.pageStructures['登入頁面'];
            const nameInput = loginStructure?.formElements.find(el => el.name === 'name' || el.id.includes('name'));
            const idInput = loginStructure?.formElements.find(el => el.name === 'idNumber' || el.id.includes('id'));
            
            if (nameInput && idInput) {
                console.log('📝 填寫真實登入表單...');
                
                // 填寫姓名
                await this.page.type(`#${nameInput.id}`, '測試員工');
                await this.page.waitForTimeout(500);
                
                // 填寫身分證號
                await this.page.type(`#${idInput.id}`, 'A123456789');
                await this.page.waitForTimeout(500);
                
                // 截圖記錄填寫狀態
                await this.page.screenshot({
                    path: `D:/0809/login-form-filled-${this.timestamp}.png`,
                    fullPage: true
                });
                
                // 尋找並點擊提交按鈕
                const submitButton = await this.page.$('button[type="submit"], .btn-primary, #submitBtn');
                if (submitButton) {
                    console.log('🔐 提交登入表單...');
                    await submitButton.click();
                    
                    // 等待頁面響應
                    await this.page.waitForTimeout(3000);
                    
                    // 檢查是否成功跳轉
                    const currentUrl = this.page.url();
                    const isLoginSuccessful = currentUrl !== `${this.baseUrl}/login.html`;
                    
                    this.results.userFlows['登入流程'] = {
                        successful: isLoginSuccessful,
                        initialUrl: `${this.baseUrl}/login.html`,
                        finalUrl: currentUrl,
                        formFilled: true,
                        timestamp: new Date().toISOString()
                    };
                    
                    if (isLoginSuccessful) {
                        console.log('✅ 登入成功，已跳轉至:', currentUrl);
                        
                        // 截圖記錄登入後狀態
                        await this.page.screenshot({
                            path: `D:/0809/post-login-${this.timestamp}.png`,
                            fullPage: true
                        });
                        
                    } else {
                        console.log('❌ 登入後未跳轉');
                    }
                } else {
                    console.log('❌ 找不到提交按鈕');
                    this.results.userFlows['登入流程'] = {
                        successful: false,
                        error: '找不到提交按鈕'
                    };
                }
            } else {
                console.log('❌ 找不到登入表單元素');
                this.results.userFlows['登入流程'] = {
                    successful: false,
                    error: '找不到登入表單元素'
                };
            }
            
        } catch (error) {
            console.error('❌ 登入流程測試失敗:', error.message);
            this.results.userFlows['登入流程'] = {
                successful: false,
                error: error.message
            };
        }
    }

    /**
     * 🔧 階段3: 真實功能按鈕互動測試
     */
    async testRealFunctionalities() {
        console.log('\n🔧 階段3: 真實功能按鈕互動測試');
        
        // 先確保在正確的頁面上
        const currentUrl = this.page.url();
        if (!currentUrl.includes('employee-dashboard') && !currentUrl.includes('employee-enterprise')) {
            console.log('📍 嘗試直接存取員工工作台...');
            await this.page.goto(`${this.baseUrl}/employee-dashboard.html`, { waitUntil: 'networkidle2' });
        }
        
        // 取得當前頁面的可點擊元素
        const pageStructure = this.results.pageStructures['員工工作台'] || this.results.pageStructures['企業員工頁面'];
        
        if (pageStructure && pageStructure.clickableElements) {
            console.log(`🎯 發現 ${pageStructure.clickableElements.length} 個可互動元素`);
            
            // 測試實際存在的功能按鈕
            const functionalButtons = pageStructure.clickableElements.filter(el => 
                el.text && (
                    el.text.includes('打卡') ||
                    el.text.includes('查看') ||
                    el.text.includes('申請') ||
                    el.text.includes('編輯') ||
                    el.text.includes('管理') ||
                    el.text.includes('報告') ||
                    el.onclick
                )
            );
            
            console.log(`🎲 準備測試 ${functionalButtons.length} 個功能按鈕`);
            
            for (let i = 0; i < Math.min(functionalButtons.length, 10); i++) {
                const button = functionalButtons[i];
                try {
                    console.log(`🔘 測試按鈕: "${button.text}"`);
                    
                    // 嘗試多種選擇器策略
                    let element = null;
                    const selectors = [
                        `#${button.id}`,
                        `.${button.className.split(' ')[0]}`,
                        `${button.tagName.toLowerCase()}[onclick="${button.onclick}"]`,
                        `${button.tagName.toLowerCase()}`
                    ].filter(s => s && s !== '#' && s !== '.');
                    
                    for (const selector of selectors) {
                        try {
                            const elements = await this.page.$$(selector);
                            for (const el of elements) {
                                const text = await el.evaluate(e => e.textContent?.trim());
                                if (text === button.text) {
                                    element = el;
                                    break;
                                }
                            }
                            if (element) break;
                        } catch (e) { }
                    }
                    
                    if (element) {
                        // 記錄點擊前狀態
                        const beforeClick = await this.page.evaluate(() => document.body.textContent.slice(0, 200));
                        
                        // 點擊元素
                        await element.click();
                        await this.page.waitForTimeout(1000);
                        
                        // 記錄點擊後狀態
                        const afterClick = await this.page.evaluate(() => document.body.textContent.slice(0, 200));
                        
                        // 截圖記錄
                        const screenshotPath = `D:/0809/functionality-${button.text.replace(/[^a-zA-Z0-9]/g, '-')}-${this.timestamp}.png`;
                        await this.page.screenshot({
                            path: screenshotPath,
                            fullPage: true
                        });
                        
                        this.results.realFunctionalities[button.text] = {
                            clicked: true,
                            beforeClick,
                            afterClick,
                            changed: beforeClick !== afterClick,
                            screenshotPath,
                            timestamp: new Date().toISOString()
                        };
                        
                        console.log(`✅ "${button.text}" 點擊成功`);
                        
                        // 檢查是否觸發了Telegram通知
                        await this.checkTelegramNotification(button.text);
                        
                    } else {
                        console.log(`❌ 無法定位按鈕: "${button.text}"`);
                        this.results.realFunctionalities[button.text] = {
                            clicked: false,
                            error: '無法定位元素'
                        };
                    }
                    
                } catch (error) {
                    console.error(`❌ 按鈕 "${button.text}" 測試失敗:`, error.message);
                    this.results.realFunctionalities[button.text] = {
                        clicked: false,
                        error: error.message
                    };
                }
            }
            
        } else {
            console.log('❌ 沒有找到頁面結構資料');
        }
    }

    /**
     * 📱 檢查Telegram通知觸發
     */
    async checkTelegramNotification(actionName) {
        try {
            // 等待可能的API請求
            await this.page.waitForTimeout(1500);
            
            // 檢查是否有相關的網路請求
            const recentNotifications = this.results.telegramNotifications.filter(notification => {
                const timeDiff = Date.now() - new Date(notification.timestamp).getTime();
                return timeDiff < 5000; // 5秒內的通知
            });
            
            if (recentNotifications.length > 0) {
                console.log(`📱 "${actionName}" 觸發了 ${recentNotifications.length} 個通知請求`);
                this.results.realFunctionalities[actionName].notifications = recentNotifications;
            }
            
        } catch (error) {
            // 靜默處理通知檢查錯誤
        }
    }

    /**
     * 🎯 階段4: 深度互動流程測試
     */
    async testDeepInteractions() {
        console.log('\n🎯 階段4: 深度互動流程測試');
        
        const interactions = [
            {
                name: '表單填寫測試',
                action: async () => {
                    const forms = await this.page.$$('form');
                    let filled = 0;
                    
                    for (const form of forms) {
                        const inputs = await form.$$('input[type="text"], input[type="email"], textarea');
                        for (let i = 0; i < Math.min(inputs.length, 3); i++) {
                            try {
                                await inputs[i].type(`測試資料${i + 1}`);
                                filled++;
                            } catch (e) { }
                        }
                    }
                    
                    return { filled, forms: forms.length };
                }
            },
            {
                name: '下拉選單測試',
                action: async () => {
                    const selects = await this.page.$$('select');
                    let changed = 0;
                    
                    for (const select of selects) {
                        try {
                            const options = await select.$$('option');
                            if (options.length > 1) {
                                await select.select(await options[1].evaluate(opt => opt.value));
                                changed++;
                            }
                        } catch (e) { }
                    }
                    
                    return { changed, selects: selects.length };
                }
            },
            {
                name: '標籤頁切換測試',
                action: async () => {
                    const tabs = await this.page.$$('[role="tab"], .nav-link, .tab-button');
                    let switched = 0;
                    
                    for (let i = 0; i < Math.min(tabs.length, 5); i++) {
                        try {
                            await tabs[i].click();
                            await this.page.waitForTimeout(500);
                            switched++;
                        } catch (e) { }
                    }
                    
                    return { switched, tabs: tabs.length };
                }
            }
        ];
        
        for (const interaction of interactions) {
            try {
                console.log(`🔄 執行: ${interaction.name}`);
                const result = await interaction.action();
                
                this.results.deepInteractions[interaction.name] = {
                    successful: true,
                    result,
                    timestamp: new Date().toISOString()
                };
                
                console.log(`✅ ${interaction.name} 完成:`, result);
                
                // 截圖記錄
                await this.page.screenshot({
                    path: `D:/0809/interaction-${interaction.name.replace(/[^a-zA-Z0-9]/g, '-')}-${this.timestamp}.png`,
                    fullPage: true
                });
                
            } catch (error) {
                console.error(`❌ ${interaction.name} 失敗:`, error.message);
                this.results.deepInteractions[interaction.name] = {
                    successful: false,
                    error: error.message
                };
            }
        }
    }

    /**
     * 📊 階段5: 生成進階驗證報告
     */
    async generateAdvancedReport() {
        console.log('\n📊 階段5: 生成進階驗證報告');
        
        const report = {
            timestamp: new Date().toISOString(),
            testDuration: Date.now() - this.timestamp,
            summary: {
                pagesAnalyzed: Object.keys(this.results.pageStructures).length,
                totalClickableElements: Object.values(this.results.pageStructures)
                    .reduce((sum, page) => sum + (page.clickableElements?.length || 0), 0),
                functionalitiesTested: Object.keys(this.results.realFunctionalities).length,
                functionalitiesSuccessful: Object.values(this.results.realFunctionalities)
                    .filter(test => test.clicked).length,
                deepInteractionsSuccessful: Object.values(this.results.deepInteractions)
                    .filter(test => test.successful).length,
                totalScreenshots: this.results.screenshots.length,
                totalErrors: this.results.errors.length,
                telegramNotifications: this.results.telegramNotifications.length
            },
            results: this.results
        };
        
        // 儲存JSON報告
        const jsonPath = `D:/0809/advanced-real-functionality-report-${this.timestamp}.json`;
        await fs.writeFile(jsonPath, JSON.stringify(report, null, 2));
        
        // 生成詳細Markdown報告
        const markdownReport = this.generateAdvancedMarkdownReport(report);
        const mdPath = `D:/0809/advanced-real-functionality-report-${this.timestamp}.md`;
        await fs.writeFile(mdPath, markdownReport);
        
        console.log(`📄 進階報告已保存: ${jsonPath}`);
        console.log(`📋 Markdown報告: ${mdPath}`);
        
        return report;
    }

    /**
     * 📝 生成進階Markdown報告
     */
    generateAdvancedMarkdownReport(report) {
        return `# 🎯 進階真實功能驗證系統 - 完整報告

## 📊 執行摘要
- **執行時間**: ${report.timestamp}
- **測試持續時間**: ${Math.round(report.testDuration / 1000)}秒
- **頁面分析**: ${report.summary.pagesAnalyzed} 個頁面
- **可點擊元素**: 總計 ${report.summary.totalClickableElements} 個
- **功能測試**: ${report.summary.functionalitiesSuccessful}/${report.summary.functionalitiesTested} 成功
- **深度互動**: ${report.summary.deepInteractionsSuccessful}/${Object.keys(report.results.deepInteractions).length} 成功  
- **Telegram通知**: ${report.summary.telegramNotifications} 個觸發
- **截圖記錄**: ${report.summary.totalScreenshots} 張
- **錯誤發現**: ${report.summary.totalErrors} 個

## 🔍 頁面結構分析

${Object.entries(report.results.pageStructures).map(([pageName, structure]) => `
### ${pageName}
- **URL**: ${structure.url}
- **標題**: ${structure.title}
- **可點擊元素**: ${structure.clickableElements?.length || 0} 個
- **表單元素**: ${structure.formElements?.length || 0} 個

#### 主要功能按鈕:
${structure.clickableElements?.slice(0, 10).map(el => 
`- **${el.text || el.tagName}** ${el.id ? `(#${el.id})` : ''} ${el.onclick ? `- 點擊事件: ${el.onclick.slice(0, 50)}...` : ''}`
).join('\n') || '無'}
`).join('')}

## 👥 用戶流程驗證

${Object.entries(report.results.userFlows).map(([flowName, result]) => `
### ${flowName}
- **狀態**: ${result.successful ? '✅ 成功' : '❌ 失敗'}
${result.initialUrl ? `- **起始URL**: ${result.initialUrl}` : ''}
${result.finalUrl ? `- **最終URL**: ${result.finalUrl}` : ''}
${result.error ? `- **錯誤**: ${result.error}` : ''}
`).join('')}

## 🔧 真實功能測試結果

${Object.entries(report.results.realFunctionalities).map(([funcName, result]) => `
### ${funcName}
- **狀態**: ${result.clicked ? '✅ 成功點擊' : '❌ 點擊失敗'}
${result.changed ? '- **頁面變化**: 檢測到內容變化' : ''}
${result.notifications ? `- **通知觸發**: ${result.notifications.length} 個` : ''}
${result.error ? `- **錯誤**: ${result.error}` : ''}
${result.screenshotPath ? `- **截圖**: ${result.screenshotPath}` : ''}
`).join('')}

## 🎯 深度互動測試

${Object.entries(report.results.deepInteractions).map(([interactionName, result]) => `
### ${interactionName}
- **狀態**: ${result.successful ? '✅ 成功' : '❌ 失敗'}
${result.result ? `- **結果**: ${JSON.stringify(result.result)}` : ''}
${result.error ? `- **錯誤**: ${result.error}` : ''}
`).join('')}

## 📱 Telegram通知分析

${report.results.telegramNotifications.length > 0 ? 
report.results.telegramNotifications.map(notification => `
- **URL**: ${notification.url}
- **狀態**: ${notification.status}  
- **時間**: ${notification.timestamp}
`).join('') : '無Telegram通知被觸發'}

## 🐛 錯誤報告

${report.results.errors.length > 0 ?
report.results.errors.map(error => `
### ${error.type} 錯誤
- **訊息**: ${error.message}
${error.page ? `- **頁面**: ${error.page}` : ''}
- **時間**: ${error.timestamp}
`).join('') : '✅ 無錯誤發現'}

## 📸 截圖記錄

${report.results.screenshots.map(screenshot => `
- **${screenshot.description}**: \`${screenshot.path}\`
`).join('')}

## 💡 改進建議

### 高優先級
${report.summary.functionalitiesSuccessful < report.summary.functionalitiesTested ? 
`- 修復 ${report.summary.functionalitiesTested - report.summary.functionalitiesSuccessful} 個功能按鈕的互動問題` : ''}
${report.summary.totalErrors > 0 ? `- 修復 ${report.summary.totalErrors} 個系統錯誤` : ''}

### 中優先級  
${report.summary.telegramNotifications === 0 ? '- 確保功能操作能正確觸發Telegram通知' : ''}
- 優化頁面載入速度和響應性能
- 加強表單驗證和用戶體驗

### 低優先級
- 增加更多互動元素的視覺回饋
- 改進頁面導航和布局設計

---
*報告生成時間: ${report.timestamp}*
*測試工具: 進階真實功能驗證系統 v2.0*
`;
    }

    /**
     * 🚀 執行完整進階驗證
     */
    async runFullVerification() {
        try {
            console.log('🚀 開始執行進階真實功能驗證流程...');
            
            const initialized = await this.initialize();
            if (!initialized) return null;
            
            await this.analyzePageStructures();
            await this.testRealUserLoginFlow();
            await this.testRealFunctionalities(); 
            await this.testDeepInteractions();
            const report = await this.generateAdvancedReport();
            
            // 發送Telegram報告
            await this.sendTelegramReport(report);
            
            console.log('\n🎉 進階真實功能驗證完成！');
            console.log('📊 關鍵指標:');
            console.log(`   - 頁面分析: ${report.summary.pagesAnalyzed} 個`);
            console.log(`   - 功能測試: ${report.summary.functionalitiesSuccessful}/${report.summary.functionalitiesTested}`);
            console.log(`   - 通知觸發: ${report.summary.telegramNotifications} 個`);
            console.log(`   - 截圖記錄: ${report.summary.totalScreenshots} 張`);
            
            return report;
            
        } catch (error) {
            console.error('❌ 進階驗證執行失敗:', error.message);
            throw error;
        } finally {
            if (this.browser) {
                await this.browser.close();
                console.log('🔒 瀏覽器已關閉');
            }
        }
    }

    /**
     * 📱 發送Telegram報告
     */
    async sendTelegramReport(report) {
        try {
            const telegram = require('./telegram-notifier');
            
            const message = `✈️ 進階真實功能驗證系統 - 執行完成

🎯 驗證結果摘要:
• 頁面分析: ${report.summary.pagesAnalyzed} 個頁面完成
• 功能測試: ${report.summary.functionalitiesSuccessful}/${report.summary.functionalitiesTested} 成功
• 深度互動: ${report.summary.deepInteractionsSuccessful}/${Object.keys(report.results.deepInteractions).length} 通過
• Telegram通知: ${report.summary.telegramNotifications} 個觸發

🔍 發現亮點:
• 總計 ${report.summary.totalClickableElements} 個可互動元素
• 成功生成 ${report.summary.totalScreenshots} 張測試截圖
• 檢測到 ${report.summary.totalErrors} 個系統錯誤

⏱️ 執行時間: ${Math.round(report.testDuration / 1000)}秒
📊 完整報告已保存到本地檔案系統

🤖 進階真實功能驗證系統 v2.0 自動生成`;

            await telegram.sendMessage(message);
            console.log('📱 Telegram進階報告已發送');
            
        } catch (error) {
            console.error('❌ 發送Telegram報告失敗:', error.message);
        }
    }
}

// 執行進階驗證
if (require.main === module) {
    const verifier = new AdvancedRealFunctionalityVerifier();
    
    verifier.runFullVerification()
        .then((report) => {
            if (report) {
                console.log('🎯 進階真實功能驗證系統執行成功完成');
                process.exit(0);
            } else {
                console.error('❌ 驗證執行失敗');
                process.exit(1);
            }
        })
        .catch((error) => {
            console.error('💥 進階驗證系統執行失敗:', error);
            process.exit(1);
        });
}

module.exports = AdvancedRealFunctionalityVerifier;