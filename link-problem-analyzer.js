const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class LinkProblemAnalyzer {
    constructor() {
        this.browser = null;
        this.page = null;
        this.baseUrl = 'https://employee-management-system-intermediate.onrender.com';
        this.reportDir = path.join(__dirname, 'link-analysis-reports');
    }

    async init() {
        console.log('🔍 啟動連結問題分析器...');
        
        await this.ensureDirectories();
        
        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: { width: 1280, height: 800 },
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        this.page = await this.browser.newPage();
        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        
        console.log('✅ 分析器啟動完成');
    }

    async ensureDirectories() {
        try {
            await fs.mkdir(this.reportDir, { recursive: true });
        } catch (error) {
            console.log('目錄已存在');
        }
    }

    async analyzeAllLinks() {
        console.log('\n🌐 開始分析所有連結問題...');
        
        try {
            await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // 獲取所有連結的詳細信息
            const linkAnalysis = await this.page.evaluate(() => {
                const results = {
                    allLinks: [],
                    problemLinks: [],
                    workingLinks: [],
                    buttonActions: []
                };
                
                // 檢查所有 a 標籤
                const links = document.querySelectorAll('a');
                links.forEach((link, index) => {
                    const linkInfo = {
                        index: index,
                        text: link.textContent.trim(),
                        href: link.href,
                        originalHref: link.getAttribute('href'),
                        className: link.className,
                        id: link.id,
                        target: link.target,
                        exists: !!link.offsetParent, // 檢查元素是否可見
                        isClickable: !link.disabled
                    };
                    
                    results.allLinks.push(linkInfo);
                    
                    // 檢查是否是問題連結
                    if (linkInfo.originalHref === 'reports.html') {
                        results.problemLinks.push({
                            ...linkInfo,
                            issue: 'reports.html連結指向不存在或錯誤的頁面',
                            shouldPointTo: '應該指向正確的報表功能頁面'
                        });
                    }
                });
                
                // 檢查所有按鈕
                const buttons = document.querySelectorAll('button');
                buttons.forEach((btn, index) => {
                    const btnInfo = {
                        index: index,
                        text: btn.textContent.trim(),
                        onclick: btn.onclick ? btn.onclick.toString() : null,
                        className: btn.className,
                        id: btn.id,
                        disabled: btn.disabled,
                        type: btn.type
                    };
                    
                    results.buttonActions.push(btnInfo);
                });
                
                return results;
            });
            
            console.log(`📊 總共找到 ${linkAnalysis.allLinks.length} 個連結`);
            console.log(`⚠️ 發現 ${linkAnalysis.problemLinks.length} 個問題連結`);
            
            return linkAnalysis;
            
        } catch (error) {
            console.error('❌ 連結分析失敗:', error.message);
            return null;
        }
    }

    async testEachPageExistence() {
        console.log('\n🧪 測試每個頁面是否存在...');
        
        const pagesToTest = [
            { name: '主頁', url: '/index.html' },
            { name: '員工檔案', url: '/profile.html' },
            { name: '考勤打卡', url: '/attendance.html' },
            { name: '營收記錄', url: '/revenue.html' },
            { name: '報表頁面', url: '/reports.html' }
        ];
        
        const testResults = [];
        
        for (const pageTest of pagesToTest) {
            console.log(`測試 ${pageTest.name}...`);
            
            try {
                const fullUrl = `${this.baseUrl}${pageTest.url}`;
                const response = await this.page.goto(fullUrl, { 
                    waitUntil: 'networkidle2', 
                    timeout: 15000 
                });
                
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const pageInfo = await this.page.evaluate(() => ({
                    title: document.title,
                    hasContent: document.body.children.length > 5,
                    bodyText: document.body.textContent.substring(0, 200),
                    statusIndicators: {
                        hasNavbar: !!document.querySelector('nav, .navbar'),
                        hasMainContent: !!document.querySelector('main, .container, .content'),
                        hasErrorMessage: document.body.textContent.includes('404') || 
                                       document.body.textContent.includes('Not Found') ||
                                       document.body.textContent.includes('系統連接失敗')
                    }
                }));
                
                testResults.push({
                    ...pageTest,
                    status: response.status(),
                    success: response.ok(),
                    pageInfo: pageInfo,
                    screenshot: `${pageTest.name.replace(/\s+/g, '-')}.png`
                });
                
                // 截圖
                await this.page.screenshot({
                    path: path.join(this.reportDir, `${pageTest.name.replace(/\s+/g, '-')}.png`),
                    fullPage: true
                });
                
            } catch (error) {
                testResults.push({
                    ...pageTest,
                    status: 'error',
                    success: false,
                    error: error.message
                });
            }
        }
        
        return testResults;
    }

    async analyzeNavigationLogic() {
        console.log('\n🧭 分析導航邏輯問題...');
        
        try {
            await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
            
            const navigationAnalysis = await this.page.evaluate(() => {
                const analysis = {
                    cardMappings: [],
                    duplicateLinks: [],
                    missingPages: [],
                    recommendations: []
                };
                
                // 分析卡片功能映射
                const cards = document.querySelectorAll('.card');
                cards.forEach((card, index) => {
                    const title = card.querySelector('.card-title')?.textContent || 'Unknown';
                    const link = card.querySelector('a');
                    
                    if (link) {
                        const mapping = {
                            cardTitle: title,
                            linkText: link.textContent.trim(),
                            href: link.getAttribute('href'),
                            fullHref: link.href,
                            expectedFunction: title
                        };
                        
                        analysis.cardMappings.push(mapping);
                        
                        // 檢查是否連結不匹配
                        if (title === '報表查看' && mapping.href === 'reports.html') {
                            analysis.missingPages.push({
                                cardTitle: title,
                                issue: 'reports.html頁面不是真正的報表功能',
                                suggestion: '應該建立真正的報表頁面或修改連結指向'
                            });
                        }
                    }
                });
                
                // 檢查重複連結
                const allHrefs = Array.from(document.querySelectorAll('a')).map(a => a.getAttribute('href'));
                const hrefCounts = {};
                allHrefs.forEach(href => {
                    hrefCounts[href] = (hrefCounts[href] || 0) + 1;
                });
                
                Object.entries(hrefCounts).forEach(([href, count]) => {
                    if (count > 1 && href !== '#' && href !== null) {
                        analysis.duplicateLinks.push({
                            href: href,
                            count: count,
                            elements: Array.from(document.querySelectorAll(`a[href="${href}"]`))
                                         .map(el => el.textContent.trim())
                        });
                    }
                });
                
                return analysis;
            });
            
            return navigationAnalysis;
            
        } catch (error) {
            console.error('❌ 導航邏輯分析失敗:', error.message);
            return null;
        }
    }

    async generateDetailedReport(linkAnalysis, pageTests, navigationAnalysis) {
        console.log('\n📋 生成詳細問題報告...');
        
        const report = {
            timestamp: new Date().toISOString(),
            baseUrl: this.baseUrl,
            summary: {
                totalLinks: linkAnalysis ? linkAnalysis.allLinks.length : 0,
                problemLinks: linkAnalysis ? linkAnalysis.problemLinks.length : 0,
                workingPages: pageTests ? pageTests.filter(p => p.success).length : 0,
                totalPages: pageTests ? pageTests.length : 0
            },
            findings: {
                linkAnalysis: linkAnalysis,
                pageTests: pageTests,
                navigationAnalysis: navigationAnalysis
            },
            criticalIssues: [],
            recommendations: []
        };
        
        // 分析嚴重問題
        if (linkAnalysis && linkAnalysis.problemLinks.length > 0) {
            report.criticalIssues.push({
                type: 'broken_links',
                description: `發現 ${linkAnalysis.problemLinks.length} 個問題連結`,
                impact: 'high',
                links: linkAnalysis.problemLinks
            });
        }
        
        if (pageTests) {
            const brokenPages = pageTests.filter(p => !p.success || 
                (p.pageInfo && p.pageInfo.statusIndicators.hasErrorMessage));
            
            if (brokenPages.length > 0) {
                report.criticalIssues.push({
                    type: 'broken_pages',
                    description: `發現 ${brokenPages.length} 個頁面問題`,
                    impact: 'high',
                    pages: brokenPages
                });
            }
        }
        
        // 生成修復建議
        if (linkAnalysis && linkAnalysis.problemLinks.some(link => link.originalHref === 'reports.html')) {
            report.recommendations.push({
                priority: 'high',
                issue: 'reports.html連結問題',
                description: '主頁的"查看報表"按鈕指向reports.html，但該頁面不是真正的報表功能',
                solutions: [
                    '方案1: 建立真正的報表功能頁面（推薦）',
                    '方案2: 修改連結指向現有的營收頁面 (revenue.html)',
                    '方案3: 將reports.html改造成真正的報表功能頁面'
                ],
                codeExample: `<!-- 修復方案 -->
<a href="revenue.html" class="btn btn-light">查看報表</a>
<!-- 或者 -->
<a href="dashboard.html" class="btn btn-light">查看報表</a>`
            });
        }
        
        // 保存報告
        await fs.writeFile(
            path.join(this.reportDir, 'detailed-link-analysis.json'),
            JSON.stringify(report, null, 2),
            'utf8'
        );
        
        // 生成可讀報告
        const readableReport = this.generateReadableReport(report);
        await fs.writeFile(
            path.join(this.reportDir, 'link-problem-analysis.txt'),
            readableReport,
            'utf8'
        );
        
        return report;
    }

    generateReadableReport(report) {
        let output = '';
        
        output += '=' .repeat(80) + '\n';
        output += '        企業員工管理系統 - 連結問題深度分析報告\n';
        output += '=' .repeat(80) + '\n';
        output += `分析時間: ${new Date(report.timestamp).toLocaleString('zh-TW')}\n`;
        output += `目標網站: ${report.baseUrl}\n\n`;
        
        output += '📊 問題摘要\n';
        output += '-' .repeat(40) + '\n';
        output += `總連結數: ${report.summary.totalLinks}\n`;
        output += `問題連結: ${report.summary.problemLinks}\n`;
        output += `可用頁面: ${report.summary.workingPages}/${report.summary.totalPages}\n`;
        output += `嚴重問題: ${report.criticalIssues.length}\n\n`;
        
        if (report.criticalIssues.length > 0) {
            output += '🚨 嚴重問題詳情\n';
            output += '-' .repeat(40) + '\n';
            
            report.criticalIssues.forEach((issue, index) => {
                output += `${index + 1}. ${issue.description}\n`;
                output += `   影響程度: ${issue.impact.toUpperCase()}\n`;
                output += `   類型: ${issue.type}\n\n`;
            });
        }
        
        if (report.findings.linkAnalysis && report.findings.linkAnalysis.problemLinks.length > 0) {
            output += '🔗 問題連結詳細列表\n';
            output += '-' .repeat(40) + '\n';
            
            report.findings.linkAnalysis.problemLinks.forEach((link, index) => {
                output += `${index + 1}. 連結文字: "${link.text}"\n`;
                output += `   href: ${link.originalHref}\n`;
                output += `   問題: ${link.issue}\n`;
                output += `   建議: ${link.shouldPointTo}\n\n`;
            });
        }
        
        if (report.findings.pageTests) {
            output += '📄 頁面測試結果\n';
            output += '-' .repeat(40) + '\n';
            
            report.findings.pageTests.forEach(test => {
                const status = test.success ? '✅' : '❌';
                output += `${status} ${test.name}: ${test.status}\n`;
                
                if (test.pageInfo) {
                    output += `   標題: ${test.pageInfo.title}\n`;
                    output += `   內容狀態: ${test.pageInfo.hasContent ? '正常' : '缺少內容'}\n`;
                    
                    if (test.pageInfo.statusIndicators.hasErrorMessage) {
                        output += `   ⚠️ 包含錯誤訊息\n`;
                    }
                }
                
                if (test.error) {
                    output += `   錯誤: ${test.error}\n`;
                }
                
                output += '\n';
            });
        }
        
        if (report.recommendations.length > 0) {
            output += '💡 詳細修復建議\n';
            output += '-' .repeat(40) + '\n';
            
            report.recommendations.forEach((rec, index) => {
                output += `${index + 1}. [${rec.priority.toUpperCase()}] ${rec.issue}\n`;
                output += `問題描述: ${rec.description}\n\n`;
                
                output += `修復方案:\n`;
                rec.solutions.forEach((solution, i) => {
                    output += `  ${i + 1}. ${solution}\n`;
                });
                
                if (rec.codeExample) {
                    output += `\n程式碼範例:\n`;
                    output += rec.codeExample + '\n';
                }
                
                output += '\n' + '-'.repeat(40) + '\n';
            });
        }
        
        return output;
    }

    async runCompleteAnalysis() {
        console.log('🏁 開始完整的連結問題分析...');
        
        try {
            await this.init();
            
            // 階段1: 分析所有連結
            const linkAnalysis = await this.analyzeAllLinks();
            
            // 階段2: 測試每個頁面
            const pageTests = await this.testEachPageExistence();
            
            // 階段3: 分析導航邏輯
            const navigationAnalysis = await this.analyzeNavigationLogic();
            
            // 生成最終報告
            const finalReport = await this.generateDetailedReport(linkAnalysis, pageTests, navigationAnalysis);
            
            console.log('\n✅ 連結問題分析完成！');
            console.log(`📁 報告保存位置: ${this.reportDir}`);
            console.log(`🚨 發現 ${finalReport.criticalIssues.length} 個嚴重問題`);
            console.log(`📋 提供 ${finalReport.recommendations.length} 個修復建議`);
            
            return finalReport;
            
        } catch (error) {
            console.error('❌ 分析過程中發生錯誤:', error.message);
            throw error;
            
        } finally {
            if (this.browser) {
                await this.browser.close();
                console.log('🔚 瀏覽器已關閉');
            }
        }
    }
}

// 如果直接執行此檔案
if (require.main === module) {
    const analyzer = new LinkProblemAnalyzer();
    
    analyzer.runCompleteAnalysis()
        .then(report => {
            console.log('\n🎉 連結問題分析報告生成完成！');
            console.log('查看以下檔案獲取詳細結果:');
            console.log('- link-analysis-reports/link-problem-analysis.txt');
            console.log('- link-analysis-reports/detailed-link-analysis.json');
        })
        .catch(error => {
            console.error('💥 分析失敗:', error);
            process.exit(1);
        });
}

module.exports = LinkProblemAnalyzer;