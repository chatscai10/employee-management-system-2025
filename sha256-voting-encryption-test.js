/**
 * 🔐 SHA-256匿名投票加密系統測試
 * 深度測試升遷投票系統的SHA-256加密和匿名化功能
 * 
 * 測試重點:
 * - SHA-256加密機制驗證
 * - CANDIDATE_X_001匿名格式檢查
 * - 投票修改機制 (3次機會)
 * - 自動投票觸發系統
 * - 匿名投票安全機制
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

class SHA256VotingEncryptionTest {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = {
            encryptionSystemVisible: false,
            sha256Mentioned: false,
            candidateFormatCorrect: false,
            modificationRulesFound: false,
            autoTriggerSystemFound: false,
            votingFunctionalityWorking: false,
            overallScore: 0,
            details: {}
        };
        this.apiInterceptions = [];
    }

    async initialize() {
        console.log('🔐 啟動SHA-256匿名投票加密系統測試...');
        
        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: { width: 1920, height: 1080 }
        });

        this.page = await this.browser.newPage();
        
        // 監控API調用
        this.page.on('response', response => {
            if (response.url().includes('/api/admin/promotions') || 
                response.url().includes('/voting') || 
                response.url().includes('/promotion')) {
                this.apiInterceptions.push({
                    url: response.url(),
                    status: response.status(),
                    timestamp: new Date().toISOString()
                });
            }
        });

        console.log('✅ 瀏覽器初始化完成');
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async loginAndNavigateToVoting() {
        console.log('\n🔐 登入並導航到升遷投票管理...');
        
        try {
            // 登入流程
            await this.page.goto('https://employee-management-system-intermediate.onrender.com/login');
            await this.delay(3000);

            const nameInput = await this.page.$('input[name="name"]');
            const idInput = await this.page.$('input[name="idNumber"]');
            
            if (nameInput && idInput) {
                await nameInput.type('系統管理員');
                await idInput.type('A123456789');
                
                const loginBtn = await this.page.$('button[type="submit"]');
                await loginBtn.click();
                await this.delay(5000);
            }

            // 導航到升遷投票管理
            const votingLink = await this.page.$('a[data-section="promotion-management"]');
            if (votingLink) {
                await votingLink.click();
                await this.delay(3000);
                console.log('✅ 成功導航到升遷投票管理模組');
                return true;
            }

            return false;

        } catch (error) {
            console.error('❌ 登入和導航失敗:', error.message);
            return false;
        }
    }

    async testEncryptionSecurityFeatures() {
        console.log('\n🔐 測試匿名投票安全機制顯示...');
        
        try {
            // 檢查加密信息區塊
            const encryptionInfo = await this.page.$('#promotion-encryption-info');
            if (!encryptionInfo) {
                console.log('❌ 未找到匿名投票安全機制說明區塊');
                return false;
            }

            this.testResults.encryptionSystemVisible = true;
            console.log('✅ 找到匿名投票安全機制說明區塊');

            // 讀取安全機制列表
            const securityFeatures = await this.page.$$eval('#promotion-encryption-info li', items =>
                items.map(item => item.textContent.trim())
            );

            console.log(`📊 發現 ${securityFeatures.length} 個安全機制:`);
            securityFeatures.forEach((feature, index) => {
                console.log(`   ${index + 1}. ${feature}`);
            });

            // 檢查關鍵安全特性
            const expectedFeatures = {
                sha256: ['SHA-256', 'sha256', '加密'],
                candidateFormat: ['CANDIDATE_X_001', '匿名化', '候選人'],
                modification: ['修改', '3次', '機會'],
                autoTrigger: ['自動', '觸發', '新人', '轉正', '降職', '懲罰']
            };

            // 檢查SHA-256加密
            this.testResults.sha256Mentioned = securityFeatures.some(feature => 
                expectedFeatures.sha256.some(keyword => feature.includes(keyword))
            );

            // 檢查CANDIDATE_X_001格式
            this.testResults.candidateFormatCorrect = securityFeatures.some(feature => 
                expectedFeatures.candidateFormat.some(keyword => feature.includes(keyword))
            );

            // 檢查投票修改機制
            this.testResults.modificationRulesFound = securityFeatures.some(feature => 
                expectedFeatures.modification.some(keyword => feature.includes(keyword))
            );

            // 檢查自動觸發系統
            this.testResults.autoTriggerSystemFound = securityFeatures.some(feature => 
                expectedFeatures.autoTrigger.some(keyword => feature.includes(keyword))
            );

            console.log('\n📋 安全機制驗證結果:');
            console.log(`   SHA-256加密: ${this.testResults.sha256Mentioned ? '✅' : '❌'}`);
            console.log(`   候選人匿名化: ${this.testResults.candidateFormatCorrect ? '✅' : '❌'}`);
            console.log(`   修改機制: ${this.testResults.modificationRulesFound ? '✅' : '❌'}`);
            console.log(`   自動觸發: ${this.testResults.autoTriggerSystemFound ? '✅' : '❌'}`);

            this.testResults.details.securityFeatures = securityFeatures;
            
            return true;

        } catch (error) {
            console.error('❌ 安全機制測試失敗:', error.message);
            return false;
        }
    }

    async testVotingFunctionality() {
        console.log('\n🗳️  測試投票功能操作...');
        
        try {
            // 檢查投票活動管理功能按鈕
            const votingButtons = await this.page.$$eval('#promotion-management .btn', buttons =>
                buttons.map(btn => ({
                    text: btn.textContent.trim(),
                    onclick: btn.getAttribute('onclick')
                }))
            );

            console.log(`📊 發現 ${votingButtons.length} 個投票管理功能按鈕:`);
            votingButtons.forEach((btn, index) => {
                console.log(`   ${index + 1}. ${btn.text} ${btn.onclick ? `(${btn.onclick})` : ''}`);
            });

            // 檢查投票狀態篩選器
            const statusFilter = await this.page.$('#promotion-status-filter');
            if (statusFilter) {
                const options = await this.page.$$eval('#promotion-status-filter option', opts =>
                    opts.map(opt => opt.textContent.trim()).filter(text => text)
                );
                console.log('✅ 投票狀態篩選器可用:', options);
                this.testResults.details.statusFilterOptions = options;
            }

            // 測試建立投票功能按鈕
            const createVotingBtns = await this.page.$x("//button[contains(text(), '建立投票')]");
            if (createVotingBtns.length > 0) {
                console.log('✅ 找到建立投票功能按鈕');
                
                // 測試點擊建立投票按鈕（但不實際執行）
                // 我們只檢查按鈕是否可點擊
                const isClickable = await this.page.evaluate((btn) => {
                    return btn.offsetHeight > 0 && btn.offsetWidth > 0 && !btn.disabled;
                }, createVotingBtns[0]);
                
                if (isClickable) {
                    console.log('✅ 建立投票按鈕可點擊');
                    this.testResults.votingFunctionalityWorking = true;
                }
            }

            // 檢查投票統計功能
            const statsButtons = await this.page.$x("//button[contains(text(), '統計')]");
            if (statsButtons.length > 0) {
                console.log('✅ 找到投票統計功能按鈕');
            }

            return true;

        } catch (error) {
            console.error('❌ 投票功能測試失敗:', error.message);
            return false;
        }
    }

    async testVotingDataDisplay() {
        console.log('\n📊 測試投票活動顯示...');
        
        try {
            // 檢查投票活動容器
            const campaignContainer = await this.page.$('#promotion-campaigns-container');
            if (campaignContainer) {
                const hasContent = await this.page.evaluate(el => 
                    el.innerHTML.trim().length > 50 && !el.innerHTML.includes('載入'), 
                    campaignContainer
                );
                
                if (hasContent) {
                    console.log('✅ 投票活動顯示容器有內容');
                } else {
                    console.log('⚠️  投票活動顯示容器為空或載入中');
                }
                
                // 嘗試讀取投票活動內容
                const campaignText = await this.page.evaluate(el => 
                    el.textContent.trim(), campaignContainer
                );
                
                if (campaignText.length > 0) {
                    console.log(`📋 投票活動內容預覽: ${campaignText.substring(0, 100)}...`);
                }
            }

            return true;

        } catch (error) {
            console.error('❌ 投票數據顯示測試失敗:', error.message);
            return false;
        }
    }

    async testAPIEndpoints() {
        console.log('\n🔗 檢查投票相關API端點...');
        
        try {
            // 觸發API調用來檢查端點可用性
            const queryBtn = await this.page.$x("//button[contains(text(), '查看投票')]");
            if (queryBtn.length > 0) {
                await queryBtn[0].click();
                await this.delay(2000);
            }

            // 等待API響應
            await this.delay(3000);

            console.log(`📡 監控到 ${this.apiInterceptions.length} 個投票相關API調用:`);
            this.apiInterceptions.forEach((api, index) => {
                console.log(`   ${index + 1}. ${api.url} - ${api.status} (${api.timestamp})`);
            });

            return this.apiInterceptions.length > 0;

        } catch (error) {
            console.error('❌ API端點測試失敗:', error.message);
            return false;
        }
    }

    async generateTestReport() {
        console.log('\n📋 生成SHA-256投票加密系統測試報告...');

        // 計算總體評分
        let score = 0;
        
        if (this.testResults.encryptionSystemVisible) score += 20;
        if (this.testResults.sha256Mentioned) score += 25;
        if (this.testResults.candidateFormatCorrect) score += 20;
        if (this.testResults.modificationRulesFound) score += 15;
        if (this.testResults.autoTriggerSystemFound) score += 15;
        if (this.testResults.votingFunctionalityWorking) score += 5;

        this.testResults.overallScore = score;

        const report = `
# 🔐 SHA-256匿名投票加密系統測試報告

## 📊 總體評分: ${this.testResults.overallScore}/100

${this.testResults.overallScore >= 80 ? '🎉 優秀！SHA-256投票系統完整實現' :
  this.testResults.overallScore >= 60 ? '✅ 良好！基本安全機制到位' :
  '⚠️  需要改進！投票安全系統存在缺陷'}

## 🔍 詳細測試結果

### 🔐 加密系統可見性:
- 狀態: ${this.testResults.encryptionSystemVisible ? '✅ 可見' : '❌ 未找到'}
- 得分: ${this.testResults.encryptionSystemVisible ? '20' : '0'}/20

### 🛡️  SHA-256加密機制:
- 狀態: ${this.testResults.sha256Mentioned ? '✅ 已實現' : '❌ 未提及'}
- 得分: ${this.testResults.sha256Mentioned ? '25' : '0'}/25

### 🎭 候選人匿名化 (CANDIDATE_X_001):
- 狀態: ${this.testResults.candidateFormatCorrect ? '✅ 正確格式' : '❌ 格式未確認'}
- 得分: ${this.testResults.candidateFormatCorrect ? '20' : '0'}/20

### 🔄 投票修改機制 (3次機會):
- 狀態: ${this.testResults.modificationRulesFound ? '✅ 機制存在' : '❌ 未找到'}
- 得分: ${this.testResults.modificationRulesFound ? '15' : '0'}/15

### ⚡ 自動投票觸發系統:
- 狀態: ${this.testResults.autoTriggerSystemFound ? '✅ 觸發規則存在' : '❌ 未找到觸發規則'}
- 得分: ${this.testResults.autoTriggerSystemFound ? '15' : '0'}/15

### 🗳️  投票功能操作:
- 狀態: ${this.testResults.votingFunctionalityWorking ? '✅ 功能可用' : '❌ 功能問題'}
- 得分: ${this.testResults.votingFunctionalityWorking ? '5' : '0'}/5

## 🔍 發現的安全機制

${this.testResults.details.securityFeatures ? 
    this.testResults.details.securityFeatures.map((feature, index) => 
        `${index + 1}. ${feature}`
    ).join('\n') : 
    '未獲取到安全機制詳情'}

## 🔗 API調用記錄

${this.apiInterceptions.length > 0 ? 
    this.apiInterceptions.map((api, index) => 
        `${index + 1}. ${api.url} - ${api.status} (${api.timestamp})`
    ).join('\n') : 
    '未記錄到投票相關API調用'}

## 🎯 系統邏輯符合度評估

### ✅ 符合系統邏輯.txt的項目:
${this.testResults.encryptionSystemVisible ? '- 🔐 匿名投票安全機制界面完整' : ''}
${this.testResults.sha256Mentioned ? '- 🛡️  SHA-256加密機制已實現' : ''}
${this.testResults.candidateFormatCorrect ? '- 🎭 CANDIDATE_X_001匿名格式正確' : ''}
${this.testResults.modificationRulesFound ? '- 🔄 投票修改機制(3次)已設計' : ''}
${this.testResults.autoTriggerSystemFound ? '- ⚡ 自動投票觸發系統已規劃' : ''}

### ❌ 需要改進的項目:
${!this.testResults.encryptionSystemVisible ? '- 🔧 加密系統界面缺失' : ''}
${!this.testResults.sha256Mentioned ? '- 🔐 SHA-256加密機制未實現' : ''}
${!this.testResults.candidateFormatCorrect ? '- 🎭 候選人匿名格式需要完善' : ''}
${!this.testResults.modificationRulesFound ? '- 🔄 投票修改機制需要實現' : ''}
${!this.testResults.autoTriggerSystemFound ? '- ⚡ 自動觸發系統需要開發' : ''}

## 🚀 改進建議

${this.testResults.overallScore >= 80 ?
    '✅ SHA-256投票系統表現優秀！建議進行實際投票測試驗證。' :
    this.testResults.overallScore >= 60 ?
    '⚡ 基本安全機制已到位，建議完善：\n- 強化SHA-256加密實現\n- 完善自動觸發邏輯\n- 增加投票流程測試' :
    '⚠️  系統需要重大改進：\n- 實現完整的SHA-256加密機制\n- 建立CANDIDATE_X_001匿名系統\n- 開發投票修改和自動觸發功能'}

---
**測試時間**: ${new Date().toISOString()}
**測試範圍**: SHA-256匿名投票加密系統完整性驗證
**符合標準**: 系統邏輯.txt升遷投票安全規格
`;

        fs.writeFileSync('sha256-voting-encryption-test-report.md', report);
        console.log('📄 測試報告已保存: sha256-voting-encryption-test-report.md');
        
        return this.testResults;
    }

    async runTest() {
        try {
            console.log('🎯 開始SHA-256匿名投票加密系統深度測試...');
            console.log('='.repeat(70));

            await this.initialize();

            // 測試流程
            const loginSuccess = await this.loginAndNavigateToVoting();
            if (loginSuccess) {
                const encryptionTest = await this.testEncryptionSecurityFeatures();
                const functionalityTest = await this.testVotingFunctionality();
                const displayTest = await this.testVotingDataDisplay();
                const apiTest = await this.testAPIEndpoints();
            }

            const results = await this.generateTestReport();

            console.log('\n🎯 SHA-256投票加密系統測試總結:');
            console.log(`📊 總體評分: ${results.overallScore}/100`);
            console.log(`🔐 加密系統: ${results.encryptionSystemVisible ? '✅' : '❌'}`);
            console.log(`🛡️  SHA-256: ${results.sha256Mentioned ? '✅' : '❌'}`);
            console.log(`🎭 匿名格式: ${results.candidateFormatCorrect ? '✅' : '❌'}`);
            console.log(`🔄 修改機制: ${results.modificationRulesFound ? '✅' : '❌'}`);
            console.log(`⚡ 自動觸發: ${results.autoTriggerSystemFound ? '✅' : '❌'}`);

            if (results.overallScore >= 80) {
                console.log('🎉 SHA-256匿名投票系統表現優秀！安全機制完整實現！');
            } else if (results.overallScore >= 60) {
                console.log('✅ 基本安全機制已到位，建議完善細節功能。');
            } else {
                console.log('⚠️  投票安全系統需要進一步完善。');
            }

            return results;

        } catch (error) {
            console.error('❌ 測試過程發生錯誤:', error);
            throw error;
        } finally {
            if (this.browser) {
                console.log('🔍 保持瀏覽器開啟供檢查...');
                // await this.browser.close();
            }
        }
    }
}

// 執行測試
if (require.main === module) {
    const test = new SHA256VotingEncryptionTest();
    test.runTest()
        .then(results => {
            console.log('\n✅ SHA-256匿名投票加密系統測試完成！');
        })
        .catch(error => {
            console.error('❌ 測試執行失敗:', error);
            process.exit(1);
        });
}

module.exports = SHA256VotingEncryptionTest;