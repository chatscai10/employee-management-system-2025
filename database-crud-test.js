#!/usr/bin/env node
/**
 * 🗄️ 資料庫CRUD操作完整性測試
 */

const { initModels } = require('./server/models');

class DatabaseCRUDTest {
    constructor() {
        this.models = null;
        this.testResults = {
            create: [],
            read: [],
            update: [],
            delete: []
        };
    }

    async initialize() {
        try {
            this.models = await initModels();
            console.log('✅ 資料庫模型初始化成功');
        } catch (error) {
            console.error('❌ 資料庫初始化失敗:', error);
            throw error;
        }
    }

    async testEmployeeCRUD() {
        console.log('\n👥 測試員工資料CRUD操作:');
        
        let testEmployeeId = null;
        
        try {
            // CREATE - 創建測試
            console.log('\n🔨 CREATE測試 - 創建測試員工');
            const newEmployee = await this.models.Employee.create({
                name: 'CRUD測試員工',
                idNumber: 'Z999888777',
                birthday: '1995-01-01',
                gender: '女',
                hasLicense: false,
                phone: '0987-654-321',
                address: '測試地址123號',
                emergencyContact: 'CRUD緊急聯絡人',
                relationship: '母親',
                emergencyPhone: '0912-345-678',
                startDate: new Date(),
                status: '審核中'
            });
            
            testEmployeeId = newEmployee.id;
            console.log('✅ CREATE成功 - 員工ID:', testEmployeeId);
            this.testResults.create.push({ model: 'Employee', success: true, id: testEmployeeId });
            
            // READ - 讀取測試
            console.log('\n📖 READ測試 - 讀取員工資料');
            const readEmployee = await this.models.Employee.findByPk(testEmployeeId);
            if (readEmployee && readEmployee.name === 'CRUD測試員工') {
                console.log('✅ READ成功 - 資料正確');
                this.testResults.read.push({ model: 'Employee', success: true, id: testEmployeeId });
            } else {
                throw new Error('讀取的資料不正確');
            }
            
            // UPDATE - 更新測試
            console.log('\n✏️ UPDATE測試 - 更新員工資料');
            await this.models.Employee.update(
                { 
                    status: '在職',
                    position: 'CRUD測試職位',
                    storeId: 1
                },
                { where: { id: testEmployeeId } }
            );
            
            const updatedEmployee = await this.models.Employee.findByPk(testEmployeeId);
            if (updatedEmployee.status === '在職' && updatedEmployee.position === 'CRUD測試職位') {
                console.log('✅ UPDATE成功 - 狀態和職位已更新');
                this.testResults.update.push({ model: 'Employee', success: true, id: testEmployeeId });
            } else {
                throw new Error('更新的資料不正確');
            }
            
            // DELETE - 刪除測試 (軟刪除)
            console.log('\n🗑️ DELETE測試 - 刪除員工資料');
            await this.models.Employee.update(
                { status: '離職' },
                { where: { id: testEmployeeId } }
            );
            
            const deletedEmployee = await this.models.Employee.findByPk(testEmployeeId);
            if (deletedEmployee.status === '離職') {
                console.log('✅ DELETE成功 - 員工狀態設為離職');
                this.testResults.delete.push({ model: 'Employee', success: true, id: testEmployeeId });
            } else {
                throw new Error('軟刪除失敗');
            }
            
        } catch (error) {
            console.error('❌ 員工CRUD測試失敗:', error.message);
            
            // 記錄失敗的操作
            if (!this.testResults.create.length) {
                this.testResults.create.push({ model: 'Employee', success: false, error: error.message });
            } else if (!this.testResults.read.length) {
                this.testResults.read.push({ model: 'Employee', success: false, error: error.message });
            } else if (!this.testResults.update.length) {
                this.testResults.update.push({ model: 'Employee', success: false, error: error.message });
            } else if (!this.testResults.delete.length) {
                this.testResults.delete.push({ model: 'Employee', success: false, error: error.message });
            }
        }
    }

