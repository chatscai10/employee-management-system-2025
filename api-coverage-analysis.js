#!/usr/bin/env node
/**
 * 🔗 API端點覆蓋率和功能完整性分析
 * 深度分析API端點覆蓋情況、識別遺漏功能和業務邏輯缺口
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

class APICoverageAnalyzer {
    constructor() {
        this.projectRoot = __dirname;
        this.baseUrl = 'http://localhost:3000';
        this.analysisResults = {
            discoveredEndpoints: [],
            missingEndpoints: [],
            businessLogicGaps: [],
            apiDocumentation: [],
            testResults: [],
            recommendations: []
        };
        
        // 企業級員工管理系統應有的API端點
        this.expectedEndpoints = {
            // 認證相關
            authentication: [
                { method: 'POST', path: '/api/auth/login', description: '用戶登入' },
                { method: 'POST', path: '/api/auth/logout', description: '用戶登出' },
                { method: 'POST', path: '/api/auth/register', description: '用戶註冊' },
                { method: 'GET', path: '/api/auth/verify', description: 'Token驗證' },
                { method: 'POST', path: '/api/auth/refresh', description: 'Token刷新' },
                { method: 'POST', path: '/api/auth/forgot-password', description: '忘記密碼' },
                { method: 'POST', path: '/api/auth/reset-password', description: '重置密碼' }
            ],
            
            // 員工管理
            employee: [
                { method: 'GET', path: '/api/employees', description: '獲取員工列表' },
                { method: 'GET', path: '/api/employees/:id', description: '獲取員工詳情' },
                { method: 'POST', path: '/api/employees', description: '創建員工' },
                { method: 'PUT', path: '/api/employees/:id', description: '更新員工' },
                { method: 'DELETE', path: '/api/employees/:id', description: '刪除員工' },
                { method: 'PATCH', path: '/api/employees/:id/status', description: '更新員工狀態' },
                { method: 'GET', path: '/api/employees/:id/profile', description: '獲取員工檔案' },
                { method: 'PUT', path: '/api/employees/:id/profile', description: '更新員工檔案' }
            ],
            
            // 考勤管理
            attendance: [
                { method: 'POST', path: '/api/attendance/clock', description: '上下班打卡' },
                { method: 'GET', path: '/api/attendance/records', description: '獲取考勤記錄' },
                { method: 'GET', path: '/api/attendance/records/:id', description: '獲取考勤詳情' },
                { method: 'PUT', path: '/api/attendance/records/:id', description: '更新考勤記錄' },
                { method: 'DELETE', path: '/api/attendance/records/:id', description: '刪除考勤記錄' },
                { method: 'GET', path: '/api/attendance/summary', description: '考勤統計' },
                { method: 'GET', path: '/api/attendance/store-info', description: '獲取分店資訊' },
                { method: 'POST', path: '/api/attendance/correction', description: '考勤修正申請' }
            ],
            
            // 營收管理
            revenue: [
                { method: 'GET', path: '/api/revenue/config', description: '獲取營收配置' },
                { method: 'POST', path: '/api/revenue/add', description: '新增營收記錄' },
                { method: 'GET', path: '/api/revenue/records', description: '獲取營收記錄' },
                { method: 'GET', path: '/api/revenue/records/:id', description: '獲取營收詳情' },
                { method: 'PUT', path: '/api/revenue/records/:id', description: '更新營收記錄' },
                { method: 'PATCH', path: '/api/revenue/records/:id/cancel', description: '作廢營收記錄' },
                { method: 'GET', path: '/api/revenue/summary', description: '營收統計' },
                { method: 'GET', path: '/api/revenue/reports', description: '營收報表' }
            ],
            
            // 管理員功能
            admin: [
                { method: 'GET', path: '/api/admin/stats', description: '獲取統計數據' },
                { method: 'GET', path: '/api/admin/employees', description: '管理員獲取員工列表' },
                { method: 'GET', path: '/api/admin/employees/:id', description: '管理員獲取員工詳情' },
                { method: 'PUT', path: '/api/admin/employees/:id', description: '管理員更新員工' },
                { method: 'PATCH', path: '/api/admin/employees/:id/approve', description: '審核員工' },
                { method: 'GET', path: '/api/admin/stores', description: '獲取分店列表' },
                { method: 'POST', path: '/api/admin/stores', description: '創建分店' },
                { method: 'PUT', path: '/api/admin/stores/:id', description: '更新分店' },
                { method: 'DELETE', path: '/api/admin/stores/:id', description: '刪除分店' }
            ],
            
            // 分店管理
            stores: [
                { method: 'GET', path: '/api/stores', description: '獲取分店列表' },
                { method: 'GET', path: '/api/stores/:id', description: '獲取分店詳情' },
                { method: 'PUT', path: '/api/stores/:id/settings', description: '更新分店設定' },
                { method: 'GET', path: '/api/stores/:id/employees', description: '獲取分店員工' },
                { method: 'GET', path: '/api/stores/:id/statistics', description: '獲取分店統計' }
            ],
            
            // 報表功能
            reports: [
                { method: 'GET', path: '/api/reports/attendance', description: '考勤報表' },
                { method: 'GET', path: '/api/reports/revenue', description: '營收報表' },
                { method: 'GET', path: '/api/reports/employee', description: '員工報表' },
                { method: 'GET', path: '/api/reports/dashboard', description: '儀表板數據' },
                { method: 'POST', path: '/api/reports/export', description: '報表匯出' }
            ],
            
            // 系統功能
            system: [
                { method: 'GET', path: '/health', description: '健康檢查' },
                { method: 'GET', path: '/api/system/status', description: '系統狀態' },
                { method: 'GET', path: '/api/system/config', description: '系統配置' },
                { method: 'PUT', path: '/api/system/config', description: '更新系統配置' },
                { method: 'POST', path: '/api/system/backup', description: '系統備份' },
                { method: 'GET', path: '/api/system/logs', description: '系統日誌' }
            ],
            
            // 通知功能
            notifications: [
                { method: 'GET', path: '/api/notifications', description: '獲取通知列表' },
                { method: 'POST', path: '/api/notifications', description: '發送通知' },
                { method: 'PATCH', path: '/api/notifications/:id/read', description: '標記已讀' },
                { method: 'DELETE', path: '/api/notifications/:id', description: '刪除通知' },
                { method: 'GET', path: '/api/notifications/settings', description: '通知設定' },
                { method: 'PUT', path: '/api/notifications/settings', description: '更新通知設定' }
            ]
        };
    }

    /**
     * 執行API覆蓋率分析
     */
    async executeAPICoverageAnalysis() {
        console.log('🔗 開始API端點覆蓋率分析...');
        console.log('='.repeat(70));
        
        try {
            // 1. 發現現有API端點
            await this.discoverExistingEndpoints();
            
            // 2. 測試現有端點
            await this.testExistingEndpoints();
            
            // 3. 分析缺失的端點
            await this.analyzeMissingEndpoints();
            
            // 4. 檢查業務邏輯完整性
            await this.analyzeBusinessLogicGaps();
            
            // 5. 生成API文檔結構
            await this.generateAPIDocumentation();
            
            // 6. 生成分析報告
            this.generateComprehensiveReport();
            
        } catch (error) {
            console.error('❌ API覆蓋率分析失敗:', error);
        }
    }

    /**
     * 發現現有API端點
     */
    async discoverExistingEndpoints() {
        console.log('\n🔍 發現現有API端點...');
        
        const routesPath = path.join(this.projectRoot, 'server', 'routes');
        if (!fs.existsSync(routesPath)) {
            console.log('  ❌ 路由目錄不存在');
            return;
        }
        
        const discoveredEndpoints = [];
        
        // 遞歸搜索路由文件
        const routeFiles = this.getFilesRecursively(routesPath, ['.js']);
        console.log(`  找到 ${routeFiles.length} 個路由文件`);
        
        for (const routeFile of routeFiles) {
            try {
                const content = fs.readFileSync(routeFile, 'utf8');
                const fileName = path.basename(routeFile);
                
                console.log(`\n  📄 分析 ${fileName}:`);
                
                // 提取路由定義
                const routes = this.extractRoutesFromFile(content, fileName);
                discoveredEndpoints.push(...routes);
                
                routes.forEach(route => {
                    console.log(`    ${route.method.toUpperCase().padEnd(6)} ${route.path} - ${route.description}`);
                });
                
            } catch (error) {
                console.error(`    ❌ 分析文件失敗: ${routeFile}`, error.message);
            }
        }
        
        this.analysisResults.discoveredEndpoints = discoveredEndpoints;
        console.log(`\n  📊 總計發現 ${discoveredEndpoints.length} 個API端點`);
    }

    /**
     * 從文件中提取路由定義
     */
    extractRoutesFromFile(content, fileName) {
        const routes = [];
        const lines = content.split('\n');
        
        // 正則表達式匹配路由定義
        const routePatterns = [
            /router\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
            /app\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/gi
        ];
        
        let currentPath = this.inferPathFromFileName(fileName);
        
        for (let lineNum = 0; lineNum < lines.length; lineNum++) {
            const line = lines[lineNum];
            
            for (const pattern of routePatterns) {
                pattern.lastIndex = 0; // 重置regex狀態
                const matches = pattern.exec(line);
                
                if (matches) {
                    const method = matches[1].toUpperCase();
                    let path = matches[2];
                    
                    // 構建完整路徑
                    if (!path.startsWith('/')) {
                        path = '/' + path;
                    }
                    
                    if (currentPath && !path.startsWith('/api/')) {
                        path = currentPath + path;
                    }
                    
                    // 提取描述（從註釋或函數名）
                    let description = this.extractDescriptionFromContext(lines, lineNum);
                    
                    routes.push({
                        method: method,
                        path: path,
                        description: description || '未提供描述',
                        file: fileName,
                        line: lineNum + 1
                    });
                }
            }
        }
        
        return routes;
    }

    /**
     * 從文件名推斷路徑前綴
     */
    inferPathFromFileName(fileName) {
        const baseName = path.basename(fileName, '.js');
        
        const pathMap = {
            'auth': '/api/auth',
            'admin': '/api/admin',
            'attendance': '/api/attendance',
            'revenue': '/api/revenue',
            'employees': '/api/employees',
            'stores': '/api/stores',
            'reports': '/api/reports',
            'notifications': '/api/notifications',
            'system': '/api/system'
        };
        
        return pathMap[baseName] || `/api/${baseName}`;
    }

    /**
     * 從上下文提取描述
     */
    extractDescriptionFromContext(lines, currentLine) {
        // 向上查找註釋
        for (let i = currentLine - 1; i >= Math.max(0, currentLine - 5); i--) {
            const line = lines[i].trim();
            
            // 查找註釋
            if (line.startsWith('//') || line.startsWith('*')) {
                const comment = line.replace(/^(\/\/|\*)\s*/, '');
                if (comment && !comment.includes('TODO') && !comment.includes('FIXME')) {
                    return comment;
                }
            }
            
            // 查找JSDoc註釋
            const jsdocMatch = line.match(/\*\s*(.+)/);
            if (jsdocMatch) {
                return jsdocMatch[1];
            }
        }
        
        // 從路由處理函數名推斷
        const nextLine = lines[currentLine + 1];
        if (nextLine) {
            const funcMatch = nextLine.match(/async\s+function\s+(\w+)|function\s+(\w+)|const\s+(\w+)\s*=/);
            if (funcMatch) {
                const funcName = funcMatch[1] || funcMatch[2] || funcMatch[3];
                return this.convertFunctionNameToDescription(funcName);
            }
        }
        
        return null;
    }

    /**
     * 將函數名轉換為描述
     */
    convertFunctionNameToDescription(funcName) {
        const descriptions = {
            'login': '用戶登入',
            'logout': '用戶登出',
            'register': '用戶註冊',
            'verify': 'Token驗證',
            'getEmployees': '獲取員工列表',
            'createEmployee': '創建員工',
            'updateEmployee': '更新員工',
            'deleteEmployee': '刪除員工',
            'clockIn': '上班打卡',
            'clockOut': '下班打卡',
            'getAttendance': '獲取考勤記錄',
            'addRevenue': '新增營收記錄',
            'getStats': '獲取統計數據',
            'approveEmployee': '審核員工'
        };
        
        return descriptions[funcName] || funcName;
    }

    /**
     * 測試現有端點
     */
    async testExistingEndpoints() {
        console.log('\n🧪 測試現有API端點...');
        
        const testResults = [];
        const testableEndpoints = this.analysisResults.discoveredEndpoints.filter(endpoint => 
            endpoint.method === 'GET' && !endpoint.path.includes(':')
        );
        
        console.log(`  將測試 ${testableEndpoints.length} 個GET端點`);
        
        for (const endpoint of testableEndpoints) {
            try {
                const result = await this.testEndpoint(endpoint);
                testResults.push(result);
                
                const status = result.success ? '✅' : '❌';
                console.log(`    ${status} ${endpoint.method} ${endpoint.path} - ${result.statusCode} (${result.responseTime}ms)`);
                
                if (!result.success && result.error) {
                    console.log(`      錯誤: ${result.error}`);
                }
                
            } catch (error) {
                console.log(`    ❌ ${endpoint.method} ${endpoint.path} - 測試失敗: ${error.message}`);
                testResults.push({
                    endpoint: endpoint,
                    success: false,
                    error: error.message,
                    statusCode: null,
                    responseTime: null
                });
            }
            
            // 避免過於頻繁的請求
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        this.analysisResults.testResults = testResults;
        
        const successCount = testResults.filter(r => r.success).length;
        const successRate = testResults.length ? (successCount / testResults.length * 100).toFixed(1) : 0;
        
        console.log(`\n  📊 測試結果: ${successCount}/${testResults.length} 成功 (${successRate}%)`);
    }

    /**
     * 測試單個端點
     */
    async testEndpoint(endpoint) {
        return new Promise((resolve) => {
            const url = new URL(endpoint.path, this.baseUrl);
            const options = {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname + url.search,
                method: endpoint.method,
                timeout: 5000
            };
            
            const startTime = Date.now();
            
            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    const endTime = Date.now();
                    resolve({
                        endpoint: endpoint,
                        success: res.statusCode < 500,
                        statusCode: res.statusCode,
                        responseTime: endTime - startTime,
                        response: data
                    });
                });
            });
            
            req.on('error', (error) => {
                resolve({
                    endpoint: endpoint,
                    success: false,
                    error: error.message,
                    statusCode: null,
                    responseTime: null
                });
            });
            
            req.on('timeout', () => {
                req.destroy();
                resolve({
                    endpoint: endpoint,
                    success: false,
                    error: 'Request timeout',
                    statusCode: null,
                    responseTime: null
                });
            });
            
            req.end();
        });
    }

    /**
     * 分析缺失的端點
     */
    async analyzeMissingEndpoints() {
        console.log('\n❌ 分析缺失的API端點...');
        
        const missingEndpoints = [];
        const existingPaths = new Set(this.analysisResults.discoveredEndpoints.map(ep => 
            `${ep.method}:${ep.path.replace(/:[^/]+/g, ':param')}`
        ));
        
        for (const [category, endpoints] of Object.entries(this.expectedEndpoints)) {
            console.log(`\n  檢查 ${category} 類別:`);
            
            const categoryMissing = [];
            
            for (const expectedEndpoint of endpoints) {
                const key = `${expectedEndpoint.method}:${expectedEndpoint.path.replace(/:[^/]+/g, ':param')}`;
                
                if (!existingPaths.has(key)) {
                    console.log(`    ❌ 缺少: ${expectedEndpoint.method} ${expectedEndpoint.path}`);
                    categoryMissing.push(expectedEndpoint);
                } else {
                    console.log(`    ✅ 存在: ${expectedEndpoint.method} ${expectedEndpoint.path}`);
                }
            }
            
            if (categoryMissing.length > 0) {
                missingEndpoints.push({
                    category: category,
                    missing: categoryMissing,
                    completeness: ((endpoints.length - categoryMissing.length) / endpoints.length * 100).toFixed(1)
                });
            }
        }
        
        this.analysisResults.missingEndpoints = missingEndpoints;
        
        const totalExpected = Object.values(this.expectedEndpoints).flat().length;
        const totalMissing = missingEndpoints.reduce((sum, cat) => sum + cat.missing.length, 0);
        const overallCompleteness = ((totalExpected - totalMissing) / totalExpected * 100).toFixed(1);
        
        console.log(`\n  📊 整體API完整性: ${overallCompleteness}% (${totalExpected - totalMissing}/${totalExpected})`);
    }

    /**
     * 分析業務邏輯缺口
     */
    async analyzeBusinessLogicGaps() {
        console.log('\n🔍 分析業務邏輯缺口...');
        
        const businessLogicGaps = [];
        
        // 檢查員工生命週期管理
        const employeeGaps = this.checkEmployeeLifecycleGaps();
        if (employeeGaps.length > 0) {
            businessLogicGaps.push({
                area: '員工生命週期管理',
                gaps: employeeGaps
            });
        }
        
        // 檢查考勤管理完整性
        const attendanceGaps = this.checkAttendanceManagementGaps();
        if (attendanceGaps.length > 0) {
            businessLogicGaps.push({
                area: '考勤管理',
                gaps: attendanceGaps
            });
        }
        
        // 檢查營收管理完整性
        const revenueGaps = this.checkRevenueManagementGaps();
        if (revenueGaps.length > 0) {
            businessLogicGaps.push({
                area: '營收管理',
                gaps: revenueGaps
            });
        }
        
        // 檢查報表分析功能
        const reportingGaps = this.checkReportingGaps();
        if (reportingGaps.length > 0) {
            businessLogicGaps.push({
                area: '報表分析',
                gaps: reportingGaps
            });
        }
        
        this.analysisResults.businessLogicGaps = businessLogicGaps;
        
        businessLogicGaps.forEach(area => {
            console.log(`\n  ❌ ${area.area}:`);
            area.gaps.forEach(gap => {
                console.log(`    • ${gap}`);
            });
        });
    }

    checkEmployeeLifecycleGaps() {
        const gaps = [];
        const existingPaths = this.analysisResults.discoveredEndpoints.map(ep => ep.path);
        
        if (!existingPaths.some(path => path.includes('/employees') && path.includes('/profile'))) {
            gaps.push('缺少員工個人檔案管理API');
        }
        
        if (!existingPaths.some(path => path.includes('/auth/forgot-password'))) {
            gaps.push('缺少密碼重置功能');
        }
        
        if (!existingPaths.some(path => path.includes('/employees') && path.includes('/performance'))) {
            gaps.push('缺少員工績效評估API');
        }
        
        return gaps;
    }

    checkAttendanceManagementGaps() {
        const gaps = [];
        const existingPaths = this.analysisResults.discoveredEndpoints.map(ep => ep.path);
        
        if (!existingPaths.some(path => path.includes('/attendance/summary'))) {
            gaps.push('缺少考勤統計匯總API');
        }
        
        if (!existingPaths.some(path => path.includes('/attendance/correction'))) {
            gaps.push('缺少考勤修正申請API');
        }
        
        if (!existingPaths.some(path => path.includes('/schedule'))) {
            gaps.push('缺少排班管理功能');
        }
        
        return gaps;
    }

    checkRevenueManagementGaps() {
        const gaps = [];
        const existingPaths = this.analysisResults.discoveredEndpoints.map(ep => ep.path);
        
        if (!existingPaths.some(path => path.includes('/revenue/summary'))) {
            gaps.push('缺少營收統計API');
        }
        
        if (!existingPaths.some(path => path.includes('/revenue/reports'))) {
            gaps.push('缺少營收報表生成API');
        }
        
        if (!existingPaths.some(path => path.includes('/revenue/forecast'))) {
            gaps.push('缺少營收預測分析API');
        }
        
        return gaps;
    }

    checkReportingGaps() {
        const gaps = [];
        const existingPaths = this.analysisResults.discoveredEndpoints.map(ep => ep.path);
        
        if (!existingPaths.some(path => path.includes('/reports'))) {
            gaps.push('缺少完整的報表系統');
        }
        
        if (!existingPaths.some(path => path.includes('/dashboard'))) {
            gaps.push('缺少儀表板數據API');
        }
        
        if (!existingPaths.some(path => path.includes('/analytics'))) {
            gaps.push('缺少數據分析API');
        }
        
        return gaps;
    }

    /**
     * 生成API文檔結構
     */
    async generateAPIDocumentation() {
        console.log('\n📚 生成API文檔結構...');
        
        const apiDoc = {
            title: '企業員工管理系統 API 文檔',
            version: '1.0.0',
            baseUrl: this.baseUrl,
            categories: {}
        };
        
        // 按類別組織API端點
        for (const endpoint of this.analysisResults.discoveredEndpoints) {
            const category = this.categorizeEndpoint(endpoint);
            
            if (!apiDoc.categories[category]) {
                apiDoc.categories[category] = [];
            }
            
            apiDoc.categories[category].push({
                method: endpoint.method,
                path: endpoint.path,
                description: endpoint.description,
                parameters: this.extractParameters(endpoint.path),
                responses: this.generateSampleResponses(endpoint)
            });
        }
        
        this.analysisResults.apiDocumentation = apiDoc;
        
        console.log('  📋 API文檔結構:');
        Object.entries(apiDoc.categories).forEach(([category, endpoints]) => {
            console.log(`    ${category}: ${endpoints.length} 個端點`);
        });
    }

    /**
     * 將端點分類
     */
    categorizeEndpoint(endpoint) {
        if (endpoint.path.includes('/auth')) return '認證管理';
        if (endpoint.path.includes('/admin')) return '管理員功能';
        if (endpoint.path.includes('/employee')) return '員工管理';
        if (endpoint.path.includes('/attendance')) return '考勤管理';
        if (endpoint.path.includes('/revenue')) return '營收管理';
        if (endpoint.path.includes('/store')) return '分店管理';
        if (endpoint.path.includes('/report')) return '報表功能';
        if (endpoint.path.includes('/notification')) return '通知功能';
        if (endpoint.path.includes('/health') || endpoint.path.includes('/system')) return '系統功能';
        return '其他';
    }

    /**
     * 提取路徑參數
     */
    extractParameters(path) {
        const params = [];
        const pathParams = path.match(/:(\w+)/g);
        
        if (pathParams) {
            pathParams.forEach(param => {
                params.push({
                    name: param.substring(1),
                    type: 'string',
                    required: true,
                    description: `${param.substring(1)} 識別碼`
                });
            });
        }
        
        return params;
    }

    /**
     * 生成範例響應
     */
    generateSampleResponses(endpoint) {
        const responses = {
            200: {
                description: '請求成功',
                example: {
                    success: true,
                    data: {},
                    message: '操作成功'
                }
            }
        };
        
        if (endpoint.method !== 'GET') {
            responses[400] = {
                description: '請求參數錯誤',
                example: {
                    success: false,
                    error: '參數驗證失敗',
                    message: '請檢查請求參數'
                }
            };
        }
        
        return responses;
    }

    /**
     * 遞歸獲取文件
     */
    getFilesRecursively(dir, extensions) {
        const files = [];
        
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                
                if (entry.isDirectory() && entry.name !== 'node_modules') {
                    files.push(...this.getFilesRecursively(fullPath, extensions));
                } else if (entry.isFile() && extensions.includes(path.extname(entry.name))) {
                    files.push(fullPath);
                }
            }
        } catch (error) {
            // 忽略讀取錯誤
        }
        
        return files;
    }

    /**
     * 生成完整報告
     */
    generateComprehensiveReport() {
        console.log('\n📊 API覆蓋率分析報告:');
        console.log('='.repeat(70));
        
        // API發現統計
        console.log('\n🔍 API端點發現統計:');
        console.log(`  發現的端點總數: ${this.analysisResults.discoveredEndpoints.length}`);
        
        const methodCounts = {};
        this.analysisResults.discoveredEndpoints.forEach(ep => {
            methodCounts[ep.method] = (methodCounts[ep.method] || 0) + 1;
        });
        
        Object.entries(methodCounts).forEach(([method, count]) => {
            console.log(`    ${method}: ${count} 個`);
        });
        
        // 測試結果統計
        if (this.analysisResults.testResults.length > 0) {
            console.log('\n🧪 API測試結果:');
            const successCount = this.analysisResults.testResults.filter(r => r.success).length;
            const successRate = (successCount / this.analysisResults.testResults.length * 100).toFixed(1);
            console.log(`  測試成功率: ${successRate}% (${successCount}/${this.analysisResults.testResults.length})`);
            
            const avgResponseTime = this.analysisResults.testResults
                .filter(r => r.responseTime)
                .reduce((sum, r) => sum + r.responseTime, 0) / 
                this.analysisResults.testResults.filter(r => r.responseTime).length;
            
            console.log(`  平均響應時間: ${avgResponseTime ? avgResponseTime.toFixed(1) : 'N/A'}ms`);
        }
        
        // 缺失端點分析
        console.log('\n❌ 缺失的API端點:');
        if (this.analysisResults.missingEndpoints.length === 0) {
            console.log('  🎉 所有預期的API端點都已實現！');
        } else {
            this.analysisResults.missingEndpoints.forEach(category => {
                console.log(`  ${category.category}: ${category.completeness}% 完整性`);
                console.log(`    缺少 ${category.missing.length} 個端點:`);
                category.missing.forEach(endpoint => {
                    console.log(`      ${endpoint.method} ${endpoint.path} - ${endpoint.description}`);
                });
                console.log('');
            });
        }
        
        // 業務邏輯缺口
        console.log('\n🔍 業務邏輯缺口:');
        if (this.analysisResults.businessLogicGaps.length === 0) {
            console.log('  🎉 業務邏輯完整！');
        } else {
            this.analysisResults.businessLogicGaps.forEach(area => {
                console.log(`  ${area.area}:`);
                area.gaps.forEach(gap => {
                    console.log(`    • ${gap}`);
                });
                console.log('');
            });
        }
        
        // 改善建議
        this.generateRecommendations();
        
        console.log('\n✅ API覆蓋率分析完成');
    }

    /**
     * 生成改善建議
     */
    generateRecommendations() {
        console.log('\n💡 API改善建議:');
        
        const recommendations = [];
        
        if (this.analysisResults.missingEndpoints.length > 0) {
            recommendations.push('🔧 [高優先級] 實現缺失的核心API端點');
        }
        
        if (this.analysisResults.businessLogicGaps.length > 0) {
            recommendations.push('📋 [高優先級] 補充業務邏輯功能缺口');
        }
        
        const testSuccessRate = this.analysisResults.testResults.length ? 
            (this.analysisResults.testResults.filter(r => r.success).length / this.analysisResults.testResults.length * 100) : 0;
        
        if (testSuccessRate < 90) {
            recommendations.push('🧪 [中優先級] 修復API端點錯誤，提高可用性');
        }
        
        recommendations.push('📚 [中優先級] 完善API文檔和規範');
        recommendations.push('🛡️ [中優先級] 添加API認證和授權');
        recommendations.push('⚡ [低優先級] 實施API版本管理');
        recommendations.push('📊 [低優先級] 添加API使用統計和監控');
        
        recommendations.forEach((rec, index) => {
            console.log(`  ${index + 1}. ${rec}`);
        });
        
        this.analysisResults.recommendations = recommendations;
    }

    /**
     * 導出分析結果
     */
    exportAnalysisResults() {
        const reportFile = path.join(this.projectRoot, 'api-coverage-analysis-report.json');
        
        try {
            fs.writeFileSync(reportFile, JSON.stringify(this.analysisResults, null, 2));
            console.log(`\n📄 API分析報告已導出: api-coverage-analysis-report.json`);
            return reportFile;
        } catch (error) {
            console.error('❌ 導出分析報告失敗:', error.message);
            return null;
        }
    }
}

// 執行分析
async function main() {
    const analyzer = new APICoverageAnalyzer();
    await analyzer.executeAPICoverageAnalysis();
    analyzer.exportAnalysisResults();
}

if (require.main === module) {
    main();
}

module.exports = APICoverageAnalyzer;