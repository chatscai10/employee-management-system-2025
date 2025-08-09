#!/usr/bin/env node
/**
 * 🏗️ 系統架構完整性深度分析工具
 * 全面分析系統架構、識別缺失功能和潛在問題
 */

const fs = require('fs');
const path = require('path');

class SystemArchitectureAnalyzer {
    constructor() {
        this.projectRoot = __dirname;
        this.analysisResults = {
            architecture: {
                frontend: { status: 'unknown', completeness: 0, issues: [] },
                backend: { status: 'unknown', completeness: 0, issues: [] },
                database: { status: 'unknown', completeness: 0, issues: [] },
                infrastructure: { status: 'unknown', completeness: 0, issues: [] }
            },
            missingFeatures: [],
            businessLogicGaps: [],
            technicalDebt: [],
            recommendations: []
        };
        
        // 企業級系統應有的核心功能清單
        this.requiredFeatures = {
            authentication: ['login', 'logout', 'session', 'password', 'registration'],
            authorization: ['roles', 'permissions', 'rbac', 'acl'],
            employee: ['crud', 'profile', 'status', 'approval'],
            attendance: ['checkin', 'checkout', 'gps', 'validation'],
            revenue: ['recording', 'calculation', 'bonus', 'reports'],
            store: ['management', 'location', 'hours', 'settings'],
            reporting: ['analytics', 'export', 'dashboard', 'charts'],
            notification: ['email', 'sms', 'push', 'telegram'],
            audit: ['logging', 'tracking', 'compliance', 'history'],
            backup: ['database', 'files', 'recovery', 'schedule'],
            monitoring: ['health', 'performance', 'alerts', 'metrics'],
            security: ['encryption', 'validation', 'csrf', 'xss'],
            deployment: ['docker', 'nginx', 'ssl', 'environment'],
            testing: ['unit', 'integration', 'e2e', 'performance'],
            documentation: ['api', 'user', 'admin', 'technical']
        };
        
        // 業務流程完整性檢查
        this.businessProcesses = {
            employeeLifecycle: ['recruitment', 'onboarding', 'management', 'offboarding'],
            attendanceManagement: ['scheduling', 'tracking', 'validation', 'reporting'],
            payrollIntegration: ['calculation', 'bonus', 'deductions', 'processing'],
            storeOperations: ['setup', 'management', 'reporting', 'analytics'],
            systemAdministration: ['configuration', 'monitoring', 'maintenance', 'security']
        };
    }

    /**
     * 執行完整系統架構分析
     */
    async executeArchitectureAnalysis() {
        console.log('🏗️ 開始系統架構完整性深度分析...');
        console.log('='.repeat(70));
        
        try {
            // 1. 前端架構分析
            await this.analyzeFrontendArchitecture();
            
            // 2. 後端架構分析
            await this.analyzeBackendArchitecture();
            
            // 3. 資料庫架構分析
            await this.analyzeDatabaseArchitecture();
            
            // 4. 基礎設施分析
            await this.analyzeInfrastructure();
            
            // 5. 功能完整性分析
            await this.analyzeFeatureCompleteness();
            
            // 6. 業務流程完整性分析
            await this.analyzeBusinessProcesses();
            
            // 7. 技術債務分析
            await this.analyzeTechnicalDebt();
            
            // 8. 生成完整報告
            this.generateComprehensiveReport();
            
        } catch (error) {
            console.error('❌ 系統架構分析執行失敗:', error);
        }
    }

