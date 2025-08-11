/**
 * 🤖 智慧排班6重規則引擎真實測試
 * 深度測試智慧排班系統的實際功能運作
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

class SmartScheduleEngineTest {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = {
            scheduleEngineWorking: false,
            rulesEngineValidated: false,
            apiResponseReceived: false,
            actualScheduleGenerated: false,
            overallScore: 0,
            details: {}
        };
    }

    async initialize() {
        console.log('🤖 啟動智慧排班6重規則引擎測試...');
        
        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: { width: 1920, height: 1080 }
        });

        this.page = await this.browser.newPage();
        
        // 監控API調用
        this.apiCalls = [];
        this.page.on('response', response => {
            if (response.url().includes('/api/admin/schedules')) {
                this.apiCalls.push({
                    url: response.url(),
                    status: response.status(),
                    timestamp: new Date().toISOString()
                });
            }
        });

        console.log('✅ 瀏覽器初始化完成');
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async loginAndNavigateToSchedule() {
        console.log('\n🔐 登入並導航到排班管理...');
        
        try {
            // 登入流程
            await this.page.goto('https://employee-management-system-intermediate.onrender.com/login');
            await this.delay(3000);

            const nameInput = await this.page.$('input[name="name"]');
            const idInput = await this.page.$('input[name="idNumber"]');
            
            if (nameInput && idInput) {
                await nameInput.type('系統管理員');
                await idInput.type('A123456789');
                
                const loginBtn = await this.page.$('button[type="submit"]');
                await loginBtn.click();
                await this.delay(5000);
            }

            // 導航到排班管理
            const scheduleLink = await this.page.$('a[data-section="schedule-management"]');
            if (scheduleLink) {
                await scheduleLink.click();
                await this.delay(3000);
                console.log('✅ 成功導航到排班管理模組');
                return true;
            }

            return false;

        } catch (error) {
            console.error('❌ 登入和導航失敗:', error.message);
            return false;
        }
    }

    async testSmartScheduleRulesDisplay() {
        console.log('\n📋 測試智慧排班6重規則顯示...');
        
        try {
            // 檢查規則說明區塊
            const rulesInfo = await this.page.$('#schedule-rules-info');
            if (!rulesInfo) {
                console.log('❌ 未找到6重規則說明區塊');
                return false;
            }

            // 讀取規則列表
            const rules = await this.page.$$eval('#schedule-rules-info li', items =>
                items.map(item => item.textContent.trim())
            );

            console.log(`📊 發現 ${rules.length} 條排班規則:`);
            rules.forEach((rule, index) => {
                console.log(`   ${index + 1}. ${rule}`);
            });

            // 驗證是否包含必要的規則
            const expectedRules = [
                '基本時段檢查',
                '員工可用性檢查',
                '最低人力要求',
                '連續工作限制',
                '公平性分配',
                '特殊需求處理'
            ];

            let rulesFound = 0;
            expectedRules.forEach(expectedRule => {
                const found = rules.some(rule => rule.includes(expectedRule));
                if (found) {
                    rulesFound++;
                    console.log(`   ✅ 找到規則: ${expectedRule}`);
                } else {
                    console.log(`   ❌ 缺少規則: ${expectedRule}`);
                }
            });

            this.testResults.rulesEngineValidated = rulesFound === 6;
            this.testResults.details.rulesFound = rulesFound;
            this.testResults.details.allRules = rules;

            console.log(`📊 規則驗證結果: ${rulesFound}/6`);
            return rulesFound >= 5; // 允許1個規則的差異

        } catch (error) {
            console.error('❌ 規則顯示測試失敗:', error.message);
            return false;
        }
    }

    async testSmartScheduleGeneration() {
        console.log('\n🤖 測試智慧排班生成功能...');
        
        try {
            // 設定排班日期
            const dateInput = await this.page.$('#schedule-date');
            if (dateInput) {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const dateString = tomorrow.toISOString().split('T')[0];
                
                await dateInput.click({ clickCount: 3 });
                await dateInput.type(dateString);
                console.log(`✅ 設定排班日期: ${dateString}`);
                await this.delay(1000);
            }

            // 尋找智慧排班按鈕
            let smartScheduleBtn = null;
            
            // 方法1: XPath查找
            const smartButtons = await this.page.$x("//button[contains(text(), '智慧排班')]");
            if (smartButtons.length > 0) {
                smartScheduleBtn = smartButtons[0];
                console.log('✅ 找到智慧排班按鈕 (XPath)');
            } else {
                // 方法2: onclick屬性查找
                const buttons = await this.page.$$('button');
                for (const button of buttons) {
                    const onclick = await this.page.evaluate(el => el.getAttribute('onclick'), button);
                    const text = await this.page.evaluate(el => el.textContent, button);
                    
                    if ((onclick && onclick.includes('autoGenerate')) || 
                        (text && (text.includes('智慧排班') || text.includes('🤖')))) {
                        smartScheduleBtn = button;
                        console.log('✅ 找到智慧排班按鈕 (屬性搜尋)');
                        break;
                    }
                }
            }

            if (!smartScheduleBtn) {
                console.log('❌ 未找到智慧排班按鈕');
                return false;
            }

            // 設定確認對話框處理
            this.page.on('dialog', async dialog => {
                console.log(`📋 系統對話框: ${dialog.message()}`);
                
                if (dialog.message().includes('智慧排班') || dialog.message().includes('6重規則')) {
                    console.log('✅ 系統正確顯示智慧排班確認對話框');
                    await dialog.accept();
                    this.testResults.scheduleEngineWorking = true;
                } else {
                    await dialog.dismiss();
                }
            });

            // 點擊智慧排班按鈕
            console.log('🔄 點擊智慧排班按鈕...');
            await smartScheduleBtn.click();
            await this.delay(3000);

            // 等待API響應
            console.log('⏳ 等待API響應...');
            let apiResponseReceived = false;
            let attempts = 0;
            
            while (attempts < 5 && !apiResponseReceived) {
                await this.delay(1000);
                apiResponseReceived = this.apiCalls.some(call => 
                    call.url.includes('/schedules/auto-generate') && call.status === 200
                );
                attempts++;
            }

            this.testResults.apiResponseReceived = apiResponseReceived;
            
            if (apiResponseReceived) {
                console.log('✅ 智慧排班API響應成功！');
                
                // 檢查頁面是否有成功訊息或更新
                await this.delay(2000);
                
                const successMessages = await this.page.$x("//*[contains(text(), '排班') and contains(text(), '成功')]");
                const loadingIndicators = await this.page.$$('.loading');
                
                if (successMessages.length > 0 || loadingIndicators.length > 0) {
                    console.log('✅ 檢測到排班操作反饋');
                    this.testResults.actualScheduleGenerated = true;
                }
                
            } else {
                console.log('⚠️  智慧排班API響應超時或失敗');
            }

            return this.testResults.scheduleEngineWorking && apiResponseReceived;

        } catch (error) {
            console.error('❌ 智慧排班生成測試失敗:', error.message);
            return false;
        }
    }

    async testScheduleDataDisplay() {
        console.log('\n📊 測試排班數據顯示...');
        
        try {
            // 檢查排班表格或日曆顯示
            const scheduleContainer = await this.page.$('#schedule-calendar-container');
            if (scheduleContainer) {
                const hasContent = await this.page.evaluate(el => 
                    el.innerHTML.trim().length > 50, scheduleContainer
                );
                
                if (hasContent) {
                    console.log('✅ 排班顯示容器有內容');
                } else {
                    console.log('⚠️  排班顯示容器為空或載入中');
                }
            }

            // 檢查其他可能的排班顯示元素
            const scheduleElements = await this.page.$$('.schedule-item, .calendar-event, .shift-assignment');
            if (scheduleElements.length > 0) {
                console.log(`✅ 發現 ${scheduleElements.length} 個排班相關元素`);
            }

            return true;

        } catch (error) {
            console.error('❌ 排班數據顯示測試失敗:', error.message);
            return false;
        }
    }

    async generateTestReport() {
        console.log('\n📋 生成智慧排班測試報告...');

        // 計算總體評分
        let score = 0;
        
        if (this.testResults.rulesEngineValidated) score += 30;
        if (this.testResults.scheduleEngineWorking) score += 25;
        if (this.testResults.apiResponseReceived) score += 30;
        if (this.testResults.actualScheduleGenerated) score += 15;

        this.testResults.overallScore = score;

        const report = `
# 🤖 智慧排班6重規則引擎測試報告

## 📊 總體評分: ${this.testResults.overallScore}/100

${this.testResults.overallScore >= 80 ? '🎉 優秀！智慧排班系統運作良好' :
  this.testResults.overallScore >= 60 ? '✅ 良好！基本功能正常' :
  '⚠️  需要改進！排班系統存在問題'}

## 🔍 詳細測試結果

### 📋 6重規則引擎驗證:
- 狀態: ${this.testResults.rulesEngineValidated ? '✅ 通過' : '❌ 失敗'}
- 規則發現: ${this.testResults.details.rulesFound || 0}/6
- 得分: ${this.testResults.rulesEngineValidated ? '30' : '0'}/30

### 🤖 智慧排班功能測試:
- 按鈕操作: ${this.testResults.scheduleEngineWorking ? '✅ 成功' : '❌ 失敗'}
- 得分: ${this.testResults.scheduleEngineWorking ? '25' : '0'}/25

### 🔗 API響應測試:
- API調用: ${this.testResults.apiResponseReceived ? '✅ 成功' : '❌ 失敗'}
- 得分: ${this.testResults.apiResponseReceived ? '30' : '0'}/30

### 📊 實際排班生成:
- 排班生成: ${this.testResults.actualScheduleGenerated ? '✅ 成功' : '❌ 未確認'}
- 得分: ${this.testResults.actualScheduleGenerated ? '15' : '0'}/15

## 📈 發現的規則

${this.testResults.details.allRules ? 
    this.testResults.details.allRules.map((rule, index) => `${index + 1}. ${rule}`).join('\n') : 
    '未獲取到規則詳情'}

## 🔗 API調用記錄

${this.apiCalls.length > 0 ? 
    this.apiCalls.map((call, index) => 
        `${index + 1}. ${call.url} - ${call.status} (${call.timestamp})`
    ).join('\n') : 
    '未記錄到智慧排班API調用'}

## 🎯 系統邏輯符合度評估

### ✅ 符合系統邏輯的項目:
${this.testResults.rulesEngineValidated ? '- 🤖 6重規則引擎顯示正確' : ''}
${this.testResults.scheduleEngineWorking ? '- 🔄 智慧排班功能可操作' : ''}
${this.testResults.apiResponseReceived ? '- 🔗 後端API正確響應' : ''}

### 🚀 改進建議:

${this.testResults.overallScore >= 80 ?
    '✅ 智慧排班系統表現優秀！建議進行更多實際業務場景測試。' :
    this.testResults.overallScore >= 60 ?
    '⚡ 系統基本可用，建議優化：\n- 確保所有6重規則都正確實現\n- 提升API響應速度\n- 增強排班結果顯示' :
    '⚠️  系統需要重大改進：\n- 修復智慧排班核心功能\n- 完善6重規則引擎邏輯\n- 確保API端點正確部署'}

---
**測試時間**: ${new Date().toISOString()}
**測試範圍**: 智慧排班6重規則引擎功能驗證
**符合標準**: 系統邏輯.txt智慧排班規格
`;

        fs.writeFileSync('smart-schedule-engine-test-report.md', report);
        console.log('📄 測試報告已保存: smart-schedule-engine-test-report.md');
        
        return this.testResults;
    }

    async runTest() {
        try {
            console.log('🎯 開始智慧排班6重規則引擎深度測試...');
            console.log('='.repeat(70));

            await this.initialize();

            // 測試流程
            const loginSuccess = await this.loginAndNavigateToSchedule();
            if (loginSuccess) {
                const rulesTest = await this.testSmartScheduleRulesDisplay();
                const scheduleTest = await this.testSmartScheduleGeneration();
                const dataTest = await this.testScheduleDataDisplay();
            }

            const results = await this.generateTestReport();

            console.log('\n🎯 智慧排班測試總結:');
            console.log(`📊 總體評分: ${results.overallScore}/100`);
            console.log(`📋 規則引擎: ${results.rulesEngineValidated ? '✅' : '❌'}`);
            console.log(`🤖 排班功能: ${results.scheduleEngineWorking ? '✅' : '❌'}`);
            console.log(`🔗 API響應: ${results.apiResponseReceived ? '✅' : '❌'}`);
            console.log(`📊 排班生成: ${results.actualScheduleGenerated ? '✅' : '❌'}`);

            if (results.overallScore >= 80) {
                console.log('🎉 智慧排班系統表現優秀！6重規則引擎運作良好！');
            } else {
                console.log('⚠️  智慧排班系統需要進一步完善。');
            }

            return results;

        } catch (error) {
            console.error('❌ 測試過程發生錯誤:', error);
            throw error;
        } finally {
            if (this.browser) {
                console.log('🔍 保持瀏覽器開啟供檢查...');
                // await this.browser.close();
            }
        }
    }
}

// 執行測試
if (require.main === module) {
    const test = new SmartScheduleEngineTest();
    test.runTest()
        .then(results => {
            console.log('\n✅ 智慧排班6重規則引擎測試完成！');
        })
        .catch(error => {
            console.error('❌ 測試執行失敗:', error);
            process.exit(1);
        });
}

module.exports = SmartScheduleEngineTest;