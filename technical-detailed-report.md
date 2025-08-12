# 企業員工管理系統 - 技術詳細報告

## 🔧 給開發團隊的技術指導

### 📋 技術棧概述
- **後端**: Node.js + Express.js + Sequelize ORM
- **資料庫**: SQLite (生產建議升級到 PostgreSQL/MySQL)
- **前端**: HTML + CSS + Vanilla JavaScript (建議升級到現代框架)
- **認證**: JWT + bcrypt 加密
- **通知**: Telegram Bot API 整合

### 🚨 緊急修復指南

#### 1. 前端登入系統修復 (優先級: P0)

**問題分析**:
```javascript
// 當前問題: 缺少 #idNumber 輸入欄位
// 錯誤位置: public/login.html 和 public/employee-dashboard.html
```

**解決方案**:
```html
<!-- 修復 login.html -->
<form id="loginForm">
    <div class="form-group">
        <label for="idNumber">身分證字號</label>
        <input type="text" id="idNumber" name="idNumber" required>
    </div>
    <div class="form-group">
        <label for="password">密碼</label>
        <input type="password" id="password" name="password" required>
    </div>
    <button type="submit">登入</button>
</form>
```

```javascript
// 修復 JavaScript 邏輯
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const idNumber = document.getElementById('idNumber').value;
    const password = document.getElementById('password').value;
    
    if (!idNumber || !password) {
        alert('請填寫身分證字號和密碼');
        return;
    }
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ idNumber, password })
        });
        
        const result = await response.json();
        
        if (result.success) {
            localStorage.setItem('token', result.token);
            localStorage.setItem('userRole', result.user.role);
            
            // 根據角色導向不同頁面
            if (result.user.role === 'admin') {
                window.location.href = '/admin-dashboard.html';
            } else {
                window.location.href = '/employee-dashboard.html';
            }
        } else {
            alert('登入失敗: ' + result.message);
        }
    } catch (error) {
        console.error('登入錯誤:', error);
        alert('登入系統發生錯誤，請稍後再試');
    }
});
```

#### 2. 磁碟空間清理 (優先級: P1)

**清理腳本**:
```bash
#!/bin/bash
# 清理日誌檔案
find ./logs -name "*.log" -mtime +7 -delete

# 清理舊的測試報告
find . -name "*test*.json" -mtime +3 -delete
find . -name "*report*.txt" -mtime +3 -delete

# 清理 node_modules 快取
npm cache clean --force

# 顯示清理後的磁碟使用情況
df -h
```

**日誌輪轉配置**:
```javascript
// 安裝並配置 winston-daily-rotate-file
const winston = require('winston');
require('winston-daily-rotate-file');

const transport = new winston.transports.DailyRotateFile({
    filename: 'logs/application-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d'
});

const logger = winston.createLogger({
    transports: [transport]
});
```

### 🔍 API端點技術分析

#### 營收管理API詳細分析
```javascript
// 獎金計算邏輯驗證
// 位置: server/routes/api/revenue.js

// 平日獎金計算 (門檻: 13000元, 比率: 30%)
const calculateWeekdayBonus = (totalEffective) => {
    const threshold = 13000;
    const rate = 0.3;
    
    if (totalEffective >= threshold) {
        return Math.round(totalEffective * rate);
    }
    return 0;
};

// 假日獎金計算 (無門檻, 比率: 38%)
const calculateHolidayBonus = (totalEffective) => {
    const rate = 0.38;
    return Math.round(totalEffective * rate);
};

// 有效營收計算 (扣除35%服務費)
const calculateEffectiveRevenue = (panda, uber) => {
    const serviceRate = 0.35;
    return {
        pandaEffective: Math.round(panda * (1 - serviceRate)),
        uberEffective: Math.round(uber * (1 - serviceRate))
    };
};
```

#### 認證系統技術細節
```javascript
// JWT Token 生成和驗證
// 位置: server/routes/api/auth.js

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Token 生成
const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user.id, 
            idNumber: user.idNumber, 
            role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
};

// 密碼驗證
const verifyPassword = async (inputPassword, hashedPassword) => {
    return await bcrypt.compare(inputPassword, hashedPassword);
};

// 中間件: Token 驗證
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ success: false, message: '缺少認證token' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Token無效' });
        }
        req.user = user;
        next();
    });
};
```

