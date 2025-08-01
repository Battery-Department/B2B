-- 002_auth_tables.sql
-- RHY Supplier Portal - Authentication & Security Tables
-- Enterprise-grade authentication system with MFA, session management, and audit trails
-- Implements JWT + MFA with secure token rotation and regional compliance

-- =============================================================================
-- SECURITY CONFIGURATION
-- =============================================================================

-- Enable necessary PostgreSQL extensions for security
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- =============================================================================
-- USER MANAGEMENT TABLES
-- =============================================================================

-- Core user accounts with enterprise security features
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic identity
    email CITEXT NOT NULL UNIQUE,
    username VARCHAR(50) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(255) NOT NULL,
    
    -- Personal information
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    display_name VARCHAR(200),
    job_title VARCHAR(150),
    department VARCHAR(100),
    
    -- Contact information
    phone_number VARCHAR(50),
    mobile_number VARCHAR(50),
    alternate_email CITEXT,
    preferred_language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- Account status and security
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, ACTIVE, SUSPENDED, DEACTIVATED, LOCKED
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    
    -- Password policy enforcement
    password_expires_at TIMESTAMPTZ,
    password_changed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    must_change_password BOOLEAN DEFAULT TRUE,
    password_history JSONB DEFAULT '[]'::JSONB, -- Last 12 password hashes
    
    -- Account lockout and security
    failed_login_attempts INTEGER DEFAULT 0,
    last_failed_login TIMESTAMPTZ,
    locked_until TIMESTAMPTZ,
    lockout_count INTEGER DEFAULT 0, -- Number of times locked out
    
    -- Activity tracking
    last_login TIMESTAMPTZ,
    last_activity TIMESTAMPTZ,
    login_count INTEGER DEFAULT 0,
    
    -- MFA settings
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    mfa_backup_codes JSONB, -- Encrypted backup codes
    mfa_recovery_email CITEXT,
    
    -- Device and location tracking
    last_login_ip INET,
    last_login_device TEXT,
    last_login_location JSONB, -- {country, region, city}
    trusted_devices JSONB DEFAULT '[]'::JSONB, -- Array of device fingerprints
    
    -- Privacy and compliance
    data_classification VARCHAR(20) DEFAULT 'INTERNAL', -- PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED
    gdpr_consent BOOLEAN DEFAULT FALSE,
    gdpr_consent_date TIMESTAMPTZ,
    data_retention_until TIMESTAMPTZ,
    
    -- Profile and preferences
    avatar_url VARCHAR(500),
    preferences JSONB DEFAULT '{}'::JSONB, -- UI preferences, notifications, etc.
    profile_metadata JSONB DEFAULT '{}'::JSONB, -- Additional profile data
    
    -- Audit and compliance fields
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMPTZ, -- Soft delete for audit compliance
    deletion_reason TEXT,
    
    CONSTRAINT ck_user_status CHECK (status IN ('PENDING', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED', 'LOCKED')),
    CONSTRAINT ck_user_failed_attempts CHECK (failed_login_attempts >= 0 AND failed_login_attempts <= 50),
    CONSTRAINT ck_user_lockout_count CHECK (lockout_count >= 0),
    CONSTRAINT ck_user_login_count CHECK (login_count >= 0),
    CONSTRAINT ck_user_data_classification CHECK (data_classification IN ('PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED')),
    CONSTRAINT ck_user_language CHECK (preferred_language ~ '^[a-z]{2}(-[A-Z]{2})?$'),
    CONSTRAINT ck_password_change_dates CHECK (password_changed_at <= CURRENT_TIMESTAMP),
    CONSTRAINT ck_email_format CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- User roles and permissions system
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_code VARCHAR(50) NOT NULL UNIQUE,
    role_name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Permission system
    permissions JSONB NOT NULL DEFAULT '[]'::JSONB, -- Array of permission strings
    resource_access JSONB DEFAULT '{}'::JSONB, -- Resource-specific permissions
    data_access_level INTEGER DEFAULT 1, -- 1-10 scale for data access
    
    -- Hierarchy and delegation
    parent_role_id UUID,
    can_delegate BOOLEAN DEFAULT FALSE,
    delegation_level INTEGER DEFAULT 0,
    max_delegation_depth INTEGER DEFAULT 0,
    
    -- Scope and context
    scope VARCHAR(50) DEFAULT 'GLOBAL', -- GLOBAL, REGION, WAREHOUSE, SUPPLIER
    context_filters JSONB DEFAULT '{}'::JSONB, -- Context-specific filters
    
    -- Compliance and approval
    requires_approval BOOLEAN DEFAULT FALSE,
    approval_workflow JSONB, -- Approval workflow configuration
    compliance_level VARCHAR(20) DEFAULT 'STANDARD', -- STANDARD, ELEVATED, CRITICAL
    
    -- Auto-assignment rules
    auto_assign_rules JSONB, -- Rules for automatic role assignment
    default_for_supplier_type VARCHAR(20),
    
    -- Status and lifecycle
    is_active BOOLEAN DEFAULT TRUE,
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_until DATE,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    
    FOREIGN KEY (parent_role_id) REFERENCES roles(id),
    
    CONSTRAINT ck_role_data_access_level CHECK (data_access_level BETWEEN 1 AND 10),
    CONSTRAINT ck_role_delegation_level CHECK (delegation_level >= 0),
    CONSTRAINT ck_role_max_delegation_depth CHECK (max_delegation_depth >= 0),
    CONSTRAINT ck_role_scope CHECK (scope IN ('GLOBAL', 'REGION', 'WAREHOUSE', 'SUPPLIER')),
    CONSTRAINT ck_role_compliance_level CHECK (compliance_level IN ('STANDARD', 'ELEVATED', 'CRITICAL')),
    CONSTRAINT ck_role_effective_dates CHECK (effective_from <= effective_until OR effective_until IS NULL)
);

-- User role assignments with time-based and conditional access
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    role_id UUID NOT NULL,
    
    -- Assignment context
    assigned_by UUID NOT NULL,
    assignment_reason TEXT,
    assignment_type VARCHAR(20) DEFAULT 'MANUAL', -- MANUAL, AUTOMATIC, INHERITED, TEMPORARY
    
    -- Scope and limitations
    scope_context JSONB, -- Warehouse, region, or supplier-specific scope
    resource_limitations JSONB, -- Specific resource access limitations
    
    -- Time-based access
    effective_from TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    effective_until TIMESTAMPTZ,
    
    -- Conditional access
    conditions JSONB, -- IP restrictions, time restrictions, etc.
    requires_mfa BOOLEAN DEFAULT FALSE,
    
    -- Status tracking
    is_active BOOLEAN DEFAULT TRUE,
    last_used TIMESTAMPTZ,
    usage_count INTEGER DEFAULT 0,
    
    -- Approval and workflow
    approval_status VARCHAR(20) DEFAULT 'APPROVED', -- PENDING, APPROVED, REJECTED, EXPIRED
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    approval_notes TEXT,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMPTZ,
    revoked_by UUID,
    revocation_reason TEXT,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (assigned_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id),
    FOREIGN KEY (revoked_by) REFERENCES users(id),
    
    UNIQUE(user_id, role_id, effective_from),
    
    CONSTRAINT ck_user_role_assignment_type CHECK (assignment_type IN ('MANUAL', 'AUTOMATIC', 'INHERITED', 'TEMPORARY')),
    CONSTRAINT ck_user_role_approval_status CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED')),
    CONSTRAINT ck_user_role_effective_dates CHECK (effective_from <= effective_until OR effective_until IS NULL),
    CONSTRAINT ck_user_role_usage_count CHECK (usage_count >= 0)
);

