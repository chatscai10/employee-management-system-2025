/**
 * ================================================
 * 報表系統路由 - Reports Management Routes
 * ================================================
 * 基於系統邏輯.txt規格 - 統計報告和數據分析系統
 */

const express = require('express');
const router = express.Router();
const { Op, fn, col, literal } = require('sequelize');
const logger = require('../../utils/logger');
const { initModels, getModels } = require('../../models/index');

/**
 * 報表數據處理引擎
 */
class ReportsEngine {
    
    // 生成月度營收報告 (系統邏輯.txt line 244)
    static async generateMonthlyRevenueReport(year, month) {
        const models = await initModels();
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);
        
        const revenueData = await models.RevenueRecord.findAll({
            where: {
                date: { [Op.between]: [startDate, endDate] },
                isDeleted: false
            },
            order: [['date', 'ASC']]
        });
        
        // 按分店統計
        const storeStats = {};
        let totalRevenue = 0;
        let totalBonus = 0;
        let totalOrders = 0;
        
        revenueData.forEach(record => {
            const storeName = record.storeName;
            if (!storeStats[storeName]) {
                storeStats[storeName] = {
                    storeName,
                    revenue: 0,
                    bonus: 0,
                    orders: 0,
                    recordCount: 0,
                    avgDailyRevenue: 0,
                    qualifiedDays: 0
                };
            }
            
            storeStats[storeName].revenue += parseFloat(record.totalIncome || 0);
            storeStats[storeName].bonus += parseFloat(record.bonusAmount || 0);
            storeStats[storeName].orders += parseInt(record.orderCount || 0);
            storeStats[storeName].recordCount += 1;
            
            if (record.bonusStatus === '達標') {
                storeStats[storeName].qualifiedDays += 1;
            }
            
            totalRevenue += parseFloat(record.totalIncome || 0);
            totalBonus += parseFloat(record.bonusAmount || 0);
            totalOrders += parseInt(record.orderCount || 0);
        });
        
        // 計算平均值
        Object.values(storeStats).forEach(store => {
            store.avgDailyRevenue = store.recordCount > 0 ? store.revenue / store.recordCount : 0;
            store.qualificationRate = store.recordCount > 0 ? (store.qualifiedDays / store.recordCount * 100).toFixed(1) : '0.0';
        });
        
        // 按獎金類別統計
        const bonusTypeStats = {
            weekday: revenueData.filter(r => r.bonusType === '平日獎金'),
            holiday: revenueData.filter(r => r.bonusType === '假日獎金')
        };
        
