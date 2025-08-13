/**
 * 統一Telegram配置管理模組
 * Claude Code安全相容性版本
 */

require('dotenv').config();

class TelegramConfig {
    constructor() {
        this.validateConfig();
    }

    get botToken() {
        return process.env.TELEGRAM_BOT_TOKEN;
    }

    get groupId() {
        return process.env.TELEGRAM_GROUP_ID;
    }

    get apiBaseUrl() {
        return 'https://api.telegram.org';
    }

    validateConfig() {
        const required = ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_GROUP_ID'];
        const missing = required.filter(key => !process.env[key]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
        }

        // 驗證Token格式
        if (!/^\d+:[A-Za-z0-9_-]+$/.test(this.botToken)) {
            throw new Error('Invalid Telegram Bot Token format');
        }

        // 驗證Group ID格式
        if (!/^-?\d+$/.test(this.groupId)) {
            throw new Error('Invalid Telegram Group ID format');
        }
    }

    getConfig() {
        return {
            botToken: this.botToken,
            groupId: this.groupId,
            apiBaseUrl: this.apiBaseUrl
        };
    }
}

module.exports = new TelegramConfig();