# 📢 Telegram通知系統詳細規劃

## 📋 功能概述
實現完整的29種Telegram通知模板，涵蓋投票生命週期的所有關鍵節點。

## 🎯 29種通知模板分類

### 📊 投票活動通知 (8種)
```javascript
const CAMPAIGN_NOTIFICATIONS = {
  // 1. 新投票活動創建
  'campaign_created': {
    template: '🗳️ 新投票活動：{campaignName}\n📝 類型：{campaignType}\n⏰ 投票期間：{startDate} - {endDate}\n🎯 參與資格：{eligibleVoters}\n\n點擊參與投票：{voteLink}',
    audience: ['eligible_voters', 'admins'],
    timing: 'immediate'
  },
  
  // 2. 投票即將開始 (提前1小時)
  'campaign_starting_soon': {
    template: '⏰ 投票即將開始！\n\n📋 活動：{campaignName}\n🕐 開始時間：{startTime}\n💡 請準備參與投票',
    audience: ['eligible_voters'],
    timing: '1_hour_before_start'
  },
  
  // 3. 投票已開始
  'campaign_started': {
    template: '🚀 投票正式開始！\n\n📋 {campaignName}\n⏳ 截止時間：{endDate}\n👥 目標：{targetDescription}\n\n立即投票：{voteLink}',
    audience: ['eligible_voters'],
    timing: 'on_start'
  },
  
  // 4. 投票即將結束 (提前6小時)
  'campaign_ending_soon': {
    template: '⚡ 投票即將截止！\n\n📋 {campaignName}\n⏰ 剩餘時間：{remainingHours}小時\n📊 當前參與率：{participationRate}%\n\n如未投票請抓緊時間：{voteLink}',
    audience: ['non_voters', 'admins'],
    timing: '6_hours_before_end'
  },
  
  // 5. 投票結束
  'campaign_ended': {
    template: '📝 投票已結束\n\n📋 {campaignName}\n📊 總投票數：{totalVotes}\n👥 參與人數：{totalVoters}\n📈 參與率：{participationRate}%\n\n結果將於24小時內公布',
    audience: ['all_employees', 'admins'],
    timing: 'on_end'
  },
  
  // 6. 投票結果公布
  'results_announced': {
    template: '📊 投票結果公布\n\n📋 {campaignName}\n✅ 結果：{result}\n📈 同意：{agreeVotes}票 ({agreePercentage}%)\n❌ 不同意：{disagreeVotes}票 ({disagreePercentage}%)\n\n{resultDescription}',
    audience: ['all_employees', 'candidates'],
    timing: 'on_result_announcement'
  },
  
  // 7. 投票活動延期
  'campaign_extended': {
    template: '⏰ 投票期限延長\n\n📋 {campaignName}\n🔄 新截止時間：{newEndDate}\n📝 延長原因：{extensionReason}\n\n繼續投票：{voteLink}',
    audience: ['eligible_voters'],
    timing: 'on_extension'
  },
  
  // 8. 投票活動取消
  'campaign_cancelled': {
    template: '🚫 投票活動取消\n\n📋 {campaignName}\n📝 取消原因：{cancellationReason}\n⏰ 取消時間：{cancelledAt}',
    audience: ['eligible_voters', 'candidates'],
    timing: 'on_cancellation'
  }
}
```

### 👤 個人投票通知 (7種)
```javascript
const PERSONAL_NOTIFICATIONS = {
  // 9. 投票成功確認
  'vote_submitted': {
    template: '✅ 投票提交成功\n\n📋 活動：{campaignName}\n🎯 您的選擇：{voteChoice}\n⏰ 提交時間：{submittedAt}\n🔐 匿名憑證：{anonymousReceipt}',
    audience: ['voter'],
    timing: 'on_vote_submission'
  },
  
  // 10. 投票修改成功
  'vote_modified': {
    template: '🔄 投票修改成功\n\n📋 活動：{campaignName}\n🎯 新選擇：{newVoteChoice}\n📊 修改次數：{modificationNumber}/3\n⏰ 修改時間：{modifiedAt}',
    audience: ['voter'],
    timing: 'on_vote_modification'
  },
  
  // 11. 投票修改次數警告
  'modification_limit_warning': {
    template: '⚠️ 投票修改次數警告\n\n📋 活動：{campaignName}\n📊 剩餘修改次數：{remainingModifications}次\n💡 請謹慎考慮後再進行修改',
    audience: ['voter'],
    timing: 'on_second_modification'
  },
  
  // 12. 投票資格獲得
  'voting_eligibility_granted': {
    template: '🎯 您已獲得投票資格\n\n📋 活動：{campaignName}\n✅ 符合條件：{eligibilityCriteria}\n⏰ 投票截止：{deadline}\n\n參與投票：{voteLink}',
    audience: ['newly_eligible_voter'],
    timing: 'on_eligibility_granted'
  },
  
  // 13. 投票提醒 (個人化)
  'personal_vote_reminder': {
    template: '📋 投票提醒\n\n您好 {employeeName}，\n📋 {campaignName} 即將截止\n⏰ 剩餘：{remainingTime}\n\n您的參與很重要：{voteLink}',
    audience: ['non_voting_eligible'],
    timing: '24_hours_before_end'
  },
  
  // 14. 投票被作廢通知
  'vote_invalidated': {
    template: '❌ 投票已被作廢\n\n📋 活動：{campaignName}\n📝 原因：{invalidationReason}\n⏰ 作廢時間：{invalidatedAt}\n\n如有疑問請聯繫管理員',
    audience: ['affected_voter'],
    timing: 'on_vote_invalidation'
  },
  
  // 15. 申訴提交確認
  'appeal_submitted': {
    template: '📋 申訴提交成功\n\n📋 投票活動：{campaignName}\n📝 申訴類型：{appealType}\n⏰ 提交時間：{submittedAt}\n📅 預計審核時間：{expectedReviewTime}天\n\n申訴編號：{appealId}',
    audience: ['appellant'],
    timing: 'on_appeal_submission'
  }
}
```

