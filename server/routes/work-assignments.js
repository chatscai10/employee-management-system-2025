const express = require('express');
const router = express.Router();
const { getModels } = require('../models');

/**
 * ======================================
 * Work Assignments API Routes
 * 管理員值班分配系統 API
 * ======================================
 */

/**
 * 創建值班分配
 * POST /api/work-assignments
 */
router.post('/', async (req, res) => {
    try {
        const models = getModels();
        if (!models.WorkAssignment || !models.Employee || !models.Store) {
            return res.status(500).json({
                success: false,
                error: '模型未初始化'
            });
        }

        const { 
            assignmentDate, 
            employeeId, 
            storeId, 
            assignmentType = 'regular',
            assignedBy,
            assignedAt 
        } = req.body;

        if (!assignmentDate || !employeeId || !storeId || !assignedBy) {
            return res.status(400).json({
                success: false,
                error: '缺少必要參數: assignmentDate, employeeId, storeId, assignedBy'
            });
        }

        // 驗證員工和分店存在
        const [employee, store] = await Promise.all([
            models.Employee.findByPk(employeeId),
            models.Store.findByPk(storeId)
        ]);

        if (!employee) {
            return res.status(404).json({
                success: false,
                error: '員工不存在'
            });
        }

        if (!store) {
            return res.status(404).json({
                success: false,
                error: '分店不存在'
            });
        }

        // 檢查是否已存在相同分配
        const existingAssignment = await models.WorkAssignment.findOne({
            where: {
                employeeId,
                assignmentDate,
                storeId
            }
        });

        if (existingAssignment) {
            return res.status(409).json({
                success: false,
                error: '該員工在此日期此分店已有值班分配'
            });
        }

        // 解析日期
        const dateObj = new Date(assignmentDate);
        const year = dateObj.getFullYear();
        const month = dateObj.getMonth() + 1;

        // 創建值班分配
        const assignment = await models.WorkAssignment.create({
            assignmentYear: year,
            assignmentMonth: month,
            assignmentDate,
            storeId,
            storeName: store.name,
            employeeId,
            employeeName: employee.name,
            assignmentType,
            isConfirmed: false,
            assignedBy,
            assignedAt: assignedAt || new Date()
        });

        console.log(`✅ 值班分配成功 - ${employee.name} 於 ${assignmentDate} 在 ${store.name} ${assignmentType}值班`);

        res.json({
            success: true,
            message: '值班分配成功',
            data: {
                id: assignment.id,
                assignmentDate: assignment.assignmentDate,
                employeeName: assignment.employeeName,
                storeName: assignment.storeName,
                assignmentType: assignment.assignmentType,
                assignedBy: assignment.assignedBy,
                assignedAt: assignment.assignedAt
            }
        });

    } catch (error) {
        console.error('創建值班分配錯誤:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * 獲取指定期間的值班分配
 * GET /api/work-assignments/:year/:month
 */
router.get('/:year/:month', async (req, res) => {
    try {
        const models = getModels();
        if (!models.WorkAssignment) {
            return res.status(500).json({
                success: false,
                error: '模型未初始化'
            });
        }

        const { year, month } = req.params;
        
        const assignments = await models.WorkAssignment.findAll({
            where: {
                assignmentYear: parseInt(year),
                assignmentMonth: parseInt(month)
            },
            order: [['assignmentDate', 'ASC'], ['storeName', 'ASC']]
        });

        res.json({
            success: true,
            data: assignments.map(a => ({
                id: a.id,
                assignmentDate: a.assignmentDate,
                storeName: a.storeName,
                employeeName: a.employeeName,
                assignmentType: a.assignmentType,
                isConfirmed: a.isConfirmed,
                assignedBy: a.assignedBy,
                assignedAt: a.assignedAt
            }))
        });

    } catch (error) {
        console.error('獲取值班分配錯誤:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * 獲取特定日期的值班分配
 * GET /api/work-assignments/date/:date
 */
router.get('/date/:date', async (req, res) => {
    try {
        const models = getModels();
        if (!models.WorkAssignment) {
            return res.status(500).json({
                success: false,
                error: '模型未初始化'
            });
        }

        const { date } = req.params;
        
        const assignments = await models.WorkAssignment.findAll({
            where: {
                assignmentDate: date
            },
            order: [['storeName', 'ASC'], ['assignmentType', 'ASC']]
        });

        // 按分店分組
        const groupedByStore = {};
        assignments.forEach(assignment => {
            if (!groupedByStore[assignment.storeName]) {
                groupedByStore[assignment.storeName] = [];
            }
            groupedByStore[assignment.storeName].push({
                id: assignment.id,
                employeeName: assignment.employeeName,
                assignmentType: assignment.assignmentType,
                isConfirmed: assignment.isConfirmed,
                assignedBy: assignment.assignedBy
            });
        });

        res.json({
            success: true,
            data: {
                date,
                totalAssignments: assignments.length,
                storeAssignments: groupedByStore
            }
        });

    } catch (error) {
        console.error('獲取特定日期值班分配錯誤:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * 獲取員工的值班分配記錄
 * GET /api/work-assignments/employee/:employeeId/:year/:month
 */
router.get('/employee/:employeeId/:year/:month', async (req, res) => {
    try {
        const models = getModels();
        if (!models.WorkAssignment) {
            return res.status(500).json({
                success: false,
                error: '模型未初始化'
            });
        }

        const { employeeId, year, month } = req.params;
        
        const assignments = await models.WorkAssignment.findAll({
            where: {
                employeeId: parseInt(employeeId),
                assignmentYear: parseInt(year),
                assignmentMonth: parseInt(month)
            },
            order: [['assignmentDate', 'ASC']]
        });

        res.json({
            success: true,
            data: {
                employeeId: parseInt(employeeId),
                period: `${year}-${month}`,
                totalAssignments: assignments.length,
                assignments: assignments.map(a => ({
                    id: a.id,
                    assignmentDate: a.assignmentDate,
                    storeName: a.storeName,
                    assignmentType: a.assignmentType,
                    isConfirmed: a.isConfirmed,
                    assignedBy: a.assignedBy,
                    assignedAt: a.assignedAt
                }))
            }
        });

    } catch (error) {
        console.error('獲取員工值班分配錯誤:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * 更新值班分配
 * PUT /api/work-assignments/:id
 */
router.put('/:id', async (req, res) => {
    try {
        const models = getModels();
        if (!models.WorkAssignment) {
            return res.status(500).json({
                success: false,
                error: '模型未初始化'
            });
        }

        const { id } = req.params;
        const updateData = req.body;

        const assignment = await models.WorkAssignment.findByPk(id);
        if (!assignment) {
            return res.status(404).json({
                success: false,
                error: '值班分配不存在'
            });
        }

        // 更新允許的欄位
        const allowedFields = ['assignmentType', 'isConfirmed', 'assignedBy'];
        allowedFields.forEach(field => {
            if (updateData.hasOwnProperty(field)) {
                assignment[field] = updateData[field];
            }
        });

        await assignment.save();

        console.log(`✅ 值班分配更新成功 - ID: ${id}`);

        res.json({
            success: true,
            message: '值班分配更新成功',
            data: {
                id: assignment.id,
                assignmentDate: assignment.assignmentDate,
                employeeName: assignment.employeeName,
                storeName: assignment.storeName,
                assignmentType: assignment.assignmentType,
                isConfirmed: assignment.isConfirmed,
                assignedBy: assignment.assignedBy
            }
        });

    } catch (error) {
        console.error('更新值班分配錯誤:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * 確認值班分配
 * POST /api/work-assignments/:id/confirm
 */
router.post('/:id/confirm', async (req, res) => {
    try {
        const models = getModels();
        if (!models.WorkAssignment) {
            return res.status(500).json({
                success: false,
                error: '模型未初始化'
            });
        }

        const { id } = req.params;
        const { confirmedBy } = req.body;

        const assignment = await models.WorkAssignment.findByPk(id);
        if (!assignment) {
            return res.status(404).json({
                success: false,
                error: '值班分配不存在'
            });
        }

        assignment.isConfirmed = true;
        if (confirmedBy) {
            assignment.assignedBy = confirmedBy;
        }
        
        await assignment.save();

        console.log(`✅ 值班分配確認 - ${assignment.employeeName} 於 ${assignment.assignmentDate}`);

        res.json({
            success: true,
            message: '值班分配已確認',
            data: {
                id: assignment.id,
                employeeName: assignment.employeeName,
                assignmentDate: assignment.assignmentDate,
                isConfirmed: assignment.isConfirmed
            }
        });

    } catch (error) {
        console.error('確認值班分配錯誤:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * 刪除值班分配
 * DELETE /api/work-assignments/:id
 */
router.delete('/:id', async (req, res) => {
    try {
        const models = getModels();
        if (!models.WorkAssignment) {
            return res.status(500).json({
                success: false,
                error: '模型未初始化'
            });
        }

        const { id } = req.params;
        const { reason } = req.body;

        const assignment = await models.WorkAssignment.findByPk(id);
        if (!assignment) {
            return res.status(404).json({
                success: false,
                error: '值班分配不存在'
            });
        }

        const assignmentInfo = {
            employeeName: assignment.employeeName,
            assignmentDate: assignment.assignmentDate,
            storeName: assignment.storeName
        };

        await assignment.destroy();

        console.log(`🗑️ 值班分配刪除 - ${assignmentInfo.employeeName} 於 ${assignmentInfo.assignmentDate} 在 ${assignmentInfo.storeName}${reason ? ` (原因: ${reason})` : ''}`);

        res.json({
            success: true,
            message: '值班分配已刪除',
            data: assignmentInfo
        });

    } catch (error) {
        console.error('刪除值班分配錯誤:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * 批量創建值班分配
 * POST /api/work-assignments/batch
 */
router.post('/batch', async (req, res) => {
    try {
        const models = getModels();
        if (!models.WorkAssignment) {
            return res.status(500).json({
                success: false,
                error: '模型未初始化'
            });
        }

        const { assignments, assignedBy } = req.body;

        if (!Array.isArray(assignments) || assignments.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'assignments必須是非空陣列'
            });
        }

        const results = [];
        const errors = [];

        for (let i = 0; i < assignments.length; i++) {
            const assignment = assignments[i];
            try {
                const { assignmentDate, employeeId, storeId, assignmentType = 'regular' } = assignment;

                // 基本驗證
                if (!assignmentDate || !employeeId || !storeId) {
                    errors.push({
                        index: i,
                        error: '缺少必要參數'
                    });
                    continue;
                }

                // 獲取員工和分店資訊
                const [employee, store] = await Promise.all([
                    models.Employee.findByPk(employeeId),
                    models.Store.findByPk(storeId)
                ]);

                if (!employee || !store) {
                    errors.push({
                        index: i,
                        error: '員工或分店不存在'
                    });
                    continue;
                }

                // 檢查重複
                const existing = await models.WorkAssignment.findOne({
                    where: { employeeId, assignmentDate, storeId }
                });

                if (existing) {
                    errors.push({
                        index: i,
                        error: '該分配已存在'
                    });
                    continue;
                }

                // 創建分配
                const dateObj = new Date(assignmentDate);
                const newAssignment = await models.WorkAssignment.create({
                    assignmentYear: dateObj.getFullYear(),
                    assignmentMonth: dateObj.getMonth() + 1,
                    assignmentDate,
                    storeId,
                    storeName: store.name,
                    employeeId,
                    employeeName: employee.name,
                    assignmentType,
                    isConfirmed: false,
                    assignedBy,
                    assignedAt: new Date()
                });

                results.push({
                    id: newAssignment.id,
                    employeeName: employee.name,
                    storeName: store.name,
                    assignmentDate,
                    assignmentType
                });

            } catch (error) {
                errors.push({
                    index: i,
                    error: error.message
                });
            }
        }

        console.log(`📦 批量值班分配 - 成功: ${results.length}, 失敗: ${errors.length}`);

        res.json({
            success: true,
            message: `批量分配完成 - 成功: ${results.length}, 失敗: ${errors.length}`,
            data: {
                successful: results,
                failed: errors,
                summary: {
                    total: assignments.length,
                    successful: results.length,
                    failed: errors.length
                }
            }
        });

    } catch (error) {
        console.error('批量創建值班分配錯誤:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * 獲取值班分配統計
 * GET /api/work-assignments/statistics/:year/:month
 */
router.get('/statistics/:year/:month', async (req, res) => {
    try {
        const models = getModels();
        if (!models.WorkAssignment) {
            return res.status(500).json({
                success: false,
                error: '模型未初始化'
            });
        }

        const { year, month } = req.params;
        
        const assignments = await models.WorkAssignment.findAll({
            where: {
                assignmentYear: parseInt(year),
                assignmentMonth: parseInt(month)
            }
        });

        // 統計分析
        const statistics = {
            totalAssignments: assignments.length,
            confirmedAssignments: assignments.filter(a => a.isConfirmed).length,
            pendingAssignments: assignments.filter(a => !a.isConfirmed).length,
            
            // 按類型統計
            byType: {
                regular: assignments.filter(a => a.assignmentType === 'regular').length,
                support: assignments.filter(a => a.assignmentType === 'support').length,
                overtime: assignments.filter(a => a.assignmentType === 'overtime').length
            },
            
            // 按分店統計
            byStore: {},
            
            // 按員工統計
            byEmployee: {},
            
            // 按日期統計
            byDate: {}
        };

        // 分店統計
        assignments.forEach(a => {
            if (!statistics.byStore[a.storeName]) {
                statistics.byStore[a.storeName] = {
                    total: 0,
                    confirmed: 0,
                    pending: 0
                };
            }
            statistics.byStore[a.storeName].total++;
            if (a.isConfirmed) {
                statistics.byStore[a.storeName].confirmed++;
            } else {
                statistics.byStore[a.storeName].pending++;
            }
        });

        // 員工統計
        assignments.forEach(a => {
            if (!statistics.byEmployee[a.employeeName]) {
                statistics.byEmployee[a.employeeName] = {
                    total: 0,
                    regular: 0,
                    support: 0,
                    overtime: 0
                };
            }
            statistics.byEmployee[a.employeeName].total++;
            statistics.byEmployee[a.employeeName][a.assignmentType]++;
        });

        // 日期統計
        assignments.forEach(a => {
            const dateStr = a.assignmentDate;
            if (!statistics.byDate[dateStr]) {
                statistics.byDate[dateStr] = {
                    total: 0,
                    stores: new Set(),
                    employees: new Set()
                };
            }
            statistics.byDate[dateStr].total++;
            statistics.byDate[dateStr].stores.add(a.storeName);
            statistics.byDate[dateStr].employees.add(a.employeeName);
        });

        // 轉換Set為Array
        Object.keys(statistics.byDate).forEach(date => {
            statistics.byDate[date].stores = Array.from(statistics.byDate[date].stores);
            statistics.byDate[date].employees = Array.from(statistics.byDate[date].employees);
        });

        res.json({
            success: true,
            data: statistics
        });

    } catch (error) {
        console.error('獲取值班分配統計錯誤:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;