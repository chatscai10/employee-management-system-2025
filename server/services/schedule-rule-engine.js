const { Op } = require('sequelize');
const { getModels } = require('../models');

/**
 * 排班系統 6重規則引擎
 * 完整實現系統邏輯.txt 中規定的6重驗證規則
 */
class ScheduleRuleEngine {
    
    /**
     * 綜合規則驗證 - 執行所有6重規則
     * @param {number} employeeId 員工ID
     * @param {number} year 年份
     * @param {number} month 月份
     * @param {Array} offDates 休假日期陣列 ['2025-02-01', '2025-02-05']
     * @returns {Object} 驗證結果
     */
    static async validateAllRules(employeeId, year, month, offDates) {
        try {
            console.log(`🔍 開始執行6重規則驗證 - 員工ID: ${employeeId}, 期間: ${year}-${month}`);
            
            const results = {
                isValid: true,
                violations: [],
                ruleResults: {}
            };

            // 獲取模型
            const models = getModels();
            if (!models.Employee || !models.ScheduleConfig) {
                throw new Error('模型未正確載入');
            }


            // 獲取員工資訊
            const employee = await models.Employee.findByPk(employeeId);
            if (!employee) {
                throw new Error('員工不存在');
            }

            // 獲取排班配置
            const config = await models.ScheduleConfig.getConfig(year, month);
            if (!config) {
                throw new Error('無法獲取排班配置');
            }

            // 規則1：月度休假限制
            const rule1 = await this.validateMonthlyOffDaysLimit(models, employeeId, year, month, offDates, config);
            results.ruleResults.rule1 = rule1;
            if (!rule1.valid) {
                results.isValid = false;
                results.violations.push(`規則1違反: ${rule1.message}`);
            }

            // 規則2：日度休假限制
            const rule2 = await this.validateDailyOffDaysLimit(models, offDates, year, month, employeeId, config);
            results.ruleResults.rule2 = rule2;
            if (!rule2.valid) {
                results.isValid = false;
                results.violations.push(`規則2違反: ${rule2.message}`);
            }

            // 規則3：週末休假限制
            const rule3 = await this.validateWeekendOffDaysLimit(models, employeeId, year, month, offDates, config);
            results.ruleResults.rule3 = rule3;
            if (!rule3.valid) {
                results.isValid = false;
                results.violations.push(`規則3違反: ${rule3.message}`);
            }

            // 規則4：分店休假限制
            const rule4 = await this.validateStoreOffDaysLimit(models, employee.currentStore, offDates, year, month, employeeId, config);
            results.ruleResults.rule4 = rule4;
            if (!rule4.valid) {
                results.isValid = false;
                results.violations.push(`規則4違反: ${rule4.message}`);
            }

            // 規則5：職位休假限制
            const rule5 = await this.validatePositionOffDaysLimit(models, employee.position, offDates, year, month, employeeId, config);
            results.ruleResults.rule5 = rule5;
            if (!rule5.valid) {
                results.isValid = false;
                results.violations.push(`規則5違反: ${rule5.message}`);
            }

            // 規則6：特殊日期規則  
            const rule6 = await this.validateSpecialDates(models, offDates, year, month, employee.currentStore, config);
            results.ruleResults.rule6 = rule6;
            if (!rule6.valid) {
                results.isValid = false;
                results.violations.push(`規則6違反: ${rule6.message}`);
            }

            console.log(`✅ 6重規則驗證完成 - 結果: ${results.isValid ? '通過' : '失敗'}`);
            if (!results.isValid) {
                console.log(`❌ 違規項目: ${results.violations.join(', ')}`);
            }

            return results;
        } catch (error) {
            console.error('6重規則驗證錯誤:', error);
            return {
                isValid: false,
                violations: [`系統錯誤: ${error.message}`],
                ruleResults: {}
            };
        }
    }

