/**
 * 🎯 正確路徑全功能測試系統
 * 使用正確的/public/路徑測試所有頁面
 */

const puppeteer = require('puppeteer');

class CorrectPathTest {
    constructor() {
        this.baseUrl = 'https://employee-management-system-intermediate.onrender.com/public';
    }

    async runCorrectTest() {
        console.log('🎯 啟動正確路徑全功能測試...');
        
        const browser = await puppeteer.launch({ 
            headless: false,
            defaultViewport: null,
            args: ['--start-maximized'] 
        });

        try {
            await this.testAdminEnhanced(browser);
            await this.testProfileEnhanced(browser);
            await this.testRoleBasedAccess(browser);
            
        } catch (error) {
            console.error('❌ 測試錯誤:', error.message);
        } finally {
            await browser.close();
            console.log('✅ 正確路徑測試完成');
        }
    }

    async testAdminEnhanced(browser) {
        console.log('👑 測試admin-enhanced.html - 8大管理系統...');
        
        const page = await browser.newPage();
        
        try {
            await page.goto(`${this.baseUrl}/admin-enhanced.html`);
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            const title = await page.title();
            const contentLength = await page.evaluate(() => document.body.innerHTML.length);
            
            console.log(`📄 頁面標題: ${title}`);
            console.log(`📏 內容長度: ${contentLength} 字符`);
            
            // 檢查8大系統導航
            const systemNavs = [
                '[data-section="employee-management"]',
                '[data-section="inventory-management"]',
                '[data-section="revenue-management"]', 
                '[data-section="schedule-management"]',
                '[data-section="promotion-management"]',
                '[data-section="store-management"]',
                '[data-section="maintenance-management"]',
                '[data-section="system-settings"]'
            ];
            
            let foundSystems = 0;
            for (const selector of systemNavs) {
                try {
                    await page.waitForSelector(selector, { timeout: 2000 });
                    console.log(`✅ 找到系統: ${selector}`);
                    foundSystems++;
                } catch (error) {
                    console.log(`❌ 未找到系統: ${selector}`);
                }
            }
            
            console.log(`📊 管理系統數量: ${foundSystems}/8`);
            
            // 測試員工管理功能
            if (foundSystems >= 1) {
                console.log('🧪 測試員工管理功能...');
                
                try {
                    await page.click('[data-section="employee-management"]');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    const employeeSection = await page.$('#employee-management');
                    if (employeeSection) {
                        console.log('✅ 員工管理頁面已激活');
                        
                        // 檢查篩選功能
                        const statusFilter = await page.$('#status-filter');
                        const storeFilter = await page.$('#store-filter');
                        const positionFilter = await page.$('#position-filter');
                        
                        console.log(`📋 篩選功能: 狀態${statusFilter ? '✅' : '❌'} 分店${storeFilter ? '✅' : '❌'} 職位${positionFilter ? '✅' : '❌'}`);
                        
                        // 檢查按鈕功能
                        const applyBtn = await page.$('button[onclick="applyFilters()"]');
                        const resetBtn = await page.$('button[onclick="resetFilters()"]');
                        
                        console.log(`🔘 按鈕功能: 篩選${applyBtn ? '✅' : '❌'} 重置${resetBtn ? '✅' : '❌'}`);
                    }
                } catch (error) {
                    console.log(`❌ 員工管理測試失敗: ${error.message}`);
                }
            }
            
        } catch (error) {
            console.error(`❌ admin-enhanced測試失敗: ${error.message}`);
        } finally {
            await page.close();
        }
    }

    async testProfileEnhanced(browser) {
        console.log('👤 測試profile-enhanced.html - 現代化員工界面...');
        
        const page = await browser.newPage();
        
        try {
            await page.goto(`${this.baseUrl}/profile-enhanced.html`);
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            const title = await page.title();
            const contentLength = await page.evaluate(() => document.body.innerHTML.length);
            
            console.log(`📄 頁面標題: ${title}`);
            console.log(`📏 內容長度: ${contentLength} 字符`);
            
            // 檢查核心功能元素
            const features = await page.evaluate(() => {
                return {
                    clockInBtn: !!document.querySelector('.clock-in-btn'),
                    clockOutBtn: !!document.querySelector('.clock-out-btn'),
                    attendanceRecords: !!document.querySelector('#attendance-records'),
                    editProfileBtn: !!document.querySelector('[onclick*="editProfile"]'),
                    personalInfo: !!document.querySelector('.personal-info'),
                    modal: !!document.querySelector('#universal-modal'),
                    gpsStatus: !!document.querySelector('#gps-status'),
                    attendanceStats: !!document.querySelector('.attendance-stats')
                };
            });
            
            console.log('📋 功能檢查結果:');
            Object.entries(features).forEach(([key, found]) => {
                console.log(`  ${key}: ${found ? '✅' : '❌'}`);
            });
            
            const completeness = Object.values(features).filter(Boolean).length;
            console.log(`📊 功能完整度: ${completeness}/${Object.keys(features).length}`);
            
        } catch (error) {
            console.error(`❌ profile-enhanced測試失敗: ${error.message}`);
        } finally {
            await page.close();
        }
    }

    async testRoleBasedAccess(browser) {
        console.log('🔐 測試角色權限訪問...');
        
        const testUrls = [
            { name: 'admin.html', path: '/admin.html' },
            { name: 'employee.html', path: '/employee.html' },
            { name: 'login.html', path: '/login.html' }
        ];
        
        for (const urlInfo of testUrls) {
            const page = await browser.newPage();
            
            try {
                console.log(`🌐 測試 ${urlInfo.name}...`);
                await page.goto(`${this.baseUrl}${urlInfo.path}`);
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                const title = await page.title();
                const contentLength = await page.evaluate(() => document.body.innerHTML.length);
                
                console.log(`  📄 ${urlInfo.name}: ${title} (${contentLength}字符)`);
                
                // 檢查是否有認證檢查
                const hasAuth = await page.evaluate(() => {
                    return document.body.innerHTML.includes('checkAuth') || 
                           document.body.innerHTML.includes('localStorage.getItem(\'token\')') ||
                           document.body.innerHTML.includes('authentication');
                });
                
                console.log(`  🔒 認證機制: ${hasAuth ? '✅' : '❌'}`);
                
            } catch (error) {
                console.log(`  ❌ ${urlInfo.name} 測試失敗: ${error.message}`);
            } finally {
                await page.close();
            }
        }
    }
}

// 執行正確路徑測試
const correctTest = new CorrectPathTest();
correctTest.runCorrectTest().catch(console.error);