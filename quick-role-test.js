/**
 * 🚀 快速角色測試系統 - 直接測試核心功能
 */

const puppeteer = require('puppeteer');

class QuickRoleTest {
    constructor() {
        this.baseUrl = 'https://employee-management-system-intermediate.onrender.com';
    }

    async runQuickTest() {
        console.log('🚀 啟動快速角色測試系統...');
        
        const browser = await puppeteer.launch({ 
            headless: false,
            defaultViewport: null,
            args: ['--start-maximized'] 
        });

        try {
            // 測試系統管理員角色
            await this.testAdminRole(browser);
            
            // 測試一般員工角色
            await this.testEmployeeRole(browser);
            
            console.log('✅ 快速角色測試完成');
            
        } catch (error) {
            console.error('❌ 測試過程發生錯誤:', error.message);
        } finally {
            await browser.close();
        }
    }

    async testAdminRole(browser) {
        console.log('👤 測試系統管理員角色...');
        
        const page = await browser.newPage();
        
        try {
            // 訪問管理員增強版頁面
            await page.goto(`${this.baseUrl}/admin-enhanced.html`);
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            console.log('📄 成功載入 admin-enhanced.html');
            
            // 檢查8大系統導航連結是否存在
            const systems = [
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
            for (const systemSelector of systems) {
                try {
                    await page.waitForSelector(systemSelector, { timeout: 2000 });
                    console.log(`✅ 找到系統導航: ${systemSelector}`);
                    foundSystems++;
                } catch (error) {
                    console.log(`❌ 未找到系統導航: ${systemSelector}`);
                }
            }
            
            console.log(`📊 系統管理員可見系統數: ${foundSystems}/8`);
            
            // 測試員工管理功能
            if (foundSystems >= 1) {
                console.log('🔧 測試員工管理功能...');
                await page.click('[data-section="employee-management"]');
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // 檢查員工管理頁面是否顯示
                const employeeSection = await page.$('#employee-management');
                if (employeeSection) {
                    console.log('✅ 員工管理頁面已顯示');
                    
                    // 測試新增員工按鈕
                    const addBtn = await page.$('.add-btn, [onclick*="addEmployee"], .btn-primary');
                    if (addBtn) {
                        console.log('✅ 找到新增員工按鈕');
                        await addBtn.click();
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        
                        // 檢查是否出現模態視窗
                        const modal = await page.$('#universal-modal');
                        if (modal) {
                            console.log('✅ 員工新增模態視窗已開啟');
                            
                            // 關閉模態視窗
                            const closeBtn = await page.$('.modal-close');
                            if (closeBtn) {
                                await closeBtn.click();
                                console.log('✅ 模態視窗已關閉');
                            }
                        }
                    }
                }
            }
            
        } catch (error) {
            console.error('❌ 系統管理員測試錯誤:', error.message);
        } finally {
            await page.close();
        }
    }

    async testEmployeeRole(browser) {
        console.log('👤 測試一般員工角色...');
        
        const page = await browser.newPage();
        
        try {
            // 訪問個人資料增強版頁面
            await page.goto(`${this.baseUrl}/profile-enhanced.html`);
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            console.log('📄 成功載入 profile-enhanced.html');
            
            // 檢查打卡功能
            const clockInBtn = await page.$('.clock-in-btn, [onclick*="clockIn"]');
            if (clockInBtn) {
                console.log('✅ 找到上班打卡按鈕');
                
                // 模擬打卡 (不實際執行以避免重複記錄)
                console.log('🕒 模擬打卡功能 (測試模式)');
            }
            
            // 檢查考勤記錄
            const attendanceSection = await page.$('#attendance-records, .attendance-records');
            if (attendanceSection) {
                console.log('✅ 找到考勤記錄區域');
            }
            
            // 檢查個人資料編輯
            const editBtn = await page.$('.edit-profile-btn, [onclick*="editProfile"]');
            if (editBtn) {
                console.log('✅ 找到個人資料編輯按鈕');
                await editBtn.click();
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                const modal = await page.$('#universal-modal, .modal');
                if (modal) {
                    console.log('✅ 個人資料編輯模態視窗已開啟');
                    
                    const closeBtn = await page.$('.modal-close, [onclick*="closeModal"]');
                    if (closeBtn) {
                        await closeBtn.click();
                        console.log('✅ 模態視窗已關閉');
                    }
                }
            }
            
        } catch (error) {
            console.error('❌ 一般員工測試錯誤:', error.message);
        } finally {
            await page.close();
        }
    }
}

// 執行快速測試
const quickTest = new QuickRoleTest();
quickTest.runQuickTest().catch(console.error);