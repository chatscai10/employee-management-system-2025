/**
 * 🎯 修正版真實系統操作測試
 * 使用正確的選擇器和充分的等待時間
 * 真實驗證每個步驟是否成功
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

class FixedRealOperationsTest {
    constructor() {
        this.browser = null;
        this.page = null;
        this.realOperations = [];
        this.systemNotifications = [];
    }

    async initialize() {
        console.log('🎯 啟動修正版真實系統操作測試...');
        
        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: { width: 1920, height: 1080 },
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        this.page = await this.browser.newPage();
        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        
        // 監控所有網路請求
        this.page.on('response', response => {
            const url = response.url();
            console.log(`📡 API調用: ${response.status()} ${url}`);
            
            if (url.includes('telegram') || url.includes('sendMessage')) {
                console.log('🔔 發現Telegram通知請求:', url);
                this.systemNotifications.push({
                    url: url,
                    status: response.status(),
                    timestamp: new Date().toISOString()
                });
            }
        });
        
        // 監控控制台消息
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('❌ 瀏覽器錯誤:', msg.text());
            } else if (msg.text().includes('登入') || msg.text().includes('成功') || msg.text().includes('通知')) {
                console.log('💬 瀏覽器消息:', msg.text());
            }
        });
        
        console.log('✅ 瀏覽器初始化完成');
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async realAdminLogin() {
        console.log('\\n🔐 執行管理員真實登入測試...');
        
        try {
            console.log('📍 前往登入頁面...');
            await this.page.goto('https://employee-management-system-intermediate.onrender.com/login', {
                waitUntil: 'networkidle2',
                timeout: 30000
            });
            
            await this.delay(3000);
            console.log('✅ 登入頁面載入完成');
            
            // 檢查頁面是否正確載入
            const title = await this.page.title();
            console.log(`📄 頁面標題: ${title}`);
            
            // 找到正確的輸入框 (使用login.html中的實際ID)
            console.log('🔍 尋找登入表單元素...');
            
            await this.page.waitForSelector('#login-name', { timeout: 10000 });
            await this.page.waitForSelector('#login-id', { timeout: 10000 });
            console.log('✅ 找到登入表單元素');
            
            // 清空並填寫管理員資料
            console.log('📝 填寫管理員登入資料...');
            
            await this.page.click('#login-name', { clickCount: 3 });
            await this.page.type('#login-name', '系統管理員');
            console.log('   ✅ 姓名: 系統管理員');
            
            await this.page.click('#login-id', { clickCount: 3 });
            await this.page.type('#login-id', 'A123456789');
            console.log('   ✅ 身份證號: A123456789');
            
            await this.delay(1000);
            
            // 點擊登入按鈕
            console.log('🖱️ 點擊登入按鈕...');
            const loginBtn = await this.page.$('#login-btn');
            if (!loginBtn) {
                console.log('❌ 找不到登入按鈕');
                return false;
            }
            
            await loginBtn.click();
            console.log('✅ 已點擊登入按鈕');
            
            // 等待登入處理
            console.log('⏳ 等待登入處理...');
            await this.delay(8000);
            
            // 檢查登入結果
            const currentUrl = this.page.url();
            console.log(`📍 登入後URL: ${currentUrl}`);
            
            if (currentUrl.includes('/admin')) {
                console.log('🎉 管理員登入成功！');
                
                this.realOperations.push({
                    type: 'LOGIN',
                    operation: '管理員登入',
                    timestamp: new Date().toISOString(),
                    success: true,
                    url: currentUrl
                });
                
                return true;
            } else if (currentUrl === this.page.url()) {
                console.log('⚠️ 頁面沒有跳轉，可能登入失敗');
                
                // 檢查是否有錯誤訊息
                const errorMsg = await this.page.$('.error-message, .alert-danger');
                if (errorMsg) {
                    const errorText = await this.page.evaluate(el => el.textContent, errorMsg);
                    console.log(`❌ 登入錯誤: ${errorText}`);
                }
                
                return false;
            } else {
                console.log(`⚠️ 跳轉到未預期頁面: ${currentUrl}`);
                return false;
            }
            
        } catch (error) {
            console.error('❌ 管理員登入失敗:', error.message);
            return false;
        }
    }

    async checkAdminFunctionality() {
        console.log('\\n🔧 檢查管理員功能可用性...');
        
        try {
            // 等待頁面完全載入
            await this.delay(5000);
            
            // 檢查管理員頁面是否正確載入
            const adminName = await this.page.$('#admin-name');
            if (adminName) {
                const nameText = await this.page.evaluate(el => el.textContent, adminName);
                console.log(`👤 登入用戶: ${nameText}`);
            }
            
            // 測試點擊員工管理
            console.log('📋 測試員工管理功能...');
            const employeeLink = await this.page.$('a[data-section="employee-management"]');
            if (employeeLink) {
                await employeeLink.click();
                await this.delay(3000);
                console.log('✅ 員工管理模組可訪問');
                
                this.realOperations.push({
                    type: 'NAVIGATION',
                    operation: '訪問員工管理模組',
                    timestamp: new Date().toISOString(),
                    success: true
                });
                
                return true;
            } else {
                console.log('❌ 找不到員工管理連結');
                return false;
            }
            
        } catch (error) {
            console.error('❌ 管理員功能檢查失敗:', error.message);
            return false;
        }
    }

    async checkForSystemNotifications() {
        console.log('\\n📱 檢查系統通知發送...');
        
        // 額外等待時間讓所有通知處理完成
        await this.delay(5000);
        
        console.log(`📊 監控到 ${this.systemNotifications.length} 個通知請求`);
        
        if (this.systemNotifications.length > 0) {
            console.log('🔔 發現系統通知:');
            this.systemNotifications.forEach((notif, index) => {
                console.log(`   ${index + 1}. ${notif.url} (狀態: ${notif.status})`);
            });
            return true;
        } else {
            console.log('⚠️ 未檢測到系統通知發送');
            return false;
        }
    }

    async takeScreenshot(filename) {
        try {
            await this.page.screenshot({ 
                path: `${filename}.png`, 
                fullPage: true 
            });
            console.log(`📸 截圖已保存: ${filename}.png`);
        } catch (error) {
            console.log('❌ 截圖失敗:', error.message);
        }
    }

    async generateDetailedReport() {
        console.log('\\n📋 生成詳細測試報告...');
        
        const report = `# 🎯 修正版真實系統操作測試報告

## 📊 測試執行結果

### 🔍 執行的操作
${this.realOperations.map((op, index) => 
    `${index + 1}. **${op.operation}** (${op.type})
   - 執行時間: ${new Date(op.timestamp).toLocaleString('zh-TW')}
   - 狀態: ${op.success ? '✅ 成功' : '❌ 失敗'}
   ${op.url ? `- URL: ${op.url}` : ''}
`).join('\\n')}

### 📱 系統通知監控
${this.systemNotifications.length > 0 ? 
    this.systemNotifications.map((notif, index) => 
        `${index + 1}. **通知請求**
   - URL: ${notif.url}
   - 狀態碼: ${notif.status}
   - 時間: ${new Date(notif.timestamp).toLocaleString('zh-TW')}`
    ).join('\\n') : 
    '⚠️ 未檢測到系統通知發送'
}

## 🎯 測試結論

- **總操作數**: ${this.realOperations.length}
- **成功操作**: ${this.realOperations.filter(op => op.success).length}
- **系統通知**: ${this.systemNotifications.length}次
- **測試狀態**: ${this.realOperations.length > 0 && this.realOperations.every(op => op.success) ? '✅ 成功' : '❌ 部分失敗'}

${this.systemNotifications.length > 0 ? 
    '🔔 **系統通知正常**: 檢測到自動通知發送' :
    '📱 **無系統通知**: 未檢測到自動業務通知發送'
}

---
**報告生成時間**: ${new Date().toISOString()}
**瀏覽器狀態**: ${this.browser ? '運行中' : '已關閉'}
`;

        fs.writeFileSync('fixed-real-operations-test-report.md', report);
        console.log('📄 詳細報告已保存: fixed-real-operations-test-report.md');
        
        return {
            totalOperations: this.realOperations.length,
            successfulOperations: this.realOperations.filter(op => op.success).length,
            systemNotifications: this.systemNotifications.length,
            success: this.realOperations.length > 0 && this.realOperations.every(op => op.success)
        };
    }

    async runTest() {
        try {
            console.log('🎯 開始修正版真實系統操作測試...');
            console.log('='.repeat(80));

            await this.initialize();
            
            // 在登入前截圖
            await this.takeScreenshot('01-before-login');
            
            // 執行管理員登入
            const loginSuccess = await this.realAdminLogin();
            
            if (loginSuccess) {
                // 登入成功後截圖
                await this.takeScreenshot('02-after-login');
                
                // 檢查管理員功能
                const functionalityCheck = await this.checkAdminFunctionality();
                
                if (functionalityCheck) {
                    await this.takeScreenshot('03-admin-functionality');
                }
            } else {
                // 登入失敗截圖
                await this.takeScreenshot('02-login-failed');
            }
            
            // 檢查系統通知
            const notificationCheck = await this.checkForSystemNotifications();
            
            // 生成報告
            const results = await this.generateDetailedReport();
            
            console.log('\\n🎯 修正版測試總結:');
            console.log(`📊 總操作數: ${results.totalOperations}`);
            console.log(`✅ 成功操作: ${results.successfulOperations}`);
            console.log(`📱 系統通知: ${results.systemNotifications}`);
            console.log(`🏆 測試結果: ${results.success ? '成功' : '失敗'}`);
            
            if (results.systemNotifications > 0) {
                console.log('🔔 檢測到系統通知！請檢查Telegram群組是否收到訊息！');
            } else {
                console.log('📱 未檢測到系統通知，可能系統未配置自動通知功能');
            }

            return results;

        } catch (error) {
            console.error('❌ 測試執行過程發生錯誤:', error);
            await this.takeScreenshot('error-screenshot');
            throw error;
        } finally {
            console.log('\\n🔍 保持瀏覽器開啟供手動檢查...');
            // 不關閉瀏覽器，讓用戶可以手動檢查
        }
    }
}

// 執行修正版測試
if (require.main === module) {
    const tester = new FixedRealOperationsTest();
    tester.runTest()
        .then(results => {
            console.log('\\n✅ 修正版真實系統操作測試完成！');
            if (results.success) {
                console.log('🎉 所有操作成功執行！');
            } else {
                console.log('⚠️ 部分操作失敗，請檢查截圖和報告');
            }
        })
        .catch(error => {
            console.error('❌ 測試執行失敗:', error);
            process.exit(1);
        });
}

module.exports = FixedRealOperationsTest;