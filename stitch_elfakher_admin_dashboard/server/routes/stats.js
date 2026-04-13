/**
 * ELFAKHER - Dashboard Stats API Routes
 * مسارات API لإحصائيات الداشبورد
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

/**
 * GET /api/stats/dashboard
 * إحصائيات الداشبورد الرئيسية
 */
router.get('/dashboard', async (req, res) => {
    try {
        // إحصائيات الطلبات
        const ordersStats = await query(`
            SELECT 
                COUNT(*) as total_orders,
                COUNT(*) FILTER (WHERE status = 'pending') as pending_orders,
                COUNT(*) FILTER (WHERE status = 'shipped') as in_progress,
                COUNT(*) FILTER (WHERE status = 'delivered') as delivered_orders,
                COALESCE(SUM(total_amount), 0)::numeric(12,2) as total_revenue,
                COALESCE(SUM(total_amount) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE)), 0)::numeric(12,2) as revenue_this_month
            FROM orders.orders
        `);

        // إحصائيات العملاء
        const customersStats = await query(`
            SELECT 
                COUNT(*) as total_customers,
                COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE)) as new_this_month
            FROM core.users
            WHERE role = 'customer'
        `);

        // إحصائيات المنتجات
        const productsStats = await query(`
            SELECT 
                COUNT(*) as total_products,
                COUNT(*) FILTER (WHERE status = 'active') as active_products
            FROM catalog.products
        `);

        // آخر الطلبات
        const recentOrders = await query(`
            SELECT 
                o.id,
                o.order_number,
                o.customer_name,
                o.total_amount,
                o.status,
                o.created_at
            FROM orders.orders o
            ORDER BY o.created_at DESC
            LIMIT 5
        `);

        res.json({
            success: true,
            data: {
                orders: {
                    total: parseInt(ordersStats.rows[0].total_orders) || 0,
                    pending: parseInt(ordersStats.rows[0].pending_orders) || 0,
                    inProgress: parseInt(ordersStats.rows[0].in_progress) || 0,
                    delivered: parseInt(ordersStats.rows[0].delivered_orders) || 0
                },
                revenue: {
                    total: parseFloat(ordersStats.rows[0].total_revenue) || 0,
                    thisMonth: parseFloat(ordersStats.rows[0].revenue_this_month) || 0
                },
                customers: {
                    total: parseInt(customersStats.rows[0].total_customers) || 0,
                    newThisMonth: parseInt(customersStats.rows[0].new_this_month) || 0
                },
                products: {
                    total: parseInt(productsStats.rows[0].total_products) || 0,
                    active: parseInt(productsStats.rows[0].active_products) || 0
                },
                recentOrders: recentOrders.rows
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب الإحصائيات',
            error: error.message
        });
    }
});

/**
 * GET /api/stats/wilayas
 * جلب الولايات
 */
router.get('/wilayas', async (req, res) => {
    try {
        const result = await query(`
            SELECT code, name_ar, name, home_fee, office_fee
            FROM shipping.wilayas
            WHERE is_active = true
            ORDER BY code
        `);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching wilayas:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب الولايات',
            error: error.message
        });
    }
});

module.exports = router;
