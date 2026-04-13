/**
 * Migration: Add embedded_colors column to products table
 */
const { pool } = require('../config/database');

async function migrate() {
    try {
        await pool.query(`
            ALTER TABLE catalog.products 
            ADD COLUMN IF NOT EXISTS embedded_colors JSONB DEFAULT '[]'::jsonb
        `);
        console.log('✓ Added embedded_colors column to catalog.products');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error.message);
        process.exit(1);
    }
}

migrate();