        return {
            period: { year, month },
            summary: {
                totalRevenue: Math.round(totalRevenue),
                totalBonus: Math.round(totalBonus),
                totalOrders,
                recordCount: revenueData.length,
                avgDailyRevenue: revenueData.length > 0 ? Math.round(totalRevenue / revenueData.length) : 0,
                qualificationRate: revenueData.length > 0 ? ((revenueData.filter(r => r.bonusStatus === '達標').length / revenueData.length) * 100).toFixed(1) : '0.0'
            },
            storeBreakdown: Object.values(storeStats).sort((a, b) => b.revenue - a.revenue),
            bonusTypeAnalysis: {
                weekday: {
                    count: bonusTypeStats.weekday.length,
                    revenue: bonusTypeStats.weekday.reduce((sum, r) => sum + parseFloat(r.totalIncome || 0), 0),
                    bonus: bonusTypeStats.weekday.reduce((sum, r) => sum + parseFloat(r.bonusAmount || 0), 0)
                },
                holiday: {
                    count: bonusTypeStats.holiday.length,
                    revenue: bonusTypeStats.holiday.reduce((sum, r) => sum + parseFloat(r.totalIncome || 0), 0),
                    bonus: bonusTypeStats.holiday.reduce((sum, r) => sum + parseFloat(r.bonusAmount || 0), 0)
                }
            }
        };
    }
    
    // 生成遲到統計報告 (系統邏輯.txt line 80-91)
    static async generateAttendanceReport(year, month) {
        const models = await initModels();
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);
        
        const attendanceData = await models.AttendanceRecord.findAll({
            where: {
                clockTime: { [Op.between]: [startDate, endDate] },
                isDeleted: false
            },
            order: [['clockTime', 'ASC']]
        });
        
        // 按員工統計遲到情況
        const employeeStats = {};
        let totalRecords = 0;
        let totalLateRecords = 0;
        let totalLateMinutes = 0;
        
        attendanceData.forEach(record => {
            const employeeId = record.employeeId;
            if (!employeeStats[employeeId]) {
                employeeStats[employeeId] = {
                    employeeId,
                    employeeName: record.employeeName,
                    totalRecords: 0,
                    lateRecords: 0,
                    totalLateMinutes: 0,
                    avgLateMinutes: 0,
                    lateRate: 0,
                    stores: new Set()
                };
            }
            
            employeeStats[employeeId].totalRecords += 1;
            employeeStats[employeeId].stores.add(record.storeName);
            
            if (record.status === '遲到') {
                employeeStats[employeeId].lateRecords += 1;
                employeeStats[employeeId].totalLateMinutes += parseInt(record.lateMinutes || 0);
                totalLateRecords += 1;
                totalLateMinutes += parseInt(record.lateMinutes || 0);
            }
            
            totalRecords += 1;
        });
        
        // 計算統計指標
        Object.values(employeeStats).forEach(emp => {
            emp.avgLateMinutes = emp.lateRecords > 0 ? (emp.totalLateMinutes / emp.lateRecords).toFixed(1) : 0;
            emp.lateRate = emp.totalRecords > 0 ? ((emp.lateRecords / emp.totalRecords) * 100).toFixed(1) : '0.0';
            emp.stores = Array.from(emp.stores);
        });
        
        // 識別問題員工 (遲到超過5次或總時間超過30分鐘)
        const problemEmployees = Object.values(employeeStats).filter(emp => 
            emp.lateRecords >= 5 || emp.totalLateMinutes >= 30
        );
        
        return {
            period: { year, month },
            summary: {
                totalRecords,
                totalLateRecords,
                totalLateMinutes,
                overallLateRate: totalRecords > 0 ? ((totalLateRecords / totalRecords) * 100).toFixed(1) : '0.0',
                avgLateMinutes: totalLateRecords > 0 ? (totalLateMinutes / totalLateRecords).toFixed(1) : 0,
                problemEmployeeCount: problemEmployees.length
            },
            employeeBreakdown: Object.values(employeeStats).sort((a, b) => b.totalLateMinutes - a.totalLateMinutes),
            problemEmployees: problemEmployees.sort((a, b) => b.totalLateMinutes - a.totalLateMinutes),
            recommendations: this.generateAttendanceRecommendations(problemEmployees)
        };
    }
    
    // 生成投票活動報告 (系統邏輯.txt line 204, 207)
    static async generateVotingReport(year, month) {
        const models = await initModels();
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);
        
        // 獲取投票活動
        const campaigns = await models.PromotionCampaign.findAll({
            where: {
                createdAt: { [Op.between]: [startDate, endDate] }
            },
            order: [['createdAt', 'DESC']]
        });
        
        const campaignStats = [];
        let totalCampaigns = 0;
        let completedCampaigns = 0;
        let successfulPromotions = 0;
        let successfulDemotions = 0;
        
        for (const campaign of campaigns) {
            const votes = await models.PromotionVote.findAll({
                where: { 
                    campaignId: campaign.id,
                    isValid: true
                }
            });
            
            const yesVotes = votes.filter(v => v.currentDecision === 'agree').length;
            const noVotes = votes.filter(v => v.currentDecision === 'disagree').length;
            const totalVotes = votes.length;
            
            const stat = {
                campaignId: campaign.id,
                type: campaign.type,
                candidateName: campaign.candidateName,
                currentPosition: campaign.currentPosition,
                targetPosition: campaign.targetPosition,
                status: campaign.status,
                totalVotes,
                yesVotes,
                noVotes,
                yesRate: totalVotes > 0 ? ((yesVotes / totalVotes) * 100).toFixed(1) : '0.0',
                result: campaign.result,
                createdAt: campaign.createdAt,
                endTime: campaign.endTime
            };
            
            campaignStats.push(stat);
            totalCampaigns += 1;
            
            if (campaign.status === 'completed') {
                completedCampaigns += 1;
                if (campaign.result === 'approved') {
                    if (campaign.type === '升職投票') {
                        successfulPromotions += 1;
                    } else if (campaign.type === '降職投票') {
                        successfulDemotions += 1;
                    }
                }
            }
        }
        
        // 按類型統計
        const typeStats = {
            promotion: campaignStats.filter(c => c.type === '升職投票'),
            demotion: campaignStats.filter(c => c.type === '降職投票'),
            newEmployee: campaignStats.filter(c => c.type === '新人轉正')
        };
        
        return {
            period: { year, month },
            summary: {
                totalCampaigns,
                completedCampaigns,
                activeCampaigns: totalCampaigns - completedCampaigns,
                successfulPromotions,
                successfulDemotions,
                overallSuccessRate: completedCampaigns > 0 ? (((successfulPromotions + successfulDemotions) / completedCampaigns) * 100).toFixed(1) : '0.0'
            },
            campaignDetails: campaignStats,
            typeBreakdown: {
                promotion: {
                    count: typeStats.promotion.length,
                    successRate: this.calculateSuccessRate(typeStats.promotion)
                },
                demotion: {
                    count: typeStats.demotion.length,
                    successRate: this.calculateSuccessRate(typeStats.demotion)
                },
                newEmployee: {
                    count: typeStats.newEmployee.length,
                    successRate: this.calculateSuccessRate(typeStats.newEmployee)
                }
            }
        };
    }
    
    // 生成綜合績效報告
    static async generatePerformanceReport(year, month) {
        const models = await initModels();
        
        // 獲取員工列表
        const employees = await models.Employee.findAll({
            where: { status: '在職' },
            order: [['name', 'ASC']]
        });
        
        const performanceData = [];
        
        for (const employee of employees) {
            const employeeId = employee.id;
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59);
            
            // 營收表現
            const revenueRecords = await models.RevenueRecord.findAll({
                where: {
                    employeeId,
                    date: { [Op.between]: [startDate, endDate] },
                    isDeleted: false
                }
            });
            
            // 考勤表現
            const attendanceRecords = await models.AttendanceRecord.findAll({
                where: {
                    employeeId,
                    clockTime: { [Op.between]: [startDate, endDate] },
                    isDeleted: false
                }
            });
            
            // 投票參與度 (使用匿名化指紋)
            const employeeVoteFingerprints = [];
            // 獲取該員工參與的所有活動
            const campaigns = await models.PromotionCampaign.findAll({
                where: {
                    createdAt: { [Op.between]: [startDate, endDate] }
                }
            });
            
            // 檢查每個活動該員工是否參與投票
            let voteParticipation = [];
            for (const campaign of campaigns) {
                const fingerprint = models.PromotionVote.generateVoterFingerprint(employeeId, campaign.id);
                const vote = await models.PromotionVote.findOne({
                    where: {
                        campaignId: campaign.id,
                        voterFingerprint: fingerprint,
                        isValid: true
                    }
                });
                if (vote) {
                    voteParticipation.push(vote);
                }
            }
            
            const performance = {
                employeeId,
                employeeName: employee.name,
                currentPosition: employee.position,
                currentStore: employee.currentStore,
                revenue: {
                    submissionCount: revenueRecords.length,
                    totalRevenue: revenueRecords.reduce((sum, r) => sum + parseFloat(r.totalIncome || 0), 0),
                    totalBonus: revenueRecords.reduce((sum, r) => sum + parseFloat(r.bonusAmount || 0), 0),
                    qualificationRate: revenueRecords.length > 0 ? 
                        ((revenueRecords.filter(r => r.bonusStatus === '達標').length / revenueRecords.length) * 100).toFixed(1) : '0.0'
                },
                attendance: {
                    totalRecords: attendanceRecords.length,
                    lateRecords: attendanceRecords.filter(a => a.status === '遲到').length,
                    totalLateMinutes: attendanceRecords.reduce((sum, a) => sum + parseInt(a.lateMinutes || 0), 0),
                    attendanceRate: attendanceRecords.length > 0 ? 
                        (((attendanceRecords.length - attendanceRecords.filter(a => a.status === '遲到').length) / attendanceRecords.length) * 100).toFixed(1) : '0.0'
                },
                voting: {
                    participationCount: voteParticipation.length,
                    agreeVotes: voteParticipation.filter(v => v.currentDecision === 'agree').length,
                    disagreeVotes: voteParticipation.filter(v => v.currentDecision === 'disagree').length
                },
                overallScore: 0 // 將在後面計算
            };
            
            // 計算綜合評分 (滿分100分)
            let score = 0;
            
            // 營收表現 (40分)
            const revenueScore = Math.min(40, (performance.revenue.submissionCount * 5) + 
                (parseFloat(performance.revenue.qualificationRate) * 0.2));
            score += revenueScore;
            
            // 考勤表現 (40分)
            const attendanceScore = Math.min(40, parseFloat(performance.attendance.attendanceRate) * 0.4);
            score += attendanceScore;
            
            // 投票參與度 (20分)
            const votingScore = Math.min(20, performance.voting.participationCount * 2);
            score += votingScore;
            
            performance.overallScore = Math.round(score);
            performanceData.push(performance);
        }
        
        // 按分數排序
        performanceData.sort((a, b) => b.overallScore - a.overallScore);
        
        return {
            period: { year, month },
            summary: {
                totalEmployees: performanceData.length,
                avgScore: performanceData.length > 0 ? 
                    Math.round(performanceData.reduce((sum, p) => sum + p.overallScore, 0) / performanceData.length) : 0,
                topPerformers: performanceData.filter(p => p.overallScore >= 80).length,
                needImprovement: performanceData.filter(p => p.overallScore < 60).length
            },
            rankings: performanceData,
            topPerformers: performanceData.filter(p => p.overallScore >= 80).slice(0, 5),
            needImprovement: performanceData.filter(p => p.overallScore < 60)
        };
    }
    
    // 輔助方法
    static calculateSuccessRate(campaigns) {
        const completed = campaigns.filter(c => c.status === 'completed');
        if (completed.length === 0) return '0.0';
        
        const successful = completed.filter(c => c.result === 'approved');
        return ((successful.length / completed.length) * 100).toFixed(1);
    }
    
    static generateAttendanceRecommendations(problemEmployees) {
        const recommendations = [];
        
        if (problemEmployees.length === 0) {
            recommendations.push('🎉 所有員工考勤表現良好，無需特別關注');
        } else {
            recommendations.push(`⚠️ ${problemEmployees.length} 名員工需要關注考勤問題`);
            
            const severeCases = problemEmployees.filter(emp => emp.totalLateMinutes >= 60);
            if (severeCases.length > 0) {
                recommendations.push(`🚨 ${severeCases.length} 名員工遲到情況嚴重，建議進行面談`);
            }
            
            const frequentLate = problemEmployees.filter(emp => emp.lateRecords >= 8);
            if (frequentLate.length > 0) {
                recommendations.push(`📋 ${frequentLate.length} 名員工經常遲到，建議檢討工作安排`);
            }
            
            recommendations.push('💡 建議加強考勤管理，設置提醒機制');
        }
        
        return recommendations;
    }
}

