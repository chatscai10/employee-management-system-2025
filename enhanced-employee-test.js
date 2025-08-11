/**
 * 🔍 增強員工登入測試 - 詳細分析跳轉問題
 */

const puppeteer = require('puppeteer');

class EnhancedEmployeeTest {
    constructor() {
        this.baseUrl = 'https://employee-management-system-intermediate.onrender.com';
    }

    async runEnhancedTest() {
        console.log('🔍 啟動增強員工登入測試...');
        
        const browser = await puppeteer.launch({ 
            headless: false,
            defaultViewport: null,
            args: ['--start-maximized'] 
        });

        try {
            await this.testEmployeeLoginWithStorage(browser);
            
        } catch (error) {
            console.error('❌ 測試錯誤:', error.message);
        } finally {
            await browser.close();
            console.log('✅ 測試完成');
        }
    }

    async testEmployeeLoginWithStorage(browser) {
        console.log('🧪 測試員工登入並監控storage變化...');
        
        const page = await browser.newPage();
        
        // 完整監控
        page.on('console', msg => console.log(`🖥️  Console [${msg.type()}]: ${msg.text()}`));
        page.on('pageerror', error => console.log(`❌ JS錯誤: ${error.message}`));
        page.on('framenavigated', frame => {
            if (frame === page.mainFrame()) {
                console.log(`🔄 導航至: ${frame.url()}`);
            }
        });
        
        try {
            // 1. 清除初始狀態
            await page.evaluateOnNewDocument(() => {
                localStorage.clear();
                sessionStorage.clear();
            });
            
            // 2. 登入流程
            await page.goto(`${this.baseUrl}/public/login.html`);
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            console.log('📝 執行登入...');
            await page.type('#login-name', '張三');
            await page.type('#login-id', 'C123456789');
            
            // 監控登入後的storage變化
            page.on('response', async (response) => {
                if (response.url().includes('auth/login') && response.status() === 200) {
                    console.log('✅ 登入API成功，檢查storage保存...');
                    
                    // 等待一下讓JavaScript執行
                    setTimeout(async () => {
                        const storage = await page.evaluate(() => ({
                            token: localStorage.getItem('token'),
                            employee: localStorage.getItem('employee')
                        }));
                        console.log('📦 登入後storage狀態:', storage);
                    }, 1000);
                }
            });
            
            await page.click('#login-btn');
            await new Promise(resolve => setTimeout(resolve, 8000)); // 延長等待時間
            
            // 3. 檢查最終狀態
            const finalUrl = page.url();
            const finalStorage = await page.evaluate(() => ({
                token: localStorage.getItem('token'),
                employee: localStorage.getItem('employee'),
                url: window.location.href
            }));
            
            console.log('📍 最終狀態分析:');
            console.log(`  URL: ${finalUrl}`);
            console.log(`  Token: ${finalStorage.token ? '存在' : '不存在'}`);
            console.log(`  Employee: ${finalStorage.employee ? '存在' : '不存在'}`);
            
            // 4. 如果在登入頁面，手動跳轉到profile-enhanced
            if (finalUrl.includes('login')) {
                console.log('⚠️  被重定向回登入，測試直接訪問profile-enhanced...');
                
                // 先手動設置token (模擬登入成功狀態)
                await page.evaluate(() => {
                    localStorage.setItem('token', 'test-token-manual');
                    localStorage.setItem('employee', JSON.stringify({
                        id: 1,
                        name: '張三',
                        position: '員工'
                    }));
                });
                
                await page.goto(`${this.baseUrl}/public/profile-enhanced.html`);
                await new Promise(resolve => setTimeout(resolve, 5000));
                
                const profileUrl = page.url();
                const profileTitle = await page.title();
                const contentLength = await page.evaluate(() => document.body.innerHTML.length);
                
                console.log('📄 Profile頁面測試結果:');
                console.log(`  URL: ${profileUrl}`);
                console.log(`  標題: ${profileTitle}`);
                console.log(`  內容長度: ${contentLength}字符`);
                
                if (!profileUrl.includes('login')) {
                    console.log('✅ Profile-enhanced頁面可以正常訪問！');
                    
                    // 測試打卡功能
                    const clockFeatures = await page.evaluate(() => {
                        return {
                            clockInBtn: !!document.querySelector('.clock-in-btn'),
                            clockOutBtn: !!document.querySelector('.clock-out-btn'),
                            attendanceRecords: !!document.querySelector('#attendance-records'),
                            editProfileBtn: !!document.querySelector('[onclick*="editProfile"]'),
                            modal: !!document.querySelector('#universal-modal'),
                            hasModernUI: document.body.innerHTML.includes('動態模態視窗') || 
                                        document.body.innerHTML.includes('現代化') ||
                                        contentLength > 20000
                        };
                    });
                    
                    console.log('🎯 Profile功能檢查結果:');
                    Object.entries(clockFeatures).forEach(([feature, found]) => {
                        console.log(`  ${feature}: ${found ? '✅' : '❌'}`);
                    });
                    
                    const completeness = Object.values(clockFeatures).filter(Boolean).length;
                    console.log(`📊 Profile功能完整度: ${completeness}/${Object.keys(clockFeatures).length}`);
                }
            }
            
        } catch (error) {
            console.error('❌ 員工測試失敗:', error.message);
        } finally {
            await page.close();
        }
    }
}

// 執行測試
const test = new EnhancedEmployeeTest();
test.runEnhancedTest().catch(console.error);