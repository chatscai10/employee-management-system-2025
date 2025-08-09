#!/usr/bin/env node
/**
 * 🔧 缺失核心業務模組建置器
 * 根據系統分析結果建置缺失的核心功能模組
 */

const fs = require('fs');
const path = require('path');

class CoreModuleBuilder {
    constructor() {
        this.projectRoot = __dirname;
        this.serverPath = path.join(this.projectRoot, 'server');
        this.publicPath = path.join(this.projectRoot, 'public');
        this.buildResults = {
            apiEndpoints: [],
            frontendPages: [],
            databaseModels: [],
            securityModules: [],
            validationRules: [],
            errorHandlers: [],
            performanceOptimizations: [],
            createdFiles: [],
            recommendations: []
        };
    }

    /**
     * 執行核心模組建置
     */
    async executeCoreModuleBuilding() {
        console.log('🔧 開始建置缺失的核心業務模組...');
        console.log('='.repeat(70));

        try {
            // 1. 建置缺失的API端點
            await this.buildMissingAPIEndpoints();
            
            // 2. 建置缺失的前端頁面
            await this.buildMissingFrontendPages();
            
            // 3. 建置資料庫模型關聯
            await this.buildDatabaseModels();
            
            // 4. 建置安全防護模組
            await this.buildSecurityModules();
            
            // 5. 建置驗證規則模組
            await this.buildValidationModules();
            
            // 6. 建置錯誤處理模組
            await this.buildErrorHandlers();
            
            // 7. 建置效能優化模組
            await this.buildPerformanceOptimizations();
            
            // 8. 生成完整報告
            this.generateBuildReport();
            
        } catch (error) {
            console.error('❌ 核心模組建置失敗:', error.message);
        }
    }

    /**
     * 建置缺失的API端點
     */
    async buildMissingAPIEndpoints() {
        console.log('\n🔗 建置缺失的API端點...');
        
        const missingEndpoints = [
            {
                path: '/api/auth/register',
                method: 'POST',
                description: '員工註冊端點',
                module: 'auth',
                handler: 'register'
            },
            {
                path: '/api/auth/login',
                method: 'POST',
                description: '員工登入端點',
                module: 'auth',
                handler: 'login'
            },
            {
                path: '/api/auth/verify',
                method: 'GET',
                description: 'Token驗證端點',
                module: 'auth',
                handler: 'verify'
            },
            {
                path: '/api/attendance/clock',
                method: 'POST',
                description: 'GPS考勤打卡端點',
                module: 'attendance',
                handler: 'clock'
            },
            {
                path: '/api/attendance/records',
                method: 'GET',
                description: '考勤記錄查詢端點',
                module: 'attendance',
                handler: 'getRecords'
            },
            {
                path: '/api/revenue/summary',
                method: 'GET',
                description: '營收統計端點',
                module: 'revenue',
                handler: 'getSummary'
            },
            {
                path: '/api/admin/stores',
                method: 'GET',
                description: '管理員分店管理端點',
                module: 'admin',
                handler: 'getStores'
            },
            {
                path: '/api/schedule',
                method: 'GET',
                description: '排班管理端點',
                module: 'schedule',
                handler: 'getSchedule'
            }
        ];

        for (const endpoint of missingEndpoints) {
            console.log(`\n  🔧 建置 ${endpoint.method} ${endpoint.path}:`);
            
            try {
                // 檢查路由文件是否存在
                const routeFile = path.join(this.serverPath, 'routes', 'api', `${endpoint.module}.js`);
                
                if (fs.existsSync(routeFile)) {
                    console.log(`    📄 更新現有路由文件: ${endpoint.module}.js`);
                    await this.addEndpointToExistingRoute(routeFile, endpoint);
                } else {
                    console.log(`    📄 創建新路由文件: ${endpoint.module}.js`);
                    await this.createNewRouteFile(routeFile, endpoint);
                }
                
                // 建置對應的控制器方法
                await this.buildControllerMethod(endpoint);
                
                this.buildResults.apiEndpoints.push({
                    endpoint: endpoint.path,
                    method: endpoint.method,
                    status: 'created',
                    file: path.relative(this.projectRoot, routeFile)
                });
                
                console.log(`    ✅ ${endpoint.description} 建置完成`);
                
            } catch (error) {
                console.error(`    ❌ 建置失敗: ${error.message}`);
            }
        }
    }

    /**
     * 添加端點到現有路由文件
     */
    async addEndpointToExistingRoute(routeFile, endpoint) {
        const content = fs.readFileSync(routeFile, 'utf8');
        
        // 檢查端點是否已存在
        const routePattern = new RegExp(`router\\.${endpoint.method.toLowerCase()}\\s*\\([^)]*['"]${endpoint.path.split('/').pop()}['"]`);
        if (routePattern.test(content)) {
            console.log(`    ⚠️ 端點已存在，跳過`);
            return;
        }
        
        // 生成新的路由定義
        const newRoute = this.generateRouteDefinition(endpoint);
        
        // 在文件末尾添加新路由
        const updatedContent = content.replace(
            /module\.exports = router;$/,
            `${newRoute}\n\nmodule.exports = router;`
        );
        
        fs.writeFileSync(routeFile, updatedContent);
    }

    /**
     * 創建新路由文件
     */
    async createNewRouteFile(routeFile, endpoint) {
        const routeContent = this.generateRouteFileContent(endpoint);
        
        // 確保目錄存在
        const routeDir = path.dirname(routeFile);
        if (!fs.existsSync(routeDir)) {
            fs.mkdirSync(routeDir, { recursive: true });
        }
        
        fs.writeFileSync(routeFile, routeContent);
        this.buildResults.createdFiles.push(path.relative(this.projectRoot, routeFile));
    }

    /**
     * 生成路由定義
     */
    generateRouteDefinition(endpoint) {
        const controllerName = `${endpoint.handler}Controller`;
        const routePath = endpoint.path.split('/').pop();
        
        return `
// ${endpoint.description}
router.${endpoint.method.toLowerCase()}('/${routePath}', async (req, res) => {
    try {
        const result = await ${controllerName}(req, res);
        res.json({
            success: true,
            data: result,
            message: '操作成功'
        });
    } catch (error) {
        console.error('${endpoint.description}錯誤:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: '服務器內部錯誤'
        });
    }
});`;
    }

    /**
     * 生成路由文件內容
     */
    generateRouteFileContent(endpoint) {
        return `const express = require('express');
const router = express.Router();

/**
 * ${endpoint.module} 模組路由
 * 處理 ${endpoint.description} 相關功能
 */

${this.generateRouteDefinition(endpoint)}

// ${endpoint.handler} 控制器函數
async function ${endpoint.handler}Controller(req, res) {
    // TODO: 實現 ${endpoint.description} 邏輯
    console.log('${endpoint.description} 請求:', req.body);
    
    return {
        message: '${endpoint.description} 功能開發中',
        timestamp: new Date().toISOString(),
        data: {}
    };
}

module.exports = router;`;
    }

