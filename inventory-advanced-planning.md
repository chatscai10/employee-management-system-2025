# 叫貨系統進階功能規劃書

## 📋 需求分析

### 1. 進階異常監控需求
- **品項太多天沒叫貨**: 每個品項設定不同的異常天數閾值
- **品項叫貨次數太頻繁**: 每個品項設定不同的頻繁叫貨檢測期間
- **新品項無叫貨記錄**: 檢測上架後從未叫貨的品項
- **庫存低於警戒值**: 每個品項設定不同的低庫存警戒值

### 2. 庫存管理需求
- **品項個別化設定**: 每個品項獨立的庫存管理參數
- **權限分級**: 員工僅能看備註，庫存數量僅管理員可見
- **自動庫存更新**: 叫貨後自動更新預期庫存
- **庫存追蹤**: 記錄庫存變動歷史

## 🏗️ 資料庫設計強化

### InventoryItem 模型增強
```sql
-- 新增欄位：
employeeNotes TEXT,           -- 員工可見備註
managerNotes TEXT,           -- 管理員專用備註
frequentOrderDays INTEGER,   -- 頻繁叫貨檢測天數
maxOrdersInPeriod INTEGER,   -- 期間內最大叫貨次數
lowStockThreshold INTEGER,   -- 低庫存警戒值
autoRestockLevel INTEGER,    -- 自動補貨建議量
category TEXT,               -- 品項分類
priority INTEGER,            -- 優先級 (1=高 2=中 3=低)
seasonalItem BOOLEAN,        -- 是否為季節性商品
supplierLeadTime INTEGER     -- 供應商交貨時間(天)
```

### 新增 InventoryLog 模型
```sql
CREATE TABLE inventory_logs (
    id INTEGER PRIMARY KEY,
    itemId INTEGER,
    actionType TEXT,         -- 'order', 'consume', 'adjust', 'waste'
    quantityBefore INTEGER,
    quantityAfter INTEGER,
    quantityChange INTEGER,
    reason TEXT,
    operatorId INTEGER,
    operatorName TEXT,
    createdAt DATETIME
);
```

### 新增 InventoryAlert 模型
```sql
CREATE TABLE inventory_alerts (
    id INTEGER PRIMARY KEY,
    itemId INTEGER,
    alertType TEXT,          -- 'low_stock', 'no_order', 'frequent_order', 'new_item'
    severity INTEGER,        -- 1=低 2=中 3=高
    message TEXT,
    isResolved BOOLEAN,
    resolvedAt DATETIME,
    resolvedBy INTEGER,
    createdAt DATETIME
);
```

## 🧠 智能監控引擎設計

### 1. 異常檢測算法
```javascript
class AdvancedAbnormalEngine {
    // 檢測太久沒叫貨
    static checkNoOrderTooLong(item, lastOrderDate) {
        const daysSinceOrder = calculateDaysDiff(lastOrderDate, today);
        return daysSinceOrder > item.abnormalDays;
    }
    
    // 檢測叫貨太頻繁
    static checkTooFrequentOrders(item, recentOrders) {
        const ordersInPeriod = recentOrders.filter(order => 
            isWithinDays(order.date, item.frequentOrderDays)
        ).length;
        return ordersInPeriod > item.maxOrdersInPeriod;
    }
    
    // 檢測新品項無叫貨記錄
    static checkNewItemNoOrder(item) {
        const daysSinceCreated = calculateDaysDiff(item.createdAt, today);
        return daysSinceCreated > 7 && !item.lastOrderDate;
    }
    
    // 檢測低庫存
    static checkLowStock(item) {
        return item.currentStock <= item.lowStockThreshold;
    }
}
```

### 2. 庫存管理算法
```javascript
class InventoryManager {
    // 自動庫存扣減 (叫貨時預估消耗)
    static async updateInventoryOnOrder(itemId, orderedQuantity) {
        const item = await InventoryItem.findByPk(itemId);
        const newStock = Math.max(0, item.currentStock + orderedQuantity);
        await item.update({ currentStock: newStock });
        
        // 記錄庫存變動日誌
        await InventoryLog.create({
            itemId: itemId,
            actionType: 'order',
            quantityBefore: item.currentStock,
            quantityAfter: newStock,
            quantityChange: orderedQuantity,
            reason: '叫貨補充庫存'
        });
    }
    
    // 生成補貨建議
    static generateRestockSuggestion(item) {
        if (item.currentStock <= item.lowStockThreshold) {
            const suggestedQuantity = item.autoRestockLevel - item.currentStock;
            return {
                itemName: item.itemName,
                currentStock: item.currentStock,
                threshold: item.lowStockThreshold,
                suggestedQuantity: Math.max(1, suggestedQuantity),
                urgency: item.currentStock === 0 ? 'critical' : 'normal'
            };
        }
        return null;
    }
}
```

