/**
 * ===========================
 * 智慧路由診斷和修復系統
 * ===========================
 * 功能：
 * 1. 自動檢測路由文件的語法錯誤
 * 2. 驗證路由導出格式是否正確
 * 3. 檢查依賴模組是否缺失
 * 4. 分析路由中間件配置
 * 5. 生成詳細的診斷報告
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

class IntelligentRoutingDiagnostics {
    constructor() {
        this.serverPath = path.join(__dirname, 'server');
        this.routesPath = path.join(this.serverPath, 'routes', 'api');
        this.serverFile = path.join(this.serverPath, 'server.js');
        this.diagnosticResults = {
            timestamp: new Date().toISOString(),
            routeFiles: [],
            serverConfig: {},
            issues: [],
            warnings: [],
            suggestions: [],
            summary: {}
        };
    }

    /**
     * 執行完整的路由診斷
     */
    async runCompleteDiagnostics() {
        console.log('🔍 開始智慧路由診斷...');
        console.log('======================================');

        try {
            // 階段 1: 檢查路由文件存在性
            await this.checkRouteFilesExistence();
            
            // 階段 2: 分析server.js路由配置
            await this.analyzeServerRouteConfig();
            
            // 階段 3: 逐個檢查路由文件語法
            await this.validateRouteFileSyntax();
            
            // 階段 4: 檢查路由導出格式
            await this.validateRouteExports();
            
            // 階段 5: 檢查依賴模組
            await this.checkRouteDependencies();
            
            // 階段 6: 檢查中間件配置
            await this.validateMiddlewareConfiguration();
            
            // 階段 7: 生成診斷總結
            await this.generateDiagnosticSummary();
            
            // 階段 8: 保存診斷報告
            await this.saveDiagnosticReport();
            
            return this.diagnosticResults;
            
        } catch (error) {
            console.error('❌ 診斷過程中發生錯誤:', error.message);
            this.diagnosticResults.issues.push({
                type: 'DIAGNOSTIC_ERROR',
                severity: 'CRITICAL',
                message: `診斷過程發生錯誤: ${error.message}`,
                location: 'diagnostic-system',
                timestamp: new Date().toISOString()
            });
            return this.diagnosticResults;
        }
    }

    /**
     * 檢查路由文件存在性
     */
    async checkRouteFilesExistence() {
        console.log('📁 檢查路由文件存在性...');
        
        const expectedRoutes = [
            'admin.js', 'alerts.js', 'attendance.js', 'auth.js', 'auth-production.js',
            'employees.js', 'maintenance.js', 'monitoring.js', 'orders.js', 
            'promotion.js', 'revenue.js', 'schedule.js'
        ];

        try {
            const files = await fs.readdir(this.routesPath);
            const jsFiles = files.filter(file => file.endsWith('.js'));
            
            this.diagnosticResults.routeFiles = jsFiles.map(file => ({
                filename: file,
                exists: true,
                path: path.join(this.routesPath, file),
                expected: expectedRoutes.includes(file)
            }));

            // 檢查缺失的預期文件
            const missingFiles = expectedRoutes.filter(expected => !jsFiles.includes(expected));
            missingFiles.forEach(missing => {
                this.diagnosticResults.issues.push({
                    type: 'MISSING_ROUTE_FILE',
                    severity: 'HIGH',
                    message: `缺失預期的路由文件: ${missing}`,
                    location: this.routesPath,
                    timestamp: new Date().toISOString()
                });
            });

            // 檢查意外的文件
            const unexpectedFiles = jsFiles.filter(file => !expectedRoutes.includes(file));
            unexpectedFiles.forEach(unexpected => {
                this.diagnosticResults.warnings.push({
                    type: 'UNEXPECTED_ROUTE_FILE',
                    severity: 'LOW',
                    message: `發現意外的路由文件: ${unexpected}`,
                    location: path.join(this.routesPath, unexpected),
                    timestamp: new Date().toISOString()
                });
            });

            console.log(`✅ 發現 ${jsFiles.length} 個路由文件`);
            console.log(`❌ 缺失 ${missingFiles.length} 個預期文件`);
            console.log(`⚠️  發現 ${unexpectedFiles.length} 個意外文件`);
            
        } catch (error) {
            this.diagnosticResults.issues.push({
                type: 'ROUTE_DIRECTORY_ERROR',
                severity: 'CRITICAL',
                message: `無法讀取路由目錄: ${error.message}`,
                location: this.routesPath,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * 分析server.js路由配置
     */
    async analyzeServerRouteConfig() {
        console.log('⚙️  分析server.js路由配置...');
        
        try {
            const serverContent = await fs.readFile(this.serverFile, 'utf8');
            const lines = serverContent.split('\n');
            
            // 查找路由導入
            const imports = [];
            const routeUsages = [];
            
            lines.forEach((line, index) => {
                // 檢查require語句
                const importMatch = line.match(/const\s+(\w+Routes?)\s*=\s*require\(['"]([^'"]+)['"]\)/);
                if (importMatch) {
                    imports.push({
                        variable: importMatch[1],
                        path: importMatch[2],
                        line: index + 1,
                        content: line.trim()
                    });
                }
                
                // 檢查路由使用
                const usageMatch = line.match(/this\.app\.use\(['"]([^'"]+)['"],\s*(\w+)\)/);
                if (usageMatch) {
                    routeUsages.push({
                        path: usageMatch[1],
                        variable: usageMatch[2],
                        line: index + 1,
                        content: line.trim()
                    });
                }
            });
            
            this.diagnosticResults.serverConfig = {
                imports: imports,
                routeUsages: routeUsages,
                totalImports: imports.length,
                totalUsages: routeUsages.length
            };
            
            // 檢查導入和使用的匹配
            const importVariables = new Set(imports.map(imp => imp.variable));
            const usageVariables = new Set(routeUsages.map(usage => usage.variable));
            
            // 未使用的導入
            const unusedImports = [...importVariables].filter(v => !usageVariables.has(v));
            unusedImports.forEach(unused => {
                this.diagnosticResults.warnings.push({
                    type: 'UNUSED_ROUTE_IMPORT',
                    severity: 'MEDIUM',
                    message: `導入了但未使用的路由變數: ${unused}`,
                    location: 'server.js',
                    timestamp: new Date().toISOString()
                });
            });
            
            // 使用了但未導入的變數
            const missingImports = [...usageVariables].filter(v => !importVariables.has(v));
            missingImports.forEach(missing => {
                this.diagnosticResults.issues.push({
                    type: 'MISSING_ROUTE_IMPORT',
                    severity: 'HIGH',
                    message: `使用了但未導入的路由變數: ${missing}`,
                    location: 'server.js',
                    timestamp: new Date().toISOString()
                });
            });
            
            console.log(`✅ 發現 ${imports.length} 個路由導入`);
            console.log(`✅ 發現 ${routeUsages.length} 個路由使用`);
            console.log(`⚠️  ${unusedImports.length} 個未使用導入`);
            console.log(`❌ ${missingImports.length} 個缺失導入`);
            
        } catch (error) {
            this.diagnosticResults.issues.push({
                type: 'SERVER_CONFIG_ERROR',
                severity: 'CRITICAL',
                message: `無法分析server.js: ${error.message}`,
                location: this.serverFile,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * 驗證路由文件語法
     */
    async validateRouteFileSyntax() {
        console.log('🔍 驗證路由文件語法...');
        
        for (const routeFile of this.diagnosticResults.routeFiles) {
            if (!routeFile.exists) continue;
            
            try {
                const content = await fs.readFile(routeFile.path, 'utf8');
                
                // 基本語法檢查
                const syntaxIssues = this.checkBasicSyntax(content, routeFile.filename);
                routeFile.syntaxIssues = syntaxIssues;
                
                // 嘗試使用Node.js檢查語法
                const nodeValidation = await this.validateWithNode(routeFile.path);
                routeFile.nodeValidation = nodeValidation;
                
                // 如果有語法錯誤，加入到問題列表
                if (syntaxIssues.length > 0 || !nodeValidation.valid) {
                    this.diagnosticResults.issues.push({
                        type: 'SYNTAX_ERROR',
                        severity: 'HIGH',
                        message: `路由文件語法錯誤: ${routeFile.filename}`,
                        details: {
                            syntaxIssues: syntaxIssues,
                            nodeValidation: nodeValidation
                        },
                        location: routeFile.path,
                        timestamp: new Date().toISOString()
                    });
                }
                
                console.log(`  ✅ ${routeFile.filename}: ${syntaxIssues.length === 0 && nodeValidation.valid ? '語法正確' : '發現問題'}`);
                
            } catch (error) {
                this.diagnosticResults.issues.push({
                    type: 'FILE_READ_ERROR',
                    severity: 'HIGH',
                    message: `無法讀取路由文件: ${routeFile.filename} - ${error.message}`,
                    location: routeFile.path,
                    timestamp: new Date().toISOString()
                });
            }
        }
    }

    /**
     * 基本語法檢查
     */
    checkBasicSyntax(content, filename) {
        const issues = [];
        const lines = content.split('\n');
        
        // 檢查括號平衡
        let parenthesesCount = 0;
        let braceCount = 0;
        let bracketCount = 0;
        
        lines.forEach((line, index) => {
            // 統計括號
            for (let char of line) {
                switch (char) {
                    case '(': parenthesesCount++; break;
                    case ')': parenthesesCount--; break;
                    case '{': braceCount++; break;
                    case '}': braceCount--; break;
                    case '[': bracketCount++; break;
                    case ']': bracketCount--; break;
                }
            }
            
            // 檢查常見錯誤模式
            if (line.includes('require(') && !line.includes(');') && !line.includes(',')) {
                issues.push({
                    line: index + 1,
                    type: 'INCOMPLETE_REQUIRE',
                    message: 'require語句可能不完整',
                    content: line.trim()
                });
            }
            
            if (line.includes('router.') && !line.includes(';') && line.trim().endsWith(')')) {
                issues.push({
                    line: index + 1,
                    type: 'MISSING_SEMICOLON',
                    message: '可能缺少分號',
                    content: line.trim()
                });
            }
        });
        
        // 檢查括號不平衡
        if (parenthesesCount !== 0) {
            issues.push({
                type: 'UNBALANCED_PARENTHESES',
                message: `括號不平衡: ${parenthesesCount > 0 ? '缺少' : '多餘'} ${Math.abs(parenthesesCount)} 個右括號`
            });
        }
        
        if (braceCount !== 0) {
            issues.push({
                type: 'UNBALANCED_BRACES',
                message: `大括號不平衡: ${braceCount > 0 ? '缺少' : '多餘'} ${Math.abs(braceCount)} 個右大括號`
            });
        }
        
        return issues;
    }

    /**
     * 使用Node.js驗證語法
     */
    validateWithNode(filePath) {
        return new Promise((resolve) => {
            const child = spawn('node', ['--check', filePath]);
            let stderr = '';
            
            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            
            child.on('close', (code) => {
                resolve({
                    valid: code === 0,
                    error: stderr.trim(),
                    exitCode: code
                });
            });
            
            child.on('error', (error) => {
                resolve({
                    valid: false,
                    error: error.message,
                    exitCode: -1
                });
            });
        });
    }

    /**
     * 驗證路由導出格式
     */
    async validateRouteExports() {
        console.log('📤 驗證路由導出格式...');
        
        for (const routeFile of this.diagnosticResults.routeFiles) {
            if (!routeFile.exists) continue;
            
            try {
                const content = await fs.readFile(routeFile.path, 'utf8');
                
                // 檢查是否有module.exports
                const hasModuleExports = content.includes('module.exports');
                const hasRouterExport = content.match(/module\.exports\s*=\s*router/);
                const hasExpressRouter = content.includes('express.Router()');
                
                routeFile.exportAnalysis = {
                    hasModuleExports,
                    hasRouterExport: !!hasRouterExport,
                    hasExpressRouter,
                    valid: hasModuleExports && hasRouterExport && hasExpressRouter
                };
                
                if (!routeFile.exportAnalysis.valid) {
                    const issues = [];
                    
                    if (!hasExpressRouter) {
                        issues.push('缺少 express.Router() 初始化');
                    }
                    if (!hasModuleExports) {
                        issues.push('缺少 module.exports');
                    }
                    if (!hasRouterExport) {
                        issues.push('未正確導出router對象');
                    }
                    
                    this.diagnosticResults.issues.push({
                        type: 'INVALID_EXPORT_FORMAT',
                        severity: 'HIGH',
                        message: `路由導出格式錯誤: ${routeFile.filename}`,
                        details: issues,
                        location: routeFile.path,
                        timestamp: new Date().toISOString()
                    });
                }
                
                console.log(`  ${routeFile.exportAnalysis.valid ? '✅' : '❌'} ${routeFile.filename}: 導出格式${routeFile.exportAnalysis.valid ? '正確' : '錯誤'}`);
                
            } catch (error) {
                this.diagnosticResults.issues.push({
                    type: 'EXPORT_VALIDATION_ERROR',
                    severity: 'MEDIUM',
                    message: `無法驗證導出格式: ${routeFile.filename} - ${error.message}`,
                    location: routeFile.path,
                    timestamp: new Date().toISOString()
                });
            }
        }
    }

    /**
     * 檢查路由依賴模組
     */
    async checkRouteDependencies() {
        console.log('📦 檢查路由依賴模組...');
        
        const commonDependencies = [
            'express', '../../models', '../../utils/logger', 
            '../../utils/responseHelper', '../../services/notificationService',
            '../../middleware/auth'
        ];
        
        for (const routeFile of this.diagnosticResults.routeFiles) {
            if (!routeFile.exists) continue;
            
            try {
                const content = await fs.readFile(routeFile.path, 'utf8');
                const requires = content.match(/require\(['"]([^'"]+)['"]\)/g) || [];
                
                routeFile.dependencies = requires.map(req => {
                    const match = req.match(/require\(['"]([^'"]+)['"]\)/);
                    return match ? match[1] : req;
                });
                
                // 檢查缺失的常見依賴
                const missingCommonDeps = commonDependencies.filter(dep => {
                    return !routeFile.dependencies.some(fileDep => 
                        fileDep.includes(dep) || dep.includes(fileDep)
                    );
                });
                
                // 某些依賴可能不是所有文件都需要，所以只是警告
                if (missingCommonDeps.length > 0) {
                    this.diagnosticResults.warnings.push({
                        type: 'MISSING_COMMON_DEPENDENCIES',
                        severity: 'LOW',
                        message: `${routeFile.filename} 可能缺少常見依賴`,
                        details: missingCommonDeps,
                        location: routeFile.path,
                        timestamp: new Date().toISOString()
                    });
                }
                
                console.log(`  ✅ ${routeFile.filename}: ${routeFile.dependencies.length} 個依賴`);
                
            } catch (error) {
                this.diagnosticResults.issues.push({
                    type: 'DEPENDENCY_CHECK_ERROR',
                    severity: 'MEDIUM',
                    message: `無法檢查依賴: ${routeFile.filename} - ${error.message}`,
                    location: routeFile.path,
                    timestamp: new Date().toISOString()
                });
            }
        }
    }

    /**
     * 驗證中間件配置
     */
    async validateMiddlewareConfiguration() {
        console.log('🛡️  驗證中間件配置...');
        
        for (const routeFile of this.diagnosticResults.routeFiles) {
            if (!routeFile.exists) continue;
            
            try {
                const content = await fs.readFile(routeFile.path, 'utf8');
                
                // 檢查認證中間件使用
                const hasAuthMiddleware = content.includes('authMiddleware') || content.includes('auth');
                const routeEndpoints = (content.match(/router\.(get|post|put|delete|patch)/g) || []).length;
                
                routeFile.middlewareAnalysis = {
                    hasAuthMiddleware,
                    routeEndpoints,
                    authProtectedRoutes: (content.match(/authMiddleware[^,)]*[,)]/g) || []).length
                };
                
                // 如果有路由但沒有認證中間件，可能需要注意
                if (routeEndpoints > 0 && !hasAuthMiddleware && !routeFile.filename.includes('auth')) {
                    this.diagnosticResults.warnings.push({
                        type: 'NO_AUTH_MIDDLEWARE',
                        severity: 'MEDIUM',
                        message: `${routeFile.filename} 有 ${routeEndpoints} 個端點但沒有使用認證中間件`,
                        location: routeFile.path,
                        timestamp: new Date().toISOString()
                    });
                }
                
                console.log(`  ✅ ${routeFile.filename}: ${routeEndpoints} 個端點, ${hasAuthMiddleware ? '有' : '無'}認證中間件`);
                
            } catch (error) {
                this.diagnosticResults.issues.push({
                    type: 'MIDDLEWARE_VALIDATION_ERROR',
                    severity: 'MEDIUM',
                    message: `無法驗證中間件: ${routeFile.filename} - ${error.message}`,
                    location: routeFile.path,
                    timestamp: new Date().toISOString()
                });
            }
        }
    }

    /**
     * 生成診斷總結
     */
    async generateDiagnosticSummary() {
        console.log('📊 生成診斷總結...');
        
        const totalIssues = this.diagnosticResults.issues.length;
        const totalWarnings = this.diagnosticResults.warnings.length;
        const totalFiles = this.diagnosticResults.routeFiles.length;
        
        // 按嚴重程度統計問題
        const issuesBySeverity = this.diagnosticResults.issues.reduce((acc, issue) => {
            acc[issue.severity] = (acc[issue.severity] || 0) + 1;
            return acc;
        }, {});
        
        // 按類型統計問題
        const issuesByType = this.diagnosticResults.issues.reduce((acc, issue) => {
            acc[issue.type] = (acc[issue.type] || 0) + 1;
            return acc;
        }, {});
        
        this.diagnosticResults.summary = {
            totalFiles,
            totalIssues,
            totalWarnings,
            issuesBySeverity,
            issuesByType,
            healthScore: this.calculateHealthScore(),
            recommendations: this.generateRecommendations()
        };
        
        console.log(`📊 診斷完成:`);
        console.log(`   - 總文件數: ${totalFiles}`);
        console.log(`   - 嚴重問題: ${totalIssues}`);
        console.log(`   - 警告: ${totalWarnings}`);
        console.log(`   - 健康度評分: ${this.diagnosticResults.summary.healthScore}/100`);
    }

    /**
     * 計算健康度評分
     */
    calculateHealthScore() {
        let score = 100;
        
        // 根據問題嚴重程度扣分
        this.diagnosticResults.issues.forEach(issue => {
            switch (issue.severity) {
                case 'CRITICAL': score -= 20; break;
                case 'HIGH': score -= 10; break;
                case 'MEDIUM': score -= 5; break;
                case 'LOW': score -= 2; break;
            }
        });
        
        // 根據警告扣分
        score -= this.diagnosticResults.warnings.length * 1;
        
        return Math.max(0, score);
    }

    /**
     * 生成修復建議
     */
    generateRecommendations() {
        const recommendations = [];
        
        // 基於發現的問題生成建議
        this.diagnosticResults.issues.forEach(issue => {
            switch (issue.type) {
                case 'MISSING_ROUTE_FILE':
                    recommendations.push(`創建缺失的路由文件: ${issue.message.split(': ')[1]}`);
                    break;
                case 'SYNTAX_ERROR':
                    recommendations.push(`修復語法錯誤: ${issue.location}`);
                    break;
                case 'INVALID_EXPORT_FORMAT':
                    recommendations.push(`修正路由導出格式: ${issue.location}`);
                    break;
                case 'MISSING_ROUTE_IMPORT':
                    recommendations.push(`在server.js中添加缺失的路由導入`);
                    break;
            }
        });
        
        // 一般性建議
        if (this.diagnosticResults.summary.healthScore < 80) {
            recommendations.push('建議執行自動修復工具');
            recommendations.push('檢查並更新所有路由文件的標準格式');
        }
        
        return [...new Set(recommendations)]; // 去重
    }

    /**
     * 保存診斷報告
     */
    async saveDiagnosticReport() {
        console.log('💾 保存診斷報告...');
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportPath = path.join(__dirname, `routing-diagnostics-report-${timestamp}.json`);
        const summaryPath = path.join(__dirname, `routing-diagnostics-summary-${timestamp}.md`);
        
        try {
            // 保存JSON報告
            await fs.writeFile(reportPath, JSON.stringify(this.diagnosticResults, null, 2), 'utf8');
            
            // 生成Markdown總結
            const markdownSummary = this.generateMarkdownSummary();
            await fs.writeFile(summaryPath, markdownSummary, 'utf8');
            
            console.log(`✅ 報告已保存:`);
            console.log(`   - 詳細報告: ${reportPath}`);
            console.log(`   - 總結報告: ${summaryPath}`);
            
        } catch (error) {
            console.error(`❌ 保存報告失敗: ${error.message}`);
        }
    }

    /**
     * 生成Markdown總結
     */
    generateMarkdownSummary() {
        const { summary, issues, warnings } = this.diagnosticResults;
        
        return `# 智慧路由診斷報告

## 📊 診斷總結

- **總文件數**: ${summary.totalFiles}
- **嚴重問題**: ${summary.totalIssues}
- **警告**: ${summary.totalWarnings}
- **健康度評分**: ${summary.healthScore}/100

## 🔍 問題分析

### 按嚴重程度分布
${Object.entries(summary.issuesBySeverity).map(([severity, count]) => 
    `- **${severity}**: ${count} 個`
).join('\n')}

### 按問題類型分布
${Object.entries(summary.issuesByType).map(([type, count]) => 
    `- **${type}**: ${count} 個`
).join('\n')}

## ❌ 主要問題列表

${issues.slice(0, 10).map((issue, index) => 
    `### ${index + 1}. ${issue.type} (${issue.severity})
- **位置**: ${issue.location}
- **描述**: ${issue.message}
- **時間**: ${issue.timestamp}
`).join('\n')}

## ⚠️ 警告列表

${warnings.slice(0, 5).map((warning, index) => 
    `### ${index + 1}. ${warning.type} (${warning.severity})
- **位置**: ${warning.location}
- **描述**: ${warning.message}
`).join('\n')}

## 💡 修復建議

${summary.recommendations.map((rec, index) => 
    `${index + 1}. ${rec}`
).join('\n')}

## 📋 下一步行動

1. 執行智慧路由修復系統
2. 手動檢查高優先級問題
3. 運行路由端點驗證測試
4. 進行完整的瀏覽器驗證

---
*報告生成時間: ${this.diagnosticResults.timestamp}*
`;
    }

    /**
     * 執行快速診斷 (僅檢查關鍵問題)
     */
    async runQuickDiagnostics() {
        console.log('⚡ 執行快速路由診斷...');
        
        await this.checkRouteFilesExistence();
        await this.analyzeServerRouteConfig();
        
        const criticalIssues = this.diagnosticResults.issues.filter(
            issue => issue.severity === 'CRITICAL'
        );
        
        return {
            hasCriticalIssues: criticalIssues.length > 0,
            criticalIssues: criticalIssues,
            totalIssues: this.diagnosticResults.issues.length,
            healthScore: this.calculateHealthScore()
        };
    }
}

// 如果直接執行此文件，運行診斷
if (require.main === module) {
    const diagnostics = new IntelligentRoutingDiagnostics();
    
    diagnostics.runCompleteDiagnostics().then((results) => {
        console.log('\n🎉 診斷完成!');
        console.log(`健康度評分: ${results.summary.healthScore}/100`);
        console.log(`發現 ${results.issues.length} 個問題和 ${results.warnings.length} 個警告`);
        
        if (results.summary.healthScore < 80) {
            console.log('\n⚠️  建議執行修復工具來解決發現的問題');
        }
        
        process.exit(0);
    }).catch((error) => {
        console.error('❌ 診斷失敗:', error);
        process.exit(1);
    });
}

module.exports = IntelligentRoutingDiagnostics;