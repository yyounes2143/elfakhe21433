-- =============================================
-- ELFAKHER Fabrics - Database Schema
-- PostgreSQL ORDBMS Implementation
-- =============================================

-- إنشاء الـ Schemas
CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS catalog;
CREATE SCHEMA IF NOT EXISTS orders;
CREATE SCHEMA IF NOT EXISTS shipping;

-- =============================================
-- CUSTOM TYPES (أنواع مخصصة)
-- =============================================

-- نوع العنوان المركب
CREATE TYPE core.address_type AS (
    street VARCHAR(255),
    city VARCHAR(100),
    wilaya_code CHAR(2),
    postal_code VARCHAR(10),
    notes TEXT
);

-- نوع المقاسات المركب
CREATE TYPE core.measurements_type AS (
    full_length DECIMAL(5,2),      -- الطول الكامل
    chest DECIMAL(5,2),            -- محيط الصدر
    shoulder_width DECIMAL(5,2),   -- عرض الكتف
    sleeve_length DECIMAL(5,2),    -- طول الكم
    neck DECIMAL(5,2),             -- محيط الرقبة
    wrist DECIMAL(5,2)             -- محيط المعصم
);

-- نوع حالة الطلب
CREATE TYPE orders.order_status AS ENUM (
    'pending',      -- قيد الانتظار
    'confirmed',    -- تم التأكيد
    'shipped',      -- تم الشحن
    'delivered',    -- تم التسليم
    'cancelled',    -- ملغي
    'returned'      -- مرتجع
);

-- نوع دور المستخدم
CREATE TYPE core.user_role AS ENUM (
    'customer',     -- زبون
    'admin',        -- مدير
    'super_admin'   -- مدير عام
);

-- نوع حالة المنتج
CREATE TYPE catalog.product_status AS ENUM (
    'active',       -- نشط
    'draft',        -- مسودة
    'out_of_stock', -- نفذ المخزون
    'archived'      -- مؤرشف
);

-- نوع مستوى المخزون
CREATE TYPE catalog.stock_level AS ENUM (
    'in_stock',     -- متوفر
    'low_stock',    -- مخزون منخفض
    'out_of_stock'  -- نفذ
);

-- =============================================
-- DOMAINS (قيود مخصصة)
-- =============================================

-- رقم الهاتف الجزائري
CREATE DOMAIN core.algerian_phone AS VARCHAR(15)
    CHECK (VALUE ~ '^0[5-7][0-9]{8}$');

-- البريد الإلكتروني
CREATE DOMAIN core.email AS VARCHAR(255)
    CHECK (VALUE ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- السعر (موجب)
CREATE DOMAIN core.price AS DECIMAL(12,2)
    CHECK (VALUE >= 0);

-- الكمية (موجبة)
CREATE DOMAIN core.quantity AS INTEGER
    CHECK (VALUE >= 0);

-- =============================================
-- EXTENSIONS
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- تعليق: سيتم إنشاء الجداول في ملفات منفصلة
-- =============================================
