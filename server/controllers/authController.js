/**
 * auth 控制器
 * 處理 員工註冊端點 相關業務邏輯
 */


async function register(req, res) {
    const { name, idNumber, phone, email, password, storeId } = req.body;
    
    // TODO: 實現員工註冊邏輯
    // 1. 驗證輸入資料
    // 2. 檢查員工是否已存在
    // 3. 加密密碼
    // 4. 儲存到資料庫
    // 5. 生成JWT Token
    
    return {
        message: '員工註冊成功',
        employeeId: Math.floor(Math.random() * 10000),
        token: 'jwt_token_placeholder'
    };
}

module.exports = {
    register
,
    login
,
    verify
};