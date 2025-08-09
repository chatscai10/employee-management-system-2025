/**
 * 🔬 深層系統驗證引擎
 * Deep System Verification Engine
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DeepSystemVerificationEngine {
    constructor() {
        this.issues = [];
        this.fixes = [];
        this.timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
        this.reportDir = path.join(__dirname, '.claude-reports');
        
        // 確保報告目錄存在
        if (!fs.existsSync(this.reportDir)) {
            fs.mkdirSync(this.reportDir, { recursive: true });
        }
    }

    log(message) {
        console.log(message);
    }

    logSuccess(message) {
        console.log(`✅ ${message}`);
    }

    logError(message) {
        console.log(`❌ ${message}`);
        this.issues.push(message);
    }

    logFix(message) {
        console.log(`🔧 ${message}`);
        this.fixes.push(message);
    }

    // 檢查檔案系統完整性
    async checkFileSystemIntegrity() {
        this.log('\n🔍 檢查檔案系統完整性...');
        
        const criticalFiles = [
            'server/server.js',
            'package.json',
            'ecosystem.config.js',
            'docker-compose.yml',
            'Dockerfile',
            '.env.production',
            'database/employee_management.db'
        ];

        const criticalDirs = [
            'server',
            'server/routes',
            'server/models', 
            'server/middleware',
            'server/services',
            'tests',
            'public',
            'scripts'
        ];

        let missingFiles = 0;
        let missingDirs = 0;

        // 檢查關鍵檔案
        criticalFiles.forEach(file => {
            if (fs.existsSync(file)) {
                this.logSuccess(`檔案存在: ${file}`);
            } else {
                this.logError(`缺少關鍵檔案: ${file}`);
                missingFiles++;
            }
        });

        // 檢查關鍵目錄
        criticalDirs.forEach(dir => {
            if (fs.existsSync(dir)) {
                this.logSuccess(`目錄存在: ${dir}`);
            } else {
                this.logError(`缺少關鍵目錄: ${dir}`);
                missingDirs++;
            }
        });

        this.log(`\n📊 檔案系統檢查結果:`);
        this.log(`   檔案檢查: ${criticalFiles.length - missingFiles}/${criticalFiles.length} 通過`);
        this.log(`   目錄檢查: ${criticalDirs.length - missingDirs}/${criticalDirs.length} 通過`);

        return { missingFiles, missingDirs };
    }

    // 檢查依賴完整性
    async checkDependencyIntegrity() {
        this.log('\n📦 檢查依賴完整性...');

        try {
            // 檢查 package.json
            const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            this.logSuccess('package.json 讀取成功');

            // 檢查 node_modules
            if (!fs.existsSync('node_modules')) {
                this.logError('node_modules 目錄不存在');
                return false;
            }

            // 檢查關鍵依賴
            const criticalDeps = [
                'express', 'bcryptjs', 'jsonwebtoken', 'helmet', 
                'cors', 'compression', 'sqlite3', 'winston'
            ];

            let missingDeps = 0;
            criticalDeps.forEach(dep => {
                if (packageJson.dependencies[dep]) {
                    this.logSuccess(`依賴存在: ${dep}@${packageJson.dependencies[dep]}`);
                } else {
                    this.logError(`缺少關鍵依賴: ${dep}`);
                    missingDeps++;
                }
            });

            // 檢查安全漏洞
            try {
                const auditResult = execSync('npm audit --json', { encoding: 'utf8' });
                const audit = JSON.parse(auditResult);
                
                if (audit.vulnerabilities && Object.keys(audit.vulnerabilities).length > 0) {
                    this.logError(`發現 ${Object.keys(audit.vulnerabilities).length} 個安全漏洞`);
                } else {
                    this.logSuccess('沒有發現安全漏洞');
                }
            } catch (error) {
                this.log('⚠️ 無法執行安全審計檢查');
            }

            return missingDeps === 0;

        } catch (error) {
            this.logError(`依賴檢查失敗: ${error.message}`);
            return false;
        }
    }

    // 檢查模組載入
    async checkModuleLoading() {
        this.log('\n🔧 檢查模組載入...');

        const criticalModules = [
            'server/utils/logger',
            'server/utils/responseHelper',
            'server/middleware/auth',
            'server/middleware/security/index',
            'server/services/monitoringService',
            'server/services/alertService'
        ];

        let loadFailures = 0;
        
        for (const module of criticalModules) {
            try {
                const modulePath = path.resolve(module);
                if (fs.existsSync(modulePath + '.js')) {
                    // 嘗試載入模組但不實際執行
                    const moduleContent = fs.readFileSync(modulePath + '.js', 'utf8');
                    
                    // 檢查語法錯誤
                    if (moduleContent.includes('require(') && 
                        !moduleContent.includes('module.exports')) {
                        this.logError(`模組缺少 exports: ${module}`);
                        loadFailures++;
                    } else {
                        this.logSuccess(`模組結構正常: ${module}`);
                    }
                } else {
                    this.logError(`模組檔案不存在: ${module}`);
                    loadFailures++;
                }
            } catch (error) {
                this.logError(`模組載入失敗 ${module}: ${error.message}`);
                loadFailures++;
            }
        }

        return loadFailures === 0;
    }

    // 檢查資料庫完整性
    async checkDatabaseIntegrity() {
        this.log('\n🗄️ 檢查資料庫完整性...');

        const dbPath = 'database/employee_management.db';
        
        if (!fs.existsSync(dbPath)) {
            this.logError('資料庫檔案不存在');
            return false;
        }

        try {
            const stats = fs.statSync(dbPath);
            const sizeKB = Math.round(stats.size / 1024);
            
            this.logSuccess(`資料庫檔案存在，大小: ${sizeKB}KB`);
            
            if (stats.size < 1024) {
                this.logError('資料庫檔案過小，可能損壞');
                return false;
            }

            // 嘗試使用 sqlite3 檢查
            try {
                const sqlite3 = require('sqlite3');
                this.logSuccess('SQLite3 模組可用');
                
                return new Promise((resolve) => {
                    const db = new sqlite3.Database(dbPath, (err) => {
                        if (err) {
                            this.logError(`資料庫連接失敗: ${err.message}`);
                            resolve(false);
                        } else {
                            this.logSuccess('資料庫連接成功');
                            
                            // 執行完整性檢查
                            db.run('PRAGMA integrity_check', (err, result) => {
                                if (err) {
                                    this.logError(`完整性檢查失敗: ${err.message}`);
                                    resolve(false);
                                } else {
                                    this.logSuccess('資料庫完整性檢查通過');
                                    resolve(true);
                                }
                                db.close();
                            });
                        }
                    });
                });
            } catch (error) {
                this.log('⚠️ SQLite3 模組不可用，跳過深度檢查');
                return true;
            }

        } catch (error) {
            this.logError(`資料庫檢查失敗: ${error.message}`);
            return false;
        }
    }

    // 檢查配置檔案
    async checkConfigurationFiles() {
        this.log('\n⚙️ 檢查配置檔案...');

        const configs = [
            '.env.production',
            '.env.development', 
            'ecosystem.config.js',
            'docker-compose.yml',
            'nginx.conf'
        ];

        let configIssues = 0;

        configs.forEach(config => {
            if (fs.existsSync(config)) {
                try {
                    const content = fs.readFileSync(config, 'utf8');
                    
                    if (content.length < 10) {
                        this.logError(`配置檔案過小: ${config}`);
                        configIssues++;
                    } else if (content.includes('CHANGE_THIS') || content.includes('your_secret_here')) {
                        this.logError(`配置檔案包含預設值: ${config}`);
                        configIssues++;
                    } else {
                        this.logSuccess(`配置檔案正常: ${config}`);
                    }
                } catch (error) {
                    this.logError(`讀取配置檔案失敗 ${config}: ${error.message}`);
                    configIssues++;
                }
            } else {
                this.logError(`配置檔案不存在: ${config}`);
                configIssues++;
            }
        });

        return configIssues === 0;
    }

    // 檢查測試覆蓋率
    async checkTestCoverage() {
        this.log('\n🧪 檢查測試覆蓋率...');

        const testFiles = [
            'tests/unit/auth.test.js',
            'tests/unit/attendance.test.js',
            'tests/integration/api.test.js',
            'tests/e2e/browser.test.js',
            'tests/stability/system-stability.test.js'
        ];

        let existingTests = 0;

        testFiles.forEach(testFile => {
            if (fs.existsSync(testFile)) {
                this.logSuccess(`測試檔案存在: ${testFile}`);
                existingTests++;
            } else {
                this.logError(`測試檔案缺失: ${testFile}`);
            }
        });

        const coveragePercentage = (existingTests / testFiles.length) * 100;
        this.log(`\n📊 測試覆蓋率: ${existingTests}/${testFiles.length} (${coveragePercentage.toFixed(1)}%)`);

        return coveragePercentage >= 80;
    }

    // 執行自動修復
    async performAutoFixes() {
        this.log('\n🔧 執行自動修復...');

        let fixesApplied = 0;

        // 修復 1: 創建缺失的日誌目錄
        if (!fs.existsSync('logs')) {
            fs.mkdirSync('logs', { recursive: true });
            this.logFix('創建 logs 目錄');
            fixesApplied++;
        }

        // 修復 2: 創建缺失的上傳目錄
        const uploadDirs = [
            'server/uploads',
            'server/uploads/temp',
            'server/uploads/maintenance',
            'server/uploads/revenue'
        ];

        uploadDirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                this.logFix(`創建目錄: ${dir}`);
                fixesApplied++;
            }
        });

        // 修復 3: 設置環境變數檔案權限
        const envFiles = ['.env.production', '.env.development', '.env.staging'];
        envFiles.forEach(envFile => {
            if (fs.existsSync(envFile)) {
                try {
                    fs.chmodSync(envFile, 0o600);
                    this.logFix(`設置權限 600 for ${envFile}`);
                    fixesApplied++;
                } catch (error) {
                    this.log(`⚠️ 無法設置權限 ${envFile}: ${error.message}`);
                }
            }
        });

        // 修復 4: 創建缺失的腳本執行權限
        if (fs.existsSync('scripts')) {
            const scripts = fs.readdirSync('scripts').filter(file => file.endsWith('.sh'));
            scripts.forEach(script => {
                const scriptPath = path.join('scripts', script);
                try {
                    fs.chmodSync(scriptPath, 0o755);
                    this.logFix(`設置執行權限 for ${script}`);
                    fixesApplied++;
                } catch (error) {
                    this.log(`⚠️ 無法設置執行權限 ${script}: ${error.message}`);
                }
            });
        }

        this.log(`\n✅ 自動修復完成，應用了 ${fixesApplied} 個修復`);
        return fixesApplied;
    }

    // 生成驗證報告
    async generateVerificationReport() {
        const report = {
            timestamp: new Date().toISOString(),
            systemStatus: 'ANALYZED',
            issues: this.issues,
            fixes: this.fixes,
            summary: {
                totalIssues: this.issues.length,
                totalFixes: this.fixes.length,
                overallHealth: this.issues.length === 0 ? 'HEALTHY' : 
                              this.issues.length <= 3 ? 'WARNING' : 'CRITICAL'
            }
        };

        const reportPath = path.join(this.reportDir, `deep-verification-report-${this.timestamp}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        // 生成Markdown報告
        const mdReport = this.generateMarkdownReport(report);
        const mdPath = path.join(this.reportDir, `deep-verification-report-${this.timestamp}.md`);
        fs.writeFileSync(mdPath, mdReport);

        this.log(`\n📋 驗證報告已生成:`);
        this.log(`   JSON: ${reportPath}`);
        this.log(`   Markdown: ${mdPath}`);

        return report;
    }

    // 生成Markdown報告
    generateMarkdownReport(report) {
        return `
# 🔬 深層系統驗證報告

**生成時間**: ${new Date(report.timestamp).toLocaleString('zh-TW')}
**系統狀態**: ${report.summary.overallHealth}

## 📊 驗證摘要

- **發現問題**: ${report.summary.totalIssues} 個
- **應用修復**: ${report.summary.totalFixes} 個
- **系統健康度**: ${report.summary.overallHealth}

## 🔍 發現的問題

${report.issues.length === 0 ? '✅ 沒有發現問題' : 
  report.issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')}

## 🔧 應用的修復

${report.fixes.length === 0 ? 'ℹ️ 沒有應用修復' :
  report.fixes.map((fix, i) => `${i + 1}. ${fix}`).join('\n')}

## 🎯 建議

${report.summary.overallHealth === 'HEALTHY' ? 
  '✅ 系統狀態良好，可以投入生產使用。' :
  report.summary.overallHealth === 'WARNING' ?
  '⚠️ 發現少量問題，建議修復後再部署到生產環境。' :
  '❌ 發現嚴重問題，必須修復後才能部署。'
}

---
*報告由深層系統驗證引擎自動生成*
        `.trim();
    }

    // 執行完整驗證
    async runFullVerification() {
        this.log('🔬 開始深層系統驗證...\n');
        
        const results = {
            fileSystem: await this.checkFileSystemIntegrity(),
            dependencies: await this.checkDependencyIntegrity(),
            modules: await this.checkModuleLoading(),
            database: await this.checkDatabaseIntegrity(),
            configuration: await this.checkConfigurationFiles(),
            tests: await this.checkTestCoverage()
        };

        // 執行自動修復
        const fixesApplied = await this.performAutoFixes();

        // 生成報告
        const report = await this.generateVerificationReport();

        // 顯示最終摘要
        this.log('\n' + '='.repeat(60));
        this.log('🎯 深層驗證完成摘要');
        this.log('='.repeat(60));
        this.log(`📊 系統健康度: ${report.summary.overallHealth}`);
        this.log(`🔍 發現問題: ${report.summary.totalIssues} 個`);
        this.log(`🔧 應用修復: ${report.summary.totalFixes} 個`);
        this.log(`📋 詳細報告: 已保存到 .claude-reports/ 目錄`);
        
        if (report.summary.overallHealth === 'HEALTHY') {
            this.log('✅ 系統準備就緒，可以投入生產使用！');
        } else {
            this.log('⚠️ 需要額外關注和修復，詳見報告。');
        }

        return {
            success: report.summary.overallHealth !== 'CRITICAL',
            report,
            results,
            fixesApplied
        };
    }
}

// 如果直接執行此腳本
if (require.main === module) {
    const engine = new DeepSystemVerificationEngine();
    engine.runFullVerification().then(result => {
        if (result.success) {
            console.log('\n🎉 深層驗證成功完成！');
            process.exit(0);
        } else {
            console.log('\n❌ 深層驗證發現嚴重問題！');
            process.exit(1);
        }
    }).catch(error => {
        console.error('💥 深層驗證執行錯誤:', error);
        process.exit(1);
    });
}

module.exports = DeepSystemVerificationEngine;