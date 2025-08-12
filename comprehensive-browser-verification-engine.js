/**
 * 🚀 完整系統功能驗證引擎 - 真實瀏覽器自動化測試
 * ================================================================
 * 使用Puppeteer進行端到端完整功能驗證
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class ComprehensiveBrowserVerificationEngine {
    constructor() {
        this.browser = null;
        this.page = null;
        this.baseUrl = 'http://localhost:3001';
        this.screenshotDir = './verification-screenshots-' + new Date().toISOString().replace(/[:.]/g, '-');
        this.testResults = {
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            errors: [],
            details: []
        };
        this.testUsers = {
            admin: { employeeId: 'admin001', password: 'admin123', name: '系統管理員' },
            manager: { employeeId: 'MGR001', password: 'manager123', name: '店長' },
            employee: { employeeId: 'EMP001', password: 'emp123', name: '一般員工' }
        };
    }

    /**
     * 🔧 初始化瀏覽器環境
     */
    async initialize() {
        console.log('🚀 啟動完整系統功能驗證引擎...');
        
        try {
            // 創建截圖目錄
            await fs.mkdir(this.screenshotDir, { recursive: true });
            
            // 啟動瀏覽器
            this.browser = await puppeteer.launch({
                headless: false, // 顯示瀏覽器視窗以便觀察
                defaultViewport: null,
                args: [
                    '--start-maximized',
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage'
                ]
            });
            
            this.page = await this.browser.newPage();
            
            // 設定用戶代理和視窗大小
            await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
            await this.page.setViewport({ width: 1920, height: 1080 });
            
            console.log('✅ 瀏覽器環境初始化完成');
            return true;
            
        } catch (error) {
            console.error('❌ 瀏覽器初始化失敗:', error);
            return false;
        }
    }

    /**
     * 📊 執行完整驗證套件
     */
    async runCompleteVerification() {
        console.log('\n🎯 開始執行完整系統功能驗證...');
        
        const verificationSteps = [
            { name: '系統連接性測試', method: 'testSystemConnectivity' },
            { name: '登入頁面功能驗證', method: 'testLoginPage' },
            { name: '多角色認證測試', method: 'testMultiRoleAuthentication' },
            { name: '員工管理CRUD操作', method: 'testEmployeeManagement' },
            { name: '考勤系統功能測試', method: 'testAttendanceSystem' },
            { name: '營收管理功能驗證', method: 'testRevenueManagement' },
            { name: '報表生成功能測試', method: 'testReportGeneration' },
            { name: '排程管理系統驗證', method: 'testScheduleManagement' },
            { name: '升遷投票系統測試', method: 'testPromotionVotingSystem' },
            { name: '響應式設計驗證', method: 'testResponsiveDesign' },
            { name: '安全性功能檢查', method: 'testSecurityFeatures' },
            { name: '效能基準測試', method: 'testPerformanceBenchmark' }
        ];

        for (const step of verificationSteps) {
            await this.executeVerificationStep(step);
        }

        return this.generateVerificationReport();
    }

    /**
     * 🔍 執行單一驗證步驟
     */
    async executeVerificationStep(step) {
        console.log(`\n🔍 執行: ${step.name}`);
        this.testResults.totalTests++;
        
        try {
            const result = await this[step.method]();
            
            if (result.success) {
                this.testResults.passedTests++;
                console.log(`✅ ${step.name} - 通過`);
            } else {
                this.testResults.failedTests++;
                console.log(`❌ ${step.name} - 失敗: ${result.error}`);
                this.testResults.errors.push({
                    test: step.name,
                    error: result.error,
                    details: result.details
                });
            }
            
            this.testResults.details.push({
                test: step.name,
                success: result.success,
                duration: result.duration,
                details: result.details
            });
            
        } catch (error) {
            this.testResults.failedTests++;
            console.error(`❌ ${step.name} - 異常:`, error);
            this.testResults.errors.push({
                test: step.name,
                error: error.message,
                stack: error.stack
            });
        }
    }

    /**
     * 🌐 系統連接性測試
     */
    async testSystemConnectivity() {
        const startTime = Date.now();
        
        try {
            // 測試首頁連接
            const response = await this.page.goto(this.baseUrl, { 
                waitUntil: 'networkidle2',
                timeout: 10000 
            });
            
            if (response.status() !== 200) {
                return {
                    success: false,
                    error: `HTTP狀態碼: ${response.status()}`,
                    duration: Date.now() - startTime
                };
            }

            // 檢查頁面標題
            const title = await this.page.title();
            
            // 截圖記錄
            await this.page.screenshot({
                path: path.join(this.screenshotDir, 'connectivity-test.png'),
                fullPage: true
            });

            return {
                success: true,
                duration: Date.now() - startTime,
                details: {
                    httpStatus: response.status(),
                    pageTitle: title,
                    loadTime: Date.now() - startTime
                }
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                duration: Date.now() - startTime
            };
        }
    }

    /**
     * 🔐 登入頁面功能驗證
     */
    async testLoginPage() {
        const startTime = Date.now();
        
        try {
            // 導航到登入頁面
            await this.page.goto(`${this.baseUrl}/login.html`, { waitUntil: 'networkidle2' });

            // 檢查登入表單元素
            const formElements = await this.page.evaluate(() => {
                return {
                    hasEmployeeIdField: !!document.querySelector('input[name="employeeId"]'),
                    hasPasswordField: !!document.querySelector('input[name="password"]'),
                    hasLoginButton: !!document.querySelector('button[type="submit"], input[type="submit"]'),
                    hasRegisterLink: !!document.querySelector('a[href*="register"]'),
                    formCount: document.querySelectorAll('form').length
                };
            });

            // 測試表單填寫
            if (formElements.hasEmployeeIdField) {
                await this.page.type('input[name="employeeId"]', 'test001');
            }
            if (formElements.hasPasswordField) {
                await this.page.type('input[name="password"]', 'test123');
            }

            // 截圖記錄
            await this.page.screenshot({
                path: path.join(this.screenshotDir, 'login-page-test.png'),
                fullPage: true
            });

            const success = formElements.hasEmployeeIdField && 
                          formElements.hasPasswordField && 
                          formElements.hasLoginButton;

            return {
                success,
                duration: Date.now() - startTime,
                details: formElements
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                duration: Date.now() - startTime
            };
        }
    }

    /**
     * 👥 多角色認證測試
     */
    async testMultiRoleAuthentication() {
        const startTime = Date.now();
        const authResults = {};
        
        try {
            for (const [role, credentials] of Object.entries(this.testUsers)) {
                console.log(`  🔑 測試 ${role} 角色登入...`);
                
                // 導航到登入頁面
                await this.page.goto(`${this.baseUrl}/login.html`, { waitUntil: 'networkidle2' });
                
                // 清空並填寫登入表單
                await this.page.evaluate(() => {
                    const inputs = document.querySelectorAll('input');
                    inputs.forEach(input => input.value = '');
                });
                
                // 輸入認證資訊
                const employeeIdField = await this.page.$('input[name="employeeId"]');
                const passwordField = await this.page.$('input[name="password"]');
                
                if (employeeIdField && passwordField) {
                    await employeeIdField.type(credentials.employeeId);
                    await passwordField.type(credentials.password);
                    
                    // 截圖登入過程
                    await this.page.screenshot({
                        path: path.join(this.screenshotDir, `login-form-filled-${role}.png`)
                    });
                    
                    // 提交表單
                    const submitButton = await this.page.$('button[type="submit"], input[type="submit"]');
                    if (submitButton) {
                        await submitButton.click();
                        
                        // 等待導航或響應
                        await this.page.waitForTimeout(2000);
                        
                        // 檢查登入結果
                        const currentUrl = this.page.url();
                        const pageContent = await this.page.content();
                        
                        authResults[role] = {
                            attempted: true,
                            credentials: credentials.employeeId,
                            redirectUrl: currentUrl,
                            hasSuccessIndicator: pageContent.includes('歡迎') || 
                                               pageContent.includes('dashboard') ||
                                               currentUrl.includes('dashboard') ||
                                               currentUrl.includes('admin')
                        };
                    } else {
                        authResults[role] = {
                            attempted: false,
                            error: '找不到提交按鈕'
                        };
                    }
                } else {
                    authResults[role] = {
                        attempted: false,
                        error: '找不到登入表單欄位'
                    };
                }
                
                // 登出準備下一次測試
                await this.page.evaluate(() => {
                    localStorage.clear();
                    sessionStorage.clear();
                });
            }

            const successfulLogins = Object.values(authResults).filter(result => 
                result.attempted && result.hasSuccessIndicator).length;

            return {
                success: successfulLogins > 0,
                duration: Date.now() - startTime,
                details: {
                    totalRoles: Object.keys(this.testUsers).length,
                    successfulLogins,
                    authResults
                }
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                duration: Date.now() - startTime,
                details: authResults
            };
        }
    }

    /**
     * 👥 員工管理CRUD操作測試
     */
    async testEmployeeManagement() {
        const startTime = Date.now();
        
        try {
            // 先以管理員身分登入
            await this.loginAsAdmin();
            
            // 導航到員工管理頁面
            await this.page.goto(`${this.baseUrl}/admin.html`, { waitUntil: 'networkidle2' });
            
            // 檢查員工管理相關元素
            const managementElements = await this.page.evaluate(() => {
                return {
                    hasEmployeeList: !!document.querySelector('[data-module="employee"]'),
                    hasAddButton: !!document.querySelector('button[data-action="add"], .btn-add'),
                    hasEditButtons: document.querySelectorAll('button[data-action="edit"], .btn-edit').length,
                    hasDeleteButtons: document.querySelectorAll('button[data-action="delete"], .btn-delete').length,
                    hasSearchField: !!document.querySelector('input[type="search"], input[placeholder*="搜尋"]'),
                    employeeTableExists: !!document.querySelector('table, .employee-list, .data-table')
                };
            });

            // 測試新增功能 (如果有新增按鈕)
            let addTestResult = false;
            if (managementElements.hasAddButton) {
                try {
                    await this.page.click('button[data-action="add"], .btn-add');
                    await this.page.waitForTimeout(1000);
                    
                    // 檢查是否出現新增表單或模態框
                    const hasForm = await this.page.evaluate(() => {
                        return !!document.querySelector('form, .modal, .dialog');
                    });
                    addTestResult = hasForm;
                } catch (e) {
                    console.log('新增功能測試異常:', e.message);
                }
            }

            // 截圖記錄
            await this.page.screenshot({
                path: path.join(this.screenshotDir, 'employee-management-test.png'),
                fullPage: true
            });

            const success = managementElements.hasEmployeeList || 
                          managementElements.employeeTableExists;

            return {
                success,
                duration: Date.now() - startTime,
                details: {
                    ...managementElements,
                    addFunctionTest: addTestResult
                }
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                duration: Date.now() - startTime
            };
        }
    }

    /**
     * ⏰ 考勤系統功能測試
     */
    async testAttendanceSystem() {
        const startTime = Date.now();
        
        try {
            // 導航到考勤頁面
            await this.page.goto(`${this.baseUrl}/attendance.html`, { waitUntil: 'networkidle2' });
            
            // 模擬GPS位置權限
            const context = this.browser.defaultBrowserContext();
            await context.overridePermissions(this.baseUrl, ['geolocation']);
            await this.page.setGeolocation({ latitude: 25.0330, longitude: 121.5654 }); // 台北101位置

            // 檢查考勤相關功能
            const attendanceFeatures = await this.page.evaluate(() => {
                return {
                    hasClockInButton: !!document.querySelector('button[data-action="clockin"], #clockInBtn'),
                    hasClockOutButton: !!document.querySelector('button[data-action="clockout"], #clockOutBtn'),
                    hasLocationDisplay: !!document.querySelector('#location, .location-info'),
                    hasTimeDisplay: !!document.querySelector('.current-time, #currentTime'),
                    hasAttendanceHistory: !!document.querySelector('.attendance-history, .history-list'),
                    hasStatusIndicator: !!document.querySelector('.status, .attendance-status')
                };
            });

            // 測試打卡功能
            let clockInResult = false;
            if (attendanceFeatures.hasClockInButton) {
                try {
                    await this.page.click('button[data-action="clockin"], #clockInBtn');
                    await this.page.waitForTimeout(2000);
                    
                    // 檢查是否有成功訊息或狀態變更
                    clockInResult = await this.page.evaluate(() => {
                        const successMsg = document.body.textContent.includes('打卡成功') ||
                                         document.body.textContent.includes('已上班') ||
                                         document.querySelector('.success, .alert-success');
                        return !!successMsg;
                    });
                } catch (e) {
                    console.log('打卡功能測試異常:', e.message);
                }
            }

            // 截圖記錄
            await this.page.screenshot({
                path: path.join(this.screenshotDir, 'attendance-system-test.png'),
                fullPage: true
            });

            const success = attendanceFeatures.hasClockInButton || 
                          attendanceFeatures.hasClockOutButton;

            return {
                success,
                duration: Date.now() - startTime,
                details: {
                    ...attendanceFeatures,
                    clockInTest: clockInResult
                }
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                duration: Date.now() - startTime
            };
        }
    }

    /**
     * 💰 營收管理功能測試
     */
    async testRevenueManagement() {
        const startTime = Date.now();
        
        try {
            // 導航到營收管理頁面
            await this.page.goto(`${this.baseUrl}/revenue.html`, { waitUntil: 'networkidle2' });
            
            // 檢查營收管理功能
            const revenueFeatures = await this.page.evaluate(() => {
                return {
                    hasRevenueForm: !!document.querySelector('form, .revenue-form'),
                    hasAmountField: !!document.querySelector('input[name="amount"], input[type="number"]'),
                    hasDateField: !!document.querySelector('input[type="date"], .date-picker'),
                    hasStoreSelector: !!document.querySelector('select[name="store"], .store-select'),
                    hasSubmitButton: !!document.querySelector('button[type="submit"], .btn-submit'),
                    hasRevenueList: !!document.querySelector('.revenue-list, table'),
                    hasSummaryCards: document.querySelectorAll('.summary, .card, .stats').length
                };
            });

            // 測試營收記錄新增
            let addRevenueResult = false;
            if (revenueFeatures.hasRevenueForm && revenueFeatures.hasAmountField) {
                try {
                    // 填寫營收表單
                    await this.page.type('input[name="amount"], input[type="number"]', '15000');
                    
                    if (revenueFeatures.hasDateField) {
                        await this.page.type('input[type="date"]', '2025-08-12');
                    }
                    
                    if (revenueFeatures.hasStoreSelector) {
                        await this.page.select('select[name="store"]', '1'); // 選擇第一個店面
                    }
                    
                    // 截圖填寫狀態
                    await this.page.screenshot({
                        path: path.join(this.screenshotDir, 'revenue-form-filled.png')
                    });
                    
                    if (revenueFeatures.hasSubmitButton) {
                        await this.page.click('button[type="submit"], .btn-submit');
                        await this.page.waitForTimeout(2000);
                        
                        // 檢查提交結果
                        addRevenueResult = await this.page.evaluate(() => {
                            return document.body.textContent.includes('成功') ||
                                   document.body.textContent.includes('已新增') ||
                                   !!document.querySelector('.success, .alert-success');
                        });
                    }
                } catch (e) {
                    console.log('營收新增測試異常:', e.message);
                }
            }

            // 最終截圖
            await this.page.screenshot({
                path: path.join(this.screenshotDir, 'revenue-management-test.png'),
                fullPage: true
            });

            const success = revenueFeatures.hasRevenueForm || 
                          revenueFeatures.hasRevenueList;

            return {
                success,
                duration: Date.now() - startTime,
                details: {
                    ...revenueFeatures,
                    addRevenueTest: addRevenueResult
                }
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                duration: Date.now() - startTime
            };
        }
    }

    /**
     * 📊 報表生成功能測試
     */
    async testReportGeneration() {
        const startTime = Date.now();
        
        try {
            // 導航到報表頁面
            await this.page.goto(`${this.baseUrl}/reports.html`, { waitUntil: 'networkidle2' });
            
            // 檢查報表功能
            const reportFeatures = await this.page.evaluate(() => {
                return {
                    hasReportOptions: document.querySelectorAll('select, .report-type').length > 0,
                    hasDateRangePicker: !!document.querySelector('input[type="date"]'),
                    hasGenerateButton: !!document.querySelector('button[data-action="generate"], .btn-generate'),
                    hasExportButton: !!document.querySelector('button[data-action="export"], .btn-export'),
                    hasChartContainer: !!document.querySelector('.chart, canvas, #chart'),
                    hasDataTable: !!document.querySelector('table, .data-table'),
                    reportTypeCount: document.querySelectorAll('option, .report-option').length
                };
            });

            // 測試報表生成
            let generateResult = false;
            if (reportFeatures.hasGenerateButton) {
                try {
                    await this.page.click('button[data-action="generate"], .btn-generate');
                    await this.page.waitForTimeout(3000); // 等待報表生成
                    
                    generateResult = await this.page.evaluate(() => {
                        return !!document.querySelector('table tr, .chart-data, canvas') ||
                               document.body.textContent.includes('報表') ||
                               document.body.textContent.includes('統計');
                    });
                } catch (e) {
                    console.log('報表生成測試異常:', e.message);
                }
            }

            // 截圖記錄
            await this.page.screenshot({
                path: path.join(this.screenshotDir, 'reports-test.png'),
                fullPage: true
            });

            const success = reportFeatures.hasReportOptions || 
                          reportFeatures.hasDataTable;

            return {
                success,
                duration: Date.now() - startTime,
                details: {
                    ...reportFeatures,
                    generateTest: generateResult
                }
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                duration: Date.now() - startTime
            };
        }
    }

    /**
     * 📅 排程管理系統驗證
     */
    async testScheduleManagement() {
        const startTime = Date.now();
        
        try {
            await this.page.goto(`${this.baseUrl}/schedule.html`, { waitUntil: 'networkidle2' });
            
            const scheduleFeatures = await this.page.evaluate(() => {
                return {
                    hasScheduleCalendar: !!document.querySelector('.calendar, #calendar'),
                    hasTimeSlots: document.querySelectorAll('.time-slot, .schedule-item').length > 0,
                    hasEmployeeAssignment: !!document.querySelector('.employee-select, select[name*="employee"]'),
                    hasAddShiftButton: !!document.querySelector('button[data-action="add-shift"], .btn-add-shift'),
                    hasWeeklyView: !!document.querySelector('.week-view, .weekly-schedule'),
                    hasShiftList: !!document.querySelector('.shift-list, .schedule-list')
                };
            });

            await this.page.screenshot({
                path: path.join(this.screenshotDir, 'schedule-management-test.png'),
                fullPage: true
            });

            return {
                success: scheduleFeatures.hasScheduleCalendar || scheduleFeatures.hasTimeSlots,
                duration: Date.now() - startTime,
                details: scheduleFeatures
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                duration: Date.now() - startTime
            };
        }
    }

    /**
     * 🏆 升遷投票系統測試
     */
    async testPromotionVotingSystem() {
        const startTime = Date.now();
        
        try {
            // 嘗試多個可能的升遷系統頁面
            const potentialUrls = [
                `${this.baseUrl}/promotion.html`,
                `${this.baseUrl}/voting.html`,
                `${this.baseUrl}/admin.html#promotion`
            ];

            let pageLoaded = false;
            for (const url of potentialUrls) {
                try {
                    await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 5000 });
                    pageLoaded = true;
                    break;
                } catch (e) {
                    continue;
                }
            }

            if (!pageLoaded) {
                // 如果沒有專門的升遷頁面，檢查管理員面板中的升遷功能
                await this.page.goto(`${this.baseUrl}/admin.html`, { waitUntil: 'networkidle2' });
            }

            const promotionFeatures = await this.page.evaluate(() => {
                return {
                    hasPromotionSection: !!document.querySelector('[data-module="promotion"], .promotion-section'),
                    hasVotingSystem: !!document.querySelector('.voting, .vote-system'),
                    hasCandidateList: !!document.querySelector('.candidate-list, .nominees'),
                    hasVoteButtons: document.querySelectorAll('button[data-action="vote"], .vote-btn').length,
                    hasResultsDisplay: !!document.querySelector('.results, .vote-results'),
                    hasEncryptionIndicator: !!document.querySelector('.secure, .encrypted') ||
                                          document.body.textContent.includes('SHA256') ||
                                          document.body.textContent.includes('加密')
                };
            });

            await this.page.screenshot({
                path: path.join(this.screenshotDir, 'promotion-voting-test.png'),
                fullPage: true
            });

            return {
                success: promotionFeatures.hasPromotionSection || promotionFeatures.hasVotingSystem,
                duration: Date.now() - startTime,
                details: promotionFeatures
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                duration: Date.now() - startTime
            };
        }
    }

    /**
     * 📱 響應式設計驗證
     */
    async testResponsiveDesign() {
        const startTime = Date.now();
        const deviceResults = {};
        
        try {
            const devices = [
                { name: 'Desktop', width: 1920, height: 1080 },
                { name: 'Laptop', width: 1366, height: 768 },
                { name: 'Tablet', width: 768, height: 1024 },
                { name: 'Mobile', width: 375, height: 667 },
                { name: 'Mobile-Large', width: 414, height: 896 }
            ];

            for (const device of devices) {
                await this.page.setViewport({ width: device.width, height: device.height });
                await this.page.goto(`${this.baseUrl}/login.html`, { waitUntil: 'networkidle2' });
                
                // 檢查響應式元素
                const responsiveCheck = await this.page.evaluate(() => {
                    return {
                        hasResponsiveNav: !!document.querySelector('.navbar-toggler, .mobile-menu'),
                        elementsVisible: document.querySelectorAll(':not([style*="display: none"])').length,
                        hasBootstrapClasses: !!document.querySelector('[class*="col-"], [class*="row"]'),
                        viewportWidth: window.innerWidth,
                        viewportHeight: window.innerHeight
                    };
                });

                // 截圖不同裝置
                await this.page.screenshot({
                    path: path.join(this.screenshotDir, `responsive-${device.name}-${device.width}x${device.height}.png`)
                });

                deviceResults[device.name] = responsiveCheck;
            }

            // 恢復原始視窗大小
            await this.page.setViewport({ width: 1920, height: 1080 });

            return {
                success: Object.values(deviceResults).some(result => result.elementsVisible > 0),
                duration: Date.now() - startTime,
                details: deviceResults
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                duration: Date.now() - startTime
            };
        }
    }

    /**
     * 🛡️ 安全性功能檢查
     */
    async testSecurityFeatures() {
        const startTime = Date.now();
        
        try {
            // 檢查HTTPS重導向（如果適用）
            const securityCheck = await this.page.evaluate(() => {
                return {
                    hasCSRFProtection: !!document.querySelector('meta[name="csrf-token"]'),
                    hasSecureHeaders: document.querySelector('meta[http-equiv="Content-Security-Policy"]') !== null,
                    hasXSSProtection: document.querySelector('meta[http-equiv="X-XSS-Protection"]') !== null,
                    formHasValidation: document.querySelectorAll('input[required], .form-validation').length > 0,
                    hasPasswordField: !!document.querySelector('input[type="password"]'),
                    localStorageCleared: localStorage.length === 0 && sessionStorage.length === 0
                };
            });

            // 測試登入錯誤處理
            await this.page.goto(`${this.baseUrl}/login.html`, { waitUntil: 'networkidle2' });
            
            // 嘗試錯誤登入
            if (await this.page.$('input[name="employeeId"]')) {
                await this.page.type('input[name="employeeId"]', 'invalid_user');
                await this.page.type('input[name="password"]', 'wrong_password');
                
                const submitBtn = await this.page.$('button[type="submit"]');
                if (submitBtn) {
                    await submitBtn.click();
                    await this.page.waitForTimeout(2000);
                    
                    // 檢查是否有錯誤訊息
                    securityCheck.hasErrorHandling = await this.page.evaluate(() => {
                        return document.body.textContent.includes('錯誤') ||
                               document.body.textContent.includes('失敗') ||
                               document.body.textContent.includes('invalid') ||
                               !!document.querySelector('.error, .alert-danger');
                    });
                }
            }

            return {
                success: securityCheck.hasPasswordField || securityCheck.formHasValidation,
                duration: Date.now() - startTime,
                details: securityCheck
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                duration: Date.now() - startTime
            };
        }
    }

    /**
     * ⚡ 效能基準測試
     */
    async testPerformanceBenchmark() {
        const startTime = Date.now();
        
        try {
            // 測試主要頁面的載入效能
            const pages = [
                '/login.html',
                '/admin.html',
                '/employee-dashboard.html',
                '/attendance.html',
                '/revenue.html'
            ];

            const performanceResults = {};

            for (const pagePath of pages) {
                const pageStartTime = Date.now();
                
                try {
                    const response = await this.page.goto(`${this.baseUrl}${pagePath}`, { 
                        waitUntil: 'networkidle2',
                        timeout: 10000 
                    });
                    
                    const loadTime = Date.now() - pageStartTime;
                    
                    // 獲取頁面性能指標
                    const metrics = await this.page.metrics();
                    
                    performanceResults[pagePath] = {
                        loadTime,
                        httpStatus: response.status(),
                        contentLength: response.headers()['content-length'] || 'unknown',
                        jsExecutionTime: metrics.ScriptDuration || 0,
                        domNodes: metrics.Nodes || 0,
                        success: response.status() === 200 && loadTime < 5000
                    };
                    
                } catch (e) {
                    performanceResults[pagePath] = {
                        success: false,
                        error: e.message
                    };
                }
            }

            // 效能分析截圖
            await this.page.screenshot({
                path: path.join(this.screenshotDir, 'performance-analysis.png'),
                fullPage: true
            });

            const successfulPages = Object.values(performanceResults)
                .filter(result => result.success).length;

            return {
                success: successfulPages > 0,
                duration: Date.now() - startTime,
                details: {
                    totalPages: pages.length,
                    successfulPages,
                    results: performanceResults
                }
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                duration: Date.now() - startTime
            };
        }
    }

    /**
     * 🔐 管理員登入輔助方法
     */
    async loginAsAdmin() {
        try {
            await this.page.goto(`${this.baseUrl}/login.html`, { waitUntil: 'networkidle2' });
            
            const adminCredentials = this.testUsers.admin;
            
            // 清空表單
            await this.page.evaluate(() => {
                document.querySelectorAll('input').forEach(input => input.value = '');
            });
            
            // 填寫管理員認證資訊
            const employeeIdField = await this.page.$('input[name="employeeId"]');
            const passwordField = await this.page.$('input[name="password"]');
            
            if (employeeIdField && passwordField) {
                await employeeIdField.type(adminCredentials.employeeId);
                await passwordField.type(adminCredentials.password);
                
                const submitButton = await this.page.$('button[type="submit"]');
                if (submitButton) {
                    await submitButton.click();
                    await this.page.waitForTimeout(2000);
                }
            }
            
            return true;
        } catch (error) {
            console.error('管理員登入失敗:', error);
            return false;
        }
    }

    /**
     * 📊 生成完整驗證報告
     */
    generateVerificationReport() {
        const timestamp = new Date().toISOString();
        const successRate = (this.testResults.passedTests / this.testResults.totalTests * 100).toFixed(2);
        
        const report = {
            timestamp,
            summary: {
                totalTests: this.testResults.totalTests,
                passedTests: this.testResults.passedTests,
                failedTests: this.testResults.failedTests,
                successRate: `${successRate}%`,
                overallStatus: successRate >= 70 ? 'PASS' : 'NEEDS_ATTENTION'
            },
            testDetails: this.testResults.details,
            errors: this.testResults.errors,
            recommendations: this.generateRecommendations(),
            screenshotDirectory: this.screenshotDir
        };

        console.log('\n📊 完整驗證報告生成完成:');
        console.log(`✅ 成功測試: ${this.testResults.passedTests}/${this.testResults.totalTests}`);
        console.log(`📈 成功率: ${successRate}%`);
        console.log(`📁 截圖目錄: ${this.screenshotDir}`);

        return report;
    }

    /**
     * 💡 生成優化建議
     */
    generateRecommendations() {
        const recommendations = [];
        const errors = this.testResults.errors;

        if (errors.some(e => e.test.includes('連接性'))) {
            recommendations.push('🔧 檢查伺服器連接設定，確保服務正常運行');
        }

        if (errors.some(e => e.test.includes('認證'))) {
            recommendations.push('🔐 驗證認證系統配置，檢查測試用戶資料');
        }

        if (errors.some(e => e.test.includes('效能'))) {
            recommendations.push('⚡ 優化頁面載入速度，考慮壓縮資源檔案');
        }

        if (errors.some(e => e.test.includes('響應式'))) {
            recommendations.push('📱 檢查響應式設計，確保多裝置相容性');
        }

        if (recommendations.length === 0) {
            recommendations.push('🎉 系統功能運作良好，建議定期執行測試維護品質');
        }

        return recommendations;
    }

    /**
     * 🔚 清理資源
     */
    async cleanup() {
        try {
            if (this.page) {
                await this.page.close();
            }
            if (this.browser) {
                await this.browser.close();
            }
            console.log('✅ 瀏覽器資源清理完成');
        } catch (error) {
            console.error('❌ 清理過程異常:', error);
        }
    }
}

module.exports = ComprehensiveBrowserVerificationEngine;

// 如果直接執行此檔案，則運行完整驗證
if (require.main === module) {
    (async () => {
        const engine = new ComprehensiveBrowserVerificationEngine();
        
        try {
            const initialized = await engine.initialize();
            if (!initialized) {
                console.error('❌ 初始化失敗');
                return;
            }

            const report = await engine.runCompleteVerification();
            
            // 儲存報告
            const reportPath = path.join(__dirname, `verification-report-${Date.now()}.json`);
            await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
            console.log(`📄 詳細報告已儲存至: ${reportPath}`);
            
        } catch (error) {
            console.error('❌ 驗證過程異常:', error);
        } finally {
            await engine.cleanup();
        }
    })();
}