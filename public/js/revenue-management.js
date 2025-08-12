/**
 * ==============================================
 * 營收管理系統 JavaScript
 * ==============================================
 * 基於系統邏輯.txt規格 - 智能獎金計算引擎前端
 */

// 全域變數
let currentRevenueRecords = [];
let currentPage = 1;
let totalPages = 1;
let revenueChart = null;
let bonusChart = null;
let selectedRecordId = null;

// 頁面載入完成後執行
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 營收管理系統前端已載入');
    
    // 初始化頁面
    initializePage();
    
    // 綁定事件監聽器
    bindEventListeners();
    
    // 載入初始數據
    loadInitialData();
});

// 初始化頁面
function initializePage() {
    // 設置今天的日期為預設值
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('revenueDate').value = today;
    
    // 根據今天是否為假日自動選擇獎金類別
    const dayOfWeek = new Date().getDay();
    const isHoliday = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6; // 週日、週五、週六為假日
    
    const bonusTypeSelect = document.getElementById('bonusType');
    if (isHoliday) {
        bonusTypeSelect.value = '假日獎金';
    } else {
        bonusTypeSelect.value = '平日獎金';
    }
    
    console.log(`📅 今日是${isHoliday ? '假日' : '平日'}，自動選擇${isHoliday ? '假日' : '平日'}獎金`);
}

// 綁定事件監聽器
function bindEventListeners() {
    // 營收提交表單
    document.getElementById('revenueSubmitForm').addEventListener('submit', handleRevenueSubmit);
    
    // 獎金計算器表單
    document.getElementById('bonusCalculatorForm').addEventListener('submit', handleBonusCalculation);
    
    // 營收金額輸入即時計算
    ['cashRevenue', 'pandaRevenue', 'uberRevenue', 'bonusType'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', updateRealTimeCalculation);
        }
    });
    
    // 標籤頁切換事件
    document.querySelectorAll('button[data-bs-toggle="tab"]').forEach(tab => {
        tab.addEventListener('shown.bs.tab', function(event) {
            const target = event.target.getAttribute('data-bs-target');
            if (target === '#records') {
                loadRevenueRecords();
            } else if (target === '#statistics') {
                loadStatistics();
            }
        });
    });
}

// 載入初始數據
function loadInitialData() {
    loadTodaySummary();
}

// 處理營收提交
async function handleRevenueSubmit(event) {
    event.preventDefault();
    
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>提交中...';
    submitButton.disabled = true;
    
    try {
        const formData = {
            employeeId: parseInt(document.getElementById('employeeId').value),
            storeName: document.getElementById('storeName').value,
            date: document.getElementById('revenueDate').value,
            bonusType: document.getElementById('bonusType').value,
            cashRevenue: parseFloat(document.getElementById('cashRevenue').value) || 0,
            pandaRevenue: parseFloat(document.getElementById('pandaRevenue').value) || 0,
            uberRevenue: parseFloat(document.getElementById('uberRevenue').value) || 0,
            cashOrders: parseInt(document.getElementById('cashOrders').value) || 0,
            pandaOrders: parseInt(document.getElementById('pandaOrders').value) || 0,
            uberOrders: parseInt(document.getElementById('uberOrders').value) || 0,
            notes: document.getElementById('revenueNotes').value
        };
        
        console.log('📊 提交營收數據:', formData);
        
        const response = await fetch('/api/revenue/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('success', '✅ 營收記錄提交成功！', `獎金計算: $${result.data.bonusCalculation.bonusAmount.toLocaleString()}`);
            
            // 清空表單
            document.getElementById('revenueSubmitForm').reset();
            initializePage();
            
            // 更新數據
            loadTodaySummary();
            
            // 顯示提交結果
            displaySubmissionResult(result.data.bonusCalculation);
            
        } else {
            showNotification('error', '❌ 提交失敗', result.message);
        }
        
    } catch (error) {
        console.error('💥 提交營收失敗:', error);
        showNotification('error', '❌ 系統錯誤', '請稍後再試');
    } finally {
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
    }
}

