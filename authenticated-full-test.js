/**
 * 🔐 完整認證流程測試系統
 * 先登入後測試所有管理功能
 */

const puppeteer = require('puppeteer');

class AuthenticatedFullTest {
    constructor() {
        this.baseUrl = 'https://employee-management-system-intermediate.onrender.com';
    }

    async runAuthenticatedTest() {
        console.log('🔐 啟動完整認證流程測試...');
        
        const browser = await puppeteer.launch({ 
            headless: false,
            defaultViewport: null,
            args: ['--start-maximized'] 
        });

        try {
            // 先登入系統管理員
            const adminPage = await this.loginAsAdmin(browser);
            if (adminPage) {
                await this.testAdminFunctions(adminPage);
                await adminPage.close();
            }
            
            // 登入一般員工
            const employeePage = await this.loginAsEmployee(browser);
            if (employeePage) {
                await this.testEmployeeFunctions(employeePage);
                await employeePage.close();
            }
            
        } catch (error) {
            console.error('❌ 認證測試錯誤:', error.message);
        } finally {
            await browser.close();
            console.log('✅ 認證流程測試完成');
        }
    }

    async loginAsAdmin(browser) {
        console.log('👑 登入系統管理員...');
        
        const page = await browser.newPage();
        
        try {
            // 訪問登入頁面
            await page.goto(`${this.baseUrl}/public/login.html`);
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            console.log('🌐 已訪問登入頁面');
            
            // 填寫管理員登入資料
            const nameInput = await page.$('#login-name, input[name="name"]');
            const idInput = await page.$('#login-id, input[name="idNumber"]');
            
            if (nameInput && idInput) {
                await nameInput.type('系統管理員');
                await idInput.type('A123456789');
                
                console.log('📝 已填寫管理員登入資料');
                
                // 點擊登入按鈕
                const loginBtn = await page.$('#login-btn, button[type="submit"], .login-btn');
                if (loginBtn) {
                    await loginBtn.click();
                    console.log('🔘 已點擊登入按鈕');
                    
                    // 等待登入處理
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    
                    // 檢查是否成功登入
                    const currentUrl = page.url();
                    console.log(`📍 當前URL: ${currentUrl}`);
                    
                    if (currentUrl.includes('admin')) {
                        console.log('✅ 管理員登入成功');
                        return page;
                    } else if (currentUrl.includes('employee')) {
                        console.log('⚠️  被重定向到員工頁面，嘗試訪問admin頁面');
                        await page.goto(`${this.baseUrl}/public/admin-enhanced.html`);
                        await new Promise(resolve => setTimeout(resolve, 3000));
                        return page;
                    }
                }
            }
            
            console.log('❌ 管理員登入失敗');
            await page.close();
            return null;
            
        } catch (error) {
            console.error('❌ 管理員登入錯誤:', error.message);
            await page.close();
            return null;
        }
    }

    async testAdminFunctions(page) {
        console.log('🧪 測試管理員功能...');
        
        try {
            const title = await page.title();
            const contentLength = await page.evaluate(() => document.body.innerHTML.length);
            
            console.log(`📄 管理員頁面標題: ${title}`);
            console.log(`📏 內容長度: ${contentLength} 字符`);
            
            // 檢查是否有管理員專用功能
            const adminFeatures = await page.evaluate(() => {
                const results = {};
                
                // 檢查8大管理系統
                const systems = [
                    'employee-management',
                    'inventory-management',
                    'revenue-management',
                    'schedule-management',
                    'promotion-management',
                    'store-management',
                    'maintenance-management',
                    'system-settings'
                ];
                
                systems.forEach(system => {
                    results[system] = !!document.querySelector(`[data-section="${system}"]`);
                });
                
                // 檢查統計卡片
                results.statsCards = !!document.querySelector('.stat-card');
                results.employeeTable = !!document.querySelector('.employee-table');
                results.filterBar = !!document.querySelector('.filter-bar');
                results.pagination = !!document.querySelector('.pagination');
                
                return results;
            });
            
            console.log('📊 管理員功能檢查:');
            Object.entries(adminFeatures).forEach(([feature, found]) => {
                console.log(`  ${feature}: ${found ? '✅' : '❌'}`);
            });
            
            const systemCount = Object.keys(adminFeatures).filter(key => 
                key.includes('-management') || key.includes('-settings')
            ).filter(key => adminFeatures[key]).length;
            
            console.log(`🎯 管理系統數量: ${systemCount}/8`);
            
            // 測試員工管理功能
            if (adminFeatures['employee-management']) {
                console.log('👥 測試員工管理功能...');
                
                try {
                    await page.click('[data-section="employee-management"]');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    const employeeSection = await page.$('#employee-management');
                    if (employeeSection) {
                        console.log('✅ 員工管理功能可正常切換');
                    }
                } catch (error) {
                    console.log('❌ 員工管理功能測試失敗');
                }
            }
            
        } catch (error) {
            console.error('❌ 管理員功能測試錯誤:', error.message);
        }
    }

