# 📱 企業員工管理系統 - UI/UX設計規範

## 🎯 **設計原則**

### 📲 **手機端優先 (Mobile First)**
```css
/* 設計斷點 */
:root {
  /* 超小型設備 (手機, < 576px) */
  --xs-max: 575.98px;
  
  /* 小型設備 (手機, >= 576px) */
  --sm-min: 576px;
  --sm-max: 767.98px;
  
  /* 中型設備 (平板, >= 768px) */
  --md-min: 768px;
  --md-max: 991.98px;
  
  /* 大型設備 (桌機, >= 992px) */
  --lg-min: 992px;
  --lg-max: 1199.98px;
  
  /* 超大型設備 (大桌機, >= 1200px) */
  --xl-min: 1200px;
}
```

### 🎨 **設計系統配色**
```css
:root {
  /* 主色調 - 專業藍 */
  --primary-50: #eff6ff;
  --primary-100: #dbeafe;
  --primary-200: #bfdbfe;
  --primary-300: #93c5fd;
  --primary-400: #60a5fa;
  --primary-500: #3b82f6;   /* 主色 */
  --primary-600: #2563eb;
  --primary-700: #1d4ed8;
  --primary-800: #1e40af;
  --primary-900: #1e3a8a;
  
  /* 次要色調 - 成功綠 */
  --success-50: #f0fdf4;
  --success-100: #dcfce7;
  --success-200: #bbf7d0;
  --success-300: #86efac;
  --success-400: #4ade80;
  --success-500: #22c55e;   /* 成功色 */
  --success-600: #16a34a;
  --success-700: #15803d;
  --success-800: #166534;
  --success-900: #14532d;
  
  /* 警告色調 - 橙黃 */
  --warning-50: #fffbeb;
  --warning-100: #fef3c7;
  --warning-200: #fde68a;
  --warning-300: #fcd34d;
  --warning-400: #fbbf24;
  --warning-500: #f59e0b;   /* 警告色 */
  --warning-600: #d97706;
  --warning-700: #b45309;
  --warning-800: #92400e;
  --warning-900: #78350f;
  
  /* 錯誤色調 - 危險紅 */
  --danger-50: #fef2f2;
  --danger-100: #fee2e2;
  --danger-200: #fecaca;
  --danger-300: #fca5a5;
  --danger-400: #f87171;
  --danger-500: #ef4444;    /* 錯誤色 */
  --danger-600: #dc2626;
  --danger-700: #b91c1c;
  --danger-800: #991b1b;
  --danger-900: #7f1d1d;
  
  /* 中性色調 - 灰階 */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;
  
  /* 背景色 */
  --bg-primary: var(--gray-50);
  --bg-secondary: #ffffff;
  --bg-accent: var(--primary-50);
  
  /* 文字色 */
  --text-primary: var(--gray-900);
  --text-secondary: var(--gray-600);
  --text-muted: var(--gray-400);
  --text-white: #ffffff;
  
  /* 邊框色 */
  --border-light: var(--gray-200);
  --border-medium: var(--gray-300);
  --border-dark: var(--gray-400);
}
```

### 🔤 **字體系統**
```css
:root {
  /* 中文字體堆疊 */
  --font-family-sans: 
    -apple-system, BlinkMacSystemFont,
    "Segoe UI", "Noto Sans TC", "Microsoft JhengHei",
    "PingFang TC", "Hiragino Sans GB", sans-serif;
    
  /* 等寬字體 (數字、代碼) */
  --font-family-mono: 
    "SF Mono", Monaco, "Cascadia Code", 
    "Roboto Mono", Consolas, monospace;
  
  /* 字體大小 */
  --text-xs: 0.75rem;     /* 12px */
  --text-sm: 0.875rem;    /* 14px */
  --text-base: 1rem;      /* 16px */
  --text-lg: 1.125rem;    /* 18px */
  --text-xl: 1.25rem;     /* 20px */
  --text-2xl: 1.5rem;     /* 24px */
  --text-3xl: 1.875rem;   /* 30px */
  --text-4xl: 2.25rem;    /* 36px */
  
  /* 行高 */
  --leading-tight: 1.25;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  --leading-loose: 2;
  
  /* 字重 */
  --font-light: 300;
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
}
```

