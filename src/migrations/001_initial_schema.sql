-- 001_initial_schema.sql
-- RHY Supplier Portal - Initial Database Schema
-- Enterprise-grade database structure for FlexVolt battery operations
-- Supports multi-warehouse operations across US, Japan, EU, Australia

-- Enable foreign key constraints and other PostgreSQL features
SET foreign_key_checks = 1;
SET sql_mode = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION';

-- =============================================================================
-- CORE SYSTEM TABLES
-- =============================================================================

-- System configuration and versioning
CREATE TABLE IF NOT EXISTS system_config (
    id SERIAL PRIMARY KEY,
    key_name VARCHAR(255) NOT NULL UNIQUE,
    key_value TEXT NOT NULL,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255),
    
    CONSTRAINT ck_system_config_key_format CHECK (key_name ~ '^[A-Z_][A-Z0-9_]*$')
);

-- Database migration tracking
CREATE TABLE IF NOT EXISTS migration_history (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL UNIQUE,
    version_number INTEGER NOT NULL,
    executed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    execution_time_ms INTEGER,
    checksum VARCHAR(64),
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    rollback_sql TEXT,
    applied_by VARCHAR(255) DEFAULT 'system',
    
    CONSTRAINT ck_migration_version_positive CHECK (version_number > 0),
    CONSTRAINT ck_migration_execution_time CHECK (execution_time_ms >= 0)
);

-- =============================================================================
-- WAREHOUSE AND GEOGRAPHY TABLES
-- =============================================================================

-- Global warehouse locations for FlexVolt battery operations
CREATE TABLE IF NOT EXISTS warehouses (
    id SERIAL PRIMARY KEY,
    warehouse_code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    region VARCHAR(50) NOT NULL,
    country_code CHAR(2) NOT NULL,
    timezone VARCHAR(50) NOT NULL,
    currency_code CHAR(3) NOT NULL DEFAULT 'USD',
    
    -- Location details
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state_province VARCHAR(100),
    postal_code VARCHAR(20),
    
    -- Contact information
    phone VARCHAR(50),
    email VARCHAR(255),
    manager_name VARCHAR(255),
    
    -- Operating hours (JSON format: {"monday": {"open": "08:00", "close": "17:00"}})
    operating_hours JSONB,
    
    -- Capacity and capabilities
    max_capacity INTEGER DEFAULT 0,
    current_utilization DECIMAL(5,2) DEFAULT 0.00,
    capabilities JSONB, -- Storage types, shipping methods, etc.
    
    -- Status and tracking
    is_active BOOLEAN DEFAULT TRUE,
    last_inventory_sync TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT ck_warehouse_country_code CHECK (country_code ~ '^[A-Z]{2}$'),
    CONSTRAINT ck_warehouse_currency_code CHECK (currency_code ~ '^[A-Z]{3}$'),
    CONSTRAINT ck_warehouse_utilization CHECK (current_utilization >= 0 AND current_utilization <= 100),
    CONSTRAINT ck_warehouse_capacity CHECK (max_capacity >= 0)
);

-- Regional compliance requirements
CREATE TABLE IF NOT EXISTS regional_compliance (
    id SERIAL PRIMARY KEY,
    region VARCHAR(50) NOT NULL,
    regulation_type VARCHAR(100) NOT NULL,
    regulation_name VARCHAR(255) NOT NULL,
    description TEXT,
    requirements JSONB,
    effective_date DATE,
    expiry_date DATE,
    mandatory BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT ck_compliance_dates CHECK (effective_date <= expiry_date OR expiry_date IS NULL)
);

-- =============================================================================
-- SUPPLIER TABLES
-- =============================================================================

-- Supplier types and access levels
CREATE TABLE IF NOT EXISTS supplier_types (
    id SERIAL PRIMARY KEY,
    type_code VARCHAR(20) NOT NULL UNIQUE,
    type_name VARCHAR(100) NOT NULL,
    description TEXT,
    access_level INTEGER NOT NULL DEFAULT 1,
    permissions JSONB, -- Array of permission strings
    default_discount_rate DECIMAL(5,4) DEFAULT 0.0000,
    requires_approval BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT ck_supplier_access_level CHECK (access_level BETWEEN 1 AND 10),
    CONSTRAINT ck_supplier_discount_rate CHECK (default_discount_rate >= 0 AND default_discount_rate <= 1)
);

