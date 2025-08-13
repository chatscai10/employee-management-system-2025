const puppeteer = require('puppeteer');

class AdminPageComprehensiveTest {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = [];
        this.baseUrl = 'https://employee-management-system-intermediate.onrender.com';
    }

    async init() {
        console.log('🚀 啟動管理員頁面全面測試...');
        
        this.browser = await puppeteer.launch({
            headless: false,
            slowMo: 600,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        this.page = await this.browser.newPage();
        await this.page.setViewport({ width: 1366, height: 768 });
        
        this.page.on('console', msg => {
            console.log(`🖥️ 管理員頁面: ${msg.text()}`);
        });
    }

    async discoverAdminPages() {
        console.log('\n🔍 探索管理員頁面入口...');
        
        const adminUrls = [
            `${this.baseUrl}/admin`,
            `${this.baseUrl}/admin.html`,
            `${this.baseUrl}/manager`,
            `${this.baseUrl}/management`,
            `${this.baseUrl}/dashboard`,
            `${this.baseUrl}/admin-panel`
        ];
        
        let foundAdminPage = null;
        
        for (const url of adminUrls) {
            try {
                console.log(`🔍 嘗試訪問: ${url}`);
                await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const pageContent = await this.page.evaluate(() => {
                    return {
                        hasAdminKeywords: document.body.textContent.includes('管理') || 
                                         document.body.textContent.includes('Admin') ||
                                         document.body.textContent.includes('Dashboard'),
                        hasLoginForm: document.querySelector('input[type="password"]') !== null,
                        hasNavigation: document.querySelector('nav, .navigation') !== null,
                        title: document.title,
                        hasEmployeeManagement: document.body.textContent.includes('員工管理') ||
                                              document.body.textContent.includes('Employee'),
                        hasSystemSettings: document.body.textContent.includes('系統設定') ||
                                          document.body.textContent.includes('Settings')
                    };
                });
                
                console.log(`📄 頁面資訊: ${JSON.stringify(pageContent, null, 2)}`);
                
                if (pageContent.hasAdminKeywords || pageContent.hasEmployeeManagement) {
                    foundAdminPage = { url, content: pageContent };
                    console.log(`✅ 找到管理員頁面: ${url}`);
                    break;
                }
                
            } catch (error) {
                console.log(`❌ ${url} - ${error.message}`);
            }
        }
        
        if (!foundAdminPage) {
            // 嘗試從主頁找管理員連結
            console.log('🔍 從主頁尋找管理員連結...');
            await this.page.goto(this.baseUrl, { waitUntil: 'domcontentloaded' });
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const adminLinks = await this.page.$$eval('a', links => 
                links.filter(link => 
                    link.textContent.includes('管理') ||
                    link.textContent.includes('Admin') ||
                    link.textContent.includes('後台') ||
                    link.href.includes('admin')
                ).map(link => ({
                    text: link.textContent.trim(),
                    href: link.href
                }))
            );
            
            console.log(`找到潛在管理員連結: ${JSON.stringify(adminLinks, null, 2)}`);
            
            if (adminLinks.length > 0) {
                foundAdminPage = { url: adminLinks[0].href, discoveredFromMainPage: true };
            }
        }
        
        return foundAdminPage;
    }

    async testAdminLogin(adminPageInfo) {
        console.log('\n🔐 測試管理員登入功能...');
        
        try {
            await this.page.goto(adminPageInfo.url, { waitUntil: 'domcontentloaded' });
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // 查找登入表單
            const loginForm = await this.page.evaluate(() => {
                const forms = document.querySelectorAll('form');
                const passwordFields = document.querySelectorAll('input[type="password"]');
                const usernameFields = document.querySelectorAll('input[type="text"], input[type="email"], input[name="username"], input[name="email"]');
                
                return {
                    hasForm: forms.length > 0,
                    hasPasswordField: passwordFields.length > 0,
                    hasUsernameField: usernameFields.length > 0,
                    formCount: forms.length
                };
            });
            
            console.log(`表單資訊: ${JSON.stringify(loginForm, null, 2)}`);
            
            if (loginForm.hasPasswordField && loginForm.hasUsernameField) {
                // 嘗試管理員登入
                const loginAttempts = [
                    { username: 'admin', password: 'admin' },
                    { username: 'admin', password: 'admin123' },
                    { username: 'administrator', password: 'password' },
                    { username: 'manager', password: 'manager123' }
                ];
                
                for (const credentials of loginAttempts) {
                    try {
                        console.log(`🔑 嘗試登入: ${credentials.username}`);
                        
                        await this.page.reload();
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        
                        // 填寫登入資訊
                        const usernameField = await this.page.$('input[type="text"], input[type="email"], input[name="username"], input[name="email"]');
                        const passwordField = await this.page.$('input[type="password"]');
                        
                        if (usernameField && passwordField) {
                            await usernameField.type(credentials.username);
                            await passwordField.type(credentials.password);
                            
                            const submitButton = await this.page.$('button[type="submit"], input[type="submit"], .login-btn');
                            if (submitButton) {
                                await submitButton.click();
                                await new Promise(resolve => setTimeout(resolve, 3000));
                                
                                const loginResult = await this.page.evaluate(() => {
                                    return {
                                        currentUrl: window.location.href,
                                        hasErrorMessage: document.body.textContent.includes('錯誤') ||
                                                        document.body.textContent.includes('失敗') ||
                                                        document.body.textContent.includes('Invalid'),
                                        hasSuccessIndicator: document.body.textContent.includes('歡迎') ||
                                                           document.body.textContent.includes('Dashboard') ||
                                                           document.querySelector('.admin-panel, .dashboard') !== null
                                    };
                                });
                                
                                console.log(`登入結果: ${JSON.stringify(loginResult, null, 2)}`);
                                
                                if (loginResult.hasSuccessIndicator && !loginResult.hasErrorMessage) {
                                    this.testResults.push({
                                        category: '管理員登入',
                                        test: `管理員登入 (${credentials.username})`,
                                        success: true,
                                        details: `成功登入，跳轉至: ${loginResult.currentUrl}`
                                    });
                                    
                                    console.log(`✅ 管理員登入成功: ${credentials.username}`);
                                    return true;
                                }
                            }
                        }
                    } catch (error) {
                        console.log(`❌ 登入嘗試失敗: ${error.message}`);
                    }
                }
                
                this.testResults.push({
                    category: '管理員登入',
                    test: '管理員登入嘗試',
                    success: false,
                    details: '所有登入嘗試均失敗'
                });
                
                return false;
            } else {
                this.testResults.push({
                    category: '管理員登入',
                    test: '管理員登入表單檢查',
                    success: false,
                    details: '未找到完整的登入表單'
                });
                
                return false;
            }
            
        } catch (error) {
            console.error('❌ 管理員登入測試錯誤:', error.message);
            return false;
        }
    }

    async analyzeAdminFunctionality(adminPageUrl) {
        console.log('\n🔧 分析管理員頁面功能...');
        
        try {
            await this.page.goto(adminPageUrl, { waitUntil: 'domcontentloaded' });
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const functionality = await this.page.evaluate(() => {
                const allText = document.body.textContent.toLowerCase();
                const links = Array.from(document.querySelectorAll('a')).map(a => a.textContent.trim());
                const buttons = Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim());
                const forms = document.querySelectorAll('form');
                const tables = document.querySelectorAll('table');
                
                return {
                    // 功能檢測
                    hasEmployeeManagement: allText.includes('員工') || allText.includes('employee'),
                    hasUserManagement: allText.includes('用戶') || allText.includes('user'),
                    hasSystemSettings: allText.includes('設定') || allText.includes('setting'),
                    hasReports: allText.includes('報表') || allText.includes('report'),
                    hasStatistics: allText.includes('統計') || allText.includes('statistics'),
                    hasDashboard: allText.includes('儀表板') || allText.includes('dashboard'),
                    
                    // 操作元素
                    linkCount: links.length,
                    buttonCount: buttons.length,
                    formCount: forms.length,
                    tableCount: tables.length,
                    
                    // 具體功能連結
                    functionalLinks: links.filter(link => 
                        link.includes('員工') || 
                        link.includes('管理') || 
                        link.includes('設定') ||
                        link.includes('報表') ||
                        link.includes('新增') ||
                        link.includes('編輯') ||
                        link.includes('刪除')
                    ),
                    
                    // CRUD按鈕
                    crudButtons: buttons.filter(btn =>
                        btn.includes('新增') ||
                        btn.includes('編輯') ||
                        btn.includes('刪除') ||
                        btn.includes('保存') ||
                        btn.includes('取消') ||
                        btn.includes('確認')
                    )
                };
            });
            
            console.log(`管理員功能分析: ${JSON.stringify(functionality, null, 2)}`);
            
            // 記錄每個發現的功能
            const features = [
                { name: '員工管理', found: functionality.hasEmployeeManagement },
                { name: '用戶管理', found: functionality.hasUserManagement },
                { name: '系統設定', found: functionality.hasSystemSettings },
                { name: '報表功能', found: functionality.hasReports },
                { name: '統計資料', found: functionality.hasStatistics },
                { name: '管理儀表板', found: functionality.hasDashboard }
            ];
            
            features.forEach(feature => {
                this.testResults.push({
                    category: '管理員功能分析',
                    test: feature.name,
                    success: feature.found,
                    details: feature.found ? '功能存在' : '功能未發現'
                });
            });
            
            // 測試CRUD操作可用性
            this.testResults.push({
                category: '管理員CRUD分析',
                test: 'CRUD按鈕可用性',
                success: functionality.crudButtons.length > 0,
                details: `發現CRUD按鈕: ${functionality.crudButtons.length}個 - ${functionality.crudButtons.join(', ')}`
            });
            
            return functionality;
            
        } catch (error) {
            console.error('❌ 功能分析錯誤:', error.message);
            return null;
        }
    }

    async testCRUDOperations(adminFunctionality) {
        console.log('\n📝 測試管理員CRUD操作...');
        
        try {
            // 測試表格操作
            if (adminFunctionality.tableCount > 0) {
                const tableOperations = await this.page.evaluate(() => {
                    const tables = document.querySelectorAll('table');
                    const results = [];
                    
                    tables.forEach((table, index) => {
                        const rows = table.querySelectorAll('tr');
                        const editButtons = table.querySelectorAll('button, a').length;
                        const hasData = rows.length > 1; // 除了標題行
                        
                        results.push({
                            tableIndex: index,
                            rowCount: rows.length,
                            hasEditButtons: editButtons > 0,
                            hasData: hasData
                        });
                    });
                    
                    return results;
                });
                
                console.log(`表格操作分析: ${JSON.stringify(tableOperations, null, 2)}`);
                
                this.testResults.push({
                    category: '管理員CRUD測試',
                    test: '資料表格操作',
                    success: tableOperations.some(t => t.hasEditButtons && t.hasData),
                    details: `發現 ${tableOperations.length} 個表格，其中 ${tableOperations.filter(t => t.hasEditButtons).length} 個有操作按鈕`
                });
            }
            
            // 測試表單操作
            if (adminFunctionality.formCount > 0) {
                const formOperations = await this.page.evaluate(() => {
                    const forms = document.querySelectorAll('form');
                    const results = [];
                    
                    forms.forEach((form, index) => {
                        const inputs = form.querySelectorAll('input, select, textarea');
                        const submitButtons = form.querySelectorAll('button[type="submit"], input[type="submit"]');
                        
                        results.push({
                            formIndex: index,
                            inputCount: inputs.length,
                            hasSubmitButton: submitButtons.length > 0,
                            isEditForm: form.textContent.includes('編輯') || form.textContent.includes('修改')
                        });
                    });
                    
                    return results;
                });
                
                console.log(`表單操作分析: ${JSON.stringify(formOperations, null, 2)}`);
                
                this.testResults.push({
                    category: '管理員CRUD測試',
                    test: '表單操作功能',
                    success: formOperations.some(f => f.hasSubmitButton && f.inputCount > 0),
                    details: `發現 ${formOperations.length} 個表單，其中 ${formOperations.filter(f => f.hasSubmitButton).length} 個可提交`
                });
            }
            
        } catch (error) {
            console.error('❌ CRUD測試錯誤:', error.message);
        }
    }

    generateAdminTestReport() {
        const totalTests = this.testResults.length;
        const successfulTests = this.testResults.filter(r => r.success).length;
        const successRate = totalTests > 0 ? Math.round((successfulTests / totalTests) * 100) : 0;
        
        const categories = [...new Set(this.testResults.map(r => r.category))];
        
        const report = `
# 👑 管理員頁面全面測試報告

## 📊 總體評分: ${successRate}/100

${successRate >= 80 ? '🎉 管理員功能完整' : successRate >= 60 ? '✅ 管理員功能良好' : '⚠️ 管理員功能需改進'}

## 📋 測試統計
- **總測試項目**: ${totalTests}
- **成功項目**: ${successfulTests}
- **成功率**: ${successRate}%

## 📈 分類結果

${categories.map(category => {
    const categoryTests = this.testResults.filter(r => r.category === category);
    const categorySuccess = categoryTests.filter(r => r.success).length;
    
    return `
### ${categorySuccess === categoryTests.length ? '✅' : '⚠️'} ${category}
${categoryTests.map(test => `- ${test.success ? '✅' : '❌'} **${test.test}**: ${test.details}`).join('\n')}
`;
}).join('')}

## 💡 發現總結

### 🔍 頁面探索結果:
${this.testResults.filter(r => r.category === '管理員登入').map(r => `- ${r.test}: ${r.details}`).join('\n') || '未進行登入測試'}

### 🔧 功能分析結果:
${this.testResults.filter(r => r.category === '管理員功能分析').map(r => `- ${r.success ? '✅' : '❌'} ${r.test}`).join('\n') || '未進行功能分析'}

### 📝 CRUD操作結果:
${this.testResults.filter(r => r.category === '管理員CRUD測試').map(r => `- ${r.test}: ${r.details}`).join('\n') || '未進行CRUD測試'}

---
**測試時間**: ${new Date().toLocaleString('zh-TW')}
**測試工具**: 管理員頁面全面測試引擎
`;
        
        return { report, successRate, totalTests, successfulTests };
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    async runFullAdminTest() {
        try {
            await this.init();
            
            // 第一步：探索管理員頁面
            const adminPageInfo = await this.discoverAdminPages();
            
            if (adminPageInfo) {
                console.log(`✅ 發現管理員頁面: ${adminPageInfo.url}`);
                
                // 第二步：測試登入
                const loginSuccess = await this.testAdminLogin(adminPageInfo);
                
                // 第三步：分析功能（無論是否登入成功）
                const adminFunctionality = await this.analyzeAdminFunctionality(adminPageInfo.url);
                
                // 第四步：測試CRUD操作
                if (adminFunctionality) {
                    await this.testCRUDOperations(adminFunctionality);
                }
                
            } else {
                console.log('❌ 未發現管理員頁面');
                this.testResults.push({
                    category: '管理員頁面探索',
                    test: '管理員頁面發現',
                    success: false,
                    details: '無法找到管理員頁面入口'
                });
            }
            
            const reportData = this.generateAdminTestReport();
            console.log(reportData.report);
            
            return reportData;
            
        } catch (error) {
            console.error('❌ 管理員測試執行失敗:', error);
            throw error;
        } finally {
            await this.close();
        }
    }
}

// 執行測試
async function main() {
    const tester = new AdminPageComprehensiveTest();
    
    try {
        const results = await tester.runFullAdminTest();
        
        // 發送結果到Telegram
        const https = require('https');
        const telegramData = {
            chat_id: 'process.env.TELEGRAM_GROUP_ID',
            text: `👑 管理員頁面測試完成\\n\\n📊 評分: ${results.successRate}/100\\n✅ 成功: ${results.successfulTests}/${results.totalTests}\\n\\n🔍 測試內容:\\n- 管理員頁面探索\\n- 登入功能測試\\n- 功能分析\\n- CRUD操作測試\\n\\n🕐 ${new Date().toLocaleString('zh-TW')}`
        };
        
        const postData = JSON.stringify(telegramData);
        const options = {
            hostname: 'api.telegram.org',
            port: 443,
            path: '/botprocess.env.TELEGRAM_BOT_TOKEN/sendMessage',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        const req = https.request(options);
        req.write(postData);
        req.end();
        
        console.log('\n📱 管理員測試報告已發送');
        
    } catch (error) {
        console.error('測試執行失敗:', error);
    }
}

main().catch(console.error);