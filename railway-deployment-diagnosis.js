/**
 * 🔧 Railway部署問題診斷工具
 */

const https = require('https');
const fs = require('fs');

class RailwayDeploymentDiagnosis {
    constructor() {
        this.baseUrl = 'https://web-production-6eb6.up.railway.app';
        this.issues = [];
        this.solutions = [];
    }

    // 🔍 檢查當前響應
    async checkCurrentResponse() {
        console.log('🔍 檢查Railway當前響應...');
        
        return new Promise((resolve, reject) => {
            https.get(this.baseUrl, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    console.log(`📊 狀態碼: ${res.statusCode}`);
                    console.log(`📄 響應類型: ${res.headers['content-type']}`);
                    console.log(`📝 響應內容 (前200字符): ${data.substring(0, 200)}`);
                    
                    const analysis = {
                        statusCode: res.statusCode,
                        contentType: res.headers['content-type'],
                        content: data,
                        isJson: data.trim().startsWith('{'),
                        isHtml: data.trim().startsWith('<!DOCTYPE') || data.trim().startsWith('<html'),
                        timestamp: new Date().toISOString()
                    };
                    
                    resolve(analysis);
                });
            }).on('error', reject);
        });
    }

    // 🔍 分析問題原因
    analyzeIssues(response) {
        console.log('🔍 分析問題原因...');
        
        if (response.isJson && response.content.includes('Railway版本')) {
            this.issues.push('🚨 關鍵問題: Railway仍在提供JSON響應而非HTML登入頁面');
            this.issues.push('📋 原因分析: server.js的路由修復可能尚未生效');
            
            if (response.content.includes('availableEndpoints')) {
                this.issues.push('⚠️ 服務器回退到錯誤處理模式，表示登入頁面載入失敗');
            }
        }
        
        if (!response.isHtml) {
            this.issues.push('🚨 未檢測到HTML頁面響應');
        }
        
        // 檢查具體的JSON內容
        try {
            const jsonData = JSON.parse(response.content);
            if (jsonData.message && jsonData.message.includes('Railway版本')) {
                this.issues.push('🔍 確認: 正在執行舊版本代碼，新版本尚未部署');
            }
        } catch (e) {
            // 不是JSON，這是好事
        }
    }

    // 💡 生成解決方案
    generateSolutions() {
        console.log('💡 生成解決方案...');
        
        this.solutions = [
            '🔧 立即解決方案1: 檢查Railway控制台部署狀態',
            '🔄 立即解決方案2: 手動觸發重新部署',
            '📁 立即解決方案3: 確認server.js修復是否在正確的檔案路徑',
            '🛠️ 立即解決方案4: 檢查Railway環境變數配置',
            '⚡ 緊急方案: 創建簡化版的直接路由修復'
        ];
    }

    // 🛠️ 創建緊急修復
    createEmergencyFix() {
        console.log('🛠️ 創建緊急修復方案...');
        
        const emergencyServerCode = `
// 🚨 緊急修復: 強制提供登入頁面
app.get('/', (req, res) => {
    console.log('🔍 收到首頁請求，強制提供登入頁面');
    res.send(\`<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>員工登入 - 企業員工管理系統</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh; 
            display: flex; 
            align-items: center; 
            justify-content: center;
            margin: 0;
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
        .logo { text-align: center; margin-bottom: 2rem; }
        .logo h1 { color: #1f2937; font-size: 1.5rem; margin-bottom: 0.5rem; }
        .logo p { color: #6b7280; font-size: 0.875rem; }
        .form-group { margin-bottom: 1rem; }
        label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: #374151; }
        input { 
            width: 100%; 
            padding: 0.75rem; 
            border: 2px solid #e5e7eb; 
            border-radius: 0.5rem; 
            font-size: 1rem; 
            box-sizing: border-box;
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
        .error { color: #dc2626; font-size: 0.875rem; margin-top: 0.5rem; display: none; }
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
            <p>Railway 生產環境 - 緊急修復版</p>
        </div>
        
        <form id="loginForm">
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
            
            <div id="errorMessage" class="error"></div>
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
                console.log('🔐 嘗試登入:', username);
                
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                
                console.log('📊 登入響應狀態:', response.status);
                const data = await response.json();
                console.log('📄 登入響應數據:', data);
                
                if (response.ok && data.user) {
                    console.log('✅ 登入成功，重定向中...');
                    
                    // 根據角色重定向
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
                console.error('❌ 登入錯誤:', error);
                errorDiv.style.display = 'block';
                errorDiv.textContent = '網路錯誤，請稍後再試';
            }
        });
        
        console.log('🚀 登入頁面已載入 - 緊急修復版');
    </script>
</body>
</html>\`);
});`;

        fs.writeFileSync('emergency-login-fix.js', emergencyServerCode);
        console.log('📁 緊急修復代碼已保存: emergency-login-fix.js');
    }

    // 🚀 執行完整診斷
    async runDiagnosis() {
        console.log('🚀 啟動Railway部署問題診斷...');
        
        try {
            // 檢查當前響應
            const response = await this.checkCurrentResponse();
            
            // 分析問題
            this.analyzeIssues(response);
            
            // 生成解決方案
            this.generateSolutions();
            
            // 創建緊急修復
            this.createEmergencyFix();
            
            // 生成診斷報告
            const report = {
                timestamp: new Date().toISOString(),
                url: this.baseUrl,
                currentResponse: response,
                issues: this.issues,
                solutions: this.solutions,
                status: this.issues.length > 0 ? 'PROBLEMS_DETECTED' : 'OK'
            };
            
            // 保存診斷報告
            const reportFile = `railway-diagnosis-${Date.now()}.json`;
            fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
            
            // 輸出診斷結果
            console.log('\n' + '='.repeat(60));
            console.log('🔍 Railway部署診斷報告');
            console.log('='.repeat(60));
            console.log(`📊 狀態: ${report.status}`);
            console.log(`🌐 URL: ${this.baseUrl}`);
            console.log(`📄 當前響應: ${response.isJson ? 'JSON' : 'HTML'}`);
            console.log('\n🚨 發現的問題:');
            this.issues.forEach((issue, i) => console.log(`  ${i+1}. ${issue}`));
            console.log('\n💡 建議解決方案:');
            this.solutions.forEach((solution, i) => console.log(`  ${i+1}. ${solution}`));
            console.log(`\n📁 診斷報告已保存: ${reportFile}`);
            console.log('📁 緊急修復代碼已生成: emergency-login-fix.js');
            console.log('='.repeat(60));
            
            return report;
            
        } catch (error) {
            console.error('❌ 診斷過程失敗:', error);
            return { status: 'DIAGNOSIS_FAILED', error: error.message };
        }
    }
}

// 執行診斷
async function main() {
    const diagnosis = new RailwayDeploymentDiagnosis();
    const result = await diagnosis.runDiagnosis();
    
    if (result.status === 'PROBLEMS_DETECTED') {
        console.log('\n🚨 需要立即處理Railway部署問題！');
        console.log('💡 建議: 檢查Railway控制台或使用緊急修復方案');
    } else if (result.status === 'OK') {
        console.log('\n✅ Railway部署狀態正常');
    }
    
    return result;
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = RailwayDeploymentDiagnosis;