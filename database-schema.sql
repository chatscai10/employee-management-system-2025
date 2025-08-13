-- ===========================
-- 企業員工管理系統 - 資料庫結構
-- ===========================

-- 系統參數配置表
CREATE TABLE system_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    config_key VARCHAR(50) NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    category VARCHAR(30) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_config_key (config_key)
);

-- 分店資料表
CREATE TABLE stores (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    radius INT DEFAULT 100,
    min_staff_per_day INT DEFAULT 2,
    open_hours VARCHAR(20) DEFAULT '1500-0200',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_location (latitude, longitude),
    INDEX idx_status (status)
);

-- 職位階級表
CREATE TABLE positions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    level_order INT NOT NULL,
    name VARCHAR(30) NOT NULL,
    base_salary INT DEFAULT 0,
    bonus_rate DECIMAL(5,4) DEFAULT 0.0000,
    quota_limit INT DEFAULT 0,
    required_days INT DEFAULT 30,
    cooldown_days INT DEFAULT 30,
    approval_rate DECIMAL(5,4) DEFAULT 0.5000,
    voting_duration INT DEFAULT 5,
    late_penalty_threshold INT DEFAULT 60,
    penalty_description TEXT,
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_level_order (level_order),
    INDEX idx_name (name),
    INDEX idx_status (status)
);

-- 員工資料表
CREATE TABLE employees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(30) NOT NULL,
    id_number VARCHAR(20) NOT NULL UNIQUE,
    birth_date DATE NOT NULL,
    gender ENUM('male', 'female') NOT NULL,
    has_license ENUM('yes', 'no') DEFAULT 'no',
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    emergency_contact VARCHAR(30) NOT NULL,
    emergency_relationship VARCHAR(20) NOT NULL,
    emergency_phone VARCHAR(20) NOT NULL,
    hire_date DATE NOT NULL,
    current_store_id INT NOT NULL,
    position_id INT NOT NULL,
    position_start_date DATE DEFAULT (CURRENT_DATE),
    line_user_id VARCHAR(50),
    status ENUM('pending', 'active', 'resigned') DEFAULT 'pending',
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (current_store_id) REFERENCES stores(id) ON DELETE RESTRICT,
    FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE RESTRICT,
    INDEX idx_name (name),
    INDEX idx_id_number (id_number),
    INDEX idx_status (status),
    INDEX idx_store_position (current_store_id, position_id),
    INDEX idx_hire_date (hire_date)
);

-- 打卡記錄表
CREATE TABLE attendance (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    store_id INT NOT NULL,
    clock_type ENUM('clock_in', 'clock_out') NOT NULL,
    clock_time TIMESTAMP NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    distance_meters INT NOT NULL,
    device_fingerprint VARCHAR(255) NOT NULL,
    is_late BOOLEAN DEFAULT FALSE,
    late_minutes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE RESTRICT,
    INDEX idx_employee_date (employee_id, DATE(clock_time)),
    INDEX idx_store_date (store_id, DATE(clock_time)),
    INDEX idx_clock_time (clock_time),
    INDEX idx_device_fingerprint (device_fingerprint)
);

-- 營收類別表
CREATE TABLE revenue_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(30) NOT NULL,
    service_fee DECIMAL(5,4) DEFAULT 0.0000,
    include_in_bonus BOOLEAN DEFAULT TRUE,
    category_type ENUM('income', 'expense') NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category_type (category_type),
    INDEX idx_status (status),
    INDEX idx_sort_order (sort_order)
);

-- 營收記錄表
CREATE TABLE revenue_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    store_id INT NOT NULL,
    record_date DATE NOT NULL,
    bonus_type ENUM('weekday', 'holiday') NOT NULL,
    order_count INT DEFAULT 0,
    total_income DECIMAL(10,2) DEFAULT 0.00,
    total_expense DECIMAL(10,2) DEFAULT 0.00,
    net_income DECIMAL(10,2) DEFAULT 0.00,
    bonus_amount DECIMAL(10,2) DEFAULT 0.00,
    notes TEXT,
    is_voided BOOLEAN DEFAULT FALSE,
    voided_reason TEXT,
    voided_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE RESTRICT,
    UNIQUE KEY uk_store_date (store_id, record_date),
    INDEX idx_employee_date (employee_id, record_date),
    INDEX idx_bonus_type (bonus_type),
    INDEX idx_is_voided (is_voided)
);

