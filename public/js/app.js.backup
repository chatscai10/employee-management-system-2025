/**
 * 企業員工管理系統 - 主要JavaScript功能
 */

// 全域變數
let currentUser = {
    id: 1,
    name: '張三',
    position: '員工',
    store: '台北店'
};

// 頁面載入完成後初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('📱 企業員工管理系統初始化...');
    initializeSystem();
    loadAttendanceRecords();
    updateDateTime();
    
    // 每分鐘更新時間
    setInterval(updateDateTime, 60000);
});

/**
 * 系統初始化
 */
function initializeSystem() {
    console.log('🚀 系統初始化完成');
    showNotification('系統載入完成', 'success');
}

/**
 * 更新日期時間顯示
 */
function updateDateTime() {
    const now = new Date();
    const dateTimeStr = now.toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    // 更新頁面上的時間顯示
    const timeElements = document.querySelectorAll('.current-time');
    timeElements.forEach(element => {
        element.textContent = dateTimeStr;
    });
}

/**
 * 快速打卡功能
 */
function quickClockIn() {
    console.log('📍 執行快速打卡...');
    
    // 檢查地理位置權限
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const lat = position.coords.latitude.toFixed(6);
                const lng = position.coords.longitude.toFixed(6);
                
                // 模擬打卡API請求
                performClockIn(lat, lng);
            },
            function(error) {
                console.warn('無法獲取位置:', error.message);
                // 即使沒有位置也允許打卡
                performClockIn('未知', '未知');
            }
        );
    } else {
        console.warn('瀏覽器不支援地理位置');
        performClockIn('不支援', '不支援');
    }
}

/**
 * 執行打卡操作
 */
function performClockIn(lat, lng) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('zh-TW');
    
    // 判斷打卡類型
    const hour = now.getHours();
    let clockType = '上班';
    if (hour >= 12 && hour < 13) {
        clockType = '午休';
    } else if (hour >= 18) {
        clockType = '下班';
    }
    
    console.log(`📍 ${clockType}打卡成功 - ${timeStr}`);
    console.log(`📍 位置: ${lat}, ${lng}`);
    
    // 更新打卡記錄顯示
    updateAttendanceDisplay(clockType, timeStr, `${lat}, ${lng}`);
    
    // 顯示成功通知
    showNotification(`${clockType}打卡成功！時間: ${timeStr}`, 'success');
    
    // 發送飛機通知
    sendFlightNotification('CLOCK_IN', {
        name: currentUser.name,
        time: timeStr,
        location: currentUser.store,
        type: clockType,
        coordinates: `${lat}, ${lng}`
    });
}

/**
 * 新增營收記錄
 */
function addRevenue() {
    console.log('💰 新增營收記錄...');
    
    // 簡單的營收輸入對話框
    const amount = prompt('請輸入營收金額（新台幣）：');
    
    if (amount && !isNaN(amount) && parseFloat(amount) > 0) {
        const revenue = parseFloat(amount);
        const now = new Date();
        const timeStr = now.toLocaleString('zh-TW');
        
        console.log(`💰 新增營收: $${revenue} - ${timeStr}`);
        
        // 模擬保存到系統
        saveRevenueRecord(revenue, timeStr);
        
        showNotification(`成功新增營收記錄: $${revenue.toLocaleString()}`, 'success');
        
        // 發送飛機通知
        sendFlightNotification('REVENUE_ADD', {
            employee: currentUser.name,
            amount: revenue.toLocaleString(),
            category: '手動輸入',
            time: timeStr
        });
    } else {
        showNotification('請輸入有效的金額', 'error');
    }
}

/**
 * 保存營收記錄
 */
function saveRevenueRecord(amount, timestamp) {
    // 模擬API請求
    const revenueData = {
        amount: amount,
        timestamp: timestamp,
        employee: currentUser.name,
        store: currentUser.store,
        category: '現金銷售'
    };
    
    console.log('💾 保存營收記錄:', revenueData);
    
    // 這裡可以發送到後端API
    // fetch('/api/revenue', { method: 'POST', ... })
}

/**
 * 查看個人資料
 */
function viewProfile() {
    console.log('👤 查看個人資料...');
    
    // 顯示個人資料對話框
    const profileInfo = `
        姓名: ${currentUser.name}
        職位: ${currentUser.position}
        店鋪: ${currentUser.store}
        員工編號: ${currentUser.id}
    `;
    
    alert('個人資料\n' + profileInfo);
    
    // 也可以導向個人資料頁面
    // window.location.href = '/profile';
}

