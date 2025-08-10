#!/usr/bin/env node

/**
 * 端到端業務流程測試執行腳本
 * 整合 Telegram 通知和完整報告生成
 */

const { CompleteBussinesProcessTester } = require('./complete-business-process-tester');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

class E2ETestRunner {
    constructor() {
        this.configPath = path.join(__dirname, 'e2e-test-config.json');
        this.config = this.loadConfig();
        this.startTime = new Date();
        this.testResults = null;
    }

    loadConfig() {
        try {
            if (fs.existsSync(this.configPath)) {
                return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
            } else {
                console.log('⚠️ 配置檔案不存在，使用默認配置');
                return this.getDefaultConfig();
            }
        } catch (error) {
            console.error('❌ 載入配置檔案失敗:', error);
            return this.getDefaultConfig();
        }
    }

    getDefaultConfig() {
        return {
            testConfig: {
                baseURL: 'https://employee-management-production-4c97.up.railway.app',
                timeout: 30000,
                headless: false
            },
            notifications: {
                telegram: {
                    enabled: true,
                    botToken: '7659930552:AAF_jF1rAXFnjFO176-9X5fKfBwbrko8BNc',
                    chatId: '-1002658082392'
                }
            }
        };
    }

    async sendTelegramNotification(message, type = 'info') {
        try {
            const telegramConfig = this.config.notifications?.telegram;
            if (!telegramConfig?.enabled) {
                console.log('📱 Telegram 通知已停用');
                return false;
            }

            const { botToken, chatId } = telegramConfig;
            if (!botToken || !chatId) {
                console.log('⚠️ Telegram 配置不完整');
                return false;
            }

            const emoji = {
                'info': '💡',
                'success': '✅', 
                'warning': '⚠️',
                'error': '❌',
                'start': '🚀',
                'complete': '🎉'
            };

            const formattedMessage = `${emoji[type] || '📋'} **端到端業務流程測試**\n\n${message}`;

            const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
            const response = await axios.post(url, {
                chat_id: chatId,
                text: formattedMessage,
                parse_mode: 'Markdown',
                disable_web_page_preview: true
            }, {
                timeout: 10000
            });

            if (response.data.ok) {
                console.log('✅ Telegram 通知發送成功');
                return true;
            } else {
                console.error('❌ Telegram 通知發送失敗:', response.data);
                return false;
            }

        } catch (error) {
            console.error('❌ 發送 Telegram 通知時發生錯誤:', error.message);
            return false;
        }
    }

    async runTests() {
        console.log('\n🚀 啟動端到端業務流程測試執行器');
        console.log('=' .repeat(60));

        try {
            // 發送開始通知
            await this.sendTelegramNotification(
                `測試開始執行\n` +
                `🌐 **測試環境**: ${this.config.testConfig.baseURL}\n` +
                `⏰ **開始時間**: ${this.startTime.toLocaleString('zh-TW')}\n` +
                `🔧 **測試模式**: 完整業務流程驗證\n\n` +
                `正在執行以下測試類別:\n` +
                `• 👤 用戶旅程測試 (訪客/員工/管理員)\n` +
                `• ⚡ 核心業務邏輯驗證\n` +
                `• 🔄 系統整合測試\n` +
                `• ⚠️ 異常情況處理\n` +
                `• 🔒 效能和安全測試`,
                'start'
            );

            // 創建測試器實例
            const tester = new CompleteBussinesProcessTester();
            
            // 設定配置
            if (this.config.testConfig.baseURL) {
                tester.baseURL = this.config.testConfig.baseURL;
            }
            if (this.config.testConfig.timeout) {
                tester.testConfig.timeout = this.config.testConfig.timeout;
            }

            // 執行測試
            console.log('🔧 初始化測試環境...');
            const initialized = await tester.initialize();
            if (!initialized) {
                throw new Error('測試環境初始化失敗');
            }

            console.log('▶️ 開始執行測試...');
            await tester.runCompleteTest();

            // 獲取測試結果
            this.testResults = tester.testResults;
            const endTime = new Date();
            const duration = Math.round((endTime - this.startTime) / 1000);

            // 生成測試報告摘要
            const summary = this.generateTestSummary(duration);
            
            // 發送完成通知
            await this.sendTelegramNotification(summary, 'complete');

            // 清理資源
            await tester.cleanup();

            console.log('\n🎉 端到端業務流程測試執行完成!');
            return true;

        } catch (error) {
            console.error('❌ 測試執行失敗:', error);
            
            // 發送錯誤通知
            await this.sendTelegramNotification(
                `測試執行失敗\n\n` +
                `❌ **錯誤訊息**: ${error.message}\n` +
                `⏰ **失敗時間**: ${new Date().toLocaleString('zh-TW')}\n` +
                `📊 **執行時間**: ${Math.round((new Date() - this.startTime) / 1000)} 秒\n\n` +
                `請檢查測試日誌以獲取詳細錯誤資訊`,
                'error'
            );

            return false;
        }
    }

