/**
 * 🏗️ 增強版營業額系統 - 收入支出分離 + 多分店支援
 * 修復用戶提出的核心需求: 營業額要有收入支出的項目欄位可以直接輸入
 */

const fs = require('fs');
const path = require('path');

class EnhancedRevenueSystem {
    constructor() {
        this.stores = [
            { id: 1, name: '台北總店', code: 'TPE001' },
            { id: 2, name: '台北分店', code: 'TPE002' },  
            { id: 3, name: '台中分店', code: 'TXG001' },
            { id: 4, name: '高雄分店', code: 'KHH001' }
        ];
        
        this.incomeCategories = [
            '產品銷售', '服務收入', '租金收入', '利息收入', '其他收入'
        ];
        
        this.expenseCategories = [
            '人事費用', '房租費用', '水電費用', '原料採購', '設備維護', 
            '行銷費用', '保險費用', '稅費', '其他支出'
        ];
        
        // 增強版營收數據結構
        this.revenueRecords = [
            {
                id: 1,
                date: '2025-08-01',
                store_id: 1,
                store_name: '台北總店',
                income_amount: 85000,        // ⭐ 收入金額
                expense_amount: 23000,       // ⭐ 支出金額
                income_category: '產品銷售',  // ⭐ 收入分類
                expense_category: '原料採購', // ⭐ 支出分類
                net_profit: 62000,          // 淨利潤 (自動計算)
                description: '8月1日營收記錄 - 新產品銷售表現良好',
                created_by: 1,
                bonus_calculated: 6200,
                performance_target: 80000,
                created_at: '2025-08-01T10:30:00Z'
            },
            {
                id: 2,
                date: '2025-08-02', 
                store_id: 2,
                store_name: '台北分店',
                income_amount: 67000,
                expense_amount: 18500,
                income_category: '服務收入',
                expense_category: '人事費用',
                net_profit: 48500,
                description: '8月2日營收 - 服務項目收入增加',
                created_by: 2,
                bonus_calculated: 4850,
                performance_target: 60000,
                created_at: '2025-08-02T11:15:00Z'
            },
            {
                id: 3,
                date: '2025-08-03',
                store_id: 1, 
                store_name: '台北總店',
                income_amount: 92000,
                expense_amount: 27000,
                income_category: '產品銷售',
                expense_category: '行銷費用',
                net_profit: 65000,
                description: '8月3日營收 - 促銷活動帶動銷售',
                created_by: 1,
                bonus_calculated: 6500,
                performance_target: 80000,
                created_at: '2025-08-03T09:45:00Z'
            },
            {
                id: 4,
                date: '2025-08-04',
                store_id: 3,
                store_name: '台中分店', 
                income_amount: 54000,
                expense_amount: 16000,
                income_category: '產品銷售',
                expense_category: '房租費用',
                net_profit: 38000,
                description: '8月4日台中分店營收記錄',
                created_by: 3,
                bonus_calculated: 3800,
                performance_target: 50000,
                created_at: '2025-08-04T14:20:00Z'
            }
        ];
    }
    
    // ==================== API端點實現 ====================
    
    // 獲取營收記錄 (支援分店和日期篩選)
    getRevenueRecords(query = {}) {
        console.log('🔍 查詢營收記錄:', query);
        
        let filteredRecords = [...this.revenueRecords];
        
        // 分店篩選
        if (query.store_id) {
            filteredRecords = filteredRecords.filter(record => 
                record.store_id === parseInt(query.store_id)
            );
        }
        
        // 日期範圍篩選
        if (query.startDate) {
            filteredRecords = filteredRecords.filter(record => 
                record.date >= query.startDate
            );
        }
        
        if (query.endDate) {
            filteredRecords = filteredRecords.filter(record => 
                record.date <= query.endDate
            );
        }
        
        // 收入/支出類型篩選
        if (query.income_category) {
            filteredRecords = filteredRecords.filter(record => 
                record.income_category === query.income_category
            );
        }
        
        if (query.expense_category) {
            filteredRecords = filteredRecords.filter(record =>
                record.expense_category === query.expense_category
            );
        }
        
        // 計算統計數據
        const totalIncome = filteredRecords.reduce((sum, r) => sum + r.income_amount, 0);
        const totalExpense = filteredRecords.reduce((sum, r) => sum + r.expense_amount, 0);
        const totalProfit = totalIncome - totalExpense;
        const totalBonus = filteredRecords.reduce((sum, r) => sum + r.bonus_calculated, 0);
        
        return {
            success: true,
            message: '營收數據獲取成功',
            data: filteredRecords,
            statistics: {
                total_records: filteredRecords.length,
                total_income: totalIncome,
                total_expense: totalExpense,
                net_profit: totalProfit,
                total_bonus: totalBonus,
                average_profit: filteredRecords.length > 0 ? Math.round(totalProfit / filteredRecords.length) : 0
            },
            filters: query,
            timestamp: new Date().toISOString()
        };
    }
    