/**
 * 載入考勤記錄
 */
function loadAttendanceRecords() {
    console.log('📋 載入考勤記錄...');
    
    const attendanceContainer = document.getElementById('attendanceRecords');
    
    if (attendanceContainer) {
        // 模擬考勤記錄數據
        const records = [
            { time: '08:30', type: '上班', location: '台北店', status: '正常' },
            { time: '12:00', type: '午休', location: '台北店', status: '正常' },
            { time: '13:00', type: '上班', location: '台北店', status: '正常' }
        ];
        
        let html = '<div class="table-responsive">';
        html += '<table class="table table-striped">';
        html += '<thead><tr><th>時間</th><th>類型</th><th>地點</th><th>狀態</th></tr></thead>';
        html += '<tbody>';
        
        records.forEach(record => {
            html += `<tr>
                <td>${record.time}</td>
                <td><span class="badge bg-primary">${record.type}</span></td>
                <td>${record.location}</td>
                <td><span class="badge bg-success">${record.status}</span></td>
            </tr>`;
        });
        
        html += '</tbody></table></div>';
        
        attendanceContainer.innerHTML = html;
    }
}

/**
 * 更新打卡記錄顯示
 */
function updateAttendanceDisplay(type, time, location) {
    const attendanceContainer = document.getElementById('attendanceRecords');
    
    if (attendanceContainer) {
        const table = attendanceContainer.querySelector('tbody');
        if (table) {
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td>${time}</td>
                <td><span class="badge bg-info">${type}</span></td>
                <td>${location}</td>
                <td><span class="badge bg-success">已記錄</span></td>
            `;
            
            // 插入到表格頂部
            table.insertBefore(newRow, table.firstChild);
        }
    }
}

/**
 * 顯示通知訊息
 */
function showNotification(message, type = 'info') {
    console.log(`📢 ${type.toUpperCase()}: ${message}`);
    
    // 創建通知元素
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.zIndex = '9999';
    notification.style.minWidth = '300px';
    
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
    `;
    
    document.body.appendChild(notification);
    
    // 3秒後自動移除
    setTimeout(() => {
        if (notification && notification.parentElement) {
            notification.remove();
        }
    }, 3000);
}

/**
 * 登出功能
 */
function logout() {
    console.log('🚪 用戶登出...');
    
    if (confirm('確定要登出嗎？')) {
        showNotification('登出成功', 'info');
        
        // 清除用戶數據
        currentUser = null;
        
        // 導向登入頁面
        setTimeout(() => {
            window.location.href = '/login';
        }, 1000);
    }
}

/**
 * 工具函數：格式化日期
 */
function formatDate(date) {
    return date.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

/**
 * 工具函數：格式化時間
 */
function formatTime(date) {
    return date.toLocaleTimeString('zh-TW', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// 飛機通知系統
async function sendFlightNotification(type, data) {
    try {
        const telegramBotToken = '7659930552:AAF_jF1rAXFnjFO176-9X5fKfBwbrko8BNc';
        const chatId = '-1002658082392';
        
        let message = '';
        switch (type) {
            case 'CLOCK_IN':
                message = `✈️ 員工打卡通知\n👤 員工：${data.name}\n⏰ 打卡時間：${data.time}\n📍 地點：${data.location}\n🎯 類型：${data.type}`;
                break;
            case 'REVENUE_ADD':
                message = `✈️ 營收記錄通知\n👤 記錄員工：${data.employee}\n💰 金額：NT$${data.amount}\n📊 類別：${data.category}\n⏰ 時間：${data.time}`;
                break;
            case 'SYSTEM_ACTION':
                message = `✈️ 系統操作通知\n👤 用戶：${data.user}\n🔧 操作：${data.action}\n⏰ 時間：${data.time}`;
                break;
        }
        
        const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML'
            })
        });
        
        if (response.ok) {
            console.log('📱 飛機通知發送成功');
        }
    } catch (error) {
        console.log('📱 飛機通知發送失敗:', error);
    }
}

// 導出函數供其他腳本使用
window.EmployeeManagement = {
    quickClockIn,
    addRevenue,
    viewProfile,
    showNotification,
    logout,
    sendFlightNotification
};

console.log('✅ app.js 載入完成 - 企業員工管理系統就緒！');