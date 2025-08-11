/**
 * 🔍 企業員工管理系統深度問題分析器
 * 基於用戶反饋和錯誤日誌進行全面系統診斷
 */

const puppeteer = require('puppeteer');
const https = require('https');
const fs = require('fs').promises;

class ComprehensiveSystemAnalyzer {
    constructor() {
        this.baseUrl = 'https://employee-management-system-intermediate.onrender.com';
        this.analysisResults = {
            employeePageIssues: {},
            adminPageIssues: {},
            apiEndpointIssues: {},
            missingModules: {},
            navigationIssues: {},
            authenticationIssues: {}
        };
        
        // 用戶反饋的主要問題
        this.reportedIssues = {
            employeePage: {
                isSimpleVersion: true,
                noLoginRequired: true,
                directAccess: true,
                missingModules: ['叫貨系統', '排班系統', '投票系統', '維修系統']
            },
            adminPage: {
                logoutRedirectsToAdmin: true,
                functionsNotWorking: true,
                apiErrors: [
                    'api/admin/inventory 404',
                    'api/admin/revenue 404', 
                    'api/admin/schedules 404',
                    'api/admin/promotions 404',
                    'api/admin/maintenance 404'
                ]
            },
            systemWide: {
                incompleteModules: true,
                authenticationFlow: 'broken',
                navigationFlow: 'inconsistent'
            }
        };
    }

    async analyzeEmployeePageIssues() {
        console.log('🔍 分析員工頁面問題...');
        
        const browser = await puppeteer.launch({ 
            headless: false,
            defaultViewport: null,
            args: ['--start-maximized']
        });

        try {
            const page = await browser.newPage();
            
            // 測試直接訪問員工頁面
            console.log('  📱 測試直接訪問員工頁面...');
            await page.goto(`${this.baseUrl}/employee`, { waitUntil: 'networkidle0' });
            
            const employeePageAnalysis = await page.evaluate(() => {
                return {
                    url: window.location.href,
                    title: document.title,
                    hasLoginForm: !!document.querySelector('#login-form'),
                    hasLoginCheck: !!document.querySelector('[data-login-required]'),
                    isRedirected: window.location.href.includes('/login'),
                    pageContent: document.body.innerText.length,
                    availableModules: Array.from(document.querySelectorAll('[data-module], .module-item, .system-module')).map(el => el.textContent?.trim()),
                    systemMenus: Array.from(document.querySelectorAll('.nav-item, .menu-item, .sidebar-item')).map(el => el.textContent?.trim()),
                    hasLogoutButton: !!document.querySelector('[onclick*="logout"], .logout-btn, #logout-btn'),
                    logoutButtonTarget: document.querySelector('[onclick*="logout"], .logout-btn, #logout-btn')?.getAttribute('onclick')
                };
            });
            
            this.analysisResults.employeePageIssues = {
                directAccessAllowed: !employeePageAnalysis.isRedirected,
                noAuthenticationCheck: !employeePageAnalysis.hasLoginCheck,
                contentLength: employeePageAnalysis.pageContent,
                availableModules: employeePageAnalysis.availableModules,
                systemMenus: employeePageAnalysis.systemMenus,
                logoutIssue: employeePageAnalysis.logoutButtonTarget
            };
            
            console.log(`  📱 員工頁面直接訪問: ${employeePageAnalysis.isRedirected ? '❌ 被重定向' : '✅ 允許直接訪問'}`);
            console.log(`  📱 內容長度: ${employeePageAnalysis.pageContent} 字符`);
            console.log(`  📱 可用模組: ${employeePageAnalysis.availableModules.length} 個`);
            
            // 測試登出按鈕行為
            if (employeePageAnalysis.hasLogoutButton) {
                console.log('  📱 測試登出按鈕...');
                await page.click('[onclick*="logout"], .logout-btn, #logout-btn');
                await page.waitForTimeout(3000);
                
                const afterLogout = await page.evaluate(() => ({
                    currentUrl: window.location.href,
                    isAdminPage: window.location.href.includes('/admin')
                }));
                
                this.analysisResults.employeePageIssues.logoutRedirectsToAdmin = afterLogout.isAdminPage;
                console.log(`  📱 登出後跳轉: ${afterLogout.currentUrl}`);
            }
            
        } catch (error) {
            console.error('❌ 員工頁面分析失敗:', error.message);
            this.analysisResults.employeePageIssues.error = error.message;
        } finally {
            await browser.close();
        }
    }