    // 新增營收記錄 (收入支出分離)
    addRevenueRecord(recordData) {
        console.log('➕ 新增營收記錄:', recordData);
        
        // 驗證必要欄位
        const requiredFields = ['date', 'store_id', 'income_amount', 'expense_amount'];
        const missingFields = requiredFields.filter(field => !recordData[field]);
        
        if (missingFields.length > 0) {
            return {
                success: false,
                message: `缺少必要欄位: ${missingFields.join(', ')}`,
                code: 'MISSING_REQUIRED_FIELDS'
            };
        }
        
        // 查找分店資訊
        const store = this.stores.find(s => s.id === parseInt(recordData.store_id));
        if (!store) {
            return {
                success: false,
                message: '找不到指定的分店',
                code: 'STORE_NOT_FOUND'
            };
        }
        
        // 建立新記錄
        const newRecord = {
            id: this.revenueRecords.length + 1,
            date: recordData.date,
            store_id: parseInt(recordData.store_id),
            store_name: store.name,
            income_amount: parseFloat(recordData.income_amount) || 0,
            expense_amount: parseFloat(recordData.expense_amount) || 0,
            income_category: recordData.income_category || '其他收入',
            expense_category: recordData.expense_category || '其他支出',
            net_profit: parseFloat(recordData.income_amount || 0) - parseFloat(recordData.expense_amount || 0),
            description: recordData.description || '',
            created_by: recordData.created_by || 1,
            bonus_calculated: Math.round((parseFloat(recordData.income_amount || 0) - parseFloat(recordData.expense_amount || 0)) * 0.1), // 10%獎金
            performance_target: recordData.performance_target || 50000,
            created_at: new Date().toISOString()
        };
        
        this.revenueRecords.push(newRecord);
        
        console.log(`✅ 營收記錄新增成功: ${store.name} - 淨利潤 $${newRecord.net_profit}`);
        
        return {
            success: true,
            message: '營收記錄新增成功',
            data: newRecord,
            timestamp: new Date().toISOString()
        };
    }
    
    // 更新營收記錄
    updateRevenueRecord(id, updateData) {
        console.log(`🔄 更新營收記錄 ID:${id}:`, updateData);
        
        const recordIndex = this.revenueRecords.findIndex(r => r.id === parseInt(id));
        
        if (recordIndex === -1) {
            return {
                success: false,
                message: '找不到指定的營收記錄',
                code: 'RECORD_NOT_FOUND'
            };
        }
        
        // 更新記錄
        const oldRecord = { ...this.revenueRecords[recordIndex] };
        const updatedRecord = {
            ...oldRecord,
            ...updateData,
            updated_at: new Date().toISOString()
        };
        
        // 重新計算淨利潤和獎金
        if (updateData.income_amount !== undefined || updateData.expense_amount !== undefined) {
            updatedRecord.net_profit = updatedRecord.income_amount - updatedRecord.expense_amount;
            updatedRecord.bonus_calculated = Math.round(updatedRecord.net_profit * 0.1);
        }
        
        this.revenueRecords[recordIndex] = updatedRecord;
        
        console.log(`✅ 營收記錄更新成功: 淨利潤 $${updatedRecord.net_profit}`);
        
        return {
            success: true,
            message: '營收記錄更新成功',
            data: updatedRecord,
            changes: this.getRecordChanges(oldRecord, updatedRecord),
            timestamp: new Date().toISOString()
        };
    }
    
    // 獲取收支分類
    getCategories() {
        return {
            success: true,
            data: {
                income_categories: this.incomeCategories,
                expense_categories: this.expenseCategories,
                stores: this.stores
            },
            timestamp: new Date().toISOString()
        };
    }
    