    /**
     * 建置控制器方法
     */
    async buildControllerMethod(endpoint) {
        const controllerDir = path.join(this.serverPath, 'controllers');
        const controllerFile = path.join(controllerDir, `${endpoint.module}Controller.js`);
        
        if (!fs.existsSync(controllerDir)) {
            fs.mkdirSync(controllerDir, { recursive: true });
        }

        const controllerContent = this.generateControllerContent(endpoint);
        
        if (fs.existsSync(controllerFile)) {
            // 更新現有控制器
            const existingContent = fs.readFileSync(controllerFile, 'utf8');
            if (!existingContent.includes(endpoint.handler)) {
                const updatedContent = existingContent.replace(
                    /module\.exports = \{([^}]*)\};$/,
                    `module.exports = {$1,\n    ${endpoint.handler}\n};`
                );
                fs.writeFileSync(controllerFile, updatedContent);
            }
        } else {
            // 創建新控制器
            fs.writeFileSync(controllerFile, controllerContent);
            this.buildResults.createdFiles.push(path.relative(this.projectRoot, controllerFile));
        }
    }

    /**
     * 生成控制器內容
     */
    generateControllerContent(endpoint) {
        const handlerImplementation = this.generateHandlerImplementation(endpoint);
        
        return `/**
 * ${endpoint.module} 控制器
 * 處理 ${endpoint.description} 相關業務邏輯
 */

${handlerImplementation}

module.exports = {
    ${endpoint.handler}
};`;
    }

    /**
     * 生成處理器實現
     */
    generateHandlerImplementation(endpoint) {
        const implementations = {
            register: `
async function register(req, res) {
    const { name, idNumber, phone, email, password, storeId } = req.body;
    
    // TODO: 實現員工註冊邏輯
    // 1. 驗證輸入資料
    // 2. 檢查員工是否已存在
    // 3. 加密密碼
    // 4. 儲存到資料庫
    // 5. 生成JWT Token
    
    return {
        message: '員工註冊成功',
        employeeId: Math.floor(Math.random() * 10000),
        token: 'jwt_token_placeholder'
    };
}`,
            login: `
async function login(req, res) {
    const { idNumber, password } = req.body;
    
    // TODO: 實現員工登入邏輯
    // 1. 驗證輸入資料
    // 2. 查找員工記錄
    // 3. 驗證密碼
    // 4. 生成JWT Token
    // 5. 記錄登入日誌
    
    return {
        message: '登入成功',
        token: 'jwt_token_placeholder',
        employee: { id: 1, name: 'Test Employee' }
    };
}`,
            verify: `
async function verify(req, res) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    // TODO: 實現Token驗證邏輯
    // 1. 檢查Token格式
    // 2. 驗證Token有效性
    // 3. 解析用戶信息
    // 4. 檢查用戶狀態
    
    return {
        valid: true,
        employee: { id: 1, name: 'Test Employee' }
    };
}`,
            clock: `
async function clock(req, res) {
    const { employeeId, latitude, longitude, type } = req.body;
    
    // TODO: 實現GPS考勤打卡邏輯
    // 1. 驗證GPS座標
    // 2. 計算與分店距離
    // 3. 檢查是否在允許範圍內
    // 4. 記錄考勤資料
    // 5. 發送通知
    
    return {
        message: '打卡成功',
        clockTime: new Date().toISOString(),
        distance: Math.floor(Math.random() * 100)
    };
}`,
            getRecords: `
async function getRecords(req, res) {
    const { employeeId, startDate, endDate } = req.query;
    
    // TODO: 實現考勤記錄查詢邏輯
    // 1. 驗證查詢參數
    // 2. 查詢資料庫記錄
    // 3. 計算統計數據
    // 4. 格式化回應資料
    
    return {
        records: [],
        statistics: {
            totalDays: 0,
            presentDays: 0,
            lateDays: 0
        }
    };
}`,
            getSummary: `
async function getSummary(req, res) {
    const { storeId, month } = req.query;
    
    // TODO: 實現營收統計邏輯
    // 1. 驗證查詢參數
    // 2. 查詢營收資料
    // 3. 計算統計指標
    // 4. 生成圖表資料
    
    return {
        totalRevenue: 0,
        totalExpense: 0,
        netIncome: 0,
        dailyData: []
    };
}`
        };

        return implementations[endpoint.handler] || `
async function ${endpoint.handler}(req, res) {
    // TODO: 實現 ${endpoint.description} 邏輯
    console.log('${endpoint.description} 請求:', req.body || req.query);
    
    return {
        message: '${endpoint.description} 功能開發中',
        data: {}
    };
}`;
    }

    /**
     * 建置缺失的前端頁面
     */
    async buildMissingFrontendPages() {
        console.log('\n📱 建置缺失的前端頁面...');
        
        const missingPages = [
            {
                name: 'employee-dashboard.html',
                title: '員工工作台',
                description: '員工個人工作台頁面'
            },
            {
                name: 'attendance.html',
                title: '考勤管理',
                description: '考勤打卡和記錄查看頁面'
            },
            {
                name: 'revenue.html',
                title: '營收管理',
                description: '營收記錄和統計頁面'
            },
            {
                name: 'profile.html',
                title: '個人資料',
                description: '員工個人資料管理頁面'
            },
            {
                name: 'reports.html',
                title: '報表頁面',
                description: '各種報表和統計頁面'
            },
            {
                name: '404.html',
                title: '頁面未找到',
                description: '404錯誤頁面'
            }
        ];

        for (const page of missingPages) {
            console.log(`\n  📄 建置 ${page.name}:`);
            
            try {
                const pageFile = path.join(this.publicPath, page.name);
                
                if (fs.existsSync(pageFile)) {
                    console.log(`    ⚠️ 頁面已存在，跳過`);
                    continue;
                }
                
                const pageContent = this.generatePageContent(page);
                fs.writeFileSync(pageFile, pageContent);
                
                this.buildResults.frontendPages.push({
                    page: page.name,
                    title: page.title,
                    status: 'created',
                    file: path.relative(this.projectRoot, pageFile)
                });
                
                this.buildResults.createdFiles.push(path.relative(this.projectRoot, pageFile));
                console.log(`    ✅ ${page.description} 建置完成`);
                
            } catch (error) {
                console.error(`    ❌ 建置失敗: ${error.message}`);
            }
        }
    }

    /**
     * 生成頁面內容
     */
    generatePageContent(page) {
        const commonHeader = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${page.title} - 企業員工管理系統</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="css/style.css">
</head>
<body>`;

        const commonFooter = `
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="js/app.js"></script>
</body>
</html>`;

        const pageSpecificContent = {
            'employee-dashboard.html': `
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
        <div class="container">
            <a class="navbar-brand" href="index.html">員工管理系統</a>
            <div class="navbar-nav ms-auto">
                <a class="nav-link" href="profile.html">個人資料</a>
                <a class="nav-link" href="attendance.html">考勤打卡</a>
                <a class="nav-link" href="#" onclick="logout()">登出</a>
            </div>
        </div>
    </nav>

    <div class="container mt-4">
        <div class="row">
            <div class="col-md-12">
                <h2>員工工作台</h2>
                <div class="row mt-4">
                    <div class="col-md-6 col-lg-3 mb-4">
                        <div class="card bg-primary text-white">
                            <div class="card-body">
                                <h5 class="card-title">今日考勤</h5>
                                <p class="card-text">點擊進行打卡</p>
                                <a href="attendance.html" class="btn btn-light">前往打卡</a>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6 col-lg-3 mb-4">
                        <div class="card bg-success text-white">
                            <div class="card-body">
                                <h5 class="card-title">營收記錄</h5>
                                <p class="card-text">查看營收統計</p>
                                <a href="revenue.html" class="btn btn-light">查看記錄</a>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6 col-lg-3 mb-4">
                        <div class="card bg-info text-white">
                            <div class="card-body">
                                <h5 class="card-title">個人資料</h5>
                                <p class="card-text">管理個人信息</p>
                                <a href="profile.html" class="btn btn-light">編輯資料</a>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6 col-lg-3 mb-4">
                        <div class="card bg-warning text-white">
                            <div class="card-body">
                                <h5 class="card-title">報表查看</h5>
                                <p class="card-text">查看各項報表</p>
                                <a href="reports.html" class="btn btn-light">查看報表</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row mt-4">
            <div class="col-md-8">
                <div class="card">
                    <div class="card-header">
                        <h5>近期考勤記錄</h5>
                    </div>
                    <div class="card-body">
                        <div id="attendanceRecords">
                            <p class="text-muted">載入中...</p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card">
                    <div class="card-header">
                        <h5>快速操作</h5>
                    </div>
                    <div class="card-body">
                        <button class="btn btn-primary w-100 mb-2" onclick="quickClockIn()">快速打卡</button>
                        <button class="btn btn-success w-100 mb-2" onclick="addRevenue()">新增營收</button>
                        <button class="btn btn-info w-100" onclick="viewProfile()">查看資料</button>
                    </div>
                </div>
            </div>
        </div>
    </div>`,

            'attendance.html': `
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
        <div class="container">
            <a class="navbar-brand" href="employee-dashboard.html">返回工作台</a>
        </div>
    </nav>

    <div class="container mt-4">
        <h2>考勤管理</h2>
        
        <div class="row mt-4">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5>GPS打卡</h5>
                    </div>
                    <div class="card-body">
                        <div id="locationStatus" class="alert alert-info">
                            正在獲取位置信息...
                        </div>
                        <button id="clockInBtn" class="btn btn-success me-2" onclick="clockIn()">上班打卡</button>
                        <button id="clockOutBtn" class="btn btn-danger" onclick="clockOut()">下班打卡</button>
                        <div class="mt-3">
                            <small class="text-muted">
                                <div>當前位置：<span id="currentLocation">獲取中...</span></div>
                                <div>分店距離：<span id="storeDistance">計算中...</span></div>
                            </small>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5>今日考勤狀態</h5>
                    </div>
                    <div class="card-body">
                        <div id="todayAttendance">
                            <p class="text-muted">載入中...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row mt-4">
            <div class="col-md-12">
                <div class="card">
                    <div class="card-header">
                        <h5>考勤記錄</h5>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <div class="row">
                                <div class="col-md-3">
                                    <input type="date" id="startDate" class="form-control">
                                </div>
                                <div class="col-md-3">
                                    <input type="date" id="endDate" class="form-control">
                                </div>
                                <div class="col-md-3">
                                    <button class="btn btn-primary" onclick="searchRecords()">查詢</button>
                                </div>
                            </div>
                        </div>
                        <div id="attendanceTable">
                            <p class="text-muted">載入中...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`,

            '404.html': `
    <div class="container d-flex align-items-center justify-content-center min-vh-100">
        <div class="text-center">
            <div class="error mx-auto" style="font-size: 10rem; color: #e74c3c;">404</div>
            <p class="fs-3"><span class="text-danger">糟糕！</span> 頁面未找到</p>
            <p class="fs-5 text-muted">您要找的頁面不存在</p>
            <a href="index.html" class="btn btn-primary">返回首頁</a>
        </div>
    </div>`
        };

        return commonHeader + (pageSpecificContent[page.name] || `
    <div class="container mt-4">
        <h1>${page.title}</h1>
        <p>${page.description}</p>
        <div class="alert alert-info">
            此頁面正在開發中...
        </div>
        <a href="index.html" class="btn btn-primary">返回首頁</a>
    </div>`) + commonFooter;
    }

    /**
     * 建置資料庫模型關聯
     */
    async buildDatabaseModels() {
        console.log('\n🗄️ 建置資料庫模型關聯...');
        
        const modelsDir = path.join(this.serverPath, 'models');
        const indexFile = path.join(modelsDir, 'index.js');
        
        if (!fs.existsSync(modelsDir)) {
            fs.mkdirSync(modelsDir, { recursive: true });
        }

        // 建置個別模型文件
        const models = ['Employee', 'Store', 'AttendanceRecord', 'RevenueRecord', 'Schedule'];
        
        for (const modelName of models) {
            console.log(`  📝 建置 ${modelName} 模型...`);
            
            const modelFile = path.join(modelsDir, `${modelName}.js`);
            if (!fs.existsSync(modelFile)) {
                const modelContent = this.generateModelContent(modelName);
                fs.writeFileSync(modelFile, modelContent);
                
                this.buildResults.databaseModels.push({
                    model: modelName,
                    status: 'created',
                    file: path.relative(this.projectRoot, modelFile)
                });
                
                this.buildResults.createdFiles.push(path.relative(this.projectRoot, modelFile));
                console.log(`    ✅ ${modelName} 模型建置完成`);
            } else {
                console.log(`    ⚠️ ${modelName} 模型已存在，跳過`);
            }
        }
        
        // 更新 index.js 文件以包含關聯關係
        if (fs.existsSync(indexFile)) {
            console.log('  🔗 更新模型關聯關係...');
            await this.updateModelAssociations(indexFile);
        }
    }

    /**
     * 生成模型內容
     */
    generateModelContent(modelName) {
        const modelDefinitions = {
            Employee: `
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Employee = sequelize.define('Employee', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        idNumber: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        birthday: {
            type: DataTypes.DATE,
            allowNull: false
        },
        gender: {
            type: DataTypes.STRING,
            allowNull: false
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: false
        },
        address: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        storeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Stores',
                key: 'id'
            }
        },
        position: {
            type: DataTypes.STRING,
            defaultValue: 'employee'
        },
        status: {
            type: DataTypes.ENUM('active', 'inactive', 'pending'),
            defaultValue: 'active'
        }
    });

    Employee.associate = function(models) {
        Employee.belongsTo(models.Store, { foreignKey: 'storeId' });
        Employee.hasMany(models.AttendanceRecord, { foreignKey: 'employeeId' });
        Employee.hasMany(models.RevenueRecord, { foreignKey: 'employeeId' });
    };

    return Employee;
};`,

            Store: `
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Store = sequelize.define('Store', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        address: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        latitude: {
            type: DataTypes.DECIMAL(10, 8),
            allowNull: false
        },
        longitude: {
            type: DataTypes.DECIMAL(11, 8),
            allowNull: false
        },
        radius: {
            type: DataTypes.INTEGER,
            defaultValue: 100
        },
        openTime: {
            type: DataTypes.STRING
        },
        minPeople: {
            type: DataTypes.INTEGER,
            defaultValue: 1
        }
    });

    Store.associate = function(models) {
        Store.hasMany(models.Employee, { foreignKey: 'storeId' });
        Store.hasMany(models.AttendanceRecord, { foreignKey: 'storeId' });
        Store.hasMany(models.RevenueRecord, { foreignKey: 'storeId' });
    };

    return Store;
};`,

            AttendanceRecord: `
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const AttendanceRecord = sequelize.define('AttendanceRecord', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        employeeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Employees',
                key: 'id'
            }
        },
        storeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Stores',
                key: 'id'
            }
        },
        clockTime: {
            type: DataTypes.DATE,
            allowNull: false
        },
        clockType: {
            type: DataTypes.ENUM('in', 'out'),
            allowNull: false
        },
        latitude: {
            type: DataTypes.DECIMAL(10, 8),
            allowNull: false
        },
        longitude: {
            type: DataTypes.DECIMAL(11, 8),
            allowNull: false
        },
        distance: {
            type: DataTypes.INTEGER
        },
        status: {
            type: DataTypes.ENUM('normal', 'late', 'early'),
            defaultValue: 'normal'
        }
    });

    AttendanceRecord.associate = function(models) {
        AttendanceRecord.belongsTo(models.Employee, { foreignKey: 'employeeId' });
        AttendanceRecord.belongsTo(models.Store, { foreignKey: 'storeId' });
    };

    return AttendanceRecord;
};`,

            RevenueRecord: `
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const RevenueRecord = sequelize.define('RevenueRecord', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        employeeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Employees',
                key: 'id'
            }
        },
        storeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Stores',
                key: 'id'
            }
        },
        date: {
            type: DataTypes.DATE,
            allowNull: false
        },
        totalIncome: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0
        },
        totalExpense: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0
        },
        netIncome: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0
        },
        bonusAmount: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0
        },
        notes: {
            type: DataTypes.TEXT
        },
        status: {
            type: DataTypes.ENUM('draft', 'submitted', 'approved'),
            defaultValue: 'draft'
        }
    });

    RevenueRecord.associate = function(models) {
        RevenueRecord.belongsTo(models.Employee, { foreignKey: 'employeeId' });
        RevenueRecord.belongsTo(models.Store, { foreignKey: 'storeId' });
    };

    return RevenueRecord;
};`
        };

        return modelDefinitions[modelName] || '';
    }

    /**
     * 更新模型關聯關係
     */
    async updateModelAssociations(indexFile) {
        let content = fs.readFileSync(indexFile, 'utf8');
        
        const associationsCode = `
