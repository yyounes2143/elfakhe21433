/**
 * ELFAKHER - Products API Routes
 * مسارات API للمنتجات
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

/**
 * GET /api/products
 * جلب قائمة المنتجات
 */
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const offset = (page - 1) * limit;
        const category = req.query.category || '';
        const status = req.query.status || '';
        const search = req.query.search || '';
        const min_price = parseFloat(req.query.min_price) || 0;
        const max_price = parseFloat(req.query.max_price) || 99999999;
        const sizes = req.query.sizes ? req.query.sizes.split(',') : [];
        const sort = req.query.sort || 'newest';

        const params = [min_price, max_price];

        let queryText = `
            SELECT 
                p.id,
                p.name_ar,
                p.name_en,
                p.slug,
                p.sku,
                p.base_price,
                p.sale_price,
                p.short_description,
                p.images,
                p.status,
                p.is_featured,
                p.order_count,
                p.view_count,
                p.created_at,
                p.available_size_ids,
                p.available_fabric_ids,
                p.available_color_ids,
                p.stock_quantity,
                c.name_ar as category_name
            FROM catalog.products p
            LEFT JOIN catalog.categories c ON p.category_id = c.id
            WHERE 1=1
            AND (COALESCE(p.sale_price, p.base_price) >= $1)
            AND (COALESCE(p.sale_price, p.base_price) <= $2)
        `;

        if (sizes.length > 0) {
            params.push(sizes);
            queryText += ` AND p.available_size_ids && ARRAY(SELECT id FROM catalog.standard_sizes WHERE size_number = ANY($${params.length}::integer[]))`;
        }

        if (category) {
            params.push(category);
            queryText += ` AND c.slug = $${params.length}`;
        }

        if (status && status !== 'all') {
            params.push(status);
            queryText += ` AND p.status = $${params.length}`;
        }

        if (search) {
            params.push(`%${search}%`);
            queryText += ` AND (p.name_ar ILIKE $${params.length} OR p.name_en ILIKE $${params.length} OR p.sku ILIKE $${params.length})`;
        }

        if (req.query.is_featured === 'true') {
            queryText += ` AND p.is_featured = true`;
        }

        // Get total count (OPTIMIZED: Only JOIN if category filter is present)
        let countQuery = '';
        if (category) {
            countQuery = `
                SELECT COUNT(*) 
                FROM catalog.products p 
                JOIN catalog.categories c ON p.category_id = c.id 
                WHERE 1=1
                AND (COALESCE(p.sale_price, p.base_price) >= $1)
                AND (COALESCE(p.sale_price, p.base_price) <= $2)
            `;
        } else {
            countQuery = `
                SELECT COUNT(*) 
                FROM catalog.products p 
                WHERE 1=1
                AND (COALESCE(p.sale_price, p.base_price) >= $1)
                AND (COALESCE(p.sale_price, p.base_price) <= $2)
            `;
        }

        const countParams = [min_price, max_price];

        if (sizes.length > 0) {
            countParams.push(sizes);
            countQuery += ` AND p.available_size_ids && ARRAY(SELECT id FROM catalog.standard_sizes WHERE size_number = ANY($${countParams.length}::integer[]))`;
        }

        if (category) {
            countParams.push(category);
            countQuery += ` AND c.slug = $${countParams.length}`;
        }
        if (status && status !== 'all') {
            countParams.push(status);
            countQuery += ` AND p.status = $${countParams.length}`;
        }
        if (search) {
            countParams.push(`%${search}%`);
            countQuery += ` AND (p.name_ar ILIKE $${countParams.length} OR p.name_en ILIKE $${countParams.length} OR p.sku ILIKE $${countParams.length})`;
        }
        if (req.query.is_featured === 'true') {
            countQuery += ` AND p.is_featured = true`;
        }

        const countResult = await query(countQuery, countParams);
        const totalCount = parseInt(countResult.rows[0].count);

        // Sorting
        let orderBy = 'p.sort_order ASC, p.created_at DESC, p.id DESC';
        switch (sort) {
            case 'price_low':
                orderBy = 'COALESCE(p.sale_price, p.base_price) ASC, p.id DESC';
                break;
            case 'price_high':
                orderBy = 'COALESCE(p.sale_price, p.base_price) DESC, p.id DESC';
                break;
            case 'popular':
                orderBy = 'COALESCE(p.order_count, 0) DESC, COALESCE(p.view_count, 0) DESC, p.id DESC';
                break;
            case 'newest':
                orderBy = 'p.created_at DESC, p.id DESC';
                break;
        }

        queryText += ` ORDER BY ${orderBy} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await query(queryText, params);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                page,
                limit,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب المنتجات',
            error: error.message
        });
    }
});


/**
 * GET /api/products/stats
 * إحصائيات المنتجات
 */
router.get('/stats', async (req, res) => {
    try {
        const statsQuery = `
            SELECT 
                COUNT(*) as total_products,
                COUNT(*) FILTER (WHERE status = 'active') as active_products,
                COUNT(*) FILTER (WHERE status = 'draft') as draft_products,
                COUNT(*) FILTER (WHERE status = 'out_of_stock') as out_of_stock
            FROM catalog.products
        `;

        const result = await query(statsQuery);

        res.json({
            success: true,
            data: {
                totalProducts: parseInt(result.rows[0].total_products) || 0,
                activeProducts: parseInt(result.rows[0].active_products) || 0,
                draftProducts: parseInt(result.rows[0].draft_products) || 0,
                outOfStock: parseInt(result.rows[0].out_of_stock) || 0
            }
        });
    } catch (error) {
        console.error('Error fetching product stats:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب الإحصائيات',
            error: error.message
        });
    }
});

/**
 * GET /api/products/categories
 * جلب الفئات
 */
router.get('/categories', async (req, res) => {
    try {
        const result = await query(`
            SELECT id, name_ar, name_en, slug, sort_order, is_active
            FROM catalog.categories
            ORDER BY sort_order
        `);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب الفئات',
            error: error.message
        });
    }
});

/**
 * POST /api/products/categories
 * إضافة فئة جديدة
 */
router.post('/categories', authMiddleware, async (req, res) => {
    try {
        const { name_ar, name_en, sort_order } = req.body;

        if (!name_ar) {
            return res.status(400).json({
                success: false,
                message: 'الاسم بالعربية مطلوب'
            });
        }

        // Generate slug from name
        const slug = (name_en || name_ar).toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\u0600-\u06FF\-]/g, '') + '-' + Date.now().toString().slice(-4);

        const result = await query(`
            INSERT INTO catalog.categories (name_ar, name_en, slug, sort_order, is_active)
            VALUES ($1, $2, $3, $4, true)
            RETURNING *
        `, [name_ar, name_en || null, slug, sort_order || 0]);

        res.status(201).json({
            success: true,
            message: 'تم إضافة الفئة بنجاح',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({
            success: false,
            message: 'فشل في إضافة الفئة',
            error: error.message
        });
    }
});

/**
 * PUT /api/products/categories/:id
 * تعديل فئة
 */
router.put('/categories/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { name_ar, name_en, sort_order, is_active } = req.body;

        const result = await query(`
            UPDATE catalog.categories SET
                name_ar = COALESCE($1, name_ar),
                name_en = COALESCE($2, name_en),
                sort_order = COALESCE($3, sort_order),
                is_active = COALESCE($4, is_active),
                updated_at = NOW()
            WHERE id = $5
            RETURNING *
        `, [name_ar, name_en, sort_order, is_active, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'الفئة غير موجودة'
            });
        }

        res.json({
            success: true,
            message: 'تم تحديث الفئة بنجاح',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({
            success: false,
            message: 'فشل في تحديث الفئة',
            error: error.message
        });
    }
});

/**
 * DELETE /api/products/categories/:id
 * حذف فئة
 */
router.delete('/categories/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if category has products
        const productsCheck = await query(
            'SELECT COUNT(*) FROM catalog.products WHERE category_id = $1',
            [id]
        );

        if (parseInt(productsCheck.rows[0].count) > 0) {
            return res.status(400).json({
                success: false,
                message: 'لا يمكن حذف الفئة لأنها تحتوي على منتجات'
            });
        }

        const result = await query(
            'DELETE FROM catalog.categories WHERE id = $1 RETURNING id',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'الفئة غير موجودة'
            });
        }

        res.json({
            success: true,
            message: 'تم حذف الفئة بنجاح'
        });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({
            success: false,
            message: 'فشل في حذف الفئة',
            error: error.message
        });
    }
});

/**
 * GET /api/products/sizes
 * جلب المقاسات القياسية
 */
router.get('/sizes', async (req, res) => {
    try {
        const result = await query(`
            SELECT id, size_number
            FROM catalog.standard_sizes
            WHERE is_active = true
            ORDER BY sort_order
        `);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching sizes:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب المقاسات',
            error: error.message
        });
    }
});

/**
 * GET /api/products/:id
 * جلب منتج محدد
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(`
            SELECT 
                p.*,
                c.name_ar as category_name,
                (SELECT json_agg(f.*) FROM catalog.fabrics f WHERE f.id = ANY(p.available_fabric_ids)) as fabrics,
                (SELECT json_agg(col.*) FROM catalog.colors col WHERE col.id = ANY(p.available_color_ids)) as colors,
                (SELECT json_agg(s.*) FROM catalog.standard_sizes s WHERE s.id = ANY(p.available_size_ids)) as sizes
            FROM catalog.products p
            LEFT JOIN catalog.categories c ON p.category_id = c.id
            WHERE p.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'المنتج غير موجود'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب بيانات المنتج',
            error: error.message
        });
    }
});

