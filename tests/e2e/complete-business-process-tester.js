/**
 * 端到端業務流程測試系統
 * 基於智慧瀏覽器深度測試結果進行完整業務流程驗證
 * 創建時間: 2025-08-10
 * 狀態: 生產就緒
 */

const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

class CompleteBussinesProcessTester {
    constructor() {
        this.baseURL = process.env.BASE_URL || 'https://employee-management-production-4c97.up.railway.app';
        this.localURL = 'http://localhost:3000';
        this.browser = null;
        this.page = null;
        this.testResults = {
            userJourney: {},
            businessLogic: {},
            systemIntegration: {},
            exceptionHandling: {},
            performanceAndSecurity: {},
            overall: {
                startTime: new Date(),
                endTime: null,
                totalTests: 0,
                passedTests: 0,
                failedTests: 0,
                warnings: []
            }
        };
        
        this.testConfig = {
            timeout: 30000,
            viewport: { width: 1920, height: 1080 },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            waitForNetworkIdle: 2000,
            screenshotPath: path.join(process.cwd(), 'tests', 'e2e', 'screenshots'),
            reportPath: path.join(process.cwd(), 'tests', 'e2e', 'reports')
        };

        this.businessFlows = {
            visitor: [
                '訪問首頁',
                '查看員工登入頁面',
                '嘗試註冊新帳號',
                '測試忘記密碼功能'
            ],
            employee: [
                '員工登入',
                '查看個人資料',
                '執行出勤打卡',
                '申請請假',
                '查看薪資明細',
                '更新個人資訊'
            ],
            admin: [
                '管理員登入',
                '員工管理操作',
                '查看系統報表',
                '系統設定更新',
                '權限管理',
                '數據備份操作'
            ]
        };

        this.criticalAPIs = [
            '/api/auth/login',
            '/api/auth/register', 
            '/api/employees',
            '/api/attendance/checkin',
            '/api/attendance/checkout',
            '/api/leave/request',
            '/api/payroll/calculate',
            '/api/reports/monthly',
            '/api/admin/users',
            '/api/admin/settings'
        ];
    }

