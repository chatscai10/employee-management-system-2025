#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testPageLoad() {
    console.log('🔍 簡單頁面檢查測試...');
    
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 100,
        defaultViewport: { width: 1280, height: 720 }
    });
    
    const page = await browser.newPage();
    
    try {
        console.log('🌐 導航到登入頁面...');
        await page.goto('http://localhost:3001/login', { 
            waitUntil: 'networkidle2', 
            timeout: 30000 
        });
        
        console.log('📋 頁面標題:', await page.title());
        console.log('🔗 當前URL:', page.url());
        
        // 檢查頁面內容
        const bodyHTML = await page.evaluate(() => {
            return document.body.innerHTML.substring(0, 500);
        });
        
        console.log('📄 頁面內容預覽:\n', bodyHTML);
        
        // 尋找所有表單元素
        const forms = await page.$$eval('form', forms => {
            return forms.map((form, index) => ({
                index,
                id: form.id || null,
                className: form.className || null
            }));
        });
        
        console.log('📝 找到的表單:', forms);
        
        // 尋找所有div元素的id
        const divIds = await page.$$eval('div[id]', divs => {
            return divs.map(div => div.id);
        });
        
        console.log('🆔 找到的div id:', divIds);
        
        // 檢查特定選擇器
        const selectors = ['#login-form', '#loginForm', '.form-section', '.login-form'];
        
        for (const selector of selectors) {
            const exists = await page.$(selector) !== null;
            console.log(`🎯 選擇器 ${selector}: ${exists ? '✅ 存在' : '❌ 不存在'}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 5000)); // 等待5秒查看
        
    } catch (error) {
        console.error('❌ 測試錯誤:', error.message);
    } finally {
        await browser.close();
        console.log('🧹 測試完成');
    }
}

testPageLoad().catch(console.error);