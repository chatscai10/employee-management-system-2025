/**
 * ==========================================
 * 庫存變動日誌模型 - InventoryLog Model
 * ==========================================
 * 基於進階庫存管理需求 - 庫存變動追蹤
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const InventoryLog = sequelize.define('InventoryLog', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        
        // 品項關聯
        itemId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '品項ID',
            references: {
                model: 'inventory_items',
                key: 'id'
            }
        },
        itemName: {
            type: DataTypes.STRING(100),
            allowNull: false,
            comment: '品項名稱 (快照)'
        },
        
        // 操作資訊
        actionType: {
            type: DataTypes.ENUM('order', 'consume', 'adjust', 'waste', 'return'),
            allowNull: false,
            comment: '操作類型: order=叫貨, consume=消耗, adjust=調整, waste=報廢, return=退貨'
        },
        
        // 庫存變動
        quantityBefore: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '操作前庫存量'
        },
        quantityAfter: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '操作後庫存量'
        },
        quantityChange: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '庫存變動量 (+增加, -減少)'
        },
        
        // 操作原因和詳情
        reason: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '操作原因說明'
        },
        referenceId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: '關聯單號 (訂單ID等)'
        },
        referenceType: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: '關聯類型 (inventory_order等)'
        },
        
        // 操作者資訊
        operatorId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: '操作員工ID'
        },
        operatorName: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: '操作員工姓名'
        },
        operatorType: {
            type: DataTypes.ENUM('employee', 'system', 'admin'),
            allowNull: false,
            defaultValue: 'system',
            comment: '操作者類型'
        },
        
        // 系統資訊
        storeName: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: '關聯分店'
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '備註信息'
        },
        
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'inventory_logs',
        timestamps: false,
        indexes: [
            {
                fields: ['itemId', 'createdAt'],
                name: 'idx_item_created'
            },
            {
                fields: ['actionType'],
                name: 'idx_action_type'
            },
            {
                fields: ['operatorId'],
                name: 'idx_operator'
            },
            {
                fields: ['createdAt'],
                name: 'idx_created_at'
            }
        ]
    });
    
    // 模型關聯
    InventoryLog.associate = (models) => {
        InventoryLog.belongsTo(models.InventoryItem, {
            foreignKey: 'itemId',
            as: 'logItem'
        });
        
        InventoryLog.belongsTo(models.Employee, {
            foreignKey: 'operatorId',
            as: 'logOperator'
        });
    };
    
    // 類方法
    InventoryLog.createOrderLog = async function(itemId, itemName, quantityBefore, quantityAfter, orderId, operatorName) {
        return await this.create({
            itemId: itemId,
            itemName: itemName,
            actionType: 'order',
            quantityBefore: quantityBefore,
            quantityAfter: quantityAfter,
            quantityChange: quantityAfter - quantityBefore,
            reason: '叫貨補充庫存',
            referenceId: orderId,
            referenceType: 'inventory_order',
            operatorName: operatorName,
            operatorType: 'employee'
        });
    };
    
    InventoryLog.createAdjustLog = async function(itemId, itemName, quantityBefore, quantityAfter, reason, operatorId, operatorName) {
        return await this.create({
            itemId: itemId,
            itemName: itemName,
            actionType: 'adjust',
            quantityBefore: quantityBefore,
            quantityAfter: quantityAfter,
            quantityChange: quantityAfter - quantityBefore,
            reason: reason || '庫存調整',
            operatorId: operatorId,
            operatorName: operatorName,
            operatorType: 'admin'
        });
    };
    
    InventoryLog.getItemHistory = async function(itemId, limit = 50) {
        return await this.findAll({
            where: { itemId: itemId },
            order: [['createdAt', 'DESC']],
            limit: limit,
            include: [{
                model: sequelize.models.Employee,
                as: 'logOperator',
                attributes: ['name', 'currentStore']
            }]
        });
    };
    
    return InventoryLog;
};