// 處理獎金計算
async function handleBonusCalculation(event) {
    event.preventDefault();
    
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>計算中...';
    submitButton.disabled = true;
    
    try {
        const calculationData = {
            cashRevenue: parseFloat(document.getElementById('calcCashRevenue').value) || 0,
            pandaRevenue: parseFloat(document.getElementById('calcPandaRevenue').value) || 0,
            uberRevenue: parseFloat(document.getElementById('calcUberRevenue').value) || 0,
            bonusType: document.getElementById('calcBonusType').value
        };
        
        console.log('🧮 計算獎金:', calculationData);
        
        const response = await fetch('/api/revenue/calculate-bonus', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(calculationData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            displayCalculationResult(result.data);
        } else {
            showNotification('error', '❌ 計算失敗', result.message);
        }
        
    } catch (error) {
        console.error('💥 獎金計算失敗:', error);
        showNotification('error', '❌ 計算錯誤', '請稍後再試');
    } finally {
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
    }
}

// 即時計算更新
function updateRealTimeCalculation() {
    const cashRevenue = parseFloat(document.getElementById('cashRevenue').value) || 0;
    const pandaRevenue = parseFloat(document.getElementById('pandaRevenue').value) || 0;
    const uberRevenue = parseFloat(document.getElementById('uberRevenue').value) || 0;
    const bonusType = document.getElementById('bonusType').value;
    
    if (bonusType && (cashRevenue > 0 || pandaRevenue > 0 || uberRevenue > 0)) {
        // 計算有效營收
        const pandaEffective = pandaRevenue * 0.65;
        const uberEffective = uberRevenue * 0.65;
        const totalEffective = cashRevenue + pandaEffective + uberEffective;
        const totalIncome = cashRevenue + pandaRevenue + uberRevenue;
        
        // 計算獎金
        let bonusAmount = 0;
        let qualified = false;
        let shortfall = 0;
        
        if (bonusType === '平日獎金') {
            const threshold = 13000;
            if (totalEffective > threshold) {
                bonusAmount = totalEffective * 0.30;
                qualified = true;
            } else {
                shortfall = threshold - totalEffective;
            }
        } else if (bonusType === '假日獎金') {
            if (totalEffective >= 0) {
                bonusAmount = totalEffective * 0.38;
                qualified = true;
            }
        }
        
        // 顯示計算結果
        const calculationDiv = document.getElementById('realTimeCalculation');
        const detailsDiv = document.getElementById('calculationDetails');
        
        detailsDiv.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <strong>營收明細:</strong><br>
                    • 現場營業額: $${cashRevenue.toLocaleString()}<br>
                    • 熊貓點餐: $${pandaRevenue.toLocaleString()} (實收: $${Math.round(pandaEffective).toLocaleString()})<br>
                    • UBER外送: $${uberRevenue.toLocaleString()} (實收: $${Math.round(uberEffective).toLocaleString()})<br>
                    • 總營收: $${totalIncome.toLocaleString()}<br>
                    • 有效營收: $${Math.round(totalEffective).toLocaleString()}
                </div>
                <div class="col-md-6">
                    <strong>獎金計算:</strong><br>
                    • 獎金類別: ${bonusType}<br>
                    • 計算公式: ${bonusType === '平日獎金' ? '超過13,000元取30%' : '任何金額取38%'}<br>
                    ${qualified 
                        ? `<span class="bonus-qualified">• 達標獎金: $${Math.round(bonusAmount).toLocaleString()}</span>` 
                        : `<span class="bonus-not-qualified">• 未達標，差距: $${Math.round(shortfall).toLocaleString()}</span>`
                    }
                </div>
            </div>
        `;
        
        calculationDiv.style.display = 'block';
    } else {
        document.getElementById('realTimeCalculation').style.display = 'none';
    }
}

// 載入今日摘要
async function loadTodaySummary() {
    try {
        console.log('📊 載入今日營收摘要...');
        
        const today = new Date().toISOString().split('T')[0];
        const response = await fetch(`/api/revenue/records?startDate=${today}&endDate=${today}`);
        const result = await response.json();
        
        if (result.success) {
            const records = result.data.records || [];
            
            // 計算今日統計
            let todayRevenue = 0;
            let todayBonus = 0;
            let todayOrders = 0;
            
            records.forEach(record => {
                todayRevenue += parseFloat(record.totalIncome || 0);
                todayBonus += parseFloat(record.bonusAmount || 0);
                todayOrders += parseInt(record.totalOrders || record.cashOrders + record.pandaOrders + record.uberOrders || 0);
            });
            
            // 更新顯示
            document.getElementById('todayRevenue').textContent = '$' + todayRevenue.toLocaleString();
            document.getElementById('todayBonus').textContent = '$' + todayBonus.toLocaleString();
            document.getElementById('todayOrders').textContent = todayOrders.toLocaleString() + ' 單';
            
            console.log(`📈 今日統計: 營收$${todayRevenue}, 獎金$${todayBonus}, 訂單${todayOrders}單`);
        }
        
        // 載入本月營收
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
        const monthEnd = new Date().toISOString().split('T')[0];
        const monthResponse = await fetch(`/api/revenue/records?startDate=${monthStart}&endDate=${monthEnd}`);
        const monthResult = await monthResponse.json();
        
        if (monthResult.success) {
            const monthRecords = monthResult.data.records || [];
            const monthlyRevenue = monthRecords.reduce((sum, record) => sum + parseFloat(record.totalIncome || 0), 0);
            document.getElementById('monthlyRevenue').textContent = '$' + monthlyRevenue.toLocaleString();
        }
        
    } catch (error) {
        console.error('💥 載入今日摘要失敗:', error);
        document.getElementById('todayRevenue').textContent = '載入失敗';
        document.getElementById('todayBonus').textContent = '載入失敗';
        document.getElementById('todayOrders').textContent = '載入失敗';
        document.getElementById('monthlyRevenue').textContent = '載入失敗';
    }
}

// 載入營收記錄
async function loadRevenueRecords(page = 1) {
    try {
        console.log(`📋 載入營收記錄 - 第${page}頁...`);
        
        showLoadingSpinner('revenueRecordsTable');
        
        const response = await fetch(`/api/revenue/records?page=${page}&limit=20`);
        const result = await response.json();
        
        if (result.success) {
            currentRevenueRecords = result.data.records || [];
            const pagination = result.data.pagination || {};
            
            displayRevenueRecords(currentRevenueRecords);
            updatePagination(pagination);
            
            console.log(`✅ 載入了${currentRevenueRecords.length}筆營收記錄`);
        } else {
            showEmptyState('revenueRecordsTable', '沒有營收記錄');
        }
        
    } catch (error) {
        console.error('💥 載入營收記錄失敗:', error);
        showEmptyState('revenueRecordsTable', '載入失敗，請重試');
    }
}

// 顯示營收記錄表格
function displayRevenueRecords(records) {
    const tableBody = document.getElementById('revenueRecordsTable');
    
    if (records.length === 0) {
        showEmptyState('revenueRecordsTable', '暫無營收記錄');
        return;
    }
    
    const rows = records.map(record => {
        const qualified = record.bonusQualified || record.bonusStatus === '達標';
        const statusClass = qualified ? 'bonus-qualified' : 'bonus-not-qualified';
        const statusIcon = qualified ? '✅' : '❌';
        
        return `
            <tr>
                <td>${record.date}</td>
                <td>${record.storeName}</td>
                <td>${record.employeeName}</td>
                <td>
                    <span class="badge ${record.bonusType === '假日獎金' ? 'bg-warning' : 'bg-info'}">
                        ${record.bonusType}
                    </span>
                </td>
                <td>$${(record.totalIncome || 0).toLocaleString()}</td>
                <td>$${Math.round(record.effectiveRevenue || 0).toLocaleString()}</td>
                <td>$${Math.round(record.bonusAmount || 0).toLocaleString()}</td>
                <td>
                    <span class="${statusClass}">
                        ${statusIcon} ${record.bonusStatus || (qualified ? '達標' : '未達標')}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="showRevenueDetail(${record.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    tableBody.innerHTML = rows;
}

// 顯示營收記錄詳細資訊
async function showRevenueDetail(recordId) {
    try {
        console.log(`📄 顯示營收記錄詳細資訊: ${recordId}`);
        
        selectedRecordId = recordId;
        const record = currentRevenueRecords.find(r => r.id === recordId);
        
        if (!record) {
            showNotification('error', '❌ 記錄不存在', '無法找到指定的營收記錄');
            return;
        }
        
        const modalContent = document.getElementById('revenueDetailContent');
        const qualified = record.bonusQualified || record.bonusStatus === '達標';
        
        modalContent.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6><i class="fas fa-info-circle me-2"></i>基本資訊</h6>
                    <table class="table table-sm">
                        <tr><td>記錄ID:</td><td>#${record.id}</td></tr>
                        <tr><td>提交員工:</td><td>${record.employeeName}</td></tr>
                        <tr><td>分店:</td><td>${record.storeName}</td></tr>
                        <tr><td>營收日期:</td><td>${record.date}</td></tr>
                        <tr><td>獎金類別:</td><td>${record.bonusType}</td></tr>
                        <tr><td>提交時間:</td><td>${new Date(record.createdAt).toLocaleString()}</td></tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <h6><i class="fas fa-money-bill-wave me-2"></i>營收明細</h6>
                    <table class="table table-sm">
                        <tr><td>現場營業額:</td><td>$${(record.cashRevenue || 0).toLocaleString()}</td></tr>
                        <tr><td>熊貓點餐:</td><td>$${(record.pandaRevenue || 0).toLocaleString()}</td></tr>
                        <tr><td>UBER外送:</td><td>$${(record.uberRevenue || 0).toLocaleString()}</td></tr>
                        <tr><td><strong>總營收:</strong></td><td><strong>$${(record.totalIncome || 0).toLocaleString()}</strong></td></tr>
                        <tr><td><strong>有效營收:</strong></td><td><strong>$${Math.round(record.effectiveRevenue || 0).toLocaleString()}</strong></td></tr>
                    </table>
                </div>
            </div>
            <hr>
            <div class="row">
                <div class="col-md-6">
                    <h6><i class="fas fa-receipt me-2"></i>訂單統計</h6>
                    <table class="table table-sm">
                        <tr><td>現場訂單:</td><td>${record.cashOrders || 0} 單</td></tr>
                        <tr><td>熊貓訂單:</td><td>${record.pandaOrders || 0} 單</td></tr>
                        <tr><td>UBER訂單:</td><td>${record.uberOrders || 0} 單</td></tr>
                        <tr><td><strong>總訂單:</strong></td><td><strong>${(record.totalOrders || (record.cashOrders + record.pandaOrders + record.uberOrders) || 0)} 單</strong></td></tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <h6><i class="fas fa-gift me-2"></i>獎金計算</h6>
                    <table class="table table-sm">
                        <tr><td>獎金門檻:</td><td>$${(record.bonusThreshold || (record.bonusType === '平日獎金' ? 13000 : 0)).toLocaleString()}</td></tr>
                        <tr><td>獎金比例:</td><td>${((record.bonusRate || (record.bonusType === '平日獎金' ? 0.30 : 0.38)) * 100).toFixed(0)}%</td></tr>
                        <tr><td>達標狀態:</td><td><span class="${qualified ? 'bonus-qualified' : 'bonus-not-qualified'}">${qualified ? '✅ 達標' : '❌ 未達標'}</span></td></tr>
                        ${!qualified && record.bonusShortfall ? `<tr><td>差距金額:</td><td>$${Math.round(record.bonusShortfall).toLocaleString()}</td></tr>` : ''}
                        <tr><td><strong>獎金金額:</strong></td><td><strong class="${qualified ? 'bonus-qualified' : 'bonus-not-qualified'}">$${Math.round(record.bonusAmount || 0).toLocaleString()}</strong></td></tr>
                    </table>
                </div>
            </div>
            ${record.notes ? `<hr><div><h6><i class="fas fa-sticky-note me-2"></i>備註</h6><p class="text-muted">${record.notes}</p></div>` : ''}
        `;
        
        // 顯示模態框
        const modal = new bootstrap.Modal(document.getElementById('revenueDetailModal'));
        modal.show();
        
    } catch (error) {
        console.error('💥 顯示記錄詳細資訊失敗:', error);
        showNotification('error', '❌ 載入失敗', '無法載入詳細資訊');
    }
}

// 作廢營收記錄
async function voidRevenueRecord() {
    if (!selectedRecordId) {
        showNotification('error', '❌ 無效操作', '未選擇記錄');
        return;
    }
    
    const reason = prompt('請輸入作廢原因:');
    if (!reason) return;
    
    try {
        console.log(`🗑️ 作廢營收記錄: ${selectedRecordId}, 原因: ${reason}`);
        
        const response = await fetch(`/api/revenue/void/${selectedRecordId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                reason: reason,
                operatorId: 'admin'
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('success', '✅ 作廢成功', '營收記錄已作廢');
            
            // 關閉模態框
            bootstrap.Modal.getInstance(document.getElementById('revenueDetailModal')).hide();
            
            // 重新載入記錄
            loadRevenueRecords(currentPage);
            loadTodaySummary();
            
        } else {
            showNotification('error', '❌ 作廢失敗', result.message);
        }
        
    } catch (error) {
        console.error('💥 作廢記錄失敗:', error);
        showNotification('error', '❌ 系統錯誤', '請稍後再試');
    }
}

// 載入統計分析
async function loadStatistics() {
    try {
        console.log('📊 載入統計分析...');
        
        // 載入分店摘要
        const storesResponse = await fetch('/api/revenue/stores-summary');
        const storesResult = await storesResponse.json();
        
        if (storesResult.success) {
            displayStoresSummary(storesResult.data.storesSummary || []);
        }
        
        // 載入圖表數據
        loadCharts();
        
    } catch (error) {
        console.error('💥 載入統計分析失敗:', error);
        document.getElementById('storesSummaryContent').innerHTML = '<div class="text-center text-muted">載入失敗</div>';
    }
}

// 顯示分店摘要
function displayStoresSummary(storesSummary) {
    const content = document.getElementById('storesSummaryContent');
    
    if (storesSummary.length === 0) {
        content.innerHTML = '<div class="text-center text-muted">暫無數據</div>';
        return;
    }
    
    const summaryCards = storesSummary.map(store => {
        const stats = store.statistics || {};
        const recentCount = store.recentRecords?.length || 0;
        
        return `
            <div class="col-md-6 col-lg-4 mb-3">
                <div class="card revenue-card">
                    <div class="card-header">
                        <h6><i class="fas fa-store me-2"></i>${store.storeName}</h6>
                    </div>
                    <div class="card-body">
                        <div class="row text-center">
                            <div class="col-6">
                                <h6 class="text-primary">本月營收</h6>
                                <h5>$${(stats.monthlyIncome || 0).toLocaleString()}</h5>
                            </div>
                            <div class="col-6">
                                <h6 class="text-success">本月獎金</h6>
                                <h5>$${(stats.monthlyBonus || 0).toLocaleString()}</h5>
                            </div>
                        </div>
                        <hr>
                        <small class="text-muted">
                            <i class="fas fa-chart-line me-1"></i>總記錄: ${stats.totalRecords || 0} 筆
                            <br>
                            <i class="fas fa-calendar me-1"></i>本月記錄: ${stats.monthlyCount || 0} 筆
                        </small>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    content.innerHTML = `<div class="row">${summaryCards}</div>`;
}

// 載入圖表
function loadCharts() {
    // 先銷毀現有圖表
    if (revenueChart) {
        revenueChart.destroy();
    }
    if (bonusChart) {
        bonusChart.destroy();
    }
    
    // 營收圖表
    const revenueCtx = document.getElementById('revenueChart').getContext('2d');
    revenueChart = new Chart(revenueCtx, {
        type: 'line',
        data: {
            labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
            datasets: [{
                label: '月度營收',
                data: [65000, 59000, 80000, 81000, 56000, 55000],
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: '月度營收趨勢'
                }
            }
        }
    });
    
    // 獎金圖表
    const bonusCtx = document.getElementById('bonusChart').getContext('2d');
    bonusChart = new Chart(bonusCtx, {
        type: 'doughnut',
        data: {
            labels: ['平日獎金', '假日獎金'],
            datasets: [{
                data: [300, 150],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 206, 86, 0.8)'
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: '獎金類型分布'
                }
            }
        }
    });
}

// 顯示提交結果
function displaySubmissionResult(calculation) {
    const qualified = calculation.qualified;
    const alertClass = qualified ? 'alert-success' : 'alert-warning';
    const icon = qualified ? '🎉' : '📊';
    
    const resultHtml = `
        <div class="alert ${alertClass} fade-in">
            <h6>${icon} 提交成功 - 獎金計算結果</h6>
            <div class="row">
                <div class="col-md-6">
                    <strong>營收明細:</strong><br>
                    • 總營收: $${calculation.totalIncome.toLocaleString()}<br>
                    • 有效營收: $${Math.round(calculation.totalEffective).toLocaleString()}<br>
                    • 獎金類別: ${calculation.bonusType}
                </div>
                <div class="col-md-6">
                    <strong>獎金計算:</strong><br>
                    ${qualified 
                        ? `<span class="bonus-qualified">✅ 達標獎金: $${calculation.bonusAmount.toLocaleString()}</span>` 
                        : `<span class="bonus-not-qualified">❌ 未達標，差距: $${Math.round(calculation.shortfall).toLocaleString()}</span>`
                    }
                </div>
            </div>
        </div>
    `;
    
    // 插入到提交表單下方
    const form = document.getElementById('revenueSubmitForm');
    const existingResult = form.querySelector('.submission-result');
    if (existingResult) {
        existingResult.remove();
    }
    
    const resultDiv = document.createElement('div');
    resultDiv.className = 'submission-result mt-3';
    resultDiv.innerHTML = resultHtml;
    form.appendChild(resultDiv);
    
    // 5秒後自動隱藏
    setTimeout(() => {
        resultDiv.style.transition = 'opacity 0.5s ease';
        resultDiv.style.opacity = '0';
        setTimeout(() => resultDiv.remove(), 500);
    }, 5000);
}

// 顯示計算結果
function displayCalculationResult(calculation) {
    const qualified = calculation.qualified;
    const resultDiv = document.getElementById('calculatorResult');
    const detailsDiv = document.getElementById('calculatorDetails');
    
    detailsDiv.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <strong>收入分析:</strong><br>
                • 現場營業額: $${calculation.cashRevenue.toLocaleString()}<br>
                • 熊貓點餐: $${calculation.pandaRevenue.toLocaleString()} (實收: $${Math.round(calculation.pandaEffective).toLocaleString()})<br>
                • UBER外送: $${calculation.uberRevenue.toLocaleString()} (實收: $${Math.round(calculation.uberEffective).toLocaleString()})<br>
                • <strong>總營收: $${calculation.totalIncome.toLocaleString()}</strong><br>
                • <strong>有效營收: $${Math.round(calculation.totalEffective).toLocaleString()}</strong>
            </div>
            <div class="col-md-6">
                <strong>獎金計算:</strong><br>
                • 獎金類別: ${calculation.bonusType}<br>
                • 計算門檻: $${calculation.threshold.toLocaleString()}<br>
                • 獎金比例: ${(calculation.bonusRate * 100).toFixed(0)}%<br>
                • 達標狀態: ${qualified ? '<span class="bonus-qualified">✅ 達標</span>' : '<span class="bonus-not-qualified">❌ 未達標</span>'}<br>
                ${qualified 
                    ? `• <strong class="bonus-qualified">獎金金額: $${calculation.bonusAmount.toLocaleString()}</strong>`
                    : `• <strong class="bonus-not-qualified">差距金額: $${Math.round(calculation.shortfall).toLocaleString()}</strong>`
                }
            </div>
        </div>
    `;
    
    resultDiv.style.display = 'block';
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// 更新分頁
function updatePagination(pagination) {
    const paginationContainer = document.getElementById('revenueRecordsPagination');
    if (!pagination || pagination.totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    currentPage = pagination.page;
    totalPages = pagination.totalPages;
    
    let paginationHtml = '';
    
    // 前一頁
    if (currentPage > 1) {
        paginationHtml += `<li class="page-item"><a class="page-link" href="#" onclick="loadRevenueRecords(${currentPage - 1})">上一頁</a></li>`;
    }
    
    // 頁碼
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        const activeClass = i === currentPage ? 'active' : '';
        paginationHtml += `<li class="page-item ${activeClass}"><a class="page-link" href="#" onclick="loadRevenueRecords(${i})">${i}</a></li>`;
    }
    
    // 下一頁
    if (currentPage < totalPages) {
        paginationHtml += `<li class="page-item"><a class="page-link" href="#" onclick="loadRevenueRecords(${currentPage + 1})">下一頁</a></li>`;
    }
    
    paginationContainer.innerHTML = paginationHtml;
}

// 套用營收篩選
async function applyRevenueFilters() {
    try {
        const filters = {
            storeName: document.getElementById('filterStore').value,
            bonusType: document.getElementById('filterBonusType').value,
            startDate: document.getElementById('filterStartDate').value,
            endDate: document.getElementById('filterEndDate').value
        };
        
        console.log('🔍 套用篩選條件:', filters);
        
        // 構建查詢參數
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, value);
        });
        params.append('page', '1');
        params.append('limit', '20');
        
        showLoadingSpinner('revenueRecordsTable');
        
        const response = await fetch(`/api/revenue/records?${params.toString()}`);
        const result = await response.json();
        
        if (result.success) {
            currentRevenueRecords = result.data.records || [];
            displayRevenueRecords(currentRevenueRecords);
            updatePagination(result.data.pagination || {});
            
            console.log(`🔍 篩選結果: ${currentRevenueRecords.length} 筆記錄`);
        } else {
            showEmptyState('revenueRecordsTable', '篩選無結果');
        }
        
    } catch (error) {
        console.error('💥 套用篩選失敗:', error);
        showEmptyState('revenueRecordsTable', '篩選失敗，請重試');
    }
}

// 重設營收篩選
function resetRevenueFilters() {
    document.getElementById('filterStore').value = '';
    document.getElementById('filterBonusType').value = '';
    document.getElementById('filterStartDate').value = '';
    document.getElementById('filterEndDate').value = '';
    loadRevenueRecords(1);
}

// 匯出營收數據
async function exportRevenueData() {
    try {
        console.log('📤 匯出營收數據...');
        
        // 獲取所有記錄
        const response = await fetch('/api/revenue/records?limit=1000');
        const result = await response.json();
        
        if (result.success) {
            const records = result.data.records || [];
            
            // 轉換為CSV格式
            const headers = ['日期', '分店', '提交員工', '獎金類別', '總營收', '有效營收', '獎金金額', '達標狀態', '備註'];
            const csvContent = [
                headers.join(','),
                ...records.map(record => [
                    record.date,
                    record.storeName,
                    record.employeeName,
                    record.bonusType,
                    record.totalIncome || 0,
                    Math.round(record.effectiveRevenue || 0),
                    Math.round(record.bonusAmount || 0),
                    record.bonusStatus || (record.bonusQualified ? '達標' : '未達標'),
                    (record.notes || '').replace(/,/g, '；') // 替換逗號避免CSV格式問題
                ].join(','))
            ].join('\n');
            
            // 下載檔案
            const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `營收記錄_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            
            showNotification('success', '✅ 匯出成功', `已匯出 ${records.length} 筆記錄`);
            
        } else {
            showNotification('error', '❌ 匯出失敗', result.message);
        }
        
    } catch (error) {
        console.error('💥 匯出數據失敗:', error);
        showNotification('error', '❌ 匯出錯誤', '請稍後再試');
    }
}

// 重新載入數據
function loadRevenueData() {
    console.log('🔄 重新載入營收數據...');
    
    loadTodaySummary();
    
    // 根據當前活躍標籤頁載入對應數據
    const activeTab = document.querySelector('.nav-link.active');
    const target = activeTab?.getAttribute('data-bs-target');
    
    if (target === '#records') {
        loadRevenueRecords(currentPage);
    } else if (target === '#statistics') {
        loadStatistics();
    }
    
    showNotification('info', '🔄 數據重新載入', '已更新最新數據');
}

// 工具函數 - 顯示載入狀態
function showLoadingSpinner(elementId) {
    const element = document.getElementById(elementId);
    element.innerHTML = '<tr><td colspan="9" class="text-center"><div class="loading-spinner"><i class="fas fa-spinner fa-spin me-2"></i>載入中...</div></td></tr>';
}

// 工具函數 - 顯示空狀態
function showEmptyState(elementId, message) {
    const element = document.getElementById(elementId);
    element.innerHTML = `<tr><td colspan="9" class="text-center text-muted">${message}</td></tr>`;
}

// 工具函數 - 顯示通知
function showNotification(type, title, message) {
    // 創建通知元素
    const alertClass = {
        'success': 'alert-success',
        'error': 'alert-danger',
        'warning': 'alert-warning',
        'info': 'alert-info'
    }[type] || 'alert-info';
    
    const notification = document.createElement('div');
    notification.className = `alert ${alertClass} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        <strong>${title}</strong><br>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // 3秒後自動消失
    setTimeout(() => {
        if (notification && notification.parentNode) {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 150);
        }
    }, 3000);
    
    console.log(`📢 通知: [${type.toUpperCase()}] ${title} - ${message}`);
}

// 導出全域函數（供HTML使用）
window.loadRevenueData = loadRevenueData;
window.showRevenueDetail = showRevenueDetail;
window.voidRevenueRecord = voidRevenueRecord;
window.loadRevenueRecords = loadRevenueRecords;
window.applyRevenueFilters = applyRevenueFilters;
window.resetRevenueFilters = resetRevenueFilters;
window.exportRevenueData = exportRevenueData;