/**
 * 檢查叫貨品項數據
 */
const { initModels, getModels } = require('./server/models/index');

async function checkInventoryData() {
    try {
        await initModels();
        const models = getModels();
        
        console.log('🔍 檢查品項數據...');
        
        const totalItems = await models.InventoryItem.count({ 
            where: { isDeleted: false } 
        });
        
        console.log(`📊 總品項數量: ${totalItems}`);
        
        if (totalItems > 0) {
            const items = await models.InventoryItem.findAll({
                where: { isDeleted: false },
                attributes: ['id', 'itemName', 'category', 'supplier', 'status'],
                limit: 5
            });
            
            console.log('📋 前5個品項:');
            items.forEach(item => {
                console.log(`  ${item.id}: ${item.itemName} (${item.category}) - ${item.supplier} [${item.status}]`);
            });
        }
        
        // 檢查表結構
        const describe = await models.InventoryItem.describe();
        console.log('\n📝 InventoryItem表結構:');
        Object.keys(describe).forEach(column => {
            console.log(`  ${column}: ${describe[column].type}`);
        });
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ 檢查品項數據失敗:', error);
        process.exit(1);
    }
}

checkInventoryData();