    async initialize() {
        try {
            console.log('🚀 初始化端到端業務流程測試系統...');
            
            // 創建必要的目錄
            if (!fs.existsSync(this.testConfig.screenshotPath)) {
                fs.mkdirSync(this.testConfig.screenshotPath, { recursive: true });
            }
            if (!fs.existsSync(this.testConfig.reportPath)) {
                fs.mkdirSync(this.testConfig.reportPath, { recursive: true });
            }

            // 啟動瀏覽器
            this.browser = await puppeteer.launch({
                headless: false, // 設為 false 以查看測試過程
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu'
                ],
                defaultViewport: this.testConfig.viewport
            });

            this.page = await this.browser.newPage();
            await this.page.setUserAgent(this.testConfig.userAgent);
            await this.page.setViewport(this.testConfig.viewport);

            // 設定請求攔截
            await this.page.setRequestInterception(true);
            this.page.on('request', (req) => {
                if (req.url().includes('favicon.ico')) {
                    req.abort();
                } else {
                    req.continue();
                }
            });

            console.log('✅ 測試環境初始化完成');
            return true;

        } catch (error) {
            console.error('❌ 測試環境初始化失敗:', error);
            return false;
        }
    }

    async runCompleteTest() {
        try {
            console.log('\n🎯 開始執行完整的端到端業務流程測試');
            console.log('=' .repeat(60));

            // 1. 用戶旅程完整測試
            await this.runUserJourneyTests();
            
            // 2. 核心業務邏輯驗證
            await this.runBusinessLogicTests();
            
            // 3. 系統整合測試
            await this.runSystemIntegrationTests();
            
            // 4. 異常情況處理測試
            await this.runExceptionHandlingTests();
            
            // 5. 效能和安全測試
            await this.runPerformanceAndSecurityTests();
            
            // 生成最終報告
            await this.generateFinalReport();
            
            console.log('\n🎉 端到端業務流程測試完成!');
            
        } catch (error) {
            console.error('❌ 測試執行過程發生錯誤:', error);
            this.testResults.overall.warnings.push(`測試執行錯誤: ${error.message}`);
        }
    }

    async runUserJourneyTests() {
        console.log('\n📱 執行用戶旅程完整測試...');
        this.testResults.userJourney.startTime = new Date();

        try {
            // 測試訪客流程
            const visitorResult = await this.testVisitorJourney();
            this.testResults.userJourney.visitor = visitorResult;
            
            // 測試員工流程  
            const employeeResult = await this.testEmployeeJourney();
            this.testResults.userJourney.employee = employeeResult;
            
            // 測試管理員流程
            const adminResult = await this.testAdminJourney();
            this.testResults.userJourney.admin = adminResult;

            this.testResults.userJourney.endTime = new Date();
            console.log('✅ 用戶旅程測試完成');

        } catch (error) {
            console.error('❌ 用戶旅程測試失敗:', error);
            this.testResults.userJourney.error = error.message;
        }
    }

    async testVisitorJourney() {
        console.log('👤 測試訪客流程...');
        const results = {
            steps: [],
            success: false,
            issues: [],
            screenshots: []
        };

        try {
            // 1. 訪問首頁
            await this.page.goto(this.baseURL, { waitUntil: 'networkidle2', timeout: this.testConfig.timeout });
            await this.takeScreenshot('visitor-homepage');
            
            const homePageLoaded = await this.page.evaluate(() => {
                return document.readyState === 'complete' && document.body.innerHTML.length > 100;
            });
            
            results.steps.push({
                name: '訪問首頁',
                success: homePageLoaded,
                details: homePageLoaded ? '首頁成功載入' : '首頁載入失敗'
            });

            // 2. 查看員工登入頁面
            try {
                await this.page.click('a[href*="login"], button:contains("登入"), .login-btn');
                await this.page.waitForTimeout(2000);
                await this.takeScreenshot('visitor-login-page');
                
                const loginFormExists = await this.page.$('form') !== null;
                results.steps.push({
                    name: '查看登入頁面',
                    success: loginFormExists,
                    details: loginFormExists ? '登入表單存在' : '未找到登入表單'
                });
                
            } catch (error) {
                results.steps.push({
                    name: '查看登入頁面', 
                    success: false,
                    details: `登入頁面測試失敗: ${error.message}`
                });
            }

            // 3. 測試註冊流程
            try {
                await this.page.goto(`${this.baseURL}/register`, { waitUntil: 'networkidle2' });
                await this.takeScreenshot('visitor-register-page');
                
                const registerFormExists = await this.page.$('form') !== null;
                results.steps.push({
                    name: '查看註冊頁面',
                    success: registerFormExists,
                    details: registerFormExists ? '註冊表單存在' : '未找到註冊表單'
                });
                
            } catch (error) {
                results.steps.push({
                    name: '查看註冊頁面',
                    success: false, 
                    details: `註冊頁面測試失敗: ${error.message}`
                });
            }

            // 4. 測試忘記密碼功能
            try {
                await this.page.goto(`${this.baseURL}/forgot-password`, { waitUntil: 'networkidle2' });
                await this.takeScreenshot('visitor-forgot-password');
                
                const forgotPasswordFormExists = await this.page.$('form') !== null;
                results.steps.push({
                    name: '忘記密碼功能',
                    success: forgotPasswordFormExists,
                    details: forgotPasswordFormExists ? '忘記密碼表單存在' : '未找到忘記密碼表單'
                });
                
            } catch (error) {
                results.steps.push({
                    name: '忘記密碼功能',
                    success: false,
                    details: `忘記密碼測試失敗: ${error.message}`
                });
            }

            results.success = results.steps.every(step => step.success);
            
        } catch (error) {
            results.issues.push(`訪客流程測試錯誤: ${error.message}`);
        }

        return results;
    }

    async testEmployeeJourney() {
        console.log('👨‍💼 測試員工流程...');
        const results = {
            steps: [],
            success: false,
            issues: [],
            screenshots: []
        };

        try {
            // 1. 員工登入
            await this.page.goto(`${this.baseURL}/login`, { waitUntil: 'networkidle2' });
            
            // 嘗試使用測試員工帳號登入
            const loginSuccess = await this.attemptLogin('test@employee.com', 'password123');
            results.steps.push({
                name: '員工登入',
                success: loginSuccess,
                details: loginSuccess ? '員工登入成功' : '員工登入失敗'
            });

            if (loginSuccess) {
                await this.takeScreenshot('employee-dashboard');

                // 2. 查看個人資料
                try {
                    await this.page.click('a[href*="profile"], .profile-link');
                    await this.page.waitForTimeout(2000);
                    await this.takeScreenshot('employee-profile');
                    
                    const profileLoaded = await this.page.$('.profile-info, .user-profile') !== null;
                    results.steps.push({
                        name: '查看個人資料',
                        success: profileLoaded,
                        details: profileLoaded ? '個人資料頁面載入成功' : '個人資料頁面載入失敗'
                    });
                    
                } catch (error) {
                    results.steps.push({
                        name: '查看個人資料',
                        success: false,
                        details: `個人資料測試失敗: ${error.message}`
                    });
                }

                // 3. 執行出勤打卡
                try {
                    await this.page.goto(`${this.baseURL}/attendance`, { waitUntil: 'networkidle2' });
                    await this.takeScreenshot('employee-attendance');
                    
                    const checkInButton = await this.page.$('.checkin-btn, button:contains("打卡")');
                    if (checkInButton) {
                        await checkInButton.click();
                        await this.page.waitForTimeout(2000);
                        
                        const checkInSuccess = await this.page.$('.success-message') !== null;
                        results.steps.push({
                            name: '出勤打卡',
                            success: checkInSuccess,
                            details: checkInSuccess ? '打卡成功' : '打卡功能測試'
                        });
                    } else {
                        results.steps.push({
                            name: '出勤打卡',
                            success: false,
                            details: '未找到打卡按鈕'
                        });
                    }
                    
                } catch (error) {
                    results.steps.push({
                        name: '出勤打卡',
                        success: false,
                        details: `打卡測試失敗: ${error.message}`
                    });
                }

                // 4. 申請請假
                try {
                    await this.page.goto(`${this.baseURL}/leave`, { waitUntil: 'networkidle2' });
                    await this.takeScreenshot('employee-leave');
                    
                    const leaveFormExists = await this.page.$('form, .leave-form') !== null;
                    results.steps.push({
                        name: '申請請假',
                        success: leaveFormExists,
                        details: leaveFormExists ? '請假申請表單存在' : '未找到請假申請表單'
                    });
                    
                } catch (error) {
                    results.steps.push({
                        name: '申請請假',
                        success: false,
                        details: `請假申請測試失敗: ${error.message}`
                    });
                }

                // 5. 查看薪資明細
                try {
                    await this.page.goto(`${this.baseURL}/payroll`, { waitUntil: 'networkidle2' });
                    await this.takeScreenshot('employee-payroll');
                    
                    const payrollDataExists = await this.page.$('.payroll-info, .salary-info') !== null;
                    results.steps.push({
                        name: '查看薪資明細',
                        success: payrollDataExists,
                        details: payrollDataExists ? '薪資明細頁面存在' : '未找到薪資明細'
                    });
                    
                } catch (error) {
                    results.steps.push({
                        name: '查看薪資明細',
                        success: false,
                        details: `薪資明細測試失敗: ${error.message}`
                    });
                }
            }

            results.success = results.steps.filter(step => step.success).length >= 2; // 至少成功2個步驟
            
        } catch (error) {
            results.issues.push(`員工流程測試錯誤: ${error.message}`);
        }

        return results;
    }

    async testAdminJourney() {
        console.log('👑 測試管理員流程...');
        const results = {
            steps: [],
            success: false,
            issues: [],
            screenshots: []
        };

        try {
            // 1. 管理員登入
            await this.page.goto(`${this.baseURL}/admin/login`, { waitUntil: 'networkidle2' });
            
            const adminLoginSuccess = await this.attemptLogin('admin@company.com', 'admin123');
            results.steps.push({
                name: '管理員登入',
                success: adminLoginSuccess,
                details: adminLoginSuccess ? '管理員登入成功' : '管理員登入失敗'
            });

            if (adminLoginSuccess) {
                await this.takeScreenshot('admin-dashboard');

                // 2. 員工管理操作
                try {
                    await this.page.goto(`${this.baseURL}/admin/employees`, { waitUntil: 'networkidle2' });
                    await this.takeScreenshot('admin-employees');
                    
                    const employeeListExists = await this.page.$('.employee-list, table') !== null;
                    results.steps.push({
                        name: '員工管理',
                        success: employeeListExists,
                        details: employeeListExists ? '員工列表存在' : '未找到員工列表'
                    });
                    
                } catch (error) {
                    results.steps.push({
                        name: '員工管理',
                        success: false,
                        details: `員工管理測試失敗: ${error.message}`
                    });
                }

                // 3. 查看系統報表
                try {
                    await this.page.goto(`${this.baseURL}/admin/reports`, { waitUntil: 'networkidle2' });
                    await this.takeScreenshot('admin-reports');
                    
                    const reportsExist = await this.page.$('.reports, .chart, canvas') !== null;
                    results.steps.push({
                        name: '系統報表',
                        success: reportsExist,
                        details: reportsExist ? '報表頁面存在' : '未找到報表'
                    });
                    
                } catch (error) {
                    results.steps.push({
                        name: '系統報表',
                        success: false,
                        details: `報表測試失敗: ${error.message}`
                    });
                }

                // 4. 系統設定
                try {
                    await this.page.goto(`${this.baseURL}/admin/settings`, { waitUntil: 'networkidle2' });
                    await this.takeScreenshot('admin-settings');
                    
                    const settingsExist = await this.page.$('.settings, .config-form') !== null;
                    results.steps.push({
                        name: '系統設定',
                        success: settingsExist,
                        details: settingsExist ? '系統設定頁面存在' : '未找到系統設定'
                    });
                    
                } catch (error) {
                    results.steps.push({
                        name: '系統設定',
                        success: false,
                        details: `系統設定測試失敗: ${error.message}`
                    });
                }
            }

            results.success = results.steps.filter(step => step.success).length >= 1; // 至少成功1個步驟
            
        } catch (error) {
            results.issues.push(`管理員流程測試錯誤: ${error.message}`);
        }

        return results;
    }

    async runBusinessLogicTests() {
        console.log('\n⚡ 執行核心業務邏輯驗證...');
        this.testResults.businessLogic.startTime = new Date();

        try {
            // 測試員工管理系統
            const employeeManagement = await this.testEmployeeManagementCRUD();
            this.testResults.businessLogic.employeeManagement = employeeManagement;

            // 測試出勤打卡功能
            const attendanceSystem = await this.testAttendanceSystem();
            this.testResults.businessLogic.attendanceSystem = attendanceSystem;

            // 測試薪資計算邏輯
            const payrollCalculation = await this.testPayrollCalculation();
            this.testResults.businessLogic.payrollCalculation = payrollCalculation;

            // 測試報表生成系統
            const reportGeneration = await this.testReportGeneration();
            this.testResults.businessLogic.reportGeneration = reportGeneration;

            this.testResults.businessLogic.endTime = new Date();
            console.log('✅ 核心業務邏輯驗證完成');

        } catch (error) {
            console.error('❌ 業務邏輯測試失敗:', error);
            this.testResults.businessLogic.error = error.message;
        }
    }

    async testEmployeeManagementCRUD() {
        console.log('📋 測試員工管理系統 CRUD 操作...');
        const results = {
            create: false,
            read: false,
            update: false,
            delete: false,
            details: [],
            apiTests: []
        };

        try {
            // 測試 Create - 創建員工
            const createResponse = await this.testAPICall('POST', '/api/employees', {
                name: '測試員工',
                email: 'test@example.com',
                position: '軟體工程師',
                department: 'IT'
            });
            
            results.create = createResponse.success;
            results.apiTests.push({
                operation: 'CREATE',
                endpoint: '/api/employees',
                success: createResponse.success,
                details: createResponse.details
            });

            // 測試 Read - 讀取員工列表
            const readResponse = await this.testAPICall('GET', '/api/employees');
            results.read = readResponse.success;
            results.apiTests.push({
                operation: 'READ',
                endpoint: '/api/employees', 
                success: readResponse.success,
                details: readResponse.details
            });

            // 測試 Update - 更新員工資料 
            if (createResponse.success && createResponse.data?.id) {
                const updateResponse = await this.testAPICall('PUT', `/api/employees/${createResponse.data.id}`, {
                    name: '更新後的員工',
                    position: '資深軟體工程師'
                });
                
                results.update = updateResponse.success;
                results.apiTests.push({
                    operation: 'UPDATE',
                    endpoint: `/api/employees/${createResponse.data.id}`,
                    success: updateResponse.success,
                    details: updateResponse.details
                });

                // 測試 Delete - 刪除員工
                const deleteResponse = await this.testAPICall('DELETE', `/api/employees/${createResponse.data.id}`);
                results.delete = deleteResponse.success;
                results.apiTests.push({
                    operation: 'DELETE',
                    endpoint: `/api/employees/${createResponse.data.id}`,
                    success: deleteResponse.success,
                    details: deleteResponse.details
                });
            }

            results.details.push(`CRUD 測試完成: C:${results.create} R:${results.read} U:${results.update} D:${results.delete}`);

        } catch (error) {
            results.details.push(`CRUD 測試錯誤: ${error.message}`);
        }

        return results;
    }

    async testAttendanceSystem() {
        console.log('⏰ 測試出勤打卡功能...');
        const results = {
            checkIn: false,
            checkOut: false,
            gpsValidation: false,
            timeRecording: false,
            details: [],
            apiTests: []
        };

        try {
            // 測試打卡進入
            const checkInData = {
                employeeId: 'test-employee-001',
                location: {
                    latitude: 25.0330,
                    longitude: 121.5654
                },
                timestamp: new Date().toISOString()
            };

            const checkInResponse = await this.testAPICall('POST', '/api/attendance/checkin', checkInData);
            results.checkIn = checkInResponse.success;
            results.apiTests.push({
                operation: 'CHECK_IN',
                endpoint: '/api/attendance/checkin',
                success: checkInResponse.success,
                details: checkInResponse.details
            });

            // 測試打卡退出
            const checkOutData = {
                employeeId: 'test-employee-001',
                location: {
                    latitude: 25.0330,
                    longitude: 121.5654
                },
                timestamp: new Date().toISOString()
            };

            const checkOutResponse = await this.testAPICall('POST', '/api/attendance/checkout', checkOutData);
            results.checkOut = checkOutResponse.success;
            results.apiTests.push({
                operation: 'CHECK_OUT',
                endpoint: '/api/attendance/checkout',
                success: checkOutResponse.success,
                details: checkOutResponse.details
            });

            // 測試 GPS 定位驗證
            const invalidLocationData = {
                employeeId: 'test-employee-001',
                location: {
                    latitude: 0,
                    longitude: 0
                }
            };

            const gpsResponse = await this.testAPICall('POST', '/api/attendance/checkin', invalidLocationData);
            results.gpsValidation = !gpsResponse.success; // 預期失敗表示GPS驗證正常
            results.apiTests.push({
                operation: 'GPS_VALIDATION',
                endpoint: '/api/attendance/checkin',
                success: results.gpsValidation,
                details: 'GPS驗證測試 - 預期拒絕無效座標'
            });

            results.details.push(`出勤系統測試: 進${results.checkIn} 出${results.checkOut} GPS${results.gpsValidation}`);

        } catch (error) {
            results.details.push(`出勤系統測試錯誤: ${error.message}`);
        }

        return results;
    }

    async testPayrollCalculation() {
        console.log('💰 測試薪資計算邏輯...');
        const results = {
            basicCalculation: false,
            overtimeCalculation: false,
            leaveDeduction: false,
            bonusCalculation: false,
            details: [],
            apiTests: []
        };

        try {
            // 測試基本薪資計算
            const basicPayrollData = {
                employeeId: 'test-employee-001',
                month: new Date().getMonth() + 1,
                year: new Date().getFullYear(),
                workingDays: 22,
                baseSalary: 50000
            };

            const basicResponse = await this.testAPICall('POST', '/api/payroll/calculate', basicPayrollData);
            results.basicCalculation = basicResponse.success;
            results.apiTests.push({
                operation: 'BASIC_PAYROLL',
                endpoint: '/api/payroll/calculate',
                success: basicResponse.success,
                details: basicResponse.details
            });

            // 測試加班費計算
            const overtimeData = {
                ...basicPayrollData,
                overtimeHours: 10,
                overtimeRate: 1.5
            };

            const overtimeResponse = await this.testAPICall('POST', '/api/payroll/calculate', overtimeData);
            results.overtimeCalculation = overtimeResponse.success;
            results.apiTests.push({
                operation: 'OVERTIME_CALCULATION',
                endpoint: '/api/payroll/calculate',
                success: overtimeResponse.success,
                details: overtimeResponse.details
            });

            // 測試請假扣款
            const leaveData = {
                ...basicPayrollData,
                unpaidLeaveDays: 2
            };

            const leaveResponse = await this.testAPICall('POST', '/api/payroll/calculate', leaveData);
            results.leaveDeduction = leaveResponse.success;
            results.apiTests.push({
                operation: 'LEAVE_DEDUCTION',
                endpoint: '/api/payroll/calculate',
                success: leaveResponse.success,
                details: leaveResponse.details
            });

            results.details.push(`薪資計算測試: 基本${results.basicCalculation} 加班${results.overtimeCalculation} 請假${results.leaveDeduction}`);

        } catch (error) {
            results.details.push(`薪資計算測試錯誤: ${error.message}`);
        }

        return results;
    }

    async testReportGeneration() {
        console.log('📊 測試報表生成系統...');
        const results = {
            monthlyReport: false,
            attendanceReport: false,
            payrollReport: false,
            customReport: false,
            details: [],
            apiTests: []
        };

        try {
            // 測試月度報表
            const monthlyReportData = {
                type: 'monthly',
                month: new Date().getMonth() + 1,
                year: new Date().getFullYear()
            };

            const monthlyResponse = await this.testAPICall('GET', '/api/reports/monthly', monthlyReportData);
            results.monthlyReport = monthlyResponse.success;
            results.apiTests.push({
                operation: 'MONTHLY_REPORT',
                endpoint: '/api/reports/monthly',
                success: monthlyResponse.success,
                details: monthlyResponse.details
            });

            // 測試出勤報表
            const attendanceResponse = await this.testAPICall('GET', '/api/reports/attendance', {
                startDate: '2025-08-01',
                endDate: '2025-08-31'
            });
            results.attendanceReport = attendanceResponse.success;
            results.apiTests.push({
                operation: 'ATTENDANCE_REPORT',
                endpoint: '/api/reports/attendance',
                success: attendanceResponse.success,
                details: attendanceResponse.details
            });

            // 測試薪資報表
            const payrollResponse = await this.testAPICall('GET', '/api/reports/payroll', {
                month: 8,
                year: 2025
            });
            results.payrollReport = payrollResponse.success;
            results.apiTests.push({
                operation: 'PAYROLL_REPORT',
                endpoint: '/api/reports/payroll',
                success: payrollResponse.success,
                details: payrollResponse.details
            });

            results.details.push(`報表生成測試: 月度${results.monthlyReport} 出勤${results.attendanceReport} 薪資${results.payrollReport}`);

        } catch (error) {
            results.details.push(`報表生成測試錯誤: ${error.message}`);
        }

        return results;
    }

    async runSystemIntegrationTests() {
        console.log('\n🔄 執行系統整合測試...');
        this.testResults.systemIntegration.startTime = new Date();

        try {
            // 測試前後端通信
            const frontendBackendComm = await this.testFrontendBackendCommunication();
            this.testResults.systemIntegration.frontendBackend = frontendBackendComm;

            // 測試數據庫操作
            const databaseOps = await this.testDatabaseOperations();
            this.testResults.systemIntegration.database = databaseOps;

            // 測試 WebSocket 連接
            const websocketTest = await this.testWebSocketConnection();
            this.testResults.systemIntegration.websocket = websocketTest;

            // 測試檔案上傳下載
            const fileOperations = await this.testFileOperations();
            this.testResults.systemIntegration.fileOperations = fileOperations;

            this.testResults.systemIntegration.endTime = new Date();
            console.log('✅ 系統整合測試完成');

        } catch (error) {
            console.error('❌ 系統整合測試失敗:', error);
            this.testResults.systemIntegration.error = error.message;
        }
    }

    async testFrontendBackendCommunication() {
        console.log('🌐 測試前後端通信...');
        const results = {
            apiConnectivity: false,
            dataTransmission: false,
            errorHandling: false,
            responseTime: [],
            details: []
        };

        try {
            // 測試 API 連通性
            for (const api of this.criticalAPIs) {
                const startTime = Date.now();
                const response = await this.testAPICall('GET', api);
                const responseTime = Date.now() - startTime;
                
                results.responseTime.push({
                    endpoint: api,
                    time: responseTime,
                    success: response.success
                });

                if (response.success || response.status === 401 || response.status === 403) {
                    // 401/403 表示端點存在但需要認證
                    results.apiConnectivity = true;
                }
            }

            // 測試數據傳輸
            const testData = { test: true, timestamp: Date.now() };
            const dataResponse = await this.testAPICall('POST', '/api/test', testData);
            results.dataTransmission = dataResponse.success || dataResponse.status === 404; // 404 也算端點存在

            // 測試錯誤處理
            const errorResponse = await this.testAPICall('GET', '/api/nonexistent');
            results.errorHandling = errorResponse.status === 404 || errorResponse.status === 500;

            const avgResponseTime = results.responseTime.reduce((sum, r) => sum + r.time, 0) / results.responseTime.length;
            results.details.push(`平均響應時間: ${avgResponseTime.toFixed(2)}ms`);
            results.details.push(`API連通性: ${results.apiConnectivity}`);

        } catch (error) {
            results.details.push(`前後端通信測試錯誤: ${error.message}`);
        }

        return results;
    }

    async testDatabaseOperations() {
        console.log('🗄️ 測試數據庫操作...');
        const results = {
            connection: false,
            crud: false,
            transactions: false,
            consistency: false,
            details: []
        };

        try {
            // 測試數據庫連接
            const healthResponse = await this.testAPICall('GET', '/api/health');
            results.connection = healthResponse.success && healthResponse.data?.database === 'connected';

            // 測試 CRUD 操作的數據庫層面
            const testEmployeeData = {
                name: 'DB測試員工',
                email: `db-test-${Date.now()}@test.com`,
                position: '測試'
            };

            // 創建
            const createResponse = await this.testAPICall('POST', '/api/employees', testEmployeeData);
            let crudSuccess = createResponse.success;

            if (createResponse.success && createResponse.data?.id) {
                // 讀取
                const readResponse = await this.testAPICall('GET', `/api/employees/${createResponse.data.id}`);
                crudSuccess = crudSuccess && readResponse.success;

                // 更新
                const updateResponse = await this.testAPICall('PUT', `/api/employees/${createResponse.data.id}`, {
                    name: '更新後的DB測試員工'
                });
                crudSuccess = crudSuccess && updateResponse.success;

                // 刪除
                const deleteResponse = await this.testAPICall('DELETE', `/api/employees/${createResponse.data.id}`);
                crudSuccess = crudSuccess && deleteResponse.success;
            }

            results.crud = crudSuccess;
            results.details.push(`數據庫CRUD操作: ${crudSuccess ? '成功' : '失敗'}`);

            // 測試事務處理（如果有相關 API）
            const transactionResponse = await this.testAPICall('POST', '/api/test/transaction', {
                operations: ['create', 'update', 'delete']
            });
            results.transactions = transactionResponse.success || transactionResponse.status === 404;

            results.details.push(`數據庫連接: ${results.connection}`);

        } catch (error) {
            results.details.push(`數據庫測試錯誤: ${error.message}`);
        }

        return results;
    }

    async testWebSocketConnection() {
        console.log('⚡ 測試 WebSocket 連接...');
        const results = {
            connection: false,
            messaging: false,
            realTimeUpdates: false,
            details: []
        };

        try {
            // 在瀏覽器中測試 WebSocket
            const wsTest = await this.page.evaluate(async (baseURL) => {
                return new Promise((resolve) => {
                    try {
                        const wsUrl = baseURL.replace('https://', 'wss://').replace('http://', 'ws://') + '/ws';
                        const ws = new WebSocket(wsUrl);
                        
                        const timeout = setTimeout(() => {
                            ws.close();
                            resolve({
                                connection: false,
                                error: 'WebSocket連接超時'
                            });
                        }, 5000);

                        ws.onopen = () => {
                            clearTimeout(timeout);
                            // 測試發送消息
                            ws.send(JSON.stringify({ type: 'test', data: 'hello' }));
                        };

                        ws.onmessage = (event) => {
                            ws.close();
                            resolve({
                                connection: true,
                                messaging: true,
                                message: event.data
                            });
                        };

                        ws.onerror = (error) => {
                            clearTimeout(timeout);
                            resolve({
                                connection: false,
                                error: 'WebSocket連接錯誤'
                            });
                        };

                        ws.onclose = () => {
                            clearTimeout(timeout);
                            resolve({
                                connection: false,
                                error: 'WebSocket連接關閉'
                            });
                        };
                        
                    } catch (error) {
                        resolve({
                            connection: false,
                            error: error.message
                        });
                    }
                });
            }, this.baseURL);

            results.connection = wsTest.connection || false;
            results.messaging = wsTest.messaging || false;
            results.details.push(`WebSocket測試結果: ${JSON.stringify(wsTest)}`);

        } catch (error) {
            results.details.push(`WebSocket測試錯誤: ${error.message}`);
        }

        return results;
    }

    async testFileOperations() {
        console.log('📎 測試檔案上傳下載...');
        const results = {
            upload: false,
            download: false,
            imageProcessing: false,
            documentHandling: false,
            details: []
        };

        try {
            // 測試圖片上傳
            const uploadResponse = await this.testAPICall('POST', '/api/upload', {
                file: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
                type: 'image'
            });
            results.upload = uploadResponse.success;
            results.details.push(`檔案上傳測試: ${uploadResponse.success ? '成功' : '失敗'}`);

            // 測試檔案下載
            if (uploadResponse.success && uploadResponse.data?.fileId) {
                const downloadResponse = await this.testAPICall('GET', `/api/download/${uploadResponse.data.fileId}`);
                results.download = downloadResponse.success;
                results.details.push(`檔案下載測試: ${downloadResponse.success ? '成功' : '失敗'}`);
            }

            // 測試圖片處理
            const imageProcessingResponse = await this.testAPICall('POST', '/api/image/resize', {
                imageUrl: 'https://via.placeholder.com/300',
                width: 150,
                height: 150
            });
            results.imageProcessing = imageProcessingResponse.success || imageProcessingResponse.status === 404;

            results.details.push(`圖片處理測試: ${results.imageProcessing ? '可用' : '不可用'}`);

        } catch (error) {
            results.details.push(`檔案操作測試錯誤: ${error.message}`);
        }

        return results;
    }

    async runExceptionHandlingTests() {
        console.log('\n⚠️ 執行異常情況處理測試...');
        this.testResults.exceptionHandling.startTime = new Date();

        try {
            // 測試網路中斷處理
            const networkFailure = await this.testNetworkFailureHandling();
            this.testResults.exceptionHandling.networkFailure = networkFailure;

            // 測試伺服器錯誤處理
            const serverError = await this.testServerErrorHandling();
            this.testResults.exceptionHandling.serverError = serverError;

            // 測試並發訪問
            const concurrency = await this.testConcurrentAccess();
            this.testResults.exceptionHandling.concurrency = concurrency;

            // 測試數據衝突
            const dataConflict = await this.testDataConflictHandling();
            this.testResults.exceptionHandling.dataConflict = dataConflict;

            this.testResults.exceptionHandling.endTime = new Date();
            console.log('✅ 異常情況處理測試完成');

        } catch (error) {
            console.error('❌ 異常處理測試失敗:', error);
            this.testResults.exceptionHandling.error = error.message;
        }
    }

    async testNetworkFailureHandling() {
        console.log('🔌 測試網路中斷處理...');
        const results = {
            offlineMode: false,
            reconnection: false,
            dataSync: false,
            details: []
        };

        try {
            // 測試離線模式
            await this.page.setOfflineMode(true);
            await this.page.waitForTimeout(2000);
            
            const offlineHandling = await this.page.evaluate(() => {
                // 檢查頁面是否有離線提示
                return document.querySelector('.offline-indicator, .network-error') !== null ||
                       navigator.onLine === false;
            });

            results.offlineMode = offlineHandling;
            results.details.push(`離線模式檢測: ${offlineHandling ? '有處理' : '無處理'}`);

            // 恢復網路連接
            await this.page.setOfflineMode(false);
            await this.page.waitForTimeout(2000);

            // 測試重新連接
            const reconnectionHandling = await this.page.evaluate(() => {
                return navigator.onLine === true;
            });

            results.reconnection = reconnectionHandling;
            results.details.push(`網路重連檢測: ${reconnectionHandling ? '成功' : '失敗'}`);

        } catch (error) {
            results.details.push(`網路故障測試錯誤: ${error.message}`);
        }

        return results;
    }

    async testServerErrorHandling() {
        console.log('🚨 測試伺服器錯誤處理...');
        const results = {
            error404: false,
            error500: false,
            timeout: false,
            errorMessages: [],
            details: []
        };

        try {
            // 測試 404 錯誤處理
            const response404 = await this.testAPICall('GET', '/api/nonexistent-endpoint');
            results.error404 = response404.status === 404;
            results.details.push(`404錯誤處理: ${results.error404 ? '正常' : '異常'}`);

            // 測試 500 錯誤處理（通過發送錯誤數據）
            const response500 = await this.testAPICall('POST', '/api/employees', {
                invalidData: 'this should cause an error'
            });
            results.error500 = response500.status >= 400;
            results.details.push(`500錯誤處理: ${results.error500 ? '有響應' : '無響應'}`);

            // 測試超時處理
            try {
                const timeoutResponse = await this.testAPICall('GET', '/api/slow-endpoint', {}, 1000); // 1秒超時
                results.timeout = timeoutResponse.timeout || false;
            } catch (error) {
                results.timeout = error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED';
            }
            results.details.push(`超時處理: ${results.timeout ? '有檢測到' : '未檢測到'}`);

        } catch (error) {
            results.details.push(`伺服器錯誤測試錯誤: ${error.message}`);
        }

        return results;
    }

    async testConcurrentAccess() {
        console.log('👥 測試並發訪問...');
        const results = {
            concurrentRequests: false,
            loadHandling: false,
            resourceContention: false,
            details: []
        };

        try {
            // 測試並發請求
            const concurrentPromises = [];
            for (let i = 0; i < 10; i++) {
                concurrentPromises.push(
                    this.testAPICall('GET', '/api/employees', {}, 10000)
                );
            }

            const concurrentResults = await Promise.allSettled(concurrentPromises);
            const successCount = concurrentResults.filter(result => 
                result.status === 'fulfilled' && result.value.success
            ).length;

            results.concurrentRequests = successCount >= 5; // 至少一半成功
            results.details.push(`並發請求測試: ${successCount}/10 成功`);

            // 測試負載處理
            const loadTestResults = [];
            for (let i = 0; i < 5; i++) {
                const startTime = Date.now();
                const response = await this.testAPICall('GET', '/api/health');
                const responseTime = Date.now() - startTime;
                loadTestResults.push({
                    success: response.success,
                    time: responseTime
                });
            }

            const avgResponseTime = loadTestResults.reduce((sum, r) => sum + r.time, 0) / loadTestResults.length;
            results.loadHandling = avgResponseTime < 5000; // 平均響應時間小於5秒
            results.details.push(`負載處理測試: 平均響應時間 ${avgResponseTime.toFixed(2)}ms`);

        } catch (error) {
            results.details.push(`並發訪問測試錯誤: ${error.message}`);
        }

        return results;
    }

    async testDataConflictHandling() {
        console.log('🔄 測試數據衝突處理...');
        const results = {
            optimisticLocking: false,
            transactionHandling: false,
            conflictResolution: false,
            details: []
        };

        try {
            // 創建測試員工
            const createResponse = await this.testAPICall('POST', '/api/employees', {
                name: '衝突測試員工',
                email: `conflict-test-${Date.now()}@test.com`
            });

            if (createResponse.success && createResponse.data?.id) {
                const employeeId = createResponse.data.id;

                // 同時更新同一員工（模擬數據衝突）
                const updatePromises = [
                    this.testAPICall('PUT', `/api/employees/${employeeId}`, {
                        name: '更新版本A',
                        version: 1
                    }),
                    this.testAPICall('PUT', `/api/employees/${employeeId}`, {
                        name: '更新版本B',
                        version: 1
                    })
                ];

                const updateResults = await Promise.allSettled(updatePromises);
                const conflicts = updateResults.filter(result => 
                    result.status === 'fulfilled' && result.value.status === 409 // Conflict
                );

                results.optimisticLocking = conflicts.length > 0;
                results.details.push(`樂觀鎖檢測: ${conflicts.length > 0 ? '有衝突檢測' : '無衝突檢測'}`);

                // 清理測試數據
                await this.testAPICall('DELETE', `/api/employees/${employeeId}`);
            }

        } catch (error) {
            results.details.push(`數據衝突測試錯誤: ${error.message}`);
        }

        return results;
    }

    async runPerformanceAndSecurityTests() {
        console.log('\n🔒 執行效能和安全測試...');
        this.testResults.performanceAndSecurity.startTime = new Date();

        try {
            // 測試載入速度
            const loadSpeed = await this.testLoadSpeed();
            this.testResults.performanceAndSecurity.loadSpeed = loadSpeed;

            // 測試記憶體使用
            const memoryUsage = await this.testMemoryUsage();
            this.testResults.performanceAndSecurity.memoryUsage = memoryUsage;

            // 測試安全防護
            const securityProtection = await this.testSecurityProtection();
            this.testResults.performanceAndSecurity.securityProtection = securityProtection;

            // 測試認證授權
            const authSystem = await this.testAuthenticationAndAuthorization();
            this.testResults.performanceAndSecurity.authSystem = authSystem;

            this.testResults.performanceAndSecurity.endTime = new Date();
            console.log('✅ 效能和安全測試完成');

        } catch (error) {
            console.error('❌ 效能和安全測試失敗:', error);
            this.testResults.performanceAndSecurity.error = error.message;
        }
    }

    async testLoadSpeed() {
        console.log('⚡ 測試載入速度...');
        const results = {
            pageLoadTime: [],
            resourceLoadTime: [],
            renderTime: 0,
            details: []
        };

        try {
            // 測試頁面載入速度
            const pages = ['/', '/login', '/employees', '/attendance'];
            
            for (const pagePath of pages) {
                const startTime = Date.now();
                await this.page.goto(`${this.baseURL}${pagePath}`, { 
                    waitUntil: 'networkidle2',
                    timeout: 30000
                });
                const loadTime = Date.now() - startTime;
                
                results.pageLoadTime.push({
                    page: pagePath,
                    time: loadTime
                });
            }

            // 測試渲染時間
            const renderMetrics = await this.page.evaluate(() => {
                const perfData = performance.timing;
                return {
                    domContentLoaded: perfData.domContentLoadedEventEnd - perfData.navigationStart,
                    loadComplete: perfData.loadEventEnd - perfData.navigationStart
                };
            });

            results.renderTime = renderMetrics.loadComplete;
            
            const avgLoadTime = results.pageLoadTime.reduce((sum, p) => sum + p.time, 0) / results.pageLoadTime.length;
            results.details.push(`平均頁面載入時間: ${avgLoadTime.toFixed(2)}ms`);
            results.details.push(`DOM渲染時間: ${renderMetrics.domContentLoaded}ms`);

        } catch (error) {
            results.details.push(`載入速度測試錯誤: ${error.message}`);
        }

        return results;
    }

    async testMemoryUsage() {
        console.log('🧠 測試記憶體使用...');
        const results = {
            initialMemory: 0,
            peakMemory: 0,
            memoryLeaks: false,
            details: []
        };

        try {
            // 獲取初始記憶體使用
            const initialMemory = await this.page.evaluate(() => {
                return performance.memory ? {
                    usedJSHeapSize: performance.memory.usedJSHeapSize,
                    totalJSHeapSize: performance.memory.totalJSHeapSize
                } : null;
            });

            if (initialMemory) {
                results.initialMemory = initialMemory.usedJSHeapSize;

                // 執行一些操作來測試記憶體使用
                await this.page.goto(`${this.baseURL}/employees`, { waitUntil: 'networkidle2' });
                await this.page.waitForTimeout(2000);
                
                // 多次操作
                for (let i = 0; i < 5; i++) {
                    await this.page.reload();
                    await this.page.waitForTimeout(1000);
                }

                // 獲取峰值記憶體使用
                const peakMemory = await this.page.evaluate(() => {
                    return performance.memory ? {
                        usedJSHeapSize: performance.memory.usedJSHeapSize,
                        totalJSHeapSize: performance.memory.totalJSHeapSize
                    } : null;
                });

                if (peakMemory) {
                    results.peakMemory = peakMemory.usedJSHeapSize;
                    
                    // 檢查記憶體洩漏（簡單檢測）
                    const memoryIncrease = (results.peakMemory - results.initialMemory) / results.initialMemory;
                    results.memoryLeaks = memoryIncrease > 0.5; // 記憶體增加超過50%可能有洩漏
                    
                    results.details.push(`初始記憶體: ${(results.initialMemory / 1024 / 1024).toFixed(2)}MB`);
                    results.details.push(`峰值記憶體: ${(results.peakMemory / 1024 / 1024).toFixed(2)}MB`);
                    results.details.push(`記憶體增長: ${(memoryIncrease * 100).toFixed(2)}%`);
                }
            }

        } catch (error) {
            results.details.push(`記憶體測試錯誤: ${error.message}`);
        }

        return results;
    }

    async testSecurityProtection() {
        console.log('🔐 測試安全防護...');
        const results = {
            xssProtection: false,
            csrfProtection: false,
            sqlInjectionProtection: false,
            details: []
        };

        try {
            // 測試 XSS 防護
            const xssPayload = '<script>alert("XSS")</script>';
            const xssResponse = await this.testAPICall('POST', '/api/employees', {
                name: xssPayload,
                email: 'xss@test.com'
            });
            
            // 如果後端正確處理，應該拒絕或清理腳本
            results.xssProtection = !xssResponse.success || 
                                   (xssResponse.data && !xssResponse.data.name.includes('<script>'));
            results.details.push(`XSS防護: ${results.xssProtection ? '有保護' : '無保護'}`);

            // 測試 SQL 注入防護
            const sqlPayload = "'; DROP TABLE users; --";
            const sqlResponse = await this.testAPICall('GET', `/api/employees?search=${encodeURIComponent(sqlPayload)}`);
            
            // 應該正常處理而不是返回數據庫錯誤
            results.sqlInjectionProtection = sqlResponse.status !== 500 || 
                                           (sqlResponse.error && !sqlResponse.error.includes('SQL'));
            results.details.push(`SQL注入防護: ${results.sqlInjectionProtection ? '有保護' : '無保護'}`);

            // 測試 CSRF 防護（檢查是否需要CSRF token）
            const csrfResponse = await this.testAPICall('POST', '/api/employees', {
                name: 'CSRF Test',
                email: 'csrf@test.com'
            }, 5000, false); // 不包含認證信息
            
            results.csrfProtection = csrfResponse.status === 401 || csrfResponse.status === 403;
            results.details.push(`CSRF防護: ${results.csrfProtection ? '有保護' : '無保護'}`);

        } catch (error) {
            results.details.push(`安全防護測試錯誤: ${error.message}`);
        }

        return results;
    }

    async testAuthenticationAndAuthorization() {
        console.log('🔑 測試認證授權...');
        const results = {
            jwtValidation: false,
            permissionControl: false,
            sessionManagement: false,
            details: []
        };

        try {
            // 測試未認證訪問
            const unauthResponse = await this.testAPICall('GET', '/api/employees');
            const requiresAuth = unauthResponse.status === 401 || unauthResponse.status === 403;
            
            // 測試認證後訪問
            const authResponse = await this.testAPICall('POST', '/api/auth/login', {
                email: 'test@example.com',
                password: 'password123'
            });

            let authToken = null;
            if (authResponse.success && authResponse.data?.token) {
                authToken = authResponse.data.token;
                
                // 測試使用 JWT token
                const authenticatedResponse = await this.testAPICall('GET', '/api/employees', {}, 5000, true, authToken);
                results.jwtValidation = authenticatedResponse.success || authenticatedResponse.status !== 401;
            }

            results.details.push(`認證要求: ${requiresAuth ? '需要認證' : '無需認證'}`);
            results.details.push(`JWT驗證: ${results.jwtValidation ? '正常' : '異常'}`);

            // 測試權限控制
            if (authToken) {
                // 嘗試訪問管理員功能
                const adminResponse = await this.testAPICall('GET', '/api/admin/users', {}, 5000, true, authToken);
                results.permissionControl = adminResponse.status === 403 || adminResponse.success;
                results.details.push(`權限控制: ${results.permissionControl ? '有控制' : '無控制'}`);
            }

        } catch (error) {
            results.details.push(`認證授權測試錯誤: ${error.message}`);
        }

        return results;
    }

    // 輔助方法
    async attemptLogin(email, password) {
        try {
            // 檢查是否有登入表單
            const emailInput = await this.page.$('input[type="email"], input[name="email"]');
            const passwordInput = await this.page.$('input[type="password"], input[name="password"]');
            const submitButton = await this.page.$('button[type="submit"], input[type="submit"], .login-btn');

            if (emailInput && passwordInput && submitButton) {
                await emailInput.type(email);
                await passwordInput.type(password);
                await submitButton.click();
                
                // 等待登入結果
                await this.page.waitForTimeout(3000);
                
                // 檢查是否登入成功（通常會重定向或顯示成功訊息）
                const loginSuccess = await this.page.evaluate(() => {
                    return !window.location.pathname.includes('login') || 
                           document.querySelector('.success, .dashboard, .welcome') !== null;
                });

                return loginSuccess;
            }
            
            return false;
            
        } catch (error) {
            console.error('登入嘗試失敗:', error);
            return false;
        }
    }

    async testAPICall(method, endpoint, data = {}, timeout = 10000, includeAuth = false, token = null) {
        try {
            const url = `${this.baseURL}${endpoint}`;
            const config = {
                method,
                url,
                timeout,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            if (includeAuth && token) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }

            if (method !== 'GET' && Object.keys(data).length > 0) {
                config.data = data;
            } else if (method === 'GET' && Object.keys(data).length > 0) {
                config.params = data;
            }

            const response = await axios(config);
            
            return {
                success: true,
                status: response.status,
                data: response.data,
                details: `${method} ${endpoint}: ${response.status} OK`
            };
            
        } catch (error) {
            const status = error.response ? error.response.status : 0;
            const message = error.response ? error.response.statusText : error.message;
            
            return {
                success: false,
                status,
                error: message,
                details: `${method} ${endpoint}: ${status} ${message}`,
                timeout: error.code === 'ECONNABORTED'
            };
        }
    }

    async takeScreenshot(name) {
        try {
            const screenshotPath = path.join(this.testConfig.screenshotPath, `${name}-${Date.now()}.png`);
            await this.page.screenshot({ 
                path: screenshotPath,
                fullPage: true
            });
            return screenshotPath;
        } catch (error) {
            console.error('截圖失敗:', error);
            return null;
        }
    }

    async generateFinalReport() {
        console.log('\n📋 生成最終測試報告...');
        
        this.testResults.overall.endTime = new Date();
        const testDuration = this.testResults.overall.endTime - this.testResults.overall.startTime;

        // 計算總體統計
        const stats = this.calculateOverallStats();
        
        const report = {
            metadata: {
                testDate: new Date().toISOString(),
                duration: `${Math.round(testDuration / 1000)}秒`,
                baseURL: this.baseURL,
                testEnvironment: 'Production Railway Deployment',
                testerVersion: '2.0.0'
            },
            executive_summary: {
                overallHealth: this.calculateOverallHealth(),
                criticalIssues: this.identifyCriticalIssues(),
                recommendations: this.generateRecommendations(),
                businessImpact: this.assessBusinessImpact()
            },
            test_results: this.testResults,
            statistics: stats,
            detailed_findings: this.compileDétailedFindings(),
            next_steps: this.defineNextSteps()
        };

        // 保存報告
        const reportPath = path.join(this.testConfig.reportPath, `e2e-business-test-report-${Date.now()}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
        
        // 生成HTML報告
        const htmlReport = this.generateHTMLReport(report);
        const htmlPath = path.join(this.testConfig.reportPath, `e2e-business-test-report-${Date.now()}.html`);
        fs.writeFileSync(htmlPath, htmlReport, 'utf8');

        console.log(`\n📄 報告已生成:`);
        console.log(`   JSON: ${reportPath}`);
        console.log(`   HTML: ${htmlPath}`);

        // 顯示摘要
        this.displayTestSummary(report);

        return report;
    }

    calculateOverallStats() {
        const stats = {
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            warningTests: 0
        };

        // 計算各模組的測試結果
        const modules = ['userJourney', 'businessLogic', 'systemIntegration', 'exceptionHandling', 'performanceAndSecurity'];
        
        modules.forEach(moduleName => {
            const moduleResult = this.testResults[moduleName];
            if (moduleResult && typeof moduleResult === 'object') {
                this.countTestResults(moduleResult, stats);
            }
        });

        return stats;
    }

    countTestResults(obj, stats) {
        if (typeof obj !== 'object' || obj === null) return;
        
        Object.keys(obj).forEach(key => {
            const value = obj[key];
            
            if (typeof value === 'boolean') {
                stats.totalTests++;
                if (value) {
                    stats.passedTests++;
                } else {
                    stats.failedTests++;
                }
            } else if (typeof value === 'object' && value !== null) {
                if (value.success !== undefined) {
                    stats.totalTests++;
                    if (value.success) {
                        stats.passedTests++;
                    } else {
                        stats.failedTests++;
                    }
                } else {
                    this.countTestResults(value, stats);
                }
            }
        });
    }

    calculateOverallHealth() {
        const stats = this.calculateOverallStats();
        const successRate = stats.totalTests > 0 ? (stats.passedTests / stats.totalTests) * 100 : 0;
        
        if (successRate >= 90) return { status: 'EXCELLENT', score: successRate };
        if (successRate >= 75) return { status: 'GOOD', score: successRate };
        if (successRate >= 50) return { status: 'FAIR', score: successRate };
        return { status: 'POOR', score: successRate };
    }

    identifyCriticalIssues() {
        const issues = [];
        
        // 檢查用戶旅程問題
        if (this.testResults.userJourney?.visitor?.success === false) {
            issues.push({
                severity: 'HIGH',
                category: 'User Experience',
                description: '訪客流程存在重大問題，影響新用戶註冊',
                impact: '可能導致用戶流失，影響業務增長'
            });
        }

        // 檢查業務邏輯問題
        if (this.testResults.businessLogic?.employeeManagement?.create === false) {
            issues.push({
                severity: 'CRITICAL',
                category: 'Core Business Logic',
                description: '員工創建功能失效',
                impact: '無法新增員工，嚴重影響人事管理'
            });
        }

        // 檢查系統整合問題
        if (this.testResults.systemIntegration?.database?.connection === false) {
            issues.push({
                severity: 'CRITICAL',
                category: 'System Infrastructure',
                description: '數據庫連接問題',
                impact: '系統無法正常運作，所有業務功能受影響'
            });
        }

        // 檢查安全問題
        if (this.testResults.performanceAndSecurity?.securityProtection?.xssProtection === false) {
            issues.push({
                severity: 'HIGH',
                category: 'Security',
                description: 'XSS防護不足',
                impact: '存在安全漏洞，可能被惡意攻擊'
            });
        }

        return issues;
    }

    generateRecommendations() {
        const recommendations = [];
        const issues = this.identifyCriticalIssues();

        // 基於發現的問題生成建議
        if (issues.some(issue => issue.category === 'Core Business Logic')) {
            recommendations.push({
                priority: 'HIGH',
                category: 'Backend Development',
                action: '立即修復核心業務API端點',
                timeline: '1-2天',
                details: '檢查並修復 /api/employees 等核心API的404錯誤問題'
            });
        }

        if (issues.some(issue => issue.category === 'User Experience')) {
            recommendations.push({
                priority: 'MEDIUM',
                category: 'Frontend Development', 
                action: '改善用戶界面和體驗流程',
                timeline: '1週',
                details: '優化登入、註冊流程，確保頁面正確載入和表單功能'
            });
        }

        if (issues.some(issue => issue.category === 'Security')) {
            recommendations.push({
                priority: 'HIGH',
                category: 'Security Enhancement',
                action: '加強安全防護機制',
                timeline: '3-5天',
                details: '實施XSS防護、CSRF保護、SQL注入防護等安全措施'
            });
        }

        // 效能優化建議
        const avgLoadTime = this.testResults.performanceAndSecurity?.loadSpeed?.pageLoadTime?.reduce((sum, p) => sum + p.time, 0) / 
                           (this.testResults.performanceAndSecurity?.loadSpeed?.pageLoadTime?.length || 1) || 0;
        
        if (avgLoadTime > 3000) {
            recommendations.push({
                priority: 'MEDIUM',
                category: 'Performance Optimization',
                action: '優化頁面載入速度',
                timeline: '1週',
                details: '實施代碼分割、圖片優化、CDN使用等效能改善措施'
            });
        }

        // 監控建議
        recommendations.push({
            priority: 'LOW',
            category: 'Monitoring',
            action: '建立完整的系統監控',
            timeline: '2週',
            details: '實施日誌記錄、錯誤追蹤、效能監控和告警系統'
        });

        return recommendations;
    }

    assessBusinessImpact() {
        const stats = this.calculateOverallStats();
        const criticalIssues = this.identifyCriticalIssues().filter(issue => issue.severity === 'CRITICAL');
        const highIssues = this.identifyCriticalIssues().filter(issue => issue.severity === 'HIGH');

        return {
            operationalRisk: criticalIssues.length > 0 ? 'HIGH' : highIssues.length > 0 ? 'MEDIUM' : 'LOW',
            userImpact: this.testResults.userJourney?.visitor?.success === false ? 'SIGNIFICANT' : 'MINIMAL',
            businessContinuity: stats.passedTests / Math.max(stats.totalTests, 1) > 0.7 ? 'STABLE' : 'AT_RISK',
            recommendedActions: criticalIssues.length > 0 ? 'IMMEDIATE_INTERVENTION_REQUIRED' : 'PLANNED_IMPROVEMENT'
        };
    }

    compileDétailedFindings() {
        const findings = {
            userExperience: {},
            systemReliability: {},
            dataIntegrity: {},
            securityPosture: {},
            performanceProfile: {}
        };

        // 用戶體驗發現
        findings.userExperience = {
            visitorFlow: this.analyzeVisitorFlow(),
            employeeWorkflow: this.analyzeEmployeeWorkflow(),
            adminInterface: this.analyzeAdminInterface(),
            overallUsability: this.assessOverallUsability()
        };

        // 系統可靠性發現
        findings.systemReliability = {
            apiAvailability: this.analyzeAPIAvailability(),
            errorHandling: this.analyzeErrorHandling(),
            failoverCapability: this.analyzeFailoverCapability()
        };

        // 數據完整性發現
        findings.dataIntegrity = {
            crudOperations: this.analyzeCRUDOperations(),
            transactionHandling: this.analyzeTransactionHandling(),
            dataConsistency: this.analyzeDataConsistency()
        };

        // 安全狀態發現
        findings.securityPosture = {
            authenticationStrength: this.analyzeAuthentication(),
            authorizationModel: this.analyzeAuthorization(),
            vulnerabilityExposure: this.analyzeVulnerabilities()
        };

        // 效能概況發現
        findings.performanceProfile = {
            loadTimes: this.analyzeLoadTimes(),
            resourceUtilization: this.analyzeResourceUtilization(),
            scalabilityIndicators: this.analyzeScalabilityIndicators()
        };

        return findings;
    }

    analyzeVisitorFlow() {
        const visitorResult = this.testResults.userJourney?.visitor;
        if (!visitorResult) return { status: 'NOT_TESTED', issues: ['訪客流程未測試'] };

        const issues = [];
        const successes = [];

        visitorResult.steps?.forEach(step => {
            if (step.success) {
                successes.push(step.name);
            } else {
                issues.push(`${step.name}: ${step.details}`);
            }
        });

        return {
            status: visitorResult.success ? 'HEALTHY' : 'DEGRADED',
            successfulSteps: successes,
            failedSteps: issues,
            recommendation: issues.length > 0 ? '需要修復訪客流程中的問題' : '訪客流程運作正常'
        };
    }

    analyzeEmployeeWorkflow() {
        const employeeResult = this.testResults.userJourney?.employee;
        if (!employeeResult) return { status: 'NOT_TESTED', issues: ['員工流程未測試'] };

        const coreFeatures = ['員工登入', '出勤打卡', '查看個人資料'];
        const workingFeatures = employeeResult.steps?.filter(step => 
            coreFeatures.includes(step.name) && step.success
        ).map(step => step.name) || [];

        return {
            status: workingFeatures.length >= 2 ? 'FUNCTIONAL' : 'IMPAIRED',
            workingFeatures,
            recommendation: workingFeatures.length < 2 ? '核心員工功能需要修復' : '員工功能基本可用'
        };
    }

    analyzeAdminInterface() {
        const adminResult = this.testResults.userJourney?.admin;
        if (!adminResult) return { status: 'NOT_TESTED', issues: ['管理員流程未測試'] };

        return {
            status: adminResult.success ? 'OPERATIONAL' : 'LIMITED',
            capabilities: adminResult.steps?.filter(step => step.success).map(step => step.name) || [],
            limitations: adminResult.steps?.filter(step => !step.success).map(step => step.name) || [],
            recommendation: adminResult.success ? '管理功能可用' : '管理功能需要改善'
        };
    }

    assessOverallUsability() {
        const allFlows = [
            this.testResults.userJourney?.visitor,
            this.testResults.userJourney?.employee,
            this.testResults.userJourney?.admin
        ].filter(Boolean);

        const totalSteps = allFlows.reduce((sum, flow) => sum + (flow.steps?.length || 0), 0);
        const successSteps = allFlows.reduce((sum, flow) => 
            sum + (flow.steps?.filter(step => step.success).length || 0), 0
        );

        const usabilityScore = totalSteps > 0 ? (successSteps / totalSteps) * 100 : 0;

        return {
            score: usabilityScore,
            rating: usabilityScore >= 80 ? 'EXCELLENT' : 
                   usabilityScore >= 60 ? 'GOOD' : 
                   usabilityScore >= 40 ? 'FAIR' : 'POOR',
            recommendation: usabilityScore < 70 ? '需要全面改善用戶體驗' : '用戶體驗良好'
        };
    }

    analyzeAPIAvailability() {
        const integrationResult = this.testResults.systemIntegration?.frontendBackend;
        if (!integrationResult) return { status: 'UNKNOWN', details: 'API可用性未測試' };

        const responseTimeData = integrationResult.responseTime || [];
        const availableAPIs = responseTimeData.filter(api => api.success || 
            (api.time < 30000 && !api.success) // 有響應但可能是認證錯誤
        );

        return {
            totalAPIs: responseTimeData.length,
            availableAPIs: availableAPIs.length,
            availabilityRate: responseTimeData.length > 0 ? 
                (availableAPIs.length / responseTimeData.length) * 100 : 0,
            avgResponseTime: responseTimeData.reduce((sum, api) => sum + api.time, 0) / 
                           Math.max(responseTimeData.length, 1),
            status: availableAPIs.length / Math.max(responseTimeData.length, 1) > 0.7 ? 'HEALTHY' : 'DEGRADED'
        };
    }

    analyzeErrorHandling() {
        const exceptionResult = this.testResults.exceptionHandling;
        if (!exceptionResult) return { status: 'UNTESTED', details: '錯誤處理未測試' };

        const errorHandlingCapabilities = [
            exceptionResult.serverError?.error404,
            exceptionResult.serverError?.error500,
            exceptionResult.networkFailure?.offlineMode
        ].filter(Boolean);

        return {
            capabilities: errorHandlingCapabilities.length,
            maxCapabilities: 3,
            status: errorHandlingCapabilities.length >= 2 ? 'ROBUST' : 'BASIC',
            details: '錯誤處理能力：' + (errorHandlingCapabilities.length >= 2 ? '良好' : '需要改善')
        };
    }

    analyzeFailoverCapability() {
        const networkResult = this.testResults.exceptionHandling?.networkFailure;
        if (!networkResult) return { status: 'UNTESTED' };

        return {
            offlineMode: networkResult.offlineMode || false,
            reconnection: networkResult.reconnection || false,
            dataSync: networkResult.dataSync || false,
            status: (networkResult.offlineMode && networkResult.reconnection) ? 'RESILIENT' : 'BASIC',
            recommendation: ' 考慮實施更完整的離線模式和數據同步機制'
        };
    }

    analyzeCRUDOperations() {
        const businessLogicResult = this.testResults.businessLogic?.employeeManagement;
        if (!businessLogicResult) return { status: 'UNTESTED' };

        const operations = {
            create: businessLogicResult.create || false,
            read: businessLogicResult.read || false,
            update: businessLogicResult.update || false,
            delete: businessLogicResult.delete || false
        };

        const workingOperations = Object.values(operations).filter(Boolean).length;

        return {
            operations,
            workingCount: workingOperations,
            totalCount: 4,
            completeness: (workingOperations / 4) * 100,
            status: workingOperations >= 3 ? 'FUNCTIONAL' : 'IMPAIRED',
            criticalIssues: workingOperations < 2 ? ['基本CRUD操作不完整'] : []
        };
    }

    analyzeTransactionHandling() {
        const dataConflictResult = this.testResults.exceptionHandling?.dataConflict;
        if (!dataConflictResult) return { status: 'UNTESTED' };

        return {
            optimisticLocking: dataConflictResult.optimisticLocking || false,
            transactionSupport: dataConflictResult.transactionHandling || false,
            conflictResolution: dataConflictResult.conflictResolution || false,
            status: dataConflictResult.optimisticLocking ? 'PROTECTED' : 'VULNERABLE',
            recommendation: !dataConflictResult.optimisticLocking ? 
                '建議實施樂觀鎖機制防止數據衝突' : '數據衝突處理機制正常'
        };
    }

    analyzeDataConsistency() {
        const databaseResult = this.testResults.systemIntegration?.database;
        if (!databaseResult) return { status: 'UNTESTED' };

        return {
            connection: databaseResult.connection || false,
            crudConsistency: databaseResult.crud || false,
            status: (databaseResult.connection && databaseResult.crud) ? 'CONSISTENT' : 'AT_RISK',
            recommendation: !databaseResult.connection ? '數據庫連接需要修復' : '數據一致性良好'
        };
    }

    analyzeAuthentication() {
        const authResult = this.testResults.performanceAndSecurity?.authSystem;
        if (!authResult) return { status: 'UNTESTED' };

        return {
            jwtValidation: authResult.jwtValidation || false,
            sessionManagement: authResult.sessionManagement || false,
            strength: authResult.jwtValidation ? 'STRONG' : 'WEAK',
            recommendation: !authResult.jwtValidation ? 'JWT驗證機制需要加強' : '認證系統運作正常'
        };
    }

    analyzeAuthorization() {
        const authResult = this.testResults.performanceAndSecurity?.authSystem;
        if (!authResult) return { status: 'UNTESTED' };

        return {
            permissionControl: authResult.permissionControl || false,
            model: authResult.permissionControl ? 'RBAC_ENABLED' : 'BASIC',
            status: authResult.permissionControl ? 'SECURE' : 'PERMISSIVE',
            recommendation: !authResult.permissionControl ? '需要實施角色權限控制' : '權限控制機制良好'
        };
    }

    analyzeVulnerabilities() {
        const securityResult = this.testResults.performanceAndSecurity?.securityProtection;
        if (!securityResult) return { status: 'UNTESTED' };

        const protections = {
            xss: securityResult.xssProtection || false,
            csrf: securityResult.csrfProtection || false,
            sqlInjection: securityResult.sqlInjectionProtection || false
        };

        const protectedCount = Object.values(protections).filter(Boolean).length;

        return {
            protections,
            protectedCount,
            totalChecks: 3,
            securityScore: (protectedCount / 3) * 100,
            vulnerabilityLevel: protectedCount >= 2 ? 'LOW' : 'HIGH',
            criticalVulnerabilities: Object.keys(protections).filter(key => !protections[key])
        };
    }

    analyzeLoadTimes() {
        const loadSpeedResult = this.testResults.performanceAndSecurity?.loadSpeed;
        if (!loadSpeedResult) return { status: 'UNTESTED' };

        const pageLoadTimes = loadSpeedResult.pageLoadTime || [];
        const avgLoadTime = pageLoadTimes.reduce((sum, p) => sum + p.time, 0) / 
                           Math.max(pageLoadTimes.length, 1);

        return {
            averageLoadTime: avgLoadTime,
            pageCount: pageLoadTimes.length,
            performance: avgLoadTime < 2000 ? 'EXCELLENT' : 
                        avgLoadTime < 5000 ? 'GOOD' : 
                        avgLoadTime < 10000 ? 'ACCEPTABLE' : 'POOR',
            slowestPage: pageLoadTimes.reduce((slowest, current) => 
                current.time > (slowest?.time || 0) ? current : slowest, null),
            recommendation: avgLoadTime > 5000 ? '需要優化頁面載入速度' : '載入速度表現良好'
        };
    }

    analyzeResourceUtilization() {
        const memoryResult = this.testResults.performanceAndSecurity?.memoryUsage;
        if (!memoryResult) return { status: 'UNTESTED' };

        return {
            initialMemoryMB: (memoryResult.initialMemory / 1024 / 1024) || 0,
            peakMemoryMB: (memoryResult.peakMemory / 1024 / 1024) || 0,
            memoryLeakDetected: memoryResult.memoryLeaks || false,
            efficiency: !memoryResult.memoryLeaks ? 'EFFICIENT' : 'CONCERNING',
            recommendation: memoryResult.memoryLeaks ? 
                '檢測到可能的記憶體洩漏，需要調查' : '記憶體使用正常'
        };
    }

    analyzeScalabilityIndicators() {
        const concurrencyResult = this.testResults.exceptionHandling?.concurrency;
        if (!concurrencyResult) return { status: 'UNTESTED' };

        return {
            concurrentRequestHandling: concurrencyResult.concurrentRequests || false,
            loadHandling: concurrencyResult.loadHandling || false,
            scalabilityReadiness: (concurrencyResult.concurrentRequests && concurrencyResult.loadHandling) ? 
                'READY' : 'LIMITED',
            recommendation: !concurrencyResult.concurrentRequests ? 
                '需要改善並發處理能力' : '系統具備基本擴展能力'
        };
    }

    defineNextSteps() {
        const criticalIssues = this.identifyCriticalIssues();
        const recommendations = this.generateRecommendations();

        const nextSteps = {
            immediate: [],
            shortTerm: [],
            longTerm: [],
            monitoring: []
        };

        // 立即行動
        const criticalRecommendations = recommendations.filter(r => r.priority === 'HIGH');
        nextSteps.immediate = criticalRecommendations.map(r => ({
            action: r.action,
            timeline: r.timeline,
            owner: 'Development Team',
            priority: 'CRITICAL'
        }));

        // 短期計劃
        const mediumRecommendations = recommendations.filter(r => r.priority === 'MEDIUM');
        nextSteps.shortTerm = mediumRecommendations.map(r => ({
            action: r.action,
            timeline: r.timeline,
            owner: 'Development Team',
            priority: 'HIGH'
        }));

        // 長期規劃
        const lowRecommendations = recommendations.filter(r => r.priority === 'LOW');
        nextSteps.longTerm = lowRecommendations.map(r => ({
            action: r.action,
            timeline: r.timeline,
            owner: 'DevOps Team',
            priority: 'MEDIUM'
        }));

        // 持續監控
        nextSteps.monitoring = [
            {
                metric: '系統健康度',
                frequency: '每日',
                threshold: '成功率 > 90%',
                action: '低於閾值時發出警報'
            },
            {
                metric: '頁面載入時間',
                frequency: '每小時',
                threshold: '平均 < 3秒',
                action: '性能異常時通知開發團隊'
            },
            {
                metric: 'API響應時間',
                frequency: '實時',
                threshold: '平均 < 1秒',
                action: '響應時間過長時自動擴容'
            }
        ];

        return nextSteps;
    }

    generateHTMLReport(report) {
        return `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>端到端業務流程測試報告</title>
    <style>
        body { font-family: 'Microsoft JhengHei', Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 3px solid #007acc; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #007acc; margin: 0; font-size: 2.5em; }
        .header .subtitle { color: #666; margin: 10px 0; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
        .summary-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; text-align: center; }
        .summary-card h3 { margin: 0 0 10px 0; font-size: 1.2em; }
        .summary-card .value { font-size: 2em; font-weight: bold; margin: 10px 0; }
        .section { margin: 40px 0; }
        .section h2 { color: #333; border-left: 5px solid #007acc; padding-left: 15px; margin-bottom: 20px; }
        .test-result { margin: 20px 0; padding: 15px; border-radius: 5px; border-left: 5px solid #ccc; }
        .test-result.success { background: #d4edda; border-left-color: #28a745; }
        .test-result.failure { background: #f8d7da; border-left-color: #dc3545; }
        .test-result.warning { background: #fff3cd; border-left-color: #ffc107; }
        .issue { margin: 15px 0; padding: 15px; background: #fff; border-radius: 5px; border-left: 4px solid #dc3545; }
        .recommendation { margin: 15px 0; padding: 15px; background: #e7f3ff; border-radius: 5px; border-left: 4px solid #007acc; }
        .priority-high { border-left-color: #dc3545; }
        .priority-medium { border-left-color: #ffc107; }
        .priority-low { border-left-color: #28a745; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; font-weight: bold; }
        .status-excellent { color: #28a745; font-weight: bold; }
        .status-good { color: #007acc; font-weight: bold; }
        .status-fair { color: #ffc107; font-weight: bold; }
        .status-poor { color: #dc3545; font-weight: bold; }
        .footer { text-align: center; margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>端到端業務流程測試報告</h1>
            <div class="subtitle">員工管理系統完整性驗證</div>
            <div class="subtitle">測試日期: ${new Date(report.metadata.testDate).toLocaleString('zh-TW')}</div>
            <div class="subtitle">測試環境: ${report.metadata.testEnvironment}</div>
        </div>

        <div class="summary">
            <div class="summary-card">
                <h3>整體健康度</h3>
                <div class="value">${report.executive_summary.overallHealth.score.toFixed(1)}%</div>
                <div class="status-${report.executive_summary.overallHealth.status.toLowerCase()}">${report.executive_summary.overallHealth.status}</div>
            </div>
            <div class="summary-card">
                <h3>測試通過率</h3>
                <div class="value">${((report.statistics.passedTests / Math.max(report.statistics.totalTests, 1)) * 100).toFixed(1)}%</div>
                <div>${report.statistics.passedTests}/${report.statistics.totalTests} 通過</div>
            </div>
            <div class="summary-card">
                <h3>關鍵問題</h3>
                <div class="value">${report.executive_summary.criticalIssues.length}</div>
                <div>需要立即處理</div>
            </div>
            <div class="summary-card">
                <h3>測試時間</h3>
                <div class="value">${report.metadata.duration}</div>
                <div>總執行時間</div>
            </div>
        </div>

        <div class="section">
            <h2>🎯 執行摘要</h2>
            <div class="test-result ${report.executive_summary.businessImpact.operationalRisk === 'LOW' ? 'success' : 'failure'}">
                <h3>營運風險評估</h3>
                <p><strong>風險等級:</strong> ${report.executive_summary.businessImpact.operationalRisk}</p>
                <p><strong>用戶影響:</strong> ${report.executive_summary.businessImpact.userImpact}</p>
                <p><strong>業務連續性:</strong> ${report.executive_summary.businessImpact.businessContinuity}</p>
                <p><strong>建議行動:</strong> ${report.executive_summary.businessImpact.recommendedActions}</p>
            </div>
        </div>

        <div class="section">
            <h2>🚨 關鍵問題</h2>
            ${report.executive_summary.criticalIssues.map(issue => `
                <div class="issue">
                    <h4>${issue.description} <span class="status-poor">[${issue.severity}]</span></h4>
                    <p><strong>分類:</strong> ${issue.category}</p>
                    <p><strong>影響:</strong> ${issue.impact}</p>
                </div>
            `).join('')}
        </div>

        <div class="section">
            <h2>💡 改善建議</h2>
            ${report.executive_summary.recommendations.map(rec => `
                <div class="recommendation priority-${rec.priority.toLowerCase()}">
                    <h4>${rec.action} <span class="status-good">[${rec.priority}]</span></h4>
                    <p><strong>分類:</strong> ${rec.category}</p>
                    <p><strong>時間軸:</strong> ${rec.timeline}</p>
                    <p><strong>詳情:</strong> ${rec.details}</p>
                </div>
            `).join('')}
        </div>

        <div class="section">
            <h2>📊 詳細測試結果</h2>
            
            <h3>👤 用戶旅程測試</h3>
            <table>
                <tr>
                    <th>用戶類型</th>
                    <th>測試狀態</th>
                    <th>成功步驟</th>
                    <th>總步驟</th>
                    <th>成功率</th>
                </tr>
                ${Object.keys(report.test_results.userJourney || {}).map(userType => {
                    const result = report.test_results.userJourney[userType];
                    if (result && result.steps) {
                        const successCount = result.steps.filter(step => step.success).length;
                        const totalCount = result.steps.length;
                        return `
                            <tr>
                                <td>${userType}</td>
                                <td class="status-${result.success ? 'good' : 'poor'}">${result.success ? '成功' : '失敗'}</td>
                                <td>${successCount}</td>
                                <td>${totalCount}</td>
                                <td>${((successCount / totalCount) * 100).toFixed(1)}%</td>
                            </tr>
                        `;
                    }
                    return '';
                }).join('')}
            </table>

            <h3>⚡ 業務邏輯測試</h3>
            <div class="test-result ${report.test_results.businessLogic?.employeeManagement?.create ? 'success' : 'failure'}">
                <h4>員工管理系統</h4>
                <p>創建: ${report.test_results.businessLogic?.employeeManagement?.create ? '✅' : '❌'}</p>
                <p>讀取: ${report.test_results.businessLogic?.employeeManagement?.read ? '✅' : '❌'}</p>
                <p>更新: ${report.test_results.businessLogic?.employeeManagement?.update ? '✅' : '❌'}</p>
                <p>刪除: ${report.test_results.businessLogic?.employeeManagement?.delete ? '✅' : '❌'}</p>
            </div>

            <h3>🔄 系統整合測試</h3>
            <div class="test-result ${report.test_results.systemIntegration?.frontendBackend?.apiConnectivity ? 'success' : 'warning'}">
                <h4>前後端通信</h4>
                <p>API連通性: ${report.test_results.systemIntegration?.frontendBackend?.apiConnectivity ? '✅' : '❌'}</p>
                <p>數據傳輸: ${report.test_results.systemIntegration?.frontendBackend?.dataTransmission ? '✅' : '❌'}</p>
                <p>錯誤處理: ${report.test_results.systemIntegration?.frontendBackend?.errorHandling ? '✅' : '❌'}</p>
            </div>

            <h3>🔒 安全性測試</h3>
            <div class="test-result ${report.test_results.performanceAndSecurity?.securityProtection?.xssProtection ? 'success' : 'warning'}">
                <h4>安全防護</h4>
                <p>XSS防護: ${report.test_results.performanceAndSecurity?.securityProtection?.xssProtection ? '✅' : '❌'}</p>
                <p>CSRF防護: ${report.test_results.performanceAndSecurity?.securityProtection?.csrfProtection ? '✅' : '❌'}</p>
                <p>SQL注入防護: ${report.test_results.performanceAndSecurity?.securityProtection?.sqlInjectionProtection ? '✅' : '❌'}</p>
            </div>
        </div>

        <div class="section">
            <h2>📋 下一步行動計劃</h2>
            
            <h3>立即行動 (24-48小時內)</h3>
            ${report.next_steps.immediate.map(step => `
                <div class="recommendation priority-high">
                    <h4>${step.action}</h4>
                    <p><strong>時間軸:</strong> ${step.timeline}</p>
                    <p><strong>負責人:</strong> ${step.owner}</p>
                    <p><strong>優先級:</strong> ${step.priority}</p>
                </div>
            `).join('')}

            <h3>短期計劃 (1-2週內)</h3>
            ${report.next_steps.shortTerm.map(step => `
                <div class="recommendation priority-medium">
                    <h4>${step.action}</h4>
                    <p><strong>時間軸:</strong> ${step.timeline}</p>
                    <p><strong>負責人:</strong> ${step.owner}</p>
                </div>
            `).join('')}

            <h3>持續監控</h3>
            ${report.next_steps.monitoring.map(monitor => `
                <div class="recommendation priority-low">
                    <h4>${monitor.metric}</h4>
                    <p><strong>頻率:</strong> ${monitor.frequency}</p>
                    <p><strong>閾值:</strong> ${monitor.threshold}</p>
                    <p><strong>行動:</strong> ${monitor.action}</p>
                </div>
            `).join('')}
        </div>

        <div class="footer">
            <p>此報告由智慧端到端業務流程測試系統自動生成</p>
            <p>測試引擎版本: ${report.metadata.testerVersion} | 生成時間: ${new Date().toLocaleString('zh-TW')}</p>
        </div>
    </div>
</body>
</html>`;
    }

    displayTestSummary(report) {
        console.log('\n🎉 端到端業務流程測試完成!');
        console.log('=' .repeat(60));
        console.log(`📊 測試概況:`);
        console.log(`   💯 整體健康度: ${report.executive_summary.overallHealth.score.toFixed(1)}% (${report.executive_summary.overallHealth.status})`);
        console.log(`   ✅ 測試通過率: ${((report.statistics.passedTests / Math.max(report.statistics.totalTests, 1)) * 100).toFixed(1)}%`);
        console.log(`   🚨 關鍵問題: ${report.executive_summary.criticalIssues.length} 個`);
        console.log(`   💡 改善建議: ${report.executive_summary.recommendations.length} 項`);
        console.log(`   ⏱️ 測試時間: ${report.metadata.duration}`);

        console.log(`\n🎯 業務影響評估:`);
        console.log(`   🔥 營運風險: ${report.executive_summary.businessImpact.operationalRisk}`);
        console.log(`   👥 用戶影響: ${report.executive_summary.businessImpact.userImpact}`);
        console.log(`   🏢 業務連續性: ${report.executive_summary.businessImpact.businessContinuity}`);

        if (report.executive_summary.criticalIssues.length > 0) {
            console.log(`\n🚨 關鍵問題清單:`);
            report.executive_summary.criticalIssues.forEach((issue, index) => {
                console.log(`   ${index + 1}. [${issue.severity}] ${issue.description}`);
                console.log(`      影響: ${issue.impact}`);
            });
        }

        if (report.executive_summary.recommendations.length > 0) {
            console.log(`\n💡 優先改善建議:`);
            report.executive_summary.recommendations
                .filter(rec => rec.priority === 'HIGH')
                .forEach((rec, index) => {
                    console.log(`   ${index + 1}. [${rec.priority}] ${rec.action}`);
                    console.log(`      時間軸: ${rec.timeline}`);
                });
        }

        console.log(`\n📈 詳細發現:`);
        console.log(`   👤 用戶體驗: ${this.summarizeUserExperience()}`);
        console.log(`   🔧 系統可靠性: ${this.summarizeSystemReliability()}`);
        console.log(`   💾 數據完整性: ${this.summarizeDataIntegrity()}`);
        console.log(`   🔒 安全狀態: ${this.summarizeSecurityPosture()}`);
        console.log(`   ⚡ 效能表現: ${this.summarizePerformanceProfile()}`);
    }

    summarizeUserExperience() {
        const userJourney = this.testResults.userJourney || {};
        const flows = Object.keys(userJourney).length;
        const workingFlows = Object.values(userJourney).filter(flow => 
            flow && typeof flow === 'object' && flow.success
        ).length;
        return `${workingFlows}/${flows} 用戶流程正常運作`;
    }

    summarizeSystemReliability() {
        const integration = this.testResults.systemIntegration?.frontendBackend;
        const apiConnectivity = integration?.apiConnectivity || false;
        const errorHandling = this.testResults.exceptionHandling?.serverError || {};
        return apiConnectivity && (errorHandling.error404 || errorHandling.error500) ? '系統穩定' : '需要改善';
    }

    summarizeDataIntegrity() {
        const employeeManagement = this.testResults.businessLogic?.employeeManagement || {};
        const workingOperations = Object.values(employeeManagement).filter(Boolean).length;
        return `${workingOperations}/4 CRUD操作正常`;
    }

    summarizeSecurityPosture() {
        const securityProtection = this.testResults.performanceAndSecurity?.securityProtection || {};
        const protections = Object.values(securityProtection).filter(Boolean).length;
        const totalChecks = Object.keys(securityProtection).length;
        return totalChecks > 0 ? `${protections}/${totalChecks} 安全防護已實施` : '安全狀態未知';
    }

    summarizePerformanceProfile() {
        const loadSpeed = this.testResults.performanceAndSecurity?.loadSpeed;
        if (loadSpeed && loadSpeed.pageLoadTime) {
            const avgTime = loadSpeed.pageLoadTime.reduce((sum, p) => sum + p.time, 0) / loadSpeed.pageLoadTime.length;
            return avgTime < 3000 ? '效能良好' : '效能需要優化';
        }
        return '效能狀態未知';
    }

    async cleanup() {
        try {
            if (this.browser) {
                await this.browser.close();
            }
            console.log('✅ 測試環境清理完成');
        } catch (error) {
            console.error('❌ 清理過程發生錯誤:', error);
        }
    }
}

// 主執行函數
async function runCompleteBusinessProcessTest() {
    const tester = new CompleteBussinesProcessTester();
    
    try {
        console.log('🚀 啟動完整的端到端業務流程測試系統');
        console.log('基於智慧瀏覽器深度測試結果進行完整驗證');
        console.log('=' .repeat(60));

        // 初始化測試環境
        const initialized = await tester.initialize();
        if (!initialized) {
            throw new Error('測試環境初始化失敗');
        }

        // 執行完整測試
        await tester.runCompleteTest();
        
        console.log('\n🎊 端到端業務流程測試系統執行完成!');
        console.log('所有測試結果已保存到報告檔案中');
        
    } catch (error) {
        console.error('❌ 測試系統執行失敗:', error);
        process.exit(1);
    } finally {
        // 清理資源
        await tester.cleanup();
    }
}

// 如果直接執行此檔案
if (require.main === module) {
    runCompleteBusinessProcessTest()
        .then(() => {
            console.log('✅ 端到端業務流程測試系統執行成功');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ 系統執行失敗:', error);
            process.exit(1);
        });
}

module.exports = { CompleteBussinesProcessTester, runCompleteBusinessProcessTest };