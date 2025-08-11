/**
 * 🔍 直接瀏覽器檢查工具
 * 檢查頁面實際DOM結構
 */

const puppeteer = require('puppeteer');

async function inspectPage() {
    console.log('🔍 啟動頁面檢查工具...');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized'] 
    });

    const page = await browser.newPage();
    
    try {
        // 訪問admin-enhanced頁面
        console.log('🌐 訪問 admin-enhanced.html...');
        await page.goto('https://employee-management-system-intermediate.onrender.com/admin-enhanced.html');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        // 檢查頁面標題
        const title = await page.title();
        console.log(`📄 頁面標題: ${title}`);
        
        // 檢查是否有導航元素
        const navElements = await page.$$eval('nav a, .nav-link', elements => 
            elements.map(el => ({
                text: el.textContent?.trim(),
                href: el.href,
                dataSection: el.getAttribute('data-section'),
                className: el.className
            }))
        );
        
        console.log('🧭 找到的導航元素:');
        navElements.forEach((el, index) => {
            console.log(`  ${index + 1}. 文字: "${el.text}", data-section: "${el.dataSection}"`);
        });
        
        // 檢查所有按鈕
        const buttons = await page.$$eval('button', elements => 
            elements.map(el => ({
                text: el.textContent?.trim(),
                id: el.id,
                className: el.className,
                onclick: el.getAttribute('onclick')
            }))
        );
        
        console.log('🔘 找到的按鈕:');
        buttons.forEach((btn, index) => {
            if (btn.text) {
                console.log(`  ${index + 1}. "${btn.text}" (id: ${btn.id}, onclick: ${btn.onclick})`);
            }
        });
        
        // 檢查頁面內容區域
        const sections = await page.$$eval('section, .section, [id*="section"]', elements => 
            elements.map(el => ({
                id: el.id,
                className: el.className,
                visible: el.offsetParent !== null
            }))
        );
        
        console.log('📋 找到的區域:');
        sections.forEach((section, index) => {
            console.log(`  ${index + 1}. id: "${section.id}", 可見: ${section.visible}`);
        });
        
        // 等待用戶查看
        console.log('⏸️  瀏覽器將保持開啟10秒供查看...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
    } catch (error) {
        console.error('❌ 檢查過程發生錯誤:', error.message);
    } finally {
        await browser.close();
        console.log('✅ 檢查完成');
    }
}

inspectPage();