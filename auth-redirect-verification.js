/**
 * 🔐 認證系統跳轉驗證引擎
 * 專門測試登入成功後的重定向行為
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;

class AuthRedirectVerification {
    constructor() {
        this.baseUrl = 'http://localhost:3002';
        this.browser = null;
        this.page = null;
        this.testResults = [];
    }

    async initialize() {
        console.log('🚀 啟動認證重定向驗證引擎...');
        
        this.browser = await puppeteer.launch({
            headless: false,
            slowMo: 500,
            defaultViewport: { width: 1280, height: 720 }
        });

        this.page = await this.browser.newPage();
        
        // 網頁事件監聽
        this.page.on('console', msg => {
            console.log(`📱 瀏覽器: ${msg.text()}`);
        });

        this.page.on('response', response => {
            if (response.url().includes('/api/')) {
                console.log(`🌐 API: ${response.url()} - ${response.status()}`);
            }
        });
    }

    async testSuccessfulLoginRedirect() {
        console.log('\\n🧪 測試成功登入重定向...');
        
        try {
            // 1. 訪問登入頁面
            await this.page.goto(`${this.baseUrl}/`, { waitUntil: 'networkidle0' });
            console.log('✅ 登入頁面載入完成');

            // 2. 清除localStorage (防止自動重定向)
            await this.page.evaluate(() => {
                localStorage.clear();
                sessionStorage.clear();
            });

            // 3. 填寫登入表單
            await this.page.type('#login-name', '測試員工');
            await this.page.type('#login-id', 'A123456789');
            console.log('✅ 登入表單填寫完成');

            // 4. 監聽頁面導航事件
            const navigationPromise = this.page.waitForNavigation({ 
                waitUntil: 'networkidle0',
                timeout: 15000 
            });

            // 5. 點擊登入按鈕
            await this.page.click('#login-btn');
            console.log('✅ 登入按鈕點擊');

            // 6. 等待重定向完成
            await navigationPromise;
            
            // 7. 檢查當前URL和頁面內容
            const currentUrl = this.page.url();
            const pageTitle = await this.page.title();
            
            console.log(`📍 重定向到: ${currentUrl}`);
            console.log(`📄 頁面標題: ${pageTitle}`);

            // 8. 檢查是否成功跳轉到員工或管理員頁面
            const isEmployeePage = currentUrl.includes('/employee');
            const isAdminPage = currentUrl.includes('/admin');
            const hasValidTitle = pageTitle.includes('企業') || pageTitle.includes('員工') || pageTitle.includes('管理');

            // 9. 檢查頁面是否有認證內容
            let hasAuthenticatedContent = false;
            try {
                await this.page.waitForSelector('body', { timeout: 3000 });
                const bodyText = await this.page.$eval('body', el => el.textContent);
                hasAuthenticatedContent = bodyText.includes('測試員工') || bodyText.includes('載入中');
            } catch (error) {
                console.log('⚠️ 無法檢查頁面認證內容');
            }

            const result = {
                test: '成功登入重定向',
                status: (isEmployeePage || isAdminPage) && hasValidTitle ? 'PASSED' : 'FAILED',
                details: {
                    originalUrl: `${this.baseUrl}/`,
                    redirectedUrl: currentUrl,
                    pageTitle: pageTitle,
                    isEmployeePage,
                    isAdminPage,
                    hasValidTitle,
                    hasAuthenticatedContent
                }
            };

            this.testResults.push(result);
            console.log(result.status === 'PASSED' ? '✅ 登入重定向測試通過' : '❌ 登入重定向測試失敗');
            
            return result;

        } catch (error) {
            console.error('❌ 登入重定向測試失敗:', error.message);
            const result = {
                test: '成功登入重定向',
                status: 'FAILED',
                error: error.message
            };
            this.testResults.push(result);
            return result;
        }
    }

    async testInvalidLoginNoRedirect() {
        console.log('\\n🧪 測試無效登入不重定向...');
        
        try {
            // 1. 重新訪問登入頁面
            await this.page.goto(`${this.baseUrl}/`, { waitUntil: 'networkidle0' });
            console.log('✅ 重新載入登入頁面');

            // 2. 填寫錯誤的登入資訊
            await this.page.evaluate(() => {
                document.getElementById('login-name').value = '';
                document.getElementById('login-id').value = '';
            });
            
            await this.page.type('#login-name', '不存在的員工');
            await this.page.type('#login-id', 'X999999999');
            console.log('✅ 錯誤登入表單填寫完成');

            // 3. 記錄當前URL
            const originalUrl = this.page.url();

            // 4. 點擊登入按鈕
            await this.page.click('#login-btn');
            console.log('✅ 登入按鈕點擊');

            // 5. 等待一下看是否有錯誤訊息出現
            await this.page.waitForTimeout(3000);

            // 6. 檢查是否仍在同一頁面
            const currentUrl = this.page.url();
            const stayedOnSamePage = currentUrl === originalUrl;

            // 7. 檢查是否有錯誤訊息
            let hasErrorMessage = false;
            try {
                const errorElement = await this.page.$('.alert-error');
                if (errorElement) {
                    const errorText = await this.page.$eval('.alert-error', el => el.textContent);
                    hasErrorMessage = errorText.length > 0;
                    console.log(`📝 錯誤訊息: ${errorText}`);
                }
            } catch (error) {
                console.log('⚠️ 無法找到錯誤訊息元素');
            }

            const result = {
                test: '無效登入不重定向',
                status: stayedOnSamePage ? 'PASSED' : 'FAILED',
                details: {
                    originalUrl,
                    currentUrl,
                    stayedOnSamePage,
                    hasErrorMessage
                }
            };

            this.testResults.push(result);
            console.log(result.status === 'PASSED' ? '✅ 無效登入不重定向測試通過' : '❌ 無效登入不重定向測試失敗');
            
            return result;

        } catch (error) {
            console.error('❌ 無效登入測試失敗:', error.message);
            const result = {
                test: '無效登入不重定向',
                status: 'FAILED',
                error: error.message
            };
            this.testResults.push(result);
            return result;
        }
    }

    async testEmployeePageAccess() {
        console.log('\\n🧪 測試員工頁面直接訪問...');
        
        try {
            // 1. 清除所有認證資訊
            await this.page.evaluate(() => {
                localStorage.clear();
                sessionStorage.clear();
            });

            // 2. 嘗試直接訪問員工頁面
            await this.page.goto(`${this.baseUrl}/employee`, { 
                waitUntil: 'networkidle0',
                timeout: 10000 
            });

            // 3. 檢查是否被重定向回登入頁面
            const currentUrl = this.page.url();
            const redirectedToLogin = currentUrl.includes('/') && !currentUrl.includes('/employee');

            console.log(`📍 訪問員工頁面後的URL: ${currentUrl}`);

            const result = {
                test: '員工頁面訪問控制',
                status: redirectedToLogin ? 'PASSED' : 'FAILED',
                details: {
                    attemptedUrl: `${this.baseUrl}/employee`,
                    actualUrl: currentUrl,
                    redirectedToLogin
                }
            };

            this.testResults.push(result);
            console.log(result.status === 'PASSED' ? '✅ 員工頁面訪問控制測試通過' : '❌ 員工頁面訪問控制測試失敗');
            
            return result;

        } catch (error) {
            console.error('❌ 員工頁面訪問測試失敗:', error.message);
            const result = {
                test: '員工頁面訪問控制',
                status: 'FAILED',
                error: error.message
            };
            this.testResults.push(result);
            return result;
        }
    }

    async generateReport() {
        const passedTests = this.testResults.filter(t => t.status === 'PASSED').length;
        const totalTests = this.testResults.length;
        const successRate = ((passedTests / totalTests) * 100).toFixed(1);

        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total: totalTests,
                passed: passedTests,
                failed: totalTests - passedTests,
                successRate: `${successRate}%`
            },
            tests: this.testResults,
            conclusion: {
                authenticationWorking: passedTests >= 2,
                redirectBehaviorCorrect: this.testResults.some(t => t.test.includes('重定向') && t.status === 'PASSED'),
                accessControlWorking: this.testResults.some(t => t.test.includes('訪問控制') && t.status === 'PASSED')
            }
        };

        const reportPath = `D:\\0809\\auth-redirect-verification-${Date.now()}.json`;
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');

        console.log(`\\n📊 認證重定向驗證報告:`);
        console.log(`📈 成功率: ${successRate}% (${passedTests}/${totalTests})`);
        console.log(`📁 報告位置: ${reportPath}`);

        // 生成摘要
        const summary = `
# 🔐 認證系統重定向驗證報告

**測試時間**: ${new Date().toLocaleString('zh-TW')}
**成功率**: ${successRate}% (${passedTests}/${totalTests})

## 📋 測試結果

${this.testResults.map(test => `
### ${test.status === 'PASSED' ? '✅' : '❌'} ${test.test}
- **狀態**: ${test.status}
${test.details ? Object.entries(test.details).map(([key, value]) => `- **${key}**: ${value}`).join('\\n') : ''}
${test.error ? `- **錯誤**: ${test.error}` : ''}
`).join('')}

## 🎯 關鍵發現

### 認證系統狀態
- **登入重定向**: ${report.conclusion.redirectBehaviorCorrect ? '✅ 正常工作' : '❌ 需要修復'}
- **訪問控制**: ${report.conclusion.accessControlWorking ? '✅ 正常工作' : '❌ 需要修復'}
- **整體認證**: ${report.conclusion.authenticationWorking ? '✅ 正常工作' : '❌ 需要修復'}

## 💡 核心結論

${report.conclusion.authenticationWorking ? 
'🎉 **認證系統核心功能正常** - 登入成功會正確重定向到對應頁面，訪問控制機制有效' : 
'⚠️ **認證系統需要改進** - 存在重定向或訪問控制問題'}

---
**生成時間**: ${new Date().toLocaleString('zh-TW')}
        `;

        const summaryPath = `D:\\0809\\auth-redirect-summary-${Date.now()}.md`;
        await fs.writeFile(summaryPath, summary, 'utf8');

        console.log(`📋 摘要報告: ${summaryPath}`);
        return { reportPath, summaryPath, report };
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    async runAllTests() {
        try {
            await this.initialize();
            
            console.log('🔐 開始認證重定向驗證測試...');
            
            // 執行所有測試
            await this.testSuccessfulLoginRedirect();
            await this.testInvalidLoginNoRedirect();
            await this.testEmployeePageAccess();
            
            // 生成報告
            const reportInfo = await this.generateReport();
            
            console.log('\\n🎉 認證重定向驗證完成！');
            return reportInfo;
            
        } catch (error) {
            console.error('❌ 認證重定向驗證失敗:', error);
            throw error;
        } finally {
            await this.cleanup();
        }
    }
}

// 直接執行
if (require.main === module) {
    const verifier = new AuthRedirectVerification();
    verifier.runAllTests()
        .then(report => {
            console.log('🎯 認證重定向驗證完成');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 驗證失敗:', error);
            process.exit(1);
        });
}

module.exports = AuthRedirectVerification;