### 📏 **間距系統**
```css
:root {
  /* 間距單位 (基於 4px 系統) */
  --space-0: 0;
  --space-1: 0.25rem;     /* 4px */
  --space-2: 0.5rem;      /* 8px */
  --space-3: 0.75rem;     /* 12px */
  --space-4: 1rem;        /* 16px */
  --space-5: 1.25rem;     /* 20px */
  --space-6: 1.5rem;      /* 24px */
  --space-8: 2rem;        /* 32px */
  --space-10: 2.5rem;     /* 40px */
  --space-12: 3rem;       /* 48px */
  --space-16: 4rem;       /* 64px */
  --space-20: 5rem;       /* 80px */
  
  /* 圓角 */
  --radius-none: 0;
  --radius-sm: 0.125rem;   /* 2px */
  --radius-base: 0.25rem;  /* 4px */
  --radius-md: 0.375rem;   /* 6px */
  --radius-lg: 0.5rem;     /* 8px */
  --radius-xl: 0.75rem;    /* 12px */
  --radius-2xl: 1rem;      /* 16px */
  --radius-full: 9999px;
  
  /* 陰影 */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-base: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}
```

## 📱 **頁面佈局設計**

### 🏠 **一頁式應用架構**
```html
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <meta name="theme-color" content="#3b82f6">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <title>員工管理系統</title>
    <link rel="manifest" href="/manifest.json">
</head>
<body>
    <!-- 全域載入指示器 -->
    <div id="global-loader" class="loader-overlay">
        <div class="loader-spinner"></div>
        <div class="loader-text">載入中...</div>
    </div>
    
    <!-- 主應用容器 -->
    <div id="app" class="app-container">
        <!-- 1. 登入註冊頁 -->
        <div id="auth-page" class="page active">
            <div class="auth-container">
                <!-- 登入表單 -->
                <div id="login-form" class="auth-form">
                    <!-- 登入內容 -->
                </div>
                
                <!-- 註冊表單 -->
                <div id="register-form" class="auth-form hidden">
                    <!-- 註冊內容 -->
                </div>
            </div>
        </div>
        
        <!-- 2. 員工功能頁 -->
        <div id="employee-page" class="page hidden">
            <!-- 頂部導航 -->
            <nav class="top-nav">
                <!-- 導航內容 -->
            </nav>
            
            <!-- 功能選單 -->
            <div class="function-menu">
                <!-- 功能按鈕 -->
            </div>
            
            <!-- 功能內容區 -->
            <main class="content-area">
                <!-- 打卡模組 -->
                <div id="attendance-module" class="module active">
                    <!-- 打卡內容 -->
                </div>
                
                <!-- 營收模組 -->
                <div id="revenue-module" class="module hidden">
                    <!-- 營收內容 -->
                </div>
                
                <!-- 其他模組... -->
            </main>
        </div>
        
        <!-- 3. 管理員頁 -->
        <div id="admin-page" class="page hidden">
            <!-- 管理員內容 -->
        </div>
    </div>
    
    <!-- 全域模態窗 -->
    <div id="modal-container" class="modal-overlay hidden">
        <div class="modal-content">
            <!-- 動態內容 */
        </div>
    </div>
    
    <!-- 全域通知 -->
    <div id="notification-container" class="notification-container">
        <!-- 動態通知 -->
    </div>
</body>
</html>
```

