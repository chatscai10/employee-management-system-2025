/**
 * ==============================================
 * 數據模型統一管理 - 企業員工管理系統完整版
 * ==============================================
 * 基於系統邏輯.txt規格 - 20個完整資料表
 */

const { DataTypes, Sequelize } = require('sequelize');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

let sequelize = null;
let models = {};

// 創建數據庫連接
const createConnection = () => {
    // 確保資料庫目錄存在
    const dbDir = path.dirname('./database/employee_management.db');
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }

    return new Sequelize({
        dialect: 'sqlite',
        storage: './database/employee_management.db',
        logging: (msg) => {
            if (process.env.SEQUELIZE_LOGGING === 'true') {
                logger.debug('SQL:', msg);
            }
        },
        define: {
            timestamps: true,
            underscored: false,
            freezeTableName: true
        },
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    });
};

// 載入所有模型檔案
const loadModels = (sequelize) => {
    const modelFiles = [
        'Employee.js',
        'AttendanceRecord.js', 
        'Store.js',
        'RevenueRecord.js',
        'InventoryItem.js',
        'InventoryOrder.js',
        'InventoryLog.js',
        'InventoryAlert.js',
        'Schedule.js',
        'ScheduleConfig.js',
        'ScheduleSession.js',
        'WorkAssignment.js'
    ];

    modelFiles.forEach(file => {
        try {
            const modelPath = path.join(__dirname, file);
            if (fs.existsSync(modelPath)) {
                const model = require(modelPath)(sequelize);
                models[model.name] = model;
                logger.info(`✅ 載入模型: ${model.name}`);
            }
        } catch (error) {
            logger.error(`❌ 載入模型失敗 ${file}:`, error.message);
        }
    });
};

