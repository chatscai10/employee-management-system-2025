/**
 * ================================================
 * 報表系統前端JavaScript - Reports Management
 * ================================================
 * 基於系統邏輯.txt規格 - 完整報表功能實現
 */

class ReportsManager {
    constructor() {
        this.baseUrl = '/api/reports';
        this.currentReport = null;
        this.charts = {};
        this.init();
    }

    init() {
        console.log('📊 初始化報表管理系統...');
        this.loadInitialData();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // 綁定報表按鈕事件
        const dailyBtn = document.querySelector('[onclick="generateReport(\'daily\')"]');
        const weeklyBtn = document.querySelector('[onclick="generateReport(\'weekly\')"]');
        const monthlyBtn = document.querySelector('[onclick="generateReport(\'monthly\')"]');
        const exportBtn = document.querySelector('[onclick="exportReport()"]');

        if (dailyBtn) dailyBtn.onclick = () => this.generateReport('daily');
        if (weeklyBtn) weeklyBtn.onclick = () => this.generateReport('weekly');
        if (monthlyBtn) monthlyBtn.onclick = () => this.generateReport('monthly');
        if (exportBtn) exportBtn.onclick = () => this.exportCurrentReport();

        // 綁定統計按鈕
        const statsBtn = document.querySelector('[onclick="showStats()"]');
        if (statsBtn) statsBtn.onclick = () => this.showAdvancedStats();
    }

    async loadInitialData() {
        try {
            console.log('📈 載入初始報表數據...');
            await this.generateReport('daily');
        } catch (error) {
            console.error('❌ 載入初始數據失敗:', error);
            this.showError('載入報表數據失敗，請稍後再試');
        }
    }

    async generateReport(type) {
        const reportContent = document.getElementById('reportContent');
        const reportTitle = document.getElementById('reportTitle');
        const reportData = document.getElementById('reportData');

        if (!reportContent || !reportTitle || !reportData) {
            console.error('❌ 找不到報表容器元素');
            return;
        }

        try {
            reportData.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div><p>載入中...</p></div>';
            reportContent.style.display = 'block';

            let reportResult;
            const currentDate = new Date();
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1;

            switch (type) {
                case 'daily':
                    reportTitle.textContent = '📊 今日報表';
                    reportResult = await this.fetchDailyReport();
                    this.renderDailyReport(reportData, reportResult);
                    break;
                case 'weekly':
                    reportTitle.textContent = '📈 本週報表';
                    // 週報表使用月度數據的週統計
                    reportResult = await this.fetchMonthlyReport(year, month);
                    this.renderWeeklyReport(reportData, reportResult);
                    break;
                case 'monthly':
                    reportTitle.textContent = '📉 本月報表';
                    reportResult = await this.fetchMonthlyReport(year, month);
                    this.renderMonthlyReport(reportData, reportResult);
                    break;
                default:
                    throw new Error('不支援的報表類型');
            }

            this.currentReport = { type, data: reportResult };
            console.log('✅ 報表生成完成:', type);

        } catch (error) {
            console.error('❌ 報表生成失敗:', error);
            reportData.innerHTML = `
                <div class="alert alert-danger">
                    <h6>❌ 報表載入失敗</h6>
                    <p>${error.message}</p>
                    <button class="btn btn-sm btn-outline-danger" onclick="window.reportsManager.generateReport('${type}')">
                        🔄 重新載入
                    </button>
                </div>
            `;
        }
    }

