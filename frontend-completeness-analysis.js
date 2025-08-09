#!/usr/bin/env node
/**
 * 📱 前端頁面完整性和用戶體驗分析
 * 深度分析前端頁面功能完整性、用戶體驗和界面設計
 */

const fs = require('fs');
const path = require('path');

class FrontendCompletenessAnalyzer {
    constructor() {
        this.projectRoot = __dirname;
        this.analysisResults = {
            pageAnalysis: [],
            userExperience: {},
            functionalGaps: [],
            designConsistency: {},
            accessibilityIssues: [],
            recommendations: []
        };
        
        // 企業級系統應有的前端頁面和功能
        this.expectedPages = {
            'index.html': {
                title: '首頁/歡迎頁面',
                requiredElements: ['header', 'nav', 'main', 'footer'],
                requiredFeatures: ['responsive', 'navigation', 'branding'],
                description: '系統首頁，提供導航和系統介紹'
            },
            'login.html': {
                title: '登入頁面',
                requiredElements: ['form', 'input[type="text"]', 'input[type="password"]', 'button[type="submit"]'],
                requiredFeatures: ['validation', 'error-handling', 'remember-me', 'forgot-password'],
                description: '用戶登入界面'
            },
            'register.html': {
                title: '註冊頁面',
                requiredElements: ['form', 'input', 'select', 'button[type="submit"]'],
                requiredFeatures: ['validation', 'step-wizard', 'file-upload', 'terms-agreement'],
                description: '員工註冊申請頁面'
            },
            'admin.html': {
                title: '管理後台',
                requiredElements: ['aside', 'nav', 'main', 'table', 'button'],
                requiredFeatures: ['sidebar', 'data-table', 'crud-operations', 'search-filter'],
                description: '管理員後台管理界面'
            },
            'employee-dashboard.html': {
                title: '員工工作台',
                requiredElements: ['header', 'nav', 'main', 'section'],
                requiredFeatures: ['dashboard', 'quick-actions', 'notifications', 'profile'],
                description: '員工個人工作台'
            },
            'attendance.html': {
                title: '考勤管理頁面',
                requiredElements: ['form', 'button', 'table', 'calendar'],
                requiredFeatures: ['gps-location', 'clock-in', 'history', 'calendar-view'],
                description: '考勤打卡和記錄管理'
            },
            'revenue.html': {
                title: '營收管理頁面',
                requiredElements: ['form', 'input', 'table', 'chart'],
                requiredFeatures: ['data-entry', 'calculation', 'reports', 'charts'],
                description: '營收記錄和統計分析'
            },
            'profile.html': {
                title: '個人資料頁面',
                requiredElements: ['form', 'input', 'img', 'button'],
                requiredFeatures: ['profile-edit', 'photo-upload', 'password-change', 'settings'],
                description: '個人資料管理'
            },
            'reports.html': {
                title: '報表頁面',
                requiredElements: ['table', 'canvas', 'select', 'button'],
                requiredFeatures: ['charts', 'export', 'date-range', 'filters'],
                description: '各類報表和統計分析'
            },
            '404.html': {
                title: '錯誤頁面',
                requiredElements: ['main', 'h1', 'a'],
                requiredFeatures: ['error-message', 'navigation', 'help-links'],
                description: '404錯誤頁面'
            }
        };
        
        // 用戶體驗檢查項目
        this.uxCheckpoints = {
            navigation: ['breadcrumb', 'menu', 'back-button', 'search'],
            forms: ['validation', 'error-messages', 'loading-states', 'auto-save'],
            feedback: ['success-messages', 'error-handling', 'loading-indicators', 'confirmation'],
            accessibility: ['alt-text', 'labels', 'keyboard-nav', 'color-contrast'],
            mobile: ['responsive', 'touch-friendly', 'viewport', 'orientation'],
            performance: ['loading-speed', 'image-optimization', 'caching', 'minification']
        };
    }

