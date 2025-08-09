/**
 * 🔐 認證相關單元測試
 * Authentication Unit Tests
 */

const request = require('supertest');
const app = require('../../server/server');
const bcrypt = require('bcryptjs');

describe('🔐 Authentication Tests', () => {
    let server;

    beforeAll(async () => {
        // 啟動測試伺服器
        server = app.listen(0);
    });

    afterAll(async () => {
        // 關閉測試伺服器
        if (server) {
            await new Promise(resolve => server.close(resolve));
        }
    });

    describe('POST /api/auth/login', () => {
        test('應該能夠使用有效憑證登入', async () => {
            const loginData = {
                employeeId: 'EMP001',
                password: 'password123'
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('employee');
        });

        test('應該拒絕無效憑證', async () => {
            const loginData = {
                employeeId: 'INVALID',
                password: 'wrongpassword'
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData)
                .expect(401);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error');
        });

        test('應該驗證必要欄位', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({})
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error');
        });

        test('應該限制登入嘗試頻率', async () => {
            const loginData = {
                employeeId: 'INVALID',
                password: 'wrongpassword'
            };

            // 進行多次失敗嘗試
            for (let i = 0; i < 6; i++) {
                await request(app)
                    .post('/api/auth/login')
                    .send(loginData);
            }

            // 第6次應該被速率限制
            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData)
                .expect(429);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('POST /api/auth/register', () => {
        test('應該能夠註冊新員工', async () => {
            const registerData = {
                employeeId: 'TEST001',
                name: '測試員工',
                email: 'test@example.com',
                password: 'password123',
                role: 'employee',
                storeId: 1
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(registerData)
                .expect(201);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('employee');
            expect(response.body.employee).toHaveProperty('employeeId', 'TEST001');
        });

        test('應該拒絕重複的員工編號', async () => {
            const registerData = {
                employeeId: 'EMP001', // 已存在的員工編號
                name: '測試員工',
                email: 'test2@example.com',
                password: 'password123',
                role: 'employee',
                storeId: 1
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(registerData)
                .expect(409);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error');
        });

        test('應該加密密碼', async () => {
            const registerData = {
                employeeId: 'TEST002',
                name: '測試員工2',
                email: 'test2@example.com',
                password: 'password123',
                role: 'employee',
                storeId: 1
            };

            await request(app)
                .post('/api/auth/register')
                .send(registerData);

            // 驗證密碼已被加密
            expect(registerData.password).not.toBe('password123');
        });
    });

    describe('🔒 Password Security', () => {
        test('bcrypt 應該正確加密密碼', async () => {
            const password = 'testpassword123';
            const hash = await bcrypt.hash(password, 12);

            expect(hash).toBeDefined();
            expect(hash).not.toBe(password);
            expect(hash.length).toBeGreaterThan(50);

            const isValid = await bcrypt.compare(password, hash);
            expect(isValid).toBe(true);
        });

        test('應該拒絕弱密碼', async () => {
            const weakPasswords = ['123', 'password', 'abc123'];

            for (const password of weakPasswords) {
                const registerData = {
                    employeeId: `WEAK${Date.now()}`,
                    name: '測試員工',
                    email: `weak${Date.now()}@example.com`,
                    password: password,
                    role: 'employee',
                    storeId: 1
                };

                const response = await request(app)
                    .post('/api/auth/register')
                    .send(registerData);

                expect(response.status).toBeGreaterThanOrEqual(400);
            }
        });
    });

    describe('🎫 JWT Token', () => {
        test('應該生成有效的 JWT token', async () => {
            const loginData = {
                employeeId: 'EMP001',
                password: 'password123'
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData)
                .expect(200);

            const token = response.body.token;
            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3); // JWT 有三個部分
        });

        test('應該驗證 JWT token', async () => {
            // 先登入獲取 token
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    employeeId: 'EMP001',
                    password: 'password123'
                });

            const token = loginResponse.body.token;

            // 使用 token 訪問受保護的路由
            const response = await request(app)
                .get('/api/employees/profile')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
        });

        test('應該拒絕無效的 token', async () => {
            const response = await request(app)
                .get('/api/employees/profile')
                .set('Authorization', 'Bearer invalid_token')
                .expect(401);

            expect(response.body).toHaveProperty('success', false);
        });
    });
});