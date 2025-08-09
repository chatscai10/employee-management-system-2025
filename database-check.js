#!/usr/bin/env node
/**
 * 資料庫一致性和關聯檢查腳本
 */

const { initModels } = require('./server/models');

async function performDatabaseCheck() {
    try {
        const models = await initModels();
        
        console.log('🔍 資料庫一致性檢查報告');
        console.log('='.repeat(50));
        
        // 檢查員工與分店關聯
        const employeeStoreCheck = await models.Employee.findAll({
            include: [{ model: models.Store }],
            attributes: ['id', 'name', 'storeId', 'status']
        });
        
        console.log('\n📊 員工-分店關聯檢查:');
        let orphanEmployees = 0;
        employeeStoreCheck.forEach(emp => {
            if (!emp.Store) {
                console.log(`❌ 員工 ${emp.name} (ID: ${emp.id}) 分店關聯缺失`);
                orphanEmployees++;
            }
        });
        
        if (orphanEmployees === 0) {
            console.log('✅ 所有員工都有正確的分店關聯');
        }
        
        // 檢查打卡記錄關聯
        const attendanceCheck = await models.Attendance.findAll({
            include: [
                { model: models.Employee, attributes: ['name'] },
                { model: models.Store, attributes: ['name'] }
            ],
            attributes: ['id', 'employeeId', 'storeId', 'clockType', 'status']
        });
        
        console.log(`\n📊 打卡記錄關聯檢查: (總計 ${attendanceCheck.length} 筆)`);
        let orphanAttendance = 0;
        attendanceCheck.forEach(att => {
            if (!att.Employee || !att.Store) {
                console.log(`❌ 打卡記錄 ID: ${att.id} 關聯缺失`);
                orphanAttendance++;
            } else {
                console.log(`✅ ${att.Employee.name} 在 ${att.Store.name} ${att.clockType} (${att.status})`);
            }
        });
        
        if (orphanAttendance === 0) {
            console.log('✅ 所有打卡記錄都有正確的員工和分店關聯');
        }
        
        // 統計各分店員工分布
        console.log('\n📊 分店員工分布統計:');
        for (let i = 1; i <= 3; i++) {
            const storeEmployees = await models.Employee.count({
                where: { storeId: i, status: '在職' }
            });
            const store = await models.Store.findByPk(i);
            console.log(`🏪 ${store.name}: ${storeEmployees} 人`);
        }
        
        // 檢查數據完整性
        const totalEmployees = await models.Employee.count();
        const activeEmployees = await models.Employee.count({ where: { status: '在職' } });
        const totalStores = await models.Store.count();
        const totalAttendance = await models.Attendance.count();
        
        console.log('\n📈 數據完整性統計:');
        console.log(`👥 總員工數: ${totalEmployees}`);
        console.log(`👤 在職員工: ${activeEmployees}`);
        console.log(`🏪 分店總數: ${totalStores}`);
        console.log(`📍 打卡記錄: ${totalAttendance} 筆`);
        
        console.log('\n✅ 資料庫一致性檢查完成');
        
    } catch (error) {
        console.error('❌ 資料庫檢查失敗:', error);
    }
}

// 執行檢查
performDatabaseCheck();