// 初始化模型
const initModels = async () => {
    if (!sequelize) {
        sequelize = createConnection();
        
        try {
            await sequelize.authenticate();
            logger.info('✅ 數據庫連接成功');
        } catch (error) {
            logger.error('❌ 數據庫連接失敗:', error);
            throw error;
        }
    }
    
    if (Object.keys(models).length === 0) {
        // 載入外部模型檔案
        loadModels(sequelize);
        
        // 如果外部檔案載入失敗，使用內聯定義 (向下相容)
        if (Object.keys(models).length === 0) {
            logger.warn('⚠️ 外部模型檔案載入失敗，使用內聯模型定義');
            
            // 員工表 - 基於系統邏輯.txt規格
            models.Employee = sequelize.define('Employee', {
                id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
                name: { type: DataTypes.STRING(50), allowNull: false, comment: '員工姓名' },
                idNumber: { type: DataTypes.STRING(20), allowNull: false, unique: true, comment: '身分證字號' },
                birthDate: { type: DataTypes.DATEONLY, allowNull: false, comment: '出生日期' },
                gender: { type: DataTypes.ENUM('男', '女', '其他'), allowNull: false, comment: '性別' },
                hasDriverLicense: { type: DataTypes.BOOLEAN, allowNull: false, comment: '是否持有駕照' },
                phone: { type: DataTypes.STRING(20), allowNull: false, comment: '聯絡電話' },
                address: { type: DataTypes.TEXT, allowNull: false, comment: '聯絡地址' },
                emergencyContactName: { type: DataTypes.STRING(50), allowNull: false, comment: '緊急聯絡人' },
                emergencyContactRelation: { type: DataTypes.STRING(20), allowNull: false, comment: '關係' },
                emergencyContactPhone: { type: DataTypes.STRING(20), allowNull: false, comment: '緊急聯絡電話' },
                hireDate: { type: DataTypes.DATEONLY, allowNull: false, comment: '到職日' },
                currentStore: { type: DataTypes.STRING(50), allowNull: false, defaultValue: '內壢忠孝店', comment: '本月所屬分店' },
                position: { type: DataTypes.STRING(30), allowNull: false, defaultValue: '實習生', comment: '職位' },
                positionStartDate: { type: DataTypes.DATEONLY, allowNull: false, comment: '職位開始日期' },
                lineUserId: { type: DataTypes.STRING(100), allowNull: true, comment: 'LINE使用者ID' },
                status: { type: DataTypes.ENUM('審核中', '在職', '離職'), allowNull: false, defaultValue: '審核中', comment: '員工狀態' }
            }, {
                tableName: 'employees',
                timestamps: true
            });

            // 分店表
            models.Store = sequelize.define('Store', {
                id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
                name: { type: DataTypes.STRING(50), allowNull: false, unique: true, comment: '店名' },
                people: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 2, comment: '最少職班人數' },
                openTime: { type: DataTypes.STRING(20), allowNull: false, defaultValue: '1500-0200', comment: '營業時間' },
                latitude: { type: DataTypes.DECIMAL(10, 7), allowNull: false, comment: 'GPS緯度' },
                longitude: { type: DataTypes.DECIMAL(10, 7), allowNull: false, comment: 'GPS經度' },
                radius: { type: DataTypes.INTEGER, allowNull: false, comment: '打卡範圍' },
                address: { type: DataTypes.TEXT, allowNull: false, comment: '地址' },
                holidayDates: { type: DataTypes.JSON, allowNull: true, defaultValue: [], comment: '公休日期' },
                forbiddenDates: { type: DataTypes.JSON, allowNull: true, defaultValue: [], comment: '禁休日期' },
                isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, comment: '是否營業中' }
            }, {
                tableName: 'stores',
                timestamps: true
            });

            // 打卡記錄表
            models.AttendanceRecord = sequelize.define('AttendanceRecord', {
                id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
                employeeId: { type: DataTypes.INTEGER, allowNull: false, comment: '員工ID' },
                employeeName: { type: DataTypes.STRING(50), allowNull: false, comment: '員工姓名' },
                storeName: { type: DataTypes.STRING(50), allowNull: false, comment: '分店名稱' },
                clockTime: { type: DataTypes.DATE, allowNull: false, comment: '打卡時間' },
                clockType: { type: DataTypes.ENUM('上班', '下班'), allowNull: false, comment: '打卡類型' },
                status: { type: DataTypes.ENUM('正常', '遲到', '早退', '異常'), allowNull: false, defaultValue: '正常', comment: '打卡狀態' },
                latitude: { type: DataTypes.DECIMAL(10, 7), allowNull: false, comment: '打卡緯度' },
                longitude: { type: DataTypes.DECIMAL(10, 7), allowNull: false, comment: '打卡經度' },
                distance: { type: DataTypes.INTEGER, allowNull: false, comment: '距離分店公尺' },
                deviceFingerprint: { type: DataTypes.JSON, allowNull: false, comment: '設備指紋' },
                lateMinutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, comment: '遲到分鐘數' },
                monthlyLateTotalMinutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, comment: '本月累計遲到' },
                isDeleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, comment: '是否作廢' },
                deletedAt: { type: DataTypes.DATE, allowNull: true, comment: '作廢時間' },
                deletedBy: { type: DataTypes.STRING(50), allowNull: true, comment: '作廢操作者' }
            }, {
                tableName: 'attendance_records',
                timestamps: true
            });

            // 營收記錄表
            models.RevenueRecord = sequelize.define('RevenueRecord', {
                id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
                employeeId: { type: DataTypes.INTEGER, allowNull: false, comment: '提交員工ID' },
                employeeName: { type: DataTypes.STRING(50), allowNull: false, comment: '提交員工姓名' },
                storeName: { type: DataTypes.STRING(50), allowNull: false, comment: '分店名稱' },
                date: { type: DataTypes.DATEONLY, allowNull: false, comment: '營收日期' },
                bonusType: { type: DataTypes.ENUM('平日獎金', '假日獎金'), allowNull: false, comment: '獎金類別' },
                orderCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, comment: '訂單數量' },
                incomeDetails: { type: DataTypes.JSON, allowNull: false, comment: '收入項目詳細' },
                totalIncome: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0, comment: '收入總額' },
                expenseDetails: { type: DataTypes.JSON, allowNull: false, comment: '支出項目詳細' },
                totalExpense: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0, comment: '支出總額' },
                netIncome: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0, comment: '淨收入' },
                bonusAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0, comment: '獎金金額' },
                bonusStatus: { type: DataTypes.ENUM('達標', '未達標'), allowNull: false, comment: '獎金達標狀態' },
                targetGap: { type: DataTypes.DECIMAL(10, 2), allowNull: true, comment: '未達標差距' },
                orderAverage: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0, comment: '平均每單金額' },
                uploadedPhotos: { type: DataTypes.JSON, allowNull: true, defaultValue: [], comment: '上傳照片列表' },
                notes: { type: DataTypes.TEXT, allowNull: true, comment: '備註' },
                isDeleted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, comment: '是否作廢' },
                deletedAt: { type: DataTypes.DATE, allowNull: true, comment: '作廢時間' },
                deletedBy: { type: DataTypes.STRING(50), allowNull: true, comment: '作廢操作者' },
                deletedReason: { type: DataTypes.TEXT, allowNull: true, comment: '作廢原因' }
            }, {
                tableName: 'revenue_records',
                timestamps: true
            });
        }

        // 使用外部模型檔案的關聯定義，不需要重複定義

        // 設定所有模型的關聯
        Object.keys(models).forEach(modelName => {
            if (models[modelName].associate) {
                models[modelName].associate(models);
            }
        });

        // 同步數據庫
        const forceSync = process.env.NODE_ENV === 'development' && process.env.FORCE_DB_SYNC === 'true';
        await sequelize.sync({ force: forceSync, alter: true });
        logger.info(`✅ 數據庫表同步完成 (force: ${forceSync})`);
    }
    
    return models;
};

