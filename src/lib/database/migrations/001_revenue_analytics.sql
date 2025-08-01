-- RHY Revenue Analytics Database Migration
-- Migration 001: Core Revenue Analytics Tables
-- Created: 2025-06-24
-- Description: Creates comprehensive revenue analytics schema with optimized indexing

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create revenue analytics schema
CREATE SCHEMA IF NOT EXISTS revenue_analytics;

-- Set search path
SET search_path TO revenue_analytics, public;

-- Create revenue transactions table
CREATE TABLE IF NOT EXISTS revenue_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id VARCHAR(50) NOT NULL,
    warehouse_id VARCHAR(10) NOT NULL CHECK (warehouse_id IN ('US', 'JP', 'EU', 'AU')),
    transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    product_id VARCHAR(20) NOT NULL CHECK (product_id IN ('6ah', '9ah', '15ah')),
    product_name VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price > 0),
    total_amount DECIMAL(12,2) NOT NULL CHECK (total_amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    customer_type VARCHAR(20) NOT NULL CHECK (customer_type IN ('DIRECT', 'DISTRIBUTOR', 'FLEET', 'SERVICE')),
    discount_tier VARCHAR(20) CHECK (discount_tier IN ('contractor', 'professional', 'commercial', 'enterprise')),
    discount_percentage DECIMAL(5,2) DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    sales_rep_id VARCHAR(50),
    order_id VARCHAR(50) NOT NULL,
    session_id VARCHAR(100),
    region VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT fk_supplier FOREIGN KEY (supplier_id) REFERENCES public.rhy_suppliers(id),
    CONSTRAINT valid_currency CHECK (
        (warehouse_id = 'US' AND currency = 'USD') OR
        (warehouse_id = 'JP' AND currency = 'JPY') OR
        (warehouse_id = 'EU' AND currency = 'EUR') OR
        (warehouse_id = 'AU' AND currency = 'AUD')
    )
);

-- Create customer segments table
CREATE TABLE IF NOT EXISTS customer_segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id VARCHAR(50) NOT NULL,
    segment_type VARCHAR(20) NOT NULL CHECK (segment_type IN ('DIRECT', 'DISTRIBUTOR', 'FLEET', 'SERVICE')),
    customer_count INTEGER NOT NULL DEFAULT 0,
    total_revenue DECIMAL(15,2) NOT NULL DEFAULT 0,
    average_order_value DECIMAL(10,2) NOT NULL DEFAULT 0,
    repeat_customer_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    churn_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    lifetime_value DECIMAL(12,2) NOT NULL DEFAULT 0,
    acquisition_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_utilization DECIMAL(5,2) NOT NULL DEFAULT 0,
    last_calculated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_customer_supplier FOREIGN KEY (supplier_id) REFERENCES public.rhy_suppliers(id),
    UNIQUE(supplier_id, segment_type)
);

-- Create product performance table
CREATE TABLE IF NOT EXISTS product_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id VARCHAR(50) NOT NULL,
    product_id VARCHAR(20) NOT NULL CHECK (product_id IN ('6ah', '9ah', '15ah')),
    product_name VARCHAR(100) NOT NULL,
    time_period DATE NOT NULL,
    warehouse_id VARCHAR(10) NOT NULL CHECK (warehouse_id IN ('US', 'JP', 'EU', 'AU')),
    total_revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_sales INTEGER NOT NULL DEFAULT 0,
    units_sold INTEGER NOT NULL DEFAULT 0,
    conversion_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    margin DECIMAL(5,2) NOT NULL DEFAULT 0,
    return_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    inventory_level INTEGER NOT NULL DEFAULT 0,
    reorder_point INTEGER NOT NULL DEFAULT 0,
    stockout_days INTEGER NOT NULL DEFAULT 0,
    price_elasticity DECIMAL(8,4) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_product_supplier FOREIGN KEY (supplier_id) REFERENCES public.rhy_suppliers(id),
    UNIQUE(supplier_id, product_id, time_period, warehouse_id)
);

