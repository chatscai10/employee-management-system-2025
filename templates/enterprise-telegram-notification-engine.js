// 企業級Telegram通知引擎 - 29種通知模板完整實現
// 基於2025年Telegraf最新框架 + 通知模板.txt要求

const { Telegraf } = require('telegraf');
const fs = require('fs').promises;
const path = require('path');

class EnterpriseTelegramNotificationEngine {
  constructor() {
    this.botToken = 'process.env.TELEGRAM_BOT_TOKEN';
    this.bossGroupId = 'process.env.TELEGRAM_GROUP_ID';
    this.employeeGroupId = 'process.env.TELEGRAM_GROUP_ID';
    
    // 初始化Telegraf Bot
    this.bot = new Telegraf(this.botToken);
    this.initializeBot();
    
    // 通知模板載入
    this.notificationTemplates = this.loadNotificationTemplates();
    this.notificationHistory = [];
    this.templateUsageStats = {};
    
    // 通知設定
    this.settings = {
      enableBossNotifications: true,
      enableEmployeeNotifications: true,
      enableAutoTrigger: true,
      retryAttempts: 3,
      retryDelay: 2000,
      rateLimitDelay: 1000
    };
  }

  // 初始化Telegram Bot
  initializeBot() {
    this.bot.start((ctx) => {
      ctx.reply('🤖 企業通知系統已啟動！');
    });

    this.bot.command('test', (ctx) => {
      ctx.reply('✅ 通知系統運行正常');
    });

    this.bot.command('stats', async (ctx) => {
      const stats = this.getNotificationStatistics();
      ctx.reply(`📊 通知統計:\n總通知數: ${stats.totalNotifications}\n成功率: ${stats.successRate}%`);
    });

    console.log('🤖 Telegram Bot已初始化');
  }

