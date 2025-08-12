const axios = require('axios');

class TelegramNotifier {
    constructor() {
        // Telegram Bot配置
        this.botToken = '7659930552:AAF_jF1rAXFnjFO176-9X5fKfBwbrko8BNc';
        this.chatId = '-1002658082392';
        this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
    }

    async sendMessage(message) {
        try {
            const url = `${this.baseUrl}/sendMessage`;
            const data = {
                chat_id: this.chatId,
                text: message,
                parse_mode: 'HTML',
                disable_web_page_preview: true
            };

            const response = await axios.post(url, data);
            
            if (response.data.ok) {
                console.log('✅ Telegram消息發送成功');
                return true;
            } else {
                console.error('❌ Telegram消息發送失敗:', response.data);
                return false;
            }
        } catch (error) {
            console.error('❌ Telegram發送錯誤:', error.message);
            return false;
        }
    }
}

module.exports = new TelegramNotifier();