-- Create regional performance table
CREATE TABLE IF NOT EXISTS regional_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id VARCHAR(50) NOT NULL,
    region VARCHAR(10) NOT NULL CHECK (region IN ('US', 'JP', 'EU', 'AU')),
    time_period DATE NOT NULL,
    total_revenue DECIMAL(15,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL,
    revenue_growth DECIMAL(8,4) NOT NULL DEFAULT 0,
    market_share DECIMAL(5,2) NOT NULL DEFAULT 0,
    customer_count INTEGER NOT NULL DEFAULT 0,
    average_order_value DECIMAL(10,2) NOT NULL DEFAULT 0,
    orders_count INTEGER NOT NULL DEFAULT 0,
    fulfillment_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    operating_margin DECIMAL(5,2) NOT NULL DEFAULT 0,
    local_competition_index DECIMAL(5,2) DEFAULT 0,
    economic_indicator DECIMAL(8,4) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_regional_supplier FOREIGN KEY (supplier_id) REFERENCES public.rhy_suppliers(id),
    UNIQUE(supplier_id, region, time_period)
);

-- Create sales forecasting table
CREATE TABLE IF NOT EXISTS sales_forecasting (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id VARCHAR(50) NOT NULL,
    forecast_date DATE NOT NULL,
    forecast_type VARCHAR(20) NOT NULL CHECK (forecast_type IN ('daily', 'weekly', 'monthly')),
    model_type VARCHAR(30) NOT NULL CHECK (model_type IN ('linear_regression', 'arima', 'prophet')),
    predicted_revenue DECIMAL(12,2) NOT NULL,
    confidence_level DECIMAL(5,4) NOT NULL CHECK (confidence_level >= 0 AND confidence_level <= 1),
    upper_bound DECIMAL(12,2) NOT NULL,
    lower_bound DECIMAL(12,2) NOT NULL,
    seasonal_factor DECIMAL(6,4) DEFAULT 1.0,
    trend_component DECIMAL(10,2) DEFAULT 0,
    market_condition VARCHAR(20) DEFAULT 'stable',
    external_factors JSONB,
    accuracy_score DECIMAL(5,4),
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_forecast_supplier FOREIGN KEY (supplier_id) REFERENCES public.rhy_suppliers(id),
    CONSTRAINT valid_bounds CHECK (lower_bound >= 0 AND upper_bound >= predicted_revenue AND predicted_revenue >= lower_bound),
    UNIQUE(supplier_id, forecast_date, forecast_type, model_type)
);

-- Create revenue KPIs table
CREATE TABLE IF NOT EXISTS revenue_kpis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id VARCHAR(50) NOT NULL,
    calculation_date DATE NOT NULL,
    time_range_days INTEGER NOT NULL CHECK (time_range_days > 0),
    total_revenue DECIMAL(15,2) NOT NULL DEFAULT 0,
    revenue_growth DECIMAL(8,4) NOT NULL DEFAULT 0,
    gross_margin DECIMAL(5,2) NOT NULL DEFAULT 0,
    net_margin DECIMAL(5,2) NOT NULL DEFAULT 0,
    average_order_value DECIMAL(10,2) NOT NULL DEFAULT 0,
    customer_lifetime_value DECIMAL(12,2) NOT NULL DEFAULT 0,
    customer_acquisition_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    churn_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    repeat_customer_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    monthly_recurring_revenue DECIMAL(12,2) DEFAULT 0,
    revenue_per_customer DECIMAL(10,2) DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    payback_period_days INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_kpi_supplier FOREIGN KEY (supplier_id) REFERENCES public.rhy_suppliers(id),
    UNIQUE(supplier_id, calculation_date, time_range_days)
);

-- Create analytics cache table for performance optimization
CREATE TABLE IF NOT EXISTS analytics_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cache_key VARCHAR(200) NOT NULL,
    supplier_id VARCHAR(50) NOT NULL,
    query_type VARCHAR(50) NOT NULL,
    parameters JSONB NOT NULL,
    result_data JSONB NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    hit_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_cache_supplier FOREIGN KEY (supplier_id) REFERENCES public.rhy_suppliers(id),
    UNIQUE(cache_key)
);

