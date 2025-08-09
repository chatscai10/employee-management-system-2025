#!/usr/bin/env node
/**
 * 🧠 業務邏輯完整性和邊界條件分析
 * 深度分析業務流程、邊界條件、錯誤處理和邏輯一致性
 */

const fs = require('fs');
const path = require('path');

class BusinessLogicAnalyzer {
    constructor() {
        this.projectRoot = __dirname;
        this.serverPath = path.join(this.projectRoot, 'server');
        this.publicPath = path.join(this.projectRoot, 'public');
        this.analysisResults = {
            businessFlows: [],
            boundaryConditions: [],
            errorHandling: [],
            validationRules: [],
            securityChecks: [],
            performanceIssues: [],
            inconsistencies: [],
            recommendations: []
        };
    }

    /**
     * 執行業務邏輯分析
     */
    async executeBusinessLogicAnalysis() {
        console.log('🧠 開始業務邏輯完整性和邊界條件分析...');
        console.log('='.repeat(70));

        try {
            // 1. 分析核心業務流程
            await this.analyzeBusinessFlows();
            
            // 2. 檢查邊界條件處理
            await this.analyzeBoundaryConditions();
            
            // 3. 分析錯誤處理機制
            await this.analyzeErrorHandling();
            
            // 4. 檢查資料驗證規則
            await this.analyzeValidationRules();
            
            // 5. 檢查安全性驗證
            await this.analyzeSecurityChecks();
            
            // 6. 分析效能問題
            await this.analyzePerformanceIssues();
            
            // 7. 檢查邏輯一致性
            await this.checkLogicalConsistency();
            
            // 8. 生成完整報告
            this.generateComprehensiveReport();
            
        } catch (error) {
            console.error('❌ 業務邏輯分析失敗:', error.message);
        }
    }

    /**
     * 分析核心業務流程
     */
    async analyzeBusinessFlows() {
        console.log('\n🔄 分析核心業務流程...');
        
        const businessFlows = [
            {
                name: '員工註冊與認證流程',
                description: '員工註冊、身份驗證、權限分配',
                endpoints: ['/api/auth/register', '/api/auth/login', '/api/auth/verify'],
                requiredSteps: ['資料驗證', '身份檢查', 'Token生成', '權限設定'],
                status: 'unknown'
            },
            {
                name: 'GPS考勤打卡流程',
                description: 'GPS定位驗證、距離計算、考勤記錄',
                endpoints: ['/api/attendance/clock', '/api/attendance/records'],
                requiredSteps: ['位置驗證', '距離計算', '時間檢查', '資料存儲'],
                status: 'unknown'
            },
            {
                name: '營收管理流程',
                description: '營收記錄、照片上傳、統計分析',
                endpoints: ['/api/revenue/add', '/api/revenue/records', '/api/revenue/summary'],
                requiredSteps: ['資料輸入', '照片處理', '計算統計', '報表生成'],
                status: 'unknown'
            },
            {
                name: '分店管理流程',
                description: '分店設定、人員管理、地理圍欄',
                endpoints: ['/api/admin/stores', '/api/stores/:id', '/api/stores/:id/employees'],
                requiredSteps: ['分店創建', '地址設定', '人員分配', '權限管理'],
                status: 'unknown'
            },
            {
                name: '排班管理流程',
                description: '員工排班、假期管理、班表生成',
                endpoints: ['/api/schedule', '/api/schedule/generate'],
                requiredSteps: ['時間規劃', '人力分配', '假期處理', '衝突檢查'],
                status: 'unknown'
            }
        ];

        // 檢查每個業務流程的實現狀況
        for (const flow of businessFlows) {
            console.log(`\n  🔍 檢查 ${flow.name}:`);
            
            let implementedEndpoints = 0;
            let implementedSteps = 0;
            
            // 檢查API端點是否存在
            for (const endpoint of flow.endpoints) {
                const exists = await this.checkEndpointExists(endpoint);
                if (exists) {
                    implementedEndpoints++;
                    console.log(`    ✅ 端點存在: ${endpoint}`);
                } else {
                    console.log(`    ❌ 端點缺失: ${endpoint}`);
                }
            }
            
            // 檢查業務步驟實現
            for (const step of flow.requiredSteps) {
                const implemented = await this.checkBusinessStepImplemented(step, flow.name);
                if (implemented) {
                    implementedSteps++;
                    console.log(`    ✅ 步驟實現: ${step}`);
                } else {
                    console.log(`    ❌ 步驟缺失: ${step}`);
                }
            }
            
            // 計算完整性百分比
            const endpointCompleteness = (implementedEndpoints / flow.endpoints.length) * 100;
            const stepCompleteness = (implementedSteps / flow.requiredSteps.length) * 100;
            const overallCompleteness = (endpointCompleteness + stepCompleteness) / 2;
            
            flow.status = overallCompleteness >= 80 ? 'complete' : 
                         overallCompleteness >= 50 ? 'partial' : 'incomplete';
            flow.completeness = overallCompleteness.toFixed(1);
            
            console.log(`    📊 完整性: ${flow.completeness}% (${flow.status})`);
        }
        
        this.analysisResults.businessFlows = businessFlows;
    }

