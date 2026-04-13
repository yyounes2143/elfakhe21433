const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { query } = require('../config/database');

async function checkData() {
    try {
        console.log('--- Wilayas Sample ---');
        const wilayas = await query('SELECT * FROM shipping.wilayas LIMIT 5');
        console.table(wilayas.rows);

        console.log('\n--- Recent Orders Sample ---');
        const orders = await query('SELECT id, order_number, shipping_address, wilaya_id FROM orders.orders ORDER BY created_at DESC LIMIT 5');
        console.table(orders.rows);

        console.log('\n--- Specific Order Check (if any) ---');
        if (orders.rows.length > 0) {
            const orderId = orders.rows[0].id; // Check the most recent one
            const order = await query(`
                SELECT 
                    o.shipping_address,
                    o.wilaya_id,
                    w.name_ar as wilaya_name,
                    w.code as wilaya_code
                FROM orders.orders o
                LEFT JOIN shipping.wilayas w ON o.wilaya_id = w.id
                WHERE o.id = $1
            `, [orderId]);
            console.log('Order Details:', order.rows[0]);
            if (order.rows[0].shipping_address) {
                console.log('Shipping Address Type:', typeof order.rows[0].shipping_address);
                console.log('Shipping Address Value:', order.rows[0].shipping_address);
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkData();
