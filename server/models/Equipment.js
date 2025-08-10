/**
 * =======================================
 * 設備管理模型 - Equipment
 * =======================================
 * 管理店舖設備和維修保養資訊
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Equipment = sequelize.define('Equipment', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        equipmentCode: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
            comment: '設備編號'
        },
        equipmentName: {
            type: DataTypes.STRING(200),
            allowNull: false,
            comment: '設備名稱'
        },
        category: {
            type: DataTypes.ENUM('refrigeration', 'cooking', 'cleaning', 'pos', 'hvac', 'lighting', 'security', 'other'),
            allowNull: false,
            comment: '設備類別'
        },
        brand: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: '品牌'
        },
        model: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: '型號'
        },
        serialNumber: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: '序號'
        },
        storeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '所屬門市ID'
        },
        location: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: '設備位置'
        },
        purchaseDate: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '購買日期'
        },
        purchasePrice: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            comment: '購買價格'
        },
        warrantyExpiry: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '保固到期日'
        },
        status: {
            type: DataTypes.ENUM('active', 'maintenance', 'broken', 'retired'),
            allowNull: false,
            defaultValue: 'active',
            comment: '設備狀態'
        },
        condition: {
            type: DataTypes.ENUM('excellent', 'good', 'fair', 'poor', 'critical'),
            allowNull: false,
            defaultValue: 'good',
            comment: '設備狀況'
        },
        lastMaintenanceDate: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '上次保養日期'
        },
        nextMaintenanceDate: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '下次保養日期'
        },
        maintenanceInterval: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: '保養間隔(天)'
        },
        specifications: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: '設備規格 (JSON格式)'
        },
        operatingInstructions: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '操作說明'
        },
        safetyNotes: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '安全注意事項'
        },
        vendor: {
            type: DataTypes.STRING(200),
            allowNull: true,
            comment: '供應商'
        },
        vendorContact: {
            type: DataTypes.STRING(200),
            allowNull: true,
            comment: '供應商聯絡方式'
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '備註'
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: '是否啟用'
        },
        depreciation: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: '折舊資訊 (JSON格式)'
        },
        energyRating: {
            type: DataTypes.STRING(10),
            allowNull: true,
            comment: '能源等級'
        },
        criticalLevel: {
            type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
            allowNull: false,
            defaultValue: 'medium',
            comment: '重要程度'
        }
    }, {
        tableName: 'equipment',
        timestamps: true,
        indexes: [
            {
                fields: ['equipmentCode'],
                unique: true
            },
            {
                fields: ['storeId']
            },
            {
                fields: ['category']
            },
            {
                fields: ['status']
            },
            {
                fields: ['nextMaintenanceDate']
            }
        ]
    });

    // 關聯設定
    Equipment.associate = (models) => {
        // 關聯門市
        Equipment.belongsTo(models.Store, {
            foreignKey: 'storeId',
            as: 'Store'
        });

        // 關聯維修任務
        Equipment.hasMany(models.MaintenanceTask, {
            foreignKey: 'equipmentId',
            as: 'MaintenanceTasks'
        });

        // 關聯維修記錄
        Equipment.hasMany(models.MaintenanceRecord, {
            foreignKey: 'equipmentId',
            as: 'MaintenanceRecords'
        });
    };

    // 實例方法
    Equipment.prototype.isMaintenanceDue = function() {
        if (!this.nextMaintenanceDate) return false;
        return new Date() >= new Date(this.nextMaintenanceDate);
    };

    Equipment.prototype.getDaysUntilMaintenance = function() {
        if (!this.nextMaintenanceDate) return null;
        const today = new Date();
        const maintenance = new Date(this.nextMaintenanceDate);
        const diffTime = maintenance - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    Equipment.prototype.isWarrantyValid = function() {
        if (!this.warrantyExpiry) return false;
        return new Date() <= new Date(this.warrantyExpiry);
    };

    Equipment.prototype.getDaysUntilWarrantyExpiry = function() {
        if (!this.warrantyExpiry) return null;
        const today = new Date();
        const expiry = new Date(this.warrantyExpiry);
        const diffTime = expiry - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    Equipment.prototype.calculateAge = function() {
        if (!this.purchaseDate) return null;
        const today = new Date();
        const purchase = new Date(this.purchaseDate);
        const diffTime = today - purchase;
        return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365.25));
    };

    Equipment.prototype.updateNextMaintenanceDate = function() {
        if (!this.lastMaintenanceDate || !this.maintenanceInterval) return;
        
        const lastDate = new Date(this.lastMaintenanceDate);
        const nextDate = new Date(lastDate);
        nextDate.setDate(lastDate.getDate() + this.maintenanceInterval);
        
        this.nextMaintenanceDate = nextDate;
        return nextDate;
    };

    // 靜態方法
    Equipment.getMaintenanceDue = async function() {
        const today = new Date();
        return await this.findAll({
            where: {
                nextMaintenanceDate: {
                    [this.sequelize.Sequelize.Op.lte]: today
                },
                status: 'active',
                isActive: true
            },
            include: ['Store']
        });
    };

    Equipment.getUpcomingMaintenance = async function(days = 7) {
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + days);

        return await this.findAll({
            where: {
                nextMaintenanceDate: {
                    [this.sequelize.Sequelize.Op.between]: [today, futureDate]
                },
                status: 'active',
                isActive: true
            },
            include: ['Store']
        });
    };

    Equipment.getBrokenEquipment = async function() {
        return await this.findAll({
            where: {
                status: 'broken',
                isActive: true
            },
            include: ['Store']
        });
    };

    Equipment.getEquipmentByStore = async function(storeId) {
        return await this.findAll({
            where: {
                storeId,
                isActive: true
            },
            order: [['category', 'ASC'], ['equipmentName', 'ASC']]
        });
    };

    Equipment.getCriticalEquipment = async function() {
        return await this.findAll({
            where: {
                criticalLevel: ['high', 'critical'],
                status: ['active', 'maintenance'],
                isActive: true
            },
            include: ['Store']
        });
    };

    Equipment.getWarrantyExpiring = async function(days = 30) {
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + days);

        return await this.findAll({
            where: {
                warrantyExpiry: {
                    [this.sequelize.Sequelize.Op.between]: [today, futureDate]
                },
                isActive: true
            },
            include: ['Store']
        });
    };

    return Equipment;
};