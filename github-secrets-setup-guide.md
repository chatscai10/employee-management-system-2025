# 🔐 GitHub Secrets 設置指南

## 必要的 GitHub Secrets

### 🚂 Railway 部署相關
```
RAILWAY_TOKEN=your_railway_token_here
RAILWAY_SERVICE_ID=your_service_id_here
```

### 📱 Telegram 通知相關  
```
TELEGRAM_BOT_TOKEN=process.env.TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID=process.env.TELEGRAM_GROUP_ID
```

## 🛠️ 設置步驟

### 1. 前往 GitHub Repository Settings
```
https://github.com/chatscai10/enterprise-employee-management-system/settings/secrets/actions
```

### 2. 點擊 "New repository secret"

### 3. 添加以下 Secrets：

#### Railway Token 獲取方式：
1. 前往 https://railway.app/account/tokens
2. 創建新的 API Token
3. 複製 Token 並添加到 GitHub Secrets

#### Railway Service ID 獲取方式：
1. 前往 Railway 專案頁面
2. 從 URL 中獲取 Service ID
3. 格式: `https://railway.app/project/{project-id}/service/{service-id}`

## 🧪 測試 GitHub Actions

### 手動觸發部署：
```bash
# 使用 GitHub CLI 手動觸發工作流程
gh workflow run "🚀 Railway 自動部署" --field environment=production
```

### 檢查工作流程狀態：
```bash
# 查看工作流程列表
gh workflow list

# 查看最新運行狀態
gh run list --workflow="🚀 Railway 自動部署"

# 查看特定運行的詳細日誌
gh run view {run-id} --log
```

## 🎯 自動化觸發條件

### 自動觸發：
- ✅ 推送到 `master` 分支
- ✅ 創建 Pull Request 到 `master` 分支

### 手動觸發：
- ✅ GitHub UI 中手動運行
- ✅ GitHub CLI 命令觸發
- ✅ GitHub API 調用觸發

## 📊 通知功能

### Telegram 通知內容：
- 🚀 部署狀態（成功/失敗）
- 🎯 專案名稱和分支
- 👤 提交者資訊
- 💬 最新提交訊息
- 🕒 部署時間
- 🔗 GitHub Actions 運行連結

### 通知觸發條件：
- ✅ 部署成功後自動發送
- ✅ 部署失敗後自動發送
- ✅ 包含完整的狀態資訊

## 🔧 故障排除

### 常見問題：

1. **Railway Token 無效**
   - 確認 Token 有效且有正確權限
   - 重新生成 Token 並更新 Secret

2. **Service ID 錯誤**
   - 確認 Service ID 來自正確的專案
   - 檢查 Railway 專案結構

3. **Telegram 通知失敗**
   - 確認 Bot Token 正確
   - 確認 Chat ID 正確（包含負號）
   - 確認 Bot 在群組中並有發送權限

## 🚀 最佳實踐

1. **安全性**：
   - 定期輪換 API Token
   - 使用最小權限原則
   - 監控 Secret 使用情況

2. **監控**：
   - 設置 GitHub Actions 通知
   - 監控部署成功率
   - 追蹤部署時間趨勢

3. **備份**：
   - 保存 Token 的安全備份
   - 文檔化所有配置
   - 定期測試恢復流程