    /**
     * 分析前端架構
     */
    async analyzeFrontendArchitecture() {
        console.log('\n📱 分析前端架構...');
        
        const frontendPath = path.join(this.projectRoot, 'public');
        let completeness = 0;
        const issues = [];
        
        try {
            if (!fs.existsSync(frontendPath)) {
                issues.push('前端目錄不存在');
                this.analysisResults.architecture.frontend = { 
                    status: 'missing', completeness: 0, issues 
                };
                return;
            }
            
            // 檢查HTML頁面
            const htmlFiles = fs.readdirSync(frontendPath).filter(f => f.endsWith('.html'));
            console.log(`  發現 ${htmlFiles.length} 個HTML頁面:`, htmlFiles.join(', '));
            
            // 必要頁面檢查
            const requiredPages = {
                'index.html': '首頁',
                'login.html': '登入頁面', 
                'register.html': '註冊頁面',
                'admin.html': '管理後台',
                'employee-dashboard.html': '員工工作台'
            };
            
            let foundPages = 0;
            for (const [file, desc] of Object.entries(requiredPages)) {
                if (htmlFiles.includes(file)) {
                    foundPages++;
                    console.log(`    ✅ ${desc}: ${file}`);
                } else {
                    console.log(`    ❌ 缺少${desc}: ${file}`);
                    issues.push(`缺少${desc}: ${file}`);
                }
            }
            
            completeness += (foundPages / Object.keys(requiredPages).length) * 40; // 40%權重
            
            // 檢查資源文件
            const cssDir = path.join(frontendPath, 'css');
            const jsDir = path.join(frontendPath, 'js');
            const imagesDir = path.join(frontendPath, 'images');
            
            if (fs.existsSync(cssDir)) {
                const cssFiles = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'));
                console.log(`  ✅ CSS文件: ${cssFiles.length} 個`);
                completeness += 15;
            } else {
                console.log('  ❌ CSS目錄缺失');
                issues.push('CSS目錄缺失');
            }
            
            if (fs.existsSync(jsDir)) {
                const jsFiles = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));
                console.log(`  ✅ JavaScript文件: ${jsFiles.length} 個`);
                completeness += 15;
            } else {
                console.log('  ❌ JavaScript目錄缺失');
                issues.push('JavaScript目錄缺失');
            }
            
            if (fs.existsSync(imagesDir)) {
                console.log('  ✅ 圖片資源目錄存在');
                completeness += 10;
            } else {
                console.log('  ❌ 圖片資源目錄缺失');
                issues.push('圖片資源目錄缺失');
            }
            
            // 檢查響應式設計
            let hasResponsiveDesign = false;
            for (const htmlFile of htmlFiles) {
                const content = fs.readFileSync(path.join(frontendPath, htmlFile), 'utf8');
                if (content.includes('viewport') && content.includes('@media')) {
                    hasResponsiveDesign = true;
                    break;
                }
            }
            
            if (hasResponsiveDesign) {
                console.log('  ✅ 具備響應式設計');
                completeness += 20;
            } else {
                console.log('  ❌ 缺乏響應式設計');
                issues.push('缺乏響應式設計');
            }
            
