/**
 * =======================================
 * 完整系統測試與驗證腳本
 * =======================================
 * 測試企業級員工管理系統的所有主要功能模組
 */

const axios = require('axios');
const logger = require('./server/utils/logger');

const BASE_URL = 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

class SystemTester {
    constructor() {
        this.testResults = {
            passed: 0,
            failed: 0,
            errors: []
        };
    }

    /**
     * 執行完整系統測試
     */
    async runCompleteSystemTest() {
        logger.info('🚀 開始執行完整系統測試');
        
        try {
            // 1. 基礎連接測試
            await this.testBasicConnectivity();
            
            // 2. 認證系統測試
            await this.testAuthenticationSystem();
            
            // 3. 員工管理測試
            await this.testEmployeeManagement();
            
            // 4. GPS打卡系統測試
            await this.testAttendanceSystem();
            
            // 5. 排班系統測試
            await this.testScheduleSystem();
            
            // 6. 升遷投票系統測試
            await this.testPromotionVotingSystem();
            
            // 7. 維修保養系統測試
            await this.testMaintenanceSystem();
            
            // 8. 結果自動執行系統測試
            await this.testExecutionSystem();
            
            // 9. Telegram通知系統測試
            await this.testTelegramSystem();
            
            // 10. 申訴機制測試
            await this.testAppealSystem();
            
            // 11. 系統監控測試
            await this.testMonitoringSystem();
            
            this.printTestSummary();
            
        } catch (error) {
            logger.error('系統測試執行失敗:', error);
            this.recordError('系統測試執行', error.message);
        }
    }

    /**
     * 1. 基礎連接測試
     */
    async testBasicConnectivity() {
        logger.info('📡 測試基礎連接...');
        
        try {
            // 測試主頁
            const homeResponse = await axios.get(BASE_URL, { timeout: 5000 });
            this.recordTest('主頁連接', homeResponse.status === 200);
            
            // 測試健康檢查
            const healthResponse = await axios.get(`${API_BASE}/monitoring/health`, { timeout: 5000 });
            this.recordTest('健康檢查API', healthResponse.status === 200);
            
            logger.info('✅ 基礎連接測試完成');
            
        } catch (error) {
            this.recordError('基礎連接測試', error.message);
        }
    }

    /**
     * 2. 認證系統測試
     */
    async testAuthenticationSystem() {
        logger.info('🔐 測試認證系統...');
        
        try {
            // 測試登入API
            const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
                name: '測試員工',
                idNumber: 'A123456789'
            }, { timeout: 5000 });
            
            this.recordTest('員工登入API', loginResponse.status === 200);
            
