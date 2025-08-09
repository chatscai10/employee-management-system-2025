
/**
 * 密碼安全模組
 */

const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

// 密碼強度檢查規則
const passwordRules = {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireDigits: true,
    requireSpecialChars: false
};

function validatePasswordStrength(password) {
    const errors = [];
    
    if (password.length < passwordRules.minLength) {
        errors.push(`密碼長度至少需要 ${passwordRules.minLength} 個字符`);
    }
    
    if (password.length > passwordRules.maxLength) {
        errors.push(`密碼長度不能超過 ${passwordRules.maxLength} 個字符`);
    }
    
    if (passwordRules.requireUppercase && !/[A-Z]/.test(password)) {
        errors.push('密碼必須包含至少一個大寫字母');
    }
    
    if (passwordRules.requireLowercase && !/[a-z]/.test(password)) {
        errors.push('密碼必須包含至少一個小寫字母');
    }
    
    if (passwordRules.requireDigits && !/\d/.test(password)) {
        errors.push('密碼必須包含至少一個數字');
    }
    
    if (passwordRules.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
        errors.push('密碼必須包含至少一個特殊字符');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

async function hashPassword(password) {
    const validation = validatePasswordStrength(password);
    if (!validation.isValid) {
        throw new Error(`密碼不符合安全要求: ${validation.errors.join(', ')}`);
    }
    
    return await bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
}

function generateSecurePassword(length = 12) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    return password;
}

module.exports = {
    validatePasswordStrength,
    hashPassword,
    verifyPassword,
    generateSecurePassword
};