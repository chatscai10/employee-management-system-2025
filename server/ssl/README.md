# SSL 證書配置

## 生產環境證書配置

1. 將您的SSL證書文件放在此目錄：
   - `cert.pem` - 證書文件
   - `key.pem` - 私鑰文件
   - `ca.pem` - CA證書文件（可選）

2. 確保文件權限正確：
   ```bash
   chmod 600 key.pem
   chmod 644 cert.pem
   ```

3. 更新環境變數：
   ```
   SSL_CERT_PATH=/path/to/cert.pem
   SSL_KEY_PATH=/path/to/key.pem
   SSL_CA_PATH=/path/to/ca.pem
   HTTPS_PORT=443
   ```

## 開發環境

系統會自動生成自簽名證書用於開發測試。

## 建議的SSL提供商

- Let's Encrypt (免費)
- Cloudflare SSL
- DigiCert
- GlobalSign

## 證書更新

定期檢查證書到期時間並及時更新。