    async loginAsEmployee(browser) {
        console.log('👤 登入一般員工...');
        
        const page = await browser.newPage();
        
        try {
            // 清除可能的登入狀態
            await page.evaluateOnNewDocument(() => {
                localStorage.clear();
                sessionStorage.clear();
            });
            
            await page.goto(`${this.baseUrl}/public/login.html`);
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // 填寫員工登入資料
            const nameInput = await page.$('#login-name, input[name="name"]');
            const idInput = await page.$('#login-id, input[name="idNumber"]');
            
            if (nameInput && idInput) {
                // 清空輸入框的正確方法
                await nameInput.click({ clickCount: 3 });
                await nameInput.press('Backspace');
                await idInput.click({ clickCount: 3 });
                await idInput.press('Backspace');
                
                await nameInput.type('一般員工');
                await idInput.type('C123456789');
                
                console.log('📝 已填寫員工登入資料');
                
                const loginBtn = await page.$('#login-btn, button[type="submit"], .login-btn');
                if (loginBtn) {
                    await loginBtn.click();
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    
                    console.log('✅ 員工登入完成');
                    return page;
                }
            }
            
            console.log('❌ 員工登入失敗');
            await page.close();
            return null;
            
        } catch (error) {
            console.error('❌ 員工登入錯誤:', error.message);
            await page.close();
            return null;
        }
    }

    async testEmployeeFunctions(page) {
        console.log('🧪 測試員工功能...');
        
        try {
            // 檢查當前URL並導航到正確的員工頁面
            const currentUrl = page.url();
            console.log(`📍 員工登入後URL: ${currentUrl}`);
            
            if (currentUrl.includes('employee')) {
                console.log('✅ 已自動跳轉到員工頁面');
            } else {
                console.log('🔄 手動導航到員工增強頁面...');
                await page.goto(`${this.baseUrl}/public/profile-enhanced.html`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            const title = await page.title();
            const contentLength = await page.evaluate(() => document.body.innerHTML.length);
            
            console.log(`📄 員工頁面標題: ${title}`);
            console.log(`📏 內容長度: ${contentLength} 字符`);
            
            // 檢查員工專用功能
            const employeeFeatures = await page.evaluate(() => {
                return {
                    clockInBtn: !!document.querySelector('.clock-in-btn'),
                    clockOutBtn: !!document.querySelector('.clock-out-btn'),
                    attendanceRecords: !!document.querySelector('#attendance-records'),
                    personalInfo: !!document.querySelector('.personal-info'),
                    editProfile: !!document.querySelector('[onclick*="editProfile"]'),
                    attendanceStats: !!document.querySelector('.attendance-stats'),
                    gpsFeature: document.body.innerHTML.includes('GPS') || document.body.innerHTML.includes('定位')
                };
            });
            
            console.log('📋 員工功能檢查:');
            Object.entries(employeeFeatures).forEach(([feature, found]) => {
                console.log(`  ${feature}: ${found ? '✅' : '❌'}`);
            });
            
        } catch (error) {
            console.error('❌ 員工功能測試錯誤:', error.message);
        }
    }
}

// 執行認證流程測試
const authTest = new AuthenticatedFullTest();
authTest.runAuthenticatedTest().catch(console.error);