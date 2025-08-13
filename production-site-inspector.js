/**
 * 🔍 Railway生產環境網站內容檢查器
 * 用於分析實際的HTML結構和元素
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

class ProductionSiteInspector {
    constructor() {
        this.baseUrl = 'https://web-production-6eb6.up.railway.app';
    }

    async inspectSiteStructure() {
        console.log('🔍 正在檢查Railway生產環境網站結構...');
        
        const browser = await puppeteer.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        try {
            const page = await browser.newPage();
            await page.setViewport({ width: 1920, height: 1080 });
            
            console.log(`🌐 連接到: ${this.baseUrl}`);
            await page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
            
            // 截圖保存
            await page.screenshot({ 
                path: 'production-homepage-inspection.png',
                fullPage: true 
            });
            
            // 分析頁面結構
            const pageAnalysis = await page.evaluate(() => {
                return {
                    title: document.title,
                    url: window.location.href,
                    bodyContent: document.body.innerHTML,
                    
                    // 查找所有可能的登入相關元素
                    loginElements: {
                        forms: Array.from(document.querySelectorAll('form')).map(form => ({
                            id: form.id,
                            className: form.className,
                            action: form.action,
                            method: form.method,
                            innerHTML: form.innerHTML.substring(0, 200) + '...'
                        })),
                        
                        inputs: Array.from(document.querySelectorAll('input')).map(input => ({
                            id: input.id,
                            name: input.name,
                            type: input.type,
                            placeholder: input.placeholder,
                            className: input.className
                        })),
                        
                        buttons: Array.from(document.querySelectorAll('button')).map(button => ({
                            id: button.id,
                            className: button.className,
                            text: button.textContent?.trim(),
                            onclick: button.onclick?.toString() || button.getAttribute('onclick')
                        })),
                        
                        links: Array.from(document.querySelectorAll('a')).map(link => ({
                            href: link.href,
                            text: link.textContent?.trim(),
                            id: link.id,
                            className: link.className
                        }))
                    },
                    
                    // 檢查是否有登入相關文字
                    hasLoginText: document.body.textContent.includes('登入') || 
                                 document.body.textContent.includes('login') ||
                                 document.body.textContent.includes('帳號') ||
                                 document.body.textContent.includes('密碼'),
                    
                    // 檢查頁面類型
                    pageType: (() => {
                        const body = document.body.textContent.toLowerCase();
                        if (body.includes('login') || body.includes('登入')) return 'login';
                        if (body.includes('dashboard') || body.includes('儀表板')) return 'dashboard';
                        if (body.includes('employee') || body.includes('員工')) return 'employee';
                        if (body.includes('admin') || body.includes('管理')) return 'admin';
                        return 'unknown';
                    })(),
                    
                    // 獲取頁面的主要內容
                    mainContent: document.body.textContent.trim()
                };
            });
            
            // 保存完整分析結果
            const analysisFile = 'production-site-analysis.json';
            fs.writeFileSync(analysisFile, JSON.stringify(pageAnalysis, null, 2));
            
            // 保存HTML源碼
            const htmlFile = 'production-homepage-source.html';
            fs.writeFileSync(htmlFile, pageAnalysis.bodyContent);
            
            console.log('📄 分析結果:');
            console.log(`📝 頁面標題: ${pageAnalysis.title}`);
            console.log(`🔗 頁面URL: ${pageAnalysis.url}`);
            console.log(`📋 頁面類型: ${pageAnalysis.pageType}`);
            console.log(`🔐 是否包含登入文字: ${pageAnalysis.hasLoginText}`);
            console.log(`📝 表單數量: ${pageAnalysis.loginElements.forms.length}`);
            console.log(`⌨️ 輸入框數量: ${pageAnalysis.loginElements.inputs.length}`);
            console.log(`🔘 按鈕數量: ${pageAnalysis.loginElements.buttons.length}`);
            console.log(`🔗 連結數量: ${pageAnalysis.loginElements.links.length}`);
            
            console.log('\n🔍 詳細元素分析:');
            
            // 顯示表單詳情
            if (pageAnalysis.loginElements.forms.length > 0) {
                console.log('\n📝 發現的表單:');
                pageAnalysis.loginElements.forms.forEach((form, index) => {
                    console.log(`  表單 ${index + 1}:`);
                    console.log(`    ID: ${form.id || '無'}`);
                    console.log(`    Class: ${form.className || '無'}`);
                    console.log(`    Action: ${form.action || '無'}`);
                    console.log(`    Method: ${form.method || '無'}`);
                });
            }
            
            // 顯示輸入框詳情
            if (pageAnalysis.loginElements.inputs.length > 0) {
                console.log('\n⌨️ 發現的輸入框:');
                pageAnalysis.loginElements.inputs.forEach((input, index) => {
                    console.log(`  輸入框 ${index + 1}:`);
                    console.log(`    ID: ${input.id || '無'}`);
                    console.log(`    Name: ${input.name || '無'}`);
                    console.log(`    Type: ${input.type || '無'}`);
                    console.log(`    Placeholder: ${input.placeholder || '無'}`);
                });
            }
            
            // 顯示按鈕詳情
            if (pageAnalysis.loginElements.buttons.length > 0) {
                console.log('\n🔘 發現的按鈕:');
                pageAnalysis.loginElements.buttons.forEach((button, index) => {
                    console.log(`  按鈕 ${index + 1}:`);
                    console.log(`    ID: ${button.id || '無'}`);
                    console.log(`    Text: ${button.text || '無'}`);
                    console.log(`    Class: ${button.className || '無'}`);
                });
            }
            
            console.log(`\n📁 檔案已保存:`);
            console.log(`  - ${analysisFile}`);
            console.log(`  - ${htmlFile}`);
            console.log(`  - production-homepage-inspection.png`);
            
            return pageAnalysis;
            
        } finally {
            await browser.close();
        }
    }
}

// 執行檢查
async function runInspection() {
    const inspector = new ProductionSiteInspector();
    const analysis = await inspector.inspectSiteStructure();
    
    console.log('\n✅ 網站結構檢查完成！');
    return analysis;
}

if (require.main === module) {
    runInspection().catch(console.error);
}

module.exports = ProductionSiteInspector;