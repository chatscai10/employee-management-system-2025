/**
 * 智慧瀏覽器驗證系統
 * 功能：自動啟動瀏覽器、測試系統功能、生成驗證報告
 */

const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class IntelligentBrowserVerification {
    constructor() {
        this.serverPort = process.env.PORT || 3001;
        this.serverUrl = `http://localhost:${this.serverPort}`;
        this.testResults = {
            startTime: new Date().toISOString(),
            tests: [],
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                warnings: 0
            }
        };
        this.browserProcess = null;
    }

    /**
     * 🚀 啟動完整驗證流程
     */
    async startVerification() {
        console.log('🌐 啟動智慧瀏覽器驗證系統');
        console.log('=' .repeat(50));

        try {
            // 1. 檢查伺服器狀態
            await this.checkServerHealth();
            
            // 2. 啟動瀏覽器
            await this.launchBrowser();
            
            // 3. 執行功能測試
            await this.performFunctionalTests();
            
            // 4. 執行效能測試
            await this.performPerformanceTests();
            
            // 5. 生成驗證報告
            await this.generateVerificationReport();
            
            console.log('✅ 瀏覽器驗證完成！');
            
        } catch (error) {
            console.error('❌ 驗證過程發生錯誤:', error.message);
            throw error;
        }
    }

    /**
     * 🏥 檢查伺服器健康狀態
     */
    async checkServerHealth() {
        console.log('\n🏥 檢查伺服器健康狀態...');
        
        try {
            // 使用 Node.js 內建的 http 模組測試
            const http = require('http');
            
            const healthCheck = await new Promise((resolve, reject) => {
                const req = http.get(`${this.serverUrl}/health`, (res) => {
                    let data = '';
                    
                    res.on('data', chunk => {
                        data += chunk;
                    });
                    
                    res.on('end', () => {
                        try {
                            const response = JSON.parse(data);
                            resolve({
                                statusCode: res.statusCode,
                                data: response
                            });
                        } catch (error) {
                            reject(new Error('回應格式不正確'));
                        }
                    });
                });
                
                req.on('error', reject);
                req.setTimeout(5000, () => {
                    req.destroy();
                    reject(new Error('請求超時'));
                });
            });

            if (healthCheck.statusCode === 200 && healthCheck.data.success) {
                console.log('✅ 伺服器健康檢查通過');
                console.log(`📊 系統運行時間: ${Math.floor(healthCheck.data.data.uptime)} 秒`);
                
                this.addTestResult('伺服器健康檢查', 'passed', {
                    statusCode: healthCheck.statusCode,
                    uptime: healthCheck.data.data.uptime,
                    memory: healthCheck.data.data.memory
                });
                
                return healthCheck.data;
            } else {
                throw new Error('健康檢查失敗');
            }
            
        } catch (error) {
            console.error('❌ 伺服器健康檢查失敗:', error.message);
            this.addTestResult('伺服器健康檢查', 'failed', { error: error.message });
            throw error;
        }
    }

    /**
     * 🌐 啟動瀏覽器
     */
    async launchBrowser() {
        console.log('\n🌐 啟動瀏覽器進行測試...');
        
        // 嘗試不同的瀏覽器啟動方式
        const browserCommands = [
            'start chrome', // Windows
            'google-chrome', // Linux
            'open -a "Google Chrome"' // macOS
        ];
        
        let browserLaunched = false;
        
        for (const command of browserCommands) {
            try {
                console.log(`🔄 嘗試啟動瀏覽器: ${command}`);
                
                await new Promise((resolve, reject) => {
                    exec(`${command} ${this.serverUrl}`, (error) => {
                        if (error && error.code !== 0 && !error.message.includes('Warning')) {
                            reject(error);
                        } else {
                            resolve();
                        }
                    });
                });
                
                browserLaunched = true;
                console.log('✅ 瀏覽器啟動成功');
                console.log(`🌐 已開啟: ${this.serverUrl}`);
                
                this.addTestResult('瀏覽器啟動', 'passed', { 
                    command: command,
                    url: this.serverUrl 
                });
                
                // 等待瀏覽器載入
                await this.delay(3000);
                break;
                
            } catch (error) {
                console.log(`⚠️ ${command} 啟動失敗: ${error.message}`);
            }
        }
        
        if (!browserLaunched) {
            console.log('⚠️ 無法自動啟動瀏覽器');
            console.log(`📖 請手動開啟瀏覽器並訪問: ${this.serverUrl}`);
            
            this.addTestResult('瀏覽器啟動', 'warning', { 
                message: '需要手動啟動瀏覽器' 
            });
        }
    }

    /**
     * 🧪 執行功能測試
     */
    async performFunctionalTests() {
        console.log('\n🧪 執行功能測試...');
        
        const tests = [
            {
                name: '主頁載入測試',
                url: '/',
                expected: { statusCode: 200, content: '企業員工管理系統' }
            },
            {
                name: '健康檢查API測試',
                url: '/health',
                expected: { statusCode: 200, json: true, success: true }
            },
            {
                name: '認證路由測試',
                url: '/api/auth/test',
                expected: { statusCode: 200, json: true }
            },
            {
                name: '打卡路由測試',
                url: '/api/attendance/test',
                expected: { statusCode: 200, json: true }
            },
            {
                name: '營收路由測試',
                url: '/api/revenue/test',
                expected: { statusCode: 200, json: true }
            },
            {
                name: '叫貨路由測試',
                url: '/api/orders/test',
                expected: { statusCode: 200, json: true }
            },
            {
                name: '排班路由測試',
                url: '/api/schedule/test',
                expected: { statusCode: 200, json: true }
            },
            {
                name: '升遷路由測試',
                url: '/api/promotion/test',
                expected: { statusCode: 200, json: true }
            },
            {
                name: '維修路由測試',
                url: '/api/maintenance/test',
                expected: { statusCode: 200, json: true }
            },
            {
                name: '管理員路由測試',
                url: '/api/admin/test',
                expected: { statusCode: 200, json: true }
            }
        ];

        for (const test of tests) {
            await this.performSingleTest(test);
            await this.delay(500); // 避免請求過於頻繁
        }

        console.log('✅ 功能測試完成');
    }

    /**
     * 🏃‍♂️ 執行效能測試
     */
    async performPerformanceTests() {
        console.log('\n🏃‍♂️ 執行效能測試...');
        
        const performanceTests = [
            {
                name: '主頁載入速度測試',
                url: '/',
                iterations: 5
            },
            {
                name: 'API回應速度測試',
                url: '/health',
                iterations: 10
            }
        ];

        for (const test of performanceTests) {
            await this.performPerformanceTest(test);
        }

        console.log('✅ 效能測試完成');
    }

    /**
     * 🧪 執行單一功能測試
     */
    async performSingleTest(testConfig) {
        const { name, url, expected } = testConfig;
        console.log(`  🔍 ${name}...`);
        
        try {
            const startTime = Date.now();
            const fullUrl = `${this.serverUrl}${url}`;
            const http = require('http');
            
            const result = await new Promise((resolve, reject) => {
                const req = http.get(fullUrl, (res) => {
                    let data = '';
                    
                    res.on('data', chunk => {
                        data += chunk;
                    });
                    
                    res.on('end', () => {
                        const duration = Date.now() - startTime;
                        resolve({
                            statusCode: res.statusCode,
                            data: data,
                            headers: res.headers,
                            duration: duration
                        });
                    });
                });
                
                req.on('error', reject);
                req.setTimeout(10000, () => {
                    req.destroy();
                    reject(new Error('請求超時'));
                });
            });

            // 驗證測試結果
            let testPassed = true;
            let details = { 
                statusCode: result.statusCode,
                duration: result.duration,
                responseSize: result.data.length
            };

            if (expected.statusCode && result.statusCode !== expected.statusCode) {
                testPassed = false;
                details.error = `狀態碼不符預期: ${result.statusCode} (預期: ${expected.statusCode})`;
            }

            if (expected.json) {
                try {
                    const jsonData = JSON.parse(result.data);
                    details.jsonValid = true;
                    details.response = jsonData;
                    
                    if (expected.success && !jsonData.success) {
                        testPassed = false;
                        details.error = 'API回應success字段為false';
                    }
                } catch (error) {
                    testPassed = false;
                    details.jsonValid = false;
                    details.error = 'JSON格式不正確';
                }
            }

            if (expected.content && !result.data.includes(expected.content)) {
                testPassed = false;
                details.error = `回應內容不包含預期文字: ${expected.content}`;
            }

            const status = testPassed ? 'passed' : 'failed';
            const icon = testPassed ? '✅' : '❌';
            
            console.log(`    ${icon} ${name} (${result.duration}ms)`);
            
            this.addTestResult(name, status, details);

        } catch (error) {
            console.log(`    ❌ ${name} - 錯誤: ${error.message}`);
            this.addTestResult(name, 'failed', { error: error.message });
        }
    }

    /**
     * ⚡ 執行效能測試
     */
    async performPerformanceTest(testConfig) {
        const { name, url, iterations } = testConfig;
        console.log(`  ⚡ ${name}...`);
        
        const times = [];
        const fullUrl = `${this.serverUrl}${url}`;
        
        for (let i = 0; i < iterations; i++) {
            try {
                const startTime = Date.now();
                const http = require('http');
                
                await new Promise((resolve, reject) => {
                    const req = http.get(fullUrl, (res) => {
                        let data = '';
                        res.on('data', chunk => data += chunk);
                        res.on('end', () => resolve());
                    });
                    req.on('error', reject);
                    req.setTimeout(5000, () => {
                        req.destroy();
                        reject(new Error('請求超時'));
                    });
                });
                
                const duration = Date.now() - startTime;
                times.push(duration);
                
            } catch (error) {
                console.log(`    ⚠️ 第 ${i + 1} 次測試失敗: ${error.message}`);
            }
        }

        if (times.length > 0) {
            const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
            const minTime = Math.min(...times);
            const maxTime = Math.max(...times);
            
            console.log(`    📊 平均回應時間: ${avgTime.toFixed(2)}ms`);
            console.log(`    ⚡ 最快: ${minTime}ms | 🐌 最慢: ${maxTime}ms`);
            
            // 效能評估
            let performanceGrade = 'excellent';
            if (avgTime > 500) performanceGrade = 'poor';
            else if (avgTime > 200) performanceGrade = 'fair';
            else if (avgTime > 100) performanceGrade = 'good';
            
            this.addTestResult(`${name} - 效能`, 'passed', {
                iterations: iterations,
                averageTime: parseFloat(avgTime.toFixed(2)),
                minTime: minTime,
                maxTime: maxTime,
                grade: performanceGrade,
                allTimes: times
            });
        } else {
            this.addTestResult(`${name} - 效能`, 'failed', { 
                error: '所有測試迭代都失敗' 
            });
        }
    }

    /**
     * 📊 生成驗證報告
     */
    async generateVerificationReport() {
        console.log('\n📊 生成驗證報告...');
        
        this.testResults.endTime = new Date().toISOString();
        this.testResults.duration = Date.now() - new Date(this.testResults.startTime).getTime();
        
        // 計算統計資料
        this.testResults.tests.forEach(test => {
            this.testResults.summary.total++;
            if (test.status === 'passed') this.testResults.summary.passed++;
            else if (test.status === 'failed') this.testResults.summary.failed++;
            else if (test.status === 'warning') this.testResults.summary.warnings++;
        });

        // 計算成功率
        const successRate = ((this.testResults.summary.passed / this.testResults.summary.total) * 100).toFixed(1);
        this.testResults.summary.successRate = parseFloat(successRate);

        // 生成報告文件
        const reportPath = path.join(__dirname, 'browser-verification-report.json');
        await fs.writeFile(reportPath, JSON.stringify(this.testResults, null, 2));
        
        // 生成 Markdown 報告
        const markdownReport = this.generateMarkdownReport();
        const mdReportPath = path.join(__dirname, 'browser-verification-report.md');
        await fs.writeFile(mdReportPath, markdownReport);

        // 顯示報告摘要
        console.log('\n📋 驗證報告摘要');
        console.log('=' .repeat(40));
        console.log(`📊 總測試數: ${this.testResults.summary.total}`);
        console.log(`✅ 通過: ${this.testResults.summary.passed}`);
        console.log(`❌ 失敗: ${this.testResults.summary.failed}`);
        console.log(`⚠️ 警告: ${this.testResults.summary.warnings}`);
        console.log(`📈 成功率: ${successRate}%`);
        console.log(`⏱️ 執行時間: ${Math.round(this.testResults.duration / 1000)}秒`);
        console.log('\n📄 詳細報告已保存:');
        console.log(`  📋 JSON: ${reportPath}`);
        console.log(`  📝 Markdown: ${mdReportPath}`);

        return this.testResults;
    }

    /**
     * 📝 生成 Markdown 報告
     */
    generateMarkdownReport() {
        const { summary, tests, startTime, endTime, duration } = this.testResults;
        
        let markdown = `# 🌐 智慧瀏覽器驗證報告\n\n`;
        markdown += `**生成時間**: ${new Date().toLocaleString('zh-TW')}\n`;
        markdown += `**測試開始**: ${new Date(startTime).toLocaleString('zh-TW')}\n`;
        markdown += `**測試結束**: ${new Date(endTime).toLocaleString('zh-TW')}\n`;
        markdown += `**執行時間**: ${Math.round(duration / 1000)}秒\n\n`;

        // 摘要統計
        markdown += `## 📊 測試摘要\n\n`;
        markdown += `| 指標 | 數值 |\n`;
        markdown += `|------|------|\n`;
        markdown += `| 總測試數 | ${summary.total} |\n`;
        markdown += `| ✅ 通過 | ${summary.passed} |\n`;
        markdown += `| ❌ 失敗 | ${summary.failed} |\n`;
        markdown += `| ⚠️ 警告 | ${summary.warnings} |\n`;
        markdown += `| 📈 成功率 | ${summary.successRate}% |\n\n`;

        // 測試結果明細
        markdown += `## 📋 測試結果明細\n\n`;
        
        tests.forEach((test, index) => {
            const icon = test.status === 'passed' ? '✅' : 
                        test.status === 'failed' ? '❌' : '⚠️';
            
            markdown += `### ${index + 1}. ${icon} ${test.name}\n\n`;
            markdown += `**狀態**: ${test.status}\n`;
            
            if (test.details) {
                if (test.details.duration) {
                    markdown += `**回應時間**: ${test.details.duration}ms\n`;
                }
                if (test.details.statusCode) {
                    markdown += `**HTTP狀態碼**: ${test.details.statusCode}\n`;
                }
                if (test.details.error) {
                    markdown += `**錯誤**: ${test.details.error}\n`;
                }
                if (test.details.averageTime) {
                    markdown += `**平均回應時間**: ${test.details.averageTime}ms\n`;
                    markdown += `**效能等級**: ${test.details.grade}\n`;
                }
            }
            
            markdown += `**執行時間**: ${new Date(test.timestamp).toLocaleString('zh-TW')}\n\n`;
        });

        // 建議和結論
        markdown += `## 💡 結論與建議\n\n`;
        
        if (summary.successRate >= 90) {
            markdown += `🎉 **優秀**: 系統運行狀況良好，所有核心功能正常。\n\n`;
        } else if (summary.successRate >= 70) {
            markdown += `✅ **良好**: 系統基本功能正常，建議修復失敗的測試項目。\n\n`;
        } else {
            markdown += `⚠️ **需要改進**: 發現多項問題，建議優先修復關鍵功能。\n\n`;
        }

        markdown += `### 建議事項\n\n`;
        
        if (summary.failed > 0) {
            markdown += `- 🔧 修復 ${summary.failed} 個失敗的測試項目\n`;
        }
        
        if (summary.warnings > 0) {
            markdown += `- ⚠️ 檢查 ${summary.warnings} 個警告項目\n`;
        }
        
        markdown += `- 📊 定期執行此驗證流程確保系統穩定性\n`;
        markdown += `- 🔍 監控系統效能指標，及時發現潛在問題\n`;
        markdown += `- 📱 在不同裝置和瀏覽器上進行更全面的測試\n\n`;

        markdown += `---\n\n`;
        markdown += `*此報告由智慧瀏覽器驗證系統自動生成*\n`;

        return markdown;
    }

    /**
     * 📝 添加測試結果
     */
    addTestResult(name, status, details = null) {
        this.testResults.tests.push({
            name: name,
            status: status,
            details: details,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * ⏱️ 延遲函數
     */
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 匯出模組
module.exports = IntelligentBrowserVerification;

// 如果直接執行此檔案
if (require.main === module) {
    const verification = new IntelligentBrowserVerification();
    
    verification.startVerification()
        .then((results) => {
            console.log('🎉 驗證流程完成！');
            
            if (results.summary.successRate >= 80) {
                process.exit(0);
            } else {
                console.log('⚠️ 驗證成功率低於80%，請檢查失敗項目');
                process.exit(1);
            }
        })
        .catch((error) => {
            console.error('❌ 驗證流程失敗:', error);
            process.exit(1);
        });
}