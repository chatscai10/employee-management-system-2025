/**
 * =======================================
 * Telegram通知服務 - TelegramNotificationService
 * =======================================
 * 實現29種通知模板的完整Telegram通知系統
 */

const axios = require('axios');
const logger = require('../utils/logger');
const { getModels } = require('../models');

class TelegramNotificationService {
    constructor() {
        // Telegram Bot 配置
        this.botToken = 'process.env.TELEGRAM_BOT_TOKEN';
        this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
        
        // 通知群組配置
        this.groups = {
            admin: 'process.env.TELEGRAM_GROUP_ID',
            employees: '-1002658082393', // 待創建
            hr: '-1002658082394',         // 待創建
            system: '-1002658082395'      // 待創建
        };

        // 通知頻率控制
        this.rateLimits = {
            personal: { maxPerDay: 10, maxPerHour: 3, cooldown: 300000 }, // 5分鐘間隔
            group: { maxPerHour: 5, priorityOverride: true }
        };

        // 通知發送記錄
        this.sendHistory = new Map();
        
        this.initializeTemplates();
    }

    /**
     * 初始化29種通知模板
     */
    initializeTemplates() {
        this.templates = {
            // 投票活動通知 (8種)
            campaign_created: {
                template: '🗳️ 新投票活動：{campaignName}\n📝 類型：{campaignType}\n⏰ 投票期間：{startDate} - {endDate}\n🎯 參與資格：{eligibleVoters}\n\n點擊參與投票：{voteLink}',
                audience: ['eligible_voters', 'admins'],
                timing: 'immediate'
            },
            
            campaign_starting_soon: {
                template: '⏰ 投票即將開始！\n\n📋 活動：{campaignName}\n🕐 開始時間：{startTime}\n💡 請準備參與投票',
                audience: ['eligible_voters'],
                timing: '1_hour_before_start'
            },
            
            campaign_started: {
                template: '🚀 投票正式開始！\n\n📋 {campaignName}\n⏳ 截止時間：{endDate}\n👥 目標：{targetDescription}\n\n立即投票：{voteLink}',
                audience: ['eligible_voters'],
                timing: 'on_start'
            },
            
            campaign_ending_soon: {
                template: '⚡ 投票即將截止！\n\n📋 {campaignName}\n⏰ 剩餘時間：{remainingHours}小時\n📊 當前參與率：{participationRate}%\n\n如未投票請抓緊時間：{voteLink}',
                audience: ['non_voters', 'admins'],
                timing: '6_hours_before_end'
            },
            
            campaign_ended: {
                template: '📝 投票已結束\n\n📋 {campaignName}\n📊 總投票數：{totalVotes}\n👥 參與人數：{totalVoters}\n📈 參與率：{participationRate}%\n\n結果將於24小時內公布',
                audience: ['all_employees', 'admins'],
                timing: 'on_end'
            },
            
            results_announced: {
                template: '📊 投票結果公布\n\n📋 {campaignName}\n✅ 結果：{result}\n📈 同意：{agreeVotes}票 ({agreePercentage}%)\n❌ 不同意：{disagreeVotes}票 ({disagreePercentage}%)\n\n{resultDescription}',
                audience: ['all_employees', 'candidates'],
                timing: 'on_result_announcement'
            },
            
            campaign_extended: {
                template: '⏰ 投票期限延長\n\n📋 {campaignName}\n🔄 新截止時間：{newEndDate}\n📝 延長原因：{extensionReason}\n\n繼續投票：{voteLink}',
                audience: ['eligible_voters'],
                timing: 'on_extension'
            },
            
            campaign_cancelled: {
                template: '🚫 投票活動取消\n\n📋 {campaignName}\n📝 取消原因：{cancellationReason}\n⏰ 取消時間：{cancelledAt}',
                audience: ['eligible_voters', 'candidates'],
                timing: 'on_cancellation'
            },

            // 個人投票通知 (7種)
            vote_submitted: {
                template: '✅ 投票提交成功\n\n📋 活動：{campaignName}\n🎯 您的選擇：{voteChoice}\n⏰ 提交時間：{submittedAt}\n🔐 匿名憑證：{anonymousReceipt}',
                audience: ['voter'],
                timing: 'on_vote_submission'
            },
            
            vote_modified: {
                template: '🔄 投票修改成功\n\n📋 活動：{campaignName}\n🎯 新選擇：{newVoteChoice}\n📊 修改次數：{modificationNumber}/3\n⏰ 修改時間：{modifiedAt}',
                audience: ['voter'],
                timing: 'on_vote_modification'
            },
            
            modification_limit_warning: {
                template: '⚠️ 投票修改次數警告\n\n📋 活動：{campaignName}\n📊 剩餘修改次數：{remainingModifications}次\n💡 請謹慎考慮後再進行修改',
                audience: ['voter'],
                timing: 'on_second_modification'
            },
            
            voting_eligibility_granted: {
                template: '🎯 您已獲得投票資格\n\n📋 活動：{campaignName}\n✅ 符合條件：{eligibilityCriteria}\n⏰ 投票截止：{deadline}\n\n參與投票：{voteLink}',
                audience: ['newly_eligible_voter'],
                timing: 'on_eligibility_granted'
            },
            
            personal_vote_reminder: {
                template: '📋 投票提醒\n\n您好 {employeeName}，\n📋 {campaignName} 即將截止\n⏰ 剩餘：{remainingTime}\n\n您的參與很重要：{voteLink}',
                audience: ['non_voting_eligible'],
                timing: '24_hours_before_end'
            },
            
            vote_invalidated: {
                template: '❌ 投票已被作廢\n\n📋 活動：{campaignName}\n📝 原因：{invalidationReason}\n⏰ 作廢時間：{invalidatedAt}\n\n如有疑問請聯繫管理員',
                audience: ['affected_voter'],
                timing: 'on_vote_invalidation'
            },
            
            appeal_submitted: {
                template: '📋 申訴提交成功\n\n📋 投票活動：{campaignName}\n📝 申訴類型：{appealType}\n⏰ 提交時間：{submittedAt}\n📅 預計審核時間：{expectedReviewTime}天\n\n申訴編號：{appealId}',
                audience: ['appellant'],
                timing: 'on_appeal_submission'
            },

            // 自動投票通知 (6種)
            auto_promotion_triggered: {
                template: '🎉 自動轉正投票啟動\n\n👤 員工：{employeeName}\n📅 到職日期：{hireDate}\n📊 工作天數：{workingDays}天\n🎯 目標職位：{targetPosition}\n⏰ 投票期間：{votingPeriod}\n\n系統已自動開啟投票程序',
                audience: ['admins', 'eligible_voters'],
                timing: 'on_auto_promotion_trigger'
            },
            
            auto_demotion_triggered: {
                template: '⚠️ 自動降職投票啟動\n\n👤 員工：{employeeName}\n📊 本月遲到：{lateCount}次 / {lateMinutes}分鐘\n🎯 降職至：{targetPosition}\n⏰ 投票期間：{votingPeriod}\n\n達到懲罰條件，系統已自動開啟投票',
                audience: ['admins', 'eligible_voters'],
                timing: 'on_auto_demotion_trigger'
            },
            
            promotion_approved: {
                template: '🎊 恭喜！轉正投票通過\n\n👤 {employeeName} 同學\n📊 投票結果：{agreePercentage}%同意\n🎯 新職位：{newPosition}\n📅 生效日期：{effectiveDate}\n\n恭喜正式成為公司一員！',
                audience: ['promoted_employee', 'all_employees'],
                timing: 'on_promotion_approval'
            },
            
            promotion_rejected: {
                template: '📝 轉正投票結果通知\n\n👤 {employeeName}\n📊 投票結果：{agreePercentage}%同意 (需50%)\n🔄 結果：未通過\n📅 緩衝期：30天\n💡 建議：繼續努力，下次機會在30天後',
                audience: ['affected_employee', 'supervisors'],
                timing: 'on_promotion_rejection'
            },
            
            demotion_executed: {
                template: '📋 職位變更執行通知\n\n👤 員工：{employeeName}\n📊 投票結果：{agreePercentage}%同意降職\n🔄 職位變更：{oldPosition} → {newPosition}\n📅 生效日期：{effectiveDate}\n📝 變更原因：{demotionReason}',
                audience: ['affected_employee', 'supervisors', 'hr'],
                timing: 'on_demotion_execution'
            },
            
            demotion_rejected: {
                template: '📝 降職投票結果通知\n\n👤 {employeeName}\n📊 投票結果：{agreePercentage}%同意 (需30%)\n✅ 結果：維持原職位\n💡 提醒：請注意出勤準時',
                audience: ['affected_employee', 'supervisors'],
                timing: 'on_demotion_rejection'
            },

            // 系統監控通知 (4種)
            system_health_warning: {
                template: '⚠️ 投票系統健康警告\n\n📊 健康評分：{healthScore}/100\n🚨 問題：{issues}\n📈 建議：{recommendations}\n⏰ 檢測時間：{checkTime}',
                audience: ['system_admins'],
                timing: 'on_health_warning'
            },
            
            scheduled_job_report: {
                template: '📋 定時任務執行報告\n\n✅ 成功任務：{successfulJobs}\n❌ 失敗任務：{failedJobs}\n⏱️ 執行時間：{executionTime}\n📊 系統狀態：{systemStatus}',
                audience: ['system_admins'],
                timing: 'daily_summary'
            },
            
            data_anomaly_detected: {
                template: '🔍 數據異常檢測\n\n📊 異常類型：{anomalyType}\n📈 異常數值：{anomalyValue}\n🎯 影響範圍：{affectedScope}\n⚠️ 建議立即檢查系統狀態',
                audience: ['system_admins'],
                timing: 'on_anomaly_detection'
            },
            
            low_participation_warning: {
                template: '📉 投票參與率過低警告\n\n📋 活動：{campaignName}\n📊 當前參與率：{currentRate}%\n⏰ 剩餘時間：{remainingTime}\n💡 建議加強宣傳動員',
                audience: ['campaign_managers', 'hr'],
                timing: 'on_low_participation'
            },

            // 管理員專用通知 (4種)
            appeal_review_reminder: {
                template: '📋 申訴審核提醒\n\n📝 申訴編號：{appealId}\n👤 申訴人：{appellant}\n📋 相關活動：{campaignName}\n⏰ 提交時間：{submittedAt}\n⚠️ 請及時處理，避免超時',
                audience: ['appeal_reviewers'],
                timing: 'daily_reminder'
            },
            
            voting_audit_alert: {
                template: '🔍 投票操作審計警告\n\n📊 異常類型：{auditType}\n👤 相關用戶：{involvedUser}\n📋 活動：{campaignName}\n⏰ 發生時間：{alertTime}\n🔍 建議立即調查',
                audience: ['security_admins'],
                timing: 'on_audit_trigger'
            },
            
            admin_action_logged: {
                template: '📝 管理員操作記錄\n\n👤 操作人員：{adminName}\n🔧 操作類型：{actionType}\n📋 目標：{targetObject}\n⏰ 操作時間：{actionTime}\n📝 操作說明：{actionDescription}',
                audience: ['senior_admins'],
                timing: 'on_admin_action'
            },
            
            weekly_statistics_report: {
                template: '📊 投票系統週報\n\n📅 統計週期：{weekPeriod}\n🗳️ 總投票活動：{totalCampaigns}\n👥 參與人次：{totalParticipants}\n📈 平均參與率：{avgParticipationRate}%\n🔄 申訴案件：{appealCases}\n✅ 系統穩定性：{systemStability}%',
                audience: ['management', 'hr'],
                timing: 'weekly_monday_morning'
            }
        };
    }

