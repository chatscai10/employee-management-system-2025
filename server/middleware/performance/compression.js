/**
 * 壓縮中間件
 */

const compression = require('compression');
const zlib = require('zlib');

// 壓縮配置
const compressionOptions = {
    // 壓縮閾值（bytes）
    threshold: 1024,
    
    // 壓縮等級 (0-9)
    level: 6,
    
    // 只壓縮特定的MIME類型
    filter: (req, res) => {
        // 不壓縮已經壓縮的內容
        if (req.headers['x-no-compression']) {
            return false;
        }
        
        // 使用預設的壓縮過濾器
        return compression.filter(req, res);
    }
};

// Brotli 壓縮中間件（更高效的壓縮）
const brotliMiddleware = (req, res, next) => {
    const acceptEncoding = req.headers['accept-encoding'] || '';
    
    if (acceptEncoding.includes('br')) {
        // 攔截原始的send和json方法
        const originalSend = res.send;
        const originalJson = res.json;
        
        res.send = function(data) {
            if (typeof data === 'string' && data.length > 1024) {
                zlib.brotliCompress(data, (err, compressed) => {
                    if (!err && compressed.length < data.length) {
                        res.setHeader('Content-Encoding', 'br');
                        res.setHeader('Content-Length', compressed.length);
                        return originalSend.call(this, compressed);
                    }
                    originalSend.call(this, data);
                });
                return;
            }
            originalSend.call(this, data);
        };
        
        res.json = function(data) {
            const jsonString = JSON.stringify(data);
            if (jsonString.length > 1024) {
                zlib.brotliCompress(jsonString, (err, compressed) => {
                    if (!err && compressed.length < jsonString.length) {
                        res.setHeader('Content-Encoding', 'br');
                        res.setHeader('Content-Type', 'application/json');
                        res.setHeader('Content-Length', compressed.length);
                        return res.end(compressed);
                    }
                    originalJson.call(this, data);
                });
                return;
            }
            originalJson.call(this, data);
        };
    }
    
    next();
};

module.exports = {
    compressionMiddleware: compression(compressionOptions),
    brotliMiddleware,
    compressionOptions
};