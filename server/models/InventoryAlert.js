/**
 * ==========================================
 * 庫存警報模型 - InventoryAlert Model
 * ==========================================
 * 基於進階異常監控需求 - 智能警報系統
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const InventoryAlert = sequelize.define('InventoryAlert', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        
        // 警報關聯
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
        storeName: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: '關聯分店'
        },
        
        // 警報類型和級別
        alertType: {
            type: DataTypes.ENUM(
                'low_stock',       // 低庫存
                'out_of_stock',    // 缺貨
                'no_order_long',   // 太久沒叫貨
                'frequent_order',  // 叫貨太頻繁
                'new_item_no_order', // 新品項無叫貨記錄
                'expired_item',    // 品項即將過期
                'abnormal_consumption' // 異常消耗
            ),
            allowNull: false,
            comment: '警報類型'
        },
        severity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 2,
            comment: '嚴重程度: 1=低 2=中 3=高 4=緊急'
        },
        
        // 警報內容
        title: {
            type: DataTypes.STRING(200),
            allowNull: false,
            comment: '警報標題'
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false,
            comment: '警報詳細信息'
        },
        
        // 警報數據
        currentValue: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: '當前值 (庫存量、天數等)'
        },
        thresholdValue: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: '閾值 (警戒值等)'
        },
        analysisData: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: '分析數據 - JSON格式'
        },
        
        // 警報狀態管理
        status: {
            type: DataTypes.ENUM('active', 'resolved', 'ignored', 'escalated'),
            allowNull: false,
            defaultValue: 'active',
            comment: '警報狀態'
        },
        isResolved: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: '是否已解決'
        },
        resolvedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '解決時間'
        },
        resolvedBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: '解決操作者ID'
        },
        resolvedReason: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '解決方式說明'
        },
        
        // 通知記錄
        notificationSent: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: '是否已發送通知'
        },
        notificationCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: '通知次數'
        },
        lastNotificationAt: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '最後通知時間'
        },
        
        // 系統記錄
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
        tableName: 'inventory_alerts',
        timestamps: true,
        indexes: [
            {
                fields: ['itemId', 'alertType'],
                name: 'idx_item_alert_type'
            },
            {
                fields: ['severity', 'status'],
                name: 'idx_severity_status'
            },
            {
                fields: ['status', 'createdAt'],
                name: 'idx_status_created'
            },
            {
                fields: ['alertType'],
                name: 'idx_alert_type'
            }
        ]
    });
    
    // 模型關聯
    InventoryAlert.associate = (models) => {
        InventoryAlert.belongsTo(models.InventoryItem, {
            foreignKey: 'itemId',
            as: 'alertItem'
        });
        
        InventoryAlert.belongsTo(models.Employee, {
            foreignKey: 'resolvedBy',
            as: 'resolver'
        });
    };
    
    // 實例方法
    InventoryAlert.prototype.resolve = async function(resolvedBy, reason) {
        await this.update({
            status: 'resolved',
            isResolved: true,
            resolvedAt: new Date(),
            resolvedBy: resolvedBy,
            resolvedReason: reason
        });
    };
    
    InventoryAlert.prototype.escalate = async function() {
        await this.update({
            status: 'escalated',
            severity: Math.min(4, this.severity + 1)
        });
    };
    
    InventoryAlert.prototype.markNotificationSent = async function() {
        await this.update({
            notificationSent: true,
            notificationCount: this.notificationCount + 1,
            lastNotificationAt: new Date()
        });
    };
    
    // 類方法
    InventoryAlert.createLowStockAlert = async function(item) {
        const existingAlert = await this.findOne({
            where: {
                itemId: item.id,
                alertType: 'low_stock',
                status: 'active'
            }
        });
        
        if (existingAlert) return existingAlert;
        
        const severity = item.currentStock === 0 ? 4 : 
                        item.currentStock < item.lowStockThreshold / 2 ? 3 : 2;
        
        return await this.create({
            itemId: item.id,
            itemName: item.itemName,
            alertType: item.currentStock === 0 ? 'out_of_stock' : 'low_stock',
            severity: severity,
            title: item.currentStock === 0 ? 
                   `${item.itemName} 已缺貨` : 
                   `${item.itemName} 庫存不足`,
            message: `當前庫存: ${item.currentStock} ${item.unit}, 警戒值: ${item.lowStockThreshold} ${item.unit}`,
            currentValue: item.currentStock,
            thresholdValue: item.lowStockThreshold,
            analysisData: {
                unit: item.unit,
                supplier: item.supplier,
                leadTime: item.supplierLeadTime,
                suggestedOrder: Math.max(item.autoRestockLevel - item.currentStock, 1)
            }
        });
    };
    
    InventoryAlert.createNoOrderAlert = async function(item, daysSinceOrder) {
        return await this.create({
            itemId: item.id,
            itemName: item.itemName,
            alertType: 'no_order_long',
            severity: daysSinceOrder > item.abnormalDays * 2 ? 3 : 2,
            title: `${item.itemName} 已${daysSinceOrder}天未叫貨`,
            message: `超過異常閾值 ${item.abnormalDays} 天，上次叫貨: ${item.lastOrderDate}，數量: ${item.lastOrderQuantity} ${item.unit}`,
            currentValue: daysSinceOrder,
            thresholdValue: item.abnormalDays,
            analysisData: {
                lastOrderDate: item.lastOrderDate,
                lastOrderQuantity: item.lastOrderQuantity,
                unit: item.unit,
                supplier: item.supplier
            }
        });
    };
    
    InventoryAlert.createFrequentOrderAlert = async function(item, ordersCount) {
        return await this.create({
            itemId: item.id,
            itemName: item.itemName,
            alertType: 'frequent_order',
            severity: 2,
            title: `${item.itemName} 叫貨過於頻繁`,
            message: `${item.frequentOrderDays}天內已叫貨${ordersCount}次，超過上限${item.maxOrdersInPeriod}次`,
            currentValue: ordersCount,
            thresholdValue: item.maxOrdersInPeriod,
            analysisData: {
                checkPeriodDays: item.frequentOrderDays,
                unit: item.unit,
                supplier: item.supplier
            }
        });
    };
    
    InventoryAlert.getActiveAlerts = async function(severity = null) {
        const where = { status: 'active' };
        if (severity) where.severity = severity;
        
        return await this.findAll({
            where,
            order: [['severity', 'DESC'], ['createdAt', 'ASC']],
            include: [{
                model: sequelize.models.InventoryItem,
                as: 'alertItem',
                attributes: ['itemName', 'category', 'supplier', 'unit']
            }]
        });
    };
    
    InventoryAlert.getItemAlerts = async function(itemId) {
        return await this.findAll({
            where: { itemId: itemId },
            order: [['createdAt', 'DESC']],
            limit: 20
        });
    };
    
    return InventoryAlert;
};