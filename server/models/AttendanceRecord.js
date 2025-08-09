
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const AttendanceRecord = sequelize.define('AttendanceRecord', {
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
        clockTime: {
            type: DataTypes.DATE,
            allowNull: false
        },
        clockType: {
            type: DataTypes.ENUM('in', 'out'),
            allowNull: false
        },
        latitude: {
            type: DataTypes.DECIMAL(10, 8),
            allowNull: false
        },
        longitude: {
            type: DataTypes.DECIMAL(11, 8),
            allowNull: false
        },
        distance: {
            type: DataTypes.INTEGER
        },
        status: {
            type: DataTypes.ENUM('normal', 'late', 'early'),
            defaultValue: 'normal'
        }
    });

    AttendanceRecord.associate = function(models) {
        AttendanceRecord.belongsTo(models.Employee, { foreignKey: 'employeeId' });
        AttendanceRecord.belongsTo(models.Store, { foreignKey: 'storeId' });
    };

    return AttendanceRecord;
};