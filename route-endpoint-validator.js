/**
 * ===========================
 * 路由端點驗證測試器
 * ===========================
 * 功能：
 * 1. 自動測試所有API端點
 * 2. 驗證HTTP方法支援
 * 3. 檢查回應格式
 * 4. 生成測試報告
 * 5. 模擬各種請求情境
 */

const http = require('http');
const https = require('https');
const fs = require('fs').promises;
const path = require('path');

class RouteEndpointValidator {
    constructor(options = {}) {
        this.baseUrl = options.baseUrl || 'http://localhost:3000';
        this.timeout = options.timeout || 10000;
        this.maxRetries = options.maxRetries || 3;
        this.testResults = {
            timestamp: new Date().toISOString(),
            baseUrl: this.baseUrl,
            endpoints: [],
            summary: {},
            issues: [],
            warnings: []
        };
        
        // 預定義的API端點配置
        this.endpointConfig = {
            '/api/auth': {
                methods: ['POST'],
                endpoints: [
                    { path: '/login', method: 'POST', auth: false },
                    { path: '/register', method: 'POST', auth: false },
                    { path: '/logout', method: 'POST', auth: true },
                    { path: '/verify', method: 'GET', auth: true }
                ]
            },
            '/api/attendance': {
                methods: ['GET', 'POST', 'PUT', 'DELETE'],
                endpoints: [
                    { path: '/', method: 'GET', auth: true },
                    { path: '/', method: 'POST', auth: true },
                    { path: '/checkin', method: 'POST', auth: true },
                    { path: '/checkout', method: 'POST', auth: true },
                    { path: '/records', method: 'GET', auth: true },
                    { path: '/:id', method: 'GET', auth: true },
                    { path: '/:id', method: 'PUT', auth: true },
                    { path: '/:id', method: 'DELETE', auth: true }
                ]
            },
            '/api/employees': {
                methods: ['GET', 'POST', 'PUT', 'DELETE'],
                endpoints: [
                    { path: '/', method: 'GET', auth: true },
                    { path: '/', method: 'POST', auth: true },
                    { path: '/:id', method: 'GET', auth: true },
                    { path: '/:id', method: 'PUT', auth: true },
                    { path: '/:id', method: 'DELETE', auth: true }
                ]
            },
            '/api/revenue': {
                methods: ['GET', 'POST', 'PUT', 'DELETE'],
                endpoints: [
                    { path: '/', method: 'GET', auth: true },
                    { path: '/', method: 'POST', auth: true },
                    { path: '/reports', method: 'GET', auth: true },
                    { path: '/:id', method: 'GET', auth: true },
                    { path: '/:id', method: 'PUT', auth: true },
                    { path: '/:id', method: 'DELETE', auth: true }
                ]
            },
            '/api/admin': {
                methods: ['GET', 'POST', 'PUT', 'DELETE'],
                endpoints: [
                    { path: '/', method: 'GET', auth: true },
                    { path: '/users', method: 'GET', auth: true },
                    { path: '/settings', method: 'GET', auth: true },
                    { path: '/settings', method: 'PUT', auth: true },
                    { path: '/system', method: 'GET', auth: true }
                ]
            },
            '/api/schedule': {
                methods: ['GET', 'POST', 'PUT', 'DELETE'],
                endpoints: [
                    { path: '/', method: 'GET', auth: true },
                    { path: '/', method: 'POST', auth: true },
                    { path: '/:id', method: 'GET', auth: true },
                    { path: '/:id', method: 'PUT', auth: true },
                    { path: '/:id', method: 'DELETE', auth: true }
                ]
            },
            '/api/monitoring': {
                methods: ['GET'],
                endpoints: [
                    { path: '/', method: 'GET', auth: false },
                    { path: '/health', method: 'GET', auth: false },
                    { path: '/status', method: 'GET', auth: true },
                    { path: '/metrics', method: 'GET', auth: true }
                ]
            },
            '/api/maintenance': {
                methods: ['GET', 'POST'],
                endpoints: [
                    { path: '/', method: 'GET', auth: true },
                    { path: '/backup', method: 'POST', auth: true },
                    { path: '/cleanup', method: 'POST', auth: true }
                ]
            }
        };
    }

