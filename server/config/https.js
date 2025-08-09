/**
 * 🔒 HTTPS 和 SSL 配置
 * 生產環境SSL/TLS配置
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// SSL 證書路徑配置
const sslConfig = {
    // 生產環境證書路徑
    certPath: process.env.SSL_CERT_PATH || path.join(__dirname, '../ssl/cert.pem'),
    keyPath: process.env.SSL_KEY_PATH || path.join(__dirname, '../ssl/key.pem'),
    caPath: process.env.SSL_CA_PATH || null,
    
    // SSL 選項
    secureProtocol: 'TLSv1_2_method',
    honorCipherOrder: true,
    ciphers: [
        'ECDHE-ECDSA-AES256-GCM-SHA384',
        'ECDHE-RSA-AES256-GCM-SHA384',
        'ECDHE-ECDSA-CHACHA20-POLY1305',
        'ECDHE-RSA-CHACHA20-POLY1305',
        'ECDHE-ECDSA-AES128-GCM-SHA256',
        'ECDHE-RSA-AES128-GCM-SHA256'
    ].join(':'),
    
    // HTTPS 重定向配置
    httpsPort: process.env.HTTPS_PORT || 443,
    httpPort: process.env.HTTP_PORT || 80,
    
    // HSTS 配置
    hstsMaxAge: 31536000, // 1年
    hstsIncludeSubDomains: true,
    hstsPreload: true
};

// 創建 HTTPS 選項
function createHTTPSOptions() {
    const options = {
        secureProtocol: sslConfig.secureProtocol,
        honorCipherOrder: sslConfig.honorCipherOrder,
        ciphers: sslConfig.ciphers
    };
    
    try {
        // 讀取證書文件
        if (fs.existsSync(sslConfig.keyPath)) {
            options.key = fs.readFileSync(sslConfig.keyPath);
        }
        
        if (fs.existsSync(sslConfig.certPath)) {
            options.cert = fs.readFileSync(sslConfig.certPath);
        }
        
        // CA 證書（如果有的話）
        if (sslConfig.caPath && fs.existsSync(sslConfig.caPath)) {
            options.ca = fs.readFileSync(sslConfig.caPath);
        }
        
        return options;
    } catch (error) {
        console.error('❌ SSL 證書讀取失敗:', error.message);
        return null;
    }
}

// HTTP 到 HTTPS 重定向中間件
const httpsRedirect = (req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
        const httpsUrl = `https://${req.get('host')}${req.url}`;
        return res.redirect(301, httpsUrl);
    }
    next();
};

// HSTS 標頭中間件
const hstsHeader = (req, res, next) => {
    res.setHeader(
        'Strict-Transport-Security', 
        `max-age=${sslConfig.hstsMaxAge}; includeSubDomains${sslConfig.hstsPreload ? '; preload' : ''}`
    );
    next();
};

// 創建 HTTPS 伺服器
function createHTTPSServer(app) {
    const httpsOptions = createHTTPSOptions();
    
    if (!httpsOptions || !httpsOptions.key || !httpsOptions.cert) {
        console.warn('⚠️ SSL 證書未找到，將使用 HTTP 模式');
        console.warn('🔒 生產環境建議配置 HTTPS');
        return null;
    }
    
    const httpsServer = https.createServer(httpsOptions, app);
    
    httpsServer.on('error', (error) => {
        console.error('❌ HTTPS 伺服器錯誤:', error);
    });
    
    return httpsServer;
}

// SSL 證書驗證
function validateSSLCertificate() {
    const issues = [];
    
    if (!fs.existsSync(sslConfig.certPath)) {
        issues.push(`證書文件不存在: ${sslConfig.certPath}`);
    }
    
    if (!fs.existsSync(sslConfig.keyPath)) {
        issues.push(`私鑰文件不存在: ${sslConfig.keyPath}`);
    }
    
    // 可以添加更多證書驗證邏輯
    // 例如：檢查證書過期時間、域名匹配等
    
    return {
        valid: issues.length === 0,
        issues: issues
    };
}

// 生成自簽名證書（僅用於開發環境）
function generateSelfSignedCert() {
    const selfsigned = require('selfsigned');
    
    const attrs = [
        { name: 'commonName', value: 'localhost' },
        { name: 'countryName', value: 'TW' },
        { name: 'stateOrProvinceName', value: 'Taiwan' },
        { name: 'localityName', value: 'Taipei' },
        { name: 'organizationName', value: 'Employee Management System' }
    ];
    
    const options = {
        keySize: 2048,
        days: 365,
        algorithm: 'sha256',
        extensions: [
            {
                name: 'subjectAltName',
                altNames: [
                    { type: 2, value: 'localhost' },
                    { type: 2, value: '127.0.0.1' }
                ]
            }
        ]
    };
    
    const pems = selfsigned.generate(attrs, options);
    
    // 創建 SSL 目錄
    const sslDir = path.join(__dirname, '../ssl');
    if (!fs.existsSync(sslDir)) {
        fs.mkdirSync(sslDir, { recursive: true });
    }
    
    // 寫入證書文件
    fs.writeFileSync(path.join(sslDir, 'cert.pem'), pems.cert);
    fs.writeFileSync(path.join(sslDir, 'key.pem'), pems.private);
    
    console.log('✅ 自簽名證書已生成 (僅用於開發環境)');
    console.log('🔒 生產環境請使用正式的SSL證書');
    
    return {
        cert: pems.cert,
        key: pems.private
    };
}

module.exports = {
    sslConfig,
    createHTTPSOptions,
    createHTTPSServer,
    httpsRedirect,
    hstsHeader,
    validateSSLCertificate,
    generateSelfSignedCert
};