    async analyzeAdminPageIssues() {
        console.log('🔍 分析管理員頁面API問題...');
        
        // 測試所有失敗的API端點
        const failedEndpoints = [
            '/api/admin/inventory?category=&status=',
            '/api/admin/revenue?startDate=&endDate=&storeId=',
            '/api/admin/schedules?date=&storeId=',
            '/api/admin/promotions?status=',
            '/api/admin/maintenance?status=&priority='
        ];
        
        for (const endpoint of failedEndpoints) {
            try {
                console.log(`  🔌 測試 ${endpoint}...`);
                const response = await this.makeHttpRequest(`${this.baseUrl}${endpoint}`);
                
                this.analysisResults.apiEndpointIssues[endpoint] = {
                    status: response.statusCode,
                    exists: response.statusCode !== 404,
                    data: response.data,
                    error: response.statusCode === 404 ? 'API端點不存在' : null
                };
                
                console.log(`    ${response.statusCode === 404 ? '❌' : '✅'} ${endpoint}: ${response.statusCode}`);
                
            } catch (error) {
                this.analysisResults.apiEndpointIssues[endpoint] = {
                    status: 'error',
                    error: error.message,
                    exists: false
                };
                console.log(`    ❌ ${endpoint}: ${error.message}`);
            }
        }
    }

