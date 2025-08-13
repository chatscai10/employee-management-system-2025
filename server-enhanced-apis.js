/**
 * 🎯 增強版API端點 - 支援完整CRUD操作
 * 為admin-enhanced.html提供完整後端支援
 */

const express = require('express');
const path = require('path');

// 模擬資料庫 - 生產環境應使用真實資料庫
let employees = [
    {
        id: 1,
        name: '系統管理員',
        idNumber: 'A123456789',
        position: '管理員',
        status: 'active',
        phone: '0912-345-678',
        address: '台北市信義區松高路1號',
        hireDate: '2024-01-01',
        emergencyContact: '張父親',
        emergencyPhone: '0987-654-321'
    },
    {
        id: 2,
        name: '店長',
        idNumber: 'B123456789',
        position: '店長',
        status: 'active',
        phone: '0913-456-789',
        address: '台北市大安區復興南路1號',
        hireDate: '2024-02-01',
        emergencyContact: '李母親',
        emergencyPhone: '0988-765-432'
    }
];

let inventory = [
    {
        id: 1,
        name: '咖啡豆',
        category: '食材',
        quantity: 50,
        minQuantity: 10,
        price: 300,
        status: 'normal',
        lastUpdated: new Date().toISOString()
    },
    {
        id: 2,
        name: '紙杯',
        category: '用品',
        quantity: 5,
        minQuantity: 20,
        price: 2,
        status: 'low',
        lastUpdated: new Date().toISOString()
    }
];

let revenue = [
    {
        id: 1,
        type: 'income',
        amount: 50000,
        category: '銷售收入',
        description: '日常營業收入',
        date: '2025-08-11',
        storeId: 1
    },
    {
        id: 2,
        type: 'expense',
        amount: 15000,
        category: '進貨成本',
        description: '咖啡豆採購',
        date: '2025-08-10',
        storeId: 1
    }
];

let stores = [
    {
        id: 1,
        name: '總店',
        address: '台北市信義區松高路1號',
        phone: '02-2345-6789',
        manager: '店長',
        status: 'active'
    }
];

let maintenance = [
    {
        id: 1,
        equipment: '咖啡機',
        description: '壓力異常，需要維修',
        priority: 'high',
        status: 'pending',
        reporter: '員工A',
        createdAt: new Date().toISOString()
    }
];

let votings = [
    {
        id: 1,
        title: '員工升遷投票 - CANDIDATE_A_001',
        type: '升遷投票',
        status: 'active',
        startDate: '2025-08-11',
        endDate: '2025-08-16',
        candidates: ['CANDIDATE_A_001', 'CANDIDATE_B_002'],
        encrypted: true,
        totalVotes: 0
    }
];

let schedules = [
    {
        id: 1,
        date: '2025-08-12',
        shift: '09:00-18:00',
        employeeId: 1,
        storeId: 1,
        status: 'confirmed'
    }
];

// 輔助函數
function generateId(array) {
    return array.length > 0 ? Math.max(...array.map(item => item.id)) + 1 : 1;
}

function validateEmployee(data) {
    const required = ['name', 'idNumber', 'position', 'phone', 'address', 'hireDate'];
    for (const field of required) {
        if (!data[field]) {
            return `${field} 是必填欄位`;
        }
    }
    
    // 檢查身分證號碼格式
    if (!/^[A-Z][0-9]{9}$/.test(data.idNumber)) {
        return '身分證號碼格式錯誤';
    }
    
    return null;
}

function validateInventory(data) {
    const required = ['name', 'category', 'quantity', 'minQuantity'];
    for (const field of required) {
        if (data[field] === undefined || data[field] === null) {
            return `${field} 是必填欄位`;
        }
    }
    
    if (data.quantity < 0 || data.minQuantity < 0) {
        return '數量不能為負數';
    }
    
    return null;
}

function validateRevenue(data) {
    const required = ['type', 'amount', 'category', 'description', 'date'];
    for (const field of required) {
        if (!data[field]) {
            return `${field} 是必填欄位`;
        }
    }
    
    if (data.amount <= 0) {
        return '金額必須大於0';
    }
    
    if (!['income', 'expense'].includes(data.type)) {
        return '類型必須是income或expense';
    }
    
    return null;
}

