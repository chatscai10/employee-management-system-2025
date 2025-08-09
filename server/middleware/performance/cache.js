/**
 * 緩存中間件
 */

const NodeCache = require('node-cache');

// 創建緩存實例
const cache = new NodeCache({
    stdTTL: 600, // 預設10分鐘過期
    checkperiod: 120, // 每2分鐘檢查過期項目
    useClones: false
});

// 生成緩存鍵
function generateCacheKey(req) {
    const { method, originalUrl, query, user } = req;
    const userId = user ? user.id : 'anonymous';
    return `${method}:${originalUrl}:${JSON.stringify(query)}:${userId}`;
}

// 緩存中間件
const cacheMiddleware = (ttl = 600) => {
    return (req, res, next) => {
        // 只緩存GET請求
        if (req.method !== 'GET') {
            return next();
        }
        
        const key = generateCacheKey(req);
        const cachedData = cache.get(key);
        
        if (cachedData) {
            console.log(`Cache hit: ${key}`);
            return res.json(cachedData);
        }
        
        // 攔截原始的json方法
        const originalJson = res.json;
        res.json = function(data) {
            // 只緩存成功的回應
            if (data && data.success !== false) {
                cache.set(key, data, ttl);
                console.log(`Cache set: ${key}`);
            }
            
            // 調用原始方法
            originalJson.call(this, data);
        };
        
        next();
    };
};

// 清除特定模式的緩存
function clearCache(pattern) {
    const keys = cache.keys();
    const matchingKeys = keys.filter(key => key.includes(pattern));
    
    matchingKeys.forEach(key => {
        cache.del(key);
    });
    
    console.log(`Cleared ${matchingKeys.length} cache entries matching: ${pattern}`);
}

// 獲取緩存統計
function getCacheStats() {
    return {
        keys: cache.getStats().keys,
        hits: cache.getStats().hits,
        misses: cache.getStats().misses,
        ksize: cache.getStats().ksize,
        vsize: cache.getStats().vsize
    };
}

module.exports = {
    cacheMiddleware,
    clearCache,
    getCacheStats,
    cache
};