// 1. 月度綜合報告 (系統邏輯.txt line 244)
router.get('/monthly/:year/:month', async (req, res) => {
    try {
        const { year, month } = req.params;
        
        if (!year || !month || month < 1 || month > 12) {
            return res.status(400).json({
                success: false,
                message: '請提供有效的年份和月份'
            });
        }
        
        await initModels();
        
        console.log(`📊 生成月度報告: ${year}年${month}月`);
        
        // 並行生成各類報告
        const [revenueReport, attendanceReport, votingReport, performanceReport] = await Promise.all([
            ReportsEngine.generateMonthlyRevenueReport(parseInt(year), parseInt(month)),
            ReportsEngine.generateAttendanceReport(parseInt(year), parseInt(month)),
            ReportsEngine.generateVotingReport(parseInt(year), parseInt(month)),
            ReportsEngine.generatePerformanceReport(parseInt(year), parseInt(month))
        ]);
        
        const monthlyReport = {
            period: { year: parseInt(year), month: parseInt(month) },
            generatedAt: new Date().toISOString(),
            revenue: revenueReport,
            attendance: attendanceReport,
            voting: votingReport,
            performance: performanceReport,
            summary: {
                totalRevenue: revenueReport.summary.totalRevenue,
                totalBonus: revenueReport.summary.totalBonus,
                attendanceRate: (100 - parseFloat(attendanceReport.summary.overallLateRate)).toFixed(1),
                votingActivity: votingReport.summary.totalCampaigns,
                avgPerformanceScore: performanceReport.summary.avgScore
            }
        };
        
        logger.info('月度報告生成完成', {
            year: parseInt(year),
            month: parseInt(month),
            totalRevenue: revenueReport.summary.totalRevenue,
            attendanceRate: monthlyReport.summary.attendanceRate,
            votingCampaigns: votingReport.summary.totalCampaigns
        });
        
        res.json({
            success: true,
            data: monthlyReport
        });
        
    } catch (error) {
        logger.error('月度報告生成失敗:', error);
        res.status(500).json({
            success: false,
            message: '報告生成失敗',
            error: error.message
        });
    }
});