    /**
     * 執行前端完整性分析
     */
    async executeFrontendAnalysis() {
        console.log('📱 開始前端頁面完整性分析...');
        console.log('='.repeat(70));
        
        try {
            // 1. 分析現有頁面
            await this.analyzeExistingPages();
            
            // 2. 檢查缺失頁面
            await this.checkMissingPages();
            
            // 3. 分析用戶體驗
            await this.analyzeUserExperience();
            
            // 4. 檢查設計一致性
            await this.checkDesignConsistency();
            
            // 5. 檢查無障礙設計
            await this.checkAccessibility();
            
            // 6. 分析功能缺口
            await this.analyzeFunctionalGaps();
            
            // 7. 生成完整報告
            this.generateComprehensiveReport();
            
        } catch (error) {
            console.error('❌ 前端分析執行失敗:', error);
        }
    }

    /**
     * 分析現有頁面
     */
    async analyzeExistingPages() {
        console.log('\n📄 分析現有頁面...');
        
        const publicPath = path.join(this.projectRoot, 'public');
        if (!fs.existsSync(publicPath)) {
            console.log('  ❌ public目錄不存在');
            return;
        }
        
        const htmlFiles = fs.readdirSync(publicPath)
            .filter(file => file.endsWith('.html'))
            .map(file => path.join(publicPath, file));
        
        console.log(`  找到 ${htmlFiles.length} 個HTML頁面`);
        
        for (const filePath of htmlFiles) {
            const fileName = path.basename(filePath);
            console.log(`\n  🔍 分析 ${fileName}:`);
            
            const analysis = await this.analyzePageCompleteness(filePath);
            this.analysisResults.pageAnalysis.push(analysis);
            
            // 顯示分析結果
            console.log(`    📏 頁面大小: ${analysis.fileSize}KB`);
            console.log(`    🧩 元素完整性: ${analysis.elementCompleteness}%`);
            console.log(`    🎯 功能完整性: ${analysis.featureCompleteness}%`);
            console.log(`    📱 響應式支援: ${analysis.responsive ? '✅' : '❌'}`);
            console.log(`    ♿ 無障礙設計: ${analysis.accessibility}%`);
            
            if (analysis.issues.length > 0) {
                console.log('    ⚠️ 發現問題:');
                analysis.issues.forEach(issue => {
                    console.log(`      • ${issue}`);
                });
            }
        }
    }

    /**
     * 分析單個頁面完整性
     */
    async analyzePageCompleteness(filePath) {
        const fileName = path.basename(filePath);
        const content = fs.readFileSync(filePath, 'utf8');
        const expectedPage = this.expectedPages[fileName];
        
        const analysis = {
            fileName: fileName,
            fileSize: Math.round(content.length / 1024),
            title: this.extractTitle(content),
            elementCompleteness: 0,
            featureCompleteness: 0,
            responsive: false,
            accessibility: 0,
            issues: [],
            missingElements: [],
            missingFeatures: []
        };
        
        if (!expectedPage) {
            analysis.issues.push('頁面不在預期清單中，可能為額外頁面');
            return analysis;
        }
        
        // 檢查必要元素
        const foundElements = [];
        for (const element of expectedPage.requiredElements) {
            if (this.checkElementExists(content, element)) {
                foundElements.push(element);
            } else {
                analysis.missingElements.push(element);
            }
        }
        analysis.elementCompleteness = Math.round((foundElements.length / expectedPage.requiredElements.length) * 100);
        
        // 檢查功能特性
        const foundFeatures = [];
        for (const feature of expectedPage.requiredFeatures) {
            if (this.checkFeatureExists(content, feature)) {
                foundFeatures.push(feature);
            } else {
                analysis.missingFeatures.push(feature);
            }
        }
        analysis.featureCompleteness = Math.round((foundFeatures.length / expectedPage.requiredFeatures.length) * 100);
        
        // 檢查響應式設計
        analysis.responsive = this.checkResponsiveDesign(content);
        
        // 檢查無障礙設計
        analysis.accessibility = this.checkAccessibilityFeatures(content);
        
        // 收集問題
        if (analysis.missingElements.length > 0) {
            analysis.issues.push(`缺少必要元素: ${analysis.missingElements.join(', ')}`);
        }
        if (analysis.missingFeatures.length > 0) {
            analysis.issues.push(`缺少功能特性: ${analysis.missingFeatures.join(', ')}`);
        }
        if (!analysis.responsive) {
            analysis.issues.push('缺少響應式設計支援');
        }
        if (analysis.accessibility < 60) {
            analysis.issues.push('無障礙設計不足');
        }
        
        return analysis;
    }

