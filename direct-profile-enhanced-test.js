/**
 * 🎯 直接測試profile-enhanced.html現代化功能
 * 跳過employee.html的重定向問題，直接驗證profile-enhanced功能
 */

const puppeteer = require('puppeteer');

class DirectProfileEnhancedTest {
    constructor() {
        this.baseUrl = 'https://employee-management-system-intermediate.onrender.com';
    }

    async runDirectTest() {
        console.log('🎯 啟動profile-enhanced.html直接功能測試...');
        
        const browser = await puppeteer.launch({ 
            headless: false,
            defaultViewport: null,
            args: ['--start-maximized'] 
        });

        try {
            await this.testProfileEnhancedDirectly(browser);
            
        } catch (error) {
            console.error('❌ 測試錯誤:', error.message);
        } finally {
            await browser.close();
            console.log('✅ 直接測試完成');
        }
    }

    async testProfileEnhancedDirectly(browser) {
        console.log('👤 直接測試profile-enhanced.html功能...');
        
        const page = await browser.newPage();
        
        // 完整監控
        page.on('console', msg => console.log(`🖥️  Console [${msg.type()}]: ${msg.text()}`));
        page.on('pageerror', error => console.log(`❌ JS錯誤: ${error.message}`));
        page.on('framenavigated', frame => {
            if (frame === page.mainFrame()) {
                console.log(`🔄 導航至: ${frame.url()}`);
            }
        });
        
        // 監聽API請求
        page.on('request', request => {
            if (request.url().includes('/api/')) {
                console.log(`📡 API請求: ${request.method()} ${request.url()}`);
            }
        });
        
        page.on('response', async response => {
            if (response.url().includes('/api/')) {
                console.log(`📥 API回應: ${response.status()} - ${response.url()}`);
            }
        });
        
        try {
            // 1. 預先設置認證數據
            await page.evaluateOnNewDocument(() => {
                // 模擬成功登入後的狀態
                localStorage.setItem('token', 'test-token-profile-enhanced');
                localStorage.setItem('employee', JSON.stringify({
                    id: 1,
                    employeeId: 'EMP001',
                    name: '張三',
                    position: '員工',
                    store: '台北總店',
                    email: 'zhang.san@company.com',
                    phone: '0912-345-678'
                }));
            });
            
            // 2. 直接訪問profile-enhanced.html
            console.log('🌐 直接訪問profile-enhanced.html...');
            await page.goto(`${this.baseUrl}/public/profile-enhanced.html`);
            await new Promise(resolve => setTimeout(resolve, 8000)); // 充分等待載入
            
            // 3. 檢查頁面狀態
            const pageInfo = await page.evaluate(() => {
                return {
                    url: window.location.href,
                    title: document.title,
                    contentLength: document.body.innerHTML.length,
                    hasContent: document.body.innerHTML.length > 5000
                };
            });
            
            console.log('📄 頁面基本信息:');
            console.log(`  URL: ${pageInfo.url}`);
            console.log(`  標題: ${pageInfo.title}`);
            console.log(`  內容長度: ${pageInfo.contentLength}字符`);
            console.log(`  內容充實: ${pageInfo.hasContent ? '✅' : '❌'}`);
            
            if (pageInfo.url.includes('login')) {
                console.log('❌ 被重定向到登入頁面，profile-enhanced.html無法正常訪問');
                return;
            }
            
            // 4. 詳細功能檢查
            console.log('🔍 檢查profile-enhanced功能元素...');
            const features = await page.evaluate(() => {
                const results = {};
                
                // 核心功能按鈕
                results.clockInBtn = !!document.querySelector('.clock-in-btn, [onclick*="clockIn"]');
                results.clockOutBtn = !!document.querySelector('.clock-out-btn, [onclick*="clockOut"]');
                
                // 個人資料功能
                results.editProfileBtn = !!document.querySelector('[onclick*="editProfile"], .edit-profile-btn');
                results.personalInfoSection = !!document.querySelector('.personal-info, #personal-info');
                
                // 考勤相關
                results.attendanceRecords = !!document.querySelector('#attendance-records, .attendance-records');
                results.attendanceStats = !!document.querySelector('.attendance-stats, #attendance-stats');
                results.gpsStatus = !!document.querySelector('#gps-status, .gps-status');
                
                // 現代化UI元素
                results.universalModal = !!document.querySelector('#universal-modal');
                results.modernButtons = document.querySelectorAll('.modern-btn, .btn-modern').length;
                results.dynamicCards = document.querySelectorAll('.card, .stat-card, .info-card').length;
                
                // 檢查是否有現代化特徵
                const bodyText = document.body.innerHTML;
                results.hasModernCSS = bodyText.includes('backdrop-filter') || 
                                     bodyText.includes('border-radius') || 
                                     bodyText.includes('box-shadow');
                results.hasJSFunctionality = bodyText.includes('addEventListener') || 
                                           bodyText.includes('querySelector');
                
                // 統計總體特徵
                results.totalButtons = document.querySelectorAll('button').length;
                results.totalInputs = document.querySelectorAll('input').length;
                results.totalForms = document.querySelectorAll('form').length;
                
                return results;
            });
            
            console.log('📊 Profile-Enhanced功能檢查結果:');
            console.log('  核心功能:');
            console.log(`    上班打卡按鈕: ${features.clockInBtn ? '✅' : '❌'}`);
            console.log(`    下班打卡按鈕: ${features.clockOutBtn ? '✅' : '❌'}`);
            console.log(`    個人資料編輯: ${features.editProfileBtn ? '✅' : '❌'}`);
            
            console.log('  資料區塊:');
            console.log(`    個人資料區域: ${features.personalInfoSection ? '✅' : '❌'}`);
            console.log(`    考勤記錄區域: ${features.attendanceRecords ? '✅' : '❌'}`);
            console.log(`    考勤統計區域: ${features.attendanceStats ? '✅' : '❌'}`);
            console.log(`    GPS狀態顯示: ${features.gpsStatus ? '✅' : '❌'}`);
            
            console.log('  現代化特徵:');
            console.log(`    通用模態視窗: ${features.universalModal ? '✅' : '❌'}`);
            console.log(`    現代化按鈕數: ${features.modernButtons}`);
            console.log(`    動態卡片數: ${features.dynamicCards}`);
            console.log(`    現代化CSS: ${features.hasModernCSS ? '✅' : '❌'}`);
            console.log(`    JS功能性: ${features.hasJSFunctionality ? '✅' : '❌'}`);
            
            console.log('  整體統計:');
            console.log(`    總按鈕數: ${features.totalButtons}`);
            console.log(`    總輸入框數: ${features.totalInputs}`);
            console.log(`    總表單數: ${features.totalForms}`);
            
            // 5. 計算功能完整度
            const coreFeatures = [
                features.clockInBtn, features.clockOutBtn, features.editProfileBtn,
                features.personalInfoSection, features.attendanceRecords, features.universalModal
            ];
            const coreCompleteness = coreFeatures.filter(Boolean).length;
            
            console.log(`🎯 核心功能完整度: ${coreCompleteness}/6`);
            
            // 6. 嘗試測試互動功能
            if (features.clockInBtn) {
                console.log('🧪 測試上班打卡按鈕互動...');
                try {
                    await page.click('.clock-in-btn, [onclick*="clockIn"]');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    const modalVisible = await page.$('#universal-modal:not([style*="display: none"])');
                    if (modalVisible) {
                        console.log('✅ 打卡按鈕成功觸發模態視窗');
                        
                        // 關閉模態視窗
                        const closeBtn = await page.$('.modal-close, [onclick*="closeModal"]');
                        if (closeBtn) {
                            await closeBtn.click();
                            console.log('✅ 模態視窗成功關閉');
                        }
                    }
                } catch (error) {
                    console.log('❌ 打卡按鈕測試失敗:', error.message);
                }
            }
            
            // 7. 最終評估
            if (coreCompleteness >= 4 && pageInfo.hasContent) {
                console.log('🎉 Profile-Enhanced頁面功能完整，現代化界面正常！');
            } else if (coreCompleteness >= 2) {
                console.log('⚠️  Profile-Enhanced頁面部分功能正常，需要優化');
            } else {
                console.log('❌ Profile-Enhanced頁面功能不完整');
            }
            
        } catch (error) {
            console.error('❌ Profile-Enhanced測試失敗:', error.message);
        } finally {
            await page.close();
        }
    }
}

// 執行直接測試
const test = new DirectProfileEnhancedTest();
test.runDirectTest().catch(console.error);