-- 營收明細表
CREATE TABLE revenue_details (
    id INT PRIMARY KEY AUTO_INCREMENT,
    revenue_record_id INT NOT NULL,
    category_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (revenue_record_id) REFERENCES revenue_records(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES revenue_categories(id) ON DELETE RESTRICT,
    INDEX idx_revenue_record (revenue_record_id),
    INDEX idx_category (category_id)
);

-- 商品供應商表
CREATE TABLE suppliers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    contact_info TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_status (status)
);

-- 商品類別表
CREATE TABLE product_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(30) NOT NULL,
    sort_order INT DEFAULT 0,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_sort_order (sort_order),
    INDEX idx_status (status)
);

-- 商品資料表
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category_id INT NOT NULL,
    supplier_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    unit VARCHAR(10) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2) NOT NULL,
    alert_days INT DEFAULT 2,
    status ENUM('active', 'inactive') DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES product_categories(id) ON DELETE RESTRICT,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT,
    INDEX idx_name (name),
    INDEX idx_category (category_id),
    INDEX idx_supplier (supplier_id),
    INDEX idx_status (status)
);

-- 叫貨記錄表
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    store_id INT NOT NULL,
    delivery_date DATE NOT NULL,
    total_amount DECIMAL(10,2) DEFAULT 0.00,
    status ENUM('pending', 'confirmed', 'delivered', 'voided') DEFAULT 'pending',
    is_voided BOOLEAN DEFAULT FALSE,
    voided_reason TEXT,
    voided_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE RESTRICT,
    INDEX idx_employee_date (employee_id, delivery_date),
    INDEX idx_store_date (store_id, delivery_date),
    INDEX idx_status (status),
    INDEX idx_is_voided (is_voided)
);

-- 叫貨明細表
CREATE TABLE order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    INDEX idx_order (order_id),
    INDEX idx_product (product_id)
);

-- 排班設定表
CREATE TABLE schedule_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    schedule_month VARCHAR(7) NOT NULL, -- YYYY-MM
    max_days_off_per_person INT DEFAULT 8,
    max_daily_off_total INT DEFAULT 2,
    max_weekend_off_per_person INT DEFAULT 3,
    max_store_daily_off INT DEFAULT 1,
    max_standby_daily_off INT DEFAULT 1,
    max_parttime_daily_off INT DEFAULT 1,
    operation_time_minutes INT DEFAULT 5,
    system_open_time TIMESTAMP NOT NULL,
    system_close_time TIMESTAMP NOT NULL,
    status ENUM('upcoming', 'active', 'closed') DEFAULT 'upcoming',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_schedule_month (schedule_month),
    INDEX idx_schedule_month (schedule_month),
    INDEX idx_status (status)
);

-- 排班禁休/公休日期表
CREATE TABLE schedule_restrictions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    schedule_month VARCHAR(7) NOT NULL,
    store_id INT NOT NULL,
    restriction_date DATE NOT NULL,
    restriction_type ENUM('forbidden', 'store_holiday') NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    UNIQUE KEY uk_store_date_type (store_id, restriction_date, restriction_type),
    INDEX idx_schedule_month (schedule_month),
    INDEX idx_store_date (store_id, restriction_date),
    INDEX idx_restriction_type (restriction_type)
);

-- 排班系統使用狀態表
CREATE TABLE schedule_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    schedule_month VARCHAR(7) NOT NULL,
    employee_id INT NOT NULL,
    session_start TIMESTAMP NOT NULL,
    session_end TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    INDEX idx_schedule_month (schedule_month),
    INDEX idx_employee (employee_id),
    INDEX idx_is_active (is_active)
);

-- 排班申請表
CREATE TABLE schedule_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    schedule_month VARCHAR(7) NOT NULL,
    request_date DATE NOT NULL,
    is_day_off BOOLEAN DEFAULT TRUE,
    is_voided BOOLEAN DEFAULT FALSE,
    voided_reason TEXT,
    voided_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE KEY uk_employee_date (employee_id, request_date),
    INDEX idx_schedule_month (schedule_month),
    INDEX idx_request_date (request_date),
    INDEX idx_is_voided (is_voided)
);

