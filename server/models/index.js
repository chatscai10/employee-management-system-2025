/**
 * 數據模型統一管理
 */

const { DataTypes, Sequelize } = require('sequelize');
const logger = require('../utils/logger');

let sequelize = null;
let models = null;

// 創建數據庫連接
const createConnection = () => {
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
    
    if (!models) {
        models = {};

        // 員工表
        models.Employee = sequelize.define('Employee', {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            employeeId: { type: DataTypes.STRING, allowNull: true, unique: true },
            name: { type: DataTypes.STRING, allowNull: false },
            email: { type: DataTypes.STRING, allowNull: true, unique: true },
            password: { type: DataTypes.STRING, allowNull: true },
            idNumber: { type: DataTypes.STRING, unique: true, allowNull: true },
            birthday: { type: DataTypes.DATEONLY, allowNull: true },
            gender: { type: DataTypes.STRING, allowNull: true },
            hasLicense: { type: DataTypes.BOOLEAN, defaultValue: false },
            phone: { type: DataTypes.STRING, allowNull: true },
            address: { type: DataTypes.TEXT, allowNull: true },
            emergencyContact: { type: DataTypes.STRING, allowNull: true },
            relationship: { type: DataTypes.STRING, allowNull: true },
            emergencyPhone: { type: DataTypes.STRING, allowNull: true },
            startDate: { type: DataTypes.DATEONLY, allowNull: true, defaultValue: DataTypes.NOW },
            storeId: { type: DataTypes.INTEGER, allowNull: false },
            position: { type: DataTypes.STRING, defaultValue: '實習生' },
            lineUserId: { type: DataTypes.STRING },
            status: { type: DataTypes.ENUM('審核中', '在職', '離職'), defaultValue: '審核中' }
        });

        // 分店表  
        models.Store = sequelize.define('Store', {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            name: { type: DataTypes.STRING, allowNull: false },
            minPeople: { type: DataTypes.INTEGER, defaultValue: 2 },
            openTime: { type: DataTypes.STRING, defaultValue: '1500-0200' },
            latitude: { type: DataTypes.DECIMAL(10, 8), allowNull: false },
            longitude: { type: DataTypes.DECIMAL(11, 8), allowNull: false },
            radius: { type: DataTypes.INTEGER, defaultValue: 100 },
            address: { type: DataTypes.TEXT, allowNull: false }
        });

        // 打卡記錄表
        models.Attendance = sequelize.define('Attendance', {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            employeeId: { type: DataTypes.INTEGER, allowNull: false },
            storeId: { type: DataTypes.INTEGER, allowNull: false },
            clockTime: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
            clockType: { type: DataTypes.ENUM('上班', '下班'), allowNull: false },
            latitude: { type: DataTypes.DECIMAL(10, 8), allowNull: false },
            longitude: { type: DataTypes.DECIMAL(11, 8), allowNull: false },
            distance: { type: DataTypes.INTEGER },
            deviceFingerprint: { type: DataTypes.TEXT },
            status: { type: DataTypes.ENUM('正常', '遲到', '異常'), defaultValue: '正常' },
            notes: { type: DataTypes.TEXT }
        });

        // 營收記錄表
        models.Revenue = sequelize.define('Revenue', {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            employeeId: { type: DataTypes.INTEGER, allowNull: false },
            storeId: { type: DataTypes.INTEGER, allowNull: false },
            date: { type: DataTypes.DATEONLY, allowNull: false },
            bonusType: { type: DataTypes.ENUM('平日獎金', '假日獎金'), allowNull: false },
            orderCount: { type: DataTypes.INTEGER, defaultValue: 0 },
            income: { type: DataTypes.JSON }, // 收入明細
            expense: { type: DataTypes.JSON }, // 支出明細
            totalIncome: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
            totalExpense: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
            netIncome: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
            bonusAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
            photos: { type: DataTypes.JSON }, // 照片路徑
            notes: { type: DataTypes.TEXT },
            status: { type: DataTypes.ENUM('正常', '已作廢'), defaultValue: '正常' }
        });

        // 叫貨記錄表
        models.Order = sequelize.define('Order', {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            employeeId: { type: DataTypes.INTEGER, allowNull: false },
            storeId: { type: DataTypes.INTEGER, allowNull: false },
            deliveryDate: { type: DataTypes.DATEONLY, allowNull: false },
            items: { type: DataTypes.JSON }, // 叫貨品項
            totalAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
            supplierSummary: { type: DataTypes.JSON }, // 依廠商分類統計
            status: { type: DataTypes.ENUM('正常', '已作廢'), defaultValue: '正常' },
            notes: { type: DataTypes.TEXT }
        });

        // 排班記錄表
        models.Schedule = sequelize.define('Schedule', {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            employeeId: { type: DataTypes.INTEGER, allowNull: false },
            month: { type: DataTypes.STRING, allowNull: false }, // YYYY-MM
            offDays: { type: DataTypes.JSON }, // 休假日期
            totalOffDays: { type: DataTypes.INTEGER, defaultValue: 0 },
            weekendOffDays: { type: DataTypes.INTEGER, defaultValue: 0 },
            status: { type: DataTypes.ENUM('已提交', '已作廢'), defaultValue: '已提交' }
        });

        // 升遷投票表
        models.PromotionVote = sequelize.define('PromotionVote', {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            candidateId: { type: DataTypes.INTEGER, allowNull: false },
            currentPosition: { type: DataTypes.STRING, allowNull: false },
            targetPosition: { type: DataTypes.STRING, allowNull: false },
            startDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
            endDate: { type: DataTypes.DATE, allowNull: false },
            totalVoters: { type: DataTypes.INTEGER, defaultValue: 0 },
            agreeVotes: { type: DataTypes.INTEGER, defaultValue: 0 },
            disagreeVotes: { type: DataTypes.INTEGER, defaultValue: 0 },
            requiredRatio: { type: DataTypes.DECIMAL(3, 2), allowNull: false },
            status: { type: DataTypes.ENUM('進行中', '通過', '未通過'), defaultValue: '進行中' }
        });

        // 維修申請表
        models.Maintenance = sequelize.define('Maintenance', {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            employeeId: { type: DataTypes.INTEGER, allowNull: false },
            storeId: { type: DataTypes.INTEGER, allowNull: false },
            equipment: { type: DataTypes.STRING, allowNull: false },
            category: { type: DataTypes.STRING, allowNull: false },
            urgency: { type: DataTypes.ENUM('低', '中', '高'), defaultValue: '中' },
            description: { type: DataTypes.TEXT, allowNull: false },
            photos: { type: DataTypes.JSON },
            status: { type: DataTypes.ENUM('待處理', '處理中', '已完成'), defaultValue: '待處理' },
            completedAt: { type: DataTypes.DATE },
            notes: { type: DataTypes.TEXT }
        });

        // 系統設置表
        models.SystemConfig = sequelize.define('SystemConfig', {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            configKey: { type: DataTypes.STRING, unique: true, allowNull: false },
            configValue: { type: DataTypes.JSON, allowNull: false },
            description: { type: DataTypes.TEXT }
        });

        // 建立關聯
        models.Employee.belongsTo(models.Store, { foreignKey: 'storeId' });
        models.Store.hasMany(models.Employee, { foreignKey: 'storeId' });

        models.Attendance.belongsTo(models.Employee, { foreignKey: 'employeeId' });
        models.Attendance.belongsTo(models.Store, { foreignKey: 'storeId' });

        models.Revenue.belongsTo(models.Employee, { foreignKey: 'employeeId' });
        models.Revenue.belongsTo(models.Store, { foreignKey: 'storeId' });

        models.Order.belongsTo(models.Employee, { foreignKey: 'employeeId' });
        models.Order.belongsTo(models.Store, { foreignKey: 'storeId' });

        models.Schedule.belongsTo(models.Employee, { foreignKey: 'employeeId' });

        models.PromotionVote.belongsTo(models.Employee, { foreignKey: 'candidateId' });

        models.Maintenance.belongsTo(models.Employee, { foreignKey: 'employeeId' });
        models.Maintenance.belongsTo(models.Store, { foreignKey: 'storeId' });

        // 同步數據庫 (測試環境強制重建)
        const forceSync = process.env.NODE_ENV === 'test' || process.env.FORCE_DB_SYNC === 'true';
        await sequelize.sync({ force: forceSync });
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
                    minPeople: 2,
                    openTime: '1500-0200',
                    latitude: 24.9748412,
                    longitude: 121.2556713,
                    radius: 100,
                    address: '桃園市中壢區忠孝路93-1號'
                },
                {
                    name: '桃園龍安店',
                    minPeople: 2,
                    openTime: '1500-0200',
                    latitude: 24.9880023,
                    longitude: 121.2812737,
                    radius: 100,
                    address: '桃園市桃園區龍安街38-8號'
                },
                {
                    name: '中壢龍崗店',
                    minPeople: 2,
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
                employeeId: 'EMP001',
                name: '測試員工',
                email: 'test@example.com',
                password: hashedPassword,
                idNumber: 'A123456789',
                birthday: '1990-01-01',
                gender: '男',
                hasLicense: false,
                phone: '0912345678',
                address: '台北市信義區',
                emergencyContact: '緊急聯絡人',
                relationship: '父母',
                emergencyPhone: '0987654321',
                startDate: '2024-01-01',
                storeId: 1,
                position: '員工',
                status: '在職'
            });
            logger.info('✅ 測試員工資料建立完成');
        }

        // 初始化系統配置
        const configCount = await models.SystemConfig.count();
        if (configCount === 0) {
            await models.SystemConfig.bulkCreate([
                {
                    configKey: 'income_types',
                    configValue: [
                        { name: "現場營業額", serviceFee: 0, includeInBonus: true },
                        { name: "線上點餐", serviceFee: 0, includeInBonus: true },
                        { name: "熊貓點餐", serviceFee: 0.35, includeInBonus: true },
                        { name: "uber點餐", serviceFee: 0.35, includeInBonus: true },
                        { name: "廢油回收", serviceFee: 0, includeInBonus: false }
                    ],
                    description: '營收類型設定'
                },
                {
                    configKey: 'expense_types',
                    configValue: ["瓦斯", "水電", "房租", "貨款", "清潔費", "其他"],
                    description: '支出類型設定'
                },
                {
                    configKey: 'telegram_config',
                    configValue: {
                        botToken: '7659930552:AAF_jF1rAXFnjFO176-9X5fKfBwbrko8BNc',
                        bossGroupId: '-1002658082392',
                        employeeGroupId: '-1002658082392'
                    },
                    description: 'Telegram機器人設定'
                }
            ]);
            logger.info('✅ 系統配置建立完成');
        }
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