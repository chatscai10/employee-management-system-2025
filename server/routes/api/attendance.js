/**
 * 打卡相關路由
 */

const express = require('express');
const router = express.Router();

// 臨時路由用於測試
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: '打卡路由測試成功',
        user: req.user || null,
        timestamp: new Date().toISOString()
    });
});

module.exports = router;