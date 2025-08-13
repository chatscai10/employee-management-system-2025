#!/usr/bin/env node

/**
 * Telegram飛機彙報診斷修復系統
 * 檢查並修復Telegram通知未送達問題
 */

const https = require('https');

class TelegramDiagnosisRepair {
    constructor() {
        // 原配置
        this.originalConfig = {
            botToken: 'process.env.TELEGRAM_BOT_TOKEN',
            groupId: 'process.env.TELEGRAM_GROUP_ID'
        };
        
        // 測試用的替代配置（如需要）
        this.testConfigs = [
            {
                name: '原始配置',
                botToken: 'process.env.TELEGRAM_BOT_TOKEN',
                groupId: 'process.env.TELEGRAM_GROUP_ID'
            },
            {
                name: '測試用私人聊天',
                botToken: 'process.env.TELEGRAM_BOT_TOKEN',
                groupId: '7659930552' // Bot自己的ID用於測試
            }
        ];
    }

    /**
     * 測試Bot Token有效性
     */
    async testBotToken(botToken) {
        console.log('🤖 測試Bot Token有效性...');
        
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'api.telegram.org',
                port: 443,
                path: `/bot${botToken}/getMe`,
                method: 'GET'
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        console.log(`📋 Bot資訊: ${JSON.stringify(response, null, 2)}`);
                        resolve(response);
                    } catch (error) {
                        reject(new Error(`解析響應失敗: ${error.message}`));
                    }
                });
            });

            req.on('error', reject);
            req.end();
        });
    }

    /**
     * 測試群組ID有效性
     */
    async testGroupId(botToken, groupId) {
        console.log(`📱 測試群組ID ${groupId} 有效性...`);
        
        return new Promise((resolve, reject) => {
            const testMessage = `🧪 測試訊息 - ${new Date().toLocaleString('zh-TW')}`;
            
            const postData = JSON.stringify({
                chat_id: groupId,
                text: testMessage
            });

            const options = {
                hostname: 'api.telegram.org',
                port: 443,
                path: `/bot${botToken}/sendMessage`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        console.log(`📋 發送結果: ${JSON.stringify(response, null, 2)}`);
                        resolve(response);
                    } catch (error) {
                        reject(new Error(`解析響應失敗: ${error.message}`));
                    }
                });
            });

            req.on('error', reject);
            req.write(postData);
            req.end();
        });
    }

    /**
     * 獲取Bot的更新信息，檢查是否能收到訊息
     */
    async getBotUpdates(botToken) {
        console.log('📥 檢查Bot更新信息...');
        
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'api.telegram.org',
                port: 443,
                path: `/bot${botToken}/getUpdates`,
                method: 'GET'
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        console.log(`📋 更新信息: ${JSON.stringify(response, null, 2)}`);
                        resolve(response);
                    } catch (error) {
                        reject(new Error(`解析響應失敗: ${error.message}`));
                    }
                });
            });

            req.on('error', reject);
            req.end();
        });
    }

    /**
     * 完整診斷流程
     */
    async runCompleteDiagnosis() {
        console.log('🔍 開始Telegram飛機彙報系統完整診斷...\n');
        
        const results = {
            botTokenValid: false,
            groupAccessible: false,
            alternativeConfigs: [],
            recommendations: []
        };

        try {
            // 1. 測試Bot Token
            console.log('== 步驟1: Bot Token驗證 ==');
            const botInfo = await this.testBotToken(this.originalConfig.botToken);
            
            if (botInfo.ok) {
                console.log('✅ Bot Token有效');
                console.log(`🤖 Bot名稱: ${botInfo.result.username}`);
                console.log(`🆔 Bot ID: ${botInfo.result.id}`);
                results.botTokenValid = true;
            } else {
                console.log('❌ Bot Token無效');
                results.recommendations.push('需要重新申請有效的Bot Token');
                return results;
            }

            // 2. 測試原始群組ID
            console.log('\n== 步驟2: 群組存取測試 ==');
            try {
                const groupTest = await this.testGroupId(this.originalConfig.botToken, this.originalConfig.groupId);
                
                if (groupTest.ok) {
                    console.log('✅ 群組存取成功');
                    console.log(`📱 訊息ID: ${groupTest.result.message_id}`);
                    results.groupAccessible = true;
                } else {
                    console.log('❌ 群組存取失敗');
                    console.log(`錯誤: ${groupTest.description}`);
                    results.recommendations.push(`群組存取問題: ${groupTest.description}`);
                }
            } catch (error) {
                console.log(`❌ 群組存取異常: ${error.message}`);
                results.recommendations.push(`群組存取異常: ${error.message}`);
            }

            // 3. 檢查Bot更新
            console.log('\n== 步驟3: Bot更新信息檢查 ==');
            try {
                const updates = await this.getBotUpdates(this.originalConfig.botToken);
                if (updates.ok && updates.result.length > 0) {
                    console.log(`📥 找到 ${updates.result.length} 個更新`);
                    const latestUpdate = updates.result[updates.result.length - 1];
                    if (latestUpdate.message) {
                        console.log(`🕐 最新訊息時間: ${new Date(latestUpdate.message.date * 1000).toLocaleString('zh-TW')}`);
                    }
                } else {
                    console.log('📥 無更新信息');
                }
            } catch (error) {
                console.log(`⚠️ 無法獲取更新信息: ${error.message}`);
            }

            // 4. 測試替代配置
            console.log('\n== 步驟4: 替代配置測試 ==');
            for (const config of this.testConfigs.slice(1)) { // 跳過原始配置
                try {
                    console.log(`🔄 測試 ${config.name}...`);
                    const testResult = await this.testGroupId(config.botToken, config.groupId);
                    
                    if (testResult.ok) {
                        console.log(`✅ ${config.name} 測試成功`);
                        results.alternativeConfigs.push({
                            ...config,
                            working: true,
                            messageId: testResult.result.message_id
                        });
                    } else {
                        console.log(`❌ ${config.name} 測試失敗: ${testResult.description}`);
                        results.alternativeConfigs.push({
                            ...config,
                            working: false,
                            error: testResult.description
                        });
                    }
                } catch (error) {
                    console.log(`❌ ${config.name} 測試異常: ${error.message}`);
                    results.alternativeConfigs.push({
                        ...config,
                        working: false,
                        error: error.message
                    });
                }
            }

        } catch (error) {
            console.error('❌ 診斷過程發生錯誤:', error.message);
            results.error = error.message;
        }

        return results;
    }

    /**
     * 生成診斷報告
     */
    generateDiagnosisReport(results) {
        console.log('\n' + '='.repeat(60));
        console.log('📊 Telegram飛機彙報系統診斷報告');
        console.log('='.repeat(60));
        
        console.log(`🤖 Bot Token狀態: ${results.botTokenValid ? '✅ 有效' : '❌ 無效'}`);
        console.log(`📱 群組存取狀態: ${results.groupAccessible ? '✅ 可存取' : '❌ 無法存取'}`);
        
        if (results.recommendations.length > 0) {
            console.log('\n💡 問題診斷:');
            results.recommendations.forEach((rec, index) => {
                console.log(`   ${index + 1}. ${rec}`);
            });
        }
        
        if (results.alternativeConfigs.length > 0) {
            console.log('\n🔄 替代配置測試結果:');
            results.alternativeConfigs.forEach((config) => {
                const status = config.working ? '✅ 成功' : '❌ 失敗';
                console.log(`   ${config.name}: ${status}`);
                if (config.error) {
                    console.log(`      錯誤: ${config.error}`);
                }
                if (config.messageId) {
                    console.log(`      訊息ID: ${config.messageId}`);
                }
            });
        }

        console.log('\n🔧 修復建議:');
        if (!results.botTokenValid) {
            console.log('   1. ❌ Bot Token無效，需要重新申請');
            console.log('      - 前往 @BotFather 重新申請Token');
        } else if (!results.groupAccessible) {
            console.log('   1. ❌ 無法存取群組，可能原因:');
            console.log('      - Bot未被加入群組');
            console.log('      - 群組ID錯誤');
            console.log('      - Bot權限不足');
            console.log('      - 群組被刪除或不存在');
        } else {
            console.log('   1. ✅ Telegram配置正常');
            console.log('      - 檢查網路連接');
            console.log('      - 確認飛機彙報腳本執行');
        }

        console.log('='.repeat(60));
    }

    /**
     * 發送修復確認訊息
     */
    async sendRepairConfirmation() {
        if (!this.originalConfig.botToken || !this.originalConfig.groupId) {
            console.log('❌ 配置不完整，無法發送確認訊息');
            return false;
        }

        const confirmationMessage = `🔧 Telegram飛機彙報系統修復確認

📊 診斷結果:
✅ Bot Token: 有效
✅ 群組存取: 正常
✅ 訊息發送: 成功

🎯 修復內容:
- 重新驗證Telegram配置
- 測試訊息發送功能
- 確認群組權限設定

⏰ 測試時間: ${new Date().toLocaleString('zh-TW')}

🚀 /pro智慧自適應強化模式飛機彙報系統已恢復正常！`;

        try {
            const result = await this.testGroupId(this.originalConfig.botToken, this.originalConfig.groupId);
            if (result.ok) {
                console.log('✅ 修復確認訊息發送成功');
                console.log(`📱 訊息ID: ${result.result.message_id}`);
                return true;
            } else {
                console.log('❌ 修復確認訊息發送失敗');
                return false;
            }
        } catch (error) {
            console.log(`❌ 發送確認訊息時發生錯誤: ${error.message}`);
            return false;
        }
    }
}

// 主要執行函數
async function main() {
    console.log('🚀 啟動Telegram飛機彙報診斷修復系統...\n');
    
    const diagnosis = new TelegramDiagnosisRepair();
    
    try {
        // 執行完整診斷
        const results = await diagnosis.runCompleteDiagnosis();
        
        // 生成診斷報告
        diagnosis.generateDiagnosisReport(results);
        
        // 如果配置正常，發送修復確認
        if (results.botTokenValid && results.groupAccessible) {
            console.log('\n🔧 發送修復確認訊息...');
            await diagnosis.sendRepairConfirmation();
        }
        
        return results;
        
    } catch (error) {
        console.error('❌ 診斷系統執行失敗:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// 如果直接執行此腳本，運行診斷
if (require.main === module) {
    main().catch(console.error);
}

module.exports = TelegramDiagnosisRepair;