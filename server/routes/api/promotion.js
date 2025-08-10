/**
 * promotion 相關路由
 */

const express = require('express');
const logger = require('../../utils/logger');
const responseHelper = require('../../utils/responseHelper');

const router = express.Router();

router.get('/test', (req, res) => {
    try {
        res.json({ success: true, message: '升遷路由測試成功', timestamp: new Date().toISOString() });
    } catch (error) {
        logger.error('路由錯誤:', error);
        return responseHelper.error(res, '操作失敗', 500);
    }
});

module.exports = router;