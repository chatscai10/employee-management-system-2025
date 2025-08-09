#!/usr/bin/env node
/**
 * 📱 前端響應式設計和互動流程測試
 */

const fs = require('fs');
const path = require('path');

class FrontendResponsiveTest {
    constructor() {
        this.publicDir = path.join(__dirname, 'public');
        this.testResults = {
            files: [],
            responsive: [],
            interactive: [],
            accessibility: []
        };
    }

    analyzeHTMLFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const fileName = path.basename(filePath);
            
            console.log(`\n📄 分析文件: ${fileName}`);
            
            // 檢查響應式設計元素
            const responsiveChecks = {
                viewport: /<meta.*viewport.*>/i.test(content),
                mediaQueries: /@media\s*\(.*\)/g.test(content),
                flexbox: /display:\s*flex/g.test(content),
                grid: /display:\s*grid/g.test(content),
                mobileFirst: /max-width:\s*768px/g.test(content) || /max-width:\s*640px/g.test(content)
            };
            
            // 檢查互動元素
            const interactiveChecks = {
                forms: /<form/g.test(content),
                buttons: /<button/g.test(content),
                inputs: /<input/g.test(content),
                javascript: /<script/g.test(content),
                eventHandlers: /onclick|addEventListener/g.test(content)
            };
            
            // 檢查無障礙設計
            const accessibilityChecks = {
                altTags: /<img[^>]*alt=/g.test(content),
                labels: /<label/g.test(content),
                headingStructure: /<h[1-6]/g.test(content),
                lang: /<html[^>]*lang=/g.test(content),
                semanticElements: /<(header|main|nav|section|article|aside|footer)/g.test(content)
            };
            
            const result = {
                fileName,
                responsive: responsiveChecks,
                interactive: interactiveChecks,
                accessibility: accessibilityChecks,
                fileSize: content.length
            };
            
            this.testResults.files.push(result);
            
            // 顯示結果
            console.log('🔍 響應式設計檢查:');
            Object.entries(responsiveChecks).forEach(([key, value]) => {
                console.log(`  ${value ? '✅' : '❌'} ${key}: ${value}`);
            });
            
            console.log('🔍 互動功能檢查:');
            Object.entries(interactiveChecks).forEach(([key, value]) => {
                console.log(`  ${value ? '✅' : '❌'} ${key}: ${value}`);
            });
            
            console.log('🔍 無障礙設計檢查:');
            Object.entries(accessibilityChecks).forEach(([key, value]) => {
                console.log(`  ${value ? '✅' : '❌'} ${key}: ${value}`);
            });
            
            return result;
            
        } catch (error) {
            console.error(`❌ 分析文件失敗: ${filePath}`, error.message);
            return null;
        }
    }

    async runAllTests() {
        console.log('🚀 開始前端響應式設計和互動流程測試...');
        console.log('='.repeat(60));
        
        try {
            // 獲取所有HTML文件
            const htmlFiles = fs.readdirSync(this.publicDir)
                .filter(file => file.endsWith('.html'))
                .map(file => path.join(this.publicDir, file));
            
            console.log(`\n📋 找到 ${htmlFiles.length} 個HTML文件:`);
            htmlFiles.forEach(file => {
                console.log(`  - ${path.basename(file)}`);
            });
            
            // 分析每個HTML文件
            for (const filePath of htmlFiles) {
                await this.analyzeHTMLFile(filePath);
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            this.generateReport();
            
        } catch (error) {
            console.error('❌ 測試執行失敗:', error);
        }
    }

    generateReport() {
        console.log('\n📊 前端測試綜合報告:');
        console.log('='.repeat(60));
        
        const totalFiles = this.testResults.files.length;
        
        // 響應式設計統計
        const responsiveStats = {
            viewport: 0,
            mediaQueries: 0,
            flexbox: 0,
            grid: 0,
            mobileFirst: 0
        };
        
        // 互動功能統計  
        const interactiveStats = {
            forms: 0,
            buttons: 0,
            inputs: 0,
            javascript: 0,
            eventHandlers: 0
        };
        
        // 無障礙設計統計
        const accessibilityStats = {
            altTags: 0,
            labels: 0,
            headingStructure: 0,
            lang: 0,
            semanticElements: 0
        };
        
        this.testResults.files.forEach(file => {
            Object.entries(file.responsive).forEach(([key, value]) => {
                if (value) responsiveStats[key]++;
            });
            
            Object.entries(file.interactive).forEach(([key, value]) => {
                if (value) interactiveStats[key]++;
            });
            
            Object.entries(file.accessibility).forEach(([key, value]) => {
                if (value) accessibilityStats[key]++;
            });
        });
        
        console.log('\n📱 響應式設計覆蓋率:');
        Object.entries(responsiveStats).forEach(([key, count]) => {
            const percentage = Math.round((count / totalFiles) * 100);
            console.log(`  ${key}: ${percentage}% (${count}/${totalFiles})`);
        });
        
        console.log('\n🎯 互動功能覆蓋率:');
        Object.entries(interactiveStats).forEach(([key, count]) => {
            const percentage = Math.round((count / totalFiles) * 100);
            console.log(`  ${key}: ${percentage}% (${count}/${totalFiles})`);
        });
        
        console.log('\n♿ 無障礙設計覆蓋率:');
        Object.entries(accessibilityStats).forEach(([key, count]) => {
            const percentage = Math.round((count / totalFiles) * 100);
            console.log(`  ${key}: ${percentage}% (${count}/${totalFiles})`);
        });
        
        // 計算整體分數
        const responsiveScore = Object.values(responsiveStats).reduce((a, b) => a + b, 0) / (totalFiles * 5);
        const interactiveScore = Object.values(interactiveStats).reduce((a, b) => a + b, 0) / (totalFiles * 5);
        const accessibilityScore = Object.values(accessibilityStats).reduce((a, b) => a + b, 0) / (totalFiles * 5);
        
        console.log('\n📈 整體評分:');
        console.log(`  📱 響應式設計: ${Math.round(responsiveScore * 100)}%`);
        console.log(`  🎯 互動功能: ${Math.round(interactiveScore * 100)}%`);
        console.log(`  ♿ 無障礙設計: ${Math.round(accessibilityScore * 100)}%`);
        console.log(`  🏆 整體分數: ${Math.round(((responsiveScore + interactiveScore + accessibilityScore) / 3) * 100)}%`);
        
        console.log('\n✅ 前端響應式設計和互動流程測試完成');
    }
}

async function main() {
    const tester = new FrontendResponsiveTest();
    await tester.runAllTests();
}

main();