### 🎨 **核心CSS樣式**
```css
/* ===========================
   基礎樣式重置
   =========================== */
* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

html {
    font-size: 16px;
    -webkit-text-size-adjust: 100%;
    -webkit-tap-highlight-color: transparent;
}

body {
    font-family: var(--font-family-sans);
    font-size: var(--text-base);
    line-height: var(--leading-normal);
    color: var(--text-primary);
    background-color: var(--bg-primary);
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

/* ===========================
   應用佈局
   =========================== */
.app-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    position: relative;
}

.page {
    min-height: 100vh;
    display: none;
    flex-direction: column;
    animation: fadeIn 0.3s ease-in-out;
}

.page.active {
    display: flex;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

/* ===========================
   登入註冊頁樣式
   =========================== */
.auth-container {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-4);
    background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-700) 100%);
}

.auth-form {
    width: 100%;
    max-width: 400px;
    background: var(--bg-secondary);
    border-radius: var(--radius-xl);
    padding: var(--space-8);
    box-shadow: var(--shadow-xl);
    animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
    from { transform: translateY(30px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}

.auth-header {
    text-align: center;
    margin-bottom: var(--space-8);
}

.auth-title {
    font-size: var(--text-2xl);
    font-weight: var(--font-bold);
    color: var(--text-primary);
    margin-bottom: var(--space-2);
}

.auth-subtitle {
    font-size: var(--text-sm);
    color: var(--text-secondary);
}

/* ===========================
   表單組件樣式
   =========================== */
.form-group {
    margin-bottom: var(--space-4);
}

.form-label {
    display: block;
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    color: var(--text-primary);
    margin-bottom: var(--space-2);
}

.form-input {
    width: 100%;
    padding: var(--space-3) var(--space-4);
    font-size: var(--text-base);
    color: var(--text-primary);
    background-color: var(--bg-secondary);
    border: 2px solid var(--border-light);
    border-radius: var(--radius-lg);
    transition: all 0.2s ease;
    -webkit-appearance: none;
    appearance: none;
}

.form-input:focus {
    outline: none;
    border-color: var(--primary-500);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input::placeholder {
    color: var(--text-muted);
}

.form-input:invalid {
    border-color: var(--danger-500);
}

.form-error {
    display: block;
    font-size: var(--text-xs);
    color: var(--danger-500);
    margin-top: var(--space-1);
}

/* ===========================
   按鈕組件樣式
   =========================== */
.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-3) var(--space-6);
    font-size: var(--text-base);
    font-weight: var(--font-medium);
    line-height: 1;
    text-align: center;
    text-decoration: none;
    border: none;
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: all 0.2s ease;
    user-select: none;
    position: relative;
    overflow: hidden;
    min-height: 44px; /* 觸控友善最小尺寸 */
}

.btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    pointer-events: none;
}

.btn-primary {
    color: var(--text-white);
    background-color: var(--primary-500);
}

.btn-primary:hover:not(:disabled) {
    background-color: var(--primary-600);
    transform: translateY(-1px);
    box-shadow: var(--shadow-lg);
}

.btn-primary:active {
    transform: translateY(0);
    box-shadow: var(--shadow-md);
}

.btn-success {
    color: var(--text-white);
    background-color: var(--success-500);
}

.btn-success:hover:not(:disabled) {
    background-color: var(--success-600);
}

.btn-warning {
    color: var(--text-white);
    background-color: var(--warning-500);
}

.btn-warning:hover:not(:disabled) {
    background-color: var(--warning-600);
}

.btn-danger {
    color: var(--text-white);
    background-color: var(--danger-500);
}

.btn-danger:hover:not(:disabled) {
    background-color: var(--danger-600);
}

.btn-outline {
    color: var(--primary-600);
    background-color: transparent;
    border: 2px solid var(--primary-500);
}

.btn-outline:hover:not(:disabled) {
    color: var(--text-white);
    background-color: var(--primary-500);
}

.btn-ghost {
    color: var(--primary-600);
    background-color: transparent;
}

.btn-ghost:hover:not(:disabled) {
    color: var(--primary-700);
    background-color: var(--primary-50);
}

/* 按鈕尺寸變化 */
.btn-sm {
    padding: var(--space-2) var(--space-4);
    font-size: var(--text-sm);
    min-height: 36px;
}

.btn-lg {
    padding: var(--space-4) var(--space-8);
    font-size: var(--text-lg);
    min-height: 52px;
}

.btn-full {
    width: 100%;
}

/* 按鈕載入狀態 */
.btn-loading {
    color: transparent;
}

.btn-loading::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 16px;
    height: 16px;
    margin: -8px 0 0 -8px;
    border: 2px solid currentColor;
    border-top: 2px solid transparent;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* ===========================
   員工頁頂部導航
   =========================== */
.top-nav {
    background-color: var(--bg-secondary);
    border-bottom: 1px solid var(--border-light);
    padding: var(--space-4);
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: var(--shadow-sm);
    position: sticky;
    top: 0;
    z-index: 100;
}

.nav-user {
    display: flex;
    align-items: center;
    gap: var(--space-3);
}

.nav-avatar {
    width: 32px;
    height: 32px;
    border-radius: var(--radius-full);
    background-color: var(--primary-500);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-white);
    font-weight: var(--font-medium);
}

.nav-info {
    display: flex;
    flex-direction: column;
}

.nav-name {
    font-size: var(--text-base);
    font-weight: var(--font-medium);
    color: var(--text-primary);
}

.nav-store {
    font-size: var(--text-xs);
    color: var(--text-secondary);
}

.nav-actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
}

/* ===========================
   功能選單樣式
   =========================== */
.function-menu {
    background-color: var(--bg-secondary);
    padding: var(--space-4);
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: var(--space-3);
    border-bottom: 1px solid var(--border-light);
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
}

.function-menu::-webkit-scrollbar {
    display: none;
}

.function-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: var(--space-4) var(--space-2);
    background-color: transparent;
    border: none;
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
    color: var(--text-secondary);
    min-height: 80px;
}

.function-btn:hover,
.function-btn.active {
    color: var(--primary-600);
    background-color: var(--primary-50);
    transform: translateY(-2px);
}

.function-icon {
    font-size: var(--text-2xl);
    margin-bottom: var(--space-2);
}

.function-text {
    font-size: var(--text-xs);
    font-weight: var(--font-medium);
    text-align: center;
}

/* ===========================
   內容模組樣式
   =========================== */
.content-area {
    flex: 1;
    padding: var(--space-4);
    background-color: var(--bg-primary);
}

.module {
    display: none;
    animation: fadeIn 0.3s ease-in-out;
}

.module.active {
    display: block;
}

.module-header {
    margin-bottom: var(--space-6);
}

.module-title {
    font-size: var(--text-xl);
    font-weight: var(--font-bold);
    color: var(--text-primary);
    margin-bottom: var(--space-2);
}

.module-description {
    font-size: var(--text-sm);
    color: var(--text-secondary);
}

/* ===========================
   卡片組件樣式
   =========================== */
.card {
    background-color: var(--bg-secondary);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-base);
    overflow: hidden;
    margin-bottom: var(--space-4);
}

.card-header {
    padding: var(--space-4) var(--space-6);
    border-bottom: 1px solid var(--border-light);
}

.card-title {
    font-size: var(--text-lg);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
}

.card-body {
    padding: var(--space-6);
}

.card-footer {
    padding: var(--space-4) var(--space-6);
    background-color: var(--bg-primary);
    border-top: 1px solid var(--border-light);
}

/* ===========================
   模態窗樣式
   =========================== */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-4);
    z-index: 1000;
    animation: fadeIn 0.2s ease-out;
}

.modal-overlay.hidden {
    display: none;
}

.modal-content {
    background-color: var(--bg-secondary);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-xl);
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    animation: scaleIn 0.2s ease-out;
}

@keyframes scaleIn {
    from { transform: scale(0.9); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
}

.modal-header {
    padding: var(--space-6) var(--space-6) var(--space-4);
    border-bottom: 1px solid var(--border-light);
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.modal-title {
    font-size: var(--text-xl);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
}

.modal-close {
    background: none;
    border: none;
    font-size: var(--text-xl);
    color: var(--text-secondary);
    cursor: pointer;
    padding: var(--space-2);
    border-radius: var(--radius-base);
    transition: all 0.2s ease;
}

.modal-close:hover {
    color: var(--text-primary);
    background-color: var(--bg-primary);
}

.modal-body {
    padding: var(--space-6);
}

.modal-footer {
    padding: var(--space-4) var(--space-6);
    border-top: 1px solid var(--border-light);
    display: flex;
    gap: var(--space-3);
    justify-content: flex-end;
}

/* ===========================
   通知組件樣式
   =========================== */
.notification-container {
    position: fixed;
    top: var(--space-4);
    right: var(--space-4);
    z-index: 2000;
    pointer-events: none;
}

.notification {
    background-color: var(--bg-secondary);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    padding: var(--space-4);
    margin-bottom: var(--space-2);
    max-width: 350px;
    pointer-events: auto;
    animation: slideInRight 0.3s ease-out;
}

@keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

.notification-success {
    border-left: 4px solid var(--success-500);
}

.notification-warning {
    border-left: 4px solid var(--warning-500);
}

.notification-error {
    border-left: 4px solid var(--danger-500);
}

.notification-info {
    border-left: 4px solid var(--primary-500);
}

/* ===========================
   響應式設計
   =========================== */
@media (max-width: 575.98px) {
    .auth-form {
        padding: var(--space-6);
        margin: var(--space-4);
    }
    
    .function-menu {
        grid-template-columns: repeat(3, 1fr);
    }
    
    .btn-lg {
        padding: var(--space-3) var(--space-6);
        font-size: var(--text-base);
    }
}

@media (min-width: 576px) {
    .function-menu {
        grid-template-columns: repeat(4, 1fr);
    }
}

@media (min-width: 768px) {
    .function-menu {
        grid-template-columns: repeat(6, 1fr);
    }
    
    .modal-content {
        max-width: 600px;
    }
}

@media (min-width: 992px) {
    .auth-container {
        padding: var(--space-8);
    }
    
    .content-area {
        padding: var(--space-8);
    }
}

/* ===========================
   載入動畫
   =========================== */
.loader-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--bg-secondary);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 9999;
}

.loader-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid var(--border-light);
    border-top: 4px solid var(--primary-500);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: var(--space-4);
}

.loader-text {
    font-size: var(--text-base);
    color: var(--text-secondary);
}

/* ===========================
   工具類別
   =========================== */
.hidden { display: none !important; }
.visible { display: block !important; }
.text-center { text-align: center; }
.text-left { text-align: left; }
.text-right { text-align: right; }
.font-bold { font-weight: var(--font-bold); }
.font-medium { font-weight: var(--font-medium); }
.text-primary { color: var(--text-primary); }
.text-secondary { color: var(--text-secondary); }
.text-success { color: var(--success-500); }
.text-warning { color: var(--warning-500); }
.text-danger { color: var(--danger-500); }
.bg-success { background-color: var(--success-50); }
.bg-warning { background-color: var(--warning-50); }
.bg-danger { background-color: var(--danger-50); }
.border-success { border-color: var(--success-300); }
.border-warning { border-color: var(--warning-300); }
.border-danger { border-color: var(--danger-300); }
.mt-2 { margin-top: var(--space-2); }
.mb-2 { margin-bottom: var(--space-2); }
.mt-4 { margin-top: var(--space-4); }
.mb-4 { margin-bottom: var(--space-4); }
.p-4 { padding: var(--space-4); }
.px-4 { padding-left: var(--space-4); padding-right: var(--space-4); }
.py-4 { padding-top: var(--space-4); padding-bottom: var(--space-4); }

/* ===========================
   無障礙設計
   =========================== */
.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}

/* 高對比模式 */
@media (prefers-contrast: high) {
    :root {
        --border-light: var(--gray-500);
        --border-medium: var(--gray-700);
        --text-secondary: var(--gray-800);
    }
}

/* 減少動畫 */
@media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}

/* 暗色模式準備 */
@media (prefers-color-scheme: dark) {
    :root {
        --bg-primary: var(--gray-900);
        --bg-secondary: var(--gray-800);
        --text-primary: var(--gray-100);
        --text-secondary: var(--gray-300);
        --border-light: var(--gray-700);
    }
}

/* Touch device optimizations */
@media (hover: none) and (pointer: coarse) {
    .btn:hover {
        transform: none;
        box-shadow: none;
    }
    
    .function-btn:hover {
        transform: none;
    }
}
```

