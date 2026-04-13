-- =============================================
-- ELFAKHER - Orders Tables
-- الطلبات والتخصيصات
-- =============================================

-- =============================================
-- جدول الطلبات الرئيسي
-- =============================================
CREATE TABLE orders.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- رقم الطلب (للعرض)
    order_number VARCHAR(20) UNIQUE NOT NULL,
    
    -- العميل
    customer_id UUID REFERENCES core.users(id),
    
    -- معلومات العميل (نسخة للحفظ)
    customer_name VARCHAR(100) NOT NULL,
    customer_phone core.algerian_phone NOT NULL,
    customer_email core.email,
    
    -- عنوان التوصيل
    shipping_address core.address_type NOT NULL,
    wilaya_id UUID NOT NULL, -- REFERENCES shipping.wilayas
    
    -- الأسعار
    subtotal core.price NOT NULL,
    shipping_cost core.price DEFAULT 0,
    discount_amount core.price DEFAULT 0,
    total_amount core.price NOT NULL,
    
    -- الكود الترويجي
    coupon_code VARCHAR(50),
    
    -- الحالة
    status orders.order_status DEFAULT 'pending',
    
    -- ملاحظات
    customer_notes TEXT,
    admin_notes TEXT,
    
    -- معلومات الشحن
    estimated_delivery DATE,
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    
    -- معلومات الإلغاء/الإرجاع
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    
    -- مصدر الطلب
    source VARCHAR(50) DEFAULT 'website', -- website, whatsapp, phone
    
    -- بيانات إضافية
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- فهارس
CREATE INDEX idx_orders_number ON orders.orders(order_number);
CREATE INDEX idx_orders_customer ON orders.orders(customer_id);
CREATE INDEX idx_orders_phone ON orders.orders(customer_phone);
CREATE INDEX idx_orders_status ON orders.orders(status);
CREATE INDEX idx_orders_wilaya ON orders.orders(wilaya_id);
CREATE INDEX idx_orders_created ON orders.orders(created_at DESC);

-- =============================================
-- جدول عناصر الطلب
-- =============================================
CREATE TABLE orders.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders.orders(id) ON DELETE CASCADE,
    
    -- المنتج
    product_id UUID NOT NULL REFERENCES catalog.products(id),
    product_name VARCHAR(200) NOT NULL, -- نسخة للحفظ
    product_sku VARCHAR(50),
    
    -- الخيارات المختارة
    fabric_id UUID REFERENCES catalog.fabrics(id),
    fabric_name VARCHAR(100),
    
    color_id UUID REFERENCES catalog.colors(id),
    color_name VARCHAR(50),
    
    size_id UUID REFERENCES catalog.standard_sizes(id),
    size_number INTEGER,
    
    -- الكمية والسعر
    quantity core.quantity NOT NULL DEFAULT 1,
    unit_price core.price NOT NULL,
    
    -- أسعار التخصيص الإضافية
    customization_price core.price DEFAULT 0,
    
    -- الإجمالي
    total_price core.price NOT NULL,
    
    -- هل يوجد تخصيص؟
    has_custom_measurements BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_items_order ON orders.order_items(order_id);
CREATE INDEX idx_order_items_product ON orders.order_items(product_id);

-- =============================================
-- جدول تخصيصات الطلب
-- =============================================
CREATE TABLE orders.order_customizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_item_id UUID NOT NULL REFERENCES orders.order_items(id) ON DELETE CASCADE,
    
    -- نوع الكول
    collar_type_id UUID REFERENCES catalog.collar_types(id),
    collar_name VARCHAR(100),
    collar_price core.price DEFAULT 0,
    
    -- نوع الأكمام
    sleeve_type_id UUID REFERENCES catalog.sleeve_types(id),
    sleeve_name VARCHAR(100),
    sleeve_price core.price DEFAULT 0,
    
    -- نوع الكبسة
    button_type_id UUID REFERENCES catalog.button_types(id),
    button_name VARCHAR(100),
    button_price core.price DEFAULT 0,
    
    -- المقاسات المخصصة (إن وجدت)
    custom_measurements core.measurements_type,
    
    -- ملاحظات التفصيل
    tailoring_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customizations_item ON orders.order_customizations(order_item_id);

-- =============================================
-- جدول تاريخ حالة الطلب
-- =============================================
CREATE TABLE orders.order_status_history (
    id BIGSERIAL PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders.orders(id) ON DELETE CASCADE,
    
    old_status orders.order_status,
    new_status orders.order_status NOT NULL,
    
    changed_by UUID REFERENCES core.users(id),
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_status_history_order ON orders.order_status_history(order_id);

-- =============================================
-- Function لتوليد رقم الطلب
-- =============================================
CREATE OR REPLACE FUNCTION orders.generate_order_number()
RETURNS TEXT AS $$
DECLARE
    today_count INTEGER;
    order_num TEXT;
BEGIN
    -- عدد الطلبات اليوم
    SELECT COUNT(*) + 1 INTO today_count
    FROM orders.orders
    WHERE DATE(created_at) = CURRENT_DATE;
    
    -- تنسيق: ORD-YYMMDD-XXX
    order_num := 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYMMDD') || '-' || LPAD(today_count::TEXT, 3, '0');
    
    RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Trigger لتوليد رقم الطلب تلقائياً
-- =============================================
CREATE OR REPLACE FUNCTION orders.set_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL THEN
        NEW.order_number := orders.generate_order_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_order_number
    BEFORE INSERT ON orders.orders
    FOR EACH ROW EXECUTE FUNCTION orders.set_order_number();

-- =============================================
-- Trigger لتسجيل تغيير حالة الطلب
-- =============================================
CREATE OR REPLACE FUNCTION orders.log_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO orders.order_status_history (order_id, old_status, new_status)
        VALUES (NEW.id, OLD.status, NEW.status);
    END IF;
    NEW.updated_at := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_order_status
    BEFORE UPDATE ON orders.orders
    FOR EACH ROW EXECUTE FUNCTION orders.log_status_change();

-- =============================================
-- Trigger لتحديث إحصائيات المنتج
-- =============================================
CREATE OR REPLACE FUNCTION orders.update_product_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE catalog.products
    SET order_count = order_count + NEW.quantity
    WHERE id = NEW.product_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_order_count
    AFTER INSERT ON orders.order_items
    FOR EACH ROW EXECUTE FUNCTION orders.update_product_stats();

-- =============================================
-- Trigger لتحديث إحصائيات العميل
-- =============================================
CREATE OR REPLACE FUNCTION orders.update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
        UPDATE core.users
        SET 
            total_orders = total_orders + 1,
            total_spent = total_spent + NEW.total_amount
        WHERE id = NEW.customer_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customer_order_stats
    AFTER UPDATE ON orders.orders
    FOR EACH ROW EXECUTE FUNCTION orders.update_customer_stats();
