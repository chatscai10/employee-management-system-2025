/**
 * 創建測試品項數據
 */
const { initModels, getModels } = require('./server/models/index');

async function createTestInventoryData() {
    try {
        await initModels();
        const models = getModels();
        
        console.log('🔧 開始創建測試品項數據...');
        
        const testItems = [
            // 主要食材類
            {
                category: '主要食材',
                itemName: '雞排',
                supplier: '大大食品',
                sellingPrice: 60,
                costPrice: 35,
                unit: '包',
                abnormalDays: 2,
                minStock: 5,
                maxStock: 50
            },
            {
                category: '主要食材',
                itemName: '薯條',
                supplier: '大大食品',
                sellingPrice: 45,
                costPrice: 25,
                unit: '包',
                abnormalDays: 3,
                minStock: 10,
                maxStock: 30
            },
            {
                category: '主要食材',
                itemName: '雞塊',
                supplier: '大大食品',
                sellingPrice: 50,
                costPrice: 30,
                unit: '包',
                abnormalDays: 2,
                minStock: 8,
                maxStock: 40
            },
            
            // 飲料類
            {
                category: '飲料',
                itemName: '可樂',
                supplier: '可口可樂',
                sellingPrice: 25,
                costPrice: 18,
                unit: '瓶',
                abnormalDays: 5,
                minStock: 20,
                maxStock: 100
            },
            {
                category: '飲料',
                itemName: '雪碧',
                supplier: '可口可樂',
                sellingPrice: 25,
                costPrice: 18,
                unit: '瓶',
                abnormalDays: 5,
                minStock: 20,
                maxStock: 100
            },
            {
                category: '飲料',
                itemName: '橙汁',
                supplier: '統一企業',
                sellingPrice: 30,
                costPrice: 22,
                unit: '瓶',
                abnormalDays: 4,
                minStock: 15,
                maxStock: 80
            },
            
            // 調味料類
            {
                category: '調味料',
                itemName: '胡椒粉',
                supplier: '味王',
                sellingPrice: 80,
                costPrice: 45,
                unit: '罐',
                abnormalDays: 7,
                minStock: 3,
                maxStock: 15
            },
            {
                category: '調味料',
                itemName: '辣椒粉',
                supplier: '味王',
                sellingPrice: 85,
                costPrice: 50,
                unit: '罐',
                abnormalDays: 7,
                minStock: 3,
                maxStock: 15
            },
            {
                category: '調味料',
                itemName: '蒜蓉醬',
                supplier: '味王',
                sellingPrice: 90,
                costPrice: 55,
                unit: '罐',
                abnormalDays: 10,
                minStock: 2,
                maxStock: 12
            },
            
            // 包裝用品
            {
                category: '包裝用品',
                itemName: '紙盒',
                supplier: '包裝大師',
                sellingPrice: 2,
                costPrice: 1.2,
                unit: '個',
                abnormalDays: 3,
                minStock: 100,
                maxStock: 1000
            },
            {
                category: '包裝用品',
                itemName: '塑膠袋',
                supplier: '包裝大師',
                sellingPrice: 0.5,
                costPrice: 0.3,
                unit: '個',
                abnormalDays: 3,
                minStock: 200,
                maxStock: 2000
            },
            {
                category: '包裝用品',
                itemName: '餐具組',
                supplier: '包裝大師',
                sellingPrice: 3,
                costPrice: 1.8,
                unit: '組',
                abnormalDays: 5,
                minStock: 50,
                maxStock: 500
            }
        ];
        
        for (const itemData of testItems) {
            const existingItem = await models.InventoryItem.findOne({
                where: {
                    itemName: itemData.itemName,
                    supplier: itemData.supplier,
                    isDeleted: false
                }
            });
            
            if (!existingItem) {
                await models.InventoryItem.create({
                    ...itemData,
                    status: '上架',
                    currentStock: Math.floor(Math.random() * 20) + 10, // 隨機庫存 10-30
                    notes: `測試品項 - ${itemData.itemName}`
                });
                console.log(`✅ 創建品項: ${itemData.itemName} (${itemData.supplier})`);
            } else {
                console.log(`⚠️ 品項已存在: ${itemData.itemName} (${itemData.supplier})`);
            }
        }
        
        // 設置一些品項為異常狀態 (用於測試異常監控)
        const abnormalTestItems = ['雞排', '薯條'];
        const abnormalDate = new Date();
        abnormalDate.setDate(abnormalDate.getDate() - 4); // 4天前
        
        for (const itemName of abnormalTestItems) {
            const item = await models.InventoryItem.findOne({
                where: { itemName: itemName, isDeleted: false }
            });
            
            if (item) {
                await item.update({
                    lastOrderDate: abnormalDate.toISOString().split('T')[0],
                    lastOrderQuantity: 10
                });
                console.log(`⚠️ 設置異常測試品項: ${itemName} (${abnormalDate.toDateString()})`);
            }
        }
        
        const totalItems = await models.InventoryItem.count({ 
            where: { isDeleted: false } 
        });
        
        console.log(`🎉 測試品項數據創建完成！總計 ${totalItems} 個品項`);
        
        // 顯示品項分類統計
        const { fn, col } = require('sequelize');
        const categories = await models.InventoryItem.findAll({
            attributes: [
                'category',
                [fn('COUNT', col('id')), 'count']
            ],
            where: { isDeleted: false },
            group: ['category'],
            raw: true
        });
        
        console.log('📊 品項分類統計:');
        categories.forEach(cat => {
            console.log(`  - ${cat.category}: ${cat.count} 項`);
        });
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ 創建測試品項數據失敗:', error);
        process.exit(1);
    }
}

createTestInventoryData();