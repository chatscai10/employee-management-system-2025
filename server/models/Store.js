
/**
 * ===================================
 * 分店資訊模型 - Store Model
 * ===================================
 * 基於系統邏輯.txt規格 - 3店面設定
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Store = sequelize.define('Store', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        
        // 分店基本資訊 (系統邏輯.txt line 44-71)
        name: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
            comment: '店名'
        },
        people: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 2,
            comment: '排班系統使用的各分店每日最少職班人數'
        },
        openTime: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: '1500-0200',
            comment: '營業時間 (格式: HHMM-HHMM)'
        },
        latitude: {
            type: DataTypes.DECIMAL(10, 7),
            allowNull: false,
            comment: 'GPS緯度座標'
        },
        longitude: {
            type: DataTypes.DECIMAL(10, 7),
            allowNull: false,
            comment: 'GPS經度座標'
        },
        radius: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '允許打卡範圍 (公尺)'
        },
        address: {
            type: DataTypes.TEXT,
            allowNull: false,
            comment: '詳細地址'
        },
        
        // 排班相關設定
        holidayDates: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: [],
            comment: '各分店本月公休日期 (JSON格式)'
        },
        forbiddenDates: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: [],
            comment: '各分店本月禁休日期 (JSON格式)'
        },
        
        // 系統狀態
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
            comment: '是否營業中'
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
        tableName: 'stores',
        timestamps: true,
        indexes: [
            {
                fields: ['name'],
                unique: true,
                name: 'unique_store_name'
            },
            {
                fields: ['isActive'],
                name: 'idx_active_stores'
            }
        ]
    });

    // 模型關聯
    Store.associate = (models) => {
        Store.hasMany(models.AttendanceRecord, {
            foreignKey: 'storeName',
            sourceKey: 'name',
            as: 'storeAttendanceRecords'
        });
        
        Store.hasMany(models.RevenueRecord, {
            foreignKey: 'storeName',
            sourceKey: 'name',
            as: 'storeRevenueRecords'
        });
        
        if (models.Schedule) {
            Store.hasMany(models.Schedule, {
                foreignKey: 'storeName',
                sourceKey: 'name',
                as: 'storeSchedules'
            });
        }
        
        if (models.OrderRecord) {
            Store.hasMany(models.OrderRecord, {
                foreignKey: 'storeName',
                sourceKey: 'name',
                as: 'storeOrderRecords'
            });
        }
        
        if (models.MaintenanceRequest) {
            Store.hasMany(models.MaintenanceRequest, {
                foreignKey: 'storeName',
                sourceKey: 'name',
                as: 'storeMaintenanceRequests'
            });
        }
    };

    // 實例方法
    Store.prototype.calculateDistance = function(latitude, longitude) {
        const R = 6371e3; // 地球半徑 (公尺)
        const φ1 = this.latitude * Math.PI / 180;
        const φ2 = latitude * Math.PI / 180;
        const Δφ = (latitude - this.latitude) * Math.PI / 180;
        const Δλ = (longitude - this.longitude) * Math.PI / 180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return Math.round(R * c); // 回傳距離 (公尺)
    };

    Store.prototype.isWithinClockingRange = function(latitude, longitude) {
        const distance = this.calculateDistance(latitude, longitude);
        return distance <= this.radius;
    };

    Store.prototype.getOpenCloseTime = function() {
        const [open, close] = this.openTime.split('-');
        return {
            open: {
                hour: parseInt(open.substring(0, 2)),
                minute: parseInt(open.substring(2, 4))
            },
            close: {
                hour: parseInt(close.substring(0, 2)),
                minute: parseInt(close.substring(2, 4))
            }
        };
    };

    // 預設資料種子 (系統邏輯.txt line 44-71)
    Store.getDefaultStores = function() {
        return [
            {
                name: '內壢忠孝店',
                people: 2,
                openTime: '1500-0200',
                latitude: 24.9748412,
                longitude: 121.2556713,
                radius: 100000,
                address: '桃園市中壢區忠孝路93-1號'
            },
            {
                name: '桃園龍安店',
                people: 2,
                openTime: '1500-0200',
                latitude: 24.9880023,
                longitude: 121.2812737,
                radius: 100,
                address: '桃園市桃園區龍安街38-8號'
            },
            {
                name: '中壢龍崗店',
                people: 2,
                openTime: '1500-0200',
                latitude: 24.9298502,
                longitude: 121.2529472,
                radius: 100,
                address: '桃園市中壢區龍東路190號正對面'
            }
        ];
    };

    return Store;
};