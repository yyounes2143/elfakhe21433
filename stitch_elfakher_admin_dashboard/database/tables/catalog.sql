-- =============================================
-- ELFAKHER - Catalog Tables
-- المنتجات والأقمشة وخيارات التفصيل
-- =============================================

-- =============================================
-- جدول الفئات
-- =============================================
CREATE TABLE catalog.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    name_ar VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    slug VARCHAR(100) UNIQUE NOT NULL,
    
    description TEXT,
    image_url VARCHAR(500),
    
    -- التسلسل الهرمي
    parent_id UUID REFERENCES catalog.categories(id),
    sort_order INTEGER DEFAULT 0,
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- فئات افتراضية
INSERT INTO catalog.categories (name_ar, name_en, slug, sort_order) VALUES
('ثياب كلاسيكية', 'Classic Thobes', 'classic-thobes', 1),
('ثياب عصرية', 'Modern Thobes', 'modern-thobes', 2),
('ثياب مطرزة', 'Embroidered Thobes', 'embroidered-thobes', 3),
('ثياب أطفال', 'Kids Thobes', 'kids-thobes', 4),
('أقمشة', 'Fabrics', 'fabrics', 5);

-- =============================================
-- جدول الألوان
-- =============================================
CREATE TABLE catalog.colors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    name_ar VARCHAR(50) NOT NULL,
    name_en VARCHAR(50),
    hex_code CHAR(7) NOT NULL, -- #FFFFFF
    
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ألوان افتراضية
INSERT INTO catalog.colors (name_ar, name_en, hex_code, sort_order) VALUES
('أبيض', 'White', '#FFFFFF', 1),
('كحلي', 'Navy', '#1A232E', 2),
('أزرق', 'Blue', '#1E40AF', 3),
('رمادي', 'Grey', '#6B7280', 4),
('بني', 'Brown', '#7C2D12', 5),
('أخضر', 'Green', '#166534', 6),
('بيج', 'Beige', '#F5F5DC', 7),
('أسود', 'Black', '#000000', 8);

-- =============================================
-- جدول الأقمشة
-- =============================================
CREATE TABLE catalog.fabrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    
    -- المنشأ
    origin_country VARCHAR(50),
    origin_flag VARCHAR(10), -- emoji
    
    -- السعر والتكلفة
    price_per_meter core.price NOT NULL,
    cost_per_meter core.price,
    
    -- الوصف
    description TEXT,
    description_ar TEXT,
    
    -- الصور (مصفوفة JSONB)
    images JSONB DEFAULT '[]'::jsonb,
    
    -- خصائص القماش
    properties JSONB DEFAULT '{}'::jsonb,
    -- مثال: {"weight": "light", "season": "summer", "texture": "smooth"}
    
    -- المخزون
    stock_quantity core.quantity DEFAULT 0,
    stock_level catalog.stock_level DEFAULT 'in_stock',
    low_stock_threshold INTEGER DEFAULT 10,
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- أقمشة افتراضية
INSERT INTO catalog.fabrics (name, name_ar, slug, origin_country, origin_flag, price_per_meter) VALUES
('Toyobo Premium', 'تويوبو بريميوم', 'toyobo-premium', 'Japan', '🇯🇵', 850),
('English Wool', 'صوف إنجليزي', 'english-wool', 'England', '🇬🇧', 1200),
('Egyptian Cotton', 'قطن مصري', 'egyptian-cotton', 'Egypt', '🇪🇬', 950),
('French Linen', 'كتان فرنسي', 'french-linen', 'France', '🇫🇷', 1100),
('Italian Silk', 'حرير إيطالي', 'italian-silk', 'Italy', '🇮🇹', 1500);

-- =============================================
-- جدول أنواع الكول
-- =============================================
CREATE TABLE catalog.collar_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    name_ar VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    code VARCHAR(20) UNIQUE NOT NULL,
    
    description TEXT,
    image_url VARCHAR(500),
    
    -- السعر الإضافي
    additional_price core.price DEFAULT 0,
    
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- أنواع الكول الافتراضية
INSERT INTO catalog.collar_types (name_ar, name_en, code, additional_price, is_default, sort_order) VALUES
('كلاسيكي دائري', 'Classic Round', 'COL-CLASSIC', 0, true, 1),
('سعودي حاد', 'Saudi Sharp', 'COL-SAUDI', 500, false, 2),
('مفتوح بدون كول', 'Open No Collar', 'COL-OPEN', 0, false, 3);

-- =============================================
-- جدول أنواع الأكمام
-- =============================================
CREATE TABLE catalog.sleeve_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    name_ar VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    code VARCHAR(20) UNIQUE NOT NULL,
    
    description TEXT,
    image_url VARCHAR(500),
    
    additional_price core.price DEFAULT 0,
    
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- أنواع الأكمام الافتراضية
INSERT INTO catalog.sleeve_types (name_ar, name_en, code, additional_price, is_default, sort_order) VALUES
('سرسول مفتوح', 'Open Cuff', 'SLV-OPEN', 0, true, 1),
('قفلات بأزرار', 'Button Cuff', 'SLV-BUTTON', 800, false, 2),
('قفلات فرنسية', 'French Cuff', 'SLV-FRENCH', 1200, false, 3);