    generateTestSummary(duration) {
        if (!this.testResults) {
            return '測試結果無法獲取';
        }

        try {
            // 計算統計數據
            const stats = this.calculateTestStats();
            
            // 識別關鍵問題
            const criticalIssues = this.identifyCriticalIssues();
            
            // 計算整體健康度
            const healthScore = stats.totalTests > 0 ? 
                (stats.passedTests / stats.totalTests * 100).toFixed(1) : 0;

            // 生成摘要訊息
            let summary = `**端到端業務流程測試完成報告**\n\n`;
            
            // 基本統計
            summary += `📊 **測試統計**:\n`;
            summary += `• 總測試項目: ${stats.totalTests}\n`;
            summary += `• 通過項目: ${stats.passedTests}\n`;
            summary += `• 失敗項目: ${stats.failedTests}\n`;
            summary += `• 通過率: ${((stats.passedTests / Math.max(stats.totalTests, 1)) * 100).toFixed(1)}%\n`;
            summary += `• 執行時間: ${duration} 秒\n\n`;

            // 整體健康度
            const healthStatus = healthScore >= 90 ? '🟢 優秀' :
                                healthScore >= 75 ? '🟡 良好' :
                                healthScore >= 50 ? '🟠 一般' : '🔴 需改善';
            summary += `🏥 **整體健康度**: ${healthScore}% (${healthStatus})\n\n`;

            // 各模組狀態
            summary += `📋 **模組測試狀態**:\n`;
            summary += `• 👤 用戶旅程: ${this.getModuleStatus('userJourney')}\n`;
            summary += `• ⚡ 業務邏輯: ${this.getModuleStatus('businessLogic')}\n`;
            summary += `• 🔄 系統整合: ${this.getModuleStatus('systemIntegration')}\n`;
            summary += `• ⚠️ 異常處理: ${this.getModuleStatus('exceptionHandling')}\n`;
            summary += `• 🔒 效能安全: ${this.getModuleStatus('performanceAndSecurity')}\n\n`;

            // 關鍵問題
            if (criticalIssues.length > 0) {
                summary += `🚨 **關鍵問題** (${criticalIssues.length} 項):\n`;
                criticalIssues.slice(0, 3).forEach((issue, index) => {
                    summary += `${index + 1}. ${issue}\n`;
                });
                if (criticalIssues.length > 3) {
                    summary += `... 及其他 ${criticalIssues.length - 3} 項問題\n`;
                }
                summary += `\n`;
            }

            // 建議行動
            summary += `💡 **建議行動**:\n`;
            if (stats.failedTests > stats.passedTests) {
                summary += `• 🔥 立即修復關鍵功能問題\n`;
                summary += `• 📞 通知開發團隊緊急處理\n`;
            } else if (criticalIssues.length > 0) {
                summary += `• ⚡ 優先處理已識別的關鍵問題\n`;
                summary += `• 🔍 深入調查失敗的測試項目\n`;
            } else {
                summary += `• ✅ 系統運行良好，繼續監控\n`;
                summary += `• 📈 考慮進一步的效能優化\n`;
            }

            // 報告檔案
            summary += `\n📄 **詳細報告**: 已生成完整的 HTML 和 JSON 報告檔案`;
            
            return summary;

        } catch (error) {
            console.error('生成測試摘要時發生錯誤:', error);
            return `測試完成，但生成摘要時發生錯誤: ${error.message}`;
        }
    }

