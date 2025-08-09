/**
 * 日誌記錄工具
 */

const winston = require('winston');
const path = require('path');

class Logger {
    constructor() {
        this.logger = winston.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: winston.format.combine(
                winston.format.timestamp({
                    format: 'YYYY-MM-DD HH:mm:ss'
                }),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            defaultMeta: { 
                service: 'employee-management',
                version: process.env.npm_package_version || '1.0.0'
            },
            transports: [
                // 錯誤日誌
                new winston.transports.File({ 
                    filename: path.join(__dirname, '../../logs/error.log'), 
                    level: 'error',
                    maxsize: 5242880, // 5MB
                    maxFiles: 5,
                    format: winston.format.combine(
                        winston.format.timestamp(),
                        winston.format.json()
                    )
                }),
                
                // 所有日誌
                new winston.transports.File({ 
                    filename: path.join(__dirname, '../../logs/combined.log'),
                    maxsize: 5242880, // 5MB
                    maxFiles: 10,
                    format: winston.format.combine(
                        winston.format.timestamp(),
                        winston.format.json()
                    )
                })
            ]
        });

        // 開發環境下輸出到控制台
        if (process.env.NODE_ENV !== 'production') {
            this.logger.add(new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.timestamp({
                        format: 'HH:mm:ss'
                    }),
                    winston.format.printf(({ level, message, timestamp, ...meta }) => {
                        let msg = `${timestamp} ${level}: ${message}`;
                        
                        if (Object.keys(meta).length > 0) {
                            msg += `\n${JSON.stringify(meta, null, 2)}`;
                        }
                        
                        return msg;
                    })
                )
            }));
        }
    }

    info(message, meta = {}) {
        this.logger.info(message, meta);
    }

    warn(message, meta = {}) {
        this.logger.warn(message, meta);
    }

    error(message, meta = {}) {
        this.logger.error(message, meta);
    }

    debug(message, meta = {}) {
        this.logger.debug(message, meta);
    }
}

module.exports = new Logger();