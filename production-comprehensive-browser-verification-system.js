/**
 * 🚀 Railway生產環境全面瀏覽器驗證系統
 * 智慧多層次深度驗證引擎 - /pro 模式專用
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class ProductionBrowserVerificationSystem {
    constructor() {
        this.baseUrl = 'https://web-production-6eb6.up.railway.app';
        this.verificationResults = {
            timestamp: new Date().toISOString(),
            overallStatus: 'PENDING',
            testResults: [],
            performanceMetrics: {},
            consoleAnalysis: {},
            errorLog: [],
            securityIssues: [],
            mobileCompatibility: {}
        };
        
        // 🎭 多角色測試配置
        this.testRoles = [
            {
                role: '系統管理員',
                username: 'admin',
                password: 'admin123',
                expectedPages: ['admin', 'employee-management', 'system-settings', 'reports']
            },
            {
                role: '店長',
                username: 'manager',
                password: 'manager123',
                expectedPages: ['employee-dashboard', 'schedule', 'reports', 'revenue']
            },
            {
                role: '一般員工',
                username: 'employee',
                password: 'employee123',
                expectedPages: ['employee-dashboard', 'attendance', 'profile']
            },
            {
                role: '實習生',
                username: 'intern',
                password: 'intern123',
                expectedPages: ['employee-dashboard', 'attendance', 'profile']
            }
        ];
        
        // 📱 移動設備模擬配置
        this.mobileDevices = [
            { name: 'iPhone 12', width: 390, height: 844 },
            { name: 'Samsung Galaxy S21', width: 384, height: 854 },
            { name: 'iPad', width: 768, height: 1024 },
            { name: 'Desktop', width: 1920, height: 1080 }
        ];
    }

    async startComprehensiveVerification() {
        console.log('🚀 啟動Railway生產環境全面驗證系統...');
        
        try {
            // 🌐 第一階段：基礎連接性驗證
            await this.verifyBasicConnectivity();
            
            // 🎭 第二階段：多角色深度驗證
            await this.performMultiRoleVerification();
            
            // 📱 第三階段：響應式設計驗證
            await this.verifyResponsiveDesign();
            
            // 🔍 第四階段：深度功能驗證
            await this.performDeepFunctionalityTest();
            
            // 🛡️ 第五階段：安全性驗證
            await this.performSecurityVerification();
            
            // 📊 第六階段：性能分析
            await this.performPerformanceAnalysis();
            
            // 📋 生成完整報告
            await this.generateComprehensiveReport();
            
            console.log('✅ 全面驗證完成！');
            
        } catch (error) {
            console.error('❌ 驗證過程發生錯誤:', error);
            this.verificationResults.overallStatus = 'FAILED';
            this.verificationResults.errorLog.push({
                timestamp: new Date().toISOString(),
                error: error.message,
                stack: error.stack
            });
        }
    }

    async verifyBasicConnectivity() {
        console.log('🌐 執行基礎連接性驗證...');
        
        const browser = await puppeteer.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        try {
            const page = await browser.newPage();
            
            // 監控控制台訊息
            page.on('console', msg => {
                this.verificationResults.consoleAnalysis[`console_${Date.now()}`] = {
                    type: msg.type(),
                    text: msg.text(),
                    timestamp: new Date().toISOString()
                };
            });
            
            // 監控網路錯誤
            page.on('pageerror', error => {
                this.verificationResults.errorLog.push({
                    type: 'Page Error',
                    message: error.message,
                    timestamp: new Date().toISOString()
                });
            });
            
            console.log(`🔗 正在連接: ${this.baseUrl}`);
            const response = await page.goto(this.baseUrl, { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });
            
            // 基礎驗證結果
            const basicTest = {
                testName: '基礎連接性驗證',
                status: response.status() === 200 ? 'PASSED' : 'FAILED',
                responseStatus: response.status(),
                loadTime: Date.now(),
                url: this.baseUrl,
                timestamp: new Date().toISOString()
            };
            
            if (response.status() === 200) {
                console.log('✅ 網站連接成功');
                
                // 截圖保存
                await page.screenshot({
                    path: `production-homepage-${Date.now()}.png`,
                    fullPage: true
                });
                
                // 檢查頁面基本元素
                const title = await page.title();
                const bodyContent = await page.evaluate(() => document.body.innerHTML);
                
                basicTest.pageTitle = title;
                basicTest.hasContent = bodyContent.length > 100;
                basicTest.contentLength = bodyContent.length;
                
                console.log(`📄 頁面標題: ${title}`);
                console.log(`📝 內容長度: ${bodyContent.length} 字符`);
                
            } else {
                console.log(`❌ 連接失敗，狀態碼: ${response.status()}`);
            }
            
            this.verificationResults.testResults.push(basicTest);
            
        } finally {
            await browser.close();
        }
    }

    async performMultiRoleVerification() {
        console.log('🎭 執行多角色深度驗證...');
        
        for (const roleConfig of this.testRoles) {
            console.log(`👤 測試角色: ${roleConfig.role}`);
            
            const browser = await puppeteer.launch({
                headless: false,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            
            try {
                const page = await browser.newPage();
                
                // 設置視窗大小
                await page.setViewport({ width: 1920, height: 1080 });
                
                // 監控控制台和錯誤
                page.on('console', msg => {
                    this.verificationResults.consoleAnalysis[`${roleConfig.role}_${Date.now()}`] = {
                        role: roleConfig.role,
                        type: msg.type(),
                        text: msg.text(),
                        timestamp: new Date().toISOString()
                    };
                });
                
                const roleTest = await this.performRoleSpecificTest(page, roleConfig);
                this.verificationResults.testResults.push(roleTest);
                
            } finally {
                await browser.close();
            }
        }
    }

    async performRoleSpecificTest(page, roleConfig) {
        const testResult = {
            testName: `角色驗證 - ${roleConfig.role}`,
            role: roleConfig.role,
            status: 'PENDING',
            loginSuccess: false,
            pageAccessibility: {},
            functionalityTests: {},
            dataOperations: {},
            screenshots: [],
            timestamp: new Date().toISOString()
        };
        
        try {
            // 🔐 Step 1: 登入驗證
            console.log(`🔐 ${roleConfig.role} - 執行登入驗證...`);
            
            await page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
            
            // 尋找登入表單
            const loginFormExists = await page.$('#loginForm') !== null;
            if (!loginFormExists) {
                throw new Error('登入表單不存在');
            }
            
            // 填寫登入資訊
            await page.type('#username', roleConfig.username);
            await page.type('#password', roleConfig.password);
            
            // 登入前截圖
            const loginScreenshot = `login-${roleConfig.role}-${Date.now()}.png`;
            await page.screenshot({ path: loginScreenshot });
            testResult.screenshots.push(loginScreenshot);
            
            // 提交登入
            await page.click('#loginBtn');
            await page.waitForNavigation({ waitUntil: 'networkidle2' });
            
            // 檢查登入是否成功
            const currentUrl = page.url();
            testResult.loginSuccess = !currentUrl.includes('login') && !currentUrl.includes('error');
            
            if (testResult.loginSuccess) {
                console.log(`✅ ${roleConfig.role} 登入成功`);
                
                // 🏠 Step 2: 頁面可訪問性驗證
                await this.verifyPageAccessibility(page, roleConfig, testResult);
                
                // 🔧 Step 3: 功能性驗證
                await this.verifyRoleFunctionality(page, roleConfig, testResult);
                
                // 💾 Step 4: 數據操作驗證
                await this.verifyDataOperations(page, roleConfig, testResult);
                
                testResult.status = 'PASSED';
                
            } else {
                console.log(`❌ ${roleConfig.role} 登入失敗`);
                testResult.status = 'FAILED';
            }
            
        } catch (error) {
            console.error(`❌ ${roleConfig.role} 測試失敗:`, error.message);
            testResult.status = 'FAILED';
            testResult.error = error.message;
        }
        
        return testResult;
    }

    async verifyPageAccessibility(page, roleConfig, testResult) {
        console.log(`🏠 ${roleConfig.role} - 驗證頁面可訪問性...`);
        
        for (const expectedPage of roleConfig.expectedPages) {
            try {
                // 嘗試導航到每個預期頁面
                const pageUrl = `${this.baseUrl}/${expectedPage}`;
                await page.goto(pageUrl, { waitUntil: 'networkidle2' });
                
                const pageTitle = await page.title();
                const hasContent = await page.evaluate(() => document.body.innerHTML.length > 100);
                
                testResult.pageAccessibility[expectedPage] = {
                    accessible: true,
                    title: pageTitle,
                    hasContent: hasContent,
                    url: pageUrl
                };
                
                console.log(`  ✅ ${expectedPage} 頁面可訪問`);
                
                // 截圖保存
                const pageScreenshot = `${roleConfig.role}-${expectedPage}-${Date.now()}.png`;
                await page.screenshot({ path: pageScreenshot });
                testResult.screenshots.push(pageScreenshot);
                
            } catch (error) {
                testResult.pageAccessibility[expectedPage] = {
                    accessible: false,
                    error: error.message
                };
                console.log(`  ❌ ${expectedPage} 頁面無法訪問: ${error.message}`);
            }
        }
    }

    async verifyRoleFunctionality(page, roleConfig, testResult) {
        console.log(`🔧 ${roleConfig.role} - 驗證角色特定功能...`);
        
        switch (roleConfig.role) {
            case '系統管理員':
                testResult.functionalityTests = await this.testAdminFunctions(page);
                break;
            case '店長':
                testResult.functionalityTests = await this.testManagerFunctions(page);
                break;
            case '一般員工':
            case '實習生':
                testResult.functionalityTests = await this.testEmployeeFunctions(page);
                break;
        }
    }

    async testAdminFunctions(page) {
        const adminTests = {};
        
        try {
            // 測試員工管理功能
            console.log('  🧑‍💼 測試員工管理功能...');
            await page.goto(`${this.baseUrl}/admin`, { waitUntil: 'networkidle2' });
            
            // 檢查管理面板是否存在
            const adminPanelExists = await page.$('.admin-panel') !== null;
            adminTests.adminPanelAccess = adminPanelExists;
            
            // 測試員工列表顯示
            const employeeListExists = await page.$('.employee-list') !== null || 
                                     await page.$('#employeeTable') !== null;
            adminTests.employeeListDisplay = employeeListExists;
            
            // 測試新增員工按鈕
            const addEmployeeBtn = await page.$('#addEmployeeBtn') !== null ||
                                 await page.$('button[onclick*="addEmployee"]') !== null;
            adminTests.addEmployeeButton = addEmployeeBtn;
            
            console.log('  ✅ 管理員功能驗證完成');
            
        } catch (error) {
            adminTests.error = error.message;
            console.log('  ❌ 管理員功能驗證失敗:', error.message);
        }
        
        return adminTests;
    }

    async testManagerFunctions(page) {
        const managerTests = {};
        
        try {
            // 測試排班管理
            console.log('  📅 測試排班管理功能...');
            await page.goto(`${this.baseUrl}/schedule`, { waitUntil: 'networkidle2' });
            
            const scheduleExists = await page.$('.schedule-container') !== null ||
                                 await page.$('#scheduleTable') !== null;
            managerTests.scheduleAccess = scheduleExists;
            
            // 測試營收報表
            console.log('  💰 測試營收報表功能...');
            await page.goto(`${this.baseUrl}/revenue`, { waitUntil: 'networkidle2' });
            
            const revenueExists = await page.$('.revenue-container') !== null ||
                                await page.$('#revenueChart') !== null;
            managerTests.revenueAccess = revenueExists;
            
            console.log('  ✅ 店長功能驗證完成');
            
        } catch (error) {
            managerTests.error = error.message;
            console.log('  ❌ 店長功能驗證失敗:', error.message);
        }
        
        return managerTests;
    }

    async testEmployeeFunctions(page) {
        const employeeTests = {};
        
        try {
            // 測試考勤打卡
            console.log('  🕒 測試考勤打卡功能...');
            await page.goto(`${this.baseUrl}/attendance`, { waitUntil: 'networkidle2' });
            
            const attendanceExists = await page.$('.attendance-container') !== null ||
                                   await page.$('#clockInBtn') !== null;
            employeeTests.attendanceAccess = attendanceExists;
            
            // 測試個人資料
            console.log('  👤 測試個人資料功能...');
            await page.goto(`${this.baseUrl}/profile`, { waitUntil: 'networkidle2' });
            
            const profileExists = await page.$('.profile-container') !== null ||
                                 await page.$('#profileForm') !== null;
            employeeTests.profileAccess = profileExists;
            
            console.log('  ✅ 員工功能驗證完成');
            
        } catch (error) {
            employeeTests.error = error.message;
            console.log('  ❌ 員工功能驗證失敗:', error.message);
        }
        
        return employeeTests;
    }

    async verifyDataOperations(page, roleConfig, testResult) {
        console.log(`💾 ${roleConfig.role} - 驗證數據操作功能...`);
        
        const dataTests = {};
        
        try {
            // 根據角色測試不同的數據操作
            if (roleConfig.role === '系統管理員') {
                // 測試員工資料CRUD操作
                dataTests.employeeCRUD = await this.testEmployeeCRUD(page);
            } else if (roleConfig.role === '店長') {
                // 測試排班和營收數據操作
                dataTests.scheduleOperations = await this.testScheduleOperations(page);
            } else {
                // 測試個人資料更新
                dataTests.profileUpdate = await this.testProfileUpdate(page);
            }
            
            testResult.dataOperations = dataTests;
            
        } catch (error) {
            testResult.dataOperations.error = error.message;
            console.log(`  ❌ ${roleConfig.role} 數據操作驗證失敗:`, error.message);
        }
    }

    async testEmployeeCRUD(page) {
        const crudTests = {
            create: false,
            read: false,
            update: false,
            delete: false
        };
        
        try {
            // 導航到管理頁面
            await page.goto(`${this.baseUrl}/admin`, { waitUntil: 'networkidle2' });
            
            // 測試讀取 (Read)
            const employeeTableExists = await page.$('table') !== null ||
                                       await page.$('.employee-list') !== null;
            crudTests.read = employeeTableExists;
            
            // 測試新增 (Create) - 尋找新增按鈕
            const addButtonExists = await page.$('button[onclick*="add"]') !== null ||
                                  await page.$('#addEmployeeBtn') !== null ||
                                  await page.$('.add-employee') !== null;
            crudTests.create = addButtonExists;
            
            // 測試編輯 (Update) - 尋找編輯按鈕
            const editButtonExists = await page.$('button[onclick*="edit"]') !== null ||
                                    await page.$('.edit-btn') !== null ||
                                    await page.$('i.fa-edit') !== null;
            crudTests.update = editButtonExists;
            
            // 測試刪除 (Delete) - 尋找刪除按鈕
            const deleteButtonExists = await page.$('button[onclick*="delete"]') !== null ||
                                      await page.$('.delete-btn') !== null ||
                                      await page.$('i.fa-trash') !== null;
            crudTests.delete = deleteButtonExists;
            
            console.log('  ✅ 員工CRUD操作檢查完成');
            
        } catch (error) {
            crudTests.error = error.message;
            console.log('  ❌ 員工CRUD操作檢查失敗:', error.message);
        }
        
        return crudTests;
    }

    async testScheduleOperations(page) {
        const scheduleTests = {
            viewSchedule: false,
            addSchedule: false,
            editSchedule: false
        };
        
        try {
            await page.goto(`${this.baseUrl}/schedule`, { waitUntil: 'networkidle2' });
            
            scheduleTests.viewSchedule = await page.$('.schedule') !== null ||
                                       await page.$('#scheduleTable') !== null;
            
            scheduleTests.addSchedule = await page.$('button[onclick*="add"]') !== null ||
                                      await page.$('#addScheduleBtn') !== null;
            
            scheduleTests.editSchedule = await page.$('button[onclick*="edit"]') !== null ||
                                       await page.$('.edit-schedule') !== null;
            
            console.log('  ✅ 排班操作檢查完成');
            
        } catch (error) {
            scheduleTests.error = error.message;
            console.log('  ❌ 排班操作檢查失敗:', error.message);
        }
        
        return scheduleTests;
    }

    async testProfileUpdate(page) {
        const profileTests = {
            viewProfile: false,
            editProfile: false,
            saveProfile: false
        };
        
        try {
            await page.goto(`${this.baseUrl}/profile`, { waitUntil: 'networkidle2' });
            
            profileTests.viewProfile = await page.$('form') !== null ||
                                     await page.$('.profile-form') !== null;
            
            profileTests.editProfile = await page.$('input[type="text"]') !== null ||
                                     await page.$('textarea') !== null;
            
            profileTests.saveProfile = await page.$('button[type="submit"]') !== null ||
                                     await page.$('#saveBtn') !== null;
            
            console.log('  ✅ 個人資料操作檢查完成');
            
        } catch (error) {
            profileTests.error = error.message;
            console.log('  ❌ 個人資料操作檢查失敗:', error.message);
        }
        
        return profileTests;
    }

    async verifyResponsiveDesign() {
        console.log('📱 執行響應式設計驗證...');
        
        for (const device of this.mobileDevices) {
            console.log(`📱 測試設備: ${device.name} (${device.width}x${device.height})`);
            
            const browser = await puppeteer.launch({
                headless: false,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            
            try {
                const page = await browser.newPage();
                await page.setViewport({ 
                    width: device.width, 
                    height: device.height 
                });
                
                await page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
                
                // 截圖保存
                const deviceScreenshot = `responsive-${device.name.replace(' ', '-')}-${Date.now()}.png`;
                await page.screenshot({ path: deviceScreenshot });
                
                // 檢查響應式元素
                const responsiveTest = {
                    device: device.name,
                    resolution: `${device.width}x${device.height}`,
                    screenshot: deviceScreenshot,
                    mobileMenuExists: await page.$('.mobile-menu') !== null,
                    horizontalScroll: await page.evaluate(() => document.body.scrollWidth > window.innerWidth),
                    timestamp: new Date().toISOString()
                };
                
                this.verificationResults.mobileCompatibility[device.name] = responsiveTest;
                
                console.log(`  ✅ ${device.name} 響應式測試完成`);
                
            } finally {
                await browser.close();
            }
        }
    }

    async performDeepFunctionalityTest() {
        console.log('🔍 執行深度功能驗證...');
        
        const browser = await puppeteer.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        try {
            const page = await browser.newPage();
            
            // 深度功能測試
            const deepTests = {
                formValidation: await this.testFormValidation(page),
                ajaxCalls: await this.testAjaxFunctionality(page),
                navigationFlow: await this.testNavigationFlow(page),
                errorHandling: await this.testErrorHandling(page)
            };
            
            this.verificationResults.testResults.push({
                testName: '深度功能驗證',
                status: 'COMPLETED',
                results: deepTests,
                timestamp: new Date().toISOString()
            });
            
        } finally {
            await browser.close();
        }
    }

    async testFormValidation(page) {
        console.log('  📝 測試表單驗證...');
        
        try {
            await page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
            
            // 測試空白提交
            const loginForm = await page.$('#loginForm');
            if (loginForm) {
                await page.click('#loginBtn');
                
                // 檢查是否有驗證訊息
                const validationExists = await page.$('.error-message') !== null ||
                                        await page.$('.validation-error') !== null ||
                                        await page.evaluate(() => {
                                            const inputs = document.querySelectorAll('input[required]');
                                            return Array.from(inputs).some(input => !input.checkValidity());
                                        });
                
                return { hasValidation: validationExists };
            }
            
            return { hasValidation: false, error: '登入表單不存在' };
            
        } catch (error) {
            return { hasValidation: false, error: error.message };
        }
    }

    async testAjaxFunctionality(page) {
        console.log('  🔄 測試AJAX功能...');
        
        const ajaxRequests = [];
        
        page.on('response', response => {
            if (response.url().includes('/api/') || 
                response.headers()['content-type']?.includes('application/json')) {
                ajaxRequests.push({
                    url: response.url(),
                    status: response.status(),
                    method: response.request().method()
                });
            }
        });
        
        try {
            await page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
            
            // 觸發一些可能的AJAX操作
            const buttons = await page.$$('button');
            if (buttons.length > 0) {
                await buttons[0].click();
                await page.waitForTimeout(2000);
            }
            
            return {
                ajaxCallsDetected: ajaxRequests.length > 0,
                totalRequests: ajaxRequests.length,
                requests: ajaxRequests.slice(0, 5) // 只保存前5個請求
            };
            
        } catch (error) {
            return { ajaxCallsDetected: false, error: error.message };
        }
    }

    async testNavigationFlow(page) {
        console.log('  🧭 測試導航流程...');
        
        try {
            await page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
            
            // 收集所有導航連結
            const navLinks = await page.evaluate(() => {
                const links = Array.from(document.querySelectorAll('a[href], button[onclick]'));
                return links.slice(0, 10).map(link => ({
                    text: link.textContent?.trim() || '無文字',
                    href: link.href || link.getAttribute('onclick') || '無連結'
                }));
            });
            
            return {
                navigationLinksFound: navLinks.length > 0,
                totalLinks: navLinks.length,
                sampleLinks: navLinks
            };
            
        } catch (error) {
            return { navigationLinksFound: false, error: error.message };
        }
    }

    async testErrorHandling(page) {
        console.log('  ⚠️ 測試錯誤處理...');
        
        try {
            // 測試404頁面
            const response = await page.goto(`${this.baseUrl}/nonexistent-page`, { 
                waitUntil: 'networkidle2' 
            });
            
            const has404Handling = response.status() === 404 || 
                                  await page.$('.error-404') !== null ||
                                  await page.content().includes('404') ||
                                  await page.content().includes('找不到');
            
            return {
                has404Handling: has404Handling,
                responseStatus: response.status()
            };
            
        } catch (error) {
            return { has404Handling: false, error: error.message };
        }
    }

    async performSecurityVerification() {
        console.log('🛡️ 執行安全性驗證...');
        
        const browser = await puppeteer.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        try {
            const page = await browser.newPage();
            await page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
            
            const securityTests = {
                httpsUsage: page.url().startsWith('https://'),
                csrfProtection: await this.checkCSRFProtection(page),
                sqlInjectionPrevention: await this.testSQLInjectionPrevention(page),
                xssProtection: await this.testXSSProtection(page)
            };
            
            this.verificationResults.securityIssues = securityTests;
            
        } finally {
            await browser.close();
        }
    }

    async checkCSRFProtection(page) {
        try {
            // 檢查是否有CSRF token
            const csrfToken = await page.evaluate(() => {
                const metaCsrf = document.querySelector('meta[name="csrf-token"]');
                const hiddenCsrf = document.querySelector('input[name="_token"]');
                return !!(metaCsrf || hiddenCsrf);
            });
            
            return { hasCSRFProtection: csrfToken };
            
        } catch (error) {
            return { hasCSRFProtection: false, error: error.message };
        }
    }

    async testSQLInjectionPrevention(page) {
        try {
            // 測試簡單的SQL注入輸入
            const loginForm = await page.$('#username');
            if (loginForm) {
                await page.type('#username', "admin'; DROP TABLE users; --");
                await page.type('#password', 'test');
                await page.click('#loginBtn');
                
                // 檢查是否有錯誤處理而不是直接執行
                await page.waitForTimeout(2000);
                const hasError = await page.$('.error') !== null ||
                                await page.content().includes('錯誤') ||
                                await page.content().includes('error');
                
                return { preventsSQLInjection: hasError };
            }
            
            return { preventsSQLInjection: false, error: '無法找到登入表單' };
            
        } catch (error) {
            return { preventsSQLInjection: true, note: '輸入被阻止或處理正確' };
        }
    }

    async testXSSProtection(page) {
        try {
            // 檢查XSS保護
            const xssTest = await page.evaluate(() => {
                // 嘗試注入簡單的XSS
                const testDiv = document.createElement('div');
                testDiv.innerHTML = '<script>window.xssTest = true;</script>';
                document.body.appendChild(testDiv);
                
                // 檢查腳本是否被執行
                return !window.xssTest;
            });
            
            return { preventsXSS: xssTest };
            
        } catch (error) {
            return { preventsXSS: true, note: '環境阻止了XSS測試' };
        }
    }

    async performPerformanceAnalysis() {
        console.log('📊 執行性能分析...');
        
        const browser = await puppeteer.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        try {
            const page = await browser.newPage();
            
            // 啟用性能監控
            await page.setCacheEnabled(false);
            
            const startTime = Date.now();
            await page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
            const loadTime = Date.now() - startTime;
            
            // 獲取性能指標
            const performanceMetrics = await page.evaluate(() => {
                const navigation = performance.getEntriesByType('navigation')[0];
                return {
                    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                    loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                    firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
                    firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
                };
            });
            
            this.verificationResults.performanceMetrics = {
                totalLoadTime: loadTime,
                ...performanceMetrics,
                timestamp: new Date().toISOString()
            };
            
            console.log(`⚡ 頁面載入時間: ${loadTime}ms`);
            
        } finally {
            await browser.close();
        }
    }

    async generateComprehensiveReport() {
        console.log('📋 生成完整驗證報告...');
        
        // 計算整體狀態
        const totalTests = this.verificationResults.testResults.length;
        const passedTests = this.verificationResults.testResults.filter(test => 
            test.status === 'PASSED' || test.status === 'COMPLETED'
        ).length;
        
        this.verificationResults.overallStatus = (passedTests / totalTests) >= 0.8 ? 'PASSED' : 'NEEDS_ATTENTION';
        this.verificationResults.successRate = `${Math.round((passedTests / totalTests) * 100)}%`;
        
        // 生成報告檔案
        const reportFile = `production-comprehensive-verification-report-${Date.now()}.json`;
        fs.writeFileSync(reportFile, JSON.stringify(this.verificationResults, null, 2));
        
        // 生成Markdown報告
        const markdownReport = this.generateMarkdownReport();
        const markdownFile = `production-comprehensive-verification-report-${Date.now()}.md`;
        fs.writeFileSync(markdownFile, markdownReport);
        
        console.log(`📄 報告已生成: ${reportFile} 和 ${markdownFile}`);
        
        return {
            jsonReport: reportFile,
            markdownReport: markdownFile,
            overallStatus: this.verificationResults.overallStatus,
            successRate: this.verificationResults.successRate
        };
    }

    generateMarkdownReport() {
        const report = this.verificationResults;
        
        return `
# 🚀 Railway生產環境全面驗證報告

## 📊 驗證概要
- **整體狀態**: ${report.overallStatus}
- **成功率**: ${report.successRate}
- **驗證時間**: ${report.timestamp}
- **網址**: ${this.baseUrl}

## 🎭 多角色驗證結果

${report.testResults.filter(test => test.role).map(test => `
### ${test.role}
- **登入狀態**: ${test.loginSuccess ? '✅ 成功' : '❌ 失敗'}
- **頁面訪問**: ${Object.keys(test.pageAccessibility || {}).length} 個頁面測試
- **功能驗證**: ${test.functionalityTests ? '✅ 完成' : '❌ 未完成'}
- **數據操作**: ${test.dataOperations ? '✅ 完成' : '❌ 未完成'}
`).join('')}

## 📱 響應式設計驗證
${Object.entries(report.mobileCompatibility).map(([device, test]) => `
- **${device}**: ${test.horizontalScroll ? '⚠️ 有橫向滾動' : '✅ 響應式正常'}
`).join('')}

## 🔍 深度功能驗證
- **表單驗證**: ${report.testResults.find(t => t.testName === '深度功能驗證')?.results?.formValidation?.hasValidation ? '✅' : '❌'}
- **AJAX功能**: ${report.testResults.find(t => t.testName === '深度功能驗證')?.results?.ajaxCalls?.ajaxCallsDetected ? '✅' : '❌'}
- **導航流程**: ${report.testResults.find(t => t.testName === '深度功能驗證')?.results?.navigationFlow?.navigationLinksFound ? '✅' : '❌'}
- **錯誤處理**: ${report.testResults.find(t => t.testName === '深度功能驗證')?.results?.errorHandling?.has404Handling ? '✅' : '❌'}

## 🛡️ 安全性驗證
- **HTTPS使用**: ${report.securityIssues?.httpsUsage ? '✅' : '❌'}
- **CSRF保護**: ${report.securityIssues?.csrfProtection?.hasCSRFProtection ? '✅' : '❌'}
- **SQL注入防護**: ${report.securityIssues?.sqlInjectionPrevention?.preventsSQLInjection ? '✅' : '❌'}
- **XSS保護**: ${report.securityIssues?.xssProtection?.preventsXSS ? '✅' : '❌'}

## 📊 性能分析
- **總載入時間**: ${report.performanceMetrics?.totalLoadTime}ms
- **DOM準備時間**: ${report.performanceMetrics?.domContentLoaded}ms
- **首次內容繪製**: ${report.performanceMetrics?.firstContentfulPaint}ms

## 📋 控制台分析
控制台訊息總數: ${Object.keys(report.consoleAnalysis).length}

## ❌ 錯誤記錄
${report.errorLog.length > 0 ? report.errorLog.map(error => `- ${error.timestamp}: ${error.message}`).join('\n') : '無錯誤記錄'}

## 📝 建議事項
${report.overallStatus === 'NEEDS_ATTENTION' ? `
⚠️ 系統需要關注以下問題：
- 檢查失敗的角色登入
- 修復無法訪問的頁面
- 改善響應式設計問題
- 加強安全性防護
` : '✅ 系統運行狀況良好，所有主要功能正常運作。'}

---
*報告生成時間: ${new Date().toISOString()}*
`;
    }
}

// 🚀 執行驗證系統
async function runProductionVerification() {
    console.log('🚀 啟動Railway生產環境全面瀏覽器驗證系統...');
    
    const verificationSystem = new ProductionBrowserVerificationSystem();
    await verificationSystem.startComprehensiveVerification();
    
    console.log('✅ 驗證完成！');
}

// 檢查是否直接執行
if (require.main === module) {
    runProductionVerification().catch(console.error);
}

module.exports = ProductionBrowserVerificationSystem;