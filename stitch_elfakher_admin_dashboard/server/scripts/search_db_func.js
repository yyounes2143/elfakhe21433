const { pool } = require('../config/database');

async function searchFunc() {
    try {
        const res = await pool.query(`
            SELECT proname, prosrc 
            FROM pg_proc 
            JOIN pg_namespace n ON pg_proc.pronamespace = n.oid
            WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
            AND prosrc ILIKE '%array_length%' 
        `);
        console.log('Functions using array_length:', res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

searchFunc();
