/**
 * 安全檢查腳本
 * Claude Code相容性安全掃描工具
 */

const fs = require('fs');
const path = require('path');

class SecurityChecker {
    constructor() {
        this.securityPatterns = [
            {
                name: 'Telegram Bot Token',
                pattern: /\d+:[A-Za-z0-9_-]+/g,
                severity: 'HIGH',
                exclude: ['.env', '.env.example', '.env.template']
            },
            {
                name: 'Hardcoded Group ID',
                pattern: /-\d{13}/g,
                severity: 'MEDIUM',
                exclude: ['.env', '.env.example', '.env.template']
            },
            {
                name: 'SQL Injection Risk',
                pattern: /['"]\s*\+\s*\w+\s*\+\s*['"]/g,
                severity: 'HIGH'
            },
            {
                name: 'Hardcoded Password',
                pattern: /password\s*[:=]\s*["'][^"']+["']/gi,
                severity: 'HIGH'
            },
            {
                name: 'API Key Pattern',
                pattern: /api[_-]?key\s*[:=]\s*["'][^"']+["']/gi,
                severity: 'HIGH'
            }
        ];

        this.excludeDirs = ['node_modules', '.git', 'coverage', 'logs'];
        this.includeExtensions = ['.js', '.html', '.json', '.md', '.txt'];
    }

    async runFullScan() {
        console.log('🔍 開始安全掃描...');
        
        const issues = [];
        const scanPaths = ['.'];
        
        for (const scanPath of scanPaths) {
            await this.scanDirectory(scanPath, issues);
        }

        this.generateReport(issues);
        return issues;
    }

    async scanDirectory(dirPath, issues) {
        try {
            const items = fs.readdirSync(dirPath);
            
            for (const item of items) {
                const fullPath = path.join(dirPath, item);
                const stats = fs.statSync(fullPath);
                
                if (stats.isDirectory()) {
                    if (!this.excludeDirs.includes(item)) {
                        await this.scanDirectory(fullPath, issues);
                    }
                } else if (stats.isFile()) {
                    const ext = path.extname(item);
                    if (this.includeExtensions.includes(ext) || !ext) {
                        const fileIssues = this.scanFile(fullPath);
                        issues.push(...fileIssues);
                    }
                }
            }
        } catch (error) {
            console.warn(`⚠️ 無法掃描目錄 ${dirPath}:`, error.message);
        }
    }

    scanFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const issues = [];
            const fileName = path.basename(filePath);

            this.securityPatterns.forEach(({ name, pattern, severity, exclude }) => {
                // 檢查是否為排除檔案
                if (exclude && exclude.some(excludeFile => fileName.includes(excludeFile))) {
                    return;
                }

                const matches = content.match(pattern);
                if (matches) {
                    // 獲取行號資訊
                    const lines = content.split('\n');
                    const matchLines = [];
                    
                    lines.forEach((line, index) => {
                        if (pattern.test(line)) {
                            matchLines.push(index + 1);
                        }
                    });

                    issues.push({
                        file: filePath,
                        issue: name,
                        severity,
                        matches: matches.length,
                        lines: matchLines,
                        samples: matches.slice(0, 3) // 只顯示前3個匹配項
                    });
                }
            });

            return issues;
        } catch (error) {
            console.warn(`⚠️ 無法掃描檔案 ${filePath}:`, error.message);
            return [];
        }
    }

    generateReport(issues) {
        const timestamp = new Date().toISOString();
        const highSeverity = issues.filter(i => i.severity === 'HIGH');
        const mediumSeverity = issues.filter(i => i.severity === 'MEDIUM');

        const report = {
            timestamp,
            summary: {
                totalIssues: issues.length,
                highSeverity: highSeverity.length,
                mediumSeverity: mediumSeverity.length,
                lowSeverity: issues.filter(i => i.severity === 'LOW').length
            },
            issues: issues,
            recommendations: this.generateRecommendations(issues)
        };

        // 保存詳細報告
        fs.writeFileSync('security-scan-report.json', JSON.stringify(report, null, 2));

        // 控制台輸出
        console.log('\n📊 安全掃描報告:');
        console.log(`   掃描時間: ${timestamp}`);
        console.log(`   總問題數: ${report.summary.totalIssues}`);
        console.log(`   高風險: ${report.summary.highSeverity}`);
        console.log(`   中風險: ${report.summary.mediumSeverity}`);
        console.log(`   低風險: ${report.summary.lowSeverity}`);

        if (highSeverity.length > 0) {
            console.log('\n🚨 高風險問題:');
            highSeverity.forEach(issue => {
                console.log(`   ${issue.file}: ${issue.issue} (${issue.matches} 處)`);
            });
        }

        console.log('\n💡 建議:');
        report.recommendations.forEach(rec => {
            console.log(`   • ${rec}`);
        });

        console.log(`\n📄 詳細報告已保存至: security-scan-report.json`);
    }

    generateRecommendations(issues) {
        const recommendations = [];
        
        if (issues.some(i => i.issue.includes('Telegram Bot Token'))) {
            recommendations.push('將所有Telegram Bot Token移至環境變數');
        }
        
        if (issues.some(i => i.issue.includes('SQL Injection'))) {
            recommendations.push('使用參數化查詢防止SQL注入');
        }
        
        if (issues.some(i => i.issue.includes('Password'))) {
            recommendations.push('移除所有硬編碼密碼，使用安全的配置管理');
        }
        
        if (issues.some(i => i.issue.includes('API Key'))) {
            recommendations.push('將API金鑰移至環境變數或密鑰管理服務');
        }

        if (recommendations.length === 0) {
            recommendations.push('未發現嚴重安全問題，請繼續保持良好的安全實踐');
        }

        return recommendations;
    }

    async checkClaudeCodeCompliance() {
        console.log('🎯 檢查Claude Code相容性...');
        
        const issues = await this.runFullScan();
        const compliance = {
            compatible: issues.filter(i => i.severity === 'HIGH').length === 0,
            score: this.calculateComplianceScore(issues),
            blockers: issues.filter(i => i.severity === 'HIGH'),
            warnings: issues.filter(i => i.severity === 'MEDIUM')
        };

        console.log(`\n🎯 Claude Code相容性: ${compliance.compatible ? '✅ 通過' : '❌ 未通過'}`);
        console.log(`   相容性分數: ${compliance.score}/100`);
        
        if (!compliance.compatible) {
            console.log('\n🚫 阻擋因素:');
            compliance.blockers.forEach(blocker => {
                console.log(`   • ${blocker.file}: ${blocker.issue}`);
            });
        }

        return compliance;
    }

    calculateComplianceScore(issues) {
        const maxScore = 100;
        const highPenalty = 20;
        const mediumPenalty = 5;
        const lowPenalty = 1;

        const penalties = issues.reduce((total, issue) => {
            switch (issue.severity) {
                case 'HIGH': return total + highPenalty;
                case 'MEDIUM': return total + mediumPenalty;
                case 'LOW': return total + lowPenalty;
                default: return total;
            }
        }, 0);

        return Math.max(0, maxScore - penalties);
    }
}

// CLI執行
if (require.main === module) {
    const args = process.argv.slice(2);
    const checker = new SecurityChecker();

    if (args.includes('--claude-code')) {
        checker.checkClaudeCodeCompliance();
    } else {
        checker.runFullScan();
    }
}

module.exports = SecurityChecker;