    calculateTestStats() {
        const stats = { totalTests: 0, passedTests: 0, failedTests: 0 };

        const countResults = (obj) => {
            if (!obj || typeof obj !== 'object') return;

            Object.keys(obj).forEach(key => {
                const value = obj[key];
                
                if (typeof value === 'boolean') {
                    stats.totalTests++;
                    if (value) stats.passedTests++;
                    else stats.failedTests++;
                } else if (value && typeof value === 'object' && value.success !== undefined) {
                    stats.totalTests++;
                    if (value.success) stats.passedTests++;
                    else stats.failedTests++;
                } else if (value && typeof value === 'object') {
                    countResults(value);
                }
            });
        };

        const modules = ['userJourney', 'businessLogic', 'systemIntegration', 'exceptionHandling', 'performanceAndSecurity'];
        modules.forEach(moduleName => {
            if (this.testResults[moduleName]) {
                countResults(this.testResults[moduleName]);
            }
        });

        return stats;
    }

    getModuleStatus(moduleName) {
        const moduleResult = this.testResults[moduleName];
        if (!moduleResult) return '❓ 未測試';

        // 檢查模組中的成功/失敗狀態
        const checkSuccess = (obj) => {
            if (!obj || typeof obj !== 'object') return null;

            let passed = 0, total = 0;
            
            Object.keys(obj).forEach(key => {
                const value = obj[key];
                
                if (typeof value === 'boolean') {
                    total++;
                    if (value) passed++;
                } else if (value && typeof value === 'object' && value.success !== undefined) {
                    total++;
                    if (value.success) passed++;
                } else if (value && typeof value === 'object') {
                    const subResult = checkSuccess(value);
                    if (subResult) {
                        total += subResult.total;
                        passed += subResult.passed;
                    }
                }
            });

            return { passed, total };
        };

        const result = checkSuccess(moduleResult);
        if (!result || result.total === 0) return '❓ 無數據';

        const successRate = (result.passed / result.total) * 100;
        
        if (successRate >= 90) return '🟢 優秀';
        if (successRate >= 70) return '🟡 良好';
        if (successRate >= 50) return '🟠 一般';
        return '🔴 不佳';
    }

    identifyCriticalIssues() {
        const issues = [];

        try {
            // 檢查用戶旅程問題
            const userJourney = this.testResults.userJourney;
            if (userJourney) {
                if (userJourney.visitor && !userJourney.visitor.success) {
                    issues.push('訪客流程存在問題');
                }
                if (userJourney.employee && !userJourney.employee.success) {
                    issues.push('員工流程存在問題');
                }
                if (userJourney.admin && !userJourney.admin.success) {
                    issues.push('管理員流程存在問題');
                }
            }

            // 檢查業務邏輯問題
            const businessLogic = this.testResults.businessLogic;
            if (businessLogic) {
                if (businessLogic.employeeManagement && !businessLogic.employeeManagement.create) {
                    issues.push('員工創建功能失效');
                }
                if (businessLogic.attendanceSystem && !businessLogic.attendanceSystem.checkIn) {
                    issues.push('打卡功能異常');
                }
            }

            // 檢查系統整合問題
            const systemIntegration = this.testResults.systemIntegration;
            if (systemIntegration) {
                if (systemIntegration.database && !systemIntegration.database.connection) {
                    issues.push('數據庫連接問題');
                }
                if (systemIntegration.frontendBackend && !systemIntegration.frontendBackend.apiConnectivity) {
                    issues.push('API連通性問題');
                }
            }

            // 檢查安全問題
            const security = this.testResults.performanceAndSecurity?.securityProtection;
            if (security) {
                if (!security.xssProtection) {
                    issues.push('XSS防護不足');
                }
                if (!security.csrfProtection) {
                    issues.push('CSRF防護不足');
                }
            }

        } catch (error) {
            console.error('識別關鍵問題時發生錯誤:', error);
            issues.push('問題識別過程發生錯誤');
        }

        return issues;
    }
}

// 主執行函數
async function main() {
    console.log('🎯 端到端業務流程測試執行器');
    console.log('整合完整測試流程、結果分析和 Telegram 通知');
    
    const runner = new E2ETestRunner();
    
    try {
        const success = await runner.runTests();
        
        if (success) {
            console.log('✅ 測試執行成功完成');
            process.exit(0);
        } else {
            console.error('❌ 測試執行失敗');
            process.exit(1);
        }
        
    } catch (error) {
        console.error('❌ 執行器發生未預期錯誤:', error);
        process.exit(1);
    }
}

// 如果直接執行此檔案
if (require.main === module) {
    main().catch(error => {
        console.error('❌ 程式執行失敗:', error);
        process.exit(1);
    });
}

module.exports = { E2ETestRunner };