### 📊 資料庫最佳化建議

#### 索引優化
```sql
-- 營收記錄表索引
CREATE INDEX idx_revenue_employee_date ON revenue_records(employee_id, date);
CREATE INDEX idx_revenue_store_date ON revenue_records(store_name, date);
CREATE INDEX idx_revenue_bonus_type ON revenue_records(bonus_type);

-- 打卡記錄表索引
CREATE INDEX idx_attendance_employee_date ON attendance_records(employee_id, date);
CREATE INDEX idx_attendance_type ON attendance_records(type);

-- 員工表索引
CREATE INDEX idx_employee_id_number ON employees(id_number);
CREATE INDEX idx_employee_role ON employees(role);
```

#### 查詢效能優化
```javascript
// 優化的查詢範例
const getRevenueRecordsOptimized = async (filters) => {
    const { startDate, endDate, storeId, employeeId } = filters;
    
    const whereClause = {};
    if (startDate && endDate) {
        whereClause.date = {
            [Op.between]: [startDate, endDate]
        };
    }
    if (storeId) whereClause.store_name = storeId;
    if (employeeId) whereClause.employee_id = employeeId;
    
    return await RevenueRecord.findAll({
        where: whereClause,
        include: [{
            model: Employee,
            attributes: ['name', 'id_number']
        }],
        order: [['date', 'DESC']],
        limit: 100 // 限制查詢結果數量
    });
};
```

### 🔒 安全性強化建議

#### 1. HTTPS 強制實施
```javascript
// 中間件: 強制 HTTPS
const forceHTTPS = (req, res, next) => {
    if (process.env.NODE_ENV === 'production' && !req.secure && req.get('x-forwarded-proto') !== 'https') {
        return res.redirect(301, 'https://' + req.get('host') + req.url);
    }
    next();
};

app.use(forceHTTPS);
```

#### 2. API 請求頻率限制
```javascript
const rateLimit = require('express-rate-limit');

// 一般 API 限制
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 分鐘
    max: 100, // 限制每個 IP 100 次請求
    message: '請求過於頻繁，請稍後再試'
});

// 登入 API 限制
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 分鐘
    max: 5, // 限制每個 IP 5 次登入嘗試
    message: '登入嘗試過於頻繁，請稍後再試'
});

app.use('/api/', apiLimiter);
app.use('/api/auth/login', loginLimiter);
```

#### 3. 輸入驗證強化
```javascript
const validator = require('validator');

// 身分證字號驗證
const validateIdNumber = (idNumber) => {
    const regex = /^[A-Z]\d{9}$/;
    return regex.test(idNumber);
};

// 營收數據驗證
const validateRevenueData = (data) => {
    const errors = [];
    
    if (!data.employeeId || !Number.isInteger(data.employeeId)) {
        errors.push('員工ID必須是有效的整數');
    }
    
    if (!data.cashRevenue || data.cashRevenue < 0) {
        errors.push('現金營收必須是正數');
    }
    
    if (!validator.isDate(data.date)) {
        errors.push('日期格式不正確');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};
```

### 📱 通知系統技術優化

#### 訊息佇列實施
```javascript
// 使用 Redis 實作訊息佇列
const Redis = require('redis');
const client = Redis.createClient();

class NotificationQueue {
    constructor() {
        this.processing = false;
    }
    
    async addNotification(notification) {
        await client.lPush('notifications', JSON.stringify(notification));
        this.processQueue();
    }
    
    async processQueue() {
        if (this.processing) return;
        this.processing = true;
        
        try {
            while (true) {
                const item = await client.brPop('notifications', 0);
                if (!item) break;
                
                const notification = JSON.parse(item.element);
                await this.sendNotification(notification);
                
                // 避免觸發 Telegram API 頻率限制
                await this.delay(2000);
            }
        } finally {
            this.processing = false;
        }
    }
    
    async sendNotification(notification) {
        // 發送邏輯
        try {
            await telegramBot.sendMessage(chatId, notification.message);
            console.log('通知發送成功:', notification.id);
        } catch (error) {
            console.error('通知發送失敗:', error);
            // 重新加入佇列重試
            if (notification.retryCount < 3) {
                notification.retryCount = (notification.retryCount || 0) + 1;
                await this.addNotification(notification);
            }
        }
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
```

### 🔧 系統監控實施

