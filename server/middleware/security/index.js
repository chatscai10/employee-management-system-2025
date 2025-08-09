/**
 * 🛡️ 安全中間件集成
 * 統一的安全中間件配置和使用
 */

// 導入所有安全中間件
const { securityHeaders, cspReportHandler, corsOptions } = require('./headers');
const { advancedInputSecurity, fileUploadSecurity } = require('./inputSecurity');
const { enhancedAuth } = require('./authSecurity');
const { sqlInjectionProtection } = require('./sqlProtection');
const { xssProtection } = require('./xssProtection');

// 導入性能和限制中間件
const { basicRateLimit, strictRateLimit, apiRateLimit } = require('../performance/rateLimit');
const { compressionMiddleware } = require('../performance/compression');
const { cacheMiddleware } = require('../performance/cache');

// 導入第三方安全中間件
const helmet = require('helmet');
const cors = require('cors');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');

/**
 * 配置基本安全中間件
 * 適用於所有路由
 */
function configureBasicSecurity(app) {
    console.log('🛡️ 配置基本安全中間件...');
    
    // 信任代理（如果使用反向代理）
    app.set('trust proxy', 1);
    
    // Helmet 基本安全標頭
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
                scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'"]
            }
        },
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        }
    }));
    
    // CORS 配置
    app.use(cors(corsOptions));
    
    // 自定義安全標頭
    app.use(securityHeaders);
    
    // HTTP 參數污染保護
    app.use(hpp());
    
    // MongoDB 注入保護
    app.use(mongoSanitize());
    
    // 壓縮中間件
    app.use(compressionMiddleware);
    
    // 基本速率限制
    app.use(basicRateLimit);
    
    console.log('✅ 基本安全中間件配置完成');
}

/**
 * 配置API安全中間件
 * 適用於 /api 路由
 */
function configureAPISecurity(app) {
    console.log('🔒 配置API安全中間件...');
    
    // API 速率限制
    app.use('/api', apiRateLimit);
    
    // 高級輸入安全檢查
    app.use('/api', advancedInputSecurity({
        strictMode: process.env.NODE_ENV === 'production',
        blockSuspicious: true,
        logViolations: true
    }));
    
    // SQL 注入保護
    app.use('/api', sqlInjectionProtection);
    
    // XSS 保護
    app.use('/api', xssProtection);
    
    // CSP 違規報告端點
    app.post('/api/security/csp-report', cspReportHandler);
    
    console.log('✅ API安全中間件配置完成');
}

/**
 * 配置認證路由安全
 * 適用於認證相關路由
 */
function configureAuthSecurity(app) {
    console.log('🔐 配置認證安全中間件...');
    
    // 登入相關路由使用嚴格速率限制
    app.use(['/api/auth/login', '/api/auth/register'], strictRateLimit);
    
    // 認證中間件
    const authRoutes = [
        '/api/employees',
        '/api/attendance',
        '/api/revenue',
        '/api/admin',
        '/api/schedule'
    ];
    
    authRoutes.forEach(route => {
        app.use(route, enhancedAuth({
            requireValid: true,
            logAccess: true
        }));
    });
    
    console.log('✅ 認證安全中間件配置完成');
}

/**
 * 配置文件上傳安全
 */
function configureFileUploadSecurity(app) {
    console.log('📁 配置文件上傳安全中間件...');
    
    // 文件上傳路由的安全檢查
    app.use('/api/*/upload', fileUploadSecurity);
    app.use('/api/revenue/add', fileUploadSecurity); // 營收照片上傳
    app.use('/api/maintenance/report', fileUploadSecurity); // 維修照片上傳
    
    console.log('✅ 文件上傳安全中間件配置完成');
}

/**
 * 配置快取安全
 */
function configureCacheSecurity(app) {
    console.log('⚡ 配置快取安全中間件...');
    
    // 只對特定API端點使用緩存
    const cacheableRoutes = [
        '/api/stores',
        '/api/reports',
        '/api/statistics'
    ];
    
    cacheableRoutes.forEach(route => {
        app.use(route, cacheMiddleware(300)); // 5分鐘快取
    });
    
    console.log('✅ 快取安全中間件配置完成');
}

/**
 * 配置生產環境專用安全
 */
function configureProductionSecurity(app) {
    if (process.env.NODE_ENV !== 'production') {
        return;
    }
    
    console.log('🏭 配置生產環境專用安全中間件...');
    
    // 更嚴格的安全標頭
    app.use((req, res, next) => {
        res.setHeader('Server', 'Enterprise-System'); // 隱藏服務器信息
        res.removeHeader('X-Powered-By');
        next();
    });
    
    // 生產環境錯誤處理
    app.use((err, req, res, next) => {
        // 不暴露錯誤詳情
        if (err.status !== 404 && err.status !== 400) {
            console.error('Production error:', err);
        }
        
        res.status(err.status || 500).json({
            success: false,
            error: 'INTERNAL_ERROR',
            message: '系統暫時無法處理請求'
        });
    });
    
    console.log('✅ 生產環境專用安全配置完成');
}

/**
 * 一鍵配置所有安全中間件
 */
function configureAllSecurity(app) {
    console.log('🚀 開始配置完整安全中間件套件...');
    
    configureBasicSecurity(app);
    configureAPISecurity(app);
    configureAuthSecurity(app);
    configureFileUploadSecurity(app);
    configureCacheSecurity(app);
    configureProductionSecurity(app);
    
    console.log('🎉 完整安全中間件套件配置完成！');
    console.log('🛡️ 系統安全等級：生產環境就緒');
}

module.exports = {
    configureBasicSecurity,
    configureAPISecurity,
    configureAuthSecurity,
    configureFileUploadSecurity,
    configureCacheSecurity,
    configureProductionSecurity,
    configureAllSecurity
};