### 🤖 自動投票通知 (6種)
```javascript
const AUTO_VOTING_NOTIFICATIONS = {
  // 16. 自動轉正投票觸發
  'auto_promotion_triggered': {
    template: '🎉 自動轉正投票啟動\n\n👤 員工：{employeeName}\n📅 到職日期：{hireDate}\n📊 工作天數：{workingDays}天\n🎯 目標職位：{targetPosition}\n⏰ 投票期間：{votingPeriod}\n\n系統已自動開啟投票程序',
    audience: ['admins', 'eligible_voters'],
    timing: 'on_auto_promotion_trigger'
  },
  
  // 17. 自動降職投票觸發  
  'auto_demotion_triggered': {
    template: '⚠️ 自動降職投票啟動\n\n👤 員工：{employeeName}\n📊 本月遲到：{lateCount}次 / {lateMinutes}分鐘\n🎯 降職至：{targetPosition}\n⏰ 投票期間：{votingPeriod}\n\n達到懲罰條件，系統已自動開啟投票',
    audience: ['admins', 'eligible_voters'],
    timing: 'on_auto_demotion_trigger'
  },
  
  // 18. 轉正投票通過
  'promotion_approved': {
    template: '🎊 恭喜！轉正投票通過\n\n👤 {employeeName} 同學\n📊 投票結果：{agreePercentage}%同意\n🎯 新職位：{newPosition}\n📅 生效日期：{effectiveDate}\n\n恭喜正式成為公司一員！',
    audience: ['promoted_employee', 'all_employees'],
    timing: 'on_promotion_approval'
  },
  
  // 19. 轉正投票未通過
  'promotion_rejected': {
    template: '📝 轉正投票結果通知\n\n👤 {employeeName}\n📊 投票結果：{agreePercentage}%同意 (需50%)\n🔄 結果：未通過\n📅 緩衝期：30天\n💡 建議：繼續努力，下次機會在30天後',
    audience: ['affected_employee', 'supervisors'],
    timing: 'on_promotion_rejection'
  },
  
  // 20. 降職執行通知
  'demotion_executed': {
    template: '📋 職位變更執行通知\n\n👤 員工：{employeeName}\n📊 投票結果：{agreePercentage}%同意降職\n🔄 職位變更：{oldPosition} → {newPosition}\n📅 生效日期：{effectiveDate}\n📝 變更原因：{demotionReason}',
    audience: ['affected_employee', 'supervisors', 'hr'],
    timing: 'on_demotion_execution'
  },
  
  // 21. 懲罰投票未通過
  'demotion_rejected': {
    template: '📝 降職投票結果通知\n\n👤 {employeeName}\n📊 投票結果：{agreePercentage}%同意 (需30%)\n✅ 結果：維持原職位\n💡 提醒：請注意出勤準時',
    audience: ['affected_employee', 'supervisors'],
    timing: 'on_demotion_rejection'
  }
}
```

