const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class BrowserDeepInspector {
    constructor() {
        this.browser = null;
        this.page = null;
        this.baseUrl = 'https://employee-management-system-intermediate.onrender.com';
        this.reportDir = path.join(__dirname, 'inspection-reports');
        this.screenshotDir = path.join(this.reportDir, 'screenshots');
    }

    async init() {
        console.log('🚀 啟動Puppeteer瀏覽器深度檢查系統...');
        
        // 建立報告目錄
        await this.ensureDirectories();
        
        // 啟動瀏覽器
        this.browser = await puppeteer.launch({
            headless: false, // 顯示瀏覽器窗口以便觀察
            defaultViewport: { width: 1280, height: 800 },
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        this.page = await this.browser.newPage();
        
        // 設置用戶代理
        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        
        console.log('✅ 瀏覽器啟動完成');
    }

    async ensureDirectories() {
        try {
            await fs.mkdir(this.reportDir, { recursive: true });
            await fs.mkdir(this.screenshotDir, { recursive: true });
        } catch (error) {
            console.log('目錄已存在或建立完成');
        }
    }

    async inspectHomePage() {
        console.log('\n📊 階段1: 主頁深度分析...');
        
        try {
            await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });
            
            // 等待頁面完全載入
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // 截圖
            await this.page.screenshot({ 
                path: path.join(this.screenshotDir, '1-homepage.png'),
                fullPage: true 
            });
            
            // 獲取頁面標題
            const title = await this.page.title();
            console.log(`📄 頁面標題: ${title}`);
            
            // 檢查所有連結和按鈕
            const links = await this.page.evaluate(() => {
                const allLinks = [];
                
                // 獲取所有a標籤
                const anchors = document.querySelectorAll('a');
                anchors.forEach((link, index) => {
                    allLinks.push({
                        type: 'link',
                        index: index,
                        text: link.textContent.trim(),
                        href: link.href,
                        className: link.className,
                        id: link.id
                    });
                });
                
                // 獲取所有按鈕
                const buttons = document.querySelectorAll('button');
                buttons.forEach((btn, index) => {
                    allLinks.push({
                        type: 'button',
                        index: index,
                        text: btn.textContent.trim(),
                        onclick: btn.onclick ? btn.onclick.toString() : null,
                        className: btn.className,
                        id: btn.id
                    });
                });
                
                // 獲取具有onclick的div或其他元素
                const clickables = document.querySelectorAll('[onclick]');
                clickables.forEach((elem, index) => {
                    if (elem.tagName !== 'BUTTON' && elem.tagName !== 'A') {
                        allLinks.push({
                            type: 'clickable',
                            tagName: elem.tagName,
                            index: index,
                            text: elem.textContent.trim(),
                            onclick: elem.onclick ? elem.onclick.toString() : null,
                            className: elem.className,
                            id: elem.id
                        });
                    }
                });
                
                return allLinks;
            });
            
            console.log(`🔗 找到 ${links.length} 個可點擊元素`);
            
            // 檢查reports.html連結
            const reportsLinks = links.filter(link => 
                (link.href && link.href.includes('reports.html')) ||
                (link.onclick && link.onclick.includes('reports.html'))
            );
            
            console.log(`⚠️ 找到 ${reportsLinks.length} 個指向reports.html的連結`);
            
            return {
                title,
                links,
                reportsLinks,
                screenshot: '1-homepage.png'
            };
            
        } catch (error) {
            console.error('❌ 主頁檢查失敗:', error.message);
            return { error: error.message };
        }
    }

    async testAllLinks(links) {
        console.log('\n🔍 階段2: 測試所有連結和按鈕...');
        
        const testResults = [];
        
        for (let i = 0; i < Math.min(links.length, 10); i++) { // 限制測試前10個連結
            const link = links[i];
            console.log(`測試連結 ${i+1}: ${link.text || 'No Text'}`);
            
            try {
                if (link.type === 'link' && link.href && !link.href.includes('javascript:')) {
                    // 測試普通連結
                    const currentUrl = this.page.url();
                    await this.page.click(`a[href="${link.href}"]`);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    const newUrl = this.page.url();
                    const screenshot = `link-test-${i+1}.png`;
                    await this.page.screenshot({ 
                        path: path.join(this.screenshotDir, screenshot)
                    });
                    
                    testResults.push({
                        ...link,
                        testResult: 'success',
                        originalUrl: currentUrl,
                        resultUrl: newUrl,
                        screenshot: screenshot
                    });
                    
                    // 返回主頁
                    await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                
            } catch (error) {
                console.error(`❌ 測試連結失敗: ${error.message}`);
                testResults.push({
                    ...link,
                    testResult: 'failed',
                    error: error.message
                });
            }
        }
        
        return testResults;
    }

    async getHTMLSource() {
        console.log('\n📄 階段3: 獲取HTML源碼分析...');
        
        try {
            await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
            
            const htmlContent = await this.page.content();
            
            // 保存完整HTML
            await fs.writeFile(
                path.join(this.reportDir, 'homepage-source.html'),
                htmlContent,
                'utf8'
            );
            
            // 搜尋reports.html相關內容
            const reportsReferences = [];
            const lines = htmlContent.split('\n');
            
            lines.forEach((line, index) => {
                if (line.includes('reports.html')) {
                    reportsReferences.push({
                        lineNumber: index + 1,
                        content: line.trim()
                    });
                }
            });
            
            console.log(`📋 在HTML中找到 ${reportsReferences.length} 處reports.html引用`);
            
            return {
                htmlLength: htmlContent.length,
                reportsReferences,
                saved: 'homepage-source.html'
            };
            
        } catch (error) {
            console.error('❌ HTML分析失敗:', error.message);
            return { error: error.message };
        }
    }

    async inspectReportsPage() {
        console.log('\n📊 階段4: 檢查reports.html頁面...');
        
        try {
            const reportsUrl = `${this.baseUrl}/reports.html`;
            
            console.log(`🌐 訪問: ${reportsUrl}`);
            await this.page.goto(reportsUrl, { waitUntil: 'networkidle2', timeout: 30000 });
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // 截圖
            await this.page.screenshot({ 
                path: path.join(this.screenshotDir, '4-reports-page.png'),
                fullPage: true 
            });
            
            // 獲取頁面內容
            const pageInfo = await this.page.evaluate(() => {
                return {
                    title: document.title,
                    bodyText: document.body.textContent.trim(),
                    hasContent: document.body.children.length > 0,
                    elementCount: document.querySelectorAll('*').length
                };
            });
            
            // 獲取reports頁面HTML源碼
            const reportsHtml = await this.page.content();
            await fs.writeFile(
                path.join(this.reportDir, 'reports-page-source.html'),
                reportsHtml,
                'utf8'
            );
            
            console.log(`📄 Reports頁面標題: ${pageInfo.title}`);
            console.log(`📊 頁面元素數量: ${pageInfo.elementCount}`);
            
            return {
                ...pageInfo,
                url: reportsUrl,
                screenshot: '4-reports-page.png',
                htmlSaved: 'reports-page-source.html'
            };
            
        } catch (error) {
            console.error('❌ Reports頁面檢查失敗:', error.message);
            
            // 如果頁面不存在，嘗試檢查404錯誤
            await this.page.screenshot({ 
                path: path.join(this.screenshotDir, '4-reports-page-error.png'),
                fullPage: true 
            });
            
            return { 
                error: error.message, 
                screenshot: '4-reports-page-error.png' 
            };
        }
    }

    async analyzeNavigation() {
        console.log('\n🧭 階段5: 分析導航結構...');
        
        try {
            await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
            
            const navigationInfo = await this.page.evaluate(() => {
                const nav = {
                    navbar: [],
                    sidebar: [],
                    cards: [],
                    forms: []
                };
                
                // 檢查導航欄
                const navbars = document.querySelectorAll('nav, .navbar, .navigation');
                navbars.forEach(navbar => {
                    const links = navbar.querySelectorAll('a');
                    links.forEach(link => {
                        nav.navbar.push({
                            text: link.textContent.trim(),
                            href: link.href,
                            className: link.className
                        });
                    });
                });
                
                // 檢查側邊欄
                const sidebars = document.querySelectorAll('.sidebar, .side-menu, aside');
                sidebars.forEach(sidebar => {
                    const links = sidebar.querySelectorAll('a');
                    links.forEach(link => {
                        nav.sidebar.push({
                            text: link.textContent.trim(),
                            href: link.href,
                            className: link.className
                        });
                    });
                });
                
                // 檢查卡片或按鈕
                const cards = document.querySelectorAll('.card, .btn, .button');
                cards.forEach(card => {
                    if (card.tagName === 'A' || card.onclick) {
                        nav.cards.push({
                            text: card.textContent.trim(),
                            href: card.href,
                            onclick: card.onclick ? card.onclick.toString() : null,
                            className: card.className
                        });
                    }
                });
                
                // 檢查表單
                const forms = document.querySelectorAll('form');
                forms.forEach(form => {
                    nav.forms.push({
                        action: form.action,
                        method: form.method,
                        className: form.className
                    });
                });
                
                return nav;
            });
            
            return navigationInfo;
            
        } catch (error) {
            console.error('❌ 導航分析失敗:', error.message);
            return { error: error.message };
        }
    }

    async generateReport(results) {
        console.log('\n📋 生成詳細檢查報告...');
        
        const report = {
            timestamp: new Date().toISOString(),
            baseUrl: this.baseUrl,
            results: results,
            summary: {
                totalIssues: 0,
                criticalIssues: 0,
                recommendations: []
            }
        };
        
        // 分析問題並生成建議
        if (results.homepage && results.homepage.reportsLinks) {
            const reportsCount = results.homepage.reportsLinks.length;
            if (reportsCount > 1) {
                report.summary.criticalIssues++;
                report.summary.totalIssues += reportsCount;
                report.summary.recommendations.push({
                    issue: `發現 ${reportsCount} 個連結錯誤指向reports.html`,
                    solution: '需要修正這些連結指向正確的功能頁面',
                    priority: 'high'
                });
            }
        }
        
        if (results.reportsPage && results.reportsPage.error) {
            report.summary.criticalIssues++;
            report.summary.totalIssues++;
            report.summary.recommendations.push({
                issue: 'reports.html頁面無法正常訪問',
                solution: '需要建立正確的reports頁面或修正連結指向',
                priority: 'high'
            });
        }
        
        // 保存報告
        await fs.writeFile(
            path.join(this.reportDir, 'inspection-report.json'),
            JSON.stringify(report, null, 2),
            'utf8'
        );
        
        // 生成可讀的報告
        const readableReport = this.generateReadableReport(report);
        await fs.writeFile(
            path.join(this.reportDir, 'inspection-report.txt'),
            readableReport,
            'utf8'
        );
        
        return report;
    }

    generateReadableReport(report) {
        let output = '';
        output += '=' .repeat(80) + '\n';
        output += '          企業員工管理系統 - 深度瀏覽器檢查報告\n';
        output += '=' .repeat(80) + '\n';
        output += `檢查時間: ${new Date(report.timestamp).toLocaleString('zh-TW')}\n`;
        output += `目標網站: ${report.baseUrl}\n\n`;
        
        output += '📊 檢查摘要\n';
        output += '-' .repeat(40) + '\n';
        output += `總問題數: ${report.summary.totalIssues}\n`;
        output += `嚴重問題: ${report.summary.criticalIssues}\n\n`;
        
        output += '🔍 詳細發現\n';
        output += '-' .repeat(40) + '\n';
        
        if (report.results.homepage) {
            output += `主頁標題: ${report.results.homepage.title || 'N/A'}\n`;
            output += `總連結數: ${report.results.homepage.links ? report.results.homepage.links.length : 0}\n`;
            output += `reports.html連結: ${report.results.homepage.reportsLinks ? report.results.homepage.reportsLinks.length : 0}\n\n`;
        }
        
        if (report.results.htmlAnalysis && report.results.htmlAnalysis.reportsReferences) {
            output += 'HTML源碼中的reports.html引用:\n';
            report.results.htmlAnalysis.reportsReferences.forEach(ref => {
                output += `  Line ${ref.lineNumber}: ${ref.content}\n`;
            });
            output += '\n';
        }
        
        output += '💡 修復建議\n';
        output += '-' .repeat(40) + '\n';
        report.summary.recommendations.forEach((rec, index) => {
            output += `${index + 1}. [${rec.priority.toUpperCase()}] ${rec.issue}\n`;
            output += `   解決方案: ${rec.solution}\n\n`;
        });
        
        output += '📁 生成的檔案\n';
        output += '-' .repeat(40) + '\n';
        output += '- homepage-source.html (主頁HTML源碼)\n';
        output += '- reports-page-source.html (Reports頁面源碼)\n';
        output += '- screenshots/ (所有截圖檔案)\n';
        output += '- inspection-report.json (詳細JSON報告)\n';
        
        return output;
    }

    async runCompleteInspection() {
        console.log('🏁 開始完整的瀏覽器深度檢查...');
        
        try {
            await this.init();
            
            const results = {};
            
            // 階段1: 主頁分析
            results.homepage = await this.inspectHomePage();
            
            // 階段2: 連結測試 (如果主頁分析成功)
            if (results.homepage && results.homepage.links) {
                results.linkTests = await this.testAllLinks(results.homepage.links);
            }
            
            // 階段3: HTML源碼分析
            results.htmlAnalysis = await this.getHTMLSource();
            
            // 階段4: Reports頁面檢查
            results.reportsPage = await this.inspectReportsPage();
            
            // 階段5: 導航分析
            results.navigation = await this.analyzeNavigation();
            
            // 生成最終報告
            const finalReport = await this.generateReport(results);
            
            console.log('\n✅ 完整檢查完成！');
            console.log(`📁 報告保存位置: ${this.reportDir}`);
            console.log(`📊 發現 ${finalReport.summary.totalIssues} 個問題`);
            console.log(`🚨 其中 ${finalReport.summary.criticalIssues} 個為嚴重問題`);
            
            return finalReport;
            
        } catch (error) {
            console.error('❌ 檢查過程中發生錯誤:', error.message);
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
    const inspector = new BrowserDeepInspector();
    
    inspector.runCompleteInspection()
        .then(report => {
            console.log('\n🎉 檢查報告生成完成！');
            console.log('檢查以下檔案查看詳細結果:');
            console.log('- inspection-reports/inspection-report.txt');
            console.log('- inspection-reports/screenshots/');
        })
        .catch(error => {
            console.error('💥 檢查失敗:', error);
            process.exit(1);
        });
}

module.exports = BrowserDeepInspector;