-- =============================================================================
-- SESSION MANAGEMENT TABLES
-- =============================================================================

-- Advanced session management with device tracking and security
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_token VARCHAR(255) NOT NULL UNIQUE,
    user_id UUID NOT NULL,
    
    -- Session metadata
    session_type VARCHAR(20) DEFAULT 'WEB', -- WEB, API, MOBILE, SERVICE
    user_agent TEXT,
    ip_address INET,
    
    -- Device information
    device_fingerprint VARCHAR(255),
    device_type VARCHAR(50), -- desktop, mobile, tablet, api_client
    device_name VARCHAR(100),
    operating_system VARCHAR(50),
    browser_name VARCHAR(50),
    browser_version VARCHAR(20),
    
    -- Geographic information
    country_code CHAR(2),
    region VARCHAR(100),
    city VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    isp VARCHAR(200),
    
    -- Security features
    is_trusted_device BOOLEAN DEFAULT FALSE,
    requires_verification BOOLEAN DEFAULT FALSE,
    mfa_verified BOOLEAN DEFAULT FALSE,
    risk_score INTEGER DEFAULT 0, -- 0-100 risk assessment
    
    -- Session lifecycle
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL,
    
    -- Activity tracking
    request_count INTEGER DEFAULT 0,
    data_transferred BIGINT DEFAULT 0, -- Bytes
    
    -- Session status
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, EXPIRED, REVOKED, SUSPICIOUS
    terminated_at TIMESTAMPTZ,
    termination_reason VARCHAR(100),
    terminated_by UUID,
    
    -- Security events
    security_events JSONB DEFAULT '[]'::JSONB, -- Array of security events
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (terminated_by) REFERENCES users(id),
    
    CONSTRAINT ck_session_type CHECK (session_type IN ('WEB', 'API', 'MOBILE', 'SERVICE')),
    CONSTRAINT ck_session_status CHECK (status IN ('ACTIVE', 'EXPIRED', 'REVOKED', 'SUSPICIOUS')),
    CONSTRAINT ck_session_risk_score CHECK (risk_score BETWEEN 0 AND 100),
    CONSTRAINT ck_session_request_count CHECK (request_count >= 0),
    CONSTRAINT ck_session_data_transferred CHECK (data_transferred >= 0),
    CONSTRAINT ck_session_expires_at CHECK (expires_at > created_at)
);

