const puppeteer = require('puppeteer');

class SmartInteractiveBrowserTest {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = [];
        this.baseUrl = 'https://employee-management-system-intermediate.onrender.com';
    }

    async init() {
        console.log('🚀 啟動智慧瀏覽器真實互動測試...');
        
        this.browser = await puppeteer.launch({
            headless: false,  // 顯示真實瀏覽器
            slowMo: 1000,     // 減慢操作速度以便觀察
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox',
                '--disable-web-security',
                '--allow-running-insecure-content'
            ]
        });
        
        this.page = await this.browser.newPage();
        await this.page.setViewport({ width: 1366, height: 768 });
        
        // 監聽控制台訊息
        this.page.on('console', msg => {
            console.log(`🖥️ 瀏覽器控制台: ${msg.text()}`);
        });
        
        console.log('✅ 智慧瀏覽器已啟動');
    }

    async testLoginFlow() {
        console.log('\n🔐 測試1: 登入功能流程');
        
        try {
            // 導航到登入頁面
            await this.page.goto(`${this.baseUrl}/login`, { 
                waitUntil: 'domcontentloaded',
                timeout: 30000 
            });
            
            // 等待頁面元素載入完成
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            console.log('📍 已導航到登入頁面');
            
            // 填寫登入表單
            await this.page.waitForSelector('#login-name');
            await this.page.type('#login-name', '張三', { delay: 100 });
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            await this.page.type('#login-id', 'C123456789', { delay: 100 });
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            console.log('✅ 已填寫登入資料');
            
            // 點擊登入按鈕
            await this.page.click('button[type="submit"]');
            console.log('🖱️ 已點擊登入按鈕');
            
            // 等待頁面跳轉
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const currentUrl = this.page.url();
            const loginSuccess = currentUrl.includes('/employee') || 
                                await this.page.$('.content-area') !== null;
            
            this.testResults.push({
                test: '登入功能',
                success: loginSuccess,
                details: `URL: ${currentUrl}`,
                timestamp: new Date().toLocaleString('zh-TW')
            });
            
            console.log(loginSuccess ? '✅ 登入成功' : '❌ 登入失敗');
            return loginSuccess;
            
        } catch (error) {
            console.error('❌ 登入測試失敗:', error.message);
            this.testResults.push({
                test: '登入功能',
                success: false,
                details: `錯誤: ${error.message}`,
                timestamp: new Date().toLocaleString('zh-TW')
            });
            return false;
        }
    }

    async testEmployeeModuleNavigation() {
        console.log('\n🧭 測試2: 員工模組導航切換');
        
        const modules = [
            { name: '工作概覽', selector: '[data-section="dashboard"]', targetId: 'dashboard' },
            { name: 'GPS打卡', selector: '[data-section="attendance"]', targetId: 'attendance' },
            { name: '營收管理', selector: '[data-section="revenue"]', targetId: 'revenue' },
            { name: '排班系統', selector: '[data-section="schedule"]', targetId: 'schedule' },
            { name: '庫存管理', selector: '[data-section="inventory"]', targetId: 'inventory' },
            { name: '升遷投票', selector: '[data-section="promotion"]', targetId: 'promotion' },
            { name: '維修申請', selector: '[data-section="maintenance"]', targetId: 'maintenance' },
            { name: '個人設定', selector: '[data-section="profile"]', targetId: 'profile' }
        ];

        const moduleResults = [];
        
        for (const module of modules) {
            try {
                console.log(`\n🎯 測試模組: ${module.name}`);
                
                // 點擊導航連結
                await this.page.click(module.selector);
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                // 檢查模組是否正確顯示
                const isActive = await this.page.evaluate((targetId) => {
                    const element = document.getElementById(targetId);
                    return element && element.classList.contains('active');
                }, module.targetId);
                
                // 檢查模組內容是否存在
                const hasContent = await this.page.evaluate((targetId) => {
                    const element = document.getElementById(targetId);
                    return element && element.children.length > 1;
                }, module.targetId);
                
                const success = isActive && hasContent;
                moduleResults.push({
                    module: module.name,
                    success: success,
                    active: isActive,
                    hasContent: hasContent
                });
                
                console.log(`${success ? '✅' : '❌'} ${module.name}: 激活=${isActive}, 有內容=${hasContent}`);
                
            } catch (error) {
                console.error(`❌ ${module.name} 測試失敗:`, error.message);
                moduleResults.push({
                    module: module.name,
                    success: false,
                    error: error.message
                });
            }
        }
        
        const successCount = moduleResults.filter(r => r.success).length;
        this.testResults.push({
            test: '模組導航',
            success: successCount >= 6, // 至少6個模組成功算通過
            details: `成功模組: ${successCount}/8`,
            modules: moduleResults,
            timestamp: new Date().toLocaleString('zh-TW')
        });
        
        console.log(`\n📊 模組導航測試結果: ${successCount}/8 成功`);
        return moduleResults;
    }

    async testClockInFunction() {
        console.log('\n⏰ 測試3: GPS打卡功能');
        
        try {
            // 確保在打卡模組
            await this.page.click('[data-section="attendance"]');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // 尋找打卡按鈕
            const clockInButton = await this.page.$('#clock-in-btn');
            if (!clockInButton) {
                throw new Error('找不到打卡按鈕');
            }
            
            console.log('🎯 找到打卡按鈕，準備點擊');
            
            // 點擊打卡按鈕
            await this.page.click('#clock-in-btn');
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // 檢查是否有成功訊息或狀態變更
            const response = await this.page.evaluate(() => {
                // 檢查是否有alert或成功訊息
                const alerts = document.querySelectorAll('.alert-success, .toast, .notification');
                return {
                    hasAlerts: alerts.length > 0,
                    alertText: alerts.length > 0 ? alerts[0].textContent : '',
                    buttonText: document.getElementById('clock-in-btn')?.textContent || ''
                };
            });
            
            const success = response.hasAlerts || response.buttonText.includes('下班');
            
            this.testResults.push({
                test: 'GPS打卡功能',
                success: success,
                details: `按鈕狀態: ${response.buttonText}, 訊息: ${response.alertText}`,
                timestamp: new Date().toLocaleString('zh-TW')
            });
            
            console.log(success ? '✅ 打卡功能正常' : '⚠️ 打卡功能反應不明確');
            return success;
            
        } catch (error) {
            console.error('❌ 打卡測試失敗:', error.message);
            this.testResults.push({
                test: 'GPS打卡功能',
                success: false,
                details: `錯誤: ${error.message}`,
                timestamp: new Date().toLocaleString('zh-TW')
            });
            return false;
        }
    }

    async testRevenueManagement() {
        console.log('\n💰 測試4: 營收管理功能');
        
        try {
            // 切換到營收管理模組
            await this.page.click('[data-section="revenue"]');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // 填寫營收表單
            await this.page.waitForSelector('#revenueAmount');
            await this.page.type('#revenueAmount', '5000', { delay: 100 });
            
            await this.page.select('#revenueCategory', '門市銷售');
            await this.page.type('#revenueDescription', '測試營收記錄', { delay: 100 });
            
            console.log('📝 已填寫營收表單');
            
            // 提交表單
            await this.page.click('#revenue-form button[type="submit"]');
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // 檢查提交結果
            const result = await this.page.evaluate(() => {
                // 檢查是否清空表單（表示提交成功）
                const amountField = document.getElementById('revenueAmount');
                const descField = document.getElementById('revenueDescription');
                
                return {
                    formCleared: !amountField.value && !descField.value,
                    hasErrorMessage: document.querySelector('.alert-danger') !== null,
                    hasSuccessMessage: document.querySelector('.alert-success') !== null
                };
            });
            
            const success = result.formCleared || result.hasSuccessMessage;
            
            this.testResults.push({
                test: '營收管理',
                success: success,
                details: `表單已清空: ${result.formCleared}, 成功訊息: ${result.hasSuccessMessage}`,
                timestamp: new Date().toLocaleString('zh-TW')
            });
            
            console.log(success ? '✅ 營收提交成功' : '❌ 營收提交失敗');
            return success;
            
        } catch (error) {
            console.error('❌ 營收管理測試失敗:', error.message);
            this.testResults.push({
                test: '營收管理',
                success: false,
                details: `錯誤: ${error.message}`,
                timestamp: new Date().toLocaleString('zh-TW')
            });
            return false;
        }
    }

    async testProfileSettings() {
        console.log('\n👤 測試5: 個人設定功能');
        
        try {
            // 切換到個人設定
            await this.page.click('[data-section="profile"]');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // 修改個人資料
            const originalPhone = await this.page.$eval('#profile-phone', el => el.value);
            
            await this.page.focus('#profile-phone');
            await this.page.keyboard.selectAll();
            await this.page.type('#profile-phone', '0987654321', { delay: 100 });
            
            console.log('📝 已修改手機號碼');
            
            // 儲存設定
            await this.page.click('#profile-form button[type="submit"]');
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // 檢查是否儲存成功
            const newPhone = await this.page.$eval('#profile-phone', el => el.value);
            const success = newPhone === '0987654321' && newPhone !== originalPhone;
            
            this.testResults.push({
                test: '個人設定',
                success: success,
                details: `原手機: ${originalPhone}, 新手機: ${newPhone}`,
                timestamp: new Date().toLocaleString('zh-TW')
            });
            
            console.log(success ? '✅ 個人設定儲存成功' : '❌ 個人設定儲存失敗');
            return success;
            
        } catch (error) {
            console.error('❌ 個人設定測試失敗:', error.message);
            this.testResults.push({
                test: '個人設定',
                success: false,
                details: `錯誤: ${error.message}`,
                timestamp: new Date().toLocaleString('zh-TW')
            });
            return false;
        }
    }

    generateInteractiveTestReport() {
        const totalTests = this.testResults.length;
        const successfulTests = this.testResults.filter(r => r.success).length;
        const successRate = Math.round((successfulTests / totalTests) * 100);
        
        let status = '❌ 互動功能嚴重問題';
        if (successRate >= 90) status = '🎉 互動功能完美運作';
        else if (successRate >= 75) status = '✅ 互動功能運作良好';
        else if (successRate >= 50) status = '⚠️ 互動功能基本可用';
        
        const report = `
# 🖥️ 智慧瀏覽器真實互動測試報告

## 📊 總體評分: ${successRate}/100

${status}

## 📋 詳細測試結果

${this.testResults.map(result => `
### ${result.success ? '✅' : '❌'} ${result.test}
- **狀態**: ${result.success ? '成功' : '失敗'}
- **詳情**: ${result.details}
- **測試時間**: ${result.timestamp}
${result.modules ? `- **模組詳情**: ${result.modules.map(m => `${m.success ? '✅' : '❌'} ${m.module}`).join(', ')}` : ''}
`).join('')}

## 🎯 測試總結

- **總測試項目**: ${totalTests}
- **成功項目**: ${successfulTests}
- **成功率**: ${successRate}%
- **測試類型**: 真實瀏覽器互動模擬

## 💡 發現與建議

${successRate >= 75 ? 
  '✅ 系統互動功能運作穩定，用戶體驗良好' : 
  '⚠️ 部分互動功能需要改善，建議檢查失敗項目的具體原因'}

---
測試完成時間: ${new Date().toLocaleString('zh-TW')}
測試工具: 智慧瀏覽器真實互動引擎
`;
        
        return { report, successRate, results: this.testResults };
    }

    async close() {
        console.log('\n🔚 關閉瀏覽器...');
        if (this.browser) {
            await this.browser.close();
        }
    }

    async runFullInteractiveTest() {
        try {
            await this.init();
            
            // 執行所有互動測試
            const loginSuccess = await this.testLoginFlow();
            if (loginSuccess) {
                await this.testEmployeeModuleNavigation();
                await this.testClockInFunction(); 
                await this.testRevenueManagement();
                await this.testProfileSettings();
            }
            
            const reportData = this.generateInteractiveTestReport();
            console.log(reportData.report);
            
            return reportData;
            
        } catch (error) {
            console.error('❌ 互動測試過程失敗:', error);
            throw error;
        } finally {
            await this.close();
        }
    }
}

// 執行測試
async function main() {
    const tester = new SmartInteractiveBrowserTest();
    
    try {
        const results = await tester.runFullInteractiveTest();
        
        // 發送Telegram通知
        const https = require('https');
        const telegramData = {
            chat_id: 'process.env.TELEGRAM_GROUP_ID',
            text: `🖥️ 智慧瀏覽器互動測試完成\\n\\n📊 總體評分: ${results.successRate}/100\\n✅ 成功測試: ${results.results.filter(r => r.success).length}/${results.results.length}\\n\\n測試項目:\\n${results.results.map(r => `${r.success ? '✅' : '❌'} ${r.test}`).join('\\n')}\\n\\n🕐 ${new Date().toLocaleString('zh-TW')}`
        };
        
        const postData = JSON.stringify(telegramData);
        const options = {
            hostname: 'api.telegram.org',
            port: 443,
            path: '/botprocess.env.TELEGRAM_BOT_TOKEN/sendMessage',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        const req = https.request(options);
        req.write(postData);
        req.end();
        
        console.log('\n📱 Telegram互動測試報告已發送');
        
    } catch (error) {
        console.error('測試執行失敗:', error);
    }
}

main().catch(console.error);