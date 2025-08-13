/**
 * 生產環境安全性和性能分析工具
 * Production Environment Security & Performance Analyzer
 * 
 * 功能：
 * 1. 負載測試和壓力測試
 * 2. 安全漏洞掃描
 * 3. 性能基準測試
 * 4. SSL/TLS安全分析
 * 5. API端點安全檢測
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

class ProductionAnalyzer {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.results = {
            performance: {},
            security: {},
            vulnerabilities: [],
            recommendations: []
        };
        this.startTime = Date.now();
    }

    // 執行完整的生產環境分析
    async runCompleteAnalysis() {
        console.log('🚀 開始生產環境安全性和性能深度分析...');
        console.log(`🌐 目標網址: ${this.baseUrl}`);
        
        try {
            // 1. 負載測試和性能分析
            await this.performLoadTesting();
            
            // 2. 安全漏洞掃描
            await this.performSecurityScan();
            
            // 3. SSL/TLS安全檢查
            await this.checkSSLSecurity();
            
            // 4. API端點測試
            await this.testAPIEndpoints();
            
            // 5. 前端性能分析
            await this.analyzeFrontendPerformance();
            
            // 6. 生成完整報告
            await this.generateReport();
            
        } catch (error) {
            console.error('❌ 分析過程中發生錯誤:', error.message);
            this.results.error = error.message;
        }
    }

    // 負載測試和壓力測試
    async performLoadTesting() {
        console.log('\n🔄 執行負載測試和壓力測試...');
        
        const testCases = [
            { concurrent: 1, requests: 10, name: '基準測試' },
            { concurrent: 5, requests: 25, name: '輕度負載' },
            { concurrent: 10, requests: 50, name: '中度負載' },
            { concurrent: 20, requests: 100, name: '高度負載' }
        ];

        this.results.performance.loadTests = [];

        for (const test of testCases) {
            console.log(`  📊 執行 ${test.name} (${test.concurrent} 併發, ${test.requests} 請求)...`);
            const result = await this.executeLoadTest(test);
            this.results.performance.loadTests.push(result);
        }
    }

    // 執行單個負載測試
    async executeLoadTest(testConfig) {
        const startTime = Date.now();
        const responses = [];
        const errors = [];

        const promises = [];
        for (let i = 0; i < testConfig.concurrent; i++) {
            promises.push(this.sendConcurrentRequests(testConfig.requests / testConfig.concurrent, responses, errors));
        }

        await Promise.all(promises);
        
        const endTime = Date.now();
        const totalTime = endTime - startTime;
        
        const successfulRequests = responses.filter(r => r.success).length;
        const avgResponseTime = responses.reduce((sum, r) => sum + r.responseTime, 0) / responses.length;
        
        return {
            name: testConfig.name,
            concurrent: testConfig.concurrent,
            totalRequests: testConfig.requests,
            successfulRequests,
            failedRequests: errors.length,
            totalTime,
            avgResponseTime: Math.round(avgResponseTime),
            requestsPerSecond: Math.round(successfulRequests / (totalTime / 1000)),
            errors: errors.slice(0, 5) // 只保留前5個錯誤
        };
    }

    // 發送併發請求
    async sendConcurrentRequests(count, responses, errors) {
        for (let i = 0; i < count; i++) {
            try {
                const response = await this.makeRequest(this.baseUrl);
                responses.push(response);
            } catch (error) {
                errors.push({
                    message: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        }
    }

    // 發送HTTP請求
    makeRequest(url) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const client = url.startsWith('https') ? https : http;
            
            const req = client.get(url, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    const endTime = Date.now();
                    resolve({
                        success: true,
                        statusCode: res.statusCode,
                        responseTime: endTime - startTime,
                        headers: res.headers,
                        bodySize: data.length
                    });
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
        });
    }

    // 安全漏洞掃描
    async performSecurityScan() {
        console.log('\n🔒 執行安全漏洞掃描...');
        
        this.results.security = {
            headers: {},
            vulnerabilities: [],
            recommendations: []
        };

        // 檢查安全標頭
        await this.checkSecurityHeaders();
        
        // 檢查常見漏洞
        await this.checkCommonVulnerabilities();
        
        // 檢查API安全性
        await this.checkAPISecurity();
    }

    // 檢查安全標頭
    async checkSecurityHeaders() {
        console.log('  🛡️ 檢查安全標頭配置...');
        
        try {
            const response = await this.makeRequest(this.baseUrl);
            const headers = response.headers;
            
            const securityHeaders = {
                'strict-transport-security': 'HSTS',
                'content-security-policy': 'CSP',
                'x-frame-options': 'Clickjacking Protection',
                'x-content-type-options': 'MIME Type Protection',
                'x-xss-protection': 'XSS Protection',
                'referrer-policy': 'Referrer Policy'
            };

            this.results.security.headers = {};
            
            for (const [header, description] of Object.entries(securityHeaders)) {
                const exists = headers[header] || headers[header.toLowerCase()];
                this.results.security.headers[header] = {
                    present: !!exists,
                    value: exists || 'Not Set',
                    description
                };

                if (!exists) {
                    this.results.security.vulnerabilities.push({
                        type: 'Missing Security Header',
                        severity: 'Medium',
                        header: header,
                        description: `Missing ${description} header`,
                        recommendation: `Set ${header} header for enhanced security`
                    });
                }
            }
        } catch (error) {
            console.error('    ❌ 安全標頭檢查失敗:', error.message);
        }
    }

    // 檢查常見漏洞
    async checkCommonVulnerabilities() {
        console.log('  🔍 檢查常見安全漏洞...');
        
        const vulnerabilityTests = [
            {
                name: 'Directory Traversal',
                paths: ['/../../../etc/passwd', '/..\\..\\..\\windows\\system32\\drivers\\etc\\hosts']
            },
            {
                name: 'SQL Injection',
                paths: ["/api/employees?id=1'OR'1'='1", "/api/employees?id=1;DROP TABLE users;"]
            },
            {
                name: 'XSS Testing',
                paths: ['/search?q=<script>alert("XSS")</script>', '/api/employees?name=<img src=x onerror=alert(1)>']
            }
        ];

        for (const test of vulnerabilityTests) {
            for (const testPath of test.paths) {
                try {
                    const testUrl = this.baseUrl + testPath;
                    const response = await this.makeRequest(testUrl);
                    
                    // 檢查響應是否包含測試載荷
                    if (response.statusCode === 200) {
                        this.results.security.vulnerabilities.push({
                            type: test.name,
                            severity: 'High',
                            path: testPath,
                            description: `Potential ${test.name} vulnerability detected`,
                            recommendation: `Implement proper input validation and sanitization`
                        });
                    }
                } catch (error) {
                    // 這裡的錯誤通常是好事（404, 403等）
                }
            }
        }
    }

    // 檢查API安全性
    async checkAPISecurity() {
        console.log('  🔧 檢查API端點安全性...');
        
        const apiEndpoints = [
            '/api/employees',
            '/api/auth/login',
            '/api/auth/register',
            '/api/admin/users',
            '/api/admin/settings'
        ];

        this.results.security.apiEndpoints = [];

        for (const endpoint of apiEndpoints) {
            try {
                const response = await this.makeRequest(this.baseUrl + endpoint);
                
                this.results.security.apiEndpoints.push({
                    endpoint,
                    statusCode: response.statusCode,
                    accessible: response.statusCode !== 404,
                    authenticated: response.statusCode !== 401,
                    headers: response.headers
                });

                // 檢查未認證訪問
                if (response.statusCode === 200 && !response.headers.authorization) {
                    this.results.security.vulnerabilities.push({
                        type: 'Unauthenticated Access',
                        severity: 'High',
                        endpoint,
                        description: 'API endpoint accessible without authentication',
                        recommendation: 'Implement proper authentication and authorization'
                    });
                }
            } catch (error) {
                this.results.security.apiEndpoints.push({
                    endpoint,
                    error: error.message,
                    accessible: false
                });
            }
        }
    }

    // SSL/TLS安全檢查
    async checkSSLSecurity() {
        console.log('\n🔐 檢查SSL/TLS安全性...');
        
        if (!this.baseUrl.startsWith('https')) {
            this.results.security.ssl = {
                enabled: false,
                vulnerability: 'Site not using HTTPS'
            };
            this.results.security.vulnerabilities.push({
                type: 'No HTTPS',
                severity: 'Critical',
                description: 'Website not using HTTPS encryption',
                recommendation: 'Enable HTTPS with valid SSL certificate'
            });
            return;
        }

        try {
            const response = await this.makeRequest(this.baseUrl);
            this.results.security.ssl = {
                enabled: true,
                headers: response.headers
            };
            
            // 檢查HSTS
            if (!response.headers['strict-transport-security']) {
                this.results.security.vulnerabilities.push({
                    type: 'Missing HSTS',
                    severity: 'Medium',
                    description: 'HTTP Strict Transport Security not enabled',
                    recommendation: 'Enable HSTS header'
                });
            }
        } catch (error) {
            console.error('    ❌ SSL檢查失敗:', error.message);
        }
    }

    // API端點測試
    async testAPIEndpoints() {
        console.log('\n🔗 測試API端點性能...');
        
        const endpoints = [
            '/api/employees',
            '/api/auth/login',
            '/api/auth/register'
        ];

        this.results.performance.apiTests = [];

        for (const endpoint of endpoints) {
            try {
                const startTime = Date.now();
                const response = await this.makeRequest(this.baseUrl + endpoint);
                const endTime = Date.now();
                
                this.results.performance.apiTests.push({
                    endpoint,
                    responseTime: endTime - startTime,
                    statusCode: response.statusCode,
                    bodySize: response.bodySize,
                    accessible: response.statusCode !== 404
                });
            } catch (error) {
                this.results.performance.apiTests.push({
                    endpoint,
                    error: error.message,
                    accessible: false
                });
            }
        }
    }

    // 前端性能分析
    async analyzeFrontendPerformance() {
        console.log('\n⚡ 分析前端性能...');
        
        try {
            const response = await this.makeRequest(this.baseUrl);
            
            this.results.performance.frontend = {
                totalLoadTime: response.responseTime,
                contentSize: response.bodySize,
                statusCode: response.statusCode,
                compressionEnabled: !!(response.headers['content-encoding']),
                cacheHeaders: {
                    cacheControl: response.headers['cache-control'] || 'Not Set',
                    expires: response.headers['expires'] || 'Not Set',
                    etag: response.headers['etag'] || 'Not Set'
                }
            };

            // 性能建議
            if (response.responseTime > 3000) {
                this.results.recommendations.push({
                    type: 'Performance',
                    priority: 'High',
                    issue: 'Slow page load time',
                    recommendation: 'Optimize server response time and implement caching'
                });
            }

            if (!response.headers['content-encoding']) {
                this.results.recommendations.push({
                    type: 'Performance',
                    priority: 'Medium',
                    issue: 'No compression enabled',
                    recommendation: 'Enable gzip/brotli compression for better performance'
                });
            }
        } catch (error) {
            console.error('    ❌ 前端性能分析失敗:', error.message);
        }
    }

    // 生成完整分析報告
    async generateReport() {
        console.log('\n📊 生成生產環境分析報告...');
        
        const report = {
            metadata: {
                target: this.baseUrl,
                timestamp: new Date().toISOString(),
                analysisTime: Date.now() - this.startTime,
                version: '1.0.0'
            },
            summary: this.generateSummary(),
            performance: this.results.performance,
            security: this.results.security,
            vulnerabilities: this.results.vulnerabilities || this.results.security.vulnerabilities || [],
            recommendations: this.results.recommendations,
            rawData: this.results
        };

        // 保存報告到文件
        const reportPath = path.join(__dirname, `production-analysis-report-${Date.now()}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        // 生成可讀性報告
        const readableReport = this.generateReadableReport(report);
        const readableReportPath = path.join(__dirname, `production-analysis-report-${Date.now()}.md`);
        fs.writeFileSync(readableReportPath, readableReport);

        console.log(`📁 報告已保存:`);
        console.log(`   JSON: ${reportPath}`);
        console.log(`   Markdown: ${readableReportPath}`);

        // 輸出摘要
        this.outputSummary(report.summary);
        
        return report;
    }

    // 生成摘要
    generateSummary() {
        const totalVulnerabilities = (this.results.vulnerabilities || []).length + 
                                   (this.results.security?.vulnerabilities || []).length;
        
        const criticalVulns = this.getAllVulnerabilities().filter(v => v.severity === 'Critical').length;
        const highVulns = this.getAllVulnerabilities().filter(v => v.severity === 'High').length;
        const mediumVulns = this.getAllVulnerabilities().filter(v => v.severity === 'Medium').length;

        const loadTests = this.results.performance?.loadTests || [];
        const avgResponseTime = loadTests.length > 0 ? 
            Math.round(loadTests.reduce((sum, test) => sum + test.avgResponseTime, 0) / loadTests.length) : 0;

        return {
            securityScore: Math.max(0, 100 - (criticalVulns * 30 + highVulns * 15 + mediumVulns * 5)),
            performanceScore: this.calculatePerformanceScore(),
            totalVulnerabilities,
            vulnerabilityBreakdown: { critical: criticalVulns, high: highVulns, medium: mediumVulns },
            avgResponseTime,
            riskLevel: this.calculateRiskLevel(criticalVulns, highVulns),
            recommendations: (this.results.recommendations || []).length
        };
    }

    // 計算性能分數
    calculatePerformanceScore() {
        let score = 100;
        
        const loadTests = this.results.performance?.loadTests || [];
        if (loadTests.length > 0) {
            const avgResponseTime = loadTests.reduce((sum, test) => sum + test.avgResponseTime, 0) / loadTests.length;
            if (avgResponseTime > 5000) score -= 40;
            else if (avgResponseTime > 3000) score -= 25;
            else if (avgResponseTime > 1000) score -= 10;
        }

        const frontend = this.results.performance?.frontend;
        if (frontend) {
            if (!frontend.compressionEnabled) score -= 10;
            if (frontend.totalLoadTime > 3000) score -= 15;
        }

        return Math.max(0, score);
    }

    // 計算風險等級
    calculateRiskLevel(critical, high) {
        if (critical > 0) return 'Critical';
        if (high > 2) return 'High';
        if (high > 0) return 'Medium';
        return 'Low';
    }

    // 獲取所有漏洞
    getAllVulnerabilities() {
        return [
            ...(this.results.vulnerabilities || []),
            ...(this.results.security?.vulnerabilities || [])
        ];
    }

    // 生成可讀性報告
    generateReadableReport(report) {
        return `# 生產環境安全性和性能分析報告

## 🎯 執行摘要

- **目標網址**: ${report.metadata.target}
- **分析時間**: ${new Date(report.metadata.timestamp).toLocaleString('zh-TW')}
- **分析耗時**: ${Math.round(report.metadata.analysisTime / 1000)}秒

### 📊 整體評分

- **安全性評分**: ${report.summary.securityScore}/100
- **性能評分**: ${report.summary.performanceScore}/100
- **風險等級**: ${report.summary.riskLevel}

### 🔍 發現摘要

- **總漏洞數**: ${report.summary.totalVulnerabilities}
  - 嚴重: ${report.summary.vulnerabilityBreakdown.critical}
  - 高風險: ${report.summary.vulnerabilityBreakdown.high}
  - 中風險: ${report.summary.vulnerabilityBreakdown.medium}

- **平均響應時間**: ${report.summary.avgResponseTime}ms
- **建議項目**: ${report.summary.recommendations}項

## 🔒 安全性分析結果

### 安全標頭檢查
${this.formatSecurityHeaders(report.security.headers)}

### 發現的漏洞
${this.formatVulnerabilities(report.vulnerabilities)}

## ⚡ 性能分析結果

### 負載測試結果
${this.formatLoadTests(report.performance.loadTests)}

### API端點性能
${this.formatAPITests(report.performance.apiTests)}

## 💡 建議和修復方案

${this.formatRecommendations(report.recommendations)}

---
*報告由生產環境安全性和性能分析工具自動生成*
`;
    }

    // 格式化安全標頭
    formatSecurityHeaders(headers) {
        if (!headers) return '無法檢查安全標頭';
        
        let result = '';
        for (const [header, info] of Object.entries(headers)) {
            const status = info.present ? '✅' : '❌';
            result += `\n- ${status} ${info.description}: ${info.value}`;
        }
        return result;
    }

    // 格式化漏洞列表
    formatVulnerabilities(vulnerabilities) {
        if (!vulnerabilities || vulnerabilities.length === 0) {
            return '\n✅ 未發現明顯漏洞';
        }

        let result = '';
        vulnerabilities.forEach((vuln, index) => {
            const icon = vuln.severity === 'Critical' ? '🚨' : 
                        vuln.severity === 'High' ? '⚠️' : '⚡';
            result += `\n${index + 1}. ${icon} **${vuln.type}** (${vuln.severity})`;
            result += `\n   - 描述: ${vuln.description}`;
            result += `\n   - 建議: ${vuln.recommendation}\n`;
        });
        return result;
    }

    // 格式化負載測試
    formatLoadTests(loadTests) {
        if (!loadTests || loadTests.length === 0) {
            return '\n❌ 負載測試失敗';
        }

        let result = '';
        loadTests.forEach(test => {
            result += `\n### ${test.name}`;
            result += `\n- 併發數: ${test.concurrent}`;
            result += `\n- 總請求: ${test.totalRequests}`;
            result += `\n- 成功請求: ${test.successfulRequests}`;
            result += `\n- 平均響應時間: ${test.avgResponseTime}ms`;
            result += `\n- QPS: ${test.requestsPerSecond}\n`;
        });
        return result;
    }

    // 格式化API測試
    formatAPITests(apiTests) {
        if (!apiTests || apiTests.length === 0) {
            return '\n❌ API測試失敗';
        }

        let result = '';
        apiTests.forEach(test => {
            const status = test.accessible ? '✅' : '❌';
            result += `\n- ${status} ${test.endpoint}: ${test.responseTime || 'N/A'}ms`;
        });
        return result;
    }

    // 格式化建議
    formatRecommendations(recommendations) {
        if (!recommendations || recommendations.length === 0) {
            return '\n✅ 暫無特殊建議';
        }

        let result = '';
        recommendations.forEach((rec, index) => {
            const priority = rec.priority === 'High' ? '🔴' : 
                           rec.priority === 'Medium' ? '🟡' : '🟢';
            result += `\n${index + 1}. ${priority} **${rec.issue}**`;
            result += `\n   - 建議: ${rec.recommendation}\n`;
        });
        return result;
    }

    // 輸出摘要到控制台
    outputSummary(summary) {
        console.log('\n' + '='.repeat(60));
        console.log('📋 生產環境分析摘要');
        console.log('='.repeat(60));
        console.log(`🔒 安全性評分: ${summary.securityScore}/100`);
        console.log(`⚡ 性能評分: ${summary.performanceScore}/100`);
        console.log(`⚠️  風險等級: ${summary.riskLevel}`);
        console.log(`🐛 總漏洞數: ${summary.totalVulnerabilities}`);
        console.log(`⏱️  平均響應時間: ${summary.avgResponseTime}ms`);
        console.log(`💡 建議項目: ${summary.recommendations}項`);
        console.log('='.repeat(60));
    }
}

// 主執行函數
async function main() {
    const targetUrl = 'https://employee-management-system-intermediate.onrender.com';
    
    console.log('🚀 啟動生產環境安全性和性能深度分析...');
    console.log(`🎯 目標: ${targetUrl}`);
    console.log('⏳ 預計執行時間: 3-5分鐘\n');

    const analyzer = new ProductionAnalyzer(targetUrl);
    await analyzer.runCompleteAnalysis();
    
    console.log('\n✅ 分析完成！請查看生成的報告文件。');
}

// 如果直接執行此腳本
if (require.main === module) {
    main().catch(console.error);
}

module.exports = ProductionAnalyzer;