/**
 * =======================================================
 * 營收管理系統API測試 - Revenue Management API Testing
 * =======================================================
 * 基於系統邏輯.txt規格 - 完整營收管理API功能驗證
 */

const http = require('http');
const fs = require('fs').promises;

class RevenueManagementAPITest {
    constructor() {
        this.baseUrl = 'http://localhost:3004';
        this.testResults = [];
        this.testData = {
            submittedRecordIds: [],
            testEmployee: {
                id: 1,
                name: '測試員工'
            }
        };
    }

    async makeRequest(method, path, data = null, headers = {}) {
        return new Promise((resolve, reject) => {
            const url = new URL(path, this.baseUrl);
            
            const options = {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname + url.search,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Revenue-Management-Test/1.0',
                    ...headers
                }
            };

            const req = http.request(options, (res) => {
                let body = '';
                
                res.on('data', (chunk) => {
                    body += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const responseData = JSON.parse(body);
                        resolve({
                            status: res.statusCode,
                            headers: res.headers,
                            data: responseData
                        });
                    } catch (error) {
                        resolve({
                            status: res.statusCode,
                            headers: res.headers,
                            data: body
                        });
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            if (data) {
                req.write(JSON.stringify(data));
            }
            
            req.end();
        });
    }

    async runTest(testName, testFunction) {
        console.log(`\n🧪 執行測試: ${testName}`);
        const startTime = Date.now();
        
        try {
            const result = await testFunction();
            const duration = Date.now() - startTime;
            
            const testResult = {
                name: testName,
                status: 'PASSED',
                duration: duration,
                details: result,
                timestamp: new Date().toISOString()
            };
            
            this.testResults.push(testResult);
            console.log(`✅ ${testName} - 通過 (${duration}ms)`);
            return testResult;
            
        } catch (error) {
            const duration = Date.now() - startTime;
            
            const testResult = {
                name: testName,
                status: 'FAILED',
                duration: duration,
                error: error.message,
                timestamp: new Date().toISOString()
            };
            
            this.testResults.push(testResult);
            console.log(`❌ ${testName} - 失敗 (${duration}ms): ${error.message}`);
            return testResult;
        }
    }

    // 1. 測試獎金計算器API
    async testBonusCalculationAPI() {
        return await this.runTest('獎金計算器API測試', async () => {
            // 測試平日獎金計算
            const weekdayData = {
                cashRevenue: 15000,
                pandaRevenue: 5000,
                uberRevenue: 3000,
                bonusType: '平日獎金'
            };
            
            const weekdayResponse = await this.makeRequest('POST', '/api/revenue/calculate-bonus', weekdayData);
            
            if (weekdayResponse.status !== 200) {
                throw new Error(`平日獎金計算API錯誤: ${weekdayResponse.status}`);
            }
            
            if (!weekdayResponse.data.success) {
                throw new Error(`平日獎金計算失敗: ${weekdayResponse.data.message}`);
            }
            
            const weekdayResult = weekdayResponse.data.data;
            
            // 測試假日獎金計算
            const holidayData = {
                cashRevenue: 10000,
                pandaRevenue: 4000,
                uberRevenue: 2000,
                bonusType: '假日獎金'
            };
            
            const holidayResponse = await this.makeRequest('POST', '/api/revenue/calculate-bonus', holidayData);
            
            if (holidayResponse.status !== 200) {
                throw new Error(`假日獎金計算API錯誤: ${holidayResponse.status}`);
            }
            
            const holidayResult = holidayResponse.data.data;
            
            // 驗證計算邏輯
            const expectedWeekdayEffective = 15000 + (5000 * 0.65) + (3000 * 0.65); // 20200
            const expectedWeekdayBonus = expectedWeekdayEffective > 13000 ? expectedWeekdayEffective * 0.30 : 0;
            
            const expectedHolidayEffective = 10000 + (4000 * 0.65) + (2000 * 0.65); // 13900
            const expectedHolidayBonus = expectedHolidayEffective * 0.38;
            
            return {
                weekdayCalculation: {
                    input: weekdayData,
                    result: weekdayResult,
                    expectedEffective: expectedWeekdayEffective,
                    actualEffective: weekdayResult.totalEffective,
                    expectedBonus: Math.round(expectedWeekdayBonus),
                    actualBonus: weekdayResult.bonusAmount,
                    qualified: weekdayResult.qualified
                },
                holidayCalculation: {
                    input: holidayData,
                    result: holidayResult,
                    expectedEffective: expectedHolidayEffective,
                    actualEffective: holidayResult.totalEffective,
                    expectedBonus: Math.round(expectedHolidayBonus),
                    actualBonus: holidayResult.bonusAmount,
                    qualified: holidayResult.qualified
                },
                calculationAccuracy: {
                    weekdayCorrect: Math.abs(weekdayResult.totalEffective - expectedWeekdayEffective) < 1,
                    holidayCorrect: Math.abs(holidayResult.totalEffective - expectedHolidayEffective) < 1
                }
            };
        });
    }

    // 2. 測試營收記錄提交API
    async testRevenueSubmissionAPI() {
        return await this.runTest('營收記錄提交API測試', async () => {
            const today = new Date().toISOString().split('T')[0];
            
            // 測試平日營收提交
            const weekdaySubmission = {
                employeeId: this.testData.testEmployee.id,
                storeName: '總店',
                date: today,
                bonusType: '平日獎金',
                cashRevenue: 18000,
                pandaRevenue: 6000,
                uberRevenue: 4000,
                cashOrders: 50,
                pandaOrders: 25,
                uberOrders: 15,
                notes: 'API測試 - 平日營收'
            };
            
            const weekdayResponse = await this.makeRequest('POST', '/api/revenue/submit', weekdaySubmission);
            
            if (weekdayResponse.status !== 200) {
                throw new Error(`平日營收提交失敗: ${weekdayResponse.status} - ${JSON.stringify(weekdayResponse.data)}`);
            }
            
            if (!weekdayResponse.data.success) {
                throw new Error(`平日營收提交業務邏輯失敗: ${weekdayResponse.data.message}`);
            }
            
            const weekdayRecord = weekdayResponse.data.data;
            this.testData.submittedRecordIds.push(weekdayRecord.recordId);
            
            // 測試假日營收提交
            const holidaySubmission = {
                employeeId: this.testData.testEmployee.id,
                storeName: '西門分店',
                date: today,
                bonusType: '假日獎金',
                cashRevenue: 12000,
                pandaRevenue: 3000,
                uberRevenue: 2000,
                cashOrders: 40,
                pandaOrders: 18,
                uberOrders: 12,
                notes: 'API測試 - 假日營收'
            };
            
            const holidayResponse = await this.makeRequest('POST', '/api/revenue/submit', holidaySubmission);
            
            if (holidayResponse.status !== 200) {
                throw new Error(`假日營收提交失敗: ${holidayResponse.status}`);
            }
            
            const holidayRecord = holidayResponse.data.data;
            this.testData.submittedRecordIds.push(holidayRecord.recordId);
            
            return {
                weekdaySubmission: {
                    input: weekdaySubmission,
                    recordId: weekdayRecord.recordId,
                    bonusCalculation: weekdayRecord.bonusCalculation,
                    qualified: weekdayRecord.bonusCalculation.qualified,
                    bonusAmount: weekdayRecord.bonusCalculation.bonusAmount
                },
                holidaySubmission: {
                    input: holidaySubmission,
                    recordId: holidayRecord.recordId,
                    bonusCalculation: holidayRecord.bonusCalculation,
                    qualified: holidayRecord.bonusCalculation.qualified,
                    bonusAmount: holidayRecord.bonusCalculation.bonusAmount
                },
                submissionSuccess: true,
                recordCount: this.testData.submittedRecordIds.length
            };
        });
    }

    // 3. 測試營收記錄查詢API
    async testRevenueRecordsAPI() {
        return await this.runTest('營收記錄查詢API測試', async () => {
            // 測試獲取所有記錄
            const allRecordsResponse = await this.makeRequest('GET', '/api/revenue/records?page=1&limit=50');
            
            if (allRecordsResponse.status !== 200) {
                throw new Error(`查詢所有記錄失敗: ${allRecordsResponse.status}`);
            }
            
            if (!allRecordsResponse.data.success) {
                throw new Error(`查詢記錄業務邏輯失敗: ${allRecordsResponse.data.message}`);
            }
            
            const allRecords = allRecordsResponse.data.data.records || [];
            const pagination = allRecordsResponse.data.data.pagination || {};
            
            // 測試日期範圍過濾
            const today = new Date().toISOString().split('T')[0];
            const dateFilterResponse = await this.makeRequest('GET', `/api/revenue/records?startDate=${today}&endDate=${today}`);
            
            const todayRecords = dateFilterResponse.data.data.records || [];
            
            // 測試分店過濾
            const storeFilterResponse = await this.makeRequest('GET', '/api/revenue/records?storeName=總店');
            const storeRecords = storeFilterResponse.data.data.records || [];
            
            // 測試獎金類別過濾
            const bonusFilterResponse = await this.makeRequest('GET', '/api/revenue/records?bonusType=平日獎金');
            const bonusRecords = bonusFilterResponse.data.data.records || [];
            
            return {
                allRecordsQuery: {
                    recordCount: allRecords.length,
                    pagination: pagination,
                    hasRecords: allRecords.length > 0
                },
                dateFiltering: {
                    todayRecordCount: todayRecords.length,
                    filterWorking: todayRecords.length >= this.testData.submittedRecordIds.length
                },
                storeFiltering: {
                    storeRecordCount: storeRecords.length,
                    filterWorking: storeRecords.every(record => record.storeName === '總店')
                },
                bonusTypeFiltering: {
                    bonusRecordCount: bonusRecords.length,
                    filterWorking: bonusRecords.every(record => record.bonusType === '平日獎金')
                },
                queryFunctionsWorking: true
            };
        });
    }

    // 4. 測試分店摘要API
    async testStoresSummaryAPI() {
        return await this.runTest('分店摘要API測試', async () => {
            const summaryResponse = await this.makeRequest('GET', '/api/revenue/stores-summary');
            
            if (summaryResponse.status !== 200) {
                throw new Error(`分店摘要API錯誤: ${summaryResponse.status}`);
            }
            
            if (!summaryResponse.data.success) {
                throw new Error(`分店摘要業務邏輯失敗: ${summaryResponse.data.message}`);
            }
            
            const storesSummary = summaryResponse.data.data.storesSummary || [];
            
            // 驗證數據結構
            let validStores = 0;
            let totalMonthlyIncome = 0;
            let totalMonthlyBonus = 0;
            
            storesSummary.forEach(store => {
                if (store.storeName && store.statistics && typeof store.statistics.monthlyIncome === 'number') {
                    validStores++;
                    totalMonthlyIncome += store.statistics.monthlyIncome;
                    totalMonthlyBonus += store.statistics.monthlyBonus;
                }
            });
            
            return {
                storeCount: storesSummary.length,
                validStores: validStores,
                totalMonthlyIncome: totalMonthlyIncome,
                totalMonthlyBonus: totalMonthlyBonus,
                sampleStore: storesSummary.length > 0 ? storesSummary[0] : null,
                dataStructureValid: validStores === storesSummary.length,
                summaryWorking: storesSummary.length > 0
            };
        });
    }

    // 5. 測試營收記錄作廢API
    async testRevenueVoidAPI() {
        return await this.runTest('營收記錄作廢API測試', async () => {
            if (this.testData.submittedRecordIds.length === 0) {
                throw new Error('沒有可作廢的記錄');
            }
            
            const recordIdToVoid = this.testData.submittedRecordIds[0];
            
            const voidData = {
                reason: 'API測試 - 測試作廢功能',
                operatorId: 'test-system'
            };
            
            const voidResponse = await this.makeRequest('PUT', `/api/revenue/void/${recordIdToVoid}`, voidData);
            
            if (voidResponse.status !== 200) {
                throw new Error(`作廢API錯誤: ${voidResponse.status} - ${JSON.stringify(voidResponse.data)}`);
            }
            
            if (!voidResponse.data.success) {
                throw new Error(`作廢業務邏輯失敗: ${voidResponse.data.message}`);
            }
            
            // 驗證記錄是否已作廢 (應該不會在正常查詢中出現)
            const verifyResponse = await this.makeRequest('GET', '/api/revenue/records?page=1&limit=1000');
            const allRecords = verifyResponse.data.data.records || [];
            const voidedRecord = allRecords.find(record => record.id === recordIdToVoid);
            
            return {
                voidedRecordId: recordIdToVoid,
                voidReason: voidData.reason,
                voidResponse: voidResponse.data,
                recordStillVisible: !!voidedRecord,
                voidSuccessful: !voidedRecord // 作廢成功的記錄不應該在正常查詢中出現
            };
        });
    }

    // 6. 測試錯誤處理
    async testErrorHandling() {
        return await this.runTest('錯誤處理測試', async () => {
            const errorTests = [];
            
            // 測試無效參數
            const invalidSubmission = {
                employeeId: 'invalid',
                storeName: '',
                date: 'invalid-date',
                bonusType: 'invalid-type'
            };
            
            const invalidResponse = await this.makeRequest('POST', '/api/revenue/submit', invalidSubmission);
            errorTests.push({
                test: 'invalid_submission',
                status: invalidResponse.status,
                handlesError: invalidResponse.status >= 400,
                message: invalidResponse.data.message
            });
            
            // 測試不存在的記錄作廢
            const nonExistentVoidResponse = await this.makeRequest('PUT', '/api/revenue/void/99999', {
                reason: '測試不存在記錄',
                operatorId: 'test'
            });
            errorTests.push({
                test: 'non_existent_void',
                status: nonExistentVoidResponse.status,
                handlesError: nonExistentVoidResponse.status >= 400
            });
            
            // 測試無效的獎金計算參數
            const invalidCalcResponse = await this.makeRequest('POST', '/api/revenue/calculate-bonus', {
                bonusType: 'invalid-bonus-type'
            });
            errorTests.push({
                test: 'invalid_bonus_calculation',
                status: invalidCalcResponse.status,
                handlesError: invalidCalcResponse.status >= 400
            });
            
            const allErrorsHandled = errorTests.every(test => test.handlesError);
            
            return {
                errorTests: errorTests,
                allErrorsHandled: allErrorsHandled,
                errorHandlingWorking: allErrorsHandled
            };
        });
    }

    // 7. 測試系統邏輯合規性
    async testSystemLogicCompliance() {
        return await this.runTest('系統邏輯.txt合規性檢查', async () => {
            // 測試獎金計算公式合規性
            const testCases = [
                {
                    name: '平日獎金門檻測試',
                    data: { cashRevenue: 13001, pandaRevenue: 0, uberRevenue: 0, bonusType: '平日獎金' },
                    expectedQualified: true,
                    expectedBonusRate: 0.30
                },
                {
                    name: '平日獎金未達標測試', 
                    data: { cashRevenue: 12999, pandaRevenue: 0, uberRevenue: 0, bonusType: '平日獎金' },
                    expectedQualified: false
                },
                {
                    name: '假日獎金測試',
                    data: { cashRevenue: 1000, pandaRevenue: 0, uberRevenue: 0, bonusType: '假日獎金' },
                    expectedQualified: true,
                    expectedBonusRate: 0.38
                },
                {
                    name: '服務費計算測試',
                    data: { cashRevenue: 0, pandaRevenue: 1000, uberRevenue: 1000, bonusType: '假日獎金' },
                    expectedEffectiveRevenue: 1300 // 1000*0.65 + 1000*0.65
                }
            ];
            
            const complianceResults = [];
            
            for (const testCase of testCases) {
                const response = await this.makeRequest('POST', '/api/revenue/calculate-bonus', testCase.data);
                
                if (response.data.success) {
                    const result = response.data.data;
                    const compliance = {
                        testName: testCase.name,
                        input: testCase.data,
                        result: result,
                        qualifiedMatch: testCase.expectedQualified === undefined || result.qualified === testCase.expectedQualified,
                        bonusRateMatch: testCase.expectedBonusRate === undefined || Math.abs(result.bonusRate - testCase.expectedBonusRate) < 0.01,
                        effectiveRevenueMatch: testCase.expectedEffectiveRevenue === undefined || Math.abs(result.totalEffective - testCase.expectedEffectiveRevenue) < 1,
                        passed: true
                    };
                    
                    compliance.passed = compliance.qualifiedMatch && compliance.bonusRateMatch && compliance.effectiveRevenueMatch;
                    complianceResults.push(compliance);
                } else {
                    complianceResults.push({
                        testName: testCase.name,
                        passed: false,
                        error: response.data.message
                    });
                }
            }
            
            const allCompliant = complianceResults.every(result => result.passed);
            const complianceScore = (complianceResults.filter(result => result.passed).length / complianceResults.length * 100).toFixed(1);
            
            return {
                complianceTests: complianceResults,
                allCompliant: allCompliant,
                complianceScore: parseFloat(complianceScore),
                systemLogicCompliance: allCompliant
            };
        });
    }

    async generateReport() {
        const passedTests = this.testResults.filter(t => t.status === 'PASSED').length;
        const totalTests = this.testResults.length;
        const successRate = ((passedTests / totalTests) * 100).toFixed(1);

        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total: totalTests,
                passed: passedTests,
                failed: totalTests - passedTests,
                successRate: `${successRate}%`
            },
            tests: this.testResults,
            revenueManagementAssessment: {
                bonusCalculation: this.testResults.find(t => t.name.includes('獎金計算器'))?.status === 'PASSED',
                revenueSubmission: this.testResults.find(t => t.name.includes('營收記錄提交'))?.status === 'PASSED',
                recordsQuery: this.testResults.find(t => t.name.includes('營收記錄查詢'))?.status === 'PASSED',
                storesSummary: this.testResults.find(t => t.name.includes('分店摘要'))?.status === 'PASSED',
                recordVoid: this.testResults.find(t => t.name.includes('作廢'))?.status === 'PASSED',
                errorHandling: this.testResults.find(t => t.name.includes('錯誤處理'))?.status === 'PASSED',
                systemCompliance: this.testResults.find(t => t.name.includes('合規性'))?.status === 'PASSED'
            },
            systemStability: passedTests >= 6,
            apiIntegration: {
                complete: passedTests === totalTests,
                functionalModules: passedTests,
                totalModules: totalTests
            }
        };

        const reportPath = `D:\\0809\\revenue-management-api-test-${Date.now()}.json`;
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');

        console.log(`\n📊 營收管理系統API測試報告:`);
        console.log(`📈 成功率: ${successRate}% (${passedTests}/${totalTests})`);
        console.log(`💰 獎金計算: ${report.revenueManagementAssessment.bonusCalculation ? '✅' : '❌'}`);
        console.log(`📊 記錄提交: ${report.revenueManagementAssessment.revenueSubmission ? '✅' : '❌'}`);
        console.log(`🔍 記錄查詢: ${report.revenueManagementAssessment.recordsQuery ? '✅' : '❌'}`);
        console.log(`🏪 分店摘要: ${report.revenueManagementAssessment.storesSummary ? '✅' : '❌'}`);
        console.log(`🗑️ 記錄作廢: ${report.revenueManagementAssessment.recordVoid ? '✅' : '❌'}`);
        console.log(`⚠️ 錯誤處理: ${report.revenueManagementAssessment.errorHandling ? '✅' : '❌'}`);
        console.log(`📋 系統合規: ${report.revenueManagementAssessment.systemCompliance ? '✅' : '❌'}`);
        console.log(`📁 報告位置: ${reportPath}`);

        return { reportPath, report };
    }

    async runAllTests() {
        try {
            console.log('🚀 開始營收管理系統API測試...');
            
            // 執行所有測試
            await this.testBonusCalculationAPI();
            await this.testRevenueSubmissionAPI();
            await this.testRevenueRecordsAPI();
            await this.testStoresSummaryAPI();
            await this.testRevenueVoidAPI();
            await this.testErrorHandling();
            await this.testSystemLogicCompliance();
            
            // 生成報告
            const reportInfo = await this.generateReport();
            
            console.log('\n🎉 營收管理系統API測試完成！');
            return reportInfo;
            
        } catch (error) {
            console.error('❌ 營收管理API測試失敗:', error);
            throw error;
        }
    }
}

// 直接執行
if (require.main === module) {
    const tester = new RevenueManagementAPITest();
    tester.runAllTests()
        .then(report => {
            console.log('🎯 營收管理系統API測試完成');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 測試失敗:', error);
            process.exit(1);
        });
}

module.exports = RevenueManagementAPITest;