-- JWT token management for stateless authentication
CREATE TABLE IF NOT EXISTS jwt_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_hash VARCHAR(255) NOT NULL UNIQUE, -- SHA-256 hash of token
    user_id UUID NOT NULL,
    session_id UUID,
    
    -- Token metadata
    token_type VARCHAR(20) DEFAULT 'ACCESS', -- ACCESS, REFRESH, PASSWORD_RESET, EMAIL_VERIFY
    token_purpose VARCHAR(50),
    
    -- Token lifecycle
    issued_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL,
    not_before TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    -- Token scope and permissions
    scope JSONB DEFAULT '[]'::JSONB, -- Array of scopes
    audience VARCHAR(100), -- Intended audience
    issuer VARCHAR(100) DEFAULT 'RHY_SUPPLIER_PORTAL',
    
    -- Security tracking
    ip_address INET,
    user_agent TEXT,
    client_id VARCHAR(100),
    
    -- Token status
    is_active BOOLEAN DEFAULT TRUE,
    revoked_at TIMESTAMPTZ,
    revoked_by UUID,
    revocation_reason TEXT,
    
    -- Usage tracking
    last_used TIMESTAMPTZ,
    usage_count INTEGER DEFAULT 0,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES user_sessions(id) ON DELETE SET NULL,
    FOREIGN KEY (revoked_by) REFERENCES users(id),
    
    CONSTRAINT ck_jwt_token_type CHECK (token_type IN ('ACCESS', 'REFRESH', 'PASSWORD_RESET', 'EMAIL_VERIFY')),
    CONSTRAINT ck_jwt_token_dates CHECK (issued_at <= expires_at AND not_before <= expires_at),
    CONSTRAINT ck_jwt_usage_count CHECK (usage_count >= 0)
);

-- =============================================================================
-- MULTI-FACTOR AUTHENTICATION TABLES
-- =============================================================================