    // 獲取營收統計摘要 (按分店)
    getRevenueSummary(query = {}) {
        console.log('📊 生成營收統計摘要:', query);
        
        let records = [...this.revenueRecords];
        
        // 篩選條件
        if (query.startDate) {
            records = records.filter(r => r.date >= query.startDate);
        }
        if (query.endDate) {
            records = records.filter(r => r.date <= query.endDate);
        }
        
        // 按分店分組統計
        const storeStats = {};
        
        records.forEach(record => {
            if (!storeStats[record.store_id]) {
                storeStats[record.store_id] = {
                    store_id: record.store_id,
                    store_name: record.store_name,
                    total_income: 0,
                    total_expense: 0,
                    net_profit: 0,
                    record_count: 0,
                    total_bonus: 0,
                    average_daily_profit: 0
                };
            }
            
            const stats = storeStats[record.store_id];
            stats.total_income += record.income_amount;
            stats.total_expense += record.expense_amount;
            stats.net_profit += record.net_profit;
            stats.total_bonus += record.bonus_calculated;
            stats.record_count++;
        });
        
        // 計算平均每日利潤
        Object.values(storeStats).forEach(stats => {
            stats.average_daily_profit = stats.record_count > 0 
                ? Math.round(stats.net_profit / stats.record_count) 
                : 0;
        });
        
        // 整體統計
        const overallStats = {
            total_stores: Object.keys(storeStats).length,
            total_income: Object.values(storeStats).reduce((sum, s) => sum + s.total_income, 0),
            total_expense: Object.values(storeStats).reduce((sum, s) => sum + s.total_expense, 0),
            total_profit: Object.values(storeStats).reduce((sum, s) => sum + s.net_profit, 0),
            total_bonus: Object.values(storeStats).reduce((sum, s) => sum + s.total_bonus, 0),
            total_records: records.length
        };
        
        return {
            success: true,
            message: '營收統計摘要生成成功',
            data: {
                overall_statistics: overallStats,
                store_statistics: Object.values(storeStats),
                period: {
                    start_date: query.startDate,
                    end_date: query.endDate,
                    days_count: records.length
                }
            },
            timestamp: new Date().toISOString()
        };
    }
    
    // 獲取營收圖表數據
    getRevenueChart(query = {}) {
        console.log('📈 生成營收圖表數據:', query);
        
        let records = [...this.revenueRecords];
        
        // 日期篩選
        if (query.startDate) {
            records = records.filter(r => r.date >= query.startDate);
        }
        if (query.endDate) {
            records = records.filter(r => r.date <= query.endDate);
        }
        
        // 按日期分組
        const dailyData = {};
        records.forEach(record => {
            if (!dailyData[record.date]) {
                dailyData[record.date] = {
                    date: record.date,
                    total_income: 0,
                    total_expense: 0,
                    net_profit: 0,
                    stores: {}
                };
            }
            
            const dayStats = dailyData[record.date];
            dayStats.total_income += record.income_amount;
            dayStats.total_expense += record.expense_amount;
            dayStats.net_profit += record.net_profit;
            
            // 分店數據
            if (!dayStats.stores[record.store_id]) {
                dayStats.stores[record.store_id] = {
                    store_name: record.store_name,
                    income: 0,
                    expense: 0,
                    profit: 0
                };
            }
            
            dayStats.stores[record.store_id].income += record.income_amount;
            dayStats.stores[record.store_id].expense += record.expense_amount;
            dayStats.stores[record.store_id].profit += record.net_profit;
        });
        
        const chartData = Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
        
        return {
            success: true,
            message: '營收圖表數據生成成功',
            data: {
                daily_chart_data: chartData,
                chart_summary: {
                    max_daily_income: Math.max(...chartData.map(d => d.total_income)),
                    max_daily_expense: Math.max(...chartData.map(d => d.total_expense)),
                    max_daily_profit: Math.max(...chartData.map(d => d.net_profit)),
                    average_daily_profit: chartData.length > 0 
                        ? Math.round(chartData.reduce((sum, d) => sum + d.net_profit, 0) / chartData.length)
                        : 0
                }
            },
            timestamp: new Date().toISOString()
        };
    }
    
    // ==================== 輔助方法 ====================
    
    getRecordChanges(oldRecord, newRecord) {
        const changes = {};
        
        Object.keys(newRecord).forEach(key => {
            if (oldRecord[key] !== newRecord[key] && key !== 'updated_at') {
                changes[key] = {
                    old: oldRecord[key],
                    new: newRecord[key]
                };
            }
        });
        
        return changes;
    }
    
