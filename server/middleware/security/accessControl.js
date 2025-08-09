
/**
 * 權限控制中間件
 */

const jwt = require('jsonwebtoken');

// 角色權限定義
const roles = {
    admin: {
        permissions: ['read', 'write', 'delete', 'manage_users', 'view_reports'],
        level: 100
    },
    manager: {
        permissions: ['read', 'write', 'view_reports', 'manage_employees'],
        level: 50
    },
    employee: {
        permissions: ['read', 'write_own'],
        level: 10
    },
    guest: {
        permissions: ['read_public'],
        level: 1
    }
};

function hasPermission(userRole, requiredPermission) {
    const role = roles[userRole];
    if (!role) return false;
    
    return role.permissions.includes(requiredPermission);
}

function hasMinimumLevel(userRole, minimumLevel) {
    const role = roles[userRole];
    if (!role) return false;
    
    return role.level >= minimumLevel;
}

const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'No token provided',
            message: '需要認證'
        });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            error: 'Invalid token',
            message: '認證失效'
        });
    }
};

const authorize = (requiredPermission) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Not authenticated',
                message: '未認證'
            });
        }
        
        if (!hasPermission(req.user.role, requiredPermission)) {
            return res.status(403).json({
                success: false,
                error: 'Insufficient permissions',
                message: '權限不足'
            });
        }
        
        next();
    };
};

const requireMinimumLevel = (minimumLevel) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Not authenticated',
                message: '未認證'
            });
        }
        
        if (!hasMinimumLevel(req.user.role, minimumLevel)) {
            return res.status(403).json({
                success: false,
                error: 'Insufficient level',
                message: '權限等級不足'
            });
        }
        
        next();
    };
};

module.exports = {
    authenticate,
    authorize,
    requireMinimumLevel,
    hasPermission,
    hasMinimumLevel,
    roles
};