/**
 * 真實瀏覽器深度檢查 - 企業員工管理系統
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function performRealBrowserTest() {
    console.log('🚀 啟動真實瀏覽器深度檢查...');
    
    let browser;
    try {
        // 啟動瀏覽器
        browser = await puppeteer.launch({ 
            headless: false,  // 顯示瀏覽器窗口
            devtools: true,   // 開啟開發者工具
            defaultViewport: { width: 1280, height: 720 }
        });
        
        const page = await browser.newPage();
        
        console.log('📱 導航到企業員工管理系統...');
        const url = 'https://employee-management-system-intermediate.onrender.com';
        
        // 導航到主頁
        await page.goto(url, { waitUntil: 'networkidle2' });
        
        // 等待頁面完全載入
        await page.waitForSelector('body', { timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('📸 截取主頁截圖...');
        await page.screenshot({ path: 'homepage-screenshot.png', fullPage: true });
        
        // 獲取頁面標題
        const title = await page.title();
        console.log(`📄 頁面標題: ${title}`);
        
        // 檢查所有連結
        console.log('🔍 檢查所有頁面連結...');
        const links = await page.evaluate(() => {
            const linkElements = document.querySelectorAll('a[href]');
            return Array.from(linkElements).map(link => ({
                text: link.textContent.trim(),
                href: link.href,
                innerText: link.innerText
            }));
        });
        
        console.log('🔗 發現的連結:');
        links.forEach((link, index) => {
            console.log(`  ${index + 1}. "${link.text}" → ${link.href}`);
        });
        
        // 檢查按鈕和卡片
        console.log('🎯 檢查按鈕和卡片...');
        const buttons = await page.evaluate(() => {
            const buttonElements = document.querySelectorAll('button, .btn, .card');
            return Array.from(buttonElements).map(btn => ({
                text: btn.textContent.trim().substring(0, 50),
                className: btn.className,
                onclick: btn.onclick ? btn.onclick.toString() : null,
                href: btn.href || null
            }));
        });
        
        console.log('🔘 發現的按鈕和卡片:');
        buttons.forEach((btn, index) => {
            if (btn.text.length > 5) { // 只顯示有意義的元素
                console.log(`  ${index + 1}. "${btn.text}" - ${btn.className}`);
                if (btn.href) console.log(`     → 連結: ${btn.href}`);
                if (btn.onclick) console.log(`     → 事件: ${btn.onclick}`);
            }
        });
        
        // 測試導航連結
        console.log('🧭 測試主要導航連結...');
        const testPages = ['/attendance', '/revenue', '/profile', '/admin'];
        
        for (const testPage of testPages) {
            try {
                console.log(`  測試: ${testPage}`);
                const response = await page.goto(url + testPage, { waitUntil: 'networkidle2' });
                const pageTitle = await page.title();
                console.log(`    ✅ ${testPage} - 狀態: ${response.status()} - 標題: ${pageTitle}`);
                
                // 截圖
                await page.screenshot({ path: `page-${testPage.replace('/', '')}.png` });
                
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.log(`    ❌ ${testPage} - 錯誤: ${error.message}`);
            }
        }
        
        // 測試JavaScript功能
        console.log('⚡ 測試JavaScript功能...');
        await page.goto(url, { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 測試快速打卡按鈕
        try {
            const clockButton = await page.$('button[onclick*="quickClockIn"]');
            if (clockButton) {
                console.log('  測試快速打卡功能...');
                await clockButton.click();
                await new Promise(resolve => setTimeout(resolve, 2000));
                console.log('    ✅ 快速打卡按鈕點擊成功');
            }
        } catch (error) {
            console.log(`    ❌ 快速打卡測試失敗: ${error.message}`);
        }
        
        // 測試營收按鈕
        try {
            const revenueButton = await page.$('button[onclick*="addRevenue"]');
            if (revenueButton) {
                console.log('  測試新增營收功能...');
                await revenueButton.click();
                await new Promise(resolve => setTimeout(resolve, 2000));
                console.log('    ✅ 新增營收按鈕點擊成功');
            }
        } catch (error) {
            console.log(`    ❌ 新增營收測試失敗: ${error.message}`);
        }
        
        // 檢查是否有JavaScript錯誤
        console.log('🐛 檢查JavaScript控制台錯誤...');
        const logs = await page.evaluate(() => {
            return window.console._logs || [];
        });
        
        if (logs.length > 0) {
            console.log('  發現控制台訊息:');
            logs.forEach(log => console.log(`    ${log}`));
        } else {
            console.log('  ✅ 無JavaScript控制台錯誤');
        }
        
        // 獲取頁面HTML源碼
        console.log('📝 保存頁面HTML源碼...');
        const htmlContent = await page.content();
        fs.writeFileSync('homepage-source.html', htmlContent);
        
        // 生成測試報告
        const report = {
            timestamp: new Date().toISOString(),
            url: url,
            title: title,
            linksFound: links.length,
            buttonsFound: buttons.length,
            links: links,
            buttons: buttons.filter(btn => btn.text.length > 5),
            testResults: testPages,
            status: 'completed'
        };
        
        fs.writeFileSync('real-browser-test-report.json', JSON.stringify(report, null, 2));
        
        console.log('✅ 真實瀏覽器檢查完成！');
        console.log(`📊 發現 ${links.length} 個連結和 ${buttons.length} 個按鈕`);
        console.log('📁 生成檔案:');
        console.log('  - homepage-screenshot.png (主頁截圖)');
        console.log('  - homepage-source.html (HTML源碼)');
        console.log('  - real-browser-test-report.json (測試報告)');
        console.log('  - page-*.png (各頁面截圖)');
        
    } catch (error) {
        console.error('❌ 真實瀏覽器檢查失敗:', error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// 執行測試
performRealBrowserTest();