/**
 * 🎯 最終全面角色功能測試系統
 * 基於Railway部署現況進行實際可用功能測試
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;

class FinalComprehensiveTest {
    constructor() {
        this.baseUrl = 'https://employee-management-system-intermediate.onrender.com';
        this.testResults = {
            totalTests: 0,
            passed: 0,
            failed: 0,
            results: []
        };
    }

    async runFinalTest() {
        console.log('🎯 啟動最終全面功能測試系統...');
        
        const browser = await puppeteer.launch({ 
            headless: false,
            defaultViewport: null,
            args: ['--start-maximized'] 
        });

        try {
            await this.testAvailablePages(browser);
            await this.testDatabaseConnection(browser);
            await this.testProfileEnhancedPage(browser);
            await this.generateFinalReport();
            
        } catch (error) {
            console.error('❌ 測試系統發生錯誤:', error.message);
        } finally {
            await browser.close();
            console.log('✅ 最終測試完成');
        }
    }

    async testAvailablePages(browser) {
        console.log('🌐 測試可用頁面...');
        
        const pages = [
            { name: 'admin.html', path: '/admin.html' },
            { name: 'admin-enhanced.html', path: '/admin-enhanced.html' },
            { name: 'profile-enhanced.html', path: '/profile-enhanced.html' },
            { name: 'employee.html', path: '/employee.html' },
            { name: 'login.html', path: '/login.html' }
        ];
        
        for (const pageInfo of pages) {
            try {
                const page = await browser.newPage();
                console.log(`📄 測試頁面: ${pageInfo.name}`);
                
                await page.goto(`${this.baseUrl}${pageInfo.path}`);
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                const title = await page.title();
                const contentLength = await page.evaluate(() => document.body.innerHTML.length);
                
                const result = {
                    page: pageInfo.name,
                    title: title,
                    contentLength: contentLength,
                    status: contentLength > 1000 ? '✅ 正常載入' : '❌ 內容過短'
                };
                
                this.testResults.results.push(result);
                this.testResults.totalTests++;
                
                if (result.status.includes('✅')) {
                    this.testResults.passed++;
                    console.log(`  ✅ ${pageInfo.name}: ${title} (${contentLength} 字符)`);
                } else {
                    this.testResults.failed++;
                    console.log(`  ❌ ${pageInfo.name}: ${title} (${contentLength} 字符) - 內容可能不完整`);
                }
                
                await page.close();
                
            } catch (error) {
                console.error(`  ❌ ${pageInfo.name}: 載入失敗 - ${error.message}`);
                this.testResults.results.push({
                    page: pageInfo.name,
                    status: `❌ 載入失敗: ${error.message}`
                });
                this.testResults.totalTests++;
                this.testResults.failed++;
            }
        }
    }

    async testDatabaseConnection(browser) {
        console.log('🗄️ 測試資料庫連線...');
        
        try {
            const page = await browser.newPage();
            await page.goto(`${this.baseUrl}/employee.html`);
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // 檢查是否有API呼叫
            page.on('response', response => {
                if (response.url().includes('/api/')) {
                    console.log(`📡 API呼叫: ${response.url()} - 狀態: ${response.status()}`);
                }
            });
            
            // 測試登入API
            const loginTest = await page.evaluate(async () => {
                try {
                    const response = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            idNumber: 'A123456789',
                            name: '測試管理員'
                        })
                    });
                    return {
                        status: response.status,
                        ok: response.ok
                    };
                } catch (error) {
                    return { error: error.message };
                }
            });
            
            const dbResult = {
                test: '資料庫連線測試',
                loginAPI: loginTest,
                status: loginTest.ok ? '✅ API正常回應' : '❌ API回應異常'
            };
            
            this.testResults.results.push(dbResult);
            this.testResults.totalTests++;
            
            if (dbResult.status.includes('✅')) {
                this.testResults.passed++;
                console.log(`  ✅ 資料庫連線: API狀態 ${loginTest.status}`);
            } else {
                this.testResults.failed++;
                console.log(`  ❌ 資料庫連線: ${loginTest.error || '回應異常'}`);
            }
            
            await page.close();
            
        } catch (error) {
            console.error(`❌ 資料庫測試失敗: ${error.message}`);
            this.testResults.totalTests++;
            this.testResults.failed++;
        }
    }

    async testProfileEnhancedPage(browser) {
        console.log('👤 測試profile-enhanced頁面功能...');
        
        try {
            const page = await browser.newPage();
            await page.goto(`${this.baseUrl}/profile-enhanced.html`);
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // 檢查頁面元素
            const elements = await page.evaluate(() => {
                const results = {};
                
                // 檢查打卡按鈕
                results.clockInBtn = !!document.querySelector('.clock-in-btn, [onclick*="clockIn"]');
                
                // 檢查考勤記錄區域
                results.attendanceRecords = !!document.querySelector('#attendance-records, .attendance-records');
                
                // 檢查個人資料編輯
                results.editProfileBtn = !!document.querySelector('.edit-profile-btn, [onclick*="editProfile"]');
                
                // 檢查頁面內容
                results.pageContent = document.body.innerHTML.length;
                
                // 檢查是否有模態視窗
                results.modal = !!document.querySelector('#universal-modal, .modal');
                
                return results;
            });
            
            const profileResult = {
                test: 'profile-enhanced.html功能測試',
                elements: elements,
                status: elements.clockInBtn && elements.pageContent > 5000 ? '✅ 功能完整' : '❌ 功能不完整'
            };
            
            this.testResults.results.push(profileResult);
            this.testResults.totalTests++;
            
            if (profileResult.status.includes('✅')) {
                this.testResults.passed++;
                console.log('  ✅ profile-enhanced頁面: 功能完整');
                console.log(`    - 打卡按鈕: ${elements.clockInBtn ? '✅' : '❌'}`);
                console.log(`    - 考勤記錄: ${elements.attendanceRecords ? '✅' : '❌'}`);
                console.log(`    - 編輯功能: ${elements.editProfileBtn ? '✅' : '❌'}`);
                console.log(`    - 模態視窗: ${elements.modal ? '✅' : '❌'}`);
            } else {
                this.testResults.failed++;
                console.log('  ❌ profile-enhanced頁面: 功能不完整');
            }
            
            await page.close();
            
        } catch (error) {
            console.error(`❌ profile-enhanced測試失敗: ${error.message}`);
            this.testResults.totalTests++;
            this.testResults.failed++;
        }
    }

    async generateFinalReport() {
        console.log('📊 生成最終測試報告...');
        
        const report = {
            title: '🎯 企業員工管理系統 - 最終全面測試報告',
            timestamp: new Date().toLocaleString('zh-TW'),
            summary: {
                totalTests: this.testResults.totalTests,
                passed: this.testResults.passed,
                failed: this.testResults.failed,
                successRate: `${(this.testResults.passed / this.testResults.totalTests * 100).toFixed(1)}%`
            },
            details: this.testResults.results,
            conclusion: this.generateConclusion()
        };
        
        // 保存JSON報告
        await fs.writeFile(
            `final-test-report-${Date.now()}.json`,
            JSON.stringify(report, null, 2)
        );
        
        // 生成Markdown報告
        const markdownReport = this.generateMarkdownReport(report);
        await fs.writeFile(
            `final-test-report-${Date.now()}.md`,
            markdownReport
        );
        
        // 在控制台顯示報告摘要
        console.log('\n📋 最終測試報告摘要:');
        console.log(`📊 總測試數: ${report.summary.totalTests}`);
        console.log(`✅ 通過數: ${report.summary.passed}`);
        console.log(`❌ 失敗數: ${report.summary.failed}`);
        console.log(`📈 成功率: ${report.summary.successRate}`);
        console.log(`\n💡 結論: ${report.conclusion}`);
    }

    generateConclusion() {
        const successRate = this.testResults.passed / this.testResults.totalTests;
        
        if (successRate >= 0.8) {
            return '✅ 系統整體功能正常，可以投入使用。主要功能均可正常運行。';
        } else if (successRate >= 0.6) {
            return '⚠️ 系統部分功能正常，建議修復失敗項目後再投入使用。';
        } else {
            return '❌ 系統存在多項問題，需要進行全面修復才能投入使用。';
        }
    }

    generateMarkdownReport(report) {
        return `# ${report.title}

生成時間: ${report.timestamp}

## 📊 測試摘要

| 指標 | 數值 |
|------|------|
| 總測試數 | ${report.summary.totalTests} |
| 通過數 | ${report.summary.passed} |
| 失敗數 | ${report.summary.failed} |
| 成功率 | ${report.summary.successRate} |

## 📋 詳細測試結果

${report.details.map(detail => `### ${detail.test || detail.page}
- **狀態**: ${detail.status}
- **詳情**: ${JSON.stringify(detail, null, 2)}
`).join('\n')}

## 💡 結論

${report.conclusion}

---
*報告由企業員工管理系統自動生成*
`;
    }
}

// 執行最終測試
const finalTest = new FinalComprehensiveTest();
finalTest.runFinalTest().catch(console.error);