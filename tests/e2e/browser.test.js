/**
 * 🌐 端到端瀏覽器測試
 * End-to-End Browser Tests
 */

const puppeteer = require('puppeteer');
const path = require('path');

describe('🌐 End-to-End Browser Tests', () => {
    let browser;
    let page;
    const baseUrl = 'http://localhost:3000';

    beforeAll(async () => {
        browser = await puppeteer.launch({
            headless: true, // 設為 false 可見瀏覽器操作
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        });
        page = await browser.newPage();
        
        // 設置視窗大小
        await page.setViewport({ width: 1280, height: 720 });
        
        // 設置用戶代理
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    });

    afterAll(async () => {
        if (browser) {
            await browser.close();
        }
    });

    describe('🏠 首頁和導航', () => {
        test('應該能夠載入首頁', async () => {
            await page.goto(baseUrl, { waitUntil: 'networkidle2' });

            const title = await page.title();
            expect(title).toContain('員工管理系統');

            // 檢查關鍵元素是否存在
            const loginButton = await page.$('button[data-testid="login-button"]');
            expect(loginButton).not.toBeNull();
        });

        test('應該能夠導航到不同頁面', async () => {
            await page.goto(baseUrl);

            // 導航到登入頁面
            await page.click('a[href="/login.html"]');
            await page.waitForNavigation();

            const url = page.url();
            expect(url).toContain('/login.html');

            const pageTitle = await page.$eval('h1', el => el.textContent);
            expect(pageTitle).toContain('登入');
        });
    });

    describe('🔐 用戶認證', () => {
        test('完整的登入流程', async () => {
            await page.goto(`${baseUrl}/login.html`);

            // 填寫登入表單
            await page.type('#employeeId', 'EMP001');
            await page.type('#password', 'password123');

            // 提交表單
            await Promise.all([
                page.waitForNavigation(),
                page.click('button[type="submit"]')
            ]);

            // 驗證登入成功
            const url = page.url();
            expect(url).toContain('/employee-dashboard.html');

            // 檢查用戶資訊是否顯示
            const userInfo = await page.$('.user-info');
            expect(userInfo).not.toBeNull();
        });

        test('應該拒絕無效憑證', async () => {
            await page.goto(`${baseUrl}/login.html`);

            // 填寫無效憑證
            await page.type('#employeeId', 'INVALID');
            await page.type('#password', 'wrongpassword');

            // 提交表單
            await page.click('button[type="submit"]');

            // 等待錯誤訊息顯示
            await page.waitForSelector('.error-message', { visible: true });

            const errorMessage = await page.$eval('.error-message', el => el.textContent);
            expect(errorMessage).toContain('無效');
        });

        test('應該能夠登出', async () => {
            // 先登入
            await page.goto(`${baseUrl}/login.html`);
            await page.type('#employeeId', 'EMP001');
            await page.type('#password', 'password123');
            await Promise.all([
                page.waitForNavigation(),
                page.click('button[type="submit"]')
            ]);

            // 登出
            await page.click('#logout-button');
            await page.waitForNavigation();

            const url = page.url();
            expect(url).toContain('/login.html');
        });
    });

    describe('📅 出勤系統', () => {
        beforeEach(async () => {
            // 登入系統
            await page.goto(`${baseUrl}/login.html`);
            await page.type('#employeeId', 'EMP001');
            await page.type('#password', 'password123');
            await Promise.all([
                page.waitForNavigation(),
                page.click('button[type="submit"]')
            ]);
        });

        test('應該能夠進行GPS打卡', async () => {
            await page.goto(`${baseUrl}/attendance.html`);

            // 模擬GPS位置
            const context = browser.defaultBrowserContext();
            await context.overridePermissions(baseUrl, ['geolocation']);
            await page.setGeolocation({ latitude: 25.0330, longitude: 121.5654 });

            // 點擊打卡按鈕
            await page.click('#checkin-button');

            // 等待打卡成功訊息
            await page.waitForSelector('.success-message', { visible: true });

            const successMessage = await page.$eval('.success-message', el => el.textContent);
            expect(successMessage).toContain('打卡成功');

            // 檢查打卡時間是否顯示
            const checkinTime = await page.$('#checkin-time');
            expect(checkinTime).not.toBeNull();
        });

        test('應該顯示出勤記錄', async () => {
            await page.goto(`${baseUrl}/attendance.html`);

            // 切換到記錄檢視
            await page.click('#records-tab');

            // 等待記錄載入
            await page.waitForSelector('.attendance-records', { visible: true });

            const records = await page.$$('.record-item');
            expect(records.length).toBeGreaterThanOrEqual(0);
        });
    });

    describe('💰 營收管理', () => {
        beforeEach(async () => {
            // 以管理員身份登入
            await page.goto(`${baseUrl}/login.html`);
            await page.type('#employeeId', 'ADMIN001');
            await page.type('#password', 'admin123');
            await Promise.all([
                page.waitForNavigation(),
                page.click('button[type="submit"]')
            ]);
        });

        test('應該能夠添加營收記錄', async () => {
            await page.goto(`${baseUrl}/revenue.html`);

            // 點擊新增按鈕
            await page.click('#add-revenue-button');

            // 填寫營收表單
            await page.type('#amount', '15000');
            await page.type('#description', '自動化測試營收記錄');
            await page.select('#category', 'sales');

            // 提交表單
            await page.click('#save-revenue-button');

            // 等待成功訊息
            await page.waitForSelector('.success-message', { visible: true });

            const successMessage = await page.$eval('.success-message', el => el.textContent);
            expect(successMessage).toContain('成功');
        });

        test('應該顯示營收統計圖表', async () => {
            await page.goto(`${baseUrl}/revenue.html`);

            // 等待圖表載入
            await page.waitForSelector('.chart-container', { visible: true });

            const chart = await page.$('.chart-container canvas');
            expect(chart).not.toBeNull();

            // 檢查統計數據
            const totalRevenue = await page.$('#total-revenue');
            expect(totalRevenue).not.toBeNull();
        });
    });

    describe('👥 員工管理 (管理員)', () => {
        beforeEach(async () => {
            // 以管理員身份登入
            await page.goto(`${baseUrl}/login.html`);
            await page.type('#employeeId', 'ADMIN001');
            await page.type('#password', 'admin123');
            await Promise.all([
                page.waitForNavigation(),
                page.click('button[type="submit"]')
            ]);
        });

        test('應該能夠查看員工列表', async () => {
            await page.goto(`${baseUrl}/admin.html`);

            // 切換到員工管理標籤
            await page.click('#employees-tab');

            // 等待員工列表載入
            await page.waitForSelector('.employees-table', { visible: true });

            const employeeRows = await page.$$('.employee-row');
            expect(employeeRows.length).toBeGreaterThan(0);
        });

        test('應該能夠創建新員工', async () => {
            await page.goto(`${baseUrl}/admin.html`);

            // 點擊新增員工按鈕
            await page.click('#add-employee-button');

            // 填寫員工表單
            await page.type('#new-employee-id', 'E2E001');
            await page.type('#new-employee-name', '端到端測試員工');
            await page.type('#new-employee-email', 'e2e@test.com');
            await page.select('#new-employee-role', 'employee');

            // 提交表單
            await page.click('#save-employee-button');

            // 等待成功訊息
            await page.waitForSelector('.success-message', { visible: true });

            // 驗證員工已添加到列表中
            const newEmployee = await page.$(`[data-employee-id="E2E001"]`);
            expect(newEmployee).not.toBeNull();
        });
    });

    describe('📱 響應式設計', () => {
        test('應該在手機端正確顯示', async () => {
            // 設置手機視窗大小
            await page.setViewport({ width: 375, height: 667 });

            await page.goto(baseUrl);

            // 檢查行動版導航是否顯示
            const mobileNav = await page.$('.mobile-nav');
            expect(mobileNav).not.toBeNull();

            // 檢查內容是否適應手機螢幕
            const content = await page.$('.main-content');
            const contentWidth = await content.boundingBox();
            expect(contentWidth.width).toBeLessThanOrEqual(375);
        });

        test('應該在平板端正確顯示', async () => {
            // 設置平板視窗大小
            await page.setViewport({ width: 768, height: 1024 });

            await page.goto(baseUrl);

            // 檢查平板版布局
            const sidebar = await page.$('.sidebar');
            expect(sidebar).not.toBeNull();

            const mainContent = await page.$('.main-content');
            expect(mainContent).not.toBeNull();
        });
    });

    describe('🔒 安全性測試', () => {
        test('應該阻擋未授權訪問', async () => {
            // 不登入直接訪問受保護頁面
            await page.goto(`${baseUrl}/admin.html`);

            // 應該重定向到登入頁面
            await page.waitForNavigation();
            const url = page.url();
            expect(url).toContain('/login.html');
        });

        test('應該正確處理 CSRF 保護', async () => {
            // 登入系統
            await page.goto(`${baseUrl}/login.html`);
            await page.type('#employeeId', 'EMP001');
            await page.type('#password', 'password123');
            await Promise.all([
                page.waitForNavigation(),
                page.click('button[type="submit"]')
            ]);

            // 檢查 CSRF token 是否存在
            const csrfToken = await page.$('input[name="_token"]');
            expect(csrfToken).not.toBeNull();
        });
    });

    describe('⚡ 效能測試', () => {
        test('頁面載入時間應該在合理範圍內', async () => {
            const startTime = Date.now();
            
            await page.goto(baseUrl, { waitUntil: 'networkidle2' });
            
            const loadTime = Date.now() - startTime;
            expect(loadTime).toBeLessThan(5000); // 5秒內載入
        });

        test('應該正確快取靜態資源', async () => {
            await page.goto(baseUrl);

            // 檢查 CSS 和 JS 檔案是否有適當的快取標頭
            const responses = [];
            page.on('response', response => responses.push(response));

            await page.reload({ waitUntil: 'networkidle2' });

            const staticFiles = responses.filter(response => 
                response.url().includes('.css') || 
                response.url().includes('.js')
            );

            staticFiles.forEach(response => {
                const cacheControl = response.headers()['cache-control'];
                expect(cacheControl).toBeDefined();
            });
        });
    });
});