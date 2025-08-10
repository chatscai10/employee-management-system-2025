/**
 * ====================================
 * 排班會話模型 - ScheduleSession Model
 * ====================================
 * 排班時間控制和排他性操作管理
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ScheduleSession = sequelize.define('ScheduleSession', {
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
        sessionYear: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '排班年份'
        },
        sessionMonth: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '排班月份'
        },
        sessionStatus: {
            type: DataTypes.ENUM('active', 'completed', 'expired'),
            defaultValue: 'active',
            comment: '會話狀態'
        },
        startTime: {
            type: DataTypes.DATE,
            allowNull: false,
            comment: '會話開始時間'
        },
        endTime: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '會話結束時間'
        },
        timeRemaining: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: '剩餘時間(秒)'
        },
        lastActivity: {
            type: DataTypes.DATE,
            allowNull: false,
            comment: '最後活動時間'
        }
    }, {
        tableName: 'schedule_sessions',
        timestamps: true,
        indexes: [
            {
                fields: ['employeeId', 'sessionYear', 'sessionMonth'],
                name: 'idx_session_employee_period'
            },
            {
                fields: ['sessionStatus'],
                name: 'idx_session_status'
            },
            {
                fields: ['lastActivity'],
                name: 'idx_last_activity'
            }
        ],
        comment: '排班會話管理表'
    });

    return ScheduleSession;
};