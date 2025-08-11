# 🏢 企業員工管理系統 - 完整修復規劃與實現方案

## 📋 修復規劃總覽

**目標**: 將系統從功能原型升級為完整符合系統邏輯.txt的企業級系統  
**時程**: 4週分階段實現  
**驗證標準**: 智慧瀏覽器測試 + 系統邏輯合規檢查達到90%+  

## 🔥 第一階段：管理員系統完整修復 (1週)

### 📊 **當前狀況分析**
- **現狀**: admin.html存在但僅1/8功能可見
- **問題**: 缺少7大核心管理功能模組
- **影響**: 管理員無法進行企業級系統管理

### 🎯 **修復目標**
實現完整8大管理功能模組，符合系統邏輯.txt規格

### 🛠️ **具體修復方案**

#### 1.1 完善管理員頁面架構
```html
<!-- admin.html 需要添加的8大功能模組 -->
<div class="admin-dashboard">
    <nav class="admin-nav">
        <a href="#employee-management" class="nav-link active">員工管理</a>
        <a href="#inventory-management" class="nav-link">庫存管理</a>  
        <a href="#revenue-management" class="nav-link">營收管理</a>
        <a href="#schedule-management" class="nav-link">排班系統</a>
        <a href="#promotion-management" class="nav-link">升遷投票</a>
        <a href="#system-settings" class="nav-link">系統設定</a>
        <a href="#reports-analytics" class="nav-link">報表功能</a>
        <a href="#maintenance-management" class="nav-link">維修管理</a>
    </nav>
    
    <!-- 8個功能模組內容區 -->
    <div class="admin-content">
        <!-- 員工管理模組 -->
        <div id="employee-management" class="admin-module active">
            <h2>員工管理系統</h2>
            <!-- 員工資料表格 + CRUD操作 -->
        </div>
        <!-- ...其他7個模組 -->
    </div>
</div>
```

#### 1.2 實現員工管理CRUD系統
```javascript
// 員工管理功能實現
class EmployeeManagement {
    constructor() {
        this.employeeList = [];
        this.currentEmployee = null;
    }
    
    // 載入員工列表
    async loadEmployeeList() {
        const response = await fetch('/api/admin/employees');
        this.employeeList = await response.json();
        this.renderEmployeeTable();
    }
    
    // 新增員工
    async createEmployee(employeeData) {
        const response = await fetch('/api/admin/employees', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(employeeData)
        });
        return response.json();
    }
    
    // 編輯員工
    async updateEmployee(id, employeeData) {
        const response = await fetch(`/api/admin/employees/${id}`, {
            method: 'PUT', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(employeeData)
        });
        return response.json();
    }
    
    // 刪除員工
    async deleteEmployee(id) {
        const response = await fetch(`/api/admin/employees/${id}`, {
            method: 'DELETE'
        });
        return response.json();
    }
}
```

#### 1.3 後端API端點實現
```javascript
// server-intermediate.js 需要添加的管理員API
app.get('/api/admin/employees', (req, res) => {
    // 返回員工列表 (符合11個欄位要求)
    res.json({
        success: true,
        employees: [
            {
                id: 1,
                name: '張三',
                idNumber: 'A123456789',
                birthDate: '1990-01-01',
                gender: '男',
                hasDriverLicense: true,
                phone: '0912345678',
                address: '台北市信義區',
                emergencyContactName: '張父',
                emergencyContactRelation: '父親',
                emergencyContactPhone: '0987654321',
                hireDate: '2024-01-01',
                position: '員工',
                status: '在職'
            }
        ]
    });
});

app.post('/api/admin/employees', (req, res) => {
    // 新增員工 (驗證11個必填欄位)
    const requiredFields = [
        'name', 'idNumber', 'birthDate', 'gender', 'hasDriverLicense',
        'phone', 'address', 'emergencyContactName', 'emergencyContactRelation',
        'emergencyContactPhone', 'hireDate'
    ];
    
    for (const field of requiredFields) {
        if (!req.body[field]) {
            return res.status(400).json({
                success: false,
                error: `缺少必填欄位: ${field}`
            });
        }
    }
    
    // 實際新增邏輯
    res.json({ success: true, message: '員工新增成功' });
});
```

### 🎯 **第一階段驗證標準**
- ✅ 管理員頁面包含8個功能模組
- ✅ 員工管理CRUD操作完整可用
- ✅ API端點回應符合系統邏輯要求
- ✅ 智慧瀏覽器測試通過率 ≥ 75%

## ⭐ 第二階段：CRUD操作技術修復 (3-5天)

