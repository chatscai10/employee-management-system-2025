#!/usr/bin/env node
/**
 * ⚡ 效能瓶頸分析和優化建議
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

class PerformanceAnalyzer {
    constructor() {
        this.projectRoot = __dirname;
        this.baseUrl = 'http://localhost:3000';
        this.performanceMetrics = {
            serverResponse: [],
            fileSize: [],
            codeComplexity: [],
            databaseQueries: []
        };
        this.optimizationSuggestions = [];
    }

    async measureServerResponseTime(endpoint, iterations = 5) {
        console.log(`\n🔍 測量端點響應時間: ${endpoint}`);
        const responseTimes = [];
        
        for (let i = 0; i < iterations; i++) {
            try {
                const startTime = Date.now();
                
                const response = await this.makeRequest(endpoint);
                const endTime = Date.now();
                const responseTime = endTime - startTime;
                
                responseTimes.push({
                    iteration: i + 1,
                    responseTime: responseTime,
                    statusCode: response.statusCode,
                    dataSize: response.data ? response.data.length : 0
                });
                
                console.log(`  第${i + 1}次: ${responseTime}ms (狀態: ${response.statusCode})`);
                
                // 間隔測試
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                console.error(`  第${i + 1}次測試失敗:`, error.message);
                responseTimes.push({
                    iteration: i + 1,
                    responseTime: null,
                    error: error.message
                });
            }
        }
        
        // 計算統計數據
        const validTimes = responseTimes.filter(r => r.responseTime !== null);
        if (validTimes.length > 0) {
            const times = validTimes.map(r => r.responseTime);
            const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
            const minTime = Math.min(...times);
            const maxTime = Math.max(...times);
            
            console.log(`  📊 統計: 平均 ${Math.round(avgTime)}ms | 最快 ${minTime}ms | 最慢 ${maxTime}ms`);
            
            const result = {
                endpoint,
                average: avgTime,
                minimum: minTime,
                maximum: maxTime,
                samples: validTimes.length,
                successRate: (validTimes.length / iterations) * 100
            };
            
            this.performanceMetrics.serverResponse.push(result);
            
            // 效能評估
            if (avgTime > 2000) {
                this.optimizationSuggestions.push({
                    type: 'Server Response',
                    severity: 'high',
                    endpoint: endpoint,
                    issue: `響應時間過慢 (${Math.round(avgTime)}ms)`,
                    suggestion: '考慮使用快取、資料庫查詢優化、或負載均衡'
                });
            } else if (avgTime > 500) {
                this.optimizationSuggestions.push({
                    type: 'Server Response',
                    severity: 'medium',
                    endpoint: endpoint,
                    issue: `響應時間較慢 (${Math.round(avgTime)}ms)`,
                    suggestion: '檢查資料庫查詢效率和伺服器資源使用'
                });
            }
            
            return result;
        }
        
        return null;
    }

    async makeRequest(endpoint) {
        return new Promise((resolve, reject) => {
            const url = new URL(endpoint, this.baseUrl);
            const options = {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname + url.search,
                method: 'GET',
                timeout: 5000
            };
            
            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: data
                    });
                });
            });
            
            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('請求超時'));
            });
            
            req.end();
        });
    }

    analyzeFileSize(filePath) {
        try {
            const stats = fs.statSync(filePath);
            const fileName = path.basename(filePath);
            const ext = path.extname(filePath);
            const sizeKB = Math.round(stats.size / 1024);
            
            console.log(`📄 ${fileName}: ${sizeKB}KB`);
            
            const result = {
                fileName,
                path: filePath,
                sizeKB: sizeKB,
                extension: ext
            };
            
            this.performanceMetrics.fileSize.push(result);
            
            // 大小評估
            let threshold = 100; // KB
            if (ext === '.html') threshold = 50;
            else if (ext === '.js') threshold = 200;
            else if (ext === '.css') threshold = 100;
            
            if (sizeKB > threshold) {
                this.optimizationSuggestions.push({
                    type: 'File Size',
                    severity: sizeKB > threshold * 2 ? 'high' : 'medium',
                    file: fileName,
                    issue: `檔案過大 (${sizeKB}KB, 建議 < ${threshold}KB)`,
                    suggestion: ext === '.js' ? '考慮代碼分割、壓縮、移除未使用代碼' : 
                               ext === '.html' ? '減少內嵌樣式和腳本、壓縮HTML' :
                               '檔案壓縮和優化'
                });
            }
            
            return result;
            
        } catch (error) {
            console.error(`❌ 分析文件失敗: ${filePath}`, error.message);
            return null;
        }
    }

    analyzeCodeComplexity(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const fileName = path.basename(filePath);
            
            // 簡化的複雜度分析
            const metrics = {
                fileName,
                lines: content.split('\n').length,
                functions: (content.match(/function\s+\w+|=>\s*{|function\s*\(/g) || []).length,
                conditionals: (content.match(/if\s*\(|else\s+if|switch\s*\(/g) || []).length,
                loops: (content.match(/for\s*\(|while\s*\(|\.forEach|\.map|\.filter/g) || []).length,
                asyncOperations: (content.match(/async\s+function|await\s+|\.then\(|\.catch\(/g) || []).length,
                complexity: 0
            };
            
            // 計算圈複雜度 (簡化版)
            metrics.complexity = 1 + metrics.conditionals + metrics.loops;
            
            console.log(`🔧 ${fileName}: ${metrics.complexity} (複雜度) | ${metrics.functions} 函數 | ${metrics.lines} 行`);
            
            this.performanceMetrics.codeComplexity.push(metrics);
            
            // 複雜度評估
            if (metrics.complexity > 20) {
                this.optimizationSuggestions.push({
                    type: 'Code Complexity',
                    severity: 'high',
                    file: fileName,
                    issue: `代碼複雜度過高 (${metrics.complexity})`,
                    suggestion: '考慮重構、拆分函數、減少嵌套層級'
                });
            } else if (metrics.complexity > 10) {
                this.optimizationSuggestions.push({
                    type: 'Code Complexity',
                    severity: 'medium',
                    file: fileName,
                    issue: `代碼複雜度較高 (${metrics.complexity})`,
                    suggestion: '考慮簡化邏輯、提取共用功能'
                });
            }
            
            // 檔案長度評估
            if (metrics.lines > 500) {
                this.optimizationSuggestions.push({
                    type: 'File Length',
                    severity: metrics.lines > 1000 ? 'high' : 'medium',
                    file: fileName,
                    issue: `檔案過長 (${metrics.lines} 行)`,
                    suggestion: '考慮拆分成多個模組'
                });
            }
            
            return metrics;
            
        } catch (error) {
            console.error(`❌ 分析代碼複雜度失敗: ${filePath}`, error.message);
            return null;
        }
    }

    analyzeAsyncOperations(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const fileName = path.basename(filePath);
            
            const patterns = {
                asyncFunctions: (content.match(/async\s+function/g) || []).length,
                awaits: (content.match(/await\s+/g) || []).length,
                promises: (content.match(/new\s+Promise|\.then\(|\.catch\(/g) || []).length,
                callbacks: (content.match(/\w+\s*\(\s*function\s*\(|\w+\s*\(\s*\(\s*\w+/g) || []).length,
                sequentialAwaits: (content.match(/await\s+[^;]*;\s*\n\s*await/g) || []).length
            };
            
            if (patterns.sequentialAwaits > 0) {
                this.optimizationSuggestions.push({
                    type: 'Async Performance',
                    severity: 'medium',
                    file: fileName,
                    issue: `發現 ${patterns.sequentialAwaits} 個連續 await 操作`,
                    suggestion: '考慮使用 Promise.all() 來並行執行異步操作'
                });
            }
            
            if (patterns.callbacks > patterns.asyncFunctions + patterns.promises) {
                this.optimizationSuggestions.push({
                    type: 'Code Modernization',
                    severity: 'low',
                    file: fileName,
                    issue: '使用過多回調函數',
                    suggestion: '考慮轉換為 async/await 或 Promise 模式'
                });
            }
            
            return patterns;
            
        } catch (error) {
            console.error(`❌ 分析異步操作失敗: ${filePath}`, error.message);
            return null;
        }
    }

    async runPerformanceAnalysis() {
        console.log('🚀 開始效能瓶頸分析...');
        console.log('='.repeat(60));
        
        try {
            // 1. 伺服器響應時間測試
            console.log('\n📈 伺服器響應時間分析:');
            const endpoints = [
                '/health',
                '/api/revenue/test',
                '/api/admin/stats',
                '/api/admin/stores'
            ];
            
            for (const endpoint of endpoints) {
                await this.measureServerResponseTime(endpoint);
                await new Promise(resolve => setTimeout(resolve, 300));
            }
            
            // 2. 檔案大小分析
            console.log('\n📊 檔案大小分析:');
            const htmlFiles = [
                'public/admin.html',
                'public/index.html',
                'public/login.html',
                'public/register.html'
            ];
            
            htmlFiles.forEach(file => {
                const filePath = path.join(this.projectRoot, file);
                if (fs.existsSync(filePath)) {
                    this.analyzeFileSize(filePath);
                }
            });
            
            // 3. 代碼複雜度分析
            console.log('\n🔧 代碼複雜度分析:');
            const jsFiles = [
                'server/server.js',
                'server/routes/api/auth.js',
                'server/routes/api/admin.js',
                'server/routes/api/attendance.js'
            ];
            
            jsFiles.forEach(file => {
                const filePath = path.join(this.projectRoot, file);
                if (fs.existsSync(filePath)) {
                    this.analyzeCodeComplexity(filePath);
                    this.analyzeAsyncOperations(filePath);
                }
            });
            
            this.generatePerformanceReport();
            
        } catch (error) {
            console.error('❌ 效能分析執行失敗:', error);
        }
    }

    generatePerformanceReport() {
        console.log('\n⚡ 效能分析綜合報告:');
        console.log('='.repeat(60));
        
        // 伺服器效能報告
        if (this.performanceMetrics.serverResponse.length > 0) {
            console.log('\n📈 伺服器響應時間總結:');
            this.performanceMetrics.serverResponse.forEach(metric => {
                const rating = metric.average < 100 ? '🟢 優秀' :
                              metric.average < 500 ? '🟡 良好' :
                              metric.average < 1000 ? '🟠 需改善' : '🔴 差';
                console.log(`  ${metric.endpoint}: ${Math.round(metric.average)}ms ${rating}`);
            });
        }
        
        // 檔案大小報告
        if (this.performanceMetrics.fileSize.length > 0) {
            console.log('\n📊 檔案大小總結:');
            const totalSize = this.performanceMetrics.fileSize.reduce((sum, file) => sum + file.sizeKB, 0);
            console.log(`  總大小: ${totalSize}KB`);
            
            const largeFiles = this.performanceMetrics.fileSize
                .filter(file => file.sizeKB > 100)
                .sort((a, b) => b.sizeKB - a.sizeKB);
            
            if (largeFiles.length > 0) {
                console.log('  大文件:');
                largeFiles.forEach(file => {
                    console.log(`    ${file.fileName}: ${file.sizeKB}KB`);
                });
            }
        }
        
        // 代碼複雜度報告
        if (this.performanceMetrics.codeComplexity.length > 0) {
            console.log('\n🔧 代碼複雜度總結:');
            const avgComplexity = this.performanceMetrics.codeComplexity
                .reduce((sum, file) => sum + file.complexity, 0) / this.performanceMetrics.codeComplexity.length;
            
            console.log(`  平均複雜度: ${Math.round(avgComplexity)}`);
            
            const complexFiles = this.performanceMetrics.codeComplexity
                .filter(file => file.complexity > 10)
                .sort((a, b) => b.complexity - a.complexity);
            
            if (complexFiles.length > 0) {
                console.log('  高複雜度檔案:');
                complexFiles.forEach(file => {
                    console.log(`    ${file.fileName}: ${file.complexity} (${file.functions} 函數, ${file.lines} 行)`);
                });
            }
        }
        
        // 優化建議
        console.log('\n💡 優化建議:');
        if (this.optimizationSuggestions.length === 0) {
            console.log('  🎉 未發現明顯的效能問題！');
        } else {
            const groupedSuggestions = {};
            this.optimizationSuggestions.forEach(suggestion => {
                if (!groupedSuggestions[suggestion.severity]) {
                    groupedSuggestions[suggestion.severity] = [];
                }
                groupedSuggestions[suggestion.severity].push(suggestion);
            });
            
            Object.entries(groupedSuggestions).forEach(([severity, suggestions]) => {
                const icon = severity === 'high' ? '🔴' : severity === 'medium' ? '🟡' : '🟢';
                console.log(`\n${icon} ${severity.toUpperCase()} 優先級 (${suggestions.length} 項):`);
                
                suggestions.forEach((suggestion, index) => {
                    console.log(`  ${index + 1}. [${suggestion.type}] ${suggestion.issue}`);
                    console.log(`     💡 建議: ${suggestion.suggestion}`);
                    if (suggestion.file) console.log(`     📁 文件: ${suggestion.file}`);
                    if (suggestion.endpoint) console.log(`     🔗 端點: ${suggestion.endpoint}`);
                    console.log('');
                });
            });
        }
        
        // 整體評分
        const totalIssues = this.optimizationSuggestions.length;
        const highPriority = this.optimizationSuggestions.filter(s => s.severity === 'high').length;
        const mediumPriority = this.optimizationSuggestions.filter(s => s.severity === 'medium').length;
        
        let overallRating = 'A+';
        if (highPriority > 0) overallRating = 'C';
        else if (mediumPriority > 2) overallRating = 'B';
        else if (totalIssues > 0) overallRating = 'A';
        
        console.log('\n🏆 整體效能評級:');
        console.log(`  評級: ${overallRating}`);
        console.log(`  發現問題: ${totalIssues} 個`);
        console.log(`  高優先級: ${highPriority} 個`);
        console.log(`  中優先級: ${mediumPriority} 個`);
        
        console.log('\n✅ 效能瓶頸分析完成');
    }
}

async function main() {
    const analyzer = new PerformanceAnalyzer();
    await analyzer.runPerformanceAnalysis();
}

main();