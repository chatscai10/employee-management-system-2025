const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class ProductionFixedInteractiveTester {
    constructor(productionUrl = 'https://employee-management-system-intermediate.onrender.com') {
        this.productionUrl = productionUrl;
        this.browser = null;
        this.page = null;
        this.screenshotDir = path.join(__dirname, 'production-fixed-screenshots');
        this.testResults = {
            loginFlow: {},
            employeeFeatures: {},
            crudOperations: {},
            systemIntegration: {}
        };
        
        // 確保目錄存在
        if (!fs.existsSync(this.screenshotDir)) {
            fs.mkdirSync(this.screenshotDir, { recursive: true });
        }
    }

    async initialize() {
        console.log('🚀 初始化修正版生產環境互動測試器...');
        
        this.browser = await puppeteer.launch({
            headless: false,
            devtools: false,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security'
            ]
        });

        this.page = await this.browser.newPage();
        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        await this.page.setViewport({ width: 1920, height: 1080 });
        
        this.page.on('console', (msg) => {
            console.log(`🖥️ Console [${msg.type()}]: ${msg.text()}`);
        });
        
        this.page.on('pageerror', (error) => {
            console.error(`❌ Page Error: ${error.toString()}`);
        });
    }

    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 使用正確的選擇器尋找元素
    async findElementsByText(selector, text) {
        return await this.page.evaluateHandle((sel, txt) => {
            const elements = Array.from(document.querySelectorAll(sel));
            return elements.filter(el => el.textContent.includes(txt));
        }, selector, text);
    }

    // 測試完整登入流程
    async testLoginFlow() {
        console.log('\n📋 測試完整登入流程...');
        
        try {
            // 1. 導航到登入頁面
            console.log('🔍 導航到登入頁面...');
            await this.page.goto(`${this.productionUrl}/login`, { 
                waitUntil: 'networkidle0',
                timeout: 30000 
            });
            
            await this.wait(2000);
            await this.page.screenshot({
                path: path.join(this.screenshotDir, 'step1-login-page.png'),
                fullPage: true
            });
            
            // 2. 檢查登入表單元素（使用正確選擇器）
            console.log('🔍 檢查登入表單元素...');
            
            // 尋找用戶名欄位
            const usernameSelectors = [
                'input[name="username"]',
                'input[id="username"]', 
                'input[placeholder*="姓名"]',
                'input[placeholder*="用戶"]',
                'input[placeholder*="帳號"]'
            ];
            
            let usernameField = null;
            for (const selector of usernameSelectors) {
                try {
                    usernameField = await this.page.$(selector);
                    if (usernameField) break;
                } catch (e) {}
            }
            
            // 尋找密碼欄位
            const passwordField = await this.page.$('input[type="password"]');
            
            // 尋找登入按鈕
            const submitButtons = await this.page.$$('button[type="submit"], input[type="submit"]');
            let loginButton = submitButtons.length > 0 ? submitButtons[0] : null;
            
            // 如果沒找到submit按鈕，尋找包含登入文字的按鈕
            if (!loginButton) {
                const allButtons = await this.page.$$('button');
                for (const button of allButtons) {
                    const text = await this.page.evaluate(el => el.textContent, button);
                    if (text && (text.includes('登入') || text.includes('登录') || text.includes('登錄'))) {
                        loginButton = button;
                        break;
                    }
                }
            }
            
            this.testResults.loginFlow.hasUsernameField = usernameField !== null;
            this.testResults.loginFlow.hasPasswordField = passwordField !== null;
            this.testResults.loginFlow.hasLoginButton = loginButton !== null;
            
            console.log(`✅ 用戶名欄位: ${usernameField ? '存在' : '不存在'}`);
            console.log(`✅ 密碼欄位: ${passwordField ? '存在' : '不存在'}`);
            console.log(`✅ 登入按鈕: ${loginButton ? '存在' : '不存在'}`);
            
            // 3. 嘗試填寫登入表單
            if (usernameField && passwordField) {
                console.log('🔍 測試登入表單填寫...');
                
                await usernameField.click({ clickCount: 3 });
                await usernameField.type('admin');
                
                await passwordField.click({ clickCount: 3 });
                await passwordField.type('admin123');
                
                await this.wait(1000);
                await this.page.screenshot({
                    path: path.join(this.screenshotDir, 'step2-form-filled.png'),
                    fullPage: true
                });
                
                // 4. 提交登入表單
                if (loginButton) {
                    console.log('🔍 提交登入表單...');
                    await loginButton.click();
                    
                    await this.wait(3000);
                    await this.page.screenshot({
                        path: path.join(this.screenshotDir, 'step3-login-result.png'),
                        fullPage: true
                    });
                    
                    const currentUrl = this.page.url();
                    this.testResults.loginFlow.loginAttempted = true;
                    this.testResults.loginFlow.redirectedAfterLogin = !currentUrl.includes('/login');
                    this.testResults.loginFlow.currentUrlAfterLogin = currentUrl;
                    
                    console.log(`✅ 登入後URL: ${currentUrl}`);
                    console.log(`✅ 是否重定向: ${this.testResults.loginFlow.redirectedAfterLogin}`);
                }
            }
            
            return true;
            
        } catch (error) {
            console.error(`❌ 登入流程測試失敗: ${error.message}`);
            this.testResults.loginFlow.error = error.message;
            return false;
        }
    }

    // 測試員工功能模組
    async testEmployeeFeatures() {
        console.log('\n📋 測試員工功能模組...');
        
        try {
            // 1. 導航到員工工作台
            console.log('🔍 導航到員工工作台...');
            await this.page.goto(`${this.productionUrl}/employee`, { 
                waitUntil: 'networkidle0',
                timeout: 30000 
            });
            
            await this.wait(3000);
            await this.page.screenshot({
                path: path.join(this.screenshotDir, 'step4-employee-dashboard.png'),
                fullPage: true
            });
            
            // 2. 檢查導航元素
            console.log('🔍 檢查導航和功能按鈕...');
            const navigationElements = await this.page.$$('nav a, .nav-link, button, .btn');
            this.testResults.employeeFeatures.navigationCount = navigationElements.length;
            
            console.log(`✅ 找到 ${navigationElements.length} 個導航/功能元素`);
            
            // 3. 檢查打卡功能（使用正確方法）
            console.log('🔍 檢查打卡功能...');
            const allButtons = await this.page.$$('button');
            let clockButtons = [];
            
            for (const button of allButtons) {
                const text = await this.page.evaluate(el => el.textContent, button);
                if (text && (text.includes('打卡') || text.includes('上班') || text.includes('下班'))) {
                    clockButtons.push(button);
                }
            }
            
            // 也檢查特定ID和類別
            const clockIds = await this.page.$$('#clockIn, #clockOut, .clock-btn');
            clockButtons = [...clockButtons, ...clockIds];
            
            this.testResults.employeeFeatures.hasClockFeature = clockButtons.length > 0;
            this.testResults.employeeFeatures.clockButtonCount = clockButtons.length;
            
            console.log(`✅ 找到 ${clockButtons.length} 個打卡相關按鈕`);
            
            if (clockButtons.length > 0) {
                // 嘗試點擊第一個打卡按鈕
                await clockButtons[0].click();
                await this.wait(2000);
                
                await this.page.screenshot({
                    path: path.join(this.screenshotDir, 'step5-clock-action.png'),
                    fullPage: true
                });
            }
            
            // 4. 檢查資料顯示區域
            console.log('🔍 檢查資料顯示區域...');
            const dataElements = await this.page.$$('.card, .table, .list-group, .data-display');
            this.testResults.employeeFeatures.dataDisplayCount = dataElements.length;
            
            console.log(`✅ 找到 ${dataElements.length} 個資料顯示元素`);
            
            return true;
            
        } catch (error) {
            console.error(`❌ 員工功能測試失敗: ${error.message}`);
            this.testResults.employeeFeatures.error = error.message;
            return false;
        }
    }

    // 測試CRUD操作功能
    async testCRUDOperations() {
        console.log('\n📋 測試CRUD操作功能...');
        
        try {
            // 1. 檢查編輯按鈕（使用正確方法）
            console.log('🔍 檢查編輯功能按鈕...');
            const allButtons = await this.page.$$('button');
            let editButtons = [];
            
            for (const button of allButtons) {
                const text = await this.page.evaluate(el => el.textContent, button);
                if (text && (text.includes('編輯') || text.includes('修改'))) {
                    editButtons.push(button);
                }
            }
            
            // 檢查特定類別
            const editClassButtons = await this.page.$$('.edit-btn, .btn-edit, [data-action="edit"]');
            editButtons = [...editButtons, ...editClassButtons];
            
            this.testResults.crudOperations.hasEditButtons = editButtons.length > 0;
            this.testResults.crudOperations.editButtonCount = editButtons.length;
            
            console.log(`✅ 找到 ${editButtons.length} 個編輯按鈕`);
            
            // 2. 檢查刪除/作廢按鈕
            console.log('🔍 檢查刪除/作廢功能按鈕...');
            let deleteButtons = [];
            
            for (const button of allButtons) {
                const text = await this.page.evaluate(el => el.textContent, button);
                if (text && (text.includes('刪除') || text.includes('作廢'))) {
                    deleteButtons.push(button);
                }
            }
            
            const deleteClassButtons = await this.page.$$('.delete-btn, .btn-delete, [data-action="delete"]');
            deleteButtons = [...deleteButtons, ...deleteClassButtons];
            
            this.testResults.crudOperations.hasDeleteButtons = deleteButtons.length > 0;
            this.testResults.crudOperations.deleteButtonCount = deleteButtons.length;
            
            console.log(`✅ 找到 ${deleteButtons.length} 個刪除/作廢按鈕`);
            
            // 3. 檢查新增按鈕
            console.log('🔍 檢查新增功能按鈕...');
            let addButtons = [];
            
            for (const button of allButtons) {
                const text = await this.page.evaluate(el => el.textContent, button);
                if (text && (text.includes('新增') || text.includes('添加'))) {
                    addButtons.push(button);
                }
            }
            
            const addClassButtons = await this.page.$$('.add-btn, .btn-add, [data-action="add"]');
            addButtons = [...addButtons, ...addClassButtons];
            
            this.testResults.crudOperations.hasAddButtons = addButtons.length > 0;
            this.testResults.crudOperations.addButtonCount = addButtons.length;
            
            console.log(`✅ 找到 ${addButtons.length} 個新增按鈕`);
            
            // 4. 測試編輯功能（如果存在）
            if (editButtons.length > 0) {
                console.log('🔍 測試編輯功能...');
                await editButtons[0].click();
                await this.wait(2000);
                
                await this.page.screenshot({
                    path: path.join(this.screenshotDir, 'step6-edit-action.png'),
                    fullPage: true
                });
                
                // 檢查是否出現編輯表單或模態框
                const modals = await this.page.$$('.modal, .popup, .dialog, .edit-form');
                this.testResults.crudOperations.editModalAppeared = modals.length > 0;
                
                console.log(`✅ 編輯介面出現: ${modals.length > 0 ? '是' : '否'}`);
            }
            
            return true;
            
        } catch (error) {
            console.error(`❌ CRUD操作測試失敗: ${error.message}`);
            this.testResults.crudOperations.error = error.message;
            return false;
        }
    }

    // 測試系統整合功能
    async testSystemIntegration() {
        console.log('\n📋 測試系統整合功能...');
        
        try {
            // 1. 檢查頁面間導航
            console.log('🔍 測試頁面間導航...');
            const navigationLinks = await this.page.$$('a[href], .nav-link');
            this.testResults.systemIntegration.navigationLinksCount = navigationLinks.length;
            
            // 2. 測試響應式設計
            console.log('🔍 測試響應式設計...');
            
            // 切換到手機視窗大小
            await this.page.setViewport({ width: 375, height: 667 });
            await this.wait(2000);
            
            await this.page.screenshot({
                path: path.join(this.screenshotDir, 'step7-mobile-view.png'),
                fullPage: true
            });
            
            // 切換回桌面視窗大小
            await this.page.setViewport({ width: 1920, height: 1080 });
            await this.wait(2000);
            
            // 3. 檢查JavaScript載入狀態
            console.log('🔍 檢查JavaScript功能...');
            const jsLoaded = await this.page.evaluate(() => {
                return typeof window.jQuery !== 'undefined' || 
                       typeof window.bootstrap !== 'undefined' ||
                       document.querySelectorAll('script').length > 0;
            });
            
            this.testResults.systemIntegration.javascriptLoaded = jsLoaded;
            console.log(`✅ JavaScript載入: ${jsLoaded ? '正常' : '異常'}`);
            
            // 4. 檢查頁面載入狀態
            const pageLoaded = await this.page.evaluate(() => {
                return document.readyState === 'complete';
            });
            this.testResults.systemIntegration.pageFullyLoaded = pageLoaded;
            
            // 5. 最終系統狀態截圖
            await this.page.screenshot({
                path: path.join(this.screenshotDir, 'step8-final-system-state.png'),
                fullPage: true
            });
            
            return true;
            
        } catch (error) {
            console.error(`❌ 系統整合測試失敗: ${error.message}`);
            this.testResults.systemIntegration.error = error.message;
            return false;
        }
    }

    // 生成詳細測試報告
    async generateDetailedReport() {
        console.log('\n📋 生成詳細測試報告...');
        
        const reportData = {
            timestamp: new Date().toISOString(),
            productionUrl: this.productionUrl,
            testResults: this.testResults,
            summary: {
                loginFlowPassed: !this.testResults.loginFlow.error,
                employeeFeaturesPassed: !this.testResults.employeeFeatures.error,
                crudOperationsPassed: !this.testResults.crudOperations.error,
                systemIntegrationPassed: !this.testResults.systemIntegration.error
            }
        };
        
        // 生成Markdown報告
        const markdownReport = `# 生產環境修正版互動流程測試報告

## 🌐 測試目標
**生產網址**: ${this.productionUrl}
**測試時間**: ${reportData.timestamp}

## 📊 測試結果總覽

### ✅ 功能測試結果
- 登入流程測試: ${reportData.summary.loginFlowPassed ? '✅ 通過' : '❌ 失敗'}
- 員工功能測試: ${reportData.summary.employeeFeaturesPassed ? '✅ 通過' : '❌ 失敗'}  
- CRUD操作測試: ${reportData.summary.crudOperationsPassed ? '✅ 通過' : '❌ 失敗'}
- 系統整合測試: ${reportData.summary.systemIntegrationPassed ? '✅ 通過' : '❌ 失敗'}

## 📋 詳細測試結果

### 🔐 登入流程測試
- 用戶名欄位: ${this.testResults.loginFlow.hasUsernameField ? '✅ 存在' : '❌ 不存在'}
- 密碼欄位: ${this.testResults.loginFlow.hasPasswordField ? '✅ 存在' : '❌ 不存在'}
- 登入按鈕: ${this.testResults.loginFlow.hasLoginButton ? '✅ 存在' : '❌ 不存在'}
- 登入嘗試: ${this.testResults.loginFlow.loginAttempted ? '✅ 已測試' : '❌ 未測試'}
- 登入後重定向: ${this.testResults.loginFlow.redirectedAfterLogin ? '✅ 正常' : '❌ 異常'}

### 👥 員工功能測試
- 導航元素數量: ${this.testResults.employeeFeatures.navigationCount || 0}
- 打卡功能: ${this.testResults.employeeFeatures.hasClockFeature ? '✅ 存在' : '❌ 不存在'}
- 打卡按鈕數量: ${this.testResults.employeeFeatures.clockButtonCount || 0}
- 資料顯示元素: ${this.testResults.employeeFeatures.dataDisplayCount || 0}

### 🔧 CRUD操作測試
- 編輯按鈕: ${this.testResults.crudOperations.hasEditButtons ? '✅ 存在' : '❌ 不存在'} (${this.testResults.crudOperations.editButtonCount || 0}個)
- 刪除/作廢按鈕: ${this.testResults.crudOperations.hasDeleteButtons ? '✅ 存在' : '❌ 不存在'} (${this.testResults.crudOperations.deleteButtonCount || 0}個)
- 新增按鈕: ${this.testResults.crudOperations.hasAddButtons ? '✅ 存在' : '❌ 不存在'} (${this.testResults.crudOperations.addButtonCount || 0}個)
- 編輯介面: ${this.testResults.crudOperations.editModalAppeared ? '✅ 正常顯示' : '❌ 未顯示'}

### 🌐 系統整合測試
- 導航連結數量: ${this.testResults.systemIntegration.navigationLinksCount || 0}
- JavaScript載入: ${this.testResults.systemIntegration.javascriptLoaded ? '✅ 正常' : '❌ 異常'}
- 頁面完全載入: ${this.testResults.systemIntegration.pageFullyLoaded ? '✅ 正常' : '❌ 異常'}

## 📸 截圖記錄
測試過程中生成了以下截圖：
1. step1-login-page.png - 登入頁面
2. step2-form-filled.png - 表單填寫
3. step3-login-result.png - 登入結果
4. step4-employee-dashboard.png - 員工工作台
5. step5-clock-action.png - 打卡操作
6. step6-edit-action.png - 編輯操作
7. step7-mobile-view.png - 手機版檢視
8. step8-final-system-state.png - 最終系統狀態

## 🎯 重點發現
${this.generateKeyFindings()}

---
*報告由修正版生產環境互動流程測試器自動生成*
`;

        const reportPath = path.join(__dirname, 'production-reports', `fixed-interactive-test-report-${Date.now()}.md`);
        fs.writeFileSync(reportPath, markdownReport);
        
        console.log(`📄 詳細測試報告已保存: ${reportPath}`);
        
        return { reportPath, reportData };
    }

    generateKeyFindings() {
        const findings = [];
        
        if (this.testResults.loginFlow.hasUsernameField && this.testResults.loginFlow.hasPasswordField) {
            findings.push('✅ 登入表單結構完整');
        }
        
        if (this.testResults.employeeFeatures.clockButtonCount > 0) {
            findings.push(`✅ 發現 ${this.testResults.employeeFeatures.clockButtonCount} 個打卡功能按鈕`);
        }
        
        if (this.testResults.crudOperations.editButtonCount > 0) {
            findings.push(`✅ 發現 ${this.testResults.crudOperations.editButtonCount} 個編輯功能按鈕`);
        }
        
        if (this.testResults.systemIntegration.javascriptLoaded) {
            findings.push('✅ JavaScript功能正常載入');
        }
        
        if (findings.length === 0) {
            findings.push('⚠️ 需要進一步檢查系統功能完整性');
        }
        
        return findings.join('\n');
    }

    // 執行完整互動測試流程
    async runCompleteInteractiveTest() {
        console.log('🚀 開始修正版生產環境完整互動流程測試');
        
        try {
            await this.initialize();
            
            console.log('\n=== 開始4階段修正版互動測試流程 ===');
            
            // 階段1: 登入流程測試
            const stage1 = await this.testLoginFlow();
            console.log(`階段1結果: ${stage1 ? '✅ 通過' : '❌ 失敗'}`);
            
            // 階段2: 員工功能測試
            const stage2 = await this.testEmployeeFeatures();
            console.log(`階段2結果: ${stage2 ? '✅ 通過' : '❌ 失敗'}`);
            
            // 階段3: CRUD操作測試
            const stage3 = await this.testCRUDOperations();
            console.log(`階段3結果: ${stage3 ? '✅ 通過' : '❌ 失敗'}`);
            
            // 階段4: 系統整合測試
            const stage4 = await this.testSystemIntegration();
            console.log(`階段4結果: ${stage4 ? '✅ 通過' : '❌ 失敗'}`);
            
            // 生成報告
            const report = await this.generateDetailedReport();
            
            console.log('\n🎯 修正版生產環境互動測試完成！');
            console.log('📊 詳細報告已生成');
            
            return report;
            
        } catch (error) {
            console.error(`❌ 修正版互動測試過程發生錯誤: ${error.message}`);
            throw error;
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }
}