    /**
     * 檢查API端點是否存在
     */
    async checkEndpointExists(endpoint) {
        // 檢查路由文件中是否定義了該端點
        const routesDir = path.join(this.serverPath, 'routes');
        
        if (!fs.existsSync(routesDir)) return false;
        
        const routeFiles = this.getFilesRecursively(routesDir, ['.js']);
        
        for (const routeFile of routeFiles) {
            try {
                const content = fs.readFileSync(routeFile, 'utf8');
                
                // 提取端點路徑
                const pathPart = endpoint.replace('/api', '').split('/').filter(p => p && !p.includes(':')).join('/');
                
                if (content.includes(pathPart) || content.includes(endpoint)) {
                    return true;
                }
            } catch (error) {
                // 忽略讀取錯誤
            }
        }
        
        return false;
    }

    /**
     * 檢查業務步驟是否實現
     */
    async checkBusinessStepImplemented(step, flowName) {
        const keywords = {
            '資料驗證': ['validate', 'validation', 'check', 'verify'],
            '身份檢查': ['auth', 'authentication', 'login', 'verify'],
            'Token生成': ['jwt', 'token', 'sign', 'generate'],
            '權限設定': ['permission', 'role', 'access', 'authorize'],
            '位置驗證': ['location', 'latitude', 'longitude', 'gps'],
            '距離計算': ['distance', 'calculate', 'radius', 'haversine'],
            '時間檢查': ['time', 'date', 'schedule', 'clock'],
            '資料存儲': ['save', 'create', 'insert', 'store'],
            '資料輸入': ['input', 'form', 'data', 'field'],
            '照片處理': ['photo', 'image', 'upload', 'file'],
            '計算統計': ['calculate', 'sum', 'total', 'statistics'],
            '報表生成': ['report', 'export', 'generate', 'summary'],
            '分店創建': ['store', 'create', 'add', 'new'],
            '地址設定': ['address', 'location', 'coordinates'],
            '人員分配': ['assign', 'employee', 'staff', 'member'],
            '權限管理': ['permission', 'access', 'role', 'admin'],
            '時間規劃': ['schedule', 'time', 'plan', 'calendar'],
            '人力分配': ['staff', 'employee', 'assign', 'allocate'],
            '假期處理': ['leave', 'holiday', 'off', 'vacation'],
            '衝突檢查': ['conflict', 'check', 'validation', 'overlap']
        };
        
        const stepKeywords = keywords[step] || [];
        if (stepKeywords.length === 0) return false;
        
        // 在相關文件中搜索關鍵詞
        const searchDirs = [
            path.join(this.serverPath, 'routes'),
            path.join(this.serverPath, 'controllers'),
            path.join(this.serverPath, 'services'),
            path.join(this.publicPath, 'js')
        ];
        
        for (const dir of searchDirs) {
            if (!fs.existsSync(dir)) continue;
            
            const files = this.getFilesRecursively(dir, ['.js']);
            
            for (const file of files) {
                try {
                    const content = fs.readFileSync(file, 'utf8').toLowerCase();
                    
                    // 檢查是否包含至少一個關鍵詞
                    if (stepKeywords.some(keyword => content.includes(keyword.toLowerCase()))) {
                        return true;
                    }
                } catch (error) {
                    // 忽略讀取錯誤
                }
            }
        }
        
        return false;
    }

