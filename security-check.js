#!/usr/bin/env node
/**
 * 安全配置檢查器 - 定期檢查系統安全狀態
 */

const fs = require('fs');
const path = require('path');

class SecurityChecker {
    constructor() {
        this.checks = [];
    }

    async runAllChecks() {
        console.log('🔍 開始安全檢查...');
        
        this.checkFilePermissions();
        this.checkEnvironmentVariables();
        this.checkDependencyVulnerabilities();
        this.checkConfigurationSecurity();
        
        this.generateSecurityReport();
    }

    checkFilePermissions() {
        const sensitiveFiles = [
            '.env',
            'server/config/database.js',
            'server/models',
            'server/routes/api'
        ];

        for (const file of sensitiveFiles) {
            try {
                const stats = fs.statSync(file);
                const mode = stats.mode.toString(8);
                
                this.checks.push({
                    type: 'file_permission',
                    file: file,
                    mode: mode,
                    secure: this.isSecurePermission(mode)
                });
            } catch (error) {
                this.checks.push({
                    type: 'file_permission',
                    file: file,
                    error: error.message
                });
            }
        }
    }

    isSecurePermission(mode) {
        // 檢查文件權限是否安全
        const lastThree = mode.slice(-3);
        return lastThree === '600' || lastThree === '644' || lastThree === '755';
    }

    checkEnvironmentVariables() {
        const requiredEnvVars = [
            'JWT_SECRET',
            'DATABASE_URL',
            'NODE_ENV'
        ];

        for (const envVar of requiredEnvVars) {
            const exists = !!process.env[envVar];
            const secure = exists && process.env[envVar].length > 10;
            
            this.checks.push({
                type: 'environment_variable',
                variable: envVar,
                exists: exists,
                secure: secure
            });
        }
    }

    checkDependencyVulnerabilities() {
        try {
            const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            const dependencies = {...packageJson.dependencies, ...packageJson.devDependencies};
            
            // 檢查已知有漏洞的包
            const vulnerablePackages = [
                'lodash@4.17.15',
                'axios@0.18.0',
                'express@4.16.0'
            ];

            for (const [name, version] of Object.entries(dependencies)) {
                const packageString = `${name}@${version}`;
                const vulnerable = vulnerablePackages.includes(packageString);
                
                if (vulnerable) {
                    this.checks.push({
                        type: 'dependency_vulnerability',
                        package: packageString,
                        vulnerable: true,
                        severity: 'HIGH'
                    });
                }
            }
        } catch (error) {
            this.checks.push({
                type: 'dependency_check',
                error: error.message
            });
        }
    }

    checkConfigurationSecurity() {
        // 檢查服務器配置
        const configChecks = [
            { file: 'server/server.js', pattern: /app\.use\(cors\(\)\)/, risk: 'CORS not configured' },
            { file: 'server/server.js', pattern: /helmet/, secure: 'Security headers enabled' },
            { file: 'server/server.js', pattern: /express\.static/, risk: 'Static files served' }
        ];

        for (const check of configChecks) {
            try {
                const content = fs.readFileSync(check.file, 'utf8');
                const found = check.pattern.test(content);
                
                this.checks.push({
                    type: 'configuration',
                    file: check.file,
                    check: check.pattern.toString(),
                    found: found,
                    message: found ? (check.secure || 'Found') : (check.risk || 'Not found')
                });
            } catch (error) {
                this.checks.push({
                    type: 'configuration',
                    file: check.file,
                    error: error.message
                });
            }
        }
    }

    generateSecurityReport() {
        const report = {
            timestamp: new Date().toISOString(),
            checks: this.checks,
            summary: {
                total: this.checks.length,
                passed: this.checks.filter(c => c.secure || (c.found && c.message !== c.risk)).length,
                failed: this.checks.filter(c => c.vulnerable || c.error || (c.found && c.message === c.risk)).length
            }
        };

        const reportPath = `security-report-${Date.now()}.json`;
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        console.log('📊 安全檢查報告:');
        console.log(`總檢查項目: ${report.summary.total}`);
        console.log(`通過: ${report.summary.passed}`);
        console.log(`失敗: ${report.summary.failed}`);
        console.log(`詳細報告: ${reportPath}`);

        return report;
    }
}

if (require.main === module) {
    const checker = new SecurityChecker();
    checker.runAllChecks();
}

module.exports = SecurityChecker;
