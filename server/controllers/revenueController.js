/**
 * ===============================================
 * 營收管理控制器 - Revenue Management Controller
 * ===============================================
 * 基於系統邏輯.txt規格 - 營收統計和分析業務邏輯
 */

const { Op, fn, col, literal } = require('sequelize');
const logger = require('../utils/logger');
const { initModels, getModels } = require('../models/index');

/**
 * 獲取營收統計摘要
 * @param {Object} req - 請求對象
 * @param {Object} res - 回應對象
 */
async function getSummary(req, res) {
    try {
        const { storeId, storeName, month, year } = req.query;
        
        await initModels();
        const models = getModels();
        
        // 設定查詢條件
        const where = { isDeleted: false };
        
        if (storeId) where.storeId = storeId;
        if (storeName) where.storeName = storeName;
        
        // 設定時間範圍
        let dateRange = {};
        if (month && year) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59);
            dateRange = {
                [Op.between]: [startDate, endDate]
            };
        } else {
            // 預設為本月
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
            dateRange = {
                [Op.between]: [startOfMonth, endOfMonth]
            };
        }
        
        where.date = dateRange;
        
        // 獲取營收記錄
        const revenueRecords = await models.RevenueRecord.findAll({
            where,
            order: [['date', 'ASC']]
        });
        
        // 計算統計指標
        const statistics = calculateRevenueStatistics(revenueRecords);
        
        // 生成每日數據
        const dailyData = generateDailyData(revenueRecords);
        
        // 分店統計
        const storeStats = generateStoreStatistics(revenueRecords);
        
        // 獎金類別統計
        const bonusTypeStats = generateBonusTypeStatistics(revenueRecords);
        
        logger.info('營收統計查詢完成', {
            recordCount: revenueRecords.length,
            totalRevenue: statistics.totalRevenue,
            storeName: storeName
        });
        
        res.json({
            success: true,
            data: {
                summary: statistics,
                dailyData: dailyData,
                storeStatistics: storeStats,
                bonusTypeStatistics: bonusTypeStats,
                period: {
                    month: month || new Date().getMonth() + 1,
                    year: year || new Date().getFullYear()
                },
                generatedAt: new Date().toISOString()
            }
        });
        
    } catch (error) {
        logger.error('獲取營收統計失敗:', error);
        res.status(500).json({
            success: false,
            message: '系統錯誤，無法獲取營收統計'
        });
    }
}

/**
 * 獲取營收趨勢分析
 * @param {Object} req - 請求對象  
 * @param {Object} res - 回應對象
 */
async function getTrends(req, res) {
    try {
        const { storeName, period = 'monthly', limit = 12 } = req.query;
        
        await initModels();
        const models = getModels();
        
        let groupBy, dateFormat;
        if (period === 'daily') {
            groupBy = [fn('DATE', col('date'))];
            dateFormat = '%Y-%m-%d';
        } else if (period === 'weekly') {
            groupBy = [fn('YEARWEEK', col('date'))];
            dateFormat = '%Y-%u';
        } else {
            groupBy = [fn('DATE_FORMAT', col('date'), '%Y-%m')];
            dateFormat = '%Y-%m';
        }
        
        const where = { isDeleted: false };
        if (storeName) where.storeName = storeName;
        
        const trends = await models.RevenueRecord.findAll({
            where,
            attributes: [
                [fn('DATE_FORMAT', col('date'), dateFormat), 'period'],
                [fn('SUM', col('totalIncome')), 'totalRevenue'],
                [fn('SUM', col('effectiveRevenue')), 'effectiveRevenue'],
                [fn('SUM', col('bonusAmount')), 'totalBonus'],
                [fn('COUNT', col('id')), 'recordCount'],
                [fn('AVG', col('totalIncome')), 'averageRevenue']
            ],
            group: groupBy,
            order: [[fn('DATE_FORMAT', col('date'), dateFormat), 'ASC']],
            limit: parseInt(limit),
            raw: true
        });
        
        res.json({
            success: true,
            data: {
                trends: trends.map(trend => ({
                    period: trend.period,
                    totalRevenue: parseFloat(trend.totalRevenue) || 0,
                    effectiveRevenue: parseFloat(trend.effectiveRevenue) || 0,
                    totalBonus: parseFloat(trend.totalBonus) || 0,
                    recordCount: parseInt(trend.recordCount) || 0,
                    averageRevenue: parseFloat(trend.averageRevenue) || 0
                })),
                period: period,
                generatedAt: new Date().toISOString()
            }
        });
        
    } catch (error) {
        logger.error('獲取營收趨勢失敗:', error);
        res.status(500).json({
            success: false,
            message: '系統錯誤，無法獲取營收趨勢'
        });
    }
}