// 2. 營收報告 (獨立)
router.get('/revenue/:year/:month', async (req, res) => {
    try {
        const { year, month } = req.params;
        
        await initModels();
        const report = await ReportsEngine.generateMonthlyRevenueReport(parseInt(year), parseInt(month));
        
        res.json({
            success: true,
            data: report
        });
        
    } catch (error) {
        logger.error('營收報告生成失敗:', error);
        res.status(500).json({
            success: false,
            message: '營收報告生成失敗'
        });
    }
});

// 3. 考勤報告 (獨立)
router.get('/attendance/:year/:month', async (req, res) => {
    try {
        const { year, month } = req.params;
        
        await initModels();
        const report = await ReportsEngine.generateAttendanceReport(parseInt(year), parseInt(month));
        
        res.json({
            success: true,
            data: report
        });
        
    } catch (error) {
        logger.error('考勤報告生成失敗:', error);
        res.status(500).json({
            success: false,
            message: '考勤報告生成失敗'
        });
    }
});

// 4. 投票活動報告 (獨立)
router.get('/voting/:year/:month', async (req, res) => {
    try {
        const { year, month } = req.params;
        
        await initModels();
        const report = await ReportsEngine.generateVotingReport(parseInt(year), parseInt(month));
        
        res.json({
            success: true,
            data: report
        });
        
    } catch (error) {
        logger.error('投票報告生成失敗:', error);
        res.status(500).json({
            success: false,
            message: '投票報告生成失敗'
        });
    }
});