-- MFA methods and configurations
CREATE TABLE IF NOT EXISTS mfa_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    
    -- Method details
    method_type VARCHAR(20) NOT NULL, -- TOTP, SMS, EMAIL, HARDWARE_KEY, BACKUP_CODES
    method_name VARCHAR(100), -- User-friendly name
    
    -- Method-specific data (encrypted)
    secret_encrypted TEXT, -- TOTP secret, phone number, etc.
    encryption_key_id VARCHAR(100), -- Reference to encryption key
    
    -- Configuration
    configuration JSONB DEFAULT '{}'::JSONB, -- Method-specific configuration
    
    -- Status and verification
    is_active BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    is_primary BOOLEAN DEFAULT FALSE,
    
    -- Setup and verification
    setup_completed_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    last_used TIMESTAMPTZ,
    usage_count INTEGER DEFAULT 0,
    
    -- Backup and recovery
    backup_codes JSONB, -- Encrypted backup codes
    backup_codes_used JSONB DEFAULT '[]'::JSONB, -- Used backup codes
    recovery_codes_generated_at TIMESTAMPTZ,
    
    -- Security tracking
    created_ip INET,
    last_verification_ip INET,
    failed_attempts INTEGER DEFAULT 0,
    last_failed_attempt TIMESTAMPTZ,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    CONSTRAINT ck_mfa_method_type CHECK (method_type IN ('TOTP', 'SMS', 'EMAIL', 'HARDWARE_KEY', 'BACKUP_CODES')),
    CONSTRAINT ck_mfa_failed_attempts CHECK (failed_attempts >= 0),
    CONSTRAINT ck_mfa_usage_count CHECK (usage_count >= 0)
);

-- MFA verification attempts and security events
CREATE TABLE IF NOT EXISTS mfa_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    mfa_method_id UUID NOT NULL,
    session_id UUID,
    
    -- Verification details
    verification_code VARCHAR(20), -- The code that was attempted
    verification_result VARCHAR(20) NOT NULL, -- SUCCESS, FAILED, EXPIRED, INVALID
    
    -- Context information
    ip_address INET,
    user_agent TEXT,
    location JSONB, -- Geographic location
    
    -- Security assessment
    risk_factors JSONB DEFAULT '[]'::JSONB, -- Array of risk factors detected
    risk_score INTEGER DEFAULT 0, -- 0-100 risk assessment
    
    -- Timing information
    attempted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    verification_duration_ms INTEGER, -- Time taken to verify
    
    -- Additional metadata
    metadata JSONB DEFAULT '{}'::JSONB,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (mfa_method_id) REFERENCES mfa_methods(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES user_sessions(id) ON DELETE SET NULL,
    
    CONSTRAINT ck_mfa_verification_result CHECK (verification_result IN ('SUCCESS', 'FAILED', 'EXPIRED', 'INVALID')),
    CONSTRAINT ck_mfa_verification_risk_score CHECK (risk_score BETWEEN 0 AND 100),
    CONSTRAINT ck_mfa_verification_duration CHECK (verification_duration_ms IS NULL OR verification_duration_ms >= 0)
);

-- =============================================================================
-- AUTHENTICATION EVENTS AND SECURITY MONITORING
-- =============================================================================

