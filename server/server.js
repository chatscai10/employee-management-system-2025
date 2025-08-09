/**
 * ===========================
 * 企業員工管理系統 - 主伺服器
 * ===========================
 */

const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const { createServer } = require('http');
const { Server } = require('socket.io');

// 載入環境變數
require('dotenv').config();

// 載入自定義模組
const logger = require('./utils/logger');
const responseHelper = require('./utils/responseHelper');
const { errorHandler } = require('./middleware/errorHandler');
const { authMiddleware } = require('./middleware/auth');

// 載入路由
const authRoutes = require('./routes/api/auth');
const attendanceRoutes = require('./routes/api/attendance');
const revenueRoutes = require('./routes/api/revenue');
const orderRoutes = require('./routes/api/orders');
const scheduleRoutes = require('./routes/api/schedule');
const promotionRoutes = require('./routes/api/promotion');
const maintenanceRoutes = require('./routes/api/maintenance');
const adminRoutes = require('./routes/api/admin');
const monitoringRoutes = require('./routes/api/monitoring');
const alertsRoutes = require('./routes/api/alerts');
const employeesRoutes = require('./routes/api/employees');

// 載入服務
const notificationService = require('./services/notificationService');
const websocketHandler = require('./services/websocketHandler');

// 載入數據庫
const { initModels, initSeedData } = require('./models');

class EmployeeManagementServer {
    constructor() {
        this.app = express();
        this.server = createServer(this.app);
        this.io = new Server(this.server, {
            cors: {
                origin: process.env.CORS_ORIGIN || "http://localhost:3000",
                credentials: true
            }
        });
        
        this.port = process.env.PORT || 3000;
        this.host = process.env.HOST || 'localhost';
        
        this.initializeMiddleware();
        this.initializeRoutes();
        this.initializeWebSocket();
        this.initializeErrorHandling();
    }

