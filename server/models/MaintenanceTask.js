/**
 * =======================================
 * 維修保養任務模型 - MaintenanceTask
 * =======================================
 * 管理設備維修和定期保養任務
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const MaintenanceTask = sequelize.define('MaintenanceTask', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        equipmentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '設備ID (關聯Equipment表)'
        },
        taskTitle: {
            type: DataTypes.STRING(200),
            allowNull: false,
            comment: '維修任務標題'
        },
        taskType: {
            type: DataTypes.ENUM('preventive', 'corrective', 'emergency', 'inspection'),
            allowNull: false,
            comment: '任務類型: preventive=預防保養, corrective=修正維修, emergency=緊急修復, inspection=例行檢查'
        },
        priority: {
            type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
            allowNull: false,
            defaultValue: 'medium',
            comment: '優先級別'
        },
        status: {
            type: DataTypes.ENUM('pending', 'assigned', 'in_progress', 'completed', 'cancelled', 'postponed'),
            allowNull: false,
            defaultValue: 'pending',
            comment: '任務狀態'
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '詳細描述'
        },
        requestedBy: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '申請人員工ID'
        },
        assignedTo: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: '指派給員工ID'
        },
        storeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '所屬門市ID'
        },
        scheduledDate: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '預定執行日期'
        },
        actualStartDate: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '實際開始日期'
        },
        actualEndDate: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '實際完成日期'
        },
        estimatedDuration: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: '預估工時(分鐘)'
        },
        actualDuration: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: '實際工時(分鐘)'
        },
        estimatedCost: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            comment: '預估成本'
        },
        actualCost: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            comment: '實際成本'
        },
        partsRequired: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: '所需零件清單 (JSON格式)'
        },
        workNotes: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '工作記錄'
        },
        completionNotes: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '完工說明'
        },
        nextMaintenanceDate: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '下次保養日期'
        },
        attachments: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: '相關附件 (照片、文件等)'
        },
        isRecurring: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: '是否為週期性任務'
        },
        recurringInterval: {
            type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly'),
            allowNull: true,
            comment: '週期間隔'
        },
        lastRecurringDate: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '上次週期執行日期'
        },
        qualityRating: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: { min: 1, max: 5 },
            comment: '品質評級 (1-5分)'
        },
        customerSatisfaction: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: { min: 1, max: 5 },
            comment: '客戶滿意度 (1-5分)'
        },
        warningThreshold: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: '預警天數門檻'
        },
        isWarningActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: '預警是否啟用'
        }
    }, {
        tableName: 'maintenance_tasks',
        timestamps: true,
        indexes: [
            {
                fields: ['equipmentId']
            },
            {
                fields: ['assignedTo']
            },
            {
                fields: ['storeId']
            },
            {
                fields: ['status']
            },
            {
                fields: ['priority']
            },
            {
                fields: ['scheduledDate']
            },
            {
                fields: ['taskType']
            }
        ]
    });

    // 關聯設定
    MaintenanceTask.associate = (models) => {
        // 關聯設備
        MaintenanceTask.belongsTo(models.Equipment, {
            foreignKey: 'equipmentId',
            as: 'Equipment'
        });

        // 關聯申請人
        MaintenanceTask.belongsTo(models.Employee, {
            foreignKey: 'requestedBy',
            as: 'Requester'
        });

        // 關聯負責人
        MaintenanceTask.belongsTo(models.Employee, {
            foreignKey: 'assignedTo',
            as: 'Assignee'
        });

        // 關聯門市
        MaintenanceTask.belongsTo(models.Store, {
            foreignKey: 'storeId',
            as: 'Store'
        });

        // 關聯維修記錄
        MaintenanceTask.hasMany(models.MaintenanceRecord, {
            foreignKey: 'taskId',
            as: 'Records'
        });
    };

    // 實例方法
    MaintenanceTask.prototype.isOverdue = function() {
        if (!this.scheduledDate) return false;
        return new Date() > new Date(this.scheduledDate) && this.status !== 'completed';
    };

    MaintenanceTask.prototype.getDaysUntilDue = function() {
        if (!this.scheduledDate) return null;
        const today = new Date();
        const scheduled = new Date(this.scheduledDate);
        const diffTime = scheduled - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    MaintenanceTask.prototype.calculateProgress = function() {
        switch (this.status) {
            case 'completed': return 100;
            case 'in_progress': return 50;
            case 'assigned': return 25;
            case 'pending': return 0;
            default: return 0;
        }
    };

    MaintenanceTask.prototype.shouldTriggerWarning = function() {
        if (!this.warningThreshold || !this.scheduledDate) return false;
        const daysUntilDue = this.getDaysUntilDue();
        return daysUntilDue !== null && daysUntilDue <= this.warningThreshold && this.status !== 'completed';
    };

    // 靜態方法
    MaintenanceTask.getOverdueTasks = async function() {
        const today = new Date();
        return await this.findAll({
            where: {
                scheduledDate: {
                    [this.sequelize.Sequelize.Op.lt]: today
                },
                status: {
                    [this.sequelize.Sequelize.Op.notIn]: ['completed', 'cancelled']
                }
            },
            include: ['Equipment', 'Requester', 'Assignee', 'Store']
        });
    };

    MaintenanceTask.getUpcomingTasks = async function(days = 7) {
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + days);

        return await this.findAll({
            where: {
                scheduledDate: {
                    [this.sequelize.Sequelize.Op.between]: [today, futureDate]
                },
                status: {
                    [this.sequelize.Sequelize.Op.notIn]: ['completed', 'cancelled']
                }
            },
            include: ['Equipment', 'Requester', 'Assignee', 'Store']
        });
    };

    MaintenanceTask.getTasksByPriority = async function(priority) {
        return await this.findAll({
            where: {
                priority,
                status: {
                    [this.sequelize.Sequelize.Op.notIn]: ['completed', 'cancelled']
                }
            },
            include: ['Equipment', 'Requester', 'Assignee', 'Store']
        });
    };

    MaintenanceTask.createRecurringTask = async function(parentTask) {
        const taskData = {
            equipmentId: parentTask.equipmentId,
            taskTitle: parentTask.taskTitle + ' (週期性)',
            taskType: parentTask.taskType,
            priority: parentTask.priority,
            description: parentTask.description,
            requestedBy: parentTask.requestedBy,
            storeId: parentTask.storeId,
            estimatedDuration: parentTask.estimatedDuration,
            estimatedCost: parentTask.estimatedCost,
            isRecurring: true,
            recurringInterval: parentTask.recurringInterval,
            scheduledDate: this.calculateNextScheduledDate(parentTask)
        };

        return await this.create(taskData);
    };

    MaintenanceTask.calculateNextScheduledDate = function(task) {
        if (!task.recurringInterval) return null;
        
        const lastDate = task.lastRecurringDate || new Date();
        const nextDate = new Date(lastDate);
        
        switch (task.recurringInterval) {
            case 'daily':
                nextDate.setDate(nextDate.getDate() + 1);
                break;
            case 'weekly':
                nextDate.setDate(nextDate.getDate() + 7);
                break;
            case 'monthly':
                nextDate.setMonth(nextDate.getMonth() + 1);
                break;
            case 'quarterly':
                nextDate.setMonth(nextDate.getMonth() + 3);
                break;
            case 'yearly':
                nextDate.setFullYear(nextDate.getFullYear() + 1);
                break;
        }
        
        return nextDate;
    };

    return MaintenanceTask;
};