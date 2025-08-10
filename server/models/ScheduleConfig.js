/**
 * ===================================
 * 排班配置模型 - ScheduleConfig Model
 * ===================================
 * 排班系統配置表 - 6重規則參數設定
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ScheduleConfig = sequelize.define('ScheduleConfig', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        configYear: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '配置年份'
        },
        configMonth: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '配置月份'
        },
        maxOffDaysPerPerson: {
            type: DataTypes.INTEGER,
            defaultValue: 8,
            comment: '每人每月休假天數上限'
        },
        maxOffDaysPerDay: {
            type: DataTypes.INTEGER,
            defaultValue: 2,
            comment: '每日休假總人數上限'
        },
        maxWeekendOffDays: {
            type: DataTypes.INTEGER,
            defaultValue: 3,
            comment: '每人每月週末休假天數上限'
        },
        maxStoreOffDaysPerDay: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
            comment: '同分店每日休假人數上限'
        },
        maxPartTimeOffDays: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
            comment: '兼職員工每日休假人數上限'
        },
        maxStandbyOffDays: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
            comment: '待命員工每日休假人數上限'
        },
        systemOpenDate: {
            type: DataTypes.DATE,
            allowNull: false,
            comment: '系統開啟時間'
        },
        systemCloseDate: {
            type: DataTypes.DATE,
            allowNull: false,
            comment: '系統關閉時間'
        },
        scheduleTimeLimit: {
            type: DataTypes.INTEGER,
            defaultValue: 5,
            comment: '單次排班時間限制(分鐘)'
        },
        holidayDates: {
            type: DataTypes.JSON,
            defaultValue: [],
            comment: '全域公休日期陣列'
        },
        forbiddenDates: {
            type: DataTypes.JSON,
            defaultValue: [],
            comment: '全域禁休日期陣列'
        },
        storeHolidayDates: {
            type: DataTypes.JSON,
            defaultValue: {},
            comment: '分店公休日期物件'
        },
        storeForbiddenDates: {
            type: DataTypes.JSON,
            defaultValue: {},
            comment: '分店禁休日期物件'
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: '配置是否啟用'
        }
    }, {
        tableName: 'schedule_config',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['configYear', 'configMonth', 'isActive'],
                name: 'idx_config_period_active',
                where: { isActive: true }
            },
            {
                fields: ['configYear', 'configMonth'],
                name: 'idx_config_period'
            }
        ],
        comment: '排班系統配置表'
    });

    // 靜態方法：獲取配置(自動創建預設配置)
    ScheduleConfig.getConfig = async function(year, month) {
        try {
            let config = await this.findOne({
                where: { configYear: year, configMonth: month, isActive: true }
            });

            // 如果沒有配置，創建預設配置
            if (!config) {
                config = await this.createDefaultConfig(year, month);
            }

            return config;
        } catch (error) {
            console.error('獲取排班配置錯誤:', error);
            return null;
        }
    };

    // 靜態方法：創建預設配置
    ScheduleConfig.createDefaultConfig = async function(year, month) {
        try {
            // 計算系統開啟和關閉時間
            const systemOpenDate = new Date(year, month - 1, 16, 2, 0, 0); // 16日 02:00
            const systemCloseDate = new Date(year, month - 1, 21, 2, 0, 0); // 21日 02:00

            const defaultConfig = {
                configYear: year,
                configMonth: month,
                maxOffDaysPerPerson: 8,      // 每人休假上限
                maxOffDaysPerDay: 2,         // 每日休假上限
                maxWeekendOffDays: 3,        // 週末休假上限
                maxStoreOffDaysPerDay: 1,    // 分店日休假上限
                maxPartTimeOffDays: 1,       // 兼職日休假上限
                maxStandbyOffDays: 1,        // 待命日休假上限
                systemOpenDate: systemOpenDate,
                systemCloseDate: systemCloseDate,
                scheduleTimeLimit: 5,        // 排班時間限制(分鐘)
                holidayDates: [],            // 公休日
                forbiddenDates: [],          // 禁休日
                storeHolidayDates: {},       // 分店公休日
                storeForbiddenDates: {},     // 分店禁休日
                isActive: true
            };

            return await this.create(defaultConfig);
        } catch (error) {
            console.error('創建預設排班配置錯誤:', error);
            throw error;
        }
    };

    // 靜態方法：檢查系統是否開放
    ScheduleConfig.isSystemOpen = async function(year, month) {
        try {
            const config = await this.getConfig(year, month);
            if (!config) return false;

            const now = new Date();
            return now >= config.systemOpenDate && now <= config.systemCloseDate;
        } catch (error) {
            console.error('檢查系統開放狀態錯誤:', error);
            return false;
        }
    };

    // 實例方法：更新特殊日期
    ScheduleConfig.prototype.updateSpecialDates = async function(holidayDates, forbiddenDates) {
        this.holidayDates = holidayDates || [];
        this.forbiddenDates = forbiddenDates || [];
        return await this.save();
    };

    // 實例方法：更新分店特殊日期
    ScheduleConfig.prototype.updateStoreSpecialDates = async function(storeId, holidayDates, forbiddenDates) {
        const storeHolidays = this.storeHolidayDates || {};
        const storeForbidden = this.storeForbiddenDates || {};
        
        storeHolidays[storeId] = holidayDates || [];
        storeForbidden[storeId] = forbiddenDates || [];
        
        this.storeHolidayDates = storeHolidays;
        this.storeForbiddenDates = storeForbidden;
        
        return await this.save();
    };

    // 實例方法：檢查日期是否為公休日
    ScheduleConfig.prototype.isHolidayDate = function(date, storeId = null) {
        const dateStr = date instanceof Date ? date.toISOString().split('T')[0] : date;
        
        // 檢查全域公休日
        if (this.holidayDates && this.holidayDates.includes(dateStr)) {
            return true;
        }
        
        // 檢查分店公休日
        if (storeId && this.storeHolidayDates && this.storeHolidayDates[storeId]) {
            return this.storeHolidayDates[storeId].includes(dateStr);
        }
        
        return false;
    };

    // 實例方法：檢查日期是否為禁休日
    ScheduleConfig.prototype.isForbiddenDate = function(date, storeId = null) {
        const dateStr = date instanceof Date ? date.toISOString().split('T')[0] : date;
        
        // 檢查全域禁休日
        if (this.forbiddenDates && this.forbiddenDates.includes(dateStr)) {
            return true;
        }
        
        // 檢查分店禁休日
        if (storeId && this.storeForbiddenDates && this.storeForbiddenDates[storeId]) {
            return this.storeForbiddenDates[storeId].includes(dateStr);
        }
        
        return false;
    };

    return ScheduleConfig;
};