/**
 * =======================================
 * 維修保養系統 API Routes
 * =======================================
 * 提供設備維修和保養管理的完整API接口
 */

const express = require('express');
const router = express.Router();
const { getModels } = require('../models');
const logger = require('../utils/logger');
const responseHelper = require('../utils/responseHelper');

/**
 * 獲取設備列表
 * GET /api/maintenance/equipment
 */
router.get('/equipment', async (req, res) => {
    try {
        const models = getModels();
        const { 
            storeId, 
            category, 
            status, 
            page = 1, 
            limit = 20,
            maintenanceDue = false 
        } = req.query;

        // 構建查詢條件
        const whereClause = { isActive: true };
        if (storeId) whereClause.storeId = storeId;
        if (category) whereClause.category = category;
        if (status) whereClause.status = status;

        // 如果查詢維修到期設備
        if (maintenanceDue === 'true') {
            const today = new Date();
            whereClause.nextMaintenanceDate = {
                [models.Equipment.sequelize.Sequelize.Op.lte]: today
            };
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const equipment = await models.Equipment.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: models.Store,
                    as: 'Store',
                    attributes: ['id', 'storeName', 'address']
                }
            ],
            order: [['equipmentName', 'ASC']],
            offset,
            limit: parseInt(limit)
        });

        responseHelper.success(res, {
            equipment: equipment.rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(equipment.count / parseInt(limit)),
                totalItems: equipment.count,
                limit: parseInt(limit)
            }
        }, '設備列表獲取成功');

    } catch (error) {
        logger.error('獲取設備列表失敗:', error);
        responseHelper.error(res, error.message, 'GET_EQUIPMENT_FAILED');
    }
});

/**
 * 創建新設備
 * POST /api/maintenance/equipment
 */
router.post('/equipment', async (req, res) => {
    try {
        const models = getModels();
        const equipmentData = req.body;

        // 生成設備編號（如果沒有提供）
        if (!equipmentData.equipmentCode) {
            const prefix = equipmentData.category.toUpperCase().substring(0, 3);
            const timestamp = Date.now().toString().slice(-6);
            equipmentData.equipmentCode = `${prefix}${timestamp}`;
        }

        const equipment = await models.Equipment.create(equipmentData);

        responseHelper.success(res, equipment, '設備創建成功', 201);

    } catch (error) {
        logger.error('創建設備失敗:', error);
        responseHelper.error(res, error.message, 'CREATE_EQUIPMENT_FAILED');
    }
});

/**
 * 獲取設備詳情
 * GET /api/maintenance/equipment/:id
 */
router.get('/equipment/:id', async (req, res) => {
    try {
        const models = getModels();
        const { id } = req.params;

        const equipment = await models.Equipment.findByPk(id, {
            include: [
                {
                    model: models.Store,
                    as: 'Store',
                    attributes: ['id', 'storeName', 'address']
                },
                {
                    model: models.MaintenanceTask,
                    as: 'MaintenanceTasks',
                    limit: 10,
                    order: [['createdAt', 'DESC']]
                }
            ]
        });

        if (!equipment) {
            return responseHelper.error(res, '設備不存在', 'EQUIPMENT_NOT_FOUND', 404);
        }

        responseHelper.success(res, equipment, '設備詳情獲取成功');

    } catch (error) {
        logger.error('獲取設備詳情失敗:', error);
        responseHelper.error(res, error.message, 'GET_EQUIPMENT_DETAIL_FAILED');
    }
});

/**
 * 更新設備資訊
 * PUT /api/maintenance/equipment/:id
 */
router.put('/equipment/:id', async (req, res) => {
    try {
        const models = getModels();
        const { id } = req.params;
        const updateData = req.body;

        const equipment = await models.Equipment.findByPk(id);
        if (!equipment) {
            return responseHelper.error(res, '設備不存在', 'EQUIPMENT_NOT_FOUND', 404);
        }

        await equipment.update(updateData);

        responseHelper.success(res, equipment, '設備更新成功');

    } catch (error) {
        logger.error('更新設備失敗:', error);
        responseHelper.error(res, error.message, 'UPDATE_EQUIPMENT_FAILED');
    }
});

