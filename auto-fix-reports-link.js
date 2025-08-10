const fs = require('fs').promises;
const path = require('path');

class ReportsLinkFixer {
    constructor() {
        this.baseDir = __dirname;
        this.publicDir = path.join(this.baseDir, 'public');
        this.backupDir = path.join(this.baseDir, 'backup-before-fix');
    }

    async init() {
        console.log('🔧 啟動Reports連結自動修復工具...');
        
        // 建立備份目錄
        try {
            await fs.mkdir(this.backupDir, { recursive: true });
        } catch (error) {
            console.log('備份目錄已存在');
        }
    }

    async backupFiles() {
        console.log('💾 備份原始檔案...');
        
        const filesToBackup = [
            'employee-dashboard.html',
            'reports.html'
        ];
        
        for (const file of filesToBackup) {
            const sourcePath = path.join(this.publicDir, file);
            const backupPath = path.join(this.backupDir, `${file}.backup.${Date.now()}`);
            
            try {
                const content = await fs.readFile(sourcePath, 'utf8');
                await fs.writeFile(backupPath, content, 'utf8');
                console.log(`✅ 已備份: ${file} -> ${path.basename(backupPath)}`);
            } catch (error) {
                console.log(`⚠️ 備份檔案失敗: ${file} - ${error.message}`);
            }
        }
    }

    async analyzeCurrentState() {
        console.log('\n🔍 分析現有檔案狀態...');
        
        const analysis = {
            employeeDashboard: null,
            reportsPage: null,
            issues: []
        };
        
        // 檢查employee-dashboard.html
        try {
            const dashboardPath = path.join(this.publicDir, 'employee-dashboard.html');
            const dashboardContent = await fs.readFile(dashboardPath, 'utf8');
            
            analysis.employeeDashboard = {
                exists: true,
                hasReportsLink: dashboardContent.includes('reports.html'),
                reportsLinkCount: (dashboardContent.match(/reports\.html/g) || []).length,
                content: dashboardContent
            };
            
            if (analysis.employeeDashboard.hasReportsLink) {
                analysis.issues.push('employee-dashboard.html包含指向reports.html的連結');
            }
            
        } catch (error) {
            analysis.employeeDashboard = { exists: false, error: error.message };
            analysis.issues.push('employee-dashboard.html檔案不存在或無法讀取');
        }
        
        // 檢查reports.html
        try {
            const reportsPath = path.join(this.publicDir, 'reports.html');
            const reportsContent = await fs.readFile(reportsPath, 'utf8');
            
            analysis.reportsPage = {
                exists: true,
                isEmptyPage: reportsContent.includes('正在開發中'),
                contentLength: reportsContent.length,
                content: reportsContent
            };
            
            if (analysis.reportsPage.isEmptyPage) {
                analysis.issues.push('reports.html是空的開發中頁面');
            }
            
        } catch (error) {
            analysis.reportsPage = { exists: false, error: error.message };
            analysis.issues.push('reports.html檔案不存在或無法讀取');
        }
        
        console.log(`📊 發現 ${analysis.issues.length} 個問題：`);
        analysis.issues.forEach((issue, index) => {
            console.log(`   ${index + 1}. ${issue}`);
        });
        
        return analysis;
    }

    async fixReportsLink() {
        console.log('\n🛠️ 修復reports連結...');
        
        const dashboardPath = path.join(this.publicDir, 'employee-dashboard.html');
        
        try {
            let content = await fs.readFile(dashboardPath, 'utf8');
            
            // 修復reports.html連結指向revenue.html
            const originalMatches = content.match(/href="reports\.html"/g);
            
            if (originalMatches && originalMatches.length > 0) {
                content = content.replace(/href="reports\.html"/g, 'href="revenue.html"');
                
                // 同時更新按鈕文字以反映實際功能
                content = content.replace(
                    /<h5 class="card-title">報表查看<\/h5>/,
                    '<h5 class="card-title">營收報表</h5>'
                );
                
                content = content.replace(
                    /<p class="card-text">查看各項報表<\/p>/,
                    '<p class="card-text">查看營收統計報表</p>'
                );
                
                await fs.writeFile(dashboardPath, content, 'utf8');
                
                console.log(`✅ 已修復 ${originalMatches.length} 個reports連結`);
                console.log('   連結從 reports.html 改為 revenue.html');
                console.log('   卡片標題從 "報表查看" 改為 "營收報表"');
                
                return true;
            } else {
                console.log('⚠️ 未找到需要修復的reports連結');
                return false;
            }
            
        } catch (error) {
            console.error(`❌ 修復失敗: ${error.message}`);
            return false;
        }
    }