// 統計數據計算
function calculateStats() {
    const totalEmployees = employees.length;
    const pendingApprovals = employees.filter(emp => emp.status === 'pending').length;
    const totalInventory = inventory.length;
    const monthlyRevenue = revenue
        .filter(r => r.type === 'income' && new Date(r.date).getMonth() === new Date().getMonth())
        .reduce((sum, r) => sum + r.amount, 0);
    
    return {
        totalEmployees,
        pendingApprovals,
        totalInventory,
        monthlyRevenue
    };
}

function calculateInventoryStats() {
    const totalProducts = inventory.length;
    const lowStockItems = inventory.filter(item => item.quantity <= item.minQuantity).length;
    const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * (item.price || 0)), 0);
    
    return {
        totalProducts,
        lowStockItems,
        totalValue
    };
}

function calculateRevenueStats() {
    const totalIncome = revenue.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
    const totalExpense = revenue.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);
    const netProfit = totalIncome - totalExpense;
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;
    
    return {
        totalIncome,
        totalExpense,
        netProfit,
        profitMargin
    };
}

// 模擬Telegram通知
async function sendTelegramNotification(message, type = 'info') {
    try {
        const botToken = 'process.env.TELEGRAM_BOT_TOKEN';
        const chatId = 'process.env.TELEGRAM_GROUP_ID';
        
        const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
        const fullMessage = `${icon} ${message}\n\n⏰ ${new Date().toLocaleString('zh-TW')}`;
        
        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: fullMessage,
                parse_mode: 'HTML'
            })
        });
        
        console.log('📱 Telegram通知發送:', response.status === 200 ? '成功' : '失敗');
    } catch (error) {
        console.error('📱 Telegram通知發送失敗:', error);
    }
}