-- Comprehensive authentication event logging
CREATE TABLE IF NOT EXISTS auth_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Event identification
    event_type VARCHAR(50) NOT NULL, -- LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT, MFA_SETUP, etc.
    event_category VARCHAR(30) NOT NULL, -- AUTHENTICATION, AUTHORIZATION, SECURITY, COMPLIANCE
    event_severity VARCHAR(20) DEFAULT 'INFO', -- DEBUG, INFO, WARN, ERROR, CRITICAL
    
    -- User and session context
    user_id UUID,
    session_id UUID,
    
    -- Request context
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100),
    endpoint VARCHAR(255),
    http_method VARCHAR(10),
    
    -- Geographic and device context
    country_code CHAR(2),
    region VARCHAR(100),
    city VARCHAR(100),
    device_fingerprint VARCHAR(255),
    device_type VARCHAR(50),
    
    -- Event details
    event_data JSONB DEFAULT '{}'::JSONB, -- Event-specific data
    resource_accessed VARCHAR(255), -- Resource that was accessed
    action_attempted VARCHAR(100), -- Action that was attempted
    
    -- Security analysis
    is_suspicious BOOLEAN DEFAULT FALSE,
    risk_score INTEGER DEFAULT 0, -- 0-100 risk assessment
    risk_factors JSONB DEFAULT '[]'::JSONB, -- Array of risk factors
    threat_indicators JSONB DEFAULT '[]'::JSONB, -- Security threat indicators
    
    -- Response and handling
    response_action VARCHAR(50), -- ALLOW, DENY, CHALLENGE, QUARANTINE
    response_reason TEXT,
    automated_response BOOLEAN DEFAULT FALSE,
    
    -- Compliance and retention
    compliance_tags JSONB DEFAULT '[]'::JSONB, -- GDPR, HIPAA, SOX, etc.
    retention_until TIMESTAMPTZ,
    
    -- Correlation and investigation
    correlation_id VARCHAR(100), -- For correlating related events
    investigation_id VARCHAR(100), -- For linking to security investigations
    
    -- Timestamps
    event_timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (session_id) REFERENCES user_sessions(id) ON DELETE SET NULL,
    
    CONSTRAINT ck_auth_event_severity CHECK (event_severity IN ('DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL')),
    CONSTRAINT ck_auth_event_category CHECK (event_category IN ('AUTHENTICATION', 'AUTHORIZATION', 'SECURITY', 'COMPLIANCE')),
    CONSTRAINT ck_auth_event_risk_score CHECK (risk_score BETWEEN 0 AND 100),
    CONSTRAINT ck_auth_event_response_action CHECK (response_action IN ('ALLOW', 'DENY', 'CHALLENGE', 'QUARANTINE') OR response_action IS NULL)
);

-- Security rules and threat detection
CREATE TABLE IF NOT EXISTS security_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_name VARCHAR(100) NOT NULL UNIQUE,
    rule_type VARCHAR(30) NOT NULL, -- RATE_LIMIT, GEOFENCE, DEVICE_TRUST, BEHAVIOR_ANOMALY
    
    -- Rule configuration
    conditions JSONB NOT NULL, -- Rule conditions and thresholds
    actions JSONB NOT NULL, -- Actions to take when rule triggers
    
    -- Rule scope and targeting
    target_users JSONB, -- Specific users or user groups
    target_roles JSONB, -- Specific roles
    target_resources JSONB, -- Specific resources or endpoints
    
    -- Rule status and lifecycle
    is_active BOOLEAN DEFAULT TRUE,
    effective_from TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    effective_until TIMESTAMPTZ,
    
    -- Performance and tuning
    trigger_count INTEGER DEFAULT 0,
    false_positive_count INTEGER DEFAULT 0,
    last_triggered TIMESTAMPTZ,
    
    -- Configuration metadata
    description TEXT,
    severity_level VARCHAR(20) DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
    confidence_threshold DECIMAL(3,2) DEFAULT 0.75, -- 0.00-1.00
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),
    
    CONSTRAINT ck_security_rule_type CHECK (rule_type IN ('RATE_LIMIT', 'GEOFENCE', 'DEVICE_TRUST', 'BEHAVIOR_ANOMALY')),
    CONSTRAINT ck_security_rule_severity CHECK (severity_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    CONSTRAINT ck_security_rule_confidence CHECK (confidence_threshold BETWEEN 0.00 AND 1.00),
    CONSTRAINT ck_security_rule_trigger_count CHECK (trigger_count >= 0),
    CONSTRAINT ck_security_rule_false_positive_count CHECK (false_positive_count >= 0)
);

-- =============================================================================
-- PASSWORD POLICY AND SECURITY CONFIGURATION
-- =============================================================================