### ⚡ 系統監控通知 (4種)
```javascript
const SYSTEM_NOTIFICATIONS = {
  // 22. 系統健康警告
  'system_health_warning': {
    template: '⚠️ 投票系統健康警告\n\n📊 健康評分：{healthScore}/100\n🚨 問題：{issues}\n📈 建議：{recommendations}\n⏰ 檢測時間：{checkTime}',
    audience: ['system_admins'],
    timing: 'on_health_warning'
  },
  
  // 23. 定時任務執行報告
  'scheduled_job_report': {
    template: '📋 定時任務執行報告\n\n✅ 成功任務：{successfulJobs}\n❌ 失敗任務：{failedJobs}\n⏱️ 執行時間：{executionTime}\n📊 系統狀態：{systemStatus}',
    audience: ['system_admins'],
    timing: 'daily_summary'
  },
  
  // 24. 數據異常警告
  'data_anomaly_detected': {
    template: '🔍 數據異常檢測\n\n📊 異常類型：{anomalyType}\n📈 異常數值：{anomalyValue}\n🎯 影響範圍：{affectedScope}\n⚠️ 建議立即檢查系統狀態',
    audience: ['system_admins'],
    timing: 'on_anomaly_detection'
  },
  
  // 25. 投票參與率過低警告  
  'low_participation_warning': {
    template: '📉 投票參與率過低警告\n\n📋 活動：{campaignName}\n📊 當前參與率：{currentRate}%\n⏰ 剩餘時間：{remainingTime}\n💡 建議加強宣傳動員',
    audience: ['campaign_managers', 'hr'],
    timing: 'on_low_participation'
  }
}
```

### 🔧 管理員專用通知 (4種)
```javascript
const ADMIN_NOTIFICATIONS = {
  // 26. 申訴審核提醒
  'appeal_review_reminder': {
    template: '📋 申訴審核提醒\n\n📝 申訴編號：{appealId}\n👤 申訴人：{appellant}\n📋 相關活動：{campaignName}\n⏰ 提交時間：{submittedAt}\n⚠️ 請及時處理，避免超時',
    audience: ['appeal_reviewers'],
    timing: 'daily_reminder'
  },
  
  // 27. 投票操作審計
  'voting_audit_alert': {
    template: '🔍 投票操作審計警告\n\n📊 異常類型：{auditType}\n👤 相關用戶：{involvedUser}\n📋 活動：{campaignName}\n⏰ 發生時間：{alertTime}\n🔍 建議立即調查',
    audience: ['security_admins'],
    timing: 'on_audit_trigger'
  },
  
  // 28. 管理員操作記錄
  'admin_action_logged': {
    template: '📝 管理員操作記錄\n\n👤 操作人員：{adminName}\n🔧 操作類型：{actionType}\n📋 目標：{targetObject}\n⏰ 操作時間：{actionTime}\n📝 操作說明：{actionDescription}',
    audience: ['senior_admins'],
    timing: 'on_admin_action'
  },
  
  // 29. 系統統計週報
  'weekly_statistics_report': {
    template: '📊 投票系統週報\n\n📅 統計週期：{weekPeriod}\n🗳️ 總投票活動：{totalCampaigns}\n👥 參與人次：{totalParticipants}\n📈 平均參與率：{avgParticipationRate}%\n🔄 申訴案件：{appealCases}\n✅ 系統穩定性：{systemStability}%',
    audience: ['management', 'hr'],
    timing: 'weekly_monday_morning'
  }
}
```

## 📱 通知發送邏輯

### 📋 通知群組配置
```javascript
const NOTIFICATION_GROUPS = {
  // 管理員群組
  'admin': {
    chatId: '-1002658082392',
    description: '管理員專用群組',
    permissions: ['all_notifications']
  },
  
  // 員工通知群組
  'employees': {
    chatId: '-1002658082393', // 待創建
    description: '全體員工通知',
    permissions: ['general_announcements', 'voting_notifications']
  },
  
  // 人事部群組
  'hr': {
    chatId: '-1002658082394', // 待創建  
    description: '人事部專用',
    permissions: ['hr_notifications', 'appeal_updates']
  },
  
  // 系統監控群組
  'system': {
    chatId: '-1002658082395', // 待創建
    description: '系統技術人員',
    permissions: ['system_alerts', 'performance_reports']
  }
}
```

### ⏰ 發送時機控制
```javascript
const NOTIFICATION_TIMING = {
  immediate: 0, // 立即發送
  delayed_5min: 5 * 60 * 1000, // 5分鐘後
  delayed_1hour: 60 * 60 * 1000, // 1小時後
  daily_9am: '0 9 * * *', // 每日9點
  weekly_monday: '0 9 * * 1', // 週一9點
  
  // 智能發送時間 (避免休息時間)
  business_hours_only: {
    start: 9, // 9:00
    end: 18,  // 18:00
    timezone: 'Asia/Taipei'
  }
}
```

## 🛡️ 通知頻率控制

### 防止通知轟炸
```javascript
const NOTIFICATION_LIMITS = {
  // 個人通知限制
  personal: {
    maxPerDay: 10,
    maxPerHour: 3,
    cooldownBetween: 300000 // 5分鐘間隔
  },
  
  // 群組通知限制
  group: {
    maxPerHour: 5,
    priorityOverride: true // 緊急通知可突破限制
  },
  
  // 通知優先級
  priorities: {
    critical: 1, // 系統故障、安全問題
    high: 2,     // 投票截止、申訴處理
    normal: 3,   // 一般投票通知
    low: 4       // 統計報告、提醒
  }
}
```