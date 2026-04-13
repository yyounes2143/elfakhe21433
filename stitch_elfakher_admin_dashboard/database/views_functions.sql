-- =============================================
-- ELFAKHER - Views و Functions
-- طرق العرض والدوال
-- =============================================

-- =============================================
-- VIEWS - طرق العرض
-- =============================================

-- عرض المنتجات مع حالة المخزون
CREATE OR REPLACE VIEW catalog.v_products_with_stock AS
SELECT 
    p.id,
    p.name_ar,
    p.name_en,
    p.slug,
    p.sku,
    p.base_price,
    p.sale_price,
    p.status,
    p.category_id,
    c.name_ar as category_name,
    p.is_featured,
    p.order_count,
    p.images,
    COALESCE(SUM(i.quantity), 0) as total_stock,
    CASE 
        WHEN COALESCE(SUM(i.quantity), 0) = 0 THEN 'out_of_stock'
        WHEN COALESCE(SUM(i.quantity), 0) < 10 THEN 'low_stock'
        ELSE 'in_stock'
    END as stock_status,
    p.created_at,
    p.updated_at
FROM catalog.products p
LEFT JOIN catalog.categories c ON p.category_id = c.id
LEFT JOIN catalog.inventory i ON p.id = i.product_id
GROUP BY p.id, c.name_ar;

-- عرض ملخص الطلبات
CREATE OR REPLACE VIEW orders.v_orders_summary AS
SELECT 
    o.id,
    o.order_number,
    o.customer_name,
    o.customer_phone,
    o.status,
    o.total_amount,
    o.shipping_cost,
    w.name_ar as wilaya_name,
    w.code as wilaya_code,
    COUNT(oi.id) as items_count,
    SUM(oi.quantity) as total_items,
    o.source,
    o.created_at,
    o.updated_at,
    EXTRACT(DAY FROM (CURRENT_TIMESTAMP - o.created_at)) as days_since_order
FROM orders.orders o
LEFT JOIN orders.order_items oi ON o.id = oi.order_id
LEFT JOIN shipping.wilayas w ON o.wilaya_id = w.id
GROUP BY o.id, w.name_ar, w.code;

-- عرض إحصائيات العملاء
CREATE OR REPLACE VIEW core.v_customer_stats AS
SELECT 
    u.id,
    u.first_name || ' ' || u.last_name as full_name,
    u.phone,
    u.email,
    u.total_orders,
    u.total_spent,
    CASE 
        WHEN u.total_orders >= 5 THEN 'VIP'
        WHEN u.total_orders >= 3 THEN 'متكرر'
        ELSE 'جديد'
    END as customer_tier,
    (SELECT MAX(created_at) FROM orders.orders WHERE customer_id = u.id) as last_order_date,
    u.created_at as registered_at
FROM core.users u
WHERE u.role = 'customer'
ORDER BY u.total_spent DESC;

-- عرض المنتجات الأكثر مبيعاً
CREATE OR REPLACE VIEW catalog.v_bestsellers AS
SELECT 
    p.id,
    p.name_ar,
    p.base_price,
    p.sale_price,
    p.images,
    p.order_count,
    c.name_ar as category_name
FROM catalog.products p
LEFT JOIN catalog.categories c ON p.category_id = c.id
WHERE p.status = 'active'
ORDER BY p.order_count DESC
LIMIT 10;

-- عرض الطلبات المعلقة
CREATE OR REPLACE VIEW orders.v_pending_orders AS
SELECT 
    o.order_number,
    o.customer_name,
    o.customer_phone,
    o.total_amount,
    w.name_ar as wilaya_name,
    o.status,
    o.created_at,
    EXTRACT(HOUR FROM (CURRENT_TIMESTAMP - o.created_at)) as hours_pending
FROM orders.orders o
LEFT JOIN shipping.wilayas w ON o.wilaya_id = w.id
WHERE o.status IN ('pending', 'confirmed')
ORDER BY o.created_at ASC;

-- عرض إحصائيات المبيعات اليومية
CREATE OR REPLACE VIEW orders.v_daily_sales AS
SELECT 
    DATE(created_at) as sale_date,
    COUNT(*) as orders_count,
    SUM(total_amount) as total_sales,
    AVG(total_amount) as avg_order_value,
    COUNT(*) FILTER (WHERE status = 'delivered') as delivered_count,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count
FROM orders.orders
GROUP BY DATE(created_at)
ORDER BY sale_date DESC;

-- =============================================
-- FUNCTIONS - الدوال
-- =============================================

-- دالة حساب إجمالي الطلب
CREATE OR REPLACE FUNCTION orders.calculate_order_total(p_order_id UUID)
RETURNS TABLE(subtotal DECIMAL, shipping DECIMAL, discount DECIMAL, total DECIMAL) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(oi.total_price), 0) as subtotal,
        o.shipping_cost as shipping,
        o.discount_amount as discount,
        COALESCE(SUM(oi.total_price), 0) + o.shipping_cost - o.discount_amount as total
    FROM orders.orders o
    LEFT JOIN orders.order_items oi ON o.id = oi.order_id
    WHERE o.id = p_order_id
    GROUP BY o.id;