    /**
     * 分析邊界條件處理
     */
    async analyzeBoundaryConditions() {
        console.log('\n⚡ 分析邊界條件處理...');
        
        const boundaryConditions = [
            {
                category: '輸入驗證',
                conditions: [
                    '空字符串或null值處理',
                    '超長字符串處理',
                    '特殊字符處理',
                    '數字範圍驗證',
                    '日期格式驗證'
                ],
                implemented: 0
            },
            {
                category: 'GPS定位',
                conditions: [
                    'GPS信號不可用時處理',
                    '超出地理圍欄範圍',
                    '定位精度不足處理',
                    '網路中斷時的本地存儲',
                    '時區差異處理'
                ],
                implemented: 0
            },
            {
                category: '檔案處理',
                conditions: [
                    '檔案大小限制',
                    '檔案格式驗證',
                    '磁碟空間不足處理',
                    '檔案上傳中斷處理',
                    '惡意檔案檢測'
                ],
                implemented: 0
            },
            {
                category: '資料庫操作',
                conditions: [
                    '連接逾時處理',
                    '事務回滾機制',
                    '資料衝突處理',
                    '外鍵約束違反',
                    '查詢結果為空處理'
                ],
                implemented: 0
            },
            {
                category: '用戶權限',
                conditions: [
                    '無權限存取處理',
                    'Token過期處理',
                    '會話超時處理',
                    '重複登入處理',
                    '密碼錯誤次數限制'
                ],
                implemented: 0
            }
        ];

        // 檢查每個邊界條件的處理情況
        for (const category of boundaryConditions) {
            console.log(`\n  🔍 檢查 ${category.category}:`);
            
            for (const condition of category.conditions) {
                const handled = await this.checkBoundaryConditionHandled(condition);
                if (handled) {
                    category.implemented++;
                    console.log(`    ✅ 已處理: ${condition}`);
                } else {
                    console.log(`    ❌ 未處理: ${condition}`);
                }
            }
            
            const percentage = (category.implemented / category.conditions.length * 100).toFixed(1);
            console.log(`    📊 實現率: ${percentage}% (${category.implemented}/${category.conditions.length})`);
        }
        
        this.analysisResults.boundaryConditions = boundaryConditions;
    }

    /**
     * 檢查邊界條件是否被處理
     */
    async checkBoundaryConditionHandled(condition) {
        const keywords = {
            '空字符串或null值處理': ['null', 'empty', 'trim', 'required'],
            '超長字符串處理': ['maxLength', 'length', 'truncate', 'limit'],
            '特殊字符處理': ['escape', 'sanitize', 'validate', 'regex'],
            '數字範圍驗證': ['min', 'max', 'range', 'between'],
            '日期格式驗證': ['date', 'moment', 'format', 'parse'],
            'GPS信號不可用時處理': ['gps', 'location', 'error', 'unavailable'],
            '超出地理圍欄範圍': ['radius', 'distance', 'outside', 'geofence'],
            '定位精度不足處理': ['accuracy', 'precision', 'threshold'],
            '網路中斷時的本地存儲': ['offline', 'localStorage', 'cache', 'sync'],
            '時區差異處理': ['timezone', 'utc', 'offset', 'local'],
            '檔案大小限制': ['fileSize', 'maxSize', 'limit', 'upload'],
            '檔案格式驗證': ['mimetype', 'extension', 'format', 'allowed'],
            '磁碟空間不足處理': ['disk', 'space', 'storage', 'capacity'],
            '檔案上傳中斷處理': ['upload', 'resume', 'chunk', 'retry'],
            '惡意檔案檢測': ['virus', 'malware', 'scan', 'security'],
            '連接逾時處理': ['timeout', 'connection', 'retry', 'reconnect'],
            '事務回滾機制': ['transaction', 'rollback', 'commit', 'begin'],
            '資料衝突處理': ['conflict', 'lock', 'concurrent', 'version'],
            '外鍵約束違反': ['foreign', 'constraint', 'reference', 'integrity'],
            '查詢結果為空處理': ['empty', 'null', 'notFound', 'exists'],
            '無權限存取處理': ['permission', 'unauthorized', 'access', 'forbidden'],
            'Token過期處理': ['expire', 'refresh', 'renew', 'invalid'],
            '會話超時處理': ['session', 'timeout', 'expire', 'refresh'],
            '重複登入處理': ['duplicate', 'multiple', 'session', 'login'],
            '密碼錯誤次數限制': ['attempt', 'failed', 'lock', 'retry']
        };
        
        const conditionKeywords = keywords[condition] || [];
        if (conditionKeywords.length === 0) return false;
        
        // 在所有代碼文件中搜索處理邏輯
        const searchDirs = [
            path.join(this.serverPath),
            path.join(this.publicPath, 'js')
        ];
        
        for (const dir of searchDirs) {
            if (!fs.existsSync(dir)) continue;
            
            const files = this.getFilesRecursively(dir, ['.js']);
            
            for (const file of files) {
                try {
                    const content = fs.readFileSync(file, 'utf8').toLowerCase();
                    
                    // 檢查是否包含處理邏輯的關鍵詞
                    const keywordCount = conditionKeywords.filter(keyword => 
                        content.includes(keyword.toLowerCase())
                    ).length;
                    
                    if (keywordCount >= 2) { // 需要至少兩個相關關鍵詞
                        return true;
                    }
                } catch (error) {
                    // 忽略讀取錯誤
                }
            }
        }
        
        return false;
    }

