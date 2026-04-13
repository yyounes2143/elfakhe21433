/**
 * Fabrics API Routes
 * مسارات الأقمشة والألوان
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

// ===============================================
// GET /api/fabrics - قائمة الأقمشة
// ===============================================
router.get('/', async (req, res) => {
    try {
        const { active_only } = req.query;

        let query = `
            SELECT 
                f.id,
                f.name,
                f.name_ar,
                f.slug,
                f.origin_country,
                f.origin_flag,
                f.description,
                f.description_ar,
                f.price_per_meter,
                f.stock_quantity,
                f.stock_level,
                f.images,
                f.properties,
                f.is_active,
                f.created_at
            FROM catalog.fabrics f
            WHERE 1=1
        `;
        const params = [];

        if (active_only === 'true') {
            params.push(true);
            query += ` AND f.is_active = $${params.length}`;
        }

        query += ` ORDER BY f.name_ar`;

        const result = await db.query(query, params);

        res.json({
            success: true,
            data: result.rows,
            total: result.rows.length
        });
    } catch (error) {
        console.error('Error fetching fabrics:', error);
        res.status(500).json({
            success: false,
            message: 'فشل في جلب الأقمشة',
            error: error.message
        });
    }
});

// ===============================================
// GET /api/fabrics/stats - إحصائيات الأقمشة
// ===============================================
router.get('/stats', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE is_active = true) as active,
                COUNT(*) FILTER (WHERE stock_level = 'low_stock') as low_stock,
                COUNT(*) FILTER (WHERE stock_level = 'out_of_stock') as out_of_stock
            FROM catalog.fabrics
        `);

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching fabric stats:', error);
        res.status(500).json({
            success: false,
            message: 'فشل في جلب إحصائيات الأقمشة'
        });
    }
});

// ===============================================
// GET /api/fabrics/colors - قائمة الألوان
// ===============================================
router.get('/colors', async (req, res) => {
    try {
        const { include_inactive } = req.query;

        let query = `
            SELECT 
                id,
                name_en as name,
                name_ar,
                hex_code,
                image_url,
                is_active,
                sort_order
            FROM catalog.colors
            WHERE 1=1
        `;

        if (include_inactive !== 'true') {
            query += ` AND is_active = true`;
        }

        query += ` ORDER BY sort_order, name_ar`;

        const result = await db.query(query);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching colors:', error);
        res.status(500).json({
            success: false,
            message: 'فشل في جلب الألوان'
        });
    }
});

// ===============================================
// POST /api/fabrics/colors - إضافة لون جديد
// ===============================================
router.post('/colors', authMiddleware, async (req, res) => {
    try {
        const { name_ar, name_en, hex_code, image_url, is_active, sort_order } = req.body;

        if (!name_ar || !hex_code) {
            return res.status(400).json({
                success: false,
                message: 'اسم اللون وكود اللون مطلوبان'
            });
        }

        // التحقق من عدم وجود اللون مسبقاً
        const checkColor = await db.query(`
            SELECT id FROM catalog.colors 
            WHERE name_ar = $1 OR hex_code = $2
        `, [name_ar, hex_code]);

        if (checkColor.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'اللون موجود مسبقاً'
            });
        }

        const result = await db.query(`
            INSERT INTO catalog.colors (name_ar, name_en, hex_code, image_url, is_active, sort_order)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [name_ar, name_en || name_ar, hex_code, image_url, is_active !== false, sort_order || 0]);

        res.status(201).json({
            success: true,
            message: 'تم إضافة اللون بنجاح',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating color:', error);
        res.status(500).json({
            success: false,
            message: 'فشل في إضافة اللون',
            error: error.message
        });
    }
});

// ===============================================
// PUT /api/fabrics/colors/:id - تعديل لون
// ===============================================
router.put('/colors/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { name_ar, name_en, hex_code, image_url, is_active, sort_order } = req.body;

        const result = await db.query(`
            UPDATE catalog.colors SET
                name_ar = COALESCE($1, name_ar),
                name_en = COALESCE($2, name_en),
                hex_code = COALESCE($3, hex_code),
                image_url = COALESCE($4, image_url),
                is_active = COALESCE($5, is_active),
                sort_order = COALESCE($6, sort_order)
            WHERE id = $7
            RETURNING *
        `, [name_ar, name_en, hex_code, image_url, is_active, sort_order, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'اللون غير موجود'
            });
        }

        res.json({
            success: true,
            message: 'تم تحديث اللون بنجاح',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating color:', error);
        res.status(500).json({
            success: false,
            message: 'فشل في تحديث اللون',
            error: error.message
        });
    }
});

// ===============================================
// DELETE /api/fabrics/colors/:id - حذف لون
// ===============================================
router.delete('/colors/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        // التحقق من استخدام اللون في منتجات
        const checkUsage = await db.query(`
            SELECT COUNT(*) as count 
            FROM catalog.inventory 
            WHERE color_id = $1
        `, [id]);

        if (parseInt(checkUsage.rows[0].count) > 0) {
            // بدلاً من الحذف، نقوم بإلغاء التفعيل
            await db.query(`
                UPDATE catalog.colors SET is_active = false WHERE id = $1
            `, [id]);

            return res.json({
                success: true,
                message: 'تم إلغاء تفعيل اللون (مستخدم في منتجات)'
            });
        }

        const result = await db.query(`
            DELETE FROM catalog.colors WHERE id = $1 RETURNING id
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'اللون غير موجود'
            });
        }

        res.json({
            success: true,
            message: 'تم حذف اللون بنجاح'
        });
    } catch (error) {
        console.error('Error deleting color:', error);
        res.status(500).json({
            success: false,
            message: 'فشل في حذف اللون',
            error: error.message
        });
    }
});

// ===============================================
// GET /api/fabrics/:id - تفاصيل قماش
// ===============================================
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(`
            SELECT *
            FROM catalog.fabrics
            WHERE id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'القماش غير موجود'
            });
        }

        // الحصول على الألوان المتاحة
        const colors = await db.query(`
            SELECT id, name_en as name, name_ar, hex_code
            FROM catalog.colors
            WHERE is_active = true
            ORDER BY sort_order
        `);

        res.json({
            success: true,
            data: {
                ...result.rows[0],
                available_colors: colors.rows
            }
        });
    } catch (error) {
        console.error('Error fetching fabric:', error);
        res.status(500).json({
            success: false,
            message: 'فشل في جلب تفاصيل القماش'
        });
    }
});

// ===============================================
// POST /api/fabrics - إضافة قماش جديد
// ===============================================
router.post('/', authMiddleware, async (req, res) => {
    try {
        const {
            name,
            name_ar,
            slug,
            origin_country,
            origin_flag,
            description,
            description_ar,
            price_per_meter,
            stock_quantity,
            images
        } = req.body;

        const result = await db.query(`
            INSERT INTO catalog.fabrics (
                name, name_ar, slug, origin_country, origin_flag,
                description, description_ar, price_per_meter, stock_quantity, images
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `, [name, name_ar, slug, origin_country, origin_flag, description, description_ar, price_per_meter, stock_quantity, JSON.stringify(images || [])]);

        res.status(201).json({
            success: true,
            message: 'تم إضافة القماش بنجاح',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating fabric:', error);
        res.status(500).json({
            success: false,
            message: 'فشل في إضافة القماش',
            error: error.message
        });
    }
});

// ===============================================
// PUT /api/fabrics/:id - تعديل قماش
// ===============================================
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            name_ar,
            origin_country,
            origin_flag,
            description,
            description_ar,
            price_per_meter,
            stock_quantity,
            images,
            is_active
        } = req.body;

        console.log('Update Fabric Request:', { id, body: req.body });

        const result = await db.query(`
            UPDATE catalog.fabrics SET
                name = COALESCE($1, name),
                name_ar = COALESCE($2, name_ar),
                origin_country = COALESCE($3, origin_country),
                origin_flag = COALESCE($4, origin_flag),
                description = COALESCE($5, description),
                description_ar = COALESCE($6, description_ar),
                price_per_meter = COALESCE($7, price_per_meter),
                stock_quantity = COALESCE($8, stock_quantity),
                images = COALESCE($9, images),
                is_active = COALESCE($10, is_active),
                updated_at = NOW()
            WHERE id = $11
            RETURNING *
        `, [name, name_ar, origin_country, origin_flag, description, description_ar, price_per_meter, stock_quantity, images ? JSON.stringify(images) : '[]', is_active, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'القماش غير موجود'
            });
        }

        res.json({
            success: true,
            message: 'تم تحديث القماش بنجاح',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating fabric:', error);
        res.status(500).json({
            success: false,
            message: 'فشل في تحديث القماش',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// ===============================================
// DELETE /api/fabrics/:id - حذف قماش
// ===============================================
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        // التحقق من وجود القماش أولاً
        const checkFabric = await db.query(`
            SELECT id, name_ar, name FROM catalog.fabrics WHERE id = $1
        `, [id]);

        if (checkFabric.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'القماش غير موجود'
            });
        }

        // التحقق من وجود طلبات مرتبطة بهذا القماش
        const checkOrders = await db.query(`
            SELECT COUNT(*) as count FROM orders.order_items WHERE fabric_id = $1
        `, [id]);

        if (parseInt(checkOrders.rows[0].count) > 0) {
            return res.status(400).json({
                success: false,
                message: `لا يمكن حذف هذا القماش لأنه مرتبط بـ ${checkOrders.rows[0].count} طلب. يمكنك إلغاء تنشيطه بدلاً من حذفه.`
            });
        }

        // التحقق من وجود مخزون مرتبط
        const checkInventory = await db.query(`
            SELECT COUNT(*) as count FROM catalog.inventory WHERE fabric_id = $1
        `, [id]);

        // حذف سجلات المخزون المرتبطة أولاً (إذا لم تكن هناك طلبات)
        if (parseInt(checkInventory.rows[0].count) > 0) {
            await db.query(`DELETE FROM catalog.inventory WHERE fabric_id = $1`, [id]);
        }

        // حذف القماش
        const result = await db.query(`
            DELETE FROM catalog.fabrics WHERE id = $1 RETURNING id
        `, [id]);

        res.json({
            success: true,
            message: 'تم حذف القماش بنجاح'
        });
    } catch (error) {
        console.error('Error deleting fabric:', error);

        // التعامل مع أخطاء Foreign Key
        if (error.code === '23503') {
            res.status(400).json({
                success: false,
                message: 'لا يمكن حذف هذا القماش لأنه مرتبط ببيانات أخرى في النظام'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'فشل في حذف القماش',
                error: error.message
            });
        }
    }
});

module.exports = router;
