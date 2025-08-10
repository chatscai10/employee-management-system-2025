/**
 * ===================================
 * 值班分配模型 - WorkAssignment Model
 * ===================================
 * 管理員手動值班分配系統
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const WorkAssignment = sequelize.define('WorkAssignment', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        assignmentYear: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '值班年份'
        },
        assignmentMonth: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '值班月份'
        },
        assignmentDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            comment: '值班日期'
        },
        storeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'stores',
                key: 'id'
            }
        },
        storeName: {
            type: DataTypes.STRING(50),
            allowNull: false,
            comment: '分店名稱'
        },
        employeeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'employees',
                key: 'id'
            }
        },
        employeeName: {
            type: DataTypes.STRING(50),
            allowNull: false,
            comment: '員工姓名'
        },
        assignmentType: {
            type: DataTypes.ENUM('regular', 'support', 'overtime'),
            defaultValue: 'regular',
            comment: '值班類型'
        },
        isConfirmed: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: '是否已確認值班'
        },
        assignedBy: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: '分配者姓名'
        },
        assignedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: '分配確認時間'
        }
    }, {
        tableName: 'work_assignments',
        timestamps: true,
        indexes: [
            {
                fields: ['assignmentYear', 'assignmentMonth'],
                name: 'idx_work_assignment_period'
            },
            {
                fields: ['assignmentDate'],
                name: 'idx_work_assignment_date'
            },
            {
                fields: ['employeeId', 'assignmentDate'],
                name: 'idx_work_assignment_employee_date'
            },
            {
                fields: ['storeId', 'assignmentDate'],
                name: 'idx_work_assignment_store_date'
            },
            {
                unique: true,
                fields: ['employeeId', 'assignmentDate', 'storeId'],
                name: 'idx_work_assignment_unique'
            }
        ],
        comment: '管理員值班分配表'
    });

    return WorkAssignment;
};