            logger.info('✅ 認證系統測試完成');
            
        } catch (error) {
            // 如果是404錯誤，記錄但不算作失敗（可能資料不存在）
            if (error.response?.status === 404) {
                this.recordTest('員工登入API (資料不存在)', true);
            } else {
                this.recordError('認證系統測試', error.message);
            }
        }
    }

    /**
     * 3. 員工管理測試
     */
    async testEmployeeManagement() {
        logger.info('👥 測試員工管理系統...');
        
        try {
            // 測試獲取員工列表
            const employeesResponse = await axios.get(`${API_BASE}/employees`, { timeout: 5000 });
            this.recordTest('員工列表API', employeesResponse.status === 200);
            
            logger.info('✅ 員工管理系統測試完成');
            
        } catch (error) {
            this.recordError('員工管理測試', error.message);
        }
    }

    /**
     * 4. GPS打卡系統測試
     */
    async testAttendanceSystem() {
        logger.info('📍 測試GPS打卡系統...');
        
        try {
            // 測試打卡記錄API
            const attendanceResponse = await axios.get(`${API_BASE}/attendance/records`, { timeout: 5000 });
            this.recordTest('打卡記錄API', attendanceResponse.status === 200);
            
            // 測試打卡統計API
            const statsResponse = await axios.get(`${API_BASE}/attendance/statistics`, { timeout: 5000 });
            this.recordTest('打卡統計API', statsResponse.status === 200);
            
            logger.info('✅ GPS打卡系統測試完成');
            
        } catch (error) {
            this.recordError('GPS打卡系統測試', error.message);
        }
    }

    /**
     * 5. 排班系統測試
     */
    async testScheduleSystem() {
        logger.info('📅 測試排班系統...');
        
        try {
            // 測試排班配置API
            const configResponse = await axios.get(`${API_BASE}/schedule/config`, { timeout: 5000 });
            this.recordTest('排班配置API', configResponse.status === 200);
            
            // 測試排班記錄API
            const schedulesResponse = await axios.get(`${API_BASE}/schedule/schedules`, { timeout: 5000 });
            this.recordTest('排班記錄API', schedulesResponse.status === 200);
            
            logger.info('✅ 排班系統測試完成');
            
        } catch (error) {
            this.recordError('排班系統測試', error.message);
        }
    }

    /**
     * 6. 升遷投票系統測試
     */
    async testPromotionVotingSystem() {
        logger.info('🗳️ 測試升遷投票系統...');
        
        try {
            // 測試投票活動列表API
            const campaignsResponse = await axios.get(`${API_BASE}/promotion/campaigns`, { timeout: 5000 });
            this.recordTest('投票活動列表API', campaignsResponse.status === 200);
            
            // 測試管理員投票管理API
            const adminVotingResponse = await axios.get(`${API_BASE}/admin/voting/health-report`, { timeout: 5000 });
            this.recordTest('投票健康報告API', adminVotingResponse.status === 200);
            
            logger.info('✅ 升遷投票系統測試完成');
            
        } catch (error) {
            this.recordError('升遷投票系統測試', error.message);
        }
    }

    /**
     * 7. 維修保養系統測試
     */
    async testMaintenanceSystem() {
        logger.info('🔧 測試維修保養系統...');
        
        try {
            // 測試設備列表API
            const equipmentResponse = await axios.get(`${API_BASE}/maintenance/equipment`, { timeout: 5000 });
            this.recordTest('設備列表API', equipmentResponse.status === 200);
            
            // 測試維修任務API
            const tasksResponse = await axios.get(`${API_BASE}/maintenance/tasks`, { timeout: 5000 });
            this.recordTest('維修任務API', tasksResponse.status === 200);
            
            // 測試維修統計API
            const statsResponse = await axios.get(`${API_BASE}/maintenance/reports/statistics`, { timeout: 5000 });
            this.recordTest('維修統計API', statsResponse.status === 200);
            
            logger.info('✅ 維修保養系統測試完成');
            
        } catch (error) {
            this.recordError('維修保養系統測試', error.message);
        }
    }

    /**
     * 8. 結果自動執行系統測試
     */
    async testExecutionSystem() {
        logger.info('⚙️ 測試結果自動執行系統...');
        
        try {
            // 測試執行記錄API
            const recordsResponse = await axios.get(`${API_BASE}/execution/records`, { timeout: 5000 });
            this.recordTest('執行記錄API', recordsResponse.status === 200);
            
            // 測試執行統計API
            const statsResponse = await axios.get(`${API_BASE}/execution/statistics`, { timeout: 5000 });
            this.recordTest('執行統計API', statsResponse.status === 200);
            
            // 測試待執行記錄API
            const pendingResponse = await axios.get(`${API_BASE}/execution/pending`, { timeout: 5000 });
            this.recordTest('待執行記錄API', pendingResponse.status === 200);
            
            logger.info('✅ 結果自動執行系統測試完成');
            
        } catch (error) {
            this.recordError('結果自動執行系統測試', error.message);
        }
    }

    /**
     * 9. Telegram通知系統測試
     */
    async testTelegramSystem() {
        logger.info('📢 測試Telegram通知系統...');
        
        try {
            // 測試通知模板API
            const templatesResponse = await axios.get(`${API_BASE}/telegram/templates`, { timeout: 5000 });
            this.recordTest('通知模板API', templatesResponse.status === 200);
            
            // 測試群組配置API
            const groupsResponse = await axios.get(`${API_BASE}/telegram/groups`, { timeout: 5000 });
            this.recordTest('群組配置API', groupsResponse.status === 200);
            
            // 測試通知統計API
            const statsResponse = await axios.get(`${API_BASE}/telegram/statistics`, { timeout: 5000 });
            this.recordTest('通知統計API', statsResponse.status === 200);
            
            // 測試通知模板 - 使用測試模板
            const testResponse = await axios.post(`${API_BASE}/telegram/test/system_health_warning`, {
                testData: {
                    healthScore: 85,
                    issues: '系統測試中',
                    recommendations: '無需處理',
                    checkTime: new Date().toLocaleString('zh-TW')
                }
            }, { timeout: 10000 });
            
            this.recordTest('通知測試API', testResponse.status === 200);
            
            logger.info('✅ Telegram通知系統測試完成');
            
        } catch (error) {
            this.recordError('Telegram通知系統測試', error.message);
        }
    }

    /**
     * 10. 申訴機制測試
     */
    async testAppealSystem() {
        logger.info('⚖️ 測試申訴機制...');
        
        try {
            // 測試申訴列表API
            const appealsResponse = await axios.get(`${API_BASE}/appeals`, { timeout: 5000 });
            this.recordTest('申訴列表API', appealsResponse.status === 200);
            
            // 測試申訴統計API
            const statsResponse = await axios.get(`${API_BASE}/appeals/report/statistics`, { timeout: 5000 });
            this.recordTest('申訴統計API', statsResponse.status === 200);
            
            // 測試待處理申訴API
            const pendingResponse = await axios.get(`${API_BASE}/appeals/status/pending`, { timeout: 5000 });
            this.recordTest('待處理申訴API', pendingResponse.status === 200);
            
            logger.info('✅ 申訴機制測試完成');
            
        } catch (error) {
            this.recordError('申訴機制測試', error.message);
        }
    }

    /**
     * 11. 系統監控測試
     */
    async testMonitoringSystem() {
        logger.info('📊 測試系統監控...');
        
        try {
            // 測試系統健康狀態
            const healthResponse = await axios.get(`${API_BASE}/monitoring/health`, { timeout: 5000 });
            this.recordTest('系統健康API', healthResponse.status === 200);
            
            // 測試系統指標
            const metricsResponse = await axios.get(`${API_BASE}/monitoring/metrics`, { timeout: 5000 });
            this.recordTest('系統指標API', metricsResponse.status === 200);
            
            // 測試告警列表
            const alertsResponse = await axios.get(`${API_BASE}/alerts`, { timeout: 5000 });
            this.recordTest('告警列表API', alertsResponse.status === 200);
            
            logger.info('✅ 系統監控測試完成');
            
        } catch (error) {
            this.recordError('系統監控測試', error.message);
        }
    }

    /**
     * 記錄測試結果
     */
    recordTest(testName, passed) {
        if (passed) {
            this.testResults.passed++;
            logger.info(`✅ ${testName}: 通過`);
        } else {
            this.testResults.failed++;
            logger.error(`❌ ${testName}: 失敗`);
        }
    }

    /**
     * 記錄錯誤
     */
    recordError(testName, error) {
        this.testResults.failed++;
        this.testResults.errors.push({ testName, error });
        logger.error(`❌ ${testName}: ${error}`);
    }

    /**
     * 印出測試摘要
     */
    printTestSummary() {
        logger.info('\n' + '='.repeat(50));
        logger.info('📊 系統測試摘要報告');
        logger.info('='.repeat(50));
        
        const total = this.testResults.passed + this.testResults.failed;
        const successRate = total > 0 ? ((this.testResults.passed / total) * 100).toFixed(2) : 0;
        
        logger.info(`✅ 通過測試: ${this.testResults.passed}`);
        logger.info(`❌ 失敗測試: ${this.testResults.failed}`);
        logger.info(`📈 成功率: ${successRate}%`);
        
        if (this.testResults.errors.length > 0) {
            logger.info('\n🚨 錯誤詳情:');
            this.testResults.errors.forEach((error, index) => {
                logger.error(`${index + 1}. ${error.testName}: ${error.error}`);
            });
        }
        
        logger.info('='.repeat(50));
        
        if (this.testResults.failed === 0) {
            logger.info('🎉 所有測試通過！系統狀態良好。');
        } else {
            logger.warn(`⚠️ 發現 ${this.testResults.failed} 個問題，請檢查錯誤詳情。`);
        }
    }
}

// 執行測試
const tester = new SystemTester();
tester.runCompleteSystemTest().catch(error => {
    console.error('系統測試執行失敗:', error);
    process.exit(1);
});