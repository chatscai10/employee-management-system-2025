/**
 * 🛡️ 安全HTTP標頭中間件
 * 實施生產環境必要的安全標頭
 */

const helmet = require('helmet');

// Content Security Policy 配置
const cspConfig = {
    directives: {
        defaultSrc: ["'self'"],
        styleSrc: [
            "'self'", 
            "'unsafe-inline'", 
            "https://cdn.jsdelivr.net",
            "https://cdnjs.cloudflare.com"
        ],
        scriptSrc: [
            "'self'", 
            "'unsafe-inline'", // 允許內嵌腳本在開發環境
            "https://cdn.jsdelivr.net",
            "https://cdnjs.cloudflare.com"
        ],
        scriptSrcAttr: ["'unsafe-inline'"], // 允許內嵌事件處理器
        imgSrc: [
            "'self'", 
            "data:", 
            "https:",
            "blob:"
        ],
        fontSrc: [
            "'self'", 
            "https://fonts.googleapis.com",
            "https://fonts.gstatic.com"
        ],
        connectSrc: [
            "'self'",
            process.env.CORS_ORIGIN || "'self'"
        ],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: []
    },
    reportUri: process.env.CSP_REPORT_URI || '/api/security/csp-report'
};

// 安全標頭配置
const securityHeaders = (req, res, next) => {
    // 基本安全標頭
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // HSTS (HTTP Strict Transport Security)
    if (req.secure) {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    
    // Feature Policy
    res.setHeader('Feature-Policy', 
        "geolocation 'self'; " +
        "microphone 'none'; " +
        "camera 'none'; " +
        "payment 'self'; " +
        "usb 'none'; " +
        "magnetometer 'none'"
    );
    
    next();
};

// CSP 違規報告端點
const cspReportHandler = (req, res) => {
    console.warn('CSP Violation Report:', JSON.stringify(req.body, null, 2));
    
    // 記錄到安全日誌
    const logger = require('../../utils/logger');
    logger.warn('CSP Violation', {
        violation: req.body,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
    });
    
    res.status(204).end();
};

// CORS 配置
const corsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];
        
        // 在生產環境中嚴格檢查來源
        if (process.env.NODE_ENV === 'production') {
            if (!origin || !allowedOrigins.includes(origin)) {
                return callback(new Error('CORS policy violation'));
            }
        }
        
        callback(null, true);
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

module.exports = {
    securityHeaders,
    cspConfig,
    cspReportHandler,
    corsOptions,
    helmetConfig: {
        contentSecurityPolicy: cspConfig,
        crossOriginEmbedderPolicy: false, // 根據需要調整
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        }
    }
};