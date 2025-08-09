/**
 * ⚡ 系統效能優化中間件
 * System Performance Optimization Middleware
 */

const compression = require('compression');
const cluster = require('cluster');
const os = require('os');

/**
 * 記憶體優化配置
 */
const memoryOptimization = () => {
    // 設置 V8 引擎記憶體限制
    if (process.env.NODE_ENV === 'production') {
        // 生產環境設置更高的記憶體限制
        process.env.NODE_OPTIONS = '--max-old-space-size=2048';
    } else {
        // 開發環境設置較低的記憶體限制
        process.env.NODE_OPTIONS = '--max-old-space-size=1024';
    }

    // 定期觸發垃圾回收
    if (global.gc) {
        setInterval(() => {
            const memUsage = process.memoryUsage();
            const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
            
            // 如果堆記憶體使用超過 500MB，觸發垃圾回收
            if (heapUsedMB > 500) {
                global.gc();
                console.log(`🧹 觸發垃圾回收 - 堆記憶體使用: ${heapUsedMB}MB`);
            }
        }, 300000); // 每5分鐘檢查一次
    }
};

/**
 * 資料庫連接池優化
 */
const databaseOptimization = (sequelize) => {
    if (sequelize) {
        // 優化連接池設置
        const poolConfig = {
            max: process.env.DB_POOL_MAX || 20,
            min: process.env.DB_POOL_MIN || 5,
            acquire: 30000,
            idle: 10000,
            evict: 1000,
            handleDisconnects: true
        };

        // 監控資料庫連接狀態
        setInterval(async () => {
            try {
                const connections = sequelize.connectionManager.pool;
                if (connections) {
                    console.log(`📊 資料庫連接池狀態 - 使用中: ${connections.using.length}, 可用: ${connections.available.length}`);
                }
            } catch (error) {
                console.warn('無法獲取連接池狀態:', error.message);
            }
        }, 60000); // 每分鐘檢查一次
    }
};

/**
 * HTTP 回應優化中間件
 */
const responseOptimization = (req, res, next) => {
    // 設置效能相關的 HTTP 標頭
    res.setHeader('X-DNS-Prefetch-Control', 'on');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // 根據內容類型設置快取策略
    const originalSend = res.send;
    res.send = function(data) {
        const contentType = res.getHeader('Content-Type') || '';
        
        // 為 API 回應設置適當的快取標頭
        if (contentType.includes('application/json')) {
            if (req.path.includes('/api/monitoring/')) {
                // 監控數據不快取
                res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            } else if (req.path.includes('/api/employees/') || req.path.includes('/api/attendance/')) {
                // 動態數據短期快取
                res.setHeader('Cache-Control', 'private, max-age=60');
            } else {
                // 其他 API 數據中期快取
                res.setHeader('Cache-Control', 'private, max-age=300');
            }
        }
        
        // 壓縮回應
        if (data && typeof data === 'object') {
            data = JSON.stringify(data);
        }
        
        originalSend.call(this, data);
    };
    
    next();
};

/**
 * 請求去重中間件
 */
const requestDeduplication = () => {
    const pendingRequests = new Map();
    
    return (req, res, next) => {
        // 對 GET 請求進行去重
        if (req.method === 'GET') {
            const key = `${req.method}:${req.originalUrl}:${JSON.stringify(req.query)}`;
            
            if (pendingRequests.has(key)) {
                // 如果有相同請求正在處理，等待結果
                const pending = pendingRequests.get(key);
                pending.then(result => {
                    res.json(result);
                }).catch(error => {
                    res.status(500).json({ error: error.message });
                });
                return;
            }
            
            // 創建新的請求 Promise
            const requestPromise = new Promise((resolve, reject) => {
                const originalSend = res.send;
                res.send = function(data) {
                    try {
                        const result = typeof data === 'string' ? JSON.parse(data) : data;
                        resolve(result);
                        pendingRequests.delete(key);
                    } catch (error) {
                        reject(error);
                        pendingRequests.delete(key);
                    }
                    originalSend.call(this, data);
                };
                
                // 設置超時
                setTimeout(() => {
                    if (pendingRequests.has(key)) {
                        pendingRequests.delete(key);
                        reject(new Error('請求超時'));
                    }
                }, 30000); // 30秒超時
            });
            
            pendingRequests.set(key, requestPromise);
        }
        
        next();
    };
};

/**
 * 靜態資源優化中間件
 */