    async makeHttpRequest(url, options = {}) {
        return new Promise((resolve, reject) => {
            const parsedUrl = new URL(url);
            const requestOptions = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port || 443,
                path: parsedUrl.pathname + parsedUrl.search,
                method: options.method || 'GET',
                headers: options.headers || {}
            };

            const req = https.request(requestOptions, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        const parsed = res.headers['content-type']?.includes('application/json') 
                            ? JSON.parse(data) : data;
                        resolve({
                            statusCode: res.statusCode,
                            headers: res.headers,
                            data: parsed
                        });
                    } catch (error) {
                        resolve({
                            statusCode: res.statusCode,
                            headers: res.headers,
                            data: data
                        });
                    }
                });
            });

            req.on('error', (error) => reject(error));
            req.end();
        });
    }

    async analyzeMissingModules() {
        console.log('🔍 分析缺失的系統模組...');
        
        const expectedModules = [
            { name: '叫貨系統', apiEndpoint: '/api/inventory', features: ['庫存管理', '進貨申請', '供應商管理'] },
            { name: '排班系統', apiEndpoint: '/api/schedules', features: ['班表安排', '換班申請', '休假管理'] },
            { name: '投票系統', apiEndpoint: '/api/promotions', features: ['升遷投票', '意見調查', '民主決策'] },
            { name: '維修系統', apiEndpoint: '/api/maintenance', features: ['設備報修', '維修追蹤', '保養計劃'] },
            { name: '店鋪管理', apiEndpoint: '/api/stores', features: ['多店面管理', '分店資訊', '轉店機制'] }
        ];
        
        for (const module of expectedModules) {
            try {
                const response = await this.makeHttpRequest(`${this.baseUrl}${module.apiEndpoint}`);
                
                this.analysisResults.missingModules[module.name] = {
                    apiExists: response.statusCode !== 404,
                    status: response.statusCode,
                    features: module.features,
                    implemented: response.statusCode === 200,
                    needsImplementation: response.statusCode === 404
                };
                
                console.log(`  🔧 ${module.name}: ${response.statusCode === 404 ? '❌ 未實現' : '✅ 已實現'}`);
                
            } catch (error) {
                this.analysisResults.missingModules[module.name] = {
                    apiExists: false,
                    error: error.message,
                    features: module.features,
                    needsImplementation: true
                };
                console.log(`  ❌ ${module.name}: ${error.message}`);
            }
        }
    }

    async analyzeAuthenticationFlow() {
        console.log('🔍 分析認證流程問題...');
        
        const authFlowTests = [
            { path: '/employee', shouldRedirect: true, description: '員工頁面認證檢查' },
            { path: '/admin', shouldRedirect: true, description: '管理員頁面認證檢查' },
            { path: '/login', shouldRedirect: false, description: '登入頁面訪問' }
        ];
        
        for (const test of authFlowTests) {
            try {
                const response = await this.makeHttpRequest(`${this.baseUrl}${test.path}`);
                
                // 檢查是否有重定向或認證檢查
                const hasAuth = response.statusCode === 302 || response.statusCode === 401 || 
                               response.headers.location?.includes('/login');
                
                this.analysisResults.authenticationIssues[test.path] = {
                    status: response.statusCode,
                    hasAuthCheck: hasAuth,
                    shouldHaveAuth: test.shouldRedirect,
                    isWorking: hasAuth === test.shouldRedirect,
                    description: test.description
                };
                
                console.log(`  🔐 ${test.description}: ${hasAuth === test.shouldRedirect ? '✅ 正常' : '❌ 異常'}`);
                
            } catch (error) {
                this.analysisResults.authenticationIssues[test.path] = {
                    error: error.message,
                    isWorking: false
                };
                console.log(`  ❌ ${test.description}: ${error.message}`);
            }
        }
    }

    async generateComprehensiveAnalysisReport() {
        console.log('📊 生成綜合分析報告...');
        
        const currentTime = new Date().toLocaleString('zh-TW');
        
        // 計算問題嚴重程度
        const criticalIssues = [];
        const majorIssues = [];
        const minorIssues = [];
        
        // 員工頁面問題分析
        if (this.analysisResults.employeePageIssues.directAccessAllowed) {
            criticalIssues.push('員工頁面跳過登入驗證');
        }
        if (this.analysisResults.employeePageIssues.logoutRedirectsToAdmin) {
            majorIssues.push('登出按鈕錯誤跳轉到管理員頁面');
        }
        
        // API端點問題分析
        Object.entries(this.analysisResults.apiEndpointIssues).forEach(([endpoint, result]) => {
            if (!result.exists) {
                criticalIssues.push(`API端點不存在: ${endpoint}`);
            }
        });
        
        // 缺失模組分析
        Object.entries(this.analysisResults.missingModules).forEach(([module, result]) => {
            if (result.needsImplementation) {
                majorIssues.push(`缺失系統模組: ${module}`);
            }
        });
        
        const totalIssues = criticalIssues.length + majorIssues.length + minorIssues.length;
        
        const analysisReport = `# 🔍 企業員工管理系統深度問題分析報告

## 📊 分析總結
- **分析時間**: ${currentTime}
- **發現問題總數**: ${totalIssues}個
- **嚴重問題**: ${criticalIssues.length}個 🔴
- **主要問題**: ${majorIssues.length}個 🟡
- **次要問題**: ${minorIssues.length}個 🟢
- **系統狀態**: ${totalIssues > 10 ? '🚨 需要緊急修復' : totalIssues > 5 ? '⚠️ 需要重大改進' : '✅ 基本正常'}

## 🔴 嚴重問題 (Critical Issues)

### 1. 員工頁面認證繞過問題
- **問題描述**: 員工頁面可以直接訪問，沒有登入驗證
- **影響**: 任何人都可以訪問員工功能，存在嚴重安全隱患
- **直接訪問允許**: ${this.analysisResults.employeePageIssues.directAccessAllowed ? '❌ 是' : '✅ 否'}
- **認證檢查**: ${this.analysisResults.employeePageIssues.noAuthenticationCheck ? '❌ 缺失' : '✅ 存在'}

### 2. API端點大量缺失
${Object.entries(this.analysisResults.apiEndpointIssues).map(([endpoint, result]) => 
`- **${endpoint}**: ${result.exists ? '✅ 存在' : '❌ 缺失'} (HTTP ${result.status})`
).join('\n')}

**API可用率**: ${Object.keys(this.analysisResults.apiEndpointIssues).length > 0 ? 
    (Object.values(this.analysisResults.apiEndpointIssues).filter(r => r.exists).length / 
     Object.keys(this.analysisResults.apiEndpointIssues).length * 100).toFixed(1) : 0}%

## 🟡 主要問題 (Major Issues)

### 1. 系統模組功能缺失
${Object.entries(this.analysisResults.missingModules).map(([module, result]) => 
`#### ${module}
- **API狀態**: ${result.apiExists ? '✅ 存在' : '❌ 缺失'}
- **實現狀態**: ${result.implemented ? '✅ 已實現' : '❌ 未實現'}
- **需要功能**: ${result.features.join(', ')}
`).join('\n')}

### 2. 導航和用戶流程問題
- **員工頁面內容長度**: ${this.analysisResults.employeePageIssues.contentLength || 0} 字符
- **可用系統模組**: ${this.analysisResults.employeePageIssues.availableModules?.length || 0} 個
- **系統選單項目**: ${this.analysisResults.employeePageIssues.systemMenus?.length || 0} 個
- **登出跳轉問題**: ${this.analysisResults.employeePageIssues.logoutRedirectsToAdmin ? '❌ 跳轉到管理員頁面' : '✅ 正常'}

## 🔧 認證流程分析

### 頁面訪問控制檢查
${Object.entries(this.analysisResults.authenticationIssues).map(([path, result]) => 
`- **${path}**: ${result.isWorking ? '✅ 正常' : '❌ 異常'} - ${result.description}`
).join('\n')}

## 📱 員工頁面詳細分析

### 當前狀態評估
- **頁面版本**: ${this.analysisResults.employeePageIssues.contentLength < 1000 ? '簡易版本' : '完整版本'}
- **功能完整度**: ${((this.analysisResults.employeePageIssues.availableModules?.length || 0) / 8 * 100).toFixed(1)}% 
  (${this.analysisResults.employeePageIssues.availableModules?.length || 0}/8 個預期模組)
- **安全性**: ${this.analysisResults.employeePageIssues.directAccessAllowed ? '🔴 嚴重不足' : '✅ 正常'}

### 缺失的核心功能
${this.reportedIssues.employeePage.missingModules.map(module => `- ❌ ${module}`).join('\n')}

## 👑 管理員頁面詳細分析

### API端點狀態統計
- **總測試端點**: ${Object.keys(this.analysisResults.apiEndpointIssues).length} 個
- **可用端點**: ${Object.values(this.analysisResults.apiEndpointIssues).filter(r => r.exists).length} 個
- **缺失端點**: ${Object.values(this.analysisResults.apiEndpointIssues).filter(r => !r.exists).length} 個
- **404錯誤率**: ${Object.keys(this.analysisResults.apiEndpointIssues).length > 0 ? 
    (Object.values(this.analysisResults.apiEndpointIssues).filter(r => !r.exists).length / 
     Object.keys(this.analysisResults.apiEndpointIssues).length * 100).toFixed(1) : 0}%

### 功能模組實現狀態
${Object.entries(this.analysisResults.missingModules).map(([module, result]) => 
`- **${module}**: ${result.implemented ? '✅ 已實現' : '❌ 未實現'}`
).join('\n')}

## 💡 問題根本原因分析

### 1. 架構設計問題
- **前後端分離不完整**: API端點大量缺失導致前端功能無法正常工作
- **認證機制不一致**: 不同頁面的登入檢查機制不統一
- **模組化開發不完整**: 核心業務模組未完全實現

### 2. 開發優先級問題
- **基礎功能優先**: 只實現了基本的登入和部分管理功能
- **業務模組後置**: 叫貨、排班、投票、維修等核心業務功能未實現
- **用戶體驗忽視**: 導航流程和頁面跳轉邏輯存在問題

### 3. 測試覆蓋不足
- **端到端測試缺失**: 用戶完整流程測試不充分
- **API測試不完整**: 未發現大量404錯誤
- **角色權限測試不足**: 認證流程問題未及時發現

## 🎯 修復優先級建議

### 🔥 緊急修復 (Critical - 1-2天)
1. **修復員工頁面認證繞過問題**
2. **實現缺失的核心API端點**
3. **修復登出跳轉邏輯**

### ⚡ 重要修復 (High - 3-5天)  
1. **實現缺失的業務模組**
2. **完善用戶導航流程**
3. **統一認證機制**

### 🔧 一般修復 (Medium - 1-2週)
1. **優化用戶介面體驗**
2. **增加功能測試覆蓋**
3. **完善錯誤處理機制**

## 📋 下一步行動計劃

### 階段一: 緊急修復 (Critical Issues)
1. 添加員工頁面登入驗證中間件
2. 實現所有404 API端點的基本功能
3. 修復導航和登出邏輯

### 階段二: 功能完善 (Major Issues)  
1. 開發完整的叫貨系統
2. 實現排班管理功能
3. 添加投票和維修系統

### 階段三: 體驗優化 (Minor Issues)
1. 優化頁面載入性能
2. 完善錯誤提示和用戶反饋
3. 增加系統穩定性測試

---
*系統問題分析報告生成時間: ${currentTime}*
*🔍 深度分析完成 - 發現${totalIssues}個需要修復的問題*`;

        const timestamp = Date.now();
        const reportFile = `comprehensive-system-analysis-${timestamp}.md`;
        await fs.writeFile(reportFile, analysisReport);
        
        console.log(`📁 綜合分析報告已保存: ${reportFile}`);
        console.log(`🔍 發現問題總數: ${totalIssues}個`);
        console.log(`🔴 嚴重問題: ${criticalIssues.length}個`);
        console.log(`🟡 主要問題: ${majorIssues.length}個`);
        
        return {
            totalIssues,
            criticalIssues: criticalIssues.length,
            majorIssues: majorIssues.length,
            reportFile,
            analysisResults: this.analysisResults
        };
    }

    async run() {
        console.log('🚀 啟動企業員工管理系統綜合問題分析...');
        console.log(`🌐 分析目標: ${this.baseUrl}`);
        
        try {
            // 1. 分析員工頁面問題
            await this.analyzeEmployeePageIssues();
            
            // 2. 分析管理員頁面API問題
            await this.analyzeAdminPageIssues();
            
            // 3. 分析缺失的系統模組
            await this.analyzeMissingModules();
            
            // 4. 分析認證流程問題
            await this.analyzeAuthenticationFlow();
            
            // 5. 生成綜合分析報告
            const analysisResult = await this.generateComprehensiveAnalysisReport();
            
            console.log('\n🎯 ========== 系統問題分析完成 ==========');
            console.log(`📊 問題總數: ${analysisResult.totalIssues}個`);
            console.log(`🔴 嚴重問題: ${analysisResult.criticalIssues}個`);
            console.log(`🟡 主要問題: ${analysisResult.majorIssues}個`);
            console.log(`📁 詳細報告: ${analysisResult.reportFile}`);
            console.log('🔍 深度分析任務完成！');
            
            return analysisResult;
            
        } catch (error) {
            console.error('❌ 系統分析執行錯誤:', error.message);
            throw error;
        }
    }
}

// 執行綜合系統分析
if (require.main === module) {
    const analyzer = new ComprehensiveSystemAnalyzer();
    analyzer.run().catch(console.error);
}

module.exports = ComprehensiveSystemAnalyzer;