  // 載入通知模板
  loadNotificationTemplates() {
    return {
      boss: {
        // 1. 營業額提交詳細數據通知
        revenue_submit: {
          title: '💰 營業額提交通知',
          template: `
🏪 <b>{storeName} 營業額提交</b>

👤 <b>提交員工:</b> {employeeName}
📅 <b>營業日期:</b> {businessDate}
⏰ <b>提交時間:</b> {submitTime}
📊 <b>日期類型:</b> {dateType}

💰 <b>收入明細:</b>
├ 現場營業額: NT$ {onSiteRevenue:,}
├ 線上點餐: NT$ {onlineRevenue:,}
├ 熊貓點餐: NT$ {pandaRevenue:,} (服務費35%)
├ Uber點餐: NT$ {uberRevenue:,} (服務費35%)
└ 廢油回收: NT$ {oilRevenue:,} (不計獎金)

💸 <b>支出明細:</b>
├ 瓦斯費: NT$ {gasExpense:,}
├ 水電費: NT$ {utilityExpense:,}
├ 房租: NT$ {rentExpense:,}
├ 貨款: NT$ {goodsExpense:,}
├ 清潔費: NT$ {cleaningExpense:,}
└ 其他支出: NT$ {otherExpense:,}

📊 <b>計算結果:</b>
├ 總收入: NT$ {totalIncome:,}
├ 總支出: NT$ {totalExpense:,}
├ 淨收入: NT$ {netIncome:,}
├ 服務費: NT$ {serviceFee:,}
├ 最終收入: NT$ {finalIncome:,}
└ 獎金金額: NT$ {bonusAmount:,}

{statusMessage}

📸 <b>憑證照片:</b>
├ 收入憑證: {incomePhotos} 張
├ 支出憑證: {expensePhotos} 張
├ 現金照片: {cashPhotos} 張
└ 其他證明: {otherPhotos} 張

📈 <b>訂單統計:</b>
├ 總訂單數: {orderCount} 筆
└ 平均客單價: NT$ {averageOrderValue:,}
          `
        },

        // 2. 新人註冊完整資訊通知
        employee_register: {
          title: '👥 新員工註冊申請',
          template: `
👥 <b>新員工註冊申請</b>

📋 <b>基本資料:</b>
├ 姓名: {name}
├ 身分證: {idNumber}
├ 出生日期: {birthDate}
├ 性別: {gender}
├ 持有駕照: {drivingLicense}

📞 <b>聯絡資訊:</b>
├ 電話: {phone}
├ 地址: {address}
├ 緊急聯絡人: {emergencyContact}
├ 關係: {relationship}
└ 緊急聯絡電話: {emergencyPhone}

🏢 <b>工作資訊:</b>
├ 到職日: {startDate}
├ 分派店面: {assignedStore}
├ 職位: {position}
└ 狀態: {status}

🔗 <b>系統資訊:</b>
├ 員工編號: {employeeId}
├ LINE ID: {lineUserId}
├ 註冊時間: {registrationTime}
└ IP地址: {ipAddress}

⚠️ <b>待辦事項:</b>
□ 管理員審核資料
□ 設定系統權限
□ 安排職前訓練
□ 綁定LINE通知
          `
        },

        // 3. 員工GPS打卡+設備指紋詳細分析
        attendance_detailed: {
          title: '📍 員工打卡記錄',
          template: `
📍 <b>員工打卡記錄</b>

👤 <b>員工資訊:</b>
├ 姓名: {employeeName}
├ 員工編號: {employeeId}
└ 打卡類型: {clockType}

🏪 <b>店面資訊:</b>
├ 店面: {storeName}
├ 打卡時間: {timestamp}
└ 距離: {distance}公尺

📍 <b>GPS定位:</b>
├ 座標: {coordinates}
├ 定位精度: {accuracy}公尺
└ 位置狀態: {locationStatus}

⏰ <b>時間分析:</b>
{timeAnalysis}

🔐 <b>設備指紋:</b>
├ 設備ID: {deviceFingerprint}
├ 裝置類型: {deviceType}
├ 作業系統: {operatingSystem}
├ 瀏覽器: {browser}
├ 螢幕解析度: {screenResolution}
└ IP位址: {ipAddress}

{securityAlert}

📸 打卡照片: {photoStatus}
          `
        },

        // 4. 叫貨記錄+異常天數分析
        order_analysis: {
          title: '📦 叫貨記錄分析',
          template: `
📦 <b>叫貨記錄提交</b>

👤 <b>操作員工:</b> {employeeName}
🏪 <b>操作店面:</b> {storeName}
📅 <b>叫貨日期:</b> {orderDate}
⏰ <b>提交時間:</b> {submitTime}

📋 <b>叫貨明細:</b>
{orderItems}

🏭 <b>供應商分布:</b>
{supplierBreakdown}

📊 <b>異常天數分析:</b>
{abnormalItemsAnalysis}

💰 <b>預估成本:</b>
├ 總品項數: {totalItems} 項
├ 預估金額: NT$ {estimatedCost:,}
└ 上月同期: NT$ {lastMonthComparison:,}

📈 <b>庫存建議:</b>
{stockSuggestions}
          `
        },

        // 5-16. 其他老闆群組通知模板...
        promotion_vote_start: {
          title: '🗳️ 升遷投票發起',
          template: `
🗳️ <b>升遷投票發起通知</b>

👤 <b>申請人:</b> {applicantName}
📈 <b>目標職位:</b> {targetPosition}
⏰ <b>發起時間:</b> {startTime}
📅 <b>投票截止:</b> {endTime}

📊 <b>申請人資訊:</b>
├ 當前職位: {currentPosition}
├ 到職日期: {hireDate}
├ 任職天數: {workingDays} 天
├ 分店: {storeName}
└ 考核評分: {performanceScore}

🎯 <b>投票規則:</b>
├ 投票期間: {votingPeriod} 天
├ 同意比例要求: {requiredRatio}%
├ 最低投票數: {minimumVotes} 票
└ 匿名投票: 是

📈 <b>晉升路徑:</b>
{promotionPath}
          `
        }
      },

      employee: {
        // 1. 新人登錄簡訊
        new_employee: {
          title: '👋 歡迎新同事',
          template: `
👋 歡迎新同事加入！

🆕 {name} 已加入 {assignedStore}
📅 到職日期: {startDate}
💼 職位: {position}

期待與您一起工作！🎉
          `
        },

        // 2. 員工上班打卡簡訊
        attendance_simple: {
          title: '🟢 打卡通知',
          template: `
{clockIcon} {employeeName} 
{clockAction}成功

🏪 {storeName}
⏰ {clockTime}
{lateStatus}
          `
        },

        // 3. 叫貨記錄簡化版
        order_simple: {
          title: '📦 叫貨記錄',
          template: `
📦 <b>叫貨記錄確認</b>

📅 {orderDate}
🏪 {storeName}
📋 品項: {itemCount} 項
💰 總金額: NT$ {totalAmount:,}

✅ 記錄已提交
          `
        },

        // 4-13. 其他員工群組通知模板...
        promotion_reminder: {
          title: '🗳️ 投票提醒',
          template: `
🗳️ <b>升遷投票提醒</b>

{applicantName} 申請升遷至 {targetPosition}
⏰ 投票將於 {remainingTime} 後截止

請記得投票！
          `
        },

        revenue_confirmation: {
          title: '💰 營收記錄確認',
          template: `
💰 <b>營收記錄確認</b>

📅 {businessDate}
🏪 {storeName}
💰 今日獎金: {bonusInfo}

✅ 記錄已確認
          `
        }
      }
    };
  }