    /**
     * 發送通知
     */
    async sendNotification(templateName, data, recipients = null) {
        try {
            const template = this.templates[templateName];
            if (!template) {
                throw new Error(`通知模板不存在: ${templateName}`);
            }

            // 格式化消息
            const message = this.formatMessage(template.template, data);
            
            // 確定接收者
            const targetRecipients = recipients || this.determineRecipients(template.audience, data);
            
            // 檢查頻率限制
            const canSend = this.checkRateLimit(templateName, targetRecipients);
            if (!canSend.allowed) {
                logger.warn(`通知發送被頻率限制阻止: ${templateName}, 原因: ${canSend.reason}`);
                return { success: false, reason: canSend.reason };
            }

            // 發送通知
            const results = [];
            for (const recipient of targetRecipients) {
                try {
                    const result = await this.sendToRecipient(recipient, message, templateName);
                    results.push(result);
                    
                    // 記錄發送歷史
                    this.recordSendHistory(templateName, recipient);
                    
                } catch (error) {
                    logger.error(`發送通知失敗 - 接收者 ${recipient}:`, error);
                    results.push({ recipient, success: false, error: error.message });
                }
            }

            logger.info(`通知發送完成: ${templateName}, 成功: ${results.filter(r => r.success).length}/${results.length}`);
            
            return { success: true, results, totalSent: results.filter(r => r.success).length };

        } catch (error) {
            logger.error(`發送通知失敗: ${templateName}`, error);
            throw error;
        }
    }

