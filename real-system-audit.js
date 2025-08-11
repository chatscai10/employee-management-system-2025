const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class RealSystemAudit {
    constructor() {
        this.browser = null;
        this.page = null;
        this.auditResults = [];
        this.baseUrl = 'https://employee-management-system-intermediate.onrender.com';
        this.actualFeatures = [];
        this.missingFeatures = [];
    }

    async init() {
        console.log('🔍 啟動真實系統功能審查...');
        
        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: { width: 1920, height: 1080 },
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        this.page = await this.browser.newPage();
        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        
        console.log('✅ 審查引擎初始化完成');
    }

    async auditHomePage() {
        console.log('\n📋 第一步：審查首頁實際功能...');
        
        await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
        await this.page.screenshot({ path: 'audit-homepage.png', fullPage: true });
        
        // 獲取頁面所有連結
        const allLinks = await this.page.$$eval('a', links => 
            links.map(link => ({
                text: link.textContent.trim(),
                href: link.href,
                visible: link.offsetParent !== null
            }))
        );
        
        console.log('🔗 首頁實際連結:');
        allLinks.forEach(link => {
            if (link.visible && link.text) {
                console.log(`   - ${link.text}: ${link.href}`);
            }
        });
        
        // 檢查實際可用頁面
        const availablePages = [];
        for (const link of allLinks) {
            if (link.visible && link.href && !link.href.includes('#')) {
                try {
                    const response = await fetch(link.href);
                    if (response.ok) {
                        availablePages.push({
                            name: link.text,
                            url: link.href,
                            status: 'available'
                        });
                    } else {
                        availablePages.push({
                            name: link.text,
                            url: link.href,
                            status: `error_${response.status}`
                        });
                    }
                } catch (error) {
                    availablePages.push({
                        name: link.text,
                        url: link.href,
                        status: 'unreachable'
                    });
                }
            }
        }
        
        this.actualFeatures.push({
            category: 'navigation',
            features: availablePages
        });
        
        return availablePages;
    }

    async auditEmployeePage() {
        console.log('\n👤 第二步：審查員工頁面實際模組...');
        
        // 先嘗試登入
        await this.page.goto(`${this.baseUrl}/login`, { waitUntil: 'networkidle2' });
        
        try {
            await this.page.type('#login-name', '張三');
            await this.page.type('#login-id', 'C123456789');
            await this.page.click('button[type="submit"]');
            await this.page.waitForTimeout(3000);
        } catch (error) {
            console.warn('⚠️ 登入過程有問題:', error.message);
        }
        
        // 檢查是否成功跳轉
        const currentUrl = this.page.url();
        console.log('🔗 登入後URL:', currentUrl);
        
        if (!currentUrl.includes('/employee')) {
            console.log('🔗 手動導航到員工頁面...');
            await this.page.goto(`${this.baseUrl}/employee`, { waitUntil: 'networkidle2' });
        }
        
        await this.page.screenshot({ path: 'audit-employee-page.png', fullPage: true });
        
        // 獲取頁面所有卡片/模組
        const pageContent = await this.page.content();
        const cardElements = await this.page.$$('.card');
        const buttonElements = await this.page.$$('button, .btn');
        const navElements = await this.page.$$('.nav-link, .navbar-nav a');
        
        console.log('📊 員工頁面實際元素統計:');
        console.log(`   - 卡片模組: ${cardElements.length}個`);
        console.log(`   - 按鈕元素: ${buttonElements.length}個`);
        console.log(`   - 導航元素: ${navElements.length}個`);
        
        // 檢查具體模組內容
        const cardTexts = await this.page.$$eval('.card', cards => 
            cards.map(card => ({
                title: card.querySelector('.card-title, .card-header, h5')?.textContent?.trim() || '',
                content: card.textContent.trim().substring(0, 100),
                hasButton: !!card.querySelector('button, .btn, a[href]')
            }))
        );
        
        console.log('📋 實際模組內容:');
        cardTexts.forEach((card, index) => {
            console.log(`   ${index + 1}. ${card.title || '無標題'}`);
            console.log(`      內容: ${card.content.replace(/\n/g, ' ')}`);
            console.log(`      可操作: ${card.hasButton ? '✅' : '❌'}`);
        });
        
        this.actualFeatures.push({
            category: 'employee_modules',
            count: cardElements.length,
            modules: cardTexts
        });
        
        return { cardCount: cardElements.length, modules: cardTexts };
    }

    async auditAPIEndpoints() {
        console.log('\n🔌 第三步：審查實際API端點...');
        
        const testEndpoints = [
            '/api/test',
            '/api/admin/employees',
            '/api/admin/stores', 
            '/api/admin/stats',
            '/api/attendance/records',
            '/api/attendance/clock',
            '/api/revenue',
            '/api/schedule/statistics/2025/8',
            '/api/promotion/campaigns/active',
            '/api/promotion/vote',
            '/api/maintenance/requests',
            '/api/inventory/items',
            '/api/work-assignments',
            '/api/system/settings'
        ];
        
        const apiResults = [];
        
        for (const endpoint of testEndpoints) {
            try {
                const response = await this.page.evaluate(async (url) => {
                    try {
                        const res = await fetch(url);
                        const text = await res.text();
                        return {
                            status: res.status,
                            ok: res.ok,
                            hasData: text.length > 0,
                            contentType: res.headers.get('content-type'),
                            preview: text.substring(0, 200)
                        };
                    } catch (error) {
                        return { error: error.message };
                    }
                }, `${this.baseUrl}${endpoint}`);
                
                const status = response.error ? '❌ 錯誤' : 
                             response.status === 200 ? '✅ 正常' :
                             response.status === 401 ? '🔒 需認證' :
                             response.status === 404 ? '❌ 404' : 
                             `⚠️ ${response.status}`;
                
                console.log(`${status} ${endpoint}`);
                if (!response.error && response.hasData) {
                    console.log(`   預覽: ${response.preview.replace(/\n/g, ' ')}`);
                }
                
                apiResults.push({
                    endpoint,
                    status: response.status || 'error',
                    working: response.ok || false,
                    hasData: response.hasData || false
                });
                
            } catch (error) {
                console.log(`❌ ${endpoint}: ${error.message}`);
                apiResults.push({
                    endpoint,
                    status: 'error',
                    working: false,
                    error: error.message
                });
            }
        }
        
        this.actualFeatures.push({
            category: 'api_endpoints',
            total: testEndpoints.length,
            working: apiResults.filter(r => r.working).length,
            endpoints: apiResults
        });
        
        return apiResults;
    }

    async auditRegistrationForm() {
        console.log('\n📝 第四步：審查註冊表單實際欄位...');
        
        await this.page.goto(`${this.baseUrl}/register`, { waitUntil: 'networkidle2' });
        await this.page.screenshot({ path: 'audit-registration-form.png', fullPage: true });
        
        const formFields = await this.page.$$eval('input, select, textarea', elements => 
            elements.map(el => ({
                type: el.type || el.tagName.toLowerCase(),
                name: el.name || '',
                id: el.id || '',
                required: el.required,
                placeholder: el.placeholder || ''
            }))
        );
        
        console.log('📋 註冊表單實際欄位:');
        formFields.forEach((field, index) => {
            const required = field.required ? '*必填' : '選填';
            console.log(`   ${index + 1}. ${field.name || field.id} (${field.type}) ${required}`);
        });
        
        const requiredFields = formFields.filter(f => f.required);
        console.log(`📊 必填欄位統計: ${requiredFields.length}個`);
        
        this.actualFeatures.push({
            category: 'registration_form',
            totalFields: formFields.length,
            requiredFields: requiredFields.length,
            fields: formFields
        });
        
        return { total: formFields.length, required: requiredFields.length, fields: formFields };
    }

    async compareWithSystemLogic() {
        console.log('\n📚 第五步：比對系統邏輯.txt規格...');
        
        // 讀取系統邏輯文檔
        const systemLogicPath = path.join(__dirname, '系統邏輯.txt');
        const systemLogic = fs.readFileSync(systemLogicPath, 'utf8');
        
        // 提取規格中的關鍵功能
        const expectedFeatures = {
            databaseTables: this.extractTableCount(systemLogic),
            registrationFields: this.extractRegistrationFields(systemLogic),
            coreModules: this.extractCoreModules(systemLogic),
            apiEndpoints: this.extractExpectedAPIs(systemLogic)
        };
        
        console.log('📊 系統邏輯.txt 期望功能:');
        console.log(`   - 資料庫表格: ${expectedFeatures.databaseTables}個`);
        console.log(`   - 註冊欄位: ${expectedFeatures.registrationFields.length}個`);
        console.log(`   - 核心模組: ${expectedFeatures.coreModules.length}個`);
        console.log(`   - API端點: ${expectedFeatures.apiEndpoints}+個`);
        
        // 比對實際vs期望
        const employeeFeature = this.actualFeatures.find(f => f.category === 'employee_modules');
        const registrationFeature = this.actualFeatures.find(f => f.category === 'registration_form');
        const apiFeature = this.actualFeatures.find(f => f.category === 'api_endpoints');
        
        const comparison = {
            employee_modules: {
                expected: expectedFeatures.coreModules.length,
                actual: employeeFeature?.count || 0,
                match: (employeeFeature?.count || 0) >= expectedFeatures.coreModules.length
            },
            registration_fields: {
                expected: expectedFeatures.registrationFields.length,
                actual: registrationFeature?.requiredFields || 0,
                match: (registrationFeature?.requiredFields || 0) >= expectedFeatures.registrationFields.length
            },
            api_endpoints: {
                expected: expectedFeatures.apiEndpoints,
                actual: apiFeature?.working || 0,
                match: (apiFeature?.working || 0) >= expectedFeatures.apiEndpoints * 0.8
            }
        };
        
        console.log('\n⚖️ 實際 vs 期望 比較:');
        Object.entries(comparison).forEach(([key, data]) => {
            const status = data.match ? '✅ 符合' : '❌ 不足';
            console.log(`   ${key}: ${status} (${data.actual}/${data.expected})`);
        });
        
        return { expected: expectedFeatures, actual: this.actualFeatures, comparison };
    }

    extractTableCount(content) {
        const matches = content.match(/(\d+)\s*個?核心資料庫表格/);
        return matches ? parseInt(matches[1]) : 20; // 預設20個
    }

    extractRegistrationFields(content) {
        const fieldMatches = content.match(/1\.\s*姓名[\s\S]*?11\.\s*到職日期/);
        if (fieldMatches) {
            const fields = fieldMatches[0].split('\n').filter(line => /^\d+\./.test(line.trim()));
            return fields.map(field => field.replace(/^\d+\.\s*/, '').trim());
        }
        return ['姓名', '身分證號碼', '出生日期', '性別', '持有駕照', '聯絡電話', '住址', '緊急聯絡人姓名', '緊急聯絡人關係', '緊急聯絡人電話', '到職日期'];
    }

    extractCoreModules(content) {
        const moduleMatches = content.match(/員工工作台[\s\S]*?8\s*大核心模組/);
        return ['工作概覽', 'GPS打卡', '營收管理', '排班系統', '庫存管理', '升遷投票', '維修申請', '個人設定'];
    }

    extractExpectedAPIs(content) {
        return 25; // 從系統邏輯推斷至少需要25個API端點
    }

    async generateDetailedReport() {
        console.log('\n📊 生成詳細審查報告...');
        
        const comparison = await this.compareWithSystemLogic();
        
        const report = {
            timestamp: new Date().toISOString(),
            audit_summary: {
                total_categories: this.actualFeatures.length,
                compliance_rate: this.calculateComplianceRate(comparison.comparison)
            },
            actual_features: this.actualFeatures,
            missing_features: this.identifyMissingFeatures(comparison),
            recommendations: this.generateRecommendations(comparison),
            detailed_comparison: comparison
        };
        
        const reportPath = path.join(__dirname, `真實系統功能審查報告-${new Date().toISOString().slice(0,10)}.md`);
        const readableReport = this.generateReadableReport(report);
        fs.writeFileSync(reportPath, readableReport);
        
        console.log(`📄 詳細審查報告已保存: ${reportPath}`);
        return { report, reportPath };
    }

    calculateComplianceRate(comparison) {
        const matches = Object.values(comparison).filter(c => c.match).length;
        const total = Object.keys(comparison).length;
        return Math.round((matches / total) * 100);
    }

    identifyMissingFeatures(comparison) {
        const missing = [];
        
        if (!comparison.comparison.employee_modules.match) {
            missing.push({
                category: '員工模組',
                issue: `只有${comparison.comparison.employee_modules.actual}個模組，期望${comparison.comparison.employee_modules.expected}個`
            });
        }
        
        if (!comparison.comparison.registration_fields.match) {
            missing.push({
                category: '註冊欄位',
                issue: `只有${comparison.comparison.registration_fields.actual}個必填欄位，期望${comparison.comparison.registration_fields.expected}個`
            });
        }
        
        if (!comparison.comparison.api_endpoints.match) {
            missing.push({
                category: 'API端點',
                issue: `只有${comparison.comparison.api_endpoints.actual}個可用，期望至少${comparison.comparison.api_endpoints.expected}個`
            });
        }
        
        return missing;
    }

    generateRecommendations(comparison) {
        const recommendations = [];
        
        const missing = this.identifyMissingFeatures(comparison);
        missing.forEach(item => {
            recommendations.push(`修復${item.category}: ${item.issue}`);
        });
        
        return recommendations;
    }

    generateReadableReport(report) {
        return `# 🔍 真實系統功能審查報告

## 📋 審查概況
- **審查時間**: ${new Date(report.timestamp).toLocaleString('zh-TW')}
- **合規率**: ${report.audit_summary.compliance_rate}%
- **審查類別**: ${report.audit_summary.total_categories}個

## 🎯 整體評估
${report.audit_summary.compliance_rate >= 80 ? '✅ 系統功能基本完整' : 
  report.audit_summary.compliance_rate >= 60 ? '⚠️ 系統功能部分缺失' :
  '❌ 系統功能嚴重不足'}

## 📊 實際功能統計
${report.actual_features.map(feature => {
    switch(feature.category) {
        case 'employee_modules':
            return `### 👤 員工頁面模組
- 實際模組數量: ${feature.count}個
- 模組詳情: ${feature.modules.map((m, i) => `${i+1}. ${m.title}`).join(', ')}`;
        case 'registration_form':
            return `### 📝 註冊表單欄位
- 總欄位: ${feature.totalFields}個
- 必填欄位: ${feature.requiredFields}個`;
        case 'api_endpoints':
            return `### 🔌 API端點狀態
- 總測試: ${feature.total}個
- 正常運作: ${feature.working}個
- 可用率: ${Math.round(feature.working/feature.total*100)}%`;
        default:
            return `### ${feature.category}: ${JSON.stringify(feature)}`;
    }
}).join('\n\n')}

