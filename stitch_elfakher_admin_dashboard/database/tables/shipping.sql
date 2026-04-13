-- =============================================
-- ELFAKHER - Shipping Tables
-- الشحن والولايات
-- =============================================

-- =============================================
-- جدول الولايات الجزائرية (58 ولاية)
-- =============================================
CREATE TABLE shipping.wilayas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    code CHAR(2) UNIQUE NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    name_fr VARCHAR(100),
    name_en VARCHAR(100),
    
    -- منطقة الشحن
    zone_id UUID, -- REFERENCES shipping.zones
    
    -- رسوم التوصيل
    shipping_cost core.price DEFAULT 0,
    free_shipping_available BOOLEAN DEFAULT true,
    
    -- أيام التوصيل المتوقعة
    delivery_days_min INTEGER DEFAULT 2,
    delivery_days_max INTEGER DEFAULT 5,
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_wilayas_code ON shipping.wilayas(code);

-- =============================================
-- جدول مناطق الشحن
-- =============================================
CREATE TABLE shipping.zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    
    -- رسوم الشحن الافتراضية للمنطقة
    base_shipping_cost core.price DEFAULT 0,
    
    -- أيام التوصيل
    delivery_days_min INTEGER DEFAULT 2,
    delivery_days_max INTEGER DEFAULT 7,
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- مناطق الشحن
INSERT INTO shipping.zones (id, name, name_ar, base_shipping_cost, delivery_days_min, delivery_days_max) VALUES
('a1111111-1111-1111-1111-111111111111'::uuid, 'Zone 1 - Capital', 'المنطقة 1 - العاصمة', 500, 1, 2),
('a2222222-2222-2222-2222-222222222222'::uuid, 'Zone 2 - Central', 'المنطقة 2 - الوسط', 800, 2, 4),
('a3333333-3333-3333-3333-333333333333'::uuid, 'Zone 3 - East', 'المنطقة 3 - الشرق', 1000, 3, 5),
('a4444444-4444-4444-4444-444444444444'::uuid, 'Zone 4 - West', 'المنطقة 4 - الغرب', 1000, 3, 5),
('a5555555-5555-5555-5555-555555555555'::uuid, 'Zone 5 - South', 'المنطقة 5 - الجنوب', 1500, 5, 10);

-- إضافة Foreign Key بعد إنشاء جدول المناطق
ALTER TABLE shipping.wilayas 
    ADD CONSTRAINT fk_wilaya_zone 
    FOREIGN KEY (zone_id) REFERENCES shipping.zones(id);

-- إضافة Foreign Key للطلبات
ALTER TABLE orders.orders
    ADD CONSTRAINT fk_order_wilaya
    FOREIGN KEY (wilaya_id) REFERENCES shipping.wilayas(id);

-- =============================================
-- Function لحساب تكلفة الشحن
-- =============================================
CREATE OR REPLACE FUNCTION shipping.calculate_shipping_cost(
    p_wilaya_id UUID,
    p_order_subtotal DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
    v_shipping_cost DECIMAL;
    v_free_threshold DECIMAL;
    v_free_available BOOLEAN;
BEGIN
    -- الحصول على حد التوصيل المجاني
    SELECT (value)::decimal INTO v_free_threshold
    FROM core.settings WHERE key = 'free_shipping_threshold';
    
    -- الحصول على معلومات الولاية
    SELECT shipping_cost, free_shipping_available
    INTO v_shipping_cost, v_free_available
    FROM shipping.wilayas WHERE id = p_wilaya_id;
    
    -- إذا كان التوصيل المجاني متاح والمبلغ يتجاوز الحد
    IF v_free_available AND p_order_subtotal >= v_free_threshold THEN
        RETURN 0;
    END IF;
    
    RETURN COALESCE(v_shipping_cost, 0);
END;
$$ LANGUAGE plpgsql;