// 建立模型關聯關係
if (db.Employee && db.Store) {
    db.Employee.belongsTo(db.Store, { foreignKey: 'storeId' });
    db.Store.hasMany(db.Employee, { foreignKey: 'storeId' });
}

if (db.Employee && db.AttendanceRecord) {
    db.Employee.hasMany(db.AttendanceRecord, { foreignKey: 'employeeId' });
    db.AttendanceRecord.belongsTo(db.Employee, { foreignKey: 'employeeId' });
}

if (db.Store && db.AttendanceRecord) {
    db.Store.hasMany(db.AttendanceRecord, { foreignKey: 'storeId' });
    db.AttendanceRecord.belongsTo(db.Store, { foreignKey: 'storeId' });
}

if (db.Employee && db.RevenueRecord) {
    db.Employee.hasMany(db.RevenueRecord, { foreignKey: 'employeeId' });
    db.RevenueRecord.belongsTo(db.Employee, { foreignKey: 'employeeId' });
}

if (db.Store && db.RevenueRecord) {
    db.Store.hasMany(db.RevenueRecord, { foreignKey: 'storeId' });
    db.RevenueRecord.belongsTo(db.Store, { foreignKey: 'storeId' });
}`;

        // 如果還沒有關聯關係代碼，就添加進去
        if (!content.includes('建立模型關聯關係')) {
            content = content.replace(
                /module\.exports = db;$/,
                `${associationsCode}\n\nmodule.exports = db;`
            );
            
            fs.writeFileSync(indexFile, content);
            console.log('    ✅ 模型關聯關係更新完成');
        } else {
            console.log('    ⚠️ 模型關聯關係已存在，跳過');
        }
    }

    /**
     * 建置安全防護模組
     */
    async buildSecurityModules() {
        console.log('\n🛡️ 建置安全防護模組...');
        
        const securityModules = [
            {
                name: 'sqlInjectionProtection',
                description: 'SQL注入防護',
                file: 'sqlProtection.js'
            },
            {
                name: 'xssProtection',
                description: 'XSS防護',
                file: 'xssProtection.js'
            },
            {
                name: 'passwordSecurity',
                description: '密碼安全',
                file: 'passwordSecurity.js'
            },
            {
                name: 'accessControl',
                description: '權限控制',
                file: 'accessControl.js'
            }
        ];

        const securityDir = path.join(this.serverPath, 'middleware', 'security');
        if (!fs.existsSync(securityDir)) {
            fs.mkdirSync(securityDir, { recursive: true });
        }

        for (const module of securityModules) {
            console.log(`  🔒 建置 ${module.description}...`);
            
            const moduleFile = path.join(securityDir, module.file);
            if (!fs.existsSync(moduleFile)) {
                const moduleContent = this.generateSecurityModuleContent(module);
                fs.writeFileSync(moduleFile, moduleContent);
                
                this.buildResults.securityModules.push({
                    module: module.name,
                    description: module.description,
                    status: 'created',
                    file: path.relative(this.projectRoot, moduleFile)
                });
                
                this.buildResults.createdFiles.push(path.relative(this.projectRoot, moduleFile));
                console.log(`    ✅ ${module.description} 建置完成`);
            } else {
                console.log(`    ⚠️ ${module.description} 已存在，跳過`);
            }
        }
    }

    /**
     * 生成安全模組內容
     */
    generateSecurityModuleContent(module) {
        const moduleContents = {
            sqlProtection: `