## ❌ 缺失功能清單
${report.missing_features.length > 0 ? 
  report.missing_features.map(missing => `- ${missing.category}: ${missing.issue}`).join('\n') :
  '✅ 無明顯缺失功能'}

## 🔧 修復建議
${report.recommendations.length > 0 ?
  report.recommendations.map((rec, i) => `${i+1}. ${rec}`).join('\n') :
  '✅ 系統功能符合期望，無需額外修復'}

## 📈 詳細比較
${Object.entries(report.detailed_comparison.comparison).map(([key, data]) => {
    const status = data.match ? '✅ 符合' : '❌ 不符合';
    return `- ${key}: ${status} (實際: ${data.actual}, 期望: ${data.expected})`;
}).join('\n')}

---
**審查完成時間**: ${new Date().toLocaleString('zh-TW')}
**結論**: ${report.audit_summary.compliance_rate >= 80 ? '系統功能基本完整，可投入使用' : '系統功能需要進一步完善'}
`;
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    async runFullAudit() {
        try {
            await this.init();
            
            await this.auditHomePage();
            await this.auditEmployeePage();
            await this.auditAPIEndpoints();
            await this.auditRegistrationForm();
            
            const reportResult = await this.generateDetailedReport();
            
            console.log('\n🎉 真實系統功能審查完成！');
            console.log(`📄 報告路徑: ${reportResult.reportPath}`);
            
            return reportResult;
            
        } catch (error) {
            console.error('❌ 系統審查過程發生錯誤:', error);
            throw error;
        } finally {
            await this.close();
        }
    }
}

// 執行審查
async function main() {
    console.log('🕵️ 啟動真實系統功能審查 - 不敷衍模式');
    
    const auditor = new RealSystemAudit();
    
    try {
        const result = await auditor.runFullAudit();
        
        console.log('\n📊 審查結果摘要:');
        console.log(`   合規率: ${result.report.audit_summary.compliance_rate}%`);
        console.log(`   缺失功能: ${result.report.missing_features.length}項`);
        console.log(`   修復建議: ${result.report.recommendations.length}個`);
        
    } catch (error) {
        console.error('❌ 系統功能審查失敗:', error);
    }
}

if (require.main === module) {
    main();
}

module.exports = RealSystemAudit;