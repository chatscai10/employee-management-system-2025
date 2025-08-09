#!/usr/bin/env node

/**
 * CSP問題快速修復腳本
 * 用於修復 Content Security Policy 阻止內聯 JavaScript 執行的問題
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 開始修復 CSP 問題...\n');

// 修復伺服器端CSP設定
function fixServerCSP() {
    console.log('1. 修復伺服器端 CSP 設定...');
    
    const serverPath = path.join(__dirname, 'server', 'server.js');
    
    if (!fs.existsSync(serverPath)) {
        console.log('   ❌ 找不到伺服器文件:', serverPath);
        return false;
    }
    
    let content = fs.readFileSync(serverPath, 'utf8');
    
    // 尋找 helmet CSP 設定
    const cspRegex = /scriptSrc:\s*\[(.*?)\]/s;
    const match = content.match(cspRegex);
    
    if (match) {
        const newCSP = `scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-hashes'"],
                scriptSrcAttr: ["'self'", "'unsafe-inline'"]`;
        
        content = content.replace(cspRegex, newCSP);
        
        fs.writeFileSync(serverPath, content);
        console.log('   ✅ CSP 設定已更新');
        console.log('   📝 添加了 unsafe-inline 和 scriptSrcAttr 支持');
        return true;
    } else {
        console.log('   ⚠️ 找不到 CSP 設定區塊');
        return false;
    }
}

// 創建無內聯事件的登入頁面版本
function createCleanLoginPage() {
    console.log('\n2. 創建清理版登入頁面...');
    
    const loginPath = path.join(__dirname, 'public', 'login.html');
    const cleanLoginPath = path.join(__dirname, 'public', 'login-clean.html');
    
    if (!fs.existsSync(loginPath)) {
        console.log('   ❌ 找不到原始登入頁面');
        return false;
    }
    
    let content = fs.readFileSync(loginPath, 'utf8');
    
    // 移除內聯事件處理器
    content = content.replace(/onclick="[^"]*"/g, '');
    content = content.replace(/onsubmit="[^"]*"/g, '');
    
    // 添加事件監聽器腳本
    const eventScript = `
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // 標籤切換功能
            document.querySelectorAll('.tab').forEach(tab => {
                tab.addEventListener('click', function() {
                    const tabType = this.textContent.trim() === '登入' ? 'login' : 'register';
                    switchTab(tabType);
                });
            });
            
            // 表單提交處理
            document.querySelector('#login-form form').addEventListener('submit', handleLogin);
            document.querySelector('#register-form form').addEventListener('submit', handleRegister);
        });
    </script>`;
    
    content = content.replace('</body>', eventScript + '\n</body>');
    
    fs.writeFileSync(cleanLoginPath, content);
    console.log('   ✅ 清理版登入頁面已創建: login-clean.html');
    return true;
}

// 生成測試驗證腳本
function createTestVerificationScript() {
    console.log('\n3. 創建測試驗證腳本...');
    
    const testScript = `#!/usr/bin/env node

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
        
        console.log(\`📊 CSP 錯誤數量: \${cspErrors.length}\`);
        
        if (cspErrors.length === 0) {
            console.log('✅ CSP 問題已解決！');
        } else {
            console.log('❌ 仍存在 CSP 問題:');
            cspErrors.forEach(error => console.log(\`   - \${error}\`));
        }
        
    } catch (error) {
        console.error('❌ 測試失敗:', error.message);
    } finally {
        await browser.close();
    }
}

testCSPFix().catch(console.error);`;

    fs.writeFileSync(path.join(__dirname, 'test-csp-fix.js'), testScript);
    console.log('   ✅ 測試驗證腳本已創建: test-csp-fix.js');
}

// 主要修復流程
async function main() {
    let serverFixed = false;
    let pageCreated = false;
    
    try {
        serverFixed = fixServerCSP();
        pageCreated = createCleanLoginPage();
        createTestVerificationScript();
        
        console.log('\n📋 修復摘要:');
        console.log(`   伺服器 CSP 設定: ${serverFixed ? '✅ 已修復' : '❌ 失敗'}`);
        console.log(`   清理版登入頁面: ${pageCreated ? '✅ 已創建' : '❌ 失敗'}`);
        console.log(`   測試驗證腳本: ✅ 已創建`);
        
        if (serverFixed || pageCreated) {
            console.log('\n🚀 下一步操作:');
            console.log('   1. 重新啟動伺服器');
            console.log('   2. 運行測試: node test-csp-fix.js');
            console.log('   3. 重新執行角色驗證測試');
        }
        
    } catch (error) {
        console.error('❌ 修復過程發生錯誤:', error.message);
    }
}

// 執行修復
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { fixServerCSP, createCleanLoginPage };