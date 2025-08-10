/**
 * ===================================
 * 遲到統計模型 - AttendanceStatistics Model
 * ===================================
 * 用於追蹤員工月度遲到情況，觸發懲罰投票
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const AttendanceStatistics = sequelize.define('AttendanceStatistics', {
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
            },
            comment: '員工ID'
        },
        year: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '統計年份'
        },
        month: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '統計月份 (1-12)'
        },
        lateCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '遲到次數'
        },
        lateMinutesTotal: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '遲到總分鐘數'
        },
        lastUpdated: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            comment: '最後更新時間'
        },
        isPunishmentTriggered: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: '是否已觸發懲罰投票'
        },
        punishmentCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: '當月懲罰投票次數'
        },
        // 詳細遲到記錄 (JSON格式)
        lateRecords: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: '遲到詳細記錄 [{date, minutes, reason}]'
        }
    }, {
        tableName: 'attendance_statistics',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['employeeId', 'year', 'month'],
                name: 'idx_attendance_stats_unique'
            },
            {
                fields: ['year', 'month'],
                name: 'idx_attendance_stats_period'
            },
            {
                fields: ['isPunishmentTriggered'],
                name: 'idx_attendance_stats_punishment'
            }
        ],
        comment: '員工月度遲到統計表'
    });

    /**
     * 檢查是否觸發懲罰條件
     * @returns {boolean}
     */
    AttendanceStatistics.prototype.shouldTriggerPunishment = function() {
        // 條件1: 遲到次數超過3次
        const countExceeded = this.lateCount > 3;
        
        // 條件2: 遲到總分鐘數超過10分鐘
        const minutesExceeded = this.lateMinutesTotal > 10;
        
        return (countExceeded || minutesExceeded) && !this.isPunishmentTriggered;
    };

    /**
     * 更新遲到統計
     * @param {Object} lateRecord 遲到記錄
     */
    AttendanceStatistics.prototype.addLateRecord = async function(lateRecord) {
        this.lateCount += 1;
        this.lateMinutesTotal += lateRecord.minutes;
        
        // 更新詳細記錄
        const records = this.lateRecords || [];
        records.push({
            date: lateRecord.date,
            minutes: lateRecord.minutes,
            reason: lateRecord.reason || '遲到打卡'
        });
        this.lateRecords = records;
        
        this.lastUpdated = new Date();
        await this.save();
    };

    /**
     * 標記懲罰已觸發
     */
    AttendanceStatistics.prototype.markPunishmentTriggered = async function() {
        this.isPunishmentTriggered = true;
        this.punishmentCount += 1;
        await this.save();
    };

    /**
     * 重置月度統計
     */
    AttendanceStatistics.prototype.resetMonthlyStats = async function() {
        this.lateCount = 0;
        this.lateMinutesTotal = 0;
        this.lateRecords = [];
        this.isPunishmentTriggered = false;
        this.punishmentCount = 0;
        this.lastUpdated = new Date();
        await this.save();
    };

    /**
     * 獲取或創建員工月度統計
     * @param {number} employeeId 員工ID
     * @param {number} year 年份
     * @param {number} month 月份
     * @returns {Promise<AttendanceStatistics>}
     */
    AttendanceStatistics.findOrCreateMonthlyStats = async function(employeeId, year, month) {
        const [stats, created] = await this.findOrCreate({
            where: { employeeId, year, month },
            defaults: {
                employeeId,
                year,
                month,
                lateCount: 0,
                lateMinutesTotal: 0,
                lateRecords: [],
                lastUpdated: new Date()
            }
        });
        return stats;
    };

    /**
     * 獲取需要觸發懲罰的員工統計
     * @param {number} year 年份
     * @param {number} month 月份
     * @returns {Promise<Array>}
     */
    AttendanceStatistics.findPunishmentCandidates = async function(year, month) {
        return await this.findAll({
            where: {
                year,
                month,
                isPunishmentTriggered: false,
                [sequelize.Sequelize.Op.or]: [
                    { lateCount: { [sequelize.Sequelize.Op.gt]: 3 } },
                    { lateMinutesTotal: { [sequelize.Sequelize.Op.gt]: 10 } }
                ]
            },
            include: [{
                model: sequelize.models.Employee,
                as: 'Employee',
                attributes: ['id', 'name', 'position', 'currentStore']
            }]
        });
    };

    /**
     * 重置所有員工的月度統計
     * @param {number} year 年份
     * @param {number} month 月份
     */
    AttendanceStatistics.resetAllMonthlyStats = async function(year, month) {
        await this.update(
            {
                lateCount: 0,
                lateMinutesTotal: 0,
                lateRecords: [],
                isPunishmentTriggered: false,
                punishmentCount: 0,
                lastUpdated: new Date()
            },
            {
                where: { year, month }
            }
        );
    };

    /**
     * 設定模型關聯
     */
    AttendanceStatistics.associate = function(models) {
        // 統計屬於一個員工
        AttendanceStatistics.belongsTo(models.Employee, {
            foreignKey: 'employeeId',
            as: 'Employee'
        });
    };

    return AttendanceStatistics;
};