### 📊 **已識別的技術問題**
```javascript
// 需要修復的具體問題
const technicalIssues = [
    {
        issue: '營收提交按鈕未找到',
        selector: '#revenue-form button[type="submit"]',
        fix: '統一表單按鈕命名規範'
    },
    {
        issue: '維修申請點擊元素不可操作', 
        problem: 'Node is either not clickable or not an Element',
        fix: '修復DOM元素事件綁定'
    },
    {
        issue: '個人資料編輯欄位未找到',
        problem: '未找到可編輯的個人資料欄位',
        fix: '添加個人資料編輯表單'
    }
];
```

### 🛠️ **修復方案**

#### 2.1 統一表單Selector規範
```html
<!-- 所有表單統一使用標準命名 -->
<form id="revenue-form" class="admin-form">
    <input type="number" name="amount" required>
    <select name="category" required>
        <option value="門市銷售">門市銷售</option>
        <option value="線上銷售">線上銷售</option>
    </select>
    <textarea name="description"></textarea>
    <button type="submit" class="btn btn-primary submit-btn">提交營收</button>
</form>

<!-- 維修申請表單 -->
<form id="maintenance-form" class="admin-form">
    <input type="text" name="description" required>
    <select name="priority" required>
        <option value="low">低</option>
        <option value="medium">中</option>
        <option value="high">高</option>
    </select>
    <button type="submit" class="btn btn-warning submit-btn">提交維修申請</button>
</form>
```

#### 2.2 修復JavaScript事件處理
```javascript
// 統一的表單提交處理
document.addEventListener('DOMContentLoaded', function() {
    // 營收表單提交
    const revenueForm = document.getElementById('revenue-form');
    if (revenueForm) {
        revenueForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const data = Object.fromEntries(formData.entries());
            
            try {
                const response = await fetch('/api/revenue', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                if (result.success) {
                    showSuccessMessage('營收記錄新增成功');
                    this.reset();
                } else {
                    showErrorMessage('營收記錄新增失敗: ' + result.error);
                }
            } catch (error) {
                showErrorMessage('提交失敗: ' + error.message);
            }
        });
    }
    
    // 維修申請表單提交
    const maintenanceForm = document.getElementById('maintenance-form');
    if (maintenanceForm) {
        maintenanceForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const data = Object.fromEntries(formData.entries());
            
            try {
                const response = await fetch('/api/maintenance/requests', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                if (result.success) {
                    showSuccessMessage('維修申請提交成功');
                    this.reset();
                } else {
                    showErrorMessage('維修申請提交失敗: ' + result.error);
                }
            } catch (error) {
                showErrorMessage('提交失敗: ' + error.message);
            }
        });
    }
});

// 統一的訊息顯示函數
function showSuccessMessage(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-success';
    alert.textContent = message;
    document.body.appendChild(alert);
    setTimeout(() => alert.remove(), 3000);
}

function showErrorMessage(message) {
    const alert = document.createElement('div'); 
    alert.className = 'alert alert-danger';
    alert.textContent = message;
    document.body.appendChild(alert);
    setTimeout(() => alert.remove(), 5000);
}
```

### 🎯 **第二階段驗證標準**
- ✅ 所有CRUD操作成功率 ≥ 90%
- ✅ 表單提交無技術錯誤
- ✅ 用戶操作回饋及時準確
- ✅ 錯誤處理機制完善

## 🚀 第三階段：智慧排班6重規則引擎實現 (1週)

### 📊 **系統邏輯要求分析**
```javascript
// 系統邏輯.txt要求的6重規則引擎
const scheduleRuleEngine = {
    rules: [
        '1. 基本時段檢查 - 驗證排班時段有效性',
        '2. 員工可用性檢查 - 確認員工當日可工作', 
        '3. 最低人力要求 - 保證每時段基本人力',
        '4. 連續工作限制 - 避免過度勞累',
        '5. 公平性分配 - 均衡工作時數分配',
        '6. 特殊需求處理 - 處理請假、調班等需求'
    ]
};
```

### 🛠️ **智慧排班系統實現**

