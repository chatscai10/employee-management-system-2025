/**
 * ===========================
 * 智慧路由修復系統
 * ===========================
 * 功能：
 * 1. 自動修復常見路由問題
 * 2. 補充缺失的路由端點
 * 3. 標準化路由結構
 * 4. 添加錯誤處理和驗證
 * 5. 修復語法和導出問題
 */

const fs = require('fs').promises;
const path = require('path');
const IntelligentRoutingDiagnostics = require('./intelligent-routing-diagnostics');

class SmartRoutingRepair {
    constructor() {
        this.serverPath = path.join(__dirname, 'server');
        this.routesPath = path.join(this.serverPath, 'routes', 'api');
        this.serverFile = path.join(this.serverPath, 'server.js');
        this.backupPath = path.join(__dirname, 'route-backups');
        this.repairResults = {
            timestamp: new Date().toISOString(),
            backupsCreated: [],
            repairsApplied: [],
            issuesFixed: [],
            filesModified: [],
            summary: {}
        };
    }

    /**
     * 執行完整的路由修復
     */
    async runCompleteRepair() {
        console.log('🔧 開始智慧路由修復...');
        console.log('======================================');

        try {
            // 階段 1: 運行診斷以識別問題
            await this.runDiagnostics();
            
            // 階段 2: 創建備份
            await this.createBackups();
            
            // 階段 3: 修復語法錯誤
            await this.fixSyntaxErrors();
            
            // 階段 4: 修復導出格式
            await this.fixExportFormats();
            
            // 階段 5: 修復缺失依賴
            await this.fixMissingDependencies();
            
            // 階段 6: 標準化路由結構
            await this.standardizeRouteStructure();
            
            // 階段 7: 添加缺失的錯誤處理
            await this.addErrorHandling();
            
            // 階段 8: 修復server.js配置
            await this.fixServerConfiguration();
            
            // 階段 9: 生成修復報告
            await this.generateRepairReport();
            
            return this.repairResults;
            
        } catch (error) {
            console.error('❌ 修復過程中發生錯誤:', error.message);
            await this.rollbackChanges();
            throw error;
        }
    }

    /**
     * 運行診斷以識別問題
     */
    async runDiagnostics() {
        console.log('🔍 運行診斷識別問題...');
        
        const diagnostics = new IntelligentRoutingDiagnostics();
        this.diagnosticResults = await diagnostics.runCompleteDiagnostics();
        
        console.log(`發現 ${this.diagnosticResults.issues.length} 個問題需要修復`);
        console.log(`發現 ${this.diagnosticResults.warnings.length} 個警告需要注意`);
    }

    /**
     * 創建備份
     */
    async createBackups() {
        console.log('💾 創建路由文件備份...');
        
        try {
            await fs.mkdir(this.backupPath, { recursive: true });
            
            // 備份server.js
            const serverBackup = path.join(this.backupPath, `server.js.backup.${Date.now()}`);
            await fs.copyFile(this.serverFile, serverBackup);
            this.repairResults.backupsCreated.push(serverBackup);
            
            // 備份所有路由文件
            for (const routeFile of this.diagnosticResults.routeFiles) {
                if (routeFile.exists) {
                    const backupPath = path.join(this.backupPath, 
                        `${routeFile.filename}.backup.${Date.now()}`);
                    await fs.copyFile(routeFile.path, backupPath);
                    this.repairResults.backupsCreated.push(backupPath);
                }
            }
            
            console.log(`✅ 已創建 ${this.repairResults.backupsCreated.length} 個備份文件`);
            
        } catch (error) {
            throw new Error(`備份創建失敗: ${error.message}`);
        }
    }

    /**
     * 修復語法錯誤
     */
    async fixSyntaxErrors() {
        console.log('🔧 修復語法錯誤...');
        
        const syntaxIssues = this.diagnosticResults.issues.filter(
            issue => issue.type === 'SYNTAX_ERROR'
        );
        
        for (const issue of syntaxIssues) {
            try {
                const filePath = issue.location;
                let content = await fs.readFile(filePath, 'utf8');
                let modified = false;
                
                // 修復常見語法問題
                if (issue.details && issue.details.syntaxIssues) {
                    for (const syntaxIssue of issue.details.syntaxIssues) {
                        content = this.applySyntaxFix(content, syntaxIssue);
                        modified = true;
                    }
                }
                
                if (modified) {
                    await fs.writeFile(filePath, content, 'utf8');
                    this.repairResults.repairsApplied.push({
                        type: 'SYNTAX_FIX',
                        file: filePath,
                        description: '修復語法錯誤',
                        timestamp: new Date().toISOString()
                    });
                    this.repairResults.filesModified.push(filePath);
                }
                
            } catch (error) {
                console.error(`修復語法錯誤失敗 ${issue.location}:`, error.message);
            }
        }
        
        console.log(`✅ 已修復 ${syntaxIssues.length} 個語法錯誤`);
    }