-- 升遷投票表
CREATE TABLE promotion_votes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    candidate_id INT NOT NULL,
    current_position_id INT NOT NULL,
    target_position_id INT NOT NULL,
    vote_start_date DATE NOT NULL,
    vote_end_date DATE NOT NULL,
    total_voters INT DEFAULT 0,
    approve_votes INT DEFAULT 0,
    reject_votes INT DEFAULT 0,
    required_approval_rate DECIMAL(5,4) NOT NULL,
    status ENUM('active', 'approved', 'rejected', 'expired') DEFAULT 'active',
    result_processed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (candidate_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (current_position_id) REFERENCES positions(id) ON DELETE RESTRICT,
    FOREIGN KEY (target_position_id) REFERENCES positions(id) ON DELETE RESTRICT,
    INDEX idx_candidate (candidate_id),
    INDEX idx_vote_dates (vote_start_date, vote_end_date),
    INDEX idx_status (status)
);

-- 投票記錄表
CREATE TABLE vote_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    promotion_vote_id INT NOT NULL,
    voter_id INT NOT NULL,
    anonymous_hash VARCHAR(64) NOT NULL,
    vote_decision ENUM('approve', 'reject') DEFAULT 'reject',
    vote_date DATE NOT NULL,
    daily_change_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (promotion_vote_id) REFERENCES promotion_votes(id) ON DELETE CASCADE,
    FOREIGN KEY (voter_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE KEY uk_promotion_voter (promotion_vote_id, voter_id),
    INDEX idx_promotion_vote (promotion_vote_id),
    INDEX idx_vote_date (vote_date),
    INDEX idx_anonymous_hash (anonymous_hash)
);

-- 設備維修表
CREATE TABLE maintenance_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    store_id INT NOT NULL,
    equipment_name VARCHAR(50) NOT NULL,
    issue_description TEXT NOT NULL,
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    category ENUM('repair', 'maintenance', 'replacement') DEFAULT 'repair',
    status ENUM('reported', 'assigned', 'in_progress', 'completed', 'verified') DEFAULT 'reported',
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    verified_at TIMESTAMP NULL,
    estimated_cost DECIMAL(10,2) DEFAULT 0.00,
    actual_cost DECIMAL(10,2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE RESTRICT,
    INDEX idx_employee_date (employee_id, DATE(reported_at)),
    INDEX idx_store_status (store_id, status),
    INDEX idx_priority (priority),
    INDEX idx_reported_at (reported_at)
);

-- 照片附件表
CREATE TABLE photo_attachments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    reference_type ENUM('revenue', 'maintenance', 'order') NOT NULL,
    reference_id INT NOT NULL,
    category VARCHAR(30) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_reference (reference_type, reference_id),
    INDEX idx_category (category),
    INDEX idx_uploaded_at (uploaded_at)
);

-- 通知記錄表
CREATE TABLE notification_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    notification_type VARCHAR(30) NOT NULL,
    recipient_type ENUM('boss', 'employee', 'both') NOT NULL,
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    platform ENUM('telegram', 'line') NOT NULL,
    chat_id VARCHAR(50) NOT NULL,
    message_id VARCHAR(50),
    status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
    sent_at TIMESTAMP NULL,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notification_type (notification_type),
    INDEX idx_status (status),
    INDEX idx_sent_at (sent_at),
    INDEX idx_platform_chat (platform, chat_id)
);

-- 系統日誌表
CREATE TABLE system_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT,
    action_type VARCHAR(30) NOT NULL,
    table_name VARCHAR(50),
    record_id INT,
    action_description TEXT NOT NULL,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL,
    INDEX idx_employee_action (employee_id, action_type),
    INDEX idx_table_record (table_name, record_id),
    INDEX idx_created_at (created_at)
);

-- ===========================
-- 初始化基礎資料
-- ===========================

-- 插入預設分店資料
INSERT INTO stores (name, address, latitude, longitude, radius, min_staff_per_day, open_hours) VALUES
('內壢忠孝店', '桃園市中壢區忠孝路93-1號', 24.9748412, 121.2556713, 100, 2, '1500-0200'),
('桃園龍安店', '桃園市桃園區龍安街38-8號', 24.9880023, 121.2812737, 100, 2, '1500-0200'),
('中壢龍崗店', '桃園市中壢區龍東路190號正對面', 24.9298502, 121.2529472, 100, 2, '1500-0200');