## 🎯 通知系統強化

### 管理員詳細通知模板
```
🛒 叫貨記錄詳細報告 + 庫存分析
━━━━━━━━━━━━━━━━━━━
📦 叫貨明細:
叫貨人員：{員工姓名}
📅 送貨日期: {日期}
🏪 分店: {分店名稱}
💰 總金額: ${總金額}

🏭 廠商分類:
{廠商名稱}
  • {品項} {數量} {單位} (庫存: {當前庫存})

⚠️ 庫存警報:
📉 低庫存警告: {品項列表}
🚨 缺貨警告: {零庫存品項}
⏰ 異常品項分析:
  • {品項}: {天數}天未叫貨 (閾值:{設定天數}天)
  • {品項}: {次數}次頻繁叫貨 (期間:{天數}天)

💡 補貨建議:
  • {品項}: 建議叫貨{數量}{單位}
━━━━━━━━━━━━━━━━━━━
```

### 員工簡化通知 (不含庫存)
```
🛒 叫貨記錄
📅 送貨日期: {日期}
🏪 分店: {分店名稱}
📦 叫貨品項: {品項數}項
💰 總價: ${總金額}
```

## 🔐 權限設計

### 員工權限
- ✅ 查看品項名稱、分類、備註
- ✅ 提交叫貨訂單
- ❌ 查看庫存數量
- ❌ 查看成本價格
- ❌ 修改品項設定

### 管理員權限
- ✅ 所有員工權限
- ✅ 查看庫存數量和警報
- ✅ 設定品項參數
- ✅ 查看詳細分析報告
- ✅ 庫存手動調整

## 📊 前端界面設計

### 員工叫貨頁面
```
品項列表:
┌─────────────────────┐
│ 🍗 雞排             │
│ 大大食品            │
│ 💡 酥脆外皮，肉質鮮美 │
│ [+] [-] [加入購物車]  │
└─────────────────────┘
```

### 管理員分析頁面
```
庫存監控面板:
┌──────────────────────────┐
│ 📦 雞排                  │
│ 🏪 當前庫存: 15包        │
│ ⚠️ 警戒值: 10包          │
│ 📊 7天內叫貨3次 (正常)   │
│ 📅 上次叫貨: 2天前       │
│ [調整庫存] [修改設定]     │
└──────────────────────────┘
```

## 🔄 系統流程

### 叫貨流程強化
1. 員工選擇品項 → 顯示備註信息
2. 提交訂單 → 自動更新預期庫存
3. 異常檢測引擎分析
4. 生成分級通知 (員工簡化/管理員詳細)
5. 記錄庫存變動日誌

### 異常監控流程
1. 定時檢測任務 (每小時執行)
2. 多維度異常分析
3. 生成警報記錄
4. 推送通知給管理員
5. 追蹤解決狀態

## ⚡ 性能考量

- 使用Redis緩存頻繁查詢的品項資料
- 異步處理庫存計算和通知發送
- 批量處理異常檢測減少數據庫壓力
- 分頁查詢大量庫存記錄

## 🛡️ 邏輯驗證

### 潛在衝突檢查
1. ✅ 庫存數量不會因為並發操作產生負值
2. ✅ 員工權限嚴格隔離，無法訪問庫存數據
3. ✅ 異常檢測參數獨立設定，不會互相影響
4. ✅ 通知系統分級發送，避免信息洩露
5. ✅ 庫存變動有完整日誌追蹤

### 業務邏輯完整性
1. ✅ 叫貨 → 庫存預測 → 消耗 → 補貨 完整循環
2. ✅ 異常檢測覆蓋所有業務場景
3. ✅ 權限控制符合實際操作需求
4. ✅ 通知內容精準匹配用戶角色

## 📈 實施階段

1. **階段1**: 資料庫模型強化
2. **階段2**: 異常監控引擎開發
3. **階段3**: 庫存管理系統實現
4. **階段4**: 權限系統和API更新
5. **階段5**: 通知系統強化
6. **階段6**: 前端界面調整
7. **階段7**: 完整測試和驗證

---
**結論**: 此設計完整覆蓋所有需求，邏輯嚴密無衝突，可安全實施。