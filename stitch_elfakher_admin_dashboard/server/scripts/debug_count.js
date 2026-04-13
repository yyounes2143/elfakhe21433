const { pool } = require('../config/database');

async function debugCount() {
    try {
        const countQuery = `
            SELECT COUNT(*) 
            FROM catalog.products p 
            LEFT JOIN catalog.categories c ON p.category_id = c.id 
            WHERE 1=1
            AND (COALESCE(p.sale_price, p.base_price) >= $1)
            AND (COALESCE(p.sale_price, p.base_price) <= $2)
        `;
        const countParams = [0, 99999999];

        console.log('Running count query...');
        const res = await pool.query(countQuery, countParams);
        console.log('Success Count!', res.rows[0].count);
    } catch (e) {
        console.error('Count Query Failed:', e.message);
    } finally {
        pool.end();
    }
}

debugCount();