// ===============================================
// POST /api/products - إضافة منتج جديد
// ===============================================
router.post('/', authMiddleware, async (req, res) => {
    try {
        const {
            name_ar,
            name_en, // Optional
            category_ids, // Array of UUIDs (multiple categories)
            category_id, // Single category (fallback)
            fabric_ids, // Array of UUIDs
            base_price,
            sale_price,
            short_description,
            full_description,
            status, // active, draft, out_of_stock
            images, // Array
            sku,
            is_featured,
            size_ids, // Array of IDs
            color_ids, // Array of UUIDs
            colors, // Array of objects {id, name_ar, hex_code, ...}
            size_color_availability, // Object { size_uuid: [color_uuids] }
            image_color_linking_enabled, // Boolean
            stock_quantity
        } = req.body;

        // Process sizes
        const available_size_ids = size_ids || [];

        // Process colors
        const available_color_ids = color_ids || [];

        // Separate standard colors (UUIDs) from custom/embedded colors
        const embeddedColors = [];
        (colors || []).forEach(c => {
            const colorValue = c.id || c.value || c;
            if (typeof colorValue === 'string' && colorValue.startsWith('custom_')) {
                embeddedColors.push({
                    id: colorValue,
                    name_ar: c.name_ar || '',
                    hex_code: c.hex_code || '#000000'
                });
            }
        });

        // Process fabrics
        const available_fabric_ids = fabric_ids || [];

        // Use first category from array or single category_id
        const primary_category_id = (category_ids && category_ids.length > 0)
            ? category_ids[0]
            : category_id;

        // Generate slug from name
        const slug = (name_en || name_ar).toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\u0600-\u06FF\-]/g, '') + '-' + Date.now().toString().slice(-4);

        const result = await query(`
            INSERT INTO catalog.products (
                name_ar, name_en, slug, category_id,
                base_price, sale_price,
                short_description, full_description,
                status, images, sku, is_featured,
                available_size_ids, available_color_ids, embedded_colors,
                available_fabric_ids,
                size_color_availability, image_color_linking_enabled, stock_quantity
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
            RETURNING *
        `, [
            name_ar, name_en, slug, primary_category_id,
            base_price, sale_price,
            short_description, full_description,
            status || 'active',
            JSON.stringify(images || []),
            sku, is_featured || false,
            available_size_ids,
            available_color_ids.length > 0 ? available_color_ids : null,
            JSON.stringify(embeddedColors),
            available_fabric_ids.length > 0 ? available_fabric_ids : null,
            JSON.stringify(size_color_availability || {}),
            image_color_linking_enabled || false,
            parseInt(stock_quantity) || 0
        ]);

        res.status(201).json({
            success: true,
            message: 'تم إضافة المنتج بنجاح',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({
            success: false,
            message: 'فشل في إضافة المنتج',
            error: error.message
        });
    }
});

