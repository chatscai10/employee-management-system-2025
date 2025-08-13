/**
 * ==========================================
 * Telegram 通知服務 - Telegram Service
 * ==========================================
 * 基於系統邏輯.txt和通知模板.txt規格
 */

const axios = require('axios');
const logger = require('../utils/logger');

class TelegramService {
    constructor() {
        // 基於系統邏輯.txt的設定
        this.botToken = '7659930552:AAF_jF1rAXFnjFO176-9X5fKfBwbrko8BNc';
        this.bossGroupId = '-1002658082392';
        this.employeeGroupId = '-1002658082392';
        this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
    }

    /**
     * 發送訊息到指定群組
     */
    async sendMessage(chatId, text, options = {}) {
        try {
            const response = await axios.post(`${this.baseUrl}/sendMessage`, {
                chat_id: chatId,
                text: text,
                parse_mode: 'HTML',
                ...options
            });

            logger.info('Telegram訊息發送成功', { chatId, textLength: text.length });
            return response.data;
        } catch (error) {
            logger.error('Telegram訊息發送失敗:', { 
                chatId, 
                error: error.response?.data || error.message 
            });
            throw error;
        }
    }

    /**
     * 發送老闆通知 (詳細版本)
     */
    async sendBossNotification(title, content, options = {}) {
        const message = `
🔔 <b>${title}</b>
━━━━━━━━━━━━━━━━━━━
${content}
━━━━━━━━━━━━━━━━━━━
⏰ ${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}
`;

        return await this.sendMessage(this.bossGroupId, message, options);
    }

    /**
     * 發送員工通知 (簡化版本)
     */
    async sendEmployeeNotification(title, content, options = {}) {
        const message = `
📢 <b>${title}</b>

${content}

⏰ ${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}
`;

        return await this.sendMessage(this.employeeGroupId, message, options);
    }

    /**
     * 員工註冊通知 (基於通知模板.txt)
     */
    async sendEmployeeRegistrationNotification(employee) {
        // 老闆通知 - 詳細資料
        const bossMessage = `
👤 <b>新員工註冊通知</b>
━━━━━━━━━━━━━━━━━━━
📋 <b>員工資料:</b>
• 姓名: ${employee.name}
• 身分證字號: ${employee.idNumber}
• 生日: ${employee.birthDate}
• 性別: ${employee.gender}
• 駕照: ${employee.hasDriverLicense ? '有' : '無'}
• 聯絡電話: ${employee.phone}
• 地址: ${employee.address}
• 緊急聯絡人: ${employee.emergencyContactName} (${employee.emergencyContactRelation})
• 緊急聯絡電話: ${employee.emergencyContactPhone}
• 到職日: ${employee.hireDate}
• 所屬分店: ${employee.currentStore}
• 職位: ${employee.position}
━━━━━━━━━━━━━━━━━━━
⏰ ${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}
`;

        // 員工通知 - 簡化版本
        const employeeMessage = `
📢 <b>新人加入通知</b>

${employee.name} 新人資料已登錄

⏰ ${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}
`;

        await Promise.all([
            this.sendMessage(this.bossGroupId, bossMessage),
            this.sendMessage(this.employeeGroupId, employeeMessage)
        ]);
    }

    /**
     * 打卡通知
     */
    async sendAttendanceNotification(record, employee) {
        // 老闆通知 - 詳細資料
        const bossMessage = `
⏰ <b>員工打卡記錄</b>
━━━━━━━━━━━━━━━━━━━
• 員工: ${record.employeeName}
• 分店: ${record.storeName}
• 打卡類型: ${record.clockType}
• 打卡時間: ${new Date(record.clockTime).toLocaleString('zh-TW')}
• 狀態: ${record.status}
• GPS座標: ${record.latitude}, ${record.longitude}
• 距離分店: ${record.distance}公尺
${record.lateMinutes > 0 ? `• 遲到分鐘: ${record.lateMinutes}分鐘` : ''}
━━━━━━━━━━━━━━━━━━━
`;

        // 員工通知 - 簡化版本
        const employeeMessage = `
📢 <b>打卡成功</b>

${record.employeeName} ${record.storeName} ${record.clockType}
時間: ${new Date(record.clockTime).toLocaleString('zh-TW')}
`;

        await Promise.all([
            this.sendMessage(this.bossGroupId, bossMessage),
            this.sendMessage(this.employeeGroupId, employeeMessage)
        ]);
    }

    /**
     * 營收記錄通知
     */
    async sendRevenueNotification(record) {
        // 老闆通知 - 詳細資料
        const incomeDetails = Object.entries(record.incomeDetails || {})
            .map(([type, data]) => `• ${type}: $${data.amount || 0}`)
            .join('\n');

        const expenseDetails = Object.entries(record.expenseDetails || {})
            .map(([type, amount]) => `• ${type}: $${amount || 0}`)
            .join('\n');

        const bossMessage = `
💰 <b>營收記錄提交</b>
━━━━━━━━━━━━━━━━━━━
• 員工: ${record.employeeName}
• 分店: ${record.storeName}
• 日期: ${record.date}
• 獎金類別: ${record.bonusType}
• 訂單數量: ${record.orderCount}單
• 平均每單: $${record.orderAverage || 0}

<b>收入明細:</b>
${incomeDetails}
收入總額: $${record.totalIncome}

<b>支出明細:</b>
${expenseDetails}
支出總額: $${record.totalExpense}

淨收入: $${record.netIncome}
獎金金額: $${record.bonusAmount}
達標狀態: ${record.bonusStatus}
${record.targetGap ? `未達標差距: $${record.targetGap}` : ''}
━━━━━━━━━━━━━━━━━━━
`;

        // 員工通知 - 簡化版本
        const employeeMessage = `
📢 <b>營收記錄提交</b>

${record.employeeName} ${record.storeName}
日期: ${record.date}
獎金類別: ${record.bonusType}
${record.bonusStatus === '達標' ? 
    `獎金: $${record.bonusAmount}` : 
    `未達標差距: $${record.targetGap || 0}`}
`;

        await Promise.all([
            this.sendMessage(this.bossGroupId, bossMessage),
            this.sendMessage(this.employeeGroupId, employeeMessage)
        ]);
    }

