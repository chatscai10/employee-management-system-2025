#!/usr/bin/env node
/**
 * 🗄️ 資料庫模型關聯和約束深度分析
 * 分析資料庫結構完整性、關聯關係、約束條件和資料一致性問題
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

class DatabaseModelAnalyzer {
    constructor() {
        this.projectRoot = __dirname;
        this.databasePath = path.join(this.projectRoot, 'database.sqlite');
        this.modelsPath = path.join(this.projectRoot, 'server', 'models');
        // 檢查可能的資料庫位置
        const possibleDbPaths = [
            path.join(this.projectRoot, 'database.sqlite'),
            path.join(this.projectRoot, 'database', 'employee_management.db'),
            path.join(this.projectRoot, 'database.db'),
            path.join(this.projectRoot, 'employee_management.db')
        ];
        this.analysisResults = {
            tableStructure: [],
            relationships: [],
            constraints: [],
            dataIntegrity: [],
            modelFiles: [],
            missingRelations: [],
            recommendations: []
        };
    }

    /**
     * 執行資料庫模型分析
     */
    async executeDatabaseAnalysis() {
        console.log('🗄️ 開始資料庫模型關聯和約束分析...');
        console.log('='.repeat(70));

        try {
            // 1. 檢查資料庫文件是否存在
            await this.checkDatabaseFile();
            
            // 2. 分析資料表結構
            await this.analyzeTableStructure();
            
            // 3. 檢查模型文件
            await this.analyzeModelFiles();
            
            // 4. 分析關聯關係
            await this.analyzeRelationships();
            
            // 5. 檢查約束條件
            await this.analyzeConstraints();
            
            // 6. 驗證資料完整性
            await this.verifyDataIntegrity();
            
            // 7. 檢查遺漏的關聯
            await this.checkMissingRelations();
            
            // 8. 生成完整報告
            this.generateComprehensiveReport();
            
        } catch (error) {
            console.error('❌ 資料庫分析失敗:', error.message);
        }
    }

    /**
     * 檢查資料庫文件
     */
    async checkDatabaseFile() {
        console.log('\n🔍 檢查資料庫文件...');
        
        // 檢查可能的資料庫位置
        const possibleDbPaths = [
            path.join(this.projectRoot, 'database.sqlite'),
            path.join(this.projectRoot, 'database', 'employee_management.db'),
            path.join(this.projectRoot, 'database.db'),
            path.join(this.projectRoot, 'employee_management.db')
        ];
        
        let foundDb = false;
        for (const dbPath of possibleDbPaths) {
            if (fs.existsSync(dbPath)) {
                const stats = fs.statSync(dbPath);
                if (stats.size > 0) { // 確保文件不是空的
                    console.log(`  ✅ 找到資料庫文件: ${path.relative(this.projectRoot, dbPath)} (${(stats.size / 1024).toFixed(2)} KB)`);
                    this.databasePath = dbPath;
                    foundDb = true;
                    break;
                } else {
                    console.log(`  ⚠️ 資料庫文件為空: ${path.relative(this.projectRoot, dbPath)}`);
                }
            }
        }
        
        if (!foundDb) {
            console.log('  ❌ 資料庫文件不存在: database.sqlite');
            
            // 遞歸搜索資料庫文件
            const dbFiles = this.findDatabaseFiles(this.projectRoot);
            
            if (dbFiles.length > 0) {
                console.log(`  🔍 找到其他資料庫文件: ${dbFiles.map(f => path.relative(this.projectRoot, f)).join(', ')}`);
                this.databasePath = dbFiles[0];
            } else {
                console.log('  ❌ 專案中沒有找到任何資料庫文件');
                return;
            }
        }
        
        console.log(`  ✅ 資料庫文件存在: ${path.basename(this.databasePath)}`);
        
        // 檢查文件大小
        const stats = fs.statSync(this.databasePath);
        console.log(`  📊 文件大小: ${(stats.size / 1024).toFixed(2)} KB`);
    }

    /**
     * 遞歸搜索資料庫文件
     */
    findDatabaseFiles(dir) {
        const dbFiles = [];
        
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                
                if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
                    dbFiles.push(...this.findDatabaseFiles(fullPath));
                } else if (entry.isFile()) {
                    const ext = path.extname(entry.name).toLowerCase();
                    if (['.sqlite', '.db', '.sqlite3'].includes(ext)) {
                        dbFiles.push(fullPath);
                    }
                }
            }
        } catch (error) {
            // 忽略讀取錯誤
        }
        
        return dbFiles;
    }

    /**
     * 分析資料表結構
     */
    async analyzeTableStructure() {
        console.log('\n🔍 分析資料表結構...');
        
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(this.databasePath, (err) => {
                if (err) {
                    console.error('  ❌ 無法連接到資料庫:', err.message);
                    reject(err);
                    return;
                }
                
                // 獲取所有表
                db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
                    if (err) {
                        console.error('  ❌ 查詢表失敗:', err.message);
                        reject(err);
                        return;
                    }
                    
                    console.log(`  📊 找到 ${tables.length} 個資料表`);
                    
                    let processedTables = 0;
                    
                    tables.forEach(table => {
                        // 獲取每個表的結構
                        db.all(`PRAGMA table_info(${table.name})`, [], (err, columns) => {
                            if (err) {
                                console.error(`  ❌ 查詢表 ${table.name} 結構失敗:`, err.message);
                                processedTables++;
                                return;
                            }
                            
                            console.log(`\n  📋 表: ${table.name}`);
                            console.log(`    欄位數: ${columns.length}`);
                            
                            const tableInfo = {
                                name: table.name,
                                columns: columns.map(col => ({
                                    name: col.name,
                                    type: col.type,
                                    notNull: Boolean(col.notnull),
                                    defaultValue: col.dflt_value,
                                    primaryKey: Boolean(col.pk)
                                })),
                                primaryKeys: columns.filter(col => col.pk).map(col => col.name),
                                notNullColumns: columns.filter(col => col.notnull).map(col => col.name),
                                foreignKeys: []
                            };
                            
                            columns.forEach(col => {
                                console.log(`      ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
                            });
                            
                            // 查詢外鍵約束
                            db.all(`PRAGMA foreign_key_list(${table.name})`, [], (err, foreignKeys) => {
                                if (!err && foreignKeys.length > 0) {
                                    console.log(`    外鍵約束: ${foreignKeys.length} 個`);
                                    foreignKeys.forEach(fk => {
                                        console.log(`      ${fk.from} -> ${fk.table}.${fk.to}`);
                                        tableInfo.foreignKeys.push({
                                            from: fk.from,
                                            table: fk.table,
                                            to: fk.to
                                        });
                                    });
                                }
                                
                                this.analysisResults.tableStructure.push(tableInfo);
                                processedTables++;
                                
                                if (processedTables === tables.length) {
                                    db.close();
                                    resolve();
                                }
                            });
                        });
                    });
                });
            });
        });
    }

    /**
     * 分析模型文件
     */
    async analyzeModelFiles() {
        console.log('\n📂 分析模型文件...');
        
        if (!fs.existsSync(this.modelsPath)) {
            console.log('  ❌ 模型目錄不存在');
            return;
        }
        
        const modelFiles = fs.readdirSync(this.modelsPath)
            .filter(file => file.endsWith('.js') && file !== 'index.js');
            
        console.log(`  找到 ${modelFiles.length} 個模型文件`);
        
        for (const modelFile of modelFiles) {
            const filePath = path.join(this.modelsPath, modelFile);
            const content = fs.readFileSync(filePath, 'utf8');
            
            console.log(`\n  📄 分析 ${modelFile}:`);
            
            const modelInfo = {
                fileName: modelFile,
                modelName: path.basename(modelFile, '.js'),
                associations: this.extractAssociations(content),
                attributes: this.extractAttributes(content),
                validations: this.extractValidations(content),
                hooks: this.extractHooks(content)
            };
            
            console.log(`    關聯關係: ${modelInfo.associations.length} 個`);
            console.log(`    屬性定義: ${modelInfo.attributes.length} 個`);
            console.log(`    驗證規則: ${modelInfo.validations.length} 個`);
            console.log(`    鉤子函數: ${modelInfo.hooks.length} 個`);
            
            this.analysisResults.modelFiles.push(modelInfo);
        }
    }

    /**
     * 提取關聯關係
     */
    extractAssociations(content) {
        const associations = [];
        const associationPatterns = [
            /\.hasMany\s*\(\s*([^,)]+)/g,
            /\.belongsTo\s*\(\s*([^,)]+)/g,
            /\.hasOne\s*\(\s*([^,)]+)/g,
            /\.belongsToMany\s*\(\s*([^,)]+)/g
        ];
        
        associationPatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                associations.push({
                    type: match[0].split('.')[1].split('(')[0],
                    target: match[1].trim()
                });
            }
        });
        
        return associations;
    }

    /**
     * 提取屬性定義
     */
    extractAttributes(content) {
        const attributes = [];
        const lines = content.split('\n');
        
        let inAttributes = false;
        for (const line of lines) {
            if (line.includes('define(') || line.includes('DataTypes')) {
                inAttributes = true;
            }
            
            if (inAttributes && line.includes(':')) {
                const attr = line.trim().split(':')[0].replace(/['"]/g, '');
                if (attr && !attr.includes('//') && !attr.includes('*')) {
                    attributes.push(attr);
                }
            }
        }
        
        return attributes;
    }

    /**
     * 提取驗證規則
     */
    extractValidations(content) {
        const validations = [];
        const validationPattern = /validate:\s*\{([^}]+)\}/g;
        
        let match;
        while ((match = validationPattern.exec(content)) !== null) {
            validations.push(match[1].trim());
        }
        
        return validations;
    }

    /**
     * 提取鉤子函數
     */
    extractHooks(content) {
        const hooks = [];
        const hookPatterns = [
            /beforeCreate/g,
            /afterCreate/g,
            /beforeUpdate/g,
            /afterUpdate/g,
            /beforeDestroy/g,
            /afterDestroy/g
        ];
        
        hookPatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
                hooks.push(...matches);
            }
        });
        
        return hooks;
    }

    /**
     * 分析關聯關係
     */
    async analyzeRelationships() {
        console.log('\n🔗 分析模型關聯關係...');
        
        const relationships = new Map();
        
        this.analysisResults.modelFiles.forEach(modelFile => {
            modelFile.associations.forEach(assoc => {
                const key = `${modelFile.modelName}-${assoc.target}`;
                relationships.set(key, {
                    from: modelFile.modelName,
                    to: assoc.target,
                    type: assoc.type,
                    definedIn: modelFile.fileName
                });
            });
        });
        
        this.analysisResults.relationships = Array.from(relationships.values());
        
        console.log(`  📊 定義的關聯關係: ${this.analysisResults.relationships.length} 個`);
        
        this.analysisResults.relationships.forEach(rel => {
            console.log(`    ${rel.from} ${rel.type} ${rel.to}`);
        });
    }

    /**
     * 檢查約束條件
     */
    async analyzeConstraints() {
        console.log('\n🔒 分析約束條件...');
        
        const constraints = {
            primaryKeys: [],
            foreignKeys: [],
            uniqueConstraints: [],
            notNullConstraints: [],
            checkConstraints: []
        };
        
        this.analysisResults.tableStructure.forEach(table => {
            // 主鍵約束
            if (table.primaryKeys.length > 0) {
                constraints.primaryKeys.push({
                    table: table.name,
                    columns: table.primaryKeys
                });
            }
            
            // 外鍵約束
            if (table.foreignKeys.length > 0) {
                constraints.foreignKeys.push(...table.foreignKeys.map(fk => ({
                    table: table.name,
                    ...fk
                })));
            }
            
            // NOT NULL 約束
            constraints.notNullConstraints.push({
                table: table.name,
                columns: table.notNullColumns
            });
        });
        
        this.analysisResults.constraints = constraints;
        
        console.log(`  主鍵約束: ${constraints.primaryKeys.length} 個`);
        console.log(`  外鍵約束: ${constraints.foreignKeys.length} 個`);
        console.log(`  NOT NULL約束: ${constraints.notNullConstraints.reduce((sum, c) => sum + c.columns.length, 0)} 個欄位`);
    }

    /**
     * 驗證資料完整性
     */
    async verifyDataIntegrity() {
        console.log('\n✅ 驗證資料完整性...');
        
        return new Promise((resolve) => {
            const db = new sqlite3.Database(this.databasePath, (err) => {
                if (err) {
                    console.error('  ❌ 無法連接到資料庫:', err.message);
                    resolve();
                    return;
                }
                
                const integrityChecks = [];
                
                // 檢查每個表的記錄數
                this.analysisResults.tableStructure.forEach(table => {
                    db.get(`SELECT COUNT(*) as count FROM ${table.name}`, [], (err, result) => {
                        if (!err) {
                            console.log(`  📊 ${table.name}: ${result.count} 筆記錄`);
                            integrityChecks.push({
                                table: table.name,
                                recordCount: result.count,
                                status: 'ok'
                            });
                        } else {
                            console.log(`  ❌ ${table.name}: 查詢失敗 - ${err.message}`);
                            integrityChecks.push({
                                table: table.name,
                                recordCount: 0,
                                status: 'error',
                                error: err.message
                            });
                        }
                        
                        if (integrityChecks.length === this.analysisResults.tableStructure.length) {
                            this.analysisResults.dataIntegrity = integrityChecks;
                            db.close();
                            resolve();
                        }
                    });
                });
            });
        });
    }

    /**
     * 檢查遺漏的關聯
     */
    async checkMissingRelations() {
        console.log('\n❌ 檢查遺漏的關聯關係...');
        
        const missingRelations = [];
        
        // 預期的關聯關係
        const expectedRelations = [
            { from: 'Employee', to: 'Store', type: 'belongsTo' },
            { from: 'Store', to: 'Employee', type: 'hasMany' },
            { from: 'Employee', to: 'AttendanceRecord', type: 'hasMany' },
            { from: 'AttendanceRecord', to: 'Employee', type: 'belongsTo' },
            { from: 'Employee', to: 'RevenueRecord', type: 'hasMany' },
            { from: 'RevenueRecord', to: 'Employee', type: 'belongsTo' },
            { from: 'Store', to: 'AttendanceRecord', type: 'hasMany' },
            { from: 'AttendanceRecord', to: 'Store', type: 'belongsTo' },
            { from: 'Store', to: 'RevenueRecord', type: 'hasMany' },
            { from: 'RevenueRecord', to: 'Store', type: 'belongsTo' }
        ];
        
        expectedRelations.forEach(expected => {
            const exists = this.analysisResults.relationships.some(rel => 
                rel.from === expected.from && 
                rel.to === expected.to && 
                rel.type === expected.type
            );
            
            if (!exists) {
                console.log(`  ❌ 缺少關聯: ${expected.from} ${expected.type} ${expected.to}`);
                missingRelations.push(expected);
            } else {
                console.log(`  ✅ 存在關聯: ${expected.from} ${expected.type} ${expected.to}`);
            }
        });
        
        this.analysisResults.missingRelations = missingRelations;
    }

    /**
     * 生成完整報告
     */
    generateComprehensiveReport() {
        console.log('\n📊 資料庫模型分析報告:');
        console.log('='.repeat(70));
        
        // 資料表結構統計
        console.log('\n🗄️ 資料表結構:');
        console.log(`  資料表總數: ${this.analysisResults.tableStructure.length}`);
        
        let totalColumns = 0;
        this.analysisResults.tableStructure.forEach(table => {
            totalColumns += table.columns.length;
            console.log(`    ${table.name}: ${table.columns.length} 個欄位`);
        });
        console.log(`  欄位總數: ${totalColumns}`);
        
        // 模型文件統計
        console.log('\n📂 模型文件:');
        console.log(`  模型文件總數: ${this.analysisResults.modelFiles.length}`);
        
        let totalAssociations = 0;
        this.analysisResults.modelFiles.forEach(model => {
            totalAssociations += model.associations.length;
            console.log(`    ${model.modelName}: ${model.associations.length} 個關聯`);
        });
        console.log(`  關聯定義總數: ${totalAssociations}`);
        
        // 約束條件統計
        console.log('\n🔒 約束條件:');
        console.log(`  主鍵約束: ${this.analysisResults.constraints.primaryKeys.length}`);
        console.log(`  外鍵約束: ${this.analysisResults.constraints.foreignKeys.length}`);
        console.log(`  NOT NULL約束: ${this.analysisResults.constraints.notNullConstraints.reduce((sum, c) => sum + c.columns.length, 0)} 個欄位`);
        
        // 資料完整性
        console.log('\n✅ 資料完整性:');
        let totalRecords = 0;
        let healthyTables = 0;
        
        this.analysisResults.dataIntegrity.forEach(integrity => {
            totalRecords += integrity.recordCount;
            if (integrity.status === 'ok') healthyTables++;
            console.log(`    ${integrity.table}: ${integrity.recordCount} 筆記錄 (${integrity.status})`);
        });
        
        console.log(`  總記錄數: ${totalRecords}`);
        console.log(`  健康表數: ${healthyTables}/${this.analysisResults.dataIntegrity.length}`);
        
        // 遺漏的關聯
        console.log('\n❌ 遺漏的關聯關係:');
        if (this.analysisResults.missingRelations.length === 0) {
            console.log('  🎉 所有預期的關聯關係都已定義！');
        } else {
            this.analysisResults.missingRelations.forEach(missing => {
                console.log(`    ${missing.from} ${missing.type} ${missing.to}`);
            });
        }
        
        // 改善建議
        this.generateRecommendations();
        
        console.log('\n✅ 資料庫模型分析完成');
    }

    /**
     * 生成改善建議
     */
    generateRecommendations() {
        console.log('\n💡 資料庫改善建議:');
        
        const recommendations = [];
        
        if (this.analysisResults.missingRelations.length > 0) {
            recommendations.push('🔗 [高優先級] 補充缺失的模型關聯關係');
        }
        
        if (this.analysisResults.constraints.foreignKeys.length === 0) {
            recommendations.push('🔒 [高優先級] 添加外鍵約束確保資料完整性');
        }
        
        const tablesWithoutPrimaryKey = this.analysisResults.tableStructure.filter(table => 
            table.primaryKeys.length === 0
        );
        
        if (tablesWithoutPrimaryKey.length > 0) {
            recommendations.push('🔑 [高優先級] 為所有表添加主鍵');
        }
        
        recommendations.push('📊 [中優先級] 添加索引提高查詢效能');
        recommendations.push('🔍 [中優先級] 實施資料驗證規則');
        recommendations.push('📚 [中優先級] 完善模型文檔和註釋');
        recommendations.push('🧪 [低優先級] 建立資料庫測試套件');
        recommendations.push('⚡ [低優先級] 優化資料庫查詢效能');
        
        recommendations.forEach((rec, index) => {
            console.log(`  ${index + 1}. ${rec}`);
        });
        
        this.analysisResults.recommendations = recommendations;
    }

    /**
     * 導出分析結果
     */
    exportAnalysisResults() {
        const reportFile = path.join(this.projectRoot, 'database-model-analysis-report.json');
        
        try {
            fs.writeFileSync(reportFile, JSON.stringify(this.analysisResults, null, 2));
            console.log(`\n📄 資料庫分析報告已導出: database-model-analysis-report.json`);
            return reportFile;
        } catch (error) {
            console.error('❌ 導出分析報告失敗:', error.message);
            return null;
        }
    }
}

// 執行分析
async function main() {
    const analyzer = new DatabaseModelAnalyzer();
    await analyzer.executeDatabaseAnalysis();
    analyzer.exportAnalysisResults();
}

if (require.main === module) {
    main();
}

module.exports = DatabaseModelAnalyzer;