# 🚨 災難恢復計劃 (Disaster Recovery Plan)

## 📋 概述

本文檔描述了 Employee Management System 的災難恢復計劃，確保在系統出現故障時能夠快速恢復正常運營。

## 🎯 恢復目標

- **RTO (Recovery Time Objective)**: 4小時
- **RPO (Recovery Point Objective)**: 1小時  
- **可用性目標**: 99.9%
- **數據完整性**: 100%

## 📊 風險評估

### 高風險情況
- 硬體故障 (機率: 中等 | 影響: 高)
- 資料庫損壞 (機率: 低 | 影響: 極高)
- 網路中斷 (機率: 中等 | 影響: 高)
- 惡意攻擊 (機率: 低 | 影響: 高)

### 中等風險情況  
- 軟體故障 (機率: 中等 | 影響: 中等)
- 配置錯誤 (機率: 中等 | 影響: 中等)
- 人為錯誤 (機率: 中等 | 影響: 中等)

### 低風險情況
- 自然災害 (機率: 極低 | 影響: 極高)
- 電力中斷 (機率: 低 | 影響: 中等)

## 🗂️ 備份策略

### 自動備份計劃

#### 1. 資料庫備份
```bash
# 每小時增量備份
0 * * * * /opt/scripts/db-incremental-backup.sh

# 每天完整備份 (凌晨2點)
0 2 * * * /opt/scripts/db-full-backup.sh

# 每週完整備份到遠程位置 (週日凌晨3點)
0 3 * * 0 /opt/scripts/db-offsite-backup.sh
```

#### 2. 系統配置備份
```bash
# 每天備份系統配置 (凌晨2點30分)
30 2 * * * /opt/scripts/config-backup.sh

# 每次部署前備份
# 自動在 CI/CD 流程中觸發
```

#### 3. 應用程式檔案備份
```bash
# 每週完整備份應用程式檔案 (週日凌晨4點)
0 4 * * 0 /opt/scripts/app-backup.sh
```

### 備份位置

#### 本地備份
- **路徑**: `/backup/employee-management-system/`
- **保留期**: 30天
- **類型**: 快速恢復用

#### 遠程備份  
- **位置**: AWS S3 / Google Cloud Storage
- **保留期**: 90天
- **類型**: 災難恢復用

#### 離線備份
- **位置**: 外部硬碟/磁帶
- **頻率**: 每月
- **保留期**: 1年

## 🔄 恢復程序

### 1. 系統故障恢復

#### 輕微故障 (服務重啟)
```bash
# 步驟 1: 診斷問題
sudo systemctl status employee-management
pm2 status

# 步驟 2: 重啟服務
pm2 restart ecosystem.config.js --env production

# 步驟 3: 驗證恢復
curl -f http://localhost:3000/api/health
```

#### 中等故障 (重新部署)
```bash
# 步驟 1: 備份當前狀態
./scripts/backup-system.sh

# 步驟 2: 重新部署
./scripts/production-deploy.sh

# 步驟 3: 恢復數據 (如需要)
./scripts/restore-database.sh [backup-file]
```

### 2. 資料庫恢復

#### 部分數據損壞
```bash
# 步驟 1: 停止應用服務
pm2 stop ecosystem.config.js

# 步驟 2: 備份損壞的資料庫
cp database/employee_management.db database/corrupted_backup_$(date +%Y%m%d_%H%M%S).db

# 步驟 3: 從最近備份恢復
cp /backup/employee-management-system/latest/database/employee_management.db database/

# 步驟 4: 驗證資料完整性
sqlite3 database/employee_management.db "PRAGMA integrity_check;"

# 步驟 5: 重啟服務
pm2 start ecosystem.config.js --env production
```

#### 完全資料庫損壞
```bash
# 步驟 1: 使用災難恢復腳本
./scripts/disaster-recovery.sh --full-database-restore

# 步驟 2: 從遠程備份恢復 (如果本地備份也損壞)
./scripts/restore-from-remote.sh --source s3://backup-bucket/latest
```

### 3. 完整系統災難恢復

#### 硬體完全故障
1. **準備新環境**
   ```bash
   # 在新伺服器上執行
   git clone https://github.com/company/employee-management-system.git
   cd employee-management-system
   ./scripts/production-setup.sh
   ```

2. **恢復資料和配置**
   ```bash
   # 從遠程備份恢復
   ./scripts/disaster-recovery.sh --full-restore --source remote
   ```

3. **更新 DNS 和負載均衡器**
   - 更新 DNS 記錄指向新伺服器
   - 更新負載均衡器配置
   - 更新監控系統配置

## 📋 恢復檢查清單

### 🔍 故障診斷
- [ ] 檢查服務狀態 (`systemctl`, `pm2 status`)
- [ ] 檢查系統資源 (CPU, Memory, Disk)
- [ ] 檢查網路連接
- [ ] 檢查日誌文件
- [ ] 檢查資料庫完整性
- [ ] 檢查外部依賴服務