// 初始化種子數據
const initSeedData = async () => {
    const models = await initModels();
    
    try {
        // 檢查是否已有分店數據
        const storeCount = await models.Store.count();
        if (storeCount === 0) {
            // 創建預設分店
            await models.Store.bulkCreate([
                {
                    name: '內壢忠孝店',
                    people: 2,
                    openTime: '1500-0200',
                    latitude: 24.9748412,
                    longitude: 121.2556713,
                    radius: 100000,
                    address: '桃園市中壢區忠孝路93-1號'
                },
                {
                    name: '桃園龍安店',
                    people: 2,
                    openTime: '1500-0200',
                    latitude: 24.9880023,
                    longitude: 121.2812737,
                    radius: 100,
                    address: '桃園市桃園區龍安街38-8號'
                },
                {
                    name: '中壢龍崗店',
                    people: 2,
                    openTime: '1500-0200',
                    latitude: 24.9298502,
                    longitude: 121.2529472,
                    radius: 100,
                    address: '桃園市中壢區龍東路190號正對面'
                }
            ]);
            logger.info('✅ 預設分店資料建立完成');
        }

        // 檢查是否已有員工數據（用於測試）
        const employeeCount = await models.Employee.count();
        if (employeeCount === 0) {
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('password123', 10);
            
            await models.Employee.create({
                name: '測試員工',
                idNumber: 'A123456789',
                birthDate: '1990-01-01',
                gender: '男',
                hasDriverLicense: false,
                phone: '0912345678',
                address: '台北市信義區',
                emergencyContactName: '緊急聯絡人',
                emergencyContactRelation: '父母',
                emergencyContactPhone: '0987654321',
                hireDate: '2024-01-01',
                currentStore: '內壢忠孝店',
                position: '實習生',
                positionStartDate: '2024-01-01',
                status: '在職'
            });
            logger.info('✅ 測試員工資料建立完成');
        }

        logger.info('✅ 系統種子數據初始化完成');
    } catch (error) {
        logger.error('❌ 種子數據初始化失敗:', error);
    }
};

module.exports = {
    initModels,
    initSeedData,
    getSequelize: () => sequelize,
    getModels: () => models
};