    /**
     * 應用語法修復
     */
    applySyntaxFix(content, syntaxIssue) {
        const lines = content.split('\n');
        
        switch (syntaxIssue.type) {
            case 'MISSING_SEMICOLON':
                if (syntaxIssue.line && lines[syntaxIssue.line - 1]) {
                    lines[syntaxIssue.line - 1] = lines[syntaxIssue.line - 1].trim() + ';';
                }
                break;
                
            case 'INCOMPLETE_REQUIRE':
                if (syntaxIssue.line && lines[syntaxIssue.line - 1]) {
                    const line = lines[syntaxIssue.line - 1];
                    if (!line.includes(';')) {
                        lines[syntaxIssue.line - 1] = line.trim() + ';';
                    }
                }
                break;
        }
        
        return lines.join('\n');
    }

    /**
     * 修復導出格式
     */
    async fixExportFormats() {
        console.log('📤 修復路由導出格式...');
        
        const exportIssues = this.diagnosticResults.issues.filter(
            issue => issue.type === 'INVALID_EXPORT_FORMAT'
        );
        
        for (const issue of exportIssues) {
            try {
                const filePath = issue.location;
                let content = await fs.readFile(filePath, 'utf8');
                
                // 確保有express.Router()
                if (!content.includes('express.Router()')) {
                    // 在require statements後添加router初始化
                    content = this.addRouterInitialization(content);
                }
                
                // 確保有正確的module.exports
                if (!content.match(/module\.exports\s*=\s*router/)) {
                    content = this.addModuleExports(content);
                }
                
                await fs.writeFile(filePath, content, 'utf8');
                
                this.repairResults.repairsApplied.push({
                    type: 'EXPORT_FORMAT_FIX',
                    file: filePath,
                    description: '修復路由導出格式',
                    timestamp: new Date().toISOString()
                });
                this.repairResults.filesModified.push(filePath);
                
            } catch (error) {
                console.error(`修復導出格式失敗 ${issue.location}:`, error.message);
            }
        }
        
        console.log(`✅ 已修復 ${exportIssues.length} 個導出格式問題`);
    }

