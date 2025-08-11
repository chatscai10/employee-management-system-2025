const puppeteer = require('puppeteer');
const https = require('https');

class FinalSystemVerification {
    constructor() {
        this.browser = null;
        this.page = null;
        this.results = {
            apiVersion: null,
            employeeModules: 0,
            workingAPIs: 0,
            totalAPIs: 0,
            registrationFields: 0,
            overallScore: 0
        };
    }

    async init() {
        console.log('🚀 最終完整版系統驗證啟動...');
        
        this.browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        this.page = await this.browser.newPage();
    }

    async verifyAPIVersion() {
        console.log('🔍 檢查API版本...');
        
        return new Promise((resolve) => {
            https.get('https://employee-management-system-intermediate.onrender.com/api/test', (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        this.results.apiVersion = response.version;
                        
                        if (response.version === '完整企業員工管理系統') {
                            console.log('✅ API版本：完整企業員工管理系統');
                        } else {
                            console.log('❌ API版本：', response.version);
                        }
                        resolve();
                    } catch (error) {
                        console.error('❌ API版本檢查失敗');
                        resolve();
                    }
                });
            }).on('error', () => {
                console.error('❌ API連接失敗');
                resolve();
            });
        });
    }

    async verifyEmployeeModules() {
        console.log('🔍 檢查員工頁面模組...');
        
        try {
            // 先登入
            await this.page.goto('https://employee-management-system-intermediate.onrender.com/login', 
                { waitUntil: 'networkidle2', timeout: 30000 });
            
            // 等待並填寫登入表單
            await this.page.waitForSelector('#login-name', { timeout: 10000 });
            await this.page.type('#login-name', '張三');
            await this.page.type('#login-id', 'C123456789');
            await this.page.click('button[type="submit"]');
            
            // 等待跳轉到員工頁面
            await this.page.waitForFunction(
                () => window.location.href.includes('/employee') || 
                      document.querySelector('.content-area') !== null,
                { timeout: 10000 }
            );
            
            const currentUrl = this.page.url();
            console.log('登入後URL:', currentUrl);
            
            if (currentUrl.includes('/employee') || await this.page.$('.content-area')) {
                console.log('✅ 成功進入員工頁面');
                
                // 等待頁面完全載入
                await this.page.waitForSelector('.content-area', { timeout: 10000 });
                
                // 檢查所有8個核心模組區域
                const moduleSelectors = [
                    '#dashboard', '#attendance', '#revenue', '#schedule', 
                    '#inventory', '#promotion', '#maintenance', '#profile'
                ];
                
                let foundModules = 0;
                const moduleStatus = [];
                
                for (let i = 0; i < moduleSelectors.length; i++) {
                    const selector = moduleSelectors[i];
                    try {
                        const element = await this.page.$(selector);
                        
                        if (element) {
                            // 檢查模組的內容結構是否完整
                            const hasValidContent = await this.page.evaluate((sel) => {
                                const el = document.querySelector(sel);
                                if (!el) return false;
                                
                                // 檢查模組是否有標題和內容
                                const hasTitle = el.querySelector('h2') !== null;
                                const hasContent = el.children.length > 1; // 除了標題還有其他內容
                                const hasClassSection = el.classList.contains('section');
                                
                                console.log(`模組 ${sel}: 有標題=${hasTitle}, 有內容=${hasContent}, 是section=${hasClassSection}`);
                                
                                return hasTitle && hasContent && hasClassSection;
                            }, selector);
                            
                            if (hasValidContent) {
                                foundModules++;
                                moduleStatus.push(`✅ ${selector}`);
                            } else {
                                moduleStatus.push(`⚠️ ${selector} (結構不完整)`);
                            }
                        } else {
                            moduleStatus.push(`❌ ${selector} (不存在)`);
                        }
                    } catch (error) {
                        moduleStatus.push(`❌ ${selector} (錯誤: ${error.message})`);
                    }
                }
                
                this.results.employeeModules = foundModules;
                console.log(`✅ 員工模組檢測結果: ${foundModules}/8`);
                console.log('詳細狀態:', moduleStatus.join(', '));
                
            } else {
                console.log('❌ 登入失敗，無法檢查員工模組');
                console.log('當前URL:', currentUrl);
            }
            
        } catch (error) {
            console.error('❌ 員工模組檢查失敗:', error.message);
        }
    }

    async verifyAPIs() {
        console.log('🔍 檢查API端點...');
        
        const testAPIs = [
            '/api/test', '/api/admin/employees', '/api/admin/stores', '/api/admin/stats',
            '/api/attendance/records', '/api/revenue', '/api/schedule/statistics/2025/8',
            '/api/promotion/campaigns/active', '/api/inventory/items', '/api/system/settings',
            '/api/work-assignments', '/api/attendance/clock', '/api/promotion/vote', '/api/maintenance/requests'
        ];
        
        let workingAPIs = 0;
        
        for (const api of testAPIs) {
            try {
                const response = await this.page.evaluate(async (url) => {
                    try {
                        const res = await fetch(url);
                        return res.status;
                    } catch (error) {
                        return 0;
                    }
                }, `https://employee-management-system-intermediate.onrender.com${api}`);
                
                if (response === 200) {
                    workingAPIs++;
                }
            } catch (error) {
                // 忽略個別API錯誤
            }
        }
        
        this.results.workingAPIs = workingAPIs;
        this.results.totalAPIs = testAPIs.length;
        console.log(`✅ 可用API: ${workingAPIs}/${testAPIs.length}`);
    }

    async verifyRegistration() {
        console.log('🔍 檢查註冊表單...');
        
        try {
            await this.page.goto('https://employee-management-system-intermediate.onrender.com/register', 
                { waitUntil: 'networkidle2', timeout: 30000 });
            
            const requiredFields = await this.page.$$eval('input[required], select[required], textarea[required]', 
                elements => elements.length);
            
            this.results.registrationFields = requiredFields;
            console.log(`✅ 註冊必填欄位: ${requiredFields}/11`);
            
        } catch (error) {
            console.error('❌ 註冊表單檢查失敗:', error.message);
        }
    }

    calculateScore() {
        let score = 0;
        
        // API版本 (20分)
        if (this.results.apiVersion === '完整企業員工管理系統') {
            score += 20;
        }
        
        // 員工模組 (30分)
        score += (this.results.employeeModules / 8) * 30;
        
        // API端點 (30分)  
        score += (this.results.workingAPIs / this.results.totalAPIs) * 30;
        
        // 註冊欄位 (20分)
        score += (this.results.registrationFields / 11) * 20;
        
        this.results.overallScore = Math.round(score);
        
        return this.results.overallScore;
    }

    generateReport() {
        const score = this.calculateScore();
        
        let status = '❌ 系統功能嚴重不足';
        if (score >= 85) status = '🎉 系統功能完整，符合企業級標準';
        else if (score >= 70) status = '✅ 系統功能良好，接近完整版';
        else if (score >= 50) status = '⚠️ 系統功能基本可用，需要改進';
        
        const report = `
# 🏆 最終完整版系統驗證報告

## 📊 總體評分: ${score}/100

${status}

## 📋 詳細結果

### 🔧 API版本檢查
- 當前版本: ${this.results.apiVersion || '未知'}
- 期望版本: 完整企業員工管理系統
- 狀態: ${this.results.apiVersion === '完整企業員工管理系統' ? '✅ 正確' : '❌ 不正確'}

### 👤 員工頁面模組
- 檢測到模組: ${this.results.employeeModules}/8
- 完成度: ${Math.round((this.results.employeeModules / 8) * 100)}%
- 狀態: ${this.results.employeeModules >= 8 ? '✅ 完整' : this.results.employeeModules >= 6 ? '⚠️ 大部分完成' : '❌ 嚴重缺失'}

### 🔌 API端點功能
- 可用API: ${this.results.workingAPIs}/${this.results.totalAPIs}
- 可用率: ${Math.round((this.results.workingAPIs / this.results.totalAPIs) * 100)}%
- 狀態: ${this.results.workingAPIs >= 12 ? '✅ 良好' : this.results.workingAPIs >= 8 ? '⚠️ 基本可用' : '❌ 功能不足'}

### 📝 註冊表單
- 必填欄位: ${this.results.registrationFields}/11
- 完整度: ${Math.round((this.results.registrationFields / 11) * 100)}%
- 狀態: ${this.results.registrationFields >= 11 ? '✅ 完整' : '❌ 缺失欄位'}

## 🎯 改善建議

${score < 70 ? `
### 關鍵改進項目:
1. ${this.results.employeeModules < 8 ? '完善員工頁面8大核心模組' : '✅ 員工模組已完整'}
2. ${this.results.workingAPIs < 12 ? '修復缺失的API端點' : '✅ API端點功能良好'}
3. ${this.results.registrationFields < 11 ? '補充註冊表單缺失欄位' : '✅ 註冊表單已完整'}
` : '✅ 系統功能已達到可接受水準'}

---
驗證時間: ${new Date().toLocaleString('zh-TW')}
`;

        return report;
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    async runFullVerification() {
        try {
            await this.init();
            await this.verifyAPIVersion();
            await this.verifyEmployeeModules();
            await this.verifyAPIs();
            await this.verifyRegistration();
            
            const report = this.generateReport();
            console.log(report);
            
            return this.results;
            
        } catch (error) {
            console.error('❌ 驗證過程失敗:', error);
            throw error;
        } finally {
            await this.close();
        }
    }
}

// 執行驗證
async function main() {
    const verifier = new FinalSystemVerification();
    const results = await verifier.runFullVerification();
    
    // 發送Telegram通知
    try {
        const https = require('https');
        const telegramData = {
            chat_id: '-1002658082392',
            text: `🏆 最終系統驗證完成\n\n總體評分: ${results.overallScore}/100\n\nAPI版本: ${results.apiVersion}\n員工模組: ${results.employeeModules}/8\nAPI端點: ${results.workingAPIs}/${results.totalAPIs}\n註冊欄位: ${results.registrationFields}/11`
        };
        
        const postData = JSON.stringify(telegramData);
        const options = {
            hostname: 'api.telegram.org',
            port: 443,
            path: '/bot7659930552:AAF_jF1rAXFnjFO176-9X5fKfBwbrko8BNc/sendMessage',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        const req = https.request(options);
        req.write(postData);
        req.end();
        
        console.log('\n📱 Telegram最終報告已發送');
    } catch (error) {
        console.warn('⚠️ Telegram通知失敗');
    }
}

main().catch(console.error);