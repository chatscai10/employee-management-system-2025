const puppeteer = require('puppeteer');

async function performRealBrowserTest() {
    const targetUrl = 'https://employee-management-system-intermediate.onrender.com';
    console.log('🔬 啟動真實瀏覽器測試引擎');
    console.log('🎯 目標URL:', targetUrl);
    console.log('⏳ 等待Render部署完成...');
    
    let browser = null;
    let page = null;
    
    try {
        // 等待90秒讓Render完成部署
        await new Promise(resolve => setTimeout(resolve, 90000));
        console.log('✅ 等待完成，開始瀏覽器測試');
        
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        page = await browser.newPage();
        
        const testResults = {
            basicConnection: null,
            pageNavigation: {},
            apiEndpoints: {},
            javascriptFunctions: {},
            performance: {},
            errors: []
        };
        
        // 監聽錯誤
        page.on('console', msg => {
            if (msg.type() === 'error') {
                testResults.errors.push(msg.text());
            }
        });
        
        // 1. 基本連接測試
        console.log('\n1️⃣ 執行基本連接測試...');
        const startTime = Date.now();
        
        try {
            const response = await page.goto(targetUrl, {
                waitUntil: 'networkidle2',
                timeout: 60000
            });
            
            const loadTime = Date.now() - startTime;
            const statusCode = response.status();
            const title = await page.title();
            
            console.log('📊 HTTP狀態碼:', statusCode);
            console.log('⏱️ 頁面載入時間:', loadTime + 'ms');
            console.log('📄 頁面標題:', title);
            
            testResults.basicConnection = {
                success: statusCode === 200,
                statusCode,
                loadTime,
                title
            };
            
            // 檢查頁面內容
            const pageContent = await page.content();
            const hasValidContent = pageContent.length > 1000;
            console.log('📄 頁面內容長度:', pageContent.length);
            console.log('✅ 有效內容:', hasValidContent ? '是' : '否');
            
        } catch (error) {
            console.log('❌ 基本連接測試失敗:', error.message);
            testResults.basicConnection = { success: false, error: error.message };
        }
        
        // 2. API端點測試
        console.log('\n2️⃣ 執行API端點測試...');
        const endpoints = [
            '/api/test',
            '/api/auth/test', 
            '/api/attendance/test',
            '/api/revenue/test'
        ];
        
        for (const endpoint of endpoints) {
            try {
                console.log('🔍 測試API端點:', endpoint);
                const apiResponse = await page.goto(targetUrl + endpoint, { timeout: 20000 });
                const apiStatus = apiResponse.status();
                
                console.log('📊', endpoint, '- HTTP狀態碼:', apiStatus);
                testResults.apiEndpoints[endpoint] = {
                    success: apiStatus === 200,
                    statusCode: apiStatus
                };
                
            } catch (error) {
                console.log('❌', endpoint, '測試失敗:', error.message);
                testResults.apiEndpoints[endpoint] = { success: false, error: error.message };
            }
        }
        
        // 3. 頁面導航測試
        console.log('\n3️⃣ 執行頁面導航測試...');
        const pages = ['/attendance', '/revenue', '/profile', '/admin'];
        
        for (const testPage of pages) {
            try {
                console.log('🔍 測試頁面導航:', testPage);
                const navResponse = await page.goto(targetUrl + testPage, { timeout: 30000 });
                const navStatus = navResponse.status();
                
                console.log('📊', testPage, '- HTTP狀態碼:', navStatus);
                testResults.pageNavigation[testPage] = {
                    success: navStatus === 200,
                    statusCode: navStatus
                };
                
            } catch (error) {
                console.log('❌', testPage, '導航測試失敗:', error.message);
                testResults.pageNavigation[testPage] = { success: false, error: error.message };
            }
        }
        
        // 回到主頁進行JavaScript功能測試
        await page.goto(targetUrl);
        await page.waitForTimeout(3000);
        
        // 4. JavaScript功能測試
        console.log('\n4️⃣ 執行JavaScript功能測試...');
        
        try {
            // 查找所有按鈕
            const buttons = await page.$$('button');
            console.log('🔘 找到', buttons.length, '個按鈕');
            
            if (buttons.length > 0) {
                // 點擊第一個按鈕測試
                await buttons[0].click();
                await page.waitForTimeout(2000);
                console.log('✅ 按鈕點擊測試成功');
                testResults.javascriptFunctions.buttonClick = { success: true };
            }
            
            // 查找輸入欄位
            const inputs = await page.$$('input');
            console.log('📝 找到', inputs.length, '個輸入欄位');
            testResults.javascriptFunctions.formElements = { 
                buttons: buttons.length, 
                inputs: inputs.length 
            };
            
        } catch (error) {
            console.log('❌ JavaScript功能測試失敗:', error.message);
            testResults.javascriptFunctions.error = error.message;
        }
        
        // 5. 性能分析
        console.log('\n5️⃣ 執行性能分析...');
        const metrics = await page.metrics();
        testResults.performance = {
            jsHeapUsedSize: Math.round(metrics.JSHeapUsedSize / 1048576 * 100) / 100,
            jsHeapTotalSize: Math.round(metrics.JSHeapTotalSize / 1048576 * 100) / 100,
            scriptDuration: metrics.ScriptDuration
        };
        
        console.log('💾 JS堆記憶體使用:', testResults.performance.jsHeapUsedSize + 'MB');
        console.log('📊 腳本執行時間:', testResults.performance.scriptDuration + 'ms');
        
        // 生成測試總結
        console.log('\n🏆 智慧瀏覽器驗證測試完成');
        console.log('='.repeat(50));
        
        const totalTests = Object.keys(testResults.basicConnection || {}).length +
                          Object.keys(testResults.apiEndpoints).length +
                          Object.keys(testResults.pageNavigation).length +
                          Object.keys(testResults.javascriptFunctions).length;
        
        const successfulTests = (testResults.basicConnection?.success ? 1 : 0) +
                               Object.values(testResults.apiEndpoints).filter(r => r.success).length +
                               Object.values(testResults.pageNavigation).filter(r => r.success).length +
                               (testResults.javascriptFunctions.buttonClick?.success ? 1 : 0);
        
        const successRate = Math.round((successfulTests / (totalTests || 1)) * 100);
        
        console.log('📊 測試成功率:', successRate + '%');
        console.log('✅ 成功測試:', successfulTests);
        console.log('❌ 失敗測試:', (totalTests - successfulTests));
        console.log('🚨 錯誤數量:', testResults.errors.length);
        
        if (testResults.errors.length > 0) {
            console.log('\n⚠️ 檢測到的錯誤:');
            testResults.errors.slice(0, 3).forEach((error, i) => {
                console.log((i+1) + '. ' + error.substring(0, 100) + '...');
            });
        }
        
        return testResults;
        
    } catch (error) {
        console.error('💥 瀏覽器測試發生嚴重錯誤:', error.message);
        return { error: error.message };
        
    } finally {
        if (browser) {
            await browser.close();
            console.log('🧹 瀏覽器資源已清理');
        }
    }
}

performRealBrowserTest().catch(console.error);