    async testAttendanceCRUD() {
        console.log('\n📍 測試考勤資料CRUD操作:');
        
        let testAttendanceId = null;
        
        try {
            // 取得一個在職員工用於測試
            const employee = await this.models.Employee.findOne({ 
                where: { status: '在職' } 
            });
            
            if (!employee) {
                throw new Error('找不到在職員工進行測試');
            }
            
            // CREATE - 創建考勤記錄
            console.log('\n🔨 CREATE測試 - 創建考勤記錄');
            const newAttendance = await this.models.Attendance.create({
                employeeId: employee.id,
                storeId: employee.storeId || 1,
                clockType: '上班',
                clockTime: new Date(),
                latitude: 24.9880023,
                longitude: 121.2812737,
                distance: 0,
                status: '正常',
                notes: 'CRUD測試考勤記錄'
            });
            
            testAttendanceId = newAttendance.id;
            console.log('✅ CREATE成功 - 考勤ID:', testAttendanceId);
            this.testResults.create.push({ model: 'Attendance', success: true, id: testAttendanceId });
            
            // READ - 讀取考勤記錄
            console.log('\n📖 READ測試 - 讀取考勤記錄');
            const readAttendance = await this.models.Attendance.findByPk(testAttendanceId, {
                include: [
                    { model: this.models.Employee, attributes: ['name'] },
                    { model: this.models.Store, attributes: ['name'] }
                ]
            });
            
            if (readAttendance && readAttendance.notes === 'CRUD測試考勤記錄') {
                console.log('✅ READ成功 - 考勤記錄正確，員工:', readAttendance.Employee?.name);
                this.testResults.read.push({ model: 'Attendance', success: true, id: testAttendanceId });
            } else {
                throw new Error('讀取的考勤記錄不正確');
            }
            
            // UPDATE - 更新考勤記錄
            console.log('\n✏️ UPDATE測試 - 更新考勤記錄');
            await this.models.Attendance.update(
                { 
                    status: '早到',
                    notes: 'CRUD測試考勤記錄 - 已更新'
                },
                { where: { id: testAttendanceId } }
            );
            
            const updatedAttendance = await this.models.Attendance.findByPk(testAttendanceId);
            if (updatedAttendance.status === '早到' && updatedAttendance.notes.includes('已更新')) {
                console.log('✅ UPDATE成功 - 考勤狀態和備註已更新');
                this.testResults.update.push({ model: 'Attendance', success: true, id: testAttendanceId });
            } else {
                throw new Error('更新的考勤記錄不正確');
            }
            
            // DELETE - 刪除考勤記錄 (實際刪除)
            console.log('\n🗑️ DELETE測試 - 刪除考勤記錄');
            await this.models.Attendance.destroy({
                where: { id: testAttendanceId }
            });
            
            const deletedAttendance = await this.models.Attendance.findByPk(testAttendanceId);
            if (!deletedAttendance) {
                console.log('✅ DELETE成功 - 考勤記錄已刪除');
                this.testResults.delete.push({ model: 'Attendance', success: true, id: testAttendanceId });
            } else {
                throw new Error('考勤記錄刪除失敗');
            }
            
        } catch (error) {
            console.error('❌ 考勤CRUD測試失敗:', error.message);
        }
    }