-- Core supplier information
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    supplier_code VARCHAR(20) NOT NULL UNIQUE,
    company_name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    supplier_type_id INTEGER NOT NULL,
    
    -- Business information
    tax_id VARCHAR(50),
    duns_number VARCHAR(20),
    registration_number VARCHAR(100),
    business_type VARCHAR(50), -- corporation, llc, partnership, etc.
    incorporation_country CHAR(2),
    
    -- Contact information
    primary_contact_name VARCHAR(255),
    primary_contact_email VARCHAR(255),
    primary_contact_phone VARCHAR(50),
    website_url VARCHAR(500),
    
    -- Address information
    headquarters_address JSONB, -- Full address object
    billing_address JSONB,
    shipping_addresses JSONB, -- Array of address objects
    
    -- Financial information
    annual_revenue DECIMAL(15,2),
    employee_count INTEGER,
    credit_rating VARCHAR(10),
    payment_terms VARCHAR(50) DEFAULT 'NET_30',
    credit_limit DECIMAL(15,2) DEFAULT 0.00,
    
    -- Operational details
    primary_warehouse_id INTEGER,
    service_regions JSONB, -- Array of region codes
    product_categories JSONB, -- Array of product categories
    certifications JSONB, -- Array of certification objects
    
    -- Status and tracking
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, ACTIVE, SUSPENDED, TERMINATED
    approval_date TIMESTAMPTZ,
    last_activity TIMESTAMPTZ,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    
    FOREIGN KEY (supplier_type_id) REFERENCES supplier_types(id),
    FOREIGN KEY (primary_warehouse_id) REFERENCES warehouses(id),
    
    CONSTRAINT ck_supplier_status CHECK (status IN ('PENDING', 'ACTIVE', 'SUSPENDED', 'TERMINATED')),
    CONSTRAINT ck_supplier_revenue CHECK (annual_revenue IS NULL OR annual_revenue >= 0),
    CONSTRAINT ck_supplier_employees CHECK (employee_count IS NULL OR employee_count >= 0),
    CONSTRAINT ck_supplier_credit_limit CHECK (credit_limit >= 0)
);

-- =============================================================================
-- PRODUCT CATALOG TABLES
-- =============================================================================

-- FlexVolt battery product categories
CREATE TABLE IF NOT EXISTS product_categories (
    id SERIAL PRIMARY KEY,
    category_code VARCHAR(20) NOT NULL UNIQUE,
    category_name VARCHAR(100) NOT NULL,
    parent_category_id INTEGER,
    description TEXT,
    specification_template JSONB, -- Template for product specifications
    image_url VARCHAR(500),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (parent_category_id) REFERENCES product_categories(id),
    CONSTRAINT ck_category_sort_order CHECK (sort_order >= 0)
);

-- FlexVolt battery products
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    product_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(100),
    category_id INTEGER NOT NULL,
    
    -- Product specifications
    voltage INTEGER, -- 20V or 60V
    capacity_ah DECIMAL(4,1), -- 6.0, 9.0, 15.0 Ah
    chemistry VARCHAR(20) DEFAULT 'Li-Ion',
    dimensions JSONB, -- {length, width, height, weight}
    compatibility JSONB, -- Array of compatible tool systems
    
    -- Pricing information
    base_price DECIMAL(10,2) NOT NULL,
    msrp DECIMAL(10,2),
    cost DECIMAL(10,2),
    currency_code CHAR(3) DEFAULT 'USD',
    
    -- Physical details
    weight_kg DECIMAL(6,3),
    color VARCHAR(50),
    model_year INTEGER,
    warranty_months INTEGER DEFAULT 36,
    
    -- Marketing information
    description TEXT,
    features JSONB, -- Array of feature descriptions
    benefits JSONB, -- Array of benefit statements
    target_audience JSONB, -- Array of target user types
    
    -- Media and documentation
    images JSONB, -- Array of image URLs
    documents JSONB, -- Array of document URLs
    videos JSONB, -- Array of video URLs
    
    -- Availability and lifecycle
    launch_date DATE,
    discontinuation_date DATE,
    lifecycle_status VARCHAR(20) DEFAULT 'ACTIVE', -- DEVELOPMENT, ACTIVE, PHASING_OUT, DISCONTINUED
    
    -- SEO and metadata
    slug VARCHAR(255) UNIQUE,
    meta_title VARCHAR(255),
    meta_description TEXT,
    keywords JSONB,
    
    -- Tracking
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    
    FOREIGN KEY (category_id) REFERENCES product_categories(id),
    
    CONSTRAINT ck_product_voltage CHECK (voltage IN (20, 60) OR voltage IS NULL),
    CONSTRAINT ck_product_capacity CHECK (capacity_ah > 0 OR capacity_ah IS NULL),
    CONSTRAINT ck_product_prices CHECK (base_price > 0 AND (msrp IS NULL OR msrp >= base_price)),
    CONSTRAINT ck_product_weight CHECK (weight_kg IS NULL OR weight_kg > 0),
    CONSTRAINT ck_product_warranty CHECK (warranty_months IS NULL OR warranty_months > 0),
    CONSTRAINT ck_product_model_year CHECK (model_year IS NULL OR model_year >= 2020),
    CONSTRAINT ck_product_lifecycle CHECK (lifecycle_status IN ('DEVELOPMENT', 'ACTIVE', 'PHASING_OUT', 'DISCONTINUED')),
    CONSTRAINT ck_product_launch_dates CHECK (launch_date IS NULL OR discontinuation_date IS NULL OR launch_date <= discontinuation_date)
);

