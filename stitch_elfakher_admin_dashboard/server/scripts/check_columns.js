const { pool } = require('../config/database');

async function checkColumns() {
    try {
        const res = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'catalog' AND table_name = 'products'
        `);
        console.log('Columns in catalog.products:', res.rows.map(r => r.column_name).join(', '));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkColumns();