## 🎯 **互動設計規範**

### 👆 **觸控友善設計**
```javascript
// 觸控目標最小尺寸：44x44px (iOS Human Interface Guidelines)
const touchTargets = {
    minimumSize: '44px',
    recommendedSize: '48px',
    spacing: '8px', // 觸控目標間距
    
    // 手指觸控區域
    fingerWidth: '16-20mm',
    thumbWidth: '25mm',
    
    // 觸控手勢
    tap: 'primary action',
    longPress: 'secondary action',
    swipe: 'navigation',
    pinch: 'zoom (disabled for UI consistency)'
};
```

### ⌨️ **鍵盤導航支援**
```css
/* 鍵盤焦點樣式 */
.btn:focus-visible,
.form-input:focus-visible,
.function-btn:focus-visible {
    outline: 2px solid var(--primary-500);
    outline-offset: 2px;
}

/* Tab 導航順序 */
.tab-sequence {
    tab-index: 0; /* 可聚焦 */
}

.tab-skip {
    tab-index: -1; /* 跳過聚焦 */
}
```

### 🔄 **狀態回饋系統**
```javascript
// 按鈕狀態管理
const buttonStates = {
    idle: {
        text: '提交',
        disabled: false,
        loading: false
    },
    loading: {
        text: '提交中...',
        disabled: true, 
        loading: true
    },
    success: {
        text: '提交成功',
        disabled: true,
        loading: false,
        autoReset: 2000 // 2秒後恢復
    },
    error: {
        text: '提交失敗',
        disabled: false,
        loading: false,
        autoReset: 3000
    }
};
```

