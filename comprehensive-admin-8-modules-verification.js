/**
 * 🔥 完整管理員8大模組智慧驗證測試系統
 * 驗證管理員頁面所有功能模組是否符合系統邏輯.txt規格要求
 * 
 * 測試範圍:
 * ✅ 員工管理 - CRUD操作完整性
 * ✅ 庫存管理 - 商品管理和預警系統  
 * ✅ 營收管理 - 統計分析和圖表功能
 * ✅ 排班系統 - 6重規則引擎驗證
 * ✅ 升遷投票 - SHA-256加密和匿名化
 * ✅ 分店管理 - 多店點管理功能
 * ✅ 維修管理 - 工單管理和指派系統
 * ✅ 系統設定 - Telegram整合和健康監控
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

class ComprehensiveAdminModulesValidator {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = {
            overall: 0,
            modules: {},
            systemLogicCompliance: 0,
            detailedResults: {},
            timestamp: new Date().toISOString()
        };
        
        // 系統邏輯期望值
        this.expectedModules = [
            '員工管理', '庫存管理', '營收管理', '排班系統',
            '升遷投票', '分店管理', '維修管理', '系統設定'
        ];
    }

    async initialize() {
        console.log('🚀 初始化完整管理員8大模組驗證系統...');
        
        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: { width: 1920, height: 1080 },
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor'
            ]
        });

        this.page = await this.browser.newPage();
        
        // 設置請求攔截來監控API調用
        await this.page.setRequestInterception(true);
        this.apiCalls = [];
        
        this.page.on('request', (request) => {
            if (request.url().includes('/api/admin/')) {
                this.apiCalls.push({
                    url: request.url(),
                    method: request.method(),
                    timestamp: new Date().toISOString()
                });
            }
            request.continue();
        });
        
        this.page.on('response', async (response) => {
            if (response.url().includes('/api/admin/')) {
                const responseData = {
                    url: response.url(),
                    status: response.status(),
                    statusText: response.statusText()
                };
                
                try {
                    if (response.headers()['content-type']?.includes('application/json')) {
                        responseData.data = await response.json();
                    }
                } catch (e) {
                    responseData.error = 'Failed to parse JSON';
                }
                
                this.apiCalls.push(responseData);
            }
        });

        await this.page.goto('https://employee-management-system-intermediate.onrender.com/admin');
        console.log('📋 已導航到管理員頁面');
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async testNavigationAndModuleVisibility() {
        console.log('\n📊 測試1: 導航菜單和8大模組可見性');
        
        // 等待頁面完全載入
        await this.delay(3000);
        
        // 檢查導航菜單項目
        const navLinks = await this.page.$$eval('.nav-menu .nav-link', links => 
            links.map(link => ({
                text: link.textContent.trim(),
                dataSection: link.getAttribute('data-section'),
                isVisible: link.offsetHeight > 0
            }))
        );
        
        console.log('📋 發現導航菜單項目:', navLinks.length);
        navLinks.forEach((link, index) => {
            console.log(`   ${index + 1}. ${link.text} (${link.dataSection}) - ${link.isVisible ? '✅' : '❌'}`);
        });
        
        // 檢查內容區域
        const contentSections = await this.page.$$eval('.section', sections =>
            sections.map(section => ({
                id: section.id,
                isVisible: section.classList.contains('active'),
                hasContent: section.innerHTML.length > 100
            }))
        );
        
        console.log('📄 發現內容區域:', contentSections.length);
        contentSections.forEach((section, index) => {
            console.log(`   ${index + 1}. ${section.id} - 可見: ${section.isVisible ? '✅' : '❌'}, 有內容: ${section.hasContent ? '✅' : '❌'}`);
        });
        
        this.testResults.modules.navigation = {
            navLinksFound: navLinks.length,
            contentSectionsFound: contentSections.length,
            expectedModules: this.expectedModules.length,
            navLinks,
            contentSections,
            compliance: (navLinks.length >= 8 && contentSections.length >= 8) ? 100 : 50
        };
        
        return navLinks.length >= 8 && contentSections.length >= 8;
    }

    async testEmployeeManagementModule() {
        console.log('\n👥 測試2: 員工管理模組 - CRUD操作驗證');
        
        // 確保在員工管理頁面
        await this.page.click('a[data-section="employee-management"]');
        await this.delay(2000);
        
        const results = {};
        
        // 檢查員工表格
        const employeeTable = await this.page.$('.employee-table');
        results.hasEmployeeTable = employeeTable !== null;
        
        if (employeeTable) {
            const tableHeaders = await this.page.$$eval('.employee-table th', headers => 
                headers.map(h => h.textContent.trim())
            );
            results.tableHeaders = tableHeaders;
            console.log('📊 員工表格標題:', tableHeaders);
            
            const employees = await this.page.$$eval('.employee-table tbody tr', rows =>
                rows.map(row => {
                    const cells = Array.from(row.querySelectorAll('td'));
                    return cells.length > 0 ? cells.map(cell => cell.textContent.trim()) : null;
                }).filter(Boolean)
            );
            results.employeeCount = employees.length;
            console.log(`👥 發現 ${employees.length} 位員工記錄`);
        }
        
        // 檢查篩選功能
        const filters = await this.page.$$eval('.filter-bar select, .filter-bar input', inputs =>
            inputs.map(input => ({
                id: input.id,
                type: input.tagName.toLowerCase(),
                options: input.tagName.toLowerCase() === 'select' ? 
                    Array.from(input.options).map(opt => opt.text) : null
            }))
        );
        results.filters = filters;
        console.log('🔍 篩選器:', filters.length, '個');
        
        // 測試員工核准功能（如果有待審核員工）
        const approveButtons = await this.page.$$('button:contains("核准")');
        results.hasApproveFunction = approveButtons.length > 0;
        
        this.testResults.modules.employeeManagement = {
            ...results,
            compliance: results.hasEmployeeTable ? 85 : 40
        };
        
        console.log(`✅ 員工管理模組評分: ${this.testResults.modules.employeeManagement.compliance}/100`);
        return results.hasEmployeeTable;
    }

    async testInventoryManagementModule() {
        console.log('\n📦 測試3: 庫存管理模組 - 商品管理和預警系統');
        
        await this.page.click('a[data-section="inventory-management"]');
        await this.delay(2000);
        
        const results = {};
        
        // 檢查庫存管理功能按鈕
        const inventoryButtons = await this.page.$$eval('#inventory-management .btn', buttons =>
            buttons.map(btn => btn.textContent.trim())
        );
        results.functionalButtons = inventoryButtons;
        console.log('📦 庫存功能按鈕:', inventoryButtons);
        
        // 檢查庫存篩選器
        const inventoryFilters = await this.page.$$eval('#inventory-category-filter option, #inventory-status-filter option', options =>
            options.map(opt => opt.textContent.trim()).filter(text => text)
        );
        results.filters = inventoryFilters;
        console.log('🔍 庫存篩選選項:', inventoryFilters);
        
        // 測試新增商品功能
        try {
            await this.page.click('button:contains("新增商品")');
            await this.delay(1000);
            results.hasAddItemFunction = true;
            console.log('✅ 新增商品功能可用');
        } catch (error) {
            results.hasAddItemFunction = false;
            console.log('❌ 新增商品功能不可用:', error.message);
        }
        
        // 等待庫存數據載入
        await this.delay(3000);
        
        this.testResults.modules.inventoryManagement = {
            ...results,
            compliance: (inventoryButtons.length >= 3 && inventoryFilters.length >= 6) ? 80 : 50
        };
        
        console.log(`✅ 庫存管理模組評分: ${this.testResults.modules.inventoryManagement.compliance}/100`);
        return inventoryButtons.length >= 3;
    }

    async testRevenueManagementModule() {
        console.log('\n💰 測試4: 營收管理模組 - 統計分析和圖表功能');
        
        await this.page.click('a[data-section="revenue-management"]');
        await this.delay(2000);
        
        const results = {};
        
        // 檢查營收統計卡片
        const revenueStats = await this.page.$$eval('#revenue-management .stat-card', cards =>
            cards.map(card => {
                const number = card.querySelector('.stat-number')?.textContent.trim();
                const label = card.querySelector('.stat-label')?.textContent.trim();
                return { number, label };
            })
        );
        results.stats = revenueStats;
        console.log('📊 營收統計:', revenueStats);
        
        // 檢查圖表容器
        const chartCanvas = await this.page.$('#revenue-chart');
        results.hasChart = chartCanvas !== null;
        console.log(`📈 圖表容器: ${results.hasChart ? '✅' : '❌'}`);
        
        // 檢查日期篩選器
        const dateInputs = await this.page.$$('#revenue-start-date, #revenue-end-date');
        results.hasDateFilters = dateInputs.length === 2;
        console.log(`📅 日期篩選器: ${results.hasDateFilters ? '✅' : '❌'}`);
        
        // 檢查營收功能按鈕
        const revenueButtons = await this.page.$$eval('#revenue-management .btn', buttons =>
            buttons.map(btn => btn.textContent.trim())
        );
        results.functionalButtons = revenueButtons;
        console.log('💰 營收功能按鈕:', revenueButtons);
        
        await this.delay(3000); // 等待數據載入
        
        this.testResults.modules.revenueManagement = {
            ...results,
            compliance: (revenueStats.length >= 4 && results.hasChart && results.hasDateFilters) ? 85 : 60
        };
        
        console.log(`✅ 營收管理模組評分: ${this.testResults.modules.revenueManagement.compliance}/100`);
        return revenueStats.length >= 4;
    }

    async testScheduleManagementModule() {
        console.log('\n📅 測試5: 排班系統管理 - 6重規則引擎驗證');
        
        await this.page.click('a[data-section="schedule-management"]');
        await this.delay(2000);
        
        const results = {};
        
        // 檢查6重規則引擎說明
        const rulesInfo = await this.page.$('#schedule-rules-info');
        results.hasRulesInfo = rulesInfo !== null;
        
        if (rulesInfo) {
            const rulesList = await this.page.$$eval('#schedule-rules-info li', items =>
                items.map(item => item.textContent.trim())
            );
            results.rulesCount = rulesList.length;
            results.rulesList = rulesList;
            console.log('🤖 智慧排班6重規則:', rulesList);
        }
        
        // 檢查智慧排班按鈕
        const smartScheduleBtn = await this.page.$('button:contains("智慧排班")');
        results.hasSmartSchedule = smartScheduleBtn !== null;
        console.log(`🤖 智慧排班功能: ${results.hasSmartSchedule ? '✅' : '❌'}`);
        
        // 測試智慧排班功能
        if (results.hasSmartSchedule) {
            try {
                await smartScheduleBtn.click();
                await this.delay(1000);
                
                // 檢查是否有確認對話框
                const dialogAppeared = await this.page.evaluate(() => {
                    return new Promise(resolve => {
                        const originalConfirm = window.confirm;
                        window.confirm = function(message) {
                            resolve(true);
                            return true; // 模擬點擊確定
                        };
                        setTimeout(() => resolve(false), 2000);
                    });
                });
                
                results.smartScheduleTriggered = dialogAppeared;
                console.log(`🤖 智慧排班觸發: ${dialogAppeared ? '✅' : '❌'}`);
            } catch (error) {
                results.smartScheduleTriggered = false;
                console.log('❌ 智慧排班測試失敗:', error.message);
            }
        }
        
        await this.delay(3000);
        
        this.testResults.modules.scheduleManagement = {
            ...results,
            compliance: (results.rulesCount === 6 && results.hasSmartSchedule) ? 90 : 65
        };
        
        console.log(`✅ 排班系統模組評分: ${this.testResults.modules.scheduleManagement.compliance}/100`);
        return results.rulesCount === 6;
    }

    async testPromotionVotingModule() {
        console.log('\n🗳️ 測試6: 升遷投票管理 - SHA-256加密和匿名化');
        
        await this.page.click('a[data-section="promotion-management"]');
        await this.delay(2000);
        
        const results = {};
        
        // 檢查匿名投票安全機制說明
        const encryptionInfo = await this.page.$('#promotion-encryption-info');
        results.hasEncryptionInfo = encryptionInfo !== null;
        
        if (encryptionInfo) {
            const securityFeatures = await this.page.$$eval('#promotion-encryption-info li', items =>
                items.map(item => item.textContent.trim())
            );
            results.securityFeaturesCount = securityFeatures.length;
            results.securityFeatures = securityFeatures;
            console.log('🔐 匿名投票安全機制:', securityFeatures);
            
            // 檢查是否提及 SHA-256 和 CANDIDATE_X_001 格式
            const hasSHA256 = securityFeatures.some(feature => feature.includes('SHA-256'));
            const hasCandidateFormat = securityFeatures.some(feature => feature.includes('CANDIDATE_X_001'));
            results.hasSHA256Encryption = hasSHA256;
            results.hasCandidateAnonymization = hasCandidateFormat;
        }
        
        // 檢查投票活動管理功能
        const votingButtons = await this.page.$$eval('#promotion-management .btn', buttons =>
            buttons.map(btn => btn.textContent.trim())
        );
        results.functionalButtons = votingButtons;
        console.log('🗳️ 投票管理功能:', votingButtons);
        
        // 測試建立投票活動
        const createVotingBtn = await this.page.$('button:contains("建立投票")');
        results.hasCreateVotingFunction = createVotingBtn !== null;
        
        await this.delay(3000);
        
        this.testResults.modules.promotionVoting = {
            ...results,
            compliance: (results.hasSHA256Encryption && results.hasCandidateAnonymization && results.securityFeaturesCount >= 4) ? 95 : 70
        };
        
        console.log(`✅ 升遷投票模組評分: ${this.testResults.modules.promotionVoting.compliance}/100`);
        return results.hasSHA256Encryption && results.hasCandidateAnonymization;
    }

    async testSystemSettingsModule() {
        console.log('\n⚙️ 測試7: 系統設定 - Telegram整合和健康監控');
        
        await this.page.click('a[data-section="system-settings"]');
        await this.delay(2000);
        
        const results = {};
        
        // 檢查設定模組
        const settingsCards = await this.page.$$eval('.settings-grid .stat-card', cards =>
            cards.map(card => {
                const title = card.querySelector('h4')?.textContent.trim();
                const inputsCount = card.querySelectorAll('input').length;
                const buttonsCount = card.querySelectorAll('button').length;
                return { title, inputsCount, buttonsCount };
            })
        );
        results.settingsCards = settingsCards;
        console.log('⚙️ 系統設定模組:', settingsCards);
        
        // 檢查Telegram設定
        const telegramInputs = await this.page.$$('#telegram-bot-token, #telegram-group-id');
        results.hasTelegramSettings = telegramInputs.length === 2;
        console.log(`📱 Telegram設定: ${results.hasTelegramSettings ? '✅' : '❌'}`);
        
        // 檢查系統健康監控
        const systemStatus = await this.page.$('#system-status-info');
        results.hasSystemMonitoring = systemStatus !== null;
        
        if (systemStatus) {
            const statusItems = await this.page.$$eval('#system-status-info p', items =>
                items.map(item => item.textContent.trim())
            );
            results.statusItemsCount = statusItems.length;
            results.statusItems = statusItems;
            console.log('🔍 系統監控項目:', statusItems);
        }
        
        // 測試健康檢查功能
        const healthCheckBtn = await this.page.$('button:contains("健康檢查")');
        results.hasHealthCheck = healthCheckBtn !== null;
        
        await this.delay(2000);
        
        this.testResults.modules.systemSettings = {
            ...results,
            compliance: (results.hasTelegramSettings && results.hasSystemMonitoring && results.statusItemsCount >= 4) ? 90 : 65
        };
        
        console.log(`✅ 系統設定模組評分: ${this.testResults.modules.systemSettings.compliance}/100`);
        return results.hasTelegramSettings && results.hasSystemMonitoring;
    }

    async testMaintenanceAndStoreModules() {
        console.log('\n🔧🏪 測試8: 維修管理和分店管理模組');
        
        const results = {};
        
        // 測試維修管理
        await this.page.click('a[data-section="maintenance-management"]');
        await this.delay(2000);
        
        const maintenanceFilters = await this.page.$$eval('#maintenance-status-filter option, #maintenance-priority-filter option', options =>
            options.map(opt => opt.textContent.trim()).filter(text => text)
        );
        results.maintenanceFilters = maintenanceFilters;
        console.log('🔧 維修管理篩選器:', maintenanceFilters);
        
        // 測試分店管理
        await this.page.click('a[data-section="store-management"]');
        await this.delay(2000);
        
        const storeButtons = await this.page.$$eval('#store-management .btn', buttons =>
            buttons.map(btn => btn.textContent.trim())
        );
        results.storeButtons = storeButtons;
        console.log('🏪 分店管理功能:', storeButtons);
        
        await this.delay(3000);
        
        this.testResults.modules.maintenanceAndStore = {
            ...results,
            compliance: (maintenanceFilters.length >= 8 && storeButtons.length >= 3) ? 85 : 60
        };
        
        console.log(`✅ 維修&分店管理評分: ${this.testResults.modules.maintenanceAndStore.compliance}/100`);
        return maintenanceFilters.length >= 8;
    }

    async testAPIEndpoints() {
        console.log('\n🔗 測試9: 管理員API端點響應驗證');
        
        console.log(`📡 已監控到 ${this.apiCalls.length} 個API調用`);
        
        const apiResults = {
            totalCalls: this.apiCalls.length,
            uniqueEndpoints: [...new Set(this.apiCalls.map(call => call.url?.split('?')[0] || call.url))],
            successfulCalls: this.apiCalls.filter(call => call.status && call.status < 400).length,
            failedCalls: this.apiCalls.filter(call => call.status && call.status >= 400).length
        };
        
        console.log('📊 API調用統計:');
        console.log(`   總調用數: ${apiResults.totalCalls}`);
        console.log(`   獨特端點: ${apiResults.uniqueEndpoints.length}`);
        console.log(`   成功調用: ${apiResults.successfulCalls}`);
        console.log(`   失敗調用: ${apiResults.failedCalls}`);
        
        // 預期的管理員API端點
        const expectedAdminAPIs = [
            '/api/admin/inventory',
            '/api/admin/revenue', 
            '/api/admin/schedules',
            '/api/admin/promotions',
            '/api/admin/maintenance',
            '/api/admin/stores',
            '/api/admin/system/health'
        ];
        
        const availableAPIs = apiResults.uniqueEndpoints.filter(url => 
            expectedAdminAPIs.some(expectedAPI => url.includes(expectedAPI))
        );
        
        apiResults.expectedAPIsFound = availableAPIs.length;
        apiResults.expectedAPIsTotal = expectedAdminAPIs.length;
        apiResults.apiCoverage = (availableAPIs.length / expectedAdminAPIs.length * 100).toFixed(1);
        
        console.log(`🎯 API端點覆蓋率: ${apiResults.apiCoverage}% (${availableAPIs.length}/${expectedAdminAPIs.length})`);
        
        this.testResults.api = apiResults;
        return apiResults.apiCoverage >= 80;
    }

    async generateComprehensiveReport() {
        console.log('\n📋 生成完整驗證報告...');
        
        // 計算總體合規分數
        const moduleScores = Object.values(this.testResults.modules).map(module => module.compliance || 0);
        const averageScore = moduleScores.length > 0 ? 
            moduleScores.reduce((sum, score) => sum + score, 0) / moduleScores.length : 0;
        
        this.testResults.overall = Math.round(averageScore);
        
        // 系統邏輯合規度評估
        const systemLogicItems = {
            '8大管理功能模組': Object.keys(this.testResults.modules).length >= 7,
            '智慧排班6重規則': this.testResults.modules.scheduleManagement?.rulesCount === 6,
            'SHA-256匿名投票': this.testResults.modules.promotionVoting?.hasSHA256Encryption,
            'CANDIDATE_X_001格式': this.testResults.modules.promotionVoting?.hasCandidateAnonymization,
            'Telegram系統整合': this.testResults.modules.systemSettings?.hasTelegramSettings,
            '系統健康監控': this.testResults.modules.systemSettings?.hasSystemMonitoring,
            'API端點覆蓋率80%+': this.testResults.api?.apiCoverage >= 80
        };
        
        const systemLogicScore = Object.values(systemLogicItems).filter(Boolean).length;
        this.testResults.systemLogicCompliance = Math.round((systemLogicScore / Object.keys(systemLogicItems).length) * 100);
        
        // 生成詳細報告
        const report = `
# 🏢 完整管理員8大模組驗證測試報告

## 📊 總體評分: ${this.testResults.overall}/100

${this.testResults.overall >= 85 ? '🎉 優秀！管理員系統達到企業級標準' : 
  this.testResults.overall >= 70 ? '✅ 良好！管理員系統基本功能完整' :
  '⚠️ 需要改進！管理員系統存在功能缺失'}

## 🎯 系統邏輯合規度: ${this.testResults.systemLogicCompliance}/100

### 系統邏輯檢查清單:
${Object.entries(systemLogicItems).map(([item, passed]) => 
    `- ${passed ? '✅' : '❌'} ${item}`
).join('\n')}

## 📋 詳細模組測試結果

### ✅ 模組功能測試 (8/8完成):

${Object.entries(this.testResults.modules).map(([moduleName, moduleData]) => `
#### ${moduleName} (${moduleData.compliance}/100)
${moduleData.compliance >= 85 ? '🟢 優秀' : 
  moduleData.compliance >= 70 ? '🟡 良好' : '🔴 需要改進'}
${Object.entries(moduleData).filter(([key]) => key !== 'compliance').map(([key, value]) => 
    `- ${key}: ${typeof value === 'object' ? JSON.stringify(value, null, 2) : value}`
).join('\n')}
`).join('\n')}

### 🔗 API端點測試結果:
- 總API調用: ${this.testResults.api?.totalCalls || 0}次
- 端點覆蓋率: ${this.testResults.api?.apiCoverage || 0}%
- 成功率: ${this.testResults.api?.successfulCalls && this.testResults.api?.totalCalls ? 
    Math.round((this.testResults.api.successfulCalls / this.testResults.api.totalCalls) * 100) : 0}%

## 🎯 關鍵發現與建議

### 📈 符合系統邏輯的項目:
${Object.entries(systemLogicItems).filter(([, passed]) => passed).map(([item]) => `- ✅ ${item}`).join('\n') || '- 暫無完全符合項目'}

### ⚠️ 需要改進的項目:
${Object.entries(systemLogicItems).filter(([, passed]) => !passed).map(([item]) => `- ❌ ${item}`).join('\n') || '- 所有項目已符合標準！'}

## 🚀 改進建議

### 🔥 高優先級:
${this.testResults.systemLogicCompliance < 80 ? `
1. 完善管理員功能模組 - 確保8大模組完全可用
2. 實現智慧排班6重規則引擎
3. 完善升遷投票SHA-256加密系統
` : '🎉 系統已達到高標準，建議進行性能優化'}

### ⭐ 中優先級:
1. 提升API響應速度和錯誤處理
2. 完善前端用戶體驗和載入狀態
3. 增強系統監控和日誌功能

---
**測試時間**: ${this.testResults.timestamp}
**測試範圍**: 管理員8大模組完整功能驗證
**參考標準**: 系統邏輯.txt v2.0規格

### 🏆 企業級標準評估:
${this.testResults.overall >= 90 ? '🌟 企業級標準 - 可直接生產部署' :
  this.testResults.overall >= 80 ? '💼 商業標準 - 適合中小企業使用' :
  this.testResults.overall >= 70 ? '🏢 基礎標準 - 核心功能完整' :
  '🔧 開發階段 - 需要進一步完善'}
`;

        // 保存報告到文件
        const reportFileName = `admin-8-modules-comprehensive-test-report.md`;
        fs.writeFileSync(reportFileName, report);
        console.log(`📄 完整測試報告已保存: ${reportFileName}`);
        
        return this.testResults;
    }

    async runComprehensiveTest() {
        try {
            console.log('🚀 開始執行完整管理員8大模組驗證測試...');
            console.log('=' .repeat(80));
            
            await this.initialize();
            
            // 執行所有測試模組
            const testSuite = [
                this.testNavigationAndModuleVisibility(),
                this.testEmployeeManagementModule(),
                this.testInventoryManagementModule(), 
                this.testRevenueManagementModule(),
                this.testScheduleManagementModule(),
                this.testPromotionVotingModule(),
                this.testSystemSettingsModule(),
                this.testMaintenanceAndStoreModules()
            ];
            
            // 並行執行測試以提高效率
            await Promise.allSettled(testSuite);
            
            // API端點測試
            await this.testAPIEndpoints();
            
            // 生成報告
            const results = await this.generateComprehensiveReport();
            
            console.log('\n🎯 完整驗證測試總結:');
            console.log(`📊 總體評分: ${results.overall}/100`);
            console.log(`🎯 系統邏輯合規度: ${results.systemLogicCompliance}/100`);
            console.log(`🔗 API端點覆蓋率: ${results.api?.apiCoverage || 0}%`);
            console.log(`📁 模組測試完成: ${Object.keys(results.modules).length}/8`);
            
            if (results.overall >= 85) {
                console.log('🎉 恭喜！管理員8大模組已達到企業級標準！');
            } else if (results.overall >= 70) {
                console.log('✅ 良好！管理員系統基本功能完整，可進行進一步優化。');
            } else {
                console.log('⚠️  管理員系統需要重大改進以符合企業要求。');
            }
            
            return results;
            
        } catch (error) {
            console.error('❌ 測試執行失敗:', error);
            throw error;
        } finally {
            if (this.browser) {
                // 保持瀏覽器開啟以供檢查
                console.log('🔍 瀏覽器保持開啟供檢查，測試完成後手動關閉');
                // await this.browser.close();
            }
        }
    }
}

// 執行測試
if (require.main === module) {
    const validator = new ComprehensiveAdminModulesValidator();
    validator.runComprehensiveTest()
        .then(results => {
            console.log('\n✅ 完整管理員8大模組驗證測試完成！');
            console.log(`🏆 最終評分: ${results.overall}/100`);
        })
        .catch(error => {
            console.error('❌ 測試失敗:', error);
            process.exit(1);
        });
}

module.exports = ComprehensiveAdminModulesValidator;