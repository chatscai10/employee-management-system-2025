# 🚀 企業員工管理系統 - 部署指南

## 📋 部署選項概覽

基於系統特性（Node.js + SQLite + 靜態文件），推薦以下部署平台：

### 🥇 推薦選項

## 1. Railway (最推薦)
- **優勢**: 簡單易用、自動部署、免費額度
- **適用**: Node.js應用完美支援
- **部署時間**: 5-10分鐘

### 部署步驟：
```bash
# 1. 安裝Railway CLI (已完成)
npm install -g @railway/cli

# 2. 登入Railway (需要在終端機手動執行)
railway login

# 3. 初始化專案
railway init

# 4. 部署應用
railway up
```

## 2. Render (備選推薦)
- **優勢**: 免費SSL、自動HTTPS、GitHub整合
- **適用**: 靜態和動態應用都支援
- **部署時間**: 10-15分鐘

### 部署步驟：
1. 前往 [render.com](https://render.com)
2. 連接GitHub倉庫
3. 選擇 "Web Service"
4. 設定構建命令: `npm install`
5. 設定啟動命令: `npm start`

## 3. Vercel (靜態優先)
- **優勢**: 極快的CDN、優秀的開發體驗
- **適用**: 前端優化，但也支援Node.js API
- **部署時間**: 3-5分鐘

## 4. Heroku (傳統選擇)
- **優勢**: 成熟平台、豐富的插件
- **缺點**: 免費方案已取消
- **適用**: 企業級應用

---

## 🔧 當前系統部署配置

### 已準備的檔案：
- ✅ `railway.json` - Railway配置
- ✅ `package.json` - Node.js依賴和腳本
- ✅ `.railwayignore` - 部署忽略檔案
- ✅ `deploy-railway.sh` - Linux/Mac部署腳本
- ✅ `deploy-railway.bat` - Windows部署腳本

### 系統特性：
- **後端**: Node.js + Express
- **資料庫**: SQLite (檔案型)
- **前端**: HTML + Bootstrap + JavaScript
- **埠**: 動態配置 (process.env.PORT)
- **靜態檔案**: public/ 目錄

---

## 🌐 推薦部署流程 - Railway

### 步驟1: 手動執行登入
```bash
# 在您的終端機中執行（需要瀏覽器互動）
cd D:\0809
railway login
```

### 步驟2: 初始化專案
```bash
railway init
# 選擇 "Create new project"
# 輸入名稱: enterprise-employee-management
```

### 步驟3: 設置環境變數
```bash
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=your-super-secret-key-here
railway variables set CORS_ORIGIN=*
```

### 步驟4: 部署應用
```bash
railway up
```

---

## 🔧 替代部署方案 - GitHub + Render

如果Railway登入有問題，建議使用Render：

### 步驟1: 推送到GitHub
```bash
# 初始化Git倉庫（如果還沒有）
git init
git add .
git commit -m "企業員工管理系統 - 生產版本"

# 推送到GitHub
git remote add origin https://github.com/yourusername/enterprise-employee-management.git
git branch -M main
git push -u origin main
```

### 步驟2: Render部署
1. 前往 [render.com](https://render.com)
2. 註冊/登入帳號
3. 點擊 "New" → "Web Service"
4. 連接GitHub倉庫
5. 配置設定：
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
   - **Node Version**: 18

---

## 🏥 部署後健康檢查

### 驗證端點：
- `GET /health` - 系統健康狀態
- `GET /api/test` - API測試
- `GET /login.html` - 登入頁面

### 預期回應：
```json
{
  "success": true,
  "message": "系統運行正常",
  "timestamp": "2025-08-12T..."
}
```

---

## 🔐 生產環境安全設定

### 必要環境變數：
```env
NODE_ENV=production
PORT=3000
JWT_SECRET=請設置256位強密碼
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
```

### 可選環境變數：
```env
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
DATABASE_URL=sqlite:./database.sqlite
```

---

## 📊 部署成功指標

- ✅ 應用成功啟動 (200 OK)
- ✅ 靜態檔案正常載入
- ✅ API端點回應正常
- ✅ 資料庫連接成功
- ✅ 登入功能可用

---

## 🚨 故障排除

### 常見問題：

1. **500錯誤**
   - 檢查環境變數設置
   - 查看應用日誌

2. **靜態檔案404**
   - 確認public目錄結構
   - 檢查Express靜態文件配置

3. **資料庫錯誤**
   - 確認SQLite檔案權限
   - 檢查models初始化

### 日誌查看：
```bash
# Railway
railway logs

# Render
# 在Dashboard中查看Logs選項
```

---

**建議**: 由於Railway需要瀏覽器互動登入，建議您：
1. 在本機終端執行 `railway login`
2. 或使用Render作為替代方案
3. 所有部署檔案已準備就緒！

部署成功後，您將獲得一個公開的URL來存取您的企業員工管理系統。