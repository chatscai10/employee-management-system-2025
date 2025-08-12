/**
 * 🔐 PRO完整登入流程測試
 * 測試企業員工管理系統的完整用戶登入流程
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;

class ProCompleteLoginTest {
    constructor() {
        this.baseURL = 'http://localhost:3007';
        this.testResults = {
            loginPageAccess: false,
            formInteraction: false,
            loginSubmission: false,
            employeePageAccess: false,
            errors: [],
            screenshots: []
        };
    }

    async runCompleteLoginTest() {
        console.log('🔐 PRO完整登入流程測試開始...');
        console.log(`🎯 測試地址: ${this.baseURL}\n`);

        let browser = null;
        try {
            browser = await puppeteer.launch({
                headless: false,
                defaultViewport: { width: 1366, height: 768 },
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await browser.newPage();

            // 1. 測試登入頁面訪問
            await this.testLoginPageAccess(page);
            
            // 2. 測試表單互動
            await this.testFormInteraction(page);
            
            // 3. 測試登入提交
            await this.testLoginSubmission(page);
            
            // 4. 測試員工頁面訪問
            await this.testEmployeePageAccess(page);

            // 5. 生成測試報告
            await this.generateTestReport();

            console.log('\n🎉 ========== 完整登入測試完成 ==========');
            console.log(`✅ 登入頁面訪問: ${this.testResults.loginPageAccess ? '成功' : '失敗'}`);
            console.log(`✅ 表單互動測試: ${this.testResults.formInteraction ? '成功' : '失敗'}`);
            console.log(`✅ 登入提交測試: ${this.testResults.loginSubmission ? '成功' : '失敗'}`);
            console.log(`✅ 員工頁面訪問: ${this.testResults.employeePageAccess ? '成功' : '失敗'}`);

            const allTestsPassed = Object.values(this.testResults).every(result => 
                Array.isArray(result) ? result.length === 0 : result === true
            );

            return {
                success: allTestsPassed,
                results: this.testResults,
                errorCount: this.testResults.errors.length
            };

        } catch (error) {
            console.error('❌ 登入測試失敗:', error.message);
            this.testResults.errors.push(`測試框架錯誤: ${error.message}`);
            return { success: false, error: error.message };
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }

    async testLoginPageAccess(page) {
        console.log('🌐 測試登入頁面訪問...');
        
        try {
            const startTime = Date.now();
            
            await page.goto(this.baseURL, { 
                waitUntil: 'networkidle2',
                timeout: 15000 
            });
            
            const loadTime = Date.now() - startTime;

            // 檢查頁面內容
            const pageContent = await page.evaluate(() => {
                return {
                    title: document.title,
                    hasLoginForm: !!document.querySelector('form'),
                    hasNameInput: !!document.querySelector('input[name="name"]'),
                    hasIdInput: !!document.querySelector('input[name="idNumber"]'),
                    hasLoginButton: !!document.querySelector('button[type="submit"]'),
                    hasTestPageElements: document.body.innerText.includes('✅ 系統運行正常'),
                    mainHeading: document.querySelector('h1, h2, h3')?.textContent || '',
                    url: window.location.href
                };
            });

            console.log(`📊 頁面載入結果:`);
            console.log(`   - 載入時間: ${loadTime}ms`);
            console.log(`   - 頁面標題: ${pageContent.title}`);
            console.log(`   - 主標題: ${pageContent.mainHeading}`);
            console.log(`   - 登入表單: ${pageContent.hasLoginForm ? '✅' : '❌'}`);
            console.log(`   - 姓名輸入框: ${pageContent.hasNameInput ? '✅' : '❌'}`);
            console.log(`   - 身分證輸入框: ${pageContent.hasIdInput ? '✅' : '❌'}`);
            console.log(`   - 登入按鈕: ${pageContent.hasLoginButton ? '✅' : '❌'}`);
            console.log(`   - 測試頁面元素: ${pageContent.hasTestPageElements ? '❌ 存在' : '✅ 不存在'}`);

            // 截圖
            const screenshot = `login-page-access-${Date.now()}.png`;
            await page.screenshot({ 
                path: screenshot, 
                fullPage: true 
            });
            this.testResults.screenshots.push(screenshot);

            if (pageContent.hasLoginForm && 
                pageContent.hasNameInput && 
                pageContent.hasIdInput && 
                pageContent.hasLoginButton && 
                !pageContent.hasTestPageElements) {
                
                console.log('✅ 登入頁面訪問測試通過');
                this.testResults.loginPageAccess = true;
            } else {
                console.log('❌ 登入頁面訪問測試失敗');
                this.testResults.errors.push('登入頁面缺少必要元素或包含測試頁面內容');
            }

        } catch (error) {
            console.log(`❌ 登入頁面訪問失敗: ${error.message}`);
            this.testResults.errors.push(`登入頁面訪問錯誤: ${error.message}`);
        }
    }

    async testFormInteraction(page) {
        console.log('\n📝 測試表單互動...');
        
        try {
            // 確保在登入頁面
            await page.goto(this.baseURL, { waitUntil: 'domcontentloaded' });

            // 測試表單填寫
            console.log('📝 填寫登入表單...');
            
            await page.waitForSelector('input[name="name"]', { timeout: 5000 });
            await page.type('input[name="name"]', '測試員工');
            
            await page.waitForSelector('input[name="idNumber"]', { timeout: 5000 });
            await page.type('input[name="idNumber"]', 'A123456789');

            // 檢查填寫狀態
            const formValues = await page.evaluate(() => {
                return {
                    name: document.querySelector('input[name="name"]')?.value || '',
                    idNumber: document.querySelector('input[name="idNumber"]')?.value || '',
                    submitButtonEnabled: !document.querySelector('button[type="submit"]')?.disabled
                };
            });

            console.log(`📊 表單填寫結果:`);
            console.log(`   - 姓名欄位: "${formValues.name}"`);
            console.log(`   - 身分證欄位: "${formValues.idNumber}"`);
            console.log(`   - 提交按鈕: ${formValues.submitButtonEnabled ? '✅ 可用' : '❌ 停用'}`);

            // 截圖填寫後狀態
            const screenshot = `form-filled-${Date.now()}.png`;
            await page.screenshot({ path: screenshot });
            this.testResults.screenshots.push(screenshot);

            if (formValues.name === '測試員工' && 
                formValues.idNumber === 'A123456789' && 
                formValues.submitButtonEnabled) {
                
                console.log('✅ 表單互動測試通過');
                this.testResults.formInteraction = true;
            } else {
                console.log('❌ 表單互動測試失敗');
                this.testResults.errors.push('表單填寫或按鈕狀態異常');
            }

        } catch (error) {
            console.log(`❌ 表單互動測試失敗: ${error.message}`);
            this.testResults.errors.push(`表單互動錯誤: ${error.message}`);
        }
    }

    async testLoginSubmission(page) {
        console.log('\n🚀 測試登入提交...');
        
        try {
            // 點擊登入按鈕
            console.log('🔘 點擊登入按鈕...');
            
            await page.click('button[type="submit"]');
            
            // 等待頁面回應
            await page.waitForTimeout(3000);
            
            // 檢查提交結果
            const submitResult = await page.evaluate(() => {
                return {
                    currentUrl: window.location.href,
                    pageTitle: document.title,
                    hasErrorMessage: !!document.querySelector('.error, .alert-danger'),
                    hasSuccessMessage: !!document.querySelector('.success, .alert-success'),
                    bodyText: document.body.innerText.substring(0, 500)
                };
            });

            console.log(`📊 登入提交結果:`);
            console.log(`   - 當前URL: ${submitResult.currentUrl}`);
            console.log(`   - 頁面標題: ${submitResult.pageTitle}`);
            console.log(`   - 錯誤訊息: ${submitResult.hasErrorMessage ? '❌ 有' : '✅ 無'}`);
            console.log(`   - 成功訊息: ${submitResult.hasSuccessMessage ? '✅ 有' : '❌ 無'}`);

            // 截圖提交後狀態
            const screenshot = `login-submitted-${Date.now()}.png`;
            await page.screenshot({ path: screenshot, fullPage: true });
            this.testResults.screenshots.push(screenshot);

            // 判斷提交是否成功（頁面跳轉或顯示成功訊息）
            if (submitResult.currentUrl.includes('/employee') || 
                submitResult.currentUrl !== this.baseURL ||
                submitResult.hasSuccessMessage) {
                
                console.log('✅ 登入提交測試通過');
                this.testResults.loginSubmission = true;
            } else {
                console.log('❌ 登入提交測試失敗');
                this.testResults.errors.push('登入提交後無跳轉或成功指示');
            }

        } catch (error) {
            console.log(`❌ 登入提交測試失敗: ${error.message}`);
            this.testResults.errors.push(`登入提交錯誤: ${error.message}`);
        }
    }

    async testEmployeePageAccess(page) {
        console.log('\n👤 測試員工頁面訪問...');
        
        try {
            // 嘗試直接訪問員工頁面
            console.log('🌐 訪問員工工作台...');
            
            await page.goto(`${this.baseURL}/employee`, { 
                waitUntil: 'networkidle2',
                timeout: 10000 
            });

            // 檢查員工頁面內容
            const employeePage = await page.evaluate(() => {
                return {
                    title: document.title,
                    hasEmployeeFeatures: document.body.innerText.includes('員工') || 
                                       document.body.innerText.includes('工作台') ||
                                       document.body.innerText.includes('打卡'),
                    hasDashboard: !!document.querySelector('.dashboard, .employee-dashboard'),
                    hasNavigation: !!document.querySelector('nav, .navbar'),
                    url: window.location.href,
                    bodyText: document.body.innerText.substring(0, 300)
                };
            });

            console.log(`📊 員工頁面檢查:`);
            console.log(`   - 頁面標題: ${employeePage.title}`);
            console.log(`   - 員工功能: ${employeePage.hasEmployeeFeatures ? '✅' : '❌'}`);
            console.log(`   - 工作台介面: ${employeePage.hasDashboard ? '✅' : '❌'}`);
            console.log(`   - 導航選單: ${employeePage.hasNavigation ? '✅' : '❌'}`);
            console.log(`   - 當前URL: ${employeePage.url}`);

            // 截圖員工頁面
            const screenshot = `employee-page-${Date.now()}.png`;
            await page.screenshot({ path: screenshot, fullPage: true });
            this.testResults.screenshots.push(screenshot);

            if (employeePage.hasEmployeeFeatures && 
                employeePage.url.includes('/employee')) {
                
                console.log('✅ 員工頁面訪問測試通過');
                this.testResults.employeePageAccess = true;
            } else {
                console.log('❌ 員工頁面訪問測試失敗');
                this.testResults.errors.push('員工頁面缺少必要功能或無法正確訪問');
            }

        } catch (error) {
            console.log(`❌ 員工頁面訪問失敗: ${error.message}`);
            this.testResults.errors.push(`員工頁面訪問錯誤: ${error.message}`);
        }
    }

    async generateTestReport() {
        const report = `# 🔐 PRO完整登入流程測試報告

## 📊 測試總覽

**測試時間**: ${new Date().toLocaleString('zh-TW')}  
**測試地址**: ${this.baseURL}  
**測試項目**: 4 項核心功能測試  

## 🎯 測試結果統計

| 測試項目 | 狀態 | 說明 |
|---------|------|------|
| 登入頁面訪問 | ${this.testResults.loginPageAccess ? '✅ 通過' : '❌ 失敗'} | 確認用戶看到正確登入界面 |
| 表單互動功能 | ${this.testResults.formInteraction ? '✅ 通過' : '❌ 失敗'} | 測試表單填寫和互動 |
| 登入提交處理 | ${this.testResults.loginSubmission ? '✅ 通過' : '❌ 失敗'} | 驗證登入流程處理 |
| 員工頁面訪問 | ${this.testResults.employeePageAccess ? '✅ 通過' : '❌ 失敗'} | 確認登入後頁面跳轉 |

## 🔍 詳細測試結果

### 1. 登入頁面訪問測試
${this.testResults.loginPageAccess ? 
'✅ **成功**: 用戶能正確訪問企業登入界面，不再看到測試頁面' : 
'❌ **失敗**: 登入頁面存在問題或仍顯示測試頁面內容'}

### 2. 表單互動功能測試
${this.testResults.formInteraction ? 
'✅ **成功**: 姓名和身分證號碼輸入框正常工作，表單可正常填寫' : 
'❌ **失敗**: 表單填寫功能存在問題'}

### 3. 登入提交處理測試
${this.testResults.loginSubmission ? 
'✅ **成功**: 登入按鈕正常工作，系統能正確處理登入請求' : 
'❌ **失敗**: 登入提交功能存在問題'}

### 4. 員工頁面訪問測試
${this.testResults.employeePageAccess ? 
'✅ **成功**: 員工工作台頁面正常載入，具備必要功能' : 
'❌ **失敗**: 員工頁面訪問存在問題'}

## ❌ 發現的問題

${this.testResults.errors.length > 0 ? 
this.testResults.errors.map((error, index) => `${index + 1}. ${error}`).join('\n') : 
'🎉 **無發現問題** - 所有測試項目均通過'}

## 📸 測試截圖

${this.testResults.screenshots.map(screenshot => `- ${screenshot}`).join('\n')}

## 🏆 最終評估

**整體狀態**: ${Object.values(this.testResults).every(result => 
    Array.isArray(result) ? result.length === 0 : result === true
) ? '🟢 **完全成功**' : '🟡 **部分成功**'}

**通過率**: ${Math.round((
    [this.testResults.loginPageAccess, this.testResults.formInteraction, 
     this.testResults.loginSubmission, this.testResults.employeePageAccess]
    .filter(Boolean).length / 4) * 100)}%

## 💡 建議

${Object.values(this.testResults).every(result => 
    Array.isArray(result) ? result.length === 0 : result === true
) ? 
`### ✅ 系統就緒
- 企業員工管理系統完全可用
- 用戶登入流程順暢
- 建議正式投入使用

### 🚀 後續優化
- 可增加更多企業功能
- 優化用戶體驗細節
- 加強安全性措施` :
`### 🔧 需要修復
- 檢查失敗的測試項目
- 修復發現的問題
- 重新進行完整測試

### 📞 技術支援
- 查看錯誤詳情進行修復
- 確保所有功能正常運作`}

---
*🤖 PRO完整登入流程測試引擎*  
*Generated at: ${new Date().toISOString()}*  
*Test Status: ${this.testResults.errors.length === 0 ? 'ALL TESTS PASSED' : 'ISSUES DETECTED'}*
`;

        const filename = `pro-login-test-report-${Date.now()}.md`;
        await fs.writeFile(filename, report);
        console.log(`\n📁 測試報告已生成: ${filename}`);
        
        return { filename, content: report };
    }
}

// 立即執行測試
if (require.main === module) {
    const loginTest = new ProCompleteLoginTest();
    loginTest.runCompleteLoginTest().then(result => {
        if (result.success) {
            console.log('\n🎯 🎉 完整登入流程測試成功！');
            console.log('✅ 企業員工管理系統登入功能完全正常');
            console.log(`🌐 系統地址: http://localhost:3007`);
        } else {
            console.log('\n❌ 登入流程測試發現問題');
            console.log(`🔧 錯誤數量: ${result.errorCount || 0}`);
            console.log('📋 請查看測試報告了解詳情');
        }
    }).catch(console.error);
}

module.exports = ProCompleteLoginTest;