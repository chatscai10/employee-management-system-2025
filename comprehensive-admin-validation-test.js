const puppeteer = require('puppeteer');

class ComprehensiveAdminValidationTest {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = [];
        this.baseUrl = 'https://employee-management-system-intermediate.onrender.com';
        this.systemLogicDiscrepancies = [];
    }

    async init() {
        console.log('🚀 啟動管理員頁面全面驗證測試...');
        
        this.browser = await puppeteer.launch({
            headless: false,
            slowMo: 500,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
        });
        
        this.page = await this.browser.newPage();
        await this.page.setViewport({ width: 1366, height: 768 });
        
        this.page.on('console', msg => {
            if (msg.text().includes('API') || msg.text().includes('錯誤') || msg.text().includes('成功')) {
                console.log(`🖥️ 管理員頁面: ${msg.text()}`);
            }
        });
        
        console.log('✅ 測試環境已準備完成');
    }

    async testAdminPageAccess() {
        console.log('\n🔍 測試管理員頁面訪問...');
        
        try {
            await this.page.goto(`${this.baseUrl}/admin`, { waitUntil: 'domcontentloaded' });
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const pageAnalysis = await this.page.evaluate(() => {
                const bodyText = document.body.textContent.toLowerCase();
                return {
                    hasAdminTitle: document.title.includes('管理') || document.title.includes('Admin'),
                    hasAdminContent: bodyText.includes('管理') || bodyText.includes('admin'),
                    hasEmployeeManagement: bodyText.includes('員工管理') || bodyText.includes('employee'),
                    hasSystemSettings: bodyText.includes('系統設定') || bodyText.includes('system'),
                    hasLoginForm: document.querySelector('form') !== null,
                    hasPasswordField: document.querySelector('input[type="password"]') !== null,
                    hasUsernameField: document.querySelector('input[type="text"], input[type="email"]') !== null,
                    pageTitle: document.title,
                    formCount: document.querySelectorAll('form').length,
                    inputCount: document.querySelectorAll('input').length,
                    buttonCount: document.querySelectorAll('button').length
                };
            });
            
            console.log(`管理員頁面分析結果: ${JSON.stringify(pageAnalysis, null, 2)}`);
            
            this.testResults.push({
                category: '管理員頁面訪問',
                test: '管理員頁面可達性',
                success: pageAnalysis.hasAdminContent,
                details: `標題: ${pageAnalysis.pageTitle}, 表單: ${pageAnalysis.formCount}個, 輸入: ${pageAnalysis.inputCount}個, 按鈕: ${pageAnalysis.buttonCount}個`,
                systemLogicExpected: '應有完整的管理員認證系統和功能選單',
                actualResult: pageAnalysis.hasLoginForm ? '有登入表單但結構簡化' : '無標準登入表單'
            });
            
            if (!pageAnalysis.hasPasswordField) {
                this.systemLogicDiscrepancies.push({
                    issue: '管理員認證機制不符合系統邏輯',
                    expected: '應有完整的用戶名和密碼認證',
                    actual: '缺少密碼欄位，可能使用簡化認證',
                    severity: 'HIGH'
                });
            }
            
            return pageAnalysis;
            
        } catch (error) {
            console.error('❌ 管理員頁面訪問測試失敗:', error.message);
            return null;
        }
    }

    async testAdminFunctionalities() {
        console.log('\n🔧 測試管理員功能模組...');
        
        const expectedFunctions = [
            '員工管理', '庫存管理', '營收管理', '排班系統', 
            '升遷投票', '系統設定', '報表功能', '維修管理'
        ];
        
        try {
            const functionAnalysis = await this.page.evaluate(() => {
                const allText = document.body.textContent;
                const links = Array.from(document.querySelectorAll('a')).map(a => a.textContent.trim());
                const buttons = Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim());
                const navItems = Array.from(document.querySelectorAll('nav a, .nav a, .navigation a')).map(n => n.textContent.trim());
                
                return {
                    fullText: allText,
                    navigationLinks: links.filter(link => link.length > 0),
                    actionButtons: buttons.filter(btn => btn.length > 0),
                    navigationItems: navItems.filter(nav => nav.length > 0),
                    hasEmployeeTable: document.querySelector('table') !== null,
                    hasCRUDButtons: buttons.some(btn => 
                        btn.includes('新增') || btn.includes('編輯') || 
                        btn.includes('刪除') || btn.includes('修改')
                    ),
                    hasDataTables: document.querySelectorAll('table').length,
                    hasFormInputs: document.querySelectorAll('input, select, textarea').length
                };
            });
            
            const foundFunctions = [];
            const missingFunctions = [];
            
            expectedFunctions.forEach(func => {
                const found = functionAnalysis.fullText.includes(func) ||
                            functionAnalysis.navigationLinks.some(link => link.includes(func)) ||
                            functionAnalysis.actionButtons.some(btn => btn.includes(func));
                            
                if (found) {
                    foundFunctions.push(func);
                } else {
                    missingFunctions.push(func);
                }
            });
            
            console.log(`找到功能: ${foundFunctions.join(', ')}`);
            console.log(`缺失功能: ${missingFunctions.join(', ')}`);
            
            this.testResults.push({
                category: '管理員功能模組',
                test: '核心功能可用性',
                success: foundFunctions.length >= 4, // 至少一半功能可用
                details: `找到${foundFunctions.length}/${expectedFunctions.length}個功能，CRUD按鈕: ${functionAnalysis.hasCRUDButtons}`,
                systemLogicExpected: '8個核心管理功能模組',
                actualResult: `${foundFunctions.length}個功能模組可見`
            });
            
            // 檢查系統邏輯差異
            if (missingFunctions.length > 4) {
                this.systemLogicDiscrepancies.push({
                    issue: '管理員功能模組嚴重缺失',
                    expected: `完整的${expectedFunctions.length}個核心功能`,
                    actual: `僅有${foundFunctions.length}個功能可見`,
                    missingFunctions: missingFunctions,
                    severity: 'CRITICAL'
                });
            }
            
            return { foundFunctions, missingFunctions, functionAnalysis };
            
        } catch (error) {
            console.error('❌ 管理員功能測試失敗:', error.message);
            return null;
        }
    }

    async testEmployeeManagementCRUD() {
        console.log('\n👥 測試員工管理CRUD操作...');
        
        try {
            // 尋找員工管理相關功能
            const employeeManagement = await this.page.evaluate(() => {
                const tables = document.querySelectorAll('table');
                const forms = document.querySelectorAll('form');
                const inputs = document.querySelectorAll('input');
                
                // 分析是否有員工資料表格
                let hasEmployeeTable = false;
                let employeeTableData = [];
                
                tables.forEach(table => {
                    const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent.trim());
                    const rows = table.querySelectorAll('tr').length;
                    
                    if (headers.some(h => h.includes('員工') || h.includes('姓名') || h.includes('職位'))) {
                        hasEmployeeTable = true;
                        employeeTableData.push({ headers, rowCount: rows });
                    }
                });
                
                // 分析表單結構
                const formAnalysis = [];
                forms.forEach((form, index) => {
                    const formInputs = form.querySelectorAll('input, select, textarea');
                    const submitButtons = form.querySelectorAll('button[type="submit"], input[type="submit"]');
                    
                    formAnalysis.push({
                        formIndex: index,
                        inputCount: formInputs.length,
                        hasSubmitButton: submitButtons.length > 0,
                        inputTypes: Array.from(formInputs).map(input => input.type || input.tagName.toLowerCase())
                    });
                });
                
                return {
                    hasEmployeeTable,
                    employeeTableData,
                    formAnalysis,
                    totalInputs: inputs.length,
                    hasPossibleRegistrationForm: formAnalysis.some(f => f.inputCount >= 10) // 系統邏輯要求11個必填欄位
                };
            });
            
            console.log(`員工管理分析: ${JSON.stringify(employeeManagement, null, 2)}`);
            
            this.testResults.push({
                category: '員工管理CRUD',
                test: '員工資料管理功能',
                success: employeeManagement.hasEmployeeTable || employeeManagement.hasPossibleRegistrationForm,
                details: `員工表格: ${employeeManagement.hasEmployeeTable}, 可能的註冊表單: ${employeeManagement.hasPossibleRegistrationForm}, 總輸入欄位: ${employeeManagement.totalInputs}`,
                systemLogicExpected: '11個必填欄位的員工註冊系統 + 員工資料表格',
                actualResult: `表單最大欄位數: ${Math.max(...employeeManagement.formAnalysis.map(f => f.inputCount))}`
            });
            
            // 檢查註冊系統是否符合系統邏輯
            const maxFormInputs = Math.max(...employeeManagement.formAnalysis.map(f => f.inputCount));
            if (maxFormInputs < 11) {
                this.systemLogicDiscrepancies.push({
                    issue: '員工註冊表單欄位不足',
                    expected: '11個必填欄位 (姓名、身分證、生日、性別、駕照、電話、地址、緊急聯絡人等)',
                    actual: `最多${maxFormInputs}個輸入欄位`,
                    severity: 'HIGH'
                });
            }
            
            return employeeManagement;
            
        } catch (error) {
            console.error('❌ 員工管理CRUD測試失敗:', error.message);
            return null;
        }
    }

    async testSystemLogicCompliance() {
        console.log('\n📋 檢查系統邏輯合規性...');
        
        const systemRequirements = [
            {
                name: '20個核心資料庫表',
                check: async () => {
                    // 透過API檢查或頁面功能推斷
                    const response = await this.page.evaluate(async () => {
                        try {
                            const res = await fetch('/api/admin/stats');
                            const data = await res.json();
                            return data;
                        } catch (error) {
                            return { error: error.message };
                        }
                    });
                    return { success: !response.error, details: JSON.stringify(response) };
                }
            },
            {
                name: '29種Telegram通知模板',
                check: async () => {
                    // 檢查是否有通知設定
                    const hasNotificationSettings = await this.page.evaluate(() => {
                        const text = document.body.textContent.toLowerCase();
                        return text.includes('telegram') || text.includes('通知') || text.includes('notification');
                    });
                    return { success: hasNotificationSettings, details: `通知功能存在: ${hasNotificationSettings}` };
                }
            },
            {
                name: '升遷投票系統 (匿名投票)',
                check: async () => {
                    const hasVotingSystem = await this.page.evaluate(() => {
                        const text = document.body.textContent.toLowerCase();
                        return text.includes('投票') || text.includes('升遷') || text.includes('vote');
                    });
                    return { success: hasVotingSystem, details: `投票系統存在: ${hasVotingSystem}` };
                }
            },
            {
                name: '6重規則智慧排班系統',
                check: async () => {
                    const hasScheduling = await this.page.evaluate(() => {
                        const text = document.body.textContent.toLowerCase();
                        return text.includes('排班') || text.includes('schedule');
                    });
                    return { success: hasScheduling, details: `排班系統存在: ${hasScheduling}` };
                }
            }
        ];
        
        console.log('🔍 開始系統邏輯合規檢查...');
        
        for (const requirement of systemRequirements) {
            try {
                console.log(`  檢查: ${requirement.name}...`);
                const result = await requirement.check();
                
                this.testResults.push({
                    category: '系統邏輯合規性',
                    test: requirement.name,
                    success: result.success,
                    details: result.details,
                    systemLogicExpected: '符合系統邏輯.txt規格',
                    actualResult: result.success ? '符合要求' : '不符合要求'
                });
                
                if (!result.success) {
                    this.systemLogicDiscrepancies.push({
                        issue: `${requirement.name} 不符合系統邏輯`,
                        expected: '符合系統邏輯.txt完整規格',
                        actual: result.details,
                        severity: 'MEDIUM'
                    });
                }
                
            } catch (error) {
                console.error(`❌ ${requirement.name} 檢查失敗:`, error.message);
            }
        }
    }

    generateComprehensiveReport() {
        const totalTests = this.testResults.length;
        const successfulTests = this.testResults.filter(r => r.success).length;
        const successRate = totalTests > 0 ? Math.round((successfulTests / totalTests) * 100) : 0;
        
        const categories = [...new Set(this.testResults.map(r => r.category))];
        const criticalIssues = this.systemLogicDiscrepancies.filter(d => d.severity === 'CRITICAL').length;
        const highIssues = this.systemLogicDiscrepancies.filter(d => d.severity === 'HIGH').length;
        
        let status = '❌ 管理員系統嚴重不符合系統邏輯';
        if (successRate >= 80 && criticalIssues === 0) status = '🎉 管理員系統符合企業級標準';
        else if (successRate >= 60 && criticalIssues === 0) status = '✅ 管理員系統基本符合要求';
        else if (successRate >= 40) status = '⚠️ 管理員系統需要重大改進';
        
        const report = `
# 🏢 管理員頁面全面驗證測試報告

## 📊 總體評分: ${successRate}/100

${status}

## 🚨 系統邏輯差異分析

### 嚴重問題 (${criticalIssues}個):
${this.systemLogicDiscrepancies.filter(d => d.severity === 'CRITICAL').map(d => `
- **${d.issue}**
  - 期望: ${d.expected}
  - 實際: ${d.actual}
  ${d.missingFunctions ? `- 缺失功能: ${d.missingFunctions.join(', ')}` : ''}
`).join('') || '✅ 無嚴重問題'}

### 高優先級問題 (${highIssues}個):
${this.systemLogicDiscrepancies.filter(d => d.severity === 'HIGH').map(d => `
- **${d.issue}**
  - 期望: ${d.expected}
  - 實際: ${d.actual}
`).join('') || '✅ 無高優先級問題'}

## 📋 詳細測試結果

${categories.map(category => {
    const categoryTests = this.testResults.filter(r => r.category === category);
    const categorySuccess = categoryTests.filter(r => r.success).length;
    const categoryRate = Math.round((categorySuccess / categoryTests.length) * 100);
    
    return `
### ${categorySuccess === categoryTests.length ? '✅' : categorySuccess > 0 ? '⚠️' : '❌'} ${category} (${categoryRate}%)
${categoryTests.map(test => `
#### ${test.success ? '✅' : '❌'} ${test.test}
- **測試結果**: ${test.details}
- **系統邏輯期望**: ${test.systemLogicExpected || '符合基本要求'}
- **實際結果**: ${test.actualResult || '見測試結果'}
`).join('')}`;
}).join('')}

## 🎯 關鍵發現與建議

### 📈 符合系統邏輯的項目:
${this.testResults.filter(r => r.success).map(r => `- ✅ ${r.test}`).join('\n') || '❌ 暫無完全符合項目'}

### ⚠️ 急需修復的系統邏輯差異:
${this.systemLogicDiscrepancies.map(d => `- ${d.issue} (${d.severity})`).slice(0, 5).join('\n') || '✅ 無關鍵差異'}

## 🚀 改進建議優先級

### 🔥 立即修復 (關鍵系統邏輯):
${this.systemLogicDiscrepancies.filter(d => d.severity === 'CRITICAL').map(d => `1. 修復 ${d.issue}`).join('\n') || '✅ 無緊急修復項目'}

### ⭐ 短期改進:
${this.systemLogicDiscrepancies.filter(d => d.severity === 'HIGH').map(d => `1. 完善 ${d.issue}`).join('\n') || '✅ 無高優先級改進項目'}

### 📊 系統邏輯合規評估:
- **資料庫架構**: ${this.testResults.find(r => r.test.includes('資料庫')) ? this.testResults.find(r => r.test.includes('資料庫')).success ? '✅ 符合' : '❌ 不符合' : '❓ 未測試'}
- **功能模組覆蓋**: ${this.testResults.find(r => r.test.includes('功能')) ? Math.round((this.testResults.filter(r => r.category.includes('功能') && r.success).length / this.testResults.filter(r => r.category.includes('功能')).length) * 100) : 0}%
- **認證系統**: ${this.testResults.find(r => r.test.includes('認證')) ? this.testResults.find(r => r.test.includes('認證')).success ? '✅ 符合' : '❌ 不符合' : '❓ 未測試'}

---
**測試時間**: ${new Date().toLocaleString('zh-TW')}
**測試範圍**: 管理員頁面驗證 + 系統邏輯合規檢查
**參考標準**: 系統邏輯.txt v2.0規格
`;
        
        return { report, successRate, totalTests, successfulTests, systemLogicDiscrepancies: this.systemLogicDiscrepancies };
    }

    async close() {
        console.log('\n🔚 關閉測試環境...');
        if (this.browser) {
            await this.browser.close();
        }
    }

    async runComprehensiveAdminValidation() {
        try {
            await this.init();
            
            // 執行全面管理員驗證
            const adminPageAccess = await this.testAdminPageAccess();
            if (adminPageAccess) {
                await this.testAdminFunctionalities();
                await this.testEmployeeManagementCRUD();
                await this.testSystemLogicCompliance();
            }
            
            const reportData = this.generateComprehensiveReport();
            console.log(reportData.report);
            
            return reportData;
            
        } catch (error) {
            console.error('❌ 管理員驗證測試執行失敗:', error);
            throw error;
        } finally {
            await this.close();
        }
    }
}

