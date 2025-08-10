/**
 * ==========================================
 * 叫貨訂單模型 - InventoryOrder Model
 * ==========================================
 * 基於系統邏輯.txt規格 - 叫貨管理系統
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const InventoryOrder = sequelize.define('InventoryOrder', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        
        // 訂單基本資訊 (系統邏輯.txt line 215-222)
        employeeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '叫貨員工ID',
            references: {
                model: 'employees',
                key: 'id'
            }
        },
        employeeName: {
            type: DataTypes.STRING(50),
            allowNull: false,
            comment: '叫貨員工姓名'
        },
        storeName: {
            type: DataTypes.STRING(50),
            allowNull: false,
            comment: '分店名稱'
        },
        
        // 送貨資訊
        deliveryDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            comment: '送貨日期'
        },
        orderDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            comment: '叫貨日期'
        },
        
        // 訂單明細 (JSON格式存儲品項清單)
        orderItems: {
            type: DataTypes.JSON,
            allowNull: false,
            comment: '訂單品項明細 - JSON格式'
        },
        
        // 金額統計
        totalAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
            comment: '總金額'
        },
        totalItems: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: '總品項數'
        },
        totalQuantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: '總數量'
        },
        
        // 廠商分析 (依廠商分類品項排序 - 系統邏輯.txt line 283)
        supplierAnalysis: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: '廠商分類分析 - JSON格式'
        },
        
        // 訂單狀態
        status: {
            type: DataTypes.ENUM('待處理', '已確認', '已送達', '已完成', '已取消'),
            allowNull: false,
            defaultValue: '待處理',
            comment: '訂單狀態'
        },
        
        // 異常報告 (系統邏輯.txt line 227-228)
        abnormalReport: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '品項異常問題報告'
        },
        abnormalReportedBy: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: '異常回報員工'
        },
        abnormalReportedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '異常回報時間'
        },
        
        // 備註
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '訂單備註'
        },
        
        // 系統記錄
        isDeleted: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: '是否已作廢'
        },
        deletedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '作廢時間'
        },
        deletedBy: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: '作廢操作者'
        },
        deletedReason: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '作廢原因'
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
        tableName: 'inventory_orders',
        timestamps: true,
        indexes: [
            {
                fields: ['employeeId', 'orderDate'],
                name: 'idx_employee_order_date'
            },
            {
                fields: ['storeName', 'orderDate'],
                name: 'idx_store_order_date'
            },
            {
                fields: ['deliveryDate'],
                name: 'idx_delivery_date'
            },
            {
                fields: ['status'],
                name: 'idx_order_status'
            },
            {
                fields: ['orderDate'],
                name: 'idx_order_date'
            }
        ]
    });
    
    // 模型關聯
    InventoryOrder.associate = (models) => {
        InventoryOrder.belongsTo(models.Employee, {
            foreignKey: 'employeeId',
            as: 'orderEmployee'
        });
    };
    
    // 實例方法
    InventoryOrder.prototype.calculateTotals = function() {
        if (!this.orderItems || !Array.isArray(this.orderItems)) return;
        
        let totalAmount = 0;
        let totalItems = 0;
        let totalQuantity = 0;
        
        this.orderItems.forEach(item => {
            totalAmount += (item.costPrice || 0) * (item.quantity || 0);
            totalItems += 1;
            totalQuantity += item.quantity || 0;
        });
        
        this.totalAmount = totalAmount;
        this.totalItems = totalItems;
        this.totalQuantity = totalQuantity;
    };
    
    InventoryOrder.prototype.generateSupplierAnalysis = function() {
        if (!this.orderItems || !Array.isArray(this.orderItems)) return {};
        
        const analysis = {};
        
        this.orderItems.forEach(item => {
            const supplier = item.supplier || '未知廠商';
            
            if (!analysis[supplier]) {
                analysis[supplier] = {
                    supplierName: supplier,
                    items: [],
                    totalAmount: 0,
                    totalQuantity: 0
                };
            }
            
            analysis[supplier].items.push({
                category: item.category,
                itemName: item.itemName,
                quantity: item.quantity,
                unit: item.unit,
                costPrice: item.costPrice,
                subtotal: item.costPrice * item.quantity
            });
            
            analysis[supplier].totalAmount += item.costPrice * item.quantity;
            analysis[supplier].totalQuantity += item.quantity;
        });
        
        this.supplierAnalysis = analysis;
        return analysis;
    };
    
    InventoryOrder.prototype.reportAbnormal = function(employeeName, problem) {
        this.abnormalReport = problem;
        this.abnormalReportedBy = employeeName;
        this.abnormalReportedAt = new Date();
        return this.save();
    };
    
    // 類方法
    InventoryOrder.findByStore = async function(storeName, startDate, endDate) {
        const where = {
            storeName: storeName,
            isDeleted: false
        };
        
        if (startDate && endDate) {
            where.orderDate = {
                [sequelize.Op.between]: [startDate, endDate]
            };
        }
        
        return await this.findAll({
            where,
            order: [['orderDate', 'DESC'], ['createdAt', 'DESC']],
            include: [{
                model: sequelize.models.Employee,
                as: 'orderEmployee',
                attributes: ['name', 'currentStore']
            }]
        });
    };
    
    InventoryOrder.findRecentByEmployee = async function(employeeId, limit = 10) {
        return await this.findAll({
            where: {
                employeeId: employeeId,
                isDeleted: false
            },
            order: [['orderDate', 'DESC'], ['createdAt', 'DESC']],
            limit: limit
        });
    };
    
    InventoryOrder.findTodayOrders = async function() {
        const today = new Date().toISOString().split('T')[0];
        
        return await this.findAll({
            where: {
                orderDate: today,
                isDeleted: false
            },
            order: [['storeName', 'ASC'], ['createdAt', 'DESC']]
        });
    };
    
    return InventoryOrder;
};