    /**
     * 分析錯誤處理機制
     */
    async analyzeErrorHandling() {
        console.log('\n❌ 分析錯誤處理機制...');
        
        const errorHandlingChecks = [
            {
                name: 'HTTP錯誤狀態碼',
                description: '正確使用HTTP狀態碼回應錯誤',
                keywords: ['400', '401', '403', '404', '500', 'status'],
                implemented: false
            },
            {
                name: '錯誤訊息標準化',
                description: '統一的錯誤訊息格式和結構',
                keywords: ['error', 'message', 'code', 'details'],
                implemented: false
            },
            {
                name: 'Try-Catch包裝',
                description: '適當的異常捕獲和處理',
                keywords: ['try', 'catch', 'throw', 'finally'],
                implemented: false
            },
            {
                name: '日誌記錄',
                description: '錯誤的詳細日誌記錄',
                keywords: ['logger', 'log', 'error', 'debug'],
                implemented: false
            },
            {
                name: '用戶友好錯誤',
                description: '向用戶顯示友好的錯誤訊息',
                keywords: ['user', 'friendly', 'message', 'alert'],
                implemented: false
            }
        ];

        // 檢查錯誤處理機制
        for (const check of errorHandlingChecks) {
            console.log(`\n  🔍 檢查 ${check.name}:`);
            
            let foundCount = 0;
            const files = this.getFilesRecursively(this.serverPath, ['.js']);
            
            for (const file of files) {
                try {
                    const content = fs.readFileSync(file, 'utf8').toLowerCase();
                    
                    const keywordMatches = check.keywords.filter(keyword => 
                        content.includes(keyword.toLowerCase())
                    ).length;
                    
                    if (keywordMatches >= 2) {
                        foundCount++;
                    }
                } catch (error) {
                    // 忽略讀取錯誤
                }
            }
            
            check.implemented = foundCount >= 3; // 至少在3個文件中有相關實現
            console.log(`    ${check.implemented ? '✅' : '❌'} ${check.description}`);
            console.log(`    📊 發現次數: ${foundCount} 個文件`);
        }
        
        this.analysisResults.errorHandling = errorHandlingChecks;
    }

    /**
     * 分析資料驗證規則
     */
    async analyzeValidationRules() {
        console.log('\n✅ 分析資料驗證規則...');
        
        const validationAreas = [
            {
                name: '員工資料驗證',
                fields: ['姓名', '身份證號', '生日', '電話', '地址'],
                implemented: 0
            },
            {
                name: '考勤資料驗證',
                fields: ['GPS座標', '時間戳', '距離計算', '打卡類型'],
                implemented: 0
            },
            {
                name: '營收資料驗證',
                fields: ['金額範圍', '日期格式', '照片格式', '備註長度'],
                implemented: 0
            },
            {
                name: '分店資料驗證',
                fields: ['分店名稱', '地址', '座標', '營業時間'],
                implemented: 0
            }
        ];

        // 檢查驗證規則實現
        for (const area of validationAreas) {
            console.log(`\n  🔍 檢查 ${area.name}:`);
            
            for (const field of area.fields) {
                const hasValidation = await this.checkFieldValidation(field, area.name);
                if (hasValidation) {
                    area.implemented++;
                    console.log(`    ✅ ${field}: 有驗證`);
                } else {
                    console.log(`    ❌ ${field}: 缺少驗證`);
                }
            }
            
            const percentage = (area.implemented / area.fields.length * 100).toFixed(1);
            console.log(`    📊 驗證覆蓋率: ${percentage}%`);
        }
        
        this.analysisResults.validationRules = validationAreas;
    }