    /**
     * 🔧 初始化中間件
     */
    initializeMiddleware() {
        logger.info('🔧 初始化中間件...');

        // 基礎安全中間件
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-hashes'"],
                    scriptSrcAttr: ["'unsafe-inline'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'", "wss:", "https:"]
                }
            },
            crossOriginEmbedderPolicy: false
        }));

        // CORS 設定
        this.app.use(cors({
            origin: process.env.CORS_ORIGIN || "http://localhost:3000",
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
        }));

        // 請求壓縮
        this.app.use(compression());

        // 請求解析
        this.app.use(express.json({ 
            limit: '10mb',
            verify: (req, res, buf) => {
                req.rawBody = buf;
            }
        }));
        this.app.use(express.urlencoded({ 
            extended: true, 
            limit: '10mb' 
        }));

        // 靜態檔案服務
        this.app.use('/public', express.static(path.join(__dirname, '..', 'public'), {
            maxAge: '1y',
            etag: true,
            lastModified: true
        }));

        // 上傳檔案服務
        this.app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
            maxAge: '1y',
            etag: true
        }));

        // 速率限制
        const limiter = rateLimit({
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15分鐘
            max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // 限制每個IP 100次請求
            message: {
                success: false,
                error: '請求過於頻繁，請稍後再試',
                code: 'RATE_LIMIT_EXCEEDED'
            },
            standardHeaders: true,
            legacyHeaders: false,
        });

        // 登入專用速率限制
        const loginLimiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15分鐘
            max: parseInt(process.env.RATE_LIMIT_LOGIN_MAX) || 5, // 限制登入嘗試
            message: {
                success: false,
                error: '登入嘗試次數過多，請15分鐘後再試',
                code: 'LOGIN_RATE_LIMIT_EXCEEDED'
            },
            skipSuccessfulRequests: true
        });

        this.app.use('/api/', limiter);
        this.app.use('/api/auth/login', loginLimiter);

        // 請求日誌中間件
        this.app.use((req, res, next) => {
            const startTime = Date.now();
            
            // 記錄請求
            logger.info(`📥 ${req.method} ${req.path}`, {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                body: req.method !== 'GET' ? req.body : undefined
            });

            // 記錄回應
            res.on('finish', () => {
                const duration = Date.now() - startTime;
                logger.info(`📤 ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`, {
                    statusCode: res.statusCode,
                    duration,
                    ip: req.ip
                });
            });

            next();
        });

        logger.info('✅ 中間件初始化完成');
    }

    /**
     * 🛣️ 初始化路由
     */
    initializeRoutes() {
        logger.info('🛣️ 初始化路由...');

        // 健康檢查端點
        this.app.get('/health', (req, res) => {
            responseHelper.success(res, {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                version: process.env.npm_package_version || '1.0.0'
            }, '系統運行正常');
        });

        // API 路由
        this.app.use('/api/auth', authRoutes);
        this.app.use('/api/attendance', attendanceRoutes);
        this.app.use('/api/revenue', revenueRoutes);
        this.app.use('/api/orders', orderRoutes);
        this.app.use('/api/schedule', scheduleRoutes);
        this.app.use('/api/promotion', promotionRoutes);
        this.app.use('/api/maintenance', maintenanceRoutes);
        this.app.use('/api/admin', adminRoutes);
        this.app.use('/api/monitoring', monitoringRoutes);
        this.app.use('/api/alerts', alertsRoutes);
        this.app.use('/api/employees', employeesRoutes);

        // 主頁面路由 (重定向到登入頁面)
        this.app.get('/', (req, res) => {
            res.redirect('/login');
        });

        // 登入頁面路由
        this.app.get('/login', (req, res) => {
            res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
        });

        // 註冊頁面路由
        this.app.get('/register', (req, res) => {
            res.sendFile(path.join(__dirname, '..', 'public', 'register.html'));
        });

        // 員工頁面路由
        this.app.get('/employee', (req, res) => {
            res.sendFile(path.join(__dirname, '..', 'public', 'employee.html'));
        });

        // 管理員頁面路由
        this.app.get('/admin', (req, res) => {
            res.sendFile(path.join(__dirname, '..', 'public', 'admin.html'));
        });

        // 系統測試頁面路由
        this.app.get('/test', (req, res) => {
            res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
        });

        // 靜態文件服務
        this.app.use('/public', express.static(path.join(__dirname, '..', 'public')));
        this.app.use('/assets', express.static(path.join(__dirname, '..', 'public')));

        // API 文檔路由 (開發環境)
        if (process.env.NODE_ENV === 'development' && process.env.API_DOCS_ENABLED === 'true') {
            this.app.get('/api-docs', (req, res) => {
                res.json({
                    name: '企業員工管理系統 API',
                    version: '1.0.0',
                    description: 'RESTful API 文檔',
                    baseURL: `http://${this.host}:${this.port}/api`,
                    endpoints: {
                        auth: '/api/auth',
                        attendance: '/api/attendance', 
                        revenue: '/api/revenue',
                        orders: '/api/orders',
                        schedule: '/api/schedule',
                        promotion: '/api/promotion',
                        maintenance: '/api/maintenance',
                        admin: '/api/admin'
                    },
                    documentation: 'https://github.com/your-repo/api-docs'
                });
            });
        }

        // 404 處理
        this.app.use('*', (req, res) => {
            if (req.originalUrl.startsWith('/api/')) {
                responseHelper.error(res, 'API 端點不存在', 'ENDPOINT_NOT_FOUND', 404);
            } else {
                // SPA 路由處理，返回主頁面
                res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
            }
        });

        logger.info('✅ 路由初始化完成');
    }

    /**
     * 🔌 初始化 WebSocket
     */
    initializeWebSocket() {
        logger.info('🔌 初始化 WebSocket...');

        // WebSocket 連接處理
        this.io.on('connection', (socket) => {
            logger.info(`🔌 WebSocket 連接: ${socket.id}`);

            // 處理認證
            socket.on('authenticate', async (token) => {
                try {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET);
                    socket.userId = decoded.userId;
                    socket.userRole = decoded.role;
                    socket.join(`user_${decoded.userId}`);
                    
                    logger.info(`✅ WebSocket 認證成功: 用戶 ${decoded.userId}`);
                    socket.emit('authenticated', { success: true });
                } catch (error) {
                    logger.error('❌ WebSocket 認證失敗:', error);
                    socket.emit('authentication_error', { error: 'Token無效' });
                }
            });

            // 處理排班系統實時更新
            socket.on('join_schedule_room', (scheduleMonth) => {
                socket.join(`schedule_${scheduleMonth}`);
                logger.info(`📅 用戶加入排班房間: ${scheduleMonth}`);
            });

            // 處理投票實時更新
            socket.on('join_vote_room', (voteId) => {
                socket.join(`vote_${voteId}`);
                logger.info(`🗳️ 用戶加入投票房間: ${voteId}`);
            });

            // 斷線處理
            socket.on('disconnect', (reason) => {
                logger.info(`🔌 WebSocket 斷線: ${socket.id} - ${reason}`);
            });

            // 錯誤處理
            socket.on('error', (error) => {
                logger.error(`❌ WebSocket 錯誤: ${socket.id}`, error);
            });
        });

        // 將 WebSocket 實例傳遞給通知服務
        notificationService.setSocketIO(this.io);
        websocketHandler.initialize(this.io);

        logger.info('✅ WebSocket 初始化完成');
    }

    /**
     * ❌ 初始化錯誤處理
     */
    initializeErrorHandling() {
        logger.info('❌ 初始化錯誤處理...');

        // 全域錯誤處理中間件
        this.app.use(errorHandler);

        // 未處理的 Promise 拒絕
        process.on('unhandledRejection', (reason, promise) => {
            logger.error('❌ 未處理的 Promise 拒絕:', reason);
            console.log('Promise:', promise);
        });

        // 未捕獲的例外
        process.on('uncaughtException', (error) => {
            logger.error('❌ 未捕獲的例外:', error);
            process.exit(1);
        });

        // 優雅關閉
        process.on('SIGTERM', () => {
            logger.info('🛑 收到 SIGTERM，開始優雅關閉...');
            this.gracefulShutdown();
        });

        process.on('SIGINT', () => {
            logger.info('🛑 收到 SIGINT，開始優雅關閉...');
            this.gracefulShutdown();
        });

        logger.info('✅ 錯誤處理初始化完成');
    }

    /**
     * 🚀 啟動伺服器
     */
    async start() {
        try {
            // 檢查資料庫連接
            await this.checkDatabaseConnection();
            
            // 啟動 HTTP 伺服器
            this.server.listen(this.port, this.host, () => {
                logger.info('🚀 伺服器啟動成功!');
                logger.info(`📍 HTTP: http://${this.host}:${this.port}`);
                logger.info(`🔌 WebSocket: ws://${this.host}:${this.port}`);
                logger.info(`📊 健康檢查: http://${this.host}:${this.port}/health`);
                logger.info(`🌐 環境: ${process.env.NODE_ENV || 'development'}`);
                logger.info(`📱 應用名稱: ${process.env.APP_NAME || '企業員工管理系統'}`);
                console.log('\n🎉 企業員工管理系統已就緒！');
                console.log('=' .repeat(50));
            });

            // 啟動定時任務
            await this.startScheduledTasks();

            // 發送啟動通知
            if (process.env.NODE_ENV === 'production') {
                await notificationService.sendSystemNotification(
                    '🚀 系統啟動通知',
                    `企業員工管理系統已成功啟動\n時間: ${new Date().toLocaleString('zh-TW')}\n環境: ${process.env.NODE_ENV}`
                );
            }

        } catch (error) {
            logger.error('❌ 伺服器啟動失敗:', error);
            process.exit(1);
        }
    }

    /**
     * 🗄️ 檢查資料庫連接
     */
    async checkDatabaseConnection() {
        try {
            logger.info('🗄️ 初始化數據庫...');
            
            // 初始化數據模型
            await initModels();
            logger.info('✅ 數據模型初始化成功');
            
            // 初始化種子數據
            await initSeedData();
            logger.info('✅ 種子數據初始化成功');
            
        } catch (error) {
            logger.error('❌ 數據庫初始化失敗:', error);
            throw error;
        }
    }

    /**
     * ⏰ 啟動定時任務
     */
    async startScheduledTasks() {
        logger.info('⏰ 啟動定時任務...');

        const cron = require('node-cron');

        // 每日備份 (凌晨2點)
        if (process.env.NODE_ENV === 'production') {
            cron.schedule('0 2 * * *', async () => {
                logger.info('💾 開始執行每日備份...');
                try {
                    const backupService = require('./services/backupService');
                    await backupService.performDailyBackup();
                    logger.info('✅ 每日備份完成');
                } catch (error) {
                    logger.error('❌ 每日備份失敗:', error);
                }
            });
        }

        // 健康檢查 (每分鐘)
        cron.schedule('* * * * *', async () => {
            try {
                const healthService = require('./services/healthService');
                await healthService.performHealthCheck();
            } catch (error) {
                logger.error('❌ 健康檢查失敗:', error);
            }
        });

        // 清理臨時檔案 (每小時)
        cron.schedule('0 * * * *', async () => {
            try {
                const cleanupService = require('./services/cleanupService');
                await cleanupService.cleanupTempFiles();
            } catch (error) {
                logger.error('❌ 臨時檔案清理失敗:', error);
            }
        });

        logger.info('✅ 定時任務啟動完成');
    }

    /**
     * 🛑 優雅關閉
     */
    async gracefulShutdown() {
        logger.info('🛑 開始優雅關閉程序...');

        try {
            // 停止接受新連接
            this.server.close(async () => {
                logger.info('📪 HTTP 伺服器已關閉');

                // 關閉 WebSocket 連接
                this.io.close(() => {
                    logger.info('🔌 WebSocket 伺服器已關閉');
                });

                // 關閉資料庫連接
                const db = require('./models');
                await db.sequelize.close();
                logger.info('🗄️ 資料庫連接已關閉');

                // 發送關閉通知
                if (process.env.NODE_ENV === 'production') {
                    await notificationService.sendSystemNotification(
                        '🛑 系統關閉通知',
                        `企業員工管理系統已優雅關閉\n時間: ${new Date().toLocaleString('zh-TW')}`
                    );
                }

                logger.info('✅ 優雅關閉完成');
                process.exit(0);
            });

            // 強制關閉超時
            setTimeout(() => {
                logger.error('❌ 優雅關閉超時，強制結束');
                process.exit(1);
            }, 30000); // 30秒超時

        } catch (error) {
            logger.error('❌ 優雅關閉過程中發生錯誤:', error);
            process.exit(1);
        }
    }
}

// 建立伺服器實例
const server = new EmployeeManagementServer();

// 如果直接執行此檔案則啟動伺服器
if (require.main === module) {
    server.start().catch(error => {
        console.error('❌ 伺服器啟動失敗:', error);
        process.exit(1);
    });
}

// 導出 Express app 供測試使用
module.exports = server.app;