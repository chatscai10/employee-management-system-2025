/**
 * =======================================
 * 執行審計日誌模型 - ExecutionAuditLog
 * =======================================
 * 記錄職位變更執行過程的詳細日誌
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ExecutionAuditLog = sequelize.define('ExecutionAuditLog', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        executionId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '執行記錄ID'
        },
        step: {
            type: DataTypes.STRING(100),
            allowNull: false,
            comment: '執行步驟'
        },
        status: {
            type: DataTypes.ENUM('started', 'completed', 'failed', 'skipped'),
            allowNull: false,
            comment: '步驟狀態'
        },
        startTime: {
            type: DataTypes.DATE,
            allowNull: false,
            comment: '開始時間'
        },
        endTime: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '結束時間'
        },
        duration: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: '執行時長毫秒'
        },
        details: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: '執行詳情'
        },
        errorMessage: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '錯誤信息'
        },
        systemState: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: '系統狀態快照'
        }
    }, {
        tableName: 'execution_audit_logs',
        timestamps: true,
        indexes: [
            {
                fields: ['executionId']
            },
            {
                fields: ['step']
            },
            {
                fields: ['status']
            },
            {
                fields: ['startTime']
            }
        ]
    });

    // 關聯設定
    ExecutionAuditLog.associate = (models) => {
        // 關聯執行記錄
        ExecutionAuditLog.belongsTo(models.PositionChangeExecution, {
            foreignKey: 'executionId',
            as: 'Execution'
        });
    };

    // 實例方法
    ExecutionAuditLog.prototype.complete = function(details = {}) {
        this.endTime = new Date();
        this.status = 'completed';
        this.duration = this.endTime - this.startTime;
        this.details = { ...this.details, ...details };
        return this.save();
    };

    ExecutionAuditLog.prototype.fail = function(errorMessage, details = {}) {
        this.endTime = new Date();
        this.status = 'failed';
        this.duration = this.endTime - this.startTime;
        this.errorMessage = errorMessage;
        this.details = { ...this.details, ...details };
        return this.save();
    };

    ExecutionAuditLog.prototype.skip = function(reason, details = {}) {
        this.endTime = new Date();
        this.status = 'skipped';
        this.duration = this.endTime - this.startTime;
        this.details = { ...this.details, reason, ...details };
        return this.save();
    };

    // 靜態方法
    ExecutionAuditLog.createLog = async function(executionId, step, details = {}) {
        return await this.create({
            executionId,
            step,
            status: 'started',
            startTime: new Date(),
            details,
            systemState: {
                timestamp: new Date(),
                nodeVersion: process.version,
                memoryUsage: process.memoryUsage(),
                uptime: process.uptime()
            }
        });
    };

    ExecutionAuditLog.getLogsByExecution = async function(executionId) {
        return await this.findAll({
            where: { executionId },
            order: [['startTime', 'ASC']]
        });
    };

    ExecutionAuditLog.getFailedSteps = async function() {
        return await this.findAll({
            where: { status: 'failed' },
            include: ['Execution'],
            order: [['startTime', 'DESC']]
        });
    };

    ExecutionAuditLog.getStepStatistics = async function(startDate, endDate) {
        const logs = await this.findAll({
            where: {
                startTime: {
                    [this.sequelize.Sequelize.Op.between]: [startDate, endDate]
                }
            },
            attributes: [
                'step',
                'status',
                [this.sequelize.fn('COUNT', '*'), 'count'],
                [this.sequelize.fn('AVG', this.sequelize.col('duration')), 'avgDuration'],
                [this.sequelize.fn('MIN', this.sequelize.col('duration')), 'minDuration'],
                [this.sequelize.fn('MAX', this.sequelize.col('duration')), 'maxDuration']
            ],
            group: ['step', 'status']
        });

        return logs;
    };

    return ExecutionAuditLog;
};