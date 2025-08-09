/**
 * 智慧瀏覽器驗證模板 - Google Cloud 無伺服器架構
 * 
 * 功能：
 * 1. 自動化瀏覽器測試已部署的系統
 * 2. 驗證所有功能是否正常運作
 * 3. 檢查資料庫操作是否正確
 * 4. 生成詳細的測試報告
 */

const puppeteer = require('puppeteer');
const admin = require('firebase-admin');

class IntelligentBrowserVerification {
    constructor(config) {
        this.config = {
            appUrl: config.appUrl || 'https://employee-mgmt-2025.web.app',
            apiUrl: config.apiUrl || 'https://employee-api-xxxx.a.run.app',
            testTimeout: 30000,
            ...config
        };
        
        this.testResults = {
            timestamp: new Date().toISOString(),
            environment: 'production',
            phases: {
                deployment: { tests: [], score: 0 },
                functionality: { tests: [], score: 0 },
                database: { tests: [], score: 0 },
                performance: { tests: [], score: 0 }
            },
            screenshots: []
        };

        // 初始化 Firebase Admin
        if (!admin.apps.length) {
            admin.initializeApp({
                projectId: process.env.FIREBASE_PROJECT_ID
            });
        }
        
        this.db = admin.firestore();
    }

    /**
     * 執行完整驗證流程
     */
    async runFullVerification() {
        console.log('🚀 啟動智慧瀏覽器驗證系統...\n');
        console.log(`📍 目標網址: ${this.config.appUrl}`);
        console.log(`🔗 API 網址: ${this.config.apiUrl}\n`);
        
        const browser = await puppeteer.launch({
            headless: false, // 顯示瀏覽器以便觀察
            defaultViewport: {
                width: 1366,
                height: 768
            },
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        try {
            // Phase 1: 部署驗證
            console.log('\n========== Phase 1: 部署驗證 ==========');
            await this.verifyDeployment(browser);
            
            // Phase 2: 功能驗證
            console.log('\n========== Phase 2: 功能驗證 ==========');
            await this.verifyFunctionality(browser);
            
            // Phase 3: 資料庫驗證
            console.log('\n========== Phase 3: 資料庫驗證 ==========');
            await this.verifyDatabase();
            
            // Phase 4: 效能驗證
            console.log('\n========== Phase 4: 效能驗證 ==========');
            await this.verifyPerformance(browser);
            
            // 生成最終報告
            await this.generateFinalReport();
            
        } catch (error) {
            console.error('❌ 驗證過程發生錯誤:', error);
            this.testResults.criticalError = error.message;
        } finally {
            await browser.close();
        }
    }

    /**
     * Phase 1: 部署驗證
     */
    async verifyDeployment(browser) {
        const phase = 'deployment';
        
        // 1. 檢查前端是否可訪問
        await this.testFrontendAccess(browser, phase);
        
        // 2. 檢查 API 健康狀態
        await this.testAPIHealth(phase);
        
        // 3. 檢查 SSL 證書
        await this.testSSLCertificate(browser, phase);
        
        // 4. 檢查靜態資源載入
        await this.testStaticResources(browser, phase);
        
        this.calculatePhaseScore(phase);
    }

    /**
     * 測試前端訪問
     */
    async testFrontendAccess(browser, phase) {
        console.log('📋 測試前端訪問...');
        const page = await browser.newPage();
        
        try {
            const response = await page.goto(this.config.appUrl, {
                waitUntil: 'networkidle2',
                timeout: this.config.testTimeout
            });
            
            if (response && response.status() === 200) {
                this.addTestResult(phase, '前端訪問', '✅ 通過', `狀態碼: ${response.status()}`);
                
                // 檢查頁面標題
                const title = await page.title();
                if (title.includes('員工管理系統')) {
                    this.addTestResult(phase, '頁面標題', '✅ 通過', `標題: ${title}`);
                }
                
                // 截圖
                await this.takeScreenshot(page, 'frontend-home');
            } else {
                this.addTestResult(phase, '前端訪問', '❌ 失敗', `狀態碼: ${response?.status() || 'N/A'}`);
            }
            
        } catch (error) {
            this.addTestResult(phase, '前端訪問', '❌ 失敗', error.message);
        } finally {
            await page.close();
        }
    }

    /**
     * 測試 API 健康狀態
     */
    async testAPIHealth(phase) {
        console.log('📋 測試 API 健康狀態...');
        
        try {
            const response = await fetch(`${this.config.apiUrl}/health`);
            
            if (response.ok) {
                const data = await response.json();
                this.addTestResult(phase, 'API 健康檢查', '✅ 通過', `狀態: ${data.status || 'healthy'}`);
                
                // 檢查必要服務
                if (data.services) {
                    for (const [service, status] of Object.entries(data.services)) {
                        this.addTestResult(
                            phase, 
                            `服務-${service}`, 
                            status === 'ok' ? '✅ 通過' : '❌ 失敗',
                            `狀態: ${status}`
                        );
                    }
                }
            } else {
                this.addTestResult(phase, 'API 健康檢查', '❌ 失敗', `狀態碼: ${response.status}`);
            }
            
        } catch (error) {
            this.addTestResult(phase, 'API 健康檢查', '❌ 失敗', error.message);
        }
    }

    /**
     * Phase 2: 功能驗證
     */
    async verifyFunctionality(browser) {
        const phase = 'functionality';
        
        // 1. 測試登入功能
        const loginPage = await this.testLogin(browser, phase);
        
        if (loginPage) {
            // 2. 測試打卡功能
            await this.testAttendance(loginPage, phase);
            
            // 3. 測試營收管理
            await this.testRevenue(browser, phase);
            
            // 4. 測試庫存系統
            await this.testInventory(browser, phase);
            
            // 5. 測試公告系統
            await this.testAnnouncements(browser, phase);
            
            await loginPage.close();
        }
        
        this.calculatePhaseScore(phase);
    }

    /**
     * 測試登入功能
     */
    async testLogin(browser, phase) {
        console.log('📋 測試登入功能...');
        const page = await browser.newPage();
        
        try {
            // 訪問登入頁面
            await page.goto(`${this.config.appUrl}/login`, {
                waitUntil: 'networkidle2'
            });
            
            // 等待登入表單
            await page.waitForSelector('#loginForm', { timeout: 5000 });
            
            // 輸入測試帳號
            await page.type('#username', 'admin');
            await page.type('#password', 'admin123');
            
            // 截圖登入前
            await this.takeScreenshot(page, 'login-before');
            
            // 點擊登入按鈕
            await Promise.all([
                page.click('#loginButton'),
                page.waitForNavigation({ waitUntil: 'networkidle2' })
            ]);
            
            // 檢查是否成功跳轉
            const currentUrl = page.url();
            if (currentUrl.includes('/dashboard')) {
                this.addTestResult(phase, '登入功能', '✅ 通過', '成功登入並跳轉到儀表板');
                
                // 截圖登入後
                await this.takeScreenshot(page, 'dashboard-after-login');
                
                // 檢查用戶資訊顯示
                const userName = await page.$eval('.user-name', el => el.textContent);
                if (userName) {
                    this.addTestResult(phase, '用戶資訊顯示', '✅ 通過', `顯示用戶: ${userName}`);
                }
                
                return page; // 保持登入狀態
            } else {
                this.addTestResult(phase, '登入功能', '❌ 失敗', '登入後未跳轉到儀表板');
                await page.close();
                return null;
            }
            
        } catch (error) {
            this.addTestResult(phase, '登入功能', '❌ 失敗', error.message);
            await page.close();
            return null;
        }
    }

    /**
     * 測試打卡功能
     */
    async testAttendance(page, phase) {
        console.log('📋 測試打卡功能...');
        
        try {
            // 導航到打卡頁面
            await page.goto(`${this.config.appUrl}/attendance`, {
                waitUntil: 'networkidle2'
            });
            
            // 等待頁面載入
            await page.waitForSelector('.attendance-page', { timeout: 5000 });
            
            // 設置模擬 GPS 位置
            await page.setGeolocation({
                latitude: 24.9748412,
                longitude: 121.2556713,
                accuracy: 10
            });
            
            // 檢查打卡按鈕狀態
            const clockInButton = await page.$('#clockInButton');
            if (clockInButton) {
                const isDisabled = await page.$eval('#clockInButton', el => el.disabled);
                
                if (!isDisabled) {
                    // 點擊打卡
                    await page.click('#clockInButton');
                    
                    // 等待 API 回應
                    await page.waitForTimeout(2000);
                    
                    // 檢查成功訊息
                    const hasSuccess = await page.$('.success-message') !== null;
                    if (hasSuccess) {
                        this.addTestResult(phase, '打卡功能', '✅ 通過', '成功完成打卡');
                        
                        // 截圖
                        await this.takeScreenshot(page, 'attendance-success');
                    } else {
                        // 檢查是否有錯誤訊息
                        const errorMsg = await page.$eval('.error-message', el => el.textContent).catch(() => null);
                        this.addTestResult(phase, '打卡功能', '⚠️ 警告', errorMsg || '打卡可能失敗');
                    }
                } else {
                    this.addTestResult(phase, '打卡按鈕狀態', '⚠️ 警告', '按鈕已禁用（可能已打卡）');
                }
            } else {
                this.addTestResult(phase, '打卡功能', '❌ 失敗', '找不到打卡按鈕');
            }
            
        } catch (error) {
            this.addTestResult(phase, '打卡功能', '❌ 失敗', error.message);
        }
    }

    /**
     * 測試營收管理
     */
    async testRevenue(browser, phase) {
        console.log('📋 測試營收管理...');
        const page = await browser.newPage();
        
        try {
            await page.goto(`${this.config.appUrl}/revenue`, {
                waitUntil: 'networkidle2'
            });
            
            // 等待表單載入
            await page.waitForSelector('#revenueForm', { timeout: 5000 });
            
            // 填寫測試資料
            await page.type('#dineIn', '35000');
            await page.type('#delivery', '15000');
            await page.type('#takeout', '8000');
            await page.type('#otherRevenue', '2000');
            
            await page.type('#food', '18000');
            await page.type('#labor', '12000');
            await page.type('#utilities', '3000');
            await page.type('#otherExpense', '2000');
            
            // 等待自動計算
            await page.waitForTimeout(1000);
            
            // 驗證計算結果
            const totalRevenue = await page.$eval('#totalRevenue', el => el.textContent);
            const netRevenue = await page.$eval('#netRevenue', el => el.textContent);
            
            if (totalRevenue.includes('60,000') || totalRevenue.includes('60000')) {
                this.addTestResult(phase, '營收計算', '✅ 通過', `總收入: ${totalRevenue}`);
            } else {
                this.addTestResult(phase, '營收計算', '❌ 失敗', `計算錯誤: ${totalRevenue}`);
            }
            
            // 截圖
            await this.takeScreenshot(page, 'revenue-form-filled');
            
            // 測試照片上傳
            const fileInput = await page.$('input[type="file"]');
            if (fileInput) {
                this.addTestResult(phase, '照片上傳元件', '✅ 通過', '找到檔案上傳輸入框');
            }
            
        } catch (error) {
            this.addTestResult(phase, '營收管理', '❌ 失敗', error.message);
        } finally {
            await page.close();
        }
    }

    /**
     * Phase 3: 資料庫驗證
     */
    async verifyDatabase() {
        const phase = 'database';
        console.log('📋 驗證資料庫連線與資料...');
        
        try {
            // 測試各個集合
            const collections = [
                { name: 'employees', expectedFields: ['username', 'name', 'role'] },
                { name: 'attendance', expectedFields: ['employeeId', 'type', 'timestamp'] },
                { name: 'revenue', expectedFields: ['date', 'revenue', 'expenses'] },
                { name: 'inventory', expectedFields: ['itemCode', 'itemName', 'currentStock'] },
                { name: 'orders', expectedFields: ['orderNumber', 'items', 'status'] },
                { name: 'announcements', expectedFields: ['title', 'content', 'priority'] },
                { name: 'settings', expectedFields: ['category', 'settings'] }
            ];
            
            for (const collection of collections) {
                try {
                    const snapshot = await this.db.collection(collection.name).limit(1).get();
                    
                    if (!snapshot.empty) {
                        this.addTestResult(phase, `集合-${collection.name}`, '✅ 通過', `找到 ${snapshot.size} 筆資料`);
                        
                        // 驗證欄位結構
                        const doc = snapshot.docs[0].data();
                        const missingFields = collection.expectedFields.filter(field => !(field in doc));
                        
                        if (missingFields.length === 0) {
                            this.addTestResult(phase, `${collection.name}-結構`, '✅ 通過', '欄位結構正確');
                        } else {
                            this.addTestResult(phase, `${collection.name}-結構`, '⚠️ 警告', `缺少欄位: ${missingFields.join(', ')}`);
                        }
                    } else {
                        this.addTestResult(phase, `集合-${collection.name}`, '⚠️ 警告', '集合為空');
                    }
                    
                } catch (error) {
                    this.addTestResult(phase, `集合-${collection.name}`, '❌ 失敗', error.message);
                }
            }
            
            // 測試寫入權限
            await this.testDatabaseWrite(phase);
            
        } catch (error) {
            this.addTestResult(phase, '資料庫連線', '❌ 失敗', error.message);
        }
        
        this.calculatePhaseScore(phase);
    }

    /**
     * 測試資料庫寫入
     */
    async testDatabaseWrite(phase) {
        console.log('  測試資料庫寫入權限...');
        
        try {
            const testDoc = {
                testId: `test-${Date.now()}`,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                message: '驗證系統測試文檔'
            };
            
            // 寫入測試
            const docRef = await this.db.collection('test-verification').add(testDoc);
            this.addTestResult(phase, '資料庫寫入', '✅ 通過', `文檔ID: ${docRef.id}`);
            
            // 讀取驗證
            const doc = await docRef.get();
            if (doc.exists) {
                this.addTestResult(phase, '資料庫讀取', '✅ 通過', '成功讀取測試文檔');
                
                // 清理測試資料
                await docRef.delete();
                this.addTestResult(phase, '資料庫刪除', '✅ 通過', '成功刪除測試文檔');
            }
            
        } catch (error) {
            this.addTestResult(phase, '資料庫寫入權限', '❌ 失敗', error.message);
        }
    }

    /**
     * Phase 4: 效能驗證
     */
    async verifyPerformance(browser) {
        const phase = 'performance';
        console.log('📋 執行效能測試...');
        
        const performanceTests = [
            { url: '/', name: '首頁' },
            { url: '/login', name: '登入頁' },
            { url: '/dashboard', name: '儀表板' }
        ];
        
        for (const test of performanceTests) {
            await this.testPagePerformance(browser, phase, test);
        }
        
        // API 回應時間測試
        await this.testAPIPerformance(phase);
        
        this.calculatePhaseScore(phase);
    }

    /**
     * 測試頁面效能
     */
    async testPagePerformance(browser, phase, test) {
        const page = await browser.newPage();
        
        try {
            const startTime = Date.now();
            
            await page.goto(`${this.config.appUrl}${test.url}`, {
                waitUntil: 'networkidle2',
                timeout: 30000
            });
            
            const loadTime = Date.now() - startTime;
            
            // 取得效能指標
            const metrics = await page.evaluate(() => {
                const timing = performance.timing;
                return {
                    domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
                    loadComplete: timing.loadEventEnd - timing.navigationStart
                };
            });
            
            // 評估結果
            const status = loadTime < 3000 ? '✅ 通過' : 
                          loadTime < 5000 ? '⚠️ 警告' : '❌ 失敗';
            
            this.addTestResult(
                phase, 
                `${test.name}載入時間`, 
                status,
                `${loadTime}ms (DOMContentLoaded: ${metrics.domContentLoaded}ms)`
            );
            
        } catch (error) {
            this.addTestResult(phase, `${test.name}效能測試`, '❌ 失敗', error.message);
        } finally {
            await page.close();
        }
    }

    /**
     * 測試 API 效能
     */
    async testAPIPerformance(phase) {
        const endpoints = [
            { path: '/health', method: 'GET', name: '健康檢查' },
            { path: '/api/announcements', method: 'GET', name: '公告列表' }
        ];
        
        for (const endpoint of endpoints) {
            try {
                const startTime = Date.now();
                
                const response = await fetch(`${this.config.apiUrl}${endpoint.path}`, {
                    method: endpoint.method
                });
                
                const responseTime = Date.now() - startTime;
                
                const status = responseTime < 500 ? '✅ 通過' :
                              responseTime < 1000 ? '⚠️ 警告' : '❌ 失敗';
                
                this.addTestResult(
                    phase,
                    `API ${endpoint.name}`,
                    status,
                    `回應時間: ${responseTime}ms`
                );
                
            } catch (error) {
                this.addTestResult(phase, `API ${endpoint.name}`, '❌ 失敗', error.message);
            }
        }
    }

    /**
     * 計算階段分數
     */
    calculatePhaseScore(phaseName) {
        const phase = this.testResults.phases[phaseName];
        const total = phase.tests.length;
        const passed = phase.tests.filter(t => t.status.includes('✅')).length;
        phase.score = total > 0 ? Math.round((passed / total) * 100) : 0;
    }

    /**
     * 添加測試結果
     */
    addTestResult(phase, testName, status, details) {
        this.testResults.phases[phase].tests.push({
            name: testName,
            status: status,
            details: details,
            timestamp: new Date().toISOString()
        });
        
        console.log(`  ${status} ${testName}: ${details}`);
    }

    /**
     * 截圖功能
     */
    async takeScreenshot(page, name) {
        try {
            const filename = `screenshots/${name}-${Date.now()}.png`;
            await page.screenshot({
                path: filename,
                fullPage: true
            });
            this.testResults.screenshots.push(filename);
        } catch (error) {
            console.error(`  ⚠️ 截圖失敗: ${error.message}`);
        }
    }

    /**
     * 生成最終報告
     */
    async generateFinalReport() {
        console.log('\n📊 生成測試報告...\n');
        
        // 計算總體結果
        const phases = Object.values(this.testResults.phases);
        const totalTests = phases.reduce((sum, p) => sum + p.tests.length, 0);
        const passedTests = phases.reduce((sum, p) => 
            sum + p.tests.filter(t => t.status.includes('✅')).length, 0
        );
        const failedTests = phases.reduce((sum, p) => 
            sum + p.tests.filter(t => t.status.includes('❌')).length, 0
        );
        const warningTests = phases.reduce((sum, p) => 
            sum + p.tests.filter(t => t.status.includes('⚠️')).length, 0
        );
        
        const overallScore = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
        
        // 顯示結果摘要
        console.log('='.repeat(60));
        console.log('📈 測試結果摘要');
        console.log('='.repeat(60));
        console.log(`總測試數: ${totalTests}`);
        console.log(`✅ 通過: ${passedTests}`);
        console.log(`❌ 失敗: ${failedTests}`);
        console.log(`⚠️ 警告: ${warningTests}`);
        console.log(`📊 總體評分: ${overallScore}%`);
        console.log('='.repeat(60));
        
        // 各階段結果
        console.log('\n📋 各階段評分:');
        for (const [phaseName, phase] of Object.entries(this.testResults.phases)) {
            console.log(`  ${this.getPhaseEmoji(phaseName)} ${this.getPhaseName(phaseName)}: ${phase.score}%`);
        }
        
        // 建議
        console.log('\n💡 建議:');
        if (failedTests > 0) {
            console.log('  - 請優先修復失敗的測試項目');
        }
        if (warningTests > 0) {
            console.log('  - 建議改進有警告的項目以提升系統品質');
        }
        if (overallScore >= 90) {
            console.log('  - 系統運作良好，可以進入生產環境');
        } else if (overallScore >= 70) {
            console.log('  - 系統基本可用，但建議先改進後再上線');
        } else {
            console.log('  - 系統存在較多問題，需要進一步調試');
        }
        
        // 儲存報告
        const fs = require('fs').promises;
        const reportPath = `verification-report-${Date.now()}.json`;
        await fs.writeFile(reportPath, JSON.stringify(this.testResults, null, 2));
        console.log(`\n📁 詳細報告已儲存至: ${reportPath}`);
        
        // 發送 Telegram 通知
        await this.sendTelegramNotification(overallScore, failedTests);
    }

    /**
     * 發送 Telegram 通知
     */
    async sendTelegramNotification(score, failedCount) {
        const emoji = score >= 90 ? '✅' : score >= 70 ? '⚠️' : '❌';
        const status = score >= 90 ? '部署驗證成功' : 
                      score >= 70 ? '部署需要改進' : '部署驗證失敗';
        
        const message = `
${emoji} ${status}

📊 驗證結果:
總體評分: ${score}%
失敗項目: ${failedCount}

🔗 詳細報告已生成
時間: ${new Date().toLocaleString('zh-TW')}
        `;
        
        console.log('\n📱 準備發送 Telegram 通知...');
        // 實際發送邏輯需要整合 Telegram API
    }

    /**
     * 輔助函式
     */
    getPhaseEmoji(phase) {
        const emojis = {
            deployment: '🚀',
            functionality: '⚙️',
            database: '💾',
            performance: '⚡'
        };
        return emojis[phase] || '📋';
    }

    getPhaseName(phase) {
        const names = {
            deployment: '部署驗證',
            functionality: '功能驗證',
            database: '資料庫驗證',
            performance: '效能驗證'
        };
        return names[phase] || phase;
    }
}

// 執行驗證
if (require.main === module) {
    // 從環境變數或命令列參數取得配置
    const config = {
        appUrl: process.env.APP_URL || process.argv[2] || 'https://employee-mgmt-2025.web.app',
        apiUrl: process.env.API_URL || process.argv[3] || 'https://employee-api-xxxx.a.run.app'
    };
    
    console.log('🔧 驗證配置:');
    console.log(`  前端網址: ${config.appUrl}`);
    console.log(`  API 網址: ${config.apiUrl}\n`);
    
    const verifier = new IntelligentBrowserVerification(config);
    verifier.runFullVerification();
}

module.exports = IntelligentBrowserVerification;