    async testStoreCRUD() {
        console.log('\n🏪 測試分店資料CRUD操作:');
        
        let testStoreId = null;
        
        try {
            // CREATE - 創建測試分店
            console.log('\n🔨 CREATE測試 - 創建測試分店');
            const newStore = await this.models.Store.create({
                name: 'CRUD測試分店',
                address: '測試市測試區測試路999號',
                latitude: 25.0000000,
                longitude: 121.5000000,
                phone: '03-999-8888',
                manager: 'CRUD測試店長',
                businessHours: {
                    weekday: { open: '09:00', close: '22:00' },
                    weekend: { open: '10:00', close: '21:00' }
                },
                isActive: true
            });
            
            testStoreId = newStore.id;
            console.log('✅ CREATE成功 - 分店ID:', testStoreId);
            this.testResults.create.push({ model: 'Store', success: true, id: testStoreId });
            
            // READ - 讀取分店
            console.log('\n📖 READ測試 - 讀取分店資料');
            const readStore = await this.models.Store.findByPk(testStoreId);
            if (readStore && readStore.name === 'CRUD測試分店') {
                console.log('✅ READ成功 - 分店資料正確');
                this.testResults.read.push({ model: 'Store', success: true, id: testStoreId });
            } else {
                throw new Error('讀取的分店資料不正確');
            }
            
            // UPDATE - 更新分店
            console.log('\n✏️ UPDATE測試 - 更新分店資料');
            await this.models.Store.update(
                { 
                    manager: 'CRUD更新測試店長',
                    phone: '03-888-9999'
                },
                { where: { id: testStoreId } }
            );
            
            const updatedStore = await this.models.Store.findByPk(testStoreId);
            if (updatedStore.manager === 'CRUD更新測試店長') {
                console.log('✅ UPDATE成功 - 店長和電話已更新');
                this.testResults.update.push({ model: 'Store', success: true, id: testStoreId });
            } else {
                throw new Error('更新的分店資料不正確');
            }
            
            // DELETE - 刪除分店 (設為不活躍)
            console.log('\n🗑️ DELETE測試 - 停用分店');
            await this.models.Store.update(
                { isActive: false },
                { where: { id: testStoreId } }
            );
            
            const deletedStore = await this.models.Store.findByPk(testStoreId);
            if (!deletedStore.isActive) {
                console.log('✅ DELETE成功 - 分店已停用');
                this.testResults.delete.push({ model: 'Store', success: true, id: testStoreId });
            } else {
                throw new Error('分店停用失敗');
            }
            
        } catch (error) {
            console.error('❌ 分店CRUD測試失敗:', error.message);
        }
    }

    async runAllTests() {
        console.log('🚀 開始資料庫CRUD操作完整性測試...');
        console.log('='.repeat(60));
        
        try {
            await this.initialize();
            
            // 執行各模型的CRUD測試
            await this.testEmployeeCRUD();
            await this.testAttendanceCRUD();
            await this.testStoreCRUD();
            
            this.generateReport();
            
        } catch (error) {
            console.error('❌ CRUD測試執行失敗:', error);
        }
    }

    generateReport() {
        console.log('\n📊 資料庫CRUD測試綜合報告:');
        console.log('='.repeat(60));
        
        const operations = ['create', 'read', 'update', 'delete'];
        const models = ['Employee', 'Attendance', 'Store'];
        
        operations.forEach(operation => {
            const results = this.testResults[operation];
            const successful = results.filter(r => r.success).length;
            const total = results.length;
            
            console.log(`\n${operation.toUpperCase()} 操作結果:`);
            console.log(`  成功率: ${total ? Math.round((successful/total)*100) : 0}% (${successful}/${total})`);
            
            results.forEach(result => {
                const status = result.success ? '✅' : '❌';
                const info = result.success ? `ID: ${result.id}` : `錯誤: ${result.error}`;
                console.log(`  ${status} ${result.model}: ${info}`);
            });
        });
        
        // 計算整體成功率
        const allResults = [...this.testResults.create, ...this.testResults.read, 
                           ...this.testResults.update, ...this.testResults.delete];
        const totalSuccessful = allResults.filter(r => r.success).length;
        const totalTests = allResults.length;
        
        console.log('\n🏆 整體測試結果:');
        console.log(`  CRUD操作整體成功率: ${totalTests ? Math.round((totalSuccessful/totalTests)*100) : 0}%`);
        console.log(`  總測試數: ${totalTests}`);
        console.log(`  成功測試: ${totalSuccessful}`);
        console.log(`  失敗測試: ${totalTests - totalSuccessful}`);
        
        console.log('\n✅ 資料庫CRUD操作完整性測試完成');
    }
}

async function main() {
    const tester = new DatabaseCRUDTest();
    await tester.runAllTests();
}

main();