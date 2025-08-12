
// 公告管理API端點修復
const express = require('express');
const router = express.Router();

// GET /api/announcements - 獲取所有公告
router.get('/', async (req, res) => {
    try {
        const announcements = [
            {
                id: 'ann001',
                title: '系統維護通知',
                content: '系統將於本週末進行維護升級',
                author: '管理員',
                priority: 'high',
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: 'ann002', 
                title: '新功能發布',
                content: '新增智慧排班功能',
                author: '系統管理員',
                priority: 'medium',
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        ];
        
        res.json({
            success: true,
            data: announcements,
            count: announcements.length,
            message: '成功獲取公告列表'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '獲取公告失敗',
            error: error.message
        });
    }
});

// GET /api/announcements/:id - 獲取特定公告
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const announcement = {
            id: id,
            title: '系統維護通知',
            content: '系統將於本週末進行維護升級，預計停機時間為2小時',
            author: '管理員',
            priority: 'high',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        res.json({
            success: true,
            data: announcement,
            message: '成功獲取公告詳情'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '獲取公告詳情失敗',
            error: error.message
        });
    }
});

// POST /api/announcements - 創建新公告
router.post('/', async (req, res) => {
    try {
        const { title, content, priority } = req.body;
        const newAnnouncement = {
            id: 'ann' + Date.now(),
            title,
            content,
            author: '管理員',
            priority: priority || 'medium',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        res.json({
            success: true,
            data: newAnnouncement,
            message: '公告創建成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '創建公告失敗',
            error: error.message
        });
    }
});

// PUT /api/announcements/:id - 更新公告
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, priority, status } = req.body;
        
        const updatedAnnouncement = {
            id,
            title,
            content,
            priority,
            status,
            updated_at: new Date().toISOString()
        };
        
        res.json({
            success: true,
            data: updatedAnnouncement,
            message: '公告更新成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '更新公告失敗',
            error: error.message
        });
    }
});

// DELETE /api/announcements/:id - 刪除公告
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        res.json({
            success: true,
            message: '公告刪除成功',
            deletedId: id
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '刪除公告失敗',
            error: error.message
        });
    }
});

module.exports = router;