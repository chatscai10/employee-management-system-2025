# 🌐 部署網址獲取指南

## 📍 當前狀態
您的系統目前在本地運行：`http://localhost:3000`

## 🚀 Railway 部署後的網址

### 1. 自動生成的網址格式
```
https://[random-name].railway.app
或
https://employee-management-system-[hash].railway.app
```

### 2. 獲取部署網址的步驟

#### 步驟 1：完成 Railway 部署
1. 前往 [Railway.app](https://railway.app)
2. 登入並連接您的 GitHub repository
3. 選擇此專案進行部署
4. 等待部署完成（約 3-5 分鐘）

#### 步驟 2：獲取網址
部署完成後，在 Railway Dashboard 中：
1. 選擇您的服務
2. 點擊 "Domains" 標籤
3. 您會看到自動生成的網址，格式類似：
   ```
   https://employee-management-production.railway.app
   ```

### 3. 可訪問的頁面
部署完成後，您可以訪問：

#### 主要頁面
- **首頁**: `https://your-app.railway.app/`
- **登入頁面**: `https://your-app.railway.app/login.html`
- **管理後台**: `https://your-app.railway.app/admin.html`
- **員工儀表板**: `https://your-app.railway.app/employee-dashboard.html`

#### API 端點
- **健康檢查**: `https://your-app.railway.app/health`
- **API 文檔**: `https://your-app.railway.app/api/`
- **認證端點**: `https://your-app.railway.app/api/auth/login`

#### 監控面板
- **系統監控**: `https://your-app.railway.app/api/monitoring/dashboard`
- **指標查看**: `https://your-app.railway.app/api/monitoring/metrics`

### 4. 自定義域名設置（可選）

如果您想使用自己的域名：

#### 在 Railway 中設置
1. 在 Railway Dashboard 中選擇您的服務
2. 點擊 "Domains" 標籤  
3. 點擊 "Add Domain"
4. 輸入您的域名，如：`employee.yourcompany.com`
5. 按照 Railway 提供的 DNS 設置指引配置您的域名

#### DNS 配置示例
```
CNAME employee.yourcompany.com -> your-app.railway.app
```

### 5. SSL 憑證
- ✅ Railway 自動為所有網址提供免費 SSL 憑證
- ✅ 所有流量自動重定向到 HTTPS
- ✅ 支援自定義域名的 SSL 憑證

### 6. 快速部署檢查

部署完成後，立即測試這些網址：

```bash
# 健康檢查
curl https://your-app.railway.app/health

# 預期回應
{"success":true,"message":"系統運行正常","data":{"status":"healthy"}}
```

```bash  
# 檢查主頁
curl -I https://your-app.railway.app/

# 預期狀態碼：200 或 302 (重定向)
```

### 7. 預期的部署網址示例

根據您的專案配置，可能的網址格式：
```
https://employee-management-system.railway.app
https://emp-mgmt-prod.railway.app  
https://enterprise-emp-system.railway.app
```

### 8. 網址獲取後的下一步

一旦獲得部署網址：

1. **測試所有功能**
   - 用戶登入/註冊
   - 員工資料管理  
   - 考勤打卡系統
   - 管理員後台

2. **更新配置**
   - 在 Railway Variables 中設置 `CORS_ORIGIN` 為您的實際網址
   - 更新 Telegram 通知中的應用連結

3. **分享給團隊**
   - 提供登入網址給員工
   - 提供管理後台網址給管理者

### 9. 如果需要立即測試

在完成 Railway 部署之前，您可以：

1. **本地測試** (當前)：`http://localhost:3000`
2. **使用 ngrok** 創建臨時公共網址：
   ```bash
   npm install -g ngrok
   ngrok http 3000
   ```
   這會給您一個臨時的公共網址，如：`https://abc123.ngrok.io`

---

## 📞 需要協助？

如果部署過程中遇到問題：
- 📱 系統會自動發送部署狀態到 Telegram 群組：`-1002658082392`
- 📚 參考：`RAILWAY_DEPLOYMENT_STEPS.md`
- 🌐 Railway 社群：[Railway Discord](https://discord.gg/railway)

**🎯 一旦完成 Railway 部署，您就會獲得一個永久的 https 網址！**