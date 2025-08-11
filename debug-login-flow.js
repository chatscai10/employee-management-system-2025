/**
 * 🔍 登入流程調試工具
 * 詳細檢查登入API回應和跳轉邏輯
 */

const puppeteer = require('puppeteer');

class LoginFlowDebug {
    constructor() {
        this.baseUrl = 'https://employee-management-system-intermediate.onrender.com';
    }

    async debugLoginFlow() {
        console.log('🔍 啟動登入流程調試...');
        
        const browser = await puppeteer.launch({ 
            headless: false,
            defaultViewport: null,
            args: ['--start-maximized'] 
        });

        try {
            await this.debugEmployeeLogin(browser);
            
        } catch (error) {
            console.error('❌ 調試錯誤:', error.message);
        } finally {
            await browser.close();
            console.log('✅ 調試完成');
        }
    }

    async debugEmployeeLogin(browser) {
        console.log('🧪 調試員工登入流程...');
        
        const page = await browser.newPage();
        
        // 監聽網路請求
        page.on('request', request => {
            if (request.url().includes('/api/')) {
                console.log(`📡 API請求: ${request.method()} ${request.url()}`);
                console.log(`📋 請求數據:`, request.postData());
            }
        });

        page.on('response', async response => {
            if (response.url().includes('/api/auth/login')) {
                console.log(`📥 登入API回應: ${response.status()}`);
                try {
                    const responseData = await response.json();
                    console.log('📋 回應數據:', JSON.stringify(responseData, null, 2));
                } catch (error) {
                    console.log('❌ 無法解析回應數據');
                }
            }
        });

        // 監聽頁面跳轉
        page.on('framenavigated', frame => {
            if (frame === page.mainFrame()) {
                console.log(`🔄 頁面跳轉: ${frame.url()}`);
            }
        });
        
        try {
            // 清除所有存儲
            await page.evaluateOnNewDocument(() => {
                localStorage.clear();
                sessionStorage.clear();
            });
            
            await page.goto(`${this.baseUrl}/public/login.html`);
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            console.log('🌐 已訪問登入頁面');
            
            // 檢查登入表單
            const formElements = await page.evaluate(() => {
                const nameInput = document.querySelector('#login-name, input[name="name"]');
                const idInput = document.querySelector('#login-id, input[name="idNumber"]');
                const loginBtn = document.querySelector('#login-btn, button[type="submit"], .login-btn');
                const loginForm = document.querySelector('#login-form, form');
                
                return {
                    hasNameInput: !!nameInput,
                    hasIdInput: !!idInput,
                    hasLoginBtn: !!loginBtn,
                    hasForm: !!loginForm,
                    nameInputSelector: nameInput ? nameInput.id || nameInput.name : 'none',
                    idInputSelector: idInput ? idInput.id || idInput.name : 'none'
                };
            });
            
            console.log('📋 登入表單檢查:', formElements);
            
            // 填寫員工資料
            const nameInput = await page.$('#login-name, input[name="name"]');
            const idInput = await page.$('#login-id, input[name="idNumber"]');
            
            if (nameInput && idInput) {
                await nameInput.type('一般員工');
                await idInput.type('C123456789');
                
                console.log('📝 已填寫員工登入資料');
                
                // 點擊登入按鈕並監聽回應
                const loginBtn = await page.$('#login-btn, button[type="submit"], .login-btn');
                if (loginBtn) {
                    console.log('🔘 準備點擊登入按鈕...');
                    
                    // 等待登入回應
                    const responsePromise = page.waitForResponse(response => 
                        response.url().includes('/api/auth/login')
                    );
                    
                    await loginBtn.click();
                    
                    try {
                        const response = await responsePromise;
                        console.log(`📥 登入API狀態: ${response.status()}`);
                        
                        // 等待可能的跳轉
                        await new Promise(resolve => setTimeout(resolve, 5000));
                        
                        const finalUrl = page.url();
                        console.log(`📍 最終URL: ${finalUrl}`);
                        
                        // 檢查localStorage中的token
                        const authData = await page.evaluate(() => {
                            return {
                                token: localStorage.getItem('token'),
                                user: localStorage.getItem('user'),
                                currentUser: localStorage.getItem('currentUser')
                            };
                        });
                        
                        console.log('🔐 認證數據:', authData);
                        
                        // 如果還在登入頁面，嘗試手動跳轉
                        if (finalUrl.includes('login')) {
                            console.log('⚠️ 仍在登入頁面，嘗試手動跳轉到員工頁面...');
                            
                            await page.goto(`${this.baseUrl}/public/profile-enhanced.html`);
                            await new Promise(resolve => setTimeout(resolve, 3000));
                            
                            const profileUrl = page.url();
                            const profileTitle = await page.title();
                            
                            console.log(`📍 Profile頁面URL: ${profileUrl}`);
                            console.log(`📄 Profile頁面標題: ${profileTitle}`);
                        }
                        
                    } catch (error) {
                        console.log('❌ 等待登入回應失敗:', error.message);
                    }
                } else {
                    console.log('❌ 未找到登入按鈕');
                }
            } else {
                console.log('❌ 未找到登入表單輸入框');
            }
            
        } catch (error) {
            console.error('❌ 員工登入調試失敗:', error.message);
        } finally {
            await page.close();
        }
    }
}

// 執行調試
const debug = new LoginFlowDebug();
debug.debugLoginFlow().catch(console.error);