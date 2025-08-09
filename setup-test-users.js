#!/usr/bin/env node

/**
 * 測試用戶數據建立腳本
 * 根據系統邏輯需求創建管理員和測試員工
 */

const path = require('path');
const bcrypt = require('bcryptjs');

// 載入數據庫模型
process.chdir(__dirname);
const { initModels, getModels } = require('./server/models');

class TestUserSetup {
    constructor() {
        this.models = null;
    }

    async initialize() {
        console.log('🚀 開始建立測試用戶數據...\n');
        
        try {
            this.models = await initModels();
            console.log('✅ 數據庫連接成功');
        } catch (error) {
            console.error('❌ 數據庫連接失敗:', error);
            throw error;
        }
    }

    /**
     * 創建管理員用戶
     */
    async createAdminUsers() {
        console.log('👑 創建管理員用戶...');
        
        const adminUsers = [
            {
                name: '系統管理員',
                idNumber: 'admin',
                birthday: '1980-01-01',
                gender: '男',
                hasLicense: true,
                phone: '0900-000-000',
                address: '系統管理地址',
                emergencyContact: '系統管理員',
                relationship: '本人',
                emergencyPhone: '0900-000-000',
                startDate: new Date(),
                storeId: 1,
                position: '系統管理員',
                lineUserId: 'admin_system',
                status: '在職'
            },
            {
                name: '測試管理員',
                idNumber: 'A000000001',
                birthday: '1985-05-15',
                gender: '女',
                hasLicense: true,
                phone: '0911-111-111',
                address: '台北市信義區測試路1號',
                emergencyContact: '測試家屬',
                relationship: '配偶',
                emergencyPhone: '0922-222-222',
                startDate: new Date(),
                storeId: 2,
                position: '店長',
                lineUserId: 'test_admin',
                status: '在職'
            }
        ];

        for (const userData of adminUsers) {
            try {
                // 檢查是否已存在
                const existing = await this.models.Employee.findOne({
                    where: { idNumber: userData.idNumber }
                });

                if (existing) {
                    console.log(`   ⚠️ 管理員 ${userData.name} 已存在，跳過創建`);
                    continue;
                }

                // 創建管理員用戶
                const admin = await this.models.Employee.create(userData);
                console.log(`   ✅ 管理員 ${userData.name} 創建成功 (ID: ${admin.id})`);
                
            } catch (error) {
                console.error(`   ❌ 創建管理員 ${userData.name} 失敗:`, error.message);
            }
        }
    }

    /**
     * 創建測試員工
     */
    async createTestEmployees() {
        console.log('\n👥 創建測試員工...');
        
        const testEmployees = [
            {
                name: '張測試',
                idNumber: 'A123456789',
                birthday: '1990-01-01',
                gender: '男',
                hasLicense: true,
                phone: '0912-345-678',
                address: '桃園市中壢區測試路123號',
                emergencyContact: '張家屬',
                relationship: '父親',
                emergencyPhone: '0987-654-321',
                startDate: new Date('2024-01-01'),
                storeId: 1,
                position: '正職員工',
                lineUserId: 'zhang_test',
                status: '在職'
            },
            {
                name: '李測試',
                idNumber: 'B123456789',
                birthday: '1992-03-15',
                gender: '女',
                hasLicense: false,
                phone: '0923-456-789',
                address: '桃園市桃園區測試街456號',
                emergencyContact: '李家屬',
                relationship: '母親',
                emergencyPhone: '0976-543-210',
                startDate: new Date('2024-02-15'),
                storeId: 2,
                position: '兼職人員',
                lineUserId: 'li_test',
                status: '在職'
            },
            {
                name: '王測試',
                idNumber: 'C123456789',
                birthday: '1995-07-20',
                gender: '男',
                hasLicense: true,
                phone: '0934-567-890',
                address: '桃園市中壢區測試巷789號',
                emergencyContact: '王家屬',
                relationship: '配偶',
                emergencyPhone: '0965-432-109',
                startDate: new Date('2024-06-01'),
                storeId: 3,
                position: '實習生',
                lineUserId: 'wang_test',
                status: '在職'
            },
            {
                name: '陳測試',
                idNumber: 'D123456789',
                birthday: '1988-11-10',
                gender: '女',
                hasLicense: true,
                phone: '0945-678-901',
                address: '桃園市楊梅區測試路321號',
                emergencyContact: '陳家屬',
                relationship: '兄弟',
                emergencyPhone: '0954-321-098',
                startDate: new Date('2023-10-01'),
                storeId: 1,
                position: '組長',
                lineUserId: 'chen_test',
                status: '在職'
            }
        ];

        for (const userData of testEmployees) {
            try {
                // 檢查是否已存在
                const existing = await this.models.Employee.findOne({
                    where: { idNumber: userData.idNumber }
                });

                if (existing) {
                    console.log(`   ⚠️ 員工 ${userData.name} 已存在，跳過創建`);
                    continue;
                }

                // 創建員工
                const employee = await this.models.Employee.create(userData);
                console.log(`   ✅ 員工 ${userData.name} 創建成功 (ID: ${employee.id}, 職位: ${userData.position})`);
                
            } catch (error) {
                console.error(`   ❌ 創建員工 ${userData.name} 失敗:`, error.message);
            }
        }
    }

