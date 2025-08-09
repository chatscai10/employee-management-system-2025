/**
 * attendance 控制器
 * 處理 GPS考勤打卡端點 相關業務邏輯
 */


async function clock(req, res) {
    const { employeeId, latitude, longitude, type } = req.body;
    
    // TODO: 實現GPS考勤打卡邏輯
    // 1. 驗證GPS座標
    // 2. 計算與分店距離
    // 3. 檢查是否在允許範圍內
    // 4. 記錄考勤資料
    // 5. 發送通知
    
    return {
        message: '打卡成功',
        clockTime: new Date().toISOString(),
        distance: Math.floor(Math.random() * 100)
    };
}

module.exports = {
    clock
,
    getRecords
};