/**
 * 獲取維修任務列表
 * GET /api/maintenance/tasks
 */
router.get('/tasks', async (req, res) => {
    try {
        const models = getModels();
        const { 
            status,
            priority,
            assignedTo,
            storeId,
            overdue = false,
            page = 1,
            limit = 20
        } = req.query;

        // 構建查詢條件
        const whereClause = {};
        if (status) whereClause.status = status;
        if (priority) whereClause.priority = priority;
        if (assignedTo) whereClause.assignedTo = assignedTo;
        if (storeId) whereClause.storeId = storeId;

        // 如果查詢過期任務
        if (overdue === 'true') {
            const today = new Date();
            whereClause.scheduledDate = {
                [models.MaintenanceTask.sequelize.Sequelize.Op.lt]: today
            };
            whereClause.status = {
                [models.MaintenanceTask.sequelize.Sequelize.Op.notIn]: ['completed', 'cancelled']
            };
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const tasks = await models.MaintenanceTask.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: models.Equipment,
                    as: 'Equipment',
                    attributes: ['id', 'equipmentName', 'category', 'location']
                },
                {
                    model: models.Employee,
                    as: 'Requester',
                    attributes: ['id', 'name', 'position']
                },
                {
                    model: models.Employee,
                    as: 'Assignee',
                    attributes: ['id', 'name', 'position']
                },
                {
                    model: models.Store,
                    as: 'Store',
                    attributes: ['id', 'storeName']
                }
            ],
            order: [
                ['priority', 'DESC'],
                ['scheduledDate', 'ASC']
            ],
            offset,
            limit: parseInt(limit)
        });

        responseHelper.success(res, {
            tasks: tasks.rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(tasks.count / parseInt(limit)),
                totalItems: tasks.count,
                limit: parseInt(limit)
            }
        }, '維修任務列表獲取成功');

    } catch (error) {
        logger.error('獲取維修任務列表失敗:', error);
        responseHelper.error(res, error.message, 'GET_MAINTENANCE_TASKS_FAILED');
    }
});

/**
 * 創建維修任務
 * POST /api/maintenance/tasks
 */
router.post('/tasks', async (req, res) => {
    try {
        const models = getModels();
        const taskData = req.body;

        const task = await models.MaintenanceTask.create(taskData);

        // 載入完整的任務信息
        const createdTask = await models.MaintenanceTask.findByPk(task.id, {
            include: [
                {
                    model: models.Equipment,
                    as: 'Equipment',
                    attributes: ['id', 'equipmentName', 'category']
                },
                {
                    model: models.Employee,
                    as: 'Requester',
                    attributes: ['id', 'name', 'position']
                }
            ]
        });

        responseHelper.success(res, createdTask, '維修任務創建成功', 201);

    } catch (error) {
        logger.error('創建維修任務失敗:', error);
        responseHelper.error(res, error.message, 'CREATE_MAINTENANCE_TASK_FAILED');
    }
});

/**
 * 更新維修任務
 * PUT /api/maintenance/tasks/:id
 */
router.put('/tasks/:id', async (req, res) => {
    try {
        const models = getModels();
        const { id } = req.params;
        const updateData = req.body;

        const task = await models.MaintenanceTask.findByPk(id);
        if (!task) {
            return responseHelper.error(res, '維修任務不存在', 'MAINTENANCE_TASK_NOT_FOUND', 404);
        }

        // 如果任務完成，更新設備的下次維修日期
        if (updateData.status === 'completed' && task.status !== 'completed') {
            const equipment = await models.Equipment.findByPk(task.equipmentId);
            if (equipment) {
                await equipment.update({
                    lastMaintenanceDate: new Date(),
                    status: 'active'
                });
                equipment.updateNextMaintenanceDate();
                await equipment.save();
            }
        }

        await task.update(updateData);

        responseHelper.success(res, task, '維修任務更新成功');

    } catch (error) {
        logger.error('更新維修任務失敗:', error);
        responseHelper.error(res, error.message, 'UPDATE_MAINTENANCE_TASK_FAILED');
    }
});

