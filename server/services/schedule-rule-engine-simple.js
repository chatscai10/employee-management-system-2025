const { getModels } = require('../models');

/**
 * 簡化版排班規則引擎 - 用於測試
 */
class SimpleScheduleRuleEngine {
    
    static async validateAllRules(employeeId, year, month, offDates) {
        try {
            console.log(`🔍 簡化規則引擎開始 - 員工ID: ${employeeId}, 期間: ${year}-${month}`);
            
            // 獲取模型
            const models = getModels();
            console.log(`📋 模型狀態 - Employee存在: ${!!models.Employee}`);
            console.log(`📋 Employee類型: ${typeof models.Employee}`);
            console.log(`📋 findByPk方法: ${typeof models.Employee?.findByPk}`);
            
            if (!models.Employee) {
                throw new Error('Employee模型不存在');
            }
            
            if (typeof models.Employee.findByPk !== 'function') {
                throw new Error(`Employee.findByPk不是函數，類型: ${typeof models.Employee.findByPk}`);
            }
            
            // 測試查找員工
            console.log(`🔍 查找員工ID: ${employeeId}`);
            const employee = await models.Employee.findByPk(employeeId);
            console.log(`👤 員工查找結果: ${employee ? '找到' : '未找到'}`);
            
            if (!employee) {
                return {
                    isValid: false,
                    violations: ['員工不存在'],
                    ruleResults: {}
                };
            }
            
            // 基本驗證通過
            return {
                isValid: true,
                violations: [],
                ruleResults: {
                    basic: { 
                        valid: true, 
                        message: '基本驗證通過',
                        employee: {
                            name: employee.name,
                            position: employee.position,
                            store: employee.currentStore
                        }
                    }
                }
            };
            
        } catch (error) {
            console.error('簡化規則引擎錯誤:', error);
            return {
                isValid: false,
                violations: [`系統錯誤: ${error.message}`],
                ruleResults: {}
            };
        }
    }
}

module.exports = SimpleScheduleRuleEngine;