-- =============================================================================
-- INVENTORY MANAGEMENT TABLES
-- =============================================================================

-- Multi-warehouse inventory tracking
CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    warehouse_id INTEGER NOT NULL,
    
    -- Quantity tracking
    quantity_on_hand INTEGER NOT NULL DEFAULT 0,
    quantity_reserved INTEGER NOT NULL DEFAULT 0,
    quantity_available INTEGER GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
    quantity_incoming INTEGER NOT NULL DEFAULT 0,
    
    -- Reorder management
    reorder_point INTEGER DEFAULT 10,
    reorder_quantity INTEGER DEFAULT 50,
    max_stock_level INTEGER,
    min_stock_level INTEGER DEFAULT 0,
    
    -- Location details
    location_code VARCHAR(20), -- Warehouse location (A1-B3, etc.)
    zone VARCHAR(10), -- Storage zone
    
    -- Batch and lot tracking
    lot_numbers JSONB, -- Array of lot numbers with quantities
    serial_numbers JSONB, -- Array of serial numbers for serialized items
    expiry_dates JSONB, -- For items with expiration
    
    -- Costing (FIFO/LIFO/Average)
    cost_method VARCHAR(10) DEFAULT 'FIFO',
    average_cost DECIMAL(10,4) DEFAULT 0.0000,
    last_cost DECIMAL(10,4) DEFAULT 0.0000,
    
    -- Tracking timestamps
    last_movement TIMESTAMPTZ,
    last_counted TIMESTAMPTZ,
    next_count_due TIMESTAMPTZ,
    last_received TIMESTAMPTZ,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255),
    
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
    
    UNIQUE(product_id, warehouse_id),
    
    CONSTRAINT ck_inventory_quantities CHECK (
        quantity_on_hand >= 0 AND 
        quantity_reserved >= 0 AND 
        quantity_incoming >= 0 AND
        quantity_reserved <= quantity_on_hand
    ),
    CONSTRAINT ck_inventory_reorder CHECK (
        reorder_point >= 0 AND 
        reorder_quantity > 0 AND
        (max_stock_level IS NULL OR max_stock_level >= min_stock_level) AND
        min_stock_level >= 0
    ),
    CONSTRAINT ck_inventory_costs CHECK (
        average_cost >= 0 AND 
        last_cost >= 0
    ),
    CONSTRAINT ck_inventory_cost_method CHECK (cost_method IN ('FIFO', 'LIFO', 'AVERAGE'))
);

-- Inventory movement history
CREATE TABLE IF NOT EXISTS inventory_movements (
    id SERIAL PRIMARY KEY,
    inventory_id INTEGER NOT NULL,
    movement_type VARCHAR(20) NOT NULL, -- IN, OUT, TRANSFER, ADJUSTMENT, COUNT
    reference_type VARCHAR(20), -- ORDER, TRANSFER, ADJUSTMENT, RECEIPT
    reference_id INTEGER,
    
    -- Movement details
    quantity_change INTEGER NOT NULL,
    quantity_before INTEGER NOT NULL,
    quantity_after INTEGER NOT NULL,
    unit_cost DECIMAL(10,4),
    total_value DECIMAL(15,2),
    
    -- Location details
    from_location VARCHAR(50),
    to_location VARCHAR(50),
    
    -- Tracking information
    lot_number VARCHAR(50),
    serial_number VARCHAR(100),
    reason_code VARCHAR(20),
    notes TEXT,
    
    -- Audit fields
    movement_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) NOT NULL,
    approved_by VARCHAR(255),
    approved_at TIMESTAMPTZ,
    
    FOREIGN KEY (inventory_id) REFERENCES inventory(id),
    
    CONSTRAINT ck_movement_type CHECK (movement_type IN ('IN', 'OUT', 'TRANSFER', 'ADJUSTMENT', 'COUNT')),
    CONSTRAINT ck_movement_quantity CHECK (quantity_change != 0),
    CONSTRAINT ck_movement_values CHECK (
        unit_cost IS NULL OR unit_cost >= 0
    )
);