/**
 * 獲取員工績效統計
 * @param {Object} req - 請求對象
 * @param {Object} res - 回應對象
 */
async function getEmployeePerformance(req, res) {
    try {
        const { month, year, storeName } = req.query;
        
        await initModels();
        const models = getModels();
        
        const where = { isDeleted: false };
        if (storeName) where.storeName = storeName;
        
        // 設定月份範圍
        if (month && year) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59);
            where.date = {
                [Op.between]: [startDate, endDate]
            };
        }
        
        const employeeStats = await models.RevenueRecord.findAll({
            where,
            attributes: [
                'employeeId',
                'employeeName',
                [fn('COUNT', col('id')), 'submissionCount'],
                [fn('SUM', col('totalIncome')), 'totalRevenue'],
                [fn('SUM', col('effectiveRevenue')), 'totalEffectiveRevenue'],
                [fn('SUM', col('bonusAmount')), 'totalBonus'],
                [fn('AVG', col('totalIncome')), 'averageRevenue'],
                [fn('SUM', literal('CASE WHEN bonusQualified = true THEN 1 ELSE 0 END')), 'qualifiedCount'],
                [fn('MAX', col('date')), 'lastSubmission']
            ],
            group: ['employeeId', 'employeeName'],
            order: [[fn('SUM', col('totalRevenue')), 'DESC']],
            raw: true
        });
        
        const performanceData = employeeStats.map(stat => ({
            employeeId: stat.employeeId,
            employeeName: stat.employeeName,
            submissionCount: parseInt(stat.submissionCount) || 0,
            totalRevenue: parseFloat(stat.totalRevenue) || 0,
            totalEffectiveRevenue: parseFloat(stat.totalEffectiveRevenue) || 0,
            totalBonus: parseFloat(stat.totalBonus) || 0,
            averageRevenue: parseFloat(stat.averageRevenue) || 0,
            qualifiedCount: parseInt(stat.qualifiedCount) || 0,
            qualificationRate: stat.submissionCount > 0 ? 
                ((parseInt(stat.qualifiedCount) / parseInt(stat.submissionCount)) * 100).toFixed(1) : '0.0',
            lastSubmission: stat.lastSubmission
        }));
        
        res.json({
            success: true,
            data: {
                employeePerformance: performanceData,
                summary: {
                    totalEmployees: performanceData.length,
                    totalSubmissions: performanceData.reduce((sum, emp) => sum + emp.submissionCount, 0),
                    totalRevenue: performanceData.reduce((sum, emp) => sum + emp.totalRevenue, 0),
                    totalBonus: performanceData.reduce((sum, emp) => sum + emp.totalBonus, 0)
                },
                period: {
                    month: month || new Date().getMonth() + 1,
                    year: year || new Date().getFullYear()
                }
            }
        });
        
    } catch (error) {
        logger.error('獲取員工績效統計失敗:', error);
        res.status(500).json({
            success: false,
            message: '系統錯誤，無法獲取員工績效統計'
        });
    }
}

/**
 * 計算營收統計指標
 * @param {Array} records - 營收記錄陣列
 * @returns {Object} 統計結果
 */
function calculateRevenueStatistics(records) {
    if (records.length === 0) {
        return {
            totalRevenue: 0,
            totalEffectiveRevenue: 0,
            totalBonus: 0,
            averageRevenue: 0,
            recordCount: 0,
            qualifiedCount: 0,
            qualificationRate: 0
        };
    }
    
    const totalRevenue = records.reduce((sum, record) => sum + parseFloat(record.totalIncome || 0), 0);
    const totalEffectiveRevenue = records.reduce((sum, record) => sum + parseFloat(record.effectiveRevenue || 0), 0);
    const totalBonus = records.reduce((sum, record) => sum + parseFloat(record.bonusAmount || 0), 0);
    const qualifiedCount = records.filter(record => record.bonusQualified || record.bonusStatus === '達標').length;
    
    return {
        totalRevenue: Math.round(totalRevenue),
        totalEffectiveRevenue: Math.round(totalEffectiveRevenue),
        totalBonus: Math.round(totalBonus),
        averageRevenue: Math.round(totalRevenue / records.length),
        recordCount: records.length,
        qualifiedCount: qualifiedCount,
        qualificationRate: ((qualifiedCount / records.length) * 100).toFixed(1)
    };
}

