# 🚀 Google Cloud Platform 部署指南

## 📋 部署前準備

### 1. 安裝 Google Cloud CLI
```bash
# Windows
# 下載並安裝: https://cloud.google.com/sdk/docs/install-sdk#windows

# Mac
brew install google-cloud-sdk

# Linux
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

### 2. 創建 GCP 專案
1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 點擊「創建專案」
3. 專案名稱: `Enterprise Employee Management`
4. 專案ID: `enterprise-employee-mgmt` (或您偏好的ID)
5. 選擇帳單帳戶 (需要啟用計費才能使用App Engine)

### 3. 啟用必要的API
- App Engine Admin API
- Cloud Build API

## 🚀 部署步驟

### 方法1: 使用部署腳本 (推薦)

#### Linux/Mac:
```bash
chmod +x deploy-gcp.sh
./deploy-gcp.sh
```

#### Windows:
```cmd
deploy-gcp.bat
```

### 方法2: 手動部署

#### 1. 登入Google Cloud
```bash
gcloud auth login
```

#### 2. 設定專案
```bash
gcloud config set project enterprise-employee-mgmt
```

#### 3. 啟用API服務
```bash
gcloud services enable appengine.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

#### 4. 創建App Engine應用
```bash
gcloud app create --region=asia-east1
```

#### 5. 部署應用
```bash
gcloud app deploy
```

#### 6. 開啟瀏覽器查看
```bash
gcloud app browse
```

## 🔧 環境變數設定

在app.yaml中更新環境變數：

```yaml
env_variables:
  NODE_ENV: "production"
  JWT_SECRET: "請設置強密碼"
  CORS_ORIGIN: "*"
  # 其他變數...
```

## 📊 監控和管理

### 查看應用狀態
```bash
gcloud app describe
```

### 查看日誌
```bash
gcloud app logs tail -s default
```

### 查看版本
```bash
gcloud app versions list
```

### 設定流量分配
```bash
gcloud app services set-traffic default --splits=v1=100
```

## 💰 費用估算

### App Engine 標準環境定價 (asia-east1)
- F1 實例: 免費額度內
- 超出免費額度後: ~$0.05/小時
- 請求處理: 前100萬次請求免費

### 建議配置
- 開發/測試: F1實例，自動縮放
- 生產環境: F2或以上實例

## 🛡️ 安全設定

### 1. IAM權限
- 設定適當的服務帳號權限
- 限制App Engine的訪問權限

### 2. 防火牆規則
- 使用VPC防火牆規則限制訪問
- 設定IP白名單

### 3. SSL/TLS
- App Engine自動提供HTTPS
- 可設定自訂域名和SSL證書

## 🔍 故障排除

### 常見問題

1. **部署失敗**
   ```bash
   gcloud app logs tail -s default
   ```

2. **記憶體不足**
   - 在app.yaml中增加instance_class

3. **靜態檔案404**
   - 檢查app.yaml中的handlers配置

4. **環境變數問題**
   - 確認app.yaml中的env_variables設定

### 有用的命令

```bash
# 查看應用詳情
gcloud app describe

# 查看服務列表
gcloud app services list

# 查看版本列表
gcloud app versions list

# 刪除舊版本
gcloud app versions delete VERSION_ID

# 查看實時日誌
gcloud app logs tail -s default

# 查看歷史日誌
gcloud app logs read -s default --limit=50
```

## 🌐 自訂域名

### 1. 驗證域名
```bash
gcloud app domain-mappings create DOMAIN_NAME
```

### 2. 設定DNS
- 在域名提供商處設定CNAME記錄
- 指向 ghs.googlehosted.com

## 📱 後續管理

### 更新應用
```bash
gcloud app deploy --version=v2
gcloud app services set-traffic default --splits=v2=100
```

### 回滾版本
```bash
gcloud app services set-traffic default --splits=v1=100
```

---

**完成部署後，您的企業員工管理系統將在以下URL可用：**
`https://PROJECT_ID.uc.r.appspot.com`

**管理面板：**
`https://console.cloud.google.com/appengine`
