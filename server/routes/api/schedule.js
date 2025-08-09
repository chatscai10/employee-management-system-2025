const express = require('express');
const router = express.Router();

router.get('/test', (req, res) => {
    res.json({ success: true, message: '排班路由測試成功', timestamp: new Date().toISOString() });
});

module.exports = router;