-- =============================================================================
-- PRICING AND DISCOUNTS
-- =============================================================================

-- Volume discount tiers for FlexVolt batteries
CREATE TABLE IF NOT EXISTS discount_tiers (
    id SERIAL PRIMARY KEY,
    tier_name VARCHAR(100) NOT NULL,
    minimum_amount DECIMAL(15,2) NOT NULL,
    discount_percentage DECIMAL(5,4) NOT NULL,
    currency_code CHAR(3) DEFAULT 'USD',
    
    -- Applicability
    supplier_types JSONB, -- Array of supplier type codes
    product_categories JSONB, -- Array of category codes
    regions JSONB, -- Array of region codes
    
    -- Validity
    effective_date DATE NOT NULL,
    expiry_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Additional benefits
    additional_benefits JSONB, -- Free shipping, dedicated account manager, etc.
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    
    CONSTRAINT ck_discount_minimum_amount CHECK (minimum_amount > 0),
    CONSTRAINT ck_discount_percentage CHECK (discount_percentage >= 0 AND discount_percentage <= 1),
    CONSTRAINT ck_discount_dates CHECK (effective_date <= expiry_date OR expiry_date IS NULL)
);

-- Custom pricing for specific suppliers
CREATE TABLE IF NOT EXISTS supplier_pricing (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    
    -- Pricing details
    custom_price DECIMAL(10,2) NOT NULL,
    discount_percentage DECIMAL(5,4),
    currency_code CHAR(3) DEFAULT 'USD',
    
    -- Validity period
    effective_date DATE NOT NULL,
    expiry_date DATE,
    
    -- Conditions
    minimum_quantity INTEGER DEFAULT 1,
    maximum_quantity INTEGER,
    
    -- Tracking
    is_active BOOLEAN DEFAULT TRUE,
    reason TEXT,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) NOT NULL,
    approved_by VARCHAR(255),
    approved_at TIMESTAMPTZ,
    
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    
    UNIQUE(supplier_id, product_id, effective_date),
    
    CONSTRAINT ck_supplier_pricing_price CHECK (custom_price > 0),
    CONSTRAINT ck_supplier_pricing_discount CHECK (discount_percentage IS NULL OR (discount_percentage >= 0 AND discount_percentage <= 1)),
    CONSTRAINT ck_supplier_pricing_dates CHECK (effective_date <= expiry_date OR expiry_date IS NULL),
    CONSTRAINT ck_supplier_pricing_quantities CHECK (
        minimum_quantity > 0 AND 
        (maximum_quantity IS NULL OR maximum_quantity >= minimum_quantity)
    )
);

-- =============================================================================
-- AUDIT AND COMPLIANCE TABLES
-- =============================================================================

-- Comprehensive audit log for all system activities
CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    
    -- Event identification
    event_type VARCHAR(50) NOT NULL,
    event_category VARCHAR(50) NOT NULL,
    table_name VARCHAR(100),
    record_id VARCHAR(100),
    
    -- Action details
    action VARCHAR(20) NOT NULL, -- CREATE, READ, UPDATE, DELETE
    old_values JSONB,
    new_values JSONB,
    changed_fields JSONB, -- Array of changed field names
    
    -- User and session information
    user_id VARCHAR(255),
    user_type VARCHAR(50),
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    
    -- Request context
    request_id VARCHAR(100),
    endpoint VARCHAR(255),
    http_method VARCHAR(10),
    
    -- Compliance and security
    compliance_level VARCHAR(20) DEFAULT 'STANDARD', -- STANDARD, SENSITIVE, CRITICAL
    data_classification VARCHAR(20) DEFAULT 'INTERNAL', -- PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED
    retention_period INTEGER DEFAULT 2555, -- Days (7 years default)
    
    -- Geographic and regulatory context
    region VARCHAR(50),
    regulation_context JSONB, -- Applicable regulations (GDPR, OSHA, etc.)
    
    -- Metadata
    metadata JSONB,
    notes TEXT,
    
    -- Timestamps
    event_timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT ck_audit_action CHECK (action IN ('CREATE', 'READ', 'UPDATE', 'DELETE')),
    CONSTRAINT ck_audit_compliance_level CHECK (compliance_level IN ('STANDARD', 'SENSITIVE', 'CRITICAL')),
    CONSTRAINT ck_audit_data_classification CHECK (data_classification IN ('PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED')),
    CONSTRAINT ck_audit_retention_period CHECK (retention_period > 0)
);

