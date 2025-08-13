/**
 * 🔧 修復Railway生產環境登入頁面問題
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

// 檢查文件是否存在
function checkFileExists(filePath) {
    try {
        return fs.existsSync(filePath);
    } catch (error) {
        return false;
    }
}

// 診斷Railway部署問題
function diagnoseRailwayIssue() {
    console.log('🔍 診斷Railway部署問題...');
    
    const serverDir = path.join(__dirname, 'server');
    const publicDir = path.join(__dirname, 'public');
    const loginFile = path.join(publicDir, 'login.html');
    
    console.log('📁 檢查目錄結構:');
    console.log(`  Server目錄: ${checkFileExists(serverDir) ? '✅' : '❌'} ${serverDir}`);
    console.log(`  Public目錄: ${checkFileExists(publicDir) ? '✅' : '❌'} ${publicDir}`);
    console.log(`  Login檔案: ${checkFileExists(loginFile) ? '✅' : '❌'} ${loginFile}`);
    
    if (checkFileExists(publicDir)) {
        console.log('\n📂 Public目錄內容:');
        try {
            const publicFiles = fs.readdirSync(publicDir);
            publicFiles.forEach(file => {
                console.log(`  - ${file}`);
            });
        } catch (error) {
            console.log(`  ❌ 無法讀取目錄: ${error.message}`);
        }
    }
    
    // 檢查可能的路徑問題
    const possiblePaths = [
        path.join(__dirname, 'public', 'login.html'),
        path.join(__dirname, '..', 'public', 'login.html'),
        path.join(process.cwd(), 'public', 'login.html'),
        './public/login.html',
        '../public/login.html'
    ];
    
    console.log('\n🔍 檢查可能的登入頁面路徑:');
    possiblePaths.forEach((p, index) => {
        const exists = checkFileExists(p);
        console.log(`  ${index + 1}. ${exists ? '✅' : '❌'} ${p}`);
    });
}

// 創建修復版本的伺服器路由
function createFixedServerRoute() {
    console.log('🔧 創建修復版本的伺服器路由...');
    
    const fixedRouteCode = `
// 📝 修復版本的主頁面路由
app.get('/', (req, res) => {
    try {
        // 嘗試多個可能的路徑
        const possiblePaths = [
            path.join(__dirname, '..', 'public', 'login.html'),
            path.join(process.cwd(), 'public', 'login.html'),
            path.join(__dirname, 'public', 'login.html'),
            './public/login.html'
        ];
        
        let loginFilePath = null;
        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                loginFilePath = p;
                break;
            }
        }
        
        if (loginFilePath) {
            logger.info(\`✅ 找到登入頁面: \${loginFilePath}\`);
            res.sendFile(path.resolve(loginFilePath));
        } else {
            // 如果找不到檔案，返回簡單的HTML登入頁面
            logger.warn('⚠️ 找不到login.html，返回內建登入頁面');
            res.send(\`
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>員工登入 - 企業員工管理系統</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh; 
            display: flex; 
            align-items: center; 
            justify-content: center;
            padding: 1rem;
        }
        .container { 
            background: white; 
            padding: 2rem; 
            border-radius: 1rem; 
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            max-width: 400px; 
            width: 100%; 
        }
        .form-group { margin-bottom: 1rem; }
        label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: #374151; }
        input { 
            width: 100%; 
            padding: 0.75rem; 
            border: 2px solid #e5e7eb; 
            border-radius: 0.5rem; 
            font-size: 1rem; 
        }
        input:focus { outline: none; border-color: #3b82f6; }
        button { 
            width: 100%; 
            background: #3b82f6; 
            color: white; 
            border: none; 
            padding: 0.75rem; 
            border-radius: 0.5rem; 
            font-size: 1rem; 
            cursor: pointer; 
        }
        button:hover { background: #2563eb; }
        .logo { text-align: center; margin-bottom: 2rem; }
        .logo h1 { color: #1f2937; font-size: 1.5rem; margin-bottom: 0.5rem; }
        .logo p { color: #6b7280; font-size: 0.875rem; }
        .error { color: #dc2626; font-size: 0.875rem; margin-top: 0.5rem; }
        .test-accounts { 
            margin-top: 1rem; 
            padding: 1rem; 
            background: #f3f4f6; 
            border-radius: 0.5rem; 
            font-size: 0.875rem; 
        }
        .test-accounts h3 { margin-bottom: 0.5rem; color: #374151; }
        .test-accounts p { margin-bottom: 0.25rem; color: #6b7280; }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <h1>🏢 企業員工管理系統</h1>
            <p>Railway 生產環境 v2.0</p>
        </div>
        
        <form id="loginForm" action="/api/auth/login" method="POST">
            <div class="form-group">
                <label for="username">帳號:</label>
                <input type="text" id="username" name="username" required 
                       placeholder="請輸入您的帳號" autocomplete="username">
            </div>
            
            <div class="form-group">
                <label for="password">密碼:</label>
                <input type="password" id="password" name="password" required 
                       placeholder="請輸入您的密碼" autocomplete="current-password">
            </div>
            
            <button type="submit" id="loginBtn">🔐 登入系統</button>
            
            <div id="errorMessage" class="error" style="display: none;"></div>
        </form>
        
        <div class="test-accounts">
            <h3>🧪 測試帳號:</h3>
            <p><strong>管理員:</strong> admin / admin123</p>
            <p><strong>店長:</strong> manager / manager123</p>
            <p><strong>員工:</strong> employee / employee123</p>
            <p><strong>實習生:</strong> intern / intern123</p>
        </div>
    </div>
    
    <script>
        document.getElementById('loginForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const errorDiv = document.getElementById('errorMessage');
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // 登入成功，重定向到適當的頁面
                    if (data.user.role === 'admin') {
                        window.location.href = '/admin.html';
                    } else {
                        window.location.href = '/employee-dashboard.html';
                    }
                } else {
                    errorDiv.style.display = 'block';
                    errorDiv.textContent = data.message || '登入失敗，請檢查您的帳號密碼';
                }
            } catch (error) {
                errorDiv.style.display = 'block';
                errorDiv.textContent = '網路錯誤，請稍後再試';
                console.error('Login error:', error);
            }
        });
    </script>
</body>
</html>
            \`);
        }
    } catch (error) {
        logger.error('❌ 主頁面載入失敗:', error);
        res.status(500).json({
            message: '🏢 企業員工管理系統 - Railway版本',
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString(),
            platform: 'Railway',
            availableEndpoints: {
                health: '/health',
                api_test: '/api/test',
                api_auth: '/api/auth'
            }
        });
    }
});`;

    return fixedRouteCode;
}

// 主診斷函數
function main() {
    console.log('🚀 啟動Railway生產環境診斷與修復...');
    
    // 執行診斷
    diagnoseRailwayIssue();
    
    // 提供修復建議
    console.log('\n💡 修復建議:');
    console.log('1. 檢查server.js中的路徑設定');
    console.log('2. 確保public目錄在正確位置');
    console.log('3. 更新路由邏輯以處理路徑問題');
    
    // 生成修復代碼
    const fixedCode = createFixedServerRoute();
    
    console.log('\n🔧 修復代碼已生成，可以替換server.js中的主頁面路由');
    
    return {
        diagnosis: 'completed',
        fixCode: fixedCode
    };
}

if (require.main === module) {
    main();
}

module.exports = { diagnoseRailwayIssue, createFixedServerRoute };