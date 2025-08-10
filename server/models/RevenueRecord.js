
/**
 * ========================================
 * 營收記錄模型 - RevenueRecord Model
 * ========================================
 * 基於系統邏輯.txt規格 - 營收管理系統
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const RevenueRecord = sequelize.define('RevenueRecord', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        
        // 基本資訊 (系統邏輯.txt line 188-196)
        employeeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '提交員工ID',
            references: {
                model: 'employees',
                key: 'id'
            }
        },
        employeeName: {
            type: DataTypes.STRING(50),
            allowNull: false,
            comment: '提交員工姓名'
        },
        storeName: {
            type: DataTypes.STRING(50),
            allowNull: false,
            comment: '分店名稱'
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            comment: '營收日期'
        },
        bonusType: {
            type: DataTypes.ENUM('平日獎金', '假日獎金'),
            allowNull: false,
            comment: '獎金類別'
        },
        orderCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: '訂單數量'
        },
        
        // 收入項目明細 (系統邏輯.txt line 75-101)
        incomeDetails: {
            type: DataTypes.JSON,
            allowNull: false,
            comment: '收入項目詳細 - JSON格式存儲各收入來源'
        },
        totalIncome: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
            comment: '收入總額'
        },
        
        // 支出項目明細 (系統邏輯.txt line 104-105)
        expenseDetails: {
            type: DataTypes.JSON,
            allowNull: false,
            comment: '支出項目詳細 - JSON格式存儲各支出項目'
        },
        totalExpense: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
            comment: '支出總額'
        },
        
        // 獎金計算 (系統邏輯.txt line 201-207)
        netIncome: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
            comment: '淨收入 (收入-支出)'
        },
        bonusAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
            comment: '計算後的獎金金額'
        },
        bonusStatus: {
            type: DataTypes.ENUM('達標', '未達標'),
            allowNull: false,
            comment: '獎金達標狀態'
        },
        targetGap: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            comment: '未達標時的差距金額'
        },
        orderAverage: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
            comment: '平均每單金額'
        },
        
        // 照片上傳 (系統邏輯.txt line 195)
        uploadedPhotos: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: [],
            comment: '上傳的照片列表'
        },
        
        // 備註
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '備註欄位'
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
        tableName: 'revenue_records',
        timestamps: true,
        indexes: [
            {
                fields: ['employeeId', 'date'],
                name: 'idx_employee_date'
            },
            {
                fields: ['storeName', 'date'],
                name: 'idx_store_date'
            },
            {
                fields: ['date'],
                name: 'idx_date'
            },
            {
                fields: ['bonusType'],
                name: 'idx_bonus_type'
            }
        ]
    });

    // 模型關聯
    RevenueRecord.associate = (models) => {
        RevenueRecord.belongsTo(models.Employee, {
            foreignKey: 'employeeId',
            as: 'revenueEmployee'
        });
    };

    // 實例方法 - 計算平日獎金 (系統邏輯.txt line 201-203)
    RevenueRecord.prototype.calculateWeekdayBonus = function() {
        // 平日獎金公式: (收入-服務費) > 13000 取30%
        let netIncomeAfterFee = 0;
        
        if (this.incomeDetails) {
            Object.entries(this.incomeDetails).forEach(([key, value]) => {
                const amount = parseFloat(value.amount || 0);
                const serviceFee = parseFloat(value.serviceFee || 0);
                const includeInBonus = value.includeInBonus !== false;
                
                if (includeInBonus) {
                    netIncomeAfterFee += amount * (1 - serviceFee);
                }
            });
        }
        
        const threshold = 13000;
        if (netIncomeAfterFee > threshold) {
            return (netIncomeAfterFee - threshold) * 0.3;
        }
        
        return 0;
    };

    // 實例方法 - 計算假日獎金 (系統邏輯.txt line 205-207)
    RevenueRecord.prototype.calculateHolidayBonus = function() {
        // 假日獎金公式: (收入-服務費) >= 0 取38%
        let netIncomeAfterFee = 0;
        
        if (this.incomeDetails) {
            Object.entries(this.incomeDetails).forEach(([key, value]) => {
                const amount = parseFloat(value.amount || 0);
                const serviceFee = parseFloat(value.serviceFee || 0);
                const includeInBonus = value.includeInBonus !== false;
                
                if (includeInBonus) {
                    netIncomeAfterFee += amount * (1 - serviceFee);
                }
            });
        }
        
        if (netIncomeAfterFee >= 0) {
            return netIncomeAfterFee * 0.38;
        }
        
        return 0;
    };

    // 實例方法 - 計算獎金和狀態
    RevenueRecord.prototype.calculateBonusAndStatus = function() {
        let bonus = 0;
        let status = '未達標';
        let gap = 0;
        
        if (this.bonusType === '平日獎金') {
            bonus = this.calculateWeekdayBonus();
            if (bonus > 0) {
                status = '達標';
            } else {
                gap = 13000 - this.calculateNetIncomeAfterFee();
            }
        } else if (this.bonusType === '假日獎金') {
            bonus = this.calculateHolidayBonus();
            if (bonus > 0) {
                status = '達標';
            }
        }
        
        this.bonusAmount = bonus;
        this.bonusStatus = status;
        this.targetGap = gap > 0 ? gap : null;
        
        // 計算平均每單
        if (this.orderCount > 0) {
            this.orderAverage = this.totalIncome / this.orderCount;
        }
    };

    RevenueRecord.prototype.calculateNetIncomeAfterFee = function() {
        let netIncomeAfterFee = 0;
        
        if (this.incomeDetails) {
            Object.entries(this.incomeDetails).forEach(([key, value]) => {
                const amount = parseFloat(value.amount || 0);
                const serviceFee = parseFloat(value.serviceFee || 0);
                const includeInBonus = value.includeInBonus !== false;
                
                if (includeInBonus) {
                    netIncomeAfterFee += amount * (1 - serviceFee);
                }
            });
        }
        
        return netIncomeAfterFee;
    };

    // 類方法 - 查找最近記錄 (系統邏輯.txt line 210)
    RevenueRecord.findRecentByStore = async function(storeName, limit = 3) {
        return await this.findAll({
            where: {
                storeName: storeName,
                isDeleted: false
            },
            order: [['date', 'DESC'], ['createdAt', 'DESC']],
            limit: limit,
            include: [{
                model: sequelize.models.Employee,
                as: 'revenueEmployee',
                attributes: ['name']
            }]
        });
    };

    RevenueRecord.findByDateRange = async function(storeName, startDate, endDate) {
        return await this.findAll({
            where: {
                storeName: storeName,
                date: {
                    [sequelize.Op.between]: [startDate, endDate]
                },
                isDeleted: false
            },
            order: [['date', 'ASC']],
            include: [{
                model: sequelize.models.Employee,
                as: 'revenueEmployee',
                attributes: ['name']
            }]
        });
    };

    // 預設收入項目設定 (系統邏輯.txt line 75-101)
    RevenueRecord.getDefaultIncomeTypes = function() {
        return {
            '現場營業額': { serviceFee: 0, includeInBonus: true },
            '線上點餐': { serviceFee: 0, includeInBonus: true },
            '熊貓點餐': { serviceFee: 0.35, includeInBonus: true },
            'uber點餐': { serviceFee: 0.35, includeInBonus: true },
            '廢油回收': { serviceFee: 0, includeInBonus: false }
        };
    };

    // 預設支出項目 (系統邏輯.txt line 104-105)
    RevenueRecord.getDefaultExpenseTypes = function() {
        return ['瓦斯', '水電', '房租', '貨款', '清潔費', '其他'];
    };

    // 預設照片類別 (系統邏輯.txt line 107-108)
    RevenueRecord.getDefaultPhotoCategories = function() {
        return ['廢油回收', '器具保養', '貨款單據', '其他開支'];
    };

    return RevenueRecord;
};