// ===============================================
// PUT /api/products/:id - تعديل منتج
// ===============================================
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name_ar,
            name_en,
            category_ids, // Array of UUIDs (multiple categories)
            category_id, // Single category (fallback)
            fabric_ids,
            base_price,
            sale_price,
            short_description,
            full_description,
            status,
            images,
            sku,
            is_featured,
            size_ids,
            color_ids,
            colors,
            size_color_availability,
            image_color_linking_enabled,
            stock_quantity
        } = req.body;

        const available_size_ids = size_ids || [];
        const available_fabric_ids = fabric_ids || [];
        const available_color_ids = color_ids || [];

        // Separate standard colors (UUIDs) from custom/embedded colors
        let embeddedColors = [];
        if (colors) {
            colors.forEach(c => {
                const colorValue = c.id || c.value || c;
                if (typeof colorValue === 'string' && colorValue.startsWith('custom_')) {
                    embeddedColors.push({
                        id: colorValue,
                        name_ar: c.name_ar || '',
                        hex_code: c.hex_code || '#000000'
                    });
                }
            });
        }

        // Use first category from array or single category_id
        const primary_category_id = (category_ids && category_ids.length > 0)
            ? category_ids[0]
            : category_id;

        const result = await query(`
            UPDATE catalog.products SET
                name_ar = COALESCE($1, name_ar),
                name_en = COALESCE($2, name_en),
                category_id = COALESCE($3, category_id),
                base_price = COALESCE($4, base_price),
                sale_price = COALESCE($5, sale_price),
                short_description = COALESCE($6, short_description),
                full_description = COALESCE($7, full_description),
                status = COALESCE($8, status),
                images = COALESCE($9, images),
                sku = COALESCE($10, sku),
                is_featured = COALESCE($11, is_featured),
                available_size_ids = COALESCE($12, available_size_ids),
                available_color_ids = COALESCE($13, available_color_ids),
                embedded_colors = COALESCE($14, embedded_colors),
                available_fabric_ids = COALESCE($15, available_fabric_ids),
                size_color_availability = COALESCE($16, size_color_availability),
                image_color_linking_enabled = COALESCE($17, image_color_linking_enabled),
                stock_quantity = COALESCE($18, stock_quantity),
                updated_at = NOW()
            WHERE id = $19
            RETURNING *
        `, [
            name_ar, name_en, primary_category_id,
            base_price, sale_price,
            short_description, full_description,
            status,
            images ? JSON.stringify(images) : null,
            sku, is_featured,
            available_size_ids,
            available_color_ids && available_color_ids.length > 0 ? available_color_ids : null,
            JSON.stringify(embeddedColors),
            available_fabric_ids && available_fabric_ids.length > 0 ? available_fabric_ids : null,
            JSON.stringify(size_color_availability || {}),
            image_color_linking_enabled,
            stock_quantity,
            id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'المنتج غير موجود'
            });
        }

        res.json({
            success: true,
            message: 'تم تحديث المنتج بنجاح',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({
            success: false,
            message: 'فشل في تحديث المنتج',
            error: error.message
        });
    }
});

// ===============================================
// DELETE /api/products/:id - حذف منتج
// ===============================================
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if product exists
        const check = await query('SELECT id FROM catalog.products WHERE id = $1', [id]);
        if (check.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'المنتج غير موجود'
            });
        }

        // Ideally check for orders before deleting

        await query('DELETE FROM catalog.products WHERE id = $1', [id]);

        res.json({
            success: true,
            message: 'تم حذف المنتج بنجاح'
        });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({
            success: false,
            message: 'فشل في حذف المنتج',
            error: error.message
        });
    }
});

module.exports = router;
