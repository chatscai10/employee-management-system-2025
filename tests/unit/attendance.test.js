/**
 * 📅 出勤系統單元測試
 * Attendance System Unit Tests
 */

const request = require('supertest');
const app = require('../../server/server');

describe('📅 Attendance System Tests', () => {
    let server;
    let authToken;

    beforeAll(async () => {
        server = app.listen(0);

        // 獲取認證 token
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                employeeId: 'EMP001',
                password: 'password123'
            });

        authToken = loginResponse.body.token;
    });

    afterAll(async () => {
        if (server) {
            await new Promise(resolve => server.close(resolve));
        }
    });

    describe('POST /api/attendance/checkin', () => {
        test('應該能夠成功打卡上班', async () => {
            const checkinData = {
                latitude: 25.0330,
                longitude: 121.5654,
                address: '台北市信義區',
                notes: '正常上班打卡'
            };

            const response = await request(app)
                .post('/api/attendance/checkin')
                .set('Authorization', `Bearer ${authToken}`)
                .send(checkinData)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('attendance');
            expect(response.body.attendance).toHaveProperty('checkinTime');
            expect(response.body.attendance).toHaveProperty('checkinLocation');
        });

        test('應該驗證 GPS 座標', async () => {
            const invalidData = {
                latitude: 'invalid',
                longitude: 'invalid',
                address: '台北市信義區'
            };

            const response = await request(app)
                .post('/api/attendance/checkin')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidData)
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error');
        });

        test('應該拒絕重複打卡', async () => {
            const checkinData = {
                latitude: 25.0330,
                longitude: 121.5654,
                address: '台北市信義區'
            };

            // 第一次打卡
            await request(app)
                .post('/api/attendance/checkin')
                .set('Authorization', `Bearer ${authToken}`)
                .send(checkinData);

            // 第二次打卡應該失敗
            const response = await request(app)
                .post('/api/attendance/checkin')
                .set('Authorization', `Bearer ${authToken}`)
                .send(checkinData)
                .expect(409);

            expect(response.body).toHaveProperty('success', false);
        });
    });

    describe('POST /api/attendance/checkout', () => {
        beforeEach(async () => {
            // 確保有打卡上班記錄
            await request(app)
                .post('/api/attendance/checkin')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    latitude: 25.0330,
                    longitude: 121.5654,
                    address: '台北市信義區'
                });
        });

        test('應該能夠成功打卡下班', async () => {
            const checkoutData = {
                latitude: 25.0330,
                longitude: 121.5654,
                address: '台北市信義區',
                notes: '正常下班打卡'
            };

            const response = await request(app)
                .post('/api/attendance/checkout')
                .set('Authorization', `Bearer ${authToken}`)
                .send(checkoutData)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('attendance');
            expect(response.body.attendance).toHaveProperty('checkoutTime');
            expect(response.body.attendance).toHaveProperty('workingHours');
        });

        test('應該計算正確的工作時數', async () => {
            const checkoutData = {
                latitude: 25.0330,
                longitude: 121.5654,
                address: '台北市信義區'
            };

            const response = await request(app)
                .post('/api/attendance/checkout')
                .set('Authorization', `Bearer ${authToken}`)
                .send(checkoutData);

            const workingHours = response.body.attendance.workingHours;
            expect(workingHours).toBeGreaterThan(0);
            expect(workingHours).toBeLessThan(24); // 不可能超過24小時
        });
    });

    describe('GET /api/attendance/records', () => {
        test('應該能夠獲取出勤記錄', async () => {
            const response = await request(app)
                .get('/api/attendance/records')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('records');
            expect(Array.isArray(response.body.records)).toBe(true);
        });

        test('應該支援日期範圍查詢', async () => {
            const startDate = '2024-01-01';
            const endDate = '2024-12-31';

            const response = await request(app)
                .get(`/api/attendance/records?startDate=${startDate}&endDate=${endDate}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('records');
        });

        test('應該支援分頁查詢', async () => {
            const response = await request(app)
                .get('/api/attendance/records?page=1&limit=10')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('records');
            expect(response.body).toHaveProperty('pagination');
        });
    });

    describe('🗂️ Attendance Analytics', () => {
        test('應該能夠獲取出勤統計', async () => {
            const response = await request(app)
                .get('/api/attendance/statistics')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('statistics');
            expect(response.body.statistics).toHaveProperty('totalWorkingHours');
            expect(response.body.statistics).toHaveProperty('attendanceRate');
        });

        test('應該能夠獲取月度報告', async () => {
            const response = await request(app)
                .get('/api/attendance/monthly-report?year=2024&month=12')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('report');
        });
    });

    describe('🗍 GPS Validation', () => {
        test('應該驗證打卡地點是否在工作範圍內', async () => {
            // 模擬在工作範圍外的座標
            const outOfRangeData = {
                latitude: 24.0000, // 遠離工作地點
                longitude: 120.0000,
                address: '遠離工作地點的位置'
            };

            const response = await request(app)
                .post('/api/attendance/checkin')
                .set('Authorization', `Bearer ${authToken}`)
                .send(outOfRangeData)
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body.error).toContain('工作範圍');
        });

        test('應該計算與工作地點的距離', async () => {
            const checkinData = {
                latitude: 25.0330,
                longitude: 121.5654,
                address: '台北市信義區'
            };

            const response = await request(app)
                .post('/api/attendance/checkin')
                .set('Authorization', `Bearer ${authToken}`)
                .send(checkinData);

            expect(response.body.attendance).toHaveProperty('distanceFromWorkplace');
            expect(typeof response.body.attendance.distanceFromWorkplace).toBe('number');
        });
    });
});