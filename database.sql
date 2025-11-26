-- ============================
-- DATABASE STRUCTURE (CLEAN)
-- ============================

-- ===================== USERS =====================
CREATE TABLE IF NOT EXISTS users_t (
    user_uid BIGINT GENERATED ALWAYS AS IDENTITY (START WITH 1000000000 INCREMENT BY 1),
    email_id VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    contact_number VARCHAR(15),
    alternate_contact_number VARCHAR(20),
    mailing_address TEXT,
    billing_address TEXT,
    tin_number VARCHAR(50),
    status VARCHAR(50) DEFAULT 'registered',
    active_status BOOLEAN DEFAULT FALSE,
    activation_token VARCHAR(255),
    service_type SMALLINT NOT NULL CHECK (service_type IN (0, 1)), -- 0=Provider,1=Company
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_uid)
);

-- ===================== PROVIDERS =====================
CREATE TABLE IF NOT EXISTS providers_t (
    provider_id BIGINT GENERATED ALWAYS AS IDENTITY (START WITH 1000000000 INCREMENT BY 1),
    user_uid BIGINT NOT NULL UNIQUE REFERENCES users_t(user_uid) ON DELETE CASCADE,
    profile_pic BYTEA,
    id_type VARCHAR(50),
    id_number TEXT,
    authorized_certificate BYTEA,
    reset_token VARCHAR(255),
    reset_expiry TIMESTAMP NULL,
    PRIMARY KEY (provider_id)
);

-- ===================== PROVIDER BANK =====================
CREATE TABLE IF NOT EXISTS providers_bank_details_t (
    provider_bank_id BIGINT GENERATED ALWAYS AS IDENTITY (START WITH 1000000000 INCREMENT BY 1),
    provider_id BIGINT NOT NULL REFERENCES providers_t(provider_id) ON DELETE CASCADE,
    swift_code TEXT,
    bank_account_number TEXT,
    bank_name VARCHAR(100),
    bank_statement BYTEA,
    account_holder_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (provider_bank_id)
);

-- ===================== ADMINS =====================
CREATE TABLE IF NOT EXISTS admins_t (
    admin_id BIGINT GENERATED ALWAYS AS IDENTITY (START WITH 1000000000 INCREMENT BY 1),
    name VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (admin_id)
);

-- ===================== OTP =====================
CREATE TABLE IF NOT EXISTS otp_codes_t (
    otp_id BIGINT GENERATED ALWAYS AS IDENTITY (START WITH 1000000000 INCREMENT BY 1),
    email_id VARCHAR(255) NOT NULL,
    otp_code CHAR(6) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (otp_id)
);

-- ===================== ADMIN MESSAGES =====================
CREATE TABLE IF NOT EXISTS admin_messages_t (
    message_id BIGINT GENERATED ALWAYS AS IDENTITY (START WITH 1000000000 INCREMENT BY 1),
    email_id VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) DEFAULT 'message',
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (message_id)
);

-- ===================== COMPANY =====================
CREATE TABLE IF NOT EXISTS company_details_t (
    company_id BIGINT GENERATED ALWAYS AS IDENTITY (START WITH 1000000000 INCREMENT BY 1),
    user_uid BIGINT NOT NULL UNIQUE REFERENCES users_t(user_uid) ON DELETE CASCADE,
    company_name VARCHAR(255),
    brn_number VARCHAR(50),
    logo_path BYTEA,
    certificate_path BYTEA,
    status VARCHAR(50) DEFAULT 'registered',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (company_id)
);

-- ===================== COMPANY BANK =====================
CREATE TABLE IF NOT EXISTS company_bank_details_t (
    company_bank_id BIGINT GENERATED ALWAYS AS IDENTITY (START WITH 1000000000 INCREMENT BY 1),
    company_id BIGINT NOT NULL UNIQUE REFERENCES company_details_t(company_id) ON DELETE CASCADE,
    swift_code TEXT,
    holder_name VARCHAR(100),
    bank_name VARCHAR(100),
    bank_statement BYTEA,
    account_number TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (company_bank_id)
);