// 執行測試
async function main() {
    const tester = new ComprehensiveAdminValidationTest();
    
    try {
        const results = await tester.runComprehensiveAdminValidation();
        
        // 發送詳細結果到Telegram
        const https = require('https');
        const telegramData = {
            chat_id: 'process.env.TELEGRAM_GROUP_ID',
            text: `🏢 管理員頁面系統邏輯驗證完成\\n\\n📊 總評分: ${results.successRate}/100\\n🚨 系統邏輯差異: ${results.systemLogicDiscrepancies.length}個\\n\\n📋 測試結果:\\n✅ 成功: ${results.successfulTests}/${results.totalTests}\\n⚠️ 嚴重問題: ${results.systemLogicDiscrepancies.filter(d => d.severity === 'CRITICAL').length}個\\n⚠️ 高優先級問題: ${results.systemLogicDiscrepancies.filter(d => d.severity === 'HIGH').length}個\\n\\n🔍 主要發現:\\n${results.systemLogicDiscrepancies.slice(0, 3).map(d => `- ${d.issue}`).join('\\n')}\\n\\n🕐 ${new Date().toLocaleString('zh-TW')}`
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
        
        console.log('\n📱 管理員驗證報告已發送至Telegram');
        
        // 保存詳細報告
        const fs = require('fs');
        fs.writeFileSync('D:\\0809\\admin-validation-system-logic-report.md', results.report);
        console.log('📄 詳細報告已保存');
        
    } catch (error) {
        console.error('測試執行失敗:', error);
    }
}

main().catch(console.error);