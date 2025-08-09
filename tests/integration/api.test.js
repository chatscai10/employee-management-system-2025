/**
 * 🌐 API 整合測試
 * API Integration Tests
 */

const request = require('supertest');
const app = require('../../server/server');

describe('🌐 API Integration Tests', () => {
    let server;
    let adminToken;
    let employeeToken;

    beforeAll(async () => {
        server = app.listen(0);

        // 獲取管理員 token
        const adminLogin = await request(app)
            .post('/api/auth/login')
            .send({
                employeeId: 'ADMIN001',
                password: 'admin123'
            });
        adminToken = adminLogin.body.token;

        // 獲取一般員工 token
        const employeeLogin = await request(app)
            .post('/api/auth/login')
            .send({
                employeeId: 'EMP001',
                password: 'password123'
            });
        employeeToken = employeeLogin.body.token;
    });

    afterAll(async () => {
        if (server) {
            await new Promise(resolve => server.close(resolve));
        }
    });

    describe('🔐 Authentication Flow', () => {
        test('完整的用戶認證流程', async () => {
            // 1. 註冊新用戶
            const registerResponse = await request(app)
                .post('/api/auth/register')
                .send({
                    employeeId: 'INTEGRATION001',
                    name: '整合測試用戶',
                    email: 'integration@test.com',
                    password: 'password123',
                    role: 'employee',
                    storeId: 1
                })
                .expect(201);

            expect(registerResponse.body.success).toBe(true);

            // 2. 用戶登入
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    employeeId: 'INTEGRATION001',
                    password: 'password123'
                })
                .expect(200);

            expect(loginResponse.body.success).toBe(true);
            expect(loginResponse.body.token).toBeDefined();

            // 3. 訪問受保護的資源
            const profileResponse = await request(app)
                .get('/api/employees/profile')
                .set('Authorization', `Bearer ${loginResponse.body.token}`)
                .expect(200);

            expect(profileResponse.body.success).toBe(true);
            expect(profileResponse.body.employee.employeeId).toBe('INTEGRATION001');

            // 4. 登出
            const logoutResponse = await request(app)
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${loginResponse.body.token}`)
                .expect(200);

            expect(logoutResponse.body.success).toBe(true);
        });
    });

    describe('📅 Complete Attendance Workflow', () => {
        test('完整的出勤工作流程', async () => {
            // 1. 上班打卡
            const checkinResponse = await request(app)
                .post('/api/attendance/checkin')
                .set('Authorization', `Bearer ${employeeToken}`)
                .send({
                    latitude: 25.0330,
                    longitude: 121.5654,
                    address: '台北市信義區'
                })
                .expect(200);

            expect(checkinResponse.body.success).toBe(true);
            const attendanceId = checkinResponse.body.attendance.id;

            // 2. 查詢當日出勤狀態
            const statusResponse = await request(app)
                .get('/api/attendance/status')
                .set('Authorization', `Bearer ${employeeToken}`)
                .expect(200);

            expect(statusResponse.body.success).toBe(true);
            expect(statusResponse.body.status).toBe('checked_in');

            // 3. 下班打卡
            const checkoutResponse = await request(app)
                .post('/api/attendance/checkout')
                .set('Authorization', `Bearer ${employeeToken}`)
                .send({
                    latitude: 25.0330,
                    longitude: 121.5654,
                    address: '台北市信義區'
                })
                .expect(200);

            expect(checkoutResponse.body.success).toBe(true);
            expect(checkoutResponse.body.attendance.workingHours).toBeGreaterThan(0);

            // 4. 查詢出勤記錄
            const recordsResponse = await request(app)
                .get('/api/attendance/records')
                .set('Authorization', `Bearer ${employeeToken}`)
                .expect(200);

            expect(recordsResponse.body.success).toBe(true);
            expect(recordsResponse.body.records.length).toBeGreaterThan(0);
        });
    });

    describe('💰 Revenue Management Flow', () => {
        test('完整的營收管理流程', async () => {
            // 1. 添加營收記錄
            const addRevenueResponse = await request(app)
                .post('/api/revenue/add')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    storeId: 1,
                    amount: 15000,
                    date: new Date().toISOString().split('T')[0],
                    description: '整合測試營收記錄',
                    category: 'sales'
                })
                .expect(200);

            expect(addRevenueResponse.body.success).toBe(true);
            const revenueId = addRevenueResponse.body.revenue.id;

            // 2. 查詢營收記錄
            const getRevenueResponse = await request(app)
                .get('/api/revenue/records')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(getRevenueResponse.body.success).toBe(true);
            expect(getRevenueResponse.body.records.length).toBeGreaterThan(0);

            // 3. 更新營收記錄
            const updateRevenueResponse = await request(app)
                .put(`/api/revenue/update/${revenueId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    amount: 16000,
                    description: '更新後的營收記錄'
                })
                .expect(200);

            expect(updateRevenueResponse.body.success).toBe(true);

            // 4. 獲取營收統計
            const statsResponse = await request(app)
                .get('/api/revenue/statistics')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(statsResponse.body.success).toBe(true);
            expect(statsResponse.body.statistics).toHaveProperty('totalRevenue');

            // 5. 刪除測試記錄
            const deleteResponse = await request(app)
                .delete(`/api/revenue/delete/${revenueId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(deleteResponse.body.success).toBe(true);
        });
    });

    describe('👥 Employee Management', () => {
        test('員工管理完整流程', async () => {
            // 1. 創建新員工 (只有管理員可以)
            const createResponse = await request(app)
                .post('/api/admin/employees/create')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    employeeId: 'MGMT001',
                    name: '管理測試員工',
                    email: 'mgmt@test.com',
                    role: 'employee',
                    storeId: 1
                })
                .expect(200);

            expect(createResponse.body.success).toBe(true);
            const newEmployeeId = createResponse.body.employee.id;

            // 2. 查詢所有員工
            const listResponse = await request(app)
                .get('/api/admin/employees')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(listResponse.body.success).toBe(true);
            expect(listResponse.body.employees.length).toBeGreaterThan(0);

            // 3. 更新員工資料
            const updateResponse = await request(app)
                .put(`/api/admin/employees/update/${newEmployeeId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: '更新後的員工名稱',
                    role: 'manager'
                })
                .expect(200);

            expect(updateResponse.body.success).toBe(true);

            // 4. 一般員工不能訪問管理功能
            const unauthorizedResponse = await request(app)
                .get('/api/admin/employees')
                .set('Authorization', `Bearer ${employeeToken}`)
                .expect(403);

            expect(unauthorizedResponse.body.success).toBe(false);

            // 5. 停用員工帳號
            const deactivateResponse = await request(app)
                .put(`/api/admin/employees/deactivate/${newEmployeeId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(deactivateResponse.body.success).toBe(true);
        });
    });

    describe('🔒 Security Tests', () => {
        test('應該阻擋未授權訪問', async () => {
            // 沒有 token
            await request(app)
                .get('/api/employees/profile')
                .expect(401);

            // 無效 token
            await request(app)
                .get('/api/employees/profile')
                .set('Authorization', 'Bearer invalid_token')
                .expect(401);

            // 過期 token (模擬)
            const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE1MTYyMzkwMjJ9.invalid';
            await request(app)
                .get('/api/employees/profile')
                .set('Authorization', `Bearer ${expiredToken}`)
                .expect(401);
        });

        test('應該阻擋 SQL 注入攻擊', async () => {
            const maliciousData = {
                employeeId: "'; DROP TABLE employees; --",
                password: 'password123'
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(maliciousData)
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        test('應該阻擋 XSS 攻擊', async () => {
            const xssPayload = {
                name: '<script>alert("XSS")</script>',
                email: 'xss@test.com'
            };

            const response = await request(app)
                .put('/api/employees/profile')
                .set('Authorization', `Bearer ${employeeToken}`)
                .send(xssPayload);

            // 應該清理或拒絕惡意內容
            if (response.status === 200) {
                expect(response.body.employee.name).not.toContain('<script>');
            } else {
                expect(response.status).toBeGreaterThanOrEqual(400);
            }
        });
    });

    describe('📊 Performance Tests', () => {
        test('API 回應時間應該在合理範圍內', async () => {
            const startTime = Date.now();

            await request(app)
                .get('/api/attendance/records')
                .set('Authorization', `Bearer ${employeeToken}`)
                .expect(200);

            const responseTime = Date.now() - startTime;
            expect(responseTime).toBeLessThan(5000); // 5秒內回應
        });

        test('應該能夠處理並發請求', async () => {
            const promises = [];

            // 同時發送 10 個請求
            for (let i = 0; i < 10; i++) {
                promises.push(
                    request(app)
                        .get('/api/attendance/status')
                        .set('Authorization', `Bearer ${employeeToken}`)
                );
            }

            const responses = await Promise.all(promises);
            responses.forEach(response => {
                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
            });
        });
    });
});