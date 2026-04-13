const { pool } = require('../config/database');

async function debugQuery() {
    try {
        const queryText = `
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
                c.name_ar as category_name
            FROM catalog.products p
            LEFT JOIN catalog.categories c ON p.category_id = c.id
            WHERE 1=1
            AND (COALESCE(p.sale_price, p.base_price) >= $1)
            AND (COALESCE(p.sale_price, p.base_price) <= $2)
            ORDER BY p.created_at DESC, p.id DESC LIMIT $3 OFFSET $4
        `;
        const params = [0, 99999999, 12, 0];

        console.log('Running query...');
        const res = await pool.query(queryText, params);
        console.log('Success!', res.rows.length, 'rows');
    } catch (e) {
        console.error('Query Failed:', e.message);
    } finally {
        pool.end();
    }
}

debugQuery();
