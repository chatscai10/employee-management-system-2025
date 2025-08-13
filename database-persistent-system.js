/**
 * 🗄️ 資料庫持久化系統 - 解決數據刷新消失問題
 * 建立真實的資料庫連接和數據持久化
 */

const fs = require('fs').promises;
const path = require('path');

class DatabasePersistentSystem {
    constructor() {
        this.dbPath = path.join(__dirname, 'persistent-data');
        this.tables = {
            employees: 'employees.json',
            attendance: 'attendance.json', 
            inventory: 'inventory.json',
            revenue: 'revenue.json',
            schedules: 'schedules.json',
            maintenance: 'maintenance.json',
            votings: 'votings.json',
            stores: 'stores.json',
            system_settings: 'system_settings.json'
        };
        
        this.initializeDatabase();
    }

    // 初始化資料庫目錄和表格
    async initializeDatabase() {
        try {
            // 創建資料庫目錄
            await fs.mkdir(this.dbPath, { recursive: true });
            console.log('📂 資料庫目錄已創建');

            // 初始化所有表格
            await this.initializeTables();
            console.log('✅ 資料庫持久化系統初始化完成');
            
        } catch (error) {
            console.error('❌ 資料庫初始化失敗:', error);
        }
    }

    // 初始化所有資料表
    async initializeTables() {
        const initialData = {
            employees: [
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
                    emergencyPhone: '0987-654-321',
                    email: 'admin@company.com',
                    department: '管理部',
                    currentStore: '台北總店',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
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
                    emergencyPhone: '0988-765-432',
                    email: 'manager@company.com',
                    department: '營運部',
                    currentStore: '台北總店',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ],

            attendance: [
                {
                    id: 1,
                    employeeId: 1,
                    employeeName: '系統管理員',
                    clockTime: new Date().toISOString(),
                    clockType: '上班',
                    location: '台北總店',
                    coordinates: '25.0330,121.5654',
                    status: '正常',
                    distance: '15公尺',
                    createdAt: new Date().toISOString()
                },
                {
                    id: 2,
                    employeeId: 2,
                    employeeName: '店長',
                    clockTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                    clockType: '上班',
                    location: '台北總店',
                    coordinates: '25.0330,121.5654',
                    status: '正常',
                    distance: '12公尺',
                    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
                }
            ],

            inventory: [
                {
                    id: 1,
                    name: '咖啡豆',
                    category: '食材',
                    quantity: 50,
                    minQuantity: 10,
                    price: 300,
                    status: 'normal',
                    lastUpdated: new Date().toISOString(),
                    createdAt: new Date().toISOString()
                },
                {
                    id: 2,
                    name: '紙杯',
                    category: '用品',
                    quantity: 5,
                    minQuantity: 20,
                    price: 2,
                    status: 'low',
                    lastUpdated: new Date().toISOString(),
                    createdAt: new Date().toISOString()
                }
            ],

            revenue: [
                {
                    id: 1,
                    type: 'income',
                    amount: 50000,
                    category: '銷售收入',
                    description: '日常營業收入',
                    date: new Date().toISOString().split('T')[0],
                    storeId: 1,
                    createdAt: new Date().toISOString()
                },
                {
                    id: 2,
                    type: 'expense',
                    amount: 15000,
                    category: '進貨成本',
                    description: '咖啡豆採購',
                    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    storeId: 1,
                    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
                }
            ],

            schedules: [
                {
                    id: 1,
                    date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    shift: '09:00-18:00',
                    employeeId: 1,
                    storeId: 1,
                    status: 'confirmed',
                    createdAt: new Date().toISOString()
                }
            ],

            maintenance: [
                {
                    id: 1,
                    equipment: '咖啡機',
                    description: '壓力異常，需要維修',
                    priority: 'high',
                    status: 'pending',
                    reporter: '系統管理員',
                    assignee: null,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ],

            votings: [
                {
                    id: 1,
                    title: '員工升遷投票 - CANDIDATE_A_001',
                    type: '升遷投票',
                    status: 'active',
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    candidates: ['CANDIDATE_A_001', 'CANDIDATE_B_002'],
                    encrypted: true,
                    totalVotes: 0,
                    createdAt: new Date().toISOString()
                }
            ],

            stores: [
                {
                    id: 1,
                    name: '台北總店',
                    address: '台北市信義區松高路1號',
                    phone: '02-2345-6789',
                    manager: '店長',
                    status: 'active',
                    employees: 15,
                    monthlyRevenue: 450000,
                    createdAt: new Date().toISOString()
                }
            ],

            system_settings: [
                {
                    key: 'telegram_bot_token',
                    value: 'process.env.TELEGRAM_BOT_TOKEN',
                    description: 'Telegram機器人Token',
                    updatedAt: new Date().toISOString()
                },
                {
                    key: 'telegram_chat_id',
                    value: 'process.env.TELEGRAM_GROUP_ID',
                    description: 'Telegram群組ID',
                    updatedAt: new Date().toISOString()
                },
                {
                    key: 'work_start_time',
                    value: '09:00',
                    description: '工作開始時間',
                    updatedAt: new Date().toISOString()
                },
                {
                    key: 'work_end_time',
                    value: '18:00',
                    description: '工作結束時間',
                    updatedAt: new Date().toISOString()
                }
            ]
        };

        // 為每個表格建立檔案
        for (const [tableName, fileName] of Object.entries(this.tables)) {
            const filePath = path.join(this.dbPath, fileName);
            
            try {
                // 檢查檔案是否存在
                await fs.access(filePath);
                console.log(`✅ 表格 ${tableName} 已存在`);
            } catch {
                // 檔案不存在，創建初始資料
                await fs.writeFile(filePath, JSON.stringify(initialData[tableName] || [], null, 2));
                console.log(`📝 建立表格 ${tableName} 與初始資料`);
            }
        }
    }

    // 通用查詢方法
    async select(tableName, conditions = {}) {
        try {
            const filePath = path.join(this.dbPath, this.tables[tableName]);
            const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
            
            // 如果沒有條件，返回所有數據
            if (Object.keys(conditions).length === 0) {
                return data;
            }
            
            // 根據條件過濾
            return data.filter(item => {
                return Object.entries(conditions).every(([key, value]) => {
                    return item[key] === value;
                });
            });
            
        } catch (error) {
            console.error(`查詢 ${tableName} 失敗:`, error);
            return [];
        }
    }

    // 通用插入方法
    async insert(tableName, data) {
        try {
            const filePath = path.join(this.dbPath, this.tables[tableName]);
            const existingData = JSON.parse(await fs.readFile(filePath, 'utf8'));
            
            // 生成ID
            const newId = existingData.length > 0 
                ? Math.max(...existingData.map(item => item.id || 0)) + 1 
                : 1;
            
            const newRecord = {
                ...data,
                id: newId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            existingData.push(newRecord);
            await fs.writeFile(filePath, JSON.stringify(existingData, null, 2));
            
            console.log(`✅ 插入 ${tableName} 記錄成功, ID: ${newId}`);
            return newRecord;
            
        } catch (error) {
            console.error(`插入 ${tableName} 失敗:`, error);
            throw error;
        }
    }

    // 通用更新方法
    async update(tableName, id, updateData) {
        try {
            const filePath = path.join(this.dbPath, this.tables[tableName]);
            const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
            
            const index = data.findIndex(item => item.id === parseInt(id));
            if (index === -1) {
                throw new Error(`ID ${id} 在 ${tableName} 中不存在`);
            }
            
            data[index] = {
                ...data[index],
                ...updateData,
                updatedAt: new Date().toISOString()
            };
            
            await fs.writeFile(filePath, JSON.stringify(data, null, 2));
            
            console.log(`✅ 更新 ${tableName} ID ${id} 成功`);
            return data[index];
            
        } catch (error) {
            console.error(`更新 ${tableName} 失敗:`, error);
            throw error;
        }
    }

    // 通用刪除方法
    async delete(tableName, id) {
        try {
            const filePath = path.join(this.dbPath, this.tables[tableName]);
            const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
            
            const index = data.findIndex(item => item.id === parseInt(id));
            if (index === -1) {
                throw new Error(`ID ${id} 在 ${tableName} 中不存在`);
            }
            
            const deletedRecord = data.splice(index, 1)[0];
            await fs.writeFile(filePath, JSON.stringify(data, null, 2));
            
            console.log(`✅ 刪除 ${tableName} ID ${id} 成功`);
            return deletedRecord;
            
        } catch (error) {
            console.error(`刪除 ${tableName} 失敗:`, error);
            throw error;
        }
    }

    // 專門的考勤記錄方法
    async insertAttendanceRecord(attendanceData) {
        const record = await this.insert('attendance', {
            employeeId: attendanceData.employeeId,
            employeeName: attendanceData.employeeName || attendanceData.name,
            clockTime: attendanceData.clockTime || new Date().toISOString(),
            clockType: attendanceData.clockType,
            location: attendanceData.location,
            coordinates: attendanceData.coordinates,
            status: attendanceData.status || '正常',
            distance: attendanceData.distance,
            note: attendanceData.note
        });
        
        console.log('📝 考勤記錄已持久化保存:', record);
        return record;
    }

    // 獲取員工考勤記錄
    async getEmployeeAttendance(employeeId, limit = 50) {
        const records = await this.select('attendance', { employeeId: parseInt(employeeId) });
        
        // 按時間排序（最新的在前）
        records.sort((a, b) => new Date(b.clockTime) - new Date(a.clockTime));
        
        return records.slice(0, limit);
    }

    // 獲取今日考勤記錄
    async getTodayAttendance(employeeId) {
        const allRecords = await this.select('attendance', { employeeId: parseInt(employeeId) });
        const today = new Date().toDateString();
        
        return allRecords.filter(record => 
            new Date(record.clockTime).toDateString() === today
        );
    }

    // 獲取員工基本資料
    async getEmployeeProfile(employeeId) {
        const employees = await this.select('employees', { id: parseInt(employeeId) });
        return employees[0] || null;
    }

    // 更新員工基本資料
    async updateEmployeeProfile(employeeId, profileData) {
        return await this.update('employees', employeeId, profileData);
    }

    // 獲取庫存資料
    async getInventoryItems() {
        return await this.select('inventory');
    }

    // 新增庫存項目
    async addInventoryItem(itemData) {
        return await this.insert('inventory', itemData);
    }

    // 獲取營收記錄
    async getRevenueRecords(filters = {}) {
        let records = await this.select('revenue');
        
        // 應用篩選條件
        if (filters.type) {
            records = records.filter(r => r.type === filters.type);
        }
        
        if (filters.startDate) {
            records = records.filter(r => r.date >= filters.startDate);
        }
        
        if (filters.endDate) {
            records = records.filter(r => r.date <= filters.endDate);
        }
        
        return records.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // 新增營收記錄
    async addRevenueRecord(revenueData) {
        return await this.insert('revenue', revenueData);
    }

    // 資料庫健康檢查
    async healthCheck() {
        const health = {
            status: 'healthy',
            tables: {},
            lastCheck: new Date().toISOString()
        };
        
        for (const [tableName, fileName] of Object.entries(this.tables)) {
            try {
                const filePath = path.join(this.dbPath, fileName);
                const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
                health.tables[tableName] = {
                    status: 'ok',
                    recordCount: data.length,
                    lastModified: (await fs.stat(filePath)).mtime
                };
            } catch (error) {
                health.tables[tableName] = {
                    status: 'error',
                    error: error.message
                };
                health.status = 'degraded';
            }
        }
        
        return health;
    }

    // 資料備份
    async backup() {
        const backupPath = path.join(this.dbPath, 'backups');
        await fs.mkdir(backupPath, { recursive: true });
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = path.join(backupPath, `backup-${timestamp}`);
        await fs.mkdir(backupDir, { recursive: true });
        
        for (const [tableName, fileName] of Object.entries(this.tables)) {
            const sourcePath = path.join(this.dbPath, fileName);
            const targetPath = path.join(backupDir, fileName);
            
            try {
                const data = await fs.readFile(sourcePath);
                await fs.writeFile(targetPath, data);
            } catch (error) {
                console.error(`備份 ${tableName} 失敗:`, error);
            }
        }
        
        console.log(`✅ 資料備份完成: ${backupDir}`);
        return backupDir;
    }

    // 統計資料
    async getStatistics() {
        try {
            const stats = {
                employees: {
                    total: (await this.select('employees')).length,
                    active: (await this.select('employees', { status: 'active' })).length
                },
                attendance: {
                    total: (await this.select('attendance')).length,
                    today: (await this.select('attendance')).filter(record => 
                        new Date(record.clockTime).toDateString() === new Date().toDateString()
                    ).length
                },
                inventory: {
                    total: (await this.select('inventory')).length,
                    lowStock: (await this.select('inventory')).filter(item => 
                        item.quantity <= item.minQuantity
                    ).length
                },
                revenue: {
                    records: (await this.select('revenue')).length,
                    thisMonth: (await this.select('revenue')).filter(record => {
                        const recordDate = new Date(record.date);
                        const now = new Date();
                        return recordDate.getMonth() === now.getMonth() && 
                               recordDate.getFullYear() === now.getFullYear();
                    }).length
                }
            };
            
            return stats;
        } catch (error) {
            console.error('獲取統計資料失敗:', error);
            return null;
        }
    }
}

// 匯出單例實例
const dbSystem = new DatabasePersistentSystem();
module.exports = dbSystem;