/**
 * 資料驗證規則模組
 */

// 員工資料驗證
const validateEmployee = (req, res, next) => {
    const { name, idNumber, phone, birthday } = req.body;
    const errors = [];
    
    // 姓名驗證
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
        errors.push('姓名至少需要2個字符');
    }
    
    // 身份證號驗證
    if (!idNumber || !/^[A-Z]\d{9}$/.test(idNumber)) {
        errors.push('身份證號格式錯誤');
    }
    
    // 電話驗證
    if (!phone || !/^09\d{8}$/.test(phone)) {
        errors.push('電話號碼格式錯誤');
    }
    
    // 生日驗證
    if (!birthday || !Date.parse(birthday)) {
        errors.push('生日格式錯誤');
    }
    
    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            errors: errors,
            message: '資料驗證失敗'
        });
    }
    
    next();
};

// 考勤資料驗證
const validateAttendance = (req, res, next) => {
    const { employeeId, latitude, longitude, clockType } = req.body;
    const errors = [];
    
    // 員工ID驗證
    if (!employeeId || !Number.isInteger(employeeId) || employeeId <= 0) {
        errors.push('員工ID無效');
    }
    
    // GPS座標驗證
    if (!latitude || !longitude) {
        errors.push('GPS座標必填');
    } else {
        if (latitude < -90 || latitude > 90) {
            errors.push('緯度範圍錯誤');
        }
        if (longitude < -180 || longitude > 180) {
            errors.push('經度範圍錯誤');
        }
    }
    
    // 打卡類型驗證
    if (!clockType || !['in', 'out'].includes(clockType)) {
        errors.push('打卡類型必須為 in 或 out');
    }
    
    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            errors: errors,
            message: '考勤資料驗證失敗'
        });
    }
    
    next();
};

// 營收資料驗證
const validateRevenue = (req, res, next) => {
    const { employeeId, storeId, date, totalIncome, totalExpense } = req.body;
    const errors = [];
    
    // 基本ID驗證
    if (!employeeId || !Number.isInteger(employeeId) || employeeId <= 0) {
        errors.push('員工ID無效');
    }
    
    if (!storeId || !Number.isInteger(storeId) || storeId <= 0) {
        errors.push('分店ID無效');
    }
    
    // 日期驗證
    if (!date || !Date.parse(date)) {
        errors.push('日期格式錯誤');
    }
    
    // 金額驗證
    if (totalIncome !== undefined && (isNaN(totalIncome) || totalIncome < 0)) {
        errors.push('收入金額不能為負數');
    }
    
    if (totalExpense !== undefined && (isNaN(totalExpense) || totalExpense < 0)) {
        errors.push('支出金額不能為負數');
    }
    
    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            errors: errors,
            message: '營收資料驗證失敗'
        });
    }
    
    next();
};

// 分店資料驗證
const validateStore = (req, res, next) => {
    const { name, address, latitude, longitude } = req.body;
    const errors = [];
    
    // 分店名稱驗證
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
        errors.push('分店名稱至少需要2個字符');
    }
    
    // 地址驗證
    if (!address || typeof address !== 'string' || address.trim().length < 5) {
        errors.push('地址至少需要5個字符');
    }
    
    // 座標驗證
    if (latitude !== undefined && (isNaN(latitude) || latitude < -90 || latitude > 90)) {
        errors.push('緯度範圍錯誤');
    }
    
    if (longitude !== undefined && (isNaN(longitude) || longitude < -180 || longitude > 180)) {
        errors.push('經度範圍錯誤');
    }
    
    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            errors: errors,
            message: '分店資料驗證失敗'
        });
    }
    
    next();
};

// 通用分頁驗證
const validatePagination = (req, res, next) => {
    let { page, limit } = req.query;
    
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    
    if (page < 1) page = 1;
    if (limit < 1) limit = 10;
    if (limit > 100) limit = 100; // 限制最大每頁數量
    
    req.query.page = page;
    req.query.limit = limit;
    req.query.offset = (page - 1) * limit;
    
    next();
};

module.exports = {
    validateEmployee,
    validateAttendance,
    validateRevenue,
    validateStore,
    validatePagination
};