    /**
     * 執行完整的端點驗證測試
     */
    async runCompleteValidation() {
        console.log('🔍 開始路由端點驗證測試...');
        console.log('======================================');
        console.log(`測試目標: ${this.baseUrl}`);
        console.log(`請求超時: ${this.timeout}ms`);
        console.log('');

        try {
            // 階段 1: 檢查伺服器可用性
            await this.checkServerAvailability();
            
            // 階段 2: 測試所有端點
            await this.testAllEndpoints();
            
            // 階段 3: 測試認證機制
            await this.testAuthenticationMechanism();
            
            // 階段 4: 測試錯誤處理
            await this.testErrorHandling();
            
            // 階段 5: 測試回應格式
            await this.validateResponseFormats();
            
            // 階段 6: 生成總結報告
            await this.generateValidationSummary();
            
            // 階段 7: 保存測試報告
            await this.saveValidationReport();
            
            return this.testResults;
            
        } catch (error) {
            console.error('❌ 驗證過程中發生錯誤:', error.message);
            this.testResults.issues.push({
                type: 'VALIDATION_ERROR',
                severity: 'CRITICAL',
                message: `驗證過程發生錯誤: ${error.message}`,
                timestamp: new Date().toISOString()
            });
            return this.testResults;
        }
    }

    /**
     * 檢查伺服器可用性
     */
    async checkServerAvailability() {
        console.log('🌐 檢查伺服器可用性...');
        
        try {
            const response = await this.makeRequest('GET', '/');
            
            if (response.statusCode && response.statusCode < 500) {
                console.log('✅ 伺服器可用');
                this.testResults.serverAvailable = true;
            } else {
                console.log('❌ 伺服器不可用');
                this.testResults.serverAvailable = false;
                this.testResults.issues.push({
                    type: 'SERVER_UNAVAILABLE',
                    severity: 'CRITICAL',
                    message: `伺服器不可用，狀態碼: ${response.statusCode}`,
                    timestamp: new Date().toISOString()
                });
            }
        } catch (error) {
            console.log('❌ 無法連接到伺服器');
            this.testResults.serverAvailable = false;
            this.testResults.issues.push({
                type: 'SERVER_CONNECTION_ERROR',
                severity: 'CRITICAL',
                message: `無法連接到伺服器: ${error.message}`,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * 測試所有端點
     */
    async testAllEndpoints() {
        console.log('🎯 測試所有API端點...');
        
        let testCount = 0;
        let passedCount = 0;
        
        for (const [basePath, config] of Object.entries(this.endpointConfig)) {
            console.log(`\n📋 測試 ${basePath} 路由群組:`);
            
            for (const endpoint of config.endpoints) {
                testCount++;
                const fullPath = basePath + endpoint.path.replace('/:id', '/1'); // 使用測試ID
                
                console.log(`  🔍 ${endpoint.method} ${fullPath}`);
                
                try {
                    const response = await this.makeRequest(endpoint.method, fullPath, {
                        headers: endpoint.auth ? this.getAuthHeaders() : {}
                    });
                    
                    const testResult = {
                        endpoint: fullPath,
                        method: endpoint.method,
                        expectedAuth: endpoint.auth,
                        statusCode: response.statusCode,
                        responseTime: response.responseTime,
                        success: this.isSuccessfulResponse(response.statusCode, endpoint.auth),
                        error: response.error,
                        timestamp: new Date().toISOString()
                    };
                    
                    this.testResults.endpoints.push(testResult);
                    
                    if (testResult.success) {
                        console.log(`    ✅ 通過 (${response.statusCode}) - ${response.responseTime}ms`);
                        passedCount++;
                    } else {
                        console.log(`    ❌ 失敗 (${response.statusCode}) - ${response.error || '未知錯誤'}`);
                        
                        if (response.statusCode === 404) {
                            this.testResults.issues.push({
                                type: 'ENDPOINT_404',
                                severity: 'HIGH',
                                message: `端點返回404: ${endpoint.method} ${fullPath}`,
                                endpoint: fullPath,
                                method: endpoint.method,
                                timestamp: new Date().toISOString()
                            });
                        }
                    }
                    
                } catch (error) {
                    console.log(`    ❌ 錯誤: ${error.message}`);
                    
                    this.testResults.endpoints.push({
                        endpoint: fullPath,
                        method: endpoint.method,
                        expectedAuth: endpoint.auth,
                        success: false,
                        error: error.message,
                        timestamp: new Date().toISOString()
                    });
                    
                    this.testResults.issues.push({
                        type: 'ENDPOINT_ERROR',
                        severity: 'HIGH',
                        message: `端點測試錯誤: ${endpoint.method} ${fullPath} - ${error.message}`,
                        endpoint: fullPath,
                        method: endpoint.method,
                        timestamp: new Date().toISOString()
                    });
                }
                
                // 添加小延遲避免壓垮伺服器
                await this.sleep(100);
            }
        }
        
        console.log(`\n📊 端點測試完成: ${passedCount}/${testCount} 通過`);
    }

    /**
     * 測試認證機制
     */
    async testAuthenticationMechanism() {
        console.log('\n🔐 測試認證機制...');
        
        // 測試不帶token訪問需要認證的端點
        console.log('  🔍 測試未認證訪問...');
        try {
            const response = await this.makeRequest('GET', '/api/attendance');
            
            if (response.statusCode === 401 || response.statusCode === 403) {
                console.log('    ✅ 認證機制正常工作');
                this.testResults.authMechanismWorking = true;
            } else {
                console.log('    ❌ 認證機制可能有問題');
                this.testResults.authMechanismWorking = false;
                this.testResults.warnings.push({
                    type: 'AUTH_MECHANISM_ISSUE',
                    severity: 'HIGH',
                    message: `認證機制可能失效，期望401/403但得到${response.statusCode}`,
                    timestamp: new Date().toISOString()
                });
            }
        } catch (error) {
            console.log('    ⚠️  無法測試認證機制:', error.message);
        }
        
        // 測試登入端點
        console.log('  🔍 測試登入端點...');
        try {
            const loginResponse = await this.makeRequest('POST', '/api/auth/login', {
                body: JSON.stringify({
                    username: 'testuser',
                    password: 'testpass'
                }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (loginResponse.statusCode === 200 || loginResponse.statusCode === 400) {
                console.log('    ✅ 登入端點響應正常');
            } else if (loginResponse.statusCode === 404) {
                console.log('    ❌ 登入端點不存在 (404)');
                this.testResults.issues.push({
                    type: 'LOGIN_ENDPOINT_404',
                    severity: 'CRITICAL',
                    message: '登入端點返回404，這是關鍵問題',
                    timestamp: new Date().toISOString()
                });
            }
        } catch (error) {
            console.log('    ❌ 登入端點測試錯誤:', error.message);
        }
    }

    /**
     * 測試錯誤處理
     */
    async testErrorHandling() {
        console.log('\n🛡️  測試錯誤處理...');
        
        const errorTestCases = [
            { path: '/api/nonexistent', expectedStatus: 404, description: '不存在的端點' },
            { path: '/api/attendance/invalid-id', expectedStatus: 400, description: '無效ID' },
            { path: '/api/auth/login', method: 'POST', body: 'invalid-json', expectedStatus: 400, description: '無效JSON' }
        ];
        
        for (const testCase of errorTestCases) {
            console.log(`  🔍 測試 ${testCase.description}...`);
            
            try {
                const response = await this.makeRequest(
                    testCase.method || 'GET', 
                    testCase.path,
                    testCase.body ? { 
                        body: testCase.body,
                        headers: { 'Content-Type': 'application/json' }
                    } : {}
                );
                
                if (response.statusCode === testCase.expectedStatus) {
                    console.log(`    ✅ 正確返回 ${response.statusCode}`);
                } else {
                    console.log(`    ⚠️  期望 ${testCase.expectedStatus} 但得到 ${response.statusCode}`);
                    this.testResults.warnings.push({
                        type: 'UNEXPECTED_ERROR_STATUS',
                        severity: 'MEDIUM',
                        message: `${testCase.description}: 期望${testCase.expectedStatus}但得到${response.statusCode}`,
                        timestamp: new Date().toISOString()
                    });
                }
            } catch (error) {
                console.log(`    ❌ 測試錯誤: ${error.message}`);
            }
        }
    }

    /**
     * 驗證回應格式
     */
    async validateResponseFormats() {
        console.log('\n📋 驗證回應格式...');
        
        // 測試幾個關鍵端點的回應格式
        const formatTestCases = [
            { path: '/api/monitoring/health', description: '健康檢查端點' },
            { path: '/api/auth/login', method: 'POST', description: '登入端點' }
        ];
        
        for (const testCase of formatTestCases) {
            console.log(`  🔍 檢查 ${testCase.description} 回應格式...`);
            
            try {
                const response = await this.makeRequest(
                    testCase.method || 'GET',
                    testCase.path,
                    testCase.method === 'POST' ? {
                        body: JSON.stringify({ username: 'test', password: 'test' }),
                        headers: { 'Content-Type': 'application/json' }
                    } : {}
                );
                
                if (response.body) {
                    try {
                        const data = JSON.parse(response.body);
                        if (data && (data.success !== undefined || data.error !== undefined || data.status !== undefined)) {
                            console.log('    ✅ 回應格式符合標準');
                        } else {
                            console.log('    ⚠️  回應格式可能不標準');
                            this.testResults.warnings.push({
                                type: 'NON_STANDARD_RESPONSE_FORMAT',
                                severity: 'LOW',
                                message: `${testCase.description}的回應格式可能不標準`,
                                timestamp: new Date().toISOString()
                            });
                        }
                    } catch (parseError) {
                        console.log('    ⚠️  回應不是有效的JSON');
                    }
                } else {
                    console.log('    ⚠️  沒有回應內容');
                }
            } catch (error) {
                console.log(`    ❌ 格式驗證錯誤: ${error.message}`);
            }
        }
    }

    /**
     * 生成驗證總結
     */
    async generateValidationSummary() {
        console.log('\n📊 生成驗證總結...');
        
        const totalEndpoints = this.testResults.endpoints.length;
        const successfulEndpoints = this.testResults.endpoints.filter(ep => ep.success).length;
        const failedEndpoints = totalEndpoints - successfulEndpoints;
        const averageResponseTime = this.calculateAverageResponseTime();
        
        // 按狀態碼統計
        const statusCodeStats = this.testResults.endpoints.reduce((acc, ep) => {
            const code = ep.statusCode || 'ERROR';
            acc[code] = (acc[code] || 0) + 1;
            return acc;
        }, {});
        
        // 按問題類型統計
        const issueStats = this.testResults.issues.reduce((acc, issue) => {
            acc[issue.type] = (acc[issue.type] || 0) + 1;
            return acc;
        }, {});
        
        this.testResults.summary = {
            totalEndpoints,
            successfulEndpoints,
            failedEndpoints,
            successRate: totalEndpoints > 0 ? (successfulEndpoints / totalEndpoints * 100).toFixed(2) : 0,
            averageResponseTime,
            statusCodeStats,
            issueStats,
            totalIssues: this.testResults.issues.length,
            totalWarnings: this.testResults.warnings.length,
            serverAvailable: this.testResults.serverAvailable,
            authMechanismWorking: this.testResults.authMechanismWorking,
            recommendations: this.generateRecommendations()
        };
        
        console.log(`✅ 總結完成:`);
        console.log(`   - 總端點數: ${totalEndpoints}`);
        console.log(`   - 成功數: ${successfulEndpoints}`);
        console.log(`   - 失敗數: ${failedEndpoints}`);
        console.log(`   - 成功率: ${this.testResults.summary.successRate}%`);
        console.log(`   - 平均回應時間: ${averageResponseTime}ms`);
        console.log(`   - 問題數: ${this.testResults.issues.length}`);
        console.log(`   - 警告數: ${this.testResults.warnings.length}`);
    }

    /**
     * 計算平均回應時間
     */
    calculateAverageResponseTime() {
        const responseTimes = this.testResults.endpoints
            .filter(ep => ep.responseTime)
            .map(ep => ep.responseTime);
        
        if (responseTimes.length === 0) return 0;
        
        const sum = responseTimes.reduce((acc, time) => acc + time, 0);
        return Math.round(sum / responseTimes.length);
    }

    /**
     * 生成建議
     */
    generateRecommendations() {
        const recommendations = [];
        
        // 基於問題生成建議
        const issueTypes = [...new Set(this.testResults.issues.map(issue => issue.type))];
        
        if (issueTypes.includes('ENDPOINT_404')) {
            recommendations.push('修復返回404的API端點 - 這是路由配置問題');
            recommendations.push('檢查server.js中的路由註冊是否正確');
            recommendations.push('驗證所有路由文件是否正確導出router對象');
        }
        
        if (issueTypes.includes('SERVER_UNAVAILABLE')) {
            recommendations.push('確保伺服器正在運行並監聽正確的端口');
            recommendations.push('檢查伺服器啟動腳本和配置');
        }
        
        if (issueTypes.includes('AUTH_MECHANISM_ISSUE')) {
            recommendations.push('檢查認證中間件配置');
            recommendations.push('驗證JWT token處理邏輯');
        }
        
        if (!this.testResults.serverAvailable) {
            recommendations.push('啟動伺服器後重新運行此測試');
        }
        
        if (this.testResults.summary.successRate < 50) {
            recommendations.push('建議先運行智慧路由修復工具');
            recommendations.push('檢查所有路由文件的語法和結構');
        }
        
        // 一般建議
        recommendations.push('執行完整的瀏覽器驗證測試');
        recommendations.push('檢查API文檔與實際實現的一致性');
        
        return [...new Set(recommendations)];
    }

    /**
     * 保存驗證報告
     */
    async saveValidationReport() {
        console.log('\n💾 保存驗證報告...');
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportPath = path.join(__dirname, `route-validation-report-${timestamp}.json`);
        const summaryPath = path.join(__dirname, `route-validation-summary-${timestamp}.md`);
        
        try {
            // 保存JSON報告
            await fs.writeFile(reportPath, JSON.stringify(this.testResults, null, 2), 'utf8');
            
            // 生成Markdown總結
            const markdownSummary = this.generateMarkdownSummary();
            await fs.writeFile(summaryPath, markdownSummary, 'utf8');
            
            console.log(`✅ 報告已保存:`);
            console.log(`   - 詳細報告: ${reportPath}`);
            console.log(`   - 總結報告: ${summaryPath}`);
            
        } catch (error) {
            console.error(`❌ 保存報告失敗: ${error.message}`);
        }
    }

    /**
     * 生成Markdown總結
     */
    generateMarkdownSummary() {
        const { summary } = this.testResults;
        
        return `# 路由端點驗證報告

## 📊 測試總結

- **測試目標**: ${this.testResults.baseUrl}
- **總端點數**: ${summary.totalEndpoints}
- **成功數**: ${summary.successfulEndpoints}
- **失敗數**: ${summary.failedEndpoints}
- **成功率**: ${summary.successRate}%
- **平均回應時間**: ${summary.averageResponseTime}ms
- **伺服器可用**: ${summary.serverAvailable ? '✅' : '❌'}
- **認證機制**: ${summary.authMechanismWorking ? '✅' : '❌'}

## 📈 狀態碼分布

${Object.entries(summary.statusCodeStats).map(([code, count]) => 
    `- **${code}**: ${count} 個`
).join('\n')}

## ❌ 主要問題

${this.testResults.issues.slice(0, 10).map((issue, index) => 
    `### ${index + 1}. ${issue.type} (${issue.severity})
- **描述**: ${issue.message}
- **端點**: ${issue.endpoint || 'N/A'}
- **方法**: ${issue.method || 'N/A'}
- **時間**: ${issue.timestamp}
`).join('\n')}

## ⚠️ 警告

${this.testResults.warnings.slice(0, 5).map((warning, index) => 
    `### ${index + 1}. ${warning.type}
- **描述**: ${warning.message}
- **時間**: ${warning.timestamp}
`).join('\n')}

## 🎯 端點測試詳情

### 成功的端點
${this.testResults.endpoints.filter(ep => ep.success).slice(0, 10).map(ep => 
    `- ✅ **${ep.method}** ${ep.endpoint} (${ep.statusCode}) - ${ep.responseTime}ms`
).join('\n')}

### 失敗的端點  
${this.testResults.endpoints.filter(ep => !ep.success).slice(0, 10).map(ep => 
    `- ❌ **${ep.method}** ${ep.endpoint} (${ep.statusCode || 'ERROR'}) - ${ep.error || '未知錯誤'}`
).join('\n')}

## 💡 修復建議

${summary.recommendations.map((rec, index) => 
    `${index + 1}. ${rec}`
).join('\n')}

## 📋 下一步行動

1. **立即修復**: 處理所有404錯誤的端點
2. **檢查配置**: 驗證server.js路由註冊
3. **測試認證**: 確保認證機制正常工作  
4. **瀏覽器測試**: 進行完整的前端集成測試
5. **性能優化**: 關注回應時間較長的端點

---
*測試完成時間: ${this.testResults.timestamp}*
`;
    }

    /**
     * 發送HTTP請求
     */
    makeRequest(method, path, options = {}) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const url = new URL(path, this.baseUrl);
            const isHttps = url.protocol === 'https:';
            const lib = isHttps ? https : http;
            
            const requestOptions = {
                hostname: url.hostname,
                port: url.port || (isHttps ? 443 : 80),
                path: url.pathname + url.search,
                method: method,
                timeout: this.timeout,
                headers: {
                    'User-Agent': 'RouteEndpointValidator/1.0',
                    ...options.headers
                }
            };
            
            const req = lib.request(requestOptions, (res) => {
                let body = '';
                
                res.on('data', (chunk) => {
                    body += chunk;
                });
                
                res.on('end', () => {
                    const responseTime = Date.now() - startTime;
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: body,
                        responseTime: responseTime
                    });
                });
            });
            
            req.on('error', (error) => {
                const responseTime = Date.now() - startTime;
                resolve({
                    statusCode: null,
                    error: error.message,
                    responseTime: responseTime
                });
            });
            
            req.on('timeout', () => {
                req.destroy();
                const responseTime = Date.now() - startTime;
                resolve({
                    statusCode: null,
                    error: 'Request timeout',
                    responseTime: responseTime
                });
            });
            
            if (options.body) {
                req.write(options.body);
            }
            
            req.end();
        });
    }

    /**
     * 判斷回應是否成功
     */
    isSuccessfulResponse(statusCode, requiresAuth) {
        if (!statusCode) return false;
        
        // 如果需要認證但沒有提供，401/403是預期的
        if (requiresAuth && (statusCode === 401 || statusCode === 403)) {
            return true;
        }
        
        // 2xx和3xx狀態碼通常是成功的
        // 對於某些端點，400也可能是正常的（如驗證失敗）
        return statusCode >= 200 && statusCode < 500 && statusCode !== 404;
    }

    /**
     * 獲取認證標頭 (模擬)
     */
    getAuthHeaders() {
        // 這裡應該返回有效的認證標頭
        // 目前返回空對象，因為我們主要是測試端點是否存在
        return {
            // 'Authorization': 'Bearer fake-token-for-testing'
        };
    }

    /**
     * 休眠函數
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 快速驗證 (僅測試關鍵端點)
     */
    async runQuickValidation() {
        console.log('⚡ 執行快速端點驗證...');
        
        const quickTestEndpoints = [
            { method: 'GET', path: '/api/auth/login' },
            { method: 'GET', path: '/api/attendance' },
            { method: 'GET', path: '/api/monitoring/health' }
        ];
        
        await this.checkServerAvailability();
        
        let passedCount = 0;
        for (const endpoint of quickTestEndpoints) {
            try {
                const response = await this.makeRequest(endpoint.method, endpoint.path);
                if (response.statusCode && response.statusCode !== 404) {
                    passedCount++;
                }
            } catch (error) {
                // 忽略錯誤，只統計
            }
        }
        
        return {
            serverAvailable: this.testResults.serverAvailable,
            quickTestsPassed: passedCount,
            quickTestsTotal: quickTestEndpoints.length,
            successRate: (passedCount / quickTestEndpoints.length * 100).toFixed(2)
        };
    }
}

// 如果直接執行此文件，運行驗證
if (require.main === module) {
    const validator = new RouteEndpointValidator({
        baseUrl: process.env.BASE_URL || 'http://localhost:3000'
    });
    
    validator.runCompleteValidation().then((results) => {
        console.log('\n🎉 驗證完成!');
        console.log(`成功率: ${results.summary.successRate}%`);
        console.log(`平均回應時間: ${results.summary.averageResponseTime}ms`);
        console.log(`發現 ${results.issues.length} 個問題和 ${results.warnings.length} 個警告`);
        
        if (results.summary.successRate < 80) {
            console.log('\n⚠️  建議先修復路由問題後再運行完整測試');
            process.exit(1);
        }
        
        process.exit(0);
    }).catch((error) => {
        console.error('❌ 驗證失敗:', error);
        process.exit(1);
    });
}

module.exports = RouteEndpointValidator;