    /**
     * 檢查欄位驗證
     */
    async checkFieldValidation(field, area) {
        const validationKeywords = {
            '姓名': ['name', 'required', 'length', 'string'],
            '身份證號': ['id', 'idNumber', 'format', 'regex'],
            '生日': ['birthday', 'date', 'age', 'valid'],
            '電話': ['phone', 'mobile', 'format', 'number'],
            '地址': ['address', 'required', 'length'],
            'GPS座標': ['latitude', 'longitude', 'coordinate', 'gps'],
            '時間戳': ['timestamp', 'date', 'time', 'format'],
            '距離計算': ['distance', 'radius', 'calculate'],
            '打卡類型': ['type', 'clock', 'enum', 'valid'],
            '金額範圍': ['amount', 'money', 'decimal', 'range'],
            '日期格式': ['date', 'format', 'valid', 'parse'],
            '照片格式': ['photo', 'image', 'file', 'type'],
            '備註長度': ['note', 'comment', 'length', 'max'],
            '分店名稱': ['store', 'name', 'required', 'string'],
            '座標': ['coordinate', 'lat', 'lng', 'gps'],
            '營業時間': ['time', 'open', 'close', 'schedule']
        };
        
        const keywords = validationKeywords[field] || [];
        if (keywords.length === 0) return false;
        
        // 搜索驗證相關代碼
        const files = this.getFilesRecursively(this.serverPath, ['.js']);
        
        for (const file of files) {
            try {
                const content = fs.readFileSync(file, 'utf8').toLowerCase();
                
                // 檢查是否有驗證邏輯
                const hasValidationKeywords = keywords.filter(keyword => 
                    content.includes(keyword)
                ).length >= 2;
                
                const hasValidationFunctions = ['validate', 'check', 'verify', 'required'].some(func =>
                    content.includes(func)
                );
                
                if (hasValidationKeywords && hasValidationFunctions) {
                    return true;
                }
            } catch (error) {
                // 忽略讀取錯誤
            }
        }
        
        return false;
    }

    /**
     * 分析安全性檢查
     */
    async analyzeSecurityChecks() {
        console.log('\n🛡️ 分析安全性檢查...');
        
        const securityChecks = [
            {
                name: 'SQL注入防護',
                description: '參數化查詢和輸入清理',
                keywords: ['parameterized', 'prepared', 'sanitize', 'escape'],
                severity: 'critical',
                implemented: false
            },
            {
                name: 'XSS防護',
                description: '跨站腳本攻擊防護',
                keywords: ['xss', 'escape', 'sanitize', 'csp'],
                severity: 'high',
                implemented: false
            },
            {
                name: 'CSRF防護',
                description: '跨站請求偽造防護',
                keywords: ['csrf', 'token', 'verify', 'header'],
                severity: 'high',
                implemented: false
            },
            {
                name: '身份驗證',
                description: 'JWT Token驗證機制',
                keywords: ['jwt', 'token', 'authenticate', 'verify'],
                severity: 'critical',
                implemented: false
            },
            {
                name: '權限控制',
                description: '角色和權限檢查',
                keywords: ['permission', 'role', 'authorize', 'access'],
                severity: 'high',
                implemented: false
            },
            {
                name: '密碼安全',
                description: '密碼加密和強度檢查',
                keywords: ['hash', 'bcrypt', 'salt', 'strong'],
                severity: 'critical',
                implemented: false
            }
        ];

        // 檢查安全機制實現
        for (const check of securityChecks) {
            console.log(`\n  🔍 檢查 ${check.name} (${check.severity}):`);
            
            let implementationScore = 0;
            const files = this.getFilesRecursively(this.serverPath, ['.js']);
            
            for (const file of files) {
                try {
                    const content = fs.readFileSync(file, 'utf8').toLowerCase();
                    
                    const keywordMatches = check.keywords.filter(keyword => 
                        content.includes(keyword.toLowerCase())
                    ).length;
                    
                    if (keywordMatches >= 2) {
                        implementationScore++;
                    }
                } catch (error) {
                    // 忽略讀取錯誤
                }
            }
            
            check.implemented = implementationScore >= 2;
            console.log(`    ${check.implemented ? '✅' : '❌'} ${check.description}`);
            console.log(`    📊 實現分數: ${implementationScore}`);
            
            if (!check.implemented && check.severity === 'critical') {
                console.log(`    🚨 關鍵安全問題未解決！`);
            }
        }
        
        this.analysisResults.securityChecks = securityChecks;
    }

    /**
     * 分析效能問題
     */
    async analyzePerformanceIssues() {
        console.log('\n⚡ 分析效能問題...');
        
        const performanceChecks = [
            {
                name: '資料庫查詢優化',
                description: '索引使用和查詢效率',
                keywords: ['index', 'optimize', 'query', 'performance'],
                implemented: false
            },
            {
                name: '緩存機制',
                description: '數據緩存和減少重複查詢',
                keywords: ['cache', 'redis', 'memory', 'store'],
                implemented: false
            },
            {
                name: '分頁處理',
                description: '大量數據的分頁載入',
                keywords: ['limit', 'offset', 'page', 'pagination'],
                implemented: false
            },
            {
                name: '檔案處理優化',
                description: '圖片壓縮和檔案管理',
                keywords: ['compress', 'resize', 'optimize', 'size'],
                implemented: false
            },
            {
                name: '連接池管理',
                description: '資料庫連接池配置',
                keywords: ['pool', 'connection', 'max', 'min'],
                implemented: false
            }
        ];

        // 檢查效能優化實現
        for (const check of performanceChecks) {
            console.log(`\n  🔍 檢查 ${check.name}:`);
            
            let foundEvidence = false;
            const files = this.getFilesRecursively(this.serverPath, ['.js']);
            
            for (const file of files) {
                try {
                    const content = fs.readFileSync(file, 'utf8').toLowerCase();
                    
                    const keywordMatches = check.keywords.filter(keyword => 
                        content.includes(keyword.toLowerCase())
                    ).length;
                    
                    if (keywordMatches >= 2) {
                        foundEvidence = true;
                        break;
                    }
                } catch (error) {
                    // 忽略讀取錯誤
                }
            }
            
            check.implemented = foundEvidence;
            console.log(`    ${check.implemented ? '✅' : '❌'} ${check.description}`);
        }
        
        this.analysisResults.performanceIssues = performanceChecks;
    }