#### 3.1 排班規則引擎核心邏輯
```javascript
class SmartSchedulingEngine {
    constructor() {
        this.rules = [];
        this.employees = [];
        this.schedules = [];
        this.constraints = {};
    }
    
    // 規則1: 基本時段檢查
    validateTimeSlot(timeSlot) {
        const { startTime, endTime, date } = timeSlot;
        
        // 檢查時間格式
        if (!this.isValidTimeFormat(startTime, endTime)) {
            return { valid: false, reason: '時間格式錯誤' };
        }
        
        // 檢查工作時間範圍 (09:00-18:00)
        if (!this.isWithinWorkingHours(startTime, endTime)) {
            return { valid: false, reason: '超出工作時間範圍' };
        }
        
        return { valid: true };
    }
    
    // 規則2: 員工可用性檢查
    checkEmployeeAvailability(employeeId, date, timeSlot) {
        const employee = this.getEmployee(employeeId);
        
        // 檢查員工狀態
        if (employee.status !== '在職') {
            return { available: false, reason: '員工非在職狀態' };
        }
        
        // 檢查請假記錄
        if (this.hasLeaveRequest(employeeId, date)) {
            return { available: false, reason: '員工已請假' };
        }
        
        // 檢查既有排班衝突
        if (this.hasScheduleConflict(employeeId, date, timeSlot)) {
            return { available: false, reason: '排班時間衝突' };
        }
        
        return { available: true };
    }
    
    // 規則3: 最低人力要求
    checkMinimumStaffing(date, timeSlot, assignedEmployees) {
        const minimumRequired = this.getMinimumStaffing(timeSlot);
        
        if (assignedEmployees.length < minimumRequired) {
            return { 
                satisfied: false, 
                reason: `需要最少${minimumRequired}人，目前僅有${assignedEmployees.length}人`,
                shortfall: minimumRequired - assignedEmployees.length
            };
        }
        
        return { satisfied: true };
    }
    
    // 規則4: 連續工作限制
    checkConsecutiveWorkLimit(employeeId, proposedSchedule) {
        const consecutiveLimit = 6; // 最多連續工作6天
        const recentSchedules = this.getRecentSchedules(employeeId, 7);
        
        // 計算連續工作天數
        let consecutiveDays = 0;
        for (let i = recentSchedules.length - 1; i >= 0; i--) {
            if (recentSchedules[i].hasWork) {
                consecutiveDays++;
            } else {
                break;
            }
        }
        
        if (consecutiveDays >= consecutiveLimit) {
            return { 
                allowed: false, 
                reason: `員工已連續工作${consecutiveDays}天，需要休息` 
            };
        }
        
        return { allowed: true };
    }
    
    // 規則5: 公平性分配
    checkFairnessDistribution(employeeId, proposedSchedule) {
        const allEmployees = this.getActiveEmployees();
        const currentMonthHours = this.getMonthlyHours(employeeId);
        const averageHours = this.getAverageMonthlyHours(allEmployees);
        
        // 如果員工工時已超過平均值太多，降低分配優先級
        if (currentMonthHours > averageHours * 1.2) {
            return { 
                fair: false, 
                reason: '員工工時已超過平均值，建議分配給工時較少的員工',
                currentHours: currentMonthHours,
                averageHours: averageHours
            };
        }
        
        return { fair: true };
    }
    
    // 規則6: 特殊需求處理
    handleSpecialRequests(employeeId, date, specialRequests) {
        const results = [];
        
        for (const request of specialRequests) {
            switch (request.type) {
                case '請假':
                    results.push(this.processLeaveRequest(employeeId, request));
                    break;
                case '調班':
                    results.push(this.processShiftSwapRequest(employeeId, request));
                    break;
                case '加班':
                    results.push(this.processOvertimeRequest(employeeId, request));
                    break;
                default:
                    results.push({ 
                        handled: false, 
                        reason: `未知的特殊需求類型: ${request.type}` 
                    });
            }
        }
        
        return results;
    }
    
    // 綜合排班決策
    generateOptimalSchedule(date, requirements) {
        const availableEmployees = this.getAvailableEmployees(date);
        const timeSlots = requirements.timeSlots;
        const schedule = [];
        
        for (const slot of timeSlots) {
            const assignments = [];
            
            // 為每個時段分配員工
            for (const employee of availableEmployees) {
                // 通過6重規則檢查
                const ruleResults = this.runAllRules(employee.id, date, slot);
                
                if (ruleResults.allPassed) {
                    assignments.push({
                        employeeId: employee.id,
                        name: employee.name,
                        position: employee.position,
                        score: ruleResults.score
                    });
                }
            }
            
            // 按分數排序並選擇最佳員工
            assignments.sort((a, b) => b.score - a.score);
            const selectedEmployees = assignments.slice(0, slot.requiredStaff);
            
            schedule.push({
                timeSlot: slot,
                assignedEmployees: selectedEmployees,
                status: selectedEmployees.length >= slot.minimumStaff ? 'fulfilled' : 'understaffed'
            });
        }
        
        return schedule;
    }
    
    // 執行所有規則檢查
    runAllRules(employeeId, date, timeSlot) {
        let score = 100;
        const results = {};
        
        // 規則1: 時段檢查
        results.timeSlot = this.validateTimeSlot(timeSlot);
        if (!results.timeSlot.valid) return { allPassed: false, reason: results.timeSlot.reason };
        
        // 規則2: 員工可用性
        results.availability = this.checkEmployeeAvailability(employeeId, date, timeSlot);
        if (!results.availability.available) return { allPassed: false, reason: results.availability.reason };
        
        // 規則3: 最低人力 (在最終分配時檢查)
        
        // 規則4: 連續工作限制
        results.consecutive = this.checkConsecutiveWorkLimit(employeeId, { date, timeSlot });
        if (!results.consecutive.allowed) {
            score -= 30;
        }
        
        // 規則5: 公平性分配
        results.fairness = this.checkFairnessDistribution(employeeId, { date, timeSlot });
        if (!results.fairness.fair) {
            score -= 20;
        }
        
        // 規則6: 特殊需求 (已在可用性檢查中處理)
        
        return { 
            allPassed: true, 
            score: score, 
            details: results 
        };
    }
}
```

