/**
 * =======================================
 * 結果自動執行引擎 - ExecutionEngine
 * =======================================
 * 處理投票結果的自動執行，包括職位變更、薪資調整、權限更新等
 */

const logger = require('../utils/logger');
const { getModels } = require('../models');

class ExecutionEngine {
    constructor() {
        this.isProcessing = false;
        this.executionQueue = [];
    }

    /**
     * 處理投票結果並創建執行計劃
     */
    async processCampaignResult(campaignId) {
        try {
            const models = getModels();
            
            // 獲取投票活動和結果
            const campaign = await models.PromotionCampaign.findByPk(campaignId, {
                include: [
                    {
                        model: models.PromotionCandidate,
                        as: 'Candidates',
                        include: [{
                            model: models.Employee,
                            as: 'Employee'
                        }]
                    }
                ]
            });

            if (!campaign) {
                throw new Error(`投票活動不存在: ${campaignId}`);
            }

            // 檢查是否已有執行記錄
            const existingExecution = await models.PositionChangeExecution.findOne({
                where: { campaignId }
            });

            if (existingExecution) {
                logger.info(`投票活動 ${campaignId} 已有執行記錄，跳過創建`);
                return existingExecution;
            }

            // 計算投票結果
            const voteResults = await this.calculateVoteResults(campaignId);
            
            // 判斷是否應該執行變更
            const shouldExecute = this.shouldExecuteChange(campaign, voteResults);
            
            if (!shouldExecute.execute) {
                logger.info(`投票活動 ${campaignId} 不符合執行條件: ${shouldExecute.reason}`);
                return null;
            }

            // 創建執行記錄
            const executions = [];
            for (const candidate of campaign.Candidates) {
                const execution = await this.createExecutionRecord(campaign, candidate, voteResults);
                executions.push(execution);
            }

            logger.info(`為投票活動 ${campaignId} 創建了 ${executions.length} 個執行記錄`);
            return executions;

        } catch (error) {
            logger.error('處理投票結果失敗:', error);
            throw error;
        }
    }

    /**
     * 計算投票結果
     */
    async calculateVoteResults(campaignId) {
        const models = getModels();
        
        const votes = await models.PromotionVote.findAll({
            where: { 
                campaignId,
                isValid: true 
            }
        });

        const totalVotes = votes.length;
        const agreeVotes = votes.filter(v => v.currentDecision === 'agree').length;
        const disagreeVotes = votes.filter(v => v.currentDecision === 'disagree').length;
        const abstainVotes = votes.filter(v => v.currentDecision === 'abstain').length;

        const agreePercentage = totalVotes > 0 ? (agreeVotes / totalVotes) * 100 : 0;
        const disagreePercentage = totalVotes > 0 ? (disagreeVotes / totalVotes) * 100 : 0;
        const abstainPercentage = totalVotes > 0 ? (abstainVotes / totalVotes) * 100 : 0;

        return {
            totalVotes,
            agreeVotes,
            disagreeVotes,
            abstainVotes,
            agreePercentage,
            disagreePercentage,
            abstainPercentage
        };
    }

    /**
     * 判斷是否應該執行變更
     */
    shouldExecuteChange(campaign, voteResults) {
        const { campaignType, campaignSubType } = campaign;
        const { agreePercentage } = voteResults;

        // 轉正投票需要50%以上同意
        if (campaignType === 'promotion' || campaignSubType === 'new_employee_promotion') {
            if (agreePercentage >= 50.0) {
                return { execute: true, reason: '轉正投票通過' };
            } else {
                return { execute: false, reason: `同意比例不足: ${agreePercentage.toFixed(2)}% (需要50%)` };
            }
        }

        // 降職投票需要30%以上同意
        if (campaignSubType === 'demotion_punishment') {
            if (agreePercentage >= 30.0) {
                return { execute: true, reason: '降職投票通過' };
            } else {
                return { execute: false, reason: `同意比例不足: ${agreePercentage.toFixed(2)}% (需要30%)` };
            }
        }

        return { execute: false, reason: '未知的投票類型' };
    }

    /**
     * 創建執行記錄
     */
    async createExecutionRecord(campaign, candidate, voteResults) {
        const models = getModels();
        const employee = candidate.Employee;

        let changeType, newPosition;
        
        if (campaign.campaignType === 'promotion' || campaign.campaignSubType === 'new_employee_promotion') {
            changeType = 'promotion';
            newPosition = candidate.targetPosition || this.getNextPosition(employee.position);
        } else if (campaign.campaignSubType === 'demotion_punishment') {
            changeType = 'demotion';
            newPosition = this.getPreviousPosition(employee.position);
        }

        const execution = await models.PositionChangeExecution.create({
            campaignId: campaign.id,
            employeeId: employee.id,
            changeType,
            oldPosition: employee.position,
            newPosition,
            oldSalaryGrade: this.getPositionGrade(employee.position),
            newSalaryGrade: this.getPositionGrade(newPosition),
            rollbackData: {
                employee: {
                    id: employee.id,
                    position: employee.position,
                    positionStartDate: employee.positionStartDate
                },
                voteResults,
                timestamp: new Date()
            }
        });

        // 計算並設定執行時間
        execution.calculateExecutionDelay();
        await execution.save();

        logger.info(`創建執行記錄: 員工 ${employee.name} ${employee.position} -> ${newPosition}`);
        
        return execution;
    }