END;
$$ LANGUAGE plpgsql;

-- دالة فحص توفر المخزون
CREATE OR REPLACE FUNCTION catalog.check_stock_availability(
    p_product_id UUID,
    p_fabric_id UUID DEFAULT NULL,
    p_color_id UUID DEFAULT NULL,
    p_size_id UUID DEFAULT NULL,
    p_quantity INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
    v_available INTEGER;
BEGIN
    SELECT COALESCE(SUM(quantity - reserved_quantity), 0)
    INTO v_available
    FROM catalog.inventory
    WHERE product_id = p_product_id
      AND (p_fabric_id IS NULL OR fabric_id = p_fabric_id)
      AND (p_color_id IS NULL OR color_id = p_color_id)
      AND (p_size_id IS NULL OR size_id = p_size_id);
    
    RETURN v_available >= p_quantity;
END;
$$ LANGUAGE plpgsql;

-- دالة حجز المخزون عند الطلب
CREATE OR REPLACE FUNCTION catalog.reserve_stock(
    p_product_id UUID,
    p_fabric_id UUID,
    p_color_id UUID,
    p_size_id UUID,
    p_quantity INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE catalog.inventory
    SET reserved_quantity = reserved_quantity + p_quantity
    WHERE product_id = p_product_id
      AND (fabric_id = p_fabric_id OR (fabric_id IS NULL AND p_fabric_id IS NULL))
      AND (color_id = p_color_id OR (color_id IS NULL AND p_color_id IS NULL))
      AND (size_id = p_size_id OR (size_id IS NULL AND p_size_id IS NULL))
      AND (quantity - reserved_quantity) >= p_quantity;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- دالة إلغاء حجز المخزون
CREATE OR REPLACE FUNCTION catalog.release_stock(
    p_product_id UUID,
    p_fabric_id UUID,
    p_color_id UUID,
    p_size_id UUID,
    p_quantity INTEGER
)
RETURNS VOID AS $$
BEGIN
    UPDATE catalog.inventory
    SET reserved_quantity = GREATEST(0, reserved_quantity - p_quantity)
    WHERE product_id = p_product_id
      AND (fabric_id = p_fabric_id OR (fabric_id IS NULL AND p_fabric_id IS NULL))
      AND (color_id = p_color_id OR (color_id IS NULL AND p_color_id IS NULL))
      AND (size_id = p_size_id OR (size_id IS NULL AND p_size_id IS NULL));
END;
$$ LANGUAGE plpgsql;

-- دالة الحصول على إحصائيات لوحة التحكم
CREATE OR REPLACE FUNCTION core.get_dashboard_stats()
RETURNS TABLE(
    total_orders BIGINT,
    pending_orders BIGINT,
    total_revenue DECIMAL,
    monthly_revenue DECIMAL,
    total_customers BIGINT,
    new_customers_this_month BIGINT,
    low_stock_products BIGINT,
    out_of_stock_products BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM orders.orders)::BIGINT,
        (SELECT COUNT(*) FROM orders.orders WHERE status IN ('pending', 'confirmed'))::BIGINT,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders.orders WHERE status = 'delivered'),
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders.orders 
         WHERE status = 'delivered' AND created_at >= DATE_TRUNC('month', CURRENT_DATE)),
        (SELECT COUNT(*) FROM core.users WHERE role = 'customer')::BIGINT,
        (SELECT COUNT(*) FROM core.users 
         WHERE role = 'customer' AND created_at >= DATE_TRUNC('month', CURRENT_DATE))::BIGINT,
        (SELECT COUNT(DISTINCT product_id) FROM catalog.inventory WHERE stock_level = 'low_stock')::BIGINT,
        (SELECT COUNT(*) FROM catalog.products WHERE status = 'out_of_stock')::BIGINT;
END;
$$ LANGUAGE plpgsql;

-- دالة البحث في المنتجات
CREATE OR REPLACE FUNCTION catalog.search_products(p_search_term TEXT)
RETURNS TABLE(
    id UUID,
    name_ar VARCHAR,
    name_en VARCHAR,
    base_price DECIMAL,
    sale_price DECIMAL,
    images JSONB,
    category_name VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name_ar,
        p.name_en,
        p.base_price,
        p.sale_price,
        p.images,
        c.name_ar
    FROM catalog.products p
    LEFT JOIN catalog.categories c ON p.category_id = c.id
    WHERE p.status = 'active'
      AND (
          p.name_ar ILIKE '%' || p_search_term || '%'
          OR p.name_en ILIKE '%' || p_search_term || '%'
          OR p.short_description ILIKE '%' || p_search_term || '%'
      )
    ORDER BY p.order_count DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;