### 🎯 **第三階段驗證標準**
- ✅ 6重規則引擎完整實現
- ✅ 排班邏輯符合系統邏輯.txt要求
- ✅ 自動化排班功能正常運作
- ✅ 特殊情況處理機制完善

## 📊 第四階段：升遷投票自動化系統完善 (1週)

### 📊 **系統邏輯要求分析**
```javascript
// 系統邏輯.txt要求的複雜投票系統
const votingSystemRequirements = {
    anonymousVoting: 'SHA-256加密保護投票者身份',
    candidateAnonymization: 'CANDIDATE_X_001格式匿名ID',
    voteModification: '每人每次投票可修改3次',
    autoNewEmployeeVoting: '到職滿20天自動觸發轉正投票',
    autoDisciplinaryVoting: '遲到超標自動觸發降職投票',
    telegramNotifications: '29種通知模板',
    multipleVotingManagement: '多重投票管理系統'
};
```

### 🛠️ **升遷投票系統實現**

#### 4.1 匿名投票加密系統
```javascript
const crypto = require('crypto');

class AnonymousVotingSystem {
    constructor() {
        this.votingSessions = new Map();
        this.anonymousMapping = new Map();
    }
    
    // 創建匿名投票會話
    createVotingSession(campaignId, voters, candidates) {
        const sessionId = this.generateSessionId();
        
        // 生成匿名選民ID
        const anonymousVoters = voters.map((voter, index) => {
            const anonymousId = this.generateAnonymousVoterId(voter.id, sessionId);
            this.anonymousMapping.set(anonymousId, {
                realId: voter.id,
                sessionId: sessionId,
                hashedId: crypto.createHash('sha256').update(`${voter.id}_${sessionId}`).digest('hex')
            });
            return { anonymousId, originalIndex: index };
        });
        
        // 生成匿名候選人ID
        const anonymousCandidates = candidates.map((candidate, index) => {
            const anonymousId = `CANDIDATE_${String.fromCharCode(65 + index)}_${String(index + 1).padStart(3, '0')}`;
            return {
                anonymousId,
                realId: candidate.id,
                name: candidate.name, // 內部使用，前端不顯示
                position: candidate.position
            };
        });
        
        const votingSession = {
            sessionId,
            campaignId,
            anonymousVoters,
            anonymousCandidates,
            votes: new Map(),
            voteModifications: new Map(),
            createdAt: new Date()
        };
        
        this.votingSessions.set(sessionId, votingSession);
        return votingSession;
    }
    
    // 提交匿名投票
    submitAnonymousVote(sessionId, anonymousVoterId, candidateId, voteData) {
        const session = this.votingSessions.get(sessionId);
        if (!session) {
            throw new Error('投票會話不存在');
        }
        
        // 檢查投票者身份
        const voterMapping = this.anonymousMapping.get(anonymousVoterId);
        if (!voterMapping || voterMapping.sessionId !== sessionId) {
            throw new Error('無效的投票者身份');
        }
        
        // 檢查修改次數限制
        const modificationCount = session.voteModifications.get(anonymousVoterId) || 0;
        if (session.votes.has(anonymousVoterId) && modificationCount >= 3) {
            throw new Error('已達到最大修改次數限制 (3次)');
        }
        
        // 記錄投票
        const voteRecord = {
            anonymousVoterId,
            candidateId,
            voteData,
            timestamp: new Date(),
            modificationCount: session.votes.has(anonymousVoterId) ? modificationCount + 1 : 0,
            encryptedVoterHash: crypto.createHash('sha256')
                .update(`${anonymousVoterId}_${candidateId}_${Date.now()}`)
                .digest('hex')
        };
        
        session.votes.set(anonymousVoterId, voteRecord);
        session.voteModifications.set(anonymousVoterId, voteRecord.modificationCount);
        
        return {
            success: true,
            voteId: voteRecord.encryptedVoterHash,
            remainingModifications: 3 - voteRecord.modificationCount
        };
    }
}
```

