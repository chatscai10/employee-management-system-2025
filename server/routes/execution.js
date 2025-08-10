/**
 * =======================================
 * 結果自動執行系統 API Routes
 * =======================================
 * 提供投票結果自動執行的管理和監控接口
 */

const express = require('express');
const router = express.Router();
const { getModels } = require('../models');
const logger = require('../utils/logger');
const responseHelper = require('../utils/responseHelper');
const ExecutionEngine = require('../services/ExecutionEngine');

/**
 * 獲取執行記錄列表
 * GET /api/execution/records
 */
router.get('/records', async (req, res) => {
    try {
        const models = getModels();
        const { 
            status,
            employeeId,
            changeType,
            page = 1,
            limit = 20
        } = req.query;

        // 構建查詢條件
        const whereClause = {};
        if (status) whereClause.executionStatus = status;
        if (employeeId) whereClause.employeeId = employeeId;
        if (changeType) whereClause.changeType = changeType;

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const executions = await models.PositionChangeExecution.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: models.PromotionCampaign,
                    as: 'Campaign',
                    attributes: ['id', 'campaignName', 'campaignType', 'campaignSubType']
                },
                {
                    model: models.Employee,
                    as: 'Employee',
                    attributes: ['id', 'name', 'position', 'currentStore']
                },
                {
                    model: models.Employee,
                    as: 'Approver',
                    attributes: ['id', 'name', 'position']
                }
            ],
            order: [['createdAt', 'DESC']],
            offset,
            limit: parseInt(limit)
        });

        responseHelper.success(res, {
            executions: executions.rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(executions.count / parseInt(limit)),
                totalItems: executions.count,
                limit: parseInt(limit)
            }
        }, '執行記錄列表獲取成功');

    } catch (error) {
        logger.error('獲取執行記錄列表失敗:', error);
        responseHelper.error(res, error.message, 'GET_EXECUTION_RECORDS_FAILED');
    }
});

/**
 * 獲取執行記錄詳情
 * GET /api/execution/records/:id
 */
router.get('/records/:id', async (req, res) => {
    try {
        const models = getModels();
        const { id } = req.params;

        const execution = await models.PositionChangeExecution.findByPk(id, {
            include: [
                {
                    model: models.PromotionCampaign,
                    as: 'Campaign'
                },
                {
                    model: models.Employee,
                    as: 'Employee'
                },
                {
                    model: models.Employee,
                    as: 'Approver'
                },
                {
                    model: models.ExecutionAuditLog,
                    as: 'AuditLogs',
                    order: [['startTime', 'ASC']]
                }
            ]
        });

        if (!execution) {
            return responseHelper.error(res, '執行記錄不存在', 'EXECUTION_RECORD_NOT_FOUND', 404);
        }

        responseHelper.success(res, execution, '執行記錄詳情獲取成功');

    } catch (error) {
        logger.error('獲取執行記錄詳情失敗:', error);
        responseHelper.error(res, error.message, 'GET_EXECUTION_RECORD_DETAIL_FAILED');
    }
});

/**
 * 手動觸發投票結果執行
 * POST /api/execution/trigger/:campaignId
 */
router.post('/trigger/:campaignId', async (req, res) => {
    try {
        const { campaignId } = req.params;
        const { adminId } = req.body;

        // 處理投票結果並創建執行計劃
        const executions = await ExecutionEngine.processCampaignResult(campaignId);

        if (!executions || executions.length === 0) {
            return responseHelper.error(res, '無法創建執行計劃，可能是投票結果不符合執行條件', 'EXECUTION_CONDITIONS_NOT_MET');
        }

        // 記錄手動觸發操作
        logger.info(`手動觸發執行: 活動ID ${campaignId}, 操作人 ${adminId}`);

        responseHelper.success(res, {
            campaignId,
            executionsCreated: executions.length,
            executions: executions.map(e => ({
                id: e.id,
                employeeId: e.employeeId,
                changeType: e.changeType,
                scheduledTime: e.scheduledExecutionTime
            }))
        }, '執行計劃創建成功');

    } catch (error) {
        logger.error('手動觸發執行失敗:', error);
        responseHelper.error(res, error.message, 'TRIGGER_EXECUTION_FAILED');
    }
});

/**
 * 手動執行職位變更
 * POST /api/execution/execute/:id
 */
router.post('/execute/:id', async (req, res) => {
    try {
        const models = getModels();
        const { id } = req.params;
        const { adminId, reason } = req.body;

        const execution = await models.PositionChangeExecution.findByPk(id, {
            include: ['Employee']
        });

        if (!execution) {
            return responseHelper.error(res, '執行記錄不存在', 'EXECUTION_RECORD_NOT_FOUND', 404);
        }

        if (!execution.canExecute()) {
            return responseHelper.error(res, '該記錄目前無法執行', 'EXECUTION_NOT_ALLOWED');
        }

        // 記錄手動執行操作
        await execution.update({
            approvedBy: adminId,
            executedBy: `ADMIN_${adminId}`,
            scheduledExecutionTime: new Date() // 立即執行
        });

        // 執行職位變更
        await ExecutionEngine.executePositionChange(execution);

        logger.info(`手動執行職位變更: ID ${id}, 操作人 ${adminId}, 原因: ${reason}`);

        responseHelper.success(res, {
            executionId: id,
            status: 'executed',
            executedAt: new Date()
        }, '職位變更執行成功');

    } catch (error) {
        logger.error('手動執行職位變更失敗:', error);
        responseHelper.error(res, error.message, 'EXECUTE_POSITION_CHANGE_FAILED');
    }
});