-- ===================== COMPANY MESSAGES =====================
CREATE TABLE IF NOT EXISTS company_messages_t (
    company_message_id BIGINT GENERATED ALWAYS AS IDENTITY (START WITH 1000000000 INCREMENT BY 1),
    email_id VARCHAR(255),
    message TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (company_message_id)
);

-- ===================== SERVICES =====================
CREATE TABLE IF NOT EXISTS services_t (
    service_id BIGINT GENERATED ALWAYS AS IDENTITY (START WITH 1000000000 INCREMENT BY 1),
    user_uid BIGINT NOT NULL REFERENCES users_t(user_uid) ON DELETE CASCADE,
    service_type SMALLINT NOT NULL CHECK (service_type IN (0, 1)),
    service_name VARCHAR(255) NOT NULL,
    service_rate NUMERIC(10,2) NOT NULL,
    region VARCHAR(100),
    state VARCHAR(100),
    city VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (service_id)
);

-- ===================== WORKORDER AREA =====================
CREATE TABLE IF NOT EXISTS workorder_area_t
(
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    workorder_area VARCHAR(255),
    workorder_area_id INTEGER,
    status VARCHAR(255)
);

-- ===================== WORKORDER TYPE =====================
CREATE TABLE IF NOT EXISTS workorder_type_t
(
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    workorder_type VARCHAR(255),
    workordertype_id INTEGER,
    status VARCHAR(255)
);

-- ===================== WORKORDER =====================
CREATE TABLE IF NOT EXISTS workorder_t
(
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    workorder VARCHAR(255),
    workorder_type VARCHAR(255),
    workorder_area VARCHAR(255),
    created_t TIMESTAMPTZ,
    requested_time_closing TIMESTAMPTZ,
    remarks VARCHAR(255),
    status VARCHAR(255),
    rate JSON DEFAULT '{"type_rates": {}, "total_rate": 0.0}',
    parent_workorder VARCHAR(255),
    image JSONB,
    closing_images JSONB,
    admin VARCHAR(100),
    ticket_assignment_type VARCHAR(100)
);

-- ===================== WORKORDER MAPPING =====================
CREATE TABLE IF NOT EXISTS workorder_mapping_t
(
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    parent_workorder VARCHAR(255),
    child_workorder VARCHAR(255),
    created_at TIMESTAMPTZ
);

-- ===================== WORKORDER LIFE CYCLE =====================
CREATE TABLE IF NOT EXISTS workorder_life_cycle_t
(
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    workorder VARCHAR(255),
    workorder_type VARCHAR(255),
    workorder_area VARCHAR(255),
    created_t TIMESTAMPTZ,
    requested_time_closing TIMESTAMPTZ,
    remarks VARCHAR(255),
    status VARCHAR(255),
    contractor_name VARCHAR(255),
    contractor_id VARCHAR(255),
    contractor_remarks VARCHAR(255)
);

-- ===================== STANDARD RATES =====================

CREATE TABLE IF NOT EXISTS standard_rates_t (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    source_row_number    INTEGER,
    client               VARCHAR(255),
    trade                VARCHAR(255),
    category_item        VARCHAR(255),
    equipment_type       VARCHAR(255),
    sub_type             VARCHAR(255),
    brand                VARCHAR(255),
    description          TEXT,
    unit                 VARCHAR(50),
    copper_pipe_price    TEXT,
    price_rm             NUMERIC(14,2),
    extra_col            TEXT,
    created_at           TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at           TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- 🔥 Unique constraint part of table definition
    CONSTRAINT standard_rates_unique_constraint
    UNIQUE (trade, category_item, equipment_type, description, unit)
);


CREATE UNIQUE INDEX IF NOT EXISTS unique_sor_line_idx
ON standard_rates_t (
    lower(trim(trade)),
    lower(trim(category_item)),
    lower(trim(coalesce(equipment_type, ''))),
    lower(trim(description)),
    lower(trim(unit))
);


-- ===================== INDEXES =====================
CREATE INDEX IF NOT EXISTS idx_user_email ON users_t(email_id);
CREATE INDEX IF NOT EXISTS idx_provider_useruid ON providers_t(user_uid);
CREATE INDEX IF NOT EXISTS idx_company_useruid ON company_details_t(user_uid);
CREATE INDEX IF NOT EXISTS idx_services_user ON services_t(user_uid);