    /**
     * 提取頁面標題
     */
    extractTitle(content) {
        const titleMatch = content.match(/<title>(.*?)<\/title>/i);
        return titleMatch ? titleMatch[1] : '未設定標題';
    }

    /**
     * 檢查元素是否存在
     */
    checkElementExists(content, element) {
        const selectors = {
            'header': /<header/i,
            'nav': /<nav/i,
            'main': /<main/i,
            'footer': /<footer/i,
            'form': /<form/i,
            'input[type="text"]': /<input[^>]*type=['"]text['"]/i,
            'input[type="password"]': /<input[^>]*type=['"]password['"]/i,
            'button[type="submit"]': /<button[^>]*type=['"]submit['"]/i,
            'input': /<input/i,
            'select': /<select/i,
            'button': /<button/i,
            'aside': /<aside/i,
            'table': /<table/i,
            'section': /<section/i,
            'calendar': /calendar|date-picker/i,
            'chart': /chart|canvas/i,
            'img': /<img/i,
            'canvas': /<canvas/i,
            'h1': /<h1/i,
            'a': /<a/i
        };
        
        const pattern = selectors[element];
        return pattern ? pattern.test(content) : content.includes(element);
    }

    /**
     * 檢查功能特性是否存在
     */
    checkFeatureExists(content, feature) {
        const featurePatterns = {
            'responsive': /@media|viewport/i,
            'navigation': /nav|menu/i,
            'branding': /logo|brand/i,
            'validation': /validate|required/i,
            'error-handling': /error|invalid/i,
            'remember-me': /remember|keep.*login/i,
            'forgot-password': /forgot|reset.*password/i,
            'step-wizard': /step|wizard|progress/i,
            'file-upload': /upload|file/i,
            'terms-agreement': /terms|agreement|accept/i,
            'sidebar': /sidebar|aside/i,
            'data-table': /table|grid/i,
            'crud-operations': /add|edit|delete|create|update/i,
            'search-filter': /search|filter/i,
            'dashboard': /dashboard|widget/i,
            'quick-actions': /quick|action/i,
            'notifications': /notification|alert/i,
            'profile': /profile|account/i,
            'gps-location': /gps|location|geolocation/i,
            'clock-in': /clock|checkin|attendance/i,
            'history': /history|record/i,
            'calendar-view': /calendar|date/i,
            'data-entry': /form|input/i,
            'calculation': /calculate|compute/i,
            'reports': /report|summary/i,
            'charts': /chart|graph/i,
            'profile-edit': /edit.*profile/i,
            'photo-upload': /photo|image.*upload/i,
            'password-change': /password.*change/i,
            'settings': /setting|config/i,
            'export': /export|download/i,
            'date-range': /date.*range|from.*to/i,
            'filters': /filter|search/i,
            'error-message': /error|not.*found/i,
            'help-links': /help|support|contact/i
        };
        
        const pattern = featurePatterns[feature];
        return pattern ? pattern.test(content) : false;
    }

    /**
     * 檢查響應式設計
     */
    checkResponsiveDesign(content) {
        return /<meta[^>]*viewport[^>]*>/i.test(content) && 
               /@media[^{]*\{[^}]*\}/i.test(content);
    }

    /**
     * 檢查無障礙設計特性
     */
    checkAccessibilityFeatures(content) {
        let score = 0;
        const checks = [
            { pattern: /<img[^>]*alt=/i, name: 'img alt attribute' },
            { pattern: /<label/i, name: 'form labels' },
            { pattern: /lang=['"][^'"]+['"]/i, name: 'html lang attribute' },
            { pattern: /<(h[1-6])/i, name: 'heading structure' },
            { pattern: /aria-/i, name: 'ARIA attributes' },
            { pattern: /role=['"][^'"]+['"]/i, name: 'ARIA roles' },
            { pattern: /tabindex/i, name: 'keyboard navigation' },
            { pattern: /<button[^>]*>(?!<\/button>)/i, name: 'button text content' }
        ];
        
        checks.forEach(check => {
            if (check.pattern.test(content)) {
                score += 12.5; // 100/8
            }
        });
        
        return Math.round(score);
    }

    /**
     * 檢查缺失頁面
     */
    async checkMissingPages() {
        console.log('\n❌ 檢查缺失頁面...');
        
        const publicPath = path.join(this.projectRoot, 'public');
        const existingPages = fs.existsSync(publicPath) ? 
            fs.readdirSync(publicPath).filter(file => file.endsWith('.html')) : [];
        
        const missingPages = [];
        
        for (const [fileName, pageInfo] of Object.entries(this.expectedPages)) {
            if (!existingPages.includes(fileName)) {
                console.log(`  ❌ 缺少: ${fileName} - ${pageInfo.title}`);
                missingPages.push({
                    fileName: fileName,
                    title: pageInfo.title,
                    description: pageInfo.description,
                    priority: this.getPagePriority(fileName)
                });
            } else {
                console.log(`  ✅ 存在: ${fileName}`);
            }
        }
        
        this.analysisResults.missingPages = missingPages;
        
        console.log(`\n  📊 頁面完整性: ${((Object.keys(this.expectedPages).length - missingPages.length) / Object.keys(this.expectedPages).length * 100).toFixed(1)}%`);
    }

    /**
     * 獲取頁面優先級
     */
    getPagePriority(fileName) {
        const priorityMap = {
            'login.html': 'high',
            'register.html': 'high',
            'employee-dashboard.html': 'high',
            'attendance.html': 'high',
            'revenue.html': 'medium',
            'profile.html': 'medium',
            'reports.html': 'medium',
            '404.html': 'low'
        };
        
        return priorityMap[fileName] || 'low';
    }

    /**
     * 分析用戶體驗
     */
    async analyzeUserExperience() {
        console.log('\n🎯 分析用戶體驗...');
        
        const uxAnalysis = {};
        
        for (const [category, checkpoints] of Object.entries(this.uxCheckpoints)) {
            console.log(`\n  檢查 ${category}:`);
            
            const categoryScore = {};
            let foundCount = 0;
            
            for (const checkpoint of checkpoints) {
                const found = this.checkUXFeatureAcrossPages(checkpoint);
                categoryScore[checkpoint] = found;
                
                if (found) {
                    foundCount++;
                    console.log(`    ✅ ${checkpoint}`);
                } else {
                    console.log(`    ❌ ${checkpoint}`);
                }
            }
            
            uxAnalysis[category] = {
                score: Math.round((foundCount / checkpoints.length) * 100),
                details: categoryScore
            };
            
            console.log(`  📊 ${category} 完整性: ${uxAnalysis[category].score}%`);
        }
        
        this.analysisResults.userExperience = uxAnalysis;
    }

    /**
     * 檢查UX功能是否在所有頁面中實現
     */
    checkUXFeatureAcrossPages(feature) {
        const featurePatterns = {
            'breadcrumb': /breadcrumb|nav.*path/i,
            'menu': /menu|nav/i,
            'back-button': /back|previous/i,
            'search': /search/i,
            'validation': /validate|required/i,
            'error-messages': /error|invalid/i,
            'loading-states': /loading|spinner/i,
            'auto-save': /auto.*save|draft/i,
            'success-messages': /success|complete/i,
            'error-handling': /error|catch/i,
            'loading-indicators': /loading|progress/i,
            'confirmation': /confirm|sure/i,
            'alt-text': /alt=/i,
            'labels': /<label/i,
            'keyboard-nav': /tabindex|keydown/i,
            'color-contrast': /contrast|accessibility/i,
            'responsive': /@media/i,
            'touch-friendly': /touch|mobile/i,
            'viewport': /viewport/i,
            'orientation': /orientation/i,
            'loading-speed': /lazy|defer/i,
            'image-optimization': /srcset|sizes/i,
            'caching': /cache/i,
            'minification': /\.min\./i
        };
        
        const pattern = featurePatterns[feature];
        if (!pattern) return false;
        
        // 檢查所有分析過的頁面
        for (const pageAnalysis of this.analysisResults.pageAnalysis) {
            const filePath = path.join(this.projectRoot, 'public', pageAnalysis.fileName);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                if (pattern.test(content)) {
                    return true;
                }
            }
        }
        
        return false;
    }

    /**
     * 檢查設計一致性
     */
    async checkDesignConsistency() {
        console.log('\n🎨 檢查設計一致性...');
        
        const consistency = {
            colorScheme: this.checkColorConsistency(),
            typography: this.checkTypographyConsistency(),
            layout: this.checkLayoutConsistency(),
            components: this.checkComponentConsistency(),
            branding: this.checkBrandingConsistency()
        };
        
        this.analysisResults.designConsistency = consistency;
        
        Object.entries(consistency).forEach(([aspect, result]) => {
            const status = result.consistent ? '✅' : '⚠️';
            console.log(`  ${status} ${aspect}: ${result.score}%`);
            
            if (result.issues.length > 0) {
                result.issues.forEach(issue => {
                    console.log(`    • ${issue}`);
                });
            }
        });
    }

    /**
     * 檢查顏色一致性
     */
    checkColorConsistency() {
        // 簡化的顏色一致性檢查
        const colors = new Set();
        const issues = [];
        
        for (const pageAnalysis of this.analysisResults.pageAnalysis) {
            const filePath = path.join(this.projectRoot, 'public', pageAnalysis.fileName);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                
                // 提取顏色值
                const colorMatches = content.match(/#[0-9a-fA-F]{3,6}|rgb\([^)]+\)|rgba\([^)]+\)/g);
                if (colorMatches) {
                    colorMatches.forEach(color => colors.add(color));
                }
            }
        }
        
        if (colors.size > 20) {
            issues.push('使用過多顏色，建議建立顏色系統');
        }
        
        return {
            consistent: colors.size <= 15,
            score: Math.max(0, 100 - (colors.size - 10) * 5),
            colorCount: colors.size,
            issues: issues
        };
    }

    /**
     * 檢查字體一致性
     */
    checkTypographyConsistency() {
        const fonts = new Set();
        const issues = [];
        
        for (const pageAnalysis of this.analysisResults.pageAnalysis) {
            const filePath = path.join(this.projectRoot, 'public', pageAnalysis.fileName);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                
                // 提取字體定義
                const fontMatches = content.match(/font-family:\s*[^;}]+/g);
                if (fontMatches) {
                    fontMatches.forEach(font => fonts.add(font));
                }
            }
        }
        
        if (fonts.size > 5) {
            issues.push('使用過多字體，建議統一字體系統');
        }
        
        return {
            consistent: fonts.size <= 3,
            score: Math.max(0, 100 - (fonts.size - 3) * 15),
            fontCount: fonts.size,
            issues: issues
        };
    }