    /**
     * 規則1：月度休假限制
     * 每人每月休假天數不得超過設定上限
     */
    static async validateMonthlyOffDaysLimit(models, employeeId, year, month, newOffDates, config) {
        try {
            const currentOffDays = await models.Schedule.getEmployeeOffDaysCount(employeeId, year, month);
            const newOffDaysCount = Array.isArray(newOffDates) ? newOffDates.length : 0;
            const maxAllowed = config.maxOffDaysPerPerson;

            const isValid = newOffDaysCount <= maxAllowed;

            return {
                valid: isValid,
                message: isValid ? 
                    `月度休假檢查通過 (${newOffDaysCount}/${maxAllowed}天)` : 
                    `超過月度休假限制! 申請${newOffDaysCount}天，上限${maxAllowed}天`,
                details: {
                    currentOffDays,
                    newOffDaysCount,
                    maxAllowed,
                    remaining: maxAllowed - newOffDaysCount
                }
            };
        } catch (error) {
            console.error('規則1驗證錯誤:', error);
            return {
                valid: false,
                message: `月度休假限制驗證失敗: ${error.message}`,
                details: {}
            };
        }
    }

    /**
     * 規則2：日度休假限制
     * 任何一天的休假人數不得超過設定上限
     */
    static async validateDailyOffDaysLimit(models, offDates, year, month, excludeEmployeeId, config) {
        try {
            if (!Array.isArray(offDates) || offDates.length === 0) {
                return { valid: true, message: '無休假日期', details: {} };
            }

            const maxAllowed = config.maxOffDaysPerDay;
            const violations = [];

            for (const dateStr of offDates) {
                const currentCount = await this.getDailyOffCountExcludeEmployee(models, dateStr, year, month, excludeEmployeeId);
                const newCount = currentCount + 1; // 加上這個員工

                if (newCount > maxAllowed) {
                    violations.push({
                        date: dateStr,
                        currentCount: currentCount,
                        newCount: newCount,
                        maxAllowed: maxAllowed
                    });
                }
            }

            const isValid = violations.length === 0;

            return {
                valid: isValid,
                message: isValid ? 
                    `每日休假人數檢查通過` : 
                    `以下日期超過每日休假人數限制: ${violations.map(v => `${v.date}(${v.newCount}/${v.maxAllowed}人)`).join(', ')}`,
                details: { violations, maxAllowed }
            };
        } catch (error) {
            console.error('規則2驗證錯誤:', error);
            return {
                valid: false,
                message: `每日休假限制驗證失敗: ${error.message}`,
                details: {}
            };
        }
    }

    /**
     * 規則3：週末休假限制
     * 每人每月週末(週五六日)休假不得超過設定上限
     */
    static async validateWeekendOffDaysLimit(models, employeeId, year, month, newOffDates, config) {
        try {
            if (!Array.isArray(newOffDates)) {
                return { valid: true, message: '無休假日期', details: {} };
            }

            const weekendDatesCount = this.countWeekendDays(newOffDates);
            const maxAllowed = config.maxWeekendOffDays;

            const isValid = weekendDatesCount <= maxAllowed;

            return {
                valid: isValid,
                message: isValid ? 
                    `週末休假檢查通過 (${weekendDatesCount}/${maxAllowed}天)` : 
                    `超過週末休假限制! 申請週末休假${weekendDatesCount}天，上限${maxAllowed}天`,
                details: {
                    weekendDatesCount,
                    maxAllowed,
                    weekendDates: newOffDates.filter(dateStr => {
                        const date = new Date(dateStr);
                        const dayOfWeek = date.getDay();
                        return dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0; // 週五六日
                    })
                }
            };
        } catch (error) {
            console.error('規則3驗證錯誤:', error);
            return {
                valid: false,
                message: `週末休假限制驗證失敗: ${error.message}`,
                details: {}
            };
        }
    }