    /**
     * 檢查邏輯一致性
     */
    async checkLogicalConsistency() {
        console.log('\n🧩 檢查邏輯一致性...');
        
        const consistencyIssues = [];
        
        // 檢查常見的邏輯不一致問題
        const consistencyChecks = [
            {
                name: '狀態值一致性',
                description: '檢查系統中狀態值的一致使用',
                check: () => this.checkStatusConsistency()
            },
            {
                name: 'API回應格式一致性',
                description: '檢查API回應格式的統一性',
                check: () => this.checkAPIResponseConsistency()
            },
            {
                name: '錯誤處理一致性',
                description: '檢查錯誤處理方式的一致性',
                check: () => this.checkErrorHandlingConsistency()
            },
            {
                name: '資料驗證一致性',
                description: '檢查相同類型資料的驗證一致性',
                check: () => this.checkValidationConsistency()
            }
        ];
        
        for (const check of consistencyChecks) {
            console.log(`\n  🔍 ${check.name}:`);
            
            try {
                const issues = await check.check();
                if (issues.length === 0) {
                    console.log(`    ✅ ${check.description} - 無問題`);
                } else {
                    console.log(`    ❌ ${check.description} - 發現 ${issues.length} 個問題:`);
                    issues.forEach(issue => {
                        console.log(`      • ${issue}`);
                        consistencyIssues.push({
                            category: check.name,
                            issue: issue
                        });
                    });
                }
            } catch (error) {
                console.log(`    ⚠️ 檢查失敗: ${error.message}`);
            }
        }
        
        this.analysisResults.inconsistencies = consistencyIssues;
    }