#### 健康檢查端點
```javascript
// 健康檢查 API
app.get('/health', async (req, res) => {
    const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {}
    };
    
    try {
        // 檢查資料庫連接
        await sequelize.authenticate();
        health.services.database = 'ok';
    } catch (error) {
        health.services.database = 'error';
        health.status = 'error';
    }
    
    try {
        // 檢查 Redis 連接
        await client.ping();
        health.services.redis = 'ok';
    } catch (error) {
        health.services.redis = 'error';
        health.status = 'error';
    }
    
    // 檢查磁碟空間
    const diskUsage = await checkDiskUsage();
    health.services.disk = diskUsage > 90 ? 'warning' : 'ok';
    health.diskUsage = diskUsage;
    
    res.status(health.status === 'ok' ? 200 : 503).json(health);
});
```

#### 效能監控
```javascript
// 響應時間監控
const responseTime = require('response-time');

app.use(responseTime((req, res, time) => {
    console.log(`${req.method} ${req.url} - ${time}ms`);
    
    // 記錄慢查詢
    if (time > 1000) {
        console.warn(`慢查詢警告: ${req.method} ${req.url} - ${time}ms`);
    }
}));

// 記憶體使用監控
setInterval(() => {
    const memUsage = process.memoryUsage();
    console.log('記憶體使用:', {
        rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB'
    });
}, 60000); // 每分鐘檢查一次
```

### 🚀 部署配置

#### 生產環境配置
```javascript
// config/production.js
module.exports = {
    database: {
        dialect: 'postgres', // 升級到 PostgreSQL
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        pool: {
            max: 20,
            min: 5,
            acquire: 30000,
            idle: 10000
        }
    },
    redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        password: process.env.REDIS_PASSWORD
    },
    server: {
        port: process.env.PORT || 3000,
        cors: {
            origin: process.env.FRONTEND_URL,
            credentials: true
        }
    }
};
```

#### Docker 配置
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# 複製依賴文件
COPY package*.json ./
RUN npm ci --only=production

# 複製源代碼
COPY . .

# 創建非 root 用戶
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodeuser -u 1001

# 設置權限
RUN chown -R nodeuser:nodejs /app
USER nodeuser

EXPOSE 3000

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - REDIS_HOST=redis
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:14-alpine
    environment:
      - POSTGRES_DB=employee_system
      - POSTGRES_USER=admin
      - POSTGRES_PASSWORD=secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped

volumes:
  postgres_data:
```

### 🧪 測試策略

#### 自動化測試
```javascript
// tests/api/revenue.test.js
const request = require('supertest');
const app = require('../server');

describe('營收管理 API', () => {
    test('獎金計算 - 平日獎金達標', async () => {
        const response = await request(app)
            .post('/api/revenue/calculate-bonus')
            .send({
                cashRevenue: 15000,
                pandaRevenue: 0,
                uberRevenue: 0,
                bonusType: '平日獎金'
            });
            
        expect(response.status).toBe(200);
        expect(response.body.qualified).toBe(true);
        expect(response.body.bonusAmount).toBe(4500);
    });
    
    test('營收記錄提交', async () => {
        const response = await request(app)
            .post('/api/revenue/records')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                employeeId: 1,
                storeName: '總店',
                date: '2025-08-12',
                cashRevenue: 18000,
                pandaRevenue: 6000,
                uberRevenue: 4000,
                bonusType: '平日獎金'
            });
            
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
    });
});
```

### 📋 部署檢查清單

#### 部署前檢查
- [ ] 前端登入功能修復並測試完成
- [ ] 磁碟空間清理，使用率降至70%以下
- [ ] 資料庫備份機制建立
- [ ] HTTPS 證書配置完成
- [ ] 環境變數配置檢查
- [ ] API 端點功能測試通過
- [ ] 通知系統測試完成
- [ ] 效能基準測試執行
- [ ] 安全性掃描通過
- [ ] 監控系統配置完成

#### 部署後驗證
- [ ] 所有服務正常啟動
- [ ] 健康檢查端點回應正常
- [ ] 用戶登入流程測試
- [ ] 核心功能端到端測試
- [ ] 通知系統發送測試
- [ ] 效能監控正常運作
- [ ] 錯誤日誌檢查

---

**最後更新**: 2025年8月12日  
**技術負責人**: 開發團隊  
**下次技術複查**: 前端修復完成後