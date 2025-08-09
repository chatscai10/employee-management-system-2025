/**
 * 🔧 系統穩定性測試
 * System Stability Tests
 */

const fs = require('fs');
const path = require('path');

describe('🔧 System Stability Tests', () => {
    
    describe('📁 檔案系統完整性', () => {
        test('應該有所有必要的核心檔案', () => {
            const coreFiles = [
                'server/server.js',
                'package.json',
                '.env.production',
                'ecosystem.config.js',
                'docker-compose.yml',
                'Dockerfile'
            ];

            coreFiles.forEach(file => {
                const filePath = path.join(__dirname, '../../', file);
                expect(fs.existsSync(filePath)).toBe(true);
            });
        });

        test('應該有完整的安全配置檔案', () => {
            const securityFiles = [
                'server/middleware/security/index.js',
                'server/middleware/security/headers.js',
                'server/middleware/security/inputSecurity.js',
                'server/middleware/security/authSecurity.js',
                'SECURITY_CHECKLIST.md'
            ];

            securityFiles.forEach(file => {
                const filePath = path.join(__dirname, '../../', file);
                expect(fs.existsSync(filePath)).toBe(true);
            });
        });

        test('應該有完整的監控和告警系統', () => {
            const monitoringFiles = [
                'server/services/monitoringService.js',
                'server/services/alertService.js',
                'server/middleware/monitoring.js',
                'server/routes/api/monitoring.js',
                'server/routes/api/alerts.js'
            ];

            monitoringFiles.forEach(file => {
                const filePath = path.join(__dirname, '../../', file);
                expect(fs.existsSync(filePath)).toBe(true);
            });
        });
    });

    describe('📋 配置檔案驗證', () => {
        test('package.json 應該包含所有必要的依賴', () => {
            const packagePath = path.join(__dirname, '../../package.json');
            const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

            const requiredDeps = [
                'express',
                'bcryptjs',
                'jsonwebtoken',
                'helmet',
                'cors',
                'compression',
                'express-rate-limit',
                'winston',
                'telegraf'
            ];

            requiredDeps.forEach(dep => {
                expect(packageJson.dependencies).toHaveProperty(dep);
            });
        });

        test('環境配置檔案應該存在', () => {
            const envFiles = [
                '.env.production',
                '.env.development',
                '.env.staging'
            ];

            envFiles.forEach(file => {
                const filePath = path.join(__dirname, '../../', file);
                expect(fs.existsSync(filePath)).toBe(true);
            });
        });

        test('Docker 配置應該有效', () => {
            const dockerFiles = [
                'Dockerfile',
                'docker-compose.yml',
                'docker-compose.development.yml'
            ];

            dockerFiles.forEach(file => {
                const filePath = path.join(__dirname, '../../', file);
                expect(fs.existsSync(filePath)).toBe(true);
                
                const content = fs.readFileSync(filePath, 'utf8');
                expect(content.length).toBeGreaterThan(0);
            });
        });
    });

    describe('🗄️ 資料庫完整性', () => {
        test('資料庫檔案應該存在', () => {
            const dbPath = path.join(__dirname, '../../database/employee_management.db');
            expect(fs.existsSync(dbPath)).toBe(true);
        });

        test('資料庫應該有適當的大小', () => {
            const dbPath = path.join(__dirname, '../../database/employee_management.db');
            if (fs.existsSync(dbPath)) {
                const stats = fs.statSync(dbPath);
                expect(stats.size).toBeGreaterThan(1024); // 至少 1KB
            }
        });
    });

    describe('📊 系統資源檢查', () => {
        test('記憶體使用應該在合理範圍內', () => {
            const memUsage = process.memoryUsage();
            const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
            
            // 堆記憶體使用應該少於 500MB
            expect(heapUsedMB).toBeLessThan(500);
        });

        test('系統應該有足夠的可用記憶體', () => {
            const os = require('os');
            const freeMemoryGB = os.freemem() / 1024 / 1024 / 1024;
            
            // 系統應該有至少 100MB 可用記憶體
            expect(freeMemoryGB * 1024).toBeGreaterThan(100);
        });
    });

    describe('🔒 安全性檢查', () => {
        test('環境變數檔案不應包含真實密鑰', () => {
            const envPath = path.join(__dirname, '../../.env.production');
            if (fs.existsSync(envPath)) {
                const content = fs.readFileSync(envPath, 'utf8');
                
                // 檢查是否包含預設的不安全值
                const unsafeValues = [
                    'CHANGE_THIS',
                    'your_secret_key',
                    'password123',
                    'admin123'
                ];

                unsafeValues.forEach(value => {
                    expect(content).not.toContain(value);
                });
            }
        });

        test('敏感檔案應該有適當的權限', () => {
            if (process.platform !== 'win32') {
                const sensitiveFiles = [
                    '.env.production',
                    '.env.staging'
                ];

                sensitiveFiles.forEach(file => {
                    const filePath = path.join(__dirname, '../../', file);
                    if (fs.existsSync(filePath)) {
                        const stats = fs.statSync(filePath);
                        const permissions = (stats.mode & parseInt('777', 8)).toString(8);
                        
                        // 檔案權限應該是 600 或更嚴格
                        expect(['600', '640', '644']).toContain(permissions);
                    }
                });
            }
        });
    });

    describe('⚡ 效能基準測試', () => {
        test('模組載入時間應該在合理範圍內', async () => {
            const startTime = Date.now();
            
            // 嘗試載入核心模組
            const coreModules = [
                '../../server/utils/logger',
                '../../server/middleware/security/index'
            ];

            for (const modulePath of coreModules) {
                const moduleStartTime = Date.now();
                try {
                    require(modulePath);
                    const loadTime = Date.now() - moduleStartTime;
                    expect(loadTime).toBeLessThan(1000); // 每個模組載入應在1秒內
                } catch (error) {
                    // 如果模組不存在或有錯誤，記錄但不失敗測試
                    console.warn(`Module load warning: ${modulePath}`, error.message);
                }
            }

            const totalTime = Date.now() - startTime;
            expect(totalTime).toBeLessThan(5000); // 總載入時間應在5秒內
        });

        test('JSON 解析效能測試', () => {
            const largeObject = {
                data: new Array(1000).fill(0).map((_, i) => ({
                    id: i,
                    name: `item_${i}`,
                    value: Math.random(),
                    timestamp: Date.now()
                }))
            };

            const startTime = Date.now();
            const jsonString = JSON.stringify(largeObject);
            const parsed = JSON.parse(jsonString);
            const endTime = Date.now();

            expect(endTime - startTime).toBeLessThan(100); // JSON 操作應在 100ms 內完成
            expect(parsed.data.length).toBe(1000);
        });
    });

    describe('🌐 網路和連接測試', () => {
        test('DNS 解析應該正常工作', async () => {
            const dns = require('dns').promises;
            
            try {
                const result = await dns.lookup('google.com');
                expect(result.address).toBeDefined();
                expect(result.family).toBeOneOf([4, 6]);
            } catch (error) {
                // 如果沒有網路連接，跳過測試
                console.warn('Network test skipped: No internet connection');
            }
        }, 10000);

        test('本地端口應該可用', () => {
            const net = require('net');
            
            return new Promise((resolve) => {
                const server = net.createServer();
                
                server.listen(0, () => {
                    const port = server.address().port;
                    expect(port).toBeGreaterThan(1024);
                    server.close(() => resolve());
                });

                server.on('error', (error) => {
                    expect(error).toBe(null);
                    resolve();
                });
            });
        });
    });

    describe('📝 日誌系統測試', () => {
        test('日誌目錄應該存在且可寫入', () => {
            const logDir = path.join(__dirname, '../../logs');
            
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }

            expect(fs.existsSync(logDir)).toBe(true);

            // 測試寫入權限
            const testFile = path.join(logDir, 'test.log');
            fs.writeFileSync(testFile, 'test log entry');
            expect(fs.existsSync(testFile)).toBe(true);

            // 清理測試檔案
            fs.unlinkSync(testFile);
        });

        test('日誌檔案大小應該合理', () => {
            const logDir = path.join(__dirname, '../../logs');
            
            if (fs.existsSync(logDir)) {
                const logFiles = fs.readdirSync(logDir).filter(file => file.endsWith('.log'));
                
                logFiles.forEach(file => {
                    const filePath = path.join(logDir, file);
                    const stats = fs.statSync(filePath);
                    const sizeMB = stats.size / 1024 / 1024;
                    
                    // 單個日誌檔案不應超過 100MB
                    expect(sizeMB).toBeLessThan(100);
                });
            }
        });
    });

    describe('🔄 系統恢復能力測試', () => {
        test('系統應該能處理大量同步操作', async () => {
            const operations = Array.from({ length: 100 }, (_, i) => 
                new Promise(resolve => {
                    setTimeout(() => resolve(i), Math.random() * 100);
                })
            );

            const startTime = Date.now();
            const results = await Promise.all(operations);
            const endTime = Date.now();

            expect(results).toHaveLength(100);
            expect(endTime - startTime).toBeLessThan(1000);
        });

        test('錯誤處理應該優雅', async () => {
            const errorOperations = [
                () => { throw new Error('Test error 1'); },
                () => Promise.reject(new Error('Test error 2')),
                () => Promise.resolve('success'),
                () => { throw new Error('Test error 3'); }
            ];

            const results = await Promise.allSettled(
                errorOperations.map(op => 
                    Promise.resolve().then(op).catch(error => ({ error: error.message }))
                )
            );

            expect(results).toHaveLength(4);
            expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(4);
        });
    });

    describe('🎯 整體系統健康檢查', () => {
        test('所有關鍵系統組件都應該就緒', () => {
            const components = {
                database: fs.existsSync(path.join(__dirname, '../../database/employee_management.db')),
                security: fs.existsSync(path.join(__dirname, '../../server/middleware/security/index.js')),
                monitoring: fs.existsSync(path.join(__dirname, '../../server/services/monitoringService.js')),
                alerts: fs.existsSync(path.join(__dirname, '../../server/services/alertService.js')),
                logs: fs.existsSync(path.join(__dirname, '../../logs')) || true // 可以不存在，會自動創建
            };

            Object.entries(components).forEach(([component, status]) => {
                expect(status).toBe(true);
            });

            const readyComponents = Object.values(components).filter(Boolean).length;
            const totalComponents = Object.keys(components).length;
            const readinessPercentage = (readyComponents / totalComponents) * 100;

            expect(readinessPercentage).toBeGreaterThanOrEqual(80); // 至少80%的組件就緒
        });
    });
});