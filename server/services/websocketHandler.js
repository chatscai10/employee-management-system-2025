/**
 * WebSocket 處理服務
 */

const logger = require('../utils/logger');

class WebSocketHandler {
    initialize(io) {
        this.io = io;
        logger.info('✅ WebSocket 處理器初始化完成');
    }
}

module.exports = new WebSocketHandler();