    /**
     * 規則4：分店休假限制
     * 同一分店同一天休假人數不得超過設定上限
     */
    static async validateStoreOffDaysLimit(models, storeName, offDates, year, month, excludeEmployeeId, config) {
        try {
            if (!Array.isArray(offDates) || offDates.length === 0) {
                return { valid: true, message: '無休假日期', details: {} };
            }

            const maxAllowed = config.maxStoreOffDaysPerDay;
            const violations = [];

            for (const dateStr of offDates) {
                const currentCount = await this.getStoreOffCountExcludeEmployee(models, storeName, dateStr, year, month, excludeEmployeeId);
                const newCount = currentCount + 1;

                if (newCount > maxAllowed) {
                    violations.push({
                        date: dateStr,
                        currentCount: currentCount,
                        newCount: newCount,
                        maxAllowed: maxAllowed
                    });
                }
            }

            const isValid = violations.length === 0;

            return {
                valid: isValid,
                message: isValid ? 
                    `分店休假人數檢查通過` : 
                    `以下日期超過分店每日休假人數限制: ${violations.map(v => `${v.date}(${v.newCount}/${v.maxAllowed}人)`).join(', ')}`,
                details: { violations, maxAllowed, storeName }
            };
        } catch (error) {
            console.error('規則4驗證錯誤:', error);
            return {
                valid: false,
                message: `分店休假限制驗證失敗: ${error.message}`,
                details: {}
            };
        }
    }

    /**
     * 規則5：職位休假限制
     * 特定職位(兼職/待命)每天休假人數不得超過設定上限
     */
    static async validatePositionOffDaysLimit(models, position, offDates, year, month, excludeEmployeeId, config) {
        try {
            if (!Array.isArray(offDates) || offDates.length === 0) {
                return { valid: true, message: '無休假日期', details: {} };
            }

            // 只檢查特定職位
            let maxAllowed = null;
            if (position === '兼職') {
                maxAllowed = config.maxPartTimeOffDays;
            } else if (position === '待命') {
                maxAllowed = config.maxStandbyOffDays;
            }

            // 如果不是限制職位，直接通過
            if (maxAllowed === null) {
                return {
                    valid: true,
                    message: `職位 "${position}" 無特殊限制`,
                    details: { position }
                };
            }

            const violations = [];

            for (const dateStr of offDates) {
                const currentCount = await this.getPositionOffCountExcludeEmployee(models, position, dateStr, year, month, excludeEmployeeId);
                const newCount = currentCount + 1;

                if (newCount > maxAllowed) {
                    violations.push({
                        date: dateStr,
                        currentCount: currentCount,
                        newCount: newCount,
                        maxAllowed: maxAllowed
                    });
                }
            }

            const isValid = violations.length === 0;

            return {
                valid: isValid,
                message: isValid ? 
                    `職位休假人數檢查通過` : 
                    `以下日期超過 "${position}" 職位每日休假人數限制: ${violations.map(v => `${v.date}(${v.newCount}/${v.maxAllowed}人)`).join(', ')}`,
                details: { violations, maxAllowed, position }
            };
        } catch (error) {
            console.error('規則5驗證錯誤:', error);
            return {
                valid: false,
                message: `職位休假限制驗證失敗: ${error.message}`,
                details: {}
            };
        }
    }

    /**
     * 規則6：特殊日期規則
     * 檢查公休日和禁休日規則
     */
    static async validateSpecialDates(models, offDates, year, month, storeName, config) {
        try {
            if (!Array.isArray(offDates) || offDates.length === 0) {
                return { valid: true, message: '無休假日期', details: {} };
            }

            const violations = [];
            const holidayViolations = [];
            const forbiddenViolations = [];

            for (const dateStr of offDates) {
                // 檢查禁休日
                if (config.isForbiddenDate(dateStr, storeName)) {
                    forbiddenViolations.push(dateStr);
                    violations.push({
                        date: dateStr,
                        type: 'forbidden',
                        message: '此日期為禁休日，不允許申請休假'
                    });
                }

                // 檢查公休日 - 警告但不阻止
                if (config.isHolidayDate(dateStr, storeName)) {
                    holidayViolations.push(dateStr);
                }
            }

            const isValid = forbiddenViolations.length === 0;

            let message = '';
            if (isValid) {
                message = '特殊日期規則檢查通過';
                if (holidayViolations.length > 0) {
                    message += ` (注意: ${holidayViolations.join(', ')} 為公休日)`;
                }
            } else {
                message = `無法申請休假，以下日期為禁休日: ${forbiddenViolations.join(', ')}`;
            }

            return {
                valid: isValid,
                message: message,
                details: {
                    violations,
                    holidayDates: holidayViolations,
                    forbiddenDates: forbiddenViolations
                }
            };
        } catch (error) {
            console.error('規則6驗證錯誤:', error);
            return {
                valid: false,
                message: `特殊日期規則驗證失敗: ${error.message}`,
                details: {}
            };
        }
    }

