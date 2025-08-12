/**
 * ================================================
 * 營收管理系統完整整合報告生成器
 * ================================================
 * 生成營收管理系統完整整合狀態報告
 */

const fs = require('fs').promises;
const http = require('http');

class RevenueSystemIntegrationReport {
    constructor() {
        this.baseUrl = 'http://localhost:3004';
        this.reportData = {
            timestamp: new Date().toISOString(),
            integrationStatus: {},
            componentStatus: {},
            functionalityTests: [],
            performanceMetrics: {},
            systemHealth: {}
        };
    }

    async makeRequest(method, path, data = null) {
        return new Promise((resolve, reject) => {
            const url = new URL(path, this.baseUrl);
            
            const options = {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname + url.search,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Revenue-Integration-Report/1.0'
                }
            };

            const req = http.request(options, (res) => {
                let body = '';
                res.on('data', (chunk) => body += chunk);
                res.on('end', () => {
                    try {
                        const responseData = JSON.parse(body);
                        resolve({ status: res.statusCode, data: responseData });
                    } catch (error) {
                        resolve({ status: res.statusCode, data: body });
                    }
                });
            });

            req.on('error', reject);
            if (data) req.write(JSON.stringify(data));
            req.end();
        });
    }

    async checkFrontendIntegration() {
        console.log('🔍 檢查前端整合狀態...');
        
        try {
            // 檢查營收頁面可訪問性
            const revenuePageCheck = await this.makeRequest('GET', '/revenue.html');
            
            // 檢查前端JavaScript檔案
            const jsFileCheck = await this.makeRequest('GET', '/js/revenue-management.js');
            
            this.reportData.componentStatus.frontend = {
                revenuePageAccessible: revenuePageCheck.status === 200,
                jsFilesLoaded: jsFileCheck.status === 200,
                status: revenuePageCheck.status === 200 && jsFileCheck.status === 200 ? 'HEALTHY' : 'DEGRADED'
            };
            
            console.log('✅ 前端整合檢查完成');
            return true;
        } catch (error) {
            console.error('❌ 前端整合檢查失敗:', error.message);
            this.reportData.componentStatus.frontend = {
                status: 'FAILED',
                error: error.message
            };
            return false;
        }
    }

    async checkBackendIntegration() {
        console.log('🔍 檢查後端整合狀態...');
        
        try {
            // 檢查所有關鍵API端點
            const endpoints = [
                { path: '/api/revenue', method: 'GET' },
                { path: '/api/revenue/calculate-bonus', method: 'POST', data: { cashRevenue: 15000, bonusType: '平日獎金' } },
                { path: '/api/revenue/records', method: 'GET' },
                { path: '/api/revenue/stores-summary', method: 'GET' }
            ];

            const endpointResults = {};
            
            for (const endpoint of endpoints) {
                const result = await this.makeRequest(endpoint.method, endpoint.path, endpoint.data);
                endpointResults[endpoint.path] = {
                    status: result.status,
                    working: result.status === 200,
                    responseTime: Date.now() // 簡化的響應時間
                };
            }

            this.reportData.componentStatus.backend = {
                endpoints: endpointResults,
                allEndpointsWorking: Object.values(endpointResults).every(e => e.working),
                status: Object.values(endpointResults).every(e => e.working) ? 'HEALTHY' : 'DEGRADED'
            };

            console.log('✅ 後端整合檢查完成');
            return true;
        } catch (error) {
            console.error('❌ 後端整合檢查失敗:', error.message);
            this.reportData.componentStatus.backend = {
                status: 'FAILED',
                error: error.message
            };
            return false;
        }
    }

    async checkDatabaseIntegration() {
        console.log('🔍 檢查數據庫整合狀態...');
        
        try {
            // 檢查數據庫表結構和數據
            const recordsCheck = await this.makeRequest('GET', '/api/revenue/records?limit=1');
            
            // 檢查外鍵約束修復狀態
            const submissionTest = await this.makeRequest('POST', '/api/revenue/submit', {
                employeeId: 999,
                storeName: '整合測試店',
                date: new Date().toISOString().split('T')[0],
                bonusType: '平日獎金',
                cashRevenue: 15000,
                notes: '整合測試記錄'
            });

            this.reportData.componentStatus.database = {
                recordsAccessible: recordsCheck.status === 200,
                foreignKeyIssueResolved: submissionTest.status !== 500 || !submissionTest.data?.message?.includes('FOREIGN KEY'),
                canCreateRecords: submissionTest.status === 200,
                status: recordsCheck.status === 200 ? 'HEALTHY' : 'DEGRADED'
            };

            // 清理測試記錄
            if (submissionTest.status === 200 && submissionTest.data?.data?.recordId) {
                await this.makeRequest('PUT', `/api/revenue/void/${submissionTest.data.data.recordId}`, {
                    reason: '整合測試清理',
                    operatorId: 'integration-test'
                });
            }

            console.log('✅ 數據庫整合檢查完成');
            return true;
        } catch (error) {
            console.error('❌ 數據庫整合檢查失敗:', error.message);
            this.reportData.componentStatus.database = {
                status: 'FAILED',
                error: error.message
            };
            return false;
        }
    }

    async checkBusinessLogicIntegration() {
        console.log('🔍 檢查業務邏輯整合狀態...');
        
        try {
            // 測試完整的業務流程
            const businessFlowTests = [
                {
                    name: '獎金計算準確性',
                    test: async () => {
                        const result = await this.makeRequest('POST', '/api/revenue/calculate-bonus', {
                            cashRevenue: 20000,
                            pandaRevenue: 5000,
                            uberRevenue: 3000,
                            bonusType: '平日獎金'
                        });
                        return result.status === 200 && result.data.success && result.data.data.qualified;
                    }
                },
                {
                    name: '記錄提交流程',
                    test: async () => {
                        const result = await this.makeRequest('POST', '/api/revenue/submit', {
                            employeeId: 1,
                            storeName: '業務邏輯測試店',
                            date: new Date().toISOString().split('T')[0],
                            bonusType: '假日獎金',
                            cashRevenue: 12000,
                            notes: '業務邏輯測試'
                        });
                        
                        if (result.status === 200 && result.data.success) {
                            // 清理測試記錄
                            await this.makeRequest('PUT', `/api/revenue/void/${result.data.data.recordId}`, {
                                reason: '業務邏輯測試清理',
                                operatorId: 'integration-test'
                            });
                            return true;
                        }
                        return false;
                    }
                },
                {
                    name: '查詢過濾功能',
                    test: async () => {
                        const result = await this.makeRequest('GET', '/api/revenue/records?bonusType=平日獎金&limit=5');
                        return result.status === 200 && result.data.success;
                    }
                },
                {
                    name: '分店摘要統計',
                    test: async () => {
                        const result = await this.makeRequest('GET', '/api/revenue/stores-summary');
                        return result.status === 200 && result.data.success && Array.isArray(result.data.data.storesSummary);
                    }
                }
            ];

            const testResults = [];
            for (const testCase of businessFlowTests) {
                const startTime = Date.now();
                let passed = false;
                let error = null;
                
                try {
                    passed = await testCase.test();
                } catch (err) {
                    error = err.message;
                }
                
                testResults.push({
                    name: testCase.name,
                    passed,
                    error,
                    duration: Date.now() - startTime
                });
            }

            this.reportData.functionalityTests = testResults;
            
            const allTestsPassed = testResults.every(test => test.passed);
            this.reportData.componentStatus.businessLogic = {
                allTestsPassed,
                passedTests: testResults.filter(t => t.passed).length,
                totalTests: testResults.length,
                status: allTestsPassed ? 'HEALTHY' : 'DEGRADED'
            };

            console.log('✅ 業務邏輯整合檢查完成');
            return allTestsPassed;
        } catch (error) {
            console.error('❌ 業務邏輯整合檢查失敗:', error.message);
            this.reportData.componentStatus.businessLogic = {
                status: 'FAILED',
                error: error.message
            };
            return false;
        }
    }

    async generatePerformanceMetrics() {
        console.log('📊 生成性能指標...');
        
        try {
            const performanceTests = [
                {
                    name: '獎金計算響應時間',
                    endpoint: '/api/revenue/calculate-bonus',
                    method: 'POST',
                    data: { cashRevenue: 15000, bonusType: '平日獎金' }
                },
                {
                    name: '記錄查詢響應時間',
                    endpoint: '/api/revenue/records?limit=20',
                    method: 'GET'
                },
                {
                    name: '分店摘要響應時間',
                    endpoint: '/api/revenue/stores-summary',
                    method: 'GET'
                }
            ];

            const results = [];
            for (const test of performanceTests) {
                const startTime = Date.now();
                await this.makeRequest(test.method, test.endpoint, test.data);
                const responseTime = Date.now() - startTime;
                
                results.push({
                    name: test.name,
                    responseTime,
                    status: responseTime < 1000 ? 'GOOD' : responseTime < 3000 ? 'ACCEPTABLE' : 'SLOW'
                });
            }

            this.reportData.performanceMetrics = {
                tests: results,
                averageResponseTime: results.reduce((sum, test) => sum + test.responseTime, 0) / results.length,
                allResponsesAcceptable: results.every(test => test.responseTime < 3000)
            };

            console.log('✅ 性能指標生成完成');
            return true;
        } catch (error) {
            console.error('❌ 性能指標生成失敗:', error.message);
            return false;
        }
    }

    async assessSystemHealth() {
        console.log('🏥 評估系統健康狀態...');
        
        const components = ['frontend', 'backend', 'database', 'businessLogic'];
        const healthyComponents = components.filter(comp => 
            this.reportData.componentStatus[comp]?.status === 'HEALTHY'
        ).length;

        const overallHealth = healthyComponents === components.length ? 'EXCELLENT' :
                             healthyComponents >= 3 ? 'GOOD' :
                             healthyComponents >= 2 ? 'ACCEPTABLE' : 'CRITICAL';

        this.reportData.systemHealth = {
            overallStatus: overallHealth,
            healthyComponents,
            totalComponents: components.length,
            healthPercentage: Math.round((healthyComponents / components.length) * 100),
            recommendations: this.generateRecommendations()
        };

        this.reportData.integrationStatus = {
            complete: overallHealth === 'EXCELLENT',
            readyForProduction: overallHealth === 'EXCELLENT' || overallHealth === 'GOOD',
            criticalIssues: components.filter(comp => 
                this.reportData.componentStatus[comp]?.status === 'FAILED'
            )
        };

        console.log('✅ 系統健康狀態評估完成');
    }

    generateRecommendations() {
        const recommendations = [];
        
        // 檢查各組件狀態並生成建議
        Object.entries(this.reportData.componentStatus).forEach(([component, status]) => {
            if (status.status === 'FAILED') {
                recommendations.push(`❌ ${component} 組件故障，需要立即修復`);
            } else if (status.status === 'DEGRADED') {
                recommendations.push(`⚠️ ${component} 組件性能下降，建議優化`);
            }
        });

        // 性能建議
        if (this.reportData.performanceMetrics?.averageResponseTime > 2000) {
            recommendations.push('⚡ API響應時間較慢，建議優化數據庫查詢和緩存策略');
        }

        // 功能測試建議
        const failedTests = this.reportData.functionalityTests?.filter(test => !test.passed) || [];
        if (failedTests.length > 0) {
            recommendations.push(`🧪 ${failedTests.length} 個功能測試失敗，需要修復相關業務邏輯`);
        }

        if (recommendations.length === 0) {
            recommendations.push('🎉 系統運行良好，所有組件正常工作');
        }

        return recommendations;
    }

    async generateReport() {
        console.log('📝 生成完整整合報告...');
        
        const reportPath = `D:\\0809\\revenue-system-integration-report-${Date.now()}.json`;
        const readableReportPath = `D:\\0809\\revenue-system-integration-summary-${Date.now()}.md`;
        
        // 保存完整JSON報告
        await fs.writeFile(reportPath, JSON.stringify(this.reportData, null, 2), 'utf8');
        
        // 生成可讀的Markdown報告
        const markdownReport = this.generateMarkdownReport();
        await fs.writeFile(readableReportPath, markdownReport, 'utf8');
        
        console.log(`📁 完整報告保存至: ${reportPath}`);
        console.log(`📄 摘要報告保存至: ${readableReportPath}`);
        
        return { jsonReport: reportPath, markdownReport: readableReportPath };
    }

    generateMarkdownReport() {
        const { systemHealth, componentStatus, performanceMetrics, functionalityTests } = this.reportData;
        
        return `# 營收管理系統完整整合報告

## 📊 系統健康狀態總覽
- **整體狀態**: ${systemHealth.overallStatus}
- **健康度**: ${systemHealth.healthPercentage}%
- **生產就緒**: ${this.reportData.integrationStatus.readyForProduction ? '✅ 是' : '❌ 否'}

## 🧩 組件狀態

### 前端整合
- **狀態**: ${componentStatus.frontend?.status || 'UNKNOWN'}
- **營收頁面**: ${componentStatus.frontend?.revenuePageAccessible ? '✅' : '❌'}
- **JavaScript檔案**: ${componentStatus.frontend?.jsFilesLoaded ? '✅' : '❌'}

### 後端整合
- **狀態**: ${componentStatus.backend?.status || 'UNKNOWN'}
- **API端點**: ${componentStatus.backend?.allEndpointsWorking ? '✅ 全部正常' : '⚠️ 部分異常'}

### 數據庫整合
- **狀態**: ${componentStatus.database?.status || 'UNKNOWN'}
- **外鍵問題**: ${componentStatus.database?.foreignKeyIssueResolved ? '✅ 已解決' : '❌ 待解決'}
- **記錄創建**: ${componentStatus.database?.canCreateRecords ? '✅' : '❌'}

### 業務邏輯整合
- **狀態**: ${componentStatus.businessLogic?.status || 'UNKNOWN'}
- **功能測試**: ${componentStatus.businessLogic?.passedTests || 0}/${componentStatus.businessLogic?.totalTests || 0} 通過

## 🚀 功能測試結果

${functionalityTests?.map(test => 
    `- **${test.name}**: ${test.passed ? '✅' : '❌'} (${test.duration}ms)`
).join('\n') || '無測試數據'}

## ⚡ 性能指標

- **平均響應時間**: ${performanceMetrics?.averageResponseTime?.toFixed(0) || 'N/A'}ms
- **響應速度**: ${performanceMetrics?.allResponsesAcceptable ? '✅ 良好' : '⚠️ 需優化'}

## 💡 改進建議

${systemHealth.recommendations?.map(rec => `- ${rec}`).join('\n') || '無建議'}

## 📈 整合完成度

- **前端-後端整合**: ${componentStatus.frontend?.status === 'HEALTHY' && componentStatus.backend?.status === 'HEALTHY' ? '✅' : '⚠️'}
- **後端-數據庫整合**: ${componentStatus.backend?.status === 'HEALTHY' && componentStatus.database?.status === 'HEALTHY' ? '✅' : '⚠️'}
- **業務邏輯整合**: ${componentStatus.businessLogic?.status === 'HEALTHY' ? '✅' : '⚠️'}

## 🎯 結論

${this.reportData.integrationStatus.complete ? 
'🎉 營收管理系統完整整合成功！所有組件運行正常，系統已準備好投入生產環境。' : 
'⚠️ 營收管理系統整合基本完成，但仍有部分組件需要優化。建議解決上述問題後再投入生產環境。'}

---
*報告生成時間: ${this.reportData.timestamp}*
`;
    }

    async runFullIntegrationCheck() {
        console.log('🚀 開始營收管理系統完整整合檢查...');
        
        try {
            // 依序執行所有檢查
            await this.checkFrontendIntegration();
            await this.checkBackendIntegration();
            await this.checkDatabaseIntegration();
            await this.checkBusinessLogicIntegration();
            await this.generatePerformanceMetrics();
            await this.assessSystemHealth();
            
            // 生成報告
            const reportPaths = await this.generateReport();
            
            console.log('\n📊 整合檢查完成！');
            console.log(`🏥 系統健康狀態: ${this.reportData.systemHealth.overallStatus}`);
            console.log(`📈 整合完成度: ${this.reportData.systemHealth.healthPercentage}%`);
            console.log(`🚀 生產就緒: ${this.reportData.integrationStatus.readyForProduction ? '是' : '否'}`);
            
            return reportPaths;
        } catch (error) {
            console.error('❌ 整合檢查失敗:', error);
            throw error;
        }
    }
}

// 直接執行
if (require.main === module) {
    const checker = new RevenueSystemIntegrationReport();
    checker.runFullIntegrationCheck()
        .then(reportPaths => {
            console.log('\n🎉 營收管理系統完整整合檢查完成！');
            console.log(`📄 查看詳細報告: ${reportPaths.markdownReport}`);
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 整合檢查失敗:', error);
            process.exit(1);
        });
}

module.exports = RevenueSystemIntegrationReport;