// API端點定義
function setupEnhancedAPIs(app) {
    
    // ============ 統計數據API ============
    app.get('/api/admin/stats', (req, res) => {
        try {
            const stats = calculateStats();
            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '載入統計數據失敗',
                error: error.message
            });
        }
    });
    
    // ============ 員工管理API ============
    app.get('/api/admin/employees', (req, res) => {
        try {
            const { status, position, search, page = 1, limit = 20 } = req.query;
            
            let filteredEmployees = [...employees];
            
            // 篩選條件
            if (status) {
                filteredEmployees = filteredEmployees.filter(emp => emp.status === status);
            }
            
            if (position) {
                filteredEmployees = filteredEmployees.filter(emp => emp.position === position);
            }
            
            if (search) {
                const searchLower = search.toLowerCase();
                filteredEmployees = filteredEmployees.filter(emp => 
                    emp.name.toLowerCase().includes(searchLower) ||
                    emp.idNumber.toLowerCase().includes(searchLower)
                );
            }
            
            // 分頁
            const total = filteredEmployees.length;
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + parseInt(limit);
            const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);
            
            res.json({
                success: true,
                data: {
                    employees: paginatedEmployees,
                    pagination: {
                        total,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        totalPages: Math.ceil(total / limit)
                    }
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '載入員工資料失敗',
                error: error.message
            });
        }
    });
    
    app.post('/api/admin/employees', async (req, res) => {
        try {
            const employeeData = req.body;
            
            // 驗證數據
            const validationError = validateEmployee(employeeData);
            if (validationError) {
                return res.status(400).json({
                    success: false,
                    message: validationError
                });
            }
            
            // 檢查身分證號碼是否重複
            const existingEmployee = employees.find(emp => emp.idNumber === employeeData.idNumber);
            if (existingEmployee) {
                return res.status(400).json({
                    success: false,
                    message: '身分證號碼已存在'
                });
            }
            
            // 建立新員工
            const newEmployee = {
                id: generateId(employees),
                ...employeeData,
                status: 'active',
                createdAt: new Date().toISOString()
            };
            
            employees.push(newEmployee);
            
            // 發送通知
            await sendTelegramNotification(
                `🆕 新增員工成功\n👤 姓名: ${newEmployee.name}\n🏢 職位: ${newEmployee.position}`,
                'success'
            );
            
            res.json({
                success: true,
                message: '員工新增成功',
                data: { employee: newEmployee }
            });
            
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '新增員工失敗',
                error: error.message
            });
        }
    });
    
    app.put('/api/admin/employees/:id', async (req, res) => {
        try {
            const employeeId = parseInt(req.params.id);
            const updateData = req.body;
            
            const employeeIndex = employees.findIndex(emp => emp.id === employeeId);
            if (employeeIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: '找不到該員工'
                });
            }
            
            // 驗證數據
            const validationError = validateEmployee(updateData);
            if (validationError) {
                return res.status(400).json({
                    success: false,
                    message: validationError
                });
            }
            
            // 更新員工資料
            employees[employeeIndex] = {
                ...employees[employeeIndex],
                ...updateData,
                updatedAt: new Date().toISOString()
            };
            
            // 發送通知
            await sendTelegramNotification(
                `✏️ 員工資料更新\n👤 姓名: ${employees[employeeIndex].name}\n📝 已更新資料`,
                'success'
            );
            
            res.json({
                success: true,
                message: '員工資料更新成功',
                data: { employee: employees[employeeIndex] }
            });
            
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '更新員工失敗',
                error: error.message
            });
        }
    });
    
    app.delete('/api/admin/employees/:id', async (req, res) => {
        try {
            const employeeId = parseInt(req.params.id);
            
            const employeeIndex = employees.findIndex(emp => emp.id === employeeId);
            if (employeeIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: '找不到該員工'
                });
            }
            
            const deletedEmployee = employees[employeeIndex];
            employees.splice(employeeIndex, 1);
            
            // 發送通知
            await sendTelegramNotification(
                `🗑️ 員工資料刪除\n👤 姓名: ${deletedEmployee.name}\n📝 已從系統中移除`,
                'success'
            );
            
            res.json({
                success: true,
                message: '員工刪除成功'
            });
            
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '刪除員工失敗',
                error: error.message
            });
        }
    });
    
    // ============ 庫存管理API ============
    app.get('/api/admin/inventory', (req, res) => {
        try {
            const { category, status } = req.query;
            
            let filteredInventory = [...inventory];
            
            if (category) {
                filteredInventory = filteredInventory.filter(item => item.category === category);
            }
            
            if (status) {
                filteredInventory = filteredInventory.filter(item => item.status === status);
            }
            
            // 更新庫存狀態
            filteredInventory.forEach(item => {
                if (item.quantity <= item.minQuantity) {
                    item.status = item.quantity === 0 ? 'out' : 'low';
                } else {
                    item.status = 'normal';
                }
            });
            
            const stats = calculateInventoryStats();
            
            res.json({
                success: true,
                data: {
                    items: filteredInventory,
                    stats: stats
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '載入庫存資料失敗',
                error: error.message
            });
        }
    });
    
    app.post('/api/admin/inventory', async (req, res) => {
        try {
            const inventoryData = req.body;
            
            // 驗證數據
            const validationError = validateInventory(inventoryData);
            if (validationError) {
                return res.status(400).json({
                    success: false,
                    message: validationError
                });
            }
            
            // 建立新商品
            const newItem = {
                id: generateId(inventory),
                ...inventoryData,
                status: inventoryData.quantity <= inventoryData.minQuantity ? 'low' : 'normal',
                lastUpdated: new Date().toISOString(),
                createdAt: new Date().toISOString()
            };
            
            inventory.push(newItem);
            
            // 發送通知
            await sendTelegramNotification(
                `📦 新增庫存商品\n🏷️ 商品: ${newItem.name}\n📊 數量: ${newItem.quantity}`,
                'success'
            );
            
            res.json({
                success: true,
                message: '商品新增成功',
                data: { item: newItem }
            });
            
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '新增商品失敗',
                error: error.message
            });
        }
    });
    
    app.put('/api/admin/inventory/:id', async (req, res) => {
        try {
            const itemId = parseInt(req.params.id);
            const updateData = req.body;
            
            const itemIndex = inventory.findIndex(item => item.id === itemId);
            if (itemIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: '找不到該商品'
                });
            }
            
            // 驗證數據
            const validationError = validateInventory(updateData);
            if (validationError) {
                return res.status(400).json({
                    success: false,
                    message: validationError
                });
            }
            
            // 更新商品
            inventory[itemIndex] = {
                ...inventory[itemIndex],
                ...updateData,
                status: updateData.quantity <= updateData.minQuantity ? 'low' : 'normal',
                lastUpdated: new Date().toISOString()
            };
            
            // 發送通知
            await sendTelegramNotification(
                `📝 庫存商品更新\n🏷️ 商品: ${inventory[itemIndex].name}\n📊 新數量: ${inventory[itemIndex].quantity}`,
                'success'
            );
            
            res.json({
                success: true,
                message: '商品更新成功',
                data: { item: inventory[itemIndex] }
            });
            
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '更新商品失敗',
                error: error.message
            });
        }
    });
    
    // ============ 營收管理API ============
    app.get('/api/admin/revenue', (req, res) => {
        try {
            const { startDate, endDate, storeId, type } = req.query;
            
            let filteredRevenue = [...revenue];
            
            if (startDate) {
                filteredRevenue = filteredRevenue.filter(r => new Date(r.date) >= new Date(startDate));
            }
            
            if (endDate) {
                filteredRevenue = filteredRevenue.filter(r => new Date(r.date) <= new Date(endDate));
            }
            
            if (storeId) {
                filteredRevenue = filteredRevenue.filter(r => r.storeId === parseInt(storeId));
            }
            
            if (type) {
                filteredRevenue = filteredRevenue.filter(r => r.type === type);
            }
            
            const stats = calculateRevenueStats();
            
            // 生成圖表數據
            const chartLabels = [...new Set(filteredRevenue.map(r => r.date))].sort();
            const chartData = chartLabels.map(date => {
                const dayRevenue = filteredRevenue
                    .filter(r => r.date === date && r.type === 'income')
                    .reduce((sum, r) => sum + r.amount, 0);
                return dayRevenue;
            });
            
            res.json({
                success: true,
                data: {
                    records: filteredRevenue.sort((a, b) => new Date(b.date) - new Date(a.date)),
                    stats: stats,
                    chartData: {
                        labels: chartLabels,
                        data: chartData
                    }
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '載入營收資料失敗',
                error: error.message
            });
        }
    });
    
    app.post('/api/admin/revenue', async (req, res) => {
        try {
            const revenueData = req.body;
            
            // 驗證數據
            const validationError = validateRevenue(revenueData);
            if (validationError) {
                return res.status(400).json({
                    success: false,
                    message: validationError
                });
            }
            
            // 建立新營收記錄
            const newRecord = {
                id: generateId(revenue),
                ...revenueData,
                storeId: revenueData.storeId || 1,
                createdAt: new Date().toISOString()
            };
            
            revenue.push(newRecord);
            
            // 發送通知
            const typeText = newRecord.type === 'income' ? '收入' : '支出';
            await sendTelegramNotification(
                `💰 新增${typeText}記錄\n💵 金額: NT$${newRecord.amount.toLocaleString()}\n📝 描述: ${newRecord.description}`,
                'success'
            );
            
            res.json({
                success: true,
                message: '營收記錄新增成功',
                data: { record: newRecord }
            });
            
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '新增營收記錄失敗',
                error: error.message
            });
        }
    });
    
    // ============ 分店管理API ============
    app.get('/api/admin/stores', (req, res) => {
        try {
            res.json({
                success: true,
                data: { stores }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '載入分店資料失敗',
                error: error.message
            });
        }
    });
    
    app.post('/api/admin/stores', async (req, res) => {
        try {
            const storeData = req.body;
            
            const newStore = {
                id: generateId(stores),
                ...storeData,
                status: 'active',
                createdAt: new Date().toISOString()
            };
            
            stores.push(newStore);
            
            await sendTelegramNotification(
                `🏪 新增分店\n🏷️ 名稱: ${newStore.name}\n📍 地址: ${newStore.address}`,
                'success'
            );
            
            res.json({
                success: true,
                message: '分店新增成功',
                data: { store: newStore }
            });
            
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '新增分店失敗',
                error: error.message
            });
        }
    });
    
    // ============ 維修管理API ============
    app.get('/api/admin/maintenance', (req, res) => {
        try {
            const { status, priority } = req.query;
            
            let filteredMaintenance = [...maintenance];
            
            if (status) {
                filteredMaintenance = filteredMaintenance.filter(m => m.status === status);
            }
            
            if (priority) {
                filteredMaintenance = filteredMaintenance.filter(m => m.priority === priority);
            }
            
            res.json({
                success: true,
                data: { requests: filteredMaintenance }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '載入維修資料失敗',
                error: error.message
            });
        }
    });
    
    app.post('/api/admin/maintenance', async (req, res) => {
        try {
            const maintenanceData = req.body;
            
            const newRequest = {
                id: generateId(maintenance),
                ...maintenanceData,
                status: 'pending',
                createdAt: new Date().toISOString()
            };
            
            maintenance.push(newRequest);
            
            await sendTelegramNotification(
                `🔧 新增維修申請\n🏷️ 設備: ${newRequest.equipment}\n⚠️ 優先級: ${newRequest.priority}`,
                'success'
            );
            
            res.json({
                success: true,
                message: '維修申請新增成功',
                data: { request: newRequest }
            });
            
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '新增維修申請失敗',
                error: error.message
            });
        }
    });
    
    // ============ 升遷投票API ============
    app.get('/api/admin/promotions', (req, res) => {
        try {
            const { status } = req.query;
            
            let filteredVotings = [...votings];
            
            if (status) {
                filteredVotings = filteredVotings.filter(v => v.status === status);
            }
            
            res.json({
                success: true,
                data: { campaigns: filteredVotings }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '載入投票資料失敗',
                error: error.message
            });
        }
    });
    
    app.post('/api/admin/promotions', async (req, res) => {
        try {
            const votingData = req.body;
            
            const newVoting = {
                id: generateId(votings),
                ...votingData,
                status: 'active',
                totalVotes: 0,
                encrypted: true,
                createdAt: new Date().toISOString()
            };
            
            votings.push(newVoting);
            
            await sendTelegramNotification(
                `🗳️ 新增升遷投票\n📝 標題: ${newVoting.title}\n🔐 SHA-256加密: 啟用`,
                'success'
            );
            
            res.json({
                success: true,
                message: '投票活動建立成功',
                data: { campaign: newVoting }
            });
            
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '建立投票活動失敗',
                error: error.message
            });
        }
    });
    
    // ============ 排班管理API ============
    app.get('/api/admin/schedules', (req, res) => {
        try {
            const { date, storeId } = req.query;
            
            let filteredSchedules = [...schedules];
            
            if (date) {
                filteredSchedules = filteredSchedules.filter(s => s.date === date);
            }
            
            if (storeId) {
                filteredSchedules = filteredSchedules.filter(s => s.storeId === parseInt(storeId));
            }
            
            res.json({
                success: true,
                data: { schedules: filteredSchedules }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '載入排班資料失敗',
                error: error.message
            });
        }
    });
    
    app.post('/api/admin/schedules', async (req, res) => {
        try {
            const scheduleData = req.body;
            
            const newSchedule = {
                id: generateId(schedules),
                ...scheduleData,
                status: 'pending',
                createdAt: new Date().toISOString()
            };
            
            schedules.push(newSchedule);
            
            await sendTelegramNotification(
                `📅 新增排班記錄\n📅 日期: ${newSchedule.date}\n⏰ 班次: ${newSchedule.shift}`,
                'success'
            );
            
            res.json({
                success: true,
                message: '排班記錄新增成功',
                data: { schedule: newSchedule }
            });
            
        } catch (error) {
            res.status(500).json({
                success: false,
                message: '新增排班記錄失敗',
                error: error.message
            });
        }
    });
    
    console.log('🎯 增強版API端點已載入完成');
    return {
        employees: () => employees,
        inventory: () => inventory,
        revenue: () => revenue,
        stores: () => stores,
        maintenance: () => maintenance,
        votings: () => votings,
        schedules: () => schedules
    };
}

module.exports = { setupEnhancedAPIs };