/**
 * SQL注入防護中間件
 */

const sqlInjectionPatterns = [
    /('|(\\-\\-)|(;)|(\\||\\|)|(\\*|\\*))/i,
    /(union|select|insert|delete|update|create|drop|exec|execute)/i,
    /(script|javascript|vbscript|onload|onerror)/i
];

function detectSQLInjection(input) {
    if (typeof input !== 'string') return false;
    
    return sqlInjectionPatterns.some(pattern => pattern.test(input));
}

function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
        .replace(/'/g, "''")
        .replace(/;/g, '')
        .replace(/--/g, '')
        .replace(/\\/\\*/g, '')
        .replace(/\\*/\\/g, '');
}

const sqlInjectionProtection = (req, res, next) => {
    const checkObject = (obj) => {
        for (const key in obj) {
            if (typeof obj[key] === 'string') {
                if (detectSQLInjection(obj[key])) {
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid input detected',
                        message: '輸入包含不安全內容'
                    });
                }
                obj[key] = sanitizeInput(obj[key]);
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                checkObject(obj[key]);
            }
        }
    };
    
    if (req.body) checkObject(req.body);
    if (req.query) checkObject(req.query);
    if (req.params) checkObject(req.params);
    
    next();
};

module.exports = {
    sqlInjectionProtection,
    detectSQLInjection,
    sanitizeInput
};`,

            xssProtection: `
/**
 * XSS防護中間件
 */

const DOMPurify = require('isomorphic-dompurify');

const xssPatterns = [
    /<script[^>]*>.*?<\\/script>/gi,
    /<iframe[^>]*>.*?<\\/iframe>/gi,
    /javascript:/gi,
    /on\\w+\\s*=/gi,
    /<.*?>/gi
];

function detectXSS(input) {
    if (typeof input !== 'string') return false;
    
    return xssPatterns.some(pattern => pattern.test(input));
}