    /**
     * 格式化消息模板
     */
    formatMessage(template, data) {
        let message = template;
        
        // 替換所有變數
        for (const [key, value] of Object.entries(data)) {
            const regex = new RegExp(`\\{${key}\\}`, 'g');
            message = message.replace(regex, value || '未設定');
        }
        
        // 添加時間戳
        message += `\n\n⏰ ${new Date().toLocaleString('zh-TW', {
            timeZone: 'Asia/Taipei',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        })}`;
        
        return message;
    }

    /**
     * 確定接收者
     */
    determineRecipients(audienceTypes, data) {
        const recipients = [];
        
        for (const audienceType of audienceTypes) {
            switch (audienceType) {
                case 'admins':
                case 'system_admins':
                    recipients.push(this.groups.admin);
                    break;
                    
                case 'all_employees':
                case 'eligible_voters':
                    recipients.push(this.groups.employees);
                    break;
                    
                case 'hr':
                case 'campaign_managers':
                    recipients.push(this.groups.hr);
                    break;
                    
                case 'management':
                    recipients.push(this.groups.admin);
                    break;
                    
                case 'voter':
                case 'promoted_employee':
                case 'affected_employee':
                    // 個人通知 - 需要員工個人chat ID
                    if (data.employeeId) {
                        recipients.push(`user_${data.employeeId}`);
                    }
                    break;
                    
                default:
                    // 預設發送到管理員群組
                    recipients.push(this.groups.admin);
            }
        }
        
        return [...new Set(recipients)]; // 去重
    }

