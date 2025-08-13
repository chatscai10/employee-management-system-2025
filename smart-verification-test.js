const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class SmartBrowserVerification {
    constructor() {
        this.browser = null;
        this.page = null;
        this.verificationResults = [];
        this.baseUrl = 'https://employee-management-system-intermediate.onrender.com';
        this.screenshots = [];
    }

    async init() {
        console.log('🚀 初始化智慧瀏覽器驗證引擎...');
        
        this.browser = await puppeteer.launch({
            headless: false,  // 顯示真實瀏覽器
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
        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        
        // 監聽控制台錯誤
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                console.error('❌ 瀏覽器控制台錯誤:', msg.text());
                this.verificationResults.push({
                    type: 'console_error',
                    message: msg.text(),
                    timestamp: new Date().toISOString()
                });
            }
        });
        
        // 監聽網路錯誤
        this.page.on('response', response => {
            if (response.status() >= 400) {
                console.warn('⚠️ HTTP錯誤:', response.status(), response.url());
                this.verificationResults.push({
                    type: 'http_error',
                    status: response.status(),
                    url: response.url(),
                    timestamp: new Date().toISOString()
                });
            }
        });
        
        console.log('✅ 智慧瀏覽器初始化完成');
    }

    async takeScreenshot(name) {
        const filename = `screenshot-${name}-${Date.now()}.png`;
        const filepath = path.join(__dirname, 'verification-screenshots', filename);
        
        // 創建截圖目錄
        const dir = path.dirname(filepath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        await this.page.screenshot({ path: filepath, fullPage: true });
        this.screenshots.push({ name, filepath });
        console.log(`📸 截圖已保存: ${filename}`);
        return filepath;
    }

    async verifyHomePage() {
        console.log('\n🔍 第一階段：驗證首頁功能...');
        
        try {
            await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });
            await this.takeScreenshot('homepage');
            
            // 檢查頁面標題
            const title = await this.page.title();
            console.log('📖 頁面標題:', title);
            
            // 檢查導航連結
            const navLinks = await this.page.$$eval('nav a', links => 
                links.map(link => ({ text: link.textContent.trim(), href: link.href }))
            );
            console.log('🔗 導航連結:', navLinks);
            
            // 驗證是否還有reports.html重定向問題
            for (const link of navLinks) {
                if (link.href.includes('reports.html')) {
                    this.verificationResults.push({
                        type: 'critical_error',
                        message: '❌ 仍然存在reports.html重定向問題',
                        link: link
                    });
                    console.error('❌ 發現reports.html重定向問題:', link);
                }
            }
            
            this.verificationResults.push({
                type: 'success',
                message: '✅ 首頁載入成功',
                details: { title, navLinks }
            });
            
        } catch (error) {
            console.error('❌ 首頁驗證失敗:', error.message);
            this.verificationResults.push({
                type: 'error',
                stage: 'homepage',
                message: error.message
            });
        }
    }

    async verifyRegistration() {
        console.log('\n🔍 第二階段：驗證註冊功能修復...');
        
        try {
            // 導航到註冊頁面
            await this.page.goto(`${this.baseUrl}/register`, { waitUntil: 'networkidle2' });
            await this.takeScreenshot('registration-page');
            
            // 檢查是否有11個必填欄位
            const requiredFields = [
                'name', 'idNumber', 'birthDate', 'gender', 'hasDriverLicense',
                'phone', 'address', 'emergencyContactName', 'emergencyContactRelation',
                'emergencyContactPhone', 'hireDate'
            ];
            
            let foundFields = 0;
            for (const field of requiredFields) {
                const fieldExists = await this.page.$(`#${field}, [name="${field}"]`) !== null;
                if (fieldExists) {
                    foundFields++;
                    console.log(`✅ 找到必填欄位: ${field}`);
                } else {
                    console.warn(`⚠️ 缺少必填欄位: ${field}`);
                }
            }
            
            console.log(`📊 註冊欄位檢查: ${foundFields}/${requiredFields.length}`);
            
            // 測試註冊功能
            if (foundFields >= 8) {  // 至少要有8個基本欄位
                console.log('🧪 測試註冊流程...');
                
                // 填入測試資料
                await this.page.type('#name', '測試員工');
                await this.page.type('#idNumber', 'Z123456789');
                await this.page.type('#phone', '0912345678');
                
                await this.takeScreenshot('registration-filled');
                
                // 提交註冊
                await this.page.click('button[type="submit"]');
                await this.page.waitForTimeout(3000);
                
                await this.takeScreenshot('registration-result');
                
                // 檢查是否有成功/失敗回饋
                const alerts = await this.page.$$eval('.alert, .toast, .notification', 
                    elements => elements.map(el => el.textContent.trim())
                );
                
                if (alerts.length > 0) {
                    console.log('✅ 註冊有回饋訊息:', alerts);
                    this.verificationResults.push({
                        type: 'success',
                        message: '✅ 註冊功能有回饋機制',
                        details: alerts
                    });
                } else {
                    console.warn('⚠️ 註冊仍然無回饋訊息');
                    this.verificationResults.push({
                        type: 'warning',
                        message: '⚠️ 註冊功能仍然缺少回饋機制'
                    });
                }
            }
            
        } catch (error) {
            console.error('❌ 註冊驗證失敗:', error.message);
            this.verificationResults.push({
                type: 'error',
                stage: 'registration',
                message: error.message
            });
        }
    }

    async verifyLogin() {
        console.log('\n🔍 第三階段：驗證登入功能...');
        
        try {
            await this.page.goto(`${this.baseUrl}/login`, { waitUntil: 'networkidle2' });
            await this.takeScreenshot('login-page');
            
            // 測試預設帳號登入
            console.log('🧪 測試預設帳號登入...');
            
            await this.page.type('#login-name', '張三');
            await this.page.type('#login-id', 'C123456789');
            
            await this.takeScreenshot('login-filled');
            
            // 提交登入
            await this.page.click('button[type="submit"]');
            await this.page.waitForTimeout(5000);
            
            const currentUrl = this.page.url();
            console.log('🔗 登入後URL:', currentUrl);
            
            await this.takeScreenshot('login-result');
            
            if (currentUrl.includes('/employee')) {
                console.log('✅ 登入成功，正確跳轉到員工頁面');
                this.verificationResults.push({
                    type: 'success',
                    message: '✅ 登入功能正常，成功跳轉'
                });
                return true;
            } else if (currentUrl.includes('/login')) {
                console.error('❌ 登入失敗，仍停留在登入頁面');
                this.verificationResults.push({
                    type: 'critical_error',
                    message: '❌ 登入功能仍然有問題，無法成功登入'
                });
                return false;
            }
            
        } catch (error) {
            console.error('❌ 登入驗證失敗:', error.message);
            this.verificationResults.push({
                type: 'error',
                stage: 'login',
                message: error.message
            });
            return false;
        }
    }

    async verifyEmployeePage() {
        console.log('\n🔍 第四階段：驗證員工頁面升級...');
        
        try {
            // 確保在員工頁面
            if (!this.page.url().includes('/employee')) {
                console.log('🔗 導航到員工頁面...');
                await this.page.goto(`${this.baseUrl}/employee`, { waitUntil: 'networkidle2' });
            }
            
            await this.takeScreenshot('employee-page');
            
            // 檢查是否有8大核心模組
            const expectedModules = [
                '工作概覽', '打卡', 'GPS', '營收', '排班', '庫存', '升遷', '維修'
            ];
            
            const pageContent = await this.page.content();
            let foundModules = 0;
            
            for (const module of expectedModules) {
                if (pageContent.includes(module)) {
                    foundModules++;
                    console.log(`✅ 找到模組關鍵字: ${module}`);
                }
            }
            
            console.log(`📊 員工模組檢查: ${foundModules}/${expectedModules.length}`);
            
            // 檢查是否還是簡化版
            const isSimplified = pageContent.includes('簡易的系統') || 
                               pageContent.includes('basic') ||
                               (await this.page.$('.card')).length < 6;
            
            if (isSimplified) {
                console.error('❌ 員工頁面仍然是簡化版');
                this.verificationResults.push({
                    type: 'critical_error',
                    message: '❌ 員工頁面仍然是簡化版，未升級為完整版'
                });
            } else if (foundModules >= 6) {
                console.log('✅ 員工頁面已升級為完整版');
                this.verificationResults.push({
                    type: 'success',
                    message: '✅ 員工頁面已成功升級為完整版',
                    details: { foundModules, expectedModules: expectedModules.length }
                });
            } else {
                console.warn('⚠️ 員工頁面功能不完整');
                this.verificationResults.push({
                    type: 'warning',
                    message: '⚠️ 員工頁面功能仍然不完整'
                });
            }
            
        } catch (error) {
            console.error('❌ 員工頁面驗證失敗:', error.message);
            this.verificationResults.push({
                type: 'error',
                stage: 'employee_page',
                message: error.message
            });
        }
    }

    async verifyAPIEndpoints() {
        console.log('\n🔍 第五階段：驗證API端點功能...');
        
        const testEndpoints = [
            { url: '/api/test', method: 'GET', expected: 200 },
            { url: '/api/admin/employees', method: 'GET', expected: [200, 401] },
            { url: '/api/attendance/records', method: 'GET', expected: [200, 401] },
            { url: '/api/revenue', method: 'GET', expected: [200, 401] },
            { url: '/api/schedule/statistics/2025/8', method: 'GET', expected: [200, 401] },
            { url: '/api/promotion/campaigns/active', method: 'GET', expected: [200, 401] },
        ];
        
        for (const endpoint of testEndpoints) {
            try {
                console.log(`🧪 測試API: ${endpoint.url}`);
                
                const response = await this.page.evaluate(async (url) => {
                    try {
                        const res = await fetch(url);
                        return {
                            status: res.status,
                            ok: res.ok,
                            statusText: res.statusText
                        };
                    } catch (error) {
                        return { error: error.message };
                    }
                }, `${this.baseUrl}${endpoint.url}`);
                
                if (response.error) {
                    console.error(`❌ API錯誤 ${endpoint.url}:`, response.error);
                    this.verificationResults.push({
                        type: 'error',
                        api: endpoint.url,
                        message: response.error
                    });
                } else if (endpoint.expected.includes(response.status)) {
                    console.log(`✅ API正常 ${endpoint.url}: ${response.status}`);
                    this.verificationResults.push({
                        type: 'success',
                        api: endpoint.url,
                        status: response.status
                    });
                } else {
                    console.warn(`⚠️ API異常 ${endpoint.url}: ${response.status}`);
                    this.verificationResults.push({
                        type: 'warning',
                        api: endpoint.url,
                        status: response.status,
                        expected: endpoint.expected
                    });
                }
                
            } catch (error) {
                console.error(`❌ API測試失敗 ${endpoint.url}:`, error.message);
            }
        }
    }

    async generateReport() {
        console.log('\n📊 生成智慧驗證報告...');
        
        const report = {
            timestamp: new Date().toISOString(),
            verification_summary: {
                total_tests: this.verificationResults.length,
                successful: this.verificationResults.filter(r => r.type === 'success').length,
                warnings: this.verificationResults.filter(r => r.type === 'warning').length,
                errors: this.verificationResults.filter(r => r.type === 'error').length,
                critical_errors: this.verificationResults.filter(r => r.type === 'critical_error').length
            },
            detailed_results: this.verificationResults,
            screenshots: this.screenshots,
            conclusion: this.generateConclusion()
        };
        
        // 保存報告
        const reportPath = path.join(__dirname, `smart-verification-report-${Date.now()}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        // 生成可讀報告
        const readableReport = this.generateReadableReport(report);
        const readableReportPath = path.join(__dirname, `智慧瀏覽器驗證報告-${new Date().toISOString().slice(0,10)}.md`);
        fs.writeFileSync(readableReportPath, readableReport);
        
        console.log(`📄 驗證報告已保存: ${readableReportPath}`);
        return { report, reportPath, readableReportPath };
    }

    generateConclusion() {
        const criticalErrors = this.verificationResults.filter(r => r.type === 'critical_error').length;
        const errors = this.verificationResults.filter(r => r.type === 'error').length;
        const warnings = this.verificationResults.filter(r => r.type === 'warning').length;
        const successes = this.verificationResults.filter(r => r.type === 'success').length;
        
        if (criticalErrors > 0) {
            return '❌ 系統仍存在重大問題，修復未完成';
        } else if (errors > successes) {
            return '⚠️ 系統存在多項錯誤，需要進一步修復';
        } else if (warnings > 0) {
            return '✅ 系統基本正常，但有部分功能需要完善';
        } else {
            return '🎉 系統修復成功，所有功能正常運行';
        }
    }

    generateReadableReport(report) {
        return `# 🤖 智慧瀏覽器驗證報告

## 📋 驗證概況
- **驗證時間**: ${new Date(report.timestamp).toLocaleString('zh-TW')}
- **總測試數**: ${report.verification_summary.total_tests}
- **成功項目**: ${report.verification_summary.successful} ✅
- **警告項目**: ${report.verification_summary.warnings} ⚠️
- **錯誤項目**: ${report.verification_summary.errors} ❌
- **重大錯誤**: ${report.verification_summary.critical_errors} 🚨

## 🎯 驗證結論
${report.conclusion}

## 📸 截圖記錄
${report.screenshots.map(s => `- ${s.name}: ${s.filepath}`).join('\n')}

## 📊 詳細結果
${report.detailed_results.map(r => {
    const icon = r.type === 'success' ? '✅' : 
                 r.type === 'warning' ? '⚠️' : 
                 r.type === 'critical_error' ? '🚨' : '❌';
    return `${icon} ${r.message}`;
}).join('\n')}

---
**報告生成時間**: ${new Date().toLocaleString('zh-TW')}
`;
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            console.log('🔒 智慧瀏覽器已關閉');
        }
    }

    async runFullVerification() {
        try {
            await this.init();
            
            await this.verifyHomePage();
            await this.verifyRegistration();
            const loginSuccess = await this.verifyLogin();
            
            if (loginSuccess) {
                await this.verifyEmployeePage();
            }
            
            await this.verifyAPIEndpoints();
            
            const reportResult = await this.generateReport();
            
            console.log('\n🎉 智慧瀏覽器驗證完成！');
            console.log(`📄 報告路徑: ${reportResult.readableReportPath}`);
            
            return reportResult;
            
        } catch (error) {
            console.error('❌ 智慧驗證過程發生錯誤:', error);
            throw error;
        } finally {
            await this.close();
        }
    }
}

// 執行驗證
async function main() {
    console.log('🚀 啟動智慧瀏覽器全面驗證系統...');
    
    const verifier = new SmartBrowserVerification();
    
    try {
        const result = await verifier.runFullVerification();
        console.log('\n✅ 驗證完成，結果:', result.report.conclusion);
        
        // 發送Telegram通知
        if (typeof require !== 'undefined') {
            try {
                const https = require('https');
                const telegramData = {
                    chat_id: 'process.env.TELEGRAM_GROUP_ID',
                    text: `🤖 智慧瀏覽器驗證完成\n\n${result.report.conclusion}\n\n📊 測試結果:\n✅ 成功: ${result.report.verification_summary.successful}\n⚠️ 警告: ${result.report.verification_summary.warnings}\n❌ 錯誤: ${result.report.verification_summary.errors}\n🚨 重大錯誤: ${result.report.verification_summary.critical_errors}`
                };
                
                const postData = JSON.stringify(telegramData);
                const options = {
                    hostname: 'api.telegram.org',
                    port: 443,
                    path: '/botprocess.env.TELEGRAM_BOT_TOKEN/sendMessage',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(postData)
                    }
                };
                
                const req = https.request(options);
                req.write(postData);
                req.end();
                
                console.log('📱 Telegram通知已發送');
            } catch (telegramError) {
                console.warn('⚠️ Telegram通知發送失敗:', telegramError.message);
            }
        }
        
    } catch (error) {
        console.error('❌ 智慧驗證失敗:', error);
    }
}

if (require.main === module) {
    main();
}

module.exports = SmartBrowserVerification;