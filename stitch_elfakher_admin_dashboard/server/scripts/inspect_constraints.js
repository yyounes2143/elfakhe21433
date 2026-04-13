const { pool } = require('../config/database');

async function inspectConstraints() {
    try {
        const res = await pool.query(`
            SELECT conname, pg_get_constraintdef(oid) as def
            FROM pg_constraint 
            WHERE conrelid = 'catalog.products'::regclass
        `);
        console.log('Constraints:', res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

inspectConstraints();
