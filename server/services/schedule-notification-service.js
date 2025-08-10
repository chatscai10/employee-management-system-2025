/**
 * ===================================
 * 排班通知服務 - Schedule Notification Service
 * ===================================
 * 實現排班系統的各種通知功能
 */

const logger = require('../utils/logger');
const { getModels } = require('../models');

class ScheduleNotificationService {
    
    /**
     * 🎯 發送排班提交完成通知
     * @param {Object} scheduleData 排班數據
     * @param {string} scheduleData.employeeName 員工姓名
     * @param {number} scheduleData.year 年份
     * @param {number} scheduleData.month 月份
     * @param {number} scheduleData.totalOffDays 總休假天數
     * @param {number} scheduleData.weekendOffDays 週末休假天數
     * @param {Array} scheduleData.offDates 休假日期陣列
     */
    static async sendScheduleCompletedNotification(scheduleData) {
        try {
            const { employeeName, year, month, totalOffDays, weekendOffDays, offDates } = scheduleData;
            
            // 計算工作天數
            const daysInMonth = new Date(year, month, 0).getDate();
            const workDays = daysInMonth - totalOffDays;
            
            // 格式化休假日期顯示
            const formattedDates = offDates.map(date => {
                const d = new Date(date);
                const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
                return `${d.getDate()}日(${dayNames[d.getDay()]})`;
            }).join(', ');

            const message = `
✅ 排班提交完成通知

👤 員工: ${employeeName}
📅 期間: ${year}年${month}月
📊 排班統計:
   • 總休假: ${totalOffDays}天
   • 工作日: ${workDays}天  
   • 週末休假: ${weekendOffDays}天

🗓️ 休假日期:
${formattedDates}

⏰ 提交時間: ${new Date().toLocaleString('zh-TW')}
✨ 狀態: 已完成
            `.trim();

            // 記錄通知日誌
            logger.info('📨 排班完成通知', {
                type: 'schedule_completed',
                employeeName,
                period: `${year}-${month}`,
                totalOffDays,
                weekendOffDays,
                workDays
            });

            // 這裡可以整合實際的通知系統 (Telegram, Email, 等)
            console.log('\n🔔 排班完成通知:');
            console.log(message);
            console.log('=' .repeat(50));

            return {
                success: true,
                message: '排班完成通知已發送',
                data: {
                    employeeName,
                    period: `${year}-${month}`,
                    notificationType: 'schedule_completed',
                    sentAt: new Date().toISOString()
                }
            };

        } catch (error) {
            logger.error('發送排班完成通知失敗:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 🚨 發送排班衝突警告通知
     * @param {Object} conflictData 衝突數據
     * @param {Array} conflictData.conflicts 衝突列表
     * @param {number} conflictData.year 年份
     * @param {number} conflictData.month 月份
     */
    static async sendScheduleConflictAlert(conflictData) {
        try {
            const { conflicts, year, month } = conflictData;

            if (!conflicts || conflicts.length === 0) {
                return {
                    success: true,
                    message: '無衝突需要通知'
                };
            }

            // 按衝突類型分組
            const conflictsByType = {
                too_many_off: conflicts.filter(c => c.type === 'too_many_off'),
                store_conflict: conflicts.filter(c => c.type === 'store_conflict'),
                position_conflict: conflicts.filter(c => c.type === 'position_conflict')
            };

            let message = `🚨 排班衝突警告通知\n\n📅 期間: ${year}年${month}月\n⚠️ 發現 ${conflicts.length} 個排班衝突:\n\n`;

            // 每日人數超限衝突
            if (conflictsByType.too_many_off.length > 0) {
                message += '🔴 每日休假人數超限:\n';
                conflictsByType.too_many_off.forEach(conflict => {
                    const date = new Date(conflict.date);
                    message += `   • ${date.getDate()}日: ${conflict.employees.length}人休假 (超出限制)\n`;
                    message += `     員工: ${conflict.employees.join(', ')}\n`;
                });
                message += '\n';
            }

            // 分店衝突
            if (conflictsByType.store_conflict.length > 0) {
                message += '🟡 分店人力不足:\n';
                conflictsByType.store_conflict.forEach(conflict => {
                    const date = new Date(conflict.date);
                    message += `   • ${date.getDate()}日 ${conflict.store}: ${conflict.employees.length}人休假\n`;
                    message += `     員工: ${conflict.employees.join(', ')}\n`;
                });
                message += '\n';
            }

            // 職位衝突
            if (conflictsByType.position_conflict.length > 0) {
                message += '🟠 職位人力衝突:\n';
                conflictsByType.position_conflict.forEach(conflict => {
                    const date = new Date(conflict.date);
                    message += `   • ${date.getDate()}日: ${conflict.message}\n`;
                });
            }

            message += `\n⏰ 警告時間: ${new Date().toLocaleString('zh-TW')}\n🎯 請管理員儘速處理排班衝突`;

            // 記錄警告日誌
            logger.warn('🚨 排班衝突警告', {
                type: 'schedule_conflict',
                period: `${year}-${month}`,
                conflictCount: conflicts.length,
                conflictTypes: Object.keys(conflictsByType).filter(type => conflictsByType[type].length > 0)
            });

            console.log('\n🚨 排班衝突警告:');
            console.log(message);
            console.log('=' .repeat(50));

            return {
                success: true,
                message: '排班衝突警告已發送',
                data: {
                    period: `${year}-${month}`,
                    conflictCount: conflicts.length,
                    notificationType: 'schedule_conflict',
                    sentAt: new Date().toISOString()
                }
            };

        } catch (error) {
            logger.error('發送排班衝突警告失敗:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * ⏰ 發送排班截止提醒通知
     * @param {Object} reminderData 提醒數據
     * @param {number} reminderData.year 年份
     * @param {number} reminderData.month 月份
     * @param {Date} reminderData.deadline 截止時間
     * @param {Array} reminderData.pendingEmployees 未完成排班的員工列表
     */
    static async sendScheduleDeadlineReminder(reminderData) {
        try {
            const { year, month, deadline, pendingEmployees } = reminderData;
            
            const now = new Date();
            const timeRemaining = deadline - now;
            const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
            const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

            let urgencyLevel = '';
            let urgencyIcon = '';
            
            if (hoursRemaining <= 2) {
                urgencyLevel = '緊急';
                urgencyIcon = '🔴';
            } else if (hoursRemaining <= 6) {
                urgencyLevel = '重要';
                urgencyIcon = '🟡';
            } else {
                urgencyLevel = '提醒';
                urgencyIcon = '🔵';
            }

            const message = `
${urgencyIcon} 排班截止${urgencyLevel}提醒

📅 排班期間: ${year}年${month}月
⏰ 截止時間: ${deadline.toLocaleString('zh-TW')}
⏳ 剩餘時間: ${hoursRemaining}小時${minutesRemaining}分鐘

👥 待完成排班員工 (${pendingEmployees.length}人):
${pendingEmployees.map(emp => `   • ${emp.name} (${emp.position})`).join('\n')}

📋 提醒事項:
• 請儘快完成排班選擇
• 系統將在截止時間自動關閉
• 如有問題請聯繫管理員

⚡ 系統將持續提醒直到完成排班
            `.trim();

            // 記錄提醒日誌
            logger.info('⏰ 排班截止提醒', {
                type: 'schedule_deadline',
                period: `${year}-${month}`,
                hoursRemaining,
                pendingCount: pendingEmployees.length,
                urgencyLevel
            });

            console.log(`\n⏰ 排班截止${urgencyLevel}提醒:`);
            console.log(message);
            console.log('=' .repeat(50));

            return {
                success: true,
                message: `排班截止${urgencyLevel}提醒已發送`,
                data: {
                    period: `${year}-${month}`,
                    hoursRemaining,
                    pendingCount: pendingEmployees.length,
                    urgencyLevel,
                    notificationType: 'schedule_deadline',
                    sentAt: new Date().toISOString()
                }
            };

        } catch (error) {
            logger.error('發送排班截止提醒失敗:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 📊 發送排班統計報告
     * @param {Object} reportData 報告數據
     * @param {number} reportData.year 年份
     * @param {number} reportData.month 月份
     * @param {Object} reportData.statistics 統計數據
     */
    static async sendScheduleStatisticsReport(reportData) {
        try {
            const { year, month, statistics } = reportData;
            const { 
                totalEmployees, 
                completedSchedules, 
                totalOffDays, 
                totalWeekendOffDays,
                employeeStats 
            } = statistics;

            const completionRate = totalEmployees > 0 ? 
                ((completedSchedules / totalEmployees) * 100).toFixed(1) : 0;

            const avgOffDays = totalEmployees > 0 ? 
                (totalOffDays / totalEmployees).toFixed(1) : 0;

            const avgWeekendOffDays = totalEmployees > 0 ? 
                (totalWeekendOffDays / totalEmployees).toFixed(1) : 0;

            // 找出休假最多和最少的員工
            const sortedEmployees = employeeStats.sort((a, b) => b.totalOffDays - a.totalOffDays);
            const maxOffEmployee = sortedEmployees[0];
            const minOffEmployee = sortedEmployees[sortedEmployees.length - 1];

            const message = `
📊 排班統計報告

📅 期間: ${year}年${month}月
📈 完成率: ${completionRate}% (${completedSchedules}/${totalEmployees})

📋 總體統計:
   • 總休假天數: ${totalOffDays}天
   • 總週末休假: ${totalWeekendOffDays}天  
   • 平均休假: ${avgOffDays}天/人
   • 平均週末休假: ${avgWeekendOffDays}天/人

👤 員工排行:
   🥇 休假最多: ${maxOffEmployee?.employeeName || 'N/A'} (${maxOffEmployee?.totalOffDays || 0}天)
   🥉 休假最少: ${minOffEmployee?.employeeName || 'N/A'} (${minOffEmployee?.totalOffDays || 0}天)

⏰ 報告生成時間: ${new Date().toLocaleString('zh-TW')}
            `.trim();

            // 記錄統計日誌
            logger.info('📊 排班統計報告', {
                type: 'schedule_statistics',
                period: `${year}-${month}`,
                totalEmployees,
                completedSchedules,
                completionRate: parseFloat(completionRate),
                totalOffDays,
                avgOffDays: parseFloat(avgOffDays)
            });

            console.log('\n📊 排班統計報告:');
            console.log(message);
            console.log('=' .repeat(50));

            return {
                success: true,
                message: '排班統計報告已生成',
                data: {
                    period: `${year}-${month}`,
                    completionRate: parseFloat(completionRate),
                    totalOffDays,
                    avgOffDays: parseFloat(avgOffDays),
                    notificationType: 'schedule_statistics',
                    generatedAt: new Date().toISOString()
                }
            };

        } catch (error) {
            logger.error('生成排班統計報告失敗:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * 🔧 檢查並發送所有待處理的通知
     * @param {number} year 年份
     * @param {number} month 月份
     */
    static async checkAndSendPendingNotifications(year, month) {
        try {
            logger.info(`🔍 檢查 ${year}-${month} 待處理通知...`);
            
            const models = getModels();
            if (!models.Schedule || !models.ScheduleConfig || !models.Employee) {
                throw new Error('模型未初始化');
            }

            // 獲取排班配置
            const config = await models.ScheduleConfig.getConfig(year, month);
            if (!config) {
                logger.warn('找不到排班配置，跳過通知檢查');
                return { success: false, error: '找不到排班配置' };
            }

            const results = {
                deadlineReminders: 0,
                conflictAlerts: 0,
                statisticsReports: 0
            };

            // 1. 檢查截止提醒
            const now = new Date();
            const deadline = new Date(config.systemCloseDate);
            const timeUntilDeadline = deadline - now;
            
            // 如果還沒到截止時間，發送提醒
            if (timeUntilDeadline > 0 && timeUntilDeadline <= 24 * 60 * 60 * 1000) { // 24小時內
                const allEmployees = await models.Employee.findAll({
                    attributes: ['id', 'name', 'position']
                });
                
                const completedSchedules = await models.Schedule.findAll({
                    where: {
                        scheduleYear: year,
                        scheduleMonth: month,
                        scheduleStatus: 'completed'
                    },
                    attributes: ['employeeId']
                });
                
                const completedEmployeeIds = completedSchedules.map(s => s.employeeId);
                const pendingEmployees = allEmployees.filter(emp => 
                    !completedEmployeeIds.includes(emp.id)
                );

                if (pendingEmployees.length > 0) {
                    await this.sendScheduleDeadlineReminder({
                        year, month, deadline, pendingEmployees
                    });
                    results.deadlineReminders++;
                }
            }

            // 2. 生成統計報告 (如果是截止日之後)
            if (now > deadline) {
                const statisticsRes = await fetch(`http://localhost:3000/api/schedule/statistics/${year}/${month}`);
                if (statisticsRes.ok) {
                    const statisticsData = await statisticsRes.json();
                    await this.sendScheduleStatisticsReport({
                        year, month, statistics: statisticsData.data
                    });
                    results.statisticsReports++;
                }
            }

            logger.info('✅ 通知檢查完成', results);
            return {
                success: true,
                message: '通知檢查完成',
                data: results
            };

        } catch (error) {
            logger.error('檢查待處理通知失敗:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = ScheduleNotificationService;