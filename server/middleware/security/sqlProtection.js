
/**
 * SQL注入防護中間件
 */

const sqlInjectionPatterns = [
    /('|(\-\-)|(;)|(\||\|)|(\*|\*))/i,
    /(union|select|insert|delete|update|create|drop|exec|execute)/i,
    /(script|javascript|vbscript|onload|onerror)/i
];

function detectSQLInjection(input) {
    if (typeof input !== 'string') return false;
    
    return sqlInjectionPatterns.some(pattern => pattern.test(input));
}

function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
        .replace(/'/g, "''")
        .replace(/;/g, '')
        .replace(/--/g, '')
        .replace(/\/\*/g, '')
        .replace(/\*/\/g, '');
}

const sqlInjectionProtection = (req, res, next) => {
    const checkObject = (obj) => {
        for (const key in obj) {
            if (typeof obj[key] === 'string') {
                if (detectSQLInjection(obj[key])) {
                    return res.status(400).json({
                        success: false,
                        error: 'Invalid input detected',
                        message: '輸入包含不安全內容'
                    });
                }
                obj[key] = sanitizeInput(obj[key]);
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                checkObject(obj[key]);
            }
        }
    };
    
    if (req.body) checkObject(req.body);
    if (req.query) checkObject(req.query);
    if (req.params) checkObject(req.params);
    
    next();
};

module.exports = {
    sqlInjectionProtection,
    detectSQLInjection,
    sanitizeInput
};