// 5. 績效報告 (獨立)
router.get('/performance/:year/:month', async (req, res) => {
    try {
        const { year, month } = req.params;
        
        await initModels();
        const report = await ReportsEngine.generatePerformanceReport(parseInt(year), parseInt(month));
        
        res.json({
            success: true,
            data: report
        });
        
    } catch (error) {
        logger.error('績效報告生成失敗:', error);
        res.status(500).json({
            success: false,
            message: '績效報告生成失敗'
        });
    }
});

// 6. 快速日報表
router.get('/daily', async (req, res) => {
    try {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        const day = today.getDate();
        
        await initModels();
        const models = await getModels();
        
        const todayStr = today.toISOString().split('T')[0];
        
        // 今日營收
        const todayRevenue = await models.RevenueRecord.findAll({
            where: {
                date: todayStr,
                isDeleted: false
            }
        });
        
        // 今日考勤
        const todayAttendance = await models.AttendanceRecord.findAll({
            where: {
                clockTime: {
                    [Op.between]: [
                        new Date(year, month - 1, day, 0, 0, 0),
                        new Date(year, month - 1, day, 23, 59, 59)
                    ]
                },
                isDeleted: false
            }
        });
        
        const dailyReport = {
            date: todayStr,
            revenue: {
                recordCount: todayRevenue.length,
                totalRevenue: todayRevenue.reduce((sum, r) => sum + parseFloat(r.totalIncome || 0), 0),
                totalBonus: todayRevenue.reduce((sum, r) => sum + parseFloat(r.bonusAmount || 0), 0),
                qualifiedRecords: todayRevenue.filter(r => r.bonusStatus === '達標').length
            },
            attendance: {
                totalRecords: todayAttendance.length,
                lateRecords: todayAttendance.filter(a => a.status === '遲到').length,
                normalRecords: todayAttendance.filter(a => a.status === '正常').length
            }
        };
        
        res.json({
            success: true,
            data: dailyReport
        });
        
    } catch (error) {
        logger.error('日報表生成失敗:', error);
        res.status(500).json({
            success: false,
            message: '日報表生成失敗'
        });
    }
});

