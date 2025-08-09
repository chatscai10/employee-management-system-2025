
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Store = sequelize.define('Store', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        address: {
            type: DataTypes.TEXT,
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
        radius: {
            type: DataTypes.INTEGER,
            defaultValue: 100
        },
        openTime: {
            type: DataTypes.STRING
        },
        minPeople: {
            type: DataTypes.INTEGER,
            defaultValue: 1
        }
    });

    Store.associate = function(models) {
        Store.hasMany(models.Employee, { foreignKey: 'storeId' });
        Store.hasMany(models.AttendanceRecord, { foreignKey: 'storeId' });
        Store.hasMany(models.RevenueRecord, { foreignKey: 'storeId' });
    };

    return Store;
};