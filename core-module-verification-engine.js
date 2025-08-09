/**
 * 🔬 核心模組驗證引擎
 * Core Module Verification Engine
 */

const fs = require('fs');
const path = require('path');

class CoreModuleVerificationEngine {
    constructor() {
        this.verificationResults = [];
        this.codeQualityIssues = [];
        this.performanceWarnings = [];
        this.securityConcerns = [];
        this.timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    }

    log(message) {
        console.log(message);
    }

    logSuccess(message) {
        console.log(`✅ ${message}`);
        this.verificationResults.push({ type: 'success', message });
    }

    logWarning(message) {
        console.log(`⚠️ ${message}`);
        this.verificationResults.push({ type: 'warning', message });
    }

    logError(message) {
        console.log(`❌ ${message}`);
        this.verificationResults.push({ type: 'error', message });
    }

    // 驗證核心服務模組
    async verifyServiceModules() {
        this.log('\n🔍 驗證核心服務模組...');

        const serviceModules = [
            'server/services/alertService.js',
            'server/services/monitoringService.js',
            'server/services/backupService.js',
            'server/services/healthService.js',
            'server/services/cleanupService.js',
            'server/services/notificationService.js',
            'server/services/websocketHandler.js'
        ];

        let passedModules = 0;

        for (const module of serviceModules) {
            if (fs.existsSync(module)) {
                const moduleContent = fs.readFileSync(module, 'utf8');
                const verification = this.analyzeModuleCode(module, moduleContent);
                
                if (verification.isValid) {
                    this.logSuccess(`服務模組正常: ${module}`);
                    passedModules++;
                } else {
                    this.logError(`服務模組問題: ${module} - ${verification.issues.join(', ')}`);
                }
            } else {
                this.logError(`服務模組不存在: ${module}`);
            }
        }

        this.log(`📊 服務模組驗證: ${passedModules}/${serviceModules.length} 通過`);
        return passedModules === serviceModules.length;
    }

    // 驗證中間件模組
    async verifyMiddlewareModules() {
        this.log('\n🛡️ 驗證中間件模組...');

        const middlewareModules = [
            'server/middleware/auth.js',
            'server/middleware/auth/production.js',
            'server/middleware/errorHandler.js',
            'server/middleware/monitoring.js',
            'server/middleware/security/index.js',
            'server/middleware/security/inputSecurity.js',
            'server/middleware/security/authSecurity.js',
            'server/middleware/performance/optimization.js'
        ];

        let passedModules = 0;

        for (const module of middlewareModules) {
            if (fs.existsSync(module)) {
                const moduleContent = fs.readFileSync(module, 'utf8');
                const verification = this.analyzeMiddlewareCode(module, moduleContent);
                
                if (verification.isValid) {
                    this.logSuccess(`中間件正常: ${module}`);
                    passedModules++;
                } else {
                    this.logWarning(`中間件警告: ${module} - ${verification.issues.join(', ')}`);
                }
            } else {
                this.logError(`中間件不存在: ${module}`);
            }
        }

        this.log(`📊 中間件驗證: ${passedModules}/${middlewareModules.length} 通過`);
        return passedModules >= middlewareModules.length * 0.8; // 80% 通過率接受
    }

    // 驗證路由模組
    async verifyRouteModules() {
        this.log('\n🛣️ 驗證路由模組...');

        const routeModules = [
            'server/routes/api/auth.js',
            'server/routes/api/auth-production.js',
            'server/routes/api/attendance.js',
            'server/routes/api/revenue.js',
            'server/routes/api/admin.js',
            'server/routes/api/monitoring.js',
            'server/routes/api/alerts.js'
        ];

        let passedModules = 0;

        for (const module of routeModules) {
            if (fs.existsSync(module)) {
                const moduleContent = fs.readFileSync(module, 'utf8');
                const verification = this.analyzeRouteCode(module, moduleContent);
                
                if (verification.isValid) {
                    this.logSuccess(`路由正常: ${module}`);
                    passedModules++;
                } else {
                    this.logWarning(`路由問題: ${module} - ${verification.issues.join(', ')}`);
                }
            } else {
                this.logError(`路由不存在: ${module}`);
            }
        }

        this.log(`📊 路由驗證: ${passedModules}/${routeModules.length} 通過`);
        return passedModules >= routeModules.length * 0.8;
    }

