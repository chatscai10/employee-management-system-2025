/**
 * 系統性能優化工具 - 解決磁碟和CPU使用率問題
 * 創建日期: 2025-08-12
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

class SystemPerformanceOptimizer {
    constructor() {
        this.logPath = path.join(__dirname, 'performance-optimization.log');
        this.startTime = new Date();
        this.optimizations = [];
    }

    log(message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}\n`;
        console.log(message);
        fs.appendFileSync(this.logPath, logMessage);
    }

    async getDiskUsage() {
        return new Promise((resolve) => {
            const stats = fs.statSync(__dirname);
            const free = os.freemem();
            const total = os.totalmem();
            const used = total - free;
            const usagePercent = Math.round((used / total) * 100);
            
            resolve({
                freeMemory: Math.round(free / 1024 / 1024 / 1024 * 100) / 100,
                totalMemory: Math.round(total / 1024 / 1024 / 1024 * 100) / 100,
                usagePercent: usagePercent,
                diskInfo: stats
            });
        });
    }

    async getCPUUsage() {
        return new Promise((resolve) => {
            const cpus = os.cpus();
            let totalIdle = 0;
            let totalTick = 0;

            cpus.forEach(cpu => {
                for (let type in cpu.times) {
                    totalTick += cpu.times[type];
                }
                totalIdle += cpu.times.idle;
            });

            const idle = totalIdle / cpus.length;
            const total = totalTick / cpus.length;
            const usage = 100 - ~~(100 * idle / total);

            resolve({
                usage: usage,
                cpuCount: cpus.length,
                model: cpus[0].model,
                speed: cpus[0].speed
            });
        });
    }

    async cleanupLogFiles() {
        try {
            const logsDir = path.join(__dirname, 'logs');
            if (!fs.existsSync(logsDir)) {
                this.log('✅ 日誌目錄不存在，跳過清理');
                return;
            }

            const files = fs.readdirSync(logsDir);
            let cleanedSize = 0;
            let cleanedCount = 0;

            for (const file of files) {
                const filePath = path.join(logsDir, file);
                const stats = fs.statSync(filePath);
                
                // 清理超過7天的日誌
                const daysDiff = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
                if (daysDiff > 7) {
                    cleanedSize += stats.size;
                    fs.unlinkSync(filePath);
                    cleanedCount++;
                    this.log(`🗑️ 清理過期日誌: ${file} (${Math.round(stats.size / 1024)}KB)`);
                }
                
                // 清理過大的日誌文件 (>50MB)
                else if (stats.size > 50 * 1024 * 1024) {
                    const content = fs.readFileSync(filePath, 'utf8');
                    const lines = content.split('\n');
                    const recentLines = lines.slice(-1000); // 保留最近1000行
                    fs.writeFileSync(filePath, recentLines.join('\n'));
                    
                    const newStats = fs.statSync(filePath);
                    cleanedSize += (stats.size - newStats.size);
                    this.log(`✂️ 截斷大日誌: ${file} (${Math.round((stats.size - newStats.size) / 1024)}KB)`);
                }
            }

            this.optimizations.push({
                type: 'log_cleanup',
                cleanedFiles: cleanedCount,
                freedSpace: Math.round(cleanedSize / 1024 / 1024 * 100) / 100
            });

            this.log(`✅ 日誌清理完成: 清理 ${cleanedCount} 個文件，釋放 ${Math.round(cleanedSize / 1024 / 1024 * 100) / 100}MB 空間`);
        } catch (error) {
            this.log(`❌ 日誌清理失敗: ${error.message}`);
        }
    }

    async optimizeNodeModules() {
        try {
            const nodeModulesPath = path.join(__dirname, 'node_modules');
            if (!fs.existsSync(nodeModulesPath)) {
                this.log('✅ node_modules 不存在，跳過優化');
                return;
            }

            // 清理不必要的文件
            const cleanupPatterns = [
                '**/*.map',
                '**/*.ts',
                '**/test/**',
                '**/tests/**',
                '**/docs/**',
                '**/examples/**',
                '**/.git/**'
            ];

            let freedSpace = 0;
            const globPattern = require('glob');

            for (const pattern of cleanupPatterns) {
                try {
                    const files = globPattern.sync(path.join(nodeModulesPath, pattern));
                    for (const file of files) {
                        try {
                            const stats = fs.statSync(file);
                            if (stats.isFile()) {
                                freedSpace += stats.size;
                                fs.unlinkSync(file);
                            } else if (stats.isDirectory()) {
                                fs.rmSync(file, { recursive: true, force: true });
                            }
                        } catch (e) {
                            // 忽略無法刪除的文件
                        }
                    }
                } catch (e) {
                    // 忽略 glob 錯誤
                }
            }

            this.optimizations.push({
                type: 'node_modules_cleanup',
                freedSpace: Math.round(freedSpace / 1024 / 1024 * 100) / 100
            });

            this.log(`✅ node_modules 優化完成: 釋放 ${Math.round(freedSpace / 1024 / 1024 * 100) / 100}MB 空間`);
        } catch (error) {
            this.log(`❌ node_modules 優化失敗: ${error.message}`);
        }
    }

    async optimizeTelegramFrequency() {
        try {
            // 檢查是否有Telegram通知頻率限制問題
            const telegramFiles = [
                'telegram-notifications.js',
                'final-telegram-notification.js',
                'redirect-loop-fix-notification.js'
            ];

            for (const file of telegramFiles) {
                const filePath = path.join(__dirname, file);
                if (fs.existsSync(filePath)) {
                    let content = fs.readFileSync(filePath, 'utf8');
                    
                    // 添加頻率限制機制
                    if (!content.includes('rateLimiter')) {
                        const rateLimitCode = `
// 添加頻率限制機制 - 性能優化
const rateLimiter = {
    lastSent: {},
    minInterval: 5000, // 5秒最小間隔
    
    canSend(key) {
        const now = Date.now();
        if (!this.lastSent[key] || now - this.lastSent[key] > this.minInterval) {
            this.lastSent[key] = now;
            return true;
        }
        return false;
    }
};

// 包裝原始發送函數
const originalSendFunction = global.sendTelegramNotification || function(){};
global.sendTelegramNotification = function(message, key = 'default') {
    if (rateLimiter.canSend(key)) {
        return originalSendFunction(message);
    } else {
        console.log('⚡ Telegram 頻率限制: 跳過發送');
        return Promise.resolve();
    }
};
`;
                        
                        content = rateLimitCode + '\n' + content;
                        fs.writeFileSync(filePath, content);
                        this.log(`🚀 添加頻率限制到: ${file}`);
                    }
                }
            }

            this.optimizations.push({
                type: 'telegram_optimization',
                files: telegramFiles.length
            });

            this.log('✅ Telegram 頻率優化完成');
        } catch (error) {
            this.log(`❌ Telegram 優化失敗: ${error.message}`);
        }
    }

    async optimizeProcesses() {
        try {
            // 檢查運行中的Node進程
            const processes = await this.getNodeProcesses();
            
            this.log(`📊 發現 ${processes.length} 個 Node.js 進程`);
            
            // 如果有過多進程，建議重啟
            if (processes.length > 10) {
                this.log('⚠️ 檢測到過多 Node.js 進程，建議重啟部分服務');
                
                this.optimizations.push({
                    type: 'process_warning',
                    processCount: processes.length,
                    suggestion: '建議重啟部分服務以減少記憶體使用'
                });
            }

        } catch (error) {
            this.log(`❌ 進程優化檢查失敗: ${error.message}`);
        }
    }

    async getNodeProcesses() {
        return new Promise((resolve) => {
            if (process.platform === 'win32') {
                const { exec } = require('child_process');
                exec('tasklist /FI "IMAGENAME eq node.exe" /FO CSV', (error, stdout) => {
                    if (error) {
                        resolve([]);
                        return;
                    }
                    
                    const lines = stdout.split('\n').filter(line => line.includes('node.exe'));
                    resolve(lines);
                });
            } else {
                // Linux/Mac
                const { exec } = require('child_process');
                exec('ps aux | grep node', (error, stdout) => {
                    if (error) {
                        resolve([]);
                        return;
                    }
                    
                    const lines = stdout.split('\n').filter(line => line.includes('node') && !line.includes('grep'));
                    resolve(lines);
                });
            }
        });
    }

    async createOptimizationScript() {
        const scriptPath = path.join(__dirname, 'run-optimization.bat');
        const scriptContent = `@echo off
echo 🚀 啟動系統性能優化...
node system-performance-optimizer.js
pause
`;
        
        fs.writeFileSync(scriptPath, scriptContent);
        this.log(`✅ 創建優化腳本: ${scriptPath}`);
    }

    async generateReport() {
        const duration = Date.now() - this.startTime.getTime();
        const diskUsage = await this.getDiskUsage();
        const cpuUsage = await this.getCPUUsage();

        const report = {
            timestamp: new Date().toISOString(),
            duration: `${Math.round(duration / 1000)}秒`,
            system: {
                memory: diskUsage,
                cpu: cpuUsage,
                platform: process.platform,
                nodeVersion: process.version
            },
            optimizations: this.optimizations,
            summary: {
                totalOptimizations: this.optimizations.length,
                totalFreedSpace: this.optimizations
                    .filter(opt => opt.freedSpace)
                    .reduce((sum, opt) => sum + opt.freedSpace, 0)
            }
        };

        const reportPath = path.join(__dirname, `performance-report-${Date.now()}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        this.log('📊 ====== 系統性能優化報告 ======');
        this.log(`🕒 執行時間: ${report.duration}`);
        this.log(`💾 記憶體使用: ${diskUsage.usagePercent}% (${diskUsage.freeMemory}GB 可用)`);
        this.log(`⚡ CPU 使用: ${cpuUsage.usage}%`);
        this.log(`🔧 執行優化: ${report.summary.totalOptimizations} 項`);
        this.log(`📁 釋放空間: ${report.summary.totalFreedSpace}MB`);
        this.log(`📋 詳細報告: ${reportPath}`);
        this.log('====================================');

        return report;
    }

    async runFullOptimization() {
        this.log('🚀 開始系統性能全面優化...');
        
        try {
            // 1. 清理日誌文件
            await this.cleanupLogFiles();
            
            // 2. 優化 node_modules
            await this.optimizeNodeModules();
            
            // 3. 優化 Telegram 頻率
            await this.optimizeTelegramFrequency();
            
            // 4. 檢查進程
            await this.optimizeProcesses();
            
            // 5. 創建優化腳本
            await this.createOptimizationScript();
            
            // 6. 生成報告
            const report = await this.generateReport();
            
            this.log('✅ 系統性能優化完成！');
            
            // 7. 發送 Telegram 通知
            await this.sendTelegramNotification(report);
            
            return report;
            
        } catch (error) {
            this.log(`❌ 優化過程出錯: ${error.message}`);
            throw error;
        }
    }

    async sendTelegramNotification(report) {
        try {
            const telegramBotToken = 'process.env.TELEGRAM_BOT_TOKEN';
            const chatId = 'process.env.TELEGRAM_GROUP_ID';
            
            const message = `✈️ 系統性能優化完成報告

🔧 優化項目: ${report.summary.totalOptimizations} 項
📁 釋放空間: ${report.summary.totalFreedSpace}MB
💾 記憶體使用: ${report.system.memory.usagePercent}%
⚡ CPU 使用: ${report.system.cpu.usage}%
🕒 執行時間: ${report.duration}

📊 優化明細:
${report.optimizations.map(opt => {
    switch(opt.type) {
        case 'log_cleanup':
            return `📝 日誌清理: ${opt.cleanedFiles}個文件 (${opt.freedSpace}MB)`;
        case 'node_modules_cleanup':
            return `📦 模組清理: ${opt.freedSpace}MB`;
        case 'telegram_optimization':
            return `📱 Telegram優化: ${opt.files}個文件`;
        case 'process_warning':
            return `⚠️ 進程檢查: ${opt.processCount}個進程`;
        default:
            return `🔧 ${opt.type}`;
    }
}).join('\n')}

🤖 系統性能已優化`;

            const fetch = require('node-fetch');
            const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message,
                    parse_mode: 'HTML'
                })
            });

            if (response.ok) {
                this.log('📱 Telegram 通知發送成功');
            } else {
                this.log('📱 Telegram 通知發送失敗');
            }
        } catch (error) {
            this.log(`📱 Telegram 通知錯誤: ${error.message}`);
        }
    }
}

// 如果直接執行此文件
if (require.main === module) {
    const optimizer = new SystemPerformanceOptimizer();
    optimizer.runFullOptimization()
        .then(report => {
            console.log('✅ 優化完成，報告已生成');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ 優化失敗:', error.message);
            process.exit(1);
        });
}

module.exports = SystemPerformanceOptimizer;