const staticResourceOptimization = (express) => {
    return express.static('public', {
        maxAge: process.env.NODE_ENV === 'production' ? '1y' : '1d',
        etag: true,
        lastModified: true,
        setHeaders: (res, path) => {
            // 為不同類型的靜態資源設置不同的快取策略
            if (path.match(/\.(css|js)$/)) {
                res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1年
            } else if (path.match(/\.(png|jpg|jpeg|gif|svg|ico)$/)) {
                res.setHeader('Cache-Control', 'public, max-age=2592000'); // 30天
            } else if (path.match(/\.(woff|woff2|ttf|eot)$/)) {
                res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1年
            } else {
                res.setHeader('Cache-Control', 'public, max-age=86400'); // 1天
            }
        }
    });
};

/**
 * 集群模式優化
 */
const clusterOptimization = () => {
    if (process.env.NODE_ENV === 'production' && cluster.isMaster) {
        const numCPUs = os.cpus().length;
        const maxWorkers = process.env.CLUSTER_WORKERS || numCPUs;
        
        console.log(`🚀 啟動 ${maxWorkers} 個工作進程`);
        
        // 創建工作進程
        for (let i = 0; i < maxWorkers; i++) {
            cluster.fork();
        }
        
        // 監聽工作進程退出
        cluster.on('exit', (worker, code, signal) => {
            console.log(`工作進程 ${worker.process.pid} 已退出，重新啟動中...`);
            cluster.fork();
        });
        
        // 優雅關閉
        process.on('SIGTERM', () => {
            console.log('收到 SIGTERM，正在關閉所有工作進程...');
            for (const id in cluster.workers) {
                cluster.workers[id].kill();
            }
        });
        
        return true; // 表示這是主進程
    }
    
    return false; // 表示這是工作進程
};

/**
 * 連接數限制優化
 */
const connectionLimitOptimization = () => {
    const connections = new Set();
    let maxConnections = process.env.MAX_CONNECTIONS || 1000;
    
    return (req, res, next) => {
        if (connections.size >= maxConnections) {
            res.status(503).json({
                success: false,
                error: 'SERVER_BUSY',
                message: '伺服器繁忙，請稍後再試'
            });
            return;
        }
        
        connections.add(req.socket);
        
        req.socket.on('close', () => {
            connections.delete(req.socket);
        });
        
        next();
    };
};

/**
 * CPU 使用率監控與限流
 */
const cpuLoadBalancing = () => {
    let cpuUsage = 0;
    
    // 每10秒更新 CPU 使用率
    setInterval(() => {
        const startUsage = process.cpuUsage();
        
        setTimeout(() => {
            const endUsage = process.cpuUsage(startUsage);
            const totalUsage = endUsage.user + endUsage.system;
            cpuUsage = totalUsage / 1000000; // 轉換為秒
        }, 100);
    }, 10000);
    
    return (req, res, next) => {
        // 如果 CPU 使用率過高，限制非關鍵請求
        if (cpuUsage > 80 && !req.path.includes('/api/monitoring/health')) {
            res.status(503).json({
                success: false,
                error: 'HIGH_CPU_LOAD',
                message: '系統負載過高，請稍後再試'
            });
            return;
        }
        
        next();
    };
};

/**
 * 初始化所有優化
 */
const initializeOptimizations = (app, options = {}) => {
    console.log('⚡ 初始化系統效能優化...');
    
    // 檢查是否為集群主進程
    const isMaster = clusterOptimization();
    if (isMaster) {
        return; // 主進程不需要初始化其他優化
    }
    
    // 記憶體優化
    memoryOptimization();
    
    // 資料庫優化
    if (options.sequelize) {
        databaseOptimization(options.sequelize);
    }
    
    // 應用中間件
    app.use(compression({
        level: 6,
        threshold: 1024,
        filter: (req, res) => {
            if (req.headers['x-no-compression']) {
                return false;
            }
            return compression.filter(req, res);
        }
    }));
    
    app.use(connectionLimitOptimization());
    app.use(cpuLoadBalancing());
    app.use(responseOptimization);
    app.use(requestDeduplication());
    
    // 靜態資源優化
    if (options.enableStaticOptimization !== false) {
        app.use(staticResourceOptimization(require('express')));
    }
    
    console.log('✅ 系統效能優化初始化完成');
};

module.exports = {
    initializeOptimizations,
    memoryOptimization,
    databaseOptimization,
    responseOptimization,
    requestDeduplication,
    staticResourceOptimization,
    clusterOptimization,
    connectionLimitOptimization,
    cpuLoadBalancing
};