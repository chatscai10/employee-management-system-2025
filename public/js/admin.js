/**
 * ==========================================
 * 管理員控制台前端JavaScript
 * ==========================================
 * 基於系統邏輯.txt規格 - 25項管理功能
 */

class AdminDashboard {
    constructor() {
        this.init();
        this.currentTab = 'dashboard';
        this.employeeChart = null;
    }

    init() {
        this.bindEvents();
        this.checkAuth();
    }

    bindEvents() {
        // 登入表單
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }

        // 密碼顯示切換
        const togglePassword = document.getElementById('togglePassword');
        if (togglePassword) {
            togglePassword.addEventListener('click', this.togglePasswordVisibility);
        }

        // 登出按鈕
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.handleLogout.bind(this));
        }

        // 側邊欄導航
        document.querySelectorAll('[data-tab]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = e.currentTarget.getAttribute('data-tab');
                this.switchTab(tabName);
            });
        });

        // 側邊欄切換 (手機版)
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', this.toggleSidebar);
        }

        // 刷新按鈕
        const refreshDashboard = document.getElementById('refreshDashboard');
        if (refreshDashboard) {
            refreshDashboard.addEventListener('click', this.loadDashboardData.bind(this));
        }

        const refreshEmployees = document.getElementById('refreshEmployees');
        if (refreshEmployees) {
            refreshEmployees.addEventListener('click', this.loadEmployees.bind(this));
        }

        // 員工搜尋
        const searchEmployees = document.getElementById('searchEmployees');
        if (searchEmployees) {
            searchEmployees.addEventListener('click', this.searchEmployees.bind(this));
        }

        // 員工搜尋輸入框 Enter 鍵
        const employeeSearch = document.getElementById('employeeSearch');
        if (employeeSearch) {
            employeeSearch.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchEmployees();
                }
            });
        }
    }

    // 檢查認證狀態
    checkAuth() {
        const isLoggedIn = localStorage.getItem('adminLoggedIn');
        if (isLoggedIn === 'true') {
            this.showAdminPage();
        } else {
            this.showLoginPage();
        }
    }

    // 顯示登入頁面
    showLoginPage() {
        document.getElementById('loginPage').classList.remove('d-none');
        document.getElementById('adminPage').classList.add('d-none');
    }

    // 顯示管理員頁面
    showAdminPage() {
        document.getElementById('loginPage').classList.add('d-none');
        document.getElementById('adminPage').classList.remove('d-none');
        this.loadDashboardData();
        this.loadStoreOptions();
    }

    // 處理登入
    async handleLogin(e) {
        e.preventDefault();
        
        const loginBtn = document.getElementById('loginBtn');
        const originalText = loginBtn.innerHTML;
        
        // 設定載入狀態
        loginBtn.innerHTML = '<i class="bi bi-hourglass-half me-2"></i>登入中...';
        loginBtn.disabled = true;
        
        const formData = new FormData(e.target);
        const loginData = {
            username: formData.get('username'),
            password: formData.get('password')
        };

        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });

            const result = await response.json();

            if (result.success) {
                localStorage.setItem('adminLoggedIn', 'true');
                this.showAdminPage();
                this.showAlert('success', '登入成功！');
            } else {
                this.showLoginAlert(result.message || '登入失敗');
            }
        } catch (error) {
            console.error('登入錯誤:', error);
            this.showLoginAlert('網路錯誤，請稍後再試');
        } finally {
            // 恢復按鈕狀態
            loginBtn.innerHTML = originalText;
            loginBtn.disabled = false;
        }
    }

    // 處理登出
    async handleLogout() {
        try {
            await fetch('/api/admin/logout', {
                method: 'POST'
            });
        } catch (error) {
            console.error('登出錯誤:', error);
        }
        
        localStorage.removeItem('adminLoggedIn');
        this.showLoginPage();
    }

    // 切換密碼顯示
    togglePasswordVisibility() {
        const passwordInput = document.getElementById('password');
        const toggleIcon = document.querySelector('#togglePassword i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.className = 'bi bi-eye-slash';
        } else {
            passwordInput.type = 'password';
            toggleIcon.className = 'bi bi-eye';
        }
    }

    // 切換側邊欄 (手機版)
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('show');
    }

    // 切換標籤頁
    switchTab(tabName) {
        // 更新側邊欄active狀態
        document.querySelectorAll('.sidebar .nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // 切換內容頁面
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.getElementById(`${tabName}Tab`).classList.add('active');

        this.currentTab = tabName;

        // 載入對應頁面數據
        switch (tabName) {
            case 'dashboard':
                this.loadDashboardData();
                break;
            case 'employees':
                this.loadEmployees();
                break;
            case 'stores':
                this.loadStores();
                break;
            case 'attendance':
                this.loadAttendanceRecords();
                break;
            case 'revenue':
                this.loadRevenueRecords();
                break;
        }

        // 隱藏手機版側邊欄
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.remove('show');
    }

    // 載入儀表板數據
    async loadDashboardData() {
        try {
            const response = await fetch('/api/admin/dashboard');
            const result = await response.json();

            if (result.success) {
                const data = result.data;
                
                // 更新統計卡片
                document.getElementById('totalEmployees').textContent = data.totalEmployees;
                document.getElementById('pendingEmployees').textContent = data.pendingEmployees;
                document.getElementById('todayAttendance').textContent = data.todayAttendance;
                document.getElementById('todayRevenue').textContent = `$${data.todayRevenue}`;

                // 更新圖表
                this.updateEmployeeChart(data.storeEmployees);
            }
        } catch (error) {
            console.error('載入儀表板數據失敗:', error);
        }
    }

    // 更新員工分店分佈圖表
    updateEmployeeChart(storeData) {
        const ctx = document.getElementById('storeEmployeeChart');
        if (!ctx) return;

        if (this.employeeChart) {
            this.employeeChart.destroy();
        }

        const labels = storeData.map(item => item.currentStore);
        const data = storeData.map(item => parseInt(item.count));

        this.employeeChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: '員工數量',
                    data: data,
                    backgroundColor: [
                        'rgba(13, 110, 253, 0.8)',
                        'rgba(25, 135, 84, 0.8)',
                        'rgba(255, 193, 7, 0.8)',
                        'rgba(220, 53, 69, 0.8)'
                    ],
                    borderColor: [
                        'rgba(13, 110, 253, 1)',
                        'rgba(25, 135, 84, 1)',
                        'rgba(255, 193, 7, 1)',
                        'rgba(220, 53, 69, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    // 載入員工列表
    async loadEmployees() {
        const tbody = document.getElementById('employeeList');
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4">
                    <div class="spinner-border" role="status">
                        <span class="visually-hidden">載入中...</span>
                    </div>
                </td>
            </tr>
        `;

        try {
            const response = await fetch('/api/admin/employees');
            const result = await response.json();

            if (result.success) {
                this.renderEmployeeList(result.data);
            } else {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center py-4 text-danger">
                            載入失敗: ${result.message}
                        </td>
                    </tr>
                `;
            }
        } catch (error) {
            console.error('載入員工列表失敗:', error);
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4 text-danger">
                        網路錯誤，請稍後再試
                    </td>
                </tr>
            `;
        }
    }

    // 渲染員工列表
    renderEmployeeList(employees) {
        const tbody = document.getElementById('employeeList');
        
        if (employees.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4 text-muted">
                        沒有找到員工資料
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = employees.map(employee => `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="employee-avatar me-3">
                            ${employee.name.charAt(0)}
                        </div>
                        <div>
                            <div class="fw-bold">${employee.name}</div>
                            <small class="text-muted">${employee.idNumber}</small>
                        </div>
                    </div>
                </td>
                <td>
                    <div>${employee.phone}</div>
                    <small class="text-muted">${employee.address.substring(0, 20)}...</small>
                </td>
                <td>
                    <div><strong>${employee.currentStore}</strong></div>
                    <div>
                        <span class="badge bg-info">${employee.position}</span>
                    </div>
                    <small class="text-muted">到職: ${new Date(employee.hireDate).toLocaleDateString('zh-TW')}</small>
                </td>
                <td>
                    <span class="badge status-badge ${this.getStatusBadgeClass(employee.status)}">
                        ${employee.status}
                    </span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="admin.editEmployee(${employee.id})">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-info" onclick="admin.viewEmployeeDetails(${employee.id})">
                            <i class="bi bi-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // 獲取狀態徽章樣式
    getStatusBadgeClass(status) {
        switch (status) {
            case '在職': return 'bg-success';
            case '審核中': return 'bg-warning';
            case '離職': return 'bg-secondary';
            default: return 'bg-secondary';
        }
    }

    // 搜尋員工
    async searchEmployees() {
        const searchBtn = document.getElementById('searchEmployees');
        const originalText = searchBtn.innerHTML;
        
        searchBtn.innerHTML = '<i class="bi bi-hourglass-half"></i>';
        searchBtn.disabled = true;

        try {
            const name = document.getElementById('employeeSearch').value;
            const store = document.getElementById('employeeStoreFilter').value;
            const status = document.getElementById('employeeStatusFilter').value;

            const params = new URLSearchParams();
            if (name) params.append('name', name);
            if (store) params.append('store', store);
            if (status) params.append('status', status);

            const response = await fetch(`/api/admin/employees/search?${params}`);
            const result = await response.json();

            if (result.success) {
                this.renderEmployeeList(result.data);
            }
        } catch (error) {
            console.error('搜尋員工失敗:', error);
        } finally {
            searchBtn.innerHTML = originalText;
            searchBtn.disabled = false;
        }
    }

    // 載入分店選項
    async loadStoreOptions() {
        try {
            const response = await fetch('/api/admin/stores');
            const result = await response.json();

            if (result.success) {
                const storeSelects = document.querySelectorAll('#employeeStoreFilter, #employeeCurrentStore');
                storeSelects.forEach(select => {
                    const currentValue = select.value;
                    select.innerHTML = '<option value="">請選擇</option>' + 
                        result.data.map(store => 
                            `<option value="${store.name}" ${currentValue === store.name ? 'selected' : ''}>${store.name}</option>`
                        ).join('');
                });
            }
        } catch (error) {
            console.error('載入分店選項失敗:', error);
        }
    }

    // 編輯員工
    editEmployee(employeeId) {
        // TODO: 實現員工編輯功能
        console.log('編輯員工:', employeeId);
        this.showAlert('info', '員工編輯功能開發中...');
    }

    // 查看員工詳細資料
    viewEmployeeDetails(employeeId) {
        // TODO: 實現員工詳細資料查看功能
        console.log('查看員工詳細資料:', employeeId);
        this.showAlert('info', '員工詳細資料查看功能開發中...');
    }

    // 載入分店列表
    loadStores() {
        console.log('載入分店列表...');
        // TODO: 實現分店管理功能
    }

    // 載入打卡記錄
    loadAttendanceRecords() {
        console.log('載入打卡記錄...');
        // TODO: 實現打卡記錄管理功能
    }

    // 載入營收記錄
    loadRevenueRecords() {
        console.log('載入營收記錄...');
        // TODO: 實現營收記錄管理功能
    }

    // 顯示登入錯誤訊息
    showLoginAlert(message) {
        const alertDiv = document.getElementById('loginAlert');
        alertDiv.textContent = message;
        alertDiv.style.display = 'block';
        
        setTimeout(() => {
            alertDiv.style.display = 'none';
        }, 5000);
    }

    // 顯示通用訊息
    showAlert(type, message) {
        // 創建 toast 訊息
        const toastContainer = document.getElementById('toastContainer') || this.createToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-bg-${type} border-0`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

        toastContainer.appendChild(toast);
        
        const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
        bsToast.show();

        // 移除已顯示的 toast
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    }

    // 創建 toast 容器
    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        document.body.appendChild(container);
        return container;
    }
}

// 初始化管理員系統
const admin = new AdminDashboard();

// 暴露到全域範圍供HTML使用
window.admin = admin;