#### 4.2 自動投票觸發系統
```javascript
class AutoVotingTriggerSystem {
    constructor() {
        this.attendanceStats = new Map();
        this.employeeHireDates = new Map();
    }
    
    // 每日定時任務 - 檢查新人轉正條件
    async checkNewEmployeePromotion() {
        const today = new Date();
        const twentyDaysAgo = new Date(today.getTime() - (20 * 24 * 60 * 60 * 1000));
        
        // 查詢到職滿20天的實習生
        const eligibleEmployees = await this.getEmployeesHiredOn(twentyDaysAgo);
        const interns = eligibleEmployees.filter(emp => emp.position === '實習生');
        
        for (const intern of interns) {
            // 檢查是否已有進行中的轉正投票
            const hasOngoingVote = await this.hasOngoingPromotionVote(intern.id);
            if (!hasOngoingVote) {
                await this.triggerNewEmployeeVoting(intern);
            }
        }
    }
    
    // 觸發新人轉正投票
    async triggerNewEmployeeVoting(employee) {
        const campaign = {
            type: 'NEW_EMPLOYEE_PROMOTION',
            targetEmployeeId: employee.id,
            title: `${employee.name} 轉正投票`,
            description: `${employee.name} 已到職滿20天，請投票決定是否轉正`,
            duration: 5 * 24 * 60 * 60 * 1000, // 5天
            passThreshold: 0.5, // 50%同意
            startTime: new Date(),
            endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            autoTriggered: true
        };
        
        const campaignId = await this.createVotingCampaign(campaign);
        
        // 發送Telegram通知
        await this.sendTelegramNotification('NEW_EMPLOYEE_PROMOTION_START', {
            employeeName: employee.name,
            hireDate: employee.hireDate,
            campaignId: campaignId,
            endDate: campaign.endTime
        });
        
        return campaignId;
    }
    
    // 每日檢查遲到懲罰條件
    async checkDisciplinaryAction() {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        
        // 獲取本月遲到統計
        const lateStats = await this.getMonthlyLateStatistics(currentYear, currentMonth);
        
        for (const [employeeId, stats] of lateStats) {
            // 檢查懲罰觸發條件
            const shouldTriggerPunishment = 
                stats.totalLateMinutes > 10 || stats.lateCount > 3;
                
            if (shouldTriggerPunishment) {
                // 檢查是否已有進行中的懲罰投票
                const hasOngoingVote = await this.hasOngoingDisciplinaryVote(employeeId);
                if (!hasOngoingVote) {
                    await this.triggerDisciplinaryVoting(employeeId, stats);
                }
            }
        }
    }
    
    // 觸發降職懲罰投票
    async triggerDisciplinaryVoting(employeeId, lateStats) {
        const employee = await this.getEmployee(employeeId);
        
        const campaign = {
            type: 'DISCIPLINARY_ACTION',
            targetEmployeeId: employeeId,
            title: `${employee.name} 降職懲罰投票`,
            description: `${employee.name} 本月遲到${lateStats.lateCount}次，總計${lateStats.totalLateMinutes}分鐘`,
            duration: 3 * 24 * 60 * 60 * 1000, // 3天
            passThreshold: 0.3, // 30%同意即成立
            startTime: new Date(),
            endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            autoTriggered: true,
            punishmentData: lateStats
        };
        
        const campaignId = await this.createVotingCampaign(campaign);
        
        // 發送Telegram通知
        await this.sendTelegramNotification('DISCIPLINARY_ACTION_START', {
            employeeName: employee.name,
            lateCount: lateStats.lateCount,
            totalMinutes: lateStats.totalLateMinutes,
            campaignId: campaignId,
            endDate: campaign.endTime
        });
        
        return campaignId;
    }
    
    // 29種Telegram通知模板系統
    async sendTelegramNotification(templateType, data) {
        const templates = this.getTelegramTemplates();
        const template = templates[templateType];
        
        if (!template) {
            throw new Error(`未找到通知模板: ${templateType}`);
        }
        
        const message = this.renderTemplate(template, data);
        
        // 發送到不同的群組
        const targetGroups = this.getTargetGroups(templateType);
        
        for (const groupId of targetGroups) {
            await this.sendToTelegram(groupId, message);
        }
    }
    
    // 獲取29種通知模板
    getTelegramTemplates() {
        return {
            // 基礎投票通知 (8種)
            'VOTING_START': '🗳️ 投票活動開始\n{title}\n開始時間: {startTime}\n結束時間: {endTime}',
            'VOTING_END': '🗳️ 投票活動結束\n{title}\n投票結果將於稍後公布',
            'VOTING_RESULT': '📊 投票結果公告\n{title}\n同意: {agreeCount}票\n反對: {disagreeCount}票\n結果: {result}',
            'VOTING_REMINDER_24H': '⏰ 投票提醒\n{title}\n距離投票結束還有24小時',
            'VOTING_REMINDER_1H': '🚨 投票最後提醒\n{title}\n距離投票結束還有1小時',
            'VOTE_MODIFIED': '✅ 投票修改確認\n您的投票已成功修改\n剩餘修改次數: {remainingModifications}',
            'VOTING_CONFLICT': '⚠️ 投票衝突警告\n檢測到投票時間重疊\n請確認投票安排',
            'VOTING_QUALIFICATION': '✅ 投票資格確認\n您有權參與投票: {title}',
            
            // 新人轉正通知 (7種)
            'NEW_EMPLOYEE_20_DAYS': '📅 新人到職20天提醒\n員工: {employeeName}\n到職日期: {hireDate}\n建議發起轉正投票',
            'NEW_EMPLOYEE_PROMOTION_START': '🎯 新人轉正投票開始\n員工: {employeeName}\n投票期限: {endDate}\n請全員參與投票',
            'NEW_EMPLOYEE_PROMOTION_SUCCESS': '🎉 轉正投票通過\n恭喜 {employeeName} 轉正成功\n新職位: 員工',
            'NEW_EMPLOYEE_PROMOTION_FAILED': '😔 轉正投票未通過\n{employeeName} 轉正投票未達標準\n將進入30天緩衝期',
            'PROMOTION_BUFFER_START': '⏳ 轉正緩衝期開始\n員工: {employeeName}\n緩衝期: 30天\n期滿可自主申請轉正',
            'PROMOTION_BUFFER_END': '⏰ 轉正緩衝期結束提醒\n員工: {employeeName}\n現可自主申請轉正投票',
            'SELF_PROMOTION_REQUEST': '📝 員工自主轉正申請\n申請人: {employeeName}\n申請時間: {requestTime}',
            
            // 降職懲罰通知 (8種) 
            'LATE_WARNING': '⚠️ 遲到統計警告\n員工: {employeeName}\n本月遲到: {lateCount}次 / {totalMinutes}分鐘\n接近觸發懲罰標準',
            'DISCIPLINARY_TRIGGER': '🚨 降職懲罰投票觸發\n員工: {employeeName}\n遲到統計: {lateCount}次 / {totalMinutes}分鐘\n將自動發起懲罰投票',
            'DISCIPLINARY_ACTION_START': '⚖️ 降職懲罰投票開始\n員工: {employeeName}\n遲到記錄: {lateCount}次 / {totalMinutes}分鐘\n投票期限: {endDate}',
            'DISCIPLINARY_ACTION_APPROVED': '⚖️ 懲罰投票通過\n員工: {employeeName} 將被降職\n執行時間: {executionTime}',
            'DISCIPLINARY_ACTION_REJECTED': '✅ 懲罰投票不通過\n員工: {employeeName} 懲罰投票未達標準\n不執行降職',
            'CONSECUTIVE_DISCIPLINARY_WARNING': '🔄 連續懲罰投票警告\n員工: {employeeName}\n第二次懲罰投票即將觸發',
            'MONTHLY_LATE_RESET': '📊 月度遲到統計重置\n所有員工遲到記錄已清零\n新月份統計開始',
            'POSITION_DEMOTION_EXECUTED': '📉 職位降級執行通知\n員工: {employeeName}\n原職位: {oldPosition}\n新職位: {newPosition}',
            
            // 管理員專用通知 (6種)
            'MULTIPLE_VOTING_STATUS': '📊 多重投票狀態報告\n進行中投票: {ongoingCount}個\n本月完成: {completedCount}個\n系統狀態: 正常',
            'VOTING_SYSTEM_ERROR': '🚨 投票系統異常警報\n錯誤類型: {errorType}\n發生時間: {timestamp}\n請立即檢查',
            'SCHEDULED_TASK_REPORT': '⏰ 定時任務執行報告\n執行時間: {executionTime}\n檢查項目: {checkedItems}\n觸發投票: {triggeredVotes}個',
            'VOTING_STATISTICS_REPORT': '📈 投票數據統計報告\n本月投票: {monthlyVotes}次\n參與率: {participationRate}%\n通過率: {passRate}%',
            'SYSTEM_MAINTENANCE_NOTICE': '🔧 系統維護通知\n維護時間: {maintenanceTime}\n預計時長: {duration}\n影響功能: 投票系統',
            'EMERGENCY_NOTIFICATION': '🚨 緊急狀況通知\n事件: {event}\n緊急程度: {severity}\n需要立即處理'
        };
    }
}
```