    // 輔助方法：獲取特定日期休假人數(排除指定員工)
    static async getDailyOffCountExcludeEmployee(models, date, year, month, excludeEmployeeId) {
        try {
            const schedules = await models.Schedule.findAll({
                where: {
                    scheduleYear: year,
                    scheduleMonth: month,
                    employeeId: { [Op.ne]: excludeEmployeeId }
                },
                attributes: ['offDates']
            });

            let count = 0;
            const targetDate = date.toString();
            
            schedules.forEach(schedule => {
                if (schedule.offDates && Array.isArray(schedule.offDates)) {
                    if (schedule.offDates.includes(targetDate)) {
                        count++;
                    }
                }
            });

            return count;
        } catch (error) {
            console.error('獲取每日休假人數錯誤:', error);
            return 0;
        }
    }

    // 輔助方法：獲取分店特定日期休假人數(排除指定員工)
    static async getStoreOffCountExcludeEmployee(models, storeName, date, year, month, excludeEmployeeId) {
        try {
            // 先獲取該分店的所有員工
            const storeEmployees = await models.Employee.findAll({
                where: { currentStore: storeName },
                attributes: ['id']
            });
            const storeEmployeeIds = storeEmployees.map(emp => emp.id);

            // 獲取這些員工的排班記錄(排除指定員工)
            const schedules = await models.Schedule.findAll({
                where: {
                    scheduleYear: year,
                    scheduleMonth: month,
                    employeeId: { 
                        [Op.in]: storeEmployeeIds,
                        [Op.ne]: excludeEmployeeId 
                    }
                },
                attributes: ['offDates']
            });

            let count = 0;
            const targetDate = date.toString();
            
            schedules.forEach(schedule => {
                if (schedule.offDates && Array.isArray(schedule.offDates)) {
                    if (schedule.offDates.includes(targetDate)) {
                        count++;
                    }
                }
            });

            return count;
        } catch (error) {
            console.error('獲取分店每日休假人數錯誤:', error);
            return 0;
        }
    }

    // 輔助方法：獲取特定職位特定日期休假人數(排除指定員工)
    static async getPositionOffCountExcludeEmployee(models, position, date, year, month, excludeEmployeeId) {
        try {
            // 先獲取該職位的所有員工
            const positionEmployees = await models.Employee.findAll({
                where: { position },
                attributes: ['id']
            });
            const positionEmployeeIds = positionEmployees.map(emp => emp.id);

            // 獲取這些員工的排班記錄(排除指定員工)
            const schedules = await models.Schedule.findAll({
                where: {
                    scheduleYear: year,
                    scheduleMonth: month,
                    employeeId: { 
                        [Op.in]: positionEmployeeIds,
                        [Op.ne]: excludeEmployeeId 
                    }
                },
                attributes: ['offDates']
            });

            let count = 0;
            const targetDate = date.toString();
            
            schedules.forEach(schedule => {
                if (schedule.offDates && Array.isArray(schedule.offDates)) {
                    if (schedule.offDates.includes(targetDate)) {
                        count++;
                    }
                }
            });

            return count;
        } catch (error) {
            console.error('獲取職位每日休假人數錯誤:', error);
            return 0;
        }
    }

    // 輔助方法：計算週末休假天數
    static countWeekendDays(offDates) {
        if (!Array.isArray(offDates)) return 0;
        
        let weekendCount = 0;
        offDates.forEach(dateStr => {
            const date = new Date(dateStr);
            const dayOfWeek = date.getDay();
            // 週五(5)、週六(6)、週日(0)
            if (dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0) {
                weekendCount++;
            }
        });
        
        return weekendCount;
    }
}

module.exports = ScheduleRuleEngine;