-- =============================================
-- جدول أنواع الكبسات
-- =============================================
CREATE TABLE catalog.button_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    name_ar VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    code VARCHAR(20) UNIQUE NOT NULL,
    
    description TEXT,
    image_url VARCHAR(500),
    
    additional_price core.price DEFAULT 0,
    
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- أنواع الكبسات الافتراضية
INSERT INTO catalog.button_types (name_ar, name_en, code, additional_price, is_default, sort_order) VALUES
('بدون كبسة', 'No Button', 'BTN-NONE', 0, true, 1),
('كبسة واحدة', 'Single Button', 'BTN-SINGLE', 300, false, 2),
('كبستين', 'Double Button', 'BTN-DOUBLE', 500, false, 3);

-- =============================================
-- جدول المقاسات القياسية
-- =============================================
CREATE TABLE catalog.standard_sizes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    size_number INTEGER NOT NULL UNIQUE, -- 52, 54, 56, etc.
    
    -- المقاسات المرجعية
    measurements core.measurements_type,
    
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- المقاسات القياسية
INSERT INTO catalog.standard_sizes (size_number, measurements, sort_order) VALUES
(52, ROW(140, 104, 46, 60, 38, 24)::core.measurements_type, 1),
(54, ROW(145, 108, 48, 62, 40, 25)::core.measurements_type, 2),
(56, ROW(150, 112, 50, 64, 42, 26)::core.measurements_type, 3),
(58, ROW(155, 116, 52, 66, 44, 27)::core.measurements_type, 4),
(60, ROW(160, 120, 54, 68, 46, 28)::core.measurements_type, 5),
(62, ROW(165, 124, 56, 70, 48, 29)::core.measurements_type, 6);

-- =============================================
-- جدول المنتجات (القميص)
-- =============================================
CREATE TABLE catalog.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- المعلومات الأساسية
    name_ar VARCHAR(200) NOT NULL,
    name_en VARCHAR(200),
    slug VARCHAR(200) UNIQUE NOT NULL,
    sku VARCHAR(50) UNIQUE,
    
    -- الفئة
    category_id UUID REFERENCES catalog.categories(id),
    
    -- الأسعار
    base_price core.price NOT NULL,
    sale_price core.price,
    cost_price core.price,
    
    -- الوصف
    short_description TEXT,
    full_description TEXT,
    
    -- الصور (مصفوفة)
    images JSONB DEFAULT '[]'::jsonb,
    -- مثال: [{"url": "...", "alt": "...", "is_primary": true}]
    
    -- الأقمشة المتاحة
    available_fabric_ids UUID[] DEFAULT '{}',
    
    -- الألوان المتاحة
    available_color_ids UUID[] DEFAULT '{}',
    
    -- المقاسات المتاحة
    available_size_ids UUID[] DEFAULT '{}',
    
    -- هل يسمح بالتخصيص
    allow_customization BOOLEAN DEFAULT true,
    
    -- الخصائص الإضافية
    attributes JSONB DEFAULT '{}'::jsonb,
    
    -- الحالة
    status catalog.product_status DEFAULT 'active',
    
    -- SEO
    meta_title VARCHAR(200),
    meta_description VARCHAR(500),
    
    -- الإحصائيات
    view_count INTEGER DEFAULT 0,
    order_count INTEGER DEFAULT 0,
    
    -- الترتيب
    sort_order INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_category ON catalog.products(category_id);
CREATE INDEX idx_products_status ON catalog.products(status);
CREATE INDEX idx_products_featured ON catalog.products(is_featured) WHERE is_featured = true;
CREATE INDEX idx_products_slug ON catalog.products(slug);

-- =============================================
-- جدول المخزون
-- =============================================
CREATE TABLE catalog.inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    product_id UUID NOT NULL REFERENCES catalog.products(id) ON DELETE CASCADE,
    fabric_id UUID REFERENCES catalog.fabrics(id),
    color_id UUID REFERENCES catalog.colors(id),
    size_id UUID REFERENCES catalog.standard_sizes(id),
    
    -- الكميات
    quantity core.quantity DEFAULT 0,
    reserved_quantity core.quantity DEFAULT 0, -- محجوز للطلبات
    
    -- الحد الأدنى للتنبيه
    low_stock_threshold INTEGER DEFAULT 5,
    
    -- الحالة
    stock_level catalog.stock_level DEFAULT 'in_stock',
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- مفتاح فريد مركب
    UNIQUE(product_id, fabric_id, color_id, size_id)
);

CREATE INDEX idx_inventory_product ON catalog.inventory(product_id);
CREATE INDEX idx_inventory_level ON catalog.inventory(stock_level);

-- =============================================
-- Trigger لتحديث مستوى المخزون
-- =============================================
CREATE OR REPLACE FUNCTION catalog.update_stock_level()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.quantity = 0 THEN
        NEW.stock_level = 'out_of_stock';
    ELSIF NEW.quantity <= NEW.low_stock_threshold THEN
        NEW.stock_level = 'low_stock';
    ELSE
        NEW.stock_level = 'in_stock';
    END IF;
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_inventory_level
    BEFORE INSERT OR UPDATE ON catalog.inventory
    FOR EACH ROW EXECUTE FUNCTION catalog.update_stock_level();