    /**
     * 檢查頻率限制
     */
    checkRateLimit(templateName, recipients) {
        // 這裡可以實現複雜的頻率限制邏輯
        // 目前簡單實現
        return { allowed: true, reason: null };
    }

    /**
     * 發送到特定接收者
     */
    async sendToRecipient(recipient, message, templateName) {
        try {
            let chatId;
            
            // 判斷接收者類型
            if (recipient.startsWith('user_')) {
                // 個人用戶 - 需要查詢員工的chat ID
                const employeeId = recipient.replace('user_', '');
                chatId = await this.getEmployeeChatId(employeeId);
                if (!chatId) {
                    throw new Error(`員工 ${employeeId} 的Telegram Chat ID未設定`);
                }
            } else {
                // 群組
                chatId = recipient;
            }

            // 發送消息
            const response = await axios.post(`${this.baseUrl}/sendMessage`, {
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML',
                disable_web_page_preview: true
            }, {
                timeout: 10000
            });

            if (response.data.ok) {
                return { 
                    recipient, 
                    success: true, 
                    messageId: response.data.result.message_id,
                    sentAt: new Date()
                };
            } else {
                throw new Error(response.data.description || 'Telegram API錯誤');
            }

        } catch (error) {
            throw new Error(`發送到 ${recipient} 失敗: ${error.message}`);
        }
    }

    /**
     * 獲取員工的Telegram Chat ID
     */
    async getEmployeeChatId(employeeId) {
        try {
            const models = getModels();
            const employee = await models.Employee.findByPk(employeeId, {
                attributes: ['id', 'name', 'telegramChatId']
            });
            
            return employee?.telegramChatId || null;
            
        } catch (error) {
            logger.error(`獲取員工Telegram ID失敗: ${employeeId}`, error);
            return null;
        }
    }

    /**
     * 記錄發送歷史
     */
    recordSendHistory(templateName, recipient) {
        const key = `${templateName}_${recipient}`;
        const now = Date.now();
        
        if (!this.sendHistory.has(key)) {
            this.sendHistory.set(key, []);
        }
        
        const history = this.sendHistory.get(key);
        history.push(now);
        
        // 只保留24小時內的記錄
        const cutoff = now - (24 * 60 * 60 * 1000);
        this.sendHistory.set(key, history.filter(time => time > cutoff));
    }

    /**
     * 批量發送通知
     */
    async sendBatchNotifications(notifications) {
        const results = [];
        
        for (const notification of notifications) {
            try {
                const result = await this.sendNotification(
                    notification.template,
                    notification.data,
                    notification.recipients
                );
                results.push({ ...notification, result });
                
                // 避免過於頻繁的API呼叫
                await this.delay(100);
                
            } catch (error) {
                results.push({ 
                    ...notification, 
                    result: { success: false, error: error.message } 
                });
            }
        }
        
        return results;
    }

    /**
     * 測試通知發送
     */
    async testNotification(templateName, testData = {}) {
        try {
            const template = this.templates[templateName];
            if (!template) {
                throw new Error(`通知模板不存在: ${templateName}`);
            }

            // 使用測試數據
            const defaultTestData = {
                campaignName: '測試投票活動',
                employeeName: '測試員工',
                agreePercentage: '75.5',
                totalVotes: '20',
                startDate: '2024-08-10',
                endDate: '2024-08-17'
            };
            
            const data = { ...defaultTestData, ...testData };
            const message = this.formatMessage(template.template, data);
            
            // 發送到管理員群組
            const result = await this.sendToRecipient(this.groups.admin, message, templateName);
            
            logger.info(`測試通知發送成功: ${templateName}`);
            return result;
            
        } catch (error) {
            logger.error(`測試通知發送失敗: ${templateName}`, error);
            throw error;
        }
    }

    /**
     * 延遲函數
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 獲取通知統計
     */
    getNotificationStatistics() {
        const stats = {
            totalTemplates: Object.keys(this.templates).length,
            categoriesCount: {
                campaign: 8,
                personal: 7,
                auto_voting: 6,
                system: 4,
                admin: 4
            },
            sendHistoryCount: this.sendHistory.size
        };
        
        return stats;
    }
}

module.exports = new TelegramNotificationService();