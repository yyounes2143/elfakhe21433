const { pool } = require('../config/database');

async function inspect() {
    try {
        const triggersRes = await pool.query(`
            SELECT tgname, pg_get_triggerdef(oid) as definition
            FROM pg_trigger 
            WHERE tgrelid = 'catalog.products'::regclass
            AND tgisinternal = false
        `);
        console.log('Triggers:', triggersRes.rows);
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

inspect();
