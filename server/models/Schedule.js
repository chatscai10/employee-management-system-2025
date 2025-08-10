/**
 * ==================================
 * 排班系統模型 - Schedule Model
 * ==================================
 * 基於系統邏輯.txt規格 - 6重規則引擎排班系統
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Schedule = sequelize.define('Schedule', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        employeeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
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
        scheduleYear: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '排班年份'
        },
        scheduleMonth: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '排班月份'
        },
        offDates: {
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: [],
            comment: '休假日期陣列'
        },
        totalOffDays: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '總休假天數'
        },
        weekendOffDays: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '週末休假天數'
        },
        scheduleStatus: {
            type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'expired'),
            defaultValue: 'pending',
            comment: '排班狀態'
        },
        scheduleStartTime: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '開始排班時間'
        },
        scheduleEndTime: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '完成排班時間'
        },
        scheduleTimeLimit: {
            type: DataTypes.INTEGER,
            defaultValue: 5,
            comment: '排班時間限制分鐘'
        },
        ruleValidation: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: '6重規則驗證結果'
        },
        isDeleted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: '軟刪除標記'
        }
    }, {
        tableName: 'schedules',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['employeeId', 'scheduleYear', 'scheduleMonth'],
                name: 'idx_employee_schedule_period'
            },
            {
                fields: ['scheduleYear', 'scheduleMonth'],
                name: 'idx_schedule_period'
            },
            {
                fields: ['scheduleStatus'],
                name: 'idx_schedule_status'
            }
        ],
        comment: '員工排班記錄表'
    });

    // 靜態方法：獲取員工當月休假天數
    Schedule.getEmployeeOffDaysCount = async function(employeeId, year, month) {
        try {
            const schedule = await this.findOne({
                where: { employeeId, scheduleYear: year, scheduleMonth: month }
            });
            return schedule ? schedule.totalOffDays : 0;
        } catch (error) {
            console.error('獲取員工休假天數錯誤:', error);
            return 0;
        }
    };

    // 靜態方法：獲取員工當月週末休假天數
    Schedule.getEmployeeWeekendOffDays = async function(employeeId, year, month) {
        try {
            const schedule = await this.findOne({
                where: { employeeId, scheduleYear: year, scheduleMonth: month }
            });
            return schedule ? schedule.weekendOffDays : 0;
        } catch (error) {
            console.error('獲取員工週末休假天數錯誤:', error);
            return 0;
        }
    };

    // 靜態方法：獲取特定日期休假人數
    Schedule.getDailyOffCount = async function(date, year, month) {
        try {
            const schedules = await this.findAll({
                where: { scheduleYear: year, scheduleMonth: month },
                attributes: ['offDates']
            });

            let count = 0;
            const targetDate = date.toString();
            
            schedules.forEach(schedule => {
                if (schedule.offDates && Array.isArray(schedule.offDates)) {
                    if (schedule.offDates.includes(targetDate)) {
                        count++;
                    }
                }
            });

            return count;
        } catch (error) {
            console.error('獲取特定日期休假人數錯誤:', error);
            return 0;
        }
    };

    // 靜態方法：計算週末休假天數
    Schedule.countWeekendDays = function(offDates) {
        if (!Array.isArray(offDates)) return 0;
        
        let weekendCount = 0;
        offDates.forEach(dateStr => {
            const date = new Date(dateStr);
            const dayOfWeek = date.getDay();
            // 週五(5)、週六(6)、週日(0)
            if (dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0) {
                weekendCount++;
            }
        });
        
        return weekendCount;
    };

    // 實例方法：更新排班記錄
    Schedule.prototype.updateScheduleData = async function(offDates, ruleValidation) {
        this.offDates = offDates;
        this.totalOffDays = offDates.length;
        this.weekendOffDays = Schedule.countWeekendDays(offDates);
        this.ruleValidation = ruleValidation;
        this.scheduleStatus = 'completed';
        this.scheduleEndTime = new Date();
        
        return await this.save();
    };

    return Schedule;
};