    /**
     * 排班系統通知
     */
    async sendScheduleNotification(type, data) {
        switch (type) {
            case 'system_opening_soon':
                // 排班系統準備開啟 (開啟前5天通知)
                const openingSoonMessage = `
🚨 <b>排班系統準備開啟</b>
━━━━━━━━━━━━━━━━━━━
📅 開放日期: ${data.openDate}
⏰ 開放時間: ${data.openTime} - ${data.closeTime}
📋 排班月份: ${data.scheduleMonth}

請各位同事做好準備！
━━━━━━━━━━━━━━━━━━━
`;
                await this.sendMessage(this.employeeGroupId, openingSoonMessage);
                break;

            case 'system_opened':
                // 排班系統已開啟
                const openedMessage = `
🚨 <b>排班系統已開啟</b>
━━━━━━━━━━━━━━━━━━━
⏰ 開放時間: ${data.duration}分鐘
👤 開啟者: ${data.opener || '系統自動'}
📅 開啟時間: ${data.startTime}
📅 結束時間: ${data.endTime}

請盡快完成排班！
━━━━━━━━━━━━━━━━━━━
`;
                await this.sendMessage(this.employeeGroupId, openedMessage);
                break;

            case 'force_schedule':
                // 強制排班
                const forceMessage = `
🚨 <b>強制排班系統已開啟</b>
━━━━━━━━━━━━━━━━━━━
⏰ 開放時間: ${data.duration}分鐘
👤 開啟者: 管理員
📅 開啟時間: ${data.startTime}
📅 結束時間: ${data.endTime}

管理員已強制開啟排班系統！
━━━━━━━━━━━━━━━━━━━
`;
                await this.sendMessage(this.employeeGroupId, forceMessage);
                break;
        }
    }

    /**
     * 升遷投票通知
     */
    async sendPromotionVoteNotification(type, data) {
        switch (type) {
            case 'vote_started':
                // 投票開始
                const bossVoteStartMessage = `
🗳️ <b>升遷投票發起</b>
━━━━━━━━━━━━━━━━━━━
• 申請人: ${data.candidateName}
• 現職位: ${data.currentPosition}
• 申請職位: ${data.targetPosition}
• 任職天數: ${data.workingDays}天
• 投票結束時間: ${data.voteEndTime}
• 需達成比例: ${data.requiredRatio}%

申請人詳細資料：
• 到職日期: ${data.hireDate}
• 現職位任職日期: ${data.positionStartDate}
• 所屬分店: ${data.currentStore}
━━━━━━━━━━━━━━━━━━━
`;

                const employeeVoteStartMessage = `
📢 <b>升遷投票通知</b>

${data.candidateName} 要準備升遷了！
請協助投票支持

投票結束時間: ${data.voteEndTime}
`;

                await Promise.all([
                    this.sendMessage(this.bossGroupId, bossVoteStartMessage),
                    this.sendMessage(this.employeeGroupId, employeeVoteStartMessage)
                ]);
                break;

            case 'vote_reminder':
                // 投票提醒 (結束前一天)
                const reminderMessage = `
⏰ <b>投票提醒</b>

${data.candidateName} 升遷明日結束
請盡快投票！

結束時間: ${data.voteEndTime}
`;
                await this.sendMessage(this.employeeGroupId, reminderMessage);
                break;
        }
    }

    /**
     * 作廢通知
     */
    async sendVoidNotification(type, data) {
        // 老闆通知
        const bossMessage = `
⚠️ <b>記錄作廢通知</b>
━━━━━━━━━━━━━━━━━━━
• 日期: ${data.date}
• 員工: ${data.employeeName}
• 分店: ${data.storeName}
• 作廢類型: ${type}
• 作廢原因: ${data.reason}
• 作廢時間: ${new Date().toLocaleString('zh-TW')}
━━━━━━━━━━━━━━━━━━━
`;

        // 員工通知
        const employeeMessage = `
📢 <b>作廢通知</b>

${data.date} ${data.storeName}
${type}記錄已作廢
`;

        await Promise.all([
            this.sendMessage(this.bossGroupId, bossMessage),
            this.sendMessage(this.employeeGroupId, employeeMessage)
        ]);
    }

    /**
     * 測試連接
     */
    async testConnection() {
        try {
            const response = await axios.get(`${this.baseUrl}/getMe`);
            logger.info('Telegram Bot 連接測試成功:', response.data);
            return response.data;
        } catch (error) {
            logger.error('Telegram Bot 連接測試失敗:', error);
            throw error;
        }
    }
}

module.exports = new TelegramService();