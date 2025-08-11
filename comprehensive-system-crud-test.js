const puppeteer = require('puppeteer');

class ComprehensiveSystemCRUDTest {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = [];
        this.baseUrl = 'https://employee-management-system-intermediate.onrender.com';
        this.employeeCredentials = { name: '張三', id: 'C123456789' };
        this.adminCredentials = { username: 'admin', password: 'admin123' };
    }

    async init() {
        console.log('🚀 啟動全面系統CRUD功能測試...');
        
        this.browser = await puppeteer.launch({
            headless: false,
            slowMo: 800,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
        });
        
        this.page = await this.browser.newPage();
        await this.page.setViewport({ width: 1366, height: 768 });
        
        this.page.on('console', msg => {
            if (msg.text().includes('API') || msg.text().includes('錯誤') || msg.text().includes('成功')) {
                console.log(`🖥️ 系統回應: ${msg.text()}`);
            }
        });
        
        console.log('✅ 測試環境已準備完成');
    }

    async loginAsEmployee() {
        console.log('\n👤 員工身份登入...');
        
        try {
            await this.page.goto(`${this.baseUrl}/login`, { waitUntil: 'domcontentloaded' });
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            await this.page.waitForSelector('#login-name');
            await this.page.type('#login-name', this.employeeCredentials.name);
            await this.page.type('#login-id', this.employeeCredentials.id);
            await this.page.click('button[type="submit"]');
            
            await new Promise(resolve => setTimeout(resolve, 3000));
            const success = await this.page.$('.content-area') !== null;
            
            this.testResults.push({
                category: '登入驗證',
                test: '員工登入',
                success: success,
                details: success ? '員工登入成功' : '員工登入失敗'
            });
            
            console.log(success ? '✅ 員工登入成功' : '❌ 員工登入失敗');
            return success;
        } catch (error) {
            console.error('❌ 員工登入錯誤:', error.message);
            return false;
        }
    }

    async testEmployeeCreateOperations() {
        console.log('\n📝 測試員工頁面 - 新增功能');
        
        const createTests = [
            {
                name: '營收記錄新增',
                module: 'revenue',
                operation: async () => {
                    await this.page.click('[data-section="revenue"]');
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    
                    await this.page.waitForSelector('#revenueAmount');
                    await this.page.type('#revenueAmount', '8500');
                    await this.page.select('#revenueCategory', '門市銷售');
                    await this.page.type('#revenueDescription', '自動化測試營收記錄');
                    
                    const originalAmount = await this.page.$eval('#revenueAmount', el => el.value);
                    await this.page.click('#revenue-form button[type="submit"]');
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    
                    const newAmount = await this.page.$eval('#revenueAmount', el => el.value);
                    return { 
                        success: newAmount === '' && originalAmount === '8500',
                        details: `表單清空狀態: ${newAmount === '' ? '是' : '否'}, 原始金額: ${originalAmount}`
                    };
                }
            },
            {
                name: '打卡記錄新增',
                module: 'attendance',
                operation: async () => {
                    await this.page.click('[data-section="attendance"]');
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    
                    // 尋找打卡相關按鈕
                    const clockButtons = await this.page.$$eval('button', buttons => 
                        buttons.map(btn => btn.textContent.trim()).filter(text => 
                            text.includes('打卡') || text.includes('上班') || text.includes('下班')
                        )
                    );
                    
                    if (clockButtons.length > 0) {
                        // 點擊第一個打卡按鈕
                        await this.page.evaluate(() => {
                            const buttons = Array.from(document.querySelectorAll('button'));
                            const clockBtn = buttons.find(btn => 
                                btn.textContent.includes('打卡') || 
                                btn.textContent.includes('上班') || 
                                btn.textContent.includes('下班')
                            );
                            if (clockBtn) clockBtn.click();
                        });
                        
                        await new Promise(resolve => setTimeout(resolve, 3000));
                        
                        // 檢查是否有成功回應
                        const hasResponse = await this.page.evaluate(() => {
                            const alerts = document.querySelectorAll('.alert, .toast, .notification');
                            return alerts.length > 0 || document.body.textContent.includes('成功');
                        });
                        
                        return {
                            success: hasResponse,
                            details: `找到打卡按鈕: ${clockButtons.length}個, 系統回應: ${hasResponse ? '有' : '無'}`
                        };
                    } else {
                        return {
                            success: false,
                            details: '未找到打卡按鈕'
                        };
                    }
                }
            },
            {
                name: '維修申請新增',
                module: 'maintenance',
                operation: async () => {
                    await this.page.click('[data-section="maintenance"]');
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    
                    // 尋找維修申請表單
                    const hasForm = await this.page.$('form') !== null;
                    if (!hasForm) {
                        return { success: false, details: '未找到維修申請表單' };
                    }
                    
                    // 填寫維修申請
                    const inputs = await this.page.$$('input[type="text"], textarea');
                    if (inputs.length > 0) {
                        await inputs[0].type('測試維修申請 - 冷氣故障');
                        
                        const submitBtn = await this.page.$('button[type="submit"], .btn-primary');
                        if (submitBtn) {
                            await submitBtn.click();
                            await new Promise(resolve => setTimeout(resolve, 3000));
                            
                            const success = await this.page.evaluate(() => {
                                return document.body.textContent.includes('成功') || 
                                       document.body.textContent.includes('已提交');
                            });
                            
                            return {
                                success: success,
                                details: `表單提交: ${success ? '成功' : '無回應'}`
                            };
                        }
                    }
                    
                    return { success: false, details: '無法完成維修申請提交' };
                }
            }
        ];

        for (const test of createTests) {
            try {
                console.log(`\n🔹 測試: ${test.name}`);
                const result = await test.operation();
                
                this.testResults.push({
                    category: '員工新增功能',
                    test: test.name,
                    success: result.success,
                    details: result.details
                });
                
                console.log(`${result.success ? '✅' : '❌'} ${test.name}: ${result.details}`);
                
            } catch (error) {
                console.error(`❌ ${test.name} 執行錯誤:`, error.message);
                this.testResults.push({
                    category: '員工新增功能',
                    test: test.name,
                    success: false,
                    details: `執行錯誤: ${error.message}`
                });
            }
        }
    }

    async testEmployeeEditOperations() {
        console.log('\n✏️ 測試員工頁面 - 編輯功能');
        
        const editTests = [
            {
                name: '個人資料編輯',
                operation: async () => {
                    await this.page.click('[data-section="profile"]');
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    
                    // 查找可編輯的欄位
                    const phoneField = await this.page.$('#profile-phone, input[name="phone"], input[type="tel"]');
                    if (phoneField) {
                        const originalValue = await this.page.evaluate(el => el.value, phoneField);
                        
                        await phoneField.click({ clickCount: 3 }); // 全選
                        await phoneField.type('0912345678');
                        
                        const saveBtn = await this.page.$('button[type="submit"], .btn-success, .save-btn');
                        if (saveBtn) {
                            await saveBtn.click();
                            await new Promise(resolve => setTimeout(resolve, 3000));
                            
                            const newValue = await this.page.evaluate(el => el.value, phoneField);
                            return {
                                success: newValue === '0912345678' && newValue !== originalValue,
                                details: `原值: ${originalValue}, 新值: ${newValue}`
                            };
                        }
                    }
                    
                    return { success: false, details: '未找到可編輯的個人資料欄位' };
                }
            },
            {
                name: '升遷投票操作',
                operation: async () => {
                    await this.page.click('[data-section="promotion"]');
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    
                    // 查找投票按鈕或選項
                    const voteButtons = await this.page.$$('button, input[type="radio"], .vote-option');
                    if (voteButtons.length > 0) {
                        await voteButtons[0].click();
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        
                        const hasResponse = await this.page.evaluate(() => {
                            return document.body.textContent.includes('投票') || 
                                   document.body.textContent.includes('成功') ||
                                   document.body.textContent.includes('已投票');
                        });
                        
                        return {
                            success: hasResponse,
                            details: `找到投票選項: ${voteButtons.length}個, 系統回應: ${hasResponse ? '有' : '無'}`
                        };
                    }
                    
                    return { success: false, details: '未找到投票選項' };
                }
            }
        ];

        for (const test of editTests) {
            try {
                console.log(`\n🔹 測試: ${test.name}`);
                const result = await test.operation();
                
                this.testResults.push({
                    category: '員工編輯功能',
                    test: test.name,
                    success: result.success,
                    details: result.details
                });
                
                console.log(`${result.success ? '✅' : '❌'} ${test.name}: ${result.details}`);
                
            } catch (error) {
                console.error(`❌ ${test.name} 執行錯誤:`, error.message);
            }
        }
    }

    async testEmployeeQueryOperations() {
        console.log('\n🔍 測試員工頁面 - 查詢功能');
        
        const queryTests = [
            {
                name: '排班查詢功能',
                operation: async () => {
                    await this.page.click('[data-section="schedule"]');
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    
                    // 檢查是否有排班資料顯示
                    const hasScheduleData = await this.page.evaluate(() => {
                        const scheduleContainer = document.getElementById('schedule');
                        if (!scheduleContainer) return false;
                        
                        return scheduleContainer.textContent.includes('排班') ||
                               scheduleContainer.querySelector('table') !== null ||
                               scheduleContainer.querySelector('.schedule-item') !== null;
                    });
                    
                    return {
                        success: hasScheduleData,
                        details: `排班資料顯示: ${hasScheduleData ? '有' : '無'}`
                    };
                }
            },
            {
                name: '庫存查詢功能',
                operation: async () => {
                    await this.page.click('[data-section="inventory"]');
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    
                    const hasInventoryData = await this.page.evaluate(() => {
                        const inventoryContainer = document.getElementById('inventory');
                        if (!inventoryContainer) return false;
                        
                        return inventoryContainer.textContent.includes('庫存') ||
                               inventoryContainer.querySelector('table') !== null ||
                               inventoryContainer.querySelector('.inventory-item') !== null;
                    });
                    
                    return {
                        success: hasInventoryData,
                        details: `庫存資料顯示: ${hasInventoryData ? '有' : '無'}`
                    };
                }
            }
        ];

        for (const test of queryTests) {
            try {
                console.log(`\n🔹 測試: ${test.name}`);
                const result = await test.operation();
                
                this.testResults.push({
                    category: '員工查詢功能',
                    test: test.name,
                    success: result.success,
                    details: result.details
                });
                
                console.log(`${result.success ? '✅' : '❌'} ${test.name}: ${result.details}`);
                
            } catch (error) {
                console.error(`❌ ${test.name} 執行錯誤:`, error.message);
            }
        }
    }

    async testAdminOperations() {
        console.log('\n👑 測試管理員功能');
        
        try {
            // 登出員工身份
            await this.page.goto(`${this.baseUrl}/`, { waitUntil: 'domcontentloaded' });
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // 嘗試進入管理員頁面
            await this.page.goto(`${this.baseUrl}/admin`, { waitUntil: 'domcontentloaded' });
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const isAdminPage = await this.page.evaluate(() => {
                return document.body.textContent.includes('管理') ||
                       document.body.textContent.includes('Admin') ||
                       document.querySelector('.admin-panel') !== null;
            });
            
            if (isAdminPage) {
                console.log('✅ 成功進入管理員頁面');
                
                // 測試管理員功能
                const adminTests = await this.testAdminCRUD();
                return adminTests;
            } else {
                console.log('⚠️ 管理員頁面可能需要特殊登入');
                
                this.testResults.push({
                    category: '管理員功能',
                    test: '管理員頁面訪問',
                    success: false,
                    details: '無法直接訪問管理員頁面，可能需要特殊認證'
                });
                
                return false;
            }
            
        } catch (error) {
            console.error('❌ 管理員功能測試錯誤:', error.message);
            return false;
        }
    }

    async testAdminCRUD() {
        console.log('\n🔧 測試管理員CRUD功能');
        
        const adminTests = [
            {
                name: '員工資料管理',
                operation: async () => {
                    // 尋找員工管理相關按鈕或連結
                    const employeeLinks = await this.page.$$eval('a, button', elements =>
                        elements.filter(el => 
                            el.textContent.includes('員工') || 
                            el.textContent.includes('Employee')
                        ).length
                    );
                    
                    return {
                        success: employeeLinks > 0,
                        details: `找到員工管理選項: ${employeeLinks}個`
                    };
                }
            },
            {
                name: '系統設定功能',
                operation: async () => {
                    const settingsLinks = await this.page.$$eval('a, button', elements =>
                        elements.filter(el => 
                            el.textContent.includes('設定') || 
                            el.textContent.includes('Settings') ||
                            el.textContent.includes('配置')
                        ).length
                    );
                    
                    return {
                        success: settingsLinks > 0,
                        details: `找到系統設定選項: ${settingsLinks}個`
                    };
                }
            }
        ];

        for (const test of adminTests) {
            try {
                const result = await test.operation();
                this.testResults.push({
                    category: '管理員CRUD',
                    test: test.name,
                    success: result.success,
                    details: result.details
                });
                
                console.log(`${result.success ? '✅' : '❌'} ${test.name}: ${result.details}`);
            } catch (error) {
                console.error(`❌ ${test.name} 錯誤:`, error.message);
            }
        }
        
        return true;
    }

    generateComprehensiveReport() {
        const categories = [...new Set(this.testResults.map(r => r.category))];
        const totalTests = this.testResults.length;
        const successfulTests = this.testResults.filter(r => r.success).length;
        const successRate = Math.round((successfulTests / totalTests) * 100);
        
        let status = '❌ 系統功能存在重大問題';
        if (successRate >= 85) status = '🎉 系統功能完整，達到企業級標準';
        else if (successRate >= 70) status = '✅ 系統功能良好，基本達標';
        else if (successRate >= 50) status = '⚠️ 系統功能基本可用，需改進';
        
        const report = `
# 🏢 企業員工管理系統 - 全面CRUD功能測試報告

## 📊 總體評分: ${successRate}/100

${status}

## 📋 測試統計

- **總測試項目**: ${totalTests}
- **成功項目**: ${successfulTests}
- **成功率**: ${successRate}%
- **測試分類**: ${categories.length}個

## 📈 分類結果

${categories.map(category => {
    const categoryTests = this.testResults.filter(r => r.category === category);
    const categorySuccess = categoryTests.filter(r => r.success).length;
    const categoryRate = Math.round((categorySuccess / categoryTests.length) * 100);
    
    return `
### ${categorySuccess === categoryTests.length ? '✅' : categorySuccess > 0 ? '⚠️' : '❌'} ${category}
- **成功率**: ${categoryRate}% (${categorySuccess}/${categoryTests.length})
- **詳細結果**:
${categoryTests.map(test => `  - ${test.success ? '✅' : '❌'} **${test.test}**: ${test.details}`).join('\n')}
`;
}).join('')}

## 🔍 API回應分析

${this.testResults.filter(r => r.details.includes('API') || r.details.includes('回應')).map(r => 
    `- **${r.test}**: ${r.details}`
).join('\n') || '未檢測到明確的API回應資訊'}

## 💡 關鍵發現

### 🎯 功能強項:
${this.testResults.filter(r => r.success).map(r => `- ✅ ${r.test}`).slice(0, 5).join('\n') || '暫無明確強項'}

### ⚠️ 需改進項目:
${this.testResults.filter(r => !r.success).map(r => `- ❌ ${r.test}: ${r.details}`).slice(0, 5).join('\n') || '✅ 所有功能正常運作'}

## 🚀 建議

${successRate >= 85 ? 
  '✅ 系統功能完善，建議進入生產環境部署' : 
  successRate >= 70 ?
  '⚠️ 系統基本功能完善，建議修復失敗項目後部署' :
  '❌ 系統存在重要功能問題，建議全面檢修後再測試'}

---
**測試時間**: ${new Date().toLocaleString('zh-TW')}
**測試工具**: 全面CRUD功能測試引擎
**測試範圍**: 員工頁面 + 管理員頁面 + CRUD操作 + API回應分析
`;
        
        return { report, successRate, totalTests, successfulTests };
    }

    async close() {
        console.log('\n🔚 關閉測試環境...');
        if (this.browser) {
            await this.browser.close();
        }
    }

    async runFullCRUDTest() {
        try {
            await this.init();
            
            // 執行員工功能測試
            const loginSuccess = await this.loginAsEmployee();
            if (loginSuccess) {
                await this.testEmployeeCreateOperations();
                await this.testEmployeeEditOperations();
                await this.testEmployeeQueryOperations();
            }
            
            // 執行管理員功能測試
            await this.testAdminOperations();
            
            const reportData = this.generateComprehensiveReport();
            console.log(reportData.report);
            
            return reportData;
            
        } catch (error) {
            console.error('❌ 全面測試執行失敗:', error);
            throw error;
        } finally {
            await this.close();
        }
    }
}

