
/**
 * ===========================================
 * 打卡記錄模型 - AttendanceRecord Model  
 * ===========================================
 * 基於系統邏輯.txt規格 - GPS打卡系統
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const AttendanceRecord = sequelize.define('AttendanceRecord', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        
        // 員工資訊 (系統邏輯.txt line 173)
        employeeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '員工ID',
            references: {
                model: 'employees',
                key: 'id'
            }
        },
        employeeName: {
            type: DataTypes.STRING(50),
            allowNull: false,
            comment: '員工姓名'
        },
        
        // 打卡時間和狀態 (系統邏輯.txt line 173)
        clockTime: {
            type: DataTypes.DATE,
            allowNull: false,
            comment: '打卡時間'
        },
        clockType: {
            type: DataTypes.ENUM('上班', '下班'),
            allowNull: false,
            comment: '打卡類型'
        },
        status: {
            type: DataTypes.ENUM('正常', '遲到', '早退', '異常'),
            allowNull: false,
            defaultValue: '正常',
            comment: '打卡狀態'
        },
        
        // 地理位置資訊 (系統邏輯.txt line 173)
        storeName: {
            type: DataTypes.STRING(50),
            allowNull: false,
            comment: '打卡分店 - 系統自動判斷'
        },
        latitude: {
            type: DataTypes.DECIMAL(10, 7),
            allowNull: false,
            comment: '打卡座標 - 緯度'
        },
        longitude: {
            type: DataTypes.DECIMAL(10, 7),
            allowNull: false,
            comment: '打卡座標 - 經度'
        },
        distance: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '距離分店公尺數'
        },
        
        // 設備指紋檢測 (系統邏輯.txt line 180)
        deviceFingerprint: {
            type: DataTypes.JSON,
            allowNull: false,
            comment: '設備指紋資訊 - 檢查身分紀錄'
        },
        
        // 遲到計算 (系統邏輯.txt line 408)
        lateMinutes: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: '遲到分鐘數'
        },
        monthlyLateTotalMinutes: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: '本月累計遲到分鐘數'
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
        tableName: 'attendance_records',
        timestamps: true,
        indexes: [
            {
                fields: ['employeeId', 'clockTime'],
                name: 'idx_employee_clock_time'
            },
            {
                fields: ['storeName', 'clockTime'],
                name: 'idx_store_clock_time'
            },
            {
                fields: ['clockTime'],
                name: 'idx_clock_time'
            },
            {
                fields: ['status'],
                name: 'idx_attendance_status'
            }
        ]
    });

    // 模型關聯
    AttendanceRecord.associate = (models) => {
        AttendanceRecord.belongsTo(models.Employee, {
            foreignKey: 'employeeId',
            as: 'attendanceEmployee'
        });
    };

    // 實例方法
    AttendanceRecord.prototype.calculateLateMinutes = function(storeOpenTime) {
        if (this.clockType !== '上班') return 0;
        
        const clockTime = new Date(this.clockTime);
        const openHour = parseInt(storeOpenTime.split('-')[0].substring(0, 2));
        const openMinute = parseInt(storeOpenTime.split('-')[0].substring(2, 4));
        
        // 處理跨日營業時間 (15:00-02:00)
        let openDateTime = new Date(clockTime);
        if (openHour >= 15) {
            // 下午開店時間
            openDateTime.setHours(openHour, openMinute, 0, 0);
        } else {
            // 跨日到隔天的開店時間
            openDateTime.setDate(openDateTime.getDate() + 1);
            openDateTime.setHours(openHour, openMinute, 0, 0);
        }
        
        if (clockTime > openDateTime) {
            const diffMs = clockTime - openDateTime;
            return Math.floor(diffMs / (1000 * 60));
        }
        
        return 0;
    };

    AttendanceRecord.prototype.isDeviceFingerprintAbnormal = function(previousRecords) {
        if (!previousRecords || previousRecords.length === 0) return false;
        
        const currentFingerprint = this.deviceFingerprint;
        const lastRecord = previousRecords[0];
        const lastFingerprint = lastRecord.deviceFingerprint;
        
        // 比較關鍵設備參數
        const keyFields = ['userAgent', 'screen', 'timezone', 'platform'];
        
        for (const field of keyFields) {
            if (currentFingerprint[field] !== lastFingerprint[field]) {
                return true;
            }
        }
        
        return false;
    };

    // 類方法
    AttendanceRecord.findRecentByEmployee = async function(employeeId, limit = 5) {
        return await this.findAll({
            where: {
                employeeId: employeeId,
                isDeleted: false
            },
            order: [['clockTime', 'DESC']],
            limit: limit,
            include: [{
                model: sequelize.models.Employee,
                as: 'attendanceEmployee',
                attributes: ['name', 'currentStore']
            }]
        });
    };

    AttendanceRecord.calculateMonthlyLateMinutes = async function(employeeId, year, month) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        
        const records = await this.findAll({
            where: {
                employeeId: employeeId,
                clockType: '上班',
                clockTime: {
                    [sequelize.Op.between]: [startDate, endDate]
                },
                isDeleted: false
            }
        });
        
        return records.reduce((total, record) => total + record.lateMinutes, 0);
    };

    AttendanceRecord.findTodayByEmployee = async function(employeeId) {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        
        return await this.findAll({
            where: {
                employeeId: employeeId,
                clockTime: {
                    [sequelize.Op.between]: [startOfDay, endOfDay]
                },
                isDeleted: false
            },
            order: [['clockTime', 'ASC']]
        });
    };

    return AttendanceRecord;
};