    // 驗證模型模組
    async verifyModelModules() {
        this.log('\n🗄️ 驗證模型模組...');

        const modelModules = [
            'server/models/index.js',
            'server/models/Employee.js',
            'server/models/AttendanceRecord.js',
            'server/models/RevenueRecord.js',
            'server/models/Schedule.js',
            'server/models/Store.js'
        ];

        let passedModules = 0;

        for (const module of modelModules) {
            if (fs.existsSync(module)) {
                const moduleContent = fs.readFileSync(module, 'utf8');
                const verification = this.analyzeModelCode(module, moduleContent);
                
                if (verification.isValid) {
                    this.logSuccess(`模型正常: ${module}`);
                    passedModules++;
                } else {
                    this.logWarning(`模型問題: ${module} - ${verification.issues.join(', ')}`);
                }
            } else {
                this.logError(`模型不存在: ${module}`);
            }
        }

        this.log(`📊 模型驗證: ${passedModules}/${modelModules.length} 通過`);
        return passedModules >= modelModules.length * 0.8;
    }

    // 分析模組程式碼
    analyzeModuleCode(modulePath, code) {
        const issues = [];
        let isValid = true;

        // 基本結構檢查
        if (!code.includes('module.exports')) {
            issues.push('缺少 module.exports');
            isValid = false;
        }

        // 安全檢查
        if (code.includes('eval(') || code.includes('Function(')) {
            issues.push('使用了不安全的 eval 或 Function');
            this.securityConcerns.push(`${modulePath}: 使用了不安全的動態執行`);
            isValid = false;
        }

        // 錯誤處理檢查
        const hasErrorHandling = code.includes('try') && code.includes('catch');
        if (!hasErrorHandling && code.includes('async')) {
            issues.push('async 函數缺少錯誤處理');
            this.codeQualityIssues.push(`${modulePath}: 缺少錯誤處理`);
        }

        // 日誌記錄檢查
        if (!code.includes('logger') && !code.includes('console.log')) {
            issues.push('缺少日誌記錄');
            this.codeQualityIssues.push(`${modulePath}: 缺少日誌記錄`);
        }

        return { isValid: issues.length === 0, issues };
    }

    // 分析中間件程式碼
    analyzeMiddlewareCode(modulePath, code) {
        const issues = [];

        // 中間件特有檢查
        if (!code.includes('(req, res, next)') && !code.includes('req,') && !code.includes('res,')) {
            issues.push('不符合中間件模式');
        }

        // 檢查 next() 調用
        if (code.includes('next') && !code.includes('next()')) {
            issues.push('可能缺少 next() 調用');
        }

        return this.analyzeModuleCode(modulePath, code);
    }

    // 分析路由程式碼
    analyzeRouteCode(modulePath, code) {
        const issues = [];

        // 路由特有檢查
        if (!code.includes('router') && !code.includes('app.')) {
            issues.push('不符合路由模式');
        }

        // HTTP 方法檢查
        const httpMethods = ['get', 'post', 'put', 'delete', 'patch'];
        const hasHttpMethods = httpMethods.some(method => 
            code.includes(`.${method}(`) || code.includes(`app.${method}(`)
        );

        if (!hasHttpMethods) {
            issues.push('沒有定義 HTTP 路由');
        }

        return this.analyzeModuleCode(modulePath, code);
    }

    // 分析模型程式碼  
    analyzeModelCode(modulePath, code) {
        const issues = [];

        // 如果是 index.js，檢查是否有模型初始化
        if (modulePath.includes('index.js')) {
            if (!code.includes('sequelize') && !code.includes('sqlite')) {
                issues.push('缺少資料庫連接設定');
            }
        }

        return this.analyzeModuleCode(modulePath, code);
    }

