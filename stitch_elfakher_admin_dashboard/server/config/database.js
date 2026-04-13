/**
 * ELFAKHER - PostgreSQL Database Configuration
 * تكوين اتصال قاعدة البيانات
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'elfakher_db',
    user: process.env.DB_USER || 'postgres',
    password: String(process.env.DB_PASSWORD || ''),
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// اختبار الاتصال
pool.on('connect', () => {
    console.log('✓ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('✗ PostgreSQL connection error:', err.message);
});

// دالة مساعدة للاستعلامات
const query = async (text, params) => {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Query executed:', { text: text.substring(0, 50), duration: `${duration}ms`, rows: result.rowCount });
        return result;
    } catch (error) {
        console.error('Query error:', error.message);
        throw error;
    }
};

module.exports = {
    pool,
    query
};
