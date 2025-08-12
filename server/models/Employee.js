/**
 * ==================================
 * 員工資料模型 - Employee Model
 * ==================================
 * 基於系統邏輯.txt規格 - 員工註冊11個必填欄位
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Employee = sequelize.define('Employee', {
        // 基本資料 (系統邏輯.txt line 28-31)
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(50),
            allowNull: false,
            comment: '員工姓名 - 用作登入帳號'
        },
        idNumber: {
            type: DataTypes.STRING(20),
            allowNull: false,
            unique: true,
            comment: '身分證字號 - 用作登入密碼'
        },
        birthDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            comment: '出生日期'
        },
        gender: {
            type: DataTypes.ENUM('男', '女', '其他'),
            allowNull: false,
            comment: '性別'
        },
        hasDriverLicense: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            comment: '是否持有駕照'
        },
        phone: {
            type: DataTypes.STRING(20),
            allowNull: false,
            comment: '聯絡電話'
        },
        address: {
            type: DataTypes.TEXT,
            allowNull: false,
            comment: '聯絡地址'
        },
        
        // 緊急聯絡人資料 (系統邏輯.txt line 29)
        emergencyContactName: {
            type: DataTypes.STRING(50),
            allowNull: false,
            comment: '緊急聯絡人'
        },
        emergencyContactRelation: {
            type: DataTypes.STRING(20),
            allowNull: false,
            comment: '與緊急聯絡人關係'
        },
        emergencyContactPhone: {
            type: DataTypes.STRING(20),
            allowNull: false,
            comment: '緊急聯絡人電話'
        },
        
        // 工作相關資料 (系統邏輯.txt line 31)
        hireDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            comment: '到職日'
        },
        currentStore: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: '內壢忠孝店',
            comment: '本月所屬分店'
        },
        position: {
            type: DataTypes.STRING(30),
            allowNull: false,
            defaultValue: '實習生',
            comment: '職位階級'
        },
        positionStartDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            comment: '目前職位任職開始日期'
        },
        lineUserId: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'LINE使用者ID - 系統自動綁定'
        },
        telegramChatId: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'Telegram Chat ID - 用於通知發送'
        },
        status: {
            type: DataTypes.ENUM('審核中', '在職', '離職'),
            allowNull: false,
            defaultValue: '審核中',
            comment: '員工狀態'
        },
        
        // 系統管理欄位
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            comment: '註冊時間'
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            comment: '最後更新時間'
        }
    }, {
        tableName: 'employees',
        timestamps: true,
        indexes: [
            {
                fields: ['name', 'idNumber'],
                unique: true,
                name: 'unique_login_credentials'
            },
            {
                fields: ['currentStore'],
                name: 'idx_current_store'
            },
            {
                fields: ['position'],
                name: 'idx_position'
            },
            {
                fields: ['status'],
                name: 'idx_employee_status'
            }
        ],
        hooks: {
            beforeCreate: (employee) => {
                // 設定職位開始日期為到職日
                if (!employee.positionStartDate) {
                    employee.positionStartDate = employee.hireDate;
                }
            }
        }
    });

    // 模型關聯定義
    Employee.associate = (models) => {
        // 員工與分店關聯 - 基於分店名稱
        Employee.belongsTo(models.Store, {
            foreignKey: 'currentStore',
            targetKey: 'name',
            as: 'AssignedStore'
        });
        
        // 員工與打卡記錄關聯
        Employee.hasMany(models.AttendanceRecord, {
            foreignKey: 'employeeId',
            as: 'attendanceRecords'
        });
        
        // 員工與營收記錄關聯
        Employee.hasMany(models.RevenueRecord, {
            foreignKey: 'employeeId',
            as: 'revenueRecords'
        });
        
        // 員工與排班記錄關聯 (條件性關聯)
        if (models.Schedule) {
            Employee.hasMany(models.Schedule, {
                foreignKey: 'employeeId',
                as: 'employeeSchedules'
            });
        }
        
        // 員工與升遷投票關聯 (條件性關聯)
        if (models.PromotionVote) {
            Employee.hasMany(models.PromotionVote, {
                foreignKey: 'candidateId',
                as: 'promotionCandidates'
            });
        }
        
        // 注意：由於PromotionVote使用匿名化設計，不直接關聯到Employee
        // 如需查詢員工投票記錄，請使用PromotionVote.generateVoterFingerprint()方法
        
        // 員工與維修申請關聯 (條件性關聯)
        if (models.MaintenanceRequest) {
            Employee.hasMany(models.MaintenanceRequest, {
                foreignKey: 'requesterId',
                as: 'maintenanceRequests'
            });
        }
        
        // 員工與叫貨記錄關聯 (條件性關聯)
        if (models.OrderRecord) {
            Employee.hasMany(models.OrderRecord, {
                foreignKey: 'employeeId',
                as: 'employeeOrderRecords'
            });
        }
    };

    // 實例方法
    Employee.prototype.calculateAge = function() {
        const today = new Date();
        const birth = new Date(this.birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age;
    };

    Employee.prototype.calculateTenureDays = function() {
        const today = new Date();
        const hire = new Date(this.hireDate);
        const diffTime = Math.abs(today - hire);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    Employee.prototype.calculatePositionDays = function() {
        const today = new Date();
        const positionStart = new Date(this.positionStartDate);
        const diffTime = Math.abs(today - positionStart);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    // 類方法
    Employee.findByLoginCredentials = async function(name, idNumber) {
        return await this.findOne({
            where: {
                name: name,
                idNumber: idNumber,
                status: '在職'
            }
        });
    };

    Employee.findByStore = async function(storeName) {
        return await this.findAll({
            where: {
                currentStore: storeName,
                status: '在職'
            },
            order: [['name', 'ASC']]
        });
    };

    return Employee;
};