/**
 * =======================================
 * 維修保養記錄模型 - MaintenanceRecord
 * =======================================
 * 記錄具體的維修保養執行過程和結果
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const MaintenanceRecord = sequelize.define('MaintenanceRecord', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        taskId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '關聯維修任務ID'
        },
        equipmentId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '設備ID'
        },
        performedBy: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '執行人員工ID'
        },
        recordType: {
            type: DataTypes.ENUM('inspection', 'cleaning', 'repair', 'replacement', 'calibration', 'testing'),
            allowNull: false,
            comment: '記錄類型'
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
            comment: '執行時長(分鐘)'
        },
        workPerformed: {
            type: DataTypes.TEXT,
            allowNull: false,
            comment: '執行的工作內容'
        },
        issuesFound: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '發現的問題'
        },
        partsUsed: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: '使用的零件清單 (JSON格式)'
        },
        laborCost: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            comment: '人工成本'
        },
        partsCost: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            comment: '零件成本'
        },
        totalCost: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            comment: '總成本'
        },
        beforeCondition: {
            type: DataTypes.ENUM('excellent', 'good', 'fair', 'poor', 'critical'),
            allowNull: true,
            comment: '維修前狀況'
        },
        afterCondition: {
            type: DataTypes.ENUM('excellent', 'good', 'fair', 'poor', 'critical'),
            allowNull: true,
            comment: '維修後狀況'
        },
        testResults: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: '測試結果 (JSON格式)'
        },
        photos: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: '相關照片 (JSON格式)'
        },
        documents: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: '相關文件 (JSON格式)'
        },
        recommendations: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '建議事項'
        },
        followUpRequired: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: '是否需要後續追蹤'
        },
        followUpDate: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '追蹤日期'
        },
        completionStatus: {
            type: DataTypes.ENUM('completed', 'partially_completed', 'failed', 'postponed'),
            allowNull: false,
            defaultValue: 'completed',
            comment: '完成狀態'
        },
        qualityCheck: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: '品質檢查結果 (JSON格式)'
        },
        customerNotified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: '是否已通知客戶'
        },
        signatureRequired: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: '是否需要簽名確認'
        },
        signatureData: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '數位簽名資料'
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
            comment: '額外備註'
        }
    }, {
        tableName: 'maintenance_records',
        timestamps: true,
        indexes: [
            {
                fields: ['taskId']
            },
            {
                fields: ['equipmentId']
            },
            {
                fields: ['performedBy']
            },
            {
                fields: ['recordType']
            },
            {
                fields: ['startTime']
            },
            {
                fields: ['completionStatus']
            }
        ]
    });

    // 關聯設定
    MaintenanceRecord.associate = (models) => {
        // 關聯維修任務
        MaintenanceRecord.belongsTo(models.MaintenanceTask, {
            foreignKey: 'taskId',
            as: 'MaintenanceTask'
        });

        // 關聯設備
        MaintenanceRecord.belongsTo(models.Equipment, {
            foreignKey: 'equipmentId',
            as: 'Equipment'
        });

        // 關聯執行人員
        MaintenanceRecord.belongsTo(models.Employee, {
            foreignKey: 'performedBy',
            as: 'Performer'
        });
    };

    // 實例方法
    MaintenanceRecord.prototype.calculateDuration = function() {
        if (!this.startTime || !this.endTime) return null;
        
        const start = new Date(this.startTime);
        const end = new Date(this.endTime);
        const diffMs = end - start;
        
        this.duration = Math.round(diffMs / (1000 * 60)); // 轉換為分鐘
        return this.duration;
    };

    MaintenanceRecord.prototype.calculateTotalCost = function() {
        const labor = this.laborCost || 0;
        const parts = this.partsCost || 0;
        this.totalCost = labor + parts;
        return this.totalCost;
    };

    MaintenanceRecord.prototype.isOvertime = function(standardMinutes = 60) {
        if (!this.duration) this.calculateDuration();
        return this.duration && this.duration > standardMinutes;
    };

    MaintenanceRecord.prototype.getEfficiencyRating = function() {
        const task = this.MaintenanceTask;
        if (!task || !task.estimatedDuration || !this.duration) return null;

        const efficiency = (task.estimatedDuration / this.duration) * 100;
        
        if (efficiency >= 100) return 'excellent';
        if (efficiency >= 90) return 'good';
        if (efficiency >= 80) return 'average';
        if (efficiency >= 70) return 'below_average';
        return 'poor';
    };

    // 靜態方法
    MaintenanceRecord.getRecordsByEquipment = async function(equipmentId, limit = 10) {
        return await this.findAll({
            where: { equipmentId },
            include: ['MaintenanceTask', 'Performer'],
            order: [['startTime', 'DESC']],
            limit
        });
    };

    MaintenanceRecord.getRecordsByDateRange = async function(startDate, endDate) {
        return await this.findAll({
            where: {
                startTime: {
                    [this.sequelize.Sequelize.Op.between]: [startDate, endDate]
                }
            },
            include: ['MaintenanceTask', 'Equipment', 'Performer']
        });
    };

    MaintenanceRecord.getIncompleteRecords = async function() {
        return await this.findAll({
            where: {
                completionStatus: ['partially_completed', 'failed', 'postponed']
            },
            include: ['MaintenanceTask', 'Equipment', 'Performer']
        });
    };

    MaintenanceRecord.getTechnicianPerformance = async function(employeeId, startDate, endDate) {
        const records = await this.findAll({
            where: {
                performedBy: employeeId,
                startTime: {
                    [this.sequelize.Sequelize.Op.between]: [startDate, endDate]
                }
            },
            include: ['MaintenanceTask']
        });

        let totalDuration = 0;
        let totalTasks = records.length;
        let completedTasks = 0;
        let totalCost = 0;

        records.forEach(record => {
            if (record.duration) totalDuration += record.duration;
            if (record.completionStatus === 'completed') completedTasks++;
            if (record.totalCost) totalCost += parseFloat(record.totalCost);
        });

        return {
            totalTasks,
            completedTasks,
            completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
            averageDuration: totalTasks > 0 ? totalDuration / totalTasks : 0,
            totalCost,
            averageCost: totalTasks > 0 ? totalCost / totalTasks : 0
        };
    };

    MaintenanceRecord.getEquipmentHistory = async function(equipmentId) {
        const records = await this.findAll({
            where: { equipmentId },
            include: ['MaintenanceTask', 'Performer'],
            order: [['startTime', 'ASC']]
        });

        let totalCost = 0;
        let totalDowntime = 0;
        const workTypes = {};

        records.forEach(record => {
            if (record.totalCost) totalCost += parseFloat(record.totalCost);
            if (record.duration) totalDowntime += record.duration;
            
            const type = record.recordType;
            workTypes[type] = (workTypes[type] || 0) + 1;
        });

        return {
            totalRecords: records.length,
            totalCost,
            totalDowntimeMinutes: totalDowntime,
            workTypeBreakdown: workTypes,
            records
        };
    };

    MaintenanceRecord.getMonthlySummary = async function(year, month) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const records = await this.findAll({
            where: {
                startTime: {
                    [this.sequelize.Sequelize.Op.between]: [startDate, endDate]
                }
            },
            include: ['MaintenanceTask', 'Equipment']
        });

        let totalCost = 0;
        let totalTasks = records.length;
        let completedTasks = 0;
        const workTypes = {};
        const equipmentTypes = {};

        records.forEach(record => {
            if (record.totalCost) totalCost += parseFloat(record.totalCost);
            if (record.completionStatus === 'completed') completedTasks++;
            
            const workType = record.recordType;
            workTypes[workType] = (workTypes[workType] || 0) + 1;
            
            if (record.Equipment) {
                const equipType = record.Equipment.category;
                equipmentTypes[equipType] = (equipmentTypes[equipType] || 0) + 1;
            }
        });

        return {
            period: `${year}-${month.toString().padStart(2, '0')}`,
            totalTasks,
            completedTasks,
            completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
            totalCost,
            averageCostPerTask: totalTasks > 0 ? totalCost / totalTasks : 0,
            workTypeBreakdown: workTypes,
            equipmentTypeBreakdown: equipmentTypes
        };
    };

    return MaintenanceRecord;
};