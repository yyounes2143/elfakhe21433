/**
 * ELFAKHER - Orders API Routes
 * مسارات API للطلبات
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

/**
 * GET /api/orders
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const status = req.query.status || '';
        const search = req.query.search || '';

        let queryText = `
            SELECT 
                o.id,
                o.order_number,
                o.customer_id,
                o.customer_name,
                o.customer_phone,
                o.status,
                o.total_amount,
                o.shipping_cost,
                o.customer_notes,
                o.created_at,
                o.updated_at,
                (SELECT COUNT(*) FROM orders.order_items WHERE order_id = o.id) as items_count
            FROM orders.orders o
            WHERE 1=1
        `;

        const params = [];

        if (status && status !== 'all') {
            params.push(status);
            queryText += ` AND o.status = $${params.length}`;
        }

        if (search) {
            params.push(`%${search}%`);
            queryText += ` AND (o.order_number ILIKE $${params.length} OR o.customer_name ILIKE $${params.length} OR o.customer_phone ILIKE $${params.length})`;
        }

        // Get total count
        let countQuery = `
            SELECT COUNT(*) 
            FROM orders.orders o 
            WHERE 1=1
        `;
        const countParams = [];
        if (status && status !== 'all') {
            countParams.push(status);
            countQuery += ` AND o.status = $${countParams.length}`;
        }
        if (search) {
            countParams.push(`%${search}%`);
            countQuery += ` AND (o.order_number ILIKE $${countParams.length} OR o.customer_name ILIKE $${countParams.length} OR o.customer_phone ILIKE $${countParams.length})`;
        }

        const countResult = await query(countQuery, countParams);
        const totalCount = parseInt(countResult.rows[0].count);

        queryText += ` ORDER BY o.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
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
        console.error('Error fetching orders:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب الطلبات',
            error: error.message
        });
    }
});

/**
 * GET /api/orders/stats
 */
router.get('/stats', authMiddleware, async (req, res) => {
    try {
        const statsQuery = `
            SELECT 
                COUNT(*) as total_orders,
                COUNT(*) FILTER (WHERE status = 'pending') as pending_orders,
                COUNT(*) FILTER (WHERE status = 'shipped') as in_progress,
                COUNT(*) FILTER (WHERE status = 'delivered') as delivered_orders,
                COALESCE(SUM(total_amount), 0)::numeric(12,2) as total_revenue
            FROM orders.orders
        `;

        const result = await query(statsQuery);

        res.json({
            success: true,
            data: {
                totalOrders: parseInt(result.rows[0].total_orders) || 0,
                pendingOrders: parseInt(result.rows[0].pending_orders) || 0,
                inProgress: parseInt(result.rows[0].in_progress) || 0,
                deliveredOrders: parseInt(result.rows[0].delivered_orders) || 0,
                totalRevenue: parseFloat(result.rows[0].total_revenue) || 0
            }
        });
    } catch (error) {
        console.error('Error fetching order stats:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب الإحصائيات',
            error: error.message
        });
    }
});

/**
 * GET /api/orders/archive/timeline
 * أرشيف الطلبات مجوع بالأيام للخط الزمني
 */
router.get('/archive/timeline', authMiddleware, async (req, res) => {
    try {
        const { startDate, endDate, wilaya } = req.query;
        let whereClause = "WHERE 1=1";
        const params = [];

        if (startDate) {
            params.push(startDate);
            whereClause += ` AND DATE(o.created_at) >= $${params.length}`;
        }
        if (endDate) {
            params.push(endDate);
            whereClause += ` AND DATE(o.created_at) <= $${params.length}`;
        }
        if (wilaya && wilaya !== 'all') {
            params.push(wilaya);
            whereClause += ` AND o.wilaya_id = $${params.length}`;
        }

        const summaryQuery = `
            SELECT 
                TO_CHAR(DATE(o.created_at), 'YYYY-MM-DD') as date,
                COUNT(*)::int as total_orders,
                COUNT(*) FILTER (WHERE status = 'delivered')::int as delivered_orders,
                COUNT(*) FILTER (WHERE status = 'shipped')::int as shipped_orders,
                COUNT(*) FILTER (WHERE status = 'pending' OR status = 'confirmed')::int as placed_orders,
                COALESCE(SUM(total_amount), 0)::numeric(12,2) as total_revenue
            FROM orders.orders o
            ${whereClause}
            GROUP BY DATE(o.created_at)
            ORDER BY DATE(o.created_at) DESC
        `;
        const summaryResult = await query(summaryQuery, params);

        const ordersQuery = `
            SELECT 
                o.id,
                o.order_number,
                o.customer_name,
                o.customer_phone,
                o.status,
                o.total_amount,
                o.created_at,
                o.shipped_at,
                o.delivered_at,
                o.cancelled_at,
                w.name_ar as wilaya_name
            FROM orders.orders o
            LEFT JOIN shipping.wilayas w ON o.wilaya_id = w.id
            ${whereClause}
            ORDER BY o.created_at DESC
        `;
        const ordersResult = await query(ordersQuery, params);

        res.json({
            success: true,
            data: {
                timeline: summaryResult.rows,
                orders: ordersResult.rows 
            }
        });
    } catch (error) {
        console.error('Error fetching archive timeline:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب بيانات الأرشيف',
            error: error.message
        });
    }
});