### 🎯 **第四階段驗證標準**
- ✅ SHA-256匿名加密系統實現
- ✅ 候選人匿名化系統運作
- ✅ 投票修改機制 (3次限制)
- ✅ 自動投票觸發系統正常
- ✅ 29種Telegram通知模板完整
- ✅ 多重投票管理系統運作

## ✅ 第五階段：智慧瀏覽器驗證測試套件建立

### 🛠️ **驗證測試系統實現**
```javascript
// 專門用於系統邏輯符合性驗證的測試套件
class SystemLogicComplianceValidator {
    constructor() {
        this.browser = null;
        this.page = null;
        this.complianceResults = [];
        this.systemLogicRequirements = this.loadSystemLogicRequirements();
    }
    
    // 載入系統邏輯.txt的完整要求
    loadSystemLogicRequirements() {
        return {
            database: {
                requiredTables: 20,
                coreEmployeeFields: 11,
                expectedTables: [
                    'employees', 'stores', 'attendance_records', 'revenue_records',
                    'inventory_items', 'schedules', 'promotion_campaigns', 
                    'maintenance_requests', 'system_logs', 'notification_queue'
                ]
            },
            adminFunctions: {
                requiredModules: 8,
                modules: [
                    '員工管理', '庫存管理', '營收管理', '排班系統',
                    '升遷投票', '系統設定', '報表功能', '維修管理'
                ]
            },
            votingSystem: {
                anonymousEncryption: 'SHA-256',
                candidateFormat: 'CANDIDATE_X_001',
                modificationLimit: 3,
                autoTriggers: ['新人轉正', '降職懲罰'],
                notificationTemplates: 29
            },
            schedulingEngine: {
                ruleCount: 6,
                rules: [
                    '基本時段檢查', '員工可用性檢查', '最低人力要求',
                    '連續工作限制', '公平性分配', '特殊需求處理'
                ]
            }
        };
    }
    
    // 全面系統邏輯合規性測試
    async runComplianceValidation() {
        await this.initBrowser();
        
        try {
            // 1. 管理員功能合規性測試
            await this.validateAdminFunctionCompliance();
            
            // 2. 員工系統合規性測試
            await this.validateEmployeeFunctionCompliance();
            
            // 3. CRUD操作合規性測試
            await this.validateCRUDCompliance();
            
            // 4. 投票系統合規性測試
            await this.validateVotingSystemCompliance();
            
            // 5. 排班系統合規性測試  
            await this.validateSchedulingCompliance();
            
            // 6. 通知系統合規性測試
            await this.validateNotificationCompliance();
            
            // 生成最終合規報告
            const complianceReport = this.generateComplianceReport();
            
            return complianceReport;
            
        } finally {
            await this.closeBrowser();
        }
    }
    
    // 管理員功能合規性驗證
    async validateAdminFunctionCompliance() {
        console.log('🏢 開始管理員功能合規性驗證...');
        
        await this.page.goto(`${this.baseUrl}/admin`);
        
        const adminCompliance = await this.page.evaluate((requirements) => {
            const foundModules = [];
            const missingModules = [];
            
            // 檢查8大核心管理模組
            requirements.adminFunctions.modules.forEach(module => {
                const moduleExists = document.body.textContent.includes(module) ||
                                  document.querySelector(`[data-module="${module}"]`) ||
                                  document.querySelector(`a[href*="${module}"]`);
                
                if (moduleExists) {
                    foundModules.push(module);
                } else {
                    missingModules.push(module);
                }
            });
            
            // 檢查CRUD操作界面
            const hasCRUDInterface = {
                create: document.querySelector('button[data-action="create"], .btn-create, [onclick*="create"]') !== null,
                read: document.querySelector('table, .data-table, .list-view') !== null,
                update: document.querySelector('button[data-action="edit"], .btn-edit, [onclick*="edit"]') !== null,
                delete: document.querySelector('button[data-action="delete"], .btn-delete, [onclick*="delete"]') !== null
            };
            
            return {
                foundModules,
                missingModules,
                moduleComplianceRate: foundModules.length / requirements.adminFunctions.requiredModules,
                hasCRUDInterface,
                crudCompliance: Object.values(hasCRUDInterface).filter(Boolean).length / 4
            };
        }, this.systemLogicRequirements);
        
        this.complianceResults.push({
            category: '管理員功能合規性',
            compliance: adminCompliance,
            passed: adminCompliance.moduleComplianceRate >= 0.8,
            details: `找到${adminCompliance.foundModules.length}/8個模組，CRUD界面完整度${Math.round(adminCompliance.crudCompliance * 100)}%`
        });
    }
    
    // 投票系統合規性驗證
    async validateVotingSystemCompliance() {
        console.log('🗳️ 開始投票系統合規性驗證...');
        
        // 檢查投票功能
        const votingCompliance = await this.page.evaluate(async () => {
            // 嘗試觸發投票功能
            const votingButtons = document.querySelectorAll('[onclick*="vote"], .vote-btn, [data-action="vote"]');
            
            // 檢查匿名投票特徵
            const hasAnonymousFeatures = document.body.textContent.includes('匿名') ||
                                       document.body.textContent.includes('CANDIDATE_') ||
                                       document.querySelector('[data-anonymous="true"]') !== null;
            
            // 檢查修改功能
            const hasModificationFeatures = document.body.textContent.includes('修改') ||
                                          document.querySelector('.vote-modify, [data-action="modify"]') !== null;
            
            return {
                votingInterfaceExists: votingButtons.length > 0,
                hasAnonymousFeatures,
                hasModificationFeatures,
                votingButtonCount: votingButtons.length
            };
        });
        
        // API測試 - 檢查投票相關端點
        const apiCompliance = await this.testVotingAPIs();
        
        this.complianceResults.push({
            category: '投票系統合規性',
            compliance: { ...votingCompliance, ...apiCompliance },
            passed: votingCompliance.votingInterfaceExists && apiCompliance.hasVotingEndpoints,
            details: `投票界面存在:${votingCompliance.votingInterfaceExists}, API端點:${apiCompliance.votingEndpointCount}個`
        });
    }
    
    // 測試投票相關API端點
    async testVotingAPIs() {
        const votingEndpoints = [
            '/api/promotion/campaigns',
            '/api/promotion/vote', 
            '/api/promotion/results',
            '/api/promotion/statistics'
        ];
        
        let workingEndpoints = 0;
        const endpointResults = {};
        
        for (const endpoint of votingEndpoints) {
            try {
                const response = await this.page.evaluate(async (url) => {
                    const res = await fetch(url);
                    return { status: res.status, ok: res.ok };
                }, `${this.baseUrl}${endpoint}`);
                
                endpointResults[endpoint] = response;
                if (response.ok || response.status < 500) {
                    workingEndpoints++;
                }
            } catch (error) {
                endpointResults[endpoint] = { error: error.message };
            }
        }
        
        return {
            hasVotingEndpoints: workingEndpoints > 0,
            votingEndpointCount: workingEndpoints,
            totalEndpoints: votingEndpoints.length,
            endpointDetails: endpointResults
        };
    }
    
    // 生成最終合規報告
    generateComplianceReport() {
        const totalTests = this.complianceResults.length;
        const passedTests = this.complianceResults.filter(r => r.passed).length;
        const complianceRate = Math.round((passedTests / totalTests) * 100);
        
        let complianceLevel = '❌ 不符合系統邏輯要求';
        if (complianceRate >= 90) complianceLevel = '🎉 完全符合系統邏輯.txt規格';
        else if (complianceRate >= 80) complianceLevel = '✅ 基本符合系統邏輯要求';
        else if (complianceRate >= 60) complianceLevel = '⚠️ 部分符合，需要改進';
        
        const report = `