/**
 * 生成每日數據
 * @param {Array} records - 營收記錄陣列
 * @returns {Array} 每日數據陣列
 */
function generateDailyData(records) {
    const dailyMap = new Map();
    
    records.forEach(record => {
        const date = record.date;
        if (!dailyMap.has(date)) {
            dailyMap.set(date, {
                date: date,
                totalRevenue: 0,
                effectiveRevenue: 0,
                totalBonus: 0,
                recordCount: 0,
                qualifiedCount: 0
            });
        }
        
        const dayData = dailyMap.get(date);
        dayData.totalRevenue += parseFloat(record.totalIncome || 0);
        dayData.effectiveRevenue += parseFloat(record.effectiveRevenue || 0);
        dayData.totalBonus += parseFloat(record.bonusAmount || 0);
        dayData.recordCount += 1;
        
        if (record.bonusQualified || record.bonusStatus === '達標') {
            dayData.qualifiedCount += 1;
        }
    });
    
    return Array.from(dailyMap.values()).map(day => ({
        ...day,
        totalRevenue: Math.round(day.totalRevenue),
        effectiveRevenue: Math.round(day.effectiveRevenue),
        totalBonus: Math.round(day.totalBonus),
        qualificationRate: day.recordCount > 0 ? ((day.qualifiedCount / day.recordCount) * 100).toFixed(1) : '0.0'
    })).sort((a, b) => new Date(a.date) - new Date(b.date));
}

/**
 * 生成分店統計
 * @param {Array} records - 營收記錄陣列
 * @returns {Array} 分店統計陣列
 */
function generateStoreStatistics(records) {
    const storeMap = new Map();
    
    records.forEach(record => {
        const storeName = record.storeName;
        if (!storeMap.has(storeName)) {
            storeMap.set(storeName, {
                storeName: storeName,
                totalRevenue: 0,
                effectiveRevenue: 0,
                totalBonus: 0,
                recordCount: 0,
                qualifiedCount: 0
            });
        }
        
        const storeData = storeMap.get(storeName);
        storeData.totalRevenue += parseFloat(record.totalIncome || 0);
        storeData.effectiveRevenue += parseFloat(record.effectiveRevenue || 0);
        storeData.totalBonus += parseFloat(record.bonusAmount || 0);
        storeData.recordCount += 1;
        
        if (record.bonusQualified || record.bonusStatus === '達標') {
            storeData.qualifiedCount += 1;
        }
    });
    
    return Array.from(storeMap.values()).map(store => ({
        ...store,
        totalRevenue: Math.round(store.totalRevenue),
        effectiveRevenue: Math.round(store.effectiveRevenue),
        totalBonus: Math.round(store.totalBonus),
        averageRevenue: store.recordCount > 0 ? Math.round(store.totalRevenue / store.recordCount) : 0,
        qualificationRate: store.recordCount > 0 ? ((store.qualifiedCount / store.recordCount) * 100).toFixed(1) : '0.0'
    })).sort((a, b) => b.totalRevenue - a.totalRevenue);
}

/**
 * 生成獎金類別統計
 * @param {Array} records - 營收記錄陣列
 * @returns {Object} 獎金類別統計
 */
function generateBonusTypeStatistics(records) {
    const weekdayRecords = records.filter(record => record.bonusType === '平日獎金');
    const holidayRecords = records.filter(record => record.bonusType === '假日獎金');
    
    return {
        weekday: {
            type: '平日獎金',
            count: weekdayRecords.length,
            totalRevenue: weekdayRecords.reduce((sum, record) => sum + parseFloat(record.totalIncome || 0), 0),
            totalBonus: weekdayRecords.reduce((sum, record) => sum + parseFloat(record.bonusAmount || 0), 0),
            qualifiedCount: weekdayRecords.filter(record => record.bonusQualified || record.bonusStatus === '達標').length
        },
        holiday: {
            type: '假日獎金',
            count: holidayRecords.length,
            totalRevenue: holidayRecords.reduce((sum, record) => sum + parseFloat(record.totalIncome || 0), 0),
            totalBonus: holidayRecords.reduce((sum, record) => sum + parseFloat(record.bonusAmount || 0), 0),
            qualifiedCount: holidayRecords.filter(record => record.bonusQualified || record.bonusStatus === '達標').length
        }
    };
}

module.exports = {
    getSummary,
    getTrends,
    getEmployeePerformance
};