// 7. 報表匯出 (JSON格式)
router.get('/export/:type/:year/:month', async (req, res) => {
    try {
        const { type, year, month } = req.params;
        
        let report;
        switch (type) {
            case 'monthly':
                report = await ReportsEngine.generateMonthlyRevenueReport(parseInt(year), parseInt(month));
                break;
            case 'attendance':
                report = await ReportsEngine.generateAttendanceReport(parseInt(year), parseInt(month));
                break;
            case 'voting':
                report = await ReportsEngine.generateVotingReport(parseInt(year), parseInt(month));
                break;
            case 'performance':
                report = await ReportsEngine.generatePerformanceReport(parseInt(year), parseInt(month));
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: '不支援的報告類型'
                });
        }
        
        const filename = `${type}-report-${year}-${month}.json`;
        
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/json');
        
        res.json({
            success: true,
            filename: filename,
            exportedAt: new Date().toISOString(),
            data: report
        });
        
    } catch (error) {
        logger.error('報表匯出失敗:', error);
        res.status(500).json({
            success: false,
            message: '報表匯出失敗'
        });
    }
});

// 相容性端點
router.get('/', async (req, res) => {
    try {
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        
        res.json({
            success: true,
            message: '報表系統API運行正常',
            availableReports: [
                `GET /api/reports/monthly/${year}/${month} - 月度綜合報告`,
                `GET /api/reports/revenue/${year}/${month} - 營收報告`,
                `GET /api/reports/attendance/${year}/${month} - 考勤報告`, 
                `GET /api/reports/voting/${year}/${month} - 投票報告`,
                `GET /api/reports/performance/${year}/${month} - 績效報告`,
                `GET /api/reports/daily - 今日報表`,
                `GET /api/reports/export/{type}/${year}/${month} - 匯出報表`
            ],
            currentPeriod: { year, month }
        });
        
    } catch (error) {
        logger.error('報表系統狀態檢查失敗:', error);
        res.json({
            success: true,
            message: '報表系統API端點正常運作',
            status: 'healthy'
        });
    }
});

module.exports = router;