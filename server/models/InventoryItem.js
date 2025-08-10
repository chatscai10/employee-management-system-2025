/**
 * ==========================================
 * 庫存品項模型 - InventoryItem Model
 * ==========================================
 * 基於系統邏輯.txt規格 - 叫貨管理系統品項設定
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const InventoryItem = sequelize.define('InventoryItem', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        
        // 品項基本資訊 (系統邏輯.txt line 163)
        category: {
            type: DataTypes.STRING(50),
            allowNull: false,
            comment: '類別'
        },
        itemName: {
            type: DataTypes.STRING(100),
            allowNull: false,
            comment: '品項名稱'
        },
        supplier: {
            type: DataTypes.STRING(100),
            allowNull: false,
            comment: '廠商'
        },
        
        // 價格資訊
        sellingPrice: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            comment: '售價'
        },
        costPrice: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            comment: '成本'
        },
        unit: {
            type: DataTypes.STRING(20),
            allowNull: false,
            comment: '單位'
        },
        
        // 狀態管理
        status: {
            type: DataTypes.ENUM('上架', '下架', '停售'),
            allowNull: false,
            defaultValue: '上架',
            comment: '上架狀態'
        },
        
        // 異常監控 (系統邏輯.txt line 284-286)
        abnormalDays: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 2,
            comment: '異常叫貨提醒天數'
        },
        
        // 庫存管理
        minStock: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: '最低庫存量'
        },
        maxStock: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 999,
            comment: '最高庫存量'
        },
        currentStock: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: '目前庫存量'
        },
        
        // 最後進貨記錄
        lastOrderDate: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            comment: '最後叫貨日期'
        },
        lastOrderQuantity: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: '最後叫貨數量'
        },
        
        // 備註
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '備註'
        },
        
        // 系統記錄
        isDeleted: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: '是否已刪除'
        },
        deletedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '刪除時間'
        },
        deletedBy: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: '刪除操作者'
        },
        
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'inventory_items',
        timestamps: true,
        indexes: [
            {
                fields: ['category'],
                name: 'idx_item_category'
            },
            {
                fields: ['supplier'],
                name: 'idx_item_supplier'
            },
            {
                fields: ['status'],
                name: 'idx_item_status'
            },
            {
                fields: ['lastOrderDate'],
                name: 'idx_last_order_date'
            }
        ]
    });
    
    // 實例方法
    InventoryItem.prototype.checkAbnormal = function() {
        if (!this.lastOrderDate) return false;
        
        const today = new Date();
        const lastOrder = new Date(this.lastOrderDate);
        const diffDays = Math.floor((today - lastOrder) / (1000 * 60 * 60 * 24));
        
        return diffDays >= this.abnormalDays;
    };
    
    InventoryItem.prototype.getDaysWithoutOrder = function() {
        if (!this.lastOrderDate) return 0;
        
        const today = new Date();
        const lastOrder = new Date(this.lastOrderDate);
        const diffDays = Math.floor((today - lastOrder) / (1000 * 60 * 60 * 24));
        
        return Math.max(0, diffDays);
    };
    
    InventoryItem.prototype.updateLastOrder = function(date, quantity) {
        this.lastOrderDate = date;
        this.lastOrderQuantity = quantity;
        return this.save();
    };
    
    // 類方法
    InventoryItem.findByCategory = async function(category) {
        return await this.findAll({
            where: {
                category: category,
                isDeleted: false,
                status: '上架'
            },
            order: [['itemName', 'ASC']]
        });
    };
    
    InventoryItem.findAbnormalItems = async function() {
        const items = await this.findAll({
            where: {
                isDeleted: false,
                status: '上架',
                lastOrderDate: {
                    [sequelize.Op.not]: null
                }
            }
        });
        
        return items.filter(item => item.checkAbnormal());
    };
    
    InventoryItem.findBySupplier = async function(supplier) {
        return await this.findAll({
            where: {
                supplier: supplier,
                isDeleted: false
            },
            order: [['category', 'ASC'], ['itemName', 'ASC']]
        });
    };
    
    return InventoryItem;
};