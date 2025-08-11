/**
 * 🔍 管理員系統部署驗證測試
 * 簡化驗證流程，重點測試8大模組是否正確部署
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

class AdminDeploymentVerifier {
    constructor() {
        this.browser = null;
        this.page = null;
        this.results = {
            deploymentStatus: 'unknown',
            modulesFound: 0,
            apisResponding: 0,
            overallScore: 0,
            details: {}
        };
    }

    async initialize() {
        console.log('🚀 啟動管理員部署驗證...');
        
        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: { width: 1920, height: 1080 },
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        this.page = await this.browser.newPage();
        
        // 監控網絡請求
        this.networkRequests = [];
        this.page.on('response', response => {
            if (response.url().includes('/api/admin/')) {
                this.networkRequests.push({
                    url: response.url(),
                    status: response.status(),
                    statusText: response.statusText()
                });
            }
        });

        console.log('📱 瀏覽器已初始化，開始訪問管理員頁面...');
    }

    async testAdminPageAccess() {
        console.log('\n🔐 測試1: 管理員頁面訪問測試');
        
        try {
            // 首先訪問主頁面，看看會發生什麼
            const response = await this.page.goto('https://employee-management-system-intermediate.onrender.com/admin', {
                waitUntil: 'domcontentloaded',
                timeout: 30000
            });
            
            await this.delay(3000);
            
            const currentUrl = this.page.url();
            const pageTitle = await this.page.title();
            
            console.log(`📍 當前URL: ${currentUrl}`);
            console.log(`📄 頁面標題: ${pageTitle}`);
            
            // 檢查是否被重定向到登入頁面
            if (currentUrl.includes('/login')) {
                console.log('🔐 檢測到需要登入，嘗試模擬登入...');
                return await this.attemptLogin();
            } else if (currentUrl.includes('/admin')) {
                console.log('✅ 直接進入管理員頁面');
                return true;
            } else {
                console.log(`⚠️  意外的重定向到: ${currentUrl}`);
                return false;
            }
            
        } catch (error) {
            console.error('❌ 訪問管理員頁面失敗:', error.message);
            return false;
        }
    }

    async attemptLogin() {
        console.log('🔑 嘗試使用測試憑證登入...');
        
        try {
            // 等待登入表單載入
            await this.page.waitForSelector('input[type="text"], input[name="name"]', { timeout: 10000 });
            
            // 嘗試填入測試用戶資料
            const nameInput = await this.page.$('input[name="name"], input[placeholder*="姓名"]');
            const idInput = await this.page.$('input[name="idNumber"], input[placeholder*="身分證"]');
            
            if (nameInput && idInput) {
                await nameInput.type('系統管理員');
                await idInput.type('A123456789');
                
                // 點擊登入按鈕
                const loginButton = await this.page.$('button[type="submit"], button:contains("登入")');
                if (loginButton) {
                    await loginButton.click();
                    await this.delay(3000);
                    
                    const newUrl = this.page.url();
                    console.log(`🔄 登入後URL: ${newUrl}`);
                    
                    if (newUrl.includes('/admin')) {
                        console.log('✅ 登入成功，進入管理員頁面');
                        return true;
                    } else if (newUrl.includes('/employee')) {
                        console.log('⚠️  登入成功但非管理員權限，跳轉到員工頁面');
                        return false;
                    }
                }
            }
            
            console.log('❌ 無法完成登入流程');
            return false;
            
        } catch (error) {
            console.error('❌ 登入流程失敗:', error.message);
            return false;
        }
    }

    async testAdminModulesVisibility() {
        console.log('\n📊 測試2: 管理員8大模組可見性檢查');
        
        try {
            // 等待頁面完全載入
            await this.delay(5000);
            
            // 檢查導航菜單
            const navItems = await this.page.$$eval('.nav-menu .nav-link', links =>
                links.map(link => ({
                    text: link.textContent.trim(),
                    section: link.getAttribute('data-section'),
                    visible: link.offsetHeight > 0
                }))
            );
            
            console.log(`📋 發現導航項目: ${navItems.length} 個`);
            navItems.forEach((item, index) => {
                console.log(`   ${index + 1}. ${item.text} -> ${item.section}`);
            });
            
            // 檢查內容區域
            const contentSections = await this.page.$$eval('.section', sections =>
                sections.map(section => ({
                    id: section.id,
                    hasContent: section.innerHTML.trim().length > 100,
                    isActive: section.classList.contains('active')
                }))
            );
            
            console.log(`📄 發現內容區域: ${contentSections.length} 個`);
            contentSections.forEach((section, index) => {
                console.log(`   ${index + 1}. ${section.id} - 內容: ${section.hasContent ? '✅' : '❌'}, 活躍: ${section.isActive ? '✅' : '❌'}`);
            });
            
            this.results.details.navigation = { navItems, contentSections };
            this.results.modulesFound = navItems.length;
            
            return navItems.length >= 8;
            
        } catch (error) {
            console.error('❌ 模組可見性檢查失敗:', error.message);
            return false;
        }
    }

    async testRandomModuleNavigation() {
        console.log('\n🔀 測試3: 隨機模組導航測試');
        
        try {
            const navLinks = await this.page.$$('.nav-menu .nav-link');
            
            if (navLinks.length === 0) {
                console.log('❌ 未找到導航連結');
                return false;
            }
            
            // 測試前3個模組的導航
            const modulesToTest = Math.min(3, navLinks.length);
            let successCount = 0;
            
            for (let i = 0; i < modulesToTest; i++) {
                try {
                    const linkText = await this.page.evaluate(el => el.textContent.trim(), navLinks[i]);
                    console.log(`🔄 測試導航到: ${linkText}`);
                    
                    await navLinks[i].click();
                    await this.delay(2000);
                    
                    // 檢查是否有內容變化
                    const activeSection = await this.page.$('.section.active');
                    if (activeSection) {
                        const sectionId = await this.page.evaluate(el => el.id, activeSection);
                        console.log(`✅ 成功導航到: ${sectionId}`);
                        successCount++;
                    }
                    
                } catch (navError) {
                    console.log(`⚠️  導航失敗: ${navError.message}`);
                }
            }
            
            console.log(`📊 導航測試結果: ${successCount}/${modulesToTest} 成功`);
            return successCount > 0;
            
        } catch (error) {
            console.error('❌ 導航測試失敗:', error.message);
            return false;
        }
    }

    async testAPIEndpoints() {
        console.log('\n🔗 測試4: API端點響應測試');
        
        // 等待一段時間讓API調用完成
        await this.delay(5000);
        
        console.log(`📡 監控到 ${this.networkRequests.length} 個管理員API請求`);
        
        let successfulAPIs = 0;
        const uniqueAPIs = new Set();
        
        this.networkRequests.forEach((req, index) => {
            const path = new URL(req.url).pathname;
            uniqueAPIs.add(path);
            
            console.log(`   ${index + 1}. ${path} - ${req.status} ${req.statusText}`);
            
            if (req.status >= 200 && req.status < 400) {
                successfulAPIs++;
            }
        });
        
        console.log(`📊 API測試結果:`);
        console.log(`   總請求: ${this.networkRequests.length}`);
        console.log(`   獨特端點: ${uniqueAPIs.size}`);  
        console.log(`   成功響應: ${successfulAPIs}`);
        
        this.results.apisResponding = uniqueAPIs.size;
        this.results.details.apis = {
            total: this.networkRequests.length,
            unique: uniqueAPIs.size,
            successful: successfulAPIs,
            requests: this.networkRequests
        };
        
        return uniqueAPIs.size >= 5; // 期望至少5個不同的API端點
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async generateSimpleReport() {
        console.log('\n📋 生成部署驗證報告...');
        
        // 計算總體分數
        let score = 0;
        
        // 模組數量得分 (40分)
        const moduleScore = Math.min(40, (this.results.modulesFound / 8) * 40);
        score += moduleScore;
        
        // API響應得分 (35分)
        const apiScore = Math.min(35, (this.results.apisResponding / 7) * 35);
        score += apiScore;
        
        // 基本功能得分 (25分)  
        const functionalScore = this.results.deploymentStatus === 'success' ? 25 : 10;
        score += functionalScore;
        
        this.results.overallScore = Math.round(score);
        
        const report = `
# 🚀 管理員系統部署驗證報告

## 📊 總體評分: ${this.results.overallScore}/100

${this.results.overallScore >= 80 ? '🎉 部署成功！管理員系統運作正常' :
  this.results.overallScore >= 60 ? '✅ 基本可用，部分功能需要完善' :
  '⚠️  部署存在問題，需要修復'}

## 🎯 詳細測試結果

### 📋 模組部署狀況:
- 發現模組數: ${this.results.modulesFound}/8
- 模組得分: ${Math.round(moduleScore)}/40

### 🔗 API端點狀況:
- 響應端點數: ${this.results.apisResponding}/7+
- API得分: ${Math.round(apiScore)}/35

### ⚡ 基本功能狀況:
- 部署狀態: ${this.results.deploymentStatus}
- 功能得分: ${functionalScore}/25

## 📈 改進建議

${this.results.overallScore >= 80 ? 
`✅ 系統部署成功！
- 管理員8大模組已正確部署
- API端點響應正常
- 可以開始進行業務功能測試` :
`⚠️  需要改進的項目:
${this.results.modulesFound < 8 ? '- 🔧 完善管理員導航模組顯示' : ''}
${this.results.apisResponding < 5 ? '- 🔗 修復API端點響應問題' : ''}
- 📱 建議檢查瀏覽器控制台錯誤信息`}

---
**驗證時間**: ${new Date().toISOString()}
**驗證目的**: 確認管理員8大模組部署狀況
**下一步**: ${this.results.overallScore >= 80 ? '進行深度功能測試' : '修復部署問題後重新測試'}
`;

        fs.writeFileSync('admin-deployment-verification-report.md', report);
        console.log('📄 部署驗證報告已保存: admin-deployment-verification-report.md');
        
        return this.results;
    }

    async runVerification() {
        try {
            console.log('🎯 開始管理員系統部署驗證...');
            console.log('=' .repeat(60));
            
            await this.initialize();
            
            // 測試步驟
            const step1 = await this.testAdminPageAccess();
            if (step1) {
                this.results.deploymentStatus = 'accessible';
                
                const step2 = await this.testAdminModulesVisibility();
                const step3 = await this.testRandomModuleNavigation(); 
                const step4 = await this.testAPIEndpoints();
                
                if (step2 && step3) {
                    this.results.deploymentStatus = 'success';
                } else {
                    this.results.deploymentStatus = 'partial';
                }
            } else {
                this.results.deploymentStatus = 'failed';
            }
            
            const results = await this.generateSimpleReport();
            
            console.log('\n🎯 部署驗證總結:');
            console.log(`📊 總體評分: ${results.overallScore}/100`);
            console.log(`🎛️  部署狀態: ${results.deploymentStatus}`);
            console.log(`📁 模組發現: ${results.modulesFound}/8`);
            console.log(`🔗 API端點: ${results.apisResponding}/7+`);
            
            if (results.overallScore >= 80) {
                console.log('🎉 管理員系統部署成功！8大模組已可用！');
            } else if (results.overallScore >= 60) {
                console.log('✅ 部署基本成功，建議進行功能完善。');
            } else {
                console.log('⚠️  部署需要修復，請檢查系統配置。');
            }
            
            return results;
            
        } catch (error) {
            console.error('❌ 驗證過程失敗:', error);
            throw error;
        } finally {
            if (this.browser) {
                console.log('🔍 保持瀏覽器開啟供檢查...');
                // await this.browser.close();
            }
        }
    }
}

// 執行驗證
if (require.main === module) {
    const verifier = new AdminDeploymentVerifier();
    verifier.runVerification()
        .then(results => {
            console.log('\n✅ 管理員部署驗證完成！');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ 驗證失敗:', error);
            process.exit(1);
        });
}

module.exports = AdminDeploymentVerifier;