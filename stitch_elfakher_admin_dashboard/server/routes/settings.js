/**
 * Settings API Routes
 * مسارات الإعدادات
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

// ===============================================
// GET /api/settings - قراءة جميع الإعدادات
// ===============================================
router.get('/', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT key, value, default_value, description
            FROM core.settings
            ORDER BY key
        `);

        // تحويل إلى object للوصول السريع
        const settings = {};
        result.rows.forEach(row => {
            settings[row.key] = row.value || row.default_value;
        });

        res.json({
            success: true,
            data: settings,
            raw: result.rows
        });
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({
            success: false,
            message: 'فشل في جلب الإعدادات'
        });
    }
});

// ===============================================
// GET /api/settings/:key - قراءة إعداد معين
// ===============================================
router.get('/:key', async (req, res) => {
    try {
        const { key } = req.params;

        // تجنب مسارات الـ sub-routes
        if (key === 'tailoring' || key === 'shipping') {
            return res.status(404).json({
                success: false,
                message: 'استخدم المسار الكامل'
            });
        }

        const result = await db.query(`
            SELECT key, value, default_value, description
            FROM core.settings
            WHERE key = $1
        `, [key]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'الإعداد غير موجود'
            });
        }

        const setting = result.rows[0];

        res.json({
            success: true,
            data: {
                key: setting.key,
                value: setting.value || setting.default_value,
                description: setting.description
            }
        });
    } catch (error) {
        console.error('Error fetching setting:', error);
        res.status(500).json({
            success: false,
            message: 'فشل في جلب الإعداد'
        });
    }
});

// ===============================================
// PUT /api/settings/:key - تحديث إعداد
// ===============================================
router.put('/:key', authMiddleware, async (req, res) => {
    try {
        const { key } = req.params;
        const { value } = req.body;

        const result = await db.query(`
            INSERT INTO core.settings (key, value, updated_at)
            VALUES ($1, $2, NOW())
            ON CONFLICT (key) DO UPDATE
            SET value = EXCLUDED.value, updated_at = NOW()
            RETURNING key, value, description
        `, [key, JSON.stringify(value)]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'الإعداد غير موجود'
            });
        }

        res.json({
            success: true,
            message: 'تم تحديث الإعداد بنجاح',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating setting:', error);
        res.status(500).json({
            success: false,
            message: 'فشل في تحديث الإعداد'
        });
    }
});

// ===============================================
// GET /api/settings/tailoring/options - خيارات التفصيل
// ===============================================
router.get('/tailoring/options', async (req, res) => {
    try {
        const [collars, sleeves, buttons, sizes, colors] = await Promise.all([
            db.query(`SELECT * FROM catalog.collar_types WHERE is_active = true ORDER BY name_ar`),
            db.query(`SELECT * FROM catalog.sleeve_types WHERE is_active = true ORDER BY name_ar`),
            db.query(`SELECT * FROM catalog.button_types WHERE is_active = true ORDER BY name_ar`),
            db.query(`SELECT * FROM catalog.standard_sizes ORDER BY id`),
            db.query(`SELECT * FROM catalog.colors WHERE is_active = true ORDER BY sort_order`)
        ]);

        res.json({
            success: true,
            data: {
                collars: collars.rows,
                sleeves: sleeves.rows,
                buttons: buttons.rows,
                sizes: sizes.rows,
                colors: colors.rows
            }
        });
    } catch (error) {
        console.error('Error fetching tailoring options:', error);
        res.status(500).json({
            success: false,
            message: 'فشل في جلب خيارات التفصيل'
        });
    }
});

// ===============================================
// GET /api/settings/shipping/wilayas - قائمة الولايات
// ===============================================
router.get('/shipping/wilayas', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                w.id,
                w.code,
                w.name_ar,
                w.name_en,
                w.name_fr,
                w.shipping_cost,
                w.free_shipping_available,
                w.delivery_days_min,
                w.delivery_days_max,
                w.is_active,
                z.name_ar as zone_name
            FROM shipping.wilayas w
            LEFT JOIN shipping.zones z ON w.zone_id = z.id
            WHERE w.is_active = true
            ORDER BY w.code
        `);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching wilayas:', error);
        res.status(500).json({
            success: false,
            message: 'فشل في جلب الولايات',
            error: error.message
        });
    }
});

// ===============================================
// PUT /api/settings/shipping/wilayas/bulk - تحديث رسوم جميع الولايات
// ===============================================
router.put('/shipping/wilayas/bulk', authMiddleware, async (req, res) => {
    try {
        const { wilayas } = req.body;

        if (!wilayas || !Array.isArray(wilayas)) {
            return res.status(400).json({
                success: false,
                message: 'بيانات غير صالحة'
            });
        }

        let updated = 0;
        for (const w of wilayas) {
            if (w.id && w.shipping_cost !== undefined) {
                await db.query(`
                    UPDATE shipping.wilayas SET
                        shipping_cost = $1
                    WHERE id = $2
                `, [parseFloat(w.shipping_cost) || 0, w.id]);
                updated++;
            }
        }

        res.json({
            success: true,
            message: `تم تحديث ${updated} ولاية بنجاح`,
            updated
        });
    } catch (error) {
        console.error('Error bulk updating wilayas:', error);
        res.status(500).json({
            success: false,
            message: 'فشل في تحديث الولايات'
        });
    }
});

// ===============================================
// PUT /api/settings/shipping/wilayas/:id - تحديث رسوم ولاية
// ===============================================
router.put('/shipping/wilayas/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { shipping_cost, free_shipping_available, delivery_days_min, delivery_days_max, is_active } = req.body;

        const result = await db.query(`
            UPDATE shipping.wilayas SET
                shipping_cost = COALESCE($1, shipping_cost),
                free_shipping_available = COALESCE($2, free_shipping_available),
                delivery_days_min = COALESCE($3, delivery_days_min),
                delivery_days_max = COALESCE($4, delivery_days_max),
                is_active = COALESCE($5, is_active)
            WHERE id = $6
            RETURNING *
        `, [shipping_cost, free_shipping_available, delivery_days_min, delivery_days_max, is_active, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'الولاية غير موجودة'
            });
        }

        res.json({
            success: true,
            message: 'تم تحديث رسوم الولاية بنجاح',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating wilaya:', error);
        res.status(500).json({
            success: false,
            message: 'فشل في تحديث الولاية'
        });
    }
});

module.exports = router;
