/**
 * ELFAKHER - Customers API Routes
 * مسارات API للعملاء
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

/**
 * GET /api/customers
 * جلب قائمة العملاء مع pagination
 */
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        const wilaya = req.query.wilaya || '';

        let queryText = `
            SELECT 
                u.id,
                u.first_name,
                u.last_name,
                u.first_name || ' ' || u.last_name as full_name,
                u.phone,
                u.email,
                u.total_orders,
                u.total_spent,
                u.created_at,
                u.updated_at,
                (u.metadata->>'last_order_date') as last_order_date,
                (SELECT (address).wilaya_code FROM core.user_addresses WHERE user_id = u.id AND is_default = true LIMIT 1) as wilaya_code
            FROM core.users u
            WHERE u.role = 'customer'
        `;

        const params = [];

        if (search) {
            params.push(`%${search}%`);
            queryText += ` AND (u.first_name ILIKE $${params.length} OR u.last_name ILIKE $${params.length} OR u.phone ILIKE $${params.length})`;
        }

        // Get total count
        const countQuery = `SELECT COUNT(*) FROM core.users u WHERE u.role = 'customer'`;
        const countResult = await query(countQuery);
        const totalCount = parseInt(countResult.rows[0].count);

        queryText += ` ORDER BY u.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
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
        console.error('Error fetching customers:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب العملاء',
            error: error.message
        });
    }
});

/**
 * GET /api/customers/stats
 * إحصائيات العملاء
 */
router.get('/stats', async (req, res) => {
    try {
        const statsQuery = `
            SELECT 
                COUNT(*) as total_customers,
                COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE)) as new_this_month,
                COUNT(*) FILTER (WHERE total_orders > 1) as returning_customers,
                COALESCE(AVG(total_spent) FILTER (WHERE total_orders > 0), 0)::numeric(12,2) as avg_order_value
            FROM core.users
            WHERE role = 'customer'
        `;

        const result = await query(statsQuery);

        res.json({
            success: true,
            data: {
                totalCustomers: parseInt(result.rows[0].total_customers) || 0,
                newThisMonth: parseInt(result.rows[0].new_this_month) || 0,
                returningCustomers: parseInt(result.rows[0].returning_customers) || 0,
                avgOrderValue: parseFloat(result.rows[0].avg_order_value) || 0
            }
        });
    } catch (error) {
        console.error('Error fetching customer stats:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب الإحصائيات',
            error: error.message
        });
    }
});

/**
 * GET /api/customers/:id
 * جلب عميل محدد
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(`
            SELECT 
                u.*,
                (SELECT json_agg(a.*) FROM core.user_addresses a WHERE a.user_id = u.id) as addresses,
                (SELECT json_agg(m.*) FROM core.user_measurements m WHERE m.user_id = u.id) as measurements
            FROM core.users u
            WHERE u.id = $1 AND u.role = 'customer'
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'العميل غير موجود'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching customer:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب بيانات العميل',
            error: error.message
        });
    }
});

module.exports = router;