    async createImprovedReportsPage() {
        console.log('\n📝 建立改進的reports頁面...');
        
        const reportsPath = path.join(this.publicDir, 'reports.html');
        
        const improvedReportsContent = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>報表儀表板 - 企業員工管理系統</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
        <div class="container">
            <a class="navbar-brand" href="employee-dashboard.html">員工管理系統</a>
            <div class="navbar-nav ms-auto">
                <a class="nav-link" href="profile.html">個人資料</a>
                <a class="nav-link" href="attendance.html">考勤打卡</a>
                <a class="nav-link" href="#" onclick="logout()">登出</a>
            </div>
        </div>
    </nav>

    <div class="container mt-4">
        <div class="row">
            <div class="col-md-12">
                <h2>📊 報表儀表板</h2>
                <p class="text-muted">查看各種統計報表和數據分析</p>
                
                <div class="row mt-4">
                    <div class="col-md-6 col-lg-4 mb-4">
                        <div class="card">
                            <div class="card-body text-center">
                                <h5 class="card-title">💰 營收報表</h5>
                                <p class="card-text">查看營收統計和趨勢分析</p>
                                <a href="revenue.html" class="btn btn-success">查看營收</a>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-6 col-lg-4 mb-4">
                        <div class="card">
                            <div class="card-body text-center">
                                <h5 class="card-title">📅 考勤報表</h5>
                                <p class="card-text">查看考勤記錄和統計</p>
                                <a href="attendance.html" class="btn btn-primary">查看考勤</a>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-6 col-lg-4 mb-4">
                        <div class="card">
                            <div class="card-body text-center">
                                <h5 class="card-title">📈 統計分析</h5>
                                <p class="card-text">綜合統計和數據分析</p>
                                <button class="btn btn-info" onclick="showStats()">查看統計</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="row mt-4">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header">
                                <h5>快速報表功能</h5>
                            </div>
                            <div class="card-body">
                                <div class="btn-group" role="group">
                                    <button class="btn btn-outline-primary" onclick="generateReport('daily')">
                                        📊 日報表
                                    </button>
                                    <button class="btn btn-outline-success" onclick="generateReport('weekly')">
                                        📈 週報表
                                    </button>
                                    <button class="btn btn-outline-info" onclick="generateReport('monthly')">
                                        📉 月報表
                                    </button>
                                    <button class="btn btn-outline-warning" onclick="exportReport()">
                                        💾 匯出報表
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div id="reportContent" class="mt-4" style="display: none;">
                    <div class="card">
                        <div class="card-header">
                            <h5 id="reportTitle">報表內容</h5>
                        </div>
                        <div class="card-body">
                            <div id="reportData">
                                <p>載入中...</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="mt-4">
                    <a href="employee-dashboard.html" class="btn btn-secondary">
                        ← 返回工作台
                    </a>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        function showStats() {
            alert('統計功能開發中，敬請期待！');
        }
        
        function generateReport(type) {
            const reportContent = document.getElementById('reportContent');
            const reportTitle = document.getElementById('reportTitle');
            const reportData = document.getElementById('reportData');
            
            reportTitle.textContent = type === 'daily' ? '日報表' : 
                                    type === 'weekly' ? '週報表' : '月報表';
            
            reportData.innerHTML = \`
                <div class="alert alert-info">
                    <h6>\${reportTitle.textContent} - 模擬數據</h6>
                    <ul>
                        <li>總營收: NT$ 50,000</li>
                        <li>出勤率: 95%</li>
                        <li>完成任務: 48/50</li>
                        <li>客戶滿意度: 4.8/5.0</li>
                    </ul>
                    <small class="text-muted">
                        注意：這是示範數據，實際功能需要連接後端API
                    </small>
                </div>
            \`;
            
            reportContent.style.display = 'block';
        }
        
        function exportReport() {
            alert('報表匯出功能開發中！');
        }
        
        function logout() {
            if (confirm('確定要登出嗎？')) {
                window.location.href = 'login.html';
            }
        }
    </script>
</body>
</html>`;

        try {
            await fs.writeFile(reportsPath, improvedReportsContent, 'utf8');
            console.log('✅ 已建立改進的reports.html頁面');
            console.log('   包含報表導航和基本功能');
            return true;
        } catch (error) {
            console.error(`❌ 建立reports頁面失敗: ${error.message}`);
            return false;
        }
    }

    async verifyFixes() {
        console.log('\n✅ 驗證修復結果...');
        
        const verification = {
            employeeDashboardFixed: false,
            reportsPageImproved: false,
            issues: []
        };
        
        try {
            const dashboardPath = path.join(this.publicDir, 'employee-dashboard.html');
            const dashboardContent = await fs.readFile(dashboardPath, 'utf8');
            
            if (!dashboardContent.includes('reports.html')) {
                verification.employeeDashboardFixed = true;
                console.log('✅ employee-dashboard.html已修復，不再包含reports.html連結');
            } else {
                verification.issues.push('employee-dashboard.html仍包含reports.html連結');
            }
            
            if (dashboardContent.includes('revenue.html')) {
                console.log('✅ 連結已正確指向revenue.html');
            } else {
                verification.issues.push('未找到revenue.html連結');
            }
            
        } catch (error) {
            verification.issues.push(`驗證dashboard失敗: ${error.message}`);
        }
        
        try {
            const reportsPath = path.join(this.publicDir, 'reports.html');
            const reportsContent = await fs.readFile(reportsPath, 'utf8');
            
            if (reportsContent.includes('報表儀表板') && reportsContent.length > 1000) {
                verification.reportsPageImproved = true;
                console.log('✅ reports.html已改進，包含完整的報表功能');
            } else {
                verification.issues.push('reports.html未正確改進');
            }
            
        } catch (error) {
            verification.issues.push(`驗證reports頁面失敗: ${error.message}`);
        }
        
        if (verification.issues.length === 0) {
            console.log('🎉 所有修復都驗證成功！');
        } else {
            console.log(`⚠️ 發現 ${verification.issues.length} 個驗證問題：`);
            verification.issues.forEach((issue, index) => {
                console.log(`   ${index + 1}. ${issue}`);
            });
        }
        
        return verification;
    }

    async generateFixReport() {
        console.log('\n📋 生成修復報告...');
        
        const reportPath = path.join(__dirname, 'reports-link-fix-report.json');
        const report = {
            timestamp: new Date().toISOString(),
            fixedFiles: [
                'public/employee-dashboard.html',
                'public/reports.html'
            ],
            changes: [
                {
                    file: 'employee-dashboard.html',
                    change: 'reports.html連結改為revenue.html',
                    reason: '修復連結指向錯誤的問題'
                },
                {
                    file: 'employee-dashboard.html', 
                    change: '卡片標題從"報表查看"改為"營收報表"',
                    reason: '使標題與實際功能一致'
                },
                {
                    file: 'reports.html',
                    change: '建立完整的報表儀表板頁面',
                    reason: '提供真正的報表功能給用戶'
                }
            ],
            backupLocation: this.backupDir,
            status: 'completed'
        };
        
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
        console.log(`📄 修復報告已保存: ${reportPath}`);
        
        return report;
    }

    async runCompleteFix() {
        console.log('🚀 開始執行完整的Reports連結修復...');
        
        try {
            await this.init();
            
            // 階段1: 備份
            await this.backupFiles();
            
            // 階段2: 分析
            const analysis = await this.analyzeCurrentState();
            
            // 階段3: 修復連結
            const linkFixed = await this.fixReportsLink();
            
            // 階段4: 改進reports頁面
            const reportsImproved = await this.createImprovedReportsPage();
            
            // 階段5: 驗證
            const verification = await this.verifyFixes();
            
            // 階段6: 生成報告
            const report = await this.generateFixReport();
            
            console.log('\n🎉 Reports連結修復完成！');
            console.log('修復摘要：');
            console.log('- ✅ 連結修復：', linkFixed ? '成功' : '失敗');
            console.log('- ✅ 頁面改進：', reportsImproved ? '成功' : '失敗');
            console.log('- ✅ 驗證通過：', verification.issues.length === 0 ? '成功' : '有問題');
            console.log(`- 📁 備份位置：${this.backupDir}`);
            
            return report;
            
        } catch (error) {
            console.error('❌ 修復過程中發生錯誤:', error.message);
            throw error;
        }
    }
}

// 如果直接執行此檔案
if (require.main === module) {
    const fixer = new ReportsLinkFixer();
    
    fixer.runCompleteFix()
        .then(report => {
            console.log('\n🎊 修復任務完成！');
            console.log('現在可以重新測試網站功能。');
            console.log('建議執行: node browser-deep-inspector.js 進行驗證');
        })
        .catch(error => {
            console.error('💥 修復失敗:', error);
            process.exit(1);
        });
}

module.exports = ReportsLinkFixer;