-- Create audit log table
CREATE TABLE IF NOT EXISTS analytics_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(100),
    user_id VARCHAR(50),
    session_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    request_data JSONB,
    response_status INTEGER,
    execution_time_ms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_audit_supplier FOREIGN KEY (supplier_id) REFERENCES public.rhy_suppliers(id)
);

-- Create performance optimized indexes
-- Primary indexes for revenue transactions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_revenue_transactions_supplier_date 
ON revenue_transactions (supplier_id, transaction_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_revenue_transactions_warehouse_date 
ON revenue_transactions (warehouse_id, transaction_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_revenue_transactions_product_date 
ON revenue_transactions (product_id, transaction_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_revenue_transactions_customer_type 
ON revenue_transactions (customer_type, transaction_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_revenue_transactions_order_id 
ON revenue_transactions (order_id);

-- Composite indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_revenue_supplier_warehouse_date 
ON revenue_transactions (supplier_id, warehouse_id, transaction_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_revenue_supplier_product_date 
ON revenue_transactions (supplier_id, product_id, transaction_date DESC);

-- Performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_performance_supplier_period 
ON product_performance (supplier_id, time_period DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_regional_performance_supplier_period 
ON regional_performance (supplier_id, time_period DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_forecasting_supplier_date 
ON sales_forecasting (supplier_id, forecast_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_kpis_supplier_date 
ON revenue_kpis (supplier_id, calculation_date DESC);

-- Cache optimization indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_cache_key 
ON analytics_cache (cache_key);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_cache_expires 
ON analytics_cache (expires_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_cache_supplier_type 
ON analytics_cache (supplier_id, query_type);

-- Audit log indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_supplier_created 
ON analytics_audit_log (supplier_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_action_created 
ON analytics_audit_log (action, created_at DESC);

-- Full-text search indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_revenue_transactions_search 
ON revenue_transactions USING gin (to_tsvector('english', product_name || ' ' || region));

-- Partial indexes for active data
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_revenue_transactions_recent 
ON revenue_transactions (supplier_id, transaction_date DESC) 
WHERE transaction_date >= NOW() - INTERVAL '1 year';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_cache_active 
ON analytics_cache (cache_key, supplier_id) 
WHERE expires_at > NOW();

-- Create materialized views for performance
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_revenue_summary AS
SELECT 
    supplier_id,
    warehouse_id,
    DATE(transaction_date) as date,
    COUNT(*) as transaction_count,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as avg_transaction_value,
    COUNT(DISTINCT order_id) as unique_orders,
    STRING_AGG(DISTINCT customer_type, ',') as customer_types,
    SUM(CASE WHEN discount_percentage > 0 THEN 1 ELSE 0 END) as discounted_transactions
FROM revenue_transactions
WHERE transaction_date >= NOW() - INTERVAL '2 years'
GROUP BY supplier_id, warehouse_id, DATE(transaction_date);

-- Index the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_daily_revenue_summary_unique 
ON mv_daily_revenue_summary (supplier_id, warehouse_id, date);

CREATE INDEX IF NOT EXISTS idx_mv_daily_revenue_summary_date 
ON mv_daily_revenue_summary (date DESC);

-- Create monthly revenue summary view
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_monthly_revenue_summary AS
SELECT 
    supplier_id,
    warehouse_id,
    DATE_TRUNC('month', transaction_date) as month,
    COUNT(*) as transaction_count,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as avg_transaction_value,
    COUNT(DISTINCT order_id) as unique_orders,
    COUNT(DISTINCT customer_type) as customer_type_count,
    SUM(quantity) as total_units_sold
FROM revenue_transactions
WHERE transaction_date >= NOW() - INTERVAL '3 years'
GROUP BY supplier_id, warehouse_id, DATE_TRUNC('month', transaction_date);

-- Index the monthly view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_monthly_revenue_summary_unique 
ON mv_monthly_revenue_summary (supplier_id, warehouse_id, month);

-- Create triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
CREATE TRIGGER trigger_revenue_transactions_updated_at
    BEFORE UPDATE ON revenue_transactions
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_customer_segments_updated_at
    BEFORE UPDATE ON customer_segments
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_product_performance_updated_at
    BEFORE UPDATE ON product_performance
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_regional_performance_updated_at
    BEFORE UPDATE ON regional_performance
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trigger_revenue_kpis_updated_at
    BEFORE UPDATE ON revenue_kpis
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Create cache cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM analytics_cache WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create performance monitoring views
CREATE OR REPLACE VIEW v_analytics_performance AS
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation,
    most_common_vals[1:5] as top_values
FROM pg_stats 
WHERE schemaname = 'revenue_analytics'
ORDER BY tablename, attname;

-- Create query performance monitoring
CREATE OR REPLACE VIEW v_slow_queries AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements 
WHERE query ILIKE '%revenue_analytics%'
ORDER BY mean_time DESC;

-- Create table size monitoring
CREATE OR REPLACE VIEW v_table_sizes AS
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables 
WHERE schemaname = 'revenue_analytics'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Grant appropriate permissions
GRANT USAGE ON SCHEMA revenue_analytics TO rhy_supplier_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA revenue_analytics TO rhy_supplier_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA revenue_analytics TO rhy_supplier_role;
GRANT SELECT ON ALL TABLES IN SCHEMA revenue_analytics TO rhy_readonly_role;

-- Create partition maintenance function
CREATE OR REPLACE FUNCTION create_monthly_partitions()
RETURNS VOID AS $$
DECLARE
    start_date DATE;
    end_date DATE;
    table_name TEXT;
BEGIN
    -- Create partitions for next 12 months
    FOR i IN 0..11 LOOP
        start_date := DATE_TRUNC('month', NOW() + (i || ' months')::INTERVAL);
        end_date := start_date + INTERVAL '1 month';
        table_name := 'revenue_transactions_' || TO_CHAR(start_date, 'YYYY_MM');
        
        -- Check if partition already exists
        IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = table_name) THEN
            EXECUTE format('CREATE TABLE %I PARTITION OF revenue_transactions 
                           FOR VALUES FROM (%L) TO (%L)', 
                           table_name, start_date, end_date);
            
            -- Create indexes on partition
            EXECUTE format('CREATE INDEX %I ON %I (supplier_id, transaction_date)', 
                           'idx_' || table_name || '_supplier_date', table_name);
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Refresh materialized views procedure
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_revenue_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_revenue_summary;
END;
$$ LANGUAGE plpgsql;

-- Insert initial test data for validation
INSERT INTO revenue_transactions (
    supplier_id, warehouse_id, transaction_date, product_id, product_name,
    quantity, unit_price, total_amount, currency, customer_type, region, order_id
) VALUES 
('supplier-123', 'US', NOW() - INTERVAL '1 day', '6ah', 'FlexVolt 20V MAX 6.0Ah Battery', 5, 95.00, 475.00, 'USD', 'DIRECT', 'North America', 'ORD-001'),
('supplier-123', 'US', NOW() - INTERVAL '2 days', '9ah', 'FlexVolt 20V MAX 9.0Ah Battery', 3, 125.00, 375.00, 'USD', 'DISTRIBUTOR', 'North America', 'ORD-002'),
('supplier-123', 'EU', NOW() - INTERVAL '1 day', '15ah', 'FlexVolt 20V MAX 15.0Ah Battery', 2, 245.00, 490.00, 'EUR', 'FLEET', 'Europe', 'ORD-003'),
('supplier-123', 'JP', NOW() - INTERVAL '3 days', '6ah', 'FlexVolt 20V MAX 6.0Ah Battery', 8, 95.00, 760.00, 'JPY', 'SERVICE', 'Asia Pacific', 'ORD-004');

-- Create analytics summary after migration
INSERT INTO analytics_audit_log (supplier_id, action, resource_type, user_id, ip_address)
VALUES ('system', 'MIGRATION_COMPLETE', 'DATABASE_SCHEMA', 'migration_script', '127.0.0.1');

COMMIT;