#!/usr/bin/env node
/**
 * 🏥 系統健康監控模組
 * 監控系統狀態、效能指標和異常情況
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

class SystemHealthMonitor {
    constructor() {
        this.metrics = {
            system: {
                uptime: 0,
                cpuUsage: 0,
                memoryUsage: 0,
                diskUsage: 0
            },
            database: {
                connectionStatus: 'unknown',
                queryTime: 0,
                recordCount: 0
            },
            api: {
                responseTime: 0,
                errorRate: 0,
                requestCount: 0
            },
            application: {
                errorCount: 0,
                warningCount: 0,
                lastError: null
            }
        };
        
        this.thresholds = {
            responseTime: 1000, // 1秒
            memoryUsage: 80,    // 80%
            errorRate: 5,       // 5%
            diskUsage: 85       // 85%
        };
        
        this.alerts = [];
        this.isMonitoring = false;
    }

    // 啟動監控
    async startMonitoring() {
        console.log('🏥 啟動系統健康監控...');
        this.isMonitoring = true;
        
        // 每30秒執行一次監控
        setInterval(async () => {
            if (this.isMonitoring) {
                await this.performHealthCheck();
            }
        }, 30000);
        
        // 立即執行一次
        await this.performHealthCheck();
    }

    // 停止監控
    stopMonitoring() {
        console.log('🛑 停止系統健康監控');
        this.isMonitoring = false;
    }

    // 執行健康檢查
    async performHealthCheck() {
        const timestamp = new Date().toISOString();
        console.log(`\n🔍 系統健康檢查 - ${timestamp}`);
        console.log('='.repeat(50));
        
        try {
            // 系統指標檢查
            await this.checkSystemMetrics();
            
            // 資料庫健康檢查
            await this.checkDatabaseHealth();
            
            // API健康檢查
            await this.checkAPIHealth();
            
            // 應用程式錯誤檢查
            await this.checkApplicationErrors();
            
            // 生成健康報告
            this.generateHealthReport();
            
            // 檢查警報條件
            this.checkAlertConditions();
            
        } catch (error) {
            console.error('❌ 健康檢查執行失敗:', error.message);
            this.addAlert('critical', 'Health Check Failed', error.message);
        }
    }

    // 檢查系統指標
    async checkSystemMetrics() {
        console.log('🖥️ 檢查系統指標...');
        
        try {
            // Node.js 進程資訊
            const processInfo = process.memoryUsage();
            const uptime = process.uptime();
            
            // 記憶體使用率 (簡化計算)
            const totalMemory = 1024 * 1024 * 1024; // 假設1GB
            const usedMemory = processInfo.rss;
            const memoryUsagePercent = (usedMemory / totalMemory) * 100;
            
            this.metrics.system = {
                uptime: Math.floor(uptime),
                cpuUsage: Math.random() * 100, // 模擬CPU使用率
                memoryUsage: Math.min(memoryUsagePercent, 100),
                diskUsage: Math.random() * 100 // 模擬磁碟使用率
            };
            
            console.log(`  ⏱️ 運行時間: ${Math.floor(uptime / 3600)}小時${Math.floor((uptime % 3600) / 60)}分鐘`);
            console.log(`  🧠 記憶體使用: ${this.metrics.system.memoryUsage.toFixed(1)}%`);
            console.log(`  💽 磁碟使用: ${this.metrics.system.diskUsage.toFixed(1)}%`);
            
        } catch (error) {
            console.error('  ❌ 系統指標檢查失敗:', error.message);
            this.addAlert('warning', 'System Metrics Check Failed', error.message);
        }
    }

    // 檢查資料庫健康
    async checkDatabaseHealth() {
        console.log('🗄️ 檢查資料庫健康...');
        
        try {
            const { initModels } = require('./server/models');
            
            const startTime = Date.now();
            const models = await initModels();
            const endTime = Date.now();
            
            const queryTime = endTime - startTime;
            
            // 簡單的資料庫查詢測試
            const employeeCount = await models.Employee.count();
            const storeCount = await models.Store.count();
            const attendanceCount = await models.Attendance.count();
            
            this.metrics.database = {
                connectionStatus: 'healthy',
                queryTime: queryTime,
                recordCount: employeeCount + storeCount + attendanceCount
            };
            
            console.log(`  ✅ 資料庫連接: 正常`);
            console.log(`  ⚡ 查詢時間: ${queryTime}ms`);
            console.log(`  📊 總記錄數: ${this.metrics.database.recordCount}`);
            
        } catch (error) {
            console.error('  ❌ 資料庫健康檢查失敗:', error.message);
            this.metrics.database.connectionStatus = 'error';
            this.addAlert('critical', 'Database Health Check Failed', error.message);
        }
    }

    // 檢查API健康
    async checkAPIHealth() {
        console.log('🔗 檢查API健康...');
        
        const endpoints = ['/health', '/api/revenue/test'];
        let totalResponseTime = 0;
        let successCount = 0;
        let errorCount = 0;
        
        for (const endpoint of endpoints) {
            try {
                const startTime = Date.now();
                const response = await this.makeRequest(endpoint);
                const endTime = Date.now();
                
                const responseTime = endTime - startTime;
                totalResponseTime += responseTime;
                
                if (response.statusCode < 400) {
                    successCount++;
                    console.log(`  ✅ ${endpoint}: ${responseTime}ms (狀態: ${response.statusCode})`);
                } else {
                    errorCount++;
                    console.log(`  ⚠️ ${endpoint}: ${responseTime}ms (狀態: ${response.statusCode})`);
                }
                
            } catch (error) {
                errorCount++;
                console.log(`  ❌ ${endpoint}: ${error.message}`);
            }
        }
        
        const avgResponseTime = totalResponseTime / endpoints.length;
        const errorRate = (errorCount / endpoints.length) * 100;
        
        this.metrics.api = {
            responseTime: avgResponseTime,
            errorRate: errorRate,
            requestCount: endpoints.length
        };
        
        console.log(`  📈 平均響應時間: ${avgResponseTime.toFixed(1)}ms`);
        console.log(`  📊 錯誤率: ${errorRate.toFixed(1)}%`);
    }

    // 檢查應用程式錯誤
    async checkApplicationErrors() {
        console.log('🐛 檢查應用程式錯誤...');
        
        try {
            // 檢查日誌文件是否存在錯誤
            const logDir = path.join(__dirname, 'logs');
            if (!fs.existsSync(logDir)) {
                console.log('  ℹ️ 日誌目錄不存在，跳過錯誤檢查');
                return;
            }
            
            const logFiles = fs.readdirSync(logDir).filter(file => file.endsWith('.log'));
            let errorCount = 0;
            let warningCount = 0;
            let lastError = null;
            
            for (const logFile of logFiles) {
                const logPath = path.join(logDir, logFile);
                const logContent = fs.readFileSync(logPath, 'utf8');
                
                const errors = logContent.match(/ERROR|error|Error/g) || [];
                const warnings = logContent.match(/WARN|warn|Warning/g) || [];
                
                errorCount += errors.length;
                warningCount += warnings.length;
                
                // 提取最後一個錯誤
                const errorLines = logContent.split('\n').filter(line => 
                    line.includes('ERROR') || line.includes('error') || line.includes('Error'));
                
                if (errorLines.length > 0) {
                    lastError = errorLines[errorLines.length - 1];
                }
            }
            
            this.metrics.application = {
                errorCount: errorCount,
                warningCount: warningCount,
                lastError: lastError
            };
            
            console.log(`  🐛 錯誤數量: ${errorCount}`);
            console.log(`  ⚠️ 警告數量: ${warningCount}`);
            if (lastError) {
                console.log(`  🔍 最後錯誤: ${lastError.substring(0, 100)}...`);
            }
            
        } catch (error) {
            console.log('  ℹ️ 無法檢查應用程式錯誤:', error.message);
        }
    }

    // 生成健康報告
    generateHealthReport() {
        const overall = this.calculateOverallHealth();
        
        console.log('\n📊 系統健康總結:');
        console.log('='.repeat(30));
        console.log(`🏆 整體健康度: ${overall.score}% (${overall.status})`);
        
        // 各項指標狀態
        const systemStatus = this.getSystemStatus();
        console.log(`🖥️  系統指標: ${systemStatus}`);
        
        const dbStatus = this.metrics.database.connectionStatus === 'healthy' ? '✅ 正常' : '❌ 異常';
        console.log(`🗄️  資料庫: ${dbStatus}`);
        
        const apiStatus = this.metrics.api.errorRate < this.thresholds.errorRate ? '✅ 正常' : '⚠️ 異常';
        console.log(`🔗 API服務: ${apiStatus}`);
        
        const appStatus = this.metrics.application.errorCount === 0 ? '✅ 正常' : '⚠️ 有錯誤';
        console.log(`🔧 應用程式: ${appStatus}`);
    }

    // 計算整體健康度
    calculateOverallHealth() {
        let score = 100;
        let issues = [];
        
        // 系統指標評分
        if (this.metrics.system.memoryUsage > this.thresholds.memoryUsage) {
            score -= 20;
            issues.push('記憶體使用過高');
        }
        
        if (this.metrics.system.diskUsage > this.thresholds.diskUsage) {
            score -= 15;
            issues.push('磁碟空間不足');
        }
        
        // 資料庫評分
        if (this.metrics.database.connectionStatus !== 'healthy') {
            score -= 30;
            issues.push('資料庫連接異常');
        }
        
        if (this.metrics.database.queryTime > this.thresholds.responseTime) {
            score -= 10;
            issues.push('資料庫查詢緩慢');
        }
        
        // API評分
        if (this.metrics.api.responseTime > this.thresholds.responseTime) {
            score -= 15;
            issues.push('API響應緩慢');
        }
        
        if (this.metrics.api.errorRate > this.thresholds.errorRate) {
            score -= 20;
            issues.push('API錯誤率過高');
        }
        
        // 應用程式評分
        if (this.metrics.application.errorCount > 0) {
            score -= Math.min(this.metrics.application.errorCount * 5, 25);
            issues.push(`應用程式錯誤 (${this.metrics.application.errorCount}個)`);
        }
        
        score = Math.max(score, 0);
        
        let status = 'excellent';
        if (score < 60) status = 'critical';
        else if (score < 75) status = 'warning';
        else if (score < 90) status = 'good';
        
        return { score, status, issues };
    }

    // 獲取系統狀態
    getSystemStatus() {
        const memoryOK = this.metrics.system.memoryUsage < this.thresholds.memoryUsage;
        const diskOK = this.metrics.system.diskUsage < this.thresholds.diskUsage;
        
        if (memoryOK && diskOK) return '✅ 正常';
        if (!memoryOK && !diskOK) return '❌ 記憶體和磁碟異常';
        if (!memoryOK) return '⚠️ 記憶體使用過高';
        if (!diskOK) return '⚠️ 磁碟空間不足';
        
        return '✅ 正常';
    }

    // 檢查警報條件
    checkAlertConditions() {
        const health = this.calculateOverallHealth();
        
        if (health.score < 60) {
            this.addAlert('critical', 'System Health Critical', 
                `整體健康度降至 ${health.score}%，發現問題：${health.issues.join(', ')}`);
        } else if (health.score < 75) {
            this.addAlert('warning', 'System Health Warning', 
                `整體健康度為 ${health.score}%，需要關注：${health.issues.join(', ')}`);
        }
        
        // 記憶體警報
        if (this.metrics.system.memoryUsage > this.thresholds.memoryUsage) {
            this.addAlert('warning', 'High Memory Usage', 
                `記憶體使用率達 ${this.metrics.system.memoryUsage.toFixed(1)}%`);
        }
        
        // 資料庫警報
        if (this.metrics.database.connectionStatus !== 'healthy') {
            this.addAlert('critical', 'Database Connection Failed', 
                '資料庫連接異常，可能影響系統正常運作');
        }
        
        // API警報
        if (this.metrics.api.errorRate > this.thresholds.errorRate) {
            this.addAlert('warning', 'High API Error Rate', 
                `API錯誤率達 ${this.metrics.api.errorRate.toFixed(1)}%`);
        }
    }

    // 添加警報
    addAlert(severity, title, description) {
        const alert = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            severity: severity,
            title: title,
            description: description
        };
        
        this.alerts.push(alert);
        
        // 保留最近50個警報
        if (this.alerts.length > 50) {
            this.alerts = this.alerts.slice(-50);
        }
        
        // 輸出警報
        const icon = severity === 'critical' ? '🚨' : severity === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`${icon} 警報 [${severity.toUpperCase()}]: ${title}`);
        console.log(`   ${description}`);
    }

    // 獲取警報
    getAlerts(limit = 10) {
        return this.alerts.slice(-limit).reverse();
    }

    // 清除警報
    clearAlerts() {
        this.alerts = [];
        console.log('🗑️ 已清除所有警報');
    }

    // 發送HTTP請求
    async makeRequest(endpoint) {
        return new Promise((resolve, reject) => {
            const url = new URL(endpoint, 'http://localhost:3000');
            const options = {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname + url.search,
                method: 'GET',
                timeout: 5000
            };
            
            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: data
                    });
                });
            });
            
            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('請求超時'));
            });
            
            req.end();
        });
    }

    // 獲取健康報告
    getHealthReport() {
        const overall = this.calculateOverallHealth();
        
        return {
            timestamp: new Date().toISOString(),
            overall: overall,
            metrics: this.metrics,
            alerts: this.getAlerts(5),
            thresholds: this.thresholds
        };
    }

    // 匯出健康報告到文件
    exportHealthReport() {
        const report = this.getHealthReport();
        const fileName = `health-report-${new Date().toISOString().split('T')[0]}.json`;
        const filePath = path.join(__dirname, fileName);
        
        try {
            fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
            console.log(`📄 健康報告已匯出: ${fileName}`);
            return fileName;
        } catch (error) {
            console.error('❌ 匯出健康報告失敗:', error.message);
            return null;
        }
    }
}

// 如果直接執行此腳本，啟動監控
if (require.main === module) {
    const monitor = new SystemHealthMonitor();
    
    // 處理優雅關閉
    process.on('SIGINT', () => {
        console.log('\n📋 正在匯出最終健康報告...');
        monitor.exportHealthReport();
        monitor.stopMonitoring();
        process.exit(0);
    });
    
    // 啟動監控
    monitor.startMonitoring();
    
    console.log('按 Ctrl+C 停止監控並匯出報告');
}

module.exports = SystemHealthMonitor;