-- Password policy configuration
CREATE TABLE IF NOT EXISTS password_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    policy_name VARCHAR(100) NOT NULL UNIQUE,
    
    -- Password requirements
    min_length INTEGER DEFAULT 12,
    max_length INTEGER DEFAULT 128,
    require_uppercase BOOLEAN DEFAULT TRUE,
    require_lowercase BOOLEAN DEFAULT TRUE,
    require_numbers BOOLEAN DEFAULT TRUE,
    require_special_chars BOOLEAN DEFAULT TRUE,
    allowed_special_chars VARCHAR(50) DEFAULT '!@#$%^&*()_+-=[]{}|;:,.<>?',
    
    -- Password history and rotation
    password_history_count INTEGER DEFAULT 12,
    max_age_days INTEGER DEFAULT 90,
    min_age_hours INTEGER DEFAULT 24,
    
    -- Account lockout policy
    max_failed_attempts INTEGER DEFAULT 5,
    lockout_duration_minutes INTEGER DEFAULT 15,
    progressive_lockout BOOLEAN DEFAULT TRUE,
    
    -- Complexity rules
    disallow_common_passwords BOOLEAN DEFAULT TRUE,
    disallow_personal_info BOOLEAN DEFAULT TRUE,
    disallow_keyboard_patterns BOOLEAN DEFAULT TRUE,
    disallow_repeated_chars INTEGER DEFAULT 3,
    
    -- Multi-factor authentication requirements
    require_mfa BOOLEAN DEFAULT TRUE,
    mfa_grace_period_hours INTEGER DEFAULT 0,
    
    -- Policy scope
    applies_to_roles JSONB DEFAULT '[]'::JSONB, -- Array of role codes
    applies_to_user_types JSONB DEFAULT '[]'::JSONB, -- Array of user types
    
    -- Policy status
    is_active BOOLEAN DEFAULT TRUE,
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_until DATE,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id),
    
    CONSTRAINT ck_password_policy_lengths CHECK (min_length > 0 AND max_length >= min_length),
    CONSTRAINT ck_password_policy_history CHECK (password_history_count >= 0),
    CONSTRAINT ck_password_policy_age CHECK (max_age_days > 0 AND min_age_hours >= 0),
    CONSTRAINT ck_password_policy_lockout CHECK (max_failed_attempts > 0 AND lockout_duration_minutes > 0),
    CONSTRAINT ck_password_policy_repeated_chars CHECK (disallow_repeated_chars > 0),
    CONSTRAINT ck_password_policy_mfa_grace CHECK (mfa_grace_period_hours >= 0)
);

-- =============================================================================
-- PERFORMANCE INDEXES FOR AUTHENTICATION
-- =============================================================================

-- User table indexes for authentication performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);
CREATE INDEX IF NOT EXISTS idx_users_mfa_enabled ON users(mfa_enabled);
CREATE INDEX IF NOT EXISTS idx_users_failed_attempts ON users(failed_login_attempts);
CREATE INDEX IF NOT EXISTS idx_users_locked_until ON users(locked_until);