# 🎯 系統邏輯.txt合規性驗證報告

## 📊 總體合規率: ${complianceRate}%

${complianceLevel}

## 📋 詳細合規結果

${this.complianceResults.map(result => `
### ${result.passed ? '✅' : '❌'} ${result.category}
- **合規狀態**: ${result.passed ? '符合要求' : '需要改進'}
- **詳細說明**: ${result.details}
- **技術數據**: ${JSON.stringify(result.compliance, null, 2)}
`).join('')}

## 🎯 系統邏輯.txt符合度分析

### ✅ 符合項目:
${this.complianceResults.filter(r => r.passed).map(r => `- ${r.category}`).join('\n') || '暫無完全符合項目'}

### ❌ 需改進項目:
${this.complianceResults.filter(r => !r.passed).map(r => `- ${r.category}: ${r.details}`).join('\n') || '✅ 所有項目符合要求'}

## 🚀 建議改進優先級

${complianceRate < 80 ? `
### 高優先級改進:
${this.complianceResults.filter(r => !r.passed).slice(0, 3).map(r => `1. 完善${r.category}`).join('\n')}

### 達到企業級標準需要:
- 管理員功能模組完整度 ≥ 80%
- CRUD操作成功率 ≥ 90%
- 投票系統功能完整度 ≥ 85%
- API端點可用率 ≥ 80%
` : '✅ 已達到企業級標準，建議進行細節優化'}

---
**驗證時間**: ${new Date().toLocaleString('zh-TW')}
**參考標準**: 系統邏輯.txt v2.0 完整規格
**驗證工具**: 智慧瀏覽器真實操作驗證
`;
        
        return {
            complianceRate,
            complianceLevel,
            report,
            detailedResults: this.complianceResults,
            recommendations: this.generateRecommendations()
        };
    }
}
```

## 🎯 **修復計劃總結**

### **時程安排**:
- **第1週**: 管理員系統完整修復
- **第2週**: CRUD操作技術修復 + 智慧排班實現  
- **第3週**: 升遷投票自動化系統
- **第4週**: 全面測試驗證與優化

### **成功標準**:
- ✅ 智慧瀏覽器驗證合規率 ≥ 90%
- ✅ 所有系統邏輯.txt要求實現
- ✅ 企業級系統標準達成

### **驗證機制**:
- 🔍 每階段智慧瀏覽器真實操作測試
- 📊 系統邏輯合規性自動檢查
- 📱 Telegram通知系統功能驗證
- 🎯 最終企業級標準評估

---
**規劃完成時間**: 2025/8/11 下午2:25  
**下一步**: 開始第一階段修復實現