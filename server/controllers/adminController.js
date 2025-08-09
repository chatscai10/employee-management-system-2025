/**
 * admin 控制器
 * 處理 管理員分店管理端點 相關業務邏輯
 */


async function getStores(req, res) {
    // TODO: 實現 管理員分店管理端點 邏輯
    console.log('管理員分店管理端點 請求:', req.body || req.query);
    
    return {
        message: '管理員分店管理端點 功能開發中',
        data: {}
    };
}

module.exports = {
    getStores
};