/**
 * GET /api/orders/:id
 */
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const orderResult = await query(`
            SELECT 
                o.*,
                w.name_ar as wilaya_name,
                w.code as wilaya_code
            FROM orders.orders o
            LEFT JOIN shipping.wilayas w ON o.wilaya_id = w.id
            WHERE o.id = $1
        `, [id]);

        if (orderResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'الطلب غير موجود'
            });
        }

        const itemsResult = await query(`
            SELECT 
                oi.*,
                p.name_ar as product_name,
                p.images->>0 as image_url,
                f.name_ar as fabric_name,
                COALESCE(c.name_ar, oi.color_name) as color_name,
                c.hex_code,
                oi.size_number as size
            FROM orders.order_items oi
            LEFT JOIN catalog.products p ON oi.product_id = p.id
            LEFT JOIN catalog.fabrics f ON oi.fabric_id = f.id
            LEFT JOIN catalog.colors c ON oi.color_id = c.id
            WHERE oi.order_id = $1
        `, [id]);

        res.json({
            success: true,
            data: {
                ...orderResult.rows[0],
                items: itemsResult.rows
            }
        });
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في جلب بيانات الطلب',
            error: error.message
        });
    }
});

/**
 * PATCH /api/orders/:id/status
 */
router.patch('/:id/status', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'حالة غير صالحة'
            });
        }

        let updateQuery = `
            UPDATE orders.orders 
            SET status = $1, updated_at = CURRENT_TIMESTAMP`;
            
        if (status === 'shipped') {
            updateQuery += `, shipped_at = COALESCE(shipped_at, CURRENT_TIMESTAMP)`;
        } else if (status === 'delivered') {
            updateQuery += `, delivered_at = COALESCE(delivered_at, CURRENT_TIMESTAMP)`;
        } else if (status === 'cancelled') {
            updateQuery += `, cancelled_at = COALESCE(cancelled_at, CURRENT_TIMESTAMP)`;
        }
        
        updateQuery += ` WHERE id = $2 RETURNING *`;

        const result = await query(updateQuery, [status, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'الطلب غير موجود'
            });
        }

        res.json({
            success: true,
            message: 'تم تحديث الحالة',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في تحديث الحالة',
            error: error.message
        });
    }
});

/**
 * PATCH /api/orders/:id/notes
 */
router.patch('/:id/notes', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;

        const result = await query(`
            UPDATE orders.orders 
            SET admin_notes = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING id, admin_notes
        `, [notes || '', id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'الطلب غير موجود'
            });
        }

        res.json({
            success: true,
            message: 'تم حفظ الملاحظات',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating admin notes:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في حفظ الملاحظات',
            error: error.message
        });
    }
});

/**
 * POST /api/orders/quick
 */