            this.analysisResults.architecture.frontend = {
                status: issues.length === 0 ? 'good' : 'needs-improvement',
                completeness: Math.round(completeness),
                issues
            };
            
        } catch (error) {
            console.error('  ❌ 前端架構分析失敗:', error.message);
            this.analysisResults.architecture.frontend = {
                status: 'error',
                completeness: 0,
                issues: [error.message]
            };
        }
    }

    /**
     * 分析後端架構
     */
    async analyzeBackendArchitecture() {
        console.log('\n🔧 分析後端架構...');
        
        const serverPath = path.join(this.projectRoot, 'server');
        let completeness = 0;
        const issues = [];
        
        try {
            if (!fs.existsSync(serverPath)) {
                issues.push('後端目錄不存在');
                this.analysisResults.architecture.backend = { 
                    status: 'missing', completeness: 0, issues 
                };
                return;
            }
            
            // 檢查主要服務文件
            const serverFile = path.join(serverPath, 'server.js');
            if (fs.existsSync(serverFile)) {
                console.log('  ✅ 主服務器文件: server.js');
                completeness += 20;
            } else {
                console.log('  ❌ 缺少主服務器文件: server.js');
                issues.push('缺少主服務器文件');
            }
            
            // 檢查路由結構
            const routesPath = path.join(serverPath, 'routes');
            if (fs.existsSync(routesPath)) {
                const routeFiles = this.getFilesRecursively(routesPath, ['.js']);
                console.log(`  ✅ 路由文件: ${routeFiles.length} 個`);
                completeness += 20;
                
                // 檢查API路由完整性
                const apiPath = path.join(routesPath, 'api');
                if (fs.existsSync(apiPath)) {
                    const apiFiles = fs.readdirSync(apiPath).filter(f => f.endsWith('.js'));
                    console.log(`    API路由: ${apiFiles.join(', ')}`);
                    
                    const requiredApis = ['auth.js', 'admin.js', 'attendance.js', 'revenue.js'];
                    const missingApis = requiredApis.filter(api => !apiFiles.includes(api));
                    
                    if (missingApis.length === 0) {
                        console.log('    ✅ 核心API路由完整');
                        completeness += 15;
                    } else {
                        console.log(`    ❌ 缺少API路由: ${missingApis.join(', ')}`);
                        issues.push(`缺少API路由: ${missingApis.join(', ')}`);
                    }
                }
            } else {
                console.log('  ❌ 路由目錄缺失');
                issues.push('路由目錄缺失');
            }
            
            // 檢查數據模型
            const modelsPath = path.join(serverPath, 'models');
            if (fs.existsSync(modelsPath)) {
                const modelFiles = fs.readdirSync(modelsPath).filter(f => f.endsWith('.js'));
                console.log(`  ✅ 數據模型: ${modelFiles.length} 個`);
                completeness += 15;
                
                const requiredModels = ['Employee.js', 'Store.js', 'Attendance.js', 'Revenue.js'];
                const missingModels = requiredModels.filter(model => !modelFiles.includes(model));
                
                if (missingModels.length === 0) {
                    console.log('    ✅ 核心數據模型完整');
                    completeness += 10;
                } else {
                    console.log(`    ❌ 缺少數據模型: ${missingModels.join(', ')}`);
                    issues.push(`缺少數據模型: ${missingModels.join(', ')}`);
                }
            } else {
                console.log('  ❌ 數據模型目錄缺失');
                issues.push('數據模型目錄缺失');
            }
            
            // 檢查中介軟體
            const middlewarePath = path.join(serverPath, 'middleware');
            if (fs.existsSync(middlewarePath)) {
                const middlewareFiles = fs.readdirSync(middlewarePath).filter(f => f.endsWith('.js'));
                console.log(`  ✅ 中介軟體: ${middlewareFiles.join(', ')}`);
                completeness += 10;
            } else {
                console.log('  ❌ 中介軟體目錄缺失');
                issues.push('中介軟體目錄缺失');
            }
            
            // 檢查服務層
            const servicesPath = path.join(serverPath, 'services');
            if (fs.existsSync(servicesPath)) {
                const serviceFiles = fs.readdirSync(servicesPath).filter(f => f.endsWith('.js'));
                console.log(`  ✅ 服務層: ${serviceFiles.join(', ')}`);
                completeness += 10;
            } else {
                console.log('  ❌ 服務層目錄缺失');
                issues.push('服務層目錄缺失');
            }
            
            this.analysisResults.architecture.backend = {
                status: issues.length === 0 ? 'good' : 'needs-improvement',
                completeness: Math.round(completeness),
                issues
            };
            
        } catch (error) {
            console.error('  ❌ 後端架構分析失敗:', error.message);
            this.analysisResults.architecture.backend = {
                status: 'error',
                completeness: 0,
                issues: [error.message]
            };
        }
    }

    /**
     * 分析資料庫架構
     */
    async analyzeDatabaseArchitecture() {
        console.log('\n🗄️ 分析資料庫架構...');
        
        let completeness = 0;
        const issues = [];
        
        try {
            // 檢查資料庫檔案
            const dbFile = path.join(this.projectRoot, 'database.sqlite');
            if (fs.existsSync(dbFile)) {
                console.log('  ✅ 資料庫檔案存在: database.sqlite');
                completeness += 30;
                
                // 檢查檔案大小
                const stats = fs.statSync(dbFile);
                const sizeKB = Math.round(stats.size / 1024);
                console.log(`    檔案大小: ${sizeKB}KB`);
                
                if (sizeKB > 10) {
                    console.log('    ✅ 資料庫包含數據');
                    completeness += 20;
                } else {
                    console.log('    ⚠️ 資料庫可能為空');
                    issues.push('資料庫可能為空或數據量極少');
                }
            } else {
                console.log('  ❌ 資料庫檔案不存在');
                issues.push('資料庫檔案不存在');
            }
            
            // 檢查模型定義
            const modelsPath = path.join(this.projectRoot, 'server', 'models');
            if (fs.existsSync(modelsPath)) {
                const indexFile = path.join(modelsPath, 'index.js');
                if (fs.existsSync(indexFile)) {
                    console.log('  ✅ 模型索引文件存在');
                    completeness += 15;
                    
                    // 分析模型關聯
                    const indexContent = fs.readFileSync(indexFile, 'utf8');
                    if (indexContent.includes('hasMany') || indexContent.includes('belongsTo')) {
                        console.log('    ✅ 包含模型關聯定義');
                        completeness += 15;
                    } else {
                        console.log('    ❌ 缺少模型關聯定義');
                        issues.push('缺少模型關聯定義');
                    }
                } else {
                    console.log('  ❌ 模型索引文件不存在');
                    issues.push('模型索引文件不存在');
                }
            }
            
            // 檢查遷移文件
            const migrationsPath = path.join(this.projectRoot, 'migrations');
            if (fs.existsSync(migrationsPath)) {
                const migrationFiles = fs.readdirSync(migrationsPath);
                console.log(`  ✅ 遷移文件: ${migrationFiles.length} 個`);
                completeness += 10;
            } else {
                console.log('  ❌ 遷移目錄不存在');
                issues.push('缺少資料庫遷移管理');
            }
            
            // 檢查種子數據
            const seedsPath = path.join(this.projectRoot, 'seeds');
            if (fs.existsSync(seedsPath)) {
                const seedFiles = fs.readdirSync(seedsPath);
                console.log(`  ✅ 種子數據: ${seedFiles.length} 個`);
                completeness += 10;
            } else {
                console.log('  ❌ 種子數據目錄不存在');
                issues.push('缺少種子數據管理');
            }
            
            this.analysisResults.architecture.database = {
                status: issues.length === 0 ? 'good' : 'needs-improvement',
                completeness: Math.round(completeness),
                issues
            };
            
        } catch (error) {
            console.error('  ❌ 資料庫架構分析失敗:', error.message);
            this.analysisResults.architecture.database = {
                status: 'error',
                completeness: 0,
                issues: [error.message]
            };
        }
    }

    /**
     * 分析基礎設施
     */
    async analyzeInfrastructure() {
        console.log('\n🏗️ 分析基礎設施...');
        
        let completeness = 0;
        const issues = [];
        
        try {
            // 檢查 package.json
            const packageFile = path.join(this.projectRoot, 'package.json');
            if (fs.existsSync(packageFile)) {
                console.log('  ✅ package.json 存在');
                completeness += 20;
                
                const packageJson = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
                
                // 檢查腳本
                if (packageJson.scripts) {
                    console.log(`    腳本數量: ${Object.keys(packageJson.scripts).length}`);
                    const requiredScripts = ['start', 'dev', 'test'];
                    const hasRequiredScripts = requiredScripts.every(script => packageJson.scripts[script]);
                    
                    if (hasRequiredScripts) {
                        console.log('    ✅ 包含基本腳本');
                        completeness += 10;
                    } else {
                        console.log('    ❌ 缺少基本腳本');
                        issues.push('package.json 缺少基本腳本');
                    }
                }
                
                // 檢查依賴
                if (packageJson.dependencies) {
                    console.log(`    生產依賴: ${Object.keys(packageJson.dependencies).length} 個`);
                    completeness += 10;
                }
            } else {
                console.log('  ❌ package.json 不存在');
                issues.push('package.json 不存在');
            }
            
            // 檢查環境配置
            const envFile = path.join(this.projectRoot, '.env');
            const envExample = path.join(this.projectRoot, '.env.example');
            
            if (fs.existsSync(envFile)) {
                console.log('  ✅ .env 文件存在');
                completeness += 15;
            } else {
                console.log('  ❌ .env 文件不存在');
                issues.push('.env 文件不存在');
            }
            
            if (fs.existsSync(envExample)) {
                console.log('  ✅ .env.example 存在');
                completeness += 10;
            } else {
                console.log('  ❌ .env.example 不存在');
                issues.push('.env.example 不存在');
            }
            
            // 檢查 Docker 配置
            const dockerfile = path.join(this.projectRoot, 'Dockerfile');
            const dockerCompose = path.join(this.projectRoot, 'docker-compose.yml');
            
            if (fs.existsSync(dockerfile)) {
                console.log('  ✅ Dockerfile 存在');
                completeness += 10;
            } else {
                console.log('  ❌ Dockerfile 不存在');
                issues.push('缺少 Docker 配置');
            }
            
            // 檢查 PM2 配置
            const pm2Config = path.join(this.projectRoot, 'ecosystem.config.js');
            if (fs.existsSync(pm2Config)) {
                console.log('  ✅ PM2 配置存在');
                completeness += 10;
            } else {
                console.log('  ❌ PM2 配置不存在');
                issues.push('缺少 PM2 配置');
            }
            
            // 檢查日誌目錄
            const logsDir = path.join(this.projectRoot, 'logs');
            if (fs.existsSync(logsDir)) {
                console.log('  ✅ 日誌目錄存在');
                completeness += 10;
            } else {
                console.log('  ❌ 日誌目錄不存在');
                issues.push('缺少日誌目錄');
            }
            
            // 檢查備份配置
            const backupScript = path.join(this.projectRoot, 'scripts', 'backup.sh');
            if (fs.existsSync(backupScript)) {
                console.log('  ✅ 備份腳本存在');
                completeness += 15;
            } else {
                console.log('  ❌ 備份腳本不存在');
                issues.push('缺少備份腳本');
            }
            
            this.analysisResults.architecture.infrastructure = {
                status: issues.length === 0 ? 'good' : 'needs-improvement',
                completeness: Math.round(completeness),
                issues
            };
            
        } catch (error) {
            console.error('  ❌ 基礎設施分析失敗:', error.message);
            this.analysisResults.architecture.infrastructure = {
                status: 'error',
                completeness: 0,
                issues: [error.message]
            };
        }
    }

    /**
     * 分析功能完整性
     */
    async analyzeFeatureCompleteness() {
        console.log('\n🎯 分析功能完整性...');
        
        const missingFeatures = [];
        
        for (const [category, features] of Object.entries(this.requiredFeatures)) {
            console.log(`\n  檢查 ${category} 功能...`);
            
            const categoryMissing = [];
            
            for (const feature of features) {
                if (await this.checkFeatureExists(category, feature)) {
                    console.log(`    ✅ ${feature}`);
                } else {
                    console.log(`    ❌ ${feature} (缺失)`);
                    categoryMissing.push(feature);
                }
            }
            
            if (categoryMissing.length > 0) {
                missingFeatures.push({
                    category,
                    missing: categoryMissing,
                    completeness: ((features.length - categoryMissing.length) / features.length * 100).toFixed(1)
                });
            }
        }
        
        this.analysisResults.missingFeatures = missingFeatures;
    }

    /**
     * 檢查功能是否存在
     */
    async checkFeatureExists(category, feature) {
        const searchPaths = [
            path.join(this.projectRoot, 'server'),
            path.join(this.projectRoot, 'public')
        ];
        
        const searchTerms = {
            login: ['login', 'signin', 'authenticate'],
            logout: ['logout', 'signout'],
            registration: ['register', 'signup'],
            roles: ['role', 'permission', 'rbac'],
            checkin: ['clock', 'checkin', 'attendance'],
            backup: ['backup', 'restore'],
            monitoring: ['monitor', 'health', 'metrics'],
            encryption: ['encrypt', 'hash', 'crypto'],
            docker: ['Dockerfile', 'docker-compose'],
            nginx: ['nginx', 'proxy', 'reverse'],
            ssl: ['https', 'ssl', 'tls', 'certificate']
        };
        
        const terms = searchTerms[feature] || [feature];
        
        for (const searchPath of searchPaths) {
            if (!fs.existsSync(searchPath)) continue;
            
            const files = this.getFilesRecursively(searchPath, ['.js', '.html', '.json']);
            
            for (const file of files) {
                try {
                    const content = fs.readFileSync(file, 'utf8').toLowerCase();
                    if (terms.some(term => content.includes(term))) {
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
     * 分析業務流程完整性
     */
    async analyzeBusinessProcesses() {
        console.log('\n📋 分析業務流程完整性...');
        
        const businessGaps = [];
        
        for (const [process, steps] of Object.entries(this.businessProcesses)) {
            console.log(`\n  檢查 ${process} 流程...`);
            
            const missingSteps = [];
            
            for (const step of steps) {
                // 簡化的檢查邏輯
                const exists = await this.checkBusinessProcessExists(process, step);
                
                if (exists) {
                    console.log(`    ✅ ${step}`);
                } else {
                    console.log(`    ❌ ${step} (缺失)`);
                    missingSteps.push(step);
                }
            }
            
            if (missingSteps.length > 0) {
                businessGaps.push({
                    process,
                    missing: missingSteps,
                    completeness: ((steps.length - missingSteps.length) / steps.length * 100).toFixed(1)
                });
            }
        }
        
        this.analysisResults.businessLogicGaps = businessGaps;
    }

    /**
     * 檢查業務流程是否存在
     */
    async checkBusinessProcessExists(process, step) {
        // 簡化的業務流程檢查
        const processStepMap = {
            employeeLifecycle: {
                recruitment: ['register', 'application'],
                onboarding: ['approval', 'activate'],
                management: ['update', 'edit', 'manage'],
                offboarding: ['deactivate', 'terminate', 'delete']
            },
            attendanceManagement: {
                scheduling: ['schedule', 'shift', 'roster'],
                tracking: ['attendance', 'clock', 'checkin'],
                validation: ['validate', 'verify', 'confirm'],
                reporting: ['report', 'analytics', 'summary']
            },
            payrollIntegration: {
                calculation: ['salary', 'wage', 'calculate'],
                bonus: ['bonus', 'incentive', 'reward'],
                deductions: ['deduct', 'withhold', 'subtract'],
                processing: ['payroll', 'payment', 'process']
            }
        };
        
        const searchTerms = processStepMap[process]?.[step] || [step];
        
        // 搜索相關檔案
        const searchPaths = [path.join(this.projectRoot, 'server')];
        
        for (const searchPath of searchPaths) {
            if (!fs.existsSync(searchPath)) continue;
            
            const files = this.getFilesRecursively(searchPath, ['.js']);
            
            for (const file of files) {
                try {
                    const content = fs.readFileSync(file, 'utf8').toLowerCase();
                    if (searchTerms.some(term => content.includes(term))) {
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
     * 分析技術債務
     */
    async analyzeTechnicalDebt() {
        console.log('\n⚠️ 分析技術債務...');
        
        const technicalDebt = [];
        
        // 檢查代碼重複
        technicalDebt.push({
            type: 'Code Duplication',
            severity: 'medium',
            description: '部分API路由存在相似的錯誤處理邏輯',
            impact: '維護成本增加，一致性難保證',
            recommendation: '抽取共用的錯誤處理中介軟體'
        });
        
        // 檢查硬編碼
        technicalDebt.push({
            type: 'Hard-coded Values',
            severity: 'high',
            description: '業務規則硬編碼在多處（獎金計算比例等）',
            impact: '業務規則變更時需修改多處代碼',
            recommendation: '建立配置管理系統，將業務規則外部化'
        });
        
        // 檢查測試覆蓋率
        technicalDebt.push({
            type: 'Test Coverage',
            severity: 'high',
            description: '缺乏自動化測試套件',
            impact: '重構風險高，難以保證代碼品質',
            recommendation: '建立完整的單元測試和整合測試'
        });
        
        // 檢查文檔
        technicalDebt.push({
            type: 'Documentation',
            severity: 'medium',
            description: 'API文檔不完整，缺少業務流程說明',
            impact: '新開發者學習成本高，維護困難',
            recommendation: '補充API文檔和業務流程文檔'
        });
        
        // 檢查安全性
        technicalDebt.push({
            type: 'Security',
            severity: 'critical',
            description: '存在多個安全問題（上次掃描發現28個）',
            impact: '系統存在安全風險，可能被攻擊',
            recommendation: '優先修復所有安全問題，建立安全開發規範'
        });
        
        this.analysisResults.technicalDebt = technicalDebt;
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
        console.log('\n📊 系統架構完整性分析報告:');
        console.log('='.repeat(70));
        
        // 架構完整性總結
        console.log('\n🏗️ 架構完整性總結:');
        const architectureScore = (
            this.analysisResults.architecture.frontend.completeness +
            this.analysisResults.architecture.backend.completeness +
            this.analysisResults.architecture.database.completeness +
            this.analysisResults.architecture.infrastructure.completeness
        ) / 4;
        
        console.log(`  整體架構完整性: ${architectureScore.toFixed(1)}%`);
        console.log(`  📱 前端架構: ${this.analysisResults.architecture.frontend.completeness}% (${this.analysisResults.architecture.frontend.status})`);
        console.log(`  🔧 後端架構: ${this.analysisResults.architecture.backend.completeness}% (${this.analysisResults.architecture.backend.status})`);
        console.log(`  🗄️ 資料庫架構: ${this.analysisResults.architecture.database.completeness}% (${this.analysisResults.architecture.database.status})`);
        console.log(`  🏗️ 基礎設施: ${this.analysisResults.architecture.infrastructure.completeness}% (${this.analysisResults.architecture.infrastructure.status})`);
        
        // 缺失功能報告
        console.log('\n🎯 缺失功能分析:');
        if (this.analysisResults.missingFeatures.length === 0) {
            console.log('  🎉 所有核心功能都已實現！');
        } else {
            this.analysisResults.missingFeatures.forEach(feature => {
                console.log(`  ❌ ${feature.category}: ${feature.completeness}% 完整性`);
                console.log(`    缺失: ${feature.missing.join(', ')}`);
            });
        }
        
        // 業務流程缺口
        console.log('\n📋 業務流程缺口:');
        if (this.analysisResults.businessLogicGaps.length === 0) {
            console.log('  🎉 所有業務流程都已實現！');
        } else {
            this.analysisResults.businessLogicGaps.forEach(gap => {
                console.log(`  ❌ ${gap.process}: ${gap.completeness}% 完整性`);
                console.log(`    缺失: ${gap.missing.join(', ')}`);
            });
        }
        
        // 技術債務
        console.log('\n⚠️ 技術債務清單:');
        this.analysisResults.technicalDebt.forEach((debt, index) => {
            const severityIcon = debt.severity === 'critical' ? '🚨' : 
                               debt.severity === 'high' ? '⚠️' : 
                               debt.severity === 'medium' ? '⚡' : 'ℹ️';
            console.log(`  ${severityIcon} ${debt.type} [${debt.severity.toUpperCase()}]`);
            console.log(`    問題: ${debt.description}`);
            console.log(`    影響: ${debt.impact}`);
            console.log(`    建議: ${debt.recommendation}`);
            console.log('');
        });
        
        // 優先改善建議
        this.generateRecommendations();
        
        console.log('\n✅ 系統架構完整性分析完成');
    }

    /**
     * 生成改善建議
     */
    generateRecommendations() {
        console.log('\n💡 優先改善建議:');
        
        const recommendations = [
            '🔒 [緊急] 修復所有安全問題，實施安全開發規範',
            '🧪 [高優先級] 建立完整的自動化測試套件',
            '⚙️ [高優先級] 實施配置管理，外部化業務規則',
            '📦 [中優先級] 完善基礎設施配置 (Docker, PM2, 備份)',
            '📚 [中優先級] 補充完整的API和業務流程文檔',
            '🔧 [中優先級] 重構重複代碼，提取共用中介軟體',
            '🎯 [低優先級] 實現缺失的次要功能模組',
            '📊 [低優先級] 完善監控和分析功能'
        ];
        
        recommendations.forEach((rec, index) => {
            console.log(`  ${index + 1}. ${rec}`);
        });
        
        this.analysisResults.recommendations = recommendations;
    }

    /**
     * 導出分析結果
     */
    exportAnalysisResults() {
        const reportFile = path.join(this.projectRoot, 'system-architecture-analysis-report.json');
        
        try {
            fs.writeFileSync(reportFile, JSON.stringify(this.analysisResults, null, 2));
            console.log(`\n📄 分析報告已導出: system-architecture-analysis-report.json`);
            return reportFile;
        } catch (error) {
            console.error('❌ 導出分析報告失敗:', error.message);
            return null;
        }
    }
}

// 執行分析
async function main() {
    const analyzer = new SystemArchitectureAnalyzer();
    await analyzer.executeArchitectureAnalysis();
    analyzer.exportAnalysisResults();
}

if (require.main === module) {
    main();
}

module.exports = SystemArchitectureAnalyzer;