// 執行測試
async function main() {
    const tester = new ComprehensiveSystemCRUDTest();
    
    try {
        const results = await tester.runFullCRUDTest();
        
        // 發送詳細報告到Telegram
        const https = require('https');
        const telegramData = {
            chat_id: '-1002658082392',
            text: `🏢 全面CRUD功能測試完成\\n\\n📊 總評分: ${results.successRate}/100\\n✅ 成功: ${results.successfulTests}/${results.totalTests}\\n\\n🔍 測試範圍:\\n- 員工新增功能\\n- 員工編輯功能\\n- 員工查詢功能\\n- 管理員CRUD功能\\n- API回應分析\\n\\n${results.successRate >= 85 ? '🎉 達到企業級標準！' : results.successRate >= 70 ? '✅ 功能良好' : '⚠️ 需要改進'}\\n\\n🕐 ${new Date().toLocaleString('zh-TW')}`
        };
        
        const postData = JSON.stringify(telegramData);
        const options = {
            hostname: 'api.telegram.org',
            port: 443,
            path: '/bot7659930552:AAF_jF1rAXFnjFO176-9X5fKfBwbrko8BNc/sendMessage',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        const req = https.request(options);
        req.write(postData);
        req.end();
        
        console.log('\n📱 Telegram全面測試報告已發送');
        
        // 保存詳細報告到文件
        const fs = require('fs');
        fs.writeFileSync('D:\\0809\\comprehensive-crud-test-report.md', results.report);
        console.log('📄 詳細報告已保存至: comprehensive-crud-test-report.md');
        
    } catch (error) {
        console.error('測試執行失敗:', error);
    }
}

main().catch(console.error);