-- =============================================
-- ELFAKHER - Core Tables
-- المستخدمين والإعدادات الأساسية
-- =============================================

-- =============================================
-- جدول المستخدمين (زبائن ومدراء)
-- =============================================
CREATE TABLE core.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- المعلومات الأساسية
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone core.algerian_phone NOT NULL UNIQUE,
    email core.email UNIQUE,
    
    -- كلمة المرور (للمدراء فقط)
    password_hash VARCHAR(255),
    
    -- الدور
    role core.user_role DEFAULT 'customer',
    
    -- حالة الحساب
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    
    -- إحصائيات
    total_orders INTEGER DEFAULT 0,
    total_spent core.price DEFAULT 0,
    
    -- الطوابع الزمنية
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    -- البيانات الإضافية (JSONB للمرونة)
    metadata JSONB DEFAULT '{}'::jsonb
);

-- فهارس للبحث السريع
CREATE INDEX idx_users_phone ON core.users(phone);
CREATE INDEX idx_users_email ON core.users(email);
CREATE INDEX idx_users_role ON core.users(role);
CREATE INDEX idx_users_created ON core.users(created_at DESC);

-- =============================================
-- جدول عناوين المستخدمين
-- =============================================
CREATE TABLE core.user_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    
    -- نوع العنوان
    label VARCHAR(50) DEFAULT 'المنزل',
    is_default BOOLEAN DEFAULT false,
    
    -- العنوان (نوع مركب)
    address core.address_type NOT NULL,
    
    -- الإحداثيات (اختياري)
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_addresses_user ON core.user_addresses(user_id);

-- =============================================
-- جدول المقاسات المحفوظة للزبائن
-- =============================================
CREATE TABLE core.user_measurements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    
    -- اسم المقاس
    label VARCHAR(50) DEFAULT 'مقاسي',
    is_default BOOLEAN DEFAULT false,
    
    -- المقاسات (نوع مركب)
    measurements core.measurements_type NOT NULL,
    
    -- ملاحظات
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_measurements_user ON core.user_measurements(user_id);

-- =============================================
-- جدول إعدادات النظام (Key-Value)
-- =============================================
CREATE TABLE core.settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES core.users(id)
);

-- إعدادات افتراضية
INSERT INTO core.settings (key, value, description, is_public) VALUES
('store_name', '"ELFAKHER Fabrics"', 'اسم المتجر', true),
('store_phone', '"+213555123456"', 'رقم الهاتف', true),
('store_email', '"contact@elfakher.dz"', 'البريد الإلكتروني', true),
('store_address', '"شارع الأمير عبد القادر، الجزائر"', 'العنوان', true),
('whatsapp_number', '"+213555123456"', 'رقم واتساب', true),
('free_shipping_threshold', '15000', 'حد التوصيل المجاني', true),
('is_store_open', 'true', 'حالة استقبال الطلبات', false),
('currency', '"DZD"', 'العملة', true),
('currency_symbol', '"دج"', 'رمز العملة', true);

-- =============================================
-- جدول سجل التدقيق (Audit Log)
-- =============================================
CREATE TABLE core.audit_log (
    id BIGSERIAL PRIMARY KEY,
    
    -- من قام بالتغيير
    user_id UUID REFERENCES core.users(id),
    user_ip INET,
    
    -- ما تم تغييره
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    action VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    
    -- البيانات
    old_data JSONB,
    new_data JSONB,
    
    -- التوقيت
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_table ON core.audit_log(table_name);
CREATE INDEX idx_audit_user ON core.audit_log(user_id);
CREATE INDEX idx_audit_created ON core.audit_log(created_at DESC);

-- =============================================
-- Trigger لتحديث updated_at تلقائياً
-- =============================================
CREATE OR REPLACE FUNCTION core.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تطبيق الـ trigger على الجداول
CREATE TRIGGER update_users_timestamp
    BEFORE UPDATE ON core.users
    FOR EACH ROW EXECUTE FUNCTION core.update_timestamp();

CREATE TRIGGER update_addresses_timestamp
    BEFORE UPDATE ON core.user_addresses
    FOR EACH ROW EXECUTE FUNCTION core.update_timestamp();

CREATE TRIGGER update_measurements_timestamp
    BEFORE UPDATE ON core.user_measurements
    FOR EACH ROW EXECUTE FUNCTION core.update_timestamp();