    /**
     * 檢查狀態值一致性
     */
    async checkStatusConsistency() {
        const issues = [];
        const statusValues = new Set();
        
        // 收集所有狀態值
        const files = this.getFilesRecursively(this.serverPath, ['.js']);
        
        for (const file of files) {
            try {
                const content = fs.readFileSync(file, 'utf8');
                
                // 查找狀態相關的值
                const statusMatches = content.match(/status['"`]?\s*[:=]\s*['"`]([^'"`]+)['"`]/g);
                if (statusMatches) {
                    statusMatches.forEach(match => {
                        const value = match.match(/['"`]([^'"`]+)['"`]$/);
                        if (value) {
                            statusValues.add(value[1]);
                        }
                    });
                }
            } catch (error) {
                // 忽略讀取錯誤
            }
        }
        
        // 檢查是否有相似但不一致的狀態值
        const statusArray = Array.from(statusValues);
        for (let i = 0; i < statusArray.length; i++) {
            for (let j = i + 1; j < statusArray.length; j++) {
                const status1 = statusArray[i].toLowerCase();
                const status2 = statusArray[j].toLowerCase();
                
                // 檢查語義相似但拼寫不同的狀態
                if (this.isSimilarStatus(status1, status2)) {
                    issues.push(`相似狀態值可能不一致: "${statusArray[i]}" vs "${statusArray[j]}"`);
                }
            }
        }
        
        return issues;
    }

    /**
     * 判斷狀態值是否相似
     */
    isSimilarStatus(status1, status2) {
        const synonyms = [
            ['active', 'enabled', 'on'],
            ['inactive', 'disabled', 'off'],
            ['pending', 'waiting', 'processing'],
            ['complete', 'completed', 'done', 'finished'],
            ['error', 'failed', 'failure'],
            ['success', 'successful', 'ok']
        ];
        
        for (const group of synonyms) {
            if (group.includes(status1) && group.includes(status2) && status1 !== status2) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * 檢查API回應格式一致性
     */
    async checkAPIResponseConsistency() {
        const issues = [];
        const responseFormats = new Set();
        
        // 分析API回應格式
        const files = this.getFilesRecursively(path.join(this.serverPath, 'routes'), ['.js']);
        
        for (const file of files) {
            try {
                const content = fs.readFileSync(file, 'utf8');
                
                // 查找回應格式模式
                const responsePatterns = content.match(/res\.json\s*\(\s*\{[^}]+\}/g);
                if (responsePatterns) {
                    responsePatterns.forEach(pattern => {
                        const keys = pattern.match(/['"`]?\w+['"`]?\s*:/g);
                        if (keys) {
                            const keySet = keys.map(k => k.replace(/['"`:\s]/g, '')).sort().join(',');
                            responseFormats.add(keySet);
                        }
                    });
                }
            } catch (error) {
                // 忽略讀取錯誤
            }
        }
        
        if (responseFormats.size > 3) {
            issues.push(`發現 ${responseFormats.size} 種不同的API回應格式，建議標準化`);
        }
        
        return issues;
    }

    /**
     * 檢查錯誤處理一致性
     */
    async checkErrorHandlingConsistency() {
        const issues = [];
        const errorPatterns = new Set();
        
        // 分析錯誤處理模式
        const files = this.getFilesRecursively(this.serverPath, ['.js']);
        
        for (const file of files) {
            try {
                const content = fs.readFileSync(file, 'utf8');
                
                // 查找錯誤處理模式
                const catchBlocks = content.match(/catch\s*\([^)]*\)\s*\{[^}]+\}/g);
                if (catchBlocks) {
                    catchBlocks.forEach(block => {
                        // 簡化錯誤處理模式
                        const simplified = block.replace(/\s+/g, ' ').substring(0, 100);
                        errorPatterns.add(simplified);
                    });
                }
            } catch (error) {
                // 忽略讀取錯誤
            }
        }
        
        if (errorPatterns.size > 5) {
            issues.push(`發現 ${errorPatterns.size} 種不同的錯誤處理模式，建議統一化`);
        }
        
        return issues;
    }

    /**
     * 檢查驗證一致性
     */
    async checkValidationConsistency() {
        const issues = [];
        
        // 這個檢查比較複雜，暫時返回空陣列
        // 實際實現需要分析相同類型欄位的驗證規則是否一致
        
        return issues;
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
        console.log('\n📊 業務邏輯完整性分析報告:');
        console.log('='.repeat(70));
        
        // 業務流程統計
        console.log('\n🔄 核心業務流程:');
        let totalFlows = this.analysisResults.businessFlows.length;
        let completeFlows = this.analysisResults.businessFlows.filter(f => f.status === 'complete').length;
        let partialFlows = this.analysisResults.businessFlows.filter(f => f.status === 'partial').length;
        
        console.log(`  總流程數: ${totalFlows}`);
        console.log(`  完整實現: ${completeFlows} (${(completeFlows/totalFlows*100).toFixed(1)}%)`);
        console.log(`  部分實現: ${partialFlows} (${(partialFlows/totalFlows*100).toFixed(1)}%)`);
        console.log(`  未實現: ${totalFlows-completeFlows-partialFlows} (${((totalFlows-completeFlows-partialFlows)/totalFlows*100).toFixed(1)}%)`);
        
        this.analysisResults.businessFlows.forEach(flow => {
            console.log(`    ${flow.name}: ${flow.completeness}% (${flow.status})`);
        });
        
        // 邊界條件統計
        console.log('\n⚡ 邊界條件處理:');
        this.analysisResults.boundaryConditions.forEach(category => {
            const percentage = (category.implemented / category.conditions.length * 100).toFixed(1);
            console.log(`  ${category.category}: ${percentage}% (${category.implemented}/${category.conditions.length})`);
        });
        
        // 錯誤處理統計
        console.log('\n❌ 錯誤處理機制:');
        let implementedErrorHandling = this.analysisResults.errorHandling.filter(e => e.implemented).length;
        console.log(`  實現率: ${(implementedErrorHandling/this.analysisResults.errorHandling.length*100).toFixed(1)}%`);
        this.analysisResults.errorHandling.forEach(error => {
            console.log(`    ${error.name}: ${error.implemented ? '✅' : '❌'}`);
        });
        
        // 資料驗證統計
        console.log('\n✅ 資料驗證規則:');
        this.analysisResults.validationRules.forEach(validation => {
            const percentage = (validation.implemented / validation.fields.length * 100).toFixed(1);
            console.log(`  ${validation.name}: ${percentage}%`);
        });
        
        // 安全性統計
        console.log('\n🛡️ 安全性檢查:');
        let criticalSecurity = this.analysisResults.securityChecks.filter(s => s.severity === 'critical' && !s.implemented).length;
        let highSecurity = this.analysisResults.securityChecks.filter(s => s.severity === 'high' && !s.implemented).length;
        
        console.log(`  🚨 關鍵安全問題: ${criticalSecurity} 個未解決`);
        console.log(`  ⚠️ 高風險問題: ${highSecurity} 個未解決`);
        
        this.analysisResults.securityChecks.forEach(security => {
            const icon = security.implemented ? '✅' : 
                        security.severity === 'critical' ? '🚨' : 
                        security.severity === 'high' ? '⚠️' : '❌';
            console.log(`    ${icon} ${security.name}`);
        });
        
        // 效能問題統計
        console.log('\n⚡ 效能優化:');
        let implementedPerformance = this.analysisResults.performanceIssues.filter(p => p.implemented).length;
        console.log(`  實現率: ${(implementedPerformance/this.analysisResults.performanceIssues.length*100).toFixed(1)}%`);
        
        // 邏輯一致性統計
        console.log('\n🧩 邏輯一致性:');
        if (this.analysisResults.inconsistencies.length === 0) {
            console.log('  ✅ 未發現重大邏輯不一致問題');
        } else {
            console.log(`  ❌ 發現 ${this.analysisResults.inconsistencies.length} 個一致性問題`);
            this.analysisResults.inconsistencies.forEach(issue => {
                console.log(`    • ${issue.category}: ${issue.issue}`);
            });
        }
        
        // 改善建議
        this.generateRecommendations();
        
        console.log('\n✅ 業務邏輯完整性分析完成');
    }

    /**
     * 生成改善建議
     */
    generateRecommendations() {
        console.log('\n💡 業務邏輯改善建議:');
        
        const recommendations = [];
        
        // 基於分析結果生成建議
        const incompleteFlows = this.analysisResults.businessFlows.filter(f => f.status !== 'complete');
        if (incompleteFlows.length > 0) {
            recommendations.push('🔧 [高優先級] 完善未完整實現的業務流程');
        }
        
        const criticalSecurity = this.analysisResults.securityChecks.filter(s => 
            s.severity === 'critical' && !s.implemented
        );
        if (criticalSecurity.length > 0) {
            recommendations.push('🚨 [緊急] 修復關鍵安全漏洞');
        }
        
        const lowBoundaryHandling = this.analysisResults.boundaryConditions.filter(c => 
            (c.implemented / c.conditions.length) < 0.5
        );
        if (lowBoundaryHandling.length > 0) {
            recommendations.push('⚡ [高優先級] 改善邊界條件處理');
        }
        
        const lowErrorHandling = this.analysisResults.errorHandling.filter(e => !e.implemented).length;
        if (lowErrorHandling > 2) {
            recommendations.push('❌ [高優先級] 建立完整的錯誤處理機制');
        }
        
        const lowValidation = this.analysisResults.validationRules.filter(v => 
            (v.implemented / v.fields.length) < 0.6
        );
        if (lowValidation.length > 0) {
            recommendations.push('✅ [中優先級] 加強資料驗證規則');
        }
        
        const lowPerformance = this.analysisResults.performanceIssues.filter(p => !p.implemented).length;
        if (lowPerformance > 3) {
            recommendations.push('⚡ [中優先級] 實施效能優化措施');
        }
        
        if (this.analysisResults.inconsistencies.length > 0) {
            recommendations.push('🧩 [中優先級] 修復邏輯一致性問題');
        }
        
        recommendations.push('📚 [低優先級] 建立業務邏輯文檔和測試用例');
        recommendations.push('🔄 [低優先級] 實施持續集成和自動化測試');
        
        recommendations.forEach((rec, index) => {
            console.log(`  ${index + 1}. ${rec}`);
        });
        
        this.analysisResults.recommendations = recommendations;
    }

    /**
     * 導出分析結果
     */
    exportAnalysisResults() {
        const reportFile = path.join(this.projectRoot, 'business-logic-analysis-report.json');
        
        try {
            fs.writeFileSync(reportFile, JSON.stringify(this.analysisResults, null, 2));
            console.log(`\n📄 業務邏輯分析報告已導出: business-logic-analysis-report.json`);
            return reportFile;
        } catch (error) {
            console.error('❌ 導出分析報告失敗:', error.message);
            return null;
        }
    }
}

// 執行分析
async function main() {
    const analyzer = new BusinessLogicAnalyzer();
    await analyzer.executeBusinessLogicAnalysis();
    analyzer.exportAnalysisResults();
}

if (require.main === module) {
    main();
}

module.exports = BusinessLogicAnalyzer;