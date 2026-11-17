-- ==============================================================================
-- KING PLAST | الكينج بلاست — Production PostgreSQL Database Schema
-- Industrial Plastic Raw Materials Marketplace
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. System Bootstrap State (Enforces Singleton Invariant for the Master Owner)
CREATE TABLE IF NOT EXISTS system_bootstrap (
    id INT PRIMARY KEY DEFAULT 1,
    is_initialized BOOLEAN NOT NULL DEFAULT FALSE,
    owner_email VARCHAR(150),
    initialized_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT single_bootstrap_row CHECK (id = 1)
);

-- 2. User Accounts & Administrative Hierarchy (Owner, Super Admin, Staff, Customer)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(150) UNIQUE NOT NULL,
    display_name VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role INT NOT NULL DEFAULT 4, -- 1: Owner, 2: SuperAdmin, 3: Staff, 4: Customer
    is_owner BOOLEAN NOT NULL DEFAULT FALSE,
    permissions_csv VARCHAR(500) DEFAULT '',
    status VARCHAR(30) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enforce at most ONE owner account across the whole database
CREATE UNIQUE INDEX IF NOT EXISTS idx_single_owner_constraint 
ON users (is_owner) WHERE is_owner = TRUE;

-- 3. Product Categories
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(64) PRIMARY KEY,
    name_ar VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    slug VARCHAR(100) UNIQUE NOT NULL,
    description VARCHAR(500),
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 4. Products & Specifications
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(64) PRIMARY KEY,
    name_ar VARCHAR(200) NOT NULL,
    name_en VARCHAR(200),
    sku VARCHAR(50) UNIQUE NOT NULL,
    category_id VARCHAR(64) REFERENCES categories(id) ON DELETE SET NULL,
    polymer_type VARCHAR(50) NOT NULL, -- PP, HDPE, LDPE, LLDPE, PVC, PET, ABS
    color VARCHAR(50) NOT NULL DEFAULT 'طبيعي',
    form VARCHAR(50) NOT NULL DEFAULT 'حبيبات مخرزة', -- Granules, Flakes, Crystals, Regrind
    mfi VARCHAR(50), -- Melt Flow Index (e.g. 8-12 g/10min)
    density VARCHAR(50), -- Specific density (e.g. 0.92 g/cm3)
    tensile_strength VARCHAR(50),
    mesh_filter VARCHAR(50),
    moisture VARCHAR(50),
    packaging VARCHAR(100) DEFAULT 'أكياس منسوجة 25 كجم',
    min_order_quantity VARCHAR(50) DEFAULT '1 طن',
    stock_status INT NOT NULL DEFAULT 1, -- 1: InStock, 2: LowStock, 3: OnDemand, 4: OutOfStock
    price DECIMAL(18, 2),
    price_unit VARCHAR(20) NOT NULL DEFAULT 'طن',
    description TEXT,
    applications TEXT,
    main_image_url VARCHAR(500) NOT NULL,
    additional_images_json TEXT,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_products_polymer ON products(polymer_type);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_published ON products(is_published);

-- 5. Customer Quotation Requests
CREATE TABLE IF NOT EXISTS quotation_requests (
    id VARCHAR(64) PRIMARY KEY,
    reference_number VARCHAR(30) UNIQUE NOT NULL, -- Format: KP-YYYY-XXXX
    customer_name VARCHAR(150) NOT NULL,
    company_name VARCHAR(150),
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(120),
    governorate VARCHAR(100) NOT NULL,
    notes TEXT,
    status INT NOT NULL DEFAULT 1, -- 1: New, 2: UnderReview, 3: Contacted, 4: Quoted, 5: Completed, 6: Cancelled
    quoted_price_total DECIMAL(18, 2),
    quoted_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_quotations_ref ON quotation_requests(reference_number);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotation_requests(status);
CREATE INDEX IF NOT EXISTS idx_quotations_created ON quotation_requests(created_at);

-- 6. Quotation Request Items
CREATE TABLE IF NOT EXISTS quotation_items (
    id VARCHAR(64) PRIMARY KEY,
    quotation_request_id VARCHAR(64) NOT NULL REFERENCES quotation_requests(id) ON DELETE CASCADE,
    product_id VARCHAR(64) REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(200) NOT NULL,
    polymer_type VARCHAR(50) NOT NULL,
    quantity DECIMAL(18, 2) NOT NULL,
    unit VARCHAR(20) NOT NULL DEFAULT 'ton',
    custom_color VARCHAR(50),
    custom_specs TEXT,
    packaging_preference VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_quotation_items_request ON quotation_items(quotation_request_id);

-- 7. Factory Recycling Journey Stages
CREATE TABLE IF NOT EXISTS recycling_stages (
    id VARCHAR(64) PRIMARY KEY,
    title_ar VARCHAR(150) NOT NULL,
    description_ar TEXT NOT NULL,
    order_index INT NOT NULL DEFAULT 1,
    image_url VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 8. Company Singleton Profile Settings
CREATE TABLE IF NOT EXISTS company_settings (
    id INT PRIMARY KEY DEFAULT 1,
    company_name_ar VARCHAR(150) NOT NULL DEFAULT 'الكينج بلاست لتجارة وتدوير خامات البلاستيك',
    company_name_en VARCHAR(150) DEFAULT 'KING PLAST For Recycled Raw Materials',
    phone VARCHAR(50) NOT NULL DEFAULT '+20 10 0000 0000',
    whatsapp_number VARCHAR(50) NOT NULL DEFAULT '+20 10 0000 0000',
    email VARCHAR(150) DEFAULT 'info@kingplast.com',
    factory_address VARCHAR(300) DEFAULT 'جمهورية مصر العربية — المنطقة الصناعية، العاشر من رمضان',
    working_hours VARCHAR(150) DEFAULT 'السبت - الخميس: 8:00 صباحاً - 5:00 مساءً',
    tagline_ar VARCHAR(300) DEFAULT 'من إعادة التدوير إلى خامات تصنع المستقبل',
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT single_company_settings_row CHECK (id = 1)
);

-- 9. Security & Administrative Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    performed_by_email VARCHAR(150) NOT NULL,
    target_resource VARCHAR(150),
    details TEXT NOT NULL,
    ip_address VARCHAR(50),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
