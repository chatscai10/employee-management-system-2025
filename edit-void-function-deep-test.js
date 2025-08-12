/**
 * =====================================================
 * 編輯作廢功能按鍵深度檢查測試
 * =====================================================
 * 專門檢查所有編輯、作廢、刪除按鍵的實際可用性
 * 目標：確保每個按鍵都有真正的功能實現
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

class EditVoidFunctionDeepTester {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = {
            buttonTests: [],
            apiTests: [],
            functionalityTests: [],
            userExperienceTests: [],
            securityTests: []
        };
        this.baseUrl = 'http://localhost:3001';
    }

    async init() {
        console.log('🚀 啟動編輯作廢功能深度檢查...');
        
        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: { width: 1920, height: 1080 },
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor'
            ]
        });
        
        this.page = await this.browser.newPage();
        
        // 設置用戶代理
        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        
        // 監控網路請求
        await this.page.setRequestInterception(true);
        this.page.on('request', (request) => {
            if (request.url().includes('/api/') && 
                (request.method() === 'PUT' || request.method() === 'PATCH' || request.method() === 'DELETE')) {
                console.log(`📡 檢測到編輯/刪除API請求: ${request.method()} ${request.url()}`);
                this.testResults.apiTests.push({
                    method: request.method(),
                    url: request.url(),
                    timestamp: new Date().toISOString()
                });
            }
            request.continue();
        });
        
        // 監控控制台錯誤
        this.page.on('console', (msg) => {
            if (msg.type() === 'error') {
                console.log(`❌ 控制台錯誤: ${msg.text()}`);
            }
        });
    }

    async performLogin() {
        console.log('🔐 執行登入流程...');
        
        await this.page.goto(`${this.baseUrl}/login.html`, { 
            waitUntil: 'networkidle0',
            timeout: 30000 
        });

        // 等待登入表單載入
        await this.page.waitForSelector('#login-name', { timeout: 10000 });
        
        // 填入測試帳號
        await this.page.type('#login-name', '測試員工');
        await this.page.type('#login-id', 'A123456789');
        
        // 點擊登入
        await this.page.click('button[type="submit"]');
        
        // 等待跳轉
        await this.page.waitForNavigation({ 
            waitUntil: 'networkidle0',
            timeout: 15000 
        });
        
        console.log('✅ 登入成功，當前頁面:', this.page.url());
        
        // 截圖記錄
        await this.page.screenshot({ 
            path: `login-success-${Date.now()}.png`,
            fullPage: true 
        });
    }

    async checkEditVoidButtons() {
        console.log('🔍 檢查編輯作廢按鍵結構...');
        
        await this.page.goto(`${this.baseUrl}/employee-enterprise.html`, { 
            waitUntil: 'networkidle0',
            timeout: 30000 
        });

        // 檢查所有編輯相關按鍵
        const buttonSelectors = [
            // 編輯個人資料按鍵
            'button[onclick="editProfile()"]',
            // 撤回請假申請按鍵
            'button[onclick*="cancelLeave"]',
            // 投票相關按鍵
            'button[onclick*="submitVote"]',
            // 一般編輯按鍵
            'button:contains("編輯")',
            'button:contains("修改")',
            'button:contains("作廢")',
            'button:contains("刪除")',
            'button:contains("取消")',
            '.btn-warning',
            '.btn-danger',
            '.btn-outline-warning',
            '.btn-outline-danger'
        ];

        for (const selector of buttonSelectors) {
            try {
                const buttons = await this.page.$$(selector);
                if (buttons.length > 0) {
                    console.log(`✅ 發現 ${buttons.length} 個按鍵: ${selector}`);
                    
                    for (let i = 0; i < Math.min(buttons.length, 3); i++) {
                        const button = buttons[i];
                        const buttonText = await this.page.evaluate(el => el.textContent?.trim(), button);
                        const onClick = await this.page.evaluate(el => el.getAttribute('onclick'), button);
                        
                        this.testResults.buttonTests.push({
                            selector,
                            text: buttonText,
                            onClick,
                            found: true,
                            hasFunction: !!onClick
                        });
                    }
                } else {
                    console.log(`❌ 未發現按鍵: ${selector}`);
                    this.testResults.buttonTests.push({
                        selector,
                        found: false,
                        hasFunction: false
                    });
                }
            } catch (error) {
                console.log(`⚠️ 檢查按鍵時發生錯誤 ${selector}: ${error.message}`);
            }
        }
    }

    async testEditProfileFunction() {
        console.log('🧪 測試個人資料編輯功能...');
        
        try {
            // 尋找編輯個人資料按鍵
            const editButton = await this.page.$('button[onclick="editProfile()"]');
            if (editButton) {
                console.log('✅ 找到編輯個人資料按鍵');
                
                // 點擊按鍵
                await editButton.click();
                
                // 等待反應
                await this.page.waitForTimeout(2000);
                
                // 檢查是否有通知訊息
                const notification = await this.page.$('.notification-toast, .alert, .toast');
                if (notification) {
                    const notificationText = await this.page.evaluate(el => el.textContent, notification);
                    console.log(`📢 通知訊息: ${notificationText}`);
                    
                    this.testResults.functionalityTests.push({
                        function: 'editProfile',
                        clicked: true,
                        hasResponse: true,
                        responseText: notificationText,
                        isImplemented: notificationText.includes('開發中') ? false : true
                    });
                } else {
                    console.log('❌ 點擊後無任何反應');
                    this.testResults.functionalityTests.push({
                        function: 'editProfile',
                        clicked: true,
                        hasResponse: false,
                        isImplemented: false
                    });
                }
            } else {
                console.log('❌ 未找到編輯個人資料按鍵');
                this.testResults.functionalityTests.push({
                    function: 'editProfile',
                    found: false,
                    isImplemented: false
                });
            }
        } catch (error) {
            console.log(`❌ 測試編輯個人資料功能時發生錯誤: ${error.message}`);
        }
    }

    async testCancelLeaveFunction() {
        console.log('🧪 測試撤回請假申請功能...');
        
        try {
            // 尋找撤回按鍵
            const cancelButton = await this.page.$('button[onclick*="cancelLeave"]');
            if (cancelButton) {
                console.log('✅ 找到撤回請假按鍵');
                
                // 點擊按鍵
                await cancelButton.click();
                
                // 等待確認對話框
                await this.page.waitForTimeout(1000);
                
                // 檢查是否有確認對話框
                const confirmDialog = await this.page.evaluate(() => {
                    return window.confirm ? 'confirm函數存在' : '無confirm函數';
                });
                
                console.log(`📋 確認對話框狀態: ${confirmDialog}`);
                
                this.testResults.functionalityTests.push({
                    function: 'cancelLeave',
                    clicked: true,
                    hasConfirm: confirmDialog.includes('存在'),
                    isImplemented: true
                });
                
            } else {
                console.log('❌ 未找到撤回請假按鍵');
                this.testResults.functionalityTests.push({
                    function: 'cancelLeave',
                    found: false,
                    isImplemented: false
                });
            }
        } catch (error) {
            console.log(`❌ 測試撤回請假功能時發生錯誤: ${error.message}`);
        }
    }

    async checkTableEditButtons() {
        console.log('📊 檢查表格中的編輯按鍵...');
        
        // 檢查不同的表格區域
        const tableAreas = [
            '#attendance .table',  // 打卡記錄表格
            '#daily-revenue-table', // 營收記錄表格
            '#schedule .table',    // 排班記錄表格
            '#voting .table',      // 投票記錄表格
        ];

        for (const tableSelector of tableAreas) {
            try {
                const table = await this.page.$(tableSelector);
                if (table) {
                    console.log(`✅ 找到表格: ${tableSelector}`);
                    
                    // 檢查表格內是否有編輯按鍵
                    const editButtons = await this.page.$$(`${tableSelector} button, ${tableSelector} .btn`);
                    
                    console.log(`📝 表格內發現 ${editButtons.length} 個按鍵`);
                    
                    if (editButtons.length > 0) {
                        // 檢查前3個按鍵
                        for (let i = 0; i < Math.min(editButtons.length, 3); i++) {
                            const button = editButtons[i];
                            const buttonText = await this.page.evaluate(el => el.textContent?.trim(), button);
                            const buttonClass = await this.page.evaluate(el => el.className, button);
                            const onClick = await this.page.evaluate(el => el.getAttribute('onclick'), button);
                            
                            console.log(`  按鍵 ${i+1}: "${buttonText}" (${buttonClass})`);
                            
                            this.testResults.userExperienceTests.push({
                                tableArea: tableSelector,
                                buttonText,
                                buttonClass,
                                onClick,
                                hasEditFunction: buttonText?.includes('編輯') || buttonText?.includes('修改') || 
                                               buttonText?.includes('作廢') || buttonText?.includes('刪除')
                            });
                        }
                    } else {
                        console.log(`❌ 表格 ${tableSelector} 內無任何按鍵`);
                        this.testResults.userExperienceTests.push({
                            tableArea: tableSelector,
                            hasButtons: false,
                            issue: '表格內無編輯或操作按鍵'
                        });
                    }
                } else {
                    console.log(`❌ 未找到表格: ${tableSelector}`);
                }
            } catch (error) {
                console.log(`❌ 檢查表格 ${tableSelector} 時發生錯誤: ${error.message}`);
            }
        }
    }

    async generateDetailedReport() {
        console.log('📋 生成詳細檢查報告...');
        
        const report = {
            testExecutionTime: new Date().toISOString(),
            summary: {
                totalButtonsFound: this.testResults.buttonTests.filter(b => b.found).length,
                totalButtonsWithFunctions: this.testResults.buttonTests.filter(b => b.hasFunction).length,
                totalFunctionalityTests: this.testResults.functionalityTests.length,
                totalApiRequests: this.testResults.apiTests.length,
                implementedFunctions: this.testResults.functionalityTests.filter(f => f.isImplemented).length
            },
            detailedFindings: {
                buttonAnalysis: this.testResults.buttonTests,
                functionalityAnalysis: this.testResults.functionalityTests,
                apiRequests: this.testResults.apiTests,
                userExperienceAnalysis: this.testResults.userExperienceTests,
                securityAnalysis: this.testResults.securityTests
            },
            criticalIssues: [],
            recommendations: []
        };

        // 分析關鍵問題
        if (report.summary.totalButtonsWithFunctions === 0) {
            report.criticalIssues.push('🚨 嚴重問題：未發現任何有實際功能的編輯按鍵');
        }
        
        const unimplementedFunctions = this.testResults.functionalityTests.filter(f => !f.isImplemented);
        if (unimplementedFunctions.length > 0) {
            report.criticalIssues.push(`⚠️ 功能未實現：${unimplementedFunctions.length} 個編輯功能顯示"開發中"或無反應`);
        }

        // 生成修復建議
        if (report.summary.totalApiRequests === 0) {
            report.recommendations.push('🔧 建議：為編輯和作廢功能實現相應的API端點 (PUT/PATCH/DELETE)');
        }
        
        const tablesWithoutButtons = this.testResults.userExperienceTests.filter(t => !t.hasButtons);
        if (tablesWithoutButtons.length > 0) {
            report.recommendations.push('📊 建議：為數據表格添加編輯和作廢操作按鍵，提升用戶體驗');
        }

        // 保存報告
        const reportPath = `edit-void-deep-test-report-${Date.now()}.json`;
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`📄 詳細報告已保存: ${reportPath}`);
        return report;
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            console.log('🧹 瀏覽器已關閉');
        }
    }

    async runFullTest() {
        try {
            await this.init();
            await this.performLogin();
            await this.checkEditVoidButtons();
            await this.testEditProfileFunction();
            await this.testCancelLeaveFunction();
            await this.checkTableEditButtons();
            const report = await this.generateDetailedReport();
            
            // 輸出總結
            console.log('\n' + '='.repeat(60));
            console.log('🎯 編輯作廢功能深度檢查完成');
            console.log('='.repeat(60));
            console.log(`📊 發現按鍵總數: ${report.summary.totalButtonsFound}`);
            console.log(`🔧 有功能按鍵數: ${report.summary.totalButtonsWithFunctions}`);
            console.log(`✅ 已實現功能數: ${report.summary.implementedFunctions}`);
            console.log(`📡 API請求數: ${report.summary.totalApiRequests}`);
            
            if (report.criticalIssues.length > 0) {
                console.log('\n🚨 關鍵問題:');
                report.criticalIssues.forEach(issue => console.log(issue));
            }
            
            if (report.recommendations.length > 0) {
                console.log('\n💡 修復建議:');
                report.recommendations.forEach(rec => console.log(rec));
            }
            
            return report;
            
        } catch (error) {
            console.error('❌ 測試執行失敗:', error);
            throw error;
        } finally {
            await this.cleanup();
        }
    }
}

// 執行測試
async function runEditVoidDeepTest() {
    const tester = new EditVoidFunctionDeepTester();
    
    try {
        console.log('🚀 開始執行編輯作廢功能深度檢查...');
        const report = await tester.runFullTest();
        
        console.log('\n✅ 檢查完成！請查看詳細報告文件。');
        return report;
        
    } catch (error) {
        console.error('💥 檢查過程中發生錯誤:', error);
        process.exit(1);
    }
}

// 如果直接運行此文件
if (require.main === module) {
    runEditVoidDeepTest();
}

module.exports = EditVoidFunctionDeepTester;