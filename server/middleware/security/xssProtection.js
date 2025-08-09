
/**
 * XSS防護中間件
 */

const DOMPurify = require('isomorphic-dompurify');

const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<.*?>/gi
];

function detectXSS(input) {
    if (typeof input !== 'string') return false;
    
    return xssPatterns.some(pattern => pattern.test(input));
}

function sanitizeHTML(input) {
    if (typeof input !== 'string') return input;
    
    // 基本的XSS清理
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

const xssProtection = (req, res, next) => {
    const cleanObject = (obj) => {
        for (const key in obj) {
            if (typeof obj[key] === 'string') {
                if (detectXSS(obj[key])) {
                    console.warn(`XSS attempt detected: ${obj[key]}`);
                }
                obj[key] = sanitizeHTML(obj[key]);
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                cleanObject(obj[key]);
            }
        }
    };
    
    if (req.body) cleanObject(req.body);
    if (req.query) cleanObject(req.query);
    
    next();
};

module.exports = {
    xssProtection,
    detectXSS,
    sanitizeHTML
};