    /**
     * 執行待處理的職位變更
     */
    async executeScheduledChanges() {
        if (this.isProcessing) {
            logger.debug('執行引擎正在處理中，跳過本次執行');
            return;
        }

        this.isProcessing = true;
        
        try {
            const models = getModels();
            
            // 獲取待執行的記錄
            const pendingExecutions = await models.PositionChangeExecution.findAll({
                where: {
                    executionStatus: 'pending',
                    scheduledExecutionTime: {
                        [models.PositionChangeExecution.sequelize.Sequelize.Op.lte]: new Date()
                    }
                },
                include: ['Campaign', 'Employee'],
                order: [['scheduledExecutionTime', 'ASC']]
            });

            if (pendingExecutions.length === 0) {
                logger.debug('沒有待執行的職位變更');
                return;
            }

            logger.info(`發現 ${pendingExecutions.length} 個待執行的職位變更`);

            // 逐一執行
            for (const execution of pendingExecutions) {
                await this.executePositionChange(execution);
            }

        } catch (error) {
            logger.error('執行職位變更失敗:', error);
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * 執行單個職位變更
     */
    async executePositionChange(execution) {
        const models = getModels();
        
        try {
            logger.info(`開始執行職位變更: ID ${execution.id}, 員工 ${execution.Employee.name}`);
            
            // 更新執行狀態
            await execution.update({
                executionStatus: 'in_progress',
                actualExecutionTime: new Date()
            });

            // 執行步驟
            const steps = [
                { name: 'validate_result', handler: this.validateResult },
                { name: 'backup_current_state', handler: this.backupCurrentState },
                { name: 'update_position', handler: this.updatePosition },
                { name: 'adjust_salary', handler: this.adjustSalary },
                { name: 'update_permissions', handler: this.updatePermissions },
                { name: 'send_notifications', handler: this.sendNotifications },
                { name: 'update_system_records', handler: this.updateSystemRecords }
            ];

            let allStepsSuccessful = true;
            const results = {};

            for (const step of steps) {
                try {
                    // 創建審計日誌
                    const auditLog = await models.ExecutionAuditLog.createLog(
                        execution.id,
                        step.name
                    );

                    // 執行步驟
                    const stepResult = await step.handler.call(this, execution);
                    
                    // 完成審計日誌
                    await auditLog.complete(stepResult);
                    
                    results[step.name] = stepResult;
                    
                    logger.info(`步驟完成: ${step.name}`);
                    
                } catch (stepError) {
                    logger.error(`步驟失敗: ${step.name}`, stepError);
                    
                    // 記錄失敗
                    const auditLog = await models.ExecutionAuditLog.findOne({
                        where: {
                            executionId: execution.id,
                            step: step.name,
                            status: 'started'
                        }
                    });
                    
                    if (auditLog) {
                        await auditLog.fail(stepError.message);
                    }
                    
                    allStepsSuccessful = false;
                    break;
                }
            }

            // 更新最終執行狀態
            if (allStepsSuccessful) {
                await execution.update({
                    executionStatus: 'completed',
                    executionResults: results
                });
                logger.info(`職位變更執行完成: ${execution.Employee.name} ${execution.oldPosition} -> ${execution.newPosition}`);
            } else {
                await execution.update({
                    executionStatus: 'failed',
                    failureReason: '執行步驟失敗',
                    executionResults: results
                });
                logger.error(`職位變更執行失敗: ${execution.Employee.name}`);
            }

        } catch (error) {
            logger.error(`執行職位變更失敗: ID ${execution.id}`, error);
            
            await execution.update({
                executionStatus: 'failed',
                failureReason: error.message
            });
        }
    }

    /**
     * 步驟1: 驗證結果
     */
    async validateResult(execution) {
        const models = getModels();
        
        // 檢查投票活動是否正式結束
        const campaign = await models.PromotionCampaign.findByPk(execution.campaignId);
        if (!campaign || campaign.status !== 'closed') {
            throw new Error('投票活動未正式結束');
        }

        // 檢查是否有申訴進行中
        if (models.VoteAppeal) {
            const activeAppeals = await models.VoteAppeal.count({
                where: {
                    campaignId: execution.campaignId,
                    appealStatus: ['pending', 'under_review']
                }
            });

            if (activeAppeals > 0) {
                throw new Error('存在進行中的申訴，暫停執行');
            }
        }

        return { validated: true, timestamp: new Date() };
    }

    /**
     * 步驟2: 備份當前狀態
     */
    async backupCurrentState(execution) {
        const models = getModels();
        
        const employee = await models.Employee.findByPk(execution.employeeId);
        if (!employee) {
            throw new Error('員工不存在');
        }

        const backupData = {
            employee: {
                id: employee.id,
                name: employee.name,
                position: employee.position,
                positionStartDate: employee.positionStartDate,
                currentStore: employee.currentStore
            },
            timestamp: new Date()
        };

        await execution.update({ rollbackData: backupData });
        
        return { backed_up: true, data_size: JSON.stringify(backupData).length };
    }

    /**
     * 步驟3: 更新職位
     */
    async updatePosition(execution) {
        const models = getModels();
        
        const employee = await models.Employee.findByPk(execution.employeeId);
        if (!employee) {
            throw new Error('員工不存在');
        }

        const oldPosition = employee.position;
        
        await employee.update({
            position: execution.newPosition,
            positionStartDate: new Date(),
            lastPromotionDate: new Date()
        });

        return { 
            updated: true,
            old_position: oldPosition,
            new_position: execution.newPosition,
            updated_at: new Date()
        };
    }

    /**
     * 步驟4: 調整薪資
     */
    async adjustSalary(execution) {
        // 這裡可以集成薪資系統
        // 目前只記錄調整信息
        
        const adjustmentInfo = {
            employee_id: execution.employeeId,
            old_grade: execution.oldSalaryGrade,
            new_grade: execution.newSalaryGrade,
            change_type: execution.changeType,
            adjustment_date: new Date()
        };

        logger.info(`薪資調整: 員工 ${execution.employeeId}, 等級 ${execution.oldSalaryGrade} -> ${execution.newSalaryGrade}`);

        return adjustmentInfo;
    }

    /**
     * 步驟5: 更新權限
     */
    async updatePermissions(execution) {
        // 這裡可以集成權限管理系統
        // 目前只記錄權限變更
        
        const permissionChanges = {
            employee_id: execution.employeeId,
            old_position: execution.oldPosition,
            new_position: execution.newPosition,
            updated_permissions: this.getPermissionsForPosition(execution.newPosition),
            updated_at: new Date()
        };

        return permissionChanges;
    }

    /**
     * 步驟6: 發送通知
     */
    async sendNotifications(execution) {
        // 這裡可以集成通知服務
        const notifications = [];
        
        // 通知員工本人
        notifications.push({
            recipient: execution.employeeId,
            type: 'position_change',
            sent: true,
            timestamp: new Date()
        });

        // 通知管理層
        notifications.push({
            recipient: 'management',
            type: 'position_change_report',
            sent: true,
            timestamp: new Date()
        });

        await execution.recordNotification('position_change_complete', notifications, true);
        
        return { notifications_sent: notifications.length, notifications };
    }

    /**
     * 步驟7: 更新系統記錄
     */
    async updateSystemRecords(execution) {
        // 更新各種系統記錄
        const updates = [];
        
        updates.push({
            system: 'position_history',
            action: 'add_record',
            data: {
                employee_id: execution.employeeId,
                old_position: execution.oldPosition,
                new_position: execution.newPosition,
                change_date: new Date(),
                reason: `投票結果自動執行 - 活動ID: ${execution.campaignId}`
            }
        });

        return { system_updates: updates.length, updates };
    }

    /**
     * 輔助方法
     */
    getNextPosition(currentPosition) {
        const hierarchy = {
            '實習生': '員工',
            '員工': '副店長',
            '副店長': '店長'
        };
        return hierarchy[currentPosition] || currentPosition;
    }

    getPreviousPosition(currentPosition) {
        const hierarchy = {
            '店長': '副店長',
            '副店長': '員工',
            '員工': '實習生'
        };
        return hierarchy[currentPosition] || currentPosition;
    }

    getPositionGrade(position) {
        const grades = {
            '實習生': 1,
            '員工': 2,
            '副店長': 3,
            '店長': 4
        };
        return grades[position] || 1;
    }

    getPermissionsForPosition(position) {
        const permissions = {
            '實習生': ['basic_access'],
            '員工': ['basic_access', 'employee_functions'],
            '副店長': ['basic_access', 'employee_functions', 'assistant_manager_functions'],
            '店長': ['basic_access', 'employee_functions', 'assistant_manager_functions', 'manager_functions']
        };
        return permissions[position] || ['basic_access'];
    }

    /**
     * 回滾執行
     */
    async rollbackExecution(executionId, reason = '手動回滾') {
        const models = getModels();
        
        const execution = await models.PositionChangeExecution.findByPk(executionId, {
            include: ['Employee']
        });

        if (!execution) {
            throw new Error(`執行記錄不存在: ${executionId}`);
        }

        if (!execution.canRollback()) {
            throw new Error('該執行記錄不能回滾');
        }

        try {
            // 恢復員工資料
            const backupData = execution.rollbackData.employee;
            await models.Employee.update(backupData, {
                where: { id: execution.employeeId }
            });

            // 更新執行狀態
            await execution.update({
                executionStatus: 'rolled_back',
                failureReason: reason
            });

            logger.info(`執行回滾完成: ID ${executionId}, 原因: ${reason}`);
            
            return { success: true, rolled_back_at: new Date() };

        } catch (error) {
            logger.error(`執行回滾失敗: ID ${executionId}`, error);
            throw error;
        }
    }
}

module.exports = new ExecutionEngine();