    async fetchDailyReport() {
        const response = await fetch(`${this.baseUrl}/daily`);
        if (!response.ok) {
            throw new Error(`API錯誤: ${response.status}`);
        }
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message || '載入日報表失敗');
        }
        return result.data;
    }

    async fetchMonthlyReport(year, month) {
        const response = await fetch(`${this.baseUrl}/monthly/${year}/${month}`);
        if (!response.ok) {
            throw new Error(`API錯誤: ${response.status}`);
        }
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message || '載入月報表失敗');
        }
        return result.data;
    }

    renderDailyReport(container, data) {
        const todayStr = new Date().toLocaleDateString('zh-TW');
        
        container.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <div class="alert alert-info">
                        <h6>📅 ${todayStr} 今日營運摘要</h6>
                    </div>
                </div>
            </div>
            
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card bg-primary text-white">
                        <div class="card-body text-center">
                            <h4>💰 ${data.revenue.totalRevenue.toLocaleString()}</h4>
                            <p class="mb-0">今日營收 (NT$)</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-success text-white">
                        <div class="card-body text-center">
                            <h4>🏆 ${data.revenue.totalBonus.toLocaleString()}</h4>
                            <p class="mb-0">今日獎金 (NT$)</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-info text-white">
                        <div class="card-body text-center">
                            <h4>📊 ${data.revenue.recordCount}</h4>
                            <p class="mb-0">營收記錄</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-warning text-white">
                        <div class="card-body text-center">
                            <h4>👥 ${data.attendance.totalRecords}</h4>
                            <p class="mb-0">打卡記錄</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h6>📈 營收表現</h6>
                        </div>
                        <div class="card-body">
                            <ul class="list-unstyled">
                                <li>💰 總營收: NT$ ${data.revenue.totalRevenue.toLocaleString()}</li>
                                <li>🏆 總獎金: NT$ ${data.revenue.totalBonus.toLocaleString()}</li>
                                <li>✅ 達標記錄: ${data.revenue.qualifiedRecords} / ${data.revenue.recordCount}</li>
                                <li>📊 達標率: ${data.revenue.recordCount > 0 ? Math.round(data.revenue.qualifiedRecords / data.revenue.recordCount * 100) : 0}%</li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h6>👥 考勤表現</h6>
                        </div>
                        <div class="card-body">
                            <ul class="list-unstyled">
                                <li>📋 總打卡: ${data.attendance.totalRecords} 次</li>
                                <li>✅ 正常打卡: ${data.attendance.normalRecords} 次</li>
                                <li>⏰ 遲到打卡: ${data.attendance.lateRecords} 次</li>
                                <li>📊 準時率: ${data.attendance.totalRecords > 0 ? Math.round(data.attendance.normalRecords / data.attendance.totalRecords * 100) : 100}%</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="mt-3">
                <small class="text-muted">
                    🕐 最後更新: ${new Date().toLocaleString('zh-TW')} | 
                    📊 數據來源: 企業員工管理系統
                </small>
            </div>
        `;
    }

    renderWeeklyReport(container, data) {
        // 使用月度數據生成週統計
        const weekRevenue = Math.round(data.revenue.summary.totalRevenue / 4);
        const weekBonus = Math.round(data.revenue.summary.totalBonus / 4);
        
        container.innerHTML = `
            <div class="alert alert-success">
                <h6>📈 本週營運分析 (基於月度數據估算)</h6>
            </div>
            
            <div class="row mb-4">
                <div class="col-md-4">
                    <div class="card bg-primary text-white">
                        <div class="card-body text-center">
                            <h4>💰 ${weekRevenue.toLocaleString()}</h4>
                            <p class="mb-0">週營收 (NT$)</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card bg-success text-white">
                        <div class="card-body text-center">
                            <h4>🏆 ${weekBonus.toLocaleString()}</h4>
                            <p class="mb-0">週獎金 (NT$)</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card bg-info text-white">
                        <div class="card-body text-center">
                            <h4>📊 ${data.revenue.summary.qualificationRate}%</h4>
                            <p class="mb-0">達標率</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h6>🏪 分店週表現 (Top 5)</h6>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>分店</th>
                                    <th>估算週營收</th>
                                    <th>估算週獎金</th>
                                    <th>達標率</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.revenue.storeBreakdown.slice(0, 5).map(store => `
                                    <tr>
                                        <td>${store.storeName}</td>
                                        <td>NT$ ${Math.round(store.revenue / 4).toLocaleString()}</td>
                                        <td>NT$ ${Math.round(store.bonus / 4).toLocaleString()}</td>
                                        <td>${store.qualificationRate}%</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    renderMonthlyReport(container, data) {
        container.innerHTML = `
            <div class="alert alert-primary">
                <h6>📉 ${data.period.year}年${data.period.month}月 完整營運報告</h6>
                <p class="mb-0">綜合營收、考勤、投票、績效四大面向分析</p>
            </div>
            
            <!-- 摘要卡片 -->
            <div class="row mb-4">
                <div class="col-md-2">
                    <div class="card bg-primary text-white">
                        <div class="card-body text-center p-2">
                            <h5>💰 ${data.summary.totalRevenue.toLocaleString()}</h5>
                            <small>總營收 (NT$)</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-2">
                    <div class="card bg-success text-white">
                        <div class="card-body text-center p-2">
                            <h5>🏆 ${data.summary.totalBonus.toLocaleString()}</h5>
                            <small>總獎金 (NT$)</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-2">
                    <div class="card bg-info text-white">
                        <div class="card-body text-center p-2">
                            <h5>📊 ${data.summary.attendanceRate}%</h5>
                            <small>出勤率</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-2">
                    <div class="card bg-warning text-white">
                        <div class="card-body text-center p-2">
                            <h5>🗳️ ${data.summary.votingActivity}</h5>
                            <small>投票活動</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-2">
                    <div class="card bg-secondary text-white">
                        <div class="card-body text-center p-2">
                            <h5>⭐ ${data.summary.avgPerformanceScore}</h5>
                            <small>平均績效</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-2">
                    <div class="card bg-dark text-white">
                        <div class="card-body text-center p-2">
                            <h5>👥 ${data.performance.summary.totalEmployees}</h5>
                            <small>在職員工</small>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 詳細報告頁籤 -->
            <ul class="nav nav-tabs" id="reportTabs" role="tablist">
                <li class="nav-item" role="presentation">
                    <button class="nav-link active" id="revenue-tab" data-bs-toggle="tab" data-bs-target="#revenue" type="button">
                        💰 營收分析
                    </button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="attendance-tab" data-bs-toggle="tab" data-bs-target="#attendance" type="button">
                        👥 考勤分析
                    </button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="voting-tab" data-bs-toggle="tab" data-bs-target="#voting" type="button">
                        🗳️ 投票分析
                    </button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="performance-tab" data-bs-toggle="tab" data-bs-target="#performance" type="button">
                        ⭐ 績效排名
                    </button>
                </li>
            </ul>
            
            <div class="tab-content" id="reportTabContent">
                <!-- 營收分析 -->
                <div class="tab-pane fade show active" id="revenue" role="tabpanel">
                    <div class="card">
                        <div class="card-body">
                            <h6>🏪 分店營收排行</h6>
                            <div class="table-responsive">
                                <table class="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>排名</th>
                                            <th>分店名稱</th>
                                            <th>營收</th>
                                            <th>獎金</th>
                                            <th>記錄數</th>
                                            <th>達標率</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${data.revenue.storeBreakdown.map((store, index) => `
                                            <tr>
                                                <td>${index + 1}</td>
                                                <td>${store.storeName}</td>
                                                <td>NT$ ${store.revenue.toLocaleString()}</td>
                                                <td>NT$ ${store.bonus.toLocaleString()}</td>
                                                <td>${store.recordCount}</td>
                                                <td>${store.qualificationRate}%</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                            
                            <div class="row mt-3">
                                <div class="col-md-6">
                                    <h6>📊 獎金類別分析</h6>
                                    <ul class="list-unstyled">
                                        <li>🌅 平日獎金: ${data.revenue.bonusTypeAnalysis.weekday.count} 記錄, NT$ ${Math.round(data.revenue.bonusTypeAnalysis.weekday.bonus).toLocaleString()}</li>
                                        <li>🌴 假日獎金: ${data.revenue.bonusTypeAnalysis.holiday.count} 記錄, NT$ ${Math.round(data.revenue.bonusTypeAnalysis.holiday.bonus).toLocaleString()}</li>
                                    </ul>
                                </div>
                                <div class="col-md-6">
                                    <h6>📈 營收指標</h6>
                                    <ul class="list-unstyled">
                                        <li>📊 平均日營收: NT$ ${data.revenue.summary.avgDailyRevenue.toLocaleString()}</li>
                                        <li>🏆 總獎金率: ${data.revenue.summary.totalBonus > 0 ? Math.round(data.revenue.summary.totalBonus / data.revenue.summary.totalRevenue * 100) : 0}%</li>
                                        <li>✅ 整體達標率: ${data.revenue.summary.qualificationRate}%</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 考勤分析 -->
                <div class="tab-pane fade" id="attendance" role="tabpanel">
                    <div class="card">
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-8">
                                    <h6>⚠️ 考勤問題員工</h6>
                                    ${data.attendance.problemEmployees.length > 0 ? `
                                        <div class="table-responsive">
                                            <table class="table table-striped">
                                                <thead>
                                                    <tr>
                                                        <th>員工姓名</th>
                                                        <th>遲到次數</th>
                                                        <th>總遲到分鐘</th>
                                                        <th>遲到率</th>
                                                        <th>平均遲到時間</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    ${data.attendance.problemEmployees.map(emp => `
                                                        <tr>
                                                            <td>${emp.employeeName}</td>
                                                            <td>${emp.lateRecords}</td>
                                                            <td>${emp.totalLateMinutes} 分鐘</td>
                                                            <td>${emp.lateRate}%</td>
                                                            <td>${emp.avgLateMinutes} 分鐘</td>
                                                        </tr>
                                                    `).join('')}
                                                </tbody>
                                            </table>
                                        </div>
                                    ` : '<div class="alert alert-success">🎉 本月無考勤問題員工</div>'}
                                </div>
                                <div class="col-md-4">
                                    <h6>📊 考勤統計</h6>
                                    <ul class="list-unstyled">
                                        <li>📋 總打卡記錄: ${data.attendance.summary.totalRecords}</li>
                                        <li>⏰ 遲到記錄: ${data.attendance.summary.totalLateRecords}</li>
                                        <li>🕐 總遲到時間: ${data.attendance.summary.totalLateMinutes} 分鐘</li>
                                        <li>📊 整體準時率: ${(100 - parseFloat(data.attendance.summary.overallLateRate)).toFixed(1)}%</li>
                                    </ul>
                                    
                                    <h6>💡 建議</h6>
                                    <ul class="list-unstyled">
                                        ${data.attendance.recommendations.map(rec => `<li><small>${rec}</small></li>`).join('')}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 投票分析 -->
                <div class="tab-pane fade" id="voting" role="tabpanel">
                    <div class="card">
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-4">
                                    <h6>🗳️ 投票統計</h6>
                                    <ul class="list-unstyled">
                                        <li>📊 總投票活動: ${data.voting.summary.totalCampaigns}</li>
                                        <li>✅ 已完成: ${data.voting.summary.completedCampaigns}</li>
                                        <li>🔄 進行中: ${data.voting.summary.activeCampaigns}</li>
                                        <li>🏆 成功升職: ${data.voting.summary.successfulPromotions}</li>
                                        <li>📉 成功降職: ${data.voting.summary.successfulDemotions}</li>
                                        <li>📈 整體通過率: ${data.voting.summary.overallSuccessRate}%</li>
                                    </ul>
                                </div>
                                <div class="col-md-8">
                                    <h6>📋 投票活動列表</h6>
                                    ${data.voting.campaignDetails.length > 0 ? `
                                        <div class="table-responsive">
                                            <table class="table table-sm">
                                                <thead>
                                                    <tr>
                                                        <th>候選人</th>
                                                        <th>類型</th>
                                                        <th>目標職位</th>
                                                        <th>狀態</th>
                                                        <th>得票率</th>
                                                        <th>結果</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    ${data.voting.campaignDetails.slice(0, 10).map(campaign => `
                                                        <tr>
                                                            <td>${campaign.candidateName}</td>
                                                            <td><small>${campaign.type}</small></td>
                                                            <td>${campaign.targetPosition}</td>
                                                            <td><span class="badge bg-${campaign.status === 'completed' ? 'success' : 'warning'}">${campaign.status === 'completed' ? '已完成' : '進行中'}</span></td>
                                                            <td>${campaign.yesRate}%</td>
                                                            <td>${campaign.result === 'approved' ? '✅' : campaign.result === 'rejected' ? '❌' : '⏳'}</td>
                                                        </tr>
                                                    `).join('')}
                                                </tbody>
                                            </table>
                                        </div>
                                    ` : '<div class="alert alert-info">本月暫無投票活動</div>'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 績效排名 -->
                <div class="tab-pane fade" id="performance" role="tabpanel">
                    <div class="card">
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-8">
                                    <h6>🏆 員工績效排行榜 (Top 20)</h6>
                                    <div class="table-responsive">
                                        <table class="table table-striped">
                                            <thead>
                                                <tr>
                                                    <th>排名</th>
                                                    <th>姓名</th>
                                                    <th>職位</th>
                                                    <th>分店</th>
                                                    <th>績效分數</th>
                                                    <th>營收達標率</th>
                                                    <th>出勤率</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                ${data.performance.rankings.slice(0, 20).map((emp, index) => `
                                                    <tr>
                                                        <td>
                                                            ${index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}
                                                        </td>
                                                        <td>${emp.employeeName}</td>
                                                        <td>${emp.currentPosition}</td>
                                                        <td>${emp.currentStore}</td>
                                                        <td><span class="badge bg-${emp.overallScore >= 80 ? 'success' : emp.overallScore >= 60 ? 'warning' : 'danger'}">${emp.overallScore}</span></td>
                                                        <td>${emp.revenue.qualificationRate}%</td>
                                                        <td>${emp.attendance.attendanceRate}%</td>
                                                    </tr>
                                                `).join('')}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <h6>📊 績效統計</h6>
                                    <ul class="list-unstyled">
                                        <li>👥 總員工: ${data.performance.summary.totalEmployees}</li>
                                        <li>⭐ 平均分數: ${data.performance.summary.avgScore} 分</li>
                                        <li>🌟 優秀員工: ${data.performance.summary.topPerformers} 人</li>
                                        <li>📉 需改善: ${data.performance.summary.needImprovement} 人</li>
                                    </ul>
                                    
                                    ${data.performance.topPerformers.length > 0 ? `
                                        <h6>🌟 本月MVP</h6>
                                        <ul class="list-unstyled">
                                            ${data.performance.topPerformers.slice(0, 3).map((emp, index) => `
                                                <li><small>${['🥇', '🥈', '🥉'][index]} ${emp.employeeName} (${emp.overallScore}分)</small></li>
                                            `).join('')}
                                        </ul>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="mt-3">
                <small class="text-muted">
                    📊 報告生成時間: ${new Date(data.generatedAt).toLocaleString('zh-TW')} | 
                    🔍 數據期間: ${data.period.year}年${data.period.month}月 | 
                    💾 系統版本: v2.0
                </small>
            </div>
        `;
    }

    async showAdvancedStats() {
        try {
            const currentDate = new Date();
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1;

            // 載入各類獨立報告
            const [revenueReport, attendanceReport, votingReport, performanceReport] = await Promise.all([
                fetch(`${this.baseUrl}/revenue/${year}/${month}`).then(r => r.json()),
                fetch(`${this.baseUrl}/attendance/${year}/${month}`).then(r => r.json()),
                fetch(`${this.baseUrl}/voting/${year}/${month}`).then(r => r.json()),
                fetch(`${this.baseUrl}/performance/${year}/${month}`).then(r => r.json())
            ]);

            const modal = `
                <div class="modal fade" id="advancedStatsModal" tabindex="-1">
                    <div class="modal-dialog modal-xl">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">📊 進階統計分析</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <ul class="nav nav-pills mb-3" id="statsTab" role="tablist">
                                    <li class="nav-item" role="presentation">
                                        <button class="nav-link active" id="revenue-stats-tab" data-bs-toggle="pill" data-bs-target="#revenue-stats">營收深度</button>
                                    </li>
                                    <li class="nav-item" role="presentation">
                                        <button class="nav-link" id="attendance-stats-tab" data-bs-toggle="pill" data-bs-target="#attendance-stats">考勤深度</button>
                                    </li>
                                    <li class="nav-item" role="presentation">
                                        <button class="nav-link" id="voting-stats-tab" data-bs-toggle="pill" data-bs-target="#voting-stats">投票深度</button>
                                    </li>
                                    <li class="nav-item" role="presentation">
                                        <button class="nav-link" id="performance-stats-tab" data-bs-toggle="pill" data-bs-target="#performance-stats">績效深度</button>
                                    </li>
                                </ul>
                                <div class="tab-content" id="statsTabContent">
                                    <div class="tab-pane fade show active" id="revenue-stats">
                                        <h6>💰 營收深度分析</h6>
                                        <p>總營收: NT$ ${revenueReport.data.summary.totalRevenue.toLocaleString()}</p>
                                        <p>總獎金: NT$ ${revenueReport.data.summary.totalBonus.toLocaleString()}</p>
                                        <p>平均日營收: NT$ ${revenueReport.data.summary.avgDailyRevenue.toLocaleString()}</p>
                                    </div>
                                    <div class="tab-pane fade" id="attendance-stats">
                                        <h6>👥 考勤深度分析</h6>
                                        <p>總打卡記錄: ${attendanceReport.data.summary.totalRecords}</p>
                                        <p>遲到記錄: ${attendanceReport.data.summary.totalLateRecords}</p>
                                        <p>整體準時率: ${(100 - parseFloat(attendanceReport.data.summary.overallLateRate)).toFixed(1)}%</p>
                                    </div>
                                    <div class="tab-pane fade" id="voting-stats">
                                        <h6>🗳️ 投票深度分析</h6>
                                        <p>總投票活動: ${votingReport.data.summary.totalCampaigns}</p>
                                        <p>整體通過率: ${votingReport.data.summary.overallSuccessRate}%</p>
                                        <p>成功升職: ${votingReport.data.summary.successfulPromotions}</p>
                                    </div>
                                    <div class="tab-pane fade" id="performance-stats">
                                        <h6>⭐ 績效深度分析</h6>
                                        <p>平均績效分數: ${performanceReport.data.summary.avgScore}</p>
                                        <p>優秀員工: ${performanceReport.data.summary.topPerformers}</p>
                                        <p>需改善員工: ${performanceReport.data.summary.needImprovement}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // 移除舊的modal
            const oldModal = document.getElementById('advancedStatsModal');
            if (oldModal) oldModal.remove();

            // 添加新的modal
            document.body.insertAdjacentHTML('beforeend', modal);
            const modalElement = new bootstrap.Modal(document.getElementById('advancedStatsModal'));
            modalElement.show();

        } catch (error) {
            console.error('❌ 載入進階統計失敗:', error);
            alert('載入進階統計失敗，請稍後再試');
        }
    }

    async exportCurrentReport() {
        if (!this.currentReport) {
            alert('請先生成報表再匯出');
            return;
        }

        try {
            const currentDate = new Date();
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1;

            let exportUrl;
            switch (this.currentReport.type) {
                case 'daily':
                    // 日報表匯出為月度報表
                    exportUrl = `${this.baseUrl}/export/monthly/${year}/${month}`;
                    break;
                case 'weekly':
                    exportUrl = `${this.baseUrl}/export/monthly/${year}/${month}`;
                    break;
                case 'monthly':
                    exportUrl = `${this.baseUrl}/export/monthly/${year}/${month}`;
                    break;
                default:
                    throw new Error('無法匯出此類型報表');
            }

            const response = await fetch(exportUrl);
            if (!response.ok) {
                throw new Error(`匯出失敗: ${response.status}`);
            }

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.message || '匯出失敗');
            }

            // 創建下載鏈接
            const dataStr = JSON.stringify(result.data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = result.filename || `report-${Date.now()}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);

            console.log('✅ 報表匯出成功:', result.filename);
            alert(`報表匯出成功：${result.filename}`);

        } catch (error) {
            console.error('❌ 報表匯出失敗:', error);
            alert(`報表匯出失敗：${error.message}`);
        }
    }

    showError(message) {
        const reportData = document.getElementById('reportData');
        if (reportData) {
            reportData.innerHTML = `
                <div class="alert alert-danger">
                    <h6>❌ 錯誤</h6>
                    <p>${message}</p>
                    <button class="btn btn-sm btn-outline-danger" onclick="window.reportsManager.loadInitialData()">
                        🔄 重新載入
                    </button>
                </div>
            `;
        }
    }
}

// 全局函數 - 保持向後相容
function showStats() {
    if (window.reportsManager) {
        window.reportsManager.showAdvancedStats();
    }
}

function generateReport(type) {
    if (window.reportsManager) {
        window.reportsManager.generateReport(type);
    }
}

function exportReport() {
    if (window.reportsManager) {
        window.reportsManager.exportCurrentReport();
    }
}

function logout() {
    if (confirm('確定要登出嗎？')) {
        window.location.href = 'login.html';
    }
}

// 初始化報表管理器
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 初始化報表系統...');
    window.reportsManager = new ReportsManager();
});

// 匯出模組
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReportsManager;
}