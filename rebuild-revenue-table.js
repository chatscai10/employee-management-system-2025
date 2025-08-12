/**
 * ================================================
 * 重建營收記錄表 - 移除所有外鍵約束
 * ================================================
 * 完全重建revenue_records表，移除storeName外鍵約束
 */

const { Sequelize } = require('sequelize');

async function rebuildRevenueTable() {
    let sequelize;

    try {
        console.log('🔧 開始重建營收記錄表...');
        
        // 初始化數據庫連接
        sequelize = new Sequelize({
            dialect: 'sqlite',
            storage: './database/employee_management.db',
            logging: false
        });

        console.log('📊 檢查數據庫連接...');
        await sequelize.authenticate();
        console.log('✅ 數據庫連接成功');

        // 禁用外鍵約束檢查
        await sequelize.query('PRAGMA foreign_keys = OFF;');
        console.log('✅ 外鍵約束檢查已禁用');

        // 備份現有數據
        console.log('📦 備份現有數據...');
        let existingData = [];
        try {
            const [records] = await sequelize.query('SELECT * FROM revenue_records;');
            existingData = records;
            console.log(`✅ 備份 ${existingData.length} 條記錄`);
        } catch (error) {
            console.log('ℹ️ 表不存在或無數據，跳過備份');
        }

        // 刪除現有表
        await sequelize.query('DROP TABLE IF EXISTS revenue_records;');
        console.log('🗑️ 舊表已刪除');

        // 創建新表結構（完全無外鍵約束）
        console.log('🔨 創建新表結構...');
        await sequelize.query(`
            CREATE TABLE revenue_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                employeeId INTEGER NOT NULL,
                employeeName VARCHAR(50) NOT NULL,
                storeName VARCHAR(50) NOT NULL,
                date DATE NOT NULL,
                bonusType VARCHAR(20) NOT NULL CHECK(bonusType IN ('平日獎金', '假日獎金')),
                orderCount INTEGER DEFAULT 0 NOT NULL,
                incomeDetails TEXT NOT NULL,
                totalIncome DECIMAL(10,2) DEFAULT 0 NOT NULL,
                expenseDetails TEXT NOT NULL,
                totalExpense DECIMAL(10,2) DEFAULT 0 NOT NULL,
                netIncome DECIMAL(10,2) DEFAULT 0 NOT NULL,
                bonusAmount DECIMAL(10,2) DEFAULT 0 NOT NULL,
                bonusStatus VARCHAR(20) NOT NULL CHECK(bonusStatus IN ('達標', '未達標')),
                targetGap DECIMAL(10,2),
                orderAverage DECIMAL(10,2) DEFAULT 0 NOT NULL,
                uploadedPhotos TEXT DEFAULT '[]',
                notes TEXT,
                isDeleted BOOLEAN DEFAULT 0 NOT NULL,
                deletedAt DATETIME,
                deletedBy VARCHAR(50),
                deletedReason TEXT,
                createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('✅ 新表結構創建成功（無任何外鍵約束）');

        // 創建索引
        console.log('📇 創建索引...');
        await sequelize.query(`
            CREATE INDEX idx_revenue_employee_date ON revenue_records(employeeId, date);
        `);
        await sequelize.query(`
            CREATE INDEX idx_revenue_store_date ON revenue_records(storeName, date);
        `);
        await sequelize.query(`
            CREATE INDEX idx_revenue_date ON revenue_records(date);
        `);
        await sequelize.query(`
            CREATE INDEX idx_revenue_bonus_type ON revenue_records(bonusType);
        `);
        console.log('✅ 索引創建完成');

        // 恢復數據
        if (existingData.length > 0) {
            console.log('📦 恢復數據...');
            for (const record of existingData) {
                const columns = Object.keys(record).filter(key => key !== 'id');
                const values = columns.map(col => record[col]);
                const placeholders = columns.map(() => '?').join(',');
                
                await sequelize.query(
                    `INSERT INTO revenue_records (${columns.join(',')}) VALUES (${placeholders});`,
                    { replacements: values, type: sequelize.QueryTypes.INSERT }
                );
            }
            console.log(`✅ ${existingData.length} 條記錄恢復成功`);
        }

        // 測試創建新記錄
        console.log('🧪 測試創建記錄...');
        const testInsert = `
            INSERT INTO revenue_records (
                employeeId, employeeName, storeName, date, bonusType,
                orderCount, incomeDetails, totalIncome, expenseDetails,
                totalExpense, netIncome, bonusAmount, bonusStatus,
                orderAverage, notes, isDeleted
            ) VALUES (
                1, '測試員工', '總店', '2025-08-12', '平日獎金',
                10, '{"cash":15000,"panda":5000}', 20000, '{"fees":1750}',
                1750, 18250, 1575, '達標',
                2000, '重建測試', 0
            );
        `;
        
        await sequelize.query(testInsert);
        console.log('✅ 測試記錄創建成功！');

        // 驗證記錄
        const [records] = await sequelize.query('SELECT COUNT(*) as count FROM revenue_records;');
        console.log(`📊 當前營收記錄數量: ${records[0].count}`);

        // 清理測試記錄
        await sequelize.query('DELETE FROM revenue_records WHERE notes = "重建測試";');
        console.log('🧹 測試記錄已清理');

        // 重新啟用外鍵約束檢查
        await sequelize.query('PRAGMA foreign_keys = ON;');
        console.log('✅ 外鍵約束檢查已重新啟用');

        console.log('🎉 營收記錄表重建完成！');
        
        return {
            success: true,
            message: '營收記錄表重建成功',
            details: {
                oldRecordsCount: existingData.length,
                testPassed: true,
                foreignKeysRemoved: true
            }
        };

    } catch (error) {
        console.error('❌ 重建失敗:', error);
        return {
            success: false,
            message: '重建失敗',
            error: error.message
        };
    } finally {
        if (sequelize) {
            await sequelize.close();
            console.log('🔌 數據庫連接已關閉');
        }
    }
}

// 直接執行重建
if (require.main === module) {
    rebuildRevenueTable()
        .then(result => {
            console.log('\n📊 重建結果:', result);
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 重建工具執行失敗:', error);
            process.exit(1);
        });
}

module.exports = { rebuildRevenueTable };