-- Session management indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_status ON user_sessions(status);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_device_fingerprint ON user_sessions(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_user_sessions_ip_address ON user_sessions(ip_address);

-- JWT token indexes
CREATE INDEX IF NOT EXISTS idx_jwt_tokens_hash ON jwt_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_jwt_tokens_user_id ON jwt_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_jwt_tokens_expires_at ON jwt_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_jwt_tokens_type ON jwt_tokens(token_type);
CREATE INDEX IF NOT EXISTS idx_jwt_tokens_active ON jwt_tokens(is_active);

-- Role and permission indexes
CREATE INDEX IF NOT EXISTS idx_roles_code ON roles(role_code);
CREATE INDEX IF NOT EXISTS idx_roles_active ON roles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_effective ON user_roles(effective_from, effective_until);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(is_active);

-- MFA indexes
CREATE INDEX IF NOT EXISTS idx_mfa_methods_user_id ON mfa_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_methods_type ON mfa_methods(method_type);
CREATE INDEX IF NOT EXISTS idx_mfa_methods_active ON mfa_methods(is_active);
CREATE INDEX IF NOT EXISTS idx_mfa_verifications_user_id ON mfa_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_verifications_attempted_at ON mfa_verifications(attempted_at);

-- Authentication event indexes for security monitoring
CREATE INDEX IF NOT EXISTS idx_auth_events_user_id ON auth_events(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_events_type ON auth_events(event_type);
CREATE INDEX IF NOT EXISTS idx_auth_events_timestamp ON auth_events(event_timestamp);
CREATE INDEX IF NOT EXISTS idx_auth_events_ip_address ON auth_events(ip_address);
CREATE INDEX IF NOT EXISTS idx_auth_events_suspicious ON auth_events(is_suspicious);
CREATE INDEX IF NOT EXISTS idx_auth_events_risk_score ON auth_events(risk_score);

-- Security monitoring compound indexes
CREATE INDEX IF NOT EXISTS idx_auth_events_user_time ON auth_events(user_id, event_timestamp);
CREATE INDEX IF NOT EXISTS idx_auth_events_ip_time ON auth_events(ip_address, event_timestamp);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_activity ON user_sessions(user_id, last_activity);

-- =============================================================================
-- SECURITY TRIGGERS AND FUNCTIONS
-- =============================================================================

-- Function to automatically lock user accounts after failed attempts
CREATE OR REPLACE FUNCTION handle_failed_login()
RETURNS TRIGGER AS $$
DECLARE
    lockout_duration INTERVAL;
BEGIN
    -- Progressive lockout: increase duration based on lockout count
    lockout_duration := INTERVAL '15 minutes' * POWER(2, NEW.lockout_count);
    
    -- Cap maximum lockout at 24 hours
    IF lockout_duration > INTERVAL '24 hours' THEN
        lockout_duration := INTERVAL '24 hours';
    END IF;
    
    -- Lock account if failed attempts exceed threshold
    IF NEW.failed_login_attempts >= 5 THEN
        NEW.locked_until := CURRENT_TIMESTAMP + lockout_duration;
        NEW.lockout_count := NEW.lockout_count + 1;
        NEW.status := 'LOCKED';
        
        -- Log security event
        INSERT INTO auth_events (
            event_type,
            event_category,
            event_severity,
            user_id,
            ip_address,
            event_data,
            is_suspicious,
            risk_score
        ) VALUES (
            'ACCOUNT_LOCKED',
            'SECURITY',
            'WARN',
            NEW.id,
            NEW.last_login_ip,
            jsonb_build_object(
                'failed_attempts', NEW.failed_login_attempts,
                'lockout_count', NEW.lockout_count,
                'lockout_duration_minutes', EXTRACT(EPOCH FROM lockout_duration) / 60
            ),
            TRUE,
            75
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for failed login handling
CREATE TRIGGER trigger_handle_failed_login
    BEFORE UPDATE ON users
    FOR EACH ROW
    WHEN (NEW.failed_login_attempts > OLD.failed_login_attempts)
    EXECUTE FUNCTION handle_failed_login();

-- Function to clean up expired sessions and tokens
CREATE OR REPLACE FUNCTION cleanup_expired_auth_data()
RETURNS void AS $$
BEGIN
    -- Clean up expired sessions
    UPDATE user_sessions 
    SET status = 'EXPIRED', 
        terminated_at = CURRENT_TIMESTAMP,
        termination_reason = 'AUTOMATIC_EXPIRATION'
    WHERE expires_at < CURRENT_TIMESTAMP 
    AND status = 'ACTIVE';
    
    -- Clean up expired JWT tokens
    UPDATE jwt_tokens 
    SET is_active = FALSE,
        revoked_at = CURRENT_TIMESTAMP,
        revocation_reason = 'TOKEN_EXPIRED'
    WHERE expires_at < CURRENT_TIMESTAMP 
    AND is_active = TRUE;
    
    -- Clean up old auth events (keep for compliance period)
    DELETE FROM auth_events 
    WHERE event_timestamp < CURRENT_TIMESTAMP - INTERVAL '7 years'
    AND 'GDPR' != ALL(SELECT jsonb_array_elements_text(compliance_tags));
    
    -- Log cleanup operation
    INSERT INTO auth_events (
        event_type,
        event_category,
        event_data
    ) VALUES (
        'AUTH_DATA_CLEANUP',
        'COMPLIANCE',
        jsonb_build_object(
            'cleanup_timestamp', CURRENT_TIMESTAMP,
            'action', 'EXPIRED_DATA_CLEANUP'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- INITIAL AUTHENTICATION DATA
-- =============================================================================

-- Insert default password policy
INSERT INTO password_policies (
    policy_name,
    min_length,
    require_uppercase,
    require_lowercase,
    require_numbers,
    require_special_chars,
    password_history_count,
    max_age_days,
    max_failed_attempts,
    lockout_duration_minutes,
    require_mfa,
    is_active
) VALUES (
    'RHY_DEFAULT_POLICY',
    12,
    true,
    true,
    true,
    true,
    12,
    90,
    5,
    15,
    true,
    true
) ON CONFLICT (policy_name) DO NOTHING;

-- Insert default security roles
INSERT INTO roles (role_code, role_name, description, permissions, data_access_level, compliance_level) VALUES
('SYS_ADMIN', 'System Administrator', 'Full system administration access', '["*"]', 10, 'CRITICAL'),
('SEC_ADMIN', 'Security Administrator', 'Security and compliance administration', '["SECURITY_*", "AUDIT_*", "USER_MANAGE"]', 9, 'CRITICAL'),
('SUP_ADMIN', 'Supplier Administrator', 'Supplier portal administration', '["SUPPLIER_*", "ORDER_*", "INVENTORY_VIEW"]', 7, 'ELEVATED'),
('SUP_USER', 'Supplier User', 'Standard supplier portal access', '["SUPPLIER_VIEW", "ORDER_CREATE", "INVENTORY_VIEW"]', 5, 'STANDARD'),
('SUP_VIEWER', 'Supplier Viewer', 'Read-only supplier portal access', '["SUPPLIER_VIEW", "ORDER_VIEW"]', 3, 'STANDARD')
ON CONFLICT (role_code) DO NOTHING;

-- Insert default security rules
INSERT INTO security_rules (
    rule_name,
    rule_type,
    conditions,
    actions,
    severity_level,
    description
) VALUES
(
    'RAPID_LOGIN_ATTEMPTS',
    'RATE_LIMIT',
    '{"max_attempts": 5, "time_window": 300, "scope": "ip_address"}',
    '{"block_ip": true, "duration": 900, "notify_security": true}',
    'HIGH',
    'Block IP addresses with more than 5 login attempts in 5 minutes'
),
(
    'SUSPICIOUS_LOCATION',
    'GEOFENCE',
    '{"check_previous_locations": true, "max_distance_km": 1000, "time_threshold": 3600}',
    '{"require_mfa": true, "notify_user": true, "log_event": true}',
    'MEDIUM',
    'Require additional verification for logins from unusual locations'
),
(
    'UNTRUSTED_DEVICE',
    'DEVICE_TRUST',
    '{"require_device_trust": true, "new_device_grace_period": 0}',
    '{"require_mfa": true, "require_email_verification": true}',
    'MEDIUM',
    'Require MFA and email verification for new devices'
)
ON CONFLICT (rule_name) DO NOTHING;

-- Record migration completion
INSERT INTO migration_history (migration_name, version_number, executed_at, success, applied_by) VALUES
('002_auth_tables.sql', 2, CURRENT_TIMESTAMP, true, 'system')
ON CONFLICT (migration_name) DO NOTHING;

-- Set up session cleanup job (would typically be handled by external scheduler)
-- This creates a record for external job scheduler to pick up
INSERT INTO system_config (key_name, key_value, description) VALUES
('AUTH_CLEANUP_SCHEDULE', '0 2 * * *', 'Cron schedule for authentication data cleanup (daily at 2 AM)'),
('SESSION_TIMEOUT_SECONDS', '28800', 'Session timeout in seconds (8 hours)'),
('JWT_ACCESS_TOKEN_TTL', '3600', 'JWT access token TTL in seconds (1 hour)'),
('JWT_REFRESH_TOKEN_TTL', '604800', 'JWT refresh token TTL in seconds (7 days)'),
('MFA_SETUP_GRACE_PERIOD', '168', 'MFA setup grace period in hours (7 days)'),
('SUSPICIOUS_LOGIN_THRESHOLD', '75', 'Risk score threshold for suspicious login detection')
ON CONFLICT (key_name) DO NOTHING;

-- Migration completed successfully
SELECT 'Migration 002_auth_tables.sql completed successfully' as result;