    /**
     * 驗證分店數據
     */
    async verifyStores() {
        console.log('\n🏪 檢查分店數據...');
        
        try {
            const storeCount = await this.models.Store.count();
            console.log(`   📊 現有分店數量: ${storeCount}`);
            
            if (storeCount > 0) {
                const stores = await this.models.Store.findAll({
                    attributes: ['id', 'name', 'address']
                });
                
                stores.forEach(store => {
                    console.log(`   🏪 ${store.id}. ${store.name} - ${store.address}`);
                });
            } else {
                console.log('   ⚠️ 未找到分店數據，確保數據庫已正確初始化');
            }
        } catch (error) {
            console.error('   ❌ 檢查分店數據失敗:', error.message);
        }
    }

    /**
     * 驗證創建結果
     */
    async verifyCreation() {
        console.log('\n🔍 驗證用戶創建結果...');
        
        try {
            const totalUsers = await this.models.Employee.count();
            const adminUsers = await this.models.Employee.count({ 
                where: { 
                    position: {
                        [require('sequelize').Op.or]: ['系統管理員', '店長'] 
                    }
                }
            });
            const regularEmployees = totalUsers - adminUsers;
            
            console.log(`📊 用戶統計:`);
            console.log(`   總用戶數: ${totalUsers}`);
            console.log(`   管理員數: ${adminUsers}`);
            console.log(`   一般員工數: ${regularEmployees}`);
            
            // 顯示所有用戶
            const allUsers = await this.models.Employee.findAll({
                attributes: ['id', 'name', 'idNumber', 'position', 'status'],
                order: [['position', 'DESC'], ['id', 'ASC']]
            });
            
            console.log('\n👥 用戶列表:');
            allUsers.forEach(user => {
                const roleIcon = user.position.includes('管理') || user.position.includes('店長') ? '👑' : '👤';
                console.log(`   ${roleIcon} ${user.name} (${user.idNumber}) - ${user.position} [${user.status}]`);
            });
            
            return { totalUsers, adminUsers, regularEmployees };
            
        } catch (error) {
            console.error('❌ 驗證過程出錯:', error);
            return null;
        }
    }

    /**
     * 執行完整建立流程
     */
    async execute() {
        try {
            await this.initialize();
            
            await this.createAdminUsers();
            await this.createTestEmployees();
            await this.verifyStores();
            
            const stats = await this.verifyCreation();
            
            console.log('\n🎉 測試用戶數據建立完成！');
            console.log('✅ 現在可以使用以下帳號登入:');
            console.log('   管理員: 系統管理員 / admin');
            console.log('   管理員: 測試管理員 / A000000001');
            console.log('   員工: 張測試 / A123456789');
            console.log('   員工: 李測試 / B123456789');
            
            return stats;
            
        } catch (error) {
            console.error('❌ 建立測試用戶失敗:', error);
            throw error;
        }
    }
}

// 主執行函數
async function main() {
    const setup = new TestUserSetup();
    
    try {
        const result = await setup.execute();
        
        if (result && result.totalUsers > 0) {
            console.log('\n🚀 下一步: 可以開始測試登入功能和管理介面開發');
            process.exit(0);
        } else {
            console.log('\n❌ 用戶建立可能存在問題，請檢查');
            process.exit(1);
        }
        
    } catch (error) {
        console.error('執行失敗:', error.message);
        process.exit(1);
    }
}

// 如果直接執行此腳本
if (require.main === module) {
    main().catch(console.error);
}

module.exports = TestUserSetup;