/**
 * 獲取維修記錄列表
 * GET /api/maintenance/records
 */
router.get('/records', async (req, res) => {
    try {
        const models = getModels();
        const { equipmentId, performedBy, startDate, endDate, page = 1, limit = 20 } = req.query;

        // 構建查詢條件
        const whereClause = {};
        if (equipmentId) whereClause.equipmentId = equipmentId;
        if (performedBy) whereClause.performedBy = performedBy;

        if (startDate && endDate) {
            whereClause.startTime = {
                [models.MaintenanceRecord.sequelize.Sequelize.Op.between]: [
                    new Date(startDate),
                    new Date(endDate)
                ]
            };
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const records = await models.MaintenanceRecord.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: models.MaintenanceTask,
                    as: 'MaintenanceTask',
                    attributes: ['id', 'taskTitle', 'taskType']
                },
                {
                    model: models.Equipment,
                    as: 'Equipment',
                    attributes: ['id', 'equipmentName', 'category']
                },
                {
                    model: models.Employee,
                    as: 'Performer',
                    attributes: ['id', 'name', 'position']
                }
            ],
            order: [['startTime', 'DESC']],
            offset,
            limit: parseInt(limit)
        });

        responseHelper.success(res, {
            records: records.rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(records.count / parseInt(limit)),
                totalItems: records.count,
                limit: parseInt(limit)
            }
        }, '維修記錄列表獲取成功');

    } catch (error) {
        logger.error('獲取維修記錄列表失敗:', error);
        responseHelper.error(res, error.message, 'GET_MAINTENANCE_RECORDS_FAILED');
    }
});

/**
 * 創建維修記錄
 * POST /api/maintenance/records
 */
router.post('/records', async (req, res) => {
    try {
        const models = getModels();
        const recordData = req.body;

        // 計算總成本
        const laborCost = recordData.laborCost || 0;
        const partsCost = recordData.partsCost || 0;
        recordData.totalCost = laborCost + partsCost;

        // 計算執行時長
        if (recordData.startTime && recordData.endTime) {
            const start = new Date(recordData.startTime);
            const end = new Date(recordData.endTime);
            recordData.duration = Math.round((end - start) / (1000 * 60)); // 分鐘
        }

        const record = await models.MaintenanceRecord.create(recordData);

        // 更新設備狀況
        if (recordData.afterCondition && recordData.equipmentId) {
            await models.Equipment.update(
                { condition: recordData.afterCondition },
                { where: { id: recordData.equipmentId } }
            );
        }

        responseHelper.success(res, record, '維修記錄創建成功', 201);

    } catch (error) {
        logger.error('創建維修記錄失敗:', error);
        responseHelper.error(res, error.message, 'CREATE_MAINTENANCE_RECORD_FAILED');
    }
});

/**
 * 獲取維修統計報告
 * GET /api/maintenance/reports/statistics
 */
