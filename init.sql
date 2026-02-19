-- AI-Agent Commerce 数据库初始化脚本
-- MySQL 8.0

CREATE DATABASE IF NOT EXISTS ai_commerce CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ai_commerce;

-- 商品表
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    ai_description TEXT COMMENT 'AI优化的商品描述',
    price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    stock INT DEFAULT 0,
    category VARCHAR(100),
    image VARCHAR(500),
    supplier VARCHAR(50) COMMENT '供应商: spocket, aliexpress',
    supplier_product_id VARCHAR(100),
    attributes JSON COMMENT '商品属性(颜色、尺寸等)',
    embedding VECTOR(1536) COMMENT '语义搜索向量',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_supplier (supplier),
    FULLTEXT INDEX ft_name_desc (name, description, ai_description)
) ENGINE=InnoDB;

-- 购物车表
CREATE TABLE IF NOT EXISTS carts (
    id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    items JSON NOT NULL COMMENT '购物车商品列表',
    total DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_session (session_id)
) ENGINE=InnoDB;

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    items JSON NOT NULL COMMENT '订单商品',
    shipping_address JSON NOT NULL,
    payment_method VARCHAR(20),
    total DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    stripe_payment_intent_id VARCHAR(100),
    supplier_orders JSON COMMENT '供应商订单信息',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_session (session_id),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- AI对话记录表
CREATE TABLE IF NOT EXISTS ai_conversations (
    id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    messages JSON NOT NULL COMMENT '对话消息列表',
    context JSON COMMENT '对话上下文',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session (session_id)
) ENGINE=InnoDB;

-- 库存同步日志
CREATE TABLE IF NOT EXISTS inventory_sync_logs (
    id VARCHAR(36) PRIMARY KEY,
    supplier VARCHAR(50) NOT NULL,
    sync_type VARCHAR(20) COMMENT 'full, incremental',
    products_updated INT DEFAULT 0,
    products_failed INT DEFAULT 0,
    status ENUM('running', 'completed', 'failed') DEFAULT 'running',
    error_message TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    INDEX idx_supplier (supplier),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- 插入测试数据
INSERT INTO products (id, name, description, ai_description, price, currency, stock, category, supplier, attributes) VALUES
('1', '智能手表 Pro', '支持AI语音助手的智能手表', '高端智能手表，支持健康监测和语音控制，AI助手随时待命', 299.99, 'USD', 100, '电子产品', 'spocket', '{"color": ["黑", "白"], "size": ["42mm", "46mm"]}'),
('2', '无线耳机 Max', '降噪无线耳机，AI音质优化', '顶级降噪无线耳机，AI自适应音质调节，沉浸式音频体验', 199.99, 'USD', 50, '电子产品', 'aliexpress', '{"color": ["黑", "白", "蓝"]}'),
('3', 'AI智能音箱', '智能语音助手音箱', '全屋智能控制中心，支持多轮对话和场景联动', 149.99, 'USD', 80, '智能家居', 'spocket', '{"color": ["白", "灰"]}'),
('4', '便携式充电宝', '20000mAh大容量充电宝', 'AI智能充电管理，支持快充和多设备同时充电', 59.99, 'USD', 200, '配件', 'aliexpress', '{"color": ["黑", "白", "蓝", "红"]}');

-- 创建数据库用户并授权
GRANT ALL PRIVILEGES ON ai_commerce.* TO 'commerce'@'%';
FLUSH PRIVILEGES;