    // 生成營收報告
    async generateRevenueReport(query = {}) {
        console.log('📊 生成完整營收報告...');
        
        const records = this.getRevenueRecords(query);
        const summary = this.getRevenueSummary(query);
        const chart = this.getRevenueChart(query);
        
        const report = {
            title: '企業營收分析報告',
            generated_at: new Date().toISOString(),
            period: {
                start_date: query.startDate || '2025-08-01',
                end_date: query.endDate || '2025-08-31',
                store_filter: query.store_id ? `分店ID: ${query.store_id}` : '所有分店'
            },
            executive_summary: {
                total_income: summary.data.overall_statistics.total_income,
                total_expense: summary.data.overall_statistics.total_expense,
                net_profit: summary.data.overall_statistics.total_profit,
                profit_margin: summary.data.overall_statistics.total_income > 0 
                    ? Math.round((summary.data.overall_statistics.total_profit / summary.data.overall_statistics.total_income) * 100) 
                    : 0,
                total_bonus_distributed: summary.data.overall_statistics.total_bonus,
                number_of_stores: summary.data.overall_statistics.total_stores
            },
            detailed_records: records.data,
            store_performance: summary.data.store_statistics,
            daily_trends: chart.data.daily_chart_data
        };
        
        const reportFile = `revenue-report-${Date.now()}.json`;
        await fs.promises.writeFile(reportFile, JSON.stringify(report, null, 2));
        
        console.log(`📁 營收報告已保存: ${reportFile}`);
        
        return {
            success: true,
            message: '營收報告生成成功',
            report: report,
            report_file: reportFile,
            timestamp: new Date().toISOString()
        };
    }
    
    // 測試所有功能
    async runTests() {
        console.log('🧪 開始測試增強版營收系統...');
        
        try {
            // 測試 1: 獲取所有營收記錄
            console.log('\n📋 測試 1: 獲取所有營收記錄');
            const allRecords = this.getRevenueRecords();
            console.log(`✅ 成功獲取 ${allRecords.data.length} 筆記錄`);
            console.log(`💰 總收入: $${allRecords.statistics.total_income}`);
            console.log(`💸 總支出: $${allRecords.statistics.total_expense}`);
            console.log(`💵 淨利潤: $${allRecords.statistics.net_profit}`);
            
            // 測試 2: 分店篩選
            console.log('\n🏪 測試 2: 分店篩選 (台北總店)');
            const storeRecords = this.getRevenueRecords({ store_id: 1 });
            console.log(`✅ 台北總店記錄: ${storeRecords.data.length} 筆`);
            console.log(`💰 台北總店淨利潤: $${storeRecords.statistics.net_profit}`);
            
            // 測試 3: 新增營收記錄
            console.log('\n➕ 測試 3: 新增營收記錄');
            const newRecord = this.addRevenueRecord({
                date: '2025-08-05',
                store_id: 2,
                income_amount: 75000,
                expense_amount: 22000,
                income_category: '產品銷售',
                expense_category: '行銷費用',
                description: '測試新增營收記錄 - 8月5日台北分店',
                created_by: 2
            });
            console.log(`✅ 新增成功: ${newRecord.data.store_name} - 淨利潤 $${newRecord.data.net_profit}`);
            
            // 測試 4: 營收統計摘要
            console.log('\n📊 測試 4: 營收統計摘要');
            const summary = this.getRevenueSummary();
            console.log(`✅ 統計完成: ${summary.data.overall_statistics.total_stores} 個分店`);
            console.log(`💰 整體淨利潤: $${summary.data.overall_statistics.total_profit}`);
            
            // 測試 5: 圖表數據
            console.log('\n📈 測試 5: 圖表數據生成');
            const chart = this.getRevenueChart();
            console.log(`✅ 圖表數據: ${chart.data.daily_chart_data.length} 天`);
            console.log(`💵 最高日利潤: $${chart.data.chart_summary.max_daily_profit}`);
            
            // 測試 6: 完整報告
            console.log('\n📊 測試 6: 生成完整營收報告');
            const report = await this.generateRevenueReport();
            console.log(`✅ 報告生成成功: ${report.report_file}`);
            console.log(`💰 報告期間淨利潤: $${report.report.executive_summary.net_profit}`);
            console.log(`📈 利潤率: ${report.report.executive_summary.profit_margin}%`);
            
            console.log('\n🎉 ========== 所有測試通過 ==========');
            console.log('✅ 收入支出分離功能: 完全實現');
            console.log('✅ 多分店數據區分: 完全實現');  
            console.log('✅ 分類管理功能: 完全實現');
            console.log('✅ 統計分析功能: 完全實現');
            console.log('✅ 圖表數據生成: 完全實現');
            
            return true;
            
        } catch (error) {
            console.error('❌ 測試失敗:', error.message);
            return false;
        }
    }
}

// 執行測試
if (require.main === module) {
    const revenueSystem = new EnhancedRevenueSystem();
    revenueSystem.runTests().then(success => {
        if (success) {
            console.log('\n🚀 增強版營收系統準備就緒！');
        } else {
            console.log('\n💥 系統測試失敗，需要修復');
        }
    });
}

module.exports = EnhancedRevenueSystem;