/**
 * 回滾執行
 * POST /api/execution/rollback/:id
 */
router.post('/rollback/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { adminId, reason } = req.body;

        const result = await ExecutionEngine.rollbackExecution(id, reason || `管理員 ${adminId} 手動回滾`);

        logger.info(`回滾執行: ID ${id}, 操作人 ${adminId}, 原因: ${reason}`);

        responseHelper.success(res, {
            executionId: id,
            rolledBack: true,
            rolledBackAt: result.rolled_back_at
        }, '執行回滾成功');

    } catch (error) {
        logger.error('回滾執行失敗:', error);
        responseHelper.error(res, error.message, 'ROLLBACK_EXECUTION_FAILED');
    }
});

/**
 * 獲取執行統計
 * GET /api/execution/statistics
 */
router.get('/statistics', async (req, res) => {
    try {
        const models = getModels();
        const { startDate, endDate } = req.query;

        const whereClause = {};
        if (startDate && endDate) {
            whereClause.createdAt = {
                [models.PositionChangeExecution.sequelize.Sequelize.Op.between]: [
                    new Date(startDate),
                    new Date(endDate)
                ]
            };
        }

        // 基本統計
        const [
            totalExecutions,
            pendingExecutions,
            completedExecutions,
            failedExecutions,
            rolledBackExecutions
        ] = await Promise.all([
            models.PositionChangeExecution.count({ where: whereClause }),
            models.PositionChangeExecution.count({ where: { ...whereClause, executionStatus: 'pending' } }),
            models.PositionChangeExecution.count({ where: { ...whereClause, executionStatus: 'completed' } }),
            models.PositionChangeExecution.count({ where: { ...whereClause, executionStatus: 'failed' } }),
            models.PositionChangeExecution.count({ where: { ...whereClause, executionStatus: 'rolled_back' } })
        ]);

        // 按變更類型統計
        const changeTypeStats = await models.PositionChangeExecution.findAll({
            where: whereClause,
            attributes: [
                'changeType',
                'executionStatus',
                [models.PositionChangeExecution.sequelize.fn('COUNT', '*'), 'count']
            ],
            group: ['changeType', 'executionStatus']
        });

        // 成功率計算
        const successRate = totalExecutions > 0 ? ((completedExecutions / totalExecutions) * 100).toFixed(2) : 0;
        const failureRate = totalExecutions > 0 ? ((failedExecutions / totalExecutions) * 100).toFixed(2) : 0;

        // 最近的失敗記錄
        const recentFailures = await models.PositionChangeExecution.findAll({
            where: {
                ...whereClause,
                executionStatus: 'failed'
            },
            include: [
                {
                    model: models.Employee,
                    as: 'Employee',
                    attributes: ['name']
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: 5
        });

        responseHelper.success(res, {
            summary: {
                totalExecutions,
                pendingExecutions,
                completedExecutions,
                failedExecutions,
                rolledBackExecutions,
                successRate: parseFloat(successRate),
                failureRate: parseFloat(failureRate)
            },
            changeTypeStats,
            recentFailures
        }, '執行統計獲取成功');

    } catch (error) {
        logger.error('獲取執行統計失敗:', error);
        responseHelper.error(res, error.message, 'GET_EXECUTION_STATISTICS_FAILED');
    }
});

/**
 * 獲取審計日誌
 * GET /api/execution/audit-logs/:executionId
 */
router.get('/audit-logs/:executionId', async (req, res) => {
    try {
        const models = getModels();
        const { executionId } = req.params;

        const auditLogs = await models.ExecutionAuditLog.findAll({
            where: { executionId },
            order: [['startTime', 'ASC']]
        });

        responseHelper.success(res, auditLogs, '審計日誌獲取成功');

    } catch (error) {
        logger.error('獲取審計日誌失敗:', error);
        responseHelper.error(res, error.message, 'GET_AUDIT_LOGS_FAILED');
    }
});

/**
 * 獲取待執行的記錄
 * GET /api/execution/pending
 */
router.get('/pending', async (req, res) => {
    try {
        const models = getModels();

        const pendingExecutions = await models.PositionChangeExecution.findAll({
            where: {
                executionStatus: 'pending'
            },
            include: [
                {
                    model: models.PromotionCampaign,
                    as: 'Campaign',
                    attributes: ['campaignName', 'campaignType']
                },
                {
                    model: models.Employee,
                    as: 'Employee',
                    attributes: ['name', 'position', 'currentStore']
                }
            ],
            order: [['scheduledExecutionTime', 'ASC']]
        });

        responseHelper.success(res, pendingExecutions, '待執行記錄獲取成功');

    } catch (error) {
        logger.error('獲取待執行記錄失敗:', error);
        responseHelper.error(res, error.message, 'GET_PENDING_EXECUTIONS_FAILED');
    }
});

module.exports = router;