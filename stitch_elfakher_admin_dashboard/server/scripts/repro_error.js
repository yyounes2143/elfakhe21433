const { pool } = require('../config/database');

async function repro() {
    try {
        // Force the specific error
        const res = await pool.query(`
            SELECT array_length('[]'::jsonb, 1)
        `);
        console.log('Success? (Should not indicate success)');
    } catch (e) {
        console.error('Expected Error:', e.message);
    } finally {
        pool.end();
    }
}

repro();