-- 插入預設職位階級
INSERT INTO positions (level_order, name, base_salary, bonus_rate, quota_limit, required_days, cooldown_days, approval_rate, voting_duration, late_penalty_threshold, description) VALUES
(1, '實習生', 25000, 0.0000, 0, 0, 0, 0.0000, 0, 120, '新人實習期'),
(2, '正職員工', 28000, 0.0100, 0, 30, 60, 0.6000, 5, 90, '正式員工'),
(3, '組長', 32000, 0.0150, 3, 60, 90, 0.6500, 5, 60, '小組領導'),
(4, '主任', 38000, 0.0200, 2, 90, 120, 0.7000, 5, 45, '部門主任'),
(5, '副店長', 45000, 0.0250, 1, 120, 150, 0.7500, 5, 30, '副店長職務'),
(6, '店長', 55000, 0.0300, 1, 180, 180, 0.8000, 7, 15, '分店店長'),
(7, '區域經理', 70000, 0.0350, 1, 240, 240, 0.8500, 7, 10, '區域管理'),
(8, '營運總監', 90000, 0.0400, 1, 300, 300, 0.9000, 7, 5, '營運總監');

-- 插入營收類別（收入）
INSERT INTO revenue_categories (name, service_fee, include_in_bonus, category_type, sort_order) VALUES
('現場營業額', 0.0000, TRUE, 'income', 1),
('線上點餐', 0.0000, TRUE, 'income', 2),
('熊貓點餐', 0.3500, TRUE, 'income', 3),
('uber點餐', 0.3500, TRUE, 'income', 4),
('廢油回收', 0.0000, FALSE, 'income', 5);

-- 插入營收類別（支出）
INSERT INTO revenue_categories (name, service_fee, include_in_bonus, category_type, sort_order) VALUES
('瓦斯', 0.0000, FALSE, 'expense', 1),
('水電', 0.0000, FALSE, 'expense', 2),
('房租', 0.0000, FALSE, 'expense', 3),
('貨款', 0.0000, FALSE, 'expense', 4),
('清潔費', 0.0000, FALSE, 'expense', 5),
('其他', 0.0000, FALSE, 'expense', 6);

-- 插入供應商資料
INSERT INTO suppliers (name, contact_info) VALUES
('聯華食品', '聯絡人：張經理 電話：03-1234567'),
('台糖公司', '聯絡人：李經理 電話：06-2345678'),
('統一企業', '聯絡人：王經理 電話：06-3456789'),
('義美食品', '聯絡人：陳經理 電話：03-4567890');

-- 插入商品類別
INSERT INTO product_categories (name, sort_order) VALUES
('肉類', 1),
('蔬菜', 2),
('調料', 3),
('包裝材料', 4),
('清潔用品', 5);

-- 插入系統配置
INSERT INTO system_config (config_key, config_value, category, description) VALUES
('telegram_bot_token', 'process.env.TELEGRAM_BOT_TOKEN', 'notification', 'Telegram Bot API Token'),
('telegram_boss_chat_id', 'process.env.TELEGRAM_GROUP_ID', 'notification', 'Telegram 老闆群組 Chat ID'),
('telegram_employee_chat_id', 'process.env.TELEGRAM_GROUP_ID', 'notification', 'Telegram 員工群組 Chat ID'),
('line_bot_token', '', 'notification', 'LINE Bot Channel Access Token'),
('line_boss_notify_token', '', 'notification', 'LINE Notify 權杖 (老闆群組)'),
('line_employee_notify_token', '', 'notification', 'LINE Notify 權杖 (員工群組)'),
('backup_days_interval', '5', 'backup', '備份天數間隔'),
('backup_email', 'chatscai10@gmail.com', 'backup', '備份信箱'),
('weekday_bonus_threshold', '13000', 'bonus', '平日獎金門檻'),
('weekday_bonus_rate', '0.30', 'bonus', '平日獎金比例'),
('holiday_bonus_threshold', '0', 'bonus', '假日獎金門檻'),
('holiday_bonus_rate', '0.38', 'bonus', '假日獎金比例');