router.get('/reports/statistics', async (req, res) => {
    try {
        const models = getModels();
        const { storeId, startDate, endDate } = req.query;

        const whereClause = {};
        if (storeId) whereClause.storeId = storeId;

        // 設備統計
        const equipmentStats = await models.Equipment.findAll({
            where: whereClause,
            attributes: [
                'category',
                'status',
                [models.Equipment.sequelize.fn('COUNT', '*'), 'count']
            ],
            group: ['category', 'status']
        });

        // 維修任務統計
        const taskWhereClause = { ...whereClause };
        if (startDate && endDate) {
            taskWhereClause.createdAt = {
                [models.MaintenanceTask.sequelize.Sequelize.Op.between]: [
                    new Date(startDate),
                    new Date(endDate)
                ]
            };
        }

        const taskStats = await models.MaintenanceTask.findAll({
            where: taskWhereClause,
            attributes: [
                'status',
                'priority',
                'taskType',
                [models.MaintenanceTask.sequelize.fn('COUNT', '*'), 'count'],
                [models.MaintenanceTask.sequelize.fn('AVG', models.MaintenanceTask.sequelize.col('actualDuration')), 'avgDuration'],
                [models.MaintenanceTask.sequelize.fn('SUM', models.MaintenanceTask.sequelize.col('actualCost')), 'totalCost']
            ],
            group: ['status', 'priority', 'taskType']
        });

        // 過期任務
        const overdueTasks = await models.MaintenanceTask.count({
            where: {
                ...whereClause,
                scheduledDate: {
                    [models.MaintenanceTask.sequelize.Sequelize.Op.lt]: new Date()
                },
                status: {
                    [models.MaintenanceTask.sequelize.Sequelize.Op.notIn]: ['completed', 'cancelled']
                }
            }
        });

        // 維修到期設備
        const maintenanceDueEquipment = await models.Equipment.count({
            where: {
                ...whereClause,
                nextMaintenanceDate: {
                    [models.Equipment.sequelize.Sequelize.Op.lte]: new Date()
                },
                status: 'active'
            }
        });

        responseHelper.success(res, {
            equipmentStats,
            taskStats,
            overdueTasks,
            maintenanceDueEquipment
        }, '維修統計報告獲取成功');

    } catch (error) {
        logger.error('獲取維修統計報告失敗:', error);
        responseHelper.error(res, error.message, 'GET_MAINTENANCE_STATISTICS_FAILED');
    }
});

/**
 * 獲取維修預警
 * GET /api/maintenance/alerts
 */
router.get('/alerts', async (req, res) => {
    try {
        const models = getModels();
        const { storeId } = req.query;

        const whereClause = {};
        if (storeId) whereClause.storeId = storeId;

        // 設備維修到期
        const maintenanceDue = await models.Equipment.findAll({
            where: {
                ...whereClause,
                nextMaintenanceDate: {
                    [models.Equipment.sequelize.Sequelize.Op.lte]: new Date()
                },
                status: 'active',
                isActive: true
            },
            include: [
                {
                    model: models.Store,
                    as: 'Store',
                    attributes: ['storeName']
                }
            ]
        });

        // 保固即將到期 (30天內)
        const warrantyExpiring = await models.Equipment.getWarrantyExpiring(30);

        // 過期的維修任務
        const overdueTasks = await models.MaintenanceTask.getOverdueTasks();

        // 高優先級未分配任務
        const unassignedHighPriorityTasks = await models.MaintenanceTask.findAll({
            where: {
                ...whereClause,
                priority: ['high', 'critical'],
                assignedTo: null,
                status: 'pending'
            },
            include: [
                {
                    model: models.Equipment,
                    as: 'Equipment',
                    attributes: ['equipmentName']
                },
                {
                    model: models.Store,
                    as: 'Store',
                    attributes: ['storeName']
                }
            ]
        });

        const alerts = {
            maintenanceDue: maintenanceDue.length,
            maintenanceDueItems: maintenanceDue,
            warrantyExpiring: warrantyExpiring.length,
            warrantyExpiringItems: warrantyExpiring,
            overdueTasks: overdueTasks.length,
            overdueTaskItems: overdueTasks,
            unassignedHighPriorityTasks: unassignedHighPriorityTasks.length,
            unassignedHighPriorityItems: unassignedHighPriorityTasks
        };

        responseHelper.success(res, alerts, '維修預警獲取成功');

    } catch (error) {
        logger.error('獲取維修預警失敗:', error);
        responseHelper.error(res, error.message, 'GET_MAINTENANCE_ALERTS_FAILED');
    }
});

module.exports = router;