-- Create indexes for audit log performance
CREATE INDEX IF NOT EXISTS idx_audit_log_event_timestamp ON audit_log(event_timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_event_type ON audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_compliance_level ON audit_log(compliance_level);
CREATE INDEX IF NOT EXISTS idx_audit_log_region ON audit_log(region);

-- =============================================================================
-- SYSTEM MONITORING AND HEALTH
-- =============================================================================

-- System health monitoring
CREATE TABLE IF NOT EXISTS system_health (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL,
    component_name VARCHAR(100) NOT NULL,
    
    -- Health metrics
    status VARCHAR(20) NOT NULL DEFAULT 'HEALTHY', -- HEALTHY, DEGRADED, UNHEALTHY, UNKNOWN
    response_time_ms INTEGER,
    error_rate DECIMAL(5,4) DEFAULT 0.0000,
    throughput_per_minute INTEGER DEFAULT 0,
    
    -- Resource utilization
    cpu_usage DECIMAL(5,2),
    memory_usage DECIMAL(5,2),
    disk_usage DECIMAL(5,2),
    
    -- Custom metrics
    custom_metrics JSONB,
    
    -- Health check details
    last_check_timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    next_check_timestamp TIMESTAMPTZ,
    check_interval_seconds INTEGER DEFAULT 300,
    
    -- Alert configuration
    warning_threshold JSONB,
    critical_threshold JSONB,
    alert_recipients JSONB, -- Array of email addresses
    
    -- Status tracking
    consecutive_failures INTEGER DEFAULT 0,
    last_failure_timestamp TIMESTAMPTZ,
    last_success_timestamp TIMESTAMPTZ,
    
    -- Metadata
    version VARCHAR(50),
    environment VARCHAR(20) DEFAULT 'production',
    deployment_timestamp TIMESTAMPTZ,
    
    CONSTRAINT ck_health_status CHECK (status IN ('HEALTHY', 'DEGRADED', 'UNHEALTHY', 'UNKNOWN')),
    CONSTRAINT ck_health_error_rate CHECK (error_rate >= 0 AND error_rate <= 1),
    CONSTRAINT ck_health_usage_percentages CHECK (
        (cpu_usage IS NULL OR (cpu_usage >= 0 AND cpu_usage <= 100)) AND
        (memory_usage IS NULL OR (memory_usage >= 0 AND memory_usage <= 100)) AND
        (disk_usage IS NULL OR (disk_usage >= 0 AND disk_usage <= 100))
    ),
    CONSTRAINT ck_health_check_interval CHECK (check_interval_seconds > 0),
    CONSTRAINT ck_health_consecutive_failures CHECK (consecutive_failures >= 0)
);

-- =============================================================================
-- PERFORMANCE OPTIMIZATION INDEXES
-- =============================================================================

-- System configuration indexes
CREATE INDEX IF NOT EXISTS idx_system_config_key_name ON system_config(key_name);

-- Migration history indexes
CREATE INDEX IF NOT EXISTS idx_migration_history_version ON migration_history(version_number);
CREATE INDEX IF NOT EXISTS idx_migration_history_executed_at ON migration_history(executed_at);

-- Warehouse indexes
CREATE INDEX IF NOT EXISTS idx_warehouses_warehouse_code ON warehouses(warehouse_code);
CREATE INDEX IF NOT EXISTS idx_warehouses_region ON warehouses(region);
CREATE INDEX IF NOT EXISTS idx_warehouses_country_code ON warehouses(country_code);
CREATE INDEX IF NOT EXISTS idx_warehouses_is_active ON warehouses(is_active);

-- Supplier indexes
CREATE INDEX IF NOT EXISTS idx_suppliers_supplier_code ON suppliers(supplier_code);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_supplier_type_id ON suppliers(supplier_type_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_primary_warehouse_id ON suppliers(primary_warehouse_id);

-- Product indexes
CREATE INDEX IF NOT EXISTS idx_products_product_code ON products(product_code);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_voltage ON products(voltage);
CREATE INDEX IF NOT EXISTS idx_products_capacity_ah ON products(capacity_ah);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_lifecycle_status ON products(lifecycle_status);

-- Inventory indexes
CREATE INDEX IF NOT EXISTS idx_inventory_product_warehouse ON inventory(product_id, warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_warehouse_id ON inventory(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_last_movement ON inventory(last_movement);
CREATE INDEX IF NOT EXISTS idx_inventory_reorder_point ON inventory(quantity_available, reorder_point);

-- Inventory movement indexes
CREATE INDEX IF NOT EXISTS idx_inventory_movements_inventory_id ON inventory_movements(inventory_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_movement_type ON inventory_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_movement_date ON inventory_movements(movement_date);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_reference ON inventory_movements(reference_type, reference_id);

-- Pricing indexes
CREATE INDEX IF NOT EXISTS idx_discount_tiers_minimum_amount ON discount_tiers(minimum_amount);
CREATE INDEX IF NOT EXISTS idx_discount_tiers_effective_date ON discount_tiers(effective_date);
CREATE INDEX IF NOT EXISTS idx_supplier_pricing_supplier_product ON supplier_pricing(supplier_id, product_id);
CREATE INDEX IF NOT EXISTS idx_supplier_pricing_effective_date ON supplier_pricing(effective_date);

-- System health indexes
CREATE INDEX IF NOT EXISTS idx_system_health_service_component ON system_health(service_name, component_name);
CREATE INDEX IF NOT EXISTS idx_system_health_status ON system_health(status);
CREATE INDEX IF NOT EXISTS idx_system_health_last_check ON system_health(last_check_timestamp);

-- =============================================================================
-- TRIGGERS FOR AUDIT LOGGING
-- =============================================================================

-- Function to create audit log entries
CREATE OR REPLACE FUNCTION create_audit_log_entry()
RETURNS TRIGGER AS $$
DECLARE
    old_data JSONB;
    new_data JSONB;
    changed_fields JSONB;
    action_type VARCHAR(20);
    event_category VARCHAR(50);
BEGIN
    -- Determine action type
    IF TG_OP = 'INSERT' THEN
        action_type := 'CREATE';
        old_data := NULL;
        new_data := to_jsonb(NEW);
        changed_fields := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        action_type := 'UPDATE';
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);
        -- Calculate changed fields
        SELECT jsonb_agg(key) INTO changed_fields
        FROM jsonb_each(old_data) old_kv
        JOIN jsonb_each(new_data) new_kv USING (key)
        WHERE old_kv.value IS DISTINCT FROM new_kv.value;
    ELSIF TG_OP = 'DELETE' THEN
        action_type := 'DELETE';
        old_data := to_jsonb(OLD);
        new_data := NULL;
        changed_fields := NULL;
    END IF;

    -- Determine event category based on table
    event_category := CASE TG_TABLE_NAME
        WHEN 'suppliers' THEN 'SUPPLIER_MANAGEMENT'
        WHEN 'products' THEN 'PRODUCT_MANAGEMENT'
        WHEN 'inventory' THEN 'INVENTORY_MANAGEMENT'
        WHEN 'warehouses' THEN 'WAREHOUSE_MANAGEMENT'
        WHEN 'supplier_pricing' THEN 'PRICING_MANAGEMENT'
        ELSE 'SYSTEM_OPERATION'
    END;

    -- Insert audit log entry
    INSERT INTO audit_log (
        event_type,
        event_category,
        table_name,
        record_id,
        action,
        old_values,
        new_values,
        changed_fields,
        user_id,
        user_type,
        compliance_level,
        region
    ) VALUES (
        TG_TABLE_NAME || '_' || action_type,
        event_category,
        TG_TABLE_NAME,
        COALESCE(NEW.id::TEXT, OLD.id::TEXT),
        action_type,
        old_data,
        new_data,
        changed_fields,
        current_setting('app.current_user_id', true),
        current_setting('app.current_user_type', true),
        CASE TG_TABLE_NAME
            WHEN 'suppliers' THEN 'SENSITIVE'
            WHEN 'supplier_pricing' THEN 'CONFIDENTIAL'
            ELSE 'STANDARD'
        END,
        current_setting('app.current_region', true)
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers for key tables
CREATE TRIGGER audit_suppliers
    AFTER INSERT OR UPDATE OR DELETE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION create_audit_log_entry();

CREATE TRIGGER audit_products
    AFTER INSERT OR UPDATE OR DELETE ON products
    FOR EACH ROW EXECUTE FUNCTION create_audit_log_entry();

CREATE TRIGGER audit_inventory
    AFTER INSERT OR UPDATE OR DELETE ON inventory
    FOR EACH ROW EXECUTE FUNCTION create_audit_log_entry();

CREATE TRIGGER audit_warehouses
    AFTER INSERT OR UPDATE OR DELETE ON warehouses
    FOR EACH ROW EXECUTE FUNCTION create_audit_log_entry();

CREATE TRIGGER audit_supplier_pricing
    AFTER INSERT OR UPDATE OR DELETE ON supplier_pricing
    FOR EACH ROW EXECUTE FUNCTION create_audit_log_entry();

-- =============================================================================
-- INITIAL DATA POPULATION
-- =============================================================================

-- Insert default system configuration
INSERT INTO system_config (key_name, key_value, description) VALUES
('SCHEMA_VERSION', '1.0.0', 'Current database schema version'),
('TIMEZONE_DEFAULT', 'UTC', 'Default timezone for system operations'),
('CURRENCY_DEFAULT', 'USD', 'Default currency for pricing'),
('AUDIT_RETENTION_DAYS', '2555', 'Audit log retention period in days (7 years)'),
('MAX_LOGIN_ATTEMPTS', '5', 'Maximum failed login attempts before lockout'),
('SESSION_TIMEOUT_MINUTES', '480', 'Session timeout in minutes (8 hours)'),
('INVENTORY_SYNC_INTERVAL', '30', 'Inventory synchronization interval in seconds'),
('PRICE_SYNC_INTERVAL', '300', 'Price synchronization interval in seconds')
ON CONFLICT (key_name) DO NOTHING;

-- Insert warehouse locations for RHY global operations
INSERT INTO warehouses (warehouse_code, name, region, country_code, timezone, currency_code, address_line1, city, state_province, postal_code, phone, email, manager_name, is_active) VALUES
('US-WEST', 'Los Angeles Distribution Center', 'North America', 'US', 'America/Los_Angeles', 'USD', '1234 Industrial Blvd', 'Los Angeles', 'CA', '90210', '+1-555-0101', 'la@rhy-batteries.com', 'John Smith', true),
('JP-TOKYO', 'Tokyo Fulfillment Hub', 'Asia Pacific', 'JP', 'Asia/Tokyo', 'JPY', '1-2-3 Shibuya', 'Tokyo', 'Tokyo', '150-0002', '+81-3-1234-5678', 'tokyo@rhy-batteries.com', 'Tanaka Hiroshi', true),
('EU-BERLIN', 'Berlin Logistics Center', 'Europe', 'DE', 'Europe/Berlin', 'EUR', 'Industriestraße 45', 'Berlin', 'Berlin', '10115', '+49-30-12345678', 'berlin@rhy-batteries.com', 'Hans Mueller', true),
('AU-SYDNEY', 'Sydney Operations Center', 'Oceania', 'AU', 'Australia/Sydney', 'AUD', '123 Warehouse Drive', 'Sydney', 'NSW', '2000', '+61-2-1234-5678', 'sydney@rhy-batteries.com', 'Mike Johnson', true)
ON CONFLICT (warehouse_code) DO NOTHING;

-- Insert supplier types
INSERT INTO supplier_types (type_code, type_name, description, access_level, permissions, default_discount_rate, requires_approval) VALUES
('DIRECT', 'Direct Manufacturer', 'Companies that manufacture FlexVolt batteries', 10, '["VIEW_ALL", "MODIFY_ALL", "PRICING_CONTROL", "INVENTORY_CONTROL"]', 0.0000, false),
('DISTRIBUTOR', 'Regional Distributor', 'Regional distribution partners', 7, '["VIEW_REGION", "MODIFY_ORDERS", "VIEW_INVENTORY"]', 0.0500, true),
('RETAILER', 'Retail Partner', 'End-point retail sales partners', 5, '["VIEW_PRODUCTS", "CREATE_ORDERS"]', 0.1000, true),
('FLEET_MGR', 'Fleet Manager', 'Bulk purchase coordinators for large fleets', 6, '["VIEW_PRODUCTS", "BULK_ORDERS", "ANALYTICS_ACCESS"]', 0.1500, true),
('SERVICE_PTR', 'Service Partner', 'Warranty and repair service providers', 4, '["VIEW_PRODUCTS", "WARRANTY_ACCESS", "SUPPORT_TOOLS"]', 0.0750, true)
ON CONFLICT (type_code) DO NOTHING;

-- Insert product categories
INSERT INTO product_categories (category_code, category_name, description, specification_template, sort_order, is_active) VALUES
('FLEXVOLT', 'FlexVolt Batteries', 'Professional-grade 20V/60V MAX compatible batteries', '{"voltage": "20V/60V", "chemistry": "Li-Ion", "warranty": "3 years"}', 1, true),
('CHARGERS', 'Battery Chargers', 'FlexVolt compatible charging solutions', '{"input_voltage": "120V", "charge_time": "variable"}', 2, true),
('ACCESSORIES', 'Battery Accessories', 'Cases, adapters, and maintenance tools', '{"compatibility": "FlexVolt"}', 3, true)
ON CONFLICT (category_code) DO NOTHING;

-- Insert FlexVolt battery products
INSERT INTO products (product_code, name, short_name, category_id, voltage, capacity_ah, base_price, msrp, cost, weight_kg, warranty_months, description, features, target_audience, lifecycle_status, is_active) VALUES
('FV-6AH-20V60V', 'FlexVolt 6.0Ah Battery Pack', 'FlexVolt 6Ah', 1, 20, 6.0, 95.00, 119.99, 65.00, 1.2, 36, 'Professional-grade FlexVolt battery with 2-hour runtime', '["20V/60V MAX compatibility", "2 hour runtime", "Professional grade", "3-year warranty"]', '["Professional contractors", "Small fleet managers"]', 'ACTIVE', true),
('FV-9AH-20V60V', 'FlexVolt 9.0Ah Battery Pack', 'FlexVolt 9Ah', 1, 20, 9.0, 125.00, 159.99, 85.00, 1.8, 36, 'Heavy-duty FlexVolt battery with 3-hour runtime', '["20V/60V MAX compatibility", "3 hour runtime", "Heavy-duty grade", "3-year warranty"]', '["Professional contractors", "Medium fleet managers", "Heavy-duty applications"]', 'ACTIVE', true),
('FV-15AH-20V60V', 'FlexVolt 15.0Ah Battery Pack', 'FlexVolt 15Ah', 1, 20, 15.0, 245.00, 299.99, 175.00, 2.5, 36, 'Industrial-grade FlexVolt battery with 5-hour runtime', '["20V/60V MAX compatibility", "5 hour runtime", "Industrial grade", "3-year warranty"]', '["Industrial users", "Large fleet managers", "Extended runtime applications"]', 'ACTIVE', true)
ON CONFLICT (product_code) DO NOTHING;

-- Insert volume discount tiers
INSERT INTO discount_tiers (tier_name, minimum_amount, discount_percentage, currency_code, supplier_types, effective_date, is_active) VALUES
('Small Contractor Tier', 1000.00, 0.1000, 'USD', '["RETAILER", "FLEET_MGR"]', CURRENT_DATE, true),
('Medium Fleet Tier', 2500.00, 0.1500, 'USD', '["DISTRIBUTOR", "FLEET_MGR"]', CURRENT_DATE, true),
('Large Enterprise Tier', 5000.00, 0.2000, 'USD', '["DISTRIBUTOR", "FLEET_MGR"]', CURRENT_DATE, true),
('Corporate Partnership Tier', 10000.00, 0.2500, 'USD', '["DIRECT", "DISTRIBUTOR", "FLEET_MGR"]', CURRENT_DATE, true)
ON CONFLICT DO NOTHING;

-- Record migration completion
INSERT INTO migration_history (migration_name, version_number, executed_at, success, applied_by) VALUES
('001_initial_schema.sql', 1, CURRENT_TIMESTAMP, true, 'system')
ON CONFLICT (migration_name) DO NOTHING;

-- Migration completed successfully
SELECT 'Migration 001_initial_schema.sql completed successfully' as result;