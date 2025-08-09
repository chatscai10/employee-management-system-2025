
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const RevenueRecord = sequelize.define('RevenueRecord', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        employeeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Employees',
                key: 'id'
            }
        },
        storeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Stores',
                key: 'id'
            }
        },
        date: {
            type: DataTypes.DATE,
            allowNull: false
        },
        totalIncome: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0
        },
        totalExpense: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0
        },
        netIncome: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0
        },
        bonusAmount: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0
        },
        notes: {
            type: DataTypes.TEXT
        },
        status: {
            type: DataTypes.ENUM('draft', 'submitted', 'approved'),
            defaultValue: 'draft'
        }
    });

    RevenueRecord.associate = function(models) {
        RevenueRecord.belongsTo(models.Employee, { foreignKey: 'employeeId' });
        RevenueRecord.belongsTo(models.Store, { foreignKey: 'storeId' });
    };

    return RevenueRecord;
};