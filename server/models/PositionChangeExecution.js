/**
 * =======================================
 * 職位變更執行記錄模型 - PositionChangeExecution
 * =======================================
 * 記錄投票結果的自動執行過程和結果
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const PositionChangeExecution = sequelize.define('PositionChangeExecution', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        campaignId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '投票活動ID'
        },
        employeeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '員工ID'
        },
        changeType: {
            type: DataTypes.ENUM('promotion', 'demotion', 'lateral_transfer'),
            allowNull: false,
            comment: '變更類型'
        },
        oldPosition: {
            type: DataTypes.STRING(50),
            allowNull: false,
            comment: '原職位'
        },
        newPosition: {
            type: DataTypes.STRING(50),
            allowNull: false,
            comment: '新職位'
        },
        oldSalaryGrade: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: '原薪資等級'
        },
        newSalaryGrade: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: '新薪資等級'
        },
        executionStatus: {
            type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'failed', 'rolled_back'),
            allowNull: false,
            defaultValue: 'pending',
            comment: '執行狀態'
        },
        scheduledExecutionTime: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '預定執行時間'
        },
        actualExecutionTime: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '實際執行時間'
        },
        executionSteps: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: [],
            comment: '執行步驟記錄'
        },
        executionResults: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: '執行結果詳情'
        },
        rollbackData: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: '回滾備份數據'
        },
        approvedBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: '審批人ID'
        },
        executedBy: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: 'SYSTEM',
            comment: '執行者'
        },
        failureReason: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '失敗原因'
        },
        notificationsSent: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: [],
            comment: '已發送通知記錄'
        }
    }, {
        tableName: 'position_change_executions',
        timestamps: true,
        indexes: [
            {
                fields: ['campaignId']
            },
            {
                fields: ['employeeId']
            },
            {
                fields: ['executionStatus']
            },
            {
                fields: ['scheduledExecutionTime']
            },
            {
                fields: ['changeType']
            }
        ]
    });

    // 關聯設定
    PositionChangeExecution.associate = (models) => {
        // 關聯投票活動
        PositionChangeExecution.belongsTo(models.PromotionCampaign, {
            foreignKey: 'campaignId',
            as: 'Campaign'
        });

        // 關聯員工
        PositionChangeExecution.belongsTo(models.Employee, {
            foreignKey: 'employeeId',
            as: 'Employee'
        });

        // 關聯審批人
        PositionChangeExecution.belongsTo(models.Employee, {
            foreignKey: 'approvedBy',
            as: 'Approver'
        });

        // 關聯執行記錄
        PositionChangeExecution.hasMany(models.ExecutionAuditLog, {
            foreignKey: 'executionId',
            as: 'AuditLogs'
        });
    };

    // 實例方法
    PositionChangeExecution.prototype.addExecutionStep = function(step, status, details = {}) {
        const steps = this.executionSteps || [];
        steps.push({
            step,
            status,
            timestamp: new Date(),
            details
        });
        this.executionSteps = steps;
        return this.save();
    };

    PositionChangeExecution.prototype.updateExecutionResult = function(stepName, result) {
        const results = this.executionResults || {};
        results[stepName] = {
            ...result,
            timestamp: new Date()
        };
        this.executionResults = results;
        return this.save();
    };

    PositionChangeExecution.prototype.recordNotification = function(notificationType, recipients, success = true) {
        const notifications = this.notificationsSent || [];
        notifications.push({
            type: notificationType,
            recipients,
            success,
            timestamp: new Date()
        });
        this.notificationsSent = notifications;
        return this.save();
    };

    PositionChangeExecution.prototype.canExecute = function() {
        const allowedStatuses = ['pending'];
        return allowedStatuses.includes(this.executionStatus);
    };

    PositionChangeExecution.prototype.canRollback = function() {
        const allowedStatuses = ['completed', 'failed'];
        return allowedStatuses.includes(this.executionStatus) && this.rollbackData;
    };

    PositionChangeExecution.prototype.calculateExecutionDelay = function() {
        const changeType = this.changeType;
        const now = new Date();
        let delay;

        switch (changeType) {
            case 'promotion':
                delay = 24 * 60 * 60 * 1000; // 24小時
                break;
            case 'demotion':
                delay = 2 * 60 * 60 * 1000; // 2小時
                break;
            default:
                delay = 24 * 60 * 60 * 1000; // 預設24小時
        }

        // 避開週末和非營業時間
        let scheduledTime = new Date(now.getTime() + delay);
        
        // 如果是週末，延到下週一
        if (scheduledTime.getDay() === 0) { // 週日
            scheduledTime.setDate(scheduledTime.getDate() + 1);
        } else if (scheduledTime.getDay() === 6) { // 週六
            scheduledTime.setDate(scheduledTime.getDate() + 2);
        }

        // 調整到營業時間 (9:00 AM)
        scheduledTime.setHours(9, 0, 0, 0);

        this.scheduledExecutionTime = scheduledTime;
        return scheduledTime;
    };

    // 靜態方法
    PositionChangeExecution.createFromCampaign = async function(campaign) {
        const models = require('../models').getModels();
        
        // 獲取候選人信息
        const candidates = await models.PromotionCandidate.findAll({
            where: { campaignId: campaign.id },
            include: [{
                model: models.Employee,
                as: 'Employee'
            }]
        });

        const executions = [];

        for (const candidate of candidates) {
            const employee = candidate.Employee;
            
            // 根據投票結果決定變更類型和目標職位
            let changeType, newPosition;
            
            if (campaign.campaignType === 'promotion' || campaign.campaignSubType === 'new_employee_promotion') {
                changeType = 'promotion';
                newPosition = candidate.targetPosition || this.getNextPosition(employee.position);
            } else if (campaign.campaignSubType === 'demotion_punishment') {
                changeType = 'demotion';
                newPosition = this.getPreviousPosition(employee.position);
            }

            const execution = await this.create({
                campaignId: campaign.id,
                employeeId: employee.id,
                changeType,
                oldPosition: employee.position,
                newPosition,
                oldSalaryGrade: this.getPositionGrade(employee.position),
                newSalaryGrade: this.getPositionGrade(newPosition),
                rollbackData: {
                    employee: {
                        position: employee.position,
                        salaryGrade: this.getPositionGrade(employee.position),
                        positionStartDate: employee.positionStartDate
                    }
                }
            });

            execution.calculateExecutionDelay();
            await execution.save();

            executions.push(execution);
        }

        return executions;
    };

    PositionChangeExecution.getPendingExecutions = async function() {
        return await this.findAll({
            where: {
                executionStatus: 'pending',
                scheduledExecutionTime: {
                    [this.sequelize.Sequelize.Op.lte]: new Date()
                }
            },
            include: ['Campaign', 'Employee']
        });
    };

    PositionChangeExecution.getExecutionsByStatus = async function(status) {
        return await this.findAll({
            where: { executionStatus: status },
            include: ['Campaign', 'Employee', 'Approver']
        });
    };

    PositionChangeExecution.getNextPosition = function(currentPosition) {
        const hierarchy = {
            '實習生': '員工',
            '員工': '副店長',
            '副店長': '店長'
        };
        return hierarchy[currentPosition] || currentPosition;
    };

    PositionChangeExecution.getPreviousPosition = function(currentPosition) {
        const hierarchy = {
            '店長': '副店長',
            '副店長': '員工',
            '員工': '實習生'
        };
        return hierarchy[currentPosition] || currentPosition;
    };

    PositionChangeExecution.getPositionGrade = function(position) {
        const grades = {
            '實習生': 1,
            '員工': 2,
            '副店長': 3,
            '店長': 4
        };
        return grades[position] || 1;
    };

    return PositionChangeExecution;
};