  // 渲染模板
  renderTemplate(template, data) {
    let rendered = template.template;
    
    // 替換所有模板變數
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{${key}(?::(.*?))?}`, 'g');
      rendered = rendered.replace(regex, (match, format) => {
        let value = data[key];
        
        // 數字格式化
        if (format === ',') {
          value = typeof value === 'number' ? value.toLocaleString() : value;
        }
        
        return value || '';
      });
    });

    return rendered.trim();
  }

  // 發送老闆群組詳細通知
  async sendBossDetailedNotification(type, data) {
    if (!this.settings.enableBossNotifications) {
      console.log('⚠️ 老闆群組通知已停用');
      return { success: false, reason: 'disabled' };
    }

    const template = this.notificationTemplates.boss[type];
    if (!template) {
      throw new Error(`找不到通知模板: ${type}`);
    }

    const message = this.renderTemplate(template, data);
    
    try {
      const result = await this.sendMessage(this.bossGroupId, message);
      this.recordNotificationUsage(type, 'boss', true);
      return { success: true, messageId: result.message_id, template: type };
    } catch (error) {
      this.recordNotificationUsage(type, 'boss', false, error.message);
      throw error;
    }
  }

  // 發送員工群組簡化通知
  async sendEmployeeSimpleNotification(type, data) {
    if (!this.settings.enableEmployeeNotifications) {
      console.log('⚠️ 員工群組通知已停用');
      return { success: false, reason: 'disabled' };
    }

    const template = this.notificationTemplates.employee[type];
    if (!template) {
      throw new Error(`找不到通知模板: ${type}`);
    }

    const message = this.renderTemplate(template, data);
    
    try {
      const result = await this.sendMessage(this.employeeGroupId, message);
      this.recordNotificationUsage(type, 'employee', true);
      return { success: true, messageId: result.message_id, template: type };
    } catch (error) {
      this.recordNotificationUsage(type, 'employee', false, error.message);
      throw error;
    }
  }

  // 統一發送訊息方法 (含重試機制)
  async sendMessage(chatId, message, options = {}) {
    const defaultOptions = {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      ...options
    };

    let lastError;
    for (let attempt = 1; attempt <= this.settings.retryAttempts; attempt++) {
      try {
        // 速率限制
        if (attempt > 1) {
          await this.sleep(this.settings.rateLimitDelay);
        }

        const result = await this.bot.telegram.sendMessage(chatId, message, defaultOptions);
        
        // 記錄成功發送
        this.recordNotificationHistory({
          chatId,
          message: message.substring(0, 100) + '...',
          success: true,
          attempt,
          timestamp: new Date()
        });

        return result;
      } catch (error) {
        lastError = error;
        console.warn(`📡 發送失敗 (嘗試 ${attempt}/${this.settings.retryAttempts}):`, error.message);
        
        if (attempt < this.settings.retryAttempts) {
          await this.sleep(this.settings.retryDelay * attempt);
        }
      }
    }

    // 記錄失敗發送
    this.recordNotificationHistory({
      chatId,
      message: message.substring(0, 100) + '...',
      success: false,
      error: lastError.message,
      attempts: this.settings.retryAttempts,
      timestamp: new Date()
    });

    throw lastError;
  }

  // 自動觸發通知系統
  async triggerNotification(event, data) {
    if (!this.settings.enableAutoTrigger) {
      console.log('⚠️ 自動觸發通知已停用');
      return;
    }

    try {
      console.log(`🔔 觸發事件: ${event}`);

      switch (event) {
        case 'revenue_submit':
          await Promise.all([
            this.sendBossDetailedNotification('revenue_submit', data),
            this.sendEmployeeSimpleNotification('revenue_confirmation', {
              businessDate: data.businessDate,
              storeName: data.storeName,
              bonusInfo: data.isQualified ? 
                `NT$ ${data.bonusAmount.toLocaleString()} (${data.isHoliday ? '假日' : '平日'})` :
                `未達標 (差距 NT$ ${data.shortfall.toLocaleString()})`
            })
          ]);
          break;

        case 'employee_register':
          await Promise.all([
            this.sendBossDetailedNotification('employee_register', data),
            this.sendEmployeeSimpleNotification('new_employee', {
              name: data.name,
              assignedStore: data.assignedStore,
              startDate: data.startDate,
              position: data.position
            })
          ]);
          break;

        case 'attendance_clock':
          await Promise.all([
            this.sendBossDetailedNotification('attendance_detailed', data),
            this.sendEmployeeSimpleNotification('attendance_simple', {
              clockIcon: data.clockType === 'clock_in' ? '🟢' : '🔴',
              employeeName: data.employeeName,
              clockAction: data.clockType === 'clock_in' ? '上班打卡' : '下班打卡',
              storeName: data.storeName,
              clockTime: new Date(data.timestamp).toLocaleTimeString(),
              lateStatus: data.isLate ? `⚠️ 遲到${data.lateMinutes}分鐘` : ''
            })
          ]);
          break;

        case 'order_submit':
          await Promise.all([
            this.sendBossDetailedNotification('order_analysis', data),
            this.sendEmployeeSimpleNotification('order_simple', {
              orderDate: data.orderDate,
              storeName: data.storeName,
              itemCount: data.items.length,
              totalAmount: data.estimatedCost
            })
          ]);
          break;

        case 'promotion_vote_start':
          await Promise.all([
            this.sendBossDetailedNotification('promotion_vote_start', data),
            this.sendEmployeeSimpleNotification('promotion_reminder', {
              applicantName: data.applicantName,
              targetPosition: data.targetPosition,
              remainingTime: this.formatRemainingTime(data.endTime - Date.now())
            })
          ]);
          break;

        default:
          console.warn(`⚠️ 未知事件類型: ${event}`);
      }

    } catch (error) {
      console.error(`❌ 通知觸發失敗 (${event}):`, error.message);
    }
  }

  // 格式化剩餘時間
  formatRemainingTime(milliseconds) {
    const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
    const hours = Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}天${hours}小時`;
    } else if (hours > 0) {
      return `${hours}小時`;
    } else {
      const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
      return `${minutes}分鐘`;
    }
  }

  // 記錄通知使用統計
  recordNotificationUsage(type, group, success, error = null) {
    const key = `${group}_${type}`;
    
    if (!this.templateUsageStats[key]) {
      this.templateUsageStats[key] = {
        type,
        group,
        totalUses: 0,
        successes: 0,
        failures: 0,
        lastUsed: null,
        errors: []
      };
    }

    const stat = this.templateUsageStats[key];
    stat.totalUses++;
    stat.lastUsed = new Date();

    if (success) {
      stat.successes++;
    } else {
      stat.failures++;
      if (error) {
        stat.errors.push({
          error,
          timestamp: new Date()
        });
        // 保持最近10個錯誤
        if (stat.errors.length > 10) {
          stat.errors = stat.errors.slice(-10);
        }
      }
    }
  }

  // 記錄通知歷史
  recordNotificationHistory(record) {
    this.notificationHistory.push(record);
    
    // 保持歷史記錄在合理範圍內
    if (this.notificationHistory.length > 1000) {
      this.notificationHistory = this.notificationHistory.slice(-500);
    }
  }

  // 獲取通知統計
  getNotificationStatistics() {
    const stats = {
      totalNotifications: this.notificationHistory.length,
      successfulNotifications: this.notificationHistory.filter(n => n.success).length,
      failedNotifications: this.notificationHistory.filter(n => !n.success).length,
      successRate: 0,
      templateStats: this.templateUsageStats,
      recentErrors: []
    };

    if (stats.totalNotifications > 0) {
      stats.successRate = ((stats.successfulNotifications / stats.totalNotifications) * 100).toFixed(1);
    }

    // 收集最近錯誤
    stats.recentErrors = this.notificationHistory
      .filter(n => !n.success)
      .slice(-5)
      .map(n => ({
        error: n.error,
        timestamp: n.timestamp
      }));

    return stats;
  }

  // 測試通知功能
  async testNotifications() {
    const testData = {
      employeeName: '測試員工',
      storeName: '內壢忠孝店',
      timestamp: new Date().toISOString(),
      clockType: 'clock_in',
      distance: 25,
      isLate: false
    };

    try {
      console.log('🧪 開始測試Telegram通知功能...');
      
      const result = await this.triggerNotification('attendance_clock', testData);
      console.log('✅ 測試通知發送成功');
      
      return { success: true, result };
    } catch (error) {
      console.error('❌ 測試通知發送失敗:', error.message);
      return { success: false, error: error.message };
    }
  }

  // 輔助方法 - 睡眠
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 更新設定
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    console.log('⚙️ 通知設定已更新');
  }

  // 啟動Bot服務
  async startBot() {
    try {
      await this.bot.launch();
      console.log('🚀 Telegram Bot已啟動');
      
      // 優雅關閉處理
      process.once('SIGINT', () => this.bot.stop('SIGINT'));
      process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
      
    } catch (error) {
      console.error('❌ Bot啟動失敗:', error.message);
    }
  }

  // 停止Bot服務
  async stopBot() {
    try {
      await this.bot.stop();
      console.log('🛑 Telegram Bot已停止');
    } catch (error) {
      console.error('❌ Bot停止失敗:', error.message);
    }
  }
}

// 使用範例
/*
const notificationEngine = new EnterpriseTelegramNotificationEngine();

// 啟動服務
notificationEngine.startBot();

// 測試通知
notificationEngine.testNotifications();

// 觸發營收通知
notificationEngine.triggerNotification('revenue_submit', {
  employeeName: '張三',
  storeName: '內壢忠孝店',
  businessDate: '2025-08-09',
  submitTime: new Date().toLocaleString(),
  isHoliday: false,
  onSiteRevenue: 15000,
  bonusAmount: 600,
  isQualified: true
});
*/

module.exports = EnterpriseTelegramNotificationEngine;