    // 驗證配置檔案完整性
    async verifyConfigurationIntegrity() {
        this.log('\n⚙️ 驗證配置檔案完整性...');

        const configs = {
            'package.json': this.verifyPackageJson,
            'ecosystem.config.js': this.verifyEcosystemConfig,
            'docker-compose.yml': this.verifyDockerConfig,
            '.env.production': this.verifyEnvConfig,
            'nginx.conf': this.verifyNginxConfig
        };

        let passedConfigs = 0;
        const totalConfigs = Object.keys(configs).length;

        for (const [configFile, verifyFunc] of Object.entries(configs)) {
            if (fs.existsSync(configFile)) {
                try {
                    const content = fs.readFileSync(configFile, 'utf8');
                    const result = verifyFunc.call(this, content);
                    
                    if (result.isValid) {
                        this.logSuccess(`配置檔案正常: ${configFile}`);
                        passedConfigs++;
                    } else {
                        this.logWarning(`配置檔案問題: ${configFile} - ${result.issues.join(', ')}`);
                    }
                } catch (error) {
                    this.logError(`讀取配置檔案失敗: ${configFile} - ${error.message}`);
                }
            } else {
                this.logError(`配置檔案不存在: ${configFile}`);
            }
        }

        this.log(`📊 配置檔案驗證: ${passedConfigs}/${totalConfigs} 通過`);
        return passedConfigs >= totalConfigs * 0.8;
    }

    // 驗證 package.json
    verifyPackageJson(content) {
        const issues = [];

        try {
            const pkg = JSON.parse(content);
            
            // 檢查必要欄位
            const requiredFields = ['name', 'version', 'main', 'scripts', 'dependencies'];
            requiredFields.forEach(field => {
                if (!pkg[field]) {
                    issues.push(`缺少 ${field} 欄位`);
                }
            });

            // 檢查關鍵依賴
            const criticalDeps = ['express', 'bcryptjs', 'jsonwebtoken'];
            criticalDeps.forEach(dep => {
                if (!pkg.dependencies || !pkg.dependencies[dep]) {
                    issues.push(`缺少關鍵依賴: ${dep}`);
                }
            });

            // 檢查腳本
            if (!pkg.scripts || !pkg.scripts.start) {
                issues.push('缺少 start 腳本');
            }

        } catch (error) {
            issues.push('JSON 格式錯誤');
        }

        return { isValid: issues.length === 0, issues };
    }

    // 驗證 ecosystem.config.js
    verifyEcosystemConfig(content) {
        const issues = [];

        if (!content.includes('module.exports')) {
            issues.push('不符合 Node.js 模組格式');
        }

        if (!content.includes('apps')) {
            issues.push('缺少 apps 配置');
        }

        if (!content.includes('instances')) {
            issues.push('缺少 instances 配置');
        }

        return { isValid: issues.length === 0, issues };
    }

    // 驗證 Docker 配置
    verifyDockerConfig(content) {
        const issues = [];

        if (!content.includes('version:')) {
            issues.push('缺少 version 聲明');
        }

        if (!content.includes('services:')) {
            issues.push('缺少 services 配置');
        }

        return { isValid: issues.length === 0, issues };
    }

    // 驗證環境配置
    verifyEnvConfig(content) {
        const issues = [];

        const requiredVars = [
            'NODE_ENV', 'PORT', 'JWT_SECRET', 
            'TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID'
        ];

        requiredVars.forEach(varName => {
            if (!content.includes(`${varName}=`)) {
                issues.push(`缺少環境變數: ${varName}`);
            }
        });

        // 檢查預設值
        if (content.includes('CHANGE_THIS') || content.includes('your_secret_here')) {
            issues.push('包含預設值，需要更改');
        }

        return { isValid: issues.length === 0, issues };
    }