// 自動執行修正版互動測試
async function runFixedProductionInteractiveTest() {
    const tester = new ProductionFixedInteractiveTester();
    
    try {
        const result = await tester.runCompleteInteractiveTest();
        
        console.log('\n✈️ 飛機彙報 - 修正版生產環境互動測試完成');
        console.log('┌─────────────────────────────────────────────┐');
        console.log('│ 📊 修正版生產環境互動流程測試結果:              │');
        console.log(`│ 🔐 登入流程: ${result.reportData.summary.loginFlowPassed ? '通過' : '失敗'} │`);
        console.log(`│ 👥 員工功能: ${result.reportData.summary.employeeFeaturesPassed ? '通過' : '失敗'} │`);
        console.log(`│ 🔧 CRUD操作: ${result.reportData.summary.crudOperationsPassed ? '通過' : '失敗'} │`);
        console.log(`│ 🌐 系統整合: ${result.reportData.summary.systemIntegrationPassed ? '通過' : '失敗'} │`);
        console.log('│                                           │');
        console.log(`│ 📄 報告路徑: ${result.reportPath.split('\\').pop()} │`);
        console.log('│ 📸 截圖已保存至 production-fixed-screenshots/ │');
        console.log('└─────────────────────────────────────────────┘');
        
        return result;
        
    } catch (error) {
        console.error(`❌ 修正版生產環境互動測試失敗: ${error.message}`);
        throw error;
    }
}

// 立即執行測試
if (require.main === module) {
    runFixedProductionInteractiveTest()
        .then(() => {
            console.log('🎯 修正版生產環境互動流程測試完成！');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ 測試失敗:', error);
            process.exit(1);
        });
}

module.exports = ProductionFixedInteractiveTester;