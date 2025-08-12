
// 投票系統API端點修復
const express = require('express');
const router = express.Router();

// GET /api/voting - 獲取所有投票
router.get('/', async (req, res) => {
    try {
        const votes = [
            {
                id: 'vote001',
                title: '員工升遷投票 - 張小明',
                description: '張小明申請升職為店長助理',
                candidate: '張小明',
                position: '店長助理',
                status: 'active',
                votes_for: 15,
                votes_against: 3,
                created_at: new Date().toISOString(),
                end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];
        
        res.json({
            success: true,
            data: votes,
            count: votes.length,
            message: '成功獲取投票列表'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '獲取投票列表失敗',
            error: error.message
        });
    }
});

// POST /api/voting - 發起新投票
router.post('/', async (req, res) => {
    try {
        const { title, description, candidate, position, duration } = req.body;
        
        const newVote = {
            id: 'vote' + Date.now(),
            title,
            description,
            candidate,
            position,
            status: 'active',
            votes_for: 0,
            votes_against: 0,
            created_at: new Date().toISOString(),
            end_date: new Date(Date.now() + (duration || 7) * 24 * 60 * 60 * 1000).toISOString()
        };
        
        res.json({
            success: true,
            data: newVote,
            message: '投票發起成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '發起投票失敗',
            error: error.message
        });
    }
});

// POST /api/voting/:id/vote - 投票
router.post('/:id/vote', async (req, res) => {
    try {
        const { id } = req.params;
        const { vote_type } = req.body; // 'for' or 'against'
        
        res.json({
            success: true,
            message: '投票成功',
            vote_id: id,
            vote_type
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '投票失敗',
            error: error.message
        });
    }
});

module.exports = router;