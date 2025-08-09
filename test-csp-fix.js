#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testCSPFix() {
    console.log('🧪 驗證 CSP 修復結果...');
    
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    // 監聽控制台錯誤
    const cspErrors = [];
    page.on('console', msg => {
        if (msg.text().includes('Content Security Policy')) {
            cspErrors.push(msg.text());
        }
    });
    
    try {
        await page.goto('http://localhost:3001/login');
        await page.waitForSelector('#login-form');
        
        // 測試標籤切換
        await page.click('.tab:nth-child(2)'); // 註冊標籤
        await new Promise(r => setTimeout(r, 1000));
        await page.click('.tab:nth-child(1)'); // 登入標籤
        
        console.log(`📊 CSP 錯誤數量: ${cspErrors.length}`);
        
        if (cspErrors.length === 0) {
            console.log('✅ CSP 問題已解決！');
        } else {
            console.log('❌ 仍存在 CSP 問題:');
            cspErrors.forEach(error => console.log(`   - ${error}`));
        }
        
    } catch (error) {
        console.error('❌ 測試失敗:', error.message);
    } finally {
        await browser.close();
    }
}

testCSPFix().catch(console.error);