    /**
     * 檢查布局一致性
     */
    checkLayoutConsistency() {
        const layouts = new Set();
        const issues = [];
        
        for (const pageAnalysis of this.analysisResults.pageAnalysis) {
            const filePath = path.join(this.projectRoot, 'public', pageAnalysis.fileName);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                
                // 檢查布局模式
                if (content.includes('display: grid')) layouts.add('grid');
                if (content.includes('display: flex')) layouts.add('flexbox');
                if (content.includes('float:')) layouts.add('float');
                if (content.includes('position: absolute')) layouts.add('absolute');
            }
        }
        
        if (layouts.size > 2) {
            issues.push('使用多種布局方式，建議統一布局系統');
        }
        
        return {
            consistent: layouts.size <= 2,
            score: layouts.size <= 2 ? 100 : 70,
            layoutTypes: Array.from(layouts),
            issues: issues
        };
    }

    /**
     * 檢查組件一致性
     */
    checkComponentConsistency() {
        const components = {
            buttons: 0,
            forms: 0,
            tables: 0,
            cards: 0
        };
        
        const issues = [];
        
        for (const pageAnalysis of this.analysisResults.pageAnalysis) {
            const filePath = path.join(this.projectRoot, 'public', pageAnalysis.fileName);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                
                // 計算組件使用
                components.buttons += (content.match(/<button/g) || []).length;
                components.forms += (content.match(/<form/g) || []).length;
                components.tables += (content.match(/<table/g) || []).length;
                components.cards += (content.match(/class="[^"]*card[^"]*"/g) || []).length;
            }
        }
        
        const totalComponents = Object.values(components).reduce((a, b) => a + b, 0);
        
        if (totalComponents < 10) {
            issues.push('組件使用較少，建議建立組件庫');
        }
        
        return {
            consistent: totalComponents >= 10,
            score: Math.min(100, totalComponents * 5),
            components: components,
            issues: issues
        };
    }

    /**
     * 檢查品牌一致性
     */
    checkBrandingConsistency() {
        const branding = {
            logo: false,
            title: false,
            colors: false,
            fonts: false
        };
        
        const issues = [];
        
        for (const pageAnalysis of this.analysisResults.pageAnalysis) {
            const filePath = path.join(this.projectRoot, 'public', pageAnalysis.fileName);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                
                if (content.includes('logo')) branding.logo = true;
                if (content.includes('企業員工管理')) branding.title = true;
                if (content.includes('#')) branding.colors = true;
                if (content.includes('font-family')) branding.fonts = true;
            }
        }
        
        const brandingScore = Object.values(branding).filter(Boolean).length * 25;
        
        if (!branding.logo) issues.push('缺少統一的Logo設計');
        if (!branding.title) issues.push('缺少一致的系統名稱');
        
        return {
            consistent: brandingScore >= 75,
            score: brandingScore,
            elements: branding,
            issues: issues
        };
    }

    /**
     * 檢查無障礙設計
     */
    async checkAccessibility() {
        console.log('\n♿ 檢查無障礙設計...');
        
        const accessibilityIssues = [];
        
        for (const pageAnalysis of this.analysisResults.pageAnalysis) {
            const filePath = path.join(this.projectRoot, 'public', pageAnalysis.fileName);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                const pageIssues = this.checkPageAccessibility(content, pageAnalysis.fileName);
                accessibilityIssues.push(...pageIssues);
            }
        }
        
        this.analysisResults.accessibilityIssues = accessibilityIssues;
        
        if (accessibilityIssues.length === 0) {
            console.log('  🎉 未發現嚴重的無障礙設計問題');
        } else {
            console.log(`  發現 ${accessibilityIssues.length} 個無障礙設計問題:`);
            accessibilityIssues.forEach(issue => {
                console.log(`    • ${issue.page}: ${issue.issue}`);
            });
        }
    }

    /**
     * 檢查單頁無障礙設計
     */
    checkPageAccessibility(content, fileName) {
        const issues = [];
        
        // 檢查圖片alt屬性
        const images = content.match(/<img[^>]*>/g) || [];
        images.forEach(img => {
            if (!img.includes('alt=')) {
                issues.push({ page: fileName, issue: '圖片缺少alt屬性', severity: 'high' });
            }
        });
        
        // 檢查表單標籤
        const inputs = content.match(/<input[^>]*>/g) || [];
        inputs.forEach(input => {
            if (!content.includes('<label') && !input.includes('aria-label')) {
                issues.push({ page: fileName, issue: '輸入欄位缺少標籤', severity: 'high' });
            }
        });
        
        // 檢查標題結構
        const headings = content.match(/<h[1-6]/g) || [];
        if (headings.length === 0) {
            issues.push({ page: fileName, issue: '缺少標題結構', severity: 'medium' });
        }
        
        // 檢查語言屬性
        if (!content.includes('lang=')) {
            issues.push({ page: fileName, issue: 'HTML缺少lang屬性', severity: 'medium' });
        }
        
        return issues;
    }

    /**
     * 分析功能缺口
     */
    async analyzeFunctionalGaps() {
        console.log('\n🔍 分析功能缺口...');
        
        const functionalGaps = [];
        
        // 檢查核心功能缺口
        const coreGaps = this.checkCoreFunctionGaps();
        if (coreGaps.length > 0) {
            functionalGaps.push({
                category: '核心功能',
                gaps: coreGaps
            });
        }
        
        // 檢查用戶體驗缺口
        const uxGaps = this.checkUXGaps();
        if (uxGaps.length > 0) {
            functionalGaps.push({
                category: '用戶體驗',
                gaps: uxGaps
            });
        }
        
        // 檢查技術實現缺口
        const techGaps = this.checkTechnicalGaps();
        if (techGaps.length > 0) {
            functionalGaps.push({
                category: '技術實現',
                gaps: techGaps
            });
        }
        
        this.analysisResults.functionalGaps = functionalGaps;
        
        functionalGaps.forEach(category => {
            console.log(`\n  ❌ ${category.category}:`);
            category.gaps.forEach(gap => {
                console.log(`    • ${gap}`);
            });
        });
    }

    checkCoreFunctionGaps() {
        const gaps = [];
        const pageFiles = this.analysisResults.pageAnalysis.map(p => p.fileName);
        
        if (!pageFiles.includes('attendance.html')) {
            gaps.push('缺少專門的考勤管理頁面');
        }
        
        if (!pageFiles.includes('revenue.html')) {
            gaps.push('缺少營收管理頁面');
        }
        
        if (!pageFiles.includes('reports.html')) {
            gaps.push('缺少報表統計頁面');
        }
        
        if (!pageFiles.includes('profile.html')) {
            gaps.push('缺少個人資料管理頁面');
        }
        
        return gaps;
    }

    checkUXGaps() {
        const gaps = [];
        
        if (this.analysisResults.userExperience.feedback?.score < 70) {
            gaps.push('用戶反饋機制不完善');
        }
        
        if (this.analysisResults.userExperience.navigation?.score < 70) {
            gaps.push('導航體驗需要改善');
        }
        
        if (this.analysisResults.userExperience.forms?.score < 70) {
            gaps.push('表單交互體驗不佳');
        }
        
        return gaps;
    }

    checkTechnicalGaps() {
        const gaps = [];
        
        if (this.analysisResults.userExperience.performance?.score < 70) {
            gaps.push('頁面性能需要優化');
        }
        
        if (this.analysisResults.userExperience.mobile?.score < 70) {
            gaps.push('移動端支援不足');
        }
        
        const avgAccessibility = this.analysisResults.pageAnalysis
            .reduce((sum, page) => sum + page.accessibility, 0) / this.analysisResults.pageAnalysis.length;
        
        if (avgAccessibility < 70) {
            gaps.push('無障礙設計實現不足');
        }
        
        return gaps;
    }

    /**
     * 生成完整報告
     */
    generateComprehensiveReport() {
        console.log('\n📊 前端完整性分析報告:');
        console.log('='.repeat(70));
        
        // 頁面完整性統計
        console.log('\n📄 頁面完整性統計:');
        const existingPages = this.analysisResults.pageAnalysis.length;
        const expectedPages = Object.keys(this.expectedPages).length;
        const completeness = (existingPages / expectedPages * 100).toFixed(1);
        
        console.log(`  頁面覆蓋率: ${completeness}% (${existingPages}/${expectedPages})`);
        
        if (this.analysisResults.pageAnalysis.length > 0) {
            const avgElementCompleteness = this.analysisResults.pageAnalysis
                .reduce((sum, page) => sum + page.elementCompleteness, 0) / this.analysisResults.pageAnalysis.length;
            const avgFeatureCompleteness = this.analysisResults.pageAnalysis
                .reduce((sum, page) => sum + page.featureCompleteness, 0) / this.analysisResults.pageAnalysis.length;
            const avgAccessibility = this.analysisResults.pageAnalysis
                .reduce((sum, page) => sum + page.accessibility, 0) / this.analysisResults.pageAnalysis.length;
            
            console.log(`  平均元素完整性: ${avgElementCompleteness.toFixed(1)}%`);
            console.log(`  平均功能完整性: ${avgFeatureCompleteness.toFixed(1)}%`);
            console.log(`  平均無障礙設計: ${avgAccessibility.toFixed(1)}%`);
        }
        
        // 用戶體驗統計
        console.log('\n🎯 用戶體驗統計:');
        if (Object.keys(this.analysisResults.userExperience).length > 0) {
            Object.entries(this.analysisResults.userExperience).forEach(([category, result]) => {
                console.log(`  ${category}: ${result.score}%`);
            });
            
            const avgUXScore = Object.values(this.analysisResults.userExperience)
                .reduce((sum, result) => sum + result.score, 0) / Object.keys(this.analysisResults.userExperience).length;
            console.log(`  整體UX評分: ${avgUXScore.toFixed(1)}%`);
        }
        
        // 設計一致性統計
        console.log('\n🎨 設計一致性統計:');
        if (Object.keys(this.analysisResults.designConsistency).length > 0) {
            Object.entries(this.analysisResults.designConsistency).forEach(([aspect, result]) => {
                console.log(`  ${aspect}: ${result.score}%`);
            });
        }
        
        // 無障礙設計問題
        console.log('\n♿ 無障礙設計問題:');
        if (this.analysisResults.accessibilityIssues.length === 0) {
            console.log('  🎉 未發現嚴重問題');
        } else {
            const highSeverity = this.analysisResults.accessibilityIssues.filter(i => i.severity === 'high').length;
            const mediumSeverity = this.analysisResults.accessibilityIssues.filter(i => i.severity === 'medium').length;
            
            console.log(`  高嚴重性問題: ${highSeverity} 個`);
            console.log(`  中等嚴重性問題: ${mediumSeverity} 個`);
        }
        
        // 功能缺口
        console.log('\n🔍 功能缺口:');
        if (this.analysisResults.functionalGaps.length === 0) {
            console.log('  🎉 功能完整！');
        } else {
            this.analysisResults.functionalGaps.forEach(category => {
                console.log(`  ${category.category}: ${category.gaps.length} 個問題`);
            });
        }
        
        // 改善建議
        this.generateRecommendations();
        
        console.log('\n✅ 前端完整性分析完成');
    }

    /**
     * 生成改善建議
     */
    generateRecommendations() {
        console.log('\n💡 前端改善建議:');
        
        const recommendations = [];
        
        // 基於缺失頁面的建議
        if (this.analysisResults.missingPages && this.analysisResults.missingPages.length > 0) {
            const highPriorityPages = this.analysisResults.missingPages.filter(p => p.priority === 'high');
            if (highPriorityPages.length > 0) {
                recommendations.push('🔧 [高優先級] 創建缺失的核心頁面');
            }
        }
        
        // 基於用戶體驗的建議
        if (Object.values(this.analysisResults.userExperience).some(ux => ux.score < 70)) {
            recommendations.push('🎯 [高優先級] 改善用戶體驗設計');
        }
        
        // 基於無障礙設計的建議
        if (this.analysisResults.accessibilityIssues.length > 0) {
            recommendations.push('♿ [高優先級] 修復無障礙設計問題');
        }
        
        // 基於設計一致性的建議
        if (Object.values(this.analysisResults.designConsistency).some(design => design.score < 80)) {
            recommendations.push('🎨 [中優先級] 統一設計風格和組件');
        }
        
        // 基於功能缺口的建議
        if (this.analysisResults.functionalGaps.length > 0) {
            recommendations.push('🔍 [中優先級] 補充缺失的功能模組');
        }
        
        // 通用建議
        recommendations.push('📚 [中優先級] 建立前端組件庫和設計系統');
        recommendations.push('⚡ [低優先級] 優化頁面載入性能');
        recommendations.push('📱 [低優先級] 增強移動端用戶體驗');
        
        recommendations.forEach((rec, index) => {
            console.log(`  ${index + 1}. ${rec}`);
        });
        
        this.analysisResults.recommendations = recommendations;
    }

    /**
     * 導出分析結果
     */
    exportAnalysisResults() {
        const reportFile = path.join(this.projectRoot, 'frontend-completeness-analysis-report.json');
        
        try {
            fs.writeFileSync(reportFile, JSON.stringify(this.analysisResults, null, 2));
            console.log(`\n📄 前端分析報告已導出: frontend-completeness-analysis-report.json`);
            return reportFile;
        } catch (error) {
            console.error('❌ 導出分析報告失敗:', error.message);
            return null;
        }
    }
}

// 執行分析
async function main() {
    const analyzer = new FrontendCompletenessAnalyzer();
    await analyzer.executeFrontendAnalysis();
    analyzer.exportAnalysisResults();
}

if (require.main === module) {
    main();
}

module.exports = FrontendCompletenessAnalyzer;