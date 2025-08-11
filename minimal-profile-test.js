/**
 * 🔬 最小化profile測試 - 只檢查是否被重定向
 */

const puppeteer = require('puppeteer');

class MinimalProfileTest {
    constructor() {
        this.baseUrl = 'https://employee-management-system-intermediate.onrender.com';
    }

    async runMinimalTest() {
        console.log('🔬 啟動最小化profile測試...');
        
        const browser = await puppeteer.launch({ 
            headless: false,
            defaultViewport: null,
            args: ['--start-maximized'] 
        });

        try {
            const page = await browser.newPage();
            
            // 禁用所有API請求來避免認證問題
            await page.setRequestInterception(true);
            page.on('request', (request) => {
                if (request.url().includes('/api/')) {
                    console.log(`🚫 攔截API請求: ${request.url()}`);
                    // 對於API請求，返回模擬回應
                    request.respond({
                        status: 200,
                        contentType: 'application/json',
                        body: JSON.stringify({ success: true, data: { records: [] } })
                    });
                } else {
                    request.continue();
                }
            });

            // 監控頁面導航
            page.on('framenavigated', frame => {
                if (frame === page.mainFrame()) {
                    console.log(`🔄 導航至: ${frame.url()}`);
                }
            });

            // 預先設置localStorage
            await page.evaluateOnNewDocument(() => {
                localStorage.setItem('token', 'test-token-bypass-api');
                localStorage.setItem('employee', JSON.stringify({
                    id: 1,
                    employeeId: 'EMP001',
                    name: '張三',
                    position: '員工'
                }));
            });
            
            console.log('🌐 訪問profile-enhanced.html (攔截所有API)...');
            await page.goto(`${this.baseUrl}/public/profile-enhanced.html`);
            
            // 等待充分載入
            await new Promise(resolve => setTimeout(resolve, 10000));
            
            const finalUrl = page.url();
            const title = await page.title();
            
            console.log(`📍 最終URL: ${finalUrl}`);
            console.log(`📄 頁面標題: ${title}`);
            
            if (finalUrl.includes('login')) {
                console.log('❌ 即使攔截API請求，頁面仍被重定向到登入');
                
                // 檢查頁面源碼中是否有硬編碼的重定向
                const pageSource = await page.content();
                console.log(`📏 頁面源碼長度: ${pageSource.length}`);
                
                if (pageSource.includes('window.location.href')) {
                    console.log('⚠️  頁面源碼包含重定向邏輯');
                }
                
            } else {
                console.log('✅ 頁面成功載入，沒有被重定向！');
                
                // 檢查頁面基本功能
                const hasContent = await page.evaluate(() => {
                    return {
                        bodyLength: document.body.innerHTML.length,
                        hasButtons: document.querySelectorAll('button').length,
                        hasModals: document.querySelectorAll('#universal-modal').length
                    };
                });
                
                console.log('📊 頁面內容檢查:');
                console.log(`  內容長度: ${hasContent.bodyLength}`);
                console.log(`  按鈕數量: ${hasContent.hasButtons}`);
                console.log(`  模態視窗: ${hasContent.hasModals}`);
            }
            
            await page.close();
            
        } catch (error) {
            console.error('❌ 測試錯誤:', error.message);
        } finally {
            await browser.close();
            console.log('✅ 最小化測試完成');
        }
    }
}

// 執行測試
const test = new MinimalProfileTest();
test.runMinimalTest().catch(console.error);