## 📊 **效能優化指標**

### ⚡ **載入效能目標**
```javascript
const performanceMetrics = {
    // Core Web Vitals
    LCP: '< 2.5s',    // Largest Contentful Paint
    FID: '< 100ms',   // First Input Delay  
    CLS: '< 0.1',     // Cumulative Layout Shift
    
    // 其他指標
    FCP: '< 1.8s',    // First Contentful Paint
    TTI: '< 3.5s',    // Time to Interactive
    TBT: '< 200ms',   // Total Blocking Time
    SI: '< 3.4s',     // Speed Index
    
    // 資源大小
    totalSize: '< 500KB',
    jsSize: '< 150KB',
    cssSize: '< 50KB',
    imageSize: '< 300KB'
};
```

### 🖼️ **圖片優化策略**
```css
/* 響應式圖片 */
.responsive-img {
    width: 100%;
    height: auto;
    object-fit: cover;
    loading: lazy; /* 延遲載入 */
}

/* WebP 格式支援 */
.webp .hero-bg {
    background-image: url('hero.webp');
}

.no-webp .hero-bg {
    background-image: url('hero.jpg');
}
```

## 📱 **PWA 應用程式特性**

### 📋 **Web App Manifest**
```json
{
  "name": "企業員工管理系統",
  "short_name": "員工系統",
  "description": "企業內部員工管理與營運系統",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#3b82f6",
  "background_color": "#f9fafb",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png", 
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### 💾 **Service Worker 快取策略**
```javascript
// 快取策略
const cacheStrategy = {
  // 應用殼層 - Cache First
  appShell: ['/', '/css/main.css', '/js/app.js'],
  
  // API 資料 - Network First
  apiData: ['/api/attendance/*', '/api/revenue/*'],
  
  // 靜態資源 - Stale While Revalidate  
  staticAssets: ['/images/*', '/fonts/*'],
  
  // 離線頁面
  offlinePage: '/offline.html'
};
```

---

## 📋 **總結**

此UI/UX設計規範提供：

✅ **手機端優先** - 響應式設計，觸控友善操作
✅ **一致性設計** - 統一的設計系統和組件庫
✅ **無障礙支援** - 鍵盤導航、螢幕閱讀器相容
✅ **效能優化** - 輕量級CSS，載入速度優化
✅ **PWA特性** - 離線支援，原生應用體驗

設計系統確保所有介面元素保持一致性，提供良好的用戶體驗，同時滿足企業級應用的專業需求。