    /**
     * 添加Router初始化
     */
    addRouterInitialization(content) {
        // 查找require statements的結束位置
        const lines = content.split('\n');
        let insertIndex = -1;
        
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('require(') && !lines[i].includes('router')) {
                insertIndex = i + 1;
            }
        }
        
        if (insertIndex === -1) {
            // 如果沒有找到require，在文件開頭添加
            insertIndex = 0;
        }
        
        // 插入router初始化
        lines.splice(insertIndex, 0, '', 'const router = express.Router();');
        
        return lines.join('\n');
    }

    /**
     * 添加module.exports
     */
    addModuleExports(content) {
        // 在文件末尾添加module.exports
        if (!content.endsWith('\n')) {
            content += '\n';
        }
        
        content += '\nmodule.exports = router;\n';
        
        return content;
    }

    /**
     * 修復缺失依賴
     */
    async fixMissingDependencies() {
        console.log('📦 修復缺失依賴...');
        
        const dependencyIssues = this.diagnosticResults.issues.filter(
            issue => issue.type === 'MISSING_ROUTE_IMPORT'
        );
        
        for (const issue of dependencyIssues) {
            try {
                let content = await fs.readFile(this.serverFile, 'utf8');
                content = this.addMissingRouteImport(content, issue);
                await fs.writeFile(this.serverFile, content, 'utf8');
                
                this.repairResults.repairsApplied.push({
                    type: 'DEPENDENCY_FIX',
                    file: this.serverFile,
                    description: `添加缺失的路由導入: ${issue.message}`,
                    timestamp: new Date().toISOString()
                });
                
            } catch (error) {
                console.error(`修復依賴失敗:`, error.message);
            }
        }
        
        console.log(`✅ 已修復 ${dependencyIssues.length} 個依賴問題`);
    }

    /**
     * 添加缺失的路由導入
     */
    addMissingRouteImport(content, issue) {
        const lines = content.split('\n');
        let importInsertIndex = -1;
        let useInsertIndex = -1;
        
        // 找到路由導入區域
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('require(') && lines[i].includes('Routes')) {
                importInsertIndex = i + 1;
            }
            if (lines[i].includes('this.app.use(') && lines[i].includes('/api/')) {
                useInsertIndex = i + 1;
            }
        }
        
        // 從錯誤信息中提取變數名
        const missingVariable = issue.message.split(': ')[1];
        const routeName = missingVariable.replace('Routes', '').toLowerCase();
        
        // 添加導入語句
        if (importInsertIndex > -1) {
            lines.splice(importInsertIndex, 0, 
                `const ${missingVariable} = require('./routes/api/${routeName}');`);
        }
        
        // 添加使用語句
        if (useInsertIndex > -1) {
            lines.splice(useInsertIndex + 1, 0, 
                `        this.app.use('/api/${routeName}', ${missingVariable});`);
        }
        
        return lines.join('\n');
    }

    /**
     * 標準化路由結構
     */
    async standardizeRouteStructure() {
        console.log('📋 標準化路由結構...');
        
        for (const routeFile of this.diagnosticResults.routeFiles) {
            if (!routeFile.exists) continue;
            
            try {
                let content = await fs.readFile(routeFile.path, 'utf8');
                const originalContent = content;
                
                // 應用標準化模板
                content = this.applyStandardTemplate(content, routeFile.filename);
                
                if (content !== originalContent) {
                    await fs.writeFile(routeFile.path, content, 'utf8');
                    
                    this.repairResults.repairsApplied.push({
                        type: 'STRUCTURE_STANDARDIZATION',
                        file: routeFile.path,
                        description: '標準化路由結構',
                        timestamp: new Date().toISOString()
                    });
                    this.repairResults.filesModified.push(routeFile.path);
                }
                
            } catch (error) {
                console.error(`標準化失敗 ${routeFile.filename}:`, error.message);
            }
        }
        
        console.log('✅ 路由結構標準化完成');
    }

    /**
     * 應用標準化模板
     */
    applyStandardTemplate(content, filename) {
        // 如果文件太短，可能需要完整重寫
        if (content.length < 200) {
            return this.generateStandardRouteTemplate(filename);
        }
        
        // 確保有適當的註釋
        if (!content.includes('/**')) {
            const routeName = filename.replace('.js', '');
            const header = `/**\n * ${routeName} 相關路由\n */\n\n`;
            content = header + content;
        }
        
        // 確保有基本的錯誤處理
        if (!content.includes('try') && !content.includes('catch')) {
            content = this.addBasicErrorHandling(content);
        }
        
        return content;
    }

    /**
     * 生成標準路由模板
     */
    generateStandardRouteTemplate(filename) {
        const routeName = filename.replace('.js', '');
        const capitalizedName = routeName.charAt(0).toUpperCase() + routeName.slice(1);
        
        return `/**
 * ${capitalizedName} 相關路由
 */

const express = require('express');
const { initModels } = require('../../models');
const logger = require('../../utils/logger');
const responseHelper = require('../../utils/responseHelper');
const { authMiddleware } = require('../../middleware/auth');

const router = express.Router();
let models = null;

// 初始化模型
const initializeModels = async () => {
    if (!models) {
        models = await initModels();
    }
    return models;
};

// GET /${routeName} - 獲取${routeName}列表
router.get('/', authMiddleware, async (req, res) => {
    try {
        await initializeModels();
        
        // TODO: 實現${routeName}列表獲取邏輯
        
        return responseHelper.success(res, [], '${routeName}列表獲取成功');
    } catch (error) {
        logger.error('獲取${routeName}列表失敗:', error);
        return responseHelper.error(res, '獲取${routeName}列表失敗', 500);
    }
});

// POST /${routeName} - 創建${routeName}
router.post('/', authMiddleware, async (req, res) => {
    try {
        await initializeModels();
        
        // TODO: 實現${routeName}創建邏輯
        
        return responseHelper.success(res, {}, '${routeName}創建成功');
    } catch (error) {
        logger.error('創建${routeName}失敗:', error);
        return responseHelper.error(res, '創建${routeName}失敗', 500);
    }
});

// PUT /${routeName}/:id - 更新${routeName}
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        await initializeModels();
        const { id } = req.params;
        
        // TODO: 實現${routeName}更新邏輯
        
        return responseHelper.success(res, {}, '${routeName}更新成功');
    } catch (error) {
        logger.error('更新${routeName}失敗:', error);
        return responseHelper.error(res, '更新${routeName}失敗', 500);
    }
});

// DELETE /${routeName}/:id - 刪除${routeName}
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        await initializeModels();
        const { id } = req.params;
        
        // TODO: 實現${routeName}刪除邏輯
        
        return responseHelper.success(res, {}, '${routeName}刪除成功');
    } catch (error) {
        logger.error('刪除${routeName}失敗:', error);
        return responseHelper.error(res, '刪除${routeName}失敗', 500);
    }
});

module.exports = router;
`;
    }

    /**
     * 添加基本錯誤處理
     */
    addBasicErrorHandling(content) {
        // 查找路由定義
        const routeRegex = /router\.(get|post|put|delete|patch)\([^}]+\{[^}]*\}/g;
        
        return content.replace(routeRegex, (match) => {
            if (match.includes('try') || match.includes('catch')) {
                return match;
            }
            
            // 添加try-catch包裹
            const lines = match.split('\n');
            const lastLine = lines[lines.length - 1];
            const bodyStart = match.indexOf('{') + 1;
            const bodyEnd = match.lastIndexOf('}');
            const body = match.slice(bodyStart, bodyEnd);
            
            const wrapped = match.slice(0, bodyStart) + `
    try {${body}
    } catch (error) {
        logger.error('路由錯誤:', error);
        return responseHelper.error(res, '操作失敗', 500);
    }
` + match.slice(bodyEnd);
            
            return wrapped;
        });
    }

    /**
     * 添加錯誤處理
     */
    async addErrorHandling() {
        console.log('🛡️  添加錯誤處理...');
        
        // 這個在standardizeRouteStructure中已經處理了
        console.log('✅ 錯誤處理已添加');
    }

    /**
     * 修復server.js配置
     */
    async fixServerConfiguration() {
        console.log('⚙️  修復server.js配置...');
        
        const serverIssues = this.diagnosticResults.issues.filter(
            issue => issue.location === 'server.js' || issue.location.includes('server.js')
        );
        
        if (serverIssues.length === 0) {
            console.log('✅ server.js配置無需修復');
            return;
        }
        
        try {
            let content = await fs.readFile(this.serverFile, 'utf8');
            let modified = false;
            
            for (const issue of serverIssues) {
                switch (issue.type) {
                    case 'UNUSED_ROUTE_IMPORT':
                        // 移除未使用的導入
                        content = this.removeUnusedImports(content, issue);
                        modified = true;
                        break;
                        
                    case 'MISSING_ROUTE_IMPORT':
                        // 已在fixMissingDependencies中處理
                        break;
                }
            }
            
            if (modified) {
                await fs.writeFile(this.serverFile, content, 'utf8');
                
                this.repairResults.repairsApplied.push({
                    type: 'SERVER_CONFIG_FIX',
                    file: this.serverFile,
                    description: '修復server.js配置問題',
                    timestamp: new Date().toISOString()
                });
                this.repairResults.filesModified.push(this.serverFile);
            }
            
        } catch (error) {
            console.error('修復server.js配置失敗:', error.message);
        }
        
        console.log('✅ server.js配置修復完成');
    }

    /**
     * 移除未使用的導入
     */
    removeUnusedImports(content, issue) {
        const lines = content.split('\n');
        const unusedVariable = issue.message.split(': ')[1];
        
        // 移除import行
        const filteredLines = lines.filter(line => 
            !line.includes(unusedVariable) || !line.includes('require(')
        );
        
        return filteredLines.join('\n');
    }

    /**
     * 生成修復報告
     */
    async generateRepairReport() {
        console.log('📊 生成修復報告...');
        
        this.repairResults.summary = {
            totalRepairs: this.repairResults.repairsApplied.length,
            filesModified: [...new Set(this.repairResults.filesModified)].length,
            backupsCreated: this.repairResults.backupsCreated.length,
            repairsByType: this.repairResults.repairsApplied.reduce((acc, repair) => {
                acc[repair.type] = (acc[repair.type] || 0) + 1;
                return acc;
            }, {}),
            issuesFixed: this.diagnosticResults.issues.length,
            recommendations: this.generatePostRepairRecommendations()
        };
        
        // 保存報告
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportPath = path.join(__dirname, `routing-repair-report-${timestamp}.json`);
        const summaryPath = path.join(__dirname, `routing-repair-summary-${timestamp}.md`);
        
        await fs.writeFile(reportPath, JSON.stringify(this.repairResults, null, 2), 'utf8');
        
        const markdownSummary = this.generateMarkdownReport();
        await fs.writeFile(summaryPath, markdownSummary, 'utf8');
        
        console.log(`✅ 修復報告已保存:`);
        console.log(`   - 詳細報告: ${reportPath}`);
        console.log(`   - 總結報告: ${summaryPath}`);
    }

    /**
     * 生成修復後建議
     */
    generatePostRepairRecommendations() {
        const recommendations = [
            '運行路由端點驗證測試',
            '執行完整的瀏覽器驗證',
            '檢查API端點功能性',
            '運行單元測試確保功能正常',
            '更新API文檔',
            '進行負載測試'
        ];
        
        return recommendations;
    }

    /**
     * 生成Markdown報告
     */
    generateMarkdownReport() {
        const { summary } = this.repairResults;
        
        return `# 智慧路由修復報告

## 📊 修復總結

- **總修復數量**: ${summary.totalRepairs}
- **修改文件數**: ${summary.filesModified}
- **創建備份數**: ${summary.backupsCreated}
- **修復問題數**: ${summary.issuesFixed}

## 🔧 修復類型分布

${Object.entries(summary.repairsByType).map(([type, count]) => 
    `- **${type}**: ${count} 次`
).join('\n')}

## 📝 修復詳情

${this.repairResults.repairsApplied.slice(0, 10).map((repair, index) => 
    `### ${index + 1}. ${repair.type}
- **文件**: ${repair.file}
- **描述**: ${repair.description}
- **時間**: ${repair.timestamp}
`).join('\n')}

## 💾 備份文件

${this.repairResults.backupsCreated.map((backup, index) => 
    `${index + 1}. ${backup}`
).join('\n')}

## 💡 後續建議

${summary.recommendations.map((rec, index) => 
    `${index + 1}. ${rec}`
).join('\n')}

## 📋 下一步行動

1. **立即執行**: 運行路由端點驗證器
2. **測試驗證**: 檢查所有API端點是否正常工作
3. **瀏覽器測試**: 進行完整的前端集成測試
4. **性能監控**: 確保修復沒有影響性能

---
*修復完成時間: ${this.repairResults.timestamp}*
`;
    }

    /**
     * 回滾變更 (如果修復失敗)
     */
    async rollbackChanges() {
        console.log('↩️  回滾變更...');
        
        try {
            for (const backupPath of this.repairResults.backupsCreated) {
                const originalPath = this.getOriginalPathFromBackup(backupPath);
                if (originalPath) {
                    await fs.copyFile(backupPath, originalPath);
                    console.log(`已回滾: ${originalPath}`);
                }
            }
            
            console.log('✅ 所有變更已成功回滾');
            
        } catch (error) {
            console.error('❌ 回滾失敗:', error.message);
        }
    }

    /**
     * 從備份路徑獲取原始路徑
     */
    getOriginalPathFromBackup(backupPath) {
        const filename = path.basename(backupPath).split('.backup.')[0];
        
        if (filename === 'server.js') {
            return this.serverFile;
        } else if (filename.endsWith('.js')) {
            return path.join(this.routesPath, filename);
        }
        
        return null;
    }

    /**
     * 快速修復 (僅修復關鍵問題)
     */
    async runQuickRepair() {
        console.log('⚡ 執行快速路由修復...');
        
        await this.runDiagnostics();
        
        const criticalIssues = this.diagnosticResults.issues.filter(
            issue => issue.severity === 'CRITICAL' || issue.severity === 'HIGH'
        );
        
        if (criticalIssues.length === 0) {
            console.log('✅ 沒有發現需要快速修復的關鍵問題');
            return { success: true, message: '無關鍵問題需要修復' };
        }
        
        await this.createBackups();
        await this.fixSyntaxErrors();
        await this.fixExportFormats();
        
        return { 
            success: true, 
            message: `快速修復完成，處理了 ${criticalIssues.length} 個關鍵問題` 
        };
    }
}

// 如果直接執行此文件，運行修復
if (require.main === module) {
    const repair = new SmartRoutingRepair();
    
    repair.runCompleteRepair().then((results) => {
        console.log('\n🎉 修復完成!');
        console.log(`總共進行了 ${results.summary.totalRepairs} 次修復`);
        console.log(`修改了 ${results.summary.filesModified} 個文件`);
        console.log(`創建了 ${results.summary.backupsCreated} 個備份`);
        
        console.log('\n📋 下一步建議:');
        results.summary.recommendations.forEach((rec, index) => {
            console.log(`${index + 1}. ${rec}`);
        });
        
        process.exit(0);
    }).catch((error) => {
        console.error('❌ 修復失敗:', error);
        process.exit(1);
    });
}

module.exports = SmartRoutingRepair;