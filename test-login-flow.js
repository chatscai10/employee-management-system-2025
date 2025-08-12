/**
 * 🔐 測試登入流程修復
 */

const puppeteer = require('puppeteer');

class LoginFlowTest {
    constructor() {
        this.baseURL = 'http://localhost:3009';
    }

    async testLoginFlow() {
        console.log('🔐 開始測試登入流程修復...');

        let browser = null;
        try {
            browser = await puppeteer.launch({
                headless: false,
                defaultViewport: { width: 1366, height: 768 },
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await browser.newPage();

            // 1. 訪問登入頁面
            console.log('📱 1. 訪問登入頁面...');
            await page.goto(this.baseURL, { waitUntil: 'networkidle2' });

            // 2. 清除所有localStorage (模擬新用戶)
            console.log('🧹 2. 清除localStorage...');
            await page.evaluate(() => {
                localStorage.clear();
                sessionStorage.clear();
            });

            // 3. 填寫登入表單
            console.log('📝 3. 填寫登入表單...');
            await page.waitForSelector('input[name="name"]');
            await page.type('input[name="name"]', '測試員工');
            await page.type('input[name="idNumber"]', 'A123456789');

            // 4. 點擊登入
            console.log('🔘 4. 點擊登入按鈕...');
            await page.click('button[type="submit"]');

            // 5. 等待登入處理
            console.log('⏳ 5. 等待登入處理...');
            await new Promise(resolve => setTimeout(resolve, 3000));

            // 6. 檢查localStorage中的token
            const storageCheck = await page.evaluate(() => {
                return {
                    employeeToken: localStorage.getItem('employeeToken'),
                    employeeData: localStorage.getItem('employeeData'),
                    token: localStorage.getItem('token'), // 舊的key
                    employee: localStorage.getItem('employee'), // 舊的key
                    currentUrl: window.location.href
                };
            });

            console.log('📊 6. localStorage檢查結果:');
            console.log('   - employeeToken:', storageCheck.employeeToken ? '✅ 存在' : '❌ 不存在');
            console.log('   - employeeData:', storageCheck.employeeData ? '✅ 存在' : '❌ 不存在');
            console.log('   - 舊token:', storageCheck.token ? '⚠️ 仍存在' : '✅ 已清除');
            console.log('   - 當前URL:', storageCheck.currentUrl);

            // 7. 等待頁面穩定
            console.log('🔄 7. 等待頁面跳轉穩定...');
            await new Promise(resolve => setTimeout(resolve, 5000));

            const finalUrl = await page.evaluate(() => window.location.href);
            console.log('📍 8. 最終URL:', finalUrl);

            // 8. 檢查是否在員工頁面
            if (finalUrl.includes('/employee')) {
                console.log('✅ 成功：停留在員工頁面');
                
                // 檢查頁面內容
                const pageCheck = await page.evaluate(() => {
                    return {
                        hasEmployeeContent: document.body.innerText.includes('員工工作台'),
                        hasAuthAlert: !!document.getElementById('auth-alert'),
                        bodyVisible: document.body.style.visibility !== 'hidden'
                    };
                });

                console.log('📋 9. 頁面狀態檢查:');
                console.log('   - 員工內容:', pageCheck.hasEmployeeContent ? '✅ 存在' : '❌ 不存在');
                console.log('   - 認證警告:', pageCheck.hasAuthAlert ? '❌ 存在' : '✅ 不存在');
                console.log('   - 頁面可見:', pageCheck.bodyVisible ? '✅ 可見' : '❌ 隱藏');

                return { success: true, finalUrl, checks: pageCheck };
            } else {
                console.log('❌ 失敗：沒有停留在員工頁面');
                return { success: false, finalUrl };
            }

        } catch (error) {
            console.error('❌ 測試失敗:', error.message);
            return { success: false, error: error.message };
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }
}

// 執行測試
if (require.main === module) {
    const test = new LoginFlowTest();
    test.testLoginFlow().then(result => {
        if (result.success) {
            console.log('\n🎉 登入流程測試成功！');
            console.log('✅ 無限重定向問題已修復');
        } else {
            console.log('\n❌ 登入流程測試失敗');
            console.log('🔧 需要進一步調試');
        }
    }).catch(console.error);
}

module.exports = LoginFlowTest;