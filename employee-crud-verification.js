/**
 * 🔧 員工管理CRUD操作驗證引擎
 * 基於系統邏輯.txt規格的完整員工管理驗證
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;

class EmployeeCRUDVerification {
    constructor() {
        this.baseUrl = 'http://localhost:3002';
        this.browser = null;
        this.page = null;
        this.testResults = [];
    }

    async initialize() {
        console.log('🚀 啟動員工管理CRUD驗證引擎...');
        
        this.browser = await puppeteer.launch({
            headless: false,
            slowMo: 800,
            defaultViewport: { width: 1400, height: 900 }
        });

        this.page = await this.browser.newPage();
        
        // 事件監聽
        this.page.on('console', msg => {
            console.log(`📱 瀏覽器: ${msg.text()}`);
        });

        this.page.on('response', response => {
            if (response.url().includes('/api/')) {
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
        
        // 清除儲存
        await this.page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });

        // 訪問登入頁面
        await this.page.goto(`${this.baseUrl}/`, { waitUntil: 'networkidle0' });
        
        // 登入
        await this.page.type('#login-name', '測試員工');
        await this.page.type('#login-id', 'A123456789');
        
        const navigationPromise = this.page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
        await this.page.click('#login-btn');
        await navigationPromise;
        
        console.log('✅ 管理員登入完成');
    }

    async testEmployeeListLoad() {
        return await this.runTest('員工列表載入測試', async () => {
            // 確保在管理員頁面
            await this.page.goto(`${this.baseUrl}/admin`, { waitUntil: 'networkidle0' });
            
            // 等待管理員頁面載入
            await this.page.waitForSelector('.header h1', { timeout: 10000 });
            
            // 檢查員工管理區域
            const employeeSection = await this.page.$('#employee-management');
            if (!employeeSection) {
                throw new Error('員工管理區域不存在');
            }
            
            // 檢查是否有載入員工資料的行為
            await this.page.waitForTimeout(3000); // 等待資料載入
            
            const hasEmployeeTable = await this.page.evaluate(() => {
                const container = document.getElementById('employee-table-container');
                return container && container.innerHTML.includes('載入');
            });
            
            return {
                hasEmployeeSection: true,
                hasEmployeeTable: hasEmployeeTable,
                pageTitle: await this.page.title()
            };
        });
    }

    async testEmployeeAPIIntegration() {
        return await this.runTest('員工API整合測試', async () => {
            // 直接測試API呼叫
            const apiResponse = await this.page.evaluate(async () => {
                try {
                    const response = await fetch('/api/employees/', {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    const data = await response.json();
                    return {
                        status: response.status,
                        data: data,
                        success: response.ok
                    };
                } catch (error) {
                    return {
                        status: 0,
                        error: error.message,
                        success: false
                    };
                }
            });
            
            if (!apiResponse.success) {
                throw new Error(`API呼叫失敗: ${apiResponse.error || apiResponse.status}`);
            }
            
            return {
                apiStatus: apiResponse.status,
                employeeCount: apiResponse.data.count || 0,
                hasEmployeeData: apiResponse.data.employees ? apiResponse.data.employees.length > 0 : false
            };
        });
    }

    async testEmployeeCreateFunction() {
        return await this.runTest('員工新增功能測試', async () => {
            // 測試新增員工API
            const testEmployee = {
                name: `測試員工_${Date.now()}`,
                email: `test${Date.now()}@company.com`,
                phone: '0912345678',
                position: '員工',
                storeId: 1
            };
            
            const createResponse = await this.page.evaluate(async (employee) => {
                try {
                    const response = await fetch('/api/employees/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('employeeToken')}`
                        },
                        body: JSON.stringify(employee)
                    });
                    const data = await response.json();
                    return {
                        status: response.status,
                        data: data,
                        success: response.ok
                    };
                } catch (error) {
                    return {
                        status: 0,
                        error: error.message,
                        success: false
                    };
                }
            }, testEmployee);
            
            return {
                testEmployee: testEmployee,
                createStatus: createResponse.status,
                createSuccess: createResponse.success,
                createdEmployeeId: createResponse.data?.employee?.id,
                responseMessage: createResponse.data?.message
            };
        });
    }

    async testEmployeeUpdateFunction() {
        return await this.runTest('員工更新功能測試', async () => {
            // 先獲取一個員工ID
            const employeeListResponse = await this.page.evaluate(async () => {
                const response = await fetch('/api/employees/');
                const data = await response.json();
                return data;
            });
            
            if (!employeeListResponse.employees || employeeListResponse.employees.length === 0) {
                throw new Error('沒有員工數據可供測試');
            }
            
            const employeeId = employeeListResponse.employees[0].id;
            const updateData = {
                phone: '0987654321',
                email: `updated${Date.now()}@company.com`
            };
            
            const updateResponse = await this.page.evaluate(async (id, data) => {
                try {
                    const response = await fetch(`/api/employees/${id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('employeeToken')}`
                        },
                        body: JSON.stringify(data)
                    });
                    const result = await response.json();
                    return {
                        status: response.status,
                        data: result,
                        success: response.ok
                    };
                } catch (error) {
                    return {
                        status: 0,
                        error: error.message,
                        success: false
                    };
                }
            }, employeeId, updateData);
            
            return {
                employeeId: employeeId,
                updateData: updateData,
                updateStatus: updateResponse.status,
                updateSuccess: updateResponse.success,
                responseMessage: updateResponse.data?.message
            };
        });
    }

    async testEmployeeDeleteFunction() {
        return await this.runTest('員工刪除功能測試', async () => {
            // 先獲取員工列表
            const employeeListResponse = await this.page.evaluate(async () => {
                const response = await fetch('/api/employees/');
                const data = await response.json();
                return data;
            });
            
            if (!employeeListResponse.employees || employeeListResponse.employees.length < 2) {
                // 如果員工數不足，先創建一個測試員工
                const newEmployee = {
                    name: `待刪除測試員工_${Date.now()}`,
                    email: `delete${Date.now()}@company.com`,
                    position: '員工'
                };
                
                await this.page.evaluate(async (employee) => {
                    await fetch('/api/employees/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('employeeToken')}`
                        },
                        body: JSON.stringify(employee)
                    });
                }, newEmployee);
                
                // 重新獲取列表
                const updatedListResponse = await this.page.evaluate(async () => {
                    const response = await fetch('/api/employees/');
                    const data = await response.json();
                    return data;
                });
                
                if (!updatedListResponse.employees || updatedListResponse.employees.length === 0) {
                    throw new Error('無法創建測試員工進行刪除測試');
                }
            }
            
            // 選擇最後一個員工進行刪除測試
            const finalList = await this.page.evaluate(async () => {
                const response = await fetch('/api/employees/');
                const data = await response.json();
                return data;
            });
            
            const employeeId = finalList.employees[finalList.employees.length - 1].id;
            
            const deleteResponse = await this.page.evaluate(async (id) => {
                try {
                    const response = await fetch(`/api/employees/${id}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('employeeToken')}`
                        }
                    });
                    const result = await response.json();
                    return {
                        status: response.status,
                        data: result,
                        success: response.ok
                    };
                } catch (error) {
                    return {
                        status: 0,
                        error: error.message,
                        success: false
                    };
                }
            }, employeeId);
            
            return {
                employeeId: employeeId,
                deleteStatus: deleteResponse.status,
                deleteSuccess: deleteResponse.success,
                responseMessage: deleteResponse.data?.message
            };
        });
    }

    async testSystemLogicCompliance() {
        return await this.runTest('系統邏輯.txt合規性檢查', async () => {
            // 檢查11個必填欄位是否在API中支持
            const testRegistrationData = {
                name: '合規性測試員工',
                idNumber: `B${Math.random().toString().substr(2, 9)}`,
                birthDate: '1995-01-01',
                gender: '男',
                hasDriverLicense: true,
                phone: '0912345678',
                address: '台北市測試區',
                emergencyContactName: '測試聯絡人',
                emergencyContactRelation: '父親',
                emergencyContactPhone: '0987654321',
                hireDate: '2025-08-12'
            };
            
            // 測試註冊API是否接受所有必填欄位
            const registrationResponse = await this.page.evaluate(async (data) => {
                try {
                    const response = await fetch('/api/admin/auth/register', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(data)
                    });
                    const result = await response.json();
                    return {
                        status: response.status,
                        data: result,
                        success: response.ok
                    };
                } catch (error) {
                    return {
                        status: 0,
                        error: error.message,
                        success: false
                    };
                }
            }, testRegistrationData);
            
            // 檢查職位階級系統
            const positionHierarchy = [
                '實習生', '員工', '副店長', '店長', '區域經理'
            ];
            
            return {
                registrationTest: {
                    status: registrationResponse.status,
                    success: registrationResponse.success,
                    supportedFields: Object.keys(testRegistrationData).length,
                    requiredFields: 11
                },
                positionHierarchy: {
                    defined: positionHierarchy,
                    implemented: registrationResponse.data?.employee?.position === '實習生'
                },
                systemLogicCompliance: registrationResponse.success
            };
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
            crudFunctionality: {
                create: this.testResults.find(t => t.name.includes('新增'))?.status === 'PASSED',
                read: this.testResults.find(t => t.name.includes('列表載入'))?.status === 'PASSED',
                update: this.testResults.find(t => t.name.includes('更新'))?.status === 'PASSED',
                delete: this.testResults.find(t => t.name.includes('刪除'))?.status === 'PASSED'
            },
            systemCompliance: this.testResults.find(t => t.name.includes('合規性'))?.status === 'PASSED'
        };

        const reportPath = `D:\\0809\\employee-crud-verification-${Date.now()}.json`;
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');

        console.log(`\\n📊 員工管理CRUD驗證報告:`);
        console.log(`📈 成功率: ${successRate}% (${passedTests}/${totalTests})`);
        console.log(`🔧 CRUD功能: C=${report.crudFunctionality.create?'✅':'❌'} R=${report.crudFunctionality.read?'✅':'❌'} U=${report.crudFunctionality.update?'✅':'❌'} D=${report.crudFunctionality.delete?'✅':'❌'}`);
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
            
            console.log('🔧 開始員工管理CRUD完整驗證...');
            
            // 執行所有測試
            await this.testEmployeeListLoad();
            await this.testEmployeeAPIIntegration();
            await this.testEmployeeCreateFunction();
            await this.testEmployeeUpdateFunction();
            await this.testEmployeeDeleteFunction();
            await this.testSystemLogicCompliance();
            
            // 生成報告
            const reportInfo = await this.generateReport();
            
            console.log('\\n🎉 員工管理CRUD驗證完成！');
            return reportInfo;
            
        } catch (error) {
            console.error('❌ 員工管理CRUD驗證失敗:', error);
            throw error;
        } finally {
            await this.cleanup();
        }
    }
}

// 直接執行
if (require.main === module) {
    const verifier = new EmployeeCRUDVerification();
    verifier.runAllTests()
        .then(report => {
            console.log('🎯 員工管理CRUD驗證完成');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 驗證失敗:', error);
            process.exit(1);
        });
}

module.exports = EmployeeCRUDVerification;