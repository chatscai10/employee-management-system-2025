/**
 * =======================================
 * 創建完整測試數據集
 * =======================================
 * 為系統測試建立所需的基礎數據
 */

const { initModels, getModels } = require('./server/models');
const logger = require('./server/utils/logger');

async function createTestData() {
    try {
        logger.info('🔄 開始創建測試數據...');
        
        // 初始化模型
        await initModels();
        const models = getModels();
        
        // 1. 確保基本員工存在
        const existingEmployee = await models.Employee.count();
        if (existingEmployee === 0) {
            await models.Employee.create({
                name: '測試員工',
                idNumber: 'A123456789',
                birthDate: '1990-01-01',
                gender: '男',
                hasDriverLicense: false,
                phone: '0912345678',
                address: '台北市信義區',
                emergencyContactName: '緊急聯絡人',
                emergencyContactRelation: '父母',
                emergencyContactPhone: '0987654321',
                hireDate: '2024-01-01',
                currentStore: '內壢忠孝店',
                position: '實習生',
                positionStartDate: '2024-01-01',
                status: '在職'
            });
            logger.info('✅ 測試員工建立完成');
        }

        // 2. 建立打卡記錄
        const attendanceCount = await models.AttendanceRecord.count();
        if (attendanceCount === 0) {
            const employee = await models.Employee.findOne();
            if (employee) {
                await models.AttendanceRecord.bulkCreate([
                    {
                        employeeId: employee.id,
                        employeeName: employee.name,
                        storeName: employee.currentStore,
                        clockTime: new Date(),
                        clockType: '上班',
                        status: '正常',
                        latitude: 24.9748412,
                        longitude: 121.2556713,
                        distance: 50,
                        deviceFingerprint: { browser: 'Chrome', os: 'Windows' },
                        lateMinutes: 0,
                        monthlyLateTotalMinutes: 0
                    },
                    {
                        employeeId: employee.id,
                        employeeName: employee.name,
                        storeName: employee.currentStore,
                        clockTime: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8小時後
                        clockType: '下班',
                        status: '正常',
                        latitude: 24.9748412,
                        longitude: 121.2556713,
                        distance: 50,
                        deviceFingerprint: { browser: 'Chrome', os: 'Windows' },
                        lateMinutes: 0,
                        monthlyLateTotalMinutes: 0
                    }
                ]);
                logger.info('✅ 測試打卡記錄建立完成');
            }
        }

        // 3. 建立排班配置
        const scheduleConfigCount = await models.ScheduleConfig?.count() || 0;
        if (scheduleConfigCount === 0 && models.ScheduleConfig) {
            const currentDate = new Date();
            await models.ScheduleConfig.create({
                configYear: currentDate.getFullYear(),
                configMonth: currentDate.getMonth() + 1,
                maxOffDaysPerPerson: 6,
                maxOffDaysPerDay: 2,
                maxWeekendOffDays: 3,
                maxStoreOffDaysPerDay: 1,
                maxPartTimeOffDays: 4,
                maxStandbyOffDays: 2,
                systemOpenDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
                systemCloseDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15),
                scheduleTimeLimit: new Date(currentDate.getFullYear(), currentDate.getMonth(), 20),
                holidayDates: [],
                forbiddenDates: [],
                storeHolidayDates: {},
                storeForbiddenDates: {}
            });
            logger.info('✅ 測試排班配置建立完成');
        }

        // 4. 建立投票活動
        const campaignCount = await models.PromotionCampaign?.count() || 0;
        if (campaignCount === 0 && models.PromotionCampaign) {
            const employee = await models.Employee.findOne();
            if (employee) {
                const campaign = await models.PromotionCampaign.create({
                    campaignName: '測試升遷投票',
                    campaignType: 'promotion',
                    campaignSubType: 'regular_promotion',
                    description: '測試用升遷投票活動',
                    startDate: new Date(),
                    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天後
                    status: 'active',
                    passThreshold: 0.5,
                    canModifyVotes: true,
                    maxModifications: 3,
                    systemGenerated: false,
                    createdBy: employee.id
                });

                // 建立候選人
                if (models.PromotionCandidate) {
                    await models.PromotionCandidate.create({
                        campaignId: campaign.id,
                        employeeId: employee.id,
                        currentPosition: employee.position,
                        targetPosition: '正職',
                        nominatedBy: employee.id,
                        qualifications: '測試候選人資格'
                    });
                }
                logger.info('✅ 測試投票活動建立完成');
            }
        }

        // 5. 建立設備
        const equipmentCount = await models.Equipment?.count() || 0;
        if (equipmentCount === 0 && models.Equipment) {
            const store = await models.Store.findOne();
            if (store) {
                await models.Equipment.create({
                    equipmentCode: 'TEST-001',
                    equipmentName: '測試設備',
                    category: '廚房設備',
                    brand: '測試品牌',
                    model: 'TEST-MODEL',
                    serialNumber: 'SN123456789',
                    storeId: store.id,
                    location: '廚房區域',
                    purchaseDate: new Date('2024-01-01'),
                    purchasePrice: 10000.00,
                    warrantyExpiry: new Date('2025-01-01'),
                    status: 'operational',
                    condition: 'good',
                    lastMaintenanceDate: new Date(),
                    nextMaintenanceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天後
                    maintenanceInterval: 30,
                    specifications: { '功率': '1000W', '尺寸': '60x40x80cm' },
                    operatingInstructions: '按照操作手冊使用',
                    safetyNotes: '注意安全操作',
                    vendor: '測試供應商',
                    vendorContact: '0912345678',
                    notes: '測試設備',
                    isActive: true
                });
                logger.info('✅ 測試設備建立完成');
            }
        }

        logger.info('🎉 所有測試數據創建完成！');
        
        // 顯示數據統計
        const stats = {
            employees: await models.Employee.count(),
            stores: await models.Store.count(),
            attendanceRecords: await models.AttendanceRecord.count(),
            scheduleConfigs: await models.ScheduleConfig?.count() || 0,
            campaigns: await models.PromotionCampaign?.count() || 0,
            equipment: await models.Equipment?.count() || 0
        };
        
        console.log('\n📊 測試數據統計:');
        console.log(`👥 員工: ${stats.employees} 筆`);
        console.log(`🏪 分店: ${stats.stores} 筆`);
        console.log(`📍 打卡記錄: ${stats.attendanceRecords} 筆`);
        console.log(`📅 排班配置: ${stats.scheduleConfigs} 筆`);
        console.log(`🗳️ 投票活動: ${stats.campaigns} 筆`);
        console.log(`🔧 設備: ${stats.equipment} 筆`);
        
    } catch (error) {
        logger.error('❌ 創建測試數據失敗:', error);
        throw error;
    }
}

// 直接執行
if (require.main === module) {
    createTestData()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('創建測試數據失敗:', error);
            process.exit(1);
        });
}

module.exports = createTestData;