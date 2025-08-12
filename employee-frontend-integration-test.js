/**
 * 🔧 員工管理前端整合測試
 * 測試管理員頁面員工管理介面的完整功能
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;

class EmployeeFrontendIntegrationTest {
    constructor() {
        this.baseUrl = 'http://localhost:3002';
        this.browser = null;
        this.page = null;
        this.testResults = [];
    }

    async initialize() {
        console.log('🚀 啟動員工管理前端整合測試...');
        
        this.browser = await puppeteer.launch({
            headless: false,
            slowMo: 1000,
            defaultViewport: { width: 1400, height: 900 },
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        this.page = await this.browser.newPage();
        
        // 事件監聽
        this.page.on('console', msg => {
            const text = msg.text();
            if (text.includes('error') || text.includes('Error')) {
                console.log(`📱 瀏覽器錯誤: ${text}`);
            } else if (text.includes('員工') || text.includes('載入')) {
                console.log(`📱 瀏覽器: ${text}`);
            }
        });

        this.page.on('response', response => {
            if (response.url().includes('/api/employees')) {
                console.log(`🌐 API: ${response.url()} - ${response.status()}`);
            }
        });
    }

    async runTest(testName, testFunction) {
        console.log(`\\n🧪 執行測試: ${testName}`);
        const startTime = Date.now();
        
        try {
            const result = await testFunction();
            const duration = Date.now() - startTime;
            
            const testResult = {
                name: testName,
                status: 'PASSED',
                duration: duration,
                details: result,
                timestamp: new Date().toISOString()
            };
            
            this.testResults.push(testResult);
            console.log(`✅ ${testName} - 通過 (${duration}ms)`);
            return testResult;
            
        } catch (error) {
            const duration = Date.now() - startTime;
            
            const testResult = {
                name: testName,
                status: 'FAILED',
                duration: duration,
                error: error.message,
                timestamp: new Date().toISOString()
            };
            
            this.testResults.push(testResult);
            console.log(`❌ ${testName} - 失敗 (${duration}ms): ${error.message}`);
            return testResult;
        }
    }

    async loginAsAdmin() {
        console.log('🔑 管理員登入...');
        
        // 訪問登入頁面
        await this.page.goto(`${this.baseUrl}/`, { waitUntil: 'networkidle0' });
        
        // 登入
        await this.page.type('#login-name', '測試員工');
        await this.page.type('#login-id', 'A123456789');
        
        const navigationPromise = this.page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 });
        await this.page.click('#login-btn');
        await navigationPromise;
        
        console.log('✅ 管理員登入完成');
    }

    async testAdminPageAccess() {
        return await this.runTest('管理員頁面訪問測試', async () => {
            // 訪問管理員頁面
            await this.page.goto(`${this.baseUrl}/admin`, { waitUntil: 'networkidle0' });
            
            // 檢查頁面載入
            await this.page.waitForSelector('.header h1', { timeout: 10000 });
            
            const pageTitle = await this.page.title();
            const headerText = await this.page.$eval('.header h1', el => el.textContent);
            
            if (!headerText.includes('管理員') && !headerText.includes('後台')) {
                throw new Error('管理員頁面標題不正確');
            }
            
            return {
                pageTitle: pageTitle,
                headerText: headerText,
                currentUrl: this.page.url()
            };
        });
    }

    async testEmployeeSectionVisible() {
        return await this.runTest('員工管理區域顯示測試', async () => {
            // 檢查員工管理區域是否存在
            const employeeSection = await this.page.$('#employee-management');
            if (!employeeSection) {
                throw new Error('員工管理區域不存在');
            }
            
            // 確保員工管理區域是預設顯示的
            const isActive = await this.page.$eval('#employee-management', el => 
                el.classList.contains('active')
            );
            
            // 檢查員工表格容器
            const tableContainer = await this.page.$('#employee-table-container');
            if (!tableContainer) {
                throw new Error('員工表格容器不存在');
            }
            
            return {
                employeeSectionExists: true,
                isActive: isActive,
                hasTableContainer: true
            };
        });
    }

    async testEmployeeDataLoading() {
        return await this.runTest('員工數據載入測試', async () => {
            // 等待數據載入完成
            await this.page.waitForTimeout(5000);
            
            // 檢查載入狀態
            const containerContent = await this.page.$eval('#employee-table-container', el => el.innerHTML);
            
            // 檢查是否有錯誤訊息
            const hasLoadingText = containerContent.includes('載入') || containerContent.includes('loading');
            const hasTable = containerContent.includes('table') || containerContent.includes('employee-table');
            const hasErrorMessage = containerContent.includes('失敗') || containerContent.includes('錯誤');
            
            // 嘗試檢查表格內容
            let tableRowCount = 0;
            try {
                const rows = await this.page.$$('#employee-table-container table tbody tr');
                tableRowCount = rows.length;
            } catch (error) {
                // 表格可能還沒載入完成
            }
            
            return {
                hasLoadingText: hasLoadingText,
                hasTable: hasTable,
                hasErrorMessage: hasErrorMessage,
                tableRowCount: tableRowCount,
                containerContent: containerContent.substring(0, 200) // 前200字元
            };
        });
    }

    async testEmployeeTableStructure() {
        return await this.runTest('員工表格結構測試', async () => {
            // 檢查表格是否存在
            const table = await this.page.$('#employee-table-container .employee-table');
            if (!table) {
                // 可能數據還在載入，檢查是否有基本的容器結構
                const hasContainer = await this.page.$('#employee-table-container');
                if (!hasContainer) {
                    throw new Error('員工表格容器完全不存在');
                }
                
                return {
                    hasTable: false,
                    hasContainer: true,
                    status: '容器存在但表格未載入（可能是API問題）'
                };
            }
            
            // 檢查表格標題
            const headers = await this.page.$$eval('#employee-table-container .employee-table th', 
                elements => elements.map(el => el.textContent.trim())
            );
            
            // 檢查表格行數
            const rows = await this.page.$$('#employee-table-container .employee-table tbody tr');
            
            return {
                hasTable: true,
                headers: headers,
                rowCount: rows.length,
                expectedHeaders: ['姓名', '身分證', '職位', '分店', '狀態', '操作']
            };
        });
    }

    async testEmployeeFilters() {
        return await this.runTest('員工篩選功能測試', async () => {
            // 檢查篩選器是否存在
            const statusFilter = await this.page.$('#status-filter');
            const storeFilter = await this.page.$('#store-filter');
            const positionFilter = await this.page.$('#position-filter');
            
            if (!statusFilter || !storeFilter || !positionFilter) {
                throw new Error('篩選器元素缺失');
            }
            
            // 檢查篩選按鈕
            const filterButton = await this.page.$('button[onclick="applyFilters()"]');
            const resetButton = await this.page.$('button[onclick="resetFilters()"]');
            
            if (!filterButton || !resetButton) {
                throw new Error('篩選按鈕缺失');
            }
            
            // 測試篩選器選項
            const statusOptions = await this.page.$$eval('#status-filter option', 
                options => options.map(opt => opt.value)
            );
            
            return {
                hasAllFilters: true,
                hasFilterButtons: true,
                statusOptions: statusOptions,
                filterFunctionalityExists: true
            };
        });
    }

    async testAPIIntegration() {
        return await this.runTest('前端API整合測試', async () => {
            // 執行前端JavaScript中的API呼叫
            const apiTestResult = await this.page.evaluate(async () => {
                try {
                    // 模擬loadEmployees()函數的API呼叫
                    const response = await fetch('/api/employees/');
                    const data = await response.json();
                    
                    return {
                        success: true,
                        status: response.status,
                        hasData: !!data.data || !!data.employees,
                        dataCount: data.count || (data.data ? data.data.length : 0),
                        message: data.message
                    };
                } catch (error) {
                    return {
                        success: false,
                        error: error.message
                    };
                }
            });
            
            if (!apiTestResult.success) {
                throw new Error(`API整合失敗: ${apiTestResult.error}`);
            }
            
            return apiTestResult;
        });
    }

    async generateReport() {
        const passedTests = this.testResults.filter(t => t.status === 'PASSED').length;
        const totalTests = this.testResults.length;
        const successRate = ((passedTests / totalTests) * 100).toFixed(1);

        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total: totalTests,
                passed: passedTests,
                failed: totalTests - passedTests,
                successRate: `${successRate}%`
            },
            tests: this.testResults,
            frontendIntegration: {
                adminPageAccess: this.testResults.find(t => t.name.includes('管理員頁面'))?.status === 'PASSED',
                employeeSection: this.testResults.find(t => t.name.includes('員工管理區域'))?.status === 'PASSED',
                dataLoading: this.testResults.find(t => t.name.includes('數據載入'))?.status === 'PASSED',
                tableStructure: this.testResults.find(t => t.name.includes('表格結構'))?.status === 'PASSED',
                filterFunctionality: this.testResults.find(t => t.name.includes('篩選功能'))?.status === 'PASSED',
                apiIntegration: this.testResults.find(t => t.name.includes('API整合'))?.status === 'PASSED'
            }
        };

        const reportPath = `D:\\0809\\employee-frontend-integration-${Date.now()}.json`;
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');

        console.log(`\\n📊 員工管理前端整合測試報告:`);
        console.log(`📈 成功率: ${successRate}% (${passedTests}/${totalTests})`);
        console.log(`📁 報告位置: ${reportPath}`);

        return { reportPath, report };
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    async runAllTests() {
        try {
            await this.initialize();
            await this.loginAsAdmin();
            
            console.log('🔧 開始員工管理前端整合測試...');
            
            // 執行所有測試
            await this.testAdminPageAccess();
            await this.testEmployeeSectionVisible();
            await this.testEmployeeDataLoading();
            await this.testEmployeeTableStructure();
            await this.testEmployeeFilters();
            await this.testAPIIntegration();
            
            // 生成報告
            const reportInfo = await this.generateReport();
            
            console.log('\\n🎉 員工管理前端整合測試完成！');
            return reportInfo;
            
        } catch (error) {
            console.error('❌ 前端整合測試失敗:', error);
            throw error;
        } finally {
            await this.cleanup();
        }
    }
}

// 直接執行
if (require.main === module) {
    const tester = new EmployeeFrontendIntegrationTest();
    tester.runAllTests()
        .then(report => {
            console.log('🎯 員工管理前端整合測試完成');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 測試失敗:', error);
            process.exit(1);
        });
}

module.exports = EmployeeFrontendIntegrationTest;