### 🛠️ 恢復準備
- [ ] 通知相關人員災難事件
- [ ] 評估恢復策略 (本地/遠程/完整重建)
- [ ] 確保備份可用性
- [ ] 準備恢復環境

### 🔄 執行恢復
- [ ] 停止故障服務
- [ ] 備份當前狀態 (如可能)
- [ ] 執行恢復腳本
- [ ] 恢復資料庫
- [ ] 恢復配置文件
- [ ] 重啟服務

### ✅ 恢復驗證
- [ ] 服務健康檢查
- [ ] 資料完整性驗證
- [ ] 功能測試
- [ ] 性能測試
- [ ] 安全檢查
- [ ] 監控系統確認

### 📝 恢復後處理
- [ ] 更新文檔
- [ ] 通知用戶服務恢復
- [ ] 分析故障原因
- [ ] 改善預防措施
- [ ] 更新恢復計劃

## 🚨 緊急聯絡資訊

### 技術團隊
- **系統管理員**: emergency@company.com | +886-XXX-XXXXX
- **開發團隊主管**: dev-lead@company.com | +886-XXX-XXXXX
- **資料庫管理員**: dba@company.com | +886-XXX-XXXXX

### 外部支援
- **雲端服務供應商**: AWS Support | Azure Support
- **網域服務商**: 聯絡資訊
- **ISP**: 網路服務商聯絡資訊

### 管理層
- **IT 主管**: it-manager@company.com | +886-XXX-XXXXX
- **營運主管**: ops-manager@company.com | +886-XXX-XXXXX

## 🧪 災難恢復測試

### 定期測試計劃

#### 月度測試 (第一個週六)
- 服務重啟測試
- 資料庫備份恢復測試
- 監控告警測試

#### 季度測試 (每季末)
- 完整系統恢復測試
- 遠程備份恢復測試
- 災難恢復時間測試

#### 年度測試 (每年12月)
- 全面災難恢復演練
- 異地恢復測試
- 商業繼續營運測試

### 測試記錄範本

```markdown
## 災難恢復測試記錄

**測試日期**: YYYY-MM-DD
**測試類型**: [月度/季度/年度]
**測試範圍**: [服務重啟/資料庫恢復/完整系統]

### 測試步驟
1. [描述測試步驟]
2. [描述測試步驟]

### 測試結果
- **恢復時間**: XX分鐘
- **成功率**: XX%
- **問題**: [描述遇到的問題]

### 改善建議
1. [改善項目1]
2. [改善項目2]

**測試執行者**: [姓名]
**審核者**: [姓名]
```

## 📈 恢復指標

### 關鍵指標追蹤

#### 恢復時間 (RTO)
- **目標**: < 4小時
- **測量方式**: 從故障發現到服務完全恢復
- **報告頻率**: 每次事件後

#### 資料丟失 (RPO)  
- **目標**: < 1小時
- **測量方式**: 最後可用資料到故障時間
- **報告頻率**: 每次資料相關事件後

#### 備份成功率
- **目標**: > 99%
- **測量方式**: 成功備份次數/總備份次數
- **報告頻率**: 月度

#### 恢復測試通過率
- **目標**: 100%
- **測量方式**: 成功恢復測試/總測試次數  
- **報告頻率**: 季度

## 🔧 恢復工具和腳本

### 主要恢復腳本

#### `disaster-recovery.sh`
完整災難恢復主腳本
```bash
./scripts/disaster-recovery.sh [options]
  --full-restore          完整系統恢復
  --database-only         僅恢復資料庫
  --config-only          僅恢復配置
  --source [local|remote] 備份來源
```

#### `backup-system.sh`
系統備份腳本
```bash
./scripts/backup-system.sh [backup|restore|list]
```

#### `health-check.sh`
系統健康檢查
```bash
./scripts/health-check.sh [--detailed]
```

### 恢復工具清單

- **SQLite**: 資料庫恢復和檢查
- **rsync**: 文件同步和恢復
- **curl**: 服務健康檢查
- **PM2**: 程序管理和重啟
- **Docker**: 容器恢復
- **Git**: 程式碼版本恢復

## 📚 相關文檔

- [系統部署指南](DEPLOYMENT_GUIDE.md)
- [運維手冊](OPERATIONS_MANUAL.md)
- [安全檢查清單](SECURITY_CHECKLIST.md)
- [監控配置指南](MONITORING_GUIDE.md)

## 🔄 文檔維護

- **建立日期**: 2025-01-09
- **最後更新**: 2025-01-09
- **更新頻率**: 季度或重大變更時
- **負責人**: 系統管理員
- **審核者**: IT 主管

---

**重要提醒**: 此文檔包含敏感資訊，僅限授權人員查看。定期更新聯絡資訊和恢復程序。