function sanitizeHTML(input) {
    if (typeof input !== 'string') return input;
    
    // 基本的XSS清理
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\\//g, '&#x2F;');
}

const xssProtection = (req, res, next) => {
    const cleanObject = (obj) => {
        for (const key in obj) {
            if (typeof obj[key] === 'string') {
                if (detectXSS(obj[key])) {
                    console.warn(\`XSS attempt detected: \${obj[key]}\`);
                }
                obj[key] = sanitizeHTML(obj[key]);
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                cleanObject(obj[key]);
            }
        }
    };
    
    if (req.body) cleanObject(req.body);
    if (req.query) cleanObject(req.query);
    
    next();
};

module.exports = {
    xssProtection,
    detectXSS,
    sanitizeHTML
};`,

            passwordSecurity: `
/**
 * 密碼安全模組
 */

const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

// 密碼強度檢查規則
const passwordRules = {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireDigits: true,
    requireSpecialChars: false
};

function validatePasswordStrength(password) {
    const errors = [];
    
    if (password.length < passwordRules.minLength) {
        errors.push(\`密碼長度至少需要 \${passwordRules.minLength} 個字符\`);
    }
    
    if (password.length > passwordRules.maxLength) {
        errors.push(\`密碼長度不能超過 \${passwordRules.maxLength} 個字符\`);
    }
    
    if (passwordRules.requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('密碼必須包含至少一個大寫字母');
    }
    
    if (passwordRules.requireLowercase && !/[a-z]/.test(password)) {
        errors.push('密碼必須包含至少一個小寫字母');
    }
    
    if (passwordRules.requireDigits && !/\\d/.test(password)) {
        errors.push('密碼必須包含至少一個數字');
    }
    
    if (passwordRules.requireSpecialChars && !/[!@#$%^&*()_+\\-=\\[\\]{}|;:,.<>?]/.test(password)) {
        errors.push('密碼必須包含至少一個特殊字符');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

async function hashPassword(password) {
    const validation = validatePasswordStrength(password);
    if (!validation.isValid) {
        throw new Error(\`密碼不符合安全要求: \${validation.errors.join(', ')}\`);
    }
    
    return await bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
}

function generateSecurePassword(length = 12) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    return password;
}

module.exports = {
    validatePasswordStrength,
    hashPassword,
    verifyPassword,
    generateSecurePassword
};`,

            accessControl: `
/**
 * 權限控制中間件
 */

const jwt = require('jsonwebtoken');

// 角色權限定義
const roles = {
    admin: {
        permissions: ['read', 'write', 'delete', 'manage_users', 'view_reports'],
        level: 100
    },
    manager: {
        permissions: ['read', 'write', 'view_reports', 'manage_employees'],
        level: 50
    },
    employee: {
        permissions: ['read', 'write_own'],
        level: 10
    },
    guest: {
        permissions: ['read_public'],
        level: 1
    }
};

function hasPermission(userRole, requiredPermission) {
    const role = roles[userRole];
    if (!role) return false;
    
    return role.permissions.includes(requiredPermission);
}

function hasMinimumLevel(userRole, minimumLevel) {
    const role = roles[userRole];
    if (!role) return false;
    
    return role.level >= minimumLevel;
}

const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'No token provided',
            message: '需要認證'
        });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            error: 'Invalid token',
            message: '認證失效'
        });
    }
};

const authorize = (requiredPermission) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Not authenticated',
                message: '未認證'
            });
        }
        
        if (!hasPermission(req.user.role, requiredPermission)) {
            return res.status(403).json({
                success: false,
                error: 'Insufficient permissions',
                message: '權限不足'
            });
        }
        
        next();
    };
};

const requireMinimumLevel = (minimumLevel) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Not authenticated',
                message: '未認證'
            });
        }
        
        if (!hasMinimumLevel(req.user.role, minimumLevel)) {
            return res.status(403).json({
                success: false,
                error: 'Insufficient level',
                message: '權限等級不足'
            });
        }
        
        next();
    };
};

module.exports = {
    authenticate,
    authorize,
    requireMinimumLevel,
    hasPermission,
    hasMinimumLevel,
    roles
};`
        };

        return moduleContents[module.file.replace('.js', '')] || '';
    }

    /**
     * 建置驗證規則模組
     */
    async buildValidationModules() {
        console.log('\n✅ 建置驗證規則模組...');
        
        const validationDir = path.join(this.serverPath, 'middleware', 'validation');
        if (!fs.existsSync(validationDir)) {
            fs.mkdirSync(validationDir, { recursive: true });
        }

        const validationFile = path.join(validationDir, 'validators.js');
        if (!fs.existsSync(validationFile)) {
            const validationContent = this.generateValidationContent();
            fs.writeFileSync(validationFile, validationContent);
            
            this.buildResults.validationRules.push({
                module: 'validators',
                description: '資料驗證規則',
                status: 'created',
                file: path.relative(this.projectRoot, validationFile)
            });
            
            this.buildResults.createdFiles.push(path.relative(this.projectRoot, validationFile));
            console.log('    ✅ 資料驗證規則模組建置完成');
        } else {
            console.log('    ⚠️ 資料驗證規則模組已存在，跳過');
        }
    }

    /**
     * 生成驗證模組內容
     */
    generateValidationContent() {
        return `/**
 * 資料驗證規則模組
 */

// 員工資料驗證
const validateEmployee = (req, res, next) => {
    const { name, idNumber, phone, birthday } = req.body;
    const errors = [];
    
    // 姓名驗證
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
        errors.push('姓名至少需要2個字符');
    }
    
    // 身份證號驗證
    if (!idNumber || !/^[A-Z]\\d{9}$/.test(idNumber)) {
        errors.push('身份證號格式錯誤');
    }
    
    // 電話驗證
    if (!phone || !/^09\\d{8}$/.test(phone)) {
        errors.push('電話號碼格式錯誤');
    }
    
    // 生日驗證
    if (!birthday || !Date.parse(birthday)) {
        errors.push('生日格式錯誤');
    }
    
    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            errors: errors,
            message: '資料驗證失敗'
        });
    }
    
    next();
};

// 考勤資料驗證
const validateAttendance = (req, res, next) => {
    const { employeeId, latitude, longitude, clockType } = req.body;
    const errors = [];
    
    // 員工ID驗證
    if (!employeeId || !Number.isInteger(employeeId) || employeeId <= 0) {
        errors.push('員工ID無效');
    }
    
    // GPS座標驗證
    if (!latitude || !longitude) {
        errors.push('GPS座標必填');
    } else {
        if (latitude < -90 || latitude > 90) {
            errors.push('緯度範圍錯誤');
        }
        if (longitude < -180 || longitude > 180) {
            errors.push('經度範圍錯誤');
        }
    }
    
    // 打卡類型驗證
    if (!clockType || !['in', 'out'].includes(clockType)) {
        errors.push('打卡類型必須為 in 或 out');
    }
    
    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            errors: errors,
            message: '考勤資料驗證失敗'
        });
    }
    
    next();
};

// 營收資料驗證
const validateRevenue = (req, res, next) => {
    const { employeeId, storeId, date, totalIncome, totalExpense } = req.body;
    const errors = [];
    
    // 基本ID驗證
    if (!employeeId || !Number.isInteger(employeeId) || employeeId <= 0) {
        errors.push('員工ID無效');
    }
    
    if (!storeId || !Number.isInteger(storeId) || storeId <= 0) {
        errors.push('分店ID無效');
    }
    
    // 日期驗證
    if (!date || !Date.parse(date)) {
        errors.push('日期格式錯誤');
    }
    
    // 金額驗證
    if (totalIncome !== undefined && (isNaN(totalIncome) || totalIncome < 0)) {
        errors.push('收入金額不能為負數');
    }
    
    if (totalExpense !== undefined && (isNaN(totalExpense) || totalExpense < 0)) {
        errors.push('支出金額不能為負數');
    }
    
    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            errors: errors,
            message: '營收資料驗證失敗'
        });
    }
    
    next();
};

// 分店資料驗證
const validateStore = (req, res, next) => {
    const { name, address, latitude, longitude } = req.body;
    const errors = [];
    
    // 分店名稱驗證
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
        errors.push('分店名稱至少需要2個字符');
    }
    
    // 地址驗證
    if (!address || typeof address !== 'string' || address.trim().length < 5) {
        errors.push('地址至少需要5個字符');
    }
    
    // 座標驗證
    if (latitude !== undefined && (isNaN(latitude) || latitude < -90 || latitude > 90)) {
        errors.push('緯度範圍錯誤');
    }
    
    if (longitude !== undefined && (isNaN(longitude) || longitude < -180 || longitude > 180)) {
        errors.push('經度範圍錯誤');
    }
    
    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            errors: errors,
            message: '分店資料驗證失敗'
        });
    }
    
    next();
};

// 通用分頁驗證
const validatePagination = (req, res, next) => {
    let { page, limit } = req.query;
    
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    
    if (page < 1) page = 1;
    if (limit < 1) limit = 10;
    if (limit > 100) limit = 100; // 限制最大每頁數量
    
    req.query.page = page;
    req.query.limit = limit;
    req.query.offset = (page - 1) * limit;
    
    next();
};

module.exports = {
    validateEmployee,
    validateAttendance,
    validateRevenue,
    validateStore,
    validatePagination
};`;
    }

    /**
     * 建置錯誤處理模組
     */
    async buildErrorHandlers() {
        console.log('\n❌ 建置錯誤處理模組...');
        
        const errorHandlerFile = path.join(this.serverPath, 'middleware', 'errorHandler.js');
        
        if (fs.existsSync(errorHandlerFile)) {
            console.log('    ⚠️ 錯誤處理模組已存在，更新內容...');
            
            // 讀取現有內容並增強
            let content = fs.readFileSync(errorHandlerFile, 'utf8');
            
            // 添加更完整的錯誤處理
            if (!content.includes('Enhanced Error Handler')) {
                const enhancedErrorHandler = this.generateEnhancedErrorHandler();
                fs.writeFileSync(errorHandlerFile, enhancedErrorHandler);
                
                this.buildResults.errorHandlers.push({
                    handler: 'enhancedErrorHandler',
                    description: '增強版錯誤處理器',
                    status: 'updated',
                    file: path.relative(this.projectRoot, errorHandlerFile)
                });
                
                console.log('    ✅ 錯誤處理模組更新完成');
            } else {
                console.log('    ⚠️ 錯誤處理模組已是最新版本，跳過');
            }
        } else {
            // 創建新的錯誤處理模組
            const errorHandlerContent = this.generateEnhancedErrorHandler();
            fs.writeFileSync(errorHandlerFile, errorHandlerContent);
            
            this.buildResults.errorHandlers.push({
                handler: 'enhancedErrorHandler',
                description: '增強版錯誤處理器',
                status: 'created',
                file: path.relative(this.projectRoot, errorHandlerFile)
            });
            
            this.buildResults.createdFiles.push(path.relative(this.projectRoot, errorHandlerFile));
            console.log('    ✅ 錯誤處理模組建置完成');
        }
    }

    /**
     * 生成增強版錯誤處理器
     */
    generateEnhancedErrorHandler() {
        return `/**
 * Enhanced Error Handler
 * 增強版統一錯誤處理中間件
 */

const logger = require('../utils/logger');

// 錯誤代碼對應表
const errorCodes = {
    VALIDATION_ERROR: 'E001',
    AUTHENTICATION_ERROR: 'E002',
    AUTHORIZATION_ERROR: 'E003',
    NOT_FOUND_ERROR: 'E004',
    DATABASE_ERROR: 'E005',
    NETWORK_ERROR: 'E006',
    FILE_ERROR: 'E007',
    GPS_ERROR: 'E008',
    BUSINESS_LOGIC_ERROR: 'E009',
    UNKNOWN_ERROR: 'E999'
};

// 錯誤分類器
function classifyError(error) {
    if (error.name === 'ValidationError' || error.name === 'SequelizeValidationError') {
        return { type: 'VALIDATION_ERROR', statusCode: 400 };
    }
    
    if (error.name === 'UnauthorizedError' || error.message.includes('token')) {
        return { type: 'AUTHENTICATION_ERROR', statusCode: 401 };
    }
    
    if (error.name === 'ForbiddenError' || error.message.includes('permission')) {
        return { type: 'AUTHORIZATION_ERROR', statusCode: 403 };
    }
    
    if (error.name === 'NotFoundError' || error.message.includes('not found')) {
        return { type: 'NOT_FOUND_ERROR', statusCode: 404 };
    }
    
    if (error.name === 'SequelizeError' || error.message.includes('database')) {
        return { type: 'DATABASE_ERROR', statusCode: 500 };
    }
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        return { type: 'NETWORK_ERROR', statusCode: 503 };
    }
    
    if (error.code === 'ENOENT' || error.message.includes('file')) {
        return { type: 'FILE_ERROR', statusCode: 500 };
    }
    
    if (error.message.includes('GPS') || error.message.includes('location')) {
        return { type: 'GPS_ERROR', statusCode: 400 };
    }
    
    return { type: 'UNKNOWN_ERROR', statusCode: 500 };
}

// 生成用戶友善的錯誤訊息
function generateUserMessage(errorType) {
    const messages = {
        VALIDATION_ERROR: '輸入的資料格式不正確，請檢查後重新提交',
        AUTHENTICATION_ERROR: '登入已過期，請重新登入',
        AUTHORIZATION_ERROR: '您沒有權限執行此操作',
        NOT_FOUND_ERROR: '找不到您要求的資源',
        DATABASE_ERROR: '資料庫暫時無法存取，請稍後重試',
        NETWORK_ERROR: '網路連接異常，請檢查網路狀態',
        FILE_ERROR: '檔案處理失敗，請重新上傳',
        GPS_ERROR: 'GPS定位失敗，請確認定位權限',
        BUSINESS_LOGIC_ERROR: '業務邏輯處理異常',
        UNKNOWN_ERROR: '系統發生未知錯誤，請聯繫系統管理員'
    };
    
    return messages[errorType] || messages.UNKNOWN_ERROR;
}

// 主要錯誤處理中間件
const errorHandler = (err, req, res, next) => {
    const { type, statusCode } = classifyError(err);
    const errorCode = errorCodes[type];
    const userMessage = generateUserMessage(type);
    
    // 記錄詳細錯誤信息
    logger.error('Error occurred:', {
        error: err.message,
        stack: err.stack,
        type: type,
        errorCode: errorCode,
        url: req.url,
        method: req.method,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        timestamp: new Date().toISOString()
    });
    
    // 開發環境顯示詳細錯誤，生產環境隱藏敏感信息
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    const errorResponse = {
        success: false,
        error: {
            code: errorCode,
            type: type,
            message: userMessage
        },
        timestamp: new Date().toISOString(),
        path: req.path
    };
    
    // 開發環境添加更多調試信息
    if (isDevelopment) {
        errorResponse.debug = {
            originalError: err.message,
            stack: err.stack
        };
    }
    
    // 特殊處理驗證錯誤
    if (type === 'VALIDATION_ERROR' && err.errors) {
        errorResponse.error.details = err.errors;
    }
    
    res.status(statusCode).json(errorResponse);
};

// 404 處理中間件
const notFoundHandler = (req, res) => {
    const errorResponse = {
        success: false,
        error: {
            code: errorCodes.NOT_FOUND_ERROR,
            type: 'NOT_FOUND_ERROR',
            message: generateUserMessage('NOT_FOUND_ERROR')
        },
        timestamp: new Date().toISOString(),
        path: req.path
    };
    
    res.status(404).json(errorResponse);
};

// Promise 拒絕處理
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // 不要退出進程，但要記錄錯誤
});

// 未捕獲異常處理
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    // 在生產環境中，可能需要優雅地關閉進程
    if (process.env.NODE_ENV === 'production') {
        setTimeout(() => {
            process.exit(1);
        }, 1000);
    }
});

module.exports = {
    errorHandler,
    notFoundHandler,
    errorCodes,
    classifyError,
    generateUserMessage
};`;
    }

    /**
     * 建置效能優化模組
     */
    async buildPerformanceOptimizations() {
        console.log('\n⚡ 建置效能優化模組...');
        
        const performanceDir = path.join(this.serverPath, 'middleware', 'performance');
        if (!fs.existsSync(performanceDir)) {
            fs.mkdirSync(performanceDir, { recursive: true });
        }

        const optimizations = [
            {
                name: 'cacheMiddleware',
                file: 'cache.js',
                description: '緩存中間件'
            },
            {
                name: 'compressionMiddleware',
                file: 'compression.js',
                description: '壓縮中間件'
            },
            {
                name: 'rateLimitMiddleware',
                file: 'rateLimit.js',
                description: '請求限制中間件'
            }
        ];

        for (const optimization of optimizations) {
            console.log(`  ⚡ 建置 ${optimization.description}...`);
            
            const optimizationFile = path.join(performanceDir, optimization.file);
            if (!fs.existsSync(optimizationFile)) {
                const content = this.generatePerformanceOptimizationContent(optimization);
                fs.writeFileSync(optimizationFile, content);
                
                this.buildResults.performanceOptimizations.push({
                    optimization: optimization.name,
                    description: optimization.description,
                    status: 'created',
                    file: path.relative(this.projectRoot, optimizationFile)
                });
                
                this.buildResults.createdFiles.push(path.relative(this.projectRoot, optimizationFile));
                console.log(`    ✅ ${optimization.description} 建置完成`);
            } else {
                console.log(`    ⚠️ ${optimization.description} 已存在，跳過`);
            }
        }
    }

    /**
     * 生成效能優化模組內容
     */
    generatePerformanceOptimizationContent(optimization) {
        const contents = {
            cache: `/**
 * 緩存中間件
 */

const NodeCache = require('node-cache');

// 創建緩存實例
const cache = new NodeCache({
    stdTTL: 600, // 預設10分鐘過期
    checkperiod: 120, // 每2分鐘檢查過期項目
    useClones: false
});

// 生成緩存鍵
function generateCacheKey(req) {
    const { method, originalUrl, query, user } = req;
    const userId = user ? user.id : 'anonymous';
    return \`\${method}:\${originalUrl}:\${JSON.stringify(query)}:\${userId}\`;
}

// 緩存中間件
const cacheMiddleware = (ttl = 600) => {
    return (req, res, next) => {
        // 只緩存GET請求
        if (req.method !== 'GET') {
            return next();
        }
        
        const key = generateCacheKey(req);
        const cachedData = cache.get(key);
        
        if (cachedData) {
            console.log(\`Cache hit: \${key}\`);
            return res.json(cachedData);
        }
        
        // 攔截原始的json方法
        const originalJson = res.json;
        res.json = function(data) {
            // 只緩存成功的回應
            if (data && data.success !== false) {
                cache.set(key, data, ttl);
                console.log(\`Cache set: \${key}\`);
            }
            
            // 調用原始方法
            originalJson.call(this, data);
        };
        
        next();
    };
};

// 清除特定模式的緩存
function clearCache(pattern) {
    const keys = cache.keys();
    const matchingKeys = keys.filter(key => key.includes(pattern));
    
    matchingKeys.forEach(key => {
        cache.del(key);
    });
    
    console.log(\`Cleared \${matchingKeys.length} cache entries matching: \${pattern}\`);
}

// 獲取緩存統計
function getCacheStats() {
    return {
        keys: cache.getStats().keys,
        hits: cache.getStats().hits,
        misses: cache.getStats().misses,
        ksize: cache.getStats().ksize,
        vsize: cache.getStats().vsize
    };
}

module.exports = {
    cacheMiddleware,
    clearCache,
    getCacheStats,
    cache
};`,

            compression: `/**
 * 壓縮中間件
 */

const compression = require('compression');
const zlib = require('zlib');

// 壓縮配置
const compressionOptions = {
    // 壓縮閾值（bytes）
    threshold: 1024,
    
    // 壓縮等級 (0-9)
    level: 6,
    
    // 只壓縮特定的MIME類型
    filter: (req, res) => {
        // 不壓縮已經壓縮的內容
        if (req.headers['x-no-compression']) {
            return false;
        }
        
        // 使用預設的壓縮過濾器
        return compression.filter(req, res);
    }
};

// Brotli 壓縮中間件（更高效的壓縮）
const brotliMiddleware = (req, res, next) => {
    const acceptEncoding = req.headers['accept-encoding'] || '';
    
    if (acceptEncoding.includes('br')) {
        // 攔截原始的send和json方法
        const originalSend = res.send;
        const originalJson = res.json;
        
        res.send = function(data) {
            if (typeof data === 'string' && data.length > 1024) {
                zlib.brotliCompress(data, (err, compressed) => {
                    if (!err && compressed.length < data.length) {
                        res.setHeader('Content-Encoding', 'br');
                        res.setHeader('Content-Length', compressed.length);
                        return originalSend.call(this, compressed);
                    }
                    originalSend.call(this, data);
                });
                return;
            }
            originalSend.call(this, data);
        };
        
        res.json = function(data) {
            const jsonString = JSON.stringify(data);
            if (jsonString.length > 1024) {
                zlib.brotliCompress(jsonString, (err, compressed) => {
                    if (!err && compressed.length < jsonString.length) {
                        res.setHeader('Content-Encoding', 'br');
                        res.setHeader('Content-Type', 'application/json');
                        res.setHeader('Content-Length', compressed.length);
                        return res.end(compressed);
                    }
                    originalJson.call(this, data);
                });
                return;
            }
            originalJson.call(this, data);
        };
    }
    
    next();
};

module.exports = {
    compressionMiddleware: compression(compressionOptions),
    brotliMiddleware,
    compressionOptions
};`,

            rateLimit: `/**
 * 請求限制中間件
 */

const rateLimit = require('express-rate-limit');
const MongoStore = require('rate-limit-mongo');

// 創建不同等級的速率限制
const createRateLimit = (windowMs, max, message, skipSuccessfulRequests = false) => {
    return rateLimit({
        windowMs,
        max,
        message: {
            success: false,
            error: message,
            retryAfter: Math.ceil(windowMs / 1000)
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests,
        // 根據用戶ID或IP生成key
        keyGenerator: (req) => {
            return req.user?.id || req.ip;
        }
    });
};

// 基本請求限制（每小時100個請求）
const basicRateLimit = createRateLimit(
    60 * 60 * 1000, // 1小時
    100,
    '請求過於頻繁，請稍後再試'
);

// 嚴格請求限制（每分鐘5個請求）- 用於登入等敏感操作
const strictRateLimit = createRateLimit(
    60 * 1000, // 1分鐘
    5,
    '操作過於頻繁，請稍後再試',
    true // 跳過成功的請求
);

// API請求限制（每分鐘30個請求）
const apiRateLimit = createRateLimit(
    60 * 1000, // 1分鐘
    30,
    'API請求過於頻繁，請稍後再試'
);

// 上傳請求限制（每小時10個上傳）
const uploadRateLimit = createRateLimit(
    60 * 60 * 1000, // 1小時
    10,
    '上傳過於頻繁，請稍後再試'
);

// 自定義速率限制中間件
const customRateLimit = (options) => {
    const {
        windowMs = 15 * 60 * 1000, // 預設15分鐘
        max = 100, // 預設100個請求
        message = '請求過於頻繁',
        skipCondition = null // 跳過條件函數
    } = options;
    
    return rateLimit({
        windowMs,
        max,
        message: {
            success: false,
            error: message,
            retryAfter: Math.ceil(windowMs / 1000)
        },
        skip: (req) => {
            // 如果提供了跳過條件，使用它
            if (typeof skipCondition === 'function') {
                return skipCondition(req);
            }
            
            // 管理員跳過速率限制
            return req.user && req.user.role === 'admin';
        },
        keyGenerator: (req) => {
            return req.user?.id || req.ip;
        },
        onLimitReached: (req) => {
            console.warn(\`Rate limit reached for \${req.user?.id || req.ip}\`);
        }
    });
};

module.exports = {
    basicRateLimit,
    strictRateLimit,
    apiRateLimit,
    uploadRateLimit,
    customRateLimit
};`
        };

        return contents[optimization.file.replace('.js', '')] || '';
    }

    /**
     * 生成建置報告
     */
    generateBuildReport() {
        console.log('\n📊 核心業務模組建置報告:');
        console.log('='.repeat(70));

        // API端點建置統計
        console.log('\n🔗 API端點建置:');
        console.log(`  建置端點總數: ${this.buildResults.apiEndpoints.length}`);
        this.buildResults.apiEndpoints.forEach(endpoint => {
            console.log(`    ✅ ${endpoint.method} ${endpoint.endpoint} (${endpoint.status})`);
        });

        // 前端頁面建置統計
        console.log('\n📱 前端頁面建置:');
        console.log(`  建置頁面總數: ${this.buildResults.frontendPages.length}`);
        this.buildResults.frontendPages.forEach(page => {
            console.log(`    ✅ ${page.page} - ${page.title} (${page.status})`);
        });

        // 資料庫模型建置統計
        console.log('\n🗄️ 資料庫模型建置:');
        console.log(`  建置模型總數: ${this.buildResults.databaseModels.length}`);
        this.buildResults.databaseModels.forEach(model => {
            console.log(`    ✅ ${model.model} (${model.status})`);
        });

        // 安全模組建置統計
        console.log('\n🛡️ 安全模組建置:');
        console.log(`  建置模組總數: ${this.buildResults.securityModules.length}`);
        this.buildResults.securityModules.forEach(module => {
            console.log(`    ✅ ${module.description} (${module.status})`);
        });

        // 驗證規則建置統計
        console.log('\n✅ 驗證規則建置:');
        console.log(`  建置模組總數: ${this.buildResults.validationRules.length}`);
        this.buildResults.validationRules.forEach(rule => {
            console.log(`    ✅ ${rule.description} (${rule.status})`);
        });

        // 錯誤處理建置統計
        console.log('\n❌ 錯誤處理建置:');
        console.log(`  建置處理器總數: ${this.buildResults.errorHandlers.length}`);
        this.buildResults.errorHandlers.forEach(handler => {
            console.log(`    ✅ ${handler.description} (${handler.status})`);
        });

        // 效能優化建置統計
        console.log('\n⚡ 效能優化建置:');
        console.log(`  建置優化總數: ${this.buildResults.performanceOptimizations.length}`);
        this.buildResults.performanceOptimizations.forEach(optimization => {
            console.log(`    ✅ ${optimization.description} (${optimization.status})`);
        });

        // 創建文件統計
        console.log('\n📄 新建文件統計:');
        console.log(`  新建文件總數: ${this.buildResults.createdFiles.length}`);
        if (this.buildResults.createdFiles.length > 0) {
            console.log('  新建文件清單:');
            this.buildResults.createdFiles.forEach(file => {
                console.log(`    📄 ${file}`);
            });
        }

        // 改善建議
        this.generateBuildRecommendations();

        console.log('\n✅ 核心業務模組建置完成');
        console.log(`📊 總計建置項目: ${
            this.buildResults.apiEndpoints.length + 
            this.buildResults.frontendPages.length + 
            this.buildResults.databaseModels.length + 
            this.buildResults.securityModules.length + 
            this.buildResults.validationRules.length + 
            this.buildResults.errorHandlers.length + 
            this.buildResults.performanceOptimizations.length
        }`);
    }

    /**
     * 生成建置建議
     */
    generateBuildRecommendations() {
        console.log('\n💡 下一步建議:');

        const recommendations = [
            '🔧 [立即執行] 測試新建置的API端點功能',
            '🧪 [高優先級] 為新建模組編寫單元測試',
            '📚 [中優先級] 完善API文檔和使用說明',
            '🔒 [高優先級] 配置JWT密鑰和安全參數',
            '📱 [中優先級] 完善前端頁面的JavaScript功能',
            '🗄️ [高優先級] 執行資料庫遷移同步模型',
            '⚡ [中優先級] 配置緩存和效能監控',
            '🚀 [低優先級] 準備生產環境部署配置'
        ];

        recommendations.forEach((rec, index) => {
            console.log(`  ${index + 1}. ${rec}`);
        });

        this.buildResults.recommendations = recommendations;
    }

    /**
     * 導出建置結果
     */
    exportBuildResults() {
        const reportFile = path.join(this.projectRoot, 'core-module-build-report.json');

        try {
            fs.writeFileSync(reportFile, JSON.stringify(this.buildResults, null, 2));
            console.log(`\n📄 核心模組建置報告已導出: core-module-build-report.json`);
            return reportFile;
        } catch (error) {
            console.error('❌ 導出建置報告失敗:', error.message);
            return null;
        }
    }
}

// 執行建置
async function main() {
    const builder = new CoreModuleBuilder();
    await builder.executeCoreModuleBuilding();
    builder.exportBuildResults();
}

if (require.main === module) {
    main();
}

module.exports = CoreModuleBuilder;