    // 驗證 Nginx 配置
    verifyNginxConfig(content) {
        const issues = [];

        if (!content.includes('server {')) {
            issues.push('缺少 server 區塊');
        }

        if (!content.includes('listen')) {
            issues.push('缺少 listen 指令');
        }

        if (!content.includes('location')) {
            issues.push('缺少 location 指令');
        }

        return { isValid: issues.length === 0, issues };
    }

    // 生成核心模組驗證報告
    async generateVerificationReport() {
        const report = {
            timestamp: new Date().toISOString(),
            verificationResults: this.verificationResults,
            codeQualityIssues: this.codeQualityIssues,
            performanceWarnings: this.performanceWarnings,
            securityConcerns: this.securityConcerns,
            summary: {
                totalVerifications: this.verificationResults.length,
                successCount: this.verificationResults.filter(r => r.type === 'success').length,
                warningCount: this.verificationResults.filter(r => r.type === 'warning').length,
                errorCount: this.verificationResults.filter(r => r.type === 'error').length,
                qualityScore: this.calculateQualityScore()
            }
        };

        const reportPath = path.join(__dirname, '.claude-reports', 
            `core-module-verification-${this.timestamp}.json`);
        
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        this.log(`\n📋 核心模組驗證報告已生成: ${reportPath}`);
        return report;
    }

    // 計算品質分數
    calculateQualityScore() {
        const total = this.verificationResults.length;
        const success = this.verificationResults.filter(r => r.type === 'success').length;
        const warnings = this.verificationResults.filter(r => r.type === 'warning').length;
        const errors = this.verificationResults.filter(r => r.type === 'error').length;

        if (total === 0) return 0;

        const score = ((success * 1.0 + warnings * 0.5 + errors * 0.0) / total) * 100;
        return Math.round(score);
    }

    // 執行完整驗證
    async runFullVerification() {
        this.log('🔬 開始核心模組驗證...\n');

        const results = {
            services: await this.verifyServiceModules(),
            middleware: await this.verifyMiddlewareModules(),
            routes: await this.verifyRouteModules(),
            models: await this.verifyModelModules(),
            configurations: await this.verifyConfigurationIntegrity()
        };

        // 生成報告
        const report = await this.generateVerificationReport();

        // 顯示最終摘要
        this.log('\n' + '='.repeat(60));
        this.log('🎯 核心模組驗證完成摘要');
        this.log('='.repeat(60));
        this.log(`📊 品質分數: ${report.summary.qualityScore}%`);
        this.log(`✅ 成功: ${report.summary.successCount}`);
        this.log(`⚠️ 警告: ${report.summary.warningCount}`);
        this.log(`❌ 錯誤: ${report.summary.errorCount}`);

        if (this.codeQualityIssues.length > 0) {
            this.log('\n🔍 程式碼品質問題:');
            this.codeQualityIssues.forEach((issue, i) => {
                this.log(`   ${i + 1}. ${issue}`);
            });
        }

        if (this.securityConcerns.length > 0) {
            this.log('\n🔒 安全性關注:');
            this.securityConcerns.forEach((concern, i) => {
                this.log(`   ${i + 1}. ${concern}`);
            });
        }

        const overallSuccess = report.summary.qualityScore >= 80;
        
        if (overallSuccess) {
            this.log('\n✅ 核心模組驗證通過！');
        } else {
            this.log('\n⚠️ 核心模組需要改進。');
        }

        return {
            success: overallSuccess,
            report,
            results
        };
    }
}

// 如果直接執行此腳本
if (require.main === module) {
    const engine = new CoreModuleVerificationEngine();
    engine.runFullVerification().then(result => {
        if (result.success) {
            console.log('\n🎉 核心模組驗證成功完成！');
            process.exit(0);
        } else {
            console.log('\n⚠️ 核心模組驗證發現問題！');
            process.exit(1);
        }
    }).catch(error => {
        console.error('💥 核心模組驗證執行錯誤:', error);
        process.exit(1);
    });
}

module.exports = CoreModuleVerificationEngine;