router.post('/quick', async (req, res) => {
    try {
        const { name, surname, phone, wilaya, productId, productTitle, quantity = 1, color, size, options } = req.body;

        if (!name || !surname || !phone || !wilaya) {
            return res.status(400).json({
                success: false,
                message: 'الرجاء ملء جميع الحقول المطلوبة'
            });
        }

        let formattedPhone = phone.replace(/\D/g, '');
        if (formattedPhone.startsWith('213')) {
            formattedPhone = '0' + formattedPhone.slice(3);
        }
        if (!formattedPhone.startsWith('0') && formattedPhone.length === 9) {
            formattedPhone = '0' + formattedPhone;
        }
        if (!/^0[5-7][0-9]{8}$/.test(formattedPhone)) {
            return res.status(400).json({
                success: false,
                message: 'رقم الهاتف غير صالح. يجب أن يكون بصيغة 0550123456'
            });
        }

        const orderNumber = 'QO-' + Date.now().toString(36).toUpperCase();

        let customerId = null;
        const existingCustomer = await query(
            `SELECT id FROM core.users WHERE phone = $1 LIMIT 1`,
            [formattedPhone]
        );

        if (existingCustomer.rows.length > 0) {
            customerId = existingCustomer.rows[0].id;
        } else {
            const newCustomer = await query(`
                INSERT INTO core.users (first_name, last_name, phone, role, created_at)
                VALUES ($1, $2, $3, 'customer', CURRENT_TIMESTAMP)
                RETURNING id
            `, [name, surname, formattedPhone]);
            customerId = newCustomer.rows[0].id;
        }

        let totalAmount = 0;
        if (productId) {
            const productResult = await query(
                `SELECT COALESCE(sale_price, base_price) as price FROM catalog.products WHERE id = $1`,
                [productId]
            );
            if (productResult.rows.length > 0) {
                totalAmount = parseFloat(productResult.rows[0].price) * quantity;
            }
        }

        const wilayaResult = await query(
            `SELECT id FROM shipping.wilayas WHERE code = $1 LIMIT 1`,
            [wilaya]
        );
        const wilayaId = wilayaResult.rows.length > 0 ? wilayaResult.rows[0].id : null;

        const customerFullName = `${name} ${surname}`;
        const orderResult = await query(`
            INSERT INTO orders.orders (
                order_number, customer_id, customer_name, customer_phone,
                shipping_address, wilaya_id, subtotal, shipping_cost, 
                total_amount, status, customer_notes, source, created_at
            )
            VALUES ($1, $2, $3, $4, $5::core.address_type, $6, $7, 0, $7, 'pending', $8, 'website', CURRENT_TIMESTAMP)
            RETURNING id, order_number
        `, [orderNumber, customerId, customerFullName, formattedPhone, `("","",${wilaya},"","طلب سريع")`, wilayaId, totalAmount, `طلب سريع - ${productTitle || 'منتج'}`]);

        const orderId = orderResult.rows[0].id;

        if (productId) {
            const unitPrice = totalAmount / quantity;
            await query(`
                INSERT INTO orders.order_items (
                    order_id, product_id, product_name, quantity, unit_price, 
                    total_price, size_number, color_name, created_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
            `, [orderId, productId, productTitle || 'منتج', quantity, unitPrice, totalAmount, size ? parseInt(size) : null, color || null]);
        }

        res.json({
            success: true,
            message: 'تم استلام طلبك بنجاح! سنتواصل معك قريباً.',
            data: {
                orderId: orderId,
                orderNumber: orderNumber
            }
        });

    } catch (error) {
        console.error('Error creating quick order:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في إنشاء الطلب',
            error: error.message
        });
    }
});

/**
 * POST /api/orders/checkout
 */
router.post('/checkout', async (req, res) => {
    try {
        const { firstName, lastName, phone, email, wilaya, address, cartItems } = req.body;

        if (!firstName || !lastName || !phone || !wilaya) {
            return res.status(400).json({
                success: false,
                message: 'الرجاء ملء جميع الحقول المطلوبة'
            });
        }

        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'السلة فارغة'
            });
        }

        let formattedPhone = phone.replace(/\D/g, '');
        if (formattedPhone.startsWith('213')) {
            formattedPhone = '0' + formattedPhone.slice(3);
        }
        if (!formattedPhone.startsWith('0') && formattedPhone.length === 9) {
            formattedPhone = '0' + formattedPhone;
        }
        if (!/^0[5-7][0-9]{8}$/.test(formattedPhone)) {
            return res.status(400).json({
                success: false,
                message: 'رقم الهاتف غير صالح. يجب أن يكون بصيغة 0550123456'
            });
        }

        const orderNumber = 'ORD-' + Date.now().toString(36).toUpperCase();

        let customerId = null;
        const existingCustomer = await query(
            `SELECT id FROM core.users WHERE phone = $1 LIMIT 1`,
            [formattedPhone]
        );

        if (existingCustomer.rows.length > 0) {
            customerId = existingCustomer.rows[0].id;
        } else {
            const newCustomer = await query(`
                INSERT INTO core.users (first_name, last_name, phone, email, role, created_at)
                VALUES ($1, $2, $3, $4, 'customer', CURRENT_TIMESTAMP)
                RETURNING id
            `, [firstName, lastName, formattedPhone, email || null]);
            customerId = newCustomer.rows[0].id;
        }

        let subtotal = 0;
        for (const item of cartItems) {
            subtotal += (item.price || 0) * (item.quantity || 1);
        }

        const wilayaResult = await query(
            `SELECT id FROM shipping.wilayas WHERE code = $1 LIMIT 1`,
            [wilaya]
        );
        const wilayaId = wilayaResult.rows.length > 0 ? wilayaResult.rows[0].id : null;

        const customerFullName = `${firstName} ${lastName}`;
        const orderResult = await query(`
            INSERT INTO orders.orders (
                order_number, customer_id, customer_name, customer_phone, customer_email,
                shipping_address, wilaya_id, subtotal, shipping_cost, 
                total_amount, status, source, created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6::core.address_type, $7, $8, 0, $8, 'pending', 'website', CURRENT_TIMESTAMP)
            RETURNING id, order_number
        `, [orderNumber, customerId, customerFullName, formattedPhone, email || null,
            `("${address || ''}","","${wilaya}","","")`, wilayaId, subtotal]);

        const orderId = orderResult.rows[0].id;

        for (const item of cartItems) {
            const unitPrice = item.price || 0;
            const qty = item.quantity || 1;
            const isFabric = item.type === 'fabric';
            const productId = isFabric ? null : (item.productId || null);
            const fabricId = isFabric ? item.id : null;
            const itemName = item.title || item.name_ar || (isFabric ? 'قماش' : 'منتج');

            await query(`
                INSERT INTO orders.order_items (
                    order_id, product_id, fabric_id, product_name, quantity, unit_price, 
                    total_price, size_number, color_name, created_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
            `, [orderId, productId, fabricId, itemName, qty, unitPrice,
                unitPrice * qty, item.size ? parseInt(item.size) : null, item.color || null]);
        }

        res.json({
            success: true,
            message: 'تم إنشاء طلبك بنجاح!',
            data: {
                orderId: orderId,
                orderNumber: orderNumber
            }
        });

    } catch (error) {
        console.error('Error creating checkout order:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في إنشاء الطلب',
            error: error.message
        });
    }
});

/**
 * DELETE /api/orders/:id/items/:itemId
 */
router.delete('/:id/items/:itemId', authMiddleware, async (req, res) => {
    try {
        const { id, itemId } = req.params;

        const countCheck = await query(`
            SELECT COUNT(*) as item_count FROM orders.order_items WHERE order_id = $1
        `, [id]);
        const currentItemCount = parseInt(countCheck.rows[0].item_count);

        if (currentItemCount <= 1) {
            return res.status(400).json({
                success: false,
                message: 'لا يمكن حذف آخر منتج في الطلب.'
            });
        }

        const deleteResult = await query(`
            DELETE FROM orders.order_items 
            WHERE id = $1 AND order_id = $2
            RETURNING *
        `, [itemId, id]);

        if (deleteResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'المنتج غير موجود في هذا الطلب'
            });
        }

        await updateOrderTotals(id);

        res.json({
            success: true,
            message: 'تم حذف المنتج بنجاح'
        });

    } catch (error) {
        console.error('Error deleting order item:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في حذف المنتج',
            error: error.message
        });
    }
});

async function updateOrderTotals(orderId) {
    const result = await query(`
        SELECT COALESCE(SUM(total_price), 0) as subtotal
        FROM orders.order_items
        WHERE order_id = $1
    `, [orderId]);

    const subtotal = parseFloat(result.rows[0].subtotal) || 0;

    await query(`
        UPDATE orders.orders
        SET 
            subtotal = $1::core.price,
            total_amount = $1::core.price + shipping_cost,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
    `, [subtotal, orderId]);
}

module.exports = router;
