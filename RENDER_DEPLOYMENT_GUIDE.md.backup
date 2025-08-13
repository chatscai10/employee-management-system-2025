# 🚀 Render 部署指南

## 📋 部署前準備

### 1. 確認帳號狀態
- ✅ 已註冊 Render 帳號：https://dashboard.render.com/
- ✅ 已連接 GitHub 帳號

### 2. 推送代碼到 GitHub
```bash
git add .
git commit -m "🚀 準備Render部署 - 完整企業員工管理系統"
git push origin master
```

## 🗄️ 資料庫設置步驟

### Step 1: 創建 PostgreSQL 資料庫
1. 登入 Render Dashboard
2. 點擊 "New +" → "PostgreSQL"
3. 設置資訊：
   - **Name**: `employee-management-db`
   - **Database**: `employee_management`
   - **User**: `emp_user`
   - **Plan**: Free (適用於測試)

### Step 2: 取得資料庫連接資訊
- 資料庫創建完成後，複製 `DATABASE_URL`
- 格式類似：`postgresql://emp_user:xxxxx@dpg-xxxxx/employee_management`

## 🌐 Web服務部署步驟

### Step 1: 創建 Web Service
1. 點擊 "New +" → "Web Service"
2. 連接 GitHub Repository
3. 選擇您的專案倉庫

### Step 2: 配置部署設置
```yaml
Name: employee-management-system
Runtime: Node
Build Command: npm install
Start Command: npm start
```

### Step 3: 環境變數設置
在 Environment 選項卡中設置：

```bash
NODE_ENV=production
DATABASE_URL=[剛才複製的資料庫URL]
JWT_SECRET=your-super-secret-jwt-key-2024-enterprise
HOST=0.0.0.0
TELEGRAM_BOT_TOKEN=7659930552:AAF_jF1rAXFnjFO176-9X5fKfBwbrko8BNc
```

### Step 4: 高級設置
```yaml
Health Check Path: /health
Auto Deploy: Yes (推薦)
```

## 🚀 一鍵部署步驟

### 方法一：使用 render.yaml (推薦)
1. 確保 `render.yaml` 已推送到 GitHub
2. 在 Render Dashboard 中：
   - 點擊 "New +" → "Blueprint"
   - 連接到您的 GitHub Repository
   - Render 會自動讀取 `render.yaml` 並創建所有服務

### 方法二：手動創建服務
按照上述步驟分別創建資料庫和Web服務

## 📊 部署後驗證

部署完成後，您的應用會獲得類似這樣的URL：
```
https://employee-management-system-abcd.onrender.com
```

### 測試端點：
- **健康檢查**: `/health`
- **主頁**: `/`
- **API測試**: `/api/test`
- **認證API**: `/api/auth`

## 🎯 Render 優勢

### ✅ 免費額度充足
- 750小時/月免費運行時間
- 免費 PostgreSQL 資料庫 (90天)
- 免費 SSL 憑證

### ✅ 企業級功能
- 自動擴展
- 健康檢查
- 日誌監控
- 自動部署

### ✅ 開發友好
- GitHub 直接整合
- 預覽環境支援
- 簡單環境變數管理

## 🚨 注意事項

1. **免費方案限制**：
   - 應用閒置15分鐘後會休眠
   - 首次喚醒可能需要30秒

2. **生產環境建議**：
   - 升級到付費方案 ($7/月) 避免休眠
   - 設置自定義域名
   - 啟用備份功能

3. **監控建議**：
   - 設置 Uptime 監控
   - 定期檢查日誌
   - 監控資料庫使用量

## 📞 支援資源

- **Render 文檔**: https://render.com/docs
- **Node.js 指南**: https://render.com/docs/node-express-app
- **PostgreSQL 指南**: https://render.com/docs/databases

---
**部署成功後，您的企業員工管理系統將在全球CDN上運行！** 🌍