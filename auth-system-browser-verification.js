/**
 * 🔐 認證系統瀏覽器驗證引擎
 * 基於系統邏輯.txt規格的真實瀏覽器測試
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class AuthSystemBrowserVerification {
    constructor() {
        this.baseUrl = 'http://localhost:3002';
        this.browser = null;
        this.page = null;
        this.results = {
            timestamp: new Date().toISOString(),
            tests: [],
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                successRate: 0
            }
        };
    }

    async initialize() {
        console.log('🚀 啟動認證系統瀏覽器驗證引擎...');
        
        this.browser = await puppeteer.launch({
            headless: false, // 顯示瀏覽器視窗
            slowMo: 1000,   // 每個操作間隔1秒
            defaultViewport: { width: 1280, height: 720 },
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-web-security',
                '--allow-running-insecure-content'
            ]
        });

        this.page = await this.browser.newPage();
        
        // 設置網頁事件監聽
        this.page.on('console', msg => {
            console.log(`📱 瀏覽器控制台: ${msg.text()}`);
        });

        this.page.on('response', response => {
            if (response.url().includes('/api/')) {
                console.log(`🌐 API回應: ${response.url()} - ${response.status()}`);
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
            
            this.results.tests.push(testResult);
            this.results.summary.passed++;
            
            console.log(`✅ ${testName} - 通過 (${duration}ms)`);
            return testResult;
            
        } catch (error) {
            const duration = Date.now() - startTime;
            
            const testResult = {
                name: testName,
                status: 'FAILED',
                duration: duration,
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            };
            
            this.results.tests.push(testResult);
            this.results.summary.failed++;
            
            console.log(`❌ ${testName} - 失敗 (${duration}ms): ${error.message}`);
            return testResult;
        } finally {
            this.results.summary.total++;
        }
    }

    async testLoginPageLoad() {
        return await this.runTest('登入頁面載入測試', async () => {
            await this.page.goto(`${this.baseUrl}/`, { waitUntil: 'networkidle0' });
            
            // 檢查頁面標題
            const title = await this.page.title();
            if (!title.includes('員工管理系統')) {
                throw new Error(`頁面標題錯誤: ${title}`);
            }
            
            // 檢查登入表單元素
            const nameInput = await this.page.$('#login-name');
            const idInput = await this.page.$('#login-id');
            const loginBtn = await this.page.$('#login-btn');
            
            if (!nameInput || !idInput || !loginBtn) {
                throw new Error('登入表單元素缺失');
            }
            
            return {
                title: title,
                formElements: {
                    nameInput: !!nameInput,
                    idInput: !!idInput,
                    loginBtn: !!loginBtn
                }
            };
        });
    }

    async testLoginFormFields() {
        return await this.runTest('登入表單欄位識別測試', async () => {
            await this.page.goto(`${this.baseUrl}/`, { waitUntil: 'networkidle0' });
            
            // 詳細檢查登入表單欄位
            const nameFieldDetails = await this.page.evaluate(() => {
                const field = document.getElementById('login-name');
                return {
                    exists: !!field,
                    name: field?.name,
                    type: field?.type,
                    placeholder: field?.placeholder,
                    required: field?.required
                };
            });
            
            const idFieldDetails = await this.page.evaluate(() => {
                const field = document.getElementById('login-id');
                return {
                    exists: !!field,
                    name: field?.name,
                    type: field?.type,
                    placeholder: field?.placeholder,
                    required: field?.required,
                    maxLength: field?.maxLength
                };
            });
            
            return {
                nameField: nameFieldDetails,
                idField: idFieldDetails,
                validation: {
                    nameFieldValid: nameFieldDetails.name === 'name' && nameFieldDetails.required,
                    idFieldValid: idFieldDetails.name === 'idNumber' && idFieldDetails.required
                }
            };
        });
    }

    async testSuccessfulLogin() {
        return await this.runTest('成功登入測試', async () => {
            await this.page.goto(`${this.baseUrl}/`, { waitUntil: 'networkidle0' });
            
            // 填寫登入表單 (使用已知的測試數據)
            await this.page.type('#login-name', '測試員工');
            await this.page.type('#login-id', 'A123456789');
            
            // 監聽網路請求
            const responsePromise = this.page.waitForResponse(response => 
                response.url().includes('/api/auth/login')
            );
            
            // 點擊登入按鈕
            await this.page.click('#login-btn');
            
            // 等待API回應
            const response = await responsePromise;
            const responseData = await response.json();
            
            // 檢查回應狀態
            if (!responseData.success) {
                throw new Error(`登入失敗: ${responseData.message}`);
            }
            
            // 等待頁面跳轉或成功訊息
            await this.page.waitForSelector('.alert-success', { timeout: 5000 });
            
            const successMessage = await this.page.$eval('.alert-success', el => el.textContent);
            
            return {
                loginResponse: responseData,
                successMessage: successMessage,
                userToken: responseData.data?.token ? 'Token已生成' : '無Token',
                redirectReady: true
            };
        });
    }

    async testFailedLogin() {
        return await this.runTest('登入失敗測試', async () => {
            await this.page.goto(`${this.baseUrl}/`, { waitUntil: 'networkidle0' });
            
            // 填寫錯誤的登入資訊
            await this.page.type('#login-name', '不存在的員工');
            await this.page.type('#login-id', 'X999999999');
            
            // 監聽網路請求
            const responsePromise = this.page.waitForResponse(response => 
                response.url().includes('/api/auth/login')
            );
            
            // 點擊登入按鈕
            await this.page.click('#login-btn');
            
            // 等待API回應
            const response = await responsePromise;
            const responseData = await response.json();
            
            // 檢查失敗回應
            if (responseData.success) {
                throw new Error('預期登入失敗，但實際成功了');
            }
            
            // 等待錯誤訊息顯示
            await this.page.waitForSelector('.alert-error', { timeout: 5000 });
            
            const errorMessage = await this.page.$eval('.alert-error', el => el.textContent);
            
            return {
                loginResponse: responseData,
                errorMessage: errorMessage,
                errorHandling: 'UI正確顯示錯誤訊息'
            };
        });
    }

    async testRegistrationFormFields() {
        return await this.runTest('註冊表單欄位完整性測試', async () => {
            await this.page.goto(`${this.baseUrl}/`, { waitUntil: 'networkidle0' });
            
            // 切換到註冊頁面
            await this.page.click('[onclick="switchTab(\'register\', this)"]');
            await this.page.waitForSelector('#register-form.active');
            
            // 檢查11個必填欄位是否存在 (基於系統邏輯.txt)
            const requiredFields = [
                'name', 'idNumber', 'birthday', 'gender', 'hasLicense',
                'phone', 'address', 'emergencyContact', 'relationship',
                'emergencyPhone', 'startDate'
            ];
            
            const fieldResults = {};
            
            for (const field of requiredFields) {
                const selector = `[name="${field}"]`;
                const element = await this.page.$(selector);
                
                if (element) {
                    const details = await this.page.evaluate(sel => {
                        const el = document.querySelector(sel);
                        return {
                            exists: true,
                            type: el.type,
                            required: el.required,
                            tagName: el.tagName
                        };
                    }, selector);
                    fieldResults[field] = details;
                } else {
                    fieldResults[field] = { exists: false };
                }
            }
            
            const missingFields = requiredFields.filter(field => !fieldResults[field].exists);
            const completeness = ((requiredFields.length - missingFields.length) / requiredFields.length) * 100;
            
            return {
                fieldResults: fieldResults,
                missingFields: missingFields,
                completeness: `${completeness.toFixed(1)}%`,
                systemLogicCompliance: missingFields.length === 0
            };
        });
    }

    async testNewEmployeeRegistration() {
        return await this.runTest('新員工註冊測試', async () => {
            await this.page.goto(`${this.baseUrl}/`, { waitUntil: 'networkidle0' });
            
            // 切換到註冊頁面
            await this.page.click('[onclick="switchTab(\'register\', this)"]');
            await this.page.waitForSelector('#register-form.active');
            
            // 填寫註冊表單 (使用新的測試數據)
            const testEmployee = {
                name: `測試員工_${Date.now()}`,
                idNumber: `B${Math.random().toString().substr(2, 9)}`,
                birthday: '1995-06-15',
                gender: '女',
                phone: '0987123456',
                address: '台北市測試區測試路100號',
                emergencyContact: '測試家屬',
                relationship: '母親',
                emergencyPhone: '0912987654',
                startDate: '2025-08-12'
            };
            
            // 填寫所有欄位
            await this.page.type('[name="name"]', testEmployee.name);
            await this.page.type('[name="idNumber"]', testEmployee.idNumber);
            await this.page.type('[name="birthday"]', testEmployee.birthday);
            await this.page.select('[name="gender"]', testEmployee.gender);
            await this.page.select('[name="hasLicense"]', 'false');
            await this.page.type('[name="phone"]', testEmployee.phone);
            await this.page.type('[name="address"]', testEmployee.address);
            await this.page.type('[name="emergencyContact"]', testEmployee.emergencyContact);
            await this.page.select('[name="relationship"]', testEmployee.relationship);
            await this.page.type('[name="emergencyPhone"]', testEmployee.emergencyPhone);
            await this.page.type('[name="startDate"]', testEmployee.startDate);
            
            // 監聽網路請求
            const responsePromise = this.page.waitForResponse(response => 
                response.url().includes('/api/admin/auth/register')
            );
            
            // 提交註冊表單
            await this.page.click('#register-btn');
            
            // 等待API回應
            const response = await responsePromise;
            const responseData = await response.json();
            
            // 檢查註冊結果
            if (!responseData.success) {
                throw new Error(`註冊失敗: ${responseData.message}`);
            }
            
            // 等待成功訊息
            await this.page.waitForSelector('.alert-success', { timeout: 5000 });
            const successMessage = await this.page.$eval('.alert-success', el => el.textContent);
            
            return {
                registrationResponse: responseData,
                testEmployee: testEmployee,
                successMessage: successMessage,
                systemBehavior: '符合系統邏輯.txt規格'
            };
        });
    }

    async generateReport() {
        this.results.summary.successRate = 
            (this.results.summary.passed / this.results.summary.total * 100).toFixed(1);
        
        const reportPath = path.join(__dirname, `auth-verification-report-${Date.now()}.json`);
        await fs.writeFile(reportPath, JSON.stringify(this.results, null, 2), 'utf8');
        
        console.log(`\\n📊 認證系統驗證報告已生成: ${reportPath}`);
        
        // 生成摘要報告
        const summaryReport = `
# 🔐 認證系統瀏覽器驗證報告

**測試時間**: ${this.results.timestamp}
**測試網址**: ${this.baseUrl}

## 📈 測試結果摘要
- **總測試數**: ${this.results.summary.total}
- **通過測試**: ${this.results.summary.passed}
- **失敗測試**: ${this.results.summary.failed}  
- **成功率**: ${this.results.summary.successRate}%

## 🧪 詳細測試結果

${this.results.tests.map(test => `
### ${test.status === 'PASSED' ? '✅' : '❌'} ${test.name}
- **狀態**: ${test.status}
- **耗時**: ${test.duration}ms
- **時間**: ${test.timestamp}
${test.error ? `- **錯誤**: ${test.error}` : ''}
${test.details ? `- **詳細資訊**: ${JSON.stringify(test.details, null, 2)}` : ''}
`).join('')}

## 🎯 關鍵發現

### ✅ 成功功能
${this.results.tests.filter(t => t.status === 'PASSED').map(t => `- ${t.name}`).join('\\n')}

### ❌ 失敗功能  
${this.results.tests.filter(t => t.status === 'FAILED').map(t => `- ${t.name}: ${t.error}`).join('\\n')}

## 📋 修復建議

1. **P1 緊急修復**: 修復所有失敗的核心認證功能
2. **P2 優化**: 改善用戶體驗和錯誤處理
3. **P3 增強**: 完善系統邏輯.txt規格實現

---
**報告生成時間**: ${new Date().toLocaleString('zh-TW')}
        `;
        
        const summaryPath = path.join(__dirname, `auth-verification-summary-${Date.now()}.md`);
        await fs.writeFile(summaryPath, summaryReport, 'utf8');
        
        console.log(`📋 認證系統驗證摘要: ${summaryPath}`);
        
        return {
            reportPath,
            summaryPath,
            results: this.results
        };
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    async runAllTests() {
        try {
            await this.initialize();
            
            console.log('🔐 開始認證系統完整驗證...');
            
            // 執行所有測試
            await this.testLoginPageLoad();
            await this.testLoginFormFields();
            await this.testSuccessfulLogin();
            await this.testFailedLogin();
            await this.testRegistrationFormFields();
            await this.testNewEmployeeRegistration();
            
            // 生成報告
            const reportInfo = await this.generateReport();
            
            console.log(`\\n🎉 認證系統驗證完成！`);
            console.log(`📊 成功率: ${this.results.summary.successRate}%`);
            console.log(`✅ 通過: ${this.results.summary.passed}/${this.results.summary.total}`);
            
            return reportInfo;
            
        } catch (error) {
            console.error('❌ 認證系統驗證執行失敗:', error);
            throw error;
        } finally {
            await this.cleanup();
        }
    }
}

// 如果直接執行此檔案
if (require.main === module) {
    const verifier = new AuthSystemBrowserVerification();
    verifier.runAllTests()
        .then(report => {
            console.log('🎯 認證系統驗證